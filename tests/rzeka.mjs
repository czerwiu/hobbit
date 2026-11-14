// Test przeprawy: Bilbo przechodzi rzekę prawdziwymi klawiszami (W + Spacja), skok po skoku, aż do brzegu.
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errors = []; p.on('pageerror', e => errors.push(e.message));
await p.goto('file://' + process.cwd() + '/dist/index.html');
await p.waitForFunction(() => window.G && G.ready, null, { timeout: 90000 });
await p.evaluate(() => { G.runStage('road'); });
await p.waitForTimeout(800); await p.evaluate(() => G.start());
await p.evaluate(() => G.stage.setPhase('river')); await p.waitForTimeout(500);
const R = () => p.evaluate(() => G.stage.river);
const stones = await p.evaluate(() => G.stage.stones);
const log = [];
// z brzegu na pierwszy kamień, potem skoki: zawsze idź do przodu (-z) i skacz tuż przy krawędzi
for (let i = 0; i <= stones.length; i++) {
  const from = i === 0 ? { x: 1.2, z: -3.4 } : stones[i - 1];
  await p.evaluate(([x, z]) => G.stage.tp(x, z), [from.x, from.z]); await p.waitForTimeout(300);
  const to = i < stones.length ? stones[i] : { x: from.x, z: -19 };
  // obróć kamerę tak, by W prowadziło do celu
  await p.evaluate(([x, z, tx, tz]) => G.stage.aim(tx - x, tz - z), [from.x, from.z, to.x, to.z]);
  // na pierwszy kamień da się wejść z brzegu; dalej: dojdź do krawędzi i skocz
  if (i === 0) { await p.keyboard.down('KeyW'); await p.waitForTimeout(900); await p.keyboard.up('KeyW'); }
  else { await p.keyboard.down('KeyW'); await p.waitForTimeout(+(process.env.PRE ?? 250)); await p.keyboard.press('Space'); await p.waitForTimeout(800); await p.keyboard.up('KeyW'); }
  await p.waitForTimeout(400);
  const r = await R(), ph = await p.evaluate(() => G.stage.phase);
  log.push(`skok ${i + 1}: z=${r.z.toFixed(2)} y=${r.y.toFixed(2)} ${r.state} ${ph}`);
  if (r.state !== 'play' && ph === 'river') break;
}
await p.keyboard.down('KeyW'); await p.waitForTimeout(1200); await p.keyboard.up('KeyW');
const phase = await p.evaluate(() => G.stage.phase);
await p.screenshot({ path: 'docs/screens/test-rzeka-brzeg.png' });
await b.close();
console.log(log.join('\n')); console.log('faza na końcu:', phase, 'błędy:', errors);
process.exit(phase === 'sneak' && !errors.length ? 0 : 1);
