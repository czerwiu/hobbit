# Hobbit: Bitwa Pięciu Armii — scenariusz gry

## Założenia

- **Bohater startowy:** hobbit Bilbo.
- **Oś gry:** Bitwa Pięciu Armii.
- **Liczba zakończeń:** 3. Zależą od dwóch wyborów Bilba.

## Początek gry

**Intro:** krótkie wprowadzenie o Bilbie i Arcyklejnocie. Po intro gracz podejmuje pierwszy wybór.

*Jedna plansza = jeden akapit:*

1. Bilbo Baggins to hobbit, który lubi spokój, wygodny fotel i drugie śniadanie. Pewnego dnia wyrusza jednak w wielką podróż z trzynastoma krasnoludami. Ich przywódcą jest Thorin Dębowa Tarcza.
2. Krasnoludy chcą odzyskać swój dom — Samotną Górę i ogromny skarb, który zabrał im smok Smaug.
3. Smaug nie żyje. Zabił go łucznik Bard z Miasta na Jeziorze. Rozgniewany smok przed śmiercią spalił całe miasto.
4. Najcenniejszym klejnotem skarbu jest Arcyklejnot — Serce Góry. Thorin pragnie go bardziej niż całego złota. Nie wie, że Bilbo znalazł kamień i ukrył go.
5. Pod Górę przychodzą ludzie Barda i elfy z Mrocznej Puszczy. Ludzie chcą części skarbu, aby odbudować spalone miasto. Thorin odmawia i zamyka się w Górze.
6. Bilbo widzi, że chciwość zmienia Thorina. Wojna jest coraz bliżej. Bilbo ma w kieszeni Arcyklejnot…

**Pytanie wyboru:** „Czy Bilbo odda Arcyklejnot ludziom i elfom, aby mieli kartę przetargową w rozmowach z Thorinem?” → TAK / NIE

## Drzewo decyzji

```
Czy Bilbo oddaje Arcyklejnot elfom i ludziom?
├── TAK → Zakończenie 1
└── NIE → negocjacje bez Arcyklejnotu
          Czy Bilbo oddaje swoją część skarbu na odbudowę miasta?
          ├── TAK → Zakończenie 2
          └── NIE → Zakończenie 3
```

---

## Zakończenie 1 — TAK (Bilbo oddaje Arcyklejnot)

1. **Wybór:** Bilbo oddaje Arcyklejnot elfom i ludziom, aby mieli kartę przetargową w negocjacjach z krasnoludami.
2. **Droga do obozu ludzi i elfów (nocą, sterowanie WASD):**
   - **Zejście z muru po linie:** gracz trzyma klawisz w rytmie. Za szybko = Bilbo się ześlizguje i zaczyna od nowa.
   - **Przeprawa przez rzekę:** skoki po kamieniach. Pomyłka = Bilbo wpada do wody i wraca na brzeg.
   - **Skradanie z pierścieniem:** niewidzialność wyczerpuje się i ładuje w cieniu skał. Gracz omija pola widzenia strażników. Gdy strażnik zobaczy Bilba, gracz wraca na początek etapu.
   - **Kichnięcie:** pasek kataru rośnie przez całą drogę i wpływa na grę. Postój w cieniu skał obniża pasek. Gdy pasek się zapełni, zanim Bilbo dojdzie do obozu, Bilbo kicha, strażnicy go wykrywają i gracz wraca na początek etapu. Na końcu drogi Bilbo kicha przy elfich strażnikach, zostaje złapany i prosi, żeby zaprowadzili go do Barda.
3. **Przekazanie:** Bilbo oddaje kamień Bardowi. Ludzie i elfy dziękują.
4. **Scenka negocjacji:** ludzie żądają części skarbu na odbudowę miasta. Thorin pyta, skąd mają Arcyklejnot. Bilbo się przyznaje. Thorin szarpie Bilba.
5. **Atak:** pojawiają się gobliny na wargach. Ludzie, elfy i krasnoludy walczą razem z goblinami i wargami.
6. **Bilbo wyłączony z walki:** spadający kamień trafia go w głowę.
7. **Zmiana postaci:** gra informuje, że Bilbo nie może walczyć i gracz przejmuje Barda z łukiem.
8. **Walka (Bard, celowanie i strzał):** Bard nie może zginąć. Gracz musi zabić 5 wrogów, aby iść dalej.
9. **Scenka:** goblin strzela do Thorina (zbliżenie na łucznika), strzała trafia Thorina. Bard krzyczy „Nieeeeee, Thoriiin…”. Ekran gaśnie.
10. **Scenka:** Bilbo budzi się i idzie do umierającego Thorina, który leży w łóżku. Thorin przeprasza i mówi, że nie uważa Bilba za zdrajcę. Umiera.
11. **Tekst końcowy:** „Dzięki uczciwości Bilba bitwa została wygrana. Bilbo może w spokoju wrócić do domu…”

---

## Zakończenie 2 — NIE + TAK (Bilbo oddaje swoją część skarbu)

1. **Scenka negocjacji** ludzi i elfów z krasnoludami, bez Arcyklejnotu.
2. **Wybór:** Bilbo oddaje swoją część skarbu na odbudowę miasta → TAK.
3. **Zgoda** ludzi i elfów z krasnoludami.
4. **Atak goblinów i wargów:** krasnoludy (Thorin i jego 12 towarzyszy, bez Dáina) nie mają motywacji do walki, są leniwe. Nie walczą, tylko patrzą. Walczą ludzie i elfy.
5. **Zmiana postaci:** Bilbo nie walczy, dlatego gracz przejmuje Barda z łukiem.
6. **Walka (Bard, celowanie i strzał):** Bard nie może zginąć. Gracz musi zabić 5 goblinów.
7. **Scenki strat:** ginie bardzo dużo ludzi i elfów, w tym Król Leśnych Elfów (ujęcie jak przy Thorinie w zakończeniu 1). Thorin nie walczy i przeżywa.
8. **Napis:** „Bitwa została wygrana, ale okupiona wielkimi stratami po stronie ludzi i elfów”.
9. **Tekst końcowy:** „Dzięki hojności Bilba bitwa została wygrana. Niestety brak woli walki krasnoludów doprowadził do śmierci bardzo wielu ludzi i elfów…”

---

## Zakończenie 3 — NIE + NIE (Bilbo nie oddaje części skarbu)

1. **Scenka negocjacji** ludzi i elfów z krasnoludami, bez Arcyklejnotu.
2. **Wybór:** Bilbo nie oddaje swojej części skarbu → NIE.
3. **Przybywa Dáin z armią krasnoludów** z Żelaznych Wzgórz i dołącza do Thorina.
4. **Bitwa:** krasnoludy przeciw ludziom i elfom.
5. **Walka (Thorin, miecz):** gracz musi pokonać 5 ludzi lub elfów. Thorin przeżywa. Ginie bardzo dużo krasnoludów, ale wygrywają.
6. **Atak goblinów i wargów** na osłabione krasnoludy.
7. **Zadanie (Bilbo):** gracz zakłada pierścień i chowa się za kamieniem. Bez możliwości przegranej.
8. **Scenki przegranej:** giną wszystkie krasnoludy. Thorin zostaje trafiony strzałą goblina (ta sama scena co w zakończeniu 1) i umiera.
9. **Scenka końcowa:** Bilbo wychodzi załamany zza kamienia, zdejmuje pierścień i odchodzi w dal.
10. **Tekst końcowy:** „Przez chciwość i zuchwałość dobro tym razem nie zwyciężyło…”

---

## Świadome odstępstwa od lektury

| Element | W książce |
|---|---|
| Thorin trafiony strzałą goblina | Thorin zostaje śmiertelnie ranny w walce wręcz. |
| Okrzyk Barda po trafieniu Thorina | Bard i Thorin nie byli przyjaciółmi. |
| Brak Gandalfa w scenie negocjacji | Gandalf powstrzymuje Thorina, gdy ten szarpie Bilba. |
| Bard walczy łukiem | Łuk Barda pojawia się przy zabiciu Smauga, a nie w bitwie. |
| Leniwe krasnoludy (zakończenie 2) | Krasnoludy są uparte i chciwe, ale w walce odważne. |
| Negocjacje przed bramą Góry | Thorin rozmawia z ludźmi i elfami z muru nad bramą. |
| Rozmowy i bitwa nocą | Rozmowy i bitwa odbywają się za dnia. |
| Zakończenia 2 i 3 | Alternatywne przebiegi. Książkę odzwierciedla zakończenie 1. |
