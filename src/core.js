// Rdzeń: renderer, kamera, wejście (klawiatura, mysz, pointer lock), pętla gry.
import * as THREE from 'three';

export const $ = id => document.getElementById(id);
export const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const damp = (k, dt) => 1 - Math.exp(-k * dt);
export const angLerp = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
export const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
$('game').append(renderer.domElement);

export const BASE_FOV = 72;
export const camera = new THREE.PerspectiveCamera(BASE_FOV, innerWidth / innerHeight, 0.05, 1500);
// przesunięcie kadru w górę w scenkach: pasek dialogu zajmuje dół ekranu
let shiftK = 0;
export function frameShift(k) {
  shiftK = k;
  if (k) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * k, innerWidth, innerHeight);
  else camera.clearViewOffset();
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  frameShift(shiftK);
});

// ---------- wejście ----------
// pressed / clicks zawierają zdarzenia z bieżącej klatki (czyszczone po każdej klatce)
export const input = { keys: new Set(), pressed: new Set(), clicks: new Set(), buttons: new Set(), dx: 0, dy: 0 };
const canvas = renderer.domElement;
export const isLocked = () => document.pointerLockElement === canvas;
export function lock() {
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* np. brak gestu użytkownika */ }
}
export function unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  input.keys.add(e.code);
  if (!e.repeat) input.pressed.add(e.code);
});
addEventListener('keyup', e => input.keys.delete(e.code));
addEventListener('blur', () => input.keys.clear());
document.addEventListener('mousemove', e => { if (isLocked()) { input.dx += e.movementX; input.dy += e.movementY; } });
canvas.addEventListener('mousedown', e => { input.buttons.add(e.button); input.clicks.add(e.button); });
addEventListener('mouseup', e => input.buttons.delete(e.button));
addEventListener('contextmenu', e => e.preventDefault());
export const key = (...codes) => codes.some(c => input.keys.has(c));
export const hit = (...codes) => codes.some(c => input.pressed.has(c));

// ---------- tryb (scena / etap / menu) i pętla ----------
// tryb = { scene, update(dt, t), dispose() }
let mode = null;
export function setMode(m) {
  if (mode && mode !== m) {
    if (mode.dispose) mode.dispose();
    // zwolnij pamięć karty graficznej po poprzedniej scenie (wspólne zasoby three.js wczyta ponownie, gdy będą potrzebne)
    if (mode.scene && mode.scene !== (m && m.scene)) disposeScene(mode.scene);
  }
  mode = m;
}
function disposeScene(scene) {
  scene.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach(mt => mt.dispose());
    if (o.isLight && o.shadow && o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
  });
}
export const getMode = () => mode;
export let paused = false;
export function setPaused(p) { paused = p; }

const clock = new THREE.Clock();
let frames = 0, fpsT = 0;
window.FPS = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (mode) {
    if (!paused) mode.update(dt, t);
    if (mode.scene) renderer.render(mode.scene, camera);
  }
  input.pressed.clear(); input.clicks.clear(); input.dx = input.dy = 0;
  frames++; fpsT += dt;
  if (fpsT >= 1) { window.FPS = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
});

// czeka określony czas gry (setTimeout wystarcza: scenki nie zatrzymują się w pauzie)
export const wait = ms => new Promise(r => setTimeout(r, ms));
