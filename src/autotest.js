// Autotest w przeglądarce bez narzędzi automatyzacji (np. prawdziwe Safari):
// otwórz dist/index.html?autotest — gra sama przejdzie 3 ścieżki i wpisze wynik do tytułu karty i na ekran.
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHOICES = { 1: [true], 2: [false, true], 3: [false, false] };

export async function autotest(G) {
  const errors = [], fps = [];
  addEventListener('error', e => errors.push(e.message || ('zasób: ' + (e.target && (e.target.src || e.target.href)))), true);
  addEventListener('unhandledrejection', e => errors.push('promise: ' + (e.reason && e.reason.message)));
  const ce = console.error; console.error = (...a) => { errors.push(a.join(' ')); ce(...a); };
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;color:#0f0;background:#000c;font:12px monospace;padding:6px;margin:0;max-width:60vw;white-space:pre-wrap';
  document.body.append(box);
  const log = t => { box.textContent += t + '\n'; document.title = 'AUTOTEST ' + t; };
  const ends = {};
  for (const path of [1, 2, 3]) {
    const choices = [...CHOICES[path]];
    G.newGame();
    const t0 = Date.now();
    while (Date.now() - t0 < 6 * 60e3) {
      const w = G.waiter;
      if (!w) { await sleep(100); continue; }
      if (w.kind === 'line' || w.kind === 'card') { await sleep(250); G.next(); }
      else if (w.kind === 'choice') { await sleep(250); G.choose(choices.shift()); }
      else if (w.kind === 'overlay') { G.start(); await sleep(2500); fps.push(window.FPS); G.finishStage(); }
      else if (w.kind === 'ending') { ends[path] = document.getElementById('endText').textContent; G.skip(); break; }
      else await sleep(100);
    }
    log(`ścieżka ${path}: ${ends[path] ? 'OK' : 'NIE DOSZŁA DO KOŃCA'}`);
    await sleep(800);
  }
  const ok = Object.keys(ends).length === 3 && !errors.length;
  log(`${ok ? 'OK' : 'BŁĄD'} zakończenia=${Object.keys(ends).length}/3 błędy=${errors.length} kl/s=${Math.min(...fps)}-${Math.max(...fps)}${errors.length ? ' | ' + errors.slice(0, 3).join(' | ') : ''}`);
}
