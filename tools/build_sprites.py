"""Découpe les planches de sprites générées en un atlas pour la démo (demo.html) et la galerie (index.html).

Usage : python3 tools/build_sprites.py [ressources/sprites] [public/assets/sprites]
Planches attendues dans le dossier source (prompts : ressources/prompts-sprites.md) :
  {perso}-deplacements.png, {perso}-tir.png, {perso}-actions.png, effets.png
La disposition des cases est dans tools/sprites.json.

Un perso sans planche reprend l'ancienne (public/assets/persos/, voir extract_persos.py), convertie
au même format ; les effets absents sont dessinés ici en attendant la vraie planche.

L'ennemi CRS vient d'une planche libellée (ressources/sources/, section « crs » de
tools/sprites.json) et rejoint le même atlas, sous S.persos.crs, avec le même format d'images
donc le même code de dessin que les persos.

Les autres méchants viennent de planches en grille régulière (ressources/sprites/ennemis/{id}.png,
prompts : ressources/prompts/ennemis.md, section « ennemis » de tools/sprites.json) et rejoignent
aussi S.persos ; leurs projectiles (projectiles.png) rejoignent S.fx. Un méchant sans planche est
absent de l'atlas.

Sortie : sprites.png (atlas), sprites.json (l'index lu par le jeu : anims, ancrages, bouches de
tir) et sprites.atlas.json (les mêmes images au format Phaser, voir phaser_atlas.py). Pour chaque planche lue, une image de contrôle dans {source}/_controle/ : cases,
ligne de sol, point d'ancrage (vert) et bouche de tir (rouge).
Retouches à la main : tools/sprites-ajustements.json, {"arnaud/walk/3": [dx, dy]} décale
l'ancrage d'une image (en pixels de sortie).
Dépendances : numpy, scipy, pillow.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

import phaser_atlas

ROOT = Path(__file__).resolve().parent.parent
LAYOUT = json.loads((ROOT / 'tools/sprites.json').read_text())
DIRS = LAYOUT['directions']
LINE = 0.6        # part de pixels non magenta au-delà de laquelle une rangée est un trait de grille
MIN_AREA = 12     # en dessous : poussière
ENEMY_LINE = 0.9  # même seuil pour les planches de méchants (le colosse occupe 85 % de sa case)


# --- découpe d'une planche ---------------------------------------------------------------------
def magenta(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r > 140) & (b > 140) & (r - g > 70) & (b - g > 70) & (np.abs(r - b) < 90)


def bounds(lines, n, size):
    """Limites des cases : les traits détectés s'il y en a le bon nombre, sinon une grille régulière."""
    lab, k = ndi.label(lines)
    centers = [int(np.mean(np.nonzero(lab == i)[0])) for i in range(1, k + 1)]
    inner = [c for c in centers if size * 0.02 < c < size * 0.98]
    if len(inner) == n - 1:
        return [0] + inner + [size]
    return [round(size * i / n) for i in range(n + 1)]


def slice_sheet(path, cols, rows, line=LINE):
    """Renvoie {(rangée, colonne): case} ; une case = boîte (globale), masque, limites de la case.

    `line` : part de pixels non magenta au-delà de laquelle une rangée (colonne) est un trait de
    grille. Un grand perso placé au même endroit dans toutes les rangées peut dépasser 0,6 : les
    planches de méchants montent ce seuil.
    """
    src = np.array(Image.open(path).convert('RGB'))
    rgb = src.astype(int)
    fg = ~magenta(rgb)
    rowline, colline = fg.mean(axis=1) > line, fg.mean(axis=0) > line
    ys, xs = bounds(rowline, rows, fg.shape[0]), bounds(colline, cols, fg.shape[1])
    fg[rowline, :] = False
    fg[:, colline] = False
    for y in ys[1:-1]:                 # traits plus fins que le seuil : on les gomme quand même
        fg[max(0, y - 2):y + 3, :] &= ~(np.abs(rgb[max(0, y - 2):y + 3, :, 0] - rgb[max(0, y - 2):y + 3, :, 2]) < 40)
    for x in xs[1:-1]:
        fg[:, max(0, x - 2):x + 3] &= ~(np.abs(rgb[:, max(0, x - 2):x + 3, 0] - rgb[:, max(0, x - 2):x + 3, 2]) < 40)
    # liseré rosé au bord du perso : un pixel teinté de magenta qui touche le fond devient fond
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    tinted = (r - g > 40) & (b - g > 40) & (np.abs(r - b) < 70)
    fg &= ~(tinted & ndi.binary_dilation(~fg))
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    areas = ndi.sum(fg, lab, range(1, n + 1))
    cells = {}
    for i, sl in enumerate(ndi.find_objects(lab)):
        if areas[i] < MIN_AREA:
            continue
        cy, cx = ndi.center_of_mass(lab[sl] == i + 1)
        r = min(rows - 1, int(np.searchsorted(ys, cy + sl[0].start, 'right')) - 1)
        c = min(cols - 1, int(np.searchsorted(xs, cx + sl[1].start, 'right')) - 1)
        cells.setdefault((r, c), []).append((i + 1, sl))
    out = {}
    for (r, c), parts in cells.items():
        y0 = min(sl[0].start for _, sl in parts); y1 = max(sl[0].stop for _, sl in parts)
        x0 = min(sl[1].start for _, sl in parts); x1 = max(sl[1].stop for _, sl in parts)
        mask = np.isin(lab[y0:y1, x0:x1], [i for i, _ in parts])
        out[(r, c)] = {'box': (x0, y0, x1, y1), 'mask': mask, 'cell': (xs[c], ys[r], xs[c + 1], ys[r + 1])}
    return src, out, (xs, ys)


def anim_cells(spec, cells):
    """{nom: [case ou None, …]} selon la disposition de tools/sprites.json."""
    res = {}
    for a in spec['anims']:
        row, col, count, name = a[0] - 1, a[1] - 1, a[2], a[3]
        res[name] = [cells.get((row, col + k)) for k in range(count)]
    return res


def direction(name):
    for d in ('diagdown', 'diagup', 'down', 'up', 'fwd'):
        if name.endswith('_' + d):
            return d
    return 'fwd' if name.split('_')[-1] in ('throw', 'melee') else None


def anchor_x(mask, x0, bottom_local, height):
    """Ancrage horizontal : le milieu des hanches (bande au-dessus des pieds, sans l'instrument)."""
    lo, hi = int(bottom_local - 0.5 * height), int(bottom_local - 0.3 * height)
    band = mask[max(0, lo):max(1, hi)]
    xs = np.nonzero(band)[1]
    if len(xs) < 10:
        xs = np.nonzero(mask)[1]
    med = np.median(xs)
    near = xs[np.abs(xs - med) < 0.25 * height]
    return x0 + float(np.mean(near if len(near) else xs))


def muzzle(mask, x0, y0, ax, bottom, height, d):
    """Bout de l'arme : le pixel le plus avancé dans la direction de tir, vu depuis la poitrine."""
    vx, vy = DIRS[d]
    py, px = np.nonzero(mask)
    px, py = px + x0, py + y0
    score = (px - ax) * vx + (py - (bottom - 0.6 * height)) * vy
    top = score >= score.max() - 2
    return float(px[top].mean()), float(py[top].mean())


def shrink(src, box, mask, s):
    """Découpe une image et la réduit (moyenne prémultipliée, alpha tout ou rien)."""
    x0, y0, x1, y1 = box
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
    rgba[..., :3] = src[y0:y1, x0:x1] * mask[..., None]
    rgba[..., 3] = mask * 255.0
    if abs(s - 1) < 1e-3:
        return Image.fromarray(rgba.astype(np.uint8))
    w, h = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
    chans = [np.array(Image.fromarray(rgba[..., k]).resize((w, h), Image.BOX)) for k in range(4)]
    a = chans[3]
    out = np.zeros((h, w, 4), np.uint8)
    keep = a >= 128
    for k in range(3):
        out[..., k] = np.where(keep, np.clip(chans[k] / np.maximum(a, 1) * 255, 0, 255), 0)
    out[..., 3] = keep * 255
    return Image.fromarray(out)


def control(src, spec, cells, grid, frames, path):
    """Copie de la planche annotée, pour vérifier la découpe d'un coup d'œil."""
    im = Image.fromarray(src).convert('RGB')
    d = ImageDraw.Draw(im)
    xs, ys = grid
    for x in xs:
        d.line([(x, 0), (x, im.height)], fill=(0, 255, 255))
    for y in ys:
        d.line([(0, y), (im.width, y)], fill=(0, 255, 255))
    for name, lst in anim_cells(spec, cells).items():
        for k, c in enumerate(lst):
            f = frames[name][k] if name in frames else None
            if c is None:
                continue
            x0, y0, x1, y1 = c['box']
            d.rectangle([x0, y0, x1, y1], outline=(255, 255, 255))
            d.text((c['cell'][0] + 4, c['cell'][1] + 2), f'{name} {k + 1}', fill=(255, 255, 255))
            if f and 'g' in f:
                gx, gy = f['g']
                d.line([(c['cell'][0], gy), (c['cell'][2], gy)], fill=(255, 220, 0))
                d.line([(gx - 6, gy), (gx + 6, gy)], fill=(0, 255, 0), width=2)
                d.line([(gx, gy - 6), (gx, gy + 6)], fill=(0, 255, 0), width=2)
                if 'gm' in f:
                    mx, my = f['gm']
                    d.ellipse([mx - 5, my - 5, mx + 5, my + 5], outline=(255, 0, 0), width=2)
    for (r, c) in [(r, c) for r in range(spec['rangees']) for c in range(spec['colonnes'])]:
        if (r, c) not in cells:
            d.line([(xs[c], ys[r]), (xs[c + 1], ys[r + 1])], fill=(255, 0, 0), width=3)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)


def grid_lines(rgb):
    """Traits de la grille d'une planche libellée : magenta assombri (rouge ≈ bleu, vert bas)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r - g > 25) & (b - g > 25) & (np.abs(r - b) < 90) & (g < 60)


def slice_cells(fg, xs, bands):
    """Cases d'une planche libellée : xs = limites des colonnes, bands = bandes des rangées.

    Un morceau plus petit que MIN_AREA, ou large (haut) de 2 pixels — un reste de trait de
    grille —, est ignoré.
    """
    out = {}
    for r, (y0, y1) in enumerate(bands):
        for c in range(len(xs) - 1):
            sub = fg[y0:y1, xs[c]:xs[c + 1]]
            lab, n = ndi.label(sub, structure=np.ones((3, 3)))
            if not n:
                continue
            areas = ndi.sum(sub, lab, range(1, n + 1))
            keep = []
            for i, sl in enumerate(ndi.find_objects(lab)):
                h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
                if areas[i] >= MIN_AREA and min(w, h) > 2:
                    keep.append(i + 1)
            if not keep:                    # que de la poussière : la case est vide
                continue
            py, px = np.nonzero(np.isin(lab, keep))
            box = (px.min(), py.min(), px.max() + 1, py.max() + 1)
            mask = np.isin(lab[box[1]:box[3], box[0]:box[2]], keep)
            out[(r, c)] = {'box': (xs[c] + box[0], y0 + box[1], xs[c] + box[2], y0 + box[3]),
                           'mask': mask, 'cell': (xs[c], y0, xs[c + 1], y1)}
    return out


def read_crs(warn):
    """L'ennemi CRS : planche libellée → les mêmes anims que les persos, hauteur de sortie."""
    spec = LAYOUT['crs']
    src = np.array(Image.open(ROOT / spec['source']).convert('RGB'))
    rgb = src.astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    fg = ~magenta(rgb)
    fg &= ~grid_lines(rgb)                  # traits de la grille
    tinted = (r - g > 40) & (b - g > 40) & (np.abs(r - b) < 70)
    fg &= ~(tinted & ndi.binary_dilation(~fg))    # liseré magenta au bord du perso
    xs = spec['x']
    bands = [(spec['y'][2 * i], spec['y'][2 * i + 1]) for i in range(len(spec['y']) // 2)]
    cells = slice_cells(fg, xs, bands)      # les traits de grille sont entre deux bandes
    out_h = spec['hauteur']
    anims, dbg = {}, {}
    for a in spec['anims']:
        row, col, count, name, fps, loop = a[0] - 1, a[1] - 1, a[2], a[3], a[4], a[5]
        s = out_h / spec['ref'][row]
        d = direction(name)
        frames, aligned = [], []
        for k in range(count):
            c = cells.get((row, col + k))
            if c is None:
                warn.append(f'crs : {name} image {k + 1} vide')
                aligned.append(None)
                continue
            x0, y0, x1, y1 = c['box']
            gx = feet_x(c['mask'], x0, y1 - y0)
            gy = y1                                 # chaque image repose sur la ligne de sol
            img = shrink(src, c['box'], c['mask'], s)
            f = {'img': img, 'ax': (gx - x0) * s, 'ay': (gy - y0) * s, 'g': (gx, gy)}
            if d:
                mx, my = muzzle(c['mask'], x0, y0, gx, y1, y1 - y0, d)
                f['m'] = ((mx - gx) * s, (my - gy) * s)
                f['gm'] = (mx, my)
            frames.append(f)
            aligned.append(f)
        dbg[name] = aligned
        if frames:
            if name in STEADY:
                steady(frames)
            anims[name] = {'fps': fps, 'loop': loop, 'frames': frames}
    ctl = (ROOT / spec['source']).parent / '_controle'
    grid = (xs, [b[0] for b in bands] + [bands[-1][1]])
    control(src, {'rangees': len(bands), 'colonnes': len(xs) - 1,
                  'anims': spec['anims']}, cells, grid, dbg, ctl / 'crs.png')
    return anims


def enemy_spec(who):
    """Disposition de la planche d'un méchant : son gabarit, avec son attaque à distance nommée."""
    e = LAYOUT['ennemis']['liste'][who]
    g = LAYOUT['ennemis']['gabarits'][e['gabarit']]
    anims = [a[:3] + [e['distance'] if a[3] == '$distance' else a[3]] + a[4:] for a in g['anims']]
    return {**g, 'anims': anims}


def read_enemy(who, warn):
    """Un méchant : sa planche en grille → {nom: anim}, comme les persos.

    L'échelle vient de l'attente (hauteur médiane = `hauteur` du méchant) ; la ligne de sol, du bas
    médian des anims « au sol » : une image en l'air (saut, parachute) garde sa hauteur.
    """
    folder = ROOT / LAYOUT['ennemis']['dossier']
    path = folder / f'{who}.png'
    if not path.exists():
        return {}
    spec = enemy_spec(who)
    src, cells, grid = slice_sheet(path, spec['colonnes'], spec['rangees'], ENEMY_LINE)
    ac = anim_cells(spec, cells)
    hs = [c['box'][3] - c['box'][1] for c in ac.get('idle', []) if c]
    if not hs:
        hs = [c['box'][3] - c['box'][1] for n in spec['sol'] for c in ac.get(n, []) if c]
    if not hs:
        warn.append(f'{who} : planche illisible, ni attente ni marche')
        return {}
    h_ref = float(np.median(hs))
    s = LAYOUT['ennemis']['liste'][who]['hauteur'] / h_ref
    bots = [c['box'][3] - c['cell'][1] for n in spec['sol'] for c in ac.get(n, []) if c]
    base = float(np.median(bots))
    anims, dbg = {}, {}
    for a in spec['anims']:
        name, fps, loop = a[3], a[4], a[5]
        d = direction(name)
        frames, aligned = [], []
        for k, c in enumerate(ac[name]):
            if c is None:
                warn.append(f'{who} : {name} image {k + 1} vide')
                aligned.append(None)
                continue
            x0, y0, x1, y1 = c['box']
            gx = feet_x(c['mask'], x0, h_ref)
            gy = c['cell'][1] + base
            img = shrink(src, c['box'], c['mask'], s)
            f = {'img': img, 'ax': (gx - x0) * s, 'ay': (gy - y0) * s, 'g': (gx, gy)}
            if d:
                mx, my = muzzle(c['mask'], x0, y0, gx, y1, h_ref, d)
                f['m'] = ((mx - gx) * s, (my - gy) * s)
                f['gm'] = (mx, my)
            frames.append(f)
            aligned.append(f)
        dbg[name] = aligned
        if frames:
            if name in STEADY:
                steady(frames)
            anims[name] = {'fps': fps, 'loop': loop, 'frames': frames}
    control(src, spec, cells, grid, dbg, folder / '_controle' / f'{who}.png')
    return anims


def feet_x(mask, x0, height):
    """Ancrage horizontal : le milieu des appuis (bas de la silhouette), allongé = allongé."""
    band = mask[max(0, mask.shape[0] - max(3, int(0.08 * height))):]
    xs = np.nonzero(band)[1]
    if len(xs) < 4:
        xs = np.nonzero(mask)[1]
    return x0 + float(np.median(xs))



STEADY = ('walk', 'run', 'crouch_walk')   # anims où le corps avance d'un bloc pendant que les jambes bougent
SHOE = 0.16       # longueur d'une chaussure, en part de la hauteur du perso


def steady(frames):
    """Une marche : l'ancrage suit la tête, pas les pieds, sinon le corps avance et recule de
    quelques pixels d'une image à l'autre et la marche saccade. La tête : le milieu de la bande
    du haut de la silhouette (12 %), sous laquelle passent les bras et l'instrument."""
    centers = []
    for f in frames:
        a = np.array(f['img'])[..., 3] > 0
        rows = np.nonzero(a.any(axis=1))[0]
        top, h = rows[0], rows[-1] - rows[0] + 1
        band = a[top:top + max(4, int(h * 0.12))]
        xs = np.nonzero(band)[1]
        centers.append(float(np.median(xs)))
    offset = float(np.median([c - f['ax'] for c, f in zip(centers, frames)]))
    for c, f in zip(centers, frames):
        f['ax'] = c - offset


def pace(anim):
    """Le rythme d'une marche pour que les pieds ne glissent pas : le temps d'animation (en s, à
    son fps) par pixel parcouru. Un cycle (toutes ses images) fait deux pas ; un pas, l'écart des
    pieds à l'image la plus ouverte, moins une chaussure."""
    spreads, height = [], 0
    for f in anim['frames']:
        a = np.array(f['img'])[..., 3] > 0
        ay = int(round(f['ay']))
        feet = a[max(0, ay - 6):ay]
        cols = np.nonzero(feet.any(axis=0))[0]
        if len(cols):
            spreads.append(cols[-1] - cols[0])
        height = max(height, ay)
    step = max(8.0, max(spreads, default=0) - SHOE * height)
    return round(len(anim['frames']) / (2 * step * (anim['fps'] or 10)), 5)


def walk_sheet(path, cols, target_h, fps):
    """Une planche de la seule marche d'un méchant ({id}-marche.png : chaque rangée, le même
    cycle de `cols` images ; on lit la première). Le perso y est réduit à `target_h` (la hauteur
    de sa marche d'origine, pour qu'il garde sa taille), les pieds sur la ligne de sol, calé sur
    la tête (steady)."""
    src, cells, _ = slice_sheet(path, cols, 4, ENEMY_LINE)
    row = [cells.get((0, c)) for c in range(cols)]
    row = [c for c in row if c]
    if not row:
        return None
    hs = [c['box'][3] - c['box'][1] for c in row]
    s = target_h / float(np.median(hs))
    base = float(np.median([c['box'][3] for c in row]))
    frames = []
    for c in row:
        x0, y0, x1, y1 = c['box']
        gx = feet_x(c['mask'], x0, y1 - y0)
        frames.append({'img': shrink(src, c['box'], c['mask'], s), 'ax': (gx - x0) * s, 'ay': (base - y0) * s, 'g': (gx, base)})
    steady(frames)
    return {'fps': fps, 'loop': True, 'frames': frames}


def with_walk_sheet(who, anims, cols, warn):
    """Remplace la marche d'un méchant par celle de sa planche de marche, s'il en a une."""
    path = ROOT / LAYOUT['ennemis']['dossier'] / f'{who}-marche.png'
    if not path.exists() or 'walk' not in anims:
        return
    old = anims['walk']
    walk = walk_sheet(path, cols, float(np.median([f['img'].height for f in old['frames']])), old['fps'])
    if walk:
        anims['walk'] = walk
    else:
        warn.append(f'{who} : planche de marche illisible')


def anim_entry(name, a, adjust=lambda k: (0, 0)):
    """L'entrée d'une anim dans l'index ; une marche y gagne son rythme (pace, voir plus haut)."""
    e = {'fps': a['fps'], 'loop': a['loop'], 'frames': [entry(f, adjust(k)) for k, f in enumerate(a['frames'])]}
    if name in STEADY:
        e['pace'] = pace(a)
    return e


def height(who):
    """La hauteur debout d'un perso en jeu : la commune, ou la sienne (un grand gaillard)."""
    return LAYOUT.get('hauteurs', {}).get(who, LAYOUT['hauteur'])


def read_perso(src_dir, who, ctl_dir, warn):
    """Les planches générées d'un perso → {nom: anim}, hauteur de sortie."""
    out_h = height(who)
    found = {k: src_dir / f'{who}-{k}.png' for k in LAYOUT['planches']}
    found = {k: p for k, p in found.items() if p.exists()}
    if not found:
        return {}
    sliced = {}
    for k, p in found.items():
        spec = LAYOUT['planches'][k]
        # un perso dessiné au même endroit dans les 4 rangées remplit certaines colonnes à plus de
        # 60 % : au seuil par défaut, elles seraient prises pour des traits de grille et gommées
        sliced[k] = slice_sheet(p, spec['colonnes'], spec['rangees'], ENEMY_LINE)
    # hauteur debout de référence : l'idle des déplacements, sinon les anims « au sol » de la planche
    def med_height(k, names):
        _, cells, _ = sliced[k]
        ac = anim_cells(LAYOUT['planches'][k], cells)
        hs = [c['box'][3] - c['box'][1] for n in names for c in ac.get(n, []) if c]
        return float(np.median(hs)) if hs else None
    H = med_height('deplacements', ['idle']) if 'deplacements' in sliced else None
    anims = {}
    for k, (src, cells, grid) in sliced.items():
        spec = LAYOUT['planches'][k]
        h_ref = H or med_height(k, spec['sol'])
        # une planche où le perso est dessiné plus petit que sur les déplacements : réglage à la main
        s = out_h / h_ref * LAYOUT.get('echelles', {}).get(f'{who}-{k}', 1)
        ac = anim_cells(spec, cells)
        # ligne de sol de la planche : bas médian des anims « au sol », relatif au haut de la case
        bots = [c['box'][3] - c['cell'][1] for n in spec['sol'] for c in ac.get(n, []) if c]
        base = float(np.median(bots)) if bots else None
        dbg = {}
        for a in spec['anims']:
            name, fps, loop = a[3], a[4], a[5]
            d = direction(name)
            frames, aligned = [], []
            for i, c in enumerate(ac[name]):
                if c is None:
                    warn.append(f'{who}-{k} : {name} image {i + 1} vide')
                    aligned.append(None)
                    continue
                x0, y0, x1, y1 = c['box']
                gy = c['cell'][1] + base if base is not None else y1
                gx = anchor_x(c['mask'], x0, y1 - y0, h_ref)
                img = shrink(src, c['box'], c['mask'], s)
                f = {'img': img, 'ax': (gx - x0) * s, 'ay': (gy - y0) * s, 'g': (gx, gy)}
                if d:
                    mx, my = muzzle(c['mask'], x0, y0, gx, y1, h_ref, d)
                    f['m'] = ((mx - gx) * s, (my - gy) * s)
                    f['gm'] = (mx, my)
                frames.append(f)
                aligned.append(f)
            dbg[name] = aligned
            if frames:
                if name in STEADY:
                    steady(frames)
                anims[name] = {'fps': fps, 'loop': loop, 'frames': frames}
        control(src, spec, cells, grid, dbg, ctl_dir / f'{who}-{k}.png')
    return anims


def read_fx(p, spec, ctl_path, warn):
    """Une planche d'effets (ou de projectiles) → {nom: anim}, chaque image centrée sur son milieu."""
    if not p.exists():
        return {}
    src, cells, grid = slice_sheet(p, spec['colonnes'], spec['rangees'])
    ac = anim_cells(spec, cells)
    fx = {}
    for a in spec['anims']:
        name, fps, loop, size = a[3], a[4], a[5], a[6]
        lst = [c for c in ac[name] if c]
        if len(lst) < len(ac[name]):
            warn.append(f'{p.stem} : {name}, {len(ac[name]) - len(lst)} image(s) vide(s)')
        if not lst:
            continue
        s = size / float(np.median([max(c['box'][2] - c['box'][0], c['box'][3] - c['box'][1]) for c in lst]))
        frames = []
        for c in lst:
            img = shrink(src, c['box'], c['mask'], s)
            frames.append({'img': img, 'ax': img.width / 2, 'ay': img.height / 2})
        fx[name] = {'fps': fps, 'loop': loop, 'frames': frames}
    control(src, spec, cells, grid, {}, ctl_path)
    return fx


# --- ancienne planche (public/assets/persos), en attendant les nouvelles ------------------------------
# Arnaud n'a sa basse qu'en attaque sur l'ancienne planche ; Baptiste a parfois une guitare en
# bois : on garde les images où elle est rouge (indices dans la liste de l'action).
LEGACY_PICK = {'baptiste': {'idle': [2], 'walk': [4]}}
LEGACY_MAP = {'shoot_up': 'up', 'shoot_diagup': 'diagup', 'shoot_fwd': 'right',
              'shoot_diagdown': 'diagdown', 'crouch_shoot_fwd': 'down'}


def bass():
    """La basse d'Arnaud avec ses deux mains, 55 × 26 : le manche, la tête et la main gauche sont
    repris de sa pose de tir (ancienne planche), seul le corps, caché par le torse dans cette pose,
    est dessiné ici, aux couleurs de la basse en jeu."""
    base = ROOT / 'public/assets/persos'
    e = json.loads((base / 'persos.json').read_text())['arnaud']['right'][0]
    shot = Image.open(base / 'persos.png').convert('RGBA').crop((e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h']))
    im = Image.new('RGBA', (55, 26))
    im.alpha_composite(shot.crop((46, 13, 79, 36)), (22, 2))      # manche, tête, main gauche
    d = ImageDraw.Draw(im)
    px = lambda c, x, y, w=1, h=1: d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)
    K = '#120e10'
    # le corps (forme de Precision Bass, cornes vers le manche) : noir, bord brun (sunburst), plaque
    # écaille, micro, chevalet, et la main droite qui joue
    body = [[13, 4], [12, 6], [3, 4], [2, 15], [1, 17], [1, 17], [2, 16], [2, 18], [1, 20], [0, 21],
            [0, 21], [0, 20], [1, 18], [2, 15], [4, 10]]
    for k, (x, w) in enumerate(body):
        px(K, x, 9 + k, w, 1)
    for k, (x, w) in enumerate(body):
        if w > 3:
            px('#5a3420', x + 1, 9 + k, w - 2, 1)
    for k, (x, w) in enumerate(body[3:-2]):
        px('#2a2226', x + 2, 12 + k, w - 4, 1)
    px('#6e4a30', 9, 13, 6, 2); px('#6e4a30', 8, 15, 7, 3); px('#4a2c1c', 9, 18, 5, 1)
    px('#d8d2c4', 4, 18, 2, 3); px('#0a0808', 11, 16, 3, 1)
    for y in (18, 19, 20):                                  # le manche qui rejoint le corps
        px('#c48c4c' if y < 20 else '#7a4e26', 17, y, 6, 1)
    px(K, 17, 21, 6, 1)
    px(K, 9, 15, 5, 5); px('#e0a07a', 10, 15, 3, 3); px('#b06a4a', 10, 18, 3, 1)
    return im


def with_bass(f, bob=0):
    """Ajoute la basse devant Arnaud (même placement que l'ancienne démo)."""
    img, ax, ay = f['img'], f['ax'], f['ay']
    bx, by = round(ax - 13), round(ay - img.height * 0.40 - 17 - bob)
    x0, y0 = min(0, bx), min(0, by)
    x1, y1 = max(img.width, bx + 55), max(img.height, by + 26)
    out = Image.new('RGBA', (x1 - x0, y1 - y0))
    out.alpha_composite(img, (-x0, -y0))
    out.alpha_composite(bass(), (bx - x0, by - y0))
    return {**f, 'img': out, 'ax': ax - x0, 'ay': ay - y0}


def stride_frames(f, legs, n=8):
    """Marche synthétique : jambes cisaillées autour de la hanche, en sens opposés (cf. ancienne démo)."""
    src = np.array(f['img'])
    hip, split, stride = legs['hip'], legs['split'], legs['stride']
    h, w = src.shape[:2]
    length = h - hip
    M = stride + 2
    out = []
    for step in range(n):
        s = math.sin(step * 2 * math.pi / n)
        k = stride / (2 * length)
        kb, kf = k * (1 - s), k * (s - 1)
        bob = round(1.6 * (1 - abs(s)))
        dst = np.zeros((h + 2, w + 2 * M, 4), np.uint8)
        top = 2

        def put(row, x, dy):
            a = row[..., 3] > 0
            seg = dst[dy, x:x + row.shape[0]]
            seg[a] = row[a]
        for i in range(length):
            y, cut = hip + i, split[i]
            ob, of = round(kb * i), round(kf * i)
            for r in range(bob + 1 if i == 0 else 1):
                dy = top + y - bob * (i == 0) + r
                if cut > 0:
                    put(src[y, :cut], M + ob, dy)
                if cut < w:
                    put(src[y, cut:], M + cut + of, dy)
        for y in range(hip):
            put(src[y], M, top + y - bob)
        out.append(({'img': Image.fromarray(dst), 'ax': f['ax'] + M, 'ay': h + top}, bob))
    return out


def read_legacy(who):
    base = ROOT / 'public/assets/persos'
    index = json.loads((base / 'persos.json').read_text())[who]
    atlas = Image.open(base / 'persos.png').convert('RGBA')

    def frame(e):
        img = atlas.crop((e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h']))
        return {'img': img, 'ax': e['ax'], 'ay': e['h'], 'legs': e.get('legs')}

    def armed(act):
        allf = index[act]
        if act in LEGACY_PICK.get(who, {}):
            return [allf[k] for k in LEGACY_PICK[who][act]]
        row = [e for e in allf if e['row'] == 1]
        return row or allf
    anims = {}
    idle = [frame(e) for e in armed('idle')]
    walk_src = max(armed('walk'), key=lambda e: e['legs']['stride'])
    walk = stride_frames(frame(walk_src), walk_src['legs'])
    if who == 'arnaud':
        idle = [with_bass(f) for f in idle]
        walk = [(with_bass(f, bob), bob) for f, bob in walk]
    anims['idle'] = {'fps': 3, 'loop': True, 'frames': idle}
    anims['walk'] = {'fps': 12, 'loop': True, 'frames': [f for f, _ in walk]}
    anims['jump'] = {'fps': 0, 'loop': False, 'frames': [frame(e) for e in index['jump']]}
    crouch = [frame(e) for e in armed('crouch')]
    anims['crouch_down'] = {'fps': 12, 'loop': False, 'frames': crouch[:1]}
    anims['crouch_idle'] = {'fps': 2, 'loop': True, 'frames': crouch}
    anims['crouch_walk'] = {'fps': 4, 'loop': True, 'frames': crouch}
    H = float(np.median([f['ay'] for f in anims['idle']['frames']]))
    for name, old in LEGACY_MAP.items():
        a, b = (frame(e) for e in index[old][:2])
        frames = []
        for f in (a, b, a):
            f = dict(f)
            mask = np.array(f['img'])[..., 3] > 0
            mx, my = muzzle(mask, 0, 0, f['ax'], f['ay'], H, direction(name))
            f['m'] = (mx - f['ax'], my - f['ay'])
            frames.append(f)
        anims[name] = {'fps': 0, 'loop': False, 'frames': frames}
    return anims, H


# --- effets de remplacement -------------------------------------------------------------------
def placeholder_fx():
    """Effets dessinés au pixel, le temps que la planche d'effets soit générée."""
    def canvas(w, h):
        im = Image.new('RGBA', (w, h))
        return im, ImageDraw.Draw(im)

    def fr(im):
        return {'img': im, 'ax': im.width / 2, 'ay': im.height / 2}
    fx = {}
    for name, (fill, hi) in {'pick_orange': ('#f08a24', '#ffd08a'), 'pick_blue': ('#2aa8ff', '#b8ecff')}.items():
        frames = []
        for k in (1, 0.6, 0.2, 0.6):
            w = max(2, round(8 * k))
            im, d = canvas(10, 10)
            c = 5
            d.polygon([(c - w / 2, 1), (c + w / 2, 1), (c, 8)], fill=fill, outline='#3a1c10')
            if w > 3:
                d.point([(c - 1, 2), (c, 2)], fill=hi)
            frames.append(fr(im))
        fx[name] = {'fps': 14, 'loop': True, 'frames': frames}
    frames = []
    for s in (10, 16, 18, 10):
        im, d = canvas(s + 2, s // 2 + 3)
        hh = s // 4 + 1
        d.polygon([(1, hh + 1), (s * 0.35, 1), (s + 1, hh + 1), (s * 0.35, 2 * hh + 1)], fill='#ffb020')
        d.polygon([(3, hh + 1), (s * 0.4, 3), (s - 2, hh + 1), (s * 0.4, 2 * hh - 1)], fill='#fff6c0')
        frames.append(fr(im))
    fx['flash'] = {'fps': 30, 'loop': False, 'frames': frames}
    frames = []
    for r, col in ((3, '#fff6c0'), (6, '#ffd040'), (8, '#ff9020'), (6, '#c05020')):
        im, d = canvas(18, 18)
        for k in range(8):
            a = k * math.pi / 4 + 0.3
            d.line([(9 + math.cos(a) * r * 0.4, 9 + math.sin(a) * r * 0.4), (9 + math.cos(a) * r, 9 + math.sin(a) * r)], fill=col)
        frames.append(fr(im))
    fx['impact'] = {'fps': 20, 'loop': False, 'frames': frames}
    frames = []
    for k in range(8):
        w = max(3, round(14 * abs(math.cos(k * math.pi / 8))))
        im, d = canvas(16, 16)
        d.ellipse([8 - w / 2, 1, 8 + w / 2, 15], fill='#16121a', outline='#000')
        if w > 5:
            d.ellipse([8 - w / 6, 6, 8 + w / 6, 10], fill='#d0302a')
            d.point([(8 - w / 3, 4)], fill='#6a6478')
        frames.append(fr(im))
    fx['vinyl'] = {'fps': 16, 'loop': True, 'frames': frames}
    rnd = np.random.default_rng(4)
    frames = []
    for k, r in enumerate((8, 16, 24, 30, 33, 32, 28, 22)):
        im, d = canvas(76, 76)
        c = 38
        smoke = k >= 4
        layers = (('#6a6068', 1.0), ('#8a8088', 0.7)) if smoke else (('#d04018', 1.0), ('#ff9020', 0.75), ('#ffe060', 0.45), ('#fffbe0', 0.2))
        for col, f in layers:
            for _ in range(7):
                ox, oy = rnd.normal(0, r * 0.25, 2)
                rr = r * f * (0.6 + 0.4 * rnd.random())
                d.ellipse([c + ox - rr, c + oy - rr, c + ox + rr, c + oy + rr], fill=col)
        for _ in range(5 + k):
            a, dist = rnd.random() * 2 * math.pi, r * (0.9 + 0.3 * rnd.random())
            x, y = c + math.cos(a) * dist, c + math.sin(a) * dist
            if 1 < x < 74 and 1 < y < 74:
                d.rectangle([x - 1, y - 1, x + 1, y], fill='#120e14')
        frames.append(fr(im))
    fx['explosion'] = {'fps': 14, 'loop': False, 'frames': frames}

    def note(d, x, y, col):
        d.ellipse([x, y + 5, x + 3, y + 7], fill=col)
        d.line([(x + 3, y), (x + 3, y + 6)], fill=col)
        d.line([(x + 3, y), (x + 5, y + 2)], fill=col)
    frames = []
    for k in range(4):
        im, d = canvas(20, 20)
        for j, col in enumerate(('#ff5ab4', '#5ad8ff', '#ffe040')):
            if j + k < 5:
                note(d, 2 + j * 6, 10 - k * 3 + (j % 2) * 3, col)
        frames.append(fr(im))
    fx['notes'] = {'fps': 8, 'loop': False, 'frames': frames}
    frames = []
    for r, col in ((3, '#e8d0a8'), (5, '#d8bc90'), (7, '#c8ac80'), (8, '#c8ac8080')):
        im, d = canvas(20, 14)
        for ox in (-r * 0.6, 0, r * 0.6):
            d.ellipse([10 + ox - r * 0.6, 12 - r, 10 + ox + r * 0.6, 12], fill=col)
        frames.append(fr(im))
    fx['dust'] = {'fps': 14, 'loop': False, 'frames': frames}

    # balle et grenade du CRS : provisoires, la planche d'effets n'en a pas encore
    frames = []
    for w in (5, 4, 3):
        im, d = canvas(8, 4)
        d.rectangle([0, 1, w, 2], fill='#fff2b8')
        d.rectangle([0, 0, w - 1, 1], fill='#ffb020')
        frames.append(fr(im))
    fx['bullet'] = {'fps': 20, 'loop': True, 'frames': frames}
    frames = []
    for k in range(4):
        im, d = canvas(12, 12)
        a = k * math.pi / 2
        d.ellipse([3, 2, 9, 10], fill='#4c5a34', outline='#141810')
        d.point([(5, 4), (6, 4)], fill='#8a9080')
        d.line([(6 + 3 * math.cos(a), 6 + 2.5 * math.sin(a)), (6 + 3 * math.cos(a), 1)],
               fill='#8a9080' if k % 2 == 0 else '#3a3a30')
        frames.append(fr(im))
    fx['grenade'] = {'fps': 12, 'loop': True, 'frames': frames}
    # téléphone lancé par le zombie connecté : assez petit pour rester dessiné ici
    frames = []
    for k in range(4):
        im, d = canvas(10, 10)
        w, h = (4, 7) if k % 2 == 0 else (7, 4)
        x0, y0 = 5 - w // 2, 5 - h // 2
        d.rectangle([x0, y0, x0 + w - 1, y0 + h - 1], fill='#1a1c24')
        d.rectangle([x0 + 1, y0 + 1, x0 + w - 2, y0 + h - 2], fill='#7ad8ff' if k < 2 else '#3a8ac0')
        frames.append(fr(im))
    fx['phone'] = {'fps': 14, 'loop': True, 'frames': frames}
    return fx


# --- atlas ------------------------------------------------------------------------------------
def pack(groups, width=1024):
    """Range toutes les images sur des étagères de 1024 px ; renvoie l'atlas et l'index JSON."""
    allf = [f for g in groups for a in g.values() for f in a['frames']]
    x = y = rowh = 0
    for f in sorted(allf, key=lambda f: -f['img'].height):
        im = f['img']
        if x + im.width > width:
            x, y, rowh = 0, y + rowh + 1, 0
        f['pos'] = (x, y)
        x += im.width + 1
        rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (width, y + rowh))
    for f in allf:
        atlas.paste(f['img'], f['pos'])
    return atlas


def entry(f, adjust=(0, 0)):
    (x, y), im = f['pos'], f['img']
    e = [x, y, im.width, im.height, round(f['ax'] + adjust[0]), round(f['ay'] + adjust[1])]
    if 'm' in f:
        e += [round(f['m'][0] - adjust[0]), round(f['m'][1] - adjust[1])]
    return e


def main(src_dir, dest):
    src_dir, dest = Path(src_dir), Path(dest)
    ctl = src_dir / '_controle'
    adj_path = ROOT / 'tools/sprites-ajustements.json'
    adjust = json.loads(adj_path.read_text()) if adj_path.exists() else {}
    warn = []
    persos, meta = {}, {}
    for who in LAYOUT['persos']:
        new = read_perso(src_dir, who, ctl, warn) if src_dir.exists() else {}
        old, old_h = read_legacy(who)
        anims = {**old, **new}
        every = [a[3] for p in LAYOUT['planches'].values() for a in p['anims']]
        meta[who] = {
            'source': 'planches' if new else 'ancienne',
            'hauteur': height(who) if 'idle' in new else round(old_h),
            'manque': [n for n in every if n not in new],
        }
        meta[who]['hanches'] = round(meta[who]['hauteur'] * LAYOUT['hanches'])
        persos[who] = anims
    # l'ennemi CRS, sous S.persos.crs : même format d'images, donc même code de dessin
    if (ROOT / LAYOUT['crs']['source']).exists():
        crs = read_crs(warn)
        if crs:
            with_walk_sheet('crs', crs, 8, warn)
            every = [a[3] for a in LAYOUT['crs']['anims']]
            persos['crs'] = crs
            meta['crs'] = {'source': 'crs', 'hauteur': LAYOUT['crs']['hauteur'],
                           'hanches': round(LAYOUT['crs']['hauteur'] * LAYOUT['hanches']),
                           'manque': [n for n in every if n not in crs]}
    else:
        warn.append(f"planche CRS absente : {LAYOUT['crs']['source']}")
    # les autres méchants, sous S.persos.{id} : planches en grille, même format d'images
    for who in LAYOUT['ennemis']['liste']:
        anims = read_enemy(who, warn)
        if not anims:
            continue
        with_walk_sheet(who, anims, enemy_spec(who)['colonnes'], warn)
        every = [a[3] for a in enemy_spec(who)['anims']]
        h = LAYOUT['ennemis']['liste'][who]['hauteur']
        persos[who] = anims
        meta[who] = {'source': 'ennemi', 'hauteur': h, 'hanches': round(h * LAYOUT['hanches']),
                     'manque': [n for n in every if n not in anims]}
    missing = [w for w in LAYOUT['ennemis']['liste'] if w not in persos]
    if missing:
        warn.append(f"méchants sans planche ({LAYOUT['ennemis']['dossier']}) : {', '.join(missing)}")
    pj = LAYOUT['ennemis']['projectiles']
    pj_dir = ROOT / LAYOUT['ennemis']['dossier']
    fx = {**placeholder_fx(),
          **read_fx(src_dir / 'effets.png', LAYOUT['effets'], ctl / 'effets.png', warn),
          **read_fx(pj_dir / pj['fichier'], pj, pj_dir / '_controle' / pj['fichier'], warn)}
    atlas = pack(list(persos.values()) + [fx])
    index = {'persos': {}, 'fx': {}}
    for who, anims in persos.items():
        index['persos'][who] = {**meta[who], 'anims': {
            n: anim_entry(n, a, lambda k, n=n: adjust.get(f'{who}/{n}/{k + 1}', (0, 0)))
            for n, a in anims.items()}}
    index['fx'] = {n: {'fps': a['fps'], 'loop': a['loop'], 'frames': [entry(f) for f in a['frames']]} for n, a in fx.items()}
    dest.mkdir(parents=True, exist_ok=True)
    atlas.save(dest / 'sprites.png', optimize=True)
    text = json.dumps(index, separators=(',', ':'))
    (dest / 'sprites.json').write_text(text)
    phaser_atlas.write(dest)
    for who, m in meta.items():
        print(f"{who:9} {m['source']:9} hauteur {m['hauteur']}  manque : {', '.join(m['manque']) or '—'}")
    for w in warn:
        print('  !', w)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'ressources/sprites',
         sys.argv[2] if len(sys.argv) > 2 else ROOT / 'public/assets/sprites')
