# Prompt: zbuduj pełną grę „Hobbit: Bitwa Pięciu Armii”

## Cel

Zbuduj kompletną grę przeglądarkową 3D na podstawie scenariusza z `story.md`. To projekt zaliczeniowy z języka polskiego w szkole podstawowej. Ocenia się zrozumienie lektury, a gra ma zrobić „efekt wow”. Gracz przechodzi intro, podejmuje dwa wybory i dochodzi do jednego z trzech zakończeń.

Katalog projektu: `/Users/czerwiu/Documents/projects-ai/hobbit`.

## Materiały wejściowe — przeczytaj je najpierw

| Plik | Rola |
|---|---|
| `story.md` | **Źródło prawdy o fabule:** intro (6 plansz), drzewo decyzji, 3 zakończenia krok po kroku, teksty końcowe, tabela świadomych odstępstw od lektury. Nie zmieniaj fabuły ani tekstów końcowych. |
| `demo/skradanie-tpp.html` | **Zaakceptowane demo technologii i stylu.** Kamera za bohaterem, noc, latarnie strażników, skały zasłaniające linię widzenia, pierścień, katar, podbieganie z hałasem, scenka w obozie. Przenieś z niego kod i parametry zamiast pisać od zera. |
| `demo/models/bilbo.glb` (+ `.glb.js`) | Bilbo: model „Character Animated / Rogue” (Quaternius, CC0), przerobiony w kodzie na hobbita. |
| `demo/models/elf-guard.glb` (+ `.glb.js`) | Elf-strażnik: „Hooded Adventurer” (Quaternius, CC0). |
| `demo/podglad-hobbit-wzrost.png` | Referencja wyglądu i wzrostu Bilba obok elfa. |
| `demo/skradanie-fpv.html`, `demo/skradanie.html` | **Odrzucone** warianty (FPV i 2D). Tylko do wglądu. |
| `assets.md` | **Nieaktualne:** opisuje styl 2D. Użyj go tylko jako listy scen i postaci. |

## Decyzje już podjęte — nie zmieniaj ich

1. **Hybryda.** Etapy z rozgrywką są w 3D z kamerą za bohaterem (TPP). Scenki fabularne między etapami to **scenki z modeli 3D z tekstem lub dialogiem**, jak w komiksie. Później użytkownik może zastąpić wybrane scenki ilustracjami (szczegóły w sekcji „Scenki fabularne”).
2. **Technologia:** Three.js 0.160 z CDN (importmap, jsdelivr), statyczne pliki, bez backendu.
3. **Gotowa gra musi działać po dwukliku** (`file://`) w Chrome i Safari. Przeglądarka blokuje wtedy wczytywanie plików `.glb` i lokalnych modułów ES. Modele osadzaj jako base64 w plikach `.js` (jak w demo). Kod możesz pisać jako moduły w `src/`, ale wtedy dodaj krok budowania, który składa wszystko w `dist/index.html` działający z `file://`, np. `npx esbuild` z bundlowaniem do jednego pliku. Opisz to w README.
4. **Sterowanie:** WASD i mysz (pointer lock, kamera krąży wokół postaci), Shift = podbieganie, E = pierścień, R = restart etapu, Esc = pauza.
5. **Styl:** noc, mgła, księżyc, gwiazdy. Latarnie i ogniska to główne źródła światła. Modele low-poly Quaterniusa (CC0). Ekspozycja i światło otoczenia jak w demo: użytkownik ocenił jaśniejszą wersję jako „za jasną”, a pierwotną jako „za ciemną przy skale”. Bohater ma delikatną własną poświatę (`emissive` = kolor × ~0,2) i słabe światło od strony kamery, żeby był czytelny w cieniu skały.
6. **Bilbo** = model z `demo/models/bilbo.glb` przerobiony w kodzie: wzrost 1,1 m liczony od kości `Head_end`, skala X/Z × 1,15 (krępy), kolory (kamizelka `0x8e2a1e`, koszula `0xe8dcc0`, spodnie `0x6a4a2a`, włosy `0x5a3518`, „buty” w kolorze skóry `0xe0ac85` = bose stopy), kości `FootL`/`FootR` × 1,6 po każdej aktualizacji animacji.
   - **Odrzucone:** pochylanie postaci przy skradaniu („wygląda, jakby miał się przewrócić”), modele KayKit („jak plastelinowy ludzik”), Adventurer („jak pomniejszony dorosły”).
7. **Mechaniki skradania z demo** zostają bez zmian:
   - skała zasłania linię widzenia latarni (raycast),
   - przy skale pierścień się ładuje, a katar maleje,
   - pierścień: 5 s niewidzialności, szary obraz, półprzezroczysty Bilbo; strażnik widzi wtedy tylko „?”,
   - pełny pasek kataru = kichnięcie = powrót na początek etapu,
   - Shift: szybszy bieg, katar rośnie × 2,5, hałas słychać z 7 m; strażnik zatrzymuje się na 2,5 s i obraca w stronę dźwięku,
   - wykrycie = powrót na początek etapu.
8. **Język:** wszystkie teksty w grze po polsku, z poprawną ortografią i polskimi znakami. „Nie” z imiesłowami przymiotnikowymi pisz łącznie („niezauważony”, „nieskończony”).

## Zakres gry

Kolejność i treść scen bierz z `story.md`. Poniżej jest podział na **etapy z rozgrywką** i **plansze**, czyli scenki fabularne z modeli 3D (sekcja „Scenki fabularne”).

### Wspólne
- Menu główne: Start, Jak grać, Autorzy (lista modeli, dźwięków i licencji z `CREDITS.md`).
- Intro: 6 plansz z `story.md` → wybór 1 (TAK / NIE).
- Po każdym zakończeniu: tekst końcowy z `story.md` → przycisk „Menu” lub „Zagraj jeszcze raz”.
- Zapisywanie postępu nie jest potrzebne.

### Zakończenie 1 (TAK) — priorytet, najbliższe książce
1. **Etap 3D: droga do obozu (Bilbo), nocą**, w tej kolejności:
   - **zejście z muru po linie:** rytm klawisza; za szybko = Bilbo się ześlizguje i zaczyna od nowa,
   - **przeprawa przez rzekę po kamieniach:** skoki; wpadnięcie do wody = powrót na brzeg,
   - **skradanie** z demo,
   - **kichnięcie** przy elfich strażnikach jako scenka, a nie przegrana.
2. Plansze: przekazanie Arcyklejnotu Bardowi → negocjacje, Thorin pyta o Arcyklejnot, Bilbo się przyznaje, Thorin go szarpie (bez Gandalfa) → atak goblinów na wargach → kamień trafia Bilba → „Grasz teraz jako Bard”.
3. **Etap 3D: Bard z łukiem.** Celowanie przez ramię (prawy przycisk myszy przybliża), strzał lewym, strzała leci łukiem pod wpływem grawitacji. Gobliny na wargach nadbiegają. Trzeba pokonać 5 wrogów. Bard nie może zginąć.
4. Plansze: goblin strzela do Thorina (pokaż wyraźnie, że strzela goblin, a nie Bard) → Bard: „Nieeeeee, Thoriiin…” → ściemnienie → Bilbo budzi się → umierający Thorin w łóżku przeprasza i mówi, że nie uważa go za zdrajcę → tekst końcowy 1.

### Zakończenie 2 (NIE → TAK)
1. Plansze: negocjacje bez Arcyklejnotu → wybór 2 (TAK) → zgoda.
2. **Etap 3D: Bard z łukiem**, jak w Z1. Krasnoludy (Thorin i 12 towarzyszy, bez Dáina) stoją z boku i nie walczą. Mają być widoczne w scenie.
3. Plansze: straty ludzi i elfów → pada Król Leśnych Elfów → napis i tekst końcowy 2.

### Zakończenie 3 (NIE → NIE)
1. Plansze: wybór 2 (NIE) → przybywa Dáin z armią z Żelaznych Wzgórz.
2. **Etap 3D: Thorin z mieczem.** Walka wręcz: atak lewym przyciskiem, prosty zasięg i kąt trafienia. Trzeba **pokonać** 5 ludzi lub elfów: przeciwnicy padają ogłuszeni lub rozbrojeni, bez krwi, bo gra jest dla szkoły podstawowej. Thorin nie może zginąć.
3. Plansza: nadciągają gobliny i wargi.
4. **Etap 3D: Bilbo się chowa.** Założyć pierścień (E) i dojść za wskazany kamień. Bez możliwości przegranej.
5. Plansze: przegrana krasnoludów, Thorin trafiony strzałą goblina i umiera → Bilbo wychodzi zza kamienia, zdejmuje pierścień, odchodzi → tekst końcowy 3.

## Scenki fabularne („plansze” w `story.md`)

**Wersja docelowa: scenki z modeli 3D.** Każda plansza z `story.md` to krótka scenka w silniku gry:
- postacie z tych samych modeli co w etapach, ustawione w scenie i odtwarzające dostępne animacje (spoczynek, chód, cios, „trafienie”, śmierć),
- powolny ruch kamery (przejazd, zbliżenie), nocne światło jak w grze,
- pasek narracji lub dialogu z imieniem postaci; klik lub spacja = dalej; przejścia przez ściemnienie,
- każda scenka ma stały identyfikator (np. `intro-1`, `z1-negocjacje`, `z1-thorin-lozko`), ten sam, który występuje w `docs/prompty-ilustracji.md`.

**Dopuszczalne uproszczenia** tam, gdzie brakuje animacji: Thorin w łóżku = model w pozie z końca animacji śmierci, leżący na prostym łóżku z brył w namiocie. Szarpanie = dwie postacie zwrócone do siebie z animacjami ciosu i „trafienia”. Scenki intro mogą korzystać z krajobrazów z gry (Samotna Góra, obóz, mur) zamiast osobnych lokacji. Spalone Miasto na Jeziorze możesz zrobić z prostych brył z ogniem i dymem. Gdy scenka wychodzi sztywno, wybierz prostsze ujęcie (np. z daleka, sylwetki pod światło) zamiast komplikować animację.

**Możliwa późniejsza podmiana na ilustracje.** Jeśli użytkownik będzie miał czas i dostęp do generatora obrazów, zastąpi wybrane scenki obrazkami. Przygotuj to od razu:
- Utwórz `docs/prompty-ilustracji.md`: dla każdej scenki identyfikator, nazwę pliku (`assets/plansze/<id>.jpg`, 16:9), opis sceny po polsku i prompt po angielsku. Wszystkie prompty mają jeden wspólny opis stylu (nocna, malarska ilustracja zgodna z klimatem gry). Stałe cechy bohaterów opisz w jednym miejscu i powtarzaj w każdym prompcie, żeby postacie wyglądały zawsze tak samo.
- Mechanizm w grze: dla każdej scenki spróbuj wczytać `assets/plansze/<id>.jpg` przez element `<img>` (działa także z `file://`). Gdy obrazek jest, pokaż go z tym samym paskiem dialogu. Gdy go brakuje (zdarzenie `onerror`), odtwórz scenkę 3D. Podmiana ma polegać wyłącznie na wrzuceniu pliku do katalogu, bez zmian w kodzie.
- W README opisz, jak podmienić scenkę na ilustrację.

## Postacie i obiekty 3D do pozyskania

- **Potrzebne:** Bard (człowiek-łucznik), Thorin i krasnoludy (także armia Dáina), wojownicy-ludzie, elfy (użyj `elf-guard` w innych kolorach), gobliny, wargi (wilk), Król Leśnych Elfów (elf z koroną).
- **Licencja:** tylko CC0. Preferuj Quaterniusa z poly.pizza: bezpośredni link `https://static.poly.pizza/<uuid>.glb` jest w kodzie HTML strony modelu. Licencję sprawdź na stronie każdego modelu i zapisz w `CREDITS.md` (nazwa, autor, link, licencja). Znane trafienia: Goblin `https://poly.pizza/m/OdCOFSmEhl`, Orc `https://poly.pizza/m/5vO2YJsPEf`, paczka Ultimate Monsters. Wilka szukaj w paczkach zwierząt Quaterniusa.
- **Krasnoludy** możesz przerobić z modeli ludzi tak jak Bilba: wzrost ok. 1,35 m, skala X/Z × 1,3, broda jako prosty obiekt przypięty do kości głowy, jeśli model nie ma brody.
- **Żądło** (sztylet Bilba), **łuk Barda** i **strzały** zrób z prostych brył, jeśli nie znajdziesz modeli. Przypnij je do kości dłoni.
- **Pułapki techniczne znane z demo:**
  - GLTFLoader usuwa kropki z nazw kości: `Wrist.L` → `WristL`.
  - Skalę modeli Quaterniusa licz z kości `Head_end`, bo `Box3` dla siatek ze szkieletem daje błędny wynik.
  - Kilka postaci z jednego modelu klonuj przez `SkeletonUtils.clone`.
  - Osie kości są różne w różnych modelach, więc nie obracaj kości „na oko”. Przy pochylaniu postaci użytkownik i tak odrzucił efekt.
  - Animacje tych paczek nie zmieniają skali kości, więc skalowanie kości po `mixer.update` jest bezpieczne.

## Sposób pracy

1. Katalog jest już repozytorium git (gałąź `master`). Rób commit po każdym ukończonym etapie.
2. Kolejność: rdzeń (menu, silnik plansz, przejścia, ładowanie modeli, wspólny HUD) → **całe zakończenie 1** → zakończenie 2 → zakończenie 3 → szlify → dźwięki (CC0, opcjonalnie).
3. Szczegóły mechanik, których nie opisuje `story.md`, ustal sam rozsądnie. Zapisz je w `docs/decyzje.md`.
4. Gdy trafisz na decyzję, którą musi podjąć użytkownik (fabuła, teksty, odstępstwa od lektury), zapisz pytanie w `docs/pytania.md`, przyjmij rozsądne założenie i pracuj dalej. Nie zmieniaj fabuły bez pytania.
5. Każde nowe odstępstwo od lektury dopisz do tabeli w `story.md`.

## Weryfikacja — kiedy gra jest gotowa

- Wszystkie 3 ścieżki da się przejść od menu do tekstu końcowego. Sprawdź to automatycznie w Playwright. Pointer lock nie działa w automatyzacji, więc dodaj haki testowe (jak `window.G` w demo): start bez kliknięcia, teleport, wymuszenie wyboru, pominięcie etapu.
- Konsola przeglądarki nie pokazuje błędów na żadnej ścieżce.
- Zrób zrzut ekranu każdego etapu i każdej scenki do `docs/screens/` **i obejrzyj je**. Sprawdź zwłaszcza, czy bohater jest czytelny nocą przy skale, czy scena nie jest za jasna i czy scenki 3D czytelnie pokazują, co się dzieje.
- Podmiana działa: wrzucenie dowolnego obrazka jako `assets/plansze/<id>.jpg` zastępuje tę jedną scenkę 3D.
- `dist/index.html` działa po dwukliku (`file://`) w Chrome i Safari.
- Płynność: ok. 50 kl./s lub więcej na zwykłym laptopie. Ogranicz liczbę świateł z cieniami.
- `README.md` po polsku: jak uruchomić, sterowanie, opis trzech zakończeń, autorzy i licencje.
- Na koniec napisz krótki raport: co zostało zrobione, co pominięto i dlaczego, jakie pytania czekają w `docs/pytania.md`, które scenki 3D wyszły najsłabiej i najbardziej zyskałyby na podmianie na ilustrację.
