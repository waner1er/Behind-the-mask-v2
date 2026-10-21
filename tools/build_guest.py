"""Découpe les planches d'un invité (un perso hors du groupe : Guillaume, au chant sur Metal Slug)
en un petit atlas à part, sans toucher à l'atlas des héros.

Usage : python3 tools/build_guest.py [guillaume]
Planches : ressources/sprites/{id}-deplacements.png, -tir.png, -actions.png (même format que les
héros, voir ressources/prompts-sprites.md ; générées dans le fichier Figma du projet).
Écrit public/assets/sprites/guest/{id}.png, {id}.json (index au format de sprites.json, sans
effets) et {id}.atlas.json (frames Phaser persos/{id}/{anim}/{k}). Contrôle de la découpe :
ressources/sprites/_controle/{id}-*.png. Réutilise la découpe de build_sprites.py.
"""
import json
import sys

import build_sprites as bs
import phaser_atlas


def main(who):
    src = bs.ROOT / 'ressources/sprites'
    dest = bs.ROOT / 'public/assets/sprites/guest'
    warn = []
    anims = bs.read_perso(src, who, src / '_controle', warn)
    if not anims:
        sys.exit(f'aucune planche {who}-*.png dans {src}')
    atlas = bs.pack([anims], width=1024)
    h = bs.LAYOUT['hauteur']
    every = [a[3] for p in bs.LAYOUT['planches'].values() for a in p['anims']]
    index = {'persos': {who: {
        'source': 'planches', 'hauteur': h, 'hanches': round(h * bs.LAYOUT['hanches']),
        'manque': [n for n in every if n not in anims],
        'anims': {n: bs.anim_entry(n, a) for n, a in anims.items()},
    }}, 'fx': {}}
    dest.mkdir(parents=True, exist_ok=True)
    atlas.save(dest / f'{who}.png', optimize=True)
    (dest / f'{who}.json').write_text(json.dumps(index, separators=(',', ':')))
    (dest / f'{who}.atlas.json').write_text(json.dumps(phaser_atlas.phaser_atlas(index, f'{who}.png'), separators=(',', ':')))
    print(f"{who} : {len(anims)} anims, manque : {', '.join(index['persos'][who]['manque']) or '—'}")
    for w in warn:
        print('  !', w)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'guillaume')
