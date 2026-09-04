/** 화면 위 계기판: 에너지 바, 고도계, 거리/시간, 큰 자막. */
const $ = (id) => document.getElementById(id);

const ALT_GAUGE_MAX = 320;

export class Hud {
  constructor() {
    this.energyFill = $("energy-fill");
    this.altFill = $("alt-fill");
    this.altLabel = $("alt-label");
    this.distLabel = $("dist-label");
    this.timeLabel = $("time-label");
    this.caption = $("caption");
    this.captionUntil = 0;
    this.captionKey = null;
  }

  update(s, nowMs) {
    this.energyFill.style.width = `${(1 - s.energy) * 100}%`;
    this.altFill.style.height = `${Math.min(100, (s.y / ALT_GAUGE_MAX) * 100)}%`;
    this.altLabel.textContent = `${Math.round(s.y)}m`;
    this.distLabel.textContent = `${Math.round(s.distance)}m`;
    this.timeLabel.textContent = `${s.time.toFixed(1)}s`;

    if (this.captionKey && nowMs > this.captionUntil) {
      this.caption.classList.remove("show");
      this.captionKey = null;
    }
  }

  /** key가 같은 자막은 다시 띄우지 않는다 (밀리초 단위 도배 방지). */
  say(text, key = text, holdMs = 1400, color = "#ffffff") {
    if (this.captionKey === key) return;
    this.captionKey = key;
    this.captionUntil = performance.now() + holdMs;
    this.caption.textContent = text;
    this.caption.style.color = color;
    this.caption.classList.add("show");
  }

  clear() {
    this.caption.classList.remove("show");
    this.captionKey = null;
  }
}
