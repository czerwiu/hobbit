// Test dźwięku: wszystkie nagrania się dekodują, a kluczowe dźwięki, muzyka i tło włączają się w odpowiednich chwilach.
// Użycie: node tests/dzwiek.mjs [--browser=webkit]
import { chromium, webkit } from 'playwright';
const wk = process.argv.includes('--browser=webkit');
const b = wk ? await webkit.launch() : await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForFunction(() => window.G && G.ready, null, { timeout: 90000 });
await p.mouse.click(5, 5); await p.keyboard.press('Shift');          // gest użytkownika odblokowuje dźwięk
await p.waitForFunction(() => G.audio.decoded + G.audio.failed.length >= G.audio.sounds, null, { timeout: 60000 });
const A = () => p.evaluate(() => G.audio);
const checks = [];
const ok = (name, cond, info = '') => checks.push(`${cond ? 'OK ' : 'BŁĄD'} ${name} ${info}`);
let a = await A(); ok('dekodowanie', a.decoded === a.sounds && !a.failed.length, `${a.decoded}/${a.sounds} ${a.failed}`);
ok('menu: muzyka i świerszcze', a.music === 'main' && a.amb.night > 0, JSON.stringify(a.amb));
// droga: lina, rzeka, skradanie, kichnięcie
await p.evaluate(() => { G.runStage('road'); }); await p.waitForTimeout(800); await p.evaluate(() => G.start());
await p.keyboard.down('Space'); await p.waitForTimeout(800); await p.keyboard.up('Space'); await p.waitForTimeout(300);
await p.evaluate(() => { G.stage.setPhase('river'); G.stage.tp(0.9, -4.9); G.stage.aim(-1.3, -2); }); await p.waitForTimeout(400);
await p.keyboard.down('KeyW'); await p.waitForTimeout(200); await p.keyboard.press('Space'); await p.waitForTimeout(900); await p.keyboard.up('KeyW');
a = await A(); ok('rzeka: szum wody', a.amb.river > 0.3, JSON.stringify(a.amb));
await p.evaluate(() => { G.stage.setPhase('sneak'); }); await p.waitForTimeout(200);
await p.keyboard.down('KeyW'); await p.waitForTimeout(1500); await p.keyboard.down('ShiftLeft'); await p.waitForTimeout(1500); await p.keyboard.up('ShiftLeft'); await p.keyboard.up('KeyW');
await p.keyboard.press('KeyE'); await p.waitForTimeout(300);
await p.evaluate(() => { G.stage.setPhase('sneak'); G.stage.tp(0, -211); }); await p.keyboard.down('KeyW'); await p.waitForTimeout(300); await p.keyboard.up('KeyW'); await p.waitForTimeout(2000);
a = await A(); const pl = a.played;
for (const n of ['rope_slide', 'step_stone', 'step_grass', 'step_leaves', 'ring', 'sneeze']) ok(`droga: ${n}`, pl[n] > 0, pl[n] || 0);
ok('droga: ognisko słychać przy obozie', a.amb.fire > 0.3, JSON.stringify(a.amb));
await p.evaluate(() => G.finishStage()); await p.waitForTimeout(1500);
// Bard
await p.evaluate(() => { G.runStage('bow', { dwarves: 'fight' }); }); await p.waitForTimeout(800); await p.evaluate(() => G.start());
await p.mouse.move(480, 270); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(300);
await p.evaluate(() => G.stage.autoKill()); await p.waitForTimeout(800);
a = await A();
for (const n of ['bow', 'arrow_hit', 'goblin_death', 'fall']) ok(`łuk: ${n}`, a.played[n] > 0, a.played[n] || 0);
ok('łuk: odgłosy bitwy', a.amb.battle > 0.3, JSON.stringify(a.amb));
await p.evaluate(() => G.finishStage()); await p.waitForTimeout(1500);
// Thorin
await p.evaluate(() => { G.runStage('sword'); }); await p.waitForTimeout(800); await p.evaluate(() => G.start());
await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(500);
a = await A(); ok('miecz: swing', a.played.swing > 0, a.played.swing || 0);
await p.evaluate(() => G.finishStage()); await p.waitForTimeout(1500);
// scenka śmierci Thorina: smutna muzyka
await p.evaluate(() => { G.playScene('z1-thorin-lozko'); }); await p.waitForTimeout(1500);
a = await A(); ok('łoże śmierci: smutna muzyka', a.music === 'sad');
// wyciszenie
await p.keyboard.press('KeyM'); a = await A(); ok('M wycisza', a.muted === true);
await b.close();
console.log(checks.join('\n')); console.log('błędy strony:', errors);
process.exit(checks.some(c => c.startsWith('BŁĄD')) || errors.length ? 1 : 0);
