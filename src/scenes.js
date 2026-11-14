// Scenki fabularne: postacie 3D, powolny ruch kamery, pasek narracji lub dialogu.
// Jeśli istnieje assets/plansze/<id>.jpg, scenka pokazuje ilustrację zamiast 3D (podmiana bez zmian w kodzie).
import * as THREE from 'three';
import { $, camera, setMode, BASE_FOV, rnd, lerp, V, damp, angLerp, frameShift } from './core.js';
import { nightWorld, terrain, grass, pines, makeRock, mountain, glow, fire, torch, smokeColumn, water, hills, battlefield, gateAndCamp, makeGem, fillAt, canvasTex } from './env.js';
import { Char, Rider, makeBow, makeArrow } from './chars.js';
import { dialog, hideDialog, fade, waiter, show } from './ui.js';
import { sfx, music, amb } from './sfx.js';

// ---------- ilustracje zamiast scenek 3D ----------
const IMG = {};
// lista ilustracji zapisuje build (dist/assets/plansze/lista.js)
export function probeImages(ids) {
  for (const id of window.PLANSZE || []) if (ids.includes(id)) IMG[id] = `assets/plansze/${id}.jpg`;
}
export const hasImage = id => !!IMG[id];

// ---------- kontekst scenki ----------
const smoothstep = k => k * k * (3 - 2 * k);
export function makeCtx(w) {
  w.fill.distance = 16;
  const ctx = {
    w, t: 0, actors: [], tasks: [], duels: [], arrows: [],
    cam: { p0: V(), p1: V(), l0: V(), l1: V(), t: 0, dur: 1 }, look: V(), fill: 22,
    add(kind, x, z, yaw = 0, anim = 'idle', o = {}) {
      const c = kind === 'rider' ? new Rider() : new Char(kind, o);
      c.root.position.set(x, o.y ?? w.h(x, z), z); c.root.rotation.y = yaw;
      if (anim === 'death') c.warg ? (c.warg.pose('death'), c.gob.pose('death')) : c.pose('death');
      else if (anim) c.play(anim, { fade: 0 });
      w.scene.add(c.root); ctx.actors.push(c);
      return c;
    },
    // ruch kamery: z bieżącego miejsca (albo z `from`) do `to` w `dur` sekund
    camTo(to, look, dur = 6, from = null, lookFrom = null) {
      const c = ctx.cam;
      c.p0.copy(from ? V(...from) : camera.position); c.l0.copy(lookFrom ? V(...lookFrom) : ctx.look);
      c.p1.set(...to); c.l1.set(...look); c.t = 0; c.dur = Math.max(0.001, dur);
    },
    cut(pos, look) { ctx.camTo(pos, look, 0.001, pos, look); camera.position.set(...pos); ctx.look.set(...look); camera.lookAt(ctx.look); },
    // chód do punktu (prosty, bez omijania przeszkód)
    walk(c, x, z, speed = 1.3, then = 'idle', anim = 'walk') { ctx.tasks = ctx.tasks.filter(t => t.c !== c); ctx.tasks.push({ c, x, z, speed, then }); c.play(anim); },
    after(s, f) { ctx.tasks.push({ at: ctx.t + s, f }); },
    // para walczących: na zmianę cios i "trafienie"
    duel(ka, kb, x, z, yaw, o = {}) {
      const dx = Math.sin(yaw) * 0.85, dz = Math.cos(yaw) * 0.85;
      const a = ctx.add(ka, x - dx, z - dz, yaw, 'guard', o.a), b = ctx.add(kb, x + dx, z + dz, yaw + Math.PI, 'guard', o.b);
      const d = { a, b, t: rnd(0, 1.5), turn: 0 }; ctx.duels.push(d); return d;
    },
    shoot(from, to, dur, onHit) {
      const a = makeArrow(0.8); w.scene.add(a);
      ctx.arrows.push({ a, from: from.clone(), to: to.clone(), t: 0, dur, onHit, arc: from.distanceTo(to) * 0.08 });
      sfx('bow');
    },
  };
  return ctx;
}
function tick(ctx, dt) {
  const c = ctx.cam; c.t += dt;
  const k = smoothstep(Math.min(1, c.t / c.dur));
  camera.position.lerpVectors(c.p0, c.p1, k); ctx.look.lerpVectors(c.l0, c.l1, k);
  camera.lookAt(ctx.look);
  tickActors(ctx, dt);
  ctx.w.focus.copy(ctx.look).setY(0);
  fillAt(ctx.w, ctx.look, ctx.fill, 2.2);
  ctx.w.update(dt, ctx.t);
}
// aktorzy, zadania, pojedynki, strzały (używane też w etapach jako tło bitwy)
export function tickActors(ctx, dt) {
  ctx.t += dt;
  for (const task of [...ctx.tasks]) {
    if (task.f) { if (ctx.t >= task.at) { ctx.tasks.splice(ctx.tasks.indexOf(task), 1); task.f(ctx); } continue; }
    const p = task.c.root.position, dx = task.x - p.x, dz = task.z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.1) { ctx.tasks.splice(ctx.tasks.indexOf(task), 1); if (task.then) task.c.play(task.then); continue; }
    const s = Math.min(d, task.speed * dt);
    p.x += dx / d * s; p.z += dz / d * s; p.y = ctx.w.h(p.x, p.z) + (task.c.yOff || 0);
    task.c.root.rotation.y = angLerp(task.c.root.rotation.y, Math.atan2(dx, dz), damp(8, dt));
  }
  for (const d of ctx.duels) {
    if (d.stop) continue;
    d.t -= dt;
    if (d.t <= 0) {
      const [att, def] = d.turn ? [d.b, d.a] : [d.a, d.b];
      att.play('attack', { once: true, then: 'guard', fade: 0.15 });
      setTimeout(() => !d.stop && def.play('hit', { once: true, then: 'guard', fade: 0.1 }), 380);
      d.turn ^= 1; d.t = rnd(1.3, 2.0);
    }
  }
  for (const ar of [...ctx.arrows]) {
    ar.t += dt; const k2 = Math.min(1, ar.t / ar.dur);
    const p = V().lerpVectors(ar.from, ar.to, k2); p.y += Math.sin(k2 * Math.PI) * ar.arc;
    const p2 = V().lerpVectors(ar.from, ar.to, Math.min(1, k2 + 0.02)); p2.y += Math.sin(Math.min(1, k2 + 0.02) * Math.PI) * ar.arc;
    ar.a.position.copy(p); if (k2 < 1) ar.a.lookAt(p2);
    if (k2 >= 1 && !ar.done) { ar.done = true; ar.a.visible = false; ar.onHit && ar.onHit(ctx); }
  }
  for (const a of ctx.actors) a.update(dt);
}

// ---------- grupy postaci ----------
export function dwarfGroup(ctx, x, z, yaw, { thorin = true, anim = 'idle', n = 12, gap = 1.25 } = {}) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const out = { dwarves: [] };
  if (thorin) out.thorin = ctx.add('thorin', x, z, yaw, anim);
  for (let i = 0; i < n; i++) {
    const row = 1 + Math.floor(i / 4), col = (i % 4) - 1.5 + (row % 2) * 0.3;
    const px = x - fx * row * gap + rx * col * gap, pz = z - fz * row * gap + rz * col * gap;
    out.dwarves.push(ctx.add('dwarf', px, pz, yaw + rnd(-0.2, 0.2), anim, { i }));
  }
  return out;
}
function crowd(ctx, kinds, x, z, yaw, n, spread = 3.5, anim = 'idle') {
  const list = [];
  for (let i = 0; i < n; i++) {
    const k = kinds[i % kinds.length];
    list.push(ctx.add(k, x + rnd(-spread, spread), z + rnd(-spread * 0.5, spread * 0.5), yaw + rnd(-0.25, 0.25), anim, { i }));
  }
  return list;
}
function archerOnRock(ctx, x, z, yaw, rock = 0) {
  if (rock) makeRock(ctx.w, x, z, rock, true, false);
  const top = ctx.w.h(x, z) + (rock ? rock * 0.85 : 1.7);
  const g = ctx.add('goblin', x, z, yaw, 'idle', { y: top });
  g.orcWeapon = g.model.getObjectByName('Orc_Weapon'); if (g.orcWeapon) g.orcWeapon.visible = false;
  const bow = makeBow(1.15); bow.position.set(-0.3, 0.85, 0.5); g.root.add(bow);
  const ar = makeArrow(0.8); ar.position.set(-0.3, 0.85, 0.3); g.root.add(ar); g.nocked = ar;
  return g;
}

// ---------- lokacje scenek ----------
function shire(w) {
  w.scene.fog.density = 0.03;
  terrain(w, { x1: -60, x2: 60, z1: -60, z2: 50, step: 1, color: 0x141e16, h: (x, z) => hills(x, z) * 0.5 + 5 * Math.exp(-(x * x + (z - 14) * (z - 14)) / 70) });
  grass(w, { n: 7000, x1: -25, x2: 25, z1: -25, z2: 25, color: 0x1c3020 });
  pines(w, 80, () => { const s = Math.random() < 0.5 ? -1 : 1; return [s * rnd(18, 50), rnd(-40, 40)]; });
  const earth = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 });
  const front = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 1.6), earth); front.position.set(0, 1.4, 6.6); front.receiveShadow = true; w.scene.add(front);
  // okrągłe zielone drzwi z mosiężną gałką
  const door = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x2f7a3a, roughness: 0.6, emissive: 0x0c2410 }));
  door.rotation.x = Math.PI / 2; door.position.set(0, 1.05, 5.82); w.scene.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd4a83a, metalness: 0.8, roughness: 0.3, emissive: 0x3a2a08 }));
  knob.position.set(0, 1.05, 5.72); w.scene.add(knob);
  [-2.6, 2.6].forEach(x => {
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0xffc070 }));
    win.position.set(x, 1.4, 5.79); w.scene.add(win);
    const g = glow(0xffa040, 2.2, true, 0.7); g.position.set(x, 1.4, 5.6); w.scene.add(g);
  });
  const l = new THREE.PointLight(0xffb060, 10, 14, 1.6); l.position.set(0, 2.4, 4.6); w.scene.add(l);
  // ścieżka i płotek
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 26), new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 1 }));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, -7); w.scene.add(path);
  for (let z = -12; z < 4; z += 1.6) [-1.6, 1.6].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), earth); p.position.set(x, w.h(x, z) + 0.4, z); w.scene.add(p); });
  w.h = () => 0.02;
}
function laketown(w) {
  w.scene.fog.color.setHex(0x14100e); w.scene.fog.density = 0.028;
  water(w, -200, 200, -200, 200, 0);
  const char = new THREE.MeshStandardMaterial({ color: 0x15100c, roughness: 1, emissive: 0x200a02 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 });
  w.h = () => 1.0;
  for (let i = 0; i < 22; i++) {
    const x = rnd(-26, 26), z = rnd(-40, -16), sx = rnd(3, 6), sz = rnd(3, 5);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 5), wood); p.position.set(x + ox * sx / 2.3, 0, z + oz * sz / 2.3); w.scene.add(p); }
    const fl = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.2, sz), char); fl.position.set(x, 1, z); w.scene.add(fl);
    const hgt = rnd(1, 3.5);
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(sx, hgt, 0.2), char); wall1.position.set(x, 1 + hgt / 2, z - sz / 2); wall1.rotation.z = rnd(-0.15, 0.15); w.scene.add(wall1);
    if (i % 2) { const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, hgt * 0.7, sz), char); wall2.position.set(x + sx / 2, 1 + hgt * 0.35, z); w.scene.add(wall2); }
  }
  [[-10, -24, 30], [8, -30, 26], [18, -20, 0], [-20, -34, 0], [0, -38, 0]].forEach(([x, z, l], i) => fire(w, x, z, { light: l, dist: 40, beacon: true, smoke: i < 3, scale: 1.6, sparks: 80 }));
  // pomost, na którym stoi Bard
  const pier = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 14), wood); pier.position.set(0, 0.9, -1); w.scene.add(pier);
  // martwy smok w wodzie
  const dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), dark); body.scale.set(5, 2.4, 13); body.position.set(26, 0, -46); body.rotation.y = 0.5; w.scene.add(body);
  const wing = new THREE.Mesh(new THREE.ConeGeometry(5, 9, 3), dark); wing.position.set(23, 3, -44); wing.rotation.set(0.3, 0.4, -0.6); w.scene.add(wing);
  mountain(w, -40, 50, -320, 180, 150);
}
function hall(w) {
  w.scene.fog.color.setHex(0x0a0705); w.scene.fog.density = 0.035; w.hemi.intensity = 0.5; w.moon.intensity = 0;
  w.scene.background = new THREE.Color(0x050403);
  const stone = new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), stone); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; w.scene.add(floor);
  for (let z = -4; z >= -44; z -= 8) [-9, 9].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 2), stone); p.position.set(x, 9, z); w.scene.add(p); });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc8962a, metalness: 0.85, roughness: 0.35, emissive: 0x3a2808 });
  const heaps = [[0, -14, 6, 2.6], [-5.5, -21, 5, 2.2], [6, -22, 5.5, 2.4], [0, -30, 8, 3.4]];
  heaps.forEach(([x, z, r, h]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24, 1), gold); m.position.set(x, h / 2, z); w.scene.add(m); });
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 8), gold, 900), o = new THREE.Object3D();
  for (let i = 0; i < 900; i++) {
    const [x, z, r, h] = heaps[i % 4], a = rnd(0, 6.3), d = rnd(0, r * 1.2);
    o.position.set(x + Math.cos(a) * d, Math.max(0.01, h * (1 - d / r)) + 0.01, z + Math.sin(a) * d); o.rotation.set(rnd(-1, 1), 0, rnd(-1, 1)); o.updateMatrix(); coins.setMatrixAt(i, o.matrix);
  }
  w.scene.add(coins);
  const l1 = new THREE.PointLight(0xffb060, 40, 40, 1.4); l1.position.set(0, 7, -8); w.scene.add(l1);
  const l2 = new THREE.PointLight(0xffa040, 25, 30, 1.4); l2.position.set(-6, 5, -24); w.scene.add(l2);
  const sparks = Array.from({ length: 30 }, () => { const s = glow(0xffe0a0, 0.3); const [x, z, r, h] = heaps[Math.floor(rnd(0, 4))], d = rnd(0, r); s.position.set(x + rnd(-d, d), h * (1 - d / r) + 0.1, z + rnd(-1, 1)); w.scene.add(s); return s; });
  w.ups.push((dt, t) => sparks.forEach((s, i) => s.material.opacity = Math.max(0, Math.sin(t * 2 + i * 1.7))));
  [[-8, -6], [8, -6], [-8, -18], [8, -18]].forEach(([x, z]) => { const f = glow(0xffa040, 1.2); f.position.set(x * 0.85, 3.5, z); w.scene.add(f); });
  w.h = () => 0;
}
function tentInside(w) {
  w.scene.fog.color.setHex(0x0a0604); w.scene.fog.density = 0.02; w.hemi.intensity = 0.35; w.moon.intensity = 0;
  w.scene.background = new THREE.Color(0x050302);
  const cloth = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 1, side: THREE.BackSide });
  const t = new THREE.Mesh(new THREE.ConeGeometry(7, 6.5, 8, 1, true), cloth); t.position.y = 3.25; w.scene.add(t);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshStandardMaterial({ color: 0x2a2016, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; w.scene.add(floor);
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; w.scene.add(m); return m; };
  // łóżko z brył
  add(new THREE.BoxGeometry(1.3, 0.35, 2.4), wood, 1.8, 0.18, -1);
  add(new THREE.BoxGeometry(1.15, 0.15, 2.2), new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 1 }), 1.8, 0.43, -1);
  add(new THREE.BoxGeometry(0.7, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 1 }), 1.8, 0.61, -1.66);
  add(new THREE.BoxGeometry(1.4, 0.6, 0.12), wood, 1.8, 0.5, -2.2);
  // koc: zaokrąglona płachta (pół walca) od piersi do stóp
  const blanket = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 1.42, 20, 1, true, -Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2c3a5a, roughness: 1, side: THREE.DoubleSide }));
  blanket.rotation.x = -Math.PI / 2; blanket.scale.z = 0.62; blanket.position.set(1.8, 0.5, -0.4); blanket.receiveShadow = true; w.scene.add(blanket);
  [-0.4 - 0.71, -0.4 + 0.71].forEach(z => {   // domknięte końce koca
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.66, 20, 0, Math.PI), blanket.material);
    cap.scale.y = 0.62; cap.position.set(1.8, 0.5, z); w.scene.add(cap);
  });
  // stół ze świecą, posłanie Bilba
  add(new THREE.BoxGeometry(0.9, 0.7, 0.9), wood, -0.4, 0.35, -2.4);
  add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xeee8d0, emissive: 0x333020 }), -0.4, 0.8, -2.4);
  const fl = glow(0xffb050, 0.5); fl.position.set(-0.4, 0.95, -2.4); w.scene.add(fl);
  const cl = new THREE.PointLight(0xffa850, 14, 12, 1.5); cl.position.set(-0.4, 1.2, -2.3); cl.castShadow = true; cl.shadow.mapSize.set(512, 512); w.scene.add(cl);
  const cl2 = new THREE.PointLight(0xffa850, 6, 10, 1.5); cl2.position.set(3.2, 1.5, 0.8); w.scene.add(cl2);
  add(new THREE.BoxGeometry(1.0, 0.08, 2.0), new THREE.MeshStandardMaterial({ color: 0x5a4a30, roughness: 1 }), -2.2, 0.04, 0.6);
  w.ups.push((dt, t) => { cl.intensity = 14 * (0.92 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23) * 0.03); fl.scale.set(0.5, 0.7 + Math.sin(t * 13) * 0.08, 1); });
  w.h = () => 0;
}
// smok-sylwetka krążący nad Górą (intro)
function dragon(w, cx, cy, cz, r) {
  const m = new THREE.MeshBasicMaterial({ color: 0x050608, fog: false, side: THREE.DoubleSide });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(2.2, 22, 6), m); body.rotation.x = Math.PI / 2; g.add(body);
  const neck = new THREE.Mesh(new THREE.ConeGeometry(1, 9, 5), m); neck.rotation.x = -Math.PI / 2 + 0.2; neck.position.set(0, 0.6, 13); g.add(neck);
  const wingGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 4, 0, 0, -6, 20, 0, -2, 0, 0, 4, 20, 0, -2, 14, 0, 6], 3));
  const wl = new THREE.Mesh(wingGeo, m), wr = new THREE.Mesh(wingGeo, m); wr.scale.x = -1; g.add(wl, wr);
  const eye = glow(0xff6020, 3, false, 0.9); eye.position.set(0, 1.4, 17); g.add(eye);
  w.scene.add(g);
  w.ups.push((dt, t) => {
    const a = t * 0.12;
    g.position.set(cx + Math.cos(a) * r, cy + Math.sin(t * 0.5) * 6, cz + Math.sin(a) * r);
    g.rotation.set(0, -a, -0.35);
    const f = Math.sin(t * 2.2) * 0.6; wl.rotation.z = f; wr.rotation.z = -f;
  });
}

// ---------- definicje scenek ----------
const N = (text, fn, cam) => ({ who: null, text, fn, cam });
const L = (who, text, fn, cam) => ({ who, text, fn, cam });
const INTRO = [
  'Bilbo Baggins to hobbit, który lubi spokój, wygodny fotel i drugie śniadanie. Pewnego dnia wyrusza jednak w wielką podróż z trzynastoma krasnoludami. Ich przywódcą jest Thorin Dębowa Tarcza.',
  'Krasnoludy chcą odzyskać swój dom — Samotną Górę i ogromny skarb, który zabrał im smok Smaug.',
  'Smaug nie żyje. Zabił go łucznik Bard z Miasta na Jeziorze. Rozgniewany smok przed śmiercią spalił całe miasto.',
  'Najcenniejszym klejnotem skarbu jest Arcyklejnot — Serce Góry. Thorin pragnie go bardziej niż całego złota. Nie wie, że Bilbo znalazł kamień i ukrył go.',
  'Pod Górę przychodzą ludzie Barda i elfy z Mrocznej Puszczy. Ludzie chcą części skarbu, aby odbudować spalone miasto. Thorin odmawia i zamyka się w Górze.',
  'Bilbo widzi, że chciwość zmienia Thorina. Wojna jest coraz bliżej. Bilbo ma w kieszeni Arcyklejnot…',
];

// negocjacje pod bramą: wspólne ustawienie postaci
function gateTalk(ctx, { gem = false } = {}) {
  const a = ctx.a = {};
  const g = dwarfGroup(ctx, 0, -2.2, Math.PI, { n: 8, gap: 1.2 });
  a.thorin = g.thorin;
  a.bilbo = ctx.add('bilbo', 1.8, -2.6, Math.PI + 0.3);
  a.bard = ctx.add('bard', 0, -7.4, 0); a.king = ctx.add('elfKing', -2.2, -7.7, 0.1);
  crowd(ctx, ['human', 'elf'], 0, -11.2, 0, 10, 4.5, 'guard');
  if (gem) { a.gem = makeGem(); a.bard.hold(a.gem, 'WristR', V(0, 0, 0.1)); a.gem.visible = false; }
}
export function battleAllies(ctx, { dwarves = true } = {}) {
  ctx.duel('human', 'goblin', -10, -26, 0.3);
  ctx.duel('elf', 'goblin', 8, -24, -0.4);
  ctx.duel('human', 'goblin', 16, -34, 0);
  if (dwarves) ctx.duel('dwarf', 'goblin', -4, -32, 0.1, { a: { i: 3 } });
}
export function riders(ctx, n, z0 = -60, toZ = -20) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const x = rnd(-30, 30), z = z0 - rnd(0, 25);
    const r = ctx.add('rider', x, z, 0, 'run');
    ctx.walk(r, x * 0.6, toZ - rnd(0, 10), rnd(6, 8), 'idle', 'run');
    list.push(r);
  }
  return list;
}
// ujęcie: goblin-łucznik na skale strzela do ofiary (Thorin albo Król Elfów)
function archerShot(ctx, victimKind, foeKind = 'goblin') {
  const a = ctx.a = {};
  battleAllies(ctx, { dwarves: victimKind === 'thorin' });
  const d = ctx.duel(victimKind, foeKind, 5, -16, 0.6);
  a.victim = d.a;
  a.archer = archerOnRock(ctx, 9.5, -21.5, Math.atan2(5 - 9.5, -16 - -21.5), 1.3);
  const hp = a.archer.root.position;
  const vx = 5 - hp.x, vz = -16 - hp.z, vl = Math.hypot(vx, vz), fx = vx / vl, fz = vz / vl, rx = -fz, rz = fx;
  const vp0 = a.victim.root.position;
  // zza ramienia goblina: na pierwszym planie goblin z łukiem, w głębi ofiara, w którą celuje
  ctx.cut([hp.x - fx * 1.8 + rx * 1.5, hp.y + 1.25, hp.z - fz * 1.8 + rz * 1.5], [vp0.x, vp0.y + 1.0, vp0.z]);
  ctx.camTo([hp.x - fx * 1.5 + rx * 0.85, hp.y + 1.15, hp.z - fz * 1.5 + rz * 0.85], [vp0.x, vp0.y + 1.0, vp0.z], 6);
  ctx.fill = 26;
  a.fire = () => {
    a.archer.play('shoot', { once: true, then: 'idle' }); a.archer.nocked.visible = false;
    d.stop = true; a.victim.play('guard');
    const vp = a.victim.root.position;
    ctx.camTo([hp.x - fx * 2.6 + rx * 2.2, hp.y + 2.2, hp.z - fz * 2.6 + rz * 2.2], [vp.x, vp.y + 0.8, vp.z], 1.3);
    ctx.shoot(V(hp.x, hp.y + 1.0, hp.z), V(vp.x, vp.y + a.victim.K.h * 0.7, vp.z), 1.3, () => {
      sfx('arrow_hit'); sfx('fall', { delay: 0.5 }); a.victim.play('death', { once: true, fade: 0.1 }); d.b.play('idle');
      // kamera po stronie ofiary (goblin z pojedynku jest za nią)
      const bx = d.b.root.position.x - vp.x, bz = d.b.root.position.z - vp.z, bl = Math.hypot(bx, bz) || 1;
      ctx.camTo([vp.x - bx / bl * 2.6 - bz / bl * 1.2, vp.y + 1.7, vp.z - bz / bl * 2.6 + bx / bl * 1.2], [vp.x, vp.y + 0.3, vp.z], 3);
    });
  };
}

// przekazanie Arcyklejnotu: Bilbo (-5.6, -29.6), Bard (-6, -32.4)
const OVER_BARD = [[-5.3, 1.95, -33.6], [-5.6, 0.8, -29.6]];
const OVER_BILBO = [[-5.0, 1.25, -28.3], [-6.0, 1.6, -32.4]];
export const SCENES = {
  // laboratorium postaci (poza fabułą, tylko do strojenia i podglądu)
  'lab-postacie': {
    loc: w => { battlefield(w, { fires: false }); w.hemi.intensity = 3; w.moon.intensity = 2; w.scene.fog.density = 0.004; },
    setup(ctx) {
      const L = (k, x, anim, o) => ctx.add(k, x, 0, 0, anim, o);
      const b1 = L('bard', -9, 'aim'); b1.hold(makeBow(1.25), 'WristR', V(0, 0, 0.1));
      const b2 = L('bard', -7, 'idle'); b2.hold(makeBow(1.25), 'WristL', V(0, 0, 0.08));
      L('thorin', -5, 'attack'); L('dain', -3.6, 'idle'); L('elfKing', -2, 'idle');
      L('dwarf', -0.6, 'idle', { i: 1 }); L('ironDwarf', 0.6, 'idle'); L('human', 2, 'idle', { i: 2 }); L('elf', 3.4, 'guard', { i: 1 });
      L('bilbo', 4.8, 'idle');
      ctx.add('rider', 8, 0, -Math.PI / 2, 'idle');
      archerOnRock(ctx, 11, 0, 0).root.position.y = 0;
      const t = ctx.add('thorin', 14, 0, 0, 'death');
      ctx.a = { t };
      ctx.cut([2.5, 2.2, 13], [2.5, 1.0, 0]);
    },
    lines: [N('Laboratorium postaci')],
  },
  'intro-1': {
    music: 'main', amb: { night: 0.8 },
    loc: shire,
    setup(ctx) {
      ctx.add('bilbo', 0.9, 4.7, Math.PI);
      const g = dwarfGroup(ctx, 0, -4, 0, { gap: 1.15 });
      [g.thorin, ...g.dwarves].forEach(c => { const p = c.root.position; ctx.walk(c, p.x, p.z + 2.2, 1.0); });
      ctx.camTo([1.2, 2.5, -6.2], [0.3, 1.2, 4.5], 14, [1.8, 3.1, -10], [0.3, 1.1, 4.5]);
    },
    lines: [N(INTRO[0])],
  },
  'intro-2': {
    music: 'main', amb: { night: 0.8 },
    loc: w => { battlefield(w, { fires: false }); dragon(w, 0, 175, -330, 120); },
    setup(ctx) {
      ctx.add('bilbo', 1.5, 28.5, Math.PI);
      dwarfGroup(ctx, 0, 27, Math.PI);
      ctx.camTo([1, 3.4, 34.5], [0, 40, -300], 14, [2.5, 1.6, 38], [0, 25, -300]);
      ctx.fill = 16;
    },
    lines: [N(INTRO[1])],
  },
  'intro-3': {
    music: 'main', amb: { fire: 0.8, river: 0.3 },
    loc: laketown,
    setup(ctx) {
      const b = ctx.add('bard', 0, -6.5, Math.PI, 'idle', { y: 1.0 });
      b.hold(makeBow(1.2), 'WristR', V(0, 0, 0.1));
      ['human', 'human', 'human'].forEach((k, i) => ctx.add(k, -0.6 + i * 0.4, -9.5 - i * 1.1, Math.PI + rnd(-0.3, 0.3), 'idle', { i, y: 1.0 }));
      ctx.camTo([1.8, 2.2, -3.2], [0, 2.4, -16], 14, [3.2, 2.5, 0.5], [0, 2, -10]);
      ctx.fill = 8;
    },
    lines: [N(INTRO[2])],
  },
  'intro-4': {
    music: 'main', amb: {},
    loc: hall,
    setup(ctx) {
      const b = ctx.add('bilbo', 1.2, -2, 0);
      const gem = makeGem(); b.hold(gem, 'WristR', V(0, 0.05, 0.08));
      ctx.add('thorin', 0, -14, 0, 'idle', { y: 2.2 });
      ctx.camTo([3.4, 2.4, 3.6], [0, 1.6, -10], 14, [1.9, 0.9, -0.3], [1.1, 0.7, -2]);
      ctx.fill = 6;
    },
    lines: [N(INTRO[3])],
  },
  'intro-5': {
    music: 'main', amb: { night: 0.6, fire: 0.5 },
    loc: gateAndCamp,
    setup(ctx) {
      ctx.add('bard', 0.6, -14, 0); ctx.add('elfKing', -1.8, -14.5, 0.1);
      crowd(ctx, ['human', 'elf'], 0, -18.5, 0, 12, 5, 'guard');
      ctx.add('thorin', 0.2, 0.6, Math.PI, 'idle', { y: 14 });
      [-3, 3.4, 5.6].forEach((x, i) => ctx.add('dwarf', x, 0.7, Math.PI, 'idle', { y: 14, i }));
      const tl = new THREE.PointLight(0xff9a40, 14, 10, 1.6); tl.position.set(1.5, 16, -0.6); ctx.w.scene.add(tl);
      const tg = glow(0xffa040, 1.4); tg.position.set(1.5, 15.8, -0.3); ctx.w.scene.add(tg);
      ctx.camTo([3, 2, -18], [0, 9, 0], 14, [6, 2.6, -22], [0, 6, -4]);
      ctx.fill = 12;
    },
    lines: [N(INTRO[4])],
  },
  'intro-6': {
    music: 'main', amb: { night: 0.7, fire: 0.2 },
    loc: gateAndCamp,
    setup(ctx) {
      const b = ctx.add('bilbo', 7.8, 1.1, Math.PI, 'idle', { y: 14 });
      const gem = makeGem(); b.hold(gem, 'WristR', V(0, 0.05, 0.08));
      const th = ctx.add('thorin', -3.5, 1.6, Math.PI / 2, 'walk', { y: 14 });
      th.yOff = 14; ctx.walk(th, 2, 1.6, 0.8);
      ctx.camTo([8.6, 15.5, 2.6], [7.4, 13.2, -10], 14, [9.2, 15.9, 3.6], [7.2, 13.5, -10]);
      ctx.fill = 10;
    },
    keep: true,
    lines: [N(INTRO[5])],
  },

  // ---------- Zakończenie 1 ----------
  'z1-przekazanie': {
    music: 'main', amb: { night: 0.5, fire: 0.9 },
    loc: gateAndCamp,
    setup(ctx) {
      const a = ctx.a = {};
      a.bard = ctx.add('bard', -6, -32.4); a.king = ctx.add('elfKing', -8.4, -33.2);
      a.bilbo = ctx.add('bilbo', -5.6, -29.6);
      // rozmówcy zwróceni do siebie, strażnicy patrzą na Barda i Króla
      a.bard.face(-5.6, -29.6); a.king.face(-5.6, -29.6); a.bilbo.face(-6.6, -32.6);
      ctx.add('elf', -4.0, -27.6, 0, 'guard').face(-6.6, -32.6); ctx.add('elf', -7.4, -27.6, 0, 'guard').face(-6.6, -32.6);
      crowd(ctx, ['human', 'elf'], -6, -40, 0, 6, 3);
      a.gem = makeGem(); a.gem.scale.setScalar(1.4); a.gem.userData.light.intensity = 1.5; a.bilbo.hold(a.gem, 'WristR', V(0, 0.12, 0.2)); a.gem.visible = false;
      ctx.camTo([-3.4, 1.6, -28.6], [-6.2, 1.2, -31.6], 10, [-2.4, 2.0, -26.6], [-6, 1.2, -32]);
    },
    lines: [
      N('Elfy prowadzą Bilba do ogniska. Tam czekają Bard i Król Leśnych Elfów.'),
      L('Bilbo', 'Dobry wieczór. Jestem Bilbo Baggins, towarzysz Thorina. Przyniosłem wam coś bardzo cennego.', ctx => { ctx.a.bilbo.play('talk', { once: true, then: 'idle' }); ctx.camTo(...OVER_BARD, 2.5); }),
      L('Bilbo', 'To jest Arcyklejnot — Serce Góry. Thorin pragnie go bardziej niż całego złota.', ctx => { ctx.a.gem.visible = true; ctx.camTo([-5.25, 1.15, -30.9], [-5.6, 0.75, -29.6], 3); }),
      L('Bard', 'Dlaczego nam go dajesz? Przecież jesteś przyjacielem krasnoludów.', ctx => ctx.camTo(...OVER_BILBO, 2.5)),
      L('Bilbo', 'Nie chcę wojny. Z tym kamieniem będziecie mogli spokojnie porozmawiać z Thorinem.', ctx => {
        const { bilbo, bard, gem } = ctx.a; bilbo.unhold(gem); bard.hold(gem, 'WristR', V(0, 0, 0.1)); bard.play('talk', { once: true, then: 'idle' });
        ctx.camTo(...OVER_BARD, 3);
      }),
      L('Król Elfów', 'Jesteś odważniejszy niż wielu wojowników, Bilbo Bagginsie. Dziękujemy ci.', ctx => { ctx.a.king.play('wave', { once: true, then: 'idle' }); ctx.camTo([-6.6, 1.5, -29.4], [-8.4, 1.7, -33.2], 2.5); }),
      L('Bard', 'Dziękujemy, Bilbo. Ludzie z Miasta na Jeziorze nie zapomną ci tego.', ctx => ctx.camTo(...OVER_BILBO, 2.5)),
    ],
  },
  'z1-negocjacje': {
    music: 'main', amb: { night: 0.6, fire: 0.5 },
    loc: gateAndCamp,
    setup(ctx) { gateTalk(ctx, { gem: true }); ctx.camTo([5.4, 1.8, -5.6], [-0.6, 1.2, -4.9], 8, [7.2, 2.2, -6.4], [-0.6, 1.3, -4.9]); },
    lines: [
      N('Następnego dnia ludzie i elfy przychodzą pod bramę Góry.'),
      L('Bard', 'Thorinie! Potrzebujemy części skarbu, aby odbudować Miasto na Jeziorze.', ctx => ctx.a.bard.play('talk', { once: true, then: 'idle' })),
      L('Thorin', 'Nie dostaniecie ani jednej monety! Odejdźcie spod mojej Góry!', ctx => { ctx.a.thorin.play('no', { once: true, then: 'idle' }); ctx.camTo([1.8, 1.7, -5.4], [0, 1.2, -2.2], 2.5); }),
      L('Bard', 'Może zmienisz zdanie, gdy zobaczysz to.', ctx => { ctx.a.gem.visible = true; ctx.a.bard.play('wave', { once: true, then: 'idle' }); ctx.camTo([-1.6, 1.9, -4.4], [0, 1.6, -7.4], 2.5); }),
      L('Thorin', 'Arcyklejnot?! Serce Góry! Skąd go macie? To skarb mojego rodu!', ctx => ctx.camTo([1.5, 1.5, -5.6], [0.4, 1.1, -2.2], 2.5)),
      L('Bilbo', 'Ja im go dałem, Thorinie. Wziąłem go jako moją część skarbu.', ctx => { ctx.walk(ctx.a.bilbo, 1.0, -3.4, 1); ctx.camTo([2.8, 1.3, -6.2], [0.9, 0.8, -3.2], 2.5); }),
      L('Thorin', 'Ty… zdrajco! Złodzieju!', ctx => {
        const { thorin, bilbo } = ctx.a;
        thorin.face(bilbo.pos.x, bilbo.pos.z); bilbo.face(thorin.pos.x, thorin.pos.z);
        const shake = n => { if (n <= 0) return; thorin.play('punch', { once: true, then: 'idle', fade: 0.1 }); setTimeout(() => { bilbo.play('hit', { once: true, then: 'idle', fade: 0.1 }); sfx('thump', { vol: 0.5, rate: 1.3 }); }, 300); setTimeout(() => shake(n - 1), 900); };
        shake(3); ctx.camTo([-2.0, 1.5, -5.2], [0.5, 1.0, -2.8], 1.5);
      }),
      L('Bilbo', 'Puść mnie! Chciałem tylko, żeby nie było wojny!'),
      N('Thorin puszcza Bilba. Krasnoludy patrzą na hobbita z gniewem.', ctx => ctx.camTo([6, 2.4, -7.5], [0, 1.2, -3.5], 5)),
    ],
  },
  'z1-atak': {
    music: 'main', amb: { night: 0.5, fire: 0.3 },
    loc: battlefield,
    setup(ctx) {
      crowd(ctx, ['human', 'elf'], 0, -6, Math.PI, 12, 6, 'guard');
      const g = dwarfGroup(ctx, 7, -3, Math.PI, { n: 8, anim: 'guard' }); ctx.a = { thorin: g.thorin };
      ctx.add('bard', -1.5, -3.5, Math.PI, 'guard');
      riders(ctx, 8, -46, -24);
      ctx.camTo([3.5, 1.4, -18], [-2, 1.3, -45], 6, [5, 1.8, -21], [-2, 1.2, -50]);
      sfx('howl');
    },
    lines: [
      N('Nagle ziemia drży. Z północy nadciągają gobliny na wargach!'),
      L('Bard', 'Gobliny! Ludzie, elfy i krasnoludy — walczmy razem!', ctx => ctx.camTo([-0.2, 2.2, -0.2], [-1.5, 1.7, -3.5], 2.5)),
      L('Thorin', 'Dziś krasnoludy walczą ramię w ramię z ludźmi i elfami!', ctx => ctx.camTo([8.2, 1.6, -0.8], [7, 1.1, -3], 2.5)),
      N('Ludzie, elfy i krasnoludy razem stają do walki z goblinami i wargami.', ctx => ctx.camTo([12, 6, 10], [0, 0, -30], 5)),
    ],
  },
  'z1-kamien': {
    music: 'main', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) {
      battleAllies(ctx);
      const b = ctx.a = { bilbo: ctx.add('bilbo', -10, -11, Math.PI - 0.4) };
      b.stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28), new THREE.MeshStandardMaterial({ color: 0x3a3a44, flatShading: true })); b.stone.visible = false; ctx.w.scene.add(b.stone);
      ctx.camTo([-8.6, 1.4, -8.4], [-10.4, 1, -12.6], 10, [-7, 2, -6], [-10.5, 1.2, -14]);
    },
    lines: [
      N('Bilbo nie umie walczyć. Stoi z boku i patrzy na bitwę.'),
      L('Bilbo', 'Ojej… Jak ich wielu!', ctx => ctx.a.bilbo.play('no', { once: true, then: 'idle' })),
      N('Nagle spadający kamień trafia Bilba w głowę.', ctx => {
        const { bilbo, stone } = ctx.a, p = bilbo.root.position;
        stone.visible = true; stone.position.set(p.x + 1.5, p.y + 9, p.z - 1);
        const t0 = ctx.t, from = stone.position.clone();
        ctx.w.ups.push(() => {
          const k = Math.min(1, (ctx.t - t0) / 0.9);
          if (k < 1) { stone.position.lerpVectors(from, V(p.x, p.y + 1.15, p.z), k * k); stone.rotation.x += 0.2; }
          else if (!stone.hit) { stone.hit = true; sfx('thump'); sfx('fall', { delay: 0.4, vol: 0.6 }); bilbo.play('death', { once: true, fade: 0.1 }); stone.position.set(p.x + 0.6, p.y + 0.2, p.z + 0.4); }
        });
      }),
      N('Bilbo pada na ziemię i traci przytomność.', ctx => ctx.camTo([-8.8, 2.6, -9.5], [-10, 0.3, -11.5], 4)),
    ],
  },
  'z1-goblin-strzela': {
    music: 'main', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) { archerShot(ctx, 'thorin'); },
    lines: [
      N('Na skale stoi goblin z łukiem. Celuje w Thorina…'),
      N('Goblin strzela!', ctx => ctx.a.fire()),
      N('Strzała goblina trafia Thorina. Thorin pada na ziemię.'),
    ],
  },
  'z1-bard-krzyk': {
    music: 'sad', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) {
      battleAllies(ctx);
      ctx.add('thorin', 5, -16, 0.6, 'death');
      const b = ctx.add('bard', -2, -9, 0); b.hold(makeBow(1.2), 'WristR', V(0, 0, 0.1));
      ctx.walk(b, 3.3, -14.4, 3.2, 'idle', 'run');
      ctx.camTo([3.2, 1.9, -17.6], [2, 1.7, -13], 3, [1.5, 1.9, -18], [0, 1.6, -10]);
    },
    fadeOut: 2500,
    lines: [L('Bard', 'Nieeeeee, Thoriiin…')],
  },
  'z1-thorin-lozko': {
    music: 'sad', amb: { fire: 0.2 },
    loc: tentInside,
    setup(ctx) {
      const a = ctx.a = {};
      // leżący Thorin: poza spoczynku (ręce wzdłuż ciała) obrócona na plecy, głową do poduszki; spokojny oddech
      a.thorin = ctx.add('thorin', 1.8, -0.1, 0, 'Idle_Neutral', { y: 0.56 });
      a.thorin.root.rotation.x = -Math.PI / 2 + 0.13;   // głowa wyżej, na poduszce
      a.thorin.cur.timeScale = 0.35;
      if (a.thorin.sword) a.thorin.sword.visible = false;
      a.bilbo = ctx.add('bilbo', -2.2, 0.6, 0, 'death', { y: 0.08 });
      ctx.camTo([-0.4, 2.0, 2.4], [-1.6, 0.4, 0.4], 6, [0.2, 2.6, 3.6], [-1.8, 0.2, 0.4]);
      ctx.fill = 4;
    },
    lines: [
      N('Bilbo budzi się w namiocie. Bitwa się skończyła.', ctx => ctx.after(1, () => { ctx.a.bilbo.root.position.y = 0; ctx.a.bilbo.play('idle', { fade: 1.2 }); ctx.after(1.6, () => ctx.walk(ctx.a.bilbo, 0.9, -0.7, 1)); })),
      L('Bilbo', 'Thorinie!', ctx => ctx.camTo([-0.6, 1.6, 0.9], [1.6, 0.6, -1.2], 3)),
      L('Thorin', 'Bilbo… Dobrze, że jesteś. Chcę cię przeprosić za moje słowa i za mój gniew.', ctx => { ctx.walk(ctx.a.bilbo, 0.9, -0.7, 1); ctx.camTo([3.5, 1.35, -1.0], [1.6, 0.7, -1.3], 3); }),
      L('Thorin', 'Nie jesteś zdrajcą, przyjacielu. Postąpiłeś uczciwie i mądrze.'),
      L('Thorin', 'Gdyby więcej z nas ceniło dobre jedzenie, śmiech i pieśni bardziej niż złoto, świat byłby weselszy. Żegnaj, Bilbo…', ctx => ctx.camTo([2.9, 1.05, -1.9], [1.75, 0.75, -1.45], 4)),
      N('Thorin Dębowa Tarcza umiera.', ctx => { ctx.a.thorin.cur.timeScale = 0; ctx.camTo([1.4, 3.6, 2.2], [1.4, 0.4, -1], 6); }),
    ],
  },

  // ---------- Zakończenia 2 i 3 ----------
  'z23-negocjacje': {
    music: 'main', amb: { night: 0.6, fire: 0.5 },
    loc: gateAndCamp,
    setup(ctx) { gateTalk(ctx); ctx.camTo([5.4, 1.8, -5.6], [-0.6, 1.2, -4.9], 8, [7.2, 2.2, -6.4], [-0.6, 1.3, -4.9]); },
    keep: true,
    lines: [
      N('Bilbo nie oddaje Arcyklejnotu. Następnego dnia ludzie i elfy przychodzą pod bramę Góry na rozmowy.'),
      L('Bard', 'Thorinie! Potrzebujemy części skarbu, aby odbudować spalone Miasto na Jeziorze.', ctx => ctx.a.bard.play('talk', { once: true, then: 'idle' })),
      L('Thorin', 'Nie dostaniecie ani jednej monety! Odejdźcie spod mojej Góry!', ctx => { ctx.a.thorin.play('no', { once: true, then: 'idle' }); ctx.camTo([1.8, 1.7, -5.4], [0, 1.2, -2.2], 2.5); }),
      L('Król Elfów', 'Twoja chciwość sprowadzi na nas wszystkich wojnę, Thorinie.', ctx => ctx.camTo([-0.4, 2.1, -4.6], [-2.2, 1.9, -7.7], 2.5)),
      L('Bilbo', 'Muszę coś zrobić… Przecież mam swoją część skarbu.', ctx => ctx.camTo([3.4, 1.2, -5], [1.8, 0.8, -2.6], 2.5)),
    ],
  },
  'z2-zgoda': {
    music: 'main', amb: { night: 0.6, fire: 0.5 },
    loc: gateAndCamp,
    setup(ctx) {
      gateTalk(ctx);
      ctx.walk(ctx.a.bilbo, 0.8, -4.8, 1);
      ctx.camTo([4.2, 1.5, -5.6], [0.4, 1.0, -4.8], 8, [6.2, 2.0, -6.4], [-0.4, 1.2, -4.9]);
    },
    lines: [
      L('Bilbo', 'Poczekajcie! Weźcie moją część skarbu. Niech posłuży do odbudowy miasta.', ctx => ctx.a.bilbo.play('talk', { once: true, then: 'idle' })),
      L('Bard', 'To bardzo hojne, Bilbo. Twoje złoto wystarczy, aby odbudować wiele domów.', ctx => ctx.camTo([-1.4, 1.9, -4.4], [0, 1.6, -7.4], 2.5)),
      L('Thorin', 'Niech będzie. Skoro hobbit płaci za nas, nie będzie wojny.', ctx => ctx.camTo([1.8, 1.7, -5.4], [0, 1.2, -2.2], 2.5)),
      L('Król Elfów', 'Zgoda. Ludzie, elfy i krasnoludy nie będą ze sobą walczyć.', ctx => { ctx.a.king.play('wave', { once: true, then: 'idle' }); ctx.camTo([-0.4, 2.1, -4.6], [-2.2, 1.9, -7.7], 2.5); }),
      N('Ludzie, elfy i krasnoludy zawierają zgodę.', ctx => ctx.camTo([8, 3.2, -11], [0, 1, -5], 5)),
    ],
  },
  'z2-atak': {
    music: 'main', amb: { night: 0.5, fire: 0.3 },
    loc: battlefield,
    setup(ctx) {
      crowd(ctx, ['human', 'elf'], 0, -6, Math.PI, 12, 6, 'guard');
      ctx.add('bard', -1.5, -3.5, Math.PI, 'guard');
      const g = dwarfGroup(ctx, 13, 1, -Math.PI / 2 - 0.5); ctx.a = { thorin: g.thorin };
      riders(ctx, 8, -46, -24);
      ctx.camTo([3.5, 1.4, -18], [-2, 1.3, -45], 6, [5, 1.8, -21], [-2, 1.2, -50]);
      sfx('howl');
    },
    lines: [
      N('Nagle z północy nadciągają gobliny na wargach!'),
      L('Bard', 'Gobliny! Thorinie, pomóżcie nam!', ctx => ctx.camTo([-0.2, 2.2, -0.2], [-1.5, 1.7, -3.5], 2.5)),
      L('Thorin', 'To nie nasza wojna. Mamy już swoje złoto.', ctx => ctx.camTo([10.6, 1.6, 2.6], [13, 1.1, 1], 2.5)),
      N('Krasnoludy nie chcą walczyć. Stoją z boku i tylko patrzą. Walczą tylko ludzie i elfy.', ctx => ctx.camTo([14, 3.5, 12], [10, 0.5, -10], 5)),
    ],
  },
  'z2-straty': {
    music: 'sad', amb: { fire: 0.4, night: 0.3 },
    loc: w => { battlefield(w); smokeColumn(w, -8, 1, -20, 1.5); smokeColumn(w, 10, 1, -14, 1.3); },
    setup(ctx) {
      for (let i = 0; i < 16; i++) ctx.add(i % 2 ? 'elf' : 'human', rnd(-16, 14), rnd(-30, -6), rnd(0, 6.3), 'death', { i });
      for (let i = 0; i < 5; i++) ctx.add('goblin', rnd(-18, 18), rnd(-34, -10), rnd(0, 6.3), 'death');
      crowd(ctx, ['human', 'elf'], -2, -2, Math.PI, 4, 3);
      dwarfGroup(ctx, 13, 1, -Math.PI / 2 - 0.5);
      ctx.camTo([-5, 2.0, -6], [2, 0.3, -17], 14, [-9, 2.8, -2], [1, 0.3, -16]);
      ctx.fill = 34;
    },
    lines: [
      N('Bitwa jest bardzo ciężka. Ginie wielu ludzi i elfów.'),
      N('Krasnoludy przez całą bitwę stoją z boku. Thorin przeżywa, ale nie podnosi miecza.', ctx => ctx.camTo([8, 1.8, 4.5], [13, 1, 0.5], 5)),
    ],
  },
  'z2-krol': {
    music: 'sad', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) { archerShot(ctx, 'elfKing'); },
    lines: [
      N('Król Leśnych Elfów walczy w pierwszym szeregu. Na skale stoi goblin z łukiem…'),
      N('Goblin strzela!', ctx => ctx.a.fire()),
      N('Pada Król Leśnych Elfów.'),
    ],
  },
  'z3-dain': {
    music: 'main', amb: { night: 0.6, fire: 0.5 },
    loc: gateAndCamp,
    setup(ctx) {
      const g = dwarfGroup(ctx, -2, -3, -Math.PI / 2 - 0.6, { n: 12 }); ctx.a = { thorin: g.thorin };
      const army = [];
      const dain = ctx.add('dain', 30, -9, -Math.PI / 2, 'walk'); ctx.a.dain = dain;
      ctx.walk(dain, 6, -8, 1.6);
      for (let i = 0; i < 18; i++) {
        const row = Math.floor(i / 3), col = i % 3, x = 32 + row * 1.6, z = -11 + col * 1.4;
        const d = ctx.add('ironDwarf', x, z, -Math.PI / 2, 'walk', { i }); army.push(d); ctx.walk(d, x - 22, z, 1.6);
      }
      crowd(ctx, ['human', 'elf'], -2, -34, 0, 8, 6, 'guard');
      [[10, -12.5], [18, -12.5], [26, -12.5], [14, -4.5], [22, -4.5]].forEach(([x, z], i) => torch(ctx.w, x, z, { light: i < 3 ? 12 : 0 }));
      ctx.camTo([17, 1.6, -14.5], [28, 1.1, -9], 10, [15, 2.0, -15.5], [30, 1.1, -9]);
      ctx.fill = 30;
    },
    lines: [
      N('Bilbo zatrzymuje swoją część skarbu. Rozmowy kończą się kłótnią.'),
      N('Wtedy ze wschodu nadciąga Dáin z armią krasnoludów z Żelaznych Wzgórz.'),
      L('Dáin', 'Thorinie, kuzynie! Przybywam z Żelaznych Wzgórz z moimi wojownikami!', ctx => { const d = ctx.a.dain.pos; ctx.camTo([d.x - 3.4, 1.5, d.z - 2.8], [d.x, 1.1, d.z], 2.5); }),
      L('Thorin', 'Witaj, Dáinie! Razem obronimy skarb Góry!', ctx => { ctx.a.thorin.play('wave', { once: true, then: 'idle' }); ctx.camTo([1.4, 1.6, -6.4], [-2, 1.1, -3], 2.5); }),
      N('Krasnoludy ruszają do bitwy z ludźmi i elfami.', ctx => ctx.camTo([10, 4, -20], [0, 0.5, -10], 5)),
    ],
  },
  'z3-gobliny': {
    music: 'main', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) {
      for (let i = 0; i < 10; i++) ctx.add(i % 3 ? 'ironDwarf' : 'dwarf', rnd(-14, 14), rnd(-20, 2), rnd(0, 6.3), 'death', { i });
      for (let i = 0; i < 6; i++) ctx.add(i % 2 ? 'elf' : 'human', rnd(-16, 16), rnd(-24, -4), rnd(0, 6.3), 'death', { i });
      ctx.a = { thorin: ctx.add('thorin', 0, -4, Math.PI, 'guard') };
      ctx.add('dain', 2, -3.4, Math.PI, 'guard');
      crowd(ctx, ['dwarf'], 0, -1, Math.PI, 5, 3, 'guard');
      riders(ctx, 7, -55, -24);
      ctx.camTo([3.2, 1.7, 2.2], [0, 0.8, -10], 8, [5, 2.3, 4.5], [0, 0.8, -10]);
      sfx('howl');
    },
    lines: [
      N('Krasnoludy wygrywają, ale wielu z nich pada w bitwie.'),
      N('Nagle nadciągają gobliny i wargi!', ctx => ctx.camTo([2, 1.6, -1], [0, 1.5, -40], 3)),
      L('Thorin', 'Gobliny?! Jesteśmy zbyt słabi… Do mnie, krasnoludy!', ctx => ctx.camTo([1.2, 1.5, -6.8], [0, 1.1, -4], 2.5)),
    ],
  },
  'z3-przegrana': {
    music: 'sad', amb: { fire: 0.4, night: 0.2 },
    loc: w => { battlefield(w); smokeColumn(w, -6, 1, -14, 1.5); smokeColumn(w, 8, 1, -8, 1.3); },
    setup(ctx) {
      for (let i = 0; i < 16; i++) ctx.add(i % 3 ? 'ironDwarf' : 'dwarf', rnd(-12, 12), rnd(-20, 2), rnd(0, 6.3), 'death', { i });
      for (let i = 0; i < 5; i++) { const r = ctx.add('rider', rnd(-14, 14), rnd(-18, -2), rnd(0, 6.3), 'idle'); }
      crowd(ctx, ['goblin'], 0, -10, 0, 6, 8);
      ctx.camTo([-6, 2.0, 0], [0, 0.5, -9], 12, [-9, 2.8, 3], [0, 0.5, -9]);
      ctx.fill = 34;
    },
    lines: [
      N('Gobliny i wargi atakują osłabione krasnoludy.'),
      N('Giną wszyscy towarzysze Thorina.'),
    ],
  },
  'z3-thorin': {
    music: 'sad', amb: { battle: 0.5, night: 0.25, fire: 0.25 },
    loc: battlefield,
    setup(ctx) { archerShot(ctx, 'thorin'); },
    lines: [
      N('Thorin walczy do końca. Na skale stoi goblin z łukiem…'),
      N('Goblin strzela!', ctx => ctx.a.fire()),
      N('Strzała goblina trafia Thorina. Król spod Góry umiera.'),
    ],
  },
  'z3-odejscie': {
    music: 'sad', amb: { night: 0.6 },
    loc: battlefield,
    setup(ctx) {
      for (let i = 0; i < 12; i++) ctx.add(i % 3 ? 'ironDwarf' : 'dwarf', rnd(-14, 14), rnd(-24, -2), rnd(0, 6.3), 'death', { i });
      ctx.add('thorin', 4, -10, 1, 'death');
      // Bilbo za tym samym kamieniem co w etapie „Bilbo się chowa” (-14, -16)
      const b = ctx.a = { bilbo: ctx.add('bilbo', -14, -20.2, 0.9) };
      b.bilbo.setOpacity(0.18);
      ctx.camTo([-9.6, 1.4, -19.6], [-13.6, 0.8, -20.4], 12, [-9.0, 1.8, -18.2], [-13.8, 0.8, -20.2]);
    },
    lines: [
      N('Gobliny odchodzą. Na polu bitwy robi się cicho.'),
      N('Bilbo wychodzi zza kamienia. Jest załamany.', ctx => ctx.walk(ctx.a.bilbo, -11.6, -20.6, 0.6)),
      N('Bilbo zdejmuje pierścień i odchodzi w dal.', ctx => {
        const b = ctx.a.bilbo; b.setOpacity(1); sfx('ring');
        ctx.after(1.2, () => ctx.walk(b, -45, -50, 0.9));
        ctx.camTo([-6, 3, -15], [-24, 0.5, -34], 12);
      }),
    ],
  },
};

// ---------- odtwarzanie ----------
let current = null;
export async function playScene(id) {
  const def = SCENES[id];
  if (IMG[id]) {
    // ilustracja zamiast scenki 3D
    const el = $('plansza'); el.style.backgroundImage = `url("${IMG[id]}")`; show('plansza');
    setMode({ scene: null, update() {} });
    await fade(0, 600);
    for (const l of def.lines) { dialog(l.who, l.text); await waiter('line', id); }
    hideDialog();
    if (!def.keep) { await fade(1, def.fadeOut || 800); show('plansza', false); }
    return;
  }
  music(def.music ?? 'main', def.music === 'sad' ? 0.7 : 0.6);
  amb(def.amb || { night: 0.8 });
  const w = nightWorld(def.world);
  def.loc(w);
  w.hemi.intensity *= 1.35;
  const ctx = makeCtx(w); ctx.id = id;
  camera.fov = BASE_FOV; camera.updateProjectionMatrix(); frameShift(0.12);
  def.setup(ctx);
  current = ctx;
  setMode({ scene: w.scene, update: dt => tick(ctx, dt) });
  tick(ctx, 0.016);
  await fade(0, 700);
  ctx.lines = def.lines.length;
  for (const [i, l] of def.lines.entries()) {
    ctx.line = i;
    if (l.fn) l.fn(ctx);
    dialog(l.who, l.text);
    await waiter('line', id);
  }
  hideDialog();
  if (!def.keep) await fade(1, def.fadeOut || 800);
}
export const sceneCtx = () => current;
export const SCENE_IDS = Object.keys(SCENES).filter(id => !id.startsWith('lab'));

// tło menu: obóz pod Górą, kamera powoli krąży
export function menuBackdrop() {
  const w = nightWorld(); gateAndCamp(w);
  const ctx = makeCtx(w);
  crowd(ctx, ['human', 'elf'], -6, -40, 0, 6, 4);
  ctx.add('bilbo', 7.8, 1.0, Math.PI, 'idle', { y: 14 });
  ctx.fill = 0;
  music('main', 0.7); amb({ night: 0.6, fire: 0.2 });
  camera.fov = BASE_FOV; camera.updateProjectionMatrix(); frameShift(0);
  return {
    scene: w.scene,
    update(dt) {
      const a = ctx.t * 0.05;
      ctx.cut([Math.sin(a) * 14, 7 + Math.sin(ctx.t * 0.1) * 1.5, -86 + Math.cos(a) * 6], [0, 10, 0]);
      tick(ctx, dt);
    },
  };
}
