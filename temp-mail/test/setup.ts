import { env } from "cloudflare:test";
import { beforeEach } from "vitest";

import schemaSql from "../schema.sql?raw";
import type { Env } from "../src/types";

const workerEnv = env as unknown as Env;

/**
 * D1 의 exec() 는 한 줄에 한 문장을 기대하므로, schema.sql 을 주석 제거 후
 * 문장 단위로 잘라 실행한다. 스키마 파일 하나만 관리하면 된다.
 */
function statementsFrom(sql: string): string[] {
  return sql
    // 줄 끝 주석까지 걷어내야 한 줄로 눌렀을 때 뒤 내용이 주석에 먹히지 않는다.
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((statement) => statement.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

beforeEach(async () => {
  for (const statement of statementsFrom(schemaSql)) {
    await workerEnv.DB.prepare(statement).run();
  }
});
