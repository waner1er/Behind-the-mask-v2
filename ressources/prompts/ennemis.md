# Les méchants : fiches et prompts des planches

9 ennemis à générer, plus une planche de projectiles. Le CRS existe déjà (`ressources/sources/Planche de sprites pixel art CRS.png`).
Les fiches donnent l'intention de jeu. Les prompts, en anglais, se collent tels quels dans le générateur.

## Mode d'emploi

1. **Format** : toujours 1536 × 1024 (paysage).
   - **Fantassin** : 8 × 4 cases de 192 × 256. C'est la même échelle que les planches de déplacements des héros.
   - **Gros** (le colosse) : 6 × 4 cases de 256 × 256. Il est dessiné plus haut dans sa case.
2. **Références** : joindre la planche CRS. Elle donne l'échelle, le style et la palette sombre. Pour un méchant, joindre aussi une planche déjà acceptée d'un autre méchant.
3. **Enregistrer** sous `ressources/sprites/ennemis/{id}.png`. L'`id` est indiqué dans chaque titre (`skinhead.png`, `hommetv.png`…). Les projectiles vont dans `ressources/sprites/ennemis/projectiles.png`.
4. **Découper** : `python3 tools/build_sprites.py` → `public/assets/sprites/`. Un méchant sans planche est simplement absent de l'atlas. On peut donc les ajouter un par un.
5. **Vérifier** `ressources/sprites/ennemis/_controle/{id}.png` : chaque case, la ligne de sol (jaune), l'ancrage (vert) et le point de départ du projectile (rouge). Lancer `npm run dev` et ouvrir `demo.html` : le méchant apparaît dans l'« Inspecteur des images » et dans la galerie (`index.html`). Un ancrage décalé se corrige dans `tools/sprites-ajustements.json` (`{"skinhead/walk/3": [1, 0]}`).

**Génération via Figma** (fichier « Behind the Mask — sprites des méchants », modèle gpt-image-2.5) : ça marche sans image de référence. Le filtre refuse les mots trop chargés, comme « skinhead » : on décrit la tenue sans nommer le groupe, et on parle de « K.O. » plutôt que de mort.

**Contrôle avant d'accepter une image :**
- le bon nombre de cases et un fond magenta uni ;
- le méchant tourné **à droite** (le jeu le retourne quand il vient de la droite) ;
- la même tenue et la même taille dans toutes les cases ;
- des jambes différentes à chaque image de marche ;
- **aucun texte, logo ni symbole** (le générateur aime écrire sur les vêtements) ;
- aucun projectile détaché du corps : ils sont sur leur propre planche.

**Disposition commune**, lue par `tools/sprites.json` (section `ennemis`) :

| Rangée | Fantassin (8 × 4) | Gros (6 × 4) |
|---|---|---|
| 1 | marche, 8 images | marche, 6 images |
| 2 | 1-4 attente · 5-8 corps à corps | 1-2 attente · 3-6 corps à corps |
| 3 | 1-4 attaque à distance · 5-8 spécial | 1-3 attaque à distance · 4-6 spécial |
| 4 | 1-2 touché · 3-8 mort | 1-2 touché · 3-6 mort |

**Repères de jeu** : le CRS a 40 PV et un médiator en retire 1. Les PV indiqués sont des points de départ pour l'équilibrage.

**DA** : on reste dans le style Metal Slug de la planche CRS. Ce sont des caricatures de BD, lisibles et drôles, avec une silhouette reconnaissable et une couleur dominante par méchant. Aucun symbole politique réel n'est dessiné : le skinhead se reconnaît à sa tenue, pas à des insignes.

---

## 1. Skinhead néo-nazi (`skinhead`) — généré ✓

- **Niveau** : vedette du niveau 2 (la casse), puis partout. Il sort des carcasses et du garage du ferrailleur.
- **Look** : crâne rasé, mâchoire carrée, bombers vert olive, t-shirt blanc, bretelles rouges, jean délavé retroussé, grosses rangers noires à lacets blancs.
- **Attaques** : coup de batte de baseball au contact ; il lance des bouteilles de bière (projectile `bottle`) qui laissent une flaque de feu (`fire`).
- **Spécial** : la charge, tête baissée, en courant.
- **Comportement** : il fonce en groupe. De loin, il lance des bouteilles en cloche ; de près, il frappe.
- **PV** : 30.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic caricature street thug for an 80s arcade game: shaved head, square jaw and a mean frown, an olive green bomber jacket over a white t-shirt, thin red braces, bleached rolled-up jeans and heavy black boots with white laces, holding a wooden baseball bat. Plain clothes: no patches, no insignia, no text anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: swaggering walk cycle, bat resting on his shoulder, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: tapping the bat in his open hand, breathing, seamless loop; frames 5-8 MELEE: big overhead swing with the bat (wind-up, swing, hit low in front of him, recover).
Row 3 — frames 1-4 THROW: he pulls a brown glass bottle from his jacket, winds up and throws it overhand (the bottle is in his hand in frames 1-2, his hand is empty in frames 3-4); frames 5-8 CHARGE: running head down, shoulders forward, bat held low.
Row 4 — frames 1-2 HURT: recoil backwards, comic dizzy face; frames 3-8 KNOCKED OUT: knocked backwards off his feet, falls, bounces, lies flat on his back with the bat beside him, cartoon style. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and boots, exaggerated cartoon poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his bat look exactly the same in every frame: same colours, same size, same details.
```

## 2. Masculiniste (`masculiniste`) — généré ✓

- **Niveau** : vedette du niveau 6 (le chantier). Il sort des bungalows et des conteneurs.
- **Look** : torse en V gonflé, bronzage orange, débardeur blanc moulant, short de sport rouge, chaussettes hautes, baskets blanches. Il porte un micro-casque de coach et une chaîne en or, et se coiffe d'un « man bun » sur une barbe taillée au cordeau.
- **Attaques** : coup de shaker de protéines au contact ; il lance des haltères (`dumbbell`).
- **Spécial** : le cri « MOTIVATION ! » dans son micro-casque, en gonflant les bras. Les ennemis proches frappent plus fort pendant quelques secondes.
- **Comportement** : il avance en se regardant dans un miroir imaginaire, puis lance un cri quand il y a au moins deux alliés à l'écran.
- **PV** : 35.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic caricature villain: a self-proclaimed "alpha male" life coach, puffed-up V-shaped torso, orange fake tan, a man bun and a perfectly trimmed beard, a tight white tank top, red sports shorts, high white socks and white sneakers, a thin gold chain, and a headset microphone like a fitness coach; he holds a protein shaker bottle. No text, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a ridiculous chest-out strut, arms held wide from his body as if too muscular, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: flexing one biceps and admiring it, seamless loop; frames 5-8 MELEE: swinging the protein shaker like a club (wind-up, swing, impact, recover).
Row 3 — frames 1-4 THROW: he lifts a small black dumbbell and hurls it forward (dumbbell in hand in frames 1-2, hand empty in frames 3-4); frames 5-8 SPECIAL "MOTIVATION" SHOUT: double biceps pose, veins popping, shouting into his headset, red face, a small shock wave of sweat around him.
Row 4 — frames 1-2 HURT: recoil backwards, offended pained face; frames 3-8 DEATH: falls backwards, bounces, lies flat on his back, shaker rolling beside him. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and boots, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 3. Homme d'affaires ultralibéral (`affairiste`) — généré ✓

- **Niveau** : vedette du niveau 8 (le quartier d'affaires). Il sort des portes tournantes et des parkings.
- **Look** : costume trois-pièces bleu marine, cravate dorée, cheveux gominés, sourire carnassier, montre en or, attaché-case en cuir brun. Silhouette maigre, tête grosse et satisfaite.
- **Attaques** : coup d'attaché-case au contact ; il lance des liasses de billets tranchants en éventail (`banknote`, 3 à la fois).
- **Spécial** : le parachute doré. Quand il est blessé (moins de 30 % de PV), il ouvre un parachute doré et s'envole hors de l'écran. Pas de points s'il s'échappe.
- **Comportement** : il reste à distance et appelle des vigiles (des CRS teintés en gris) une fois par vague.
- **PV** : 25.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic caricature villain: a greedy ultra-capitalist businessman, skinny body with a big smug head, slicked-back hair, a predatory grin, a navy blue three-piece suit, a shiny gold tie, a gold watch, polished shoes, carrying a brown leather briefcase. No text, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a hurried, arrogant walk, briefcase swinging, nose in the air, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: checking his gold watch impatiently, seamless loop; frames 5-8 MELEE: swinging the briefcase hard (wind-up, swing, impact, recover).
Row 3 — frames 1-4 THROW: he opens the briefcase and flings a fan of banknotes forward with a flick of the wrist (the notes stay in the briefcase and in his hand, nothing flies away); frames 5-8 GOLDEN PARACHUTE ESCAPE: a big golden parachute opens on his back and lifts him off the ground, he waves goodbye with a smug grin, rising higher in each frame but never cropped.
Row 4 — frames 1-2 HURT: recoil backwards, outraged face, tie flying; frames 3-8 DEATH: falls backwards, briefcase bursting open, lies flat on his back. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and shoes, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 4. Homme-TV (`hommetv`) — généré ✓

- **Niveau** : vedette du niveau 4 (le métro), puis 9 et 10. Ce sont les soldats du Docteur Mask, son corps dans la ville. Ils sortent des écrans géants et des portes des rames.
- **Look** : un vieux téléviseur à tube en faux bois, sur de longues jambes et avec de longs bras en câble noir. Il porte des gants blancs de cartoon, a une antenne « oreilles de lapin » sur la tête, et son écran affiche un visage pixelisé méchant.
- **Attaques** : antenne-fouet au contact ; zap électrique à distance, tiré par l'écran (`zap`).
- **Spécial** : la mire hypnotique. L'écran affiche une spirale, et un héros qui la regarde de face est ralenti un instant.
- **Comportement** : il marche par saccades, tire en ligne droite, et se met en mire quand le héros est proche et de face. Une variante « écran plat » plus rapide sera obtenue par teinte et réglages (`data/enemies.js`).
- **PV** : 20 ; l'écran se fissure à mi-vie.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic creature: a TV-man, an old 1980s cathode-ray television set with a wood-grain case as his body, two long thin legs and two long arms made of black cable, white cartoon gloves, black sneakers, and a rabbit-ears antenna on top. The screen is his face: a mean pixelated grin on a greenish glowing screen. No text, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a jerky, glitchy walk on long legs, the TV body bobbing, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: standing, screen flickering between expressions, antenna twitching, seamless loop; frames 5-8 MELEE: he pulls off his antenna and whips it forward (wind-up, whip, impact, recover).
Row 3 — frames 1-4 SHOOT: the screen charges up with bright blue static and fires forward (screen glows brighter in frames 2-3, nothing leaves the screen); frames 5-8 HYPNOSIS: the screen shows a black and white hypnotic spiral that rotates, arms raised like a hypnotist.
Row 4 — frames 1-2 HURT: recoil backwards, screen cracking with static; frames 3-8 DEATH: the screen shatters with sparks, the TV falls backwards, legs twitch, then lies on its back, smoking, screen black. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug style (chunky shapes, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character looks exactly the same in every frame: same colours, same size, same details.
```

## 5. Mutant radioactif (`mutant`) — généré ✓

- **Niveau** : vedette du niveau 5 (égouts et grottes), puis 7. Ce sont les mineurs des terres rares, transformés par les mines du Docteur Mask. Ils sortent des grottes et des plaques d'égout.
- **Look** : peau vert acide pleine de pustules, un œil plus gros que l'autre, salopette de mineur déchirée, casque de chantier avec lampe frontale, pioche. Corps voûté, bras qui traînent.
- **Attaques** : coup de pioche au contact ; il crache une boule toxique (`spit`) qui laisse une flaque (`puddle`).
- **Spécial** : la division. À sa mort, il se coupe en deux petits mutants (même sprite, réduit à 60 %, 5 PV chacun).
- **Comportement** : il marche lentement mais sans s'arrêter, crache dès qu'il est à portée, et vient en grand nombre.
- **PV** : 25.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic 1980s B-movie creature: a radioactive mutant miner, hunched body, acid green skin covered in glowing pustules, one eye bigger than the other, a torn miner's overall, a yellow hard hat with a head lamp, long arms dragging a pickaxe. No text, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a slow, heavy zombie-like shamble, pickaxe dragging behind, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: swaying, drooling, pustules pulsing, seamless loop; frames 5-8 MELEE: overhead pickaxe strike (wind-up, swing, impact low in front, recover).
Row 3 — frames 1-4 SPIT: he inflates his cheeks, leans back and spits forward (the green glob stays in his mouth, nothing flies away); frames 5-8 SPLIT: his body wobbles, stretches and tears down the middle into two smaller mutants, comic and gooey.
Row 4 — frames 1-2 HURT: recoil backwards, green goo splashes from his body; frames 3-8 DEATH: falls backwards, melts into a glowing green puddle with his hard hat on top. Everything fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and boots, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 6. Colosse disproportionné (`colosse`, gabarit gros) — généré ✓

- **Niveau** : le **gros méchant des portes de garage**, dès le niveau 1 (une fois), puis dans les niveaux 3, 6 et 7. En version radioactive au niveau 7, par teinte.
- **Look** : une montagne de muscles façon films d'action des années 80, avec une tête minuscule. Bandana rouge, débardeur camouflage déchiré, ceinture de munitions vide, pantalon militaire, rangers. Environ 1,5 fois la taille d'un héros.
- **Attaques** : il frappe le sol à deux poings, ce qui crée une onde de choc au ras du sol ; il soulève et lance un fût (`barrel`).
- **Spécial** : l'entrée en scène. Il sort de la porte de garage en rugissant et en se frappant le torse.
- **Comportement** : lent, très résistant, il ne recule pas sous les tirs et ne titube qu'aux explosifs. Il faut sauter par-dessus l'onde.
- **PV** : 150.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic 1980s action-movie parody: a huge, absurdly over-muscled brute with a tiny head, a red bandana, a torn camouflage tank top, an empty ammo belt across his chest, military trousers and combat boots, enormous fists, veins everywhere. He is a giant: about one and a half times taller than a normal soldier. No text, no logos anywhere.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 85% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 6 frames: heavy, ground-shaking stomp, arms swinging like a gorilla, clearly alternating legs in every frame.
Row 2 — frames 1-2 IDLE: heavy breathing, pecs bouncing, seamless loop; frames 3-6 GROUND POUND: raises both fists high, slams them into the ground in front of him, impact pose, recover.
Row 3 — frames 1-3 THROW: lifts a big rusty oil barrel above his head and hurls it forward (barrel in his hands in frames 1-2, hands empty in frame 3); frames 4-6 ENTRANCE ROAR: beating his chest with both fists, roaring at the sky.
Row 4 — frames 1-2 HURT: staggers backwards, angry face; frames 3-6 DEATH: falls backwards like a tree, bounces once, lies flat on his back. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions pushed to the extreme (tiny head, gigantic arms and chest, chunky boots, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 7. Cyber-flic (`cyberflic`) — généré ✓

- **Niveau** : à partir du niveau 7 (la centrale), puis 9 et 10. C'est l'élite policière de l'IA.
- **Look** : RoboCop parodique. Armure chromée bleu-gris aux épaules carrées, visière rouge lumineuse en bande, mâchoire humaine qui dépasse, gyrophare miniature sur l'épaule, gros pistolet laser.
- **Attaques** : coup de crosse au contact ; tir laser en ligne droite (`laser`).
- **Spécial** : le scan. Sa visière balaie l'écran, puis il tire une rafale de 3 lasers sur la position scannée.
- **Comportement** : il avance d'un pas lourd et régulier. Son armure de face ne cède qu'aux explosifs ; de dos, il est vulnérable. Il faut sauter par-dessus pour le toucher.
- **PV** : 60.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic 1980s sci-fi parody: a cyborg police officer in bulky chrome blue-grey armour with square shoulders, a glowing red visor band across his eyes, only his human chin visible, a tiny police light on one shoulder, and a big chunky laser pistol. No text, no badges with writing, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 62% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a stiff, heavy, mechanical walk, the pistol held pointing down, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: standing still, visor light pulsing, small servo movements, seamless loop; frames 5-8 MELEE: a short, brutal pistol-butt strike (wind-up, strike, impact, recover).
Row 3 — frames 1-4 SHOOT: arm extended, laser pistol aimed straight forward at chest height, recoil in frames 2-3 (no beam, no flash leaving the gun); frames 5-8 SCAN: the red visor light sweeps left and right, head turning mechanically, then locks on.
Row 4 — frames 1-2 HURT: sparks fly from the armour, he jerks backwards; frames 3-8 DEATH: short-circuits with sparks and smoke, falls to his knees, then flat on his back, visor fading out. The lying body fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and boots, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, shiny metal highlights, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character looks exactly the same in every frame: same colours, same size, same details.
```

## 8. Zombie connecté (`zombie`) — généré ✓

Il remplace le « punk-zombie » du plan : le groupe est punk, autant ne pas taper sur son propre camp. Le zombie connecté, ce sont les habitants dont l'IA a volé l'**attention** (la ressource du niveau 1). C'est un clin d'œil à *Thriller* et aux films de zombies des années 80.

- **Niveau** : dès le niveau 1, en chair à canon, puis partout. Ils sortent des plaques d'égout et du sol.
- **Look** : un passant ordinaire (sweat à capuche gris, jean, baskets) au teint gris-bleu, avec des cernes énormes. Le visage est éclairé par le smartphone qu'il tient collé au nez, et ses yeux brillent du même bleu que l'écran.
- **Attaques** : il agrippe et mord au contact ; il lance son téléphone (`phone`), qui rebondit au sol.
- **Spécial** : il sort du sol, la main d'abord, façon *Thriller*.
- **Comportement** : lent, fragile, en nombre. **Il est débranché, pas tué** : à « sa mort », il lâche le téléphone, se réveille et s'enfuit, ce qui donne des points. C'est un cousin des habitants à libérer.
- **PV** : 8.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic 1980s zombie-movie parody: a "phone zombie", an ordinary young passer-by in a grey hoodie, jeans and sneakers, with greyish-blue skin and huge dark circles under the eyes, shambling with a smartphone held right in front of his face; the phone screen lights his face in cold blue and his eyes glow the same blue. No text, no logos anywhere, the phone screen is a plain glowing rectangle.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 58% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a slow zombie shamble, eyes glued to the phone, free arm hanging, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: scrolling with his thumb, swaying, seamless loop; frames 5-8 MELEE: lunges forward, grabs with his free hand and bites (wind-up, lunge, grab, recover).
Row 3 — frames 1-4 THROW: he angrily throws his phone forward overhand (phone in his hand in frames 1-2, hand empty in frames 3-4); frames 5-8 RISE FROM THE GROUND: first only a hand with the glowing phone emerges from the ground, then the head, then the shoulders, then he is fully standing, in the style of the Thriller video (the ground itself is not drawn, the body is cut by the baseline).
Row 4 — frames 1-2 HURT: recoil backwards, the phone glitching; frames 3-8 WAKE UP: he drops the phone, blinks, his skin regains a normal healthy colour, he looks around confused, then runs away to the left in panic. He stays inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and shoes, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 9. Ninja d'entreprise (`ninja`) — généré ✓

- **Niveau** : niveaux 8 (quartier d'affaires) et 10 (tour). Il saute de plateforme en plateforme et tombe des mezzanines.
- **Look** : costume gris anthracite, cravate rouge, badge d'entreprise vierge à la ceinture, cagoule ninja noire, bandeau rouge. Il manie un coupe-papier géant comme un katana.
- **Attaques** : coup de coupe-papier au contact ; il lance des cartes de visite comme des shurikens (`card`, 3 en éventail).
- **Spécial** : le salto. Il saute très haut et retombe derrière le héros.
- **Comportement** : rapide, peu de PV. Il ne reste jamais au même endroit et attaque par surprise depuis les plateformes.
- **PV** : 15.

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE enemy character only, a comic 1980s ninja-movie parody: a corporate ninja, a slim man in a charcoal grey business suit and a red tie, wearing a black ninja hood with a red headband, a blank white company badge clipped to his belt, wielding a giant letter opener like a katana. No text, no logos anywhere.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers, no logos.
The character always faces RIGHT (the game mirrors him), is drawn at the same scale in every frame (about 58% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — WALK, 8 frames: a fast, low ninja run, body leaning forward, letter opener held behind, clearly alternating legs in every frame.
Row 2 — frames 1-4 IDLE: ninja guard stance, tie fluttering, seamless loop; frames 5-8 MELEE: a fast horizontal slash with the letter opener (wind-up, slash, follow-through, recover).
Row 3 — frames 1-4 THROW: he flicks three business cards forward like shurikens with a sharp wrist movement (cards in his hand in frames 1-2, hand empty in frames 3-4); frames 5-8 SOMERSAULT: crouch, high jump, tucked flip in the air, landing crouch; the air frames are drawn higher in the cell, never cropped.
Row 4 — frames 1-2 HURT: recoil backwards, tie flying; frames 3-8 DEATH: spins, falls flat on his back, then vanishes in a small puff of smoke leaving only his tie and badge on the ground. Everything fits entirely inside the cell, on the baseline.

Draw NO projectile flying away and NO effect detached from the body: they are separate sprites.
Style: crisp pixel art, Metal Slug proportions (big head, chunky hands and shoes, exaggerated poses with anticipation and recoil), dark coloured outlines (not pure black), shading lit from the upper left, rich but limited palette, no anti-aliasing against the background, no blur, no motion lines.
The character and his outfit look exactly the same in every frame: same colours, same size, same details.
```

## 10. Projectiles des méchants (`projectiles`) — généré ✓

Une planche pour tous. Chaque projectile est centré dans sa case ; le jeu le réduit à sa taille de jeu (`tools/sprites.json`).

| Rangée | Images 1-4 | Images 5-8 |
|---|---|---|
| 1 | `bottle`, bouteille de bière qui tourne (skinhead) | `fire`, flaque de feu au sol |
| 2 | `dumbbell`, haltère qui tourne (masculiniste) | `banknote`, billet tranchant (affairiste) |
| 3 | `zap`, éclair d'écran (homme-TV) | `laser`, trait laser (cyber-flic) |
| 4 | `spit`, crachat toxique (mutant) | `puddle`, flaque toxique |
| 5 | `card`, carte de visite-shuriken (ninja) | `barrel`, fût rouillé qui tourne (colosse) |

Le téléphone du zombie (`phone`) est assez petit pour être dessiné par le script, comme la balle du CRS.

```
Pixel art projectiles sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
Strict layout: a uniform grid of 8 columns x 5 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF), no gradient, no text, no labels, every object centred in its cell, nothing crosses the cell borders.

Row 1 — frames 1-4 BEER BOTTLE: a brown glass beer bottle spinning end over end, seen at 4 angles; frames 5-8 FIRE PUDDLE: a small flat puddle of burning liquid on the ground, flames flickering, loop.
Row 2 — frames 1-4 DUMBBELL: a small black dumbbell spinning, 4 angles; frames 5-8 BANKNOTE: a green banknote spinning flat like a blade, 4 angles, no text or numbers on it.
Row 3 — frames 1-4 TV ZAP: a ball of bright blue electric static with crackling arcs, pulsing, pointing right; frames 5-8 LASER BOLT: a short glowing red laser bolt pointing right, with a bright white core, pulsing.
Row 4 — frames 1-4 TOXIC SPIT: a glowing acid green glob with drips, wobbling; frames 5-8 TOXIC PUDDLE: a flat glowing green puddle on the ground, bubbling, loop.
Row 5 — frames 1-4 BUSINESS CARD: a small white business card spinning like a shuriken, 4 angles, no text on it; frames 5-8 OIL BARREL: a big rusty red oil barrel spinning end over end, 4 angles.

Style: crisp pixel art, Metal Slug style, bold readable shapes, limited palette, dark coloured outlines (not pure black), no anti-aliasing against the background, no blur.
```

---

## 11. Les marches (`{id}-marche.png`, facultatives)

Le générateur dessine mal une marche au milieu d'une planche complète : les jambes restent écartées dans toutes les images. Une planche de la seule marche corrige ça. Elle remplace la rangée de marche de la planche du méchant ; `tools/build_sprites.py` la lit et lui garde la taille de l'ancienne marche.

Disposition : 8 × 4 (6 × 4 pour le colosse), chaque rangée le même cycle ; seule la 1ʳᵉ rangée est lue. Prompt : la description du méchant, puis le cycle image par image :
- 1 et 5 : un pied posé devant, l'autre tendu derrière ;
- 2 et 6 : le poids sur la jambe avant ;
- 3 et 7 : la jambe arrière passe sous le corps, genou levé, pieds rapprochés ;
- 4 et 8 : elle se tend vers l'avant.

Pour que le générateur ne les confonde pas, la jambe éloignée est un peu plus sombre. Faites, comme les héros : skinhead, masculiniste, affairiste, homme-TV, mutant, zombie, ninja, colosse, CRS. Le cyber-flic garde sa marche d'origine. La course de l'habitant libéré est faite de la même façon (`decor/habitant-course.png`).

## À venir

- **Variantes par teinte et réglages**, sans nouvelle planche : CRS bouclier, CRS motard, vigiles (CRS gris), homme-TV écran plat, colosse radioactif, petits mutants.
- **Autres gros des points d'apparition** : CRS à bouclier géant, bulldozer miniature, mutant géant. À écrire quand le système de points d'apparition existe.
- **Boss** : `ressources/prompts/boss.md`, un boss = des pièces séparées (§ 5 du plan).
