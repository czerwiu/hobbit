// Składa grę w dist/index.html, który działa po dwukliku (file://).
// - kod z src/ → jeden moduł ES wklejony do strony (three.js z CDN przez importmap),
// - modele models/*.glb → dist/models/<nazwa>.js (base64; przeglądarka z file:// nie wczyta .glb).
import { build } from 'esbuild';
import fs from 'fs';

fs.mkdirSync('dist/models', { recursive: true });
const models = fs.readdirSync('models').filter(f => f.endsWith('.glb')).map(f => f.slice(0, -4));
for (const m of models) {
  const src = `models/${m}.glb`, out = `dist/models/${m}.js`;
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  fs.writeFileSync(out, `(window.MODELS=window.MODELS||{})[${JSON.stringify(m)}]="${fs.readFileSync(src).toString('base64')}";\n`);
}

// dźwięki sounds/*.mp3 → dist/sounds/<nazwa>.js (base64; Web Audio z file:// nie wczyta pliku)
fs.mkdirSync('dist/sounds', { recursive: true });
const sounds = fs.readdirSync('sounds').filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4));
for (const m of sounds) {
  const src = `sounds/${m}.mp3`, out = `dist/sounds/${m}.js`;
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  fs.writeFileSync(out, `(window.SOUNDS=window.SOUNDS||{})[${JSON.stringify(m)}]="${fs.readFileSync(src).toString('base64')}";\n`);
}

const res = await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'esm', write: false, target: 'es2022',
  external: ['three', 'three/addons/*'], legalComments: 'none',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = fs.readFileSync('src/index.html', 'utf8')
  .replace('<!--MODELS-->', models.map(m => `<script src="models/${m}.js"></script>`).join('\n') + '\n' + sounds.map(m => `<script src="sounds/${m}.js"></script>`).join('\n'))
  .replace('/*BUNDLE*/', () => js);
fs.writeFileSync('dist/index.html', html);
// ilustracje scenek (opcjonalne): assets/plansze → dist/assets/plansze + lista plików.
// Gra czyta tylko listę: sprawdzanie brakujących plików z file:// zawsze zostawia błąd w konsoli.
fs.mkdirSync('dist/assets/plansze', { recursive: true });
if (fs.existsSync('assets/plansze')) fs.cpSync('assets/plansze', 'dist/assets/plansze', { recursive: true });
const plansze = fs.readdirSync('dist/assets/plansze').filter(f => f.endsWith('.jpg')).map(f => f.slice(0, -4));
fs.writeFileSync('dist/assets/plansze/lista.js', `window.PLANSZE = ${JSON.stringify(plansze)};\n`);
console.log(`ilustracje: ${plansze.length ? plansze.join(', ') : 'brak (wszystkie scenki w 3D)'}`);
console.log(`dist/index.html: ${(html.length / 1024) | 0} KB, modele: ${models.join(', ')}`);
