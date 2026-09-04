# vendor

CDN(`cdnjs` / `jsDelivr`)이 막힌 환경에서도 동작하도록 둔 로컬 사본.
`index.html` / `js/mmdchar.js` 는 로컬 사본을 먼저 쓰고, 실패하면 CDN 으로 대체한다.

| 파일 | 출처 | 라이선스 |
| --- | --- | --- |
| `three.min.js` | [three.js](https://threejs.org) r147 UMD 빌드 | MIT © 2010-2022 three.js authors |
| `MMDLoader.js` · `TGALoader.js` · `CCDIKSolver.js` · `MMDPhysics.js` · `MMDAnimationHelper.js` | three.js r147 `examples/js` | MIT © three.js authors |
| `mmdparser.min.js` | [mmd-parser](https://github.com/takahirox/mmd-parser) 1.0.4 | MIT © Takahiro |

Ammo(물리)는 용량이 커서 로컬에 두지 않고 필요할 때만 CDN 에서 지연 로드한다.
물리 로드에 실패해도 모델은 정상 표시되며, 치마·머리카락만 정지 상태가 된다.
