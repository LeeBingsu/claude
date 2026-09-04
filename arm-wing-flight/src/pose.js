/**
 * 웹캠 포즈 추적 → 비행 조종 입력.
 *
 * MediaPipe Pose 랜드마크에서 어깨/팔꿈치/손목만 뽑아
 * { lift, turn, pitch, flap } 네 개의 조종값으로 바꾼다.
 * 화면은 거울(scaleX(-1))이므로 "화면 왼손"은 이미지 x가 큰 쪽이다.
 */
import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// 랜드마크 인덱스
const L_SHOULDER = 11, R_SHOULDER = 12;
const L_ELBOW = 13, R_ELBOW = 14;
const L_WRIST = 15, R_WRIST = 16;
const ARM_CHAIN = [
  [L_WRIST, L_ELBOW],
  [L_ELBOW, L_SHOULDER],
  [L_SHOULDER, R_SHOULDER],
  [R_SHOULDER, R_ELBOW],
  [R_ELBOW, R_WRIST],
];
const NEEDED = [L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST];

// 어깨너비 기준 양팔 손목 간격: 팔 내림 ≈ 1.2, T자 ≈ 3.1
const SPREAD_MIN = 1.5;
const SPREAD_MAX = 3.0;
const VISIBILITY = 0.5;
const SMOOTH = 0.35;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const norm01 = (v, lo, hi) => clamp((v - lo) / (hi - lo), 0, 1);

export class PoseTracker {
  constructor(video, canvas) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.landmarker = null;
    this.stream = null;
    this.landmarks = null;
    this.lastVideoTime = -1;
    this.prevWristY = null;
    this.prevAt = 0;
    this.controls = { lift: 0, turn: 0, pitch: 0, flap: 0, tracked: false };
  }

  /** 카메라 권한 → 모델 로드. 실패하면 예외를 던진다. */
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();

    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.landmarker?.close();
    this.landmarker = null;
  }

  /** 매 프레임 호출. 최신 조종값을 반환한다. */
  update(nowMs) {
    if (!this.landmarker || this.video.readyState < 2) return this.controls;

    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, nowMs);
      this.landmarks = result.landmarks?.[0] ?? null;
      this.#readControls(nowMs);
    }
    return this.controls;
  }

  #readControls(nowMs) {
    const lm = this.landmarks;
    const c = this.controls;

    const visible =
      lm && NEEDED.every((i) => (lm[i]?.visibility ?? 1) > VISIBILITY);
    if (!visible) {
      // 추적이 끊기면 입력을 서서히 놓아준다 (급추락 방지)
      c.tracked = false;
      c.lift *= 0.9;
      c.turn *= 0.8;
      c.pitch *= 0.8;
      c.flap = 0;
      this.prevWristY = null;
      return;
    }

    const ls = lm[L_SHOULDER], rs = lm[R_SHOULDER];
    const lw = lm[L_WRIST], rw = lm[R_WRIST];
    const shoulderW = Math.hypot(ls.x - rs.x, ls.y - rs.y) || 1e-4;

    // 양력: 양팔을 벌린 정도
    const spread = Math.abs(lw.x - rw.x) / shoulderW;
    const lift = norm01(spread, SPREAD_MIN, SPREAD_MAX);

    // 선회: 화면상 왼쪽 손(이미지 x가 큰 쪽)이 내려가면 좌선회
    const screenLeft = lw.x > rw.x ? lw : rw;
    const screenRight = lw.x > rw.x ? rw : lw;
    const turn = clamp(((screenLeft.y - screenRight.y) / shoulderW) * 2.2, -1, 1);

    // 피치: 손목이 어깨보다 위면 상승
    const shMidY = (ls.y + rs.y) / 2;
    const wrMidY = (lw.y + rw.y) / 2;
    const pitch = clamp(((shMidY - wrMidY) / shoulderW) * 1.8, -1, 1);

    // 날갯짓: 손목이 아래로 내리꽂히는 속도
    let flap = 0;
    const dt = (nowMs - this.prevAt) / 1000;
    if (this.prevWristY !== null && dt > 0 && dt < 0.5) {
      const downSpeed = (wrMidY - this.prevWristY) / shoulderW / dt;
      flap = norm01(downSpeed, 1.6, 5.0);
    }
    this.prevWristY = wrMidY;
    this.prevAt = nowMs;

    c.tracked = true;
    c.lift += (lift - c.lift) * SMOOTH;
    c.turn += (turn - c.turn) * SMOOTH;
    c.pitch += (pitch - c.pitch) * SMOOTH;
    c.flap = Math.max(flap, c.flap * 0.72); // 짧게 붙었다 사라지는 임펄스
  }

  /** 영상 위에 라임색 팔 스켈레톤을 그린다 (캔버스는 CSS로 이미 거울). */
  draw() {
    const { canvas, ctx, video } = this;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const lm = this.landmarks;
    if (!lm || !this.controls.tracked) return;

    // <video>의 object-fit: cover 와 같은 매핑
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.max(w / vw, h / vh);
    const ox = (w - vw * scale) / 2;
    const oy = (h - vh * scale) / 2;
    const px = (p) => p.x * vw * scale + ox;
    const py = (p) => p.y * vh * scale + oy;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(157, 255, 77, 0.85)";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#9dff4d";
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (const [a, b] of ARM_CHAIN) {
      ctx.moveTo(px(lm[a]), py(lm[a]));
      ctx.lineTo(px(lm[b]), py(lm[b]));
    }
    ctx.stroke();

    const dot = (i, r, color) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(px(lm[i]), py(lm[i]), r, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const i of [L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW]) dot(i, 4, "#eaffe0");
    dot(L_WRIST, 6.5, "#ffcc33"); // 날개 끝
    dot(R_WRIST, 6.5, "#ffcc33");
    ctx.shadowBlur = 0;
  }
}
