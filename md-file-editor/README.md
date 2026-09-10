# MD 파일 편집기

Markdown(.md) · JSON(.json) · HTML(.html) · 일반 텍스트(.txt) 파일을 만들고, 보고, 편집하고, 저장할 수 있는 안드로이드 앱. Jetpack Compose 로 작성했다.

## 주요 기능
- **새 파일 만들기** — 이름과 형식(md/json/html/txt)을 선택해 새 문서를 바로 작성
- **파일 열기 / 편집 / 저장** — Storage Access Framework 를 사용해 기기 어디에 있는 파일이든 열고, 고쳐 쓰고, 같은 위치에 저장하거나 "다른 이름으로 저장"
- **미리보기**
  - Markdown → 렌더링된 리치 텍스트 (Markwon: 표, 취소선, 링크 지원)
  - HTML → 실제 페이지처럼 렌더링 (WebView, 스크립트는 비활성화)
  - JSON → 들여쓰기로 정렬해서 표시, 문법 오류가 있으면 오류 메시지 표시
- **기본 앱으로 열기** — 파일 관리자나 다른 앱에서 `.md` / `.json` / `.html` / `.htm` / `.txt` 파일을 열 때 "연결 프로그램" 목록에 이 앱이 나타나고, 선택하면 바로 편집기가 열림
- **최근 문서** — 홈 화면에 최근에 열거나 만든 파일 목록 저장 (DataStore)

## 구조
```
app/src/main/java/com/mdcraft/editor/
  MainActivity.kt        # 화면 전환, 인텐트 처리, SAF 런처
  MainViewModel.kt        # 상태 관리 (홈/편집기, 저장/열기 로직)
  data/                   # ContentResolver 기반 파일 입출력, 최근 파일 저장소
  model/                  # 문서 형식, UI 상태 데이터 클래스
  ui/                     # HomeScreen, EditorScreen
  ui/preview/             # Markdown / HTML / JSON 미리보기 컴포저블
```

## 빌드 방법
Android Studio(Koala 이상)에서 `md-file-editor` 폴더를 열면 Gradle 동기화 후 바로 실행할 수 있다.

커맨드라인으로 빌드하려면:
```bash
./gradlew assembleDebug
```
(최초 실행 시 Gradle 8.7 배포판을 인터넷에서 내려받는다.)

- **compileSdk / targetSdk**: 34
- **minSdk**: 26 (Android 8.0+)
- **언어**: Kotlin, Jetpack Compose (Material 3)

## 참고
- 별도의 저장소 권한(Manifest permission)이 필요 없다 — 모든 파일 접근은 시스템 파일 선택기(SAF)와 사용자가 연 파일의 URI 권한만 사용한다.
- 파일 관리자 앱에 따라 `.md`/`.json` 등에 올바른 MIME 타입 대신 `application/octet-stream` 을 붙여 넘기는 경우가 있어, 매니페스트에 확장자 기반 인텐트 필터도 함께 등록해두었다.
