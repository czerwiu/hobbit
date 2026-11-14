# Decyzje projektowe

Szczegóły, których nie opisuje `story.md` ani `PROMPT-gra.md`. Wszystkie parametry liczbowe są na początku plików w `src/` jako stałe „do strojenia”.

## Technika

- **Kod** w modułach `src/`, składany przez esbuild w jeden moduł wklejony do `dist/index.html`. three.js 0.160 jest ładowany z CDN (jsdelivr) przez importmap — gra potrzebuje internetu przy pierwszym uruchomieniu.
- **Modele** `models/*.glb` build zamienia na `dist/models/<nazwa>.js` (base64). Pliki `.js` ładują się zwykłym `<script>`, więc działają z `file://`.
- **Dźwięki** to prawdziwe nagrania CC0 (Freesound, Kenney) i muzyka CC0 (OpenGameArt) — lista w `CREDITS.md`. Pliki `sounds/*.mp3` build zamienia na `dist/sounds/*.js` (base64), bo z `file://` Web Audio nie wczyta pliku. Przeglądarka pozwala grać dopiero po pierwszym kliknięciu, więc muzyka menu startuje po kliknięciu.
- **Muzyka:** „Rising Moon” (delikatna, tajemnicza) w menu, scenkach i etapach (w etapach ciszej); „Lament for a Warrior's Soul” przy śmierci Thorina i Króla Elfów, stratach i zakończeniach 2 i 3. Przejścia przez płynne wyciszanie.
- **Tło:** świerszcze nocą, rzeka i ognisko głośniejsze z bliska, skrzypienie liny na murze, odgłosy bitwy na polu bitwy.
- **Kroki** są odtwarzane w rytm ruchu: skradanie = miękkie kroki po trawie, bieg = chrzęst suchych liści, kamienie w rzece = kroki po kamieniu. Hobbit ma krótszy krok i wyższy dźwięk.
- **Kichnięcie** ma nagrany wdech „a… a…” i jest zgrane z napisem „A-PSIK!”. Przy prawie pełnym pasku kataru Bilbo pociąga nosem.
- **M** wycisza i włącza dźwięk (przydatne w klasie). Test: `tests/dzwiek.mjs` (dekodowanie wszystkich nagrań i kluczowe dźwięki w etapach).
- **Ilustracje zamiast scenek:** build zapisuje listę plików `dist/assets/plansze/lista.js`, a gra pokazuje tylko ilustracje z tej listy. Prompt przewidywał sprawdzanie każdego pliku przez `<img onerror>`, ale przy `file://` każda metoda sprawdzenia brakującego pliku (`<img>`, SVG `<image>`, `<object>`) zostawia błąd w konsoli Chrome i Safari (sprawdzone doświadczalnie). Wymagania „konsola bez błędów” i „samo wrzucenie pliku” wykluczają się, więc po wrzuceniu pliku trzeba uruchomić `npm run build` (patrz `docs/pytania.md`, pytanie 7).
- **Autotest w prawdziwej przeglądarce:** `dist/index.html?autotest` (albo dwuklik na `tests/safari-autotest.html`) — gra sama przechodzi 3 ścieżki i wypisuje wynik na ekranie i w tytule karty. Tak sprawdzone prawdziwe Safari 27: 3/3, 0 błędów, 52–60 kl./s.
- **Haki testowe** `window.G`: `newGame()`, `start()` (start etapu bez pointer lock), `next()`, `choose(true/false)`, `finishStage()`, `skip()`, `playScene(id)`, a w etapach `G.stage.tp(x, z)`, `setPhase(...)`, `autoKill()`, `aimAt(i)`.
- **Scenka `lab-postacie`** nie należy do fabuły. Służy do podglądu postaci (`G.playScene('lab-postacie')`).

## Postacie z modeli

- **Thorin, Dáin, Król Leśnych Elfów** — jeden model „King” w trzech wersjach kolorystycznych. Thorin i Dáin mają wzrost ok. 1,4 m i szerokość × 1,3. Korona Thorina pasuje do „Króla spod Góry”.
- **Krasnoludy** — model „Adventurer” (ma brodę i plecak) zmniejszony do 1,35 m, szerokość × 1,3. Kaptury w kolorach z książki. Armia Dáina: ten sam model w stalowych kolorach, bez plecaków, z mieczami.
- **Bard i ludzie** — model „Adventurer” bez plecaka.
- **Gobliny** — model „Orc” (zielony, garbaty). Model „Goblin” z poly.pizza jest „klockowy” i nie pasował stylem.
- **Wargi** — „Wolf” w ciemnych kolorach ze świecącymi czerwonymi oczami. Goblin siedzi na grzbiecie (pozycja z kości tułowia wilka).
- **Miecz Thorina** — miecz z modelu elfa (ten sam szkielet Quaterniusa, więc pasuje do dłoni bez strojenia).
- **Łuk** trzyma się w prawej dłoni: w animacji `Idle_Gun_Pointing` prawe ramię jest wyciągnięte do przodu, co wygląda jak celowanie z łuku.

## Etap 1: droga do obozu (Z1)

- Jeden ciągły poziom z punktami kontrolnymi: **lina → rzeka → skradanie**. Porażka i klawisz R wracają do początku bieżącej części.
- **Lina:** przytrzymanie Spacji przyspiesza zjazd (3,2 m/s²), puszczenie hamuje. Prędkość powyżej 2,8 m/s przez 0,35 s = ześlizgnięcie i powrót na górę muru. Wychodzi rytm „trzymaj ok. 0,8 s — puść”. Mur ma 13 m, zejście trwa ok. 10 s.
- **Rzeka:** 7 kamieni co ok. 2 m, przerwy wymagają skoku (Spacja). Skok ma stałą długość ok. 1,6 m (także w biegu), więc udaje się z dowolnego miejsca przedniej połowy kamienia. Brzegi są wyraźnie nad wodą i zaczynają się tuż przy pierwszym i ostatnim kamieniu. Zejście z kamienia albo nieudany skok = plusk i powrót na brzeg. Test: `tests/rzeka.mjs` (prawdziwe klawisze, skok po skoku).
- **Skradanie:** mechanika z dema bez zmian, tylko przesunięta za rzekę. Pasek kataru i pierścień działają tylko w tej części (na linie i w rzece Bilbo nie może użyć pierścienia ani odpocząć przy skale, więc rosnący katar byłby niesprawiedliwy).
- **Kichnięcie** przy ognisku to scenka w silniku etapu (jak w demie), po niej gra przechodzi do scenki przekazania.

## Etap: Bard z łukiem (Z1, Z2)

- Strzała: prędkość 46 m/s, grawitacja 7 m/s² (mniejsza niż prawdziwa, żeby dało się trafić; łuk lotu nadal widać na dystansie 30–40 m).
- Cel strzału = punkt pod celownikiem (wróg albo ziemia). Strzała leci z łuku do tego punktu i opada.
- Na raz atakują najwyżej 3 wargi. Warg przy Bardzie gryzie co 1,6 s: wstrząs kamery i czerwony błysk, bez obrażeń (Bard nie może zginąć).
- W Z1 krasnoludy (z Thorinem) walczą w tle. W Z2 Thorin i 12 krasnoludów stoją na wzgórzu z boku i patrzą.

## Etap: Thorin z mieczem (Z3)

- Cios: zasięg 2,5 m, kąt ±63° od kierunku patrzenia kamery. Każdy przeciwnik pada po 2 ciosach: elf jest „rozbrojony”, człowiek „ogłuszony”. Broń wypada i leży na ziemi.
- Na raz walczy najwyżej 2 przeciwników. Ich ciosy dają tylko wstrząs i czerwony błysk (Thorin nie może zginąć).

## Etap: Bilbo się chowa (Z3)

- Pierścień w tym etapie się nie wyczerpuje. Wejście w świetlny krąg bez pierścienia pokazuje podpowiedź „Najpierw załóż pierścień (E)!”. Nie da się przegrać.

## Scenki

- Każda plansza intro to jedna scenka z jednym akapitem tekstu ze `story.md`.
- Dialogi w scenkach zakończeń dopisałem sam na podstawie opisów ze `story.md` (patrz `docs/pytania.md`, pytanie 1).
- „Ekran gaśnie” po okrzyku Barda = wolne ściemnienie (2,5 s).
- Napis z Z2 („Bitwa została wygrana, ale okupiona…”) jest osobną planszą tekstową przed tekstem końcowym.
- Ekran końcowy ma tytuł „Zakończenie 1/2/3” i tekst końcowy ze `story.md` bez zmian.
