// Otoczenie: nocne niebo, światła, teren, skały, ogniska, lokacje wspólne dla etapów i scenek.
import * as THREE from 'three';
import { camera, rnd, V } from './core.js';

export const MOON = V(-0.35, 0.42, -1).normalize();

export function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = canvasTex(128, (x, s) => {
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
});
const smokeTex = canvasTex(64, (x, s) => {
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
});
export function glow(color, scale, fog = true, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog, opacity }));
  s.scale.setScalar(scale); return s;
}

// ---------- świat: niebo, gwiazdy, księżyc, światło (parametry z zaakceptowanego dema) ----------
export function nightWorld({ fog = 0.022, sky = true, hemi = 0.9, moon = 0.7, shadowSize = 45 } = {}) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c1124, fog);
  const w = { scene, ups: [], rockMeshes: [], rocks: [], camBlock: [], focus: V(), h: () => 0 };
  if (sky) {
    w.sky = new THREE.Group(); scene.add(w.sky);
    w.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { bot: { value: new THREE.Vector3(.20, .20, .36) }, top: { value: new THREE.Vector3(.02, .03, .09) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 bot, top; varying vec3 vP; void main(){ float h = clamp(vP.y, 0., 1.); gl_FragColor = vec4(mix(bot, top, pow(h, .5)), 1.); }'
    });
    w.sky.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), w.skyMat));
    const p = [];
    for (let i = 0; i < 1500; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(0.05 + Math.random() * 0.95);
      p.push(Math.sin(ph) * Math.cos(th) * 500, Math.cos(ph) * 500, Math.sin(ph) * Math.sin(th) * 500);
    }
    w.sky.add(w.stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)),
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })));
    const moonTex = canvasTex(128, (x, s) => {
      x.fillStyle = '#eef1f8'; x.beginPath(); x.arc(s / 2, s / 2, s * 0.42, 0, 7); x.fill();
      x.fillStyle = '#cfd6e6'; [[50, 52, 9], [76, 72, 7], [68, 40, 5]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
    });
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false }));
    m.scale.setScalar(26); m.position.copy(MOON).multiplyScalar(450); w.sky.add(m);
    const mg = glow(0x8fa6d8, 170, false, 0.55); mg.position.copy(m.position); w.sky.add(mg);
    w.moonSprites = [m, mg];
  }
  w.hemi = new THREE.HemisphereLight(0x3a4a80, 0x141820, hemi); scene.add(w.hemi);
  const ml = new THREE.DirectionalLight(0x9db2e8, moon);
  ml.castShadow = true; ml.shadow.mapSize.set(2048, 2048);
  Object.assign(ml.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 200 });
  ml.shadow.bias = -0.0008;
  scene.add(ml, ml.target); w.moon = ml;
  // chłodne światło od strony kamery: postacie są czytelne także w cieniu (gra, nie fizyka)
  w.fill = new THREE.PointLight(0xa8bcf0, 0, 8, 1.8); scene.add(w.fill);
  w.update = (dt, t) => {
    for (const f of w.ups) f(dt, t);
    if (w.sky) w.sky.position.copy(camera.position);
    ml.position.copy(w.focus).addScaledVector(MOON, 80); ml.target.position.copy(w.focus);
  };
  return w;
}

// Dzień: wołane po zbudowaniu lokacji, a przed dodaniem postaci. Niebo, mgła i światła na dzienne,
// ciemne (nocne) materiały otoczenia rozjaśnione na kopiach — współdzielone materiały zostają nocne dla innych scen.
export function daylight(w) {
  if (w.indoor) return;
  if (w.skyMat) {
    w.skyMat.uniforms.bot.value.set(.78, .82, .86); w.skyMat.uniforms.top.value.set(.30, .50, .80);
    w.stars.visible = false; w.moonSprites.forEach(s => s.visible = false);
  }
  w.scene.fog.color.setHex(0xaeb8c4); w.scene.fog.density *= 0.45;
  w.hemi.color.setHex(0xd8e6ff); w.hemi.groundColor.setHex(0x6a5e48); w.hemi.intensity = 1.5;
  w.moon.color.setHex(0xfff0d8); w.moon.intensity = 2.6;
  const lit = new Map(), hsl = {};
  w.scene.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m.color || m.blending === THREE.AdditiveBlending || m.isShaderMaterial) return;
    if (!lit.has(m)) {
      const c = m.clone();
      c.color.getHSL(hsl, THREE.SRGBColorSpace);
      if (m.userData.day) c.color.setHex(m.userData.day);
      else if (m.isMeshBasicMaterial) { if (hsl.l < 0.22) c.color.setHSL(hsl.h, hsl.s * 0.6, 0.3 + hsl.l, THREE.SRGBColorSpace); }   // daleka góra: sinoszara
      else if (hsl.l < 0.22) c.color.setHSL(hsl.h > 0.45 && hsl.h < 0.8 ? 0.09 : hsl.h, Math.max(0.15, hsl.s * 0.8), 0.18 + hsl.l * 1.6, THREE.SRGBColorSpace);   // nocny granat → ziemia
      lit.set(m, c);
    }
    o.material = lit.get(m);
  });
}

// oświetlenie postaci od strony kamery (bohater czytelny przy skale)
export function fillAt(w, target, intensity = 14, back = 1.8) {
  const d = V().subVectors(camera.position, target).setY(0);
  if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
  d.normalize();
  w.fill.intensity = intensity;
  w.fill.position.copy(target).addScaledVector(d, back).y += 0.9;
}

// ---------- teren ----------
export function terrain(w, { x1, x2, z1, z2, step = 2, color = 0x0e1218, h }) {
  const W = x2 - x1, D = z2 - z1;
  const geo = new THREE.PlaneGeometry(W, D, Math.ceil(W / step), Math.ceil(D / step));
  geo.rotateX(-Math.PI / 2); geo.translate((x1 + x2) / 2, 0, (z1 + z2) / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, h(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.receiveShadow = true; w.scene.add(m); w.h = h; w.ground = m;
  return m;
}
export function grass(w, { n = 9000, x1, x2, z1, z2, color = 0x1e2c36, skip }) {
  const geo = new THREE.ConeGeometry(0.025, 0.45, 3); geo.translate(0, 0.22, 0);
  const g = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color }), n);
  g.material.userData.day = 0x5c6a34;
  const o = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < n * 2 && k < n; i++) {
    const x = rnd(x1, x2), z = rnd(z1, z2);
    if (skip && skip(x, z)) continue;
    o.position.set(x, w.h(x, z), z); o.rotation.set(rnd(-0.2, 0.2), rnd(0, 6.3), 0); o.scale.setScalar(rnd(0.6, 1.4));
    o.updateMatrix(); g.setMatrixAt(k++, o.matrix);
  }
  g.count = k; g.receiveShadow = true; w.scene.add(g);
}
export function pines(w, n, place) {
  const g = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 6, 7), new THREE.MeshStandardMaterial({ color: 0x0a0e14, roughness: 1, userData: { day: 0x2c4228 } }), n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const [x, z] = place(i), s = rnd(0.8, 1.8);
    o.position.set(x, w.h(x, z) + 3 * s, z); o.scale.setScalar(s); o.rotation.y = rnd(0, 6.3);
    o.updateMatrix(); g.setMatrixAt(i, o.matrix);
  }
  w.scene.add(g);
}

export const rockMat = new THREE.MeshStandardMaterial({ color: 0x1b1e26, roughness: 0.95, flatShading: true });
export function makeRock(w, x, z, r, big = true, solid = true) {
  const geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position, v = V();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.25 * Math.sin(v.x * 3.1 + v.y * 5.3) * Math.cos(v.z * 4.7));
    p.setXYZ(i, v.x, v.y * 0.75, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, rockMat);
  m.position.set(x, w.h(x, z) + r * 0.2, z); m.rotation.y = rnd(0, 6.3);
  m.castShadow = m.receiveShadow = true; w.scene.add(m);
  if (solid) { w.rocks.push({ x, z, r, big }); w.rockMeshes.push(m); }
  return m;
}

// ---------- ogień, pochodnie, dym ----------
const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 });
export function fire(w, x, z, { light = 30, dist = 35, sparks = 120, beacon = true, smoke = false, scale = 1 } = {}) {
  const y0 = w.h(x, z), f = {};
  [0.6, -0.6].forEach(r => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.07 * scale, 1.1 * scale, 6), darkMat); l.position.set(x, y0 + 0.1, z); l.rotation.set(Math.PI / 2, r, 0); w.scene.add(l); });
  if (light) { f.light = new THREE.PointLight(0xff7a2a, light, dist, 1.5); f.light.position.set(x, y0 + 0.8 * scale, z); w.scene.add(f.light); }
  f.flame = glow(0xff9a40, 1.6 * scale); f.flame.position.set(x, y0 + 0.45 * scale, z); w.scene.add(f.flame);
  if (beacon) { const b = glow(0xff6a20, 9 * scale, false, 0.35); b.position.set(x, y0 + 1, z); w.scene.add(b); }
  const pos = new Float32Array(sparks * 3);
  const sp = Array.from({ length: sparks }, () => ({ life: Math.random(), x: 0, z: 0, vx: 0, vz: 0 }));
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (sparks) w.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb060, size: 0.035 * scale, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
  if (smoke) smokeColumn(w, x, y0 + 1.5 * scale, z, scale);
  const base = light, ph = rnd(0, 6);
  w.ups.push((dt, t) => {
    t += ph;
    if (f.light) f.light.intensity = base * (0.87 + Math.sin(t * 13) * 0.1 + Math.sin(t * 29) * 0.07);
    f.flame.scale.set((1.4 + Math.sin(t * 17) * 0.15) * scale, (1.9 + Math.sin(t * 11) * 0.25) * scale, 1);
    if (!sparks) return;
    const p = geo.attributes.position;
    sp.forEach((s, i) => {
      s.life += dt * (0.6 + (i % 5) * 0.12);
      if (s.life > 1) { s.life = 0; s.x = rnd(-0.25, 0.25); s.z = rnd(-0.25, 0.25); s.vx = rnd(-0.9, 0.9); s.vz = rnd(-0.9, 0.9); }
      p.setXYZ(i, x + (s.x + s.vx * s.life) * scale, y0 + (0.3 + s.life * 3) * scale, z + (s.z + s.vz * s.life) * scale);
    });
    p.needsUpdate = true;
  });
  return f;
}
export function torch(w, x, z, { light = 0, h = 2.2 } = {}) {
  const y0 = w.h(x, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 5), darkMat); pole.position.set(x, y0 + h / 2, z); w.scene.add(pole);
  const fl = glow(0xffa040, 1.2); fl.position.set(x, y0 + h + 0.15, z); w.scene.add(fl);
  if (light) { const l = new THREE.PointLight(0xff8a3a, light, 12, 1.6); l.position.set(x, y0 + h + 0.2, z); w.scene.add(l); }
  const ph = rnd(0, 6);
  w.ups.push((dt, t) => fl.scale.set(1 + Math.sin(t * 15 + ph) * 0.12, 1.3 + Math.sin(t * 9 + ph) * 0.2, 1));
}
export function smokeColumn(w, x, y, z, scale = 1, n = 14) {
  const mat = new THREE.SpriteMaterial({ map: smokeTex, color: 0x40404a, transparent: true, depthWrite: false, opacity: 0.35 });
  const ps = Array.from({ length: n }, (_, i) => { const s = new THREE.Sprite(mat); s.userData.life = i / n; w.scene.add(s); return s; });
  w.ups.push(dt => ps.forEach(s => {
    s.userData.life = (s.userData.life + dt * 0.08) % 1; const l = s.userData.life;
    s.position.set(x + Math.sin(l * 5) * 0.6 * scale + l * 3 * scale, y + l * 14 * scale, z);
    s.scale.setScalar((1.5 + l * 6) * scale);
  }));
}

// ---------- budowle i obiekty ----------
export function mountain(w, x, y, z, r = 170, h = 140, gate = true) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), new THREE.MeshBasicMaterial({ color: 0x1a2136, fog: false }));
  m.position.set(x, y, z); w.scene.add(m);
  // śnieżny szczyt łapie światło księżyca
  const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.18, h * 0.18, 9), new THREE.MeshBasicMaterial({ color: 0x3a4466, fog: false }));
  cap.position.set(x, y + h * 0.41, z); w.scene.add(cap);
  if (gate) { const g = glow(0xffa050, r * 0.08, false, 0.8); g.position.set(x + r * 0.02, y - h / 2 + 4, z - Math.sign(z) * r * 0.85); w.scene.add(g); }
  return m;
}
export function wall(w, z, { width = 70, height = 14, rope = false, gate = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0x0c0e13, roughness: 1 });
  if (gate) {
    // mur z bramą pośrodku: dwie części i nadproże
    [[-width / 4 - 2.5, width / 2 - 5], [width / 4 + 2.5, width / 2 - 5]].forEach(([x, wd]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(wd, height, 3), m); b.position.set(x, height / 2, z); b.castShadow = b.receiveShadow = true; w.scene.add(b); w.camBlock.push(b);
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(10, height - 7, 3), m); top.position.set(0, 7 + (height - 7) / 2, z); w.scene.add(top);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 0.5), new THREE.MeshBasicMaterial({ color: 0x050403 })); inner.position.set(0, 3.5, z + 1.2); w.scene.add(inner);
    const gl = glow(0xffa050, 9, true, 0.5); gl.position.set(0, 3, z + 0.5); w.scene.add(gl);
  } else {
    const b = new THREE.Mesh(new THREE.BoxGeometry(width, height, 3), m); b.position.set(0, height / 2, z); b.castShadow = b.receiveShadow = true; w.scene.add(b); w.camBlock.push(b);
  }
  // blanki: cienki parapet od zewnątrz (strona -z), żeby po murze dało się chodzić
  for (let x = -width / 2 + 1; x <= width / 2 - 1; x += 2.4) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.6), m); c.position.set(x, height + 0.6, z - 1.2); w.scene.add(c); }
  if (rope) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, height + 1, 5), new THREE.MeshStandardMaterial({ color: 0x8d7c5e, emissive: 0x2a2010 }));
    r.position.set(1.2, height / 2 + 0.4, z - 1.6); w.scene.add(r); w.rope = r;
  }
}
const tentMats = [0x3a2a1c, 0x2a3a2a, 0x40301e, 0x2a2a3e].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
export function tent(w, x, z, s, i = 0, rot = Math.PI / 4) {
  const t = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.3, 4), tentMats[i % 4]);
  t.position.set(x, w.h(x, z) + s * 0.65, z); t.rotation.y = rot; t.castShadow = t.receiveShadow = true; w.scene.add(t);
  return t;
}
export function banner(w, x, z, color, h = 4) {
  const y0 = w.h(x, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h, 5), darkMat); pole.position.set(x, y0 + h / 2, z); w.scene.add(pole);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4, 6, 1), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1, emissive: color, emissiveIntensity: 0.15 }));
  cloth.position.set(x + 0.47, y0 + h - 0.8, z); w.scene.add(cloth);
  const p = cloth.geometry.attributes.position, x0 = Float32Array.from({ length: p.count }, (_, i) => p.getX(i)), ph = rnd(0, 6);
  w.ups.push((dt, t) => { for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(t * 3 + x0[i] * 4 + ph) * 0.08 * (x0[i] + 0.45)); p.needsUpdate = true; });
}
export function makeGem(withLight = true) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfe4ff, emissiveIntensity: 2.2, roughness: 0.1, metalness: 0.3, flatShading: true }));
  m.scale.y = 1.3; g.add(m);
  const gl = glow(0xbfd8ff, 0.9, true, 0.9); g.add(gl);
  if (withLight) { const l = new THREE.PointLight(0xcfe0ff, 3, 5, 1.8); g.add(l); g.userData.light = l; }
  g.userData.spin = m;
  return g;
}
export function water(w, x1, x2, z1, z2, y) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), new THREE.MeshStandardMaterial({ color: 0x0b1830, roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.9 }));
  m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); w.scene.add(m);
  return m;
}

// ---------- lokacje ----------
// pagórkowaty teren nocą
export const hills = (x, z) => 0.35 * Math.sin(x * 0.13) * Math.cos(z * 0.07) + 0.25 * Math.sin(z * 0.21 + x * 0.05);

// pole bitwy przed Samotną Górą (Góra na północy, -z)
export function battlefield(w, { fires = true } = {}) {
  w.scene.fog.density = 0.016;   // mniej mgły: wrogów widać z daleka
  terrain(w, { x1: -140, x2: 140, z1: -170, z2: 90, step: 2.5, h: (x, z) => hills(x, z) + Math.max(0, Math.abs(x) - 60) * 0.12 + Math.max(0, z - 50) * 0.1, color: 0x10141a });
  grass(w, { n: 9000, x1: -60, x2: 60, z1: -120, z2: 40 });
  mountain(w, 0, 60, -330, 220, 180);
  mountain(w, -190, 30, -300, 110, 110, false);
  mountain(w, 200, 25, -290, 120, 100, false);
  pines(w, 220, i => { const s = Math.random() < 0.5 ? -1 : 1; return [s * rnd(65, 120), rnd(-160, 80)]; });
  [[-14, -16, 2.6], [9, -30, 2.2], [-26, -44, 2.8], [24, -8, 2.4], [-8, -62, 2.5], [18, -54, 2.3], [-32, 6, 2.6], [30, -70, 2.7], [5, 18, 2.0]]
    .forEach(([x, z, r]) => makeRock(w, x, z, r, true));
  for (let i = 0; i < 40; i++) makeRock(w, rnd(-55, 55), rnd(-110, 35), rnd(0.3, 0.8), false, false);
  if (fires) {
    fire(w, -20, -6, { light: 26, smoke: true });
    fire(w, 22, -26, { light: 26, smoke: true });
    fire(w, -6, -48, { light: 26 });
    fire(w, 14, 12, { light: 20, beacon: false });
  }
  banner(w, -9, 4, 0x2a4a9a); banner(w, -4, 6, 0x2a6a3a); banner(w, 8, 3, 0x2a4a9a);
}

// mur Góry z bramą i obóz ludzi i elfów przed nim (mur na z=0, obóz na -z)
export function gateAndCamp(w) {
  terrain(w, { x1: -120, x2: 120, z1: -140, z2: 40, step: 2.5, h: (x, z) => (z > -4 ? 0 : hills(x, z)) + Math.max(0, Math.abs(x) - 55) * 0.15, color: 0x10141a });
  grass(w, { n: 6000, x1: -50, x2: 50, z1: -90, z2: -6 });
  wall(w, 1.5, { width: 80, height: 14, gate: true });
  mountain(w, 0, 75, 230, 210, 190, false);
  pines(w, 160, i => { const s = Math.random() < 0.5 ? -1 : 1; return [s * rnd(58, 110), rnd(-140, 0)]; });
  [[-16, -46, 3], [14, -50, 3.4], [0, -60, 3.8], [-26, -58, 2.8], [26, -62, 3], [-8, -74, 3.2], [10, -78, 2.8]].forEach(([x, z, s], i) => tent(w, x, z, s, i));
  fire(w, -6, -36, { light: 28, smoke: true });
  fire(w, 12, -40, { light: 24 });
  fire(w, 0, -70, { light: 0, sparks: 40 });
  [[-12, -22], [-4, -20], [4, -20], [12, -22]].forEach(([x, z]) => torch(w, x, z));
  torch(w, -3.5, -2.5, { light: 10, h: 2.6 }); torch(w, 3.5, -2.5, { light: 10, h: 2.6 });
  banner(w, -18, -34, 0x2a4a9a); banner(w, 18, -36, 0x2a6a3a); banner(w, -2, -42, 0x2a4a9a);
  [[-22, -12, 2.4], [24, -16, 2.8], [-34, -40, 2.6]].forEach(([x, z, r]) => makeRock(w, x, z, r));
}
