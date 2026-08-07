# Mace Stun Slam Auto (마인크래프트 1.21.11 Fabric 클라이언트 모드)

키 하나(기본값: `V`)를 누르고 있으면, 메이스(Mace) 스매시 어택(이른바 "스턴슬램")이
발동하는 정확한 순간에 자동으로 공격을 넣어주는 **클라이언트 전용** Fabric 모드입니다.

## 이 모드가 하는 일 / 하지 않는 일

- ✅ 낙하 중이고, 메이스가 충전되어 있고, 조준선(크로스헤어)이 사거리 내의 엔티티를
  향하고 있을 때 **착지 직전의 가장 늦은 안전한 틱**에 공격을 넣습니다. 스매시 어택
  발동에 필요한 "정확한 타이밍"만 대신 잡아줍니다.
- ✅ 키를 누른 시점에 땅에 서 있었다면 한 번 점프를 대신 눌러줍니다.
- ✅ **겉날개(Elytra)로 활공 중에 키를 누르면 인벤토리의 흉갑으로 자동 교체**합니다.
  겉날개가 벗겨지면 활공이 즉시 끊기고 낙하가 시작되므로, 그대로 위의 슬램 타이밍
  감지로 이어집니다. (활공 상태에서는 스매시 어택이 발동하지 않기 때문에 필요한 단계입니다)
- ✅ **검 ↔ 메이스 어트리뷰트 스왑**: 슬램 직전에 핫바의 메이스로 자동 전환하고,
  슬램이 나간 직후 다시 검으로 돌아옵니다. 자세한 원리는 아래 참고.
- ✅ **검 자동 공격**: 검을 들고 좌클릭을 누르고 있으면, 조준한 대상이 사거리 안에 있을 때
  공격 쿨다운 완충에 맞춰 자동으로 공격합니다. 자세한 내용은 아래 참고.
- ❌ 카메라(시야) 방향을 자동으로 돌리지 않습니다 (에임봇 아님). 목표물을 조준하는 것은
  플레이어 본인이 해야 합니다.
- ❌ **킬오라가 아닙니다.** 자동 공격은 조준선이 향한 대상 하나만 때립니다. 주변 반경의
  엔티티를 조준 없이 자동으로 타격하지 않습니다.
- ❌ 바람의 돌풍(Wind Charge)을 자동으로 꺼내 던지지는 않습니다. 높이 도약이 필요하면
  오프핸드에 미리 들고 직접 우클릭하세요.
- ❌ 서버 검증을 우회하지 않습니다. 실제 대미지/스턴 판정은 항상 서버가 계산합니다 —
  이 모드는 그 판정 창(window)에 맞춰 클릭을 대신 넣어줄 뿐입니다.

## ⚠️ 사용 범위

이 모드는 **서버 운영자가 자동화를 허용한 환경**을 전제로 만들어졌습니다. 싱글플레이,
본인 서버, 또는 운영자가 직접 허용한 비공개 서버가 그 대상입니다.

운영자의 허가 없는 공개 서버에서 이 모드를 쓰는 것은 대부분의 서버 규칙 위반이며,
`humanize` 옵션 역시 그런 용도로 만든 것이 아닙니다. 밴/징계 책임은 사용자에게
있습니다.

기능별로 개별적으로 끌 수 있습니다: `autoSwapElytra`, `attributeSwap`, `humanize`.

## 슬램 타이밍: 왜 "가장 늦게" 때리는가

메이스의 스매시 보너스 대미지는 **낙하 거리에 비례**합니다 (첫 3블록 +4/블록,
이후 8블록까지 +2/블록, 그 뒤로 +1/블록). 그래서 `minFallDistance`를 넘긴 **첫**
프레임에 때리면 그 낙하에서 나올 수 있는 최소 대미지가 나옵니다.

이 모드는 반대로 갑니다. 매 틱 아래로 레이캐스트해서 지면까지의 거리를 재고,
바닐라 중력 공식(`v = (v - 0.08) * 0.98`)으로 착지까지 남은 틱을 시뮬레이션한 뒤,
`releaseMarginTicks`(기본 2틱)만 남았을 때 공격을 터뜨립니다. 같은 점프에서
훨씬 큰 대미지가 나오고, 충전 시간도 덤으로 벌립니다.

여기서 앞서 언급했던 트레이드오프도 같이 해결됩니다.

- **완충됨** → 착지 직전까지 기다렸다가 발동 (대미지 최대화)
- **아직 충전 중** → 착지 직전까지 계속 충전하다가, 마지막 틱에 `minSalvageCharge`
  (기본 0.5) 이상이면 덜 충전된 상태로라도 발동. 슬램을 통째로 놓치는 것보다 낫습니다.
- **바닥이 없음(공허 낙하)** → 기다릴 착지가 없으므로 완충되는 즉시 발동

핑이 높다면 `releaseMarginTicks`를 3~4로 올리세요. 낮게 두면 서버에 공격이 도착하기
전에 착지해버릴 수 있습니다. 반대로 값이 너무 크면 대미지를 손해봅니다.

한 가지 주의: 마지막까지 기다리는 만큼, 대기 중에 상대가 사거리를 벗어나면 슬램이
안 나가고 낙하 대미지를 그대로 받습니다 (스매시가 적중해야 낙하 대미지가 상쇄됩니다).
확실하게 즉시 발동하는 기존 동작을 원하면 `maxDamageMode`를 `false`로 두세요.

## 타이밍 변동(humanize)

이 모드의 동작에는 원래 고정된 틱 오프셋이 세 군데 있었습니다. 값이 항상 같으면
그 자체가 지문이 되므로, `humanize`가 켜져 있으면(기본 `true`) 매번 다른 값을 씁니다.

| 지점 | 고정값이었을 때 | 변동 범위(기본) |
|---|---|---|
| 키 입력 → 시퀀스 시작 | 0틱 (같은 틱에 즉시) | 1~4틱 |
| 슬롯 변경 → 공격 | 항상 정확히 1틱 | 1~3틱 |
| 겉날개 3연타 클릭 간격 | **한 틱에 3번 전부** | 각 1~3틱 |

세 번째가 가장 컸습니다. 사람은 한 틱(50ms) 안에 서로 다른 슬롯을 세 번 클릭할 수
없기 때문에, 이건 변동을 주는 문제가 아니라 애초에 물리적으로 불가능한 입력이었습니다.
이제 클릭을 틱에 걸쳐 큐로 내보냅니다. 부수적으로 desync도 줄어듭니다.

두 가지 설계 원칙이 있습니다.

- **변동은 안전한 방향으로만.** 예를 들어 `releaseMarginJitterTicks`는 발동을 항상
  *더 이르게*만 만듭니다. 늦어지면 슬램을 놓치지만, 일러지면 대미지만 조금 손해입니다.
- **틱마다 다시 굴리지 않습니다.** 매 틱 비교되는 임계값을 매 틱 재추첨하면 결국
  최댓값으로 수렴합니다(먼저 통과하는 추첨이 발동시키므로). 그래서 낙하 단위/스왑
  단위로 한 번 뽑아 고정합니다.

`humanize`를 `false`로 두면 이전의 고정 타이밍으로 돌아갑니다.

## 검 자동 공격 (좌클릭 홀드)

**조건이 전부 맞을 때만 발동합니다.**

1. `autoAttack`이 켜져 있음 (기본 `true`)
2. 주손에 검(`#minecraft:swords`)을 들고 있음
3. 좌클릭을 누르고 있음 (GUI가 열려 있으면 제외)
4. **조준선이 엔티티를 향하고 있음**
5. 눈 위치에서 피격 지점까지의 거리가 `autoAttackMaxReach`(기본 3.0) 이하
6. 공격 충전도가 요구치 이상 — 요구치는 매 타격마다 `autoAttackMinCharge`~`MaxCharge`
   (기본 0.80~0.90)에서 새로 뽑습니다

요구 충전도는 **타격 단위로 한 번 뽑아 고정**합니다. 매 틱 재추첨하면 충전도가 범위를
훑고 올라가면서 가장 먼저 통과하는 추첨에 발동해버려, 결과적으로 항상 범위의 최솟값에
붙습니다. 무작위성이 사라지는 거죠 — humanize 쪽 래치와 같은 이유입니다.

거리는 눈 위치 기준 3D 유클리드 거리로 잽니다. 즉 플레이어를 중심으로 한 구(球)이고,
수평 거리가 아닙니다. 바닐라가 리치를 판정하는 방식과 같은 기하입니다. 3.0을 넘겨
설정해도 서버가 거부하므로 의미가 없습니다.

### 왜 믹스인이 필요한가

바닐라도 좌클릭을 홀드하면 자동 공격을 하는데, **고정 10틱 주기**입니다. 검의 완충은
12.5틱이라 바닐라 홀드 공격은 항상 약 80% 충전에서 나갑니다 — 대미지를 20% 버리는 셈입니다.

그래서 `MinecraftClientAccessor` 믹스인으로 바닐라의 `attackCooldown` 카운터를 계속
0 위로 유지해 바닐라 리듬을 막고, 완충 시점에 직접 공격합니다. 억제는 **조준 대상이
사거리 안에 실제로 들어왔을 때만** 걸리므로, 좌클릭 홀드 채굴은 영향을 받지 않습니다.

또한 자동 공격은 스턴슬램 키를 누르고 있지 **않을 때만** 동작합니다. 둘이 같은 공격
쿨다운을 두고 경쟁하면 어느 쪽도 완충되지 않기 때문입니다.

## 어트리뷰트 스왑이 동작하는 원리

공격 쿨다운은 아이템이 아니라 **플레이어**에 저장됩니다 (`lastAttackedTicks`).
반면 그 틱 수를 몇 %의 충전도로 해석할지는 **현재 손에 든 아이템의 공격 속도
어트리뷰트**가 결정합니다.

| 무기 | 공격 속도 | 완전 충전까지 |
|---|---|---|
| 검 | 1.6 | 20 / 1.6 ≈ **12.5틱** |
| 메이스 | 0.6 | 20 / 0.6 ≈ **33틱** |

핫바 슬롯을 바꿔도 `lastAttackedTicks`는 초기화되지 않기 때문에, 스왑 타이밍에 따라
같은 경과 시간이 전혀 다른 충전도로 읽힙니다. 이 모드가 자동화하는 두 지점은:

1. **슬램 직전 → 메이스로 전환.** 전환 후 실제 메이스 기준 충전도
   (`minAttackCooldownProgress`, 기본 1.0 = 완충)를 확인하고 나서 공격을 넣습니다.
   충전이 덜 된 상태로 슬램을 낭비하지 않습니다.
2. **슬램 직후 → 검으로 복귀.** 메이스를 계속 들고 있으면 33틱을 기다려야 하지만,
   검으로 돌아오면 12.5틱 만에 다음 공격이 완충됩니다. 슬램의 폭딜 후 딜로스를
   최소화하는 부분입니다.

전환 후에는 항상 한 틱을 넘기고 공격합니다. 슬롯 변경 패킷이 서버에 먼저 도착하지
않으면 서버 입장에서는 검을 든 상태로 때린 것이 되어 슬램이 아예 발동하지 않습니다.

낙하 중 완충을 기다리다 착지해버리는 상황이라면 `minAttackCooldownProgress`를
0.85 정도로 낮추면 됩니다 (대미지는 비례해서 줄어듭니다).

## 요구 사항

- Minecraft 1.21.11
- [Fabric Loader](https://fabricmc.net/use/) (0.16.x 이상)
- [Fabric API](https://modrinth.com/mod/fabric-api) (1.21.11용 최신 빌드)
- Java 21+ (모드 빌드 시)

## 빌드 방법 ① GitHub Actions (자동)

`.github/workflows/build-mod.yml`이 `minecraft-mace-stun-slam/` 아래가 바뀔 때마다
자동으로 빌드합니다. Actions 탭에서 수동 실행(`workflow_dispatch`)도 가능합니다.

- 성공하면 **Artifacts에 `mace-stun-slam-jar`** 이 올라옵니다. 받아서 압축을 풀고
  `.minecraft/mods`에 Fabric API와 함께 넣으면 됩니다. (`-dev`, `-sources` jar은
  제외되어 실제로 넣을 jar 하나만 나옵니다)
- 실패하면 `build-reports` 아티팩트에 리포트가 올라옵니다. 믹스인/remap 오류는
  콘솔보다 여기에 자세히 남습니다.

이 저장소에는 Gradle Wrapper 바이너리(`gradlew`, `gradle-wrapper.jar`)가 없어서,
워크플로우는 래퍼 대신 Gradle 8.10을 직접 설치해 `gradle build`를 실행합니다
(`gradle-wrapper.properties`에 적힌 버전과 맞춰 둔 값입니다).

로컬에서 래퍼를 만들어 커밋하면 워크플로우의 `Set up Gradle` 단계를
`gradle/actions/setup-gradle@v4` 기본 설정으로 두고 `./gradlew build`를 쓰는 편이
더 재현성이 좋습니다.

```bash
cd minecraft-mace-stun-slam
gradle wrapper --gradle-version 8.10
git add gradlew gradlew.bat gradle/wrapper/gradle-wrapper.jar
```

## 빌드 방법 ② 로컬

정확한 최신 버전 번호(Loom 버전, Loader/Fabric API 버전)는 아직 미검증입니다.
로컬에서 아래 순서로 진행하세요.

1. `gradle.properties`를 열어 `# TODO verify` 주석이 붙은 값들을
   https://fabricmc.net/develop/ 에서 1.21.11 기준 최신 값으로 갱신합니다.
   (Loader / Yarn mappings / Fabric API 버전 확인 가능)
2. 프로젝트 루트에서 Gradle Wrapper를 생성합니다 (Gradle이 로컬에 설치되어 있어야 함):
   ```bash
   gradle wrapper --gradle-version 8.10
   ```
3. 빌드:
   ```bash
   ./gradlew build
   ```
   결과물은 `build/libs/mace-stun-slam-1.0.0.jar` 에 생성됩니다.
4. 생성된 jar를 `.minecraft/mods` 폴더에 Fabric API와 함께 넣습니다.

IntelliJ IDEA를 쓴다면 Gradle 플러그인이 설치되어 있을 경우 `build.gradle`을 열고
"Import Gradle Project"만 눌러도 wrapper 없이 바로 빌드/실행(`runClient` 태스크)이
가능합니다.

## 사용법

1. `설정 > 조작 > 키 바인딩`의 **"메이스 스턴슬램"** 카테고리에서 세 개의 키를 각각
   따로 지정할 수 있습니다.

   | 키 | 기본값 | 동작 |
   |---|---|---|
   | 자동 스턴슬램 | `V` | 누르고 있는 동안 전체 시퀀스(활공 해제 → 메이스 전환 → 타이밍 슬램 → 검 복귀) |
   | 겉날개 → 흉갑 교체 | 미지정 | 누를 때마다 겉날개/흉갑 교체만 단독 실행 |
   | 검 ↔ 메이스 전환 | 미지정 | 누를 때마다 검/메이스 토글만 단독 실행 |

   아래 두 개는 자동 스턴슬램 키가 이미 포함하는 동작이라 기본값이 미지정입니다.
   각 단계를 손가락에 따로 나눠 쓰고 싶을 때만 지정하면 됩니다.
2. 메이스를 주손에 장착합니다.
3. 목표물 위로 점프하거나 절벽/바람의 돌풍 등으로 낙하를 시작한 뒤, 목표물을 조준한
   상태로 해당 키를 누르고 있으면 스매시 어택 조건이 충족되는 순간 자동으로
   공격이 나갑니다.
4. 땅에 서 있을 때 키를 누르면 자동으로 한 번 점프한 뒤 낙하 타이밍을 계속 감시합니다.
5. 겉날개로 활공 중에 키를 누르면 인벤토리(핫바 우선)에서 흉갑을 찾아 자동 교체하고,
   활공이 끊기며 시작된 낙하에서 그대로 슬램 타이밍을 잡습니다. 흉갑은 핫바에 두면
   교체가 클릭 1회로 끝나 가장 안정적입니다.
6. 어트리뷰트 스왑이 켜져 있으면 메이스를 직접 들고 있을 필요가 없습니다. 검을 든 채로
   싸우다가 키를 누르면 메이스로 전환 → 슬램 → 다시 검으로 복귀까지 자동입니다.
   **메이스와 검 모두 핫바(1~9번 슬롯)에 있어야 합니다.**

## 설정 파일

첫 실행 시 `.minecraft/config/mace-stun-slam.json`에 아래 값이 생성됩니다.

| 필드 | 기본값 | 설명 |
|---|---|---|
| `minFallDistance` | `1.5` | 이 값(블록) 이상 낙하 중이어야 자동 공격이 발동합니다. 바닐라의 바람 돌풍(스턴) 넉백이 붙는 낙하 거리 기준과 동일합니다. |
| `attackRangeBlocks` | `4.0` | 크로스헤어가 향한 엔티티까지의 거리가 이 값 이하일 때만 발동합니다. |
| `cooldownTicks` | `10` | 한 번 발동한 뒤 다시 발동 가능해지기까지의 틱 수(중복 발동 방지). |
| `autoJump` | `true` | 키를 누른 시점에 땅에 있으면 자동으로 점프할지 여부. |
| `autoSwapElytra` | `true` | 활공 중에 키를 누르면 겉날개를 인벤토리의 흉갑으로 교체할지 여부. |
| `swapCooldownTicks` | `10` | 겉날개 교체 후 다시 교체를 시도하기까지의 틱 수(서버 동기화 지연 중 중복 클릭 방지). |
| `attributeSwap` | `true` | 검 ↔ 메이스 자동 전환 사용 여부. `false`면 메이스를 직접 들고 있을 때만 슬램이 발동합니다. |
| `minAttackCooldownProgress` | `1.0` | 메이스를 든 상태에서 이 충전도(0.0~1.0) 이상일 때만 공격합니다. |
| `swapBackToSwordDelayTicks` | `1` | 슬램 후 검으로 돌아가기까지의 틱 수. |
| `maceHotbarSlot` | `-1` | 메이스가 있는 핫바 슬롯(0~8). `-1`이면 핫바를 자동 탐색합니다. |
| `swordHotbarSlot` | `-1` | 검이 있는 핫바 슬롯(0~8). `-1`이면 `#minecraft:swords` 태그로 자동 탐색합니다. |
| `maxDamageMode` | `true` | 착지 직전까지 기다렸다 발동해 낙하 거리(=대미지)를 최대화합니다. `false`면 조건 충족 즉시 발동. |
| `releaseMarginTicks` | `2` | 예상 착지 몇 틱 전에 발동할지. 핑이 높으면 3~4로 올리세요. |
| `minSalvageCharge` | `0.5` | 착지 직전까지 완충이 안 됐을 때, 이 충전도 이상이면 덜 충전된 채로라도 발동합니다. |
| `humanize` | `true` | 고정 틱 오프셋 대신 매번 다른 값을 사용합니다. |
| `reactionDelayMinTicks` / `MaxTicks` | `1` / `4` | 키 입력 후 시퀀스 시작까지의 지연. |
| `swapSettleMinTicks` / `MaxTicks` | `1` / `3` | 슬롯 변경 후 공격까지의 대기. 코드상 최소 1틱이 강제됩니다. |
| `inventoryClickSpacingMinTicks` / `MaxTicks` | `1` / `3` | 겉날개 3연타 클릭 사이 간격. |
| `releaseMarginJitterTicks` | `1` | `releaseMarginTicks`에 더해지는 변동폭. 발동이 더 일러지기만 합니다. |
| `autoAttack` | `true` | **검 자동 공격 전체 온/오프.** `false`면 바닐라 기본 동작으로 돌아갑니다. |
| `autoAttackMaxReach` | `3.0` | 눈 위치에서 대상까지의 최대 거리(블록). 바닐라 리치가 3.0이라 그 이상은 서버가 거부합니다. |
| `autoAttackMinCharge` / `MaxCharge` | `0.80` / `0.90` | 매 타격마다 이 범위에서 요구 충전도를 새로 뽑습니다. 두 값을 같게 하면 고정값이 됩니다. |

## 프로젝트 구조

```
src/main/java/net/jihoon/macestunslam/
  MaceStunSlamClient.java   모드 진입점, 키 바인딩 3종 등록
  StunSlamController.java   매 틱 실행되는 상태 머신 (자동 점프 + 타이밍 판정 + 공격)
  FallPredictor.java        지면까지 레이캐스트 + 중력 시뮬레이션으로 착지 시점 예측
  Humanizer.java            고정 틱 오프셋 3곳의 변동값 생성(낙하/스왑 단위로 고정)
  ElytraSwapper.java        활공 중 겉날개 → 흉갑 슬롯 교체
  WeaponSwapper.java        검 ↔ 메이스 핫바 전환 + 충전도 확인
  AutoAttackController.java 좌클릭 홀드 검 자동 공격 (쿨다운 완충 동기화)
  ModConfig.java            JSON 설정 로드/저장
  mixin/
    MinecraftClientAccessor.java  바닐라 홀드 공격(고정 10틱) 억제용 accessor
```

## 매핑 검증 결과 (yarn 1.21.11 기준)

FabricMC/yarn 저장소의 `1.21.11` 브랜치 매핑 파일로 직접 대조한 결과입니다.

**확인됨 (수정 불필요)**

| 사용처 | 매핑 | 결과 |
|---|---|---|
| `player.isGliding()` | `LivingEntity method_6128 isGliding ()Z` | ✅ Entity가 아닌 LivingEntity에 있음. PlayerEntity가 상속하므로 정상 |
| `getSelectedSlot()` / `setSelectedSlot(int)` | `method_67532` / `method_61496` | ✅ 둘 다 존재 |
| `@Accessor("attackCooldown")` | `MinecraftClient field_1771 attackCooldown I` | ✅ **필드명 정확함** |
| `getAttackCooldownProgress(float)` | `method_7261 (F)F` | ✅ |
| `getEquippedStack(EquipmentSlot)` | `LivingEntity method_6118` | ✅ |
| `getMainHandStack()` / `swingHand(Hand)` | `method_6047` / `method_6104` | ✅ |
| `getEyePos()` / `getVelocity()` / `isOnGround()` | `method_33571` / `method_18798` / `method_24828` | ✅ |
| `squaredDistanceTo(Entity)` | `method_5858` | ✅ |
| `Inventory.getStack(int)` | `method_5438 (I)Lclass_1799;` | ✅ 인터페이스에 존재 |

**주의 필요**

- **`fallDistance`는 이제 `double`입니다** (`Entity field_6017 fallDistance D`, 예전엔 `float`).
  `player.fallDistance < config.minFallDistance` 비교는 float가 double로 승격되어 그대로
  컴파일되지만, 값을 직접 대입하는 코드를 추가하실 거면 타입에 주의하세요.
- **`ItemTags.SWORDS`는 확인 실패.** yarn 1.21.11의 `ItemTags.mapping`에는 FIELD 항목이
  하나도 없고 `of(String)` 메서드뿐입니다. 그래서 검 판별을 `ItemTags.SWORDS` 대신
  **바닐라 검 6종 명시 비교**(`WeaponSwapper.isSword()`)로 바꿔 두었습니다. 컴파일이
  보장되는 대신 모드 검은 인식하지 못합니다. 빌드해 보고 `ItemTags.SWORDS`가 해석되면
  그 한 줄로 되돌리는 편이 낫습니다 (주석에 적어 뒀습니다).
- **`PlayerInventory`가 `Inventory`를 구현하는지는 미확인.** 1.21.9에서 인벤토리가
  리팩터링되면서 `getMainStacks()`가 생겼고, `PlayerInventory.mapping`에는 `getStack`이
  없습니다(인터페이스 상속이면 정상). `player.getInventory().getStack(i)`가 컴파일되지
  않으면 `getMainStacks().get(i)`로 바꾸세요. 해당 위치는 `ElytraSwapper.findChestplateSlot()`과
  `WeaponSwapper.resolveSlot()` 두 곳입니다.
- **야른 매핑 빌드 번호**: `1.21.11+build.1`과 `+build.3` 모두 존재를 확인했습니다.
  `gradle.properties`에는 `build.1`이 들어 있으니 최신인 `build.3`으로 올리셔도 됩니다.
- **야른은 1.21.11이 마지막입니다.** Fabric 공지에 따르면 다음 버전부터는 공식 Mojang
  매핑으로 이전해야 합니다.

## 매핑 관련 주의 (기존 메모)

오프라인 환경이라 1.21.11 야른 매핑을 직접 확인하지 못했습니다. 컴파일 에러가 나면
아래 세 곳을 확인하세요.

- `ElytraSwapper.isGliding()` → `PlayerEntity#isGliding()`. 1.21.5에서
  `isFallFlying()`에서 이름이 바뀌었습니다. 못 찾으면 `isFallFlying()`으로 되돌리세요.
- `WeaponSwapper.select()` → `PlayerInventory#getSelectedSlot()` / `setSelectedSlot(int)`.
  구버전 매핑에서는 `selectedSlot` public 필드에 직접 대입했습니다.
- `WeaponSwapper.isSword()` → `ItemTags.SWORDS` (`#minecraft:swords`). 이 상수가 없으면
  `swordHotbarSlot`을 명시적으로 지정해 자동 탐색을 우회할 수 있습니다.
- `MinecraftClientAccessor` → `MinecraftClient`의 `attackCooldown` 필드. **여기가 가장
  위험합니다.** 믹스인 accessor는 필드명이 정확히 맞아야 하고, 틀리면 로딩 단계에서
  크래시합니다(`"required": true`). 필드명이 다르면 `@Accessor("...")` 값을 실제 야른
  매핑명으로 바꾸세요. 자동 공격을 안 쓸 거라면 `fabric.mod.json`의 `mixins` 배열을
  비우고 `AutoAttackController`와 `mixin/` 패키지를 지워도 나머지 기능은 그대로 동작합니다.
