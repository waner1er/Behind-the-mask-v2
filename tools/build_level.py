"""Découpe les planches d'un niveau (décor, boss, habitants) en un atlas pour Phaser.

Usage : python3 tools/build_level.py tools/niveaux/01-walk-straight.json
La description du niveau (JSON) liste ses planches : fichier, grille, échelle, et pour chaque
image (ou anim) les cases qui la composent, comptées à partir de 1 [rangée, colonne].

Pour chaque planche, `ancrage` dit où tombe le point d'ancrage d'une image :
  - "case" (défaut) : au milieu de la case, sur la ligne de base de sa rangée (le bas le plus
    bas des images de la rangée). Les images d'une même anim restent calées entre elles ;
  - "centre" : au centre de l'image (débris, projectiles).
  - "bas" : au milieu du bas de l'image (éléments de décor, posés chacun à sa hauteur).
Une image peut avoir sa propre échelle (`echelle`) et être `eclatee` : ses morceaux séparés
deviennent des images distinctes (de gauche à droite).

Sortie, dans le dossier `sortie` : {nom}.png (atlas), {nom}.json (index : anims, fps, images
[x, y, w, h, ax, ay]) et {nom}.atlas.json (format Phaser, frames {anim}/{k} avec leur ancrage).
Une image de contrôle par planche dans {dossier de la planche}/_controle/.
Dépendances : numpy, scipy, pillow.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

from build_sprites import ENEMY_LINE, pack, shrink, slice_sheet
from phaser_atlas import frame as phaser_frame

ROOT = Path(__file__).resolve().parent.parent


def cells_of(spec):
    """[(rangée, colonne)] d'une image ou d'une anim (cases comptées à partir de 1)."""
    cases = spec['cases'] if isinstance(spec, dict) else spec
    return [(r - 1, c - 1) for r, c in cases]


def baselines(cells):
    """Ligne de base de chaque rangée : le bas le plus bas de ses images."""
    out = {}
    for (r, _), cell in cells.items():
        out[r] = max(out.get(r, 0), cell['box'][3])
    return out


def pieces(cell, min_share=0.01):
    """Les morceaux séparés d'une case, de gauche à droite (boîte globale, masque)."""
    x0, y0, _, _ = cell['box']
    lab, n = ndi.label(cell['mask'], structure=np.ones((3, 3)))
    total = cell['mask'].sum()
    out = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        mask = lab[sl] == i + 1
        if mask.sum() >= total * min_share:
            out.append(((x0 + sl[1].start, y0 + sl[0].start, x0 + sl[1].stop, y0 + sl[0].stop), mask))
    return sorted(out, key=lambda p: p[0][0])


def read_sheet(spec, warn):
    path = ROOT / spec['fichier']
    if not path.exists():
        warn.append(f'planche absente : {spec["fichier"]}')
        return {}, None
    src, cells, grid = slice_sheet(path, spec['colonnes'], spec['rangees'], spec.get('trait', ENEMY_LINE))
    base = baselines(cells)
    mode = spec.get('ancrage', 'case')
    anims, marks = {}, []
    for name, img in spec['images'].items():
        s = img.get('echelle', spec['echelle']) if isinstance(img, dict) else spec['echelle']
        frames = []
        for rc in cells_of(img):
            cell = cells.get(rc)
            if not cell:
                warn.append(f'{path.name} : case vide {rc[0] + 1},{rc[1] + 1} ({name})')
                continue
            parts = pieces(cell) if isinstance(img, dict) and img.get('eclatee') else [(cell['box'], cell['mask'])]
            for box, mask in parts:
                x0, y0, x1, y1 = box
                if mode == 'centre' or len(parts) > 1:
                    ax, ay = (x1 - x0) / 2, (y1 - y0) / 2
                elif mode == 'bas':
                    ax, ay = (x1 - x0) / 2, y1 - y0
                else:
                    cx0, _, cx1, _ = cell['cell']
                    ax, ay = (cx0 + cx1) / 2 - x0, base[rc[0]] - y0
                frames.append({'img': shrink(src, box, mask, s), 'ax': ax * s, 'ay': ay * s})
                marks.append((box, (x0 + ax, y0 + ay)))
        if frames:
            fps = img.get('fps', 8) if isinstance(img, dict) else 8
            loop = img.get('boucle', True) if isinstance(img, dict) else True
            anims[name] = {'fps': fps, 'loop': loop, 'frames': frames}
    return anims, (src, marks, path)


def control(src, marks, path):
    im = Image.fromarray(src).convert('RGB')
    d = ImageDraw.Draw(im)
    for (x0, y0, x1, y1), (ax, ay) in marks:
        d.rectangle((x0, y0, x1 - 1, y1 - 1), outline=(255, 255, 0))
        d.rectangle((ax - 4, ay - 4, ax + 4, ay + 4), fill=(0, 255, 0))
    out = path.parent / '_controle' / path.name
    out.parent.mkdir(exist_ok=True)
    im.save(out)


def main(config):
    spec = json.loads(Path(config).read_text())
    warn, anims = [], {}
    for sheet in spec['planches'].values():
        got, ctl = read_sheet(sheet, warn)
        anims.update(got)
        if ctl:
            control(*ctl)
    atlas = pack([anims])
    index, frames = {}, {}
    for name, a in anims.items():
        entries = []
        for k, f in enumerate(a['frames']):
            (x, y), im = f['pos'], f['img']
            e = [x, y, im.width, im.height, round(f['ax']), round(f['ay'])]
            entries.append(e)
            frames[f'{name}/{k}'] = phaser_frame(e)
        index[name] = {'fps': a['fps'], 'loop': a['loop'], 'frames': entries}
    dest = ROOT / spec['sortie']
    dest.mkdir(parents=True, exist_ok=True)
    nom = spec['nom']
    atlas.save(dest / f'{nom}.png', optimize=True)
    (dest / f'{nom}.json').write_text(json.dumps({'anims': index}, separators=(',', ':')))
    (dest / f'{nom}.atlas.json').write_text(json.dumps(
        {'frames': frames, 'meta': {'image': f'{nom}.png', 'format': 'RGBA8888', 'scale': '1'}}, separators=(',', ':')))
    for name, a in index.items():
        w, h = a['frames'][0][2:4]
        print(f'{name:16} {len(a["frames"])} image(s)  {w}×{h}')
    print(f'atlas {atlas.width}×{atlas.height} → {spec["sortie"]}/{nom}.png')
    for w in warn:
        print('  !', w)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'tools/niveaux/01-walk-straight.json')
