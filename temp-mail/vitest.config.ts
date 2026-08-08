import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2025-09-01",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        bindings: {
          MAIL_DOMAINS: "example.com,test.local",
          INBOX_TTL_MINUTES: "60",
          // 오래된 메일을 잘라 내는 동작을 짧은 테스트에서도 확인할 수 있게 낮춰 둔다.
          MAX_MESSAGES_PER_INBOX: "3",
          MAX_ATTACHMENT_BYTES: "512000",
          ALLOW_DEV_INGEST: "1",
        },
      },
    }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
    // 테스트 파일들이 같은 D1 인스턴스를 공유하므로 순차로 돌린다.
    fileParallelism: false,
  },
});
