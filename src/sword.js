// Zakończenie 3, etap 3D: Thorin z mieczem. Przeciwnicy padają ogłuszeni lub rozbrojeni (bez krwi).
import * as THREE from 'three';
import { $, input, hit, rnd, damp, angLerp, angDiff, V } from './core.js';
import { nightWorld, daylight, battlefield } from './env.js';
import { Char } from './chars.js';
import { TPP } from './tpp.js';
import { hud, say, tip, center } from './ui.js';
import { runStage } from './stage.js';
import { makeCtx, tickActors } from './scenes.js';
import { sfx } from './sfx.js';

// ---------- parametry (do strojenia) ----------
const NEED = 5, MAX_ALIVE = 2, HP = 2;
const REACH = 2.5, ARC = 1.1, SWING = 0.8, HIT_AT = 280;   // zasięg [m], połowa kąta trafienia [rad], czas ciosu [s], moment trafienia [ms]
const FOE_STOP = 1.7, FOE_ATTACK = [1.8, 2.6];

export function swordStage() {
  const w = nightWorld({ shadowSize: 50 });
  battlefield(w);
  daylight(w);
  const ctx = makeCtx(w);
  // tło: armia Dáina walczy z ludźmi i elfami
  ctx.duel('ironDwarf', 'human', -12, -22, 0.3, { a: { i: 0 }, b: { i: 1 } });
  ctx.duel('ironDwarf', 'elf', 10, -26, -0.3, { a: { i: 1 } });
  ctx.duel('dain', 'human', -4, -34, 0.1, { b: { i: 3 } });
  ctx.duel('dwarf', 'elf', 18, -12, -0.8, { a: { i: 1 }, b: { i: 1 } });
  ctx.duel('ironDwarf', 'human', -20, -8, 0.9, { a: { i: 2 }, b: { i: 4 } });

  const thorin = new Char('thorin'); w.scene.add(thorin.root);
  const tpp = new TPP(w, thorin, { speed: 2.6, run: 5, height: 1.4, dist: 3.4, bounds: [-30, 30, -40, 25] });
  tpp.step.len = 0.6; tpp.step.rate = 0.9; tpp.step.vol = 0.5;
  const foes = [];
  let kills = 0, spawned = 0, cd = 0, spawnT = 0.5;

  function reset() {
    st.clearTimers && st.clearTimers();
    foes.forEach(f => { w.scene.remove(f.c.root); if (f.blade) w.scene.remove(f.blade); }); foes.length = 0;
    kills = 0; spawned = 0; cd = 0; spawnT = 0.5;
    tpp.reset(0, 6, Math.PI); center('');
    hud({ counter: `Pokonani: 0 / ${NEED}`, keys: st.keys });
    if (st.state !== 'intro') st.state = 'play';
  }
  function spawn() {
    const kind = spawned % 2 ? 'elf' : 'human';
    const c = new Char(kind, { i: spawned });
    if (kind === 'human') c.addSword();
    const a = tpp.viewYaw + rnd(-0.9, 0.9), d = rnd(12, 16);
    const x = Math.max(-28, Math.min(28, tpp.pos.x + Math.sin(a) * d)), z = Math.max(-38, Math.min(22, tpp.pos.z + Math.cos(a) * d));
    c.root.position.set(x, w.h(x, z), z); w.scene.add(c.root);
    foes.push({ c, kind, hp: HP, atk: rnd(1, 2), stun: 0, down: false });
    spawned++;
  }
  function defeat(f) {
    f.down = true; f.c.play('death', { once: true, fade: 0.1 }); sfx('fall', { delay: 0.5, vol: 0.8 });
    // broń wypada z ręki i leży na ziemi
    const s = f.c.sword || f.c.model.getObjectByName('Sword');
    if (s) {
      const p = s.getWorldPosition(V());
      w.scene.attach(s); s.position.set(p.x + rnd(-0.6, 0.6), w.h(p.x, p.z) + 0.05, p.z + rnd(-0.6, 0.6)); s.rotation.set(Math.PI / 2, 0, rnd(0, 6)); f.blade = s;
    }
    kills++;
    $('counter').textContent = `Pokonani: ${kills} / ${NEED}`;
    say('', f.kind === 'elf' ? 'Elf rozbrojony!' : 'Wojownik ogłuszony!', 1400);
    if (kills >= NEED) {
      st.state = 'end'; sfx('win'); thorin.play('idle');
      center('Zwycięstwo!', 'Thorin pokonał pięciu przeciwników.');
      st.at(2600, () => st.finish());
    }
  }
  function swing() {
    cd = SWING;
    tpp.yaw = tpp.viewYaw; thorin.root.rotation.y = tpp.yaw;
    thorin.play('attack', { once: true, then: 'idle', fade: 0.08, speed: 1.3 });
    sfx('swing', { vol: 0.8 });
    st.at(HIT_AT, () => {
      for (const f of foes) {
        if (f.down) continue;
        const dx = f.c.root.position.x - tpp.pos.x, dz = f.c.root.position.z - tpp.pos.z;
        if (Math.hypot(dx, dz) > REACH || Math.abs(angDiff(tpp.yaw, Math.atan2(dx, dz))) > ARC) continue;
        sfx('clash', { vol: 0.9 }); f.hp--;
        if (f.hp <= 0) defeat(f);
        else {
          f.c.play('hit', { once: true, then: 'guard', fade: 0.08 }); f.stun = 0.9;
          const d = Math.hypot(dx, dz) || 1; f.c.root.position.x += dx / d * 0.9; f.c.root.position.z += dz / d * 0.9;
        }
      }
    });
  }

  const st = {
    id: 'thorin-miecz', w, musicVol: 0.3, amb: { battle: 0.6, fire: 0.25 },
    title: 'Thorin z mieczem',
    text: 'Krasnoludy walczą z ludźmi i elfami.\nPokonaj pięciu przeciwników. Każdy pada po dwóch ciosach — ogłuszony albo rozbrojony.',
    keys: 'WASD — ruch · Shift — bieg · mysz — kamera i kierunek ciosu · lewy przycisk — cios mieczem · R — od nowa · Esc — pauza · M — dźwięk',
    begin() { reset(); tip('Obróć kamerę w stronę przeciwnika i uderz lewym przyciskiem myszy.'); },
    get kills() { return kills; },
    autoKill() { let f = foes.find(x => !x.down); if (!f) { spawn(); f = foes[foes.length - 1]; } defeat(f); },
    update(dt) {
      const play = st.state === 'play';
      if (play && hit('KeyR')) reset();
      if (play) {
        tpp.look();
        cd -= dt;
        if (cd > SWING - 0.5) tpp.move(dt, { anim: false, face: false, speed: 0.6 });
        else tpp.move(dt);
        if (input.clicks.has(0) && cd <= 0) swing();
        spawnT -= dt;
        const alive = foes.filter(f => !f.down).length;
        if (spawnT <= 0 && alive < MAX_ALIVE && spawned < NEED) { spawn(); spawnT = 2.5; }
      }
      tpp.extra = foes.filter(f => !f.down).map(f => ({ x: f.c.root.position.x, z: f.c.root.position.z, r: 0.4 }));
      for (const f of foes) {
        if (!f.down) {
          const p = f.c.root.position, dx = tpp.pos.x - p.x, dz = tpp.pos.z - p.z, d = Math.hypot(dx, dz);
          f.c.root.rotation.y = angLerp(f.c.root.rotation.y, Math.atan2(dx, dz), damp(6, dt));
          if (st.state !== 'play') f.c.play('guard');
          else if (f.stun > 0) f.stun -= dt;
          else if (d > FOE_STOP) { const sp = d > 6 ? 3.6 : 2; p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; f.c.play(d > 6 ? 'run' : 'walk'); }
          else {
            if (f.c.curName !== 'attack' && f.c.curName !== 'hit') f.c.play('guard');
            f.atk -= dt;
            if (f.atk <= 0) {
              f.atk = rnd(...FOE_ATTACK); f.c.play('attack', { once: true, then: 'guard', fade: 0.1 });
              // Thorin nie może zginąć: trafienie = wstrząs i czerwony błysk
              st.at(420, () => {
                if (f.down || st.state !== 'play' || Math.hypot(tpp.pos.x - p.x, tpp.pos.z - p.z) > 2.3) return;
                sfx('clash', { vol: 0.7, rate: 0.9 }); tpp.shake = 0.1; $('vigAlert').style.opacity = 0.5; setTimeout(() => ($('vigAlert').style.opacity = 0), 250);
                if (cd <= 0) thorin.play('hit', { once: true, then: 'idle', fade: 0.08 });
              });
            }
          }
          for (const o of foes) if (o !== f && !o.down) {
            const op = o.c.root.position, ox = p.x - op.x, oz = p.z - op.z, od = Math.hypot(ox, oz);
            if (od < 1.2 && od > 0) { p.x += ox / od * (1.2 - od) * 0.5; p.z += oz / od * (1.2 - od) * 0.5; }
          }
          p.y = w.h(p.x, p.z);
        }
        f.c.update(dt);
      }
      tickActors(ctx, dt);
      thorin.update(dt);
      tpp.place();
      tpp.camera(dt);
    },
  };
  reset();
  return runStage(st);
}
