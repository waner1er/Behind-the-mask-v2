"""Découpe la planche générée des 4 persos en un atlas PNG transparent + un index JSON.

Usage : python3 tools/extract_persos.py ressources/sources/behind-the-mask-persos-sprites.png public/assets/persos
Sortie : persos.png (atlas) et persos.json (index des images, ancrées aux pieds).
Dépendances : numpy, scipy, pillow.

La planche n'a ni transparence ni grille régulière : pour chaque case (perso × action),
le fond est la couleur médiane de la case ; tout ce qui s'en écarte est le perso.
Chaque silhouette devient une image, ancrée au milieu des pieds.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

# Bandes (y) des persos et colonnes (x) des actions, relevées sur la planche 1536 × 1024.
BANDS = {'arnaud': (70, 252), 'baptiste': (326, 507), 'erwan': (582, 766), 'pierre': (834, 1010)}
COLS = {
    'idle': (192, 287), 'walk': (290, 434), 'run': (437, 583), 'jump': (587, 706), 'crouch': (709, 804),
    'up': (890, 1004), 'diagup': (1007, 1114), 'right': (1117, 1219),
    'diagdown': (1222, 1324), 'left': (1327, 1429), 'down': (1432, 1525),
}
# Images par case : 2 rangées (sans / avec instrument pour idle, marche, course).
EXPECTED = {'idle': 4, 'walk': 6, 'run': 4, 'jump': 4, 'crouch': 4}
THRESHOLD = 30      # écart de couleur au fond (RGB) au-delà duquel un pixel appartient au perso
MIN_AREA = 150      # en dessous : poussière, ou bout d'arme détaché à rattacher
BG_DIFF = 14       # écart moyen au fond au-delà duquel un trou est du vêtement, pas du fond
MAX_HOLE = 40       # les trous plus grands sont du fond enfermé (entre un bras et l'arme)
ATTACH = 10         # distance max (px) pour rattacher un petit morceau à une silhouette


def cell_mask(cell):
    bg = np.median(cell.reshape(-1, 3), axis=0)
    d = np.sqrt(((cell - bg) ** 2).sum(axis=2))
    m = d > THRESHOLD
    m[:3, :] = m[-3:, :] = m[:, :3] = m[:, -3:] = False   # lignes de séparation de la planche
    m = ndi.binary_closing(m, iterations=1)
    # trous : petits, ou d'une couleur qui n'est pas celle du fond (vêtement sombre) → bouchés ;
    # grands et couleur du fond (entre un bras et l'arme) → laissés transparents
    holes, n = ndi.label(ndi.binary_fill_holes(m) & ~m)
    if n:
        idx = range(1, n + 1)
        sizes = ndi.sum(np.ones_like(holes), holes, idx)
        diff = ndi.mean(d, holes, idx)
        keep = [i + 1 for i in range(n) if sizes[i] < MAX_HOLE or diff[i] > BG_DIFF]
        m |= np.isin(holes, keep)
    return m


def split_wide(lab, idx, width):
    """Deux images collées : on coupe à la colonne la plus creuse du milieu."""
    obj = lab == idx
    cols = obj.sum(axis=0)
    xs = np.nonzero(cols)[0]
    a, b = xs[0] + width // 3, xs[-1] - width // 3
    cut = a + int(np.argmin(cols[a:b]))
    nxt = lab.max() + 1
    right = obj.copy()
    right[:, :cut] = False
    lab[right] = nxt
    return lab


def frames_of(cell, expected):
    m = cell_mask(cell)
    lab, n = ndi.label(m)
    areas = ndi.sum(m, lab, range(1, n + 1))
    # les « expected » plus grandes silhouettes sont les images ; le reste, des morceaux
    big = sorted((i + 1 for i in range(n) if areas[i] >= MIN_AREA), key=lambda i: -areas[i - 1])[:expected]
    # il en manque : deux images collées, on coupe la plus large
    while 0 < len(big) < expected:
        widths = {i: np.ptp(np.nonzero((lab == i).any(axis=0))[0]) + 1 for i in big}
        widest = max(widths, key=widths.get)
        lab = split_wide(lab, widest, widths[widest])
        big.append(int(lab.max()))
    # petits morceaux (bout de baguette, de jack…) : rattachés à la silhouette la plus proche
    for i in range(1, n + 1):
        if i in big or (lab == i).sum() < 6:
            continue
        piece = lab == i
        best, bestd = None, ATTACH + 1
        for j in big:
            d = ndi.distance_transform_edt(~(lab == j))[piece].min()
            if d < bestd:
                best, bestd = j, d
        if best is not None:
            lab[piece] = best
    out = []
    for j in big:
        obj = lab == j
        ys, xs = np.nonzero(obj)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        feet = xs[ys >= y1 - 8]
        out.append({'box': (x0, y0, x1, y1), 'mask': obj[y0:y1, x0:x1],
                    'ax': int(round(feet.mean())) - x0, 'cy': (y0 + y1) / 2, 'cx': (x0 + x1) / 2})
    # ordre de lecture : rangée du haut puis du bas, de gauche à droite
    mid = cell.shape[0] / 2
    out.sort(key=lambda f: (f['cy'] > mid, f['cx']))
    for f in out:
        f['row'] = 1 if f['cy'] > mid else 0
    return out


def runs(row):
    """Segments opaques [début, fin) d'une rangée de pixels."""
    xs = np.nonzero(row)[0]
    if not len(xs):
        return []
    cuts = np.nonzero(np.diff(xs) > 1)[0]
    starts = np.r_[xs[0], xs[cuts + 1]]
    ends = np.r_[xs[cuts] + 1, xs[-1] + 1]
    return list(zip(starts.tolist(), ends.tolist()))


def legs(mask, ax):
    """Jambes d'une image de marche/course, pour les animer à part (comme Metal Slug).

    hip   : rangée des hanches (au-dessus : le buste, fixe) ;
    split : pour chaque rangée sous les hanches, la colonne qui sépare jambe arrière / avant
            (milieu du plus grand vide entre les deux jambes ; là où les cuisses se touchent,
            on garde la séparation de la rangée du dessous) ;
    stride: écart entre les deux pieds, en pixels.
    """
    h = mask.shape[0]
    hip = int(h * 0.57)
    split, cur = [], ax
    feet = None
    for y in range(h - 1, hip - 1, -1):
        rs = runs(mask[y])
        gaps = [(b2 - e1, (e1 + b2) // 2) for (b1, e1), (b2, e2) in zip(rs, rs[1:]) if b2 - e1 >= 2]
        if gaps and y > hip + 3:
            cur = max(gaps)[1]
        split.append(cur)
        if feet is None and len(rs) >= 2 and y < h - 2:
            left = [r for r in rs if r[1] <= cur]
            right = [r for r in rs if r[0] >= cur]
            if left and right:
                feet = (sum(left[0]) / 2, sum(right[-1]) / 2)
    split.reverse()
    stride = int(round(feet[1] - feet[0])) if feet else 12
    return {'hip': hip, 'split': split, 'stride': max(stride, 8)}


def main(sheet, dest):
    src = np.array(Image.open(sheet).convert('RGB'))
    imf = src.astype(int)
    tiles, index = [], {}
    for who, (y0, y1) in BANDS.items():
        index[who] = {}
        for act, (x0, x1) in COLS.items():
            frames = frames_of(imf[y0:y1, x0:x1], EXPECTED.get(act, 2))
            index[who][act] = []
            for f in frames:
                bx0, by0, bx1, by1 = f['box']
                rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
                rgba[..., :3] = src[y0 + by0:y0 + by1, x0 + bx0:x0 + bx1]
                rgba[..., 3] = f['mask'] * 255
                entry = {'row': int(f['row']), 'ax': int(f['ax']), 'tile': len(tiles)}
                if act in ('walk', 'run'):
                    entry['legs'] = legs(f['mask'], int(f['ax']))
                index[who][act].append(entry)
                tiles.append(Image.fromarray(rgba))
    # atlas : rangées de 1024 px de large
    x = y = rowh = 0
    pos = []
    for t in tiles:
        if x + t.width > 1024:
            x, y, rowh = 0, y + rowh + 1, 0
        pos.append((x, y))
        x += t.width + 1
        rowh = max(rowh, t.height)
    atlas = Image.new('RGBA', (1024, y + rowh), (0, 0, 0, 0))
    for t, p in zip(tiles, pos):
        atlas.paste(t, p)
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    atlas.save(dest / 'persos.png', optimize=True)
    for who in index.values():
        for frames in who.values():
            for f in frames:
                t, (px, py) = tiles[f['tile']], pos[f.pop('tile')]
                f.update({'x': int(px), 'y': int(py), 'w': t.width, 'h': t.height})
    (dest / 'persos.json').write_text(json.dumps(index, separators=(',', ':')))
    # même index en script : la page marche aussi ouverte en file:// (pas de fetch)
    for who, acts in index.items():
        print(who, {a: len(fr) for a, fr in acts.items()})


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
