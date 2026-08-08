-- temp-mail D1 schema
-- 적용: npm run db:init          (로컬)
--       npm run db:init:remote   (Cloudflare)

DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS inboxes;

-- 발급된 임시 주소.
CREATE TABLE inboxes (
  id         TEXT    PRIMARY KEY,          -- uuid
  address    TEXT    NOT NULL UNIQUE,      -- 소문자 정규화된 전체 주소
  token_hash TEXT    NOT NULL,             -- 소유 증명 토큰의 SHA-256 (hex)
  created_at INTEGER NOT NULL,             -- epoch ms
  expires_at INTEGER NOT NULL              -- epoch ms
);

CREATE INDEX idx_inboxes_expires_at ON inboxes (expires_at);

-- 수신된 메일. 본문은 파싱 후 정제된 형태로 저장한다.
CREATE TABLE messages (
  id           TEXT    PRIMARY KEY,        -- uuid
  inbox_id     TEXT    NOT NULL REFERENCES inboxes (id) ON DELETE CASCADE,
  message_id   TEXT,                       -- 원본 Message-ID 헤더
  from_address TEXT    NOT NULL,
  from_name    TEXT,
  to_address   TEXT    NOT NULL,           -- 실제 RCPT TO (에일리어스 추적용)
  subject      TEXT,
  preview      TEXT,                       -- 목록에 보여줄 본문 앞부분
  text_body    TEXT,
  html_body    TEXT,                       -- 저장 시점에 이미 살균된 HTML
  size         INTEGER NOT NULL,           -- 원본 raw 크기(바이트)
  spf          TEXT,
  dkim         TEXT,
  dmarc        TEXT,
  received_at  INTEGER NOT NULL,           -- epoch ms
  is_read      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_messages_inbox_received ON messages (inbox_id, received_at DESC);

-- 첨부파일. content 가 NULL 이면 크기 제한을 넘어 메타데이터만 보관한 것.
-- is_inline 은 본문에 cid: 로 박혀 있는 이미지를 뜻하며, 첨부 목록에서는 감춘다.
CREATE TABLE attachments (
  id         TEXT    PRIMARY KEY,          -- uuid
  message_id TEXT    NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  filename   TEXT    NOT NULL,
  mime_type  TEXT    NOT NULL,
  size       INTEGER NOT NULL,
  is_inline  INTEGER NOT NULL DEFAULT 0,
  content    BLOB
);

CREATE INDEX idx_attachments_message ON attachments (message_id);
