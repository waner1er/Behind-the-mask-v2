"""Prépare les images de l'écran de sélection des héros (façon « SOLDIER SELECT » de Metal Slug).

Usage : .venv/bin/python tools/build_select.py
Entrées : les portraits, soit ressources/sources/select-portraits.png (la planche toon générée dans
Figma, fichier « Behind the Mask — niveau 1 » : 4 portraits côte à côte, dans l'ordre Pierre,
Baptiste, Arnaud, Erwan), soit à défaut ressources/references/{héros}-portrait.png (477 × 600,
cadre de couleur autour) ; et,
s'il existe, ressources/sources/select-fond.png (le mur de métal généré dans Figma, fichier
« Behind the Mask — niveau 1 »). Sans lui, le mur de plaques rivetées est dessiné ici.
Sortie : public/assets/select/{héros}.png (en couleur), {héros}-gris.png (pas encore choisi,
grisé comme dans Metal Slug) et fond.png (608 × 342).
Dépendances : numpy, pillow.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/assets/select'
HEROES = ['pierre', 'baptiste', 'arnaud', 'erwan']
INNER = (17, 17, 460, 568)          # l'intérieur du cadre des portraits
SIZE = (126, 160)                   # une case de l'écran (608 × 342)
W, H = 608, 342
rng = np.random.default_rng(44)


def fit(im, top=0.06):
    """Recadre aux proportions d'une case, puis réduit à sa taille. Une image plus haute que la
    case est cadrée sur la tête : on part de `top` (part de la hauteur) depuis le haut."""
    w, h = im.size
    target = SIZE[0] / SIZE[1]
    if w / h > target:
        nw = round(h * target); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / target); y = min(h - nh, round(h * top)); im = im.crop((0, y, w, y + nh))
    return im.resize(SIZE, Image.LANCZOS)


def sheet_portraits():
    """La planche Figma : 4 colonnes séparées par des traits ; on garde l'intérieur de chacune."""
    src = ROOT / 'ressources/sources/select-portraits.png'
    if not src.exists():
        return None
    im = Image.open(src).convert('RGB')
    w, h = im.size
    cols = [(round(w * i / 4), round(w * (i + 1) / 4)) for i in range(4)]
    m = round(w * 0.006)                       # on rogne les traits de grille
    return {name: im.crop((x0 + m, m, x1 - m, h - m)) for name, (x0, x1) in zip(HEROES, cols)}


def portrait(name, sheet=None):
    if sheet:
        color = fit(sheet[name])
    else:
        im = Image.open(ROOT / f'ressources/references/{name}-portrait.png').convert('RGB').crop(INNER)
        color = im.resize(SIZE, Image.LANCZOS)
    a = np.asarray(color).astype(float)
    # grisé de Metal Slug : niveaux de gris sombres, légèrement teintés de kaki
    g = a @ [0.3, 0.59, 0.11]
    grey = np.stack([g * 0.55 + 14, g * 0.55 + 13, g * 0.5 + 8], -1)
    return color, Image.fromarray(np.clip(grey, 0, 255).astype(np.uint8))


def metal_wall():
    """Un mur de plaques d'acier kaki, rivetées, rayées, plus sombre sur les bords."""
    base = np.array([58, 53, 40], float)
    img = np.tile(base, (H, W, 1)) + rng.normal(0, 4, (H, W, 1))
    # des plaques : un peu de variation de teinte par plaque, joints sombres et arêtes claires
    xs, ys = [0, 152, 304, 456, W], [0, 114, 228, H]
    for i in range(4):
        for j in range(3):
            img[ys[j]:ys[j + 1], xs[i]:xs[i + 1]] += rng.normal(0, 5)
    for x in xs[1:-1]:
        img[:, x - 1:x + 1] = [24, 22, 17]
        img[:, x + 1] += 14
    for y in ys[1:-1]:
        img[y - 1:y + 1, :] = [24, 22, 17]
        img[y + 1, :] += 14
    # des rayures et des coulures de rouille
    for _ in range(90):
        x, y, n = rng.integers(0, W), rng.integers(0, H), rng.integers(4, 18)
        d = rng.choice([-1, 1])
        for k in range(n):
            if 0 <= y + k < H and 0 <= x + d * k < W:
                img[y + k, x + d * k] += 18
    for _ in range(14):
        x, y, n = rng.integers(0, W), rng.integers(0, H - 40), rng.integers(10, 40)
        img[y:y + n, x:x + 2] += [22, 6, -6]
    # des rivets le long des joints
    def rivet(cx, cy):
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx * dx + dy * dy <= 5 and 0 <= cy + dy < H and 0 <= cx + dx < W:
                    shade = 40 if dx + dy < -1 else (-30 if dx + dy > 1 else 8)
                    img[cy + dy, cx + dx] = base + shade
    for x in xs[1:-1]:
        for y in range(10, H, 19):
            rivet(x - 6, y); rivet(x + 6, y)
    for y in ys[1:-1]:
        for x in range(10, W, 19):
            rivet(x, y - 6); rivet(x, y + 6)
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.55 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
    return Image.fromarray(np.clip(img * v[..., None], 0, 255).astype(np.uint8))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = sheet_portraits()
    for name in HEROES:
        color, grey = portrait(name, sheet)
        color.save(OUT / f'{name}.png', optimize=True)
        grey.save(OUT / f'{name}-gris.png', optimize=True)
    src = ROOT / 'ressources/sources/select-fond.png'
    fond = Image.open(src).convert('RGB').resize((W, H), Image.LANCZOS) if src.exists() else metal_wall()
    fond.save(OUT / 'fond.png', optimize=True)
    print('portraits', SIZE, 'toon (Figma)' if sheet else 'références', '→', OUT, '| fond :', 'Figma' if src.exists() else 'dessiné')


if __name__ == '__main__':
    main()
