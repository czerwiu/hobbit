// Wspólny przebieg etapu 3D: instrukcja → gra (pointer lock) → koniec.
import { setMode, unlock, camera, BASE_FOV, frameShift } from './core.js';
import { overlay, waiter, resolveWaiter, hud, hideAll, fade } from './ui.js';
import { music, amb } from './sfx.js';

export const S = { active: null };

// st: { id, title, text, keys, w, update(dt, t), begin?(), dispose?() }
export async function runStage(st) {
  st.state = 'intro';
  st.timers = [];
  st.at = (ms, f) => st.timers.push(setTimeout(f, ms));
  st.clearTimers = () => { st.timers.forEach(clearTimeout); st.timers = []; };
  st.finish = () => resolveWaiter('stage');
  camera.fov = BASE_FOV; camera.updateProjectionMatrix(); frameShift(0);
  setMode({ scene: st.w.scene, update: (dt, t) => { st.update(dt, t); st.w.update(dt, t); }, dispose: () => st.clearTimers() });
  st.update(0.016, 0);
  S.active = st;
  music(st.music === undefined ? 'main' : st.music, st.musicVol ?? 0.45);
  amb(st.amb || { night: 0.8 });
  await fade(0);
  await overlay(st.title, st.text, st.keys);
  st.state = 'play';
  if (st.begin) st.begin();
  await waiter('stage', st.id);
  st.state = 'done';
  st.clearTimers();
  unlock();
  await fade(1);
  S.active = null;
  hideAll(); hud();
}
