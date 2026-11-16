// Etap 3D: Bard z łukiem (zakończenia 1 i 2). Celowanie przez ramię, strzała leci łukiem.
import * as THREE from 'three';
import { $, camera, input, hit, rnd, damp, angLerp, angDiff, V } from './core.js';
import { nightWorld, daylight, battlefield } from './env.js';
import { Char, Rider, makeBow, makeArrow } from './chars.js';
import { TPP } from './tpp.js';
import { hud, say, tip, center } from './ui.js';
import { runStage } from './stage.js';
import { makeCtx, tickActors, battleAllies, dwarfGroup } from './scenes.js';
import { sfx } from './sfx.js';

// ---------- parametry (do strojenia) ----------
const NEED = 5, MAX_ALIVE = 3, SPAWN_EVERY = 3.5;
const ARROW_V = 46, GRAV = 7, COOLDOWN = 0.7;
const HIT_R = 1.25, REACH = 2.6, BITE_EVERY = 1.6;

export function bowStage({ dwarves = 'fight' } = {}) {
  const w = nightWorld({ shadowSize: 50 });
  battlefield(w);
  daylight(w);
  w.scene.fog.density = 0.012;   // wrogów widać z daleka
  const ctx = makeCtx(w);
  battleAllies(ctx, { dwarves: dwarves === 'fight' });
  if (dwarves === 'fight') ctx.duel('thorin', 'goblin', -18, -14, 0.5);
  // zakończenie 2: Thorin i 12 krasnoludów stoją z boku i tylko patrzą
  if (dwarves === 'watch') dwarfGroup(ctx, 9, 0, -Math.PI / 2 - 0.6);

  const bard = new Char('bard'); w.scene.add(bard.root);
  const bow = makeBow(1.25); bard.hold(bow, 'WristR', V(0, 0, 0.1));
  const tpp = new TPP(w, bard, { speed: 2.4, run: 4.8, height: 1.7, dist: 3.4, bounds: [-40, 40, -60, 30] });
  const riders = [], arrows = [];
  const ray = new THREE.Raycaster(), sph = new THREE.Sphere(), tmp = V(), aimP = V(), start = V();
  let kills = 0, spawnT = 1, cd = 0, aiming = false;

  function clearAll() {
    riders.forEach(r => w.scene.remove(r.root)); riders.length = 0;
    arrows.forEach(a => w.scene.remove(a.mesh)); arrows.length = 0;
  }
  function reset() {
    st.clearTimers && st.clearTimers();
    clearAll(); kills = 0; spawnT = 1; cd = 0;
    tpp.reset(0, 8, Math.PI); center('');
    hud({ counter: `Pokonani: 0 / ${NEED}`, cross: true, keys: st.keys });
    if (st.state !== 'intro') st.state = 'play';
  }
  function spawn() {
    const r = new Rider(), x = rnd(-26, 26), z = -46 - rnd(0, 10);
    r.root.position.set(x, w.h(x, z), z); w.scene.add(r.root);
    Object.assign(r, { speed: rnd(5.5, 7), bite: 0.6 });
    r.warg.play('run'); riders.push(r);
    sfx(Math.random() < 0.5 ? 'howl' : 'goblin_snarl', { vol: 0.35 });
  }
  function kill(r) {
    r.alive = false; r.warg.play('death', { once: true, fade: 0.1 }); r.gob.play('death', { once: true, fade: 0.1 });
    kills++; sfx('arrow_hit'); sfx('goblin_death', { delay: 0.08, vol: 0.8 }); sfx('fall', { delay: 0.6, vol: 0.7 });
    $('counter').textContent = `Pokonani: ${kills} / ${NEED}`;
    say('', kills < NEED ? 'Trafiony!' : 'Ostatni wróg pokonany!', 1200);
    if (kills >= NEED) {
      st.state = 'end'; sfx('win');
      center('Zwycięstwo!', 'Bard pokonał pięciu wrogów.');
      st.at(2600, () => st.finish());
    }
  }
  function shoot() {
    cd = COOLDOWN;
    tpp.yaw = tpp.viewYaw;
    bard.play('shoot', { once: true, then: aiming ? 'aim' : 'idle', fade: 0.08 });
    // cel: to, co jest pod celownikiem (wróg albo ziemia)
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    let best = Infinity;
    aimP.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 150);
    for (const r of riders) if (r.alive) {
      sph.set(V(r.pos.x, r.pos.y + 1.3, r.pos.z), HIT_R);
      if (ray.ray.intersectSphere(sph, tmp)) { const d = tmp.distanceTo(ray.ray.origin); if (d < best) { best = d; aimP.copy(tmp); } }
    }
    const g = ray.intersectObject(w.ground, false)[0];
    if (g && g.distance < best) aimP.copy(g.point);
    bard.root.updateMatrixWorld(true);
    bow.getWorldPosition(start); start.y += 0.1;
    const mesh = makeArrow(0.85); mesh.position.copy(start); w.scene.add(mesh);
    arrows.push({ mesh, pos: start.clone(), vel: aimP.clone().sub(start).normalize().multiplyScalar(ARROW_V), life: 0, fly: true });
    sfx('bow');
  }

  const st = {
    id: 'bard-luk', w, musicVol: 0.3, amb: { battle: 0.55, fire: 0.25 },
    title: 'Bard z łukiem',
    text: 'Gobliny na wargach pędzą przez pole bitwy.\nPokonaj pięciu wrogów. Strzała leci łukiem i opada — gdy wróg jest daleko, celuj trochę wyżej.',
    keys: 'WASD — ruch · mysz — celowanie · prawy przycisk — przybliżenie · lewy przycisk — strzał · R — od nowa · Esc — pauza · M — dźwięk',
    begin() { reset(); tip('Przytrzymaj prawy przycisk myszy, aby przybliżyć widok. Lewy przycisk — strzał.'); },
    get kills() { return kills; },
    get riders() { return riders.map(r => ({ x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), alive: r.alive, vis: r.root.visible, inScene: !!r.root.parent })); },
    // hak testowy: trafienie najbliższego wroga
    autoKill() { const r = riders.find(x => x.alive); if (r) kill(r); else { spawn(); kill(riders[riders.length - 1]); } },
    aimAt(i = 0) { const r = riders.filter(x => x.alive)[i]; if (!r) return false; const d = V().subVectors(r.pos, tpp.pos); tpp.camYaw = Math.atan2(-d.x, -d.z); tpp.camPitch = 0.05; return true; },
    update(dt) {
      const play = st.state === 'play';
      if (play && hit('KeyR')) reset();
      if (play) {
        tpp.look();
        aiming = input.buttons.has(2);
        if (aiming) {
          tpp.move(dt, { anim: false, face: false, canRun: false, speed: 1.4 });
          tpp.yaw = angLerp(tpp.yaw, tpp.viewYaw, damp(14, dt));
          if (bard.curName !== 'shoot') bard.play('aim', { fade: 0.15 });
        } else if (bard.curName !== 'shoot') tpp.move(dt);
        else tpp.move(dt, { anim: false });
        cd -= dt;
        if (input.clicks.has(0) && cd <= 0) shoot();
        // wrogowie: dołączają, gdy brakuje żywych
        spawnT -= dt;
        const alive = riders.filter(r => r.alive !== false).length;
        if (spawnT <= 0 && alive < MAX_ALIVE && kills + alive < NEED) { spawn(); spawnT = SPAWN_EVERY; }
      }
      $('cross').classList.toggle('aim', aiming);
      // wargi pędzą do Barda; Bard nie może zginąć (cios = wstrząs i odepchnięcie wroga)
      for (const r of riders) {
        if (r.alive === false) { r.update(dt); continue; }
        const dx = tpp.pos.x - r.pos.x, dz = tpp.pos.z - r.pos.z, d = Math.hypot(dx, dz);
        r.root.rotation.y = angLerp(r.root.rotation.y, Math.atan2(dx, dz), damp(5, dt));
        if (st.state !== 'play') { r.warg.play('idle'); }
        else if (d > REACH) {
          const s = Math.min(d - REACH, r.speed * dt); r.pos.x += dx / d * s; r.pos.z += dz / d * s; r.warg.play('run');
        } else {
          r.warg.play('idle'); r.bite -= dt;
          if (r.bite <= 0) {
            r.bite = BITE_EVERY; r.warg.play('attack', { once: true, then: 'idle', fade: 0.1 }); r.gob.play('attack', { once: true, then: 'idle' });
            sfx('snarl', { vol: 0.7, vary: 0.12 }); st.at(350, () => { if (r.alive !== false && st.state === 'play') { sfx('thump', { vol: 0.6 }); tpp.shake = 0.12; $('vigAlert').style.opacity = 0.6; setTimeout(() => ($('vigAlert').style.opacity = 0), 250); sfx('thud'); } });
          }
        }
        for (const o of riders) if (o !== r && o.alive !== false) {   // nie wchodzą na siebie
          const ox = r.pos.x - o.pos.x, oz = r.pos.z - o.pos.z, od = Math.hypot(ox, oz);
          if (od < 2.2 && od > 0) { r.pos.x += ox / od * (2.2 - od) * 0.5; r.pos.z += oz / od * (2.2 - od) * 0.5; }
        }
        r.pos.y = w.h(r.pos.x, r.pos.z);
        r.update(dt);
      }
      // strzały: grawitacja, trafienie = odcinek lotu przecina sferę wroga
      for (const a of arrows) {
        if (!a.fly) continue;
        a.life += dt;
        const prev = a.pos.clone();
        a.vel.y -= GRAV * dt; a.pos.addScaledVector(a.vel, dt);
        a.mesh.position.copy(a.pos); a.mesh.lookAt(tmp.copy(a.pos).add(a.vel));
        const seg = new THREE.Line3(prev, a.pos.clone());
        for (const r of riders) if (r.alive !== false) {
          const c = V(r.pos.x, r.pos.y + 1.3, r.pos.z);
          if (seg.closestPointToPoint(c, true, tmp).distanceTo(c) < HIT_R) { a.fly = false; r.gob.root.attach(a.mesh); if (st.state === 'play') kill(r); break; }
        }
        if (a.fly && (a.pos.y < w.h(a.pos.x, a.pos.z) || a.life > 6)) a.fly = false;
      }
      while (arrows.length > 30) w.scene.remove(arrows.shift().mesh);
      tickActors(ctx, dt);
      bard.update(dt);
      tpp.place();
      tpp.camera(dt, { dist: aiming ? 1.6 : 3.4, shoulder: aiming ? 0.6 : 0.45, fov: aiming ? 42 : 68 });
    },
  };
  reset();
  return runStage(st);
}
