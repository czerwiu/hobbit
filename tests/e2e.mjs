// Test e2e: przechodzi wszystkie 3 ścieżki od menu do tekstu końcowego (haki window.G),
// robi zrzuty każdej scenki i każdego etapu do docs/screens/ i zbiera błędy konsoli.
// Użycie: node tests/e2e.mjs [1|2|3 ...] [--browser=chrome|webkit] [--fast]
import { chromium, webkit } from 'playwright';
import fs from 'fs';

const args = process.argv.slice(2);
const paths = args.filter(a => /^[123]$/.test(a)).map(Number);
const PATHS = paths.length ? paths : [1, 2, 3];
const engine = (args.find(a => a.startsWith('--browser=')) || '--browser=chrome').split('=')[1];
const FAST = args.includes('--fast');
const SHOTS = 'docs/screens';
fs.mkdirSync(SHOTS, { recursive: true });

const CHOICES = { 1: [true], 2: [false, true], 3: [false, false] };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { errors: [], fps: {}, visited: {} };

const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
page.on('requestfailed', r => report.errors.push('requestfailed ' + r.url()));
page.on('pageerror', e => report.errors.push('pageerror ' + e.message));

await page.goto('file://' + process.cwd() + '/dist/index.html');
await page.waitForFunction(() => window.G && G.ready, null, { timeout: 90000 });
await sleep(800);
await page.screenshot({ path: `${SHOTS}/00-menu.png` });

const G = (f, a) => page.evaluate(f, a);
const shot = async name => { if (!FAST) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const fps = async id => { await sleep(1500); const v = await G(() => G.fps); (report.fps[id] = report.fps[id] || []).push(v); return v; };

// ---------- akcje w etapach ----------
const STAGES = {
  'z1-droga': async (id) => {
    await sleep(1500); await shot(`${id}-1-lina`);
    await page.keyboard.down('Space'); await sleep(900); await page.keyboard.up('Space'); await sleep(200);
    await page.keyboard.down('Space'); await sleep(900); await page.keyboard.up('Space');
    await shot(`${id}-2-lina-zjazd`);
    const y1 = await G(() => G.stage.phase);
    await G(() => G.stage.setPhase('river')); await sleep(1200); await shot(`${id}-3-rzeka`);
    // skok do wody = powrót na brzeg
    await G(() => G.stage.tp(0, -4.6)); await page.keyboard.press('Space'); await sleep(1500); await shot(`${id}-4-rzeka-plusk`);
    await G(() => G.stage.setPhase('sneak')); await sleep(1000); await shot(`${id}-5-skradanie-start`);
    await G(() => G.stage.tp(-2.2, -40)); await sleep(1600); await shot(`${id}-6-przy-skale`);
    await G(() => G.stage.tp(-1, -66)); await sleep(800); await shot(`${id}-7-latarnia`);
    await G(() => G.stage.setPhase('sneak')); await page.keyboard.press('KeyE'); await sleep(600); await shot(`${id}-8-pierscien`);
    report.fps[id] = [await fps(id)];
    await G(() => { G.stage.setPhase('sneak'); G.stage.tp(0, -211); }); await page.keyboard.down('KeyW'); await sleep(400); await page.keyboard.up('KeyW');
    await sleep(3300); await shot(`${id}-9-kichniecie`);
    return 'auto';
  },
  bow: async (id) => {
    await sleep(4500); await shot(`${id}-1`);
    report.fps[id] = [await fps(id)];
    await G(() => G.stage.aimAt(0)); await page.mouse.move(640, 360); await page.mouse.down({ button: 'right' }); await sleep(700);
    await shot(`${id}-2-celowanie`);
    await page.mouse.down({ button: 'left' }); await page.mouse.up({ button: 'left' }); await sleep(250); await shot(`${id}-3-strzal`);
    await sleep(800); await page.mouse.up({ button: 'right' });
    for (let i = 0; i < 6; i++) { const k = await G(() => G.stage && G.stage.kills); if (k >= 5) break; await G(() => G.stage.autoKill()); await sleep(300); }
    await sleep(900); await shot(`${id}-4-zwyciestwo`);
    return 'auto';
  },
  sword: async (id) => {
    await sleep(5000); await shot(`${id}-1`);
    report.fps[id] = [await fps(id)];
    await page.mouse.move(640, 360); await page.mouse.down({ button: 'left' }); await page.mouse.up({ button: 'left' }); await sleep(250); await shot(`${id}-2-cios`);
    for (let i = 0; i < 6; i++) { const k = await G(() => G.stage && G.stage.kills); if (k >= 5) break; await G(() => G.stage.autoKill()); await sleep(300); }
    await sleep(900); await shot(`${id}-3-zwyciestwo`);
    return 'auto';
  },
  hide: async (id) => {
    await sleep(2000); await shot(`${id}-1`);
    report.fps[id] = [await fps(id)];
    await page.keyboard.press('KeyE'); await sleep(500); await shot(`${id}-2-pierscien`);
    await G(() => G.stage.tp(-14, -20.2)); await page.keyboard.down('KeyW'); await sleep(150); await page.keyboard.up('KeyW');
    await sleep(800); await shot(`${id}-3-ukryty`);
    return 'auto';
  },
};
const stageKind = id => ({ 'z1-droga': 'z1-droga', 'bard-luk': 'bow', 'thorin-miecz': 'sword', 'bilbo-kamien': 'hide' })[id];

try {
for (const path of PATHS) {
  const choices = [...CHOICES[path]];
  const seen = new Set(), visited = [];
  await G(() => G.menu()); await sleep(500);
  await G(() => G.newGame());
  let last = '', idle = 0, n = 0;
  const t0 = Date.now();
  while (true) {
    if (Date.now() - t0 > 15 * 60e3) { report.errors.push(`ścieżka ${path}: przekroczony czas`); break; }
    const w = await G(() => G.waiter);
    if (!w) { await sleep(150); if (++idle > 400) { report.errors.push(`ścieżka ${path}: gra stoi (brak oczekiwania) po ${last}`); break; } continue; }
    idle = 0;
    const key = `${w.kind}:${w.id}`;
    if (w.kind === 'line') {
      const first = !seen.has(w.id); seen.add(w.id);
      if (first) { visited.push(w.id); n++; }
      const li = await G(() => G.scene ? [G.scene.line, G.scene.lines] : [0, 1]);
      await sleep(FAST ? 300 : 2600);
      // zrzut pierwszej, co trzeciej i ostatniej kwestii scenki
      if (li[0] === 0 || li[0] === li[1] - 1 || li[0] % 3 === 0) await shot(`p${path}-${String(n).padStart(2, '0')}-${w.id}-${li[0] + 1}`);
      await G(() => G.next());
    } else if (w.kind === 'choice') {
      visited.push(w.id); await sleep(800); await shot(`p${path}-${String(++n).padStart(2, '0')}-${w.id}`);
      await G(v => G.choose(v), choices.shift());
    } else if (w.kind === 'card') {
      visited.push(w.id); await sleep(500); await shot(`p${path}-${String(++n).padStart(2, '0')}-${w.id}`);
      await G(() => G.next());
    } else if (w.kind === 'overlay') {
      const sid = await G(() => G.stage && G.stage.id);
      visited.push(sid); await sleep(400); await shot(`p${path}-${String(++n).padStart(2, '0')}-${sid}-start`);
      await G(() => G.start());
      const r = await STAGES[stageKind(sid)](`p${path}-${String(n).padStart(2, '0')}-${sid}`);
      // etap kończy się sam (auto) — czekamy na następne oczekiwanie innego rodzaju
      let tries = 0;
      while ((await G(() => G.waiter && G.waiter.kind)) === 'stage' && tries++ < 100) await sleep(200);
      if (tries >= 100) { report.errors.push(`etap ${sid} nie zakończył się sam`); await G(() => G.finishStage()); }
    } else if (w.kind === 'ending') {
      visited.push(w.id); await sleep(1500); await shot(`p${path}-${String(++n).padStart(2, '0')}-${w.id}`);
      const txt = await G(() => document.getElementById('endText').textContent);
      report.visited[path] = { steps: visited, ending: txt };
      await G(() => G.skip());
      break;
    } else { await sleep(200); }
    last = key;
  }
}
} catch (e) { report.errors.push('wyjątek testu: ' + e.message.split('\n')[0]); }
await browser.close();
console.log(JSON.stringify(report, null, 1));
process.exit(report.errors.length ? 1 : 0);
