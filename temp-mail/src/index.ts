import { handleApi } from "./api";
import { ingestMessage } from "./ingest";
import { purgeExpired } from "./inbox";
import type { Env } from "./types";
import { readConfig } from "./types";

/** 이 크기를 넘는 메일은 파싱하지 않고 되돌려 보낸다. */
const MAX_RAW_BYTES = 20 * 1024 * 1024;

/**
 * 앱 문서에 붙는 보안 헤더.
 *
 * `script-src 'self'` 라 메일 본문 안의 인라인 스크립트는 애초에 실행되지 않는다.
 * `style-src` 의 unsafe-inline 은 메일이 인라인 style 과 <style> 에 전적으로
 * 의존하기 때문에 어쩔 수 없이 열어 둔다.
 * 이미지의 원격 로딩 차단은 CSP 가 아니라 살균 단계의 data-blocked-src 로 한다.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: http:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set("permissions-policy", "geolocation=(), microphone=(), camera=(), payment=()");
  headers.set("cross-origin-opener-policy", "same-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return await handleApi(request, env);
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },

  /**
   * Cloudflare Email Routing 이 이 워커로 넘긴 메일을 처리한다.
   *
   * 대시보드에서 도메인의 catch-all 규칙을 이 워커로 보내도록 설정하면,
   * 우리가 발급한 주소로 온 메일만 저장되고 나머지는 거절된다.
   */
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const config = readConfig(env);

    if (message.rawSize > MAX_RAW_BYTES) {
      message.setReject("Message too large for this mailbox");
      return;
    }

    let raw: ArrayBuffer;
    try {
      raw = await new Response(message.raw).arrayBuffer();
    } catch (cause) {
      console.error("failed to read raw message", cause);
      message.setReject("Could not read message");
      return;
    }

    try {
      const result = await ingestMessage(env, config, {
        raw,
        to: message.to,
        authenticationResults: message.headers.get("authentication-results"),
      });

      if (result.status === "no-such-inbox") {
        // 존재하지 않거나 만료된 주소는 조용히 버리지 않고 거절한다.
        // 발신 측이 바운스를 받아야 잘못된 주소라는 사실을 알 수 있다.
        message.setReject("Unknown or expired address");
      }
    } catch (cause) {
      console.error("failed to ingest message", cause);
      // 여기서 거절하면 발신 서버가 재시도한다. 일시적 장애일 때 유리하다.
      message.setReject("Temporary failure while storing message");
    }
  },

  /** 만료된 주소함과 그 메일을 주기적으로 지운다. */
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        let total = 0;
        // 한 번에 다 못 지울 만큼 쌓였을 수 있으니 몇 배치 돌린다.
        for (let i = 0; i < 10; i++) {
          const deleted = await purgeExpired(env);
          total += deleted;
          if (deleted === 0) break;
        }
        if (total > 0) console.log(`purged ${total} expired inboxes`);
      })(),
    );
  },
};
