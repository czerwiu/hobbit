// Hobbit: Bitwa Pięciu Armii — przebieg gry: menu → intro → wybory → etapy i scenki → zakończenia.
import * as THREE from 'three';
import { $, setMode, setPaused, paused, isLocked, unlock, camera } from './core.js';
import { loadModels } from './chars.js';
import * as UI from './ui.js';
import { S } from './stage.js';
import { playScene, probeImages, menuBackdrop, SCENE_IDS, sceneCtx } from './scenes.js';
import { roadStage } from './road.js';
import { bowStage } from './bow.js';
import { swordStage } from './sword.js';
import { hideStage } from './hide.js';
import { autotest } from './autotest.js';
import { music, amb, toggleMute, isMuted, audioState } from './sfx.js';

const Q1 = 'Czy Bilbo odda Arcyklejnot ludziom i elfom, aby mieli kartę przetargową w rozmowach z Thorinem?';
const Q2 = 'Czy Bilbo odda swoją część skarbu na odbudowę miasta?';
const ENDINGS = {
  1: 'Dzięki uczciwości Bilba bitwa została wygrana. Bilbo może w spokoju wrócić do domu…',
  2: 'Dzięki hojności Bilba bitwa została wygrana. Niestety brak woli walki krasnoludów doprowadził do śmierci bardzo wielu ludzi i elfów…',
  3: 'Przez chciwość i zuchwałość dobro tym razem nie zwyciężyło…',
};

// przerwanie rozgrywki (powrót do menu): stary przebieg gry zatrzymuje się na najbliższym kroku
const ABORT = new Error('abort');
let gen = 0;
const flow = { path: [], ending: null };

const blank = new THREE.Scene(); blank.background = new THREE.Color(0x000000);
const black = () => setMode({ scene: blank, update() {} });

async function game() {
  const my = ++gen;
  const s = async p => { const r = await p; if (my !== gen) throw ABORT; return r; };
  const scenes = async (...ids) => { for (const id of ids) { flow.path.push(id); await s(playScene(id)); } };
  const stage = async (id, f) => { flow.path.push(id); await s(f()); black(); };
  const card = async (t, txt, id) => { flow.path.push(id); black(); await s(UI.fade(0, 300)); await s(UI.card(t, txt, id)); await s(UI.fade(1, 500)); };
  const choose = async (q, id) => { flow.path.push(id); const v = await s(UI.choice(q, id)); await s(UI.fade(1, 700)); black(); return v; };
  flow.path = []; flow.ending = null;
  try {
    UI.hideAll(); await s(UI.fade(1, 500));
    await scenes('intro-1', 'intro-2', 'intro-3', 'intro-4', 'intro-5', 'intro-6');
    let end;
    if (await choose(Q1, 'wybor-1')) {
      await stage('z1-droga', roadStage);
      await scenes('z1-przekazanie', 'z1-negocjacje', 'z1-atak', 'z1-kamien');
      await card('Grasz teraz jako Bard', 'Bilbo nie może walczyć.\nBard z łukiem musi powstrzymać gobliny na wargach.', 'z1-zmiana');
      await stage('z1-bard', () => bowStage({ dwarves: 'fight' }));
      await scenes('z1-goblin-strzela', 'z1-bard-krzyk', 'z1-thorin-lozko');
      end = 1;
    } else {
      await scenes('z23-negocjacje');
      if (await choose(Q2, 'wybor-2')) {
        await scenes('z2-zgoda', 'z2-atak');
        await card('Grasz teraz jako Bard', 'Bilbo nie umie walczyć, a krasnoludy nie chcą walczyć.\nBard z łukiem musi powstrzymać gobliny na wargach.', 'z2-zmiana');
        await stage('z2-bard', () => bowStage({ dwarves: 'watch' }));
        await scenes('z2-straty', 'z2-krol');
        await card('', 'Bitwa została wygrana, ale okupiona wielkimi stratami po stronie ludzi i elfów', 'z2-napis');
        end = 2;
      } else {
        await scenes('z3-dain');
        await card('Grasz teraz jako Thorin', 'Krasnoludy walczą z ludźmi i elfami.\nThorin walczy mieczem.', 'z3-zmiana-thorin');
        await stage('z3-thorin-walka', swordStage);
        await scenes('z3-gobliny');
        await card('Grasz teraz jako Bilbo', 'Bilbo nie umie walczyć.\nZałóż pierścień i schowaj się za kamieniem.', 'z3-zmiana-bilbo');
        await stage('z3-bilbo', hideStage);
        await scenes('z3-przegrana', 'z3-thorin', 'z3-odejscie');
        end = 3;
      }
    }
    flow.ending = end; flow.path.push('koniec-' + end);
    black(); UI.hideAll();
    music(end === 1 ? 'main' : 'sad', 0.8); amb({});
    const again = UI.ending(`Zakończenie ${end}`, ENDINGS[end], 'koniec-' + end);
    await s(UI.fade(0, 900));
    const r = await s(again);
    if (r === 'again') game(); else menu();
  } catch (e) {
    if (e !== ABORT) throw e;
  }
}

function menu() {
  gen++;
  S.active = null; setPaused(false); unlock();
  UI.dropWaiter(); UI.hideAll();
  setMode(menuBackdrop());
  UI.show('menu');
  UI.fade(0, 900);
}
async function info(title, html) {
  UI.show('menu', false); UI.show('info');
  $('infoTitle').textContent = title; $('infoBox').innerHTML = html;
}
$('bStart').onclick = () => { UI.show('menu', false); game(); };
$('bHow').onclick = () => info('Jak grać', `
  <h3>O grze</h3><p>Gra opowiada o Bitwie Pięciu Armii z powieści „Hobbit” J.R.R. Tolkiena. Grasz jako hobbit Bilbo. Twoje dwa wybory decydują, które z trzech zakończeń zobaczysz.</p>
  <h3>Scenki</h3><p>Kliknij albo naciśnij Spację, aby przejść dalej.</p>
  <h3>Etapy</h3><ul>
  <li><b>WASD</b> — ruch, <b>mysz</b> — kamera (kliknij w grę, aby przechwycić mysz)</li>
  <li><b>Shift</b> — podbieganie (głośne!), <b>Spacja</b> — zjazd po linie i skok</li>
  <li><b>E</b> — pierścień: przez 5 sekund nikt cię nie widzi; ładuje się przy skałach</li>
  <li><b>Lewy przycisk</b> — strzał z łuku albo cios mieczem, <b>prawy przycisk</b> — przybliżenie przy celowaniu</li>
  <li><b>R</b> — etap od nowa, <b>Esc</b> — pauza, <b>M</b> — wyłącz albo włącz dźwięk</li></ul>
  <h3>Skradanie</h3><p>Omijaj światło latarni elfich strażników. Skała zasłania cię przed latarnią. Przy skale odpoczywasz: pierścień się ładuje, a katar maleje. Gdy pasek kataru się zapełni, Bilbo kichnie.</p>`);
$('bCredits').onclick = () => info('Autorzy', UI.md(window.CREDITS_MD || ''));
$('bBack').onclick = () => { UI.show('info', false); UI.show('menu'); };
$('bMenu2').onclick = () => menu();

// M: wycisz / włącz dźwięk (np. w klasie)
addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) UI.say('', toggleMute() ? 'Dźwięk wyłączony (M)' : 'Dźwięk włączony (M)', 1500); });

// pauza: utrata pointer lock w trakcie etapu (Esc)
document.addEventListener('pointerlockchange', () => {
  const st = S.active;
  if (!st) return;
  if (!isLocked() && st.state !== 'intro' && st.state !== 'done' && !paused) {
    setPaused(true);
    UI.show('overlay'); $('ovTitle').textContent = 'Pauza'; $('ovText').textContent = ''; $('ovKeys').textContent = st.keys; $('ovGo').textContent = 'Kliknij, aby wrócić';
  } else if (isLocked() && paused) { setPaused(false); UI.show('overlay', false); }
});

// ---------- haki testowe (Playwright nie obsługuje pointer lock) ----------
window.G = {
  ready: false,
  get waiter() { return UI.currentWaiter(); },
  get stage() { return S.active; },
  get scene() { return sceneCtx(); },
  get flow() { return flow; },
  get fps() { return window.FPS; },
  get audio() { return { music: audioState.music, amb: Object.fromEntries(Object.entries(audioState.amb).filter(([, a]) => a.want > 0).map(([n, a]) => [n, +a.want.toFixed(2)])), muted: isMuted(), sounds: Object.keys(window.SOUNDS || {}).length, decoded: audioState.decoded, failed: audioState.failed, played: audioState.played }; },
  newGame() { UI.show('menu', false); game(); },
  playScene(id) { UI.show('menu', false); return playScene(id); },
  runStage(name, o) { UI.show('menu', false); return ({ road: roadStage, bow: bowStage, sword: swordStage, hide: hideStage })[name](o); },
  menu,
  start() { return UI.resolveWaiter('overlay'); },          // start etapu bez kliknięcia
  next() { return UI.resolveWaiter('line') || UI.resolveWaiter('card'); },
  choose(v) { return UI.resolveWaiter('choice', v); },
  finishStage() { return UI.resolveWaiter('stage'); },      // pominięcie etapu
  skip() { const w = UI.currentWaiter(); if (!w) return false; return UI.resolveWaiter(w.kind, w.kind === 'ending' ? 'menu' : w.kind === 'choice' ? true : undefined); },
};

// ---------- start ----------
probeImages(SCENE_IDS);
await loadModels(p => { $('loadBar').style.width = p * 100 + '%'; });
UI.show('loading', false);
menu();
window.G.ready = true;
if (/[?&]autotest/.test(location.search)) autotest(window.G);
