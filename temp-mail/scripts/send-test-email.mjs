#!/usr/bin/env node
/**
 * 로컬 개발용 테스트 메일 주입 스크립트.
 *
 * 실제 SMTP 를 거치지 않고 원본 메일(.eml)을 워커의 /api/dev/ingest 로 밀어 넣어,
 * 파싱·살균·저장·표시까지의 경로를 그대로 확인한다.
 * (ALLOW_DEV_INGEST=1 인 개발 환경에서만 동작한다.)
 *
 * 사용:
 *   node scripts/send-test-email.mjs --to me@example.com
 *   node scripts/send-test-email.mjs --to me@example.com --subject "확인 코드" --xss
 *   node scripts/send-test-email.mjs --to me@example.com --file ./sample.eml
 */

import { readFile } from "node:fs/promises";

const args = parseArgs(process.argv.slice(2));

if (!args.to) {
  console.error("사용법: node scripts/send-test-email.mjs --to <주소> [--subject ...] [--file x.eml] [--xss]");
  process.exit(1);
}

const base = args.base ?? "http://localhost:8787";
const raw = args.file ? await readFile(args.file) : Buffer.from(buildSampleEmail(args), "utf8");

const response = await fetch(`${base}/api/dev/ingest?to=${encodeURIComponent(args.to)}`, {
  method: "POST",
  headers: {
    "content-type": "message/rfc822",
    // Cloudflare 가 실제로 붙여 주는 헤더를 흉내 내 배지 표시까지 확인한다.
    "x-authentication-results": "mx.example.com; spf=pass; dkim=pass; dmarc=pass",
  },
  body: raw,
});

const text = await response.text();
if (!response.ok) {
  console.error(`실패 (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`전송됨 → ${args.to}`);
console.log(text);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function buildSampleEmail({ to, from, subject, xss }) {
  const sender = from ?? "알림 <noreply@service.example>";
  const title = subject ?? "가입 확인 코드: 481-902";
  const mixed = "----=_temp_mail_mixed";
  const alternative = "----=_temp_mail_alternative";
  const related = "----=_temp_mail_related";

  // 1x1 투명 PNG. 인라인(cid:) 이미지 경로를 확인하는 용도.
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // --xss 를 주면 살균기가 실제로 걷어내는지 눈으로 확인할 수 있는 조각을 섞는다.
  const hostile = xss
    ? `
      <script>alert('xss')</script>
      <img src="x" onerror="alert('xss')" alt="onerror 시도">
      <a href="javascript:alert('xss')">javascript: 링크</a>
      <iframe src="https://evil.example"></iframe>
      <div style="background:url(javascript:alert('xss'))">style 안의 javascript:</div>`
    : "";

  const html = `<html><body style="font-family:sans-serif">
  <h1>확인 코드</h1>
  <p>아래 코드를 입력해 가입을 마치세요.</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:3px">481-902</p>
  <p><a href="https://example.com/verify?token=abc123">가입 완료하기</a></p>
  <p>인라인 이미지: <img src="cid:logo123" alt="로고" width="8" height="8"></p>
  <p>원격 이미지(차단 대상): <img src="https://tracker.example/pixel.gif" alt="추적 픽셀" width="8" height="8"></p>
  ${hostile}
  </body></html>`;

  const text = `확인 코드: 481-902\n\n가입 완료: https://example.com/verify?token=abc123\n`;

  // 실제 메일 클라이언트가 쓰는 구조 그대로:
  //   mixed → [ alternative → [ text/plain, related → [ text/html, 인라인 이미지 ] ], 첨부 ]
  return [
    `From: ${sender}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(title)}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@service.example>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alternative}"`,
    "",
    `--${alternative}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf8").toString("base64"),
    "",
    `--${alternative}`,
    `Content-Type: multipart/related; boundary="${related}"`,
    "",
    `--${related}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    "",
    `--${related}`,
    "Content-Type: image/png",
    "Content-Transfer-Encoding: base64",
    "Content-ID: <logo123>",
    'Content-Disposition: inline; filename="logo.png"',
    "",
    pngBase64,
    "",
    `--${related}--`,
    "",
    `--${alternative}--`,
    "",
    `--${mixed}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    'Content-Disposition: attachment; filename="영수증.txt"',
    "",
    Buffer.from("주문 번호: 20260808-0042\n금액: 12,000원\n", "utf8").toString("base64"),
    "",
    `--${mixed}--`,
    "",
  ].join("\r\n");
}

/** 비ASCII 제목은 RFC 2047 로 감싼다. */
function encodeHeader(value) {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7f]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}
