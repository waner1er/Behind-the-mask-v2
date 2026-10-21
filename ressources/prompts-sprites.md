# Prompts des planches de sprites (Metal Slug-like)

13 images : 3 par perso (déplacements, tir dans 8 directions, actions) + 1 planche d'effets.
Le perso regarde toujours à droite : le jeu retourne l'image pour la gauche. Les 8 directions de tir
viennent donc de 5 visées dessinées (devant, diagonale haut, haut, diagonale bas, bas) et de leurs reflets.

## Mode d'emploi

1. **Format** : toujours 1536 × 1024 (paysage). Les cases font alors 192 × 256 (8 × 4) ou 256 × 256 (6 × 4) :
   même hauteur, donc même échelle de perso d'une planche à l'autre.
2. **Références** : joindre `ressources/references/{perso}.png` (portrait + anciens sprites d'un seul perso,
   sans texte). Générer d'abord les déplacements, puis les joindre aussi pour le tir et les actions.
3. **Enregistrer** sous `ressources/sprites/` avec le nom indiqué dans chaque titre
   (`arnaud-deplacements.png`, `arnaud-tir.png`, `arnaud-actions.png`…, `effets.png`).
4. **Découper** : `python3 tools/build_sprites.py` (numpy, scipy, pillow) → `public/assets/sprites/`.
   Puis `npm run dev` et ouvrir `demo.html` : démo, touche `G` pour les repères, « Inspecteur des images » sous la borne.
   Une planche manquante est remplacée par l'ancienne ; on peut donc les ajouter une par une.
5. **Vérifier** `ressources/sprites/_controle/` : chaque case, sa ligne de sol (jaune), l'ancrage (vert),
   le bout de l'instrument (rouge). Un ancrage décalé se corrige dans `tools/sprites-ajustements.json`
   (`{"arnaud/walk/3": [1, 0]}`), sans regénérer.

Contrôle avant d'accepter une image : bon nombre de cases, fond magenta uni, perso tourné à droite,
instrument de la même couleur partout, jambes différentes à chaque image de marche, et dans la planche
de tir, jambes identiques sur les 12 images debout (le jeu pose ces bustes sur les jambes de marche).

---

## 1. Arnaud — déplacements (`arnaud-deplacements.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Arnaud, a man in his forties with a completely SHAVED bald head (no hair at all, not even at the back or sides), NO glasses, a LONG full ginger-brown beard down to his chest covering the whole jaw and cheeks, a buttoned light grey-blue work shirt with two chest pockets, dark blue jeans, black and white Vans Old Skool sneakers, a small black backpack; he plays a black electric bass guitar with a cream pickguard and a maple neck, carried in front of him on a strap, both hands on it.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — IDLE, 8 frames: standing ready, holding his bass, subtle breathing loop (shoulders rise and fall, bass bobs 1 pixel).
Row 2 — WALK, 8 frames, a real side-view walk cycle in profile where the legs clearly pass each other: 1 contact, right foot forward with the heel down, left leg back; 2 down, weight on the right leg, knees bent; 3 PASSING, the left leg swings forward under the body, knee raised, both legs close together; 4 up, the left foot reaching forward, right leg pushing off; 5 contact, LEFT foot forward with the heel down, right leg back (mirror of frame 1); 6 down; 7 PASSING, the right leg swings forward under the body, knee raised, legs together; 8 up. Arms swing opposite to the legs. In frames 3 and 7 the feet are NOT apart.
Row 3 — JUMP, 8 frames: 1 crouch before take-off and 8 landing squash, both with the feet on the baseline; 2 take-off, 3 rising, 4 legs tucked, 5 apex, 6 falling, 7 falling with legs extended, all in the air: draw him a little higher in the cell, never cropped (the game handles the real jump height).
Row 4 — CROUCH, 8 frames: 2 frames going down into a crouch, 2 frames crouched breathing, 4 frames crouch-walking forward.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his backpack and his black bass look exactly the same in every frame: same colours, same size, same details.
```

## 2. Arnaud — tir dans 8 directions (`arnaud-tir.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Arnaud, a man in his forties with a completely SHAVED bald head (no hair at all, not even at the back or sides), NO glasses, a LONG full ginger-brown beard down to his chest covering the whole jaw and cheeks, a buttoned light grey-blue work shirt with two chest pockets, dark blue jeans, black and white Vans Old Skool sneakers, a small black backpack; he plays a black electric bass guitar with a cream pickguard and a maple neck. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

His bass is his gun: he holds it like a rifle, the body of the bass against his hip, both hands on it, and the neck points exactly where he aims; the headstock is the muzzle.
Each direction has 3 frames: 1 aim, 2 fire (the body jolts), 3 recoil. Draw NO muzzle flash and NO projectile: they are separate sprites.
Angles: forward = horizontal to the right; diagonal up = exactly 45 degrees up-right; up = vertical; diagonal down = exactly 45 degrees down-right; down = vertical, between his feet.

Row 1 — STANDING: frames 1-3 aiming forward; frames 4-6 aiming diagonal up.
Row 2 — STANDING: frames 1-3 aiming straight up; frames 4-6 aiming diagonal down.
Row 3 — IN THE AIR, jump pose with knees tucked: frames 1-3 aiming diagonal down; frames 4-6 aiming straight down.
Row 4 — frames 1-3 CROUCHED aiming forward; frames 4-6 IN THE AIR (same tucked jump pose) aiming forward.

Rows 1 and 2: from the belt down, the legs are EXACTLY the same in all 12 standing frames, identical to a neutral idle stance (same position, same pixels); the belt is always at the same height. Only the upper body, head, arms and instrument move. The game puts these upper bodies on the walking legs.
Rows 3 and 4 in the air: the same tucked legs in all 6 air frames, drawn a little higher in the cell, never cropped.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his backpack and his black bass look exactly the same in every frame: same colours, same size, same details. The only weapon is his black bass.
```

## 3. Arnaud — actions (`arnaud-actions.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Arnaud, a man in his forties with a completely SHAVED bald head (no hair at all, not even at the back or sides), NO glasses, a LONG full ginger-brown beard down to his chest covering the whole jaw and cheeks, a buttoned light grey-blue work shirt with two chest pockets, dark blue jeans, black and white Vans Old Skool sneakers, a small black backpack; he plays a black electric bass guitar with a cream pickguard and a maple neck. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — THROW BOMB: the bomb is a black vinyl record with a red centre label. Frames 1-3 standing (wind-up with the vinyl in his hand, throwing arm forward releasing it like a frisbee, follow-through with empty hand); frames 4-6 the same throw while crouched.
Row 2 — MELEE, close-range hit swinging his bass like a club: frames 1-3 standing (wind-up, impact, recover); frames 4-6 the same hit while crouched.
Row 3 — frames 1-2 HURT (hit recoil backwards, pained face); frames 3-6 DEATH (falling backwards, hitting the ground, small bounce, lying flat on his back). The lying body fits entirely inside the cell, on the baseline.
Row 4 — VICTORY, 6 frames, seamless loop: rock star celebration, raising his black bass above his head, shouting, then lowering it.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his backpack and his black bass look exactly the same in every frame: same colours, same size, same details. The only weapon is his black bass.
```

## 4. Baptiste — déplacements (`baptiste-deplacements.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Baptiste, a TALL lean man in his forties (taller and slimmer than an average man), short messy tousled medium-brown hair (no cap, no long hair), a short trimmed salt-and-pepper beard close to the face, a slight confident half smile on one side of his mouth (a smirk), a dark blue and grey PLAID flannel shirt with rolled sleeves, open over a white band t-shirt with a black print, black jeans, black Converse high-top sneakers; he plays a bright RED electric guitar (Stratocaster shape, white pickguard), carried in front of him on a strap, both hands on it.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — IDLE, 8 frames: standing ready, holding his red guitar, subtle breathing loop (shoulders rise and fall, guitar bobs 1 pixel).
Row 2 — WALK, 8 frames, a real side-view walk cycle in profile where the legs clearly pass each other: 1 contact, right foot forward with the heel down, left leg back; 2 down, weight on the right leg, knees bent; 3 PASSING, the left leg swings forward under the body, knee raised, both legs close together; 4 up, the left foot reaching forward, right leg pushing off; 5 contact, LEFT foot forward with the heel down, right leg back (mirror of frame 1); 6 down; 7 PASSING, the right leg swings forward under the body, knee raised, legs together; 8 up. Arms swing opposite to the legs. In frames 3 and 7 the feet are NOT apart.
Row 3 — JUMP, 8 frames: 1 crouch before take-off and 8 landing squash, both with the feet on the baseline; 2 take-off, 3 rising, 4 legs tucked, 5 apex, 6 falling, 7 falling with legs extended, all in the air: draw him a little higher in the cell, never cropped (the game handles the real jump height).
Row 4 — CROUCH, 8 frames: 2 frames going down into a crouch, 2 frames crouched breathing, 4 frames crouch-walking forward.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his guitar look exactly the same in every frame: same colours, same size, same details. The guitar is ALWAYS bright red with a white pickguard, never wood or brown.
```

## 5. Baptiste — tir dans 8 directions (`baptiste-tir.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Baptiste, a TALL lean man in his forties (taller and slimmer than an average man), short messy tousled medium-brown hair (no cap, no long hair), a short trimmed salt-and-pepper beard close to the face, a slight confident half smile on one side of his mouth (a smirk), a dark blue and grey PLAID flannel shirt with rolled sleeves, open over a white band t-shirt with a black print, black jeans, black Converse high-top sneakers; he plays a bright RED electric guitar (Stratocaster shape, white pickguard). Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

His guitar is his gun: he holds the red guitar like a rifle, the body of the guitar against his hip, both hands on it, and the neck points exactly where he aims; the headstock is the muzzle.
Each direction has 3 frames: 1 aim, 2 fire (the body jolts), 3 recoil. Draw NO muzzle flash and NO projectile: they are separate sprites.
Angles: forward = horizontal to the right; diagonal up = exactly 45 degrees up-right; up = vertical; diagonal down = exactly 45 degrees down-right; down = vertical, between his feet.

Row 1 — STANDING: frames 1-3 aiming forward; frames 4-6 aiming diagonal up.
Row 2 — STANDING: frames 1-3 aiming straight up; frames 4-6 aiming diagonal down.
Row 3 — IN THE AIR, jump pose with knees tucked: frames 1-3 aiming diagonal down; frames 4-6 aiming straight down.
Row 4 — frames 1-3 CROUCHED aiming forward; frames 4-6 IN THE AIR (same tucked jump pose) aiming forward.

Rows 1 and 2: from the belt down, the legs are EXACTLY the same in all 12 standing frames, identical to a neutral idle stance (same position, same pixels); the belt is always at the same height. Only the upper body, head, arms and instrument move. The game puts these upper bodies on the walking legs.
Rows 3 and 4 in the air: the same tucked legs in all 6 air frames, drawn a little higher in the cell, never cropped.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his guitar look exactly the same in every frame: same colours, same size, same details. The guitar is ALWAYS bright red with a white pickguard, never wood or brown. The only weapon is his red guitar.
```

## 6. Baptiste — actions (`baptiste-actions.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Baptiste, a TALL lean man in his forties (taller and slimmer than an average man), short messy tousled medium-brown hair (no cap, no long hair), a short trimmed salt-and-pepper beard close to the face, a slight confident half smile on one side of his mouth (a smirk), a dark blue and grey PLAID flannel shirt with rolled sleeves, open over a white band t-shirt with a black print, black jeans, black Converse high-top sneakers; he plays a bright RED electric guitar (Stratocaster shape, white pickguard). Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — THROW BOMB: the bomb is a black vinyl record with a red centre label. Frames 1-3 standing (wind-up with the vinyl in his hand, throwing arm forward releasing it like a frisbee, follow-through with empty hand); frames 4-6 the same throw while crouched.
Row 2 — MELEE, close-range hit swinging his red guitar like a club: frames 1-3 standing (wind-up, impact, recover); frames 4-6 the same hit while crouched.
Row 3 — frames 1-2 HURT (hit recoil backwards, pained face); frames 3-6 DEATH (falling backwards, hitting the ground, small bounce, lying flat on his back). The lying body fits entirely inside the cell, on the baseline.
Row 4 — VICTORY, 6 frames, seamless loop: rock star celebration, raising his red guitar above his head, shouting, then lowering it.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his guitar look exactly the same in every frame: same colours, same size, same details. The guitar is ALWAYS bright red with a white pickguard, never wood or brown. The only weapon is his red guitar.
```

## 7. Erwan — déplacements (`erwan-deplacements.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Erwan, a slim man in his forties with a shaved head under a flat-brim green and black Boston Celtics baseball cap (green crown, black visor, the Celtics logo on the front), thick black-rimmed glasses, clean-shaven, a black zip hoodie open over a black band t-shirt with a white print, dark grey jeans, black and white Vans Old Skool sneakers, a small snare drum strapped on his back; he holds two short light-wood drumsticks with round tips, one in each hand, one drumstick in each hand.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — IDLE, 8 frames: standing ready, a drumstick in each hand, twirling one drumstick, subtle breathing loop (shoulders rise and fall).
Row 2 — WALK, 8 frames, a real side-view walk cycle in profile where the legs clearly pass each other: 1 contact, right foot forward with the heel down, left leg back; 2 down, weight on the right leg, knees bent; 3 PASSING, the left leg swings forward under the body, knee raised, both legs close together; 4 up, the left foot reaching forward, right leg pushing off; 5 contact, LEFT foot forward with the heel down, right leg back (mirror of frame 1); 6 down; 7 PASSING, the right leg swings forward under the body, knee raised, legs together; 8 up. Arms swing opposite to the legs. In frames 3 and 7 the feet are NOT apart.
Row 3 — JUMP, 8 frames: 1 crouch before take-off and 8 landing squash, both with the feet on the baseline; 2 take-off, 3 rising, 4 legs tucked, 5 apex, 6 falling, 7 falling with legs extended, all in the air: draw him a little higher in the cell, never cropped (the game handles the real jump height).
Row 4 — CROUCH, 8 frames: 2 frames going down into a crouch, 2 frames crouched breathing, 4 frames crouch-walking forward.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his snare drum and his drumsticks look exactly the same in every frame: same colours, same size, same details. The drumsticks are short (forearm length), light wood, with round tips, like real drumsticks.
```

## 8. Erwan — tir dans 8 directions (`erwan-tir.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Erwan, a slim man in his forties with a shaved head under a flat-brim green and black Boston Celtics baseball cap (green crown, black visor, the Celtics logo on the front), thick black-rimmed glasses, clean-shaven, a black zip hoodie open over a black band t-shirt with a white print, dark grey jeans, black and white Vans Old Skool sneakers, a small snare drum strapped on his back; he holds two short light-wood drumsticks with round tips, one in each hand. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

His drumsticks are his gun: he holds both drumsticks side by side in his extended hands, like a pistol held with two hands, and their round tips point exactly where he aims; the tips are the muzzle.
Each direction has 3 frames: 1 aim, 2 fire (the body jolts), 3 recoil. Draw NO muzzle flash and NO projectile: they are separate sprites.
Angles: forward = horizontal to the right; diagonal up = exactly 45 degrees up-right; up = vertical; diagonal down = exactly 45 degrees down-right; down = vertical, between his feet.

Row 1 — STANDING: frames 1-3 aiming forward; frames 4-6 aiming diagonal up.
Row 2 — STANDING: frames 1-3 aiming straight up; frames 4-6 aiming diagonal down.
Row 3 — IN THE AIR, jump pose with knees tucked: frames 1-3 aiming diagonal down; frames 4-6 aiming straight down.
Row 4 — frames 1-3 CROUCHED aiming forward; frames 4-6 IN THE AIR (same tucked jump pose) aiming forward.

Rows 1 and 2: from the belt down, the legs are EXACTLY the same in all 12 standing frames, identical to a neutral idle stance (same position, same pixels); the belt is always at the same height. Only the upper body, head, arms and instrument move. The game puts these upper bodies on the walking legs.
Rows 3 and 4 in the air: the same tucked legs in all 6 air frames, drawn a little higher in the cell, never cropped.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his snare drum and his drumsticks look exactly the same in every frame: same colours, same size, same details. The drumsticks are short (forearm length), light wood, with round tips, like real drumsticks. The only weapons are his two short drumsticks.
```

## 9. Erwan — actions (`erwan-actions.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Erwan, a slim man in his forties with a shaved head under a flat-brim green and black Boston Celtics baseball cap (green crown, black visor, the Celtics logo on the front), thick black-rimmed glasses, clean-shaven, a black zip hoodie open over a black band t-shirt with a white print, dark grey jeans, black and white Vans Old Skool sneakers, a small snare drum strapped on his back; he holds two short light-wood drumsticks with round tips, one in each hand. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — THROW BOMB: the bomb is a black vinyl record with a red centre label. Frames 1-3 standing (wind-up with the vinyl in his hand, throwing arm forward releasing it like a frisbee, follow-through with empty hand); frames 4-6 the same throw while crouched.
Row 2 — MELEE, close-range hit striking down hard with both drumsticks like a drum fill: frames 1-3 standing (wind-up, impact, recover); frames 4-6 the same hit while crouched.
Row 3 — frames 1-2 HURT (hit recoil backwards, pained face); frames 3-6 DEATH (falling backwards, hitting the ground, small bounce, lying flat on his back). The lying body fits entirely inside the cell, on the baseline.
Row 4 — VICTORY, 6 frames, seamless loop: rock star celebration, raising his two drumsticks above his head, shouting, then lowering it.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes, his snare drum and his drumsticks look exactly the same in every frame: same colours, same size, same details. The drumsticks are short (forearm length), light wood, with round tips, like real drumsticks. The only weapons are his two short drumsticks.
```

## 10. Pierre — déplacements (`pierre-deplacements.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Pierre, a man in his late thirties, clean-shaven (NO beard), short dark hair under a plain BLACK baseball cap with a small round logo, red and black plaid flannel shirt with rolled sleeves, open over a white t-shirt with a black print, blue jeans, black Converse high-top sneakers with white toe caps; he holds a black handheld microphone with a short coiled black cable, the microphone in his front hand.

Strict layout: a uniform grid of 8 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — IDLE, 8 frames: standing ready, microphone in his hand, subtle breathing loop (shoulders rise and fall, short cable swaying).
Row 2 — WALK, 8 frames, a real side-view walk cycle in profile where the legs clearly pass each other: 1 contact, right foot forward with the heel down, left leg back; 2 down, weight on the right leg, knees bent; 3 PASSING, the left leg swings forward under the body, knee raised, both legs close together; 4 up, the left foot reaching forward, right leg pushing off; 5 contact, LEFT foot forward with the heel down, right leg back (mirror of frame 1); 6 down; 7 PASSING, the right leg swings forward under the body, knee raised, legs together; 8 up. Arms swing opposite to the legs. In frames 3 and 7 the feet are NOT apart. The short microphone cable sways.
Row 3 — JUMP, 8 frames: 1 crouch before take-off and 8 landing squash, both with the feet on the baseline; 2 take-off, 3 rising, 4 legs tucked, 5 apex, 6 falling, 7 falling with legs extended, all in the air: draw him a little higher in the cell, never cropped (the game handles the real jump height).
Row 4 — CROUCH, 8 frames: 2 frames going down into a crouch, 2 frames crouched breathing, 4 frames crouch-walking forward.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his microphone look exactly the same in every frame: same colours, same size, same details. The cable is short and coiled, like a real microphone cable.
```

## 11. Pierre — tir dans 8 directions (`pierre-tir.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Pierre, a man in his late thirties, clean-shaven (NO beard), short dark hair under a plain BLACK baseball cap with a small round logo, red and black plaid flannel shirt with rolled sleeves, open over a white t-shirt with a black print, blue jeans, black Converse high-top sneakers with white toe caps; he holds a black handheld microphone with a short coiled black cable. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

His microphone is his gun: he holds it at arm's length like a pistol, and the round grille of the microphone points exactly where he aims; the grille is the muzzle. The short coiled cable hangs from his hand.
Each direction has 3 frames: 1 aim, 2 fire (the body jolts), 3 recoil. Draw NO muzzle flash and NO projectile: they are separate sprites.
Angles: forward = horizontal to the right; diagonal up = exactly 45 degrees up-right; up = vertical; diagonal down = exactly 45 degrees down-right; down = vertical, between his feet.

Row 1 — STANDING: frames 1-3 aiming forward; frames 4-6 aiming diagonal up.
Row 2 — STANDING: frames 1-3 aiming straight up; frames 4-6 aiming diagonal down.
Row 3 — IN THE AIR, jump pose with knees tucked: frames 1-3 aiming diagonal down; frames 4-6 aiming straight down.
Row 4 — frames 1-3 CROUCHED aiming forward; frames 4-6 IN THE AIR (same tucked jump pose) aiming forward.

Rows 1 and 2: from the belt down, the legs are EXACTLY the same in all 12 standing frames, identical to a neutral idle stance (same position, same pixels); the belt is always at the same height. Only the upper body, head, arms and instrument move. The game puts these upper bodies on the walking legs.
Rows 3 and 4 in the air: the same tucked legs in all 6 air frames, drawn a little higher in the cell, never cropped.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his microphone look exactly the same in every frame: same colours, same size, same details. The cable is short and coiled, like a real microphone cable. The only weapon is his microphone.
```

## 12. Pierre — actions (`pierre-actions.png`)

```
Pixel art sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
ONE character only: Pierre, a man in his late thirties, clean-shaven (NO beard), short dark hair under a plain BLACK baseball cap with a small round logo, red and black plaid flannel shirt with rolled sleeves, open over a white t-shirt with a black print, blue jeans, black Converse high-top sneakers with white toe caps; he holds a black handheld microphone with a short coiled black cable. Same character design, scale and palette as the attached reference sheet.

Strict layout: a uniform grid of 6 columns x 4 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF) in every cell, no gradient, no floor, no cast shadow, no text, no labels, no numbers.
The character always faces RIGHT (the game mirrors him for the left side), is drawn at the same scale in every frame (about 60% of the cell height when standing), and when he stands on the ground his feet rest on the same baseline near the bottom of the cell. Nothing crosses the cell borders.

Row 1 — THROW BOMB: the bomb is a black vinyl record with a red centre label. Frames 1-3 standing (wind-up with the vinyl in his hand, throwing arm forward releasing it like a frisbee, follow-through with empty hand); frames 4-6 the same throw while crouched.
Row 2 — MELEE, close-range hit hitting with the microphone held in his fist, the short coiled cable flying behind: frames 1-3 standing (wind-up, impact, recover); frames 4-6 the same hit while crouched.
Row 3 — frames 1-2 HURT (hit recoil backwards, pained face); frames 3-6 DEATH (falling backwards, hitting the ground, small bounce, lying flat on his back). The lying body fits entirely inside the cell, on the baseline.
Row 4 — VICTORY, 6 frames, seamless loop: rock star celebration, raising his microphone above his head, shouting, then lowering it.

Style: crisp pixel art in the exact style of the Metal Slug soldiers (Marco Rossi proportions: slightly big head, chunky hands and sneakers, exaggerated poses with anticipation and recoil), a realistic likeness, NOT a caricature, neutral serious face (no grin, no pout), dark coloured outlines (not pure black), shading lit from the upper left, warm shadows, rich but limited palette, no military clothing, no cargo pants, no boots, no anti-aliasing against the background, no blur, no motion lines.
The character, his clothes and his microphone look exactly the same in every frame: same colours, same size, same details. The cable is short and coiled, like a real microphone cable. The only weapon is his microphone.
```

## 13. Effets, une seule planche pour tous (`effets.png`)

```
Pixel art effects sprite sheet for a Metal Slug style run-and-gun arcade game (Neo Geo era, SNK style).
Strict layout: a uniform grid of 8 columns x 5 rows, every cell the same size, separated by thin dark grey lines. Flat solid magenta background (#FF00FF), no gradient, no text, no labels, every effect centred in its cell, nothing crosses the cell borders.

Row 1 — GUITAR PICK BULLET: frames 1-4 a small orange guitar pick (plectrum) spinning, seen from different angles; frames 5-8 the same pick in electric blue.
Row 2 — frames 1-4 MUZZLE FLASH: a bright yellow-white flash pointing right, growing then fading; frames 5-8 IMPACT: a small spark burst when a pick hits something.
Row 3 — VINYL BOMB: 8 frames of a black vinyl record with a red centre label spinning in the air like a thrown frisbee, seen at different angles.
Row 4 — VINYL EXPLOSION: 8 frames of a big explosion growing then fading: orange and yellow fireball, grey smoke, shards of black vinyl, and colourful music notes (quavers, semiquavers, a treble clef) flying out.
Row 5 — frames 1-4 MUSIC NOTES: a few colourful music notes floating up and fading; frames 5-8 DUST: a small dust puff for landing and running, growing then fading.

Style: crisp pixel art, Metal Slug explosion style, bold readable shapes, limited palette, dark coloured outlines (not pure black), no anti-aliasing against the background, no blur.
```
