export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;

  MAIL_DOMAINS: string;
  INBOX_TTL_MINUTES: string;
  MAX_MESSAGES_PER_INBOX: string;
  MAX_ATTACHMENT_BYTES: string;
  ALLOW_DEV_INGEST: string;
}

/** wrangler vars 는 전부 문자열로 들어오므로 한 번에 숫자/배열로 정규화한다. */
export interface Config {
  domains: string[];
  inboxTtlMs: number;
  maxMessagesPerInbox: number;
  maxAttachmentBytes: number;
  allowDevIngest: boolean;
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readConfig(env: Env): Config {
  const domains = (env.MAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return {
    domains: domains.length > 0 ? domains : ["example.com"],
    inboxTtlMs: num(env.INBOX_TTL_MINUTES, 60) * 60_000,
    maxMessagesPerInbox: num(env.MAX_MESSAGES_PER_INBOX, 50),
    maxAttachmentBytes: num(env.MAX_ATTACHMENT_BYTES, 512_000),
    allowDevIngest: env.ALLOW_DEV_INGEST === "1",
  };
}

export interface InboxRow {
  id: string;
  address: string;
  token_hash: string;
  created_at: number;
  expires_at: number;
}

export interface MessageRow {
  id: string;
  inbox_id: string;
  message_id: string | null;
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string | null;
  preview: string | null;
  text_body: string | null;
  html_body: string | null;
  size: number;
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  received_at: number;
  is_read: number;
}

export interface AttachmentRow {
  id: string;
  message_id: string;
  filename: string;
  mime_type: string;
  size: number;
  /** D1 은 BLOB 을 바이트 배열로 돌려준다. 넣을 때는 ArrayBuffer 를 쓴다. */
  content: number[] | ArrayBuffer | null;
}
