import { describe, expect, it } from "vitest";

import { isSafeUrl, makePreview, sanitizeHtml } from "../src/sanitize";

describe("sanitizeHtml", () => {
  it("스크립트 태그와 그 내용을 통째로 지운다", async () => {
    const out = await sanitizeHtml(`<p>안녕</p><script>alert('xss')</script>`);
    expect(out).toContain("안녕");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("<script");
  });

  it("이벤트 핸들러 속성을 제거한다", async () => {
    const out = await sanitizeHtml(`<img src="https://a.example/x.png" onerror="alert(1)">`);
    expect(out).not.toContain("onerror");
  });

  it("javascript: 링크는 href 를 떼어 낸다", async () => {
    const out = await sanitizeHtml(`<a href="javascript:alert(1)">클릭</a>`);
    expect(out).not.toContain("javascript:");
    expect(out).toContain("클릭");
  });

  it("제어문자로 스킴을 숨긴 링크도 막는다", async () => {
    const out = await sanitizeHtml(`<a href="java\tscript:alert(1)">클릭</a>`);
    expect(out).not.toMatch(/href=/);
  });

  it("링크에 target 과 rel 을 강제한다", async () => {
    const out = await sanitizeHtml(`<a href="https://example.com">가기</a>`);
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it("원격 이미지는 지우지 않고 data-blocked-src 로 미뤄 둔다", async () => {
    const out = await sanitizeHtml(`<img src="https://tracker.example/p.gif" alt="픽셀">`);
    expect(out).toContain('data-blocked-src="https://tracker.example/p.gif"');
    expect(out).not.toMatch(/\ssrc="https:/);
    expect(out).toContain('alt="픽셀"');
  });

  it("cid: 이미지는 첨부 다운로드 URL 로 바꾼다", async () => {
    const cidMap = new Map([["logo123", "/api/messages/m1/attachments/a1"]]);
    const out = await sanitizeHtml(`<img src="cid:logo123">`, { cidMap });
    expect(out).toContain('src="/api/messages/m1/attachments/a1"');
  });

  it("매핑되지 않은 cid 는 src 를 버린다", async () => {
    const out = await sanitizeHtml(`<img src="cid:nope">`);
    expect(out).not.toContain("cid:nope");
  });

  it("iframe, object, form 을 제거한다", async () => {
    const out = await sanitizeHtml(
      `<iframe src="https://evil.example"></iframe><object data="x"></object><form action="/x"><input name="pw"></form>`,
    );
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<object");
    expect(out).not.toContain("<form");
    expect(out).not.toContain("<input");
  });

  it("style 속성 안의 javascript: 와 expression() 을 걷어낸다", async () => {
    const out = await sanitizeHtml(
      `<div style="width:expression(alert(1));background:url(javascript:alert(1))">본문</div>`,
    );
    expect(out).not.toContain("expression(");
    expect(out).not.toContain("javascript:");
    expect(out).toContain("본문");
  });

  it("서식용 태그와 표 구조는 남긴다", async () => {
    const out = await sanitizeHtml(
      `<table><tr><td style="color:red"><strong>합계</strong></td><td>1,200원</td></tr></table>`,
    );
    expect(out).toContain("<table");
    expect(out).toContain("<strong>합계</strong>");
    expect(out).toContain('style="color:red"');
  });

  it("허용 목록에 없는 태그는 내용만 남기고 벗긴다", async () => {
    const out = await sanitizeHtml(`<marquee>지나가는 글</marquee>`);
    expect(out).not.toContain("<marquee");
    expect(out).toContain("지나가는 글");
  });

  it("html/body 껍데기를 벗긴다", async () => {
    const out = await sanitizeHtml(`<html><body><p>본문</p></body></html>`);
    expect(out.trim()).toBe("<p>본문</p>");
  });
});

describe("isSafeUrl", () => {
  it("http, https, mailto, tel 만 통과시킨다", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("mailto:a@b.com")).toBe(true);
    expect(isSafeUrl("tel:+8210")).toBe(true);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeUrl("/relative/path")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("makePreview", () => {
  it("공백을 접고 길이를 자른다", () => {
    expect(makePreview("  여러\n\n줄   텍스트 ")).toBe("여러 줄 텍스트");
    expect(makePreview("가".repeat(300))).toHaveLength(201);
    expect(makePreview(null)).toBe("");
  });
});
