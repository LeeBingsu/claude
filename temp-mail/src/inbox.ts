import type { Config, Env, InboxRow } from "./types";

/**
 * 주소는 "형용사-명사-숫자" 꼴로 만든다. 완전 무작위 문자열보다 회원가입 폼에
 * 손으로 옮겨 적기 쉽고, 읽기 권한은 어차피 토큰으로 막기 때문에 주소 자체의
 * 추측 난이도에 기대지 않는다.
 */
const ADJECTIVES = [
  "amber", "brave", "brisk", "calm", "clever", "cosmic", "crisp", "dawn",
  "deep", "eager", "early", "fair", "fleet", "fresh", "gentle", "glad",
  "golden", "green", "happy", "ivory", "jolly", "keen", "kind", "lucid",
  "lunar", "mellow", "merry", "mild", "misty", "neat", "noble", "polar",
  "proud", "quick", "quiet", "rapid", "royal", "sharp", "silent", "silver",
  "sleek", "smooth", "snowy", "solar", "spry", "still", "sunny", "swift",
  "tidy", "true", "vivid", "warm", "wise", "witty", "young", "zesty",
];

const NOUNS = [
  "acorn", "anchor", "arrow", "aspen", "badger", "beacon", "birch", "bison",
  "brook", "cedar", "cliff", "comet", "coral", "cove", "crane", "delta",
  "dune", "ember", "falcon", "fern", "fjord", "forest", "grove", "harbor",
  "heron", "island", "jasper", "lagoon", "lark", "maple", "meadow", "mesa",
  "moss", "otter", "peak", "pebble", "pine", "quartz", "quill", "raven",
  "reef", "ridge", "river", "sable", "shore", "slate", "sparrow", "stone",
  "summit", "thorn", "tundra", "valley", "willow", "wren",
];

/** 2~32자, 영숫자로 시작하고 끝나며 사이에만 . _ - 를 허용한다. */
const LOCAL_PART_RE = /^[a-z0-9][a-z0-9._-]{0,30}[a-z0-9]$/;

function pick<T>(list: readonly T[]): T {
  const index = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32) * list.length);
  return list[index]!;
}

function randomLocalPart(): string {
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0]! % 1000;
  return `${pick(ADJECTIVES)}.${pick(NOUNS)}${String(suffix).padStart(3, "0")}`;
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * `foo+tag@example.com` 처럼 플러스 태그가 붙어 들어온 메일도 원래 주소함으로
 * 넣어주기 위해, 조회에 쓸 정규 주소를 따로 만든다.
 */
export function canonicalizeAddress(address: string): string {
  const normalized = normalizeAddress(address);
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return normalized;

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const plus = local.indexOf("+");
  return plus > 0 ? `${local.slice(0, plus)}@${domain}` : normalized;
}

export function isValidLocalPart(localPart: string): boolean {
  return LOCAL_PART_RE.test(localPart);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** 타이밍 공격을 피하기 위해 토큰 해시는 길이 무관 상수시간 비교로 확인한다. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface CreatedInbox {
  id: string;
  address: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

export class InboxTakenError extends Error {
  constructor(address: string) {
    super(`address already in use: ${address}`);
    this.name = "InboxTakenError";
  }
}

export async function createInbox(
  env: Env,
  config: Config,
  options: { localPart?: string; domain?: string } = {},
): Promise<CreatedInbox> {
  const domain = normalizeAddress(options.domain ?? config.domains[0]!);
  if (!config.domains.includes(domain)) {
    throw new Error(`unsupported domain: ${domain}`);
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + config.inboxTtlMs;

  // 사용자가 직접 고른 주소는 한 번만 시도하고, 자동 생성은 충돌 시 몇 번 더 굴린다.
  const explicit = options.localPart !== undefined;
  const attempts = explicit ? 1 : 8;

  for (let i = 0; i < attempts; i++) {
    const localPart = explicit ? normalizeAddress(options.localPart!) : randomLocalPart();
    if (!isValidLocalPart(localPart)) {
      throw new Error(`invalid local part: ${localPart}`);
    }

    const address = `${localPart}@${domain}`;
    const id = crypto.randomUUID();

    // 만료된 동명 주소가 남아 있으면 먼저 치워야 UNIQUE 제약에 걸리지 않는다.
    await deleteInboxIfExpired(env, address, now);

    try {
      await env.DB.prepare(
        `INSERT INTO inboxes (id, address, token_hash, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
        .bind(id, address, tokenHash, now, expiresAt)
        .run();

      return { id, address, token, createdAt: now, expiresAt };
    } catch (error) {
      if (isUniqueViolation(error) && !explicit) continue;
      if (isUniqueViolation(error)) throw new InboxTakenError(address);
      throw error;
    }
  }

  throw new Error("could not allocate a free address");
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

async function deleteInboxIfExpired(env: Env, address: string, now: number): Promise<void> {
  await env.DB.prepare(`DELETE FROM inboxes WHERE address = ? AND expires_at <= ?`)
    .bind(address, now)
    .run();
}

/** 만료되지 않은 주소함만 돌려준다. 만료된 것은 없는 것과 같이 취급한다. */
export async function findLiveInbox(env: Env, address: string): Promise<InboxRow | null> {
  const row = await env.DB.prepare(
    `SELECT * FROM inboxes WHERE address = ? AND expires_at > ?`,
  )
    .bind(canonicalizeAddress(address), Date.now())
    .first<InboxRow>();

  return row ?? null;
}

/**
 * 요청의 Bearer 토큰이 해당 주소함의 것인지 확인한다.
 * 주소는 알아도 토큰이 없으면 메일을 읽을 수 없다.
 */
export async function authorizeInbox(
  env: Env,
  address: string,
  token: string | null,
): Promise<InboxRow | null> {
  if (!token) return null;

  const inbox = await findLiveInbox(env, address);
  if (!inbox) return null;

  const provided = await hashToken(token);
  return timingSafeEqual(provided, inbox.token_hash) ? inbox : null;
}

export async function extendInbox(env: Env, inbox: InboxRow, config: Config): Promise<number> {
  const expiresAt = Date.now() + config.inboxTtlMs;
  await env.DB.prepare(`UPDATE inboxes SET expires_at = ? WHERE id = ?`)
    .bind(expiresAt, inbox.id)
    .run();
  return expiresAt;
}

export async function deleteInbox(env: Env, inbox: InboxRow): Promise<void> {
  await cascadeDeleteInboxes(env, [inbox.id]);
}

/**
 * D1 의 외래키 CASCADE 에 기대지 않고 자식 행부터 직접 지운다.
 * 데이터베이스가 어떤 FK 설정으로 만들어졌든 고아 행이 남지 않는다.
 */
export async function cascadeDeleteInboxes(env: Env, inboxIds: string[]): Promise<void> {
  if (inboxIds.length === 0) return;

  const holes = inboxIds.map(() => "?").join(", ");
  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM attachments WHERE message_id IN
         (SELECT id FROM messages WHERE inbox_id IN (${holes}))`,
    ).bind(...inboxIds),
    env.DB.prepare(`DELETE FROM messages WHERE inbox_id IN (${holes})`).bind(...inboxIds),
    env.DB.prepare(`DELETE FROM inboxes WHERE id IN (${holes})`).bind(...inboxIds),
  ]);
}

/** 만료된 주소함과 그에 딸린 메일/첨부를 정리한다. 지운 개수를 돌려준다. */
export async function purgeExpired(env: Env, limit = 500): Promise<number> {
  const { results } = await env.DB.prepare(
    `SELECT id FROM inboxes WHERE expires_at <= ? LIMIT ?`,
  )
    .bind(Date.now(), limit)
    .all<{ id: string }>();

  const ids = (results ?? []).map((row) => row.id);
  await cascadeDeleteInboxes(env, ids);
  return ids.length;
}
