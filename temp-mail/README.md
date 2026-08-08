# 임시 메일함 (temp-mail)

일회용 메일 주소를 발급하고, 그 주소로 오는 메일을 웹에서 읽는 서비스입니다.
Cloudflare Workers 하나에 전부 들어갑니다 — 메일 수신, API, 정적 페이지, 만료 정리까지.

```
       메일 발신자
            │  SMTP
            ▼
  Cloudflare Email Routing  (도메인의 catch-all 규칙)
            │
            ▼
  ┌──────────────────────────────────┐
  │  Worker                          │
  │   email()      메일 파싱 · 살균 · 저장  │
  │   fetch()      REST API + 웹 UI      │
  │   scheduled()  만료된 주소함 정리      │
  └──────────────┬───────────────────┘
                 ▼
              D1 (SQLite)
```

## 무엇이 되나

- 임의 주소 자동 생성(`amber.cedar204@…`) 또는 원하는 주소 직접 지정
- 주소마다 만료 시각이 있고, 만료되면 주소와 메일이 함께 삭제됨 (버튼으로 연장 가능)
- 5초 간격 자동 새로고침, 새 메일 도착 알림, 안 읽음 표시
- HTML 메일 렌더링, 첨부파일 내려받기, 인라인(cid:) 이미지 표시
- 원격 이미지는 기본 차단 — 사용자가 누를 때만 불러오므로 열람 사실이 새지 않음
- SPF / DKIM / DMARC 검사 결과 배지
- `foo+태그@…` 로 온 메일도 `foo@…` 함으로 들어감
- 다크 모드, 모바일 레이아웃
- 공유 링크로 다른 기기에서 같은 메일함 열기

## 보안에서 신경 쓴 것

| 위협 | 대응 |
| --- | --- |
| 메일 본문의 XSS | 저장 전 `HTMLRewriter` 허용목록 재작성(`src/sanitize.ts`) + `script-src 'self'` CSP + 스크립트를 허용하지 않는 sandbox iframe. 세 겹 모두 독립적으로 실행을 막습니다. |
| 주소만 알고 남의 메일 열람 | 모든 읽기 API가 발급 토큰(Bearer)을 요구. 토큰은 SHA-256 해시로만 저장하고 상수시간 비교. |
| 열람 추적(트래킹 픽셀) | 원격 이미지 `src` 를 `data-blocked-src` 로 옮겨 두고 사용자가 켤 때만 복원. |
| 첨부파일을 통한 공격 | 이미지 몇 종만 인라인 표시하고 나머지는 `application/octet-stream` + `nosniff` + `Content-Security-Policy: sandbox` 로 강제 다운로드. |
| 주소 대량 생성 | IP 기준 토큰 버킷(분당 10개). 더 엄격히 막으려면 Durable Object 나 Cloudflare Rate Limiting 규칙으로 올리세요. |
| 데이터가 계속 쌓임 | 10분마다 도는 cron 이 만료된 주소함과 메일·첨부를 함께 삭제. 주소당 보관 개수 상한도 있음. |

토큰은 URL 프래그먼트(`#주소:토큰`)로만 공유되므로 서버 로그나 리퍼러에 남지 않습니다.

## 로컬에서 실행

```bash
npm install
cp .dev.vars.example .dev.vars   # ALLOW_DEV_INGEST=1 이 들어 있습니다
npm run db:init                  # 로컬 D1 에 스키마 적용
npm run dev                      # http://localhost:8787
```

로컬에는 SMTP 가 없으므로, 원본 메일을 API 로 직접 밀어 넣어 확인합니다.
파싱 → 살균 → 저장 → 표시까지 실제와 같은 경로를 탑니다.

```bash
# 브라우저에서 주소를 하나 만든 뒤, 그 주소로:
npm run send-test -- --to amber.cedar204@example.com

# 살균기가 실제로 걷어내는지 눈으로 보고 싶다면:
npm run send-test -- --to amber.cedar204@example.com --xss

# 손에 있는 .eml 파일을 그대로 넣기:
npm run send-test -- --to amber.cedar204@example.com --file ./sample.eml
```

```bash
npm test        # 38개 테스트 (Workers 런타임에서 실행)
npm run typecheck
```

## 배포

실제로 메일을 받으려면 **본인 소유의 도메인**과 Cloudflare 계정이 필요합니다.

### 1. D1 데이터베이스

```bash
npx wrangler d1 create temp-mail
```

출력된 `database_id` 를 `wrangler.jsonc` 의 `REPLACE_WITH_YOUR_D1_DATABASE_ID` 자리에 넣고:

```bash
npm run db:init:remote
```

### 2. 도메인 설정

`wrangler.jsonc` 의 `MAIL_DOMAINS` 를 본인 도메인으로 바꿉니다. 여러 개면 콤마로 구분합니다.
`ALLOW_DEV_INGEST` 는 반드시 `"0"` 이어야 합니다.

### 3. 배포

```bash
npm run deploy
```

### 4. Email Routing 연결

Cloudflare 대시보드에서 해당 도메인의 **Email → Email Routing** 으로 갑니다.

1. Email Routing 을 활성화합니다. 안내대로 MX 와 SPF 레코드를 추가합니다
   (Cloudflare 가 DNS 를 관리 중이면 버튼 한 번으로 들어갑니다).
2. **Routing rules → Catch-all address** 를 켜고, Action 을 **Send to a Worker**,
   대상을 `temp-mail` 워커로 지정합니다.

이제 그 도메인의 모든 주소로 온 메일이 워커로 들어옵니다. 발급된 주소로 온 것만 저장되고,
없거나 만료된 주소로 온 메일은 거절되어 발신 측이 바운스를 받습니다.

MX 레코드가 퍼지는 데 몇 분 걸릴 수 있습니다. 확인:

```bash
dig +short MX yourdomain.com
```

## 설정값

`wrangler.jsonc` 의 `vars` 에서 조정합니다. 로컬에서는 `.dev.vars` 가 덮어씁니다.

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `MAIL_DOMAINS` | `example.com` | 주소 발급에 쓸 도메인 목록(콤마 구분). 첫 번째가 기본값. |
| `INBOX_TTL_MINUTES` | `60` | 주소 수명(분). "시간 연장" 버튼도 이 값만큼 미룹니다. |
| `MAX_MESSAGES_PER_INBOX` | `50` | 주소당 보관 메일 수. 넘으면 오래된 것부터 삭제. |
| `MAX_ATTACHMENT_BYTES` | `512000` | D1 에 저장할 첨부 1개의 최대 크기. 넘으면 메타데이터만 남습니다. |
| `ALLOW_DEV_INGEST` | `0` | `/api/dev/ingest` 개폐. **배포 환경에서는 반드시 `0`.** |

## API

읽기 계열은 `Authorization: Bearer <token>` 이 필요합니다. 토큰은 주소를 만들 때 한 번만 돌려줍니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/config` | 사용 가능한 도메인과 기본 수명 |
| `POST` | `/api/inboxes` | 주소 발급. 본문 `{ localPart?, domain? }` |
| `GET` | `/api/inboxes/:address` | 주소함 정보와 메일 수 |
| `DELETE` | `/api/inboxes/:address` | 주소함과 메일 전체 삭제 |
| `POST` | `/api/inboxes/:address/extend` | 만료 시각 연장 |
| `GET` | `/api/inboxes/:address/messages` | 메일 목록 (`?since=<epoch ms>`) |
| `GET` | `/api/messages/:id` | 메일 본문. 호출 시 읽음 처리 |
| `DELETE` | `/api/messages/:id` | 메일 한 통 삭제 |
| `GET` | `/api/messages/:id/attachments/:aid` | 첨부 다운로드 (`?download=1` 로 강제 저장) |

첨부 다운로드만 토큰 없이 동작합니다. 메일 id 와 첨부 id 가 모두 UUIDv4 라
URL 자체를 접근 권한으로 취급합니다 — 본문 iframe 의 `<img>` 가 헤더를 실을 수 없기 때문입니다.

## 구조

```
src/
  index.ts     email() · fetch() · scheduled() 진입점, 보안 헤더
  api.ts       REST 라우팅, 인증, 레이트 리밋
  ingest.ts    원본 메일 파싱 → 저장 (Email Worker 와 개발용 주입구가 공유)
  inbox.ts     주소 생성 · 토큰 · 만료 · 정리
  sanitize.ts  HTMLRewriter 기반 메일 HTML 살균
  types.ts     바인딩 타입과 설정 정규화
public/        정적 웹 UI (프레임워크 없음)
test/          Workers 런타임에서 도는 테스트
scripts/       로컬 테스트 메일 주입 스크립트
```

## 알아 둘 점

- 첨부는 D1 에 인라인으로 저장합니다. 큰 파일을 다루려면 R2 로 옮기고
  `attachments.content` 대신 객체 키를 두는 편이 낫습니다.
- 원본 `.eml` 은 보관하지 않습니다. 필요하면 R2 에 함께 넣으세요.
- 레이트 리밋은 아이솔레이트 단위라 정확하지 않습니다. 남용이 실제로 문제가 되면
  Cloudflare Rate Limiting 규칙을 앞에 두세요.
- 일회용 주소는 스팸·악용의 경로가 되기 쉽습니다. 공개 서비스로 운영한다면
  약관과 신고 창구, 로그 보존 정책을 함께 준비하세요.
