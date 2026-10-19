# Behind the Mask — Metal Slug-like

> Un run'n'gun à la *Metal Slug* en 9 niveaux, un par morceau de l'album *Behind the Mask*. Les quatre membres du groupe (Arnaud, Baptiste, Erwan, Pierre) rejouent le scénario du premier jeu : traverser la ville, battre les méchants un à un dans leurs vaisseaux, et faire sauter le data center du Docteur Mask. À 1 ou 2 joueurs : jamais plus de 2 en même temps.

C'est le remake Metal Slug de *Vigilante – Behind the Mask* (`~/projects/tuto-php`) : même histoire, mêmes boss, mêmes morceaux. Point de départ technique : la démo `demo.html` (4 héros, un CRS avec IA, tirs, vinyles, la rue de nuit), en Phaser 4, et l'atlas `public/assets/sprites/`. Ce qui manque (décors, boss, véhicules) sera généré à part, via Figma, puis découpé par `tools/`.

## 1. Intention et DA
- Un run'n'gun façon *Metal Slug* avec les 4 membres du groupe, qui tirent des médiators et lancent des vinyles : Pierre (Pete) au chant, Arnaud à la basse, Baptiste à la guitare, Erwan à la batterie.
- **1 ou 2 joueurs en même temps, jamais plus** : à 4, l'écran devient illisible. Chaque joueur choisit son héros parmi les 4 ; les deux autres ne jouent pas.
- **De la profondeur** : sur le sol, haut et bas déplacent les héros vers le fond du trottoir ou vers l'avant, jusque sur la chaussée (64 px). Les coups ne touchent que sur la même file, à peu près : on peut esquiver en changeant de file. Pour viser en haut ou s'accroupir sur le sol, on tient « viser sans bouger » (S) ; en l'air et sur les plateformes, haut et bas visent comme dans Metal Slug.
- **9 niveaux = les 9 morceaux de l'album**, dans l'ordre. Chaque niveau a son décor tiré de la chanson et le morceau en bande-son.
- **DA** : le pixel art dense et les animations exagérées de Metal Slug, posés sur l'univers de Vigilante : la ville des années 80, les néons, les gangs, les tags. Les méchants sont des **caricatures politiques** (CRS, néo-nazis, masculinistes, ultralibéraux, télé-propagande) **mélangées aux méchants des séries B des années 80** : mutants, nucléaire, colosses disproportionnés.
- Résolution native : 608 × 342 (celle de la démo), agrandie d'un facteur entier.

## 2. Scénario

On reprend **le scénario du premier jeu** (`tuto-php/config/story.php`) : intro, fin et générique. Seul changement : Pete n'est plus seul, c'est **le groupe au complet** qui part.

### Intro (musique : piste 9, *Behind the Mask*)
Ton « Marvel » : phrases courtes, narrateur qui en fait des tonnes, punchline.
> « 2026. LA VILLE DORT LES YEUX OUVERTS, COLLÉE À SES ÉCRANS. MAIS QUATRE MUSICIENS, EUX, NE DORMENT JAMAIS. »
> « PETE. CEINTURE NOIRE D'AÏKIDO. ENDURANT COMME UN MARATHONIEN. TOLÉRANT COMME UN....... ENFIN, PRESQUE TOLÉRANT. » (puis une ligne par membre du groupe)
> « LES RACISTES. LES MASCULINISTES. LES PRÉDATEURS DU CAPITAL. ILS POUSSENT PARTOUT, COMME DE LA MAUVAISE HERBE. »
> « PENDANT CE TEMPS, TOUT EN HAUT DE SON DATA CENTER... »
> DOCTEUR MASK : « MON IA VOIT TOUT, VEND TOUT, DÉCIDE DE TOUT. BIENTÔT, LE MONDE ENTIER SERA... EN PROMO ! HA HA HA ! »
> « QUATRE MUSICIENS. DES MÉDIATORS. DES VINYLES. NEUF MORCEAUX DE PUNK HARDCORE. »
> PETE : « BRÛLONS LES DATA CENTERS ! »
> « IL EST TEMPS DE DÉBRANCHER LE MONDE. VIGILANTE : BEHIND THE MASK. »

### Fin (musique : piste 5, *Black Belt*)
> DOCTEUR MASK : « NOOOON ! MON IA !! MES ACTIONNAIRES !!! »
> « LE DATA CENTER A EXPLOSÉ. L'IA S'EST ÉTEINTE. LES ÉCRANS AUSSI. »
> « DANS LES RUES, LES ARBRES REPOUSSENT, LES FLEURS SORTENT DU BITUME... ET LES GENS SOURIENT. »
> « QUI SE CACHAIT DERRIÈRE LE MASQUE ? PEU IMPORTE : LA VILLE EST LIBRE. »

Derrière le masque, il n'y a rien : une box internet qui clignote. Pete la débranche.

Le générique reprend les faux métiers du premier jeu (« DÉMONTEUR DE PANNEAUX PUBLICITAIRES », « CHEFFE DE LA SIESTE COLLECTIVE »…) et finit sur : « AUCUN ACTIONNAIRE N'A ÉTÉ BLESSÉ PENDANT CE JEU. … ENFIN SI, UN PEU. »

### Les paroles
Comme dans le premier jeu, `paroles.md` fournit les textes : les deux premières lignes du morceau s'affichent au début du niveau, les phrases courtes deviennent graffitis sur les murs et cris des ennemis.

## 3. Les 9 niveaux

Chaque niveau comprend :
- un décor en couches (ciel, fond, plan de jeu, premier plan), **tiré de la chanson** ;
- du relief (marches, plateformes) ;
- des **points d'apparition** (portes de garage, grottes, plaques d'égout, fenêtres) ;
- un ou deux ennemis vedettes ;
- parfois un véhicule à emprunter ;
- un **boss : un méchant du premier jeu dans son vaisseau** (§ 5).

| # | Morceau | Décor | Ennemis | Véhicule | Boss en vaisseau |
|---|---|---|---|---|---|
| 1 | **Walk Straight** | Le centre-ville au petit matin gris (la rue de la démo) : files de travailleurs qui marchent droit, écrans géants « KEEP SILENCE! », enseignes BANK, MALL, JOBS, SALE | CRS, hommes-TV | — | Mi-boss : la **télé géante** « WALK STRAIGHT » qui défonce une porte (neige qui étourdit, composants crachés en éventail). Boss : **The Manager** dans son **open-space volant**, une tour de bureaux à réacteurs : canon à eau, mégaphone « BACK TO WORK! », imprimantes qui crachent des lettres de licenciement. Il se met en garde après 3 coups de suite |
| 2 | **Metal Slug** | Un champ de bataille dans une salle d'arcade géante : bornes Neo Geo, paquets de chips, canettes, ruines, tags INSERT COIN et SHOOT THEM ALL | skinheads, CRS | Van de tournée | **The General** dans une **forteresse volante**, un bombardier à hélices façon Metal Slug : roquettes, tapis de bombes, parachutistes. « I'LL DESTROY THE FINAL BOSS » |
| 3 | **Nightmare** | Les lieux d'enfance abandonnés, la nuit, dans le brouillard et l'orage : fête foraine morte, cour d'école, terrain vague, ciel violet | zombies connectés, mutants | — | **The Nightmare** dans un **manège volant détraqué** (une grande roue devenue vaisseau) : il se téléporte et lâche ses nacelles. « WE WERE BROTHERS IN THE SAME FIGHT » |
| 4 | **Beer Church** | Une église transformée en bar, au crépuscule : vitraux en culs de bouteille, parvis, tonneaux | gêneurs : CRS, flics, skinheads | — | 1) **Le conteneur à verre** à démolir (§ 3 bis). 2) **Father Booze** dans son **vaisseau-tonneau à clocher**, avec une pompe à bière en guise de canon : bouteilles incendiaires, pluie de capsules. « THE MESSAGE IS IN THE BOTTLE » |
| 5 | **Black Belt** | Le quartier des dojos et des salles de sport, sur les toits, sous un soleil rouge : néons KARATE, GYM, BOXING | masculinistes, colosses | Mecha-ampli | **The Champion** dans un **ring volant à gants géants** : haltères lancés, charges. Il se relève une fois, plus fort (« makes me stronger »). « CAN'T BRING ME DOWN » |
| 6 | **I'm Bored** | Une banlieue grise sous la pluie : laverie, vidéoclub fermé, fenêtres éclairées par les écrans, rues inondées | hommes-TV, zombies connectés | Sous-marin-baignoire | **The Troll** dans une **soucoupe-satellite** : zaps en rafale, mires qui paralysent, pubs qui masquent l'écran, commentaires haineux en projectiles. « I'M SO ALONE WITHOUT YOU » |
| 7 | **Skate is a Drug** | Los Angeles au coucher du soleil : palmiers, lampadaires, donut géant, arche SKATEPARK | rollers, BMX, flics à moto | Skate | 1) **La descente en skate vue de dos** (§ 3 ter). 2) Au skatepark, retour en vue de côté : **Bonebreaker** dans son **vaisseau-half-pipe**, une rampe volante à réacteurs. « I'M NOT AFRAID TO BREAK MY BONES » |
| 8 | **Junkie Heart** | Le quartier des amours, la nuit, en rose et néons : love hotels, clubs, enseignes LOVE, XOXO, HOTEL, pluie de pétales | affairistes, cyber-flics, ninjas | Deltaplane-guitare | **The Dealer** dans un **vaisseau-cœur mécanique** qui bat : pilules rebondissantes, flèches de Cupidon. « MY HEART IS A JUNKIE » |
| 9 | **Behind the Mask** | La tour du data center, une nuit d'apocalypse : baies de serveurs, câbles, façade à escalader, toit, héliport | tous, en version élite | Deltaplane-guitare | **Docteur Mask** dans le **data center volant** (le vaisseau-mère), en 3 phases, qui reprend les armes des boss précédents. « L'IA A DÉJÀ GAGNÉ ! » |

Chaque niveau garde la couleur d'accent du premier jeu (néons, HUD) : rouge, orange, violet, ambre, rouge, bleu, cyan, rose, rouge. La ville s'abîme au fil de l'album, comme le `chaos` du premier jeu : intacte au niveau 1, en feu au niveau 9.

### 3 bis. Beer Church : le conteneur à verre
Les règles du niveau bonus du premier jeu (façon voiture de *Street Fighter II*) :
- les héros, ivres, titubent (roulis, « HIC! » qui les déportent) ;
- ils ont le temps du morceau pour démolir un gros **conteneur à verre** (environ 160 coups, toutes armes confondues) ;
- le conteneur se casse en **9 états d'usure** (fissures, trous qui montrent les bouteilles, bord arraché, il ne reste que le bas) ; chaque coup projette des éclats de verre, parfois une bouteille entière qui éclate en retombant ;
- des **gêneurs** arrivent régulièrement (3 au plus) ; les flics et les CRS repoussent le héros loin du conteneur plutôt que de le blesser ;
- conteneur détruit : prime + 100 points par seconde restante ;
- temps écoulé : le conteneur **explose** (gerbe de verre, écran blanc) et on **recommence le niveau depuis le début** ;
- à 2 joueurs, on tape à deux.

Ensuite, **Father Booze** arrive dans son vaisseau pour le combat de boss.

### 3 ter. Skate is a Drug : la descente vue de dos
On reprend la descente du premier jeu (`tuto-php/js/race/`), redessinée en pixel art Metal Slug :
- vue de dos en perspective, façon *Out Run* ; le tracé est une suite de sections (virage, dénivelé) ;
- les héros se faufilent entre les **rollers**, les **BMX** et les **flics à moto** qui arrivent par-derrière (« COPS ARE BEHIND! ») ;
- ils frappent à gauche ou à droite, comme dans *Street Racer*, et sautent les obstacles d'un **ollie** (cônes, barrières, poubelles) ;
- cœurs et vinyles à ramasser sur la route ;
- à 2 joueurs, deux skateurs côte à côte ;
- à l'arche **SKATEPARK**, le jeu repasse en vue de côté pour le boss.

## 4. Bestiaire

Pour chaque ennemi, on décrit : sa silhouette, ses attaques, ses PV, d'où il sort, et ce qu'il faut générer. Les planches existent déjà dans `ressources/sprites/ennemis/`.

**Fantassins**
- **CRS** (déjà dans l'atlas) : fusil, matraque, grenade. Variantes par teinte et réglages : bouclier, motard.
- **Skinhead néo-nazi** : bombers, rangers. Batte, bouteille lancée, pitbull en option.
- **Masculiniste** : débardeur, shaker de protéines, coach-micro casque. Charge à l'épaule, haltères lancés, cri « motivation » qui renforce les voisins.
- **Homme d'affaires ultralibéral** : costume, attaché-case. Lance des billets tranchants, appelle des vigiles, s'enfuit avec un parachute doré quand il est blessé.
- **Homme-TV** : corps de vieux téléviseur avec bras et jambes. Antenne-fouet au contact, zaps électriques à distance. Variante « écran plat » plus rapide.

**Années 80**
- **Mutant radioactif** : peau verte et pustules, marche lente. Crache une flaque toxique, se divise en deux petits.
- **Colosse disproportionné** : muscles énormes et petite tête, façon films d'action des années 80. Sort des portes de garage, encaisse beaucoup, lance des voitures et des fûts.
- **Cyber-flic** : RoboCop parodique, tir laser, armure qui ne cède qu'à l'arrière ou aux explosifs.
- **Zombie connecté** : un habitant hypnotisé par son smartphone, qui sort du sol façon *Thriller*. On le débranche au lieu de le tuer.
- **Ninja d'entreprise** : saute de plateforme en plateforme.

**Riders de la descente en skate** (à générer, vus de dos) : **roller** (skinhead en rollers), **BMX** (gym bro), **flic à moto**. Chacun : rouler, attaquer à gauche et à droite, touché, chute.

**Gros méchants des points d'apparition** : le colosse, un CRS à bouclier géant, un mutant géant. Une porte de garage ou une grotte qui s'ouvre (animation de décor) annonce l'arrivée d'une vague ou d'un gros.

**Sprites** : fiches et prompts dans `ressources/prompts/ennemis.md`. Chaque méchant a une planche en **grille régulière** : marche, attente, corps à corps, attaque à distance, spécial, touché, mort. Les planches vont dans `ressources/sprites/ennemis/{id}.png` (`tools/sprites.json`, section `ennemis`), les projectiles dans `projectiles.png`. `tools/build_sprites.py` les ajoute à l'atlas, et la galerie `index.html` les affiche.

## 5. Boss : les méchants du premier jeu dans des vaisseaux

- Chaque boss est **le méchant du premier jeu** (son look vient de `tuto-php/src/Sprite/Boss/*.php`, redessiné dans le style Metal Slug), **visible dans le cockpit** d'un vaisseau qui reprend le thème de sa chanson (§ 3).
- Les vaisseaux sont **énormes** et débordent de l'écran. Ils sont faits de plusieurs pièces (coque, cockpit, canons, trappes), chacune avec ses PV et son animation de destruction.
- 2 ou 3 phases par boss : les pièces sautent, l'arme change, puis vient une rage finale. À la fin, le pilote est éjecté (cri, réplique, chute comique).
- À force d'encaisser, le vaisseau perd des morceaux : une lettre de bonus tombe tous les 40 PV perdus, et des vinyles à chaque pièce détruite. Les vinyles explosent au contact du vaisseau et lui font double dégâts ; lancés vers le haut, ils l'atteignent. Les missiles R vont chercher ses pièces. Chaque coup lui fait 60 % de dégâts en plus (`dmgFactor`).
- **Il se dégrade à vue d'œil** : la coque passe à l'image abîmée sous 60 % de vie, s'assombrit et rougit, fume de plus en plus, crache des étincelles, puis prend feu. Les télés (hommes-TV, télé géante) font de même : fumée par le haut de l'écran, étincelles, flammes, assombrissement. Tout ennemi touché flashe en blanc.
- Des projectiles loufoques tirés du thème : lettres de licenciement, roquettes, nacelles, bouteilles, haltères, mires TV, pilules.
- Côté technique, un boss est un **assemblage de pièces** (sprites séparés + script de phases en données), pas un seul gros sprite animé. Il demande moins d'images à générer et permet la destruction progressive.

**Génération via Figma** (même fichier et même modèle que les ennemis) : une planche par boss, en 1536 × 1024, fond magenta uni, grille régulière :
- le **pilote** en buste dans son cockpit : attente, ordre ou tir, touché, rage, éjecté ;
- la **coque** : intacte, abîmée, détruite ;
- les **pièces d'armes** : repos, tir, détruite ;
- des **débris** pour l'explosion.

Les prompts vont dans `ressources/prompts/boss.md`, les planches dans `ressources/sprites/boss/{id}.png`, la disposition dans la section `boss` de `tools/sprites.json`, découpée par `tools/build_sprites.py`. Mêmes règles de contrôle que pour les ennemis : orienté vers la gauche (il fait face aux héros), aucun texte ni logo, même échelle dans toutes les cases.

| Boss | id | Vaisseau |
|---|---|---|
| The Manager | `manager` | open-space volant |
| The General | `general` | forteresse volante |
| The Nightmare | `nightmare` | manège volant détraqué |
| Father Booze | `priest` | vaisseau-tonneau à clocher |
| The Champion | `champion` | ring volant à gants géants |
| The Troll | `troll` | soucoupe-satellite |
| Bonebreaker | `bonebreaker` | vaisseau-half-pipe |
| The Dealer | `dealer` | vaisseau-cœur mécanique |
| Docteur Mask | `mask` | data center volant |

Le mi-boss du niveau 1 (la télé géante) reste un ennemi à pied, sans vaisseau.

## 6. Armes et bonus

Comme les lettres de Metal Slug (H, S, F, L, R), mais à la sauce rock. Ils sortent des caisses, des ennemis porteurs et des habitants libérés (§ 10). Chaque arme a des munitions limitées. Quand elles sont vides, le héros revient au médiator.

| Lettre | Arme | Effet |
|---|---|---|
| — | Médiator | tir de base, illimité |
| **L** | Larsen | rafale rapide (la mitrailleuse lourde) |
| **P** | Power chord | tir en éventail à courte portée (le fusil à pompe) |
| **F** | Pyro de scène | lance-flammes |
| **S** | Laser de scène | rayon continu qui traverse |
| **R** | Ampli-roquette | roquettes à tête chercheuse |
| **V** | Vinyles + | 5 vinyles de plus (on part sans : ils se gagnent) ; plus tard, le « vinyle d'or » qui rebondit et explose deux fois |

Ramasser deux fois la même lettre augmente les munitions et la puissance. Les 4 héros ont les mêmes armes, pour l'équilibrage. À 2 joueurs, chacun a ses propres armes et munitions, et son **tir de couleur** (orange pour J1, bleu pour J2, déjà dans l'atlas). Plus tard, en option : un petit bonus propre à chaque héros.

## 7. Véhicules à piloter

Comme les Slugs, chaque véhicule a sa propre barre de vie. On en sort avec saut + bas, et il explose en dernier recours : le héros éjecté fait des dégâts autour de lui.
- **Van de tournée** (le tank, niveau 2) : canon à vinyles orientable sur 180°, écrase les petits ennemis.
- **Mecha-ampli** (niveau 5) : marcheur qui saute haut, onde sonore en cône.
- **Sous-marin-baignoire** (niveau 6) : pour les rues inondées.
- **Deltaplane-guitare** (niveaux 8 et 9) : passages en vol, avec défilement libre.
- **Skate** (niveau 7) : la descente vue de dos (§ 3 ter), qui a son propre mode de jeu.

Le héros reste visible dans le cockpit : on réutilise son sprite idle ou de tir. À 2 joueurs, le second monte dans le véhicule libre ou reste à pied.

## 8. Bande-son

- Les 9 morceaux viennent du premier jeu : `~/projects/tuto-php/medias/audio/Vigilante - Behind the Mask/`. On les copie dans `public/assets/audio/01.mp3` … `09.mp3`, avec `paroles.md`.
- **Chaque niveau joue son morceau**, en boucle. Fondu à l'arrivée du boss, reprise après.
- Titre et sélection des joueurs : piste 2 (*Metal Slug*). Intro : piste 9. Fin et générique : piste 5.
- Beer Church : le chrono du conteneur dure à peu près le morceau, comme dans le premier jeu.
- Les bruitages (tirs, explosions, cris) passent par-dessus, via le gestionnaire de sons de Phaser (`src/audio/`).
- **L'annonceur**, comme dans Metal Slug, crie à la place de « HEAVY MACHINE GUN! » :
  - « HEAVY LARSEN! », « POWER CHORD! », « VINYL BOMB! » quand on ramasse une lettre ;
  - « MISSION ONE! START! », « GO! », « MISSION COMPLETE! », « GAME OVER » ;
  - le nom du héros choisi sur l'écran titre.

  L'otage dit « THANK YOU! », et le mégaphone du Manager « BACK TO WORK! ». Voix synthétisées par Piper puis retravaillées par ffmpeg, et bruitages synthétisés : `tools/build_sounds.py`, d'après `tools/sons.json`.

## 9. Mode 2 joueurs et sélection des joueurs

**2 joueurs au plus en même temps.** Le jeu, la caméra, le HUD et l'équilibrage sont pensés pour 1 ou 2 héros à l'écran, jamais 3 ou 4.

### L'écran de garde et la sélection, façon Metal Slug
L'écran de garde est fait à la manière de celui de Metal Slug :
- le **logo VIGILANTE / BEHIND THE MASK** en grand, traité comme le titre de Metal Slug : lettres orange en dégradé, contour sombre, ombre portée. Il est préparé par `tools/build_logo.py` depuis `ressources/sources/logo-vigilante-titre.png` ;
- PUSH START!, le copyright et les crédits ;
- la rue qui défile derrière.

Sans rien toucher pendant 25 s, la démo tourne en attraction.

Puis vient la sélection, comme le « SOLDIER SELECT » de Metal Slug :
- 4 cases dans l'ordre **Pierre, Baptiste, Arnaud, Erwan**, avec un **portrait caricatural, toon**, façon Metal Slug (générés dans Figma : `ressources/sources/select-portraits.png`, découpés et grisés par `tools/build_select.py`). Le chanteur ne ressemble pas encore tout à fait à Pierre : à regénérer un jour ;
- les portraits sont **grisés**, sauf celui sous le curseur, en couleur ; le nom est sur une plaque de métal en dessous ;
- un curseur **P1 orange** et un curseur **P2 bleu** : deux curseurs au plus, donc deux héros choisis, les deux autres restent dans leur case ;
- un compte à rebours de 30 s ; à zéro, le héros sous le curseur est pris ;
- un héros ne peut être choisi qu'une fois ;
- à la validation, l'annonceur crie le nom du héros, son portrait flashe, et des **rideaux de fer** tombent sur les autres.

Le fond (un mur de plaques rivetées) est dessiné par l'outil. Le mur généré dans Figma (fichier « niveau 1 », nœud 8:2) n'a pas pu être téléchargé : si on l'exporte dans `ressources/sources/select-fond.png`, l'outil le prend à la place.

### Jouer à deux
- J2 peut **rejoindre à tout moment** avec sa touche Start, comme on insère un crédit : on repasse brièvement par la sélection, parmi les héros libres.
- Commandes : les flèches + 6 boutons Q S D / W X C (W tir, X saut, C vinyle, Q corps à corps, S viser sans bouger, D **attaque en skate**), et Entrée pour Start. L'attaque en skate vient du premier jeu : le héros fonce sur sa planche 0,6 s, invulnérable, renverse ennemis et caisses sur son passage, puis attend 1,2 s. Le 2e joueur est prêt dans le code mais désactivé pour l'instant (`TWO_PLAYERS`) ; ses touches et les **manettes** (Gamepad API) viendront avec lui.
- **Caméra partagée** : aucun joueur ne sort de l'écran, et le plus en retard bloque le défilement.
- **HUD séparés** : vies, score, arme et munitions de chaque joueur, en haut à gauche et en haut à droite.
- Plus d'ennemis et plus de PV pour les boss à deux.

## 10. Décor, relief et points d'apparition
- **Collisions** : on sépare l'image du décor de sa géométrie. Chaque niveau a un fichier de données qui décrit :
  - la ligne de sol (marches, pentes) ;
  - les **plateformes traversables** par le dessous (on monte en sautant, on descend avec bas + saut) ;
  - les murs ;
  - les zones d'eau ou de vide.
- **Éditeur dans le jeu** : dans `demo.html`, un mode éditeur dessine sol, plateformes et murs à la souris, directement sur le décor. On teste aussitôt en jouant, puis on exporte le JSON du niveau (`src/data/levels/{niveau}.json`).
- **Points d'apparition** : une porte de garage, une grotte ou une plaque d'égout est un objet de décor animé (fermé → ouverture → ouvert). Il libère une liste d'ennemis quand la caméra arrive, ou à chaque vague. Certains se détruisent et arrêtent les apparitions.
- **Objets** : caisses et barils destructibles, et **habitants à libérer** (casque-écran sur la tête, branchés à l'IA), qui donnent un bonus quand on les débranche, comme les otages de Metal Slug.
- **Format des décors à générer** (via Figma) : le même que `ressources/sources/ms-bg.png`, c'est-à-dire une bande de 342 px de haut pour le plan de jeu, avec les éléments détachés en dessous. On y ajoute une couche de ciel/fond et une couche de premier plan pour la parallaxe. `tools/build_decor.py` est généralisé à un niveau = un dossier d'images : `public/assets/levels/01-walk-straight/` … `09-behind-the-mask/`. Les prompts vont dans `ressources/prompts/decors.md`.

## 11. Architecture du code

**Phaser 4** (moteur), **Vite** (serveur de dev et build), JavaScript moderne en modules ES et en classes, tout installé par npm (`node_modules/`, aucun import par URL). Les décisions de fond :

- **La logique du jeu ne dépend pas de Phaser.** Acteurs, monde, IA, scénario : des classes pures qui reçoivent une entrée (`{ inp, press }`) et un `dt`. On peut les faire tourner dans Node (tests, rejeu image par image). Phaser charge, boucle, lit le clavier et dessine.
- **Le rendu lit l'état, il ne le modifie jamais** (`views/`). Les objets Phaser sont réutilisés d'une image à l'autre (`ImagePool`), aucun n'est créé en cours de jeu.
- **Une scène Phaser par écran** (titre, sélection, jeu, Beer Church, skate, histoire), et le HUD en scène parallèle.
- **Les données à part du code** : réglages dans `src/config/`, géométrie et vagues des niveaux dans `src/data/levels/` (JSON exporté par l'éditeur).
- **Physique maison, pas Arcade** : sol en ligne brisée, plateformes traversables, murs. C'est simple, déterministe, et ça reste dans la logique sans Phaser.
- **L'atlas** : `tools/build_sprites.py` écrit `sprites.json` (l'index lu par la logique : anims, ancrages, bouches de tir) et `sprites.atlas.json` (les mêmes images au format Phaser, avec leur point d'ancrage).

```
index.html (galerie)  demo.html (banc d'essai : démo, galerie, inspecteur des images)
vite.config.js  eslint.config.js  package.json
public/assets/          # images servies telles quelles : sprites/, decor/, (audio/)
src/
  createGame.js         # config Phaser commune : pixelArt, agrandissement, pas de temps brut
  config/               # réglages : écran, héros, anims, combat, touches, niveaux, couleurs
  data/sprites.js       # index de l'atlas, noms des frames Phaser
  data/levels/          # un JSON par niveau : décor, sol, éléments, habitants, déclencheurs, boss
  data/levelSprites.js  # l'atlas du niveau (décor, habitants, boss)
  game/                 # la logique, sans Phaser
    actors/             # Actor → Hero, Enemy (IA réglée par config/enemies.js) ; Hostage, Pickup
    world/              # World (update + resolve), Level, Terrain (sol, blocs, plateformes), Prop, Effects
    bosses/             # BossPart + un fichier par boss (ManagerBoss)
    session/            # GameSession : joueurs, vies, scores, déclencheurs, messages, fin
    demo/               # DemoScript + Autopilot (le scénario), DemoSession
  input/                # KeyboardPad, une manette par joueur (2 au plus), puis les manettes physiques
  scenes/               # Boot, Title, Game + GameHud ; Demo + Hud, Parade (puis Select, Bonus, Race, Story)
  views/                # WorldView, ImagePool : l'état du monde → objets Phaser
  devtools/             # éditeur de niveau (EditorScene, F2 en dev), inspecteur, boutons des outils
  pages/                # point d'entrée de chaque page HTML
  styles/               # base.css, un fichier par composant, un assemblage par page
tools/                  # Python : build_sprites.py, build_level.py (+ niveaux/*.json), phaser_atlas.py, build_decor.py ;
                        # vite-level-editor.js (l'éditeur enregistre le JSON du niveau)
ressources/             # sources, références, prompts
```

À venir dans `src/game/` : `vehicles/`, `bonus/` (le conteneur, porté de `tuto-php/js/bonus/`), `race/` (la descente, portée de `tuto-php/js/race/`), `story/` (repris de `tuto-php/config/story.php`). L'éditeur de niveau vit dans `src/devtools/` et n'est pas livré dans le build.

## 12. Étapes

Le principe : **un niveau 1 complet (tranche verticale) avant de produire les autres.** Les 2 joueurs sont pensés dès le départ (entrées, caméra), pour ne pas tout reprendre à la fin.

| # | Contenu | Fin quand… |
|---|---|---|
| 0 | ✓ Phaser 4 + Vite, découpe en modules, `git init` | la démo tourne à l'identique (vérifié image par image) |
| 1 | ✓ Contrôle joueur, physique (marches, blocs, plateformes traversables), éditeur de niveau, géométrie de la rue ; **2 joueurs** | on traverse la rue en sautant sur les plateformes |
| 2 | ✓ Vagues, portes de garage animées, arènes, vies, K.O., caisses et barils | la rue se joue jusqu'à l'arène du boss |
| 3 | ✓ Armes et bonus (médiator, L, P, V), habitants à libérer, corps à corps au contact | on ramasse et on change d'arme |
| 4 | ✓ Boss en pièces + la télé géante + **le Manager dans son open-space volant** | **le niveau 1 est complet** |
| 5 | En partie : écran de garde (PRESS START, démo en attraction), **sélection façon « SOLDIER SELECT »** (portraits grisés, compte à rebours, rideaux de fer, nom crié par l'annonceur), game over et continue, morceau du niveau, scores, bruitages. Reste : le juice, l'équilibrage, le 2e joueur | une partie complète du niveau 1, seul ou à deux |
| 6 | Véhicules + van de tournée ; niveau 2 (*Metal Slug*, le General) | 2 niveaux |
| 7 | Niveaux 3, 5, 6, 8 et 9, un par un : décor, ennemis, boss-vaisseau, véhicule ; armes F, S, R au fil des niveaux | 7 niveaux |
| 8 | Niveau 4, **Beer Church** (conteneur + Father Booze), et niveau 7, **Skate is a Drug** (descente vue de dos + Bonebreaker) | les 9 niveaux |
| 9 | Intro, fin, générique ; équilibrage ; GitHub Pages ; plus tard, port OpenBOR / Recalbox | — |

**Production graphique** (générée via Figma par l'utilisateur, en parallèle du code) :
- pour chaque niveau : son décor et son boss-vaisseau ;
- les riders du skate (vus de dos), le conteneur à verre (9 états d'usure), l'écran de sélection ;
- les animations manquantes des 4 héros : touché, mort, victoire, lancer, corps à corps, tir en saut vers le bas, pilotage, **skate vu de dos**, **ivresse** (Beer Church). En attendant, on les remplace par des poses procédurales.

Les prompts sont rangés dans `ressources/prompts/`.

### Où en est le niveau 1
Jouable de bout en bout, seul ou à deux : titre → mission → 11 déclencheurs (dont 3 arènes) → la télé géante → le Manager → MISSION COMPLETE → titre.

- **Images** : générées dans Figma (fichier « Behind the Mask — niveau 1 », prompts dans `ressources/prompts/niveau-1.md`).
- **Décor** : la rue de nuit de la démo, répétée, plus les éléments de décor posés dessus. Le décor propre au morceau (« petit matin gris ») reste à faire.
- **Vérification** : une simulation sans rendu (joueurs automatiques) le termine seul et à deux.

À faire :
- équilibrage (PV, cadences, nombre d'ennemis) ;
- ennemis lâchés par les balcons avec une vraie anim de chute ;
- la jauge de garde du Manager (« BACK TO WORK! » après 3 coups).

## 13. Points ouverts
- Le titre définitif.
- Les noms et les lettres définitives des armes.
- Le ton des caricatures politiques : jusqu'où on pousse le trait.
