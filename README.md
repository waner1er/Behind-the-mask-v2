# Behind the Mask

Run'n'gun façon *Metal Slug* sur l'album *Behind the Mask* de Vigilante, à 1 ou 2 joueurs. Le projet et ses étapes : [PLAN.md](PLAN.md).

**Jouer en ligne : https://waner1er.github.io/Behind-the-mask-v2/** (publié par GitHub Pages à chaque push sur `main`, voir `.github/workflows/pages.yml`).

## Lancer

```sh
npm install
npm run dev        # http://vigigames.test/ (ou http://127.0.0.1:5173/)
npm run build      # site statique dans dist/
npm run preview    # sert dist/
npm run lint
```

Les pages ne s'ouvrent que par `npm run dev` (ou par le build) : le navigateur seul ne sait pas charger Phaser depuis `node_modules`. `vigigames.test` est un proxy Valet vers Vite (`valet proxy vigigames http://127.0.0.1:5173`).

| Page | Contenu |
|---|---|
| `index.html` | **le jeu** : écran de garde (PRESS START, la démo tourne en attraction si personne ne joue), sélection des héros façon Metal Slug, puis le niveau 1 |
| `demo.html` | le banc d'essai : la démo de 2 minutes, les persos, l'inspecteur des images. `#manuel` commence au clavier ; `#12` démarre au passage 12 |
| `galerie.html` | tous les persos de l'atlas en action |
| `clip.html` | **le clip de démo** sur *Metal Slug* (feat. Guillaume / Circles) : écran de garde, sélection, puis la mission METAL SLUG jouée toute seule et calée sur le morceau, paroles en karaoké, Guillaume qui entre en invité, le boss open-space. Réglages (paroles, allure, invité) : `src/config/clip.js` |

La vidéo du clip (1080p, 60 i/s, avec le morceau) : `npm run dev`, puis `npm run clip:video` (Chrome sans fenêtre, ~5 min) → `clip-metal-slug.mp4`.

## Commandes

Les flèches, plus 6 boutons comme sur une borne (pavé Q S D / W X C d'un clavier AZERTY) :

| Touche | Action |
|---|---|
| ← → | avancer, reculer |
| ↑ ↓ | vers le fond, vers l'avant (sur le sol) ; viser (en l'air, sur une plateforme) |
| W | tir |
| X | saut |
| C | vinyle |
| Q | corps à corps |
| S | viser sans bouger : S + ↑ vise en haut, S + ↓ accroupit |
| D | attaque en skate (comme dans le premier jeu) : on fonce, invulnérable, en renversant tout |
| Entrée | Start : valider au titre, pause en jeu, continuer après un game over |

Le jeu sait gérer un 2e joueur, mais c'est désactivé pour l'instant (`TWO_PLAYERS` dans `src/config/controls.js`).

**Sur téléphone** (comme le premier jeu) : en paysage, le jeu prend tout l'écran, avec un stick tactile à gauche, les 6 boutons à droite (COUP, VISER, SKATE / TIR, SAUT, VINYLE) et START en haut. Tenu en portrait, le jeu s'affiche tourné d'un quart de tour : on est obligé de tourner le téléphone. Les commandes sont là dès l'écran d'accueil, où un appui sur l'écran vaut aussi START. Au premier appui, le jeu passe en plein écran et en paysage si le navigateur le permet, et sur Android, le téléphone vibre sur les gros coups.

Commandes particulières :
- **profondeur** : sur le sol, haut et bas déplacent vers le fond du trottoir ou vers l'avant, jusque sur la chaussée, à l'arrêt comme en marchant. On ne touche que ce qui est à peu près sur la même file, et on passe devant ou derrière les caisses. Pour viser en haut ou s'accroupir sur le sol, on tient S ; en l'air et sur les plateformes, haut et bas visent ;
- **vinyles** : on part sans ; on en gagne avec la lettre V (caisses, habitants, boss qui perd des morceaux). Ils explosent au contact. Lancés en visant vers le haut (S + ↑, ou ↑ en l'air), ils montent jusqu'au vaisseau du boss ;
- **armes** : L (larsen, rafale), P (power chord, éventail), R (missiles à tête chercheuse : ils vont chercher l'ennemi ou la pièce du boss la plus proche) ;
- bas + saut : descendre d'une plateforme ;
- tirer au contact d'un ennemi donne un coup de corps à corps ;
- Start (Entrée) ou Échap : pause.

## L'éditeur de niveau (dev)

En jeu, **F2** fige la partie et ouvre l'éditeur sur le passage en cours :
- on déplace les éléments, les habitants, les plateformes et les déclencheurs à la souris ;
- les touches 1 à 9 ajoutent un élément de décor, H un habitant, F une plateforme, T un déclencheur ;
- Suppr efface l'élément sélectionné ;
- **S** enregistre `src/data/levels/{niveau}.json` ;
- **F2** rejoue depuis l'endroit édité.

Les vagues d'ennemis (`spawn` de chaque déclencheur) se règlent dans le JSON.

## Images

Les planches générées sont dans `ressources/`. Les outils Python les découpent ; ils ont besoin de numpy, scipy et pillow, installés une fois dans `.venv` :

```sh
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/build_sprites.py                                 # héros, ennemis, effets → public/assets/sprites/
.venv/bin/python tools/build_level.py tools/niveaux/01-walk-straight.json # décor, habitant, boss → public/assets/levels/01-walk-straight/
.venv/bin/python tools/build_decor.py                                   # la rue → public/assets/decor/
.venv/bin/python tools/build_sounds.py                                  # voix et bruitages → public/assets/audio/sfx/
.venv/bin/python tools/build_logo.py                                    # le logo VIGILANTE / BEHIND THE MASK de l'écran de garde → public/assets/title/
.venv/bin/python tools/build_select.py                                  # portraits et fond de la sélection → public/assets/select/
                                                                        # (prend ressources/sources/select-portraits.png, la planche toon de Figma, si elle est là)
```

Les sons sont décrits dans `tools/sons.json` :
- les **voix** de l'annonceur, façon Metal Slug (« HEAVY LARSEN! », « MISSION ONE! START! », le nom du héros choisi). Elles sont synthétisées par Piper (`pip install piper-tts`, voix `en_US-ryan-high` téléchargée dans `.venv/voices`, voir l'en-tête de `build_sounds.py`), puis passées dans ffmpeg pour la voix d'arcade ;
- les **bruitages** (tirs, explosions, bonus…), synthétisés par le même outil.

Les prompts et le mode d'emploi sont dans `ressources/prompts/`. Les images du niveau 1 ont été générées dans le fichier Figma « Behind the Mask — niveau 1 ».

## Organisation

Phaser 4 + Vite, modules ES. La logique du jeu (`src/game/`) ne dépend pas de Phaser et tourne aussi dans Node. Les scènes (`src/scenes/`) et les vues (`src/views/`) la relient à Phaser. Le détail est dans PLAN.md, § 11.
