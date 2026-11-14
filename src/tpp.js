// Kamera za bohaterem (TPP) i ruch WASD względem kamery — przeniesione z zaakceptowanego dema.
import * as THREE from 'three';
import { camera, input, key, clamp, lerp, damp, angLerp, V, BASE_FOV } from './core.js';
import { footstep } from './sfx.js';

const back = V(), camTarget = V(), camWant = V(), right = V(), camRay = new THREE.Raycaster();

export class TPP {
  constructor(w, char, { speed = 1.9, run = 4.6, height = 1.1, dist = 4.2, bounds = null } = {}) {
    Object.assign(this, { w, char, speed, runSpeed: run, height, dist, bounds });
    this.pos = V(); this.yaw = Math.PI; this.camYaw = 0; this.camPitch = 0.28;
    this.running = false; this.moving = false; this.extra = [];
    this.curDist = dist; this.shoulder = 0; this.fov = BASE_FOV; this.shake = 0;
    this.anims = { idle: 'idle', walk: 'walk', run: 'run' };
    // kroki: długość kroku [m], głośność, wysokość dźwięku (mały hobbit = wyżej), podłoże
    this.step = { len: height < 1.2 ? 0.5 : 0.75, vol: 0.45, rate: height < 1.2 ? 1.15 : 0.95, surface: () => (this.running ? 'leaves' : 'grass') };
    this.stride = 0;
  }
  reset(x, z, yaw = Math.PI) { this.pos.set(x, 0, z); this.yaw = yaw; this.camYaw = yaw - Math.PI; this.camPitch = 0.28; this.place(); }
  look() {
    this.camYaw -= input.dx * 0.0025;
    this.camPitch = clamp(this.camPitch + input.dy * 0.0022, -0.1, 1.1);
  }
  // ruch względem kamery; zwraca wektor ruchu (lub null)
  move(dt, { canRun = true, anim = true, speed = null, face = true } = {}) {
    const f = (key('KeyW', 'ArrowUp') ? 1 : 0) - (key('KeyS', 'ArrowDown') ? 1 : 0);
    const r = (key('KeyD', 'ArrowRight') ? 1 : 0) - (key('KeyA', 'ArrowLeft') ? 1 : 0);
    this.moving = !!(f || r);
    if (!this.moving) { this.running = false; if (anim) this.char.play(this.anims.idle); return null; }
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw), len = Math.hypot(f, r);
    const mx = (fx * f - fz * r) / len, mz = (fz * f + fx * r) / len;
    this.running = canRun && key('ShiftLeft', 'ShiftRight');
    const sp = speed ?? (this.running ? this.runSpeed : this.speed);
    this.pos.x += mx * sp * dt; this.pos.z += mz * sp * dt;
    this.stride += sp * dt;
    if (this.stride > this.step.len * (this.running ? 1.5 : 1)) {
      this.stride = 0;
      footstep(this.step.surface(), { vol: this.step.vol * (this.running ? 1.6 : 1), rate: this.step.rate });
    }
    if (face) this.yaw = angLerp(this.yaw, Math.atan2(mx, mz), damp(12, dt));
    if (anim) this.char.play(this.running ? this.anims.run : this.anims.walk);
    this.collide();
    return { x: mx, z: mz };
  }
  collide() {
    const b = this.bounds;
    if (b) { this.pos.x = clamp(this.pos.x, b[0], b[1]); this.pos.z = clamp(this.pos.z, b[2], b[3]); }
    for (const k of [...this.w.rocks, ...this.extra]) {
      const dx = this.pos.x - k.x, dz = this.pos.z - k.z, d = Math.hypot(dx, dz), m = k.r * 0.95 + 0.3;
      if (d < m && d > 0) { this.pos.x = k.x + dx / d * m; this.pos.z = k.z + dz / d * m; }
    }
  }
  groundY() { return this.w.h(this.pos.x, this.pos.z); }
  place(y = null) {
    this.char.root.position.set(this.pos.x, y ?? this.groundY(), this.pos.z);
    this.char.root.rotation.y = this.yaw;
  }
  // kamera za plecami; skała między bohaterem a kamerą przybliża kamerę; shoulder = przesunięcie w prawo (celowanie)
  camera(dt, { dist = this.dist, shoulder = 0, fov = BASE_FOV, y = null } = {}) {
    const k = damp(10, dt);
    this.curDist = lerp(this.curDist, dist, k); this.shoulder = lerp(this.shoulder, shoulder, k); this.fov = lerp(this.fov, fov, k);
    if (Math.abs(camera.fov - this.fov) > 0.01) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
    const baseY = y ?? this.char.root.position.y;
    camTarget.set(this.pos.x, baseY + this.height * 1.05, this.pos.z);
    right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw));
    camTarget.addScaledVector(right, this.shoulder);
    back.set(Math.sin(this.camYaw) * Math.cos(this.camPitch), Math.sin(this.camPitch), Math.cos(this.camYaw) * Math.cos(this.camPitch));
    camRay.set(camTarget, back); camRay.far = this.curDist;
    const hit = camRay.intersectObjects(this.w.rockMeshes.concat(this.w.camBlock || []), false)[0];
    const d = hit ? Math.max(0.6, hit.distance - 0.3) : this.curDist;
    camWant.copy(camTarget).addScaledVector(back, d);
    camWant.y = Math.max(camWant.y, this.w.h(camWant.x, camWant.z) + 0.3);
    const s = this.shake;
    camera.position.copy(camWant).add(V((Math.random() - 0.5) * 2 * s, (Math.random() - 0.5) * 2 * s, 0));
    camera.lookAt(camTarget);
    this.shake = Math.max(0, this.shake - dt * 0.6);
    this.w.focus.copy(this.pos);
    // światło od strony kamery: bohater czytelny także w cieniu skały
    this.w.fill.intensity = 14;
    this.w.fill.position.copy(camTarget).addScaledVector(back, 1.8).y += 0.9;
  }
  // kierunek patrzenia kamery (do przodu, poziomo)
  get viewYaw() { return this.camYaw + Math.PI; }
}
