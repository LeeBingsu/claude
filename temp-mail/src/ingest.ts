import PostalMime from "postal-mime";

import { canonicalizeAddress, normalizeAddress } from "./inbox";
import { makePreview, sanitizeHtml } from "./sanitize";
import type { Config, Env, InboxRow } from "./types";

export interface IngestResult {
  status: "stored" | "no-such-inbox";
  messageId?: string;
  inboxId?: string;
}

interface AuthResults {
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
}

/**
 * Cloudflare 가 붙여 주는 `Authentication-Results` 헤더에서 각 검사 결과만 뽑는다.
 * 파싱에 실패하면 조용히 null 로 두고 넘어간다 — 표시용 정보일 뿐이다.
 */
export function parseAuthResults(header: string | null | undefined): AuthResults {
  const read = (method: string): string | null => {
    if (!header) return null;
    const match = new RegExp(`\\b${method}=(\\w+)`, "i").exec(header);
    return match ? match[1]!.toLowerCase() : null;
  };

  return { spf: read("spf"), dkim: read("dkim"), dmarc: read("dmarc") };
}

/**
 * 원본 메일 한 통을 파싱해 저장한다.
 *
 * Email Worker 와 개발용 주입 엔드포인트가 같은 경로를 타도록 분리해 두었다.
 * 받는 주소에 해당하는 살아 있는 주소함이 없으면 아무것도 저장하지 않는다.
 */
export async function ingestMessage(
  env: Env,
  config: Config,
  input: {
    raw: ArrayBuffer;
    to: string;
    authenticationResults?: string | null;
  },
): Promise<IngestResult> {
  const toAddress = normalizeAddress(input.to);
  const inbox = await env.DB.prepare(
    `SELECT * FROM inboxes WHERE address = ? AND expires_at > ?`,
  )
    .bind(canonicalizeAddress(toAddress), Date.now())
    .first<InboxRow>();

  if (!inbox) return { status: "no-such-inbox" };

  const email = await new PostalMime().parse(input.raw);
  const messageId = crypto.randomUUID();

  // 첨부 id 를 먼저 만들어야 본문의 cid: 참조를 다운로드 URL 로 바꿀 수 있다.
  const attachments = (email.attachments ?? []).map((attachment) => {
    const content = toArrayBuffer(attachment.content);
    const contentId = attachment.contentId ? attachment.contentId.replace(/^<|>$/g, "") : null;

    return {
      id: crypto.randomUUID(),
      filename: attachment.filename?.trim() || "untitled",
      mimeType: attachment.mimeType || "application/octet-stream",
      contentId,
      // 본문에 박히는 이미지는 사용자가 "첨부"로 인식하지 않는다. 저장은 하되 목록에서는 뺀다.
      isInline: Boolean(contentId) && (attachment.disposition === "inline" || attachment.related === true),
      size: content?.byteLength ?? 0,
      content,
    };
  });

  const cidMap = new Map<string, string>();
  for (const attachment of attachments) {
    if (attachment.contentId) {
      cidMap.set(attachment.contentId, `/api/messages/${messageId}/attachments/${attachment.id}`);
    }
  }

  const html = email.html ? await sanitizeHtml(email.html, { cidMap }) : null;
  const text = email.text ?? null;
  const auth = parseAuthResults(input.authenticationResults);
  const receivedAt = Date.now();

  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO messages (
         id, inbox_id, message_id, from_address, from_name, to_address,
         subject, preview, text_body, html_body, size, spf, dkim, dmarc,
         received_at, is_read
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ).bind(
      messageId,
      inbox.id,
      email.messageId ?? null,
      normalizeAddress(email.from?.address ?? "unknown@invalid"),
      email.from?.name?.trim() || null,
      toAddress,
      email.subject?.trim() || null,
      makePreview(text ?? stripTags(email.html)),
      text,
      html,
      input.raw.byteLength,
      auth.spf,
      auth.dkim,
      auth.dmarc,
      receivedAt,
    ),
  ];

  for (const attachment of attachments) {
    // 큰 첨부는 본문만 버리고 목록에는 남긴다 — 뭐가 왔는지는 보여야 한다.
    const stored = attachment.size <= config.maxAttachmentBytes ? attachment.content : null;
    statements.push(
      env.DB.prepare(
        `INSERT INTO attachments (id, message_id, filename, mime_type, size, is_inline, content)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        attachment.id,
        messageId,
        attachment.filename,
        attachment.mimeType,
        attachment.size,
        attachment.isInline ? 1 : 0,
        stored,
      ),
    );
  }

  await env.DB.batch(statements);
  await trimInbox(env, config, inbox.id);

  return { status: "stored", messageId, inboxId: inbox.id };
}

/** 주소함당 보관 개수를 넘기면 오래된 메일부터 지운다. */
async function trimInbox(env: Env, config: Config, inboxId: string): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT id FROM messages
      WHERE inbox_id = ?
      ORDER BY received_at DESC
      LIMIT -1 OFFSET ?`,
  )
    .bind(inboxId, config.maxMessagesPerInbox)
    .all<{ id: string }>();

  const stale = (results ?? []).map((row) => row.id);
  if (stale.length === 0) return;

  const holes = stale.map(() => "?").join(", ");
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM attachments WHERE message_id IN (${holes})`).bind(...stale),
    env.DB.prepare(`DELETE FROM messages WHERE id IN (${holes})`).bind(...stale),
  ]);
}

/** postal-mime 은 첨부를 ArrayBuffer·Uint8Array·문자열 중 하나로 준다. 저장용으로 통일한다. */
function toArrayBuffer(
  content: ArrayBuffer | ArrayBufferView | string | undefined | null,
): ArrayBuffer | null {
  if (content === undefined || content === null) return null;

  if (typeof content === "string") {
    return bufferOf(new TextEncoder().encode(content));
  }
  if (ArrayBuffer.isView(content)) {
    return bufferOf(content);
  }
  return content;
}

/** 뷰가 가리키는 구간만 잘라 낸 독립 ArrayBuffer 를 만든다. */
function bufferOf(view: ArrayBufferView): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

/** 본문이 HTML 뿐일 때 미리보기를 만들기 위한 대충 태그 제거. */
function stripTags(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
