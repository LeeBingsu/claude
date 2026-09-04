/**
 * 도시 상공 비행 시뮬레이션.
 * 조종 입력 { lift, turn, pitch, flap } 만 받아서 물리 → 렌더까지 처리한다.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ── 물리 상수 (미터, 초) ─────────────────────────
const BASE_SPEED = 34;
const BOOST_SPEED = 26;
const GRAVITY = 15.6;
const LIFT_ACCEL = 20.5;
const PITCH_ACCEL = 13;
const FLAP_IMPULSE = 15;
const TURN_RATE = 1.15;
const DRAG_K = 0.75; // 수직 속도 감쇠 (프레임 수와 무관)
const THIN_AIR_FROM = 240; // 이 고도부터 양력이 줄어든다
const CRASH_ALT = 2.5;
const HULL_RADIUS = 2.6;

// ── 체력(에너지) ────────────────────────────────
const DRAIN_LIFT = 0.085;
const DRAIN_FLAP = 0.55;
const REGEN = 0.3;
const RELAXED = 0.25; // 팔을 이 밑으로 내리면 회복
const EXHAUSTED_LIFT = 0.45;

// ── 도시 ────────────────────────────────────────
const COUNT = 240;
const LANES = [-92, -69, -46, -23, 0, 23, 46, 69, 92];
const LANE_GAP = 23;
const ROW_GAP = 27;
const RECYCLE_BEHIND = 70;
const START_ALT = 130;
const SKYLINE_START = -200; // 이륙 직후 잠깐은 하늘만
const PALETTE = [0x8f8aa8, 0xa79fb5, 0xc4b7ad, 0x6f6a86, 0xb9aec4, 0x8b8194];

export class FlightGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xd9c7e4, 130, 620);
    this.scene.background = makeSkyTexture();

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.5, 1400);

    this.scene.add(new THREE.AmbientLight(0xb9aecb, 0.55));
    this.scene.add(new THREE.HemisphereLight(0xfff0f6, 0x4a4460, 0.9));
    const sun = new THREE.DirectionalLight(0xfff2e0, 1.5);
    sun.position.set(-120, 220, 80);
    this.scene.add(sun);

    this.#buildGround();
    this.#buildCity();
    this.#buildPlane();

    this._fwd = new THREE.Vector3();
    this._want = new THREE.Vector3();

    this.state = null;
    this.reset();
  }

  // ── 씬 구성 ───────────────────────────────────
  #buildGround() {
    const tex = makeStreetTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24000, 24000),
      new THREE.MeshLambertMaterial({ map: tex })
    );
    ground.rotation.x = -Math.PI / 2;
    this.ground = ground;
    this.scene.add(ground);
  }

  #buildCity() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0); // 바닥을 원점에 맞춘다
    // vertexColors + instanceColor 조합에서 정점 색이 비어 검게 나오지 않도록 흰색으로 채운다
    const white = new Float32Array(geo.attributes.position.count * 3).fill(1);
    geo.setAttribute("color", new THREE.BufferAttribute(white, 3));
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.city = new THREE.InstancedMesh(geo, mat, COUNT);
    this.city.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.city.frustumCulled = false;
    this.scene.add(this.city);

    this.boxes = Array.from({ length: COUNT }, () => ({ x: 0, z: 0, w: 0, d: 0, h: 0 }));
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
  }

  #buildPlane() {
    const plane = new THREE.Group();
    plane.rotation.order = "YXZ";

    const white = new THREE.MeshLambertMaterial({ color: 0xf7f9ff });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 3.6, 4, 12), white);
    body.rotation.x = Math.PI / 2;
    plane.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.5, 12), white);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -3.1;
    plane.add(nose);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.16, 1.5), white);
    wing.position.set(0, -0.15, 0.3);
    plane.add(wing);

    const stab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.8), white);
    stab.position.set(0, 0.35, 2.3);
    plane.add(stab);

    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1.5, 1.1),
      new THREE.MeshLambertMaterial({ color: 0xe4453f })
    );
    fin.position.set(0, 1.0, 2.3);
    plane.add(fin);

    const engineMat = new THREE.MeshLambertMaterial({ color: 0x3aa0e0 });
    for (const sx of [-2.6, 2.6]) {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.3, 10), engineMat);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(sx, -0.45, 0.4);
      plane.add(eng);
    }

    this.plane = plane;
    this.scene.add(plane);
  }

  // ── 라이프사이클 ──────────────────────────────
  reset() {
    this.state = {
      x: 0,
      y: START_ALT,
      z: 0,
      vy: 0,
      yaw: 0,
      roll: 0,
      pitchAngle: 0,
      speed: BASE_SPEED,
      energy: 1,
      time: 0,
      distance: 0,
      maxAlt: START_ALT,
      crashed: false,
    };
    for (let i = 0; i < COUNT; i++) {
      this.#seedBox(i, SKYLINE_START - Math.floor(i / LANES.length) * ROW_GAP);
    }
    this.#syncCity();
    this.#syncPlane();
    this.#placeCamera(true);
    this.renderer.render(this.scene, this.camera);
  }

  /** dt(초)만큼 진행. 충돌하면 true를 돌려준다. */
  update(dt, ctrl) {
    const s = this.state;
    if (s.crashed) return true;

    s.time += dt;

    // 체력: 팔을 벌리고 있으면 닳고, 내리면 회복한다
    const effort = DRAIN_LIFT * ctrl.lift + DRAIN_FLAP * ctrl.flap;
    s.energy += (ctrl.lift < RELAXED ? REGEN : -effort) * dt;
    s.energy = Math.min(1, Math.max(0, s.energy));

    // 양력 — 지친 상태이거나 공기가 희박하면 약해진다
    const stamina = s.energy > 0 ? 1 : EXHAUSTED_LIFT;
    const thin = s.y > THIN_AIR_FROM ? Math.max(0.25, 1 - (s.y - THIN_AIR_FROM) / 260) : 1;
    s.vy += (ctrl.lift * LIFT_ACCEL * stamina * thin - GRAVITY) * dt;
    s.vy += ctrl.pitch * PITCH_ACCEL * dt;
    s.vy += ctrl.flap * FLAP_IMPULSE * stamina * dt;
    s.vy *= Math.exp(-DRAG_K * dt);

    // 선회 (turn > 0 이면 좌선회)
    s.yaw += ctrl.turn * TURN_RATE * dt;
    s.roll += (ctrl.turn * 0.52 - s.roll) * Math.min(1, 6 * dt);
    s.pitchAngle += (clampf(s.vy / 40, -0.5, 0.5) - s.pitchAngle) * Math.min(1, 5 * dt);

    // 추진: 날갯짓과 급강하가 속도를 준다
    const target = BASE_SPEED + BOOST_SPEED * ctrl.flap + clampf(-s.vy / 8, 0, 10);
    s.speed += (target - s.speed) * Math.min(1, 2.2 * dt);

    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    s.x += fx * s.speed * dt;
    s.z += fz * s.speed * dt;
    s.y += s.vy * dt;

    s.distance = Math.max(s.distance, -s.z);
    s.maxAlt = Math.max(s.maxAlt, s.y);

    this.#recycleCity();
    if (s.y < CRASH_ALT || this.#hitsBuilding()) {
      s.y = Math.max(s.y, CRASH_ALT);
      s.crashed = true;
    }

    this.#syncPlane();
    this.#placeCamera(false, dt);
    return s.crashed;
  }

  render() {
    this.#resize();
    this.renderer.render(this.scene, this.camera);
  }

  // ── 내부 ──────────────────────────────────────
  #seedBox(i, z, xAnchor = 0) {
    const b = this.boxes[i];
    b.x = xAnchor + LANES[i % LANES.length] + (Math.random() - 0.5) * 9;
    b.z = z + (Math.random() - 0.5) * 8;
    b.w = 11 + Math.random() * 6;
    b.d = 11 + Math.random() * 6;
    const roll = Math.random();
    b.h = roll < 0.1 ? 165 + Math.random() * 95 : roll < 0.3 ? 95 + Math.random() * 70 : 22 + Math.random() * 70;
    this.color.setHex(PALETTE[(Math.random() * PALETTE.length) | 0]);
    this.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
    this.city.setColorAt(i, this.color);
  }

  #syncCity() {
    for (let i = 0; i < COUNT; i++) {
      const b = this.boxes[i];
      this.dummy.position.set(b.x, 0, b.z);
      this.dummy.scale.set(b.w, b.h, b.d);
      this.dummy.updateMatrix();
      this.city.setMatrixAt(i, this.dummy.matrix);
    }
    this.city.instanceMatrix.needsUpdate = true;
    if (this.city.instanceColor) this.city.instanceColor.needsUpdate = true;
  }

  /** 뒤로 지나간 건물을 앞쪽 끝으로 옮겨 무한한 도시를 만든다. */
  #recycleCity() {
    const s = this.state;
    let minZ = Infinity;
    for (const b of this.boxes) if (b.z < minZ) minZ = b.z;

    const xAnchor = Math.round(s.x / LANE_GAP) * LANE_GAP; // 항로를 따라 도시도 옆으로 이어붙인다
    let moved = false;
    for (let i = 0; i < COUNT; i++) {
      if (this.boxes[i].z > s.z + RECYCLE_BEHIND) {
        minZ -= ROW_GAP / LANES.length;
        this.#seedBox(i, minZ, xAnchor);
        moved = true;
      }
    }
    if (moved) this.#syncCity();
  }

  #hitsBuilding() {
    const s = this.state;
    for (const b of this.boxes) {
      if (Math.abs(b.z - s.z) > b.d / 2 + HULL_RADIUS) continue;
      if (Math.abs(b.x - s.x) > b.w / 2 + HULL_RADIUS) continue;
      if (s.y < b.h + HULL_RADIUS) return true;
    }
    return false;
  }

  #syncPlane() {
    const s = this.state;
    this.plane.position.set(s.x, s.y, s.z);
    this.plane.rotation.set(s.pitchAngle, s.yaw, s.roll);
  }

  #placeCamera(snap, dt = 0) {
    const s = this.state;
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);

    this._fwd.set(fx, 0, fz);
    this._want.set(s.x - fx * 17, s.y + 3.9, s.z - fz * 17);
    if (snap) this.camera.position.copy(this._want);
    else this.camera.position.lerp(this._want, Math.min(1, 6 * dt));

    // 선회 시 카메라도 살짝 같이 기운다 (진행 방향 축으로 회전)
    this.camera.up.set(0, 1, 0).applyAxisAngle(this._fwd, s.roll * 0.4);
    this.camera.lookAt(s.x + fx * 26, s.y + 2.2, s.z + fz * 26);
  }

  #resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }
}

function clampf(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 위쪽은 보랏빛, 지평선은 뿌연 분홍인 하늘. */
function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#6f78c8");
  grad.addColorStop(0.42, "#c3b3e2");
  grad.addColorStop(0.56, "#efd8e4");
  grad.addColorStop(1.0, "#d7c6d8");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 격자 도로가 그려진 바닥 타일. */
function makeStreetTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#4a4557";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "#565165";
  g.lineWidth = 10;
  g.strokeRect(0, 0, 128, 128);
  g.strokeStyle = "#8f8aa0";
  g.lineWidth = 2;
  g.setLineDash([8, 10]);
  g.beginPath();
  g.moveTo(0, 5);
  g.lineTo(128, 5);
  g.moveTo(5, 0);
  g.lineTo(5, 128);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(960, 960);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
