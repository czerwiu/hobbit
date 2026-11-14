// Zakończenie 3, etap 3D: Bilbo zakłada pierścień i chowa się za kamieniem. Bez możliwości przegranej.
import * as THREE from 'three';
import { hit, rnd, V } from './core.js';
import { nightWorld, battlefield, glow } from './env.js';
import { Char } from './chars.js';
import { TPP } from './tpp.js';
import { hud, tip, center, ringEffect } from './ui.js';
import { runStage } from './stage.js';
import { makeCtx, tickActors, riders } from './scenes.js';
import { sfx } from './sfx.js';

const SPOT = V(-14, 0, -20.2), SPOT_R = 1.4;   // miejsce za kamieniem (-14, -16)

export function hideStage() {
  const w = nightWorld({ shadowSize: 50 });
  battlefield(w);
  const ctx = makeCtx(w);
  // tło: gobliny na wargach i ostatni krasnoludzi
  ctx.duel('dwarf', 'goblin', 8, -6, -0.6, { a: { i: 2 } });
  ctx.duel('ironDwarf', 'goblin', 14, -14, -0.3);
  ctx.duel('thorin', 'goblin', 4, -16, 0.2);
  for (let i = 0; i < 6; i++) ctx.add(i % 2 ? 'dwarf' : 'ironDwarf', rnd(0, 20), rnd(-24, 0), rnd(0, 6.3), 'death', { i });
  riders(ctx, 6, -90, -18);

  const bilbo = new Char('bilbo'); w.scene.add(bilbo.root);
  const tpp = new TPP(w, bilbo, { speed: 1.9, run: 4.6, height: 1.1, bounds: [-40, 30, -45, 25] });
  // znacznik: świetlisty krąg i słup światła za kamieniem
  SPOT.y = w.h(SPOT.x, SPOT.z);
  const ring = new THREE.Mesh(new THREE.RingGeometry(SPOT_R - 0.15, SPOT_R, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(SPOT.x, SPOT.y + 0.06, SPOT.z); w.scene.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(SPOT.x, SPOT.y + 7, SPOT.z); w.scene.add(beam);
  const halo = glow(0xffd27a, 3, true, 0.6); halo.position.set(SPOT.x, SPOT.y + 0.5, SPOT.z); w.scene.add(halo);
  let ringOn = false, warned = false;

  const st = {
    id: 'bilbo-kamien', w, musicVol: 0.35, amb: { battle: 0.45, night: 0.4, fire: 0.2 },
    title: 'Bilbo się chowa',
    text: 'Gobliny i wargi atakują osłabione krasnoludy. Bilbo nie umie walczyć.\nZałóż pierścień i schowaj się za kamieniem oznaczonym światłem.',
    keys: 'WASD — ruch · Shift — bieg · mysz — kamera · E — pierścień · Esc — pauza · M — dźwięk',
    begin() { tip('Naciśnij E, aby założyć pierścień. Potem idź do światła za kamieniem.'); },
    get ringOn() { return ringOn; },
    tp(x, z) { tpp.pos.set(x, 0, z); },
    update(dt, t) {
      if (st.state === 'play') {
        tpp.look(); tpp.move(dt);
        if (hit('KeyE')) { ringOn = !ringOn; ringEffect(ringOn, bilbo); if (ringOn) sfx('ring'); }
        if (Math.hypot(tpp.pos.x - SPOT.x, tpp.pos.z - SPOT.z) < SPOT_R) {
          if (ringOn) {
            st.state = 'end'; bilbo.play('idle');
            center('Bilbo się ukrył', 'Nikt go nie widzi…');
            st.at(2800, () => st.finish());
          } else if (!warned) { warned = true; tip('Najpierw załóż pierścień (E)!', 4000); }
        } else warned = false;
      }
      ring.material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
      tickActors(ctx, dt);
      bilbo.update(dt);
      tpp.place();
      tpp.camera(dt);
    },
  };
  tpp.reset(4, 10, Math.PI + 0.6);
  hud({ keys: st.keys });
  const done = runStage(st);
  return done.then(() => ringEffect(false, bilbo));
}
