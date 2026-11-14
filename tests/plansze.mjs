// Test podmiany: dowolny obrazek jako dist/assets/plansze/intro-2.jpg zastępuje tylko tę jedną scenkę 3D.
import { chromium, webkit } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';
const engine = process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = 'dist/assets/plansze', file = `${dir}/intro-2.jpg`;
fs.mkdirSync(dir, { recursive: true });
const had = fs.existsSync(file);
if (!had) execSync(`sips -s format jpeg demo/podglad-hobbit-wzrost.png --out ${file}`, { stdio: 'ignore' });
execSync('node build.mjs', { stdio: 'ignore' });
const b = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => m.type() === 'error' && errors.push(m.text()));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForFunction(() => window.G && G.ready, null, { timeout: 90000 });
await p.waitForTimeout(500);
await p.evaluate(() => G.newGame());
const seen = {};
for (const id of ['intro-1', 'intro-2', 'intro-3']) {
  await p.waitForFunction(id => G.waiter && G.waiter.kind === 'line' && G.waiter.id === id, id, { timeout: 30000 });
  await p.waitForTimeout(1200);
  seen[id] = await p.evaluate(() => { const el = document.getElementById('plansza'); return !el.classList.contains('hidden') && /intro-2\.jpg/.test(el.style.backgroundImage); });
  if (id === 'intro-2') await p.screenshot({ path: 'docs/screens/test-podmiana-intro-2.png' });
  await p.evaluate(() => G.next());
}
await b.close();
if (!had) { fs.rmSync(file); execSync('node build.mjs', { stdio: 'ignore' }); }
const ok = !seen['intro-1'] && seen['intro-2'] && !seen['intro-3'] && !errors.length;
console.log(JSON.stringify({ ilustracja: seen, errors, ok }));
process.exit(ok ? 0 : 1);
