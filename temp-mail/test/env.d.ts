/// <reference types="@cloudflare/vitest-pool-workers/types" />

// vite 의 `?raw` 임포트(스키마 파일을 문자열로 읽어 오는 데 쓴다).
declare module "*.sql?raw" {
  const contents: string;
  export default contents;
}
