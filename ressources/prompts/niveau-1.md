# Niveau 1 — Walk Straight : décor, habitant, boss

Planches générées dans Figma, fichier **« Behind the Mask — niveau 1 »** (https://www.figma.com/design/tXh0Yf6DfhCyZwrOTY5VuF), modèle `gpt-image-2.5-sunburst`, 1536 × 1024.
Elles sont enregistrées dans `ressources/sprites/decor/` et `ressources/sprites/boss/`. Pour les découper :

```sh
.venv/bin/python tools/build_level.py tools/niveaux/01-walk-straight.json
```

La sortie va dans `public/assets/levels/01-walk-straight/`. Les images de contrôle (cases, ancrages) sont dans `_controle/`, à côté de chaque planche.

Le décor de fond reste la rue de la démo (`public/assets/decor/rue.png`), répétée trois fois. Le relief vient des **éléments de décor** posés dessus : on monte sur eux, on les casse. On les place avec l'éditeur du jeu (F2 en jeu, en dev).

Mêmes règles que pour les ennemis (`ennemis.md`) :
- fond magenta uni ;
- aucun texte ;
- même échelle dans une planche.

Les boss regardent à **gauche**.

## Éléments de décor (`decor/props-rue.png`, 4 × 3, échelle 0,34)

```
Pixel art prop sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style), night city street in the 1980s, dark gritty palette with warm orange street-light highlights.

Strict layout: a uniform grid of 4 columns x 3 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no letters, no numbers, no logos, no signs with writing. Every object is seen strictly from the side (side-scrolling view, flat front face), centered horizontally in its cell, resting on the same baseline near the bottom of the cell, and never crosses the cell borders. All objects share the same pixel scale (a wooden crate is about one fifth of the cell height).

Row 1: (1) a single wooden shipping crate with metal corners; (2) the same crate smashed into planks and splinters lying on the ground; (3) a stack of two wooden crates; (4) a rusty red oil drum.
Row 2: (5) a wide metal fire-escape balcony platform seen from the side: a flat steel grating floor with a thin railing, held by two diagonal brackets, floating (no wall behind it); (6) a wide striped red and white shop awning seen from the side, slanted, floating; (7) a short concrete stoop: three wide steps going up to the right; (8) a construction scaffolding segment: two levels of wooden planks on steel pipes.
Row 3: (9) a metal garage roller door fully closed, grey corrugated steel in a brick frame; (10) the same garage door half open, dark interior below; (11) the same garage door fully open, a dark empty garage interior; (12) a large green metal dumpster with a closed lid.
```

## Habitant branché (`decor/habitant.png`, 6 × 3, échelle 0,29)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style), in the spirit of the bearded prisoners you free in Metal Slug. ONE character only: a hypnotized city dweller, a skinny office worker with messy hair, rolled-up sleeves white shirt, loose tie, brown trousers, sneakers. On his head he wears a boxy VR screen helmet glowing cold blue, with thick black cables going up out of the frame from the top of the helmet. Plain clothes: no text, no logo.

Strict layout: a uniform grid of 6 columns x 3 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no letters, no numbers, no logos. The character always faces LEFT, is drawn at the same scale in every frame (about 55% of the cell height when standing), and his feet (or his seat) rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — frames 1-4 PLUGGED: sitting cross-legged on the ground with the glowing helmet and cables, swaying slowly, hypnotized, hands on his knees (a seamless loop of 4 frames); frames 5-6 FREED: the cables snap and the helmet pops off his head and falls, he jumps up surprised, wide eyes.
Row 2 — frames 7-8 THANKS: standing, bowing and saluting gratefully; frames 9-11 GIFT: he pulls a small grey metal supply box out of his back pocket and holds it out with both hands, then drops it in front of him; frame 12: standing, waving goodbye.
Row 3 — frames 13-18 RUN AWAY: running to the left in panic, arms flailing, clearly alternating legs in every frame, helmet gone.
```

## Boss : The Manager, coque (`boss/manager-coque.png`, 2 × 2, échelle 0,5)

```
Pixel art boss sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style), detailed and chunky like the Metal Slug flying fortress bosses, dark night palette with cold office-neon lights.

The boss is a FLYING OPEN-SPACE OFFICE: a huge hovering block of a corporate office building, two floors of blue-lit glass office windows with tiny desks and monitors inside, grey concrete and steel frame, a flat roof with air-conditioning units and antennas, heavy jet thrusters and exhaust nozzles underneath, armored plates riveted on the sides. At the front-left corner, a large rounded glass cockpit bay window, dark and EMPTY inside (the pilot is drawn separately). The building faces LEFT (the front and cockpit are on the left side). No weapons attached (they are drawn separately), no people.

Strict layout: a uniform grid of 2 columns x 2 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no ground, no cast shadow, no text, no letters, no numbers, no logos, no company name. The flying office is the same size and position in cells 1, 2 and 3, filling about 85% of the cell width, never crossing the cell borders.

Cell 1: the flying office intact, clean, lights on.
Cell 2: the same flying office damaged: cracked and shattered windows, bullet holes, dents, a few flickering lights, small fires and smoke puffs coming out.
Cell 3: the same flying office wrecked: blackened and burnt, windows blown out, plates torn off, bent frame, sparks, about to crash.
Cell 4: four separate pieces of debris for an explosion, side by side: a twisted metal plate, a broken office chair, a cracked computer monitor, a chunk of concrete with rebar.
```

La coque remplit presque toute la largeur de ses cases : dans `tools/niveaux/01-walk-straight.json`, la planche a `"trait": 0.985`. Sans ce réglage, des lignes de la coque seraient prises pour des traits de grille.

## Boss : The Manager, pièces (`boss/manager-pieces.png`, 4 × 4)

```
Pixel art boss parts sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style), comic caricature, dark night palette with cold office-neon lights. Everything faces LEFT.

The pilot is THE MANAGER, a caricature of a ruthless corporate boss: slicked-back dark brown hair, square jaw, smug grin, small rectangular glasses with light blue lenses, charcoal grey suit, white shirt, bright red tie. Plain clothes: no badge, no logo, no text.

Strict layout: a uniform grid of 4 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no letters, no numbers, no logos. Each element is centered in its cell, at the same scale across cells of the same row, and never crosses the cell borders.

Row 1 — the Manager seen from the waist up, sitting behind a small black executive desk with a phone (only the desk top edge is visible at the bottom), facing left: (1) idle, arms crossed, smug; (2) idle, adjusting his tie; (3) shouting orders into a red telephone handset, pointing forward; (4) hurt: recoiling, glasses askew, comic shocked face.
Row 2: (5) rage: red face, veins, fists on the desk, steam from his ears, waist up behind the desk; (6) the Manager ejected, flying through the air full body, flailing, clutching a black briefcase; (7) the same, tumbling upside down; (8) the Manager knocked out sitting on the ground, dizzy with stars, briefcase open and papers around.
Row 3 — a heavy water cannon turret mounted under a floor, nozzle pointing left: (9) idle; (10) firing a thick water jet burst at the nozzle; (11) destroyed, bent and sparking. (12) a giant chrome megaphone on a swivel mount, pointing left, idle.
Row 4: (13) the same megaphone blasting, vibrating, with shock rings at its mouth; (14) the megaphone destroyed, crumpled and smoking; (15) a big office printer hatch built into a metal wall, closed; (16) the same printer hatch open, spitting out a stream of white paper sheets to the left.
```

Le placement des pièces sous la coque, leurs PV et leurs zones de tir sont dans `src/config/bosses.js`.
