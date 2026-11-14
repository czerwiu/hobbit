// Zakończenie 1, etap 3D: droga do obozu nocą — lina, rzeka, skradanie (z dema), kichnięcie.
import * as THREE from 'three';
import { $, camera, hit, key, clamp, lerp, rnd, damp, angLerp, V } from './core.js';
import { nightWorld, terrain, grass, pines, makeRock, wall, mountain, glow, fire, tent, water, hills, rockMat, banner, torch } from './env.js';
import { Char } from './chars.js';
import { TPP } from './tpp.js';
import { hud, setBar, say, tip, center, mark, ringEffect } from './ui.js';
import { runStage } from './stage.js';
import { sfx, setAmb } from './sfx.js';

// ---------- parametry (do strojenia) ----------
const DZ = -24;                                 // skradanie z dema przesunięte za rzekę
const BILBO_H = 1.1;
const SNEAK = 1.9, RUN = 4.6, NOISE_R = 7, LISTEN_TIME = 2.5, RUN_KATAR = 2.5;
const RING_TIME = 5, RING_RECHARGE = 3, KATAR_UP = 1 / 25, KATAR_DOWN = 1 / 5;
const SEE_DIST = 24, CONE_A = 0.4, ALERT_MAX = 0.8;
const END_Z = -186 + DZ, FIRE = V(0, 0, -198 + DZ);
const ROPE_X = 1.2, ROPE_Z = 5.05, ROPE_TOP = 13.2;
const ROPE_ACC = 3.2, ROPE_GRIP = 7, ROPE_MAX = 4.2, ROPE_SAFE = 2.8, ROPE_BAR = 3.9, ROPE_SLIP = 0.35;
const RIVER_Z1 = -4.3, RIVER_Z2 = -17.7, WATER_Y = -0.55, JUMP_V = 4.3, JUMP_H = 2.0, GRAV = 11;
const STONES = [[0.9, -4.9], [-0.4, -6.9], [0.7, -8.9], [-0.6, -10.9], [0.5, -12.9], [-0.5, -14.9], [0.4, -16.9]].map(([x, z], i) => ({ x, z, r: 0.62, top: -0.18 + (i % 3) * 0.05 }));
const SNEAK_START = V(0, 0, -20.5);

// koryto rzeki z wyraźnymi brzegami: ląd zawsze co najmniej 0,15 m nad wodą, krawędź tuż przy pierwszym i ostatnim kamieniu
const RC = (RIVER_Z1 + RIVER_Z2) / 2, HALF = 6.35, EDGE = 0.5;
function hAt(x, z) {
  const bank = Math.max(hills(x, z), 0) + 0.15, d = Math.abs(z - RC);
  if (d >= HALF + EDGE) return bank;
  if (d <= HALF) return -1.6;
  return lerp(-1.6, bank, (d - HALF) / EDGE);
}
function support(x, z) {
  for (const s of STONES) if (Math.hypot(x - s.x, z - s.z) < s.r + 0.2) return s.top;
  const h = hAt(x, z);
  return h > WATER_Y + 0.1 ? h : null;
}

function buildWorld() {
  const w = nightWorld();
  terrain(w, { x1: -70, x2: 70, z1: -260, z2: 20, step: 0.5, h: hAt });
  grass(w, { n: 9000, x1: -24, x2: 24, z1: -239, z2: 4, skip: (x, z) => hAt(x, z) < WATER_Y + 0.15 });
  pines(w, 300, i => {
    const behind = i > 260;
    return [behind ? rnd(-40, 40) : (Math.random() < 0.5 ? -1 : 1) * rnd(27, 60), behind ? rnd(-264, -242) : rnd(-239, 10)];
  });
  wall(w, 7, { width: 70, height: 14, rope: true });
  mountain(w, 0, 55, 260, 170, 140);
  water(w, -70, 70, RIVER_Z2 - 0.6, RIVER_Z1 + 0.6, WATER_Y);
  // kamienie w rzece: jaśniejsze i mokre, żeby było je widać nocą
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a6070, roughness: 0.5, metalness: 0.2, flatShading: true, emissive: 0x141a26 });
  STONES.forEach(s => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r + 0.15, 1.4, 8), stoneMat);
    m.position.set(s.x, s.top - 0.7, s.z); m.rotation.y = rnd(0, 6); m.castShadow = m.receiveShadow = true; w.scene.add(m);
  });
  // skały (z dema, przesunięte za rzekę)
  [[-5, -18, 2.2], [6, -26, 2.6], [-9, -36, 2.4], [3, -41, 2.0], [11, -53, 2.8], [-4, -58, 2.5], [-13, -68, 2.3], [7, -74, 2.6],
   [0, -86, 2.2], [-10, -92, 2.7], [12, -104, 2.4], [-3, -112, 2.6], [8, -124, 2.2], [-12, -132, 2.5], [3, -140, 2.8],
   [13, -152, 2.3], [-6, -160, 2.6], [5, -172, 2.4]].forEach(([x, z, r]) => makeRock(w, x, z + DZ, r, true));
  for (let i = 0; i < 60; i++) makeRock(w, rnd(-23, 23), rnd(-180, -8) + DZ, rnd(0.3, 0.8), false);
  // obóz ludzi i elfów
  [[-7, -204, 2.4], [7, -207, 2.8], [0, -214, 3.2], [-14, -212, 2.6], [14, -216, 2.6]].forEach(([x, z, s], i) => tent(w, x, z + DZ, s, i));
  w.fire = fire(w, FIRE.x, FIRE.z, { light: 30, dist: 35 });
  banner(w, -4, -201 + DZ, 0x2a4a9a); banner(w, 5, -202 + DZ, 0x2a6a3a);
  torch(w, -10, -200 + DZ); torch(w, 10, -201 + DZ);
  return w;
}

// ---------- elf-strażnik z latarnią (z dema) ----------
const coneGeo = (() => { const L = 11, g = new THREE.ConeGeometry(Math.tan(CONE_A) * L, L, 32, 1, true); g.translate(0, -L / 2, 0); g.rotateX(-Math.PI / 2); return g; })();
const coneMatBase = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uOn: { value: 1 } },
  vertexShader: 'varying float vZ; void main(){ vZ = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform float uOn; varying float vZ; void main(){ float a = pow(1. - clamp(vZ / 11., 0., 1.), 1.6) * .16 * uOn; gl_FragColor = vec4(1., .75, .45, a); }'
});
const wristPos = V();
function makeGuard(w, shadows) {
  const c = new Char('elf'); w.scene.add(c.root);
  const lampG = new THREE.Group(); c.root.add(lampG);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.12), new THREE.MeshStandardMaterial({ color: 0x221a10, emissive: 0xffa040, emissiveIntensity: 3 }));
  lampG.add(lamp, new THREE.PointLight(0xffa84d, 4, 8, 2), glow(0xffa040, 1.3, true, 0.9));
  const spot = new THREE.SpotLight(0xffc27a, 40, 26, CONE_A, 0.45, 1);
  spot.target.position.set(0, -1.1, 6); spot.castShadow = shadows;
  if (shadows) { spot.shadow.mapSize.set(512, 512); spot.shadow.camera.near = 0.3; spot.shadow.camera.far = 26; spot.shadow.bias = -0.002; }
  lampG.add(spot, spot.target);
  const coneMat = coneMatBase.clone();
  const cone = new THREE.Mesh(coneGeo, coneMat); cone.rotation.x = Math.atan2(1.1, 6); lampG.add(cone);
  return { c, g: c.root, lamp, lampG, wrist: c.model.getObjectByName('WristL'), spot, coneMat, alert: 0, yaw: 0 };
}
function animateGuard(g, dt) {
  g.c.update(dt);
  g.g.updateMatrixWorld(true);
  g.wrist.getWorldPosition(wristPos); g.g.worldToLocal(wristPos);
  g.lampG.position.set(wristPos.x, wristPos.y - 0.12, Math.max(wristPos.z, 0.25));
}
const walkYaw = d => (d > 0 ? Math.PI / 2 : -Math.PI / 2);
function updateGuard(g, dt) {
  let yaw;
  if (g.state === 'listen') {
    g.c.play('guard'); g.t += dt;
    const to = Math.atan2(g.lx - g.x, g.lz - g.z);
    yaw = angLerp(g.yaw, to, damp(6, dt));
    if (g.t >= LISTEN_TIME) g.state = 'walk';
  } else if (g.state === 'walk') {
    g.c.play('walk');
    g.x += g.dir * g.speed * dt; yaw = walkYaw(g.dir);
    if ((g.dir > 0 && g.x >= g.x2) || (g.dir < 0 && g.x <= g.x1)) { g.x = clamp(g.x, g.x1, g.x2); g.state = 'look'; g.t = 0; }
  } else {
    g.c.play('idle');
    g.t += dt; const a = walkYaw(g.dir), sweepEnd = Math.sin(1.6 * 2.4) * 0.55;
    if (g.t < 0.6) yaw = lerp(a, 0, g.t / 0.6);
    else if (g.t < 2.2) yaw = Math.sin((g.t - 0.6) * 2.4) * 0.55;
    else yaw = lerp(sweepEnd, -a, Math.min(1, (g.t - 2.2) / 0.6));
    if (g.t >= 2.8) { g.dir *= -1; g.state = 'walk'; }
  }
  g.yaw = yaw; g.g.rotation.y = yaw;
  g.g.position.set(g.x, hAt(g.x, g.z), g.z);
}

export function roadStage() {
  const w = buildWorld();
  const bilbo = new Char('bilbo'); w.scene.add(bilbo.root);
  bilbo.play('walk'); bilbo.cur.timeScale = 0.8;
  const tpp = new TPP(w, bilbo, { speed: SNEAK, run: RUN, height: BILBO_H, bounds: [-24, 24, -229, 4.6] });
  const guards = [
    { z: -47, x1: -16, x2: 16, speed: 1.6, sx: -16, sdir: 1 },
    { z: -98, x1: -17, x2: 17, speed: 1.9, sx: 17, sdir: -1 },
    { z: -146, x1: -16, x2: 16, speed: 1.75, sx: -4, sdir: 1 },
  ].map(p => Object.assign(makeGuard(w, true), p, { z: p.z + DZ, x: p.sx, dir: p.sdir, state: 'walk', t: 0 }));
  const campGuards = [{ x: -2.4, z: -198.5 + DZ, yaw0: Math.PI / 2 }, { x: 2.6, z: -197 + DZ, yaw0: -Math.PI / 2 }].map(p => Object.assign(makeGuard(w, false), p));
  const ray = new THREE.Raycaster(), lp = V(), dir = V(), chest = V();
  const splash = glow(0xbfd8ff, 1, true, 0); w.scene.add(splash);

  let phase = 'rope', ring = 1, katar = 0, ringOn = false, tipsShown = 0, endLook = null;
  let ropeY = ROPE_TOP, rv = 0, danger = 0, py = 0, vy = 0, onGround = true, splashT = 9;
  const jv = V();
  const onStone = () => STONES.some(s => Math.hypot(tpp.pos.x - s.x, tpp.pos.z - s.z) < s.r + 0.2);
  tpp.step.surface = () => (phase === 'river' && onStone() ? 'stone' : tpp.running ? 'leaves' : 'grass');
  tpp.step.vol = 0.35;
  let ropeSnd = 0, sniffT = 0;

  const KEYS = {
    rope: 'Spacja (przytrzymaj) — zjazd po linie · R — od nowa · Esc — pauza · M — dźwięk',
    river: 'WASD — ruch · Spacja — skok · Shift — bieg · mysz — kamera · R — od nowa · Esc — pauza · M — dźwięk',
    sneak: 'WASD — skradanie · Shift — podbieganie · mysz — kamera · E — pierścień · R — od nowa · Esc — pauza · M — dźwięk',
  };
  function setRing(on) { if (on && !ringOn) sfx('ring'); ringOn = on; ringEffect(on, bilbo); }

  function reset(p = phase) {
    if (st.clearTimers) st.clearTimers();
    phase = p; st.state = st.state === 'intro' ? 'intro' : 'play';
    setRing(false); tpp.shake = 0; endLook = null;
    center(''); mark(''); $('vigAlert').style.opacity = 0; $('say').style.opacity = 0;
    hud({ speed: p === 'rope', ring: p === 'sneak', katar: p === 'sneak', keys: KEYS[p] });
    bilbo.root.visible = true;
    if (p === 'rope') { ropeY = ROPE_TOP; rv = 0; danger = 0; bilbo.play('idle'); }
    if (p === 'river') { tpp.reset(ROPE_X, 3.2, Math.PI); py = support(tpp.pos.x, tpp.pos.z) ?? 0; vy = 0; onGround = true; bilbo.play('idle'); }
    if (p === 'sneak') {
      tpp.reset(SNEAK_START.x, SNEAK_START.z, Math.PI); ring = 1; katar = 0; tipsShown = 0; bilbo.play('idle');
      guards.forEach(g => Object.assign(g, { x: g.sx, dir: g.sdir, state: 'walk', t: 0, alert: 0 }));
    }
    campGuards.forEach(g => { g.c.play('idle'); g.yaw = g.yaw0; g.turn = false; g.coneMat.uniforms.uOn.value = 0; g.spot.intensity = 0; g.g.rotation.y = g.yaw0; g.g.position.set(g.x, hAt(g.x, g.z), g.z); });
  }
  function fail(title, sub, then = phase) {
    st.state = 'fail'; setRing(false); tpp.shake = 0.15; bilbo.play('hit', { once: true });
    $('vigAlert').style.opacity = 1; center(title, sub); sfx('fail', { delay: 0.3 });
    st.at(2200, () => { reset(then); st.state = 'play'; });
  }
  function toRiver() {
    phase = 'river'; reset('river');
    say('Bilbo', 'Uff… Udało się zejść. Teraz rzeka.', 2600);
    tip('Przejdź przez rzekę po kamieniach. Spacja — skok. Gdy wpadniesz do wody, wracasz na brzeg.');
  }
  function toSneak() {
    reset('sneak');
    say('Bilbo', 'Jestem po drugiej stronie. Teraz cicho… Do obozu jeszcze daleko.', 3000);
    tip('Przy skale odpoczywasz: pierścień się ładuje, a katar maleje.');
  }
  function look(g) {
    g.lamp.getWorldPosition(lp);
    chest.set(tpp.pos.x, hAt(tpp.pos.x, tpp.pos.z) + BILBO_H * 0.6, tpp.pos.z);
    dir.subVectors(chest, lp);
    const d = dir.length(); if (d > SEE_DIST) return { seen: false };
    dir.divideScalar(d);
    const hl = Math.hypot(dir.x, dir.z) || 1;
    if ((Math.sin(g.yaw) * dir.x + Math.cos(g.yaw) * dir.z) / hl < Math.cos(CONE_A)) return { seen: false };
    ray.set(lp, dir); ray.far = d;
    return { seen: ray.intersectObjects(w.rockMeshes, false).length === 0, d };
  }
  // kichnięcie przy elfich strażnikach: scenka, a nie przegrana
  function ending() {
    st.state = 'end'; setRing(false); mark(''); bilbo.play('idle');
    const cg = campGuards[0]; endLook = cg;
    // nagranie: wdech 0,1–0,8 s, kichnięcie 1,35 s → start 0,15 s, kichnięcie razem z napisem „A-PSIK!”
    st.at(150, () => sfx('sneeze', { vary: 0 }));
    st.at(300, () => say('Bilbo', 'A… a…', 1000));
    st.at(1500, () => { say('Bilbo', 'A-PSIK!', 900); tpp.shake = 0.08; bilbo.play('hit', { once: true, then: 'idle' }); });
    st.at(2500, () => { cg.turn = true; cg.c.play('guard'); cg.coneMat.uniforms.uOn.value = 1; cg.spot.intensity = 40; mark('!'); });
    st.at(3000, () => say('Strażnik', 'Kto tam?! Stój!', 1600));
    st.at(4800, () => { mark(''); say('Bilbo', 'Zaprowadźcie mnie do Barda. Mam dla niego coś bardzo cennego.', 3000); });
    st.at(8000, () => st.finish());
  }

  const st = {
    id: 'z1-droga', w, musicVol: 0.35, amb: { night: 0.8 },
    title: 'Droga do obozu',
    text: 'Noc. Bilbo wymyka się z Samotnej Góry z Arcyklejnotem w kieszeni.\nZejdź z muru po linie, przejdź przez rzekę i dojdź do ogniska w obozie ludzi i elfów tak, żeby nikt cię nie zobaczył.',
    keys: 'Spacja — zjazd po linie i skok · WASD — ruch · Shift — podbieganie · mysz — kamera · E — pierścień · R — od nowa · Esc — pauza · M — dźwięk',
    begin() { reset('rope'); tip('Przytrzymaj Spację, aby zjeżdżać. Puść, zanim pasek wejdzie na czerwone pole — inaczej lina wyślizgnie się z rąk.', 8000); },
    // haki testowe
    tp(x, z) { tpp.pos.set(x, 0, z); },
    get river() { return { x: tpp.pos.x, z: tpp.pos.z, y: py, onGround, state: st.state }; },
    stones: STONES,
    aim(dx, dz) { const y = Math.atan2(dx, dz); tpp.camYaw = y + Math.PI; tpp.yaw = y; },
    setPhase(p) { reset(p); st.state = 'play'; },
    get phase() { return phase; }, get ringOn() { return ringOn; },
    setRing,
    update(dt, t) {
      const play = st.state === 'play';
      if (play && hit('KeyR')) reset();
      if (st.state !== 'fail') guards.forEach(g => updateGuard(g, dt));
      [...guards, ...campGuards].forEach(g => animateGuard(g, st.state === 'fail' ? 0 : dt));
      bilbo.update(dt);

      // tło: świerszcze zawsze, rzeka i ognisko głośniej z bliska, skrzypienie liny na murze
      const pz = phase === 'rope' ? 5 : tpp.pos.z;
      setAmb('river', Math.max(0, 1 - Math.abs(pz + 11) / 26));
      setAmb('fire', phase === 'sneak' ? Math.max(0, 1 - Math.hypot(tpp.pos.x - FIRE.x, tpp.pos.z - FIRE.z) / 45) : 0);
      setAmb('rope', phase === 'rope' ? 0.25 + Math.min(0.75, rv / 3) : 0);
      if (phase === 'rope') {
        // ---------- zejście z muru po linie: rytm klawisza ----------
        if (play) {
          ropeSnd -= dt;
          if (rv > 0.4 && ropeSnd <= 0) { sfx('rope_slide', { vol: 0.25 + rv * 0.15, rate: 0.8 + rv * 0.1 }); ropeSnd = 0.38; }
          if (key('Space', 'KeyS', 'ArrowDown')) rv = Math.min(rv + ROPE_ACC * dt, ROPE_MAX); else rv = Math.max(rv - ROPE_GRIP * dt, 0);
          ropeY -= rv * dt;
          danger = rv > ROPE_SAFE ? danger + dt : 0;
          bilbo.play(rv > 0.15 ? 'walk' : 'idle', { speed: 0.4 + rv * 0.5 });
          if (danger > ROPE_SLIP) {
            st.state = 'slip'; rv = 0; bilbo.play('hit', { once: true }); tpp.shake = 0.12; sfx('rope_slide', { vol: 1, rate: 0.7 }); sfx('fall', { delay: 0.5 }); sfx('fail', { delay: 0.6 });
            center('Za szybko!', 'Lina wyślizguje się Bilbowi z rąk.\nZaczynasz od nowa…'); $('vigAlert').style.opacity = 0.7;
            st.at(2000, () => { reset('rope'); st.state = 'play'; });
          }
          const gy = hAt(ROPE_X, ROPE_Z);
          if (ropeY <= gy) { ropeY = gy; toRiver(); }
        } else if (st.state === 'slip') ropeY = Math.max(hAt(ROPE_X, ROPE_Z) + 3, ropeY - 6 * dt);
        setBar('speedBar', rv / ROPE_BAR, rv > ROPE_SAFE);
        bilbo.root.position.set(ROPE_X, ropeY, ROPE_Z); bilbo.root.rotation.y = 0;
        // kamera z boku: widać mur, linę i drogę w dół
        const want = V(ROPE_X + 3.4, ropeY + 1.3, ROPE_Z - 4.4);
        camera.position.lerp(want, st.state === 'intro' ? 1 : damp(4, dt));
        camera.lookAt(ROPE_X, ropeY + 0.2, ROPE_Z);
        w.focus.set(ROPE_X, ropeY, ROPE_Z);
        w.fill.intensity = 14; w.fill.position.set(ROPE_X + 1.5, ropeY + 1.5, ROPE_Z - 1.8);
      } else if (phase === 'river') {
        // ---------- przeprawa przez rzekę po kamieniach ----------
        if (play) {
          tpp.look();
          if (onGround) {
            const mv = tpp.move(dt);
            if (hit('Space')) {
              vy = JUMP_V; onGround = false; bilbo.play('run');
              jv.set(mv ? mv.x : 0, 0, mv ? mv.z : 0).multiplyScalar(mv ? JUMP_H : 0);   // stała długość skoku ok. 1,6 m
            }
          } else {
            tpp.pos.x += jv.x * dt; tpp.pos.z += jv.z * dt; tpp.collide();
            vy -= GRAV * dt; py += vy * dt;
          }
          const sup = support(tpp.pos.x, tpp.pos.z);
          if (onGround) { if (sup === null) { onGround = false; vy = 0; jv.set(0, 0, 0); } else py = sup; }
          else if (sup !== null && py <= sup && vy <= 0) { py = sup; onGround = true; bilbo.play('idle'); sfx(onStone() ? 'step_stone' : 'land', { vol: 0.8, rate: 1.1 }); }
          if (!onGround && sup === null && py < WATER_Y - 0.2) {
            splash.position.set(tpp.pos.x, WATER_Y + 0.3, tpp.pos.z); splashT = 0; sfx('splash');
            fail('Plusk!', 'Bilbo wpadł do wody.\nWracasz na brzeg…');
          }
          if (onGround && tpp.pos.z < RIVER_Z2 - 1.0) toSneak();
        } else if (st.state === 'fail') py = Math.max(py - 1.5 * dt, WATER_Y - 1.4);
        tpp.place(py);
        tpp.camera(dt, { y: Math.max(py, WATER_Y) });
      } else {
        // ---------- skradanie (mechanika z dema bez zmian) ----------
        if (play) {
          tpp.look();
          tpp.extra = guards.map(g => ({ x: g.x, z: g.z, r: 0.35 }));
          tpp.move(dt);
          if (hit('KeyE')) setRing(!ringOn && ring > 0.05);
          const nearRock = w.rocks.some(k => k.big && Math.hypot(tpp.pos.x - k.x, tpp.pos.z - k.z) < k.r + 1.8);
          if (ringOn) { ring -= dt / RING_TIME; if (ring <= 0) { ring = 0; setRing(false); } }
          else if (nearRock) ring = Math.min(1, ring + dt / RING_RECHARGE);
          katar = clamp(katar + (nearRock ? -KATAR_DOWN : KATAR_UP * (tpp.running ? RUN_KATAR : 1)) * dt, 0, 1);
          // katar blisko pełnego: Bilbo pociąga nosem
          sniffT -= dt;
          if (katar > 0.7 && sniffT <= 0) { sfx('sniff', { vol: 0.6, rate: 1.1 }); sniffT = 2.5 + Math.random() * 1.5; }
          $('status').textContent = nearRock ? '● Przy skale — odpoczywasz' : tpp.running ? '● Podbiegasz — hałas i zadyszka: strażnicy w pobliżu cię usłyszą' : '';
          if (tpp.pos.z < -30 + DZ && tipsShown === 0) { tipsShown = 1; tip('Latarnia widzi daleko, ale skała zasłania cię przed jej światłem. E — załóż pierścień.'); }
          if (katar >= 1) { sfx('sneeze_katar', { offset: 0.95, vary: 0 }); fail('A-PSIK!', 'Strażnicy usłyszeli kichnięcie.\nWracasz na początek etapu…'); }
          else {
            let maxA = 0, sus = false;
            for (const g of guards) {
              if (tpp.running && Math.hypot(g.x - tpp.pos.x, g.z - tpp.pos.z) < NOISE_R) Object.assign(g, { state: 'listen', t: 0, lx: tpp.pos.x, lz: tpp.pos.z });
              if (g.state === 'listen') sus = true;
              const v = look(g);
              if (v.seen && !ringOn) g.alert += dt * (v.d < 8 ? 2 : 1); else g.alert = Math.max(0, g.alert - dt * 0.5);
              if (v.seen && ringOn) sus = true;
              maxA = Math.max(maxA, g.alert);
            }
            $('vigAlert').style.opacity = Math.min(1, maxA / ALERT_MAX);
            mark(maxA > 0.05 ? '!' : sus ? '?' : '');
            if (maxA >= ALERT_MAX) fail('Strażnik cię zauważył!', 'Wracasz na początek etapu…');
            else if (tpp.pos.z < END_Z) ending();
          }
        }
        if (st.state === 'end' && endLook) {
          // scenka: Bilbo odwraca się do strażnika, kamera płynnie ustawia się za Bilbem
          const cg = endLook, toG = Math.atan2(cg.x - tpp.pos.x, cg.z - tpp.pos.z);
          tpp.yaw = angLerp(tpp.yaw, toG, damp(3, dt));
          tpp.camYaw = angLerp(tpp.camYaw, toG + Math.PI, damp(2, dt));
          tpp.camPitch = lerp(tpp.camPitch, 0.15, damp(2, dt));
          if (cg.turn) { cg.yaw = angLerp(cg.yaw, Math.atan2(tpp.pos.x - cg.x, tpp.pos.z - cg.z), damp(4, dt)); cg.g.rotation.y = cg.yaw; }
        }
        tpp.place();
        tpp.camera(dt);
        setBar('ringBar', ring); setBar('katarBar', katar, katar > 0.75);
      }
      // rozbryzg wody
      splashT += dt; splash.material.opacity = Math.max(0, 0.9 - splashT); splash.scale.setScalar(1 + splashT * 5);
    },
  };
  reset('rope');
  return runStage(st);
}
