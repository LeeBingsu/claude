# Map License — 사용법 / Usage

[한국어](#한국어) · [English](#english)

---

## 한국어

### 구매자용 (플레이어)

#### 설치

1. **Fabric Loader 0.16 이상**을 마인크래프트 **1.21.11**에 설치합니다.
2. 아래 두 파일을 `.minecraft/mods/` 폴더에 넣습니다.
   - `map-license-x.y.z.jar` (구매 시 받은 파일)
   - [Fabric API](https://modrinth.com/mod/fabric-api) (1.21.11용)
3. 맵 월드 폴더를 `.minecraft/saves/` 안에 넣습니다.
4. 게임을 실행하고 맵 월드에 들어갑니다.

> 여러 버전의 `map-license` jar를 받았다면 **숫자가 가장 큰 것 하나만** 넣으세요.
> 낮은 버전은 나중에 발급된 코드를 인식하지 못합니다.

#### 활성화

월드에 들어가면 코드 입력 화면이 자동으로 뜹니다.

1. 구매 시 받은 코드를 입력합니다 (`XXXX-XXXX-XXXX-XXXX` 형태).
2. **Enter** 또는 **활성화** 버튼을 누릅니다.
3. "활성화되었습니다" 메시지가 뜨면 잠시 후 화면이 닫히고 플레이가 시작됩니다.

대소문자, 하이픈, 공백은 신경 쓰지 않아도 됩니다. `I`와 `l`은 `1`로, `O`는 `0`으로
자동 인식하므로 헷갈리는 글자를 잘못 입력해도 통과합니다.

**한 번 활성화하면 그 계정에 영구히 저장됩니다.** 다음부터는 입력 화면이 뜨지 않습니다.

화면 대신 채팅창에 입력해도 됩니다:

```
/maplicense activate 코드
/maplicense status
```

#### 활성화하기 전에는

코드를 입력하기 전까지 캐릭터는 제자리에 고정되고 블록 설치·파괴·공격·아이템 사용이
막힙니다. 그 상태에서 몹에게 피해를 입지는 않으니 안심해도 됩니다.
**5분 안에 입력하지 않으면 접속이 종료됩니다.** 다시 들어가서 입력하면 됩니다.

#### 메시지별 대처

| 메시지 | 뜻 | 대처 |
| --- | --- | --- |
| 올바르지 않은 코드입니다 | 코드가 목록에 없음 | 오타 확인. 구매할 때 닉네임을 알려줬다면 **그 계정으로 접속했는지** 확인하세요. 둘 다 맞다면 판매자에게 최신 jar를 요청하세요 |
| 이미 사용된 코드입니다 | 이 PC에서 이미 쓴 코드 | 다른 계정으로 다시 쓸 수 없습니다. 판매자에게 문의하세요 |
| 이미 이 계정으로 활성화된 맵입니다 | 이미 해금 완료 | 그대로 플레이하면 됩니다 |
| 시도 횟수가 너무 많습니다 | 10회 초과 또는 너무 빠른 연속 입력 | 잠시 기다리거나, 나갔다가 다시 들어오면 초기화됩니다 |
| 활성화 코드가 입력되지 않았습니다 | 5분 시간 초과로 접속 종료 | 다시 접속해서 입력하세요 |
| 이 월드는 라이선스가 필요하지 않습니다 | 보호 대상 월드가 아님 | 정상입니다. 다른 월드에서는 아무 제한이 없습니다 |

#### 자주 묻는 것

**PC를 바꾸면 다시 입력해야 하나요?**
네. 활성화 기록은 `config/map-license/activations.json`에 저장되므로, 새 PC에서는
같은 코드를 다시 입력하면 됩니다.

**모드를 지우면 어떻게 되나요?**
맵의 스토리 진행이 동작하지 않습니다. 맵이 이 모드에 의존하도록 만들어져 있습니다.

**멀티플레이 서버에서도 되나요?**
됩니다. 서버에 모드가 설치되어 있으면 접속하는 사람마다 각자 코드를 입력해야 합니다.
클라이언트에 모드가 없으면 입력 화면이 뜨지 않는데, 이때는 접속 시 채팅으로 안내가
나오고 `/maplicense activate <코드>` 로 입력하면 됩니다.

---

### 제작자용 (맵 제작자)

전체 설정 절차와 설계 배경은 [README.md](README.md)에 있습니다. 아래는 요약입니다.

#### 1. 보호할 월드 지정

완성된 맵에서 OP 권한으로:

```
/maplicense fingerprint
```

출력된 `levelName`과 `seed`를 `src/main/resources/map-license/gate.json`에 넣습니다.

#### 2. 코드 발급

**GitHub Actions (권장)** — Actions 탭 → *Issue map-license activation codes* →
Run workflow. 발급 수와 배치 이름을 입력하면 코드 발급 · 버전 증가 · jar 빌드가 한 번에
끝나고, 아티팩트 두 개가 나옵니다.

**로컬**

```bash
python3 tools/generate_codes.py --count 200 \
    --out-codes tools/codes-batch1.txt \
    --out-hashes src/main/resources/map-license/codes.json
./gradlew clean build
```

**유출돼도 한 명만 쓰게 하려면** 구매자 닉네임을 받아 계정에 고정해서 발급합니다.
그 계정에서만 열리고, 다른 계정이 입력하면 튕깁니다.

```bash
python3 tools/generate_codes.py --count 1 --for-player Notch \
    --out-codes tools/codes-notch.txt \
    --out-hashes src/main/resources/map-license/codes.json
```

미리 찍어 둘 수 없다는 점만 다릅니다 — 구매자를 알아야 발급되므로 판매할 때마다
발급 + 재빌드가 필요합니다.

#### 3. 배포

버전 번호가 **가장 높은** jar를 맵과 함께 배포합니다. 그 jar가 지금까지 발급한 모든
배치의 코드를 인식합니다.

#### 운영 명령어

| 명령어 | 권한 | 용도 |
| --- | --- | --- |
| `/maplicense fingerprint` | OP 2 | 현재 월드의 이름·시드 확인 |
| `/maplicense revoke <플레이어>` | OP 3 | 계정 연결 해제 (코드는 사용 완료 유지) |

#### 반드시 지킬 것

- `tools/codes*.txt`(평문 코드)를 **절대 커밋하거나 배포하지 마세요.** 해시에서 코드를
  복원할 수 없으므로 이 파일이 유일한 원본입니다. 반드시 백업하세요.
- `codes.json`을 손으로 고치거나 salt를 바꾸지 마세요. 이미 판매한 코드가 무효가 됩니다.
- 배포 전에 `LicenseStore.INTEGRITY_KEY` 문자열을 바꾸세요.

---

## English

### For players

#### Installation

1. Install **Fabric Loader 0.16+** for Minecraft **1.21.11**.
2. Put both of these in your `.minecraft/mods/` folder:
   - `map-license-x.y.z.jar` (the file you received with your purchase)
   - [Fabric API](https://modrinth.com/mod/fabric-api) for 1.21.11
3. Put the map's world folder in `.minecraft/saves/`.
4. Launch the game and open the map world.

> If you were given several versions of the `map-license` jar, keep **only the
> highest-numbered one**. Older jars do not recognise codes issued later.

#### Activating

The code prompt opens by itself when you enter the world.

1. Type the code you received (it looks like `XXXX-XXXX-XXXX-XXXX`).
2. Press **Enter** or click **Activate**.
3. Once it says the map is activated, the prompt closes and you can play.

Case, hyphens and spaces do not matter. `I` and `l` are read as `1` and `O` as `0`,
so lookalike characters cannot trip you up.

**Activation is permanent for your account.** The prompt will not appear again.

You can also use chat instead of the prompt:

```
/maplicense activate <code>
/maplicense status
```

#### Before you activate

Until a code is accepted your character is held in place and cannot break or
place blocks, attack, or use items. You cannot be hurt while held, so nothing
can kill you at the prompt. **If nothing is entered within 5 minutes you are
disconnected** — just rejoin and try again.

#### What each message means

| Message | Meaning | What to do |
| --- | --- | --- |
| That code is not valid | The code is not in this jar's list | Check for typos. If you gave a username when buying, make sure you are logged into **that** account. If both are right, ask the seller for the latest jar |
| That code has already been used | Already redeemed on this computer | It cannot be reused on another account. Contact the seller |
| Your account already owns this map | Already unlocked | Just play |
| Too many attempts | Over 10 tries, or entries too close together | Wait a moment, or rejoin the world to reset the counter |
| No activation code was entered | Disconnected after the 5 minute timeout | Rejoin and enter the code |
| This world does not require a licence | Not the protected map | Normal — other worlds are unrestricted |

#### Common questions

**Do I need to enter the code again on a new computer?**
Yes. Activation is recorded in `config/map-license/activations.json`, so enter the
same code again on the new machine.

**What happens if I remove the mod?**
The map's story will not progress. The map is built to depend on this mod.

**Does it work on a multiplayer server?**
Yes. With the mod installed on the server, each player activates with their own code.
Players without the mod on their own client get no prompt window — they are told in
chat on join and can activate with `/maplicense activate <code>`.

---

### For map authors

Full setup and design notes are in [README.md](README.md) (Korean). Summary below.

#### 1. Mark the world to protect

In the finished map, as an operator:

```
/maplicense fingerprint
```

Copy the reported `levelName` and `seed` into
`src/main/resources/map-license/gate.json`.

#### 2. Issue codes

**GitHub Actions (recommended)** — Actions tab → *Issue map-license activation
codes* → Run workflow. Give it a count and a batch label; it mints the codes,
bumps the version, builds the jar, and uploads both artifacts.

**Locally**

```bash
python3 tools/generate_codes.py --count 200 \
    --out-codes tools/codes-batch1.txt \
    --out-hashes src/main/resources/map-license/codes.json
./gradlew clean build
```

**To make a leaked code useless to everyone else**, take the buyer's username
and bind the code to their account. Only that account can redeem it.

```bash
python3 tools/generate_codes.py --count 1 --for-player Notch \
    --out-codes tools/codes-notch.txt \
    --out-hashes src/main/resources/map-license/codes.json
```

The trade-off is that bound codes cannot be minted in advance - you need the
buyer first, so each sale means minting and rebuilding.

#### 3. Ship it

Distribute the **highest-numbered** jar with the map. It recognises the codes
from every batch issued so far.

#### Operator commands

| Command | Level | Purpose |
| --- | --- | --- |
| `/maplicense fingerprint` | OP 2 | Print the current world's name and seed |
| `/maplicense revoke <player>` | OP 3 | Unbind an account, leaving the code spent |

#### Rules that matter

- **Never commit or distribute `tools/codes*.txt`.** Codes cannot be recovered
  from their digests, so that file is the only copy. Back it up.
- Never hand-edit `codes.json` or change its salt — codes already sold stop working.
- Change the `LicenseStore.INTEGRITY_KEY` string before you release.

---

## 만든 사람 / Credits

모드 개발 / Licensing mod by **Hi_Its_I**
