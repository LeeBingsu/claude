# models/ — 로컬 캐릭터 모델 폴더

이 폴더에 본인이 가진 `.pmx` / 모델 `.zip` 을 넣고 `manifest.json` 을 만들면,
게임이 시작할 때 자동으로 읽어 **의상(스킨)** 으로 등록한다. 게임 중 `C` 키로 전환.

## 쓰는 법

1. 받아 둔 모델 파일을 이 폴더에 복사한다.
2. `manifest.example.json` 을 `manifest.json` 으로 복사하고 파일명을 맞춘다.
3. 정적 서버로 게임을 연다 (`python3 -m http.server` — `file://` 로는 fetch 가 막힌다).

```json
{
  "outfits": [
    { "name": "교복",   "files": ["chisa_base_v1.03.zip"] },
    { "name": "수영복", "files": ["chisa_swimsuit.zip"] }
  ],
  "targetHeight": 1.72,
  "physics": true,
  "faceFlip": false
}
```

`files` 에 여러 개를 넣으면 한 의상으로 합쳐서 읽는다(모델 zip + 텍스처 zip 이 나뉜 경우).

## 왜 저장소에 안 올리나

여기 두는 모델 상당수(예: KURO GAMES / 명조 계열)는 배포 조건에
**재배포 금지(개조 여부 불문)**, 상업적 이용 금지, R-18 이용 금지가 명시돼 있다.
비공개 저장소라도 제3자 서버에 사본을 올리는 건 재배포에 해당하므로,
이 폴더는 `.gitignore` 로 통째로 제외했다. 본인이 정식으로 받아 둔 파일을
본인 기기에서 개인 용도로만 쓰는 구조다.
