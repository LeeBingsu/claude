/** 시작 화면 → 포즈 추적 → 비행 루프 → 기록 화면. */
import { FlightGame } from "./game.js";
import { Hud } from "./hud.js";

const $ = (id) => document.getElementById(id);
const BEST_KEY = "arm-wing-flight.best";

const els = {
  overlay: $("overlay"),
  panelTitle: $("panel-title"),
  panelOver: $("panel-over"),
  status: $("status"),
  camHint: $("cam-hint"),
  btnStart: $("btn-start"),
  btnKeys: $("btn-keys"),
  btnRetry: $("btn-retry"),
  overTitle: $("over-title"),
  overDist: $("over-dist"),
  overAlt: $("over-alt"),
  overTime: $("over-time"),
  overBest: $("over-best"),
};

const game = new FlightGame($("scene"));
const hud = new Hud();

// 포즈 모듈은 카메라를 켤 때만 불러온다 — 키보드 모드는 이것 없이도 돌아간다
let tracker = null;

const keys = { lift: 0, turn: 0, pitch: 0, flap: 0, tracked: true };
let mode = "pose"; // 'pose' | 'keys'
let running = false;
let lastFrame = 0;
let milestone = 0;

// ── 시작 ──────────────────────────────────────────
els.btnStart.addEventListener("click", async () => {
  els.btnStart.disabled = true;
  els.status.textContent = "카메라와 포즈 모델을 준비하는 중…";
  try {
    const { PoseTracker } = await import("./pose.js");
    tracker = new PoseTracker($("cam"), $("skeleton"));
    await tracker.start();
    els.status.textContent = "";
    mode = "pose";
    beginFlight();
  } catch (err) {
    console.error(err);
    els.status.textContent = `카메라를 열지 못했습니다 (${err.name ?? "오류"}). 키보드로 진행할 수 있어요.`;
  } finally {
    els.btnStart.disabled = false;
  }
});

els.btnKeys.addEventListener("click", () => {
  mode = "keys";
  beginFlight();
});

els.btnRetry.addEventListener("click", beginFlight);

function beginFlight() {
  els.overlay.classList.add("hidden");
  els.panelOver.classList.add("hidden");
  els.panelTitle.classList.remove("hidden");
  hud.clear();
  milestone = 0;
  game.reset();
  hud.say("이륙!", "takeoff", 1200, "#9dff4d");
  els.camHint.classList.toggle("hidden", mode !== "keys");
  if (mode === "keys") els.camHint.textContent = "← → 선회 · ↑ 상승 · Space 날개 펴기 · Shift 날갯짓";
  if (!running) {
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }
}

// ── 메인 루프 ─────────────────────────────────────
function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  let ctrl = keys;
  if (mode === "pose" && tracker) {
    ctrl = tracker.update(now);
    tracker.draw();
    els.camHint.classList.toggle("hidden", ctrl.tracked);
    if (!ctrl.tracked) els.camHint.textContent = "상반신이 다 보이도록 뒤로 물러나세요";
  }

  const crashed = game.update(dt, ctrl);
  const s = game.state;
  hud.update(s, now);
  coach(s, ctrl);
  game.render();

  if (crashed) {
    running = false;
    showResult(s);
    return;
  }
  requestAnimationFrame(loop);
}

/** 상황에 맞는 큰 자막 한 줄. */
function coach(s, ctrl) {
  if (s.energy <= 0.001) {
    hud.say("팔 내려서 회복!", "exhausted", 900, "#ff6b6b");
    return;
  }
  if (s.y < 26 && s.vy < 0) {
    hud.say("팔 벌려!", "low", 800, "#ffcc33");
    return;
  }
  const next = Math.floor(s.distance / 500) * 500;
  if (next > milestone) {
    milestone = next;
    hud.say(`${next}m 돌파`, `ms${next}`, 1200, "#9dff4d");
  }
}

function showResult(s) {
  const dist = Math.round(s.distance);
  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  const isBest = dist > best;
  if (isBest) localStorage.setItem(BEST_KEY, String(dist));

  els.overTitle.textContent = s.y <= 3 ? "불시착!" : "충돌!";
  els.overDist.textContent = dist;
  els.overAlt.textContent = Math.round(s.maxAlt);
  els.overTime.textContent = s.time.toFixed(1);
  els.overBest.textContent = isBest
    ? "🏆 최고 기록 경신!"
    : best
      ? `최고 기록 ${best}m`
      : "";

  els.panelTitle.classList.add("hidden");
  els.panelOver.classList.remove("hidden");
  els.overlay.classList.remove("hidden");
}

// ── 키보드 대체 조작 ──────────────────────────────
const held = new Set();

addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  held.add(e.code);
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.flap = 1;
  applyKeys();
});

addEventListener("keyup", (e) => {
  held.delete(e.code);
  applyKeys();
});

function applyKeys() {
  keys.lift = held.has("Space") ? 1 : 0;
  keys.pitch =
    (held.has("ArrowUp") ? 1 : 0) - (held.has("ArrowDown") ? 1 : 0);
  keys.turn =
    (held.has("ArrowLeft") ? 1 : 0) - (held.has("ArrowRight") ? 1 : 0);
}

// flap은 임펄스라 매 프레임 서서히 사라진다
setInterval(() => {
  keys.flap *= 0.75;
}, 60);

addEventListener("resize", () => {
  if (!running) game.render();
});
