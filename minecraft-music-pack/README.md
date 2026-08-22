# Metal Scar Radio — Minecraft 배경음악 리소스팩

바닐라 마인크래프트의 배경음악(BGM) 32개 사운드 이벤트를 전부 제공된 15곡으로 교체하는
Java Edition 리소스팩입니다. 음반(뮤직 디스크)과 효과음은 건드리지 않습니다.

## 지원 버전

| 항목 | 값 |
|---|---|
| 최소 지원 | **1.21.11** (resource pack format `75`) |
| 검증 기준 | 1.21.11 / 26.2 (format `88`)의 실제 `sounds.json`과 이벤트 목록 대조 |
| `pack.mcmeta` | `"min_format": 75`, `"max_format": 200` |

1.21.9 이후 `pack.mcmeta`는 단일 `pack_format` 대신 `min_format` / `max_format` 범위를
사용합니다. `max_format`을 `200`으로 잡아 두었기 때문에 26.x 계열(26.1 = 84, 26.2 = 88,
26.3 = 89 …) 전체는 물론 26.12 시점까지 나올 포맷 번호도 범위 안에 들어가며,
"오래된/새로운 버전용 팩" 경고 없이 로드됩니다.

주의: 앞으로 새 바이옴이 추가되면서 새로운 `music.*` 이벤트가 생기면 그 바이옴에서만
바닐라 음악이 나올 수 있습니다. 그때는 `tools/generate_sounds.py`의 `EVENTS`에 이벤트
이름을 한 줄 추가하고 `./build.sh`를 다시 실행하면 됩니다.

## 설치

1. `dist/MetalScarRadio-Music-v1.0.zip`을 내려받습니다. (저장소에 포함되어 있고,
   `./build.sh`로 언제든 다시 빌드할 수 있습니다)
2. 마인크래프트 실행 → 설정 → 리소스 팩 → **팩 폴더 열기**.
3. 열린 `resourcepacks` 폴더에 zip 파일을 그대로 넣습니다. (압축을 풀 필요 없음)
4. 게임 안에서 팩을 오른쪽(사용 중)으로 옮기고 완료를 누릅니다.

이미 재생 중이던 곡은 끝날 때까지 이어지므로, 바로 확인하려면 월드를 다시 들어가거나
음악 볼륨을 껐다 켜세요.

## 수록곡 → 사운드 이벤트 배치

| 곡 | 주요 배치 |
|---|---|
| Jingyu at Daybreak | 메뉴, 일반, 초원, 그로브, 벚꽃 숲, 눈 비탈 |
| Wisdom of the Landscape | 메뉴, 일반, 황무지, 사막, 숲, 초원, 드문 정글 |
| Misty Grove | 메뉴, 일반, 숲, 늪, 원시 타이가, 대나무 정글, 수중 |
| Blossoms Bring an Old Friend | 메뉴, 일반, 벚꽃 숲, 꽃 숲, 무성한 동굴 |
| When the Spring Rite Arrives | 메뉴, 일반, 벚꽃 숲, 꽃 숲, 초원 |
| Soils of Life | 일반, 크리에이티브, 숲, 정글, 늪, 무성한 동굴, 원시 타이가 |
| To Walk, To Cross | 엔딩 크레딧, 일반, 사막, 황무지, 얼어붙은 봉우리, 뾰족한 봉우리, 돌 봉우리 |
| Outpost Shaping I | 일반, 크리에이티브, 돌 봉우리 |
| Charged by Verdant Tubes | 일반, 정글, 대나무 정글, 드문 정글, 무성한 동굴, 수중, 뒤틀린 숲 |
| Fangxing | 일반, 정글, 대나무 정글, 사막, 심홍색 숲, 수중 |
| Cosmic Observer | 디 엔드, 크리에이티브, 깊은 어둠, 얼어붙은 봉우리, 눈 비탈, 소울 샌드 계곡, 뒤틀린 숲 |
| Protocol Flow | 크리에이티브, 디 엔드, 종유석 동굴, 유황 동굴, 현무암 삼각주, 뒤틀린 숲 |
| Faith's Imprint | 엔더 드래곤 전투, 네더 황무지, 심홍색 숲, 소울 샌드 계곡, 유황 동굴, 봉우리 계열 |
| Journey to the Vein | 종유석 동굴, 유황 동굴, 깊은 어둠, 네더 황무지, 현무암 삼각주 |
| Echoes in Ore | 깊은 어둠, 종유석 동굴, 늪, 황무지, 네더 황무지, 소울 샌드 계곡, 현무암 삼각주 |

정확한 전체 매핑은 `tools/generate_sounds.py`의 `EVENTS`와 빌드된
`pack/assets/minecraft/sounds.json`에 있습니다.

## 오디오 처리

- 원본 320 kbps MP3 → **Ogg Vorbis** (`-qscale:a 5`, 44.1 kHz 스테레오). 마인크래프트는
  MP3를 재생하지 못하므로 Ogg 변환이 필수입니다.
- 곡마다 EBU R128 통합 라우드니스를 측정해(−22.1 ~ −10.0 LUFS) `sounds.json`의
  `volume` 값으로 −19.5 LUFS 근처에 맞췄습니다. 곡이 바뀔 때 음량이 튀지 않습니다.
- 모든 항목은 `"stream": true` — 긴 곡을 통째로 메모리에 올리지 않습니다.
- 각 이벤트에 `"replace": true`를 넣어 바닐라 곡이 섞여 나오지 않게 했습니다.

## 저장소 구조

```
pack/                     리소스팩 본체 (폴더째 resourcepacks/에 넣어도 동작)
  pack.mcmeta
  pack.png
  assets/minecraft/sounds.json
  assets/minecraft/sounds/music/metal_scar_radio/*.ogg
tools/generate_sounds.py  이벤트 ↔ 곡 매핑 및 volume 계산 → sounds.json 생성
tools/make_icon.py        pack.png 생성
tools/validate.py         JSON·파일 존재·Ogg 디코딩 검증
build.sh                  위 세 개 실행 후 dist/*.zip 생성
```

`dist/MetalScarRadio-Music-v1.0.zip`은 바로 받아 쓸 수 있도록 저장소에 커밋되어 있으며,
`./build.sh`를 실행하면 동일한 zip이 다시 만들어집니다.

## 라이선스 / 저작권

수록된 음원은 사용자가 직접 제공한 파일이며, 배포 권한은 원 저작권자에게 있습니다.
공개 배포 전에 각 트랙의 이용 조건을 확인하세요.
