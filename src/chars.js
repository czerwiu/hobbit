// Postacie: modele Quaterniusa (CC0) przerobione w kodzie (wzrost, proporcje, kolory, broń).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { V } from './core.js';

const RAW = {};
const parse = b64 => new Promise((ok, err) => {
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  new GLTFLoader().parse(bin.buffer, '', ok, err);
});
export async function loadModels(progress) {
  const names = Object.keys(window.MODELS || {});
  let n = 0;
  for (const k of names) {
    const g = await parse(window.MODELS[k]); delete window.MODELS[k];
    g.scene.updateMatrixWorld(true);
    // wzrost liczony od kości Head_end (Box3 dla siatek ze szkieletem daje błędny wynik)
    const he = g.scene.getObjectByName('Head_end');
    g.headY = he ? he.getWorldPosition(V()).y : new THREE.Box3().setFromObject(g.scene).max.y;
    g.clips = {};
    for (const a of g.animations) { const s = a.name.split('|').pop(); if (!g.clips[s]) g.clips[s] = a; }
    RAW[k] = g;
    progress(++n / names.length);
    await new Promise(r => setTimeout(r, 0));
  }
}

// ---------- stroje ----------
const BILBO = { Shirt: 0x8e2a1e, UnderShirt: 0xe8dcc0, Pants: 0x6a4a2a, Boots: 0xe0ac85, Hair: 0x5a3518 };
// kaptury krasnoludów jak w książce (Dwalin, Balin, Kili, Fili, Dori, Nori, Ori, Óin, Glóin, Bifur, Bofur, Bombur)
const HOODS = [0x2a4a2a, 0x8a2020, 0x2a4a8a, 0x2a4a8a, 0x5a2a6a, 0x5a2a6a, 0x6a6a6a, 0x5a3a20, 0xc8c8b8, 0xa8882a, 0xa8882a, 0x7a9a6a];
const BEARDS = [0x3a3a3a, 0xd8d8d0, 0x3a2414, 0xc0a040, 0x5a3a20, 0x2a1a10, 0x6a4a2a, 0x8a8a80, 0x7a3a1a, 0x2a1a10, 0x3a2414, 0xa06a2a];
const MEN = [[0x4a3a2a, 0x6a5a40], [0x2a3446, 0x4a5466], [0x5a4630, 0x3a3020], [0x3a3a30, 0x5a5a48], [0x4a2a24, 0x6a4a3a]];
const ELVES = [{}, { Brown: 0x2e4a2a, Brown2: 0x24381e, LightBrown: 0x5a7a4a }, { Brown: 0x3a4a3a, LightBrown: 0x8a9a7a }];
const IRON = [0x6a6e76, 0x7a2a1e, 0x4a4e56];

export const KINDS = {
  bilbo: { glb: 'bilbo', h: 1.1, xz: 1.15, colors: BILBO, glow: 0.2, feet: 1.6 },
  elf: { glb: 'elf', h: 1.95, glow: 0.08, palette: ELVES },
  elfKing: { glb: 'king', h: 2.0, glow: 0.12, colors: { Blue: 0x24502c, Beige: 0xb8c4a0, DarkBrown: 0x2a3a22, Hair_White: 0xe8e2c8, Metal: 0xc8ccd4 } },
  thorin: { glb: 'king', h: 1.42, xz: 1.3, glow: 0.14, sword: true, colors: { Blue: 0x1e3a78, Beige: 0x5a4632, DarkBrown: 0x2a1c12, Hair_White: 0x2a1e16 } },
  dain: { glb: 'king', h: 1.4, xz: 1.35, glow: 0.12, sword: true, colors: { Blue: 0x7a2418, Beige: 0x6a5038, Hair_White: 0xb0602a } },
  dwarf: { glb: 'adventurer', h: 1.35, xz: 1.3, glow: 0.1, palette: HOODS.map((c, i) => ({ Green: c, LightGreen: c, Hair: BEARDS[i], Eyebrows: BEARDS[i] })) },
  ironDwarf: { glb: 'adventurer', h: 1.35, xz: 1.35, glow: 0.08, sword: true, hide: ['Backpack'], palette: IRON.map(c => ({ Green: c, LightGreen: 0x8a8e96, Brown: 0x3a2a1e })) },
  human: { glb: 'adventurer', h: 1.8, glow: 0.08, hide: ['Backpack'], palette: MEN.map(([a, b]) => ({ Green: a, LightGreen: b })) },
  bard: { glb: 'adventurer', h: 1.86, glow: 0.16, hide: ['Backpack'], colors: { Green: 0x2c3a48, LightGreen: 0x48566a, Brown: 0x3a2a1e, Brown2: 0x2a1e16, Hair: 0x1a1410, Eyebrows: 0x1a1410 } },
  goblin: { glb: 'orc', h: 1.3, glow: 0.2, colors: { Orc_Main: 0x5f6e3a, Orc_Secondary: 0x3c4626, Orc_Hair: 0x1a1a12 } },
  warg: { glb: 'wolf', h: 1.55, glow: 0.22, colors: { Main: 0x4a4440, Main_Light: 0x6c6660, Eyes_Black: 0xff3010 }, emissiveOnly: { Eyes_Black: 3 } },
};

// wspólne nazwy animacji (różne paczki nazywają je inaczej)
const ALIAS = {
  hit: ['RecieveHit', 'HitRecieve', 'HitReact', 'Idle_HitReact_Left'],
  attack: ['Sword_Slash', 'Weapon', 'Dagger_Attack', 'Attack'],
  run: ['Run', 'Gallop'], idle: ['Idle'], walk: ['Walk'], death: ['Death'],
  aim: ['Idle_Gun_Pointing', 'Idle'], shoot: ['Gun_Shoot', 'Punch'], punch: ['Punch_Right', 'Punch', 'Attack'],
  wave: ['Wave', 'Yes'], talk: ['Interact', 'Wave', 'Yes', 'PickUp'], guard: ['Idle_Sword', 'Attacking_Idle', 'Idle'], yes: ['Yes', 'Wave'], no: ['No'],
};

export class Char {
  constructor(kind, { i = 0, colors } = {}) {
    const K = KINDS[kind], raw = RAW[K.glb];
    this.kind = kind; this.K = K; this.raw = raw;
    this.root = new THREE.Group();
    this.model = SkeletonUtils.clone(raw.scene);
    const k = K.h / raw.headY, xz = K.xz || 1;
    this.model.scale.set(k * xz, k, k * xz);
    const col = { ...(K.colors || {}), ...(K.palette ? K.palette[i % K.palette.length] : {}), ...(colors || {}) };
    this.mats = [];
    if (K.hide) K.hide.forEach(n => { const o = this.model.getObjectByName(n); if (o) o.visible = false; });
    this.model.traverse(o => {
      if (!o.isMesh) return;
      if (o.name === 'Sword' && kind !== 'elf') { o.visible = false; return; }
      o.castShadow = true; o.frustumCulled = false;
      o.material = o.material.clone();
      const c = col[o.material.name]; if (c !== undefined) o.material.color.setHex(c);
      if (o.material.emissive) {
        const e = K.emissiveOnly && K.emissiveOnly[o.material.name];
        o.material.emissive.copy(o.material.color).multiplyScalar(e || K.glow || 0);
      }
      this.mats.push(o.material);
    });
    this.root.add(this.model);
    this.feet = K.feet ? ['FootL', 'FootR'].map(n => this.model.getObjectByName(n)) : null;
    this.mixer = new THREE.AnimationMixer(this.model);
    this.mixer.addEventListener('finished', e => {
      if (e.action === this.cur && this.then) { const t = this.then; this.then = null; this.play(t); }
    });
    this.holds = [];
    this.cur = null;
    if (K.sword) this.addSword();
    this.play('idle', { fade: 0 });
    this.mixer.update(Math.random() * 2);
  }
  clip(name) {
    const c = this.raw.clips;
    if (c[name]) return c[name];
    for (const n of ALIAS[name] || []) if (c[n]) return c[n];
    return null;
  }
  has(name) { return !!this.clip(name); }
  // once: animacja raz; then: co potem; hold: zatrzymaj na ostatniej klatce
  play(name, { fade = 0.25, once = false, then = null, speed = 1 } = {}) {
    const clip = this.clip(name); if (!clip) return null;
    const a = this.mixer.clipAction(clip);
    a.timeScale = speed;
    if (this.cur === a && !once) return a;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
    a.play();
    if (this.cur && this.cur !== a) { if (fade > 0) this.cur.crossFadeTo(a, fade, false); else this.cur.stop(); }
    this.cur = a; this.curName = name; this.then = then;
    return a;
  }
  // poza z ostatniej klatki animacji (np. leżący Thorin)
  pose(name) { this.play(name, { once: true, fade: 0 }); this.mixer.update(30); }
  update(dt) {
    this.mixer.update(dt);
    if (this.feet) this.feet.forEach(f => f && f.scale.setScalar(this.K.feet));   // duże hobbickie stopy
    if (this.holds.length) {
      this.root.updateMatrixWorld(true);
      for (const h of this.holds) {
        h.bone.getWorldPosition(h.obj.position);
        this.root.worldToLocal(h.obj.position).add(h.off);
      }
    }
  }
  // przedmiot trzymany w dłoni: pozycja z kości, obrót stały względem postaci (osie kości różnią się między modelami)
  hold(obj, bone = 'WristL', off = V(), rot = null) {
    const b = this.model.getObjectByName(bone) || this.model.getObjectByName(bone.replace('Wrist', 'Middle1'));
    if (!b) return obj;
    if (rot) obj.rotation.copy(rot);
    this.root.add(obj); this.holds.push({ obj, bone: b, off });
    return obj;
  }
  unhold(obj) { this.holds = this.holds.filter(h => h.obj !== obj); }
  // miecz z modelu elfa (ten sam szkielet Quaterniusa): przypięty do palców prawej dłoni jak w oryginale
  addSword() {
    const src = RAW.elf.scene.getObjectByName('Sword');
    const bone = this.model.getObjectByName('Middle1R');
    if (!src || !bone) return;
    const s = src.clone(true);
    s.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); if (o.material.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.15); o.castShadow = true; } });
    s.position.copy(src.position); s.quaternion.copy(src.quaternion); s.scale.copy(src.scale);
    s.visible = true; bone.add(s); this.sword = s;
  }
  setOpacity(o) { this.mats.forEach(m => { m.transparent = o < 1; m.opacity = o; m.depthWrite = o >= 1; }); }
  get pos() { return this.root.position; }
  face(x, z) { this.root.rotation.y = Math.atan2(x - this.root.position.x, z - this.root.position.z); }
}

// ---------- przedmioty z modeli ----------
function fitModel(key, size, axis = 'y') {
  const g = RAW[key].scene.clone(true);
  const box = new THREE.Box3().setFromObject(g), c = box.getCenter(V()), s = box.getSize(V());
  g.position.sub(c);
  // p (skala) → pivot (obrót wokół środka) → g (model wyśrodkowany)
  const pivot = new THREE.Group(); pivot.add(g);
  const p = new THREE.Group(); p.add(pivot); p.scale.setScalar(size / s[axis]); p.pivot = pivot;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); if (o.material.emissive) o.material.emissive.copy(o.material.color).multiplyScalar(0.15); } });
  return p;
}
// łuk: pionowo, cięciwa w stronę łucznika (model łuku ma cięciwę po +x)
export function makeBow(size = 1.2) {
  const b = fitModel('bow', size); b.pivot.rotation.y = Math.PI / 2; return b;
}
// strzała: grot w stronę +z (lookAt obraca +z w kierunku lotu)
export function makeArrow(len = 0.85) {
  const a = fitModel('arrow', len); a.pivot.rotation.x = Math.PI / 2; return a;
}

// goblin na wargu: goblin siedzi na grzbiecie (pozycja z kości tułowia wilka)
export class Rider {
  constructor() {
    this.warg = new Char('warg'); this.gob = new Char('goblin');
    this.root = this.warg.root;
    this.warg.hold(this.gob.root, 'Torso', V(0, -0.15, -0.1));
    this.alive = true;
  }
  play(name, o) { this.warg.play(name === 'run' ? 'run' : name, o); if (name === 'death') this.gob.play('death', { once: true }); else if (name === 'attack') this.gob.play('attack', { once: true, then: 'idle' }); }
  update(dt) { this.warg.update(dt); this.gob.update(dt); }
  get pos() { return this.root.position; }
}
