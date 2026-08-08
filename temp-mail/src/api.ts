import {
  InboxTakenError,
  authorizeInbox,
  canonicalizeAddress,
  createInbox,
  deleteInbox,
  extendInbox,
  hashToken,
  isValidLocalPart,
  normalizeAddress,
  timingSafeEqual,
} from "./inbox";
import { ingestMessage } from "./ingest";
import type { AttachmentRow, Config, Env, InboxRow, MessageRow } from "./types";
import { readConfig } from "./types";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function error(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

/**
 * 아이솔레이트 안에서만 유지되는 토큰 버킷.
 *
 * 여러 아이솔레이트에 걸친 정확한 제한은 아니지만, 한 클라이언트가 주소를
 * 무한정 찍어내는 것을 막기에는 충분하다. 엄밀한 제한이 필요해지면
 * Durable Object 나 Cloudflare Rate Limiting 규칙으로 올리면 된다.
 */
const CREATE_LIMIT = { capacity: 10, refillPerMs: 10 / 60_000 };
const buckets = new Map<string, { tokens: number; updatedAt: number }>();

function takeCreateToken(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: CREATE_LIMIT.capacity, updatedAt: now };

  const refilled = Math.min(
    CREATE_LIMIT.capacity,
    bucket.tokens + (now - bucket.updatedAt) * CREATE_LIMIT.refillPerMs,
  );

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, updatedAt: now });
    return false;
  }

  buckets.set(key, { tokens: refilled - 1, updatedAt: now });

  // 오래 쓰지 않은 항목이 쌓이지 않도록 가끔 청소한다.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.updatedAt > 300_000) buckets.delete(k);
    }
  }

  return true;
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const config = readConfig(env);
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean); // ["api", ...]
  const path = segments.slice(1);
  const method = request.method.toUpperCase();

  try {
    // GET /api/config
    if (path.length === 1 && path[0] === "config" && method === "GET") {
      return json({
        domains: config.domains,
        ttlMinutes: Math.round(config.inboxTtlMs / 60_000),
        maxMessagesPerInbox: config.maxMessagesPerInbox,
      });
    }

    // POST /api/inboxes
    if (path.length === 1 && path[0] === "inboxes" && method === "POST") {
      return await createInboxRoute(request, env, config);
    }

    // /api/inboxes/:address[...]
    if (path[0] === "inboxes" && path.length >= 2) {
      return await inboxRoute(request, env, config, path, url, method);
    }

    // /api/messages/:id[...]
    if (path[0] === "messages" && path.length >= 2) {
      return await messageRoute(request, env, path, url, method);
    }

    // POST /api/dev/ingest — 로컬 개발 전용 원본 메일 주입구
    if (path.length === 2 && path[0] === "dev" && path[1] === "ingest" && method === "POST") {
      if (!config.allowDevIngest) {
        return error(404, "not_found", "개발용 주입 엔드포인트가 꺼져 있습니다.");
      }
      return await devIngestRoute(request, env, config, url);
    }

    return error(404, "not_found", "그런 엔드포인트는 없습니다.");
  } catch (cause) {
    console.error("api error", cause);
    return error(500, "internal_error", "서버에서 요청을 처리하지 못했습니다.");
  }
}

async function createInboxRoute(request: Request, env: Env, config: Config): Promise<Response> {
  const clientKey = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (!takeCreateToken(clientKey)) {
    return error(429, "rate_limited", "주소를 너무 자주 만들고 있습니다. 잠시 후 다시 시도하세요.");
  }

  const body = await readJsonBody(request);
  if (body === null) return error(400, "bad_request", "JSON 본문을 읽을 수 없습니다.");

  const domain = typeof body.domain === "string" ? normalizeAddress(body.domain) : config.domains[0]!;
  if (!config.domains.includes(domain)) {
    return error(400, "unsupported_domain", `지원하지 않는 도메인입니다: ${domain}`);
  }

  let localPart: string | undefined;
  if (typeof body.localPart === "string" && body.localPart.trim() !== "") {
    localPart = normalizeAddress(body.localPart);
    if (!isValidLocalPart(localPart)) {
      return error(
        400,
        "invalid_local_part",
        "주소는 영문 소문자·숫자로 시작하고 끝나야 하며, 사이에 . _ - 만 쓸 수 있습니다 (2~32자).",
      );
    }
  }

  try {
    const inbox = await createInbox(env, config, { localPart, domain });
    return json(inbox, 201);
  } catch (cause) {
    if (cause instanceof InboxTakenError) {
      return error(409, "address_taken", "이미 사용 중인 주소입니다.");
    }
    throw cause;
  }
}

async function inboxRoute(
  request: Request,
  env: Env,
  config: Config,
  path: string[],
  url: URL,
  method: string,
): Promise<Response> {
  const address = decodeURIComponent(path[1]!);
  const inbox = await authorizeInbox(env, address, bearerToken(request));
  if (!inbox) {
    return error(401, "unauthorized", "주소가 없거나 만료되었거나, 토큰이 맞지 않습니다.");
  }

  const rest = path.slice(2);

  // GET /api/inboxes/:address
  if (rest.length === 0 && method === "GET") {
    const counts = await env.DB.prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread
         FROM messages WHERE inbox_id = ?`,
    )
      .bind(inbox.id)
      .first<{ total: number; unread: number | null }>();

    return json({
      id: inbox.id,
      address: inbox.address,
      createdAt: inbox.created_at,
      expiresAt: inbox.expires_at,
      messageCount: counts?.total ?? 0,
      unreadCount: counts?.unread ?? 0,
    });
  }

  // DELETE /api/inboxes/:address
  if (rest.length === 0 && method === "DELETE") {
    await deleteInbox(env, inbox);
    return json({ deleted: true });
  }

  // POST /api/inboxes/:address/extend
  if (rest.length === 1 && rest[0] === "extend" && method === "POST") {
    const expiresAt = await extendInbox(env, inbox, config);
    return json({ address: inbox.address, expiresAt });
  }

  // GET /api/inboxes/:address/messages?since=<epoch ms>
  if (rest.length === 1 && rest[0] === "messages" && method === "GET") {
    return await listMessages(env, inbox, url);
  }

  return error(405, "method_not_allowed", "이 경로에서 지원하지 않는 메서드입니다.");
}

async function listMessages(env: Env, inbox: InboxRow, url: URL): Promise<Response> {
  const sinceParam = Number(url.searchParams.get("since"));
  const since = Number.isFinite(sinceParam) && sinceParam > 0 ? sinceParam : 0;

  const { results } = await env.DB.prepare(
    `SELECT id, from_address, from_name, to_address, subject, preview,
            size, received_at, is_read,
            (SELECT COUNT(*) FROM attachments a
              WHERE a.message_id = m.id AND a.is_inline = 0) AS attachment_count
       FROM messages m
      WHERE inbox_id = ? AND received_at > ?
      ORDER BY received_at DESC
      LIMIT 200`,
  )
    .bind(inbox.id, since)
    .all<{
      id: string;
      from_address: string;
      from_name: string | null;
      to_address: string;
      subject: string | null;
      preview: string | null;
      size: number;
      received_at: number;
      is_read: number;
      attachment_count: number;
    }>();

  return json({
    address: inbox.address,
    expiresAt: inbox.expires_at,
    messages: (results ?? []).map((row) => ({
      id: row.id,
      from: { address: row.from_address, name: row.from_name },
      to: row.to_address,
      subject: row.subject,
      preview: row.preview,
      size: row.size,
      receivedAt: row.received_at,
      isRead: row.is_read === 1,
      attachmentCount: row.attachment_count,
    })),
  });
}

async function messageRoute(
  request: Request,
  env: Env,
  path: string[],
  url: URL,
  method: string,
): Promise<Response> {
  const messageId = path[1]!;
  const rest = path.slice(2);

  // 첨부 다운로드는 iframe 안의 <img> 가 직접 부르기 때문에 헤더를 실을 수 없다.
  // 대신 메시지 id 와 첨부 id 가 모두 UUIDv4 라, URL 자체를 접근 권한으로 본다.
  if (rest.length === 2 && rest[0] === "attachments" && method === "GET") {
    return await downloadAttachment(env, messageId, rest[1]!, url);
  }

  const message = await env.DB.prepare(`SELECT * FROM messages WHERE id = ?`)
    .bind(messageId)
    .first<MessageRow>();

  if (!message) return error(404, "not_found", "메일을 찾을 수 없습니다.");

  const token = bearerToken(request);
  if (!token) return error(401, "unauthorized", "토큰이 필요합니다.");

  const inbox = await env.DB.prepare(`SELECT * FROM inboxes WHERE id = ? AND expires_at > ?`)
    .bind(message.inbox_id, Date.now())
    .first<InboxRow>();

  if (!inbox || !timingSafeEqual(await hashToken(token), inbox.token_hash)) {
    return error(401, "unauthorized", "이 메일을 읽을 권한이 없습니다.");
  }

  // GET /api/messages/:id
  if (rest.length === 0 && method === "GET") {
    const { results } = await env.DB.prepare(
      // 본문에 박힌 인라인 이미지는 첨부 목록에 올리지 않는다.
      `SELECT id, filename, mime_type, size, content IS NOT NULL AS stored
         FROM attachments WHERE message_id = ? AND is_inline = 0`,
    )
      .bind(message.id)
      .all<{ id: string; filename: string; mime_type: string; size: number; stored: number }>();

    // 열어 본 순간 읽음으로 표시한다.
    await env.DB.prepare(`UPDATE messages SET is_read = 1 WHERE id = ?`).bind(message.id).run();

    return json({
      id: message.id,
      messageId: message.message_id,
      from: { address: message.from_address, name: message.from_name },
      to: message.to_address,
      subject: message.subject,
      text: message.text_body,
      html: message.html_body,
      size: message.size,
      receivedAt: message.received_at,
      isRead: true,
      auth: { spf: message.spf, dkim: message.dkim, dmarc: message.dmarc },
      attachments: (results ?? []).map((row) => ({
        id: row.id,
        filename: row.filename,
        mimeType: row.mime_type,
        size: row.size,
        downloadable: row.stored === 1,
        url: `/api/messages/${message.id}/attachments/${row.id}`,
      })),
    });
  }

  // DELETE /api/messages/:id
  if (rest.length === 0 && method === "DELETE") {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM attachments WHERE message_id = ?`).bind(message.id),
      env.DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(message.id),
    ]);
    return json({ deleted: true });
  }

  return error(405, "method_not_allowed", "이 경로에서 지원하지 않는 메서드입니다.");
}

async function downloadAttachment(
  env: Env,
  messageId: string,
  attachmentId: string,
  url: URL,
): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT * FROM attachments WHERE id = ? AND message_id = ?`,
  )
    .bind(attachmentId, messageId)
    .first<AttachmentRow>();

  if (!row) return error(404, "not_found", "첨부파일을 찾을 수 없습니다.");
  if (!row.content) {
    return error(413, "attachment_too_large", "크기 제한을 넘어 본문을 보관하지 않았습니다.");
  }

  // 첨부는 신뢰할 수 없는 파일이다. 브라우저가 우리 오리진에서 이걸
  // HTML/스크립트로 해석하지 않도록 CSP 와 nosniff 를 함께 건다.
  const inline = url.searchParams.get("download") !== "1" && isInlineSafe(row.mime_type);
  const filename = row.filename.replace(/["\\\r\n]/g, "_");
  // D1 은 BLOB 을 바이트 배열로 돌려주므로 그대로 Response 에 넣으면 안 된다.
  const body = Array.isArray(row.content) ? new Uint8Array(row.content) : row.content;

  return new Response(body, {
    headers: {
      "content-type": inline ? row.mime_type : "application/octet-stream",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(row.filename)}; filename="${filename}"`,
      "content-security-policy": "default-src 'none'; sandbox",
      "x-content-type-options": "nosniff",
      "cache-control": "private, max-age=300",
    },
  });
}

/** 인라인으로 그대로 내보내도 되는 타입만 좁게 허용한다. */
function isInlineSafe(mimeType: string): boolean {
  return /^image\/(png|jpeg|gif|webp|avif|bmp|x-icon)$/i.test(mimeType.split(";")[0]!.trim());
}

async function devIngestRoute(
  request: Request,
  env: Env,
  config: Config,
  url: URL,
): Promise<Response> {
  const to = url.searchParams.get("to");
  if (!to) return error(400, "bad_request", "?to=<주소> 가 필요합니다.");

  const raw = await request.arrayBuffer();
  if (raw.byteLength === 0) return error(400, "bad_request", "본문에 원본 메일(.eml)이 필요합니다.");

  const result = await ingestMessage(env, config, {
    raw,
    to,
    authenticationResults: request.headers.get("x-authentication-results"),
  });

  if (result.status === "no-such-inbox") {
    return error(404, "no_such_inbox", `살아 있는 주소함이 없습니다: ${canonicalizeAddress(to)}`);
  }

  return json({ stored: true, messageId: result.messageId }, 201);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-length") === "0") return {};
  try {
    const parsed = await request.json();
    return parsed !== null && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}
