// Arkusz kontaktowy: node tests/sheet.mjs <wyjście.png> <plik1.png> <plik2.png> ... (po 2 w rzędzie, z podpisami)
import { chromium } from 'playwright';
import path from 'path';
const [out, ...files] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 100 } });
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:1fr 1fr;gap:4px;font:13px sans-serif;color:#ff0">` +
  files.map(f => `<div style="position:relative"><img src="file://${path.resolve(f)}" style="width:100%;display:block"><span style="position:absolute;left:4px;top:2px;background:#000a">${path.basename(f)}</span></div>`).join('') + '</body>';
const tmp = path.resolve(out + '.html'); (await import('fs')).writeFileSync(tmp, html); await p.goto('file://' + tmp); await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true }); await b.close();
