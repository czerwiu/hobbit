// Dźwięk: nagrania CC0 (Freesound, Kenney) i muzyka CC0 (OpenGameArt) — lista w CREDITS.md.
// Pliki są osadzone jako base64 (dist/sounds/*.js), bo z file:// Web Audio nie wczyta pliku przez sieć.
// Przeglądarka pozwala grać dźwięk dopiero po pierwszym kliknięciu albo klawiszu — do tego czasu prośby są zapamiętywane.
let ac = null, master, musicBus, ambBus, sfxBus, muted = false;
const BUF = {}, decoding = {};
const state = { music: null, musicNode: null, amb: {}, played: {}, decoded: 0, failed: [] };   // amb: nazwa → { src, gain, want }
export const audioState = state;

function unlock() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.connect(ac.destination);
  musicBus = ac.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
  ambBus = ac.createGain(); ambBus.gain.value = 0.7; ambBus.connect(master);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
  master.gain.value = muted ? 0 : 1;
  // najpierw to, co już gra (muzyka, tło), potem reszta
  [state.music && 'music_' + state.music, ...Object.keys(state.amb).map(n => 'amb_' + n)].filter(Boolean).forEach(decode);
  Object.keys(window.SOUNDS || {}).forEach(decode);
  applyMusic(); Object.keys(state.amb).forEach(applyAmb);
}
['pointerdown', 'keydown'].forEach(e => addEventListener(e, unlock));

function decode(name) {
  if (BUF[name] || decoding[name] || !window.SOUNDS || !window.SOUNDS[name]) return decoding[name];
  const bin = Uint8Array.from(atob(window.SOUNDS[name]), c => c.charCodeAt(0));
  decoding[name] = new Promise(ok => ac.decodeAudioData(bin.buffer, b => { BUF[name] = b; state.decoded++; ok(b); }, () => { state.failed.push(name); ok(null); }));
  return decoding[name];
}
// warianty: "step_grass" → losowo step_grass_0..4; "bow" → bow albo bow2
function pick(name) {
  const all = Object.keys(window.SOUNDS || {}).concat(Object.keys(BUF));
  const vars = [...new Set(all.filter(n => n === name || new RegExp('^' + name + '(_\\d+|\\d)$').test(n)))];
  return vars.length ? vars[Math.floor(Math.random() * vars.length)] : null;
}

// efekt jednorazowy: vol 0..1, rate = wysokość, var = losowa zmiana wysokości, offset = start od sekundy
export function sfx(name, { vol = 1, rate = 1, vary = 0.06, offset = 0, delay = 0 } = {}) {
  if (!ac) return;
  if (UI_TONES[name]) return UI_TONES[name](ac.currentTime + delay);
  const n = pick(name); if (!n) return;
  state.played[name] = (state.played[name] || 0) + 1;
  const go = b => {
    if (!b) return;
    const s = ac.createBufferSource(); s.buffer = b;
    s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(g).connect(sfxBus); s.start(ac.currentTime + delay, Math.min(offset, b.duration - 0.05));
  };
  if (BUF[n]) go(BUF[n]); else decode(n)?.then(go);
}

// muzyka: 'main' (delikatna, tajemnicza), 'sad' (smutna) albo null; płynne przejście
export function music(name, vol = 1) {
  if (state.music === name && state.musicVol === vol) return;
  const same = state.music === name;
  state.music = name; state.musicVol = vol;
  if (!ac) return;
  if (same && state.musicNode) { state.musicNode.g.gain.setTargetAtTime(vol, ac.currentTime, 0.8); return; }
  applyMusic();
}
async function applyMusic() {
  if (!ac) return;
  const old = state.musicNode; state.musicNode = null;
  if (old) { old.g.gain.setTargetAtTime(0, ac.currentTime, 0.7); setTimeout(() => { try { old.s.stop(); } catch (e) {} }, 4000); }
  const name = state.music; if (!name) return;
  const b = BUF['music_' + name] || await decode('music_' + name);
  if (!b || state.music !== name || state.musicNode) return;
  const s = ac.createBufferSource(); s.buffer = b; s.loop = true;
  const g = ac.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(state.musicVol, ac.currentTime, 1.2);
  s.connect(g).connect(musicBus); s.start();
  state.musicNode = { s, g };
}

// tło (pętle): amb({ night: 1, fire: 0.5 }) — warstwy spoza listy wyciszają się
export function amb(layers) {
  for (const n of Object.keys(state.amb)) if (!(n in layers)) { state.amb[n].want = 0; applyAmb(n); }
  for (const [n, v] of Object.entries(layers)) setAmb(n, v);
}
export function setAmb(n, v) {
  const a = state.amb[n] || (state.amb[n] = { want: 0 });
  if (Math.abs(a.want - v) < 0.01 && a.src) return;
  a.want = v; applyAmb(n);
}
async function applyAmb(n) {
  if (!ac) return;
  const a = state.amb[n];
  if (!a.src) {
    if (a.want <= 0 || a.loading) return;
    a.loading = true;
    const b = BUF['amb_' + n] || await decode('amb_' + n);
    a.loading = false;
    if (!b || a.src) return;
    a.src = ac.createBufferSource(); a.src.buffer = b; a.src.loop = true;
    a.gain = ac.createGain(); a.gain.gain.value = 0;
    a.src.connect(a.gain).connect(ambBus); a.src.start(0, Math.random() * b.duration);
  }
  a.gain.gain.setTargetAtTime(a.want, ac.currentTime, 0.6);
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.05);
  return muted;
}
export const isMuted = () => muted;

// kroki: wywoływane z ruchu postaci; surface = grass | leaves | stone
export function footstep(surface, { vol = 0.5, rate = 1 } = {}) { sfx('step_' + surface, { vol, rate, vary: 0.1 }); }

// sygnały interfejsu (nie odgłosy świata), więc syntetyczne: krótka melodia zwycięstwa i niski ton porażki
function tone(t0, dur, f, vol, type = 'triangle') {
  const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(sfxBus); o.start(t0); o.stop(t0 + dur);
}
const UI_TONES = {
  win: t => [392, 523, 659, 784].forEach((f, i) => tone(t + i * 0.13, 0.7, f, 0.12)),
  fail: t => { tone(t, 0.6, 196, 0.15); tone(t + 0.18, 0.7, 147, 0.15); },
};
