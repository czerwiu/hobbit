# Pytania do autora

Przy każdym pytaniu jest założenie, które przyjąłem, żeby pracować dalej.

1. **Dialogi w scenkach.** `story.md` opisuje, co się dzieje, ale nie podaje kwestii postaci (poza okrzykiem Barda). Dopisałem krótkie kwestie (np. Bilbo przy przekazaniu Arcyklejnotu, Thorin w łóżku). Ostatnie słowa Thorina są oparte na książce („Gdyby więcej z nas ceniło dobre jedzenie, śmiech i pieśni bardziej niż złoto…”).
   *Założenie:* kwestie zostają. Wszystkie są w `src/scenes.js`, w tablicy `SCENES` — łatwo je zmienić.

2. **Śmierć Króla Leśnych Elfów (Z2).** `story.md` mówi „ujęcie jak przy Thorinie w zakończeniu 1”. Zrozumiałem to tak, że Króla też trafia strzała goblina-łucznika.
   *Założenie:* tak jak przy Thorinie — goblin na skale strzela, Król pada.

3. **Pora dnia w scenach negocjacji i bitwy.** W książce rozmowy i bitwa odbywają się za dnia. Prompt wymaga stylu nocnego w całej grze.
   *Założenie:* wszystko dzieje się nocą (przy ogniskach i pochodniach).

4. **Gdzie stoi Thorin podczas negocjacji.** W książce Thorin rozmawia z muru nad bramą. W grze krasnoludy wychodzą przed bramę, bo wtedy szarpanie Bilba jest czytelne.
   *Założenie:* negocjacje przed bramą. Dopisałem to do tabeli odstępstw w `story.md`.

5. **Tytuły zakończeń.** Ekran końcowy pokazuje „Zakończenie 1”, „Zakończenie 2”, „Zakończenie 3”.
   *Założenie:* neutralne numery. Można dodać tytuły, np. „Uczciwość”, „Hojność”, „Chciwość”.

6. **Katar na linie i w rzece.** `story.md` mówi, że pasek kataru rośnie „przez całą drogę”. W grze rośnie dopiero od skradania (szczegóły w `docs/decyzje.md`).
   *Założenie:* katar tylko w części ze skradaniem.

7. **Podmiana ilustracji wymaga `npm run build`.** Przy `file://` nie da się sprawdzić, czy plik istnieje, bez błędu w konsoli. Wybrałem czystą konsolę: build tworzy listę ilustracji.
   *Założenie:* wrzucasz obrazek do `assets/plansze/` i uruchamiasz `npm run build`. Jeśli wolisz „samo wrzucenie pliku” kosztem błędów w konsoli, przywrócenie sondowania to kilka linii w `src/scenes.js`.
