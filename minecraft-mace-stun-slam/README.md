# Mace Stun Slam Auto (마인크래프트 1.21.11 Fabric 클라이언트 모드)

키 하나(기본값: `V`)를 누르고 있으면, 메이스(Mace) 스매시 어택(이른바 "스턴슬램")이
발동하는 정확한 순간에 자동으로 공격을 넣어주는 **클라이언트 전용** Fabric 모드입니다.

## 이 모드가 하는 일 / 하지 않는 일

- ✅ 낙하 중(`fallDistance`가 설정한 임계값 이상, 아래로 떨어지는 중)이고, 주손에 메이스를
  들고 있고, 조준선(크로스헤어)이 사거리 내의 엔티티를 향하고 있으면 그 프레임에 자동으로
  공격을 넣습니다. → 스매시 어택 발동에 필요한 "정확한 타이밍"만 대신 잡아줍니다.
- ✅ 키를 누른 시점에 땅에 서 있었다면 한 번 점프를 대신 눌러줍니다.
- ❌ 카메라(시야) 방향을 자동으로 돌리지 않습니다 (에임봇 아님). 목표물을 조준하는 것은
  플레이어 본인이 해야 합니다.
- ❌ 인벤토리를 자동으로 조작하거나 바람의 돌풍(Wind Charge)을 자동으로 인벤토리에서
  꺼내 던지지 않습니다. 높이 도약이 필요하면 오프핸드에 미리 바람의 돌풍을 들고 직접
  우클릭하거나, 코드리스(Elytra)/지형을 이용해 직접 낙하를 시작하세요.
- ❌ 서버 검증을 우회하지 않습니다. 실제 대미지/스턴 판정은 항상 서버가 계산합니다 —
  이 모드는 그 판정 창(window)에 맞춰 클릭을 대신 넣어줄 뿐입니다.

## ⚠️ 사용 전 확인하세요

다른 사람이 운영하는 멀티플레이 서버에서 사용할 계획이라고 하셨는데, **매크로/자동 입력
도구는 카메라 조작이 없어도 다수의 서버 규칙(특히 안티치트/공정 플레이 규정)에서
금지 대상**입니다. 반드시 해당 서버의 규칙을 먼저 확인하고, 애매하면 운영진에게
문의한 뒤 사용하세요. 밴/징계에 대한 책임은 사용자 본인에게 있습니다.

## 요구 사항

- Minecraft 1.21.11
- [Fabric Loader](https://fabricmc.net/use/) (0.16.x 이상)
- [Fabric API](https://modrinth.com/mod/fabric-api) (1.21.11용 최신 빌드)
- Java 21+ (모드 빌드 시)

## 빌드 방법

이 저장소에는 네트워크 제약으로 인해 Gradle Wrapper 바이너리(`gradlew`,
`gradle-wrapper.jar`)와 정확한 최신 버전 번호(야른 매핑 빌드, Loom 버전, Fabric API
버전)를 직접 채워 넣지 못했습니다. 로컬에서 아래 순서로 진행하세요.

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

1. 게임에 접속 후 `설정 > 조작 > 키 바인딩`에서 "Mace Stun Slam" 카테고리의
   "Auto Stun Slam" 키를 원하는 키로 바꿀 수 있습니다 (기본값 `V`).
2. 메이스를 주손에 장착합니다.
3. 목표물 위로 점프하거나 절벽/바람의 돌풍 등으로 낙하를 시작한 뒤, 목표물을 조준한
   상태로 해당 키를 누르고 있으면 스매시 어택 조건이 충족되는 순간 자동으로
   공격이 나갑니다.
4. 땅에 서 있을 때 키를 누르면 자동으로 한 번 점프한 뒤 낙하 타이밍을 계속 감시합니다.

## 설정 파일

첫 실행 시 `.minecraft/config/mace-stun-slam.json`에 아래 값이 생성됩니다.

| 필드 | 기본값 | 설명 |
|---|---|---|
| `minFallDistance` | `1.5` | 이 값(블록) 이상 낙하 중이어야 자동 공격이 발동합니다. 바닐라의 바람 돌풍(스턴) 넉백이 붙는 낙하 거리 기준과 동일합니다. |
| `attackRangeBlocks` | `4.0` | 크로스헤어가 향한 엔티티까지의 거리가 이 값 이하일 때만 발동합니다. |
| `cooldownTicks` | `10` | 한 번 발동한 뒤 다시 발동 가능해지기까지의 틱 수(중복 발동 방지). |
| `autoJump` | `true` | 키를 누른 시점에 땅에 있으면 자동으로 점프할지 여부. |

## 프로젝트 구조

```
src/main/java/net/jihoon/macestunslam/
  MaceStunSlamClient.java   모드 진입점, 키 바인딩 등록
  StunSlamController.java   매 틱 실행되는 상태 머신 (자동 점프 + 타이밍 감지 + 공격)
  ModConfig.java            JSON 설정 로드/저장
```
