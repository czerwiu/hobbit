# Hobbit: Bitwa Pięciu Armii

Gra przeglądarkowa 3D na podstawie powieści J.R.R. Tolkiena „Hobbit, czyli tam i z powrotem”. Projekt zaliczeniowy z języka polskiego.

Grasz jako hobbit Bilbo. Po wprowadzeniu podejmujesz dwa wybory. Od nich zależy, które z trzech zakończeń zobaczysz.

## Jak uruchomić

1. Otwórz plik **`dist/index.html`** dwuklikiem (Chrome albo Safari).
2. Przy pierwszym uruchomieniu potrzebny jest internet: biblioteka three.js wczytuje się z sieci (CDN).
3. Kliknij **Start**.

Gra nie potrzebuje serwera ani instalacji. Katalog `dist/` można skopiować na pendrive i uruchomić na innym komputerze.

## Sterowanie

| Klawisz | Działanie |
|---|---|
| Klik / Spacja | następna kwestia w scenkach |
| W A S D | ruch |
| Mysz | kamera (kliknij w grę, aby przechwycić mysz) |
| Shift | podbieganie (szybciej, ale głośno, a katar rośnie szybciej) |
| Spacja | zjazd po linie (przytrzymaj) i skok w rzece |
| E | pierścień: niewidzialność |
| Lewy przycisk myszy | strzał z łuku albo cios mieczem |
| Prawy przycisk myszy | przybliżenie przy celowaniu z łuku |
| R | etap od nowa |
| Esc | pauza |
| M | wyłącz / włącz dźwięk |

## Trzy zakończenia

Pierwszy wybór: **Czy Bilbo odda Arcyklejnot ludziom i elfom?**

- **Zakończenie 1 (TAK)** — najbliższe książce. Bilbo nocą schodzi z muru po linie, przeprawia się przez rzekę i skrada się obok elfich strażników do obozu. Oddaje Arcyklejnot Bardowi. Podczas negocjacji Thorin dowiaduje się prawdy i szarpie Bilba. Atakują gobliny na wargach. Kamień ogłusza Bilba, a gracz walczy jako Bard z łukiem. Goblin trafia Thorina strzałą. Umierający Thorin przeprasza Bilba.

Gdy Bilbo zatrzyma Arcyklejnot, negocjacje kończą się niczym i pada drugie pytanie: **Czy Bilbo odda swoją część skarbu na odbudowę miasta?**

- **Zakończenie 2 (NIE → TAK)** — Bilbo oddaje swoją część skarbu i strony się godzą. Atakują gobliny, ale krasnoludy nie chcą walczyć. Gracz walczy jako Bard. Bitwa jest wygrana, ale ginie wielu ludzi i elfów, także Król Leśnych Elfów.
- **Zakończenie 3 (NIE → NIE)** — przybywa Dáin z armią krasnoludów. Gracz walczy jako Thorin z ludźmi i elfami (przeciwnicy padają ogłuszeni albo rozbrojeni). Potem atakują gobliny. Gracz jako Bilbo zakłada pierścień i chowa się za kamieniem. Krasnoludy przegrywają, Thorin ginie, a Bilbo odchodzi sam.

Scenariusz, teksty i lista świadomych odstępstw od lektury: `story.md`.

## Ilustracje zamiast scenek 3D

Każdą scenkę fabularną można zastąpić obrazkiem:

1. Wybierz scenkę i jej identyfikator z `docs/prompty-ilustracji.md` (tam są też gotowe prompty do generatora obrazów).
2. Zapisz obrazek 16:9 jako `assets/plansze/<id>.jpg`, np. `assets/plansze/z1-thorin-lozko.jpg`.
3. Uruchom `npm run build`. Build skopiuje obrazki do `dist/assets/plansze/` i zapisze ich listę.
4. Uruchom grę. Ta scenka pokaże obrazek z tym samym paskiem narracji. Pozostałe scenki zostaną w 3D.

Krok z buildem jest potrzebny, bo przeglądarka otwierająca plik z dysku nie umie sprawdzić, czy obrazek istnieje, bez błędu w konsoli.

## Dla programistów

```bash
npm install          # esbuild i playwright
npm run build        # src/ + models/ → dist/index.html i dist/models/*.js
npm test             # test e2e: wszystkie 3 ścieżki w Chrome, zrzuty w docs/screens/
node tests/e2e.mjs 2 --fast   # jedna ścieżka, bez zrzutów
node tests/e2e.mjs --browser=webkit --fast   # silnik Safari
node tests/plansze.mjs        # podmiana scenki na ilustrację
node tests/dzwiek.mjs         # dźwięk: dekodowanie nagrań, muzyka, tło, efekty
```

Autotest w dowolnej przeglądarce (np. w Safari): dwuklik na `tests/safari-autotest.html`. Gra sama przejdzie 3 ścieżki i wypisze wynik w lewym górnym rogu.

- `src/` — kod (moduły ES): `main.js` (przebieg gry), `scenes.js` (scenki), `road.js`, `bow.js`, `sword.js`, `hide.js` (etapy), `chars.js` (postacie), `env.js` (otoczenie).
- `models/` — modele `.glb`. Build zamienia je na pliki `.js` z base64, bo przeglądarka z `file://` nie wczyta `.glb`.
- `demo/` — wcześniejsze dema technologii (zaakceptowane: `skradanie-tpp.html`).
- `docs/decyzje.md` — szczegóły mechanik, `docs/pytania.md` — otwarte pytania, `docs/screens/` — zrzuty z testów.

## Autorzy i licencje

Pełna lista licencji modeli, muzyki i dźwięków: `CREDITS.md`.

- Modele 3D: **Quaternius** (quaternius.com), licencja **CC0** — Character Animated, Hooded Adventurer, King, Adventurer, Orc, Wolf, Wooden Bow, Arrow.
- three.js — licencja MIT. Czcionka Cinzel — SIL Open Font License.
- Muzyka: **randommind** (OpenGameArt), licencja **CC0** — „Fantasy: Rising Moon”, „Fantasy: Lament for a Warrior's Soul”.
- Efekty dźwiękowe: nagrania z **Freesound** i kroki z paczki **Kenney Impact Sounds**, wszystkie **CC0** (autorzy w `CREDITS.md`).
- Na podstawie powieści J.R.R. Tolkiena „Hobbit, czyli tam i z powrotem”.
