# vendor

| 파일 | 출처 | 라이선스 |
| --- | --- | --- |
| `three.min.js` | [three.js](https://threejs.org) r147 (UMD 빌드) | MIT — Copyright © 2010-2022 three.js authors |

CDN(`cdnjs`)이 막힌 환경에서도 게임이 돌아가도록 로컬 사본을 둔다.
`index.html` 은 CDN 을 먼저 시도하고, 실패하면 이 파일로 대체한다.

MMD(PMX) 로더는 커스텀 모델을 쓸 때만 jsDelivr 에서 지연 로드하므로 여기에 포함하지 않는다.
