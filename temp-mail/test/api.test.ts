import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { handleApi } from "../src/api";
import { purgeExpired } from "../src/inbox";
import type { Env } from "../src/types";

const workerEnv = env as unknown as Env;
const BASE = "https://mail.test";

type CallInit = RequestInit & { token?: string; ip?: string };

function request(path: string, init: CallInit = {}): Request {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  // 주소 생성에는 IP 기준 제한이 걸려 있다. 테스트끼리 서로의 할당량을
  // 갉아먹지 않도록 기본적으로 매번 다른 클라이언트인 척한다.
  headers.set("cf-connecting-ip", init.ip ?? crypto.randomUUID());
  return new Request(`${BASE}${path}`, { ...init, headers });
}

async function call(path: string, init: CallInit = {}) {
  const response = await handleApi(request(path, init), workerEnv);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : {}, response };
}

async function createInbox(localPart?: string) {
  const { status, body } = await call("/api/inboxes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(localPart ? { localPart } : {}),
  });
  expect(status).toBe(201);
  return body as { address: string; token: string; expiresAt: number };
}

function buildEmail(options: { to: string; subject?: string; html?: string; text?: string }): string {
  const boundary = "----=_test";
  return [
    "From: 보내는사람 <sender@service.example>",
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(options.subject ?? "테스트 메일")))}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "",
    options.text ?? "본문 텍스트입니다.",
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "",
    options.html ?? "<p>본문 <b>HTML</b></p>",
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function deliver(to: string, eml: string) {
  return await call(`/api/dev/ingest?to=${encodeURIComponent(to)}`, {
    method: "POST",
    headers: { "x-authentication-results": "mx; spf=pass; dkim=pass; dmarc=fail" },
    body: eml,
  });
}

describe("POST /api/inboxes", () => {
  it("주소와 토큰을 발급한다", async () => {
    const inbox = await createInbox();
    expect(inbox.address).toMatch(/^[a-z]+\.[a-z]+\d{3}@example\.com$/);
    expect(inbox.token).toHaveLength(43);
    expect(inbox.expiresAt).toBeGreaterThan(Date.now());
  });

  it("직접 고른 주소를 쓸 수 있다", async () => {
    const inbox = await createInbox("my-signup");
    expect(inbox.address).toBe("my-signup@example.com");
  });

  it("이미 쓰는 주소는 409 로 거절한다", async () => {
    await createInbox("taken");
    const { status, body } = await call("/api/inboxes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localPart: "taken" }),
    });
    expect(status).toBe(409);
    expect(body.error.code).toBe("address_taken");
  });

  it("형식에 맞지 않는 주소를 거절한다", async () => {
    for (const localPart of ["-bad", "bad-", "has space", "a", "왜한글"]) {
      const { status } = await call("/api/inboxes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ localPart }),
      });
      expect(status, localPart).toBe(400);
    }
  });

  it("한 클라이언트가 주소를 몰아서 만들면 제한한다", async () => {
    const ip = "203.0.113.77";
    const statuses: number[] = [];

    for (let i = 0; i < 12; i++) {
      const { status } = await call("/api/inboxes", {
        method: "POST",
        ip,
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      statuses.push(status);
    }

    expect(statuses.filter((s) => s === 201)).toHaveLength(10);
    expect(statuses.at(-1)).toBe(429);
  });

  it("설정에 없는 도메인을 거절한다", async () => {
    const { status, body } = await call("/api/inboxes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: "evil.example" }),
    });
    expect(status).toBe(400);
    expect(body.error.code).toBe("unsupported_domain");
  });
});

describe("인증", () => {
  it("토큰이 없으면 메일 목록을 볼 수 없다", async () => {
    const inbox = await createInbox();
    const { status } = await call(`/api/inboxes/${inbox.address}/messages`);
    expect(status).toBe(401);
  });

  it("다른 주소함의 토큰으로는 읽을 수 없다", async () => {
    const mine = await createInbox();
    const other = await createInbox();
    const { status } = await call(`/api/inboxes/${mine.address}/messages`, { token: other.token });
    expect(status).toBe(401);
  });

  it("만료된 주소함은 없는 것으로 취급한다", async () => {
    const inbox = await createInbox();
    await workerEnv.DB.prepare(`UPDATE inboxes SET expires_at = ? WHERE address = ?`)
      .bind(Date.now() - 1000, inbox.address)
      .run();

    const { status } = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(status).toBe(401);
  });
});

describe("메일 수신", () => {
  it("발급된 주소로 온 메일을 저장하고 목록에 올린다", async () => {
    const inbox = await createInbox();
    const delivered = await deliver(inbox.address, buildEmail({ to: inbox.address }));
    expect(delivered.status).toBe(201);

    const { body } = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].subject).toBe("테스트 메일");
    expect(body.messages[0].from.address).toBe("sender@service.example");
    expect(body.messages[0].isRead).toBe(false);
    expect(body.messages[0].preview).toContain("본문 텍스트");
  });

  it("없는 주소로 온 메일은 저장하지 않는다", async () => {
    const { status, body } = await deliver(
      "nobody@example.com",
      buildEmail({ to: "nobody@example.com" }),
    );
    expect(status).toBe(404);
    expect(body.error.code).toBe("no_such_inbox");
  });

  it("플러스 태그가 붙은 주소도 원래 주소함으로 넣는다", async () => {
    const inbox = await createInbox("shop");
    const tagged = "shop+newsletter@example.com";
    expect((await deliver(tagged, buildEmail({ to: tagged }))).status).toBe(201);

    const { body } = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].to).toBe(tagged);
  });

  it("본문 HTML 은 저장 시점에 이미 살균되어 있다", async () => {
    const inbox = await createInbox();
    await deliver(
      inbox.address,
      buildEmail({
        to: inbox.address,
        html: `<p>안내</p><script>alert(1)</script><img src="https://tracker.example/p.gif">`,
      }),
    );

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    const { body } = await call(`/api/messages/${list.body.messages[0].id}`, { token: inbox.token });

    expect(body.html).not.toContain("<script");
    expect(body.html).toContain("data-blocked-src");
    expect(body.auth).toEqual({ spf: "pass", dkim: "pass", dmarc: "fail" });
  });

  it("메일을 열면 읽음으로 표시된다", async () => {
    const inbox = await createInbox();
    await deliver(inbox.address, buildEmail({ to: inbox.address }));

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    await call(`/api/messages/${list.body.messages[0].id}`, { token: inbox.token });

    const after = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(after.body.messages[0].isRead).toBe(true);
  });

  it("보관 개수를 넘기면 오래된 메일부터 지운다", async () => {
    const inbox = await createInbox(); // 테스트 설정의 상한은 3통
    for (let i = 0; i < 5; i++) {
      await deliver(inbox.address, buildEmail({ to: inbox.address, subject: `메일 ${i}` }));
    }

    const { body } = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(body.messages).toHaveLength(3);
    expect(body.messages.map((m: { subject: string }) => m.subject)).toEqual([
      "메일 4",
      "메일 3",
      "메일 2",
    ]);
  });
});

describe("첨부파일", () => {
  const withAttachment = (to: string) =>
    [
      "From: sender@service.example",
      `To: ${to}`,
      "Subject: 첨부 테스트",
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="b1"',
      "",
      "--b1",
      'Content-Type: text/plain; charset="utf-8"',
      "",
      "첨부를 확인하세요.",
      "",
      "--b1",
      "Content-Type: text/csv",
      'Content-Disposition: attachment; filename="data.csv"',
      "",
      "a,b\n1,2",
      "",
      "--b1--",
      "",
    ].join("\r\n");

  it("첨부를 저장하고 내려받을 수 있다", async () => {
    const inbox = await createInbox();
    await deliver(inbox.address, withAttachment(inbox.address));

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(list.body.messages[0].attachmentCount).toBe(1);

    const detail = await call(`/api/messages/${list.body.messages[0].id}`, { token: inbox.token });
    const attachment = detail.body.attachments[0];
    expect(attachment.filename).toBe("data.csv");
    expect(attachment.downloadable).toBe(true);

    const download = await handleApi(request(`${attachment.url}?download=1`), workerEnv);
    expect(download.status).toBe(200);
    expect(download.headers.get("content-type")).toBe("application/octet-stream");
    expect(download.headers.get("x-content-type-options")).toBe("nosniff");
    expect(download.headers.get("content-disposition")).toContain("attachment");
    // 바이트가 그대로 나오는지 본다 — D1 의 BLOB 표현이 새어 나오면 여기서 걸린다.
    expect(new TextDecoder().decode(await download.arrayBuffer())).toContain("a,b");
  });

  it("본문에 박힌 인라인 이미지는 첨부 목록에서 감춘다", async () => {
    const inbox = await createInbox();
    const eml = [
      "From: sender@service.example",
      `To: ${inbox.address}`,
      "Subject: 인라인 이미지",
      "MIME-Version: 1.0",
      'Content-Type: multipart/related; boundary="r1"',
      "",
      "--r1",
      'Content-Type: text/html; charset="utf-8"',
      "",
      '<p>로고: <img src="cid:logo9"></p>',
      "",
      "--r1",
      "Content-Type: image/png",
      "Content-Transfer-Encoding: base64",
      "Content-ID: <logo9>",
      'Content-Disposition: inline; filename="logo.png"',
      "",
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "",
      "--r1--",
      "",
    ].join("\r\n");

    await deliver(inbox.address, eml);

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(list.body.messages[0].attachmentCount).toBe(0);

    const detail = await call(`/api/messages/${list.body.messages[0].id}`, { token: inbox.token });
    expect(detail.body.attachments).toHaveLength(0);

    // 목록에는 없어도 본문의 cid: 는 실제 다운로드 URL 로 바뀌어 있어야 한다.
    const src = /src="(\/api\/messages\/[^"]+)"/.exec(detail.body.html);
    expect(src).not.toBeNull();

    const image = await handleApi(request(src![1]!), workerEnv);
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
  });

  it("다른 메일 id 로는 첨부를 가져올 수 없다", async () => {
    const inbox = await createInbox();
    await deliver(inbox.address, withAttachment(inbox.address));

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    const detail = await call(`/api/messages/${list.body.messages[0].id}`, { token: inbox.token });
    const attachmentId = detail.body.attachments[0].id;

    const { status } = await call(
      `/api/messages/${crypto.randomUUID()}/attachments/${attachmentId}`,
    );
    expect(status).toBe(404);
  });
});

describe("주소함 관리", () => {
  it("연장하면 만료 시각이 미뤄진다", async () => {
    const inbox = await createInbox();
    await workerEnv.DB.prepare(`UPDATE inboxes SET expires_at = ? WHERE address = ?`)
      .bind(Date.now() + 60_000, inbox.address)
      .run();

    const { status, body } = await call(`/api/inboxes/${inbox.address}/extend`, {
      method: "POST",
      token: inbox.token,
    });
    expect(status).toBe(200);
    expect(body.expiresAt).toBeGreaterThan(Date.now() + 3_000_000);
  });

  it("주소함을 지우면 메일과 첨부까지 함께 사라진다", async () => {
    const inbox = await createInbox();
    await deliver(inbox.address, buildEmail({ to: inbox.address }));

    const { status } = await call(`/api/inboxes/${inbox.address}`, {
      method: "DELETE",
      token: inbox.token,
    });
    expect(status).toBe(200);

    const messages = await workerEnv.DB.prepare(`SELECT COUNT(*) AS n FROM messages`).first<{
      n: number;
    }>();
    expect(messages?.n).toBe(0);
  });

  it("메일 한 통만 지울 수 있다", async () => {
    const inbox = await createInbox();
    await deliver(inbox.address, buildEmail({ to: inbox.address, subject: "첫 번째" }));
    await deliver(inbox.address, buildEmail({ to: inbox.address, subject: "두 번째" }));

    const list = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    await call(`/api/messages/${list.body.messages[0].id}`, {
      method: "DELETE",
      token: inbox.token,
    });

    const after = await call(`/api/inboxes/${inbox.address}/messages`, { token: inbox.token });
    expect(after.body.messages).toHaveLength(1);
    expect(after.body.messages[0].subject).toBe("첫 번째");
  });
});

describe("만료 정리", () => {
  it("만료된 주소함과 그 메일을 지운다", async () => {
    const live = await createInbox();
    const dead = await createInbox();
    await deliver(dead.address, buildEmail({ to: dead.address }));
    await deliver(live.address, buildEmail({ to: live.address }));

    await workerEnv.DB.prepare(`UPDATE inboxes SET expires_at = ? WHERE address = ?`)
      .bind(Date.now() - 1, dead.address)
      .run();

    expect(await purgeExpired(workerEnv)).toBe(1);

    const inboxes = await workerEnv.DB.prepare(`SELECT COUNT(*) AS n FROM inboxes`).first<{ n: number }>();
    const messages = await workerEnv.DB.prepare(`SELECT COUNT(*) AS n FROM messages`).first<{ n: number }>();
    expect(inboxes?.n).toBe(1);
    expect(messages?.n).toBe(1);
  });
});

describe("GET /api/config", () => {
  it("설정된 도메인 목록을 알려준다", async () => {
    const { status, body } = await call("/api/config");
    expect(status).toBe(200);
    expect(body.domains).toEqual(["example.com", "test.local"]);
    expect(body.ttlMinutes).toBe(60);
  });
});
