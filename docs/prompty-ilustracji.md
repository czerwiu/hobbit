# Prompty do ilustracji scenek

Każdą scenkę 3D można zastąpić ilustracją. Wystarczy zapisać obrazek jako `assets/plansze/<id>.jpg` (proporcje 16:9, np. 1920×1080) i zbudować grę (`npm run build`). Build kopiuje ilustracje do `dist/assets/plansze/` i zapisuje ich listę. Gra pokazuje ilustrację z tym samym paskiem narracji i dialogów. Gdy pliku nie ma, gra odtwarza scenkę 3D.

## Wspólny styl (dopisz na końcu każdego promptu)

> **STYLE:** painterly digital illustration, storybook fantasy, night scene under a full moon, deep blue and violet sky with stars, light mist, warm orange light from campfires, torches and lanterns as the main light sources, soft rim light on characters, low-poly inspired simple shapes, readable silhouettes, cinematic 16:9 composition, no text, no blood, suitable for children aged 10–14.

## Stałe cechy postaci (powtarzaj w każdym prompcie, w którym postać występuje)

| Postać | Opis po angielsku |
|---|---|
| **Bilbo** | Bilbo, a small hobbit (half the height of a man), stocky, curly brown hair, round friendly face, red waistcoat over a cream shirt, brown knee-length trousers, big bare hairy feet, no shoes |
| **Thorin** | Thorin, a dwarf king, short and broad, long dark brown beard, small gold crown, royal blue tunic with silver armour plates, carries a steel sword |
| **Krasnoludy** | dwarves, short and broad, long beards (white, grey, brown, red, blond), travel clothes in colourful hoods (dark green, scarlet, blue, purple, grey, brown, white, yellow, pale green), backpacks |
| **Dáin** | Dáin, a dwarf lord, short and broad, bushy red-orange beard, gold crown, dark red tunic with steel armour |
| **Bard** | Bard the Bowman, a tall grim man with black hair and a short black beard, dark blue-grey tunic and leather trousers, holds a long wooden bow |
| **Król Leśnych Elfów** | the Elvenking, a tall elf king with long white-silver hair, a gold crown, a green and silver robe with silver armour |
| **Elfy** | wood-elves, tall and slim, hooded green and brown cloaks, swords; guards carry glowing lanterns |
| **Ludzie** | men of Lake-town, simple brown, grey and dark-blue tunics, swords |
| **Gobliny** | goblins, short hunched green creatures with big mouths and spiky black hair, ragged loincloths, clubs or crude bows |
| **Wargi** | wargs, huge dark grey wolves with glowing red eyes, ridden by goblins |
| **Arcyklejnot** | the Arkenstone, a white gem that shines with its own cold blue-white light |

## Scenki

### intro-1 — `assets/plansze/intro-1.jpg`
**Opis:** Wieczór przed norą Bilba. Okrągłe zielone drzwi w zboczu wzgórza, ciepłe światło w okrągłych oknach. Bilbo stoi w drzwiach, a ścieżką podchodzi trzynaście krasnoludów z Thorinem na czele.
**Prompt:** A cosy hobbit hole dug into a grassy hill at night, round green door with a brass knob, round windows glowing warm yellow. Bilbo stands at the door, surprised. Up the garden path walk thirteen dwarves led by Thorin. *(+ cechy: Bilbo, Thorin, krasnoludy + STYLE)*

### intro-2 — `assets/plansze/intro-2.jpg`
**Opis:** Bilbo i krasnoludy na wzgórzu patrzą z daleka na Samotną Górę. Nad szczytem krąży smok.
**Prompt:** Seen from behind, Bilbo and thirteen dwarves stand on a hill and look at the Lonely Mountain far away, a huge lone peak with snow on top and a faint orange glow at its gate. A dark dragon silhouette circles the peak against the moonlit sky. *(+ cechy: Bilbo, krasnoludy + STYLE)*

### intro-3 — `assets/plansze/intro-3.jpg`
**Opis:** Spalone Miasto na Jeziorze. Domy na palach dopalają się, dym unosi się nad wodą. Na pomoście stoi Bard z łukiem. W wodzie leży martwy smok.
**Prompt:** The burned ruins of Lake-town, wooden houses on stilts above a dark lake, charred walls, small fires and smoke reflected in the water. On a wooden pier stands Bard with his bow, looking at the ruins, with a few sad townspeople behind him. The body of a dead dragon lies half-sunk in the lake. The Lonely Mountain rises in the distance. *(+ cechy: Bard, ludzie + STYLE)*

### intro-4 — `assets/plansze/intro-4.jpg`
**Opis:** Wnętrze Góry: sala z kolumnami i góry złota. Na pierwszym planie Bilbo ukrywa świecący Arcyklejnot. W głębi Thorin na stosie złota.
**Prompt:** Inside the dwarf mountain hall with huge stone pillars, mountains of gold coins glittering in warm torchlight. In the foreground Bilbo secretly hides a glowing white gem in his hand. In the background Thorin stands on top of the gold, looking around greedily. *(+ cechy: Bilbo, Thorin, Arcyklejnot + STYLE, warm golden interior light instead of moonlight)*

### intro-5 — `assets/plansze/intro-5.jpg`
**Opis:** Przed zamkniętą bramą Góry stoi obóz ludzi i elfów z namiotami i ogniskami. Na murze nad bramą stoi Thorin.
**Prompt:** A massive stone wall closes the gate of the Lonely Mountain. Below, a camp of men and elves with tents, banners and campfires. Bard and the Elvenking stand in front of their warriors and look up. On top of the wall Thorin stands with a few dwarves, refusing to talk. *(+ cechy: Bard, Król Leśnych Elfów, ludzie, elfy, Thorin + STYLE)*

### intro-6 — `assets/plansze/intro-6.jpg`
**Opis:** Noc. Bilbo stoi na murze i patrzy na ogniska obozu w dole. W dłoni trzyma świecący Arcyklejnot. Za nim Thorin chodzi niespokojnie.
**Prompt:** Night on top of the mountain wall. Seen from behind, Bilbo looks down at the many campfires of the camp below, holding a softly glowing white gem. Behind him Thorin paces restlessly. *(+ cechy: Bilbo, Thorin, Arcyklejnot + STYLE)*

### z1-przekazanie — `assets/plansze/z1-przekazanie.jpg`
**Opis:** W obozie przy ognisku Bilbo podaje Arcyklejnot Bardowi. Obok stoi Król Leśnych Elfów, za Bilbem dwaj elfi strażnicy z latarniami.
**Prompt:** In the camp by a campfire, Bilbo hands the glowing Arkenstone to Bard. The Elvenking stands beside Bard, surprised and grateful. Two elf guards with lanterns stand behind Bilbo. Tents and banners in the background. *(+ cechy: Bilbo, Bard, Król Leśnych Elfów, elfy, Arcyklejnot + STYLE)*

### z1-negocjacje — `assets/plansze/z1-negocjacje.jpg`
**Opis:** Pod bramą Góry Bard podnosi Arcyklejnot. Thorin w gniewie szarpie Bilba za kamizelkę. Krasnoludy patrzą z gniewem.
**Prompt:** In front of the mountain gate, Bard holds up the glowing Arkenstone. Thorin, furious, grabs Bilbo by his red waistcoat and shakes him. Bilbo looks frightened. Dwarves stand angry behind Thorin; men and elves watch from the other side. *(+ cechy: Bard, Thorin, Bilbo, krasnoludy, Arcyklejnot + STYLE)*

### z1-atak — `assets/plansze/z1-atak.jpg`
**Opis:** Na pole bitwy pędzą gobliny na wargach. Ludzie, elfy i krasnoludy stoją razem, gotowi do walki.
**Prompt:** A wide battlefield in front of the Lonely Mountain. A horde of goblins riding huge wolves charges from the north. Men, elves and dwarves stand together side by side with raised swords, Bard and Thorin in front. *(+ cechy: gobliny, wargi, ludzie, elfy, krasnoludy, Bard, Thorin + STYLE)*

### z1-kamien — `assets/plansze/z1-kamien.jpg`
**Opis:** Bilbo stoi z boku bitwy. Z góry spada kamień i trafia go w głowę.
**Prompt:** Bilbo stands at the edge of the battle near a big rock, watching the fight. A falling stone is about to hit him on the head. Cartoonish, not violent. *(+ cechy: Bilbo + STYLE)*

### z1-goblin-strzela — `assets/plansze/z1-goblin-strzela.jpg`
**Opis:** Zbliżenie: goblin na skale napina łuk i celuje. W tle Thorin walczy z goblinem.
**Prompt:** Close-up of a goblin archer standing on a rock, drawing a crude bow and aiming. In the background Thorin fights another goblin with his sword and does not see the archer. *(+ cechy: gobliny, Thorin + STYLE)*

### z1-bard-krzyk — `assets/plansze/z1-bard-krzyk.jpg`
**Opis:** Bard biegnie do Thorina, który leży na ziemi trafiony strzałą goblina. Bard krzyczy.
**Prompt:** Bard runs towards Thorin, who lies on the ground hit by a goblin arrow. Bard shouts in despair with his hand stretched out. No blood. *(+ cechy: Bard, Thorin + STYLE)*

### z1-thorin-lozko — `assets/plansze/z1-thorin-lozko.jpg`
**Opis:** Namiot oświetlony świecą. Thorin leży w łóżku, umiera. Bilbo stoi przy łóżku. Thorin przeprasza Bilba.
**Prompt:** Inside a tent lit by a single candle. Thorin lies in a simple wooden bed under a blanket, weak and dying, and looks kindly at Bilbo. Bilbo stands at the bedside, sad, with a bandage on his head. Gentle, emotional, no blood. *(+ cechy: Thorin, Bilbo + STYLE, warm candle light instead of moonlight)*

### z23-negocjacje — `assets/plansze/z23-negocjacje.jpg`
**Opis:** Pod bramą Góry Bard i Król Leśnych Elfów żądają części skarbu. Thorin odmawia. Bilbo stoi obok krasnoludów i myśli.
**Prompt:** In front of the mountain gate, Bard and the Elvenking talk to Thorin, who refuses with a stern face and crossed arms. Dwarves behind Thorin, men and elves behind Bard. Bilbo stands between the groups, thinking hard. *(+ cechy: Bard, Król Leśnych Elfów, Thorin, krasnoludy, Bilbo + STYLE)*

### z2-zgoda — `assets/plansze/z2-zgoda.jpg`
**Opis:** Bilbo wychodzi przed krasnoludy i oddaje swoją część skarbu. Bard dziękuje. Thorin niechętnie się zgadza.
**Prompt:** Bilbo steps forward between the dwarves and the men and offers a small chest of gold coins. Bard bows in thanks, the Elvenking nods. Thorin agrees reluctantly. *(+ cechy: Bilbo, Bard, Król Leśnych Elfów, Thorin + STYLE)*

### z2-atak — `assets/plansze/z2-atak.jpg`
**Opis:** Gobliny na wargach atakują. Ludzie i elfy walczą. Krasnoludy stoją z boku na wzgórzu i tylko patrzą.
**Prompt:** Goblins riding wolves charge across the battlefield. Men and elves fight bravely. On a hill to the side, Thorin and twelve dwarves just stand and watch with crossed arms, not helping. *(+ cechy: gobliny, wargi, ludzie, elfy, Thorin, krasnoludy + STYLE)*

### z2-straty — `assets/plansze/z2-straty.jpg`
**Opis:** Pole bitwy po walce, dym. Leży wielu ludzi i elfów. Z boku stoją krasnoludy.
**Prompt:** The battlefield after the fight, smoke rising. Many fallen men and elves lie on the ground (no blood, peaceful poses). A few tired survivors stand with heads down. The dwarves still stand on the hill to the side. Sad, quiet mood. *(+ cechy: ludzie, elfy, krasnoludy + STYLE)*

### z2-krol — `assets/plansze/z2-krol.jpg`
**Opis:** Goblin na skale strzela z łuku do Króla Leśnych Elfów, który walczy w pierwszym szeregu.
**Prompt:** A goblin archer on a rock shoots an arrow at the Elvenking, who fights in the front line with his sword. Same composition as the shot at Thorin. No blood. *(+ cechy: gobliny, Król Leśnych Elfów + STYLE)*

### z3-dain — `assets/plansze/z3-dain.jpg`
**Opis:** Ze wschodu nadciąga armia krasnoludów z Żelaznych Wzgórz. Na czele Dáin. Thorin wita go przed bramą.
**Prompt:** An army of dwarves in steel armour marches from the east in tight rows, led by Dáin. Thorin and his dwarves greet them in front of the mountain gate. Men and elves watch from their camp. *(+ cechy: Dáin, Thorin, krasnoludy + STYLE)*

### z3-gobliny — `assets/plansze/z3-gobliny.jpg`
**Opis:** Po bitwie z ludźmi i elfami zostało niewielu krasnoludów. Z północy nadciągają gobliny na wargach.
**Prompt:** After a hard battle only a few tired dwarves still stand around Thorin and Dáin; many lie on the ground. From the north a new horde of goblins on wolves charges at them. *(+ cechy: Thorin, Dáin, krasnoludy, gobliny, wargi + STYLE)*

### z3-przegrana — `assets/plansze/z3-przegrana.jpg`
**Opis:** Gobliny i wargi stoją na polu bitwy. Leżą pokonane krasnoludy. Dym.
**Prompt:** Goblins and wolves stand over the battlefield; defeated dwarves lie on the ground (no blood). Smoke and dying fires. Dark, sad mood. *(+ cechy: gobliny, wargi, krasnoludy + STYLE)*

### z3-thorin — `assets/plansze/z3-thorin.jpg`
**Opis:** Thorin walczy jako ostatni. Goblin na skale strzela do niego z łuku.
**Prompt:** Thorin fights alone as the last dwarf standing. A goblin archer on a rock shoots an arrow at him. Same composition as the scene z1-goblin-strzela. No blood. *(+ cechy: Thorin, gobliny + STYLE)*

### z3-odejscie — `assets/plansze/z3-odejscie.jpg`
**Opis:** Bilbo wychodzi zza kamienia. Zdejmuje pierścień i samotnie odchodzi w dal przez puste pole bitwy.
**Prompt:** Seen from far away, Bilbo walks alone and sad across the empty battlefield towards the horizon, holding a small gold ring in his hand. Behind him a big rock and the dark Lonely Mountain. Melancholic, quiet. *(+ cechy: Bilbo + STYLE)*
