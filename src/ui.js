// Interfejs: HUD, dialogi, wybory, karty, nakładki etapów, ekran końcowy.
// Gra czeka na gracza zawsze przez jeden "waiter" — haki testowe (window.G) mogą go rozwiązać bez klikania.
import { $, lock } from './core.js';

let cur = null;
export function waiter(kind, id) { return new Promise(res => { cur = { kind, id, res }; }); }
export function resolveWaiter(kind, v) {
  if (cur && (!kind || cur.kind === kind)) { const c = cur; cur = null; c.res(v); return true; }
  return false;
}
export const currentWaiter = () => cur && { kind: cur.kind, id: cur.id };
export function dropWaiter() { cur = null; }

const show = (id, on = true) => $(id).classList.toggle('hidden', !on);
export { show };

// ---------- dalej: klik lub Spacja / Enter ----------
addEventListener('keydown', e => {
  if (e.repeat) return;
  if ((e.code === 'Space' || e.code === 'Enter') && cur && (cur.kind === 'line' || cur.kind === 'card')) resolveWaiter();
});
addEventListener('click', e => {
  if (e.target.closest('button')) return;
  if (cur && (cur.kind === 'line' || cur.kind === 'card')) resolveWaiter();
});

// ---------- HUD ----------
export function hud({ ring = false, katar = false, speed = false, counter = null, cross = false, keys = null } = {}) {
  const anyBar = ring || katar || speed;
  show('hud', anyBar); show('ringRow', ring); show('katarRow', katar); show('speedRow', speed);
  show('counter', counter !== null); if (counter !== null) $('counter').textContent = counter;
  show('cross', cross);
  show('keys', !!keys); if (keys) $('keys').textContent = keys;
  $('status').textContent = '';
}
export function setBar(id, v, warn = false) { $(id).firstChild.style.width = Math.max(0, Math.min(1, v)) * 100 + '%'; $(id).classList.toggle('warn', warn); }
export function hideAll() {
  hud(); ['dlg', 'choice', 'card', 'overlay', 'ending', 'menu', 'info', 'plansza'].forEach(id => show(id, false));
  center('', ''); mark(''); $('vigAlert').style.opacity = 0; $('vigRing').style.opacity = 0; $('say').style.opacity = 0; $('tip').style.opacity = 0;
  document.querySelector('canvas').style.filter = '';
}
export function say(who, text, ms = 2500) {
  const el = $('say'); el.innerHTML = who ? `<b>${who}</b>${text}` : text; el.style.opacity = 1;
  clearTimeout(say.t); say.t = setTimeout(() => (el.style.opacity = 0), ms);
}
export function tip(text, ms = 6000) { const el = $('tip'); el.textContent = text; el.style.opacity = 1; clearTimeout(tip.t); tip.t = setTimeout(() => (el.style.opacity = 0), ms); }
export function center(title, sub = '') { $('title').textContent = title; $('sub').textContent = sub; }
export function mark(t) { $('mark').textContent = t; }

// ---------- ściemnienie ----------
export function fade(to, ms = 800) {
  const f = $('fade'); f.style.transition = `opacity ${ms}ms`; f.style.opacity = to;
  return new Promise(r => setTimeout(r, ms));
}

// ---------- dialog ----------
export function dialog(who, text) {
  show('dlg');
  $('dlgWho').textContent = who || '';
  $('dlgWho').style.display = who ? '' : 'none';
  $('dlgText').textContent = text;
  $('dlgText').className = who ? '' : 'narr';
}
export function hideDialog() { show('dlg', false); }

// ---------- ekrany ----------
export async function choice(q, id) {
  show('choice'); $('choiceQ').textContent = q;
  const v = await waiter('choice', id);
  show('choice', false); return v;
}
$('bYes').onclick = () => resolveWaiter('choice', true);
$('bNo').onclick = () => resolveWaiter('choice', false);

export async function card(title, text, id = 'card') {
  show('card'); $('cardTitle').textContent = title; $('cardText').textContent = text;
  await waiter('card', id); show('card', false);
}

// nakładka etapu: instrukcja przed startem i pauza (klik = pointer lock)
export async function overlay(title, text, keys, go = 'Kliknij, aby zacząć', id = 'overlay') {
  show('overlay'); $('ovTitle').textContent = title; $('ovText').textContent = text; $('ovKeys').textContent = keys || ''; $('ovGo').textContent = go;
  await waiter('overlay', id); show('overlay', false);
}
$('overlay').addEventListener('click', e => {
  if (e.target.closest('button')) return;
  lock();
  resolveWaiter('overlay') || resolveWaiter('pause');
});

export async function ending(title, text, id) {
  show('ending'); $('endTitle').textContent = title; $('endText').textContent = text;
  const v = await waiter('ending', id); show('ending', false); return v;
}
$('bAgain').onclick = () => resolveWaiter('ending', 'again');
$('bMenu').onclick = () => resolveWaiter('ending', 'menu');

// prosty Markdown → HTML (nagłówki, listy, tabele, linki) dla ekranu Autorzy
export function md(text) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(https?:\/\/[^\s|)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  let out = '', list = false;
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (l.startsWith('- ') || (l.startsWith('|') && !/^\|[-\s|]+\|$/.test(l))) {
      if (!list) { out += '<ul>'; list = true; }
      const cells = l.startsWith('|') ? l.slice(1, -1).split('|').map(c => c.trim()) : [l.slice(2)];
      if (cells[0] === 'Model') continue;
      out += `<li>${cells.map(inline).join(' — ')}</li>`;
      continue;
    }
    if (list && !/^\|[-\s|]+\|$/.test(l)) { out += '</ul>'; list = false; }
    if (l.startsWith('# ')) continue;
    if (l.startsWith('## ')) out += `<h3>${inline(l.slice(3))}</h3>`;
    else if (l && !l.startsWith('|')) out += `<p>${inline(l)}</p>`;
  }
  return out + (list ? '</ul>' : '');
}

// pierścień: szary obraz, winieta, półprzezroczysty bohater
export function ringEffect(on, char) {
  document.querySelector('#game canvas').style.filter = on ? 'grayscale(.85) brightness(1.2) contrast(1.1)' : '';
  $('vigRing').style.opacity = on ? 1 : 0;
  if (char) char.setOpacity(on ? 0.18 : 1);
}
