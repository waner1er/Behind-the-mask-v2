"""Prépare le logo de l'écran de garde : VIGILANTE / BEHIND THE MASK, à la manière du titre de
Metal Slug (lettres orange en dégradé, arête claire, contour sombre épais).

Usage : .venv/bin/python tools/build_logo.py
Entrée : ressources/sources/logo-vigilante-titre.png (fond transparent ; VIGILANTE en noir,
BEHIND THE MASK en gris).
Sortie : public/assets/title/logo.png, à la taille de l'écran (pixels nets).
Dépendances : numpy, scipy, pillow.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ressources/sources/logo-vigilante-titre.png'
OUT = ROOT / 'public/assets/title/logo.png'
HEIGHT = 236                        # px à l'écran (608 × 342), contour compris
OUTLINE = 3                         # px de contour sombre
TOP, BOTTOM = np.array([255, 205, 70]), np.array([214, 64, 24])   # dégradé des lettres
LIGHT, SHADE = np.array([255, 236, 150]), np.array([150, 38, 14])  # arête du haut, ombre du bas
CREAM, DARK = np.array([241, 220, 180]), np.array([34, 12, 6])


def main():
    a = np.asarray(Image.open(SRC).convert('RGBA')).astype(float)
    alpha, lum = a[..., 3], a[..., :3].mean(-1)
    ys, xs = np.nonzero(alpha > 128)
    a, alpha, lum = (v[ys.min():ys.max() + 1, xs.min():xs.max() + 1] for v in (a, alpha, lum))
    letters = (alpha > 128) & (lum < 50)
    subtitle = (alpha > 128) & (lum >= 50)
    # réduction : chaque masque est moyenné puis tranché, pour garder des pixels nets
    h = HEIGHT - 2 * OUTLINE
    w = round(letters.shape[1] * h / letters.shape[0])
    def shrink(mask):
        return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((w, h), Image.BOX)) > 120
    L, S = np.pad(shrink(letters), OUTLINE), np.pad(shrink(subtitle), OUTLINE)
    H, W = L.shape
    out = np.zeros((H, W, 4), np.uint8)
    # le contour sombre, autour des lettres et du sous-titre
    ring = ndi.binary_dilation(L | S, structure=np.ones((3, 3)), iterations=OUTLINE)
    out[ring] = (*DARK, 255)
    # les lettres : dégradé vertical sur la hauteur de VIGILANTE, arête claire en haut, ombre en bas
    rows = np.nonzero(L.any(1))[0]
    t = np.clip((np.arange(H) - rows.min()) / max(1, rows.max() - rows.min()), 0, 1)[:, None, None]
    grad = TOP * (1 - t) + BOTTOM * t
    fill = np.broadcast_to(grad, (H, W, 3))
    out[L] = np.concatenate([fill[L], np.full((L.sum(), 1), 255)], 1)
    top_edge = L & ~np.roll(L, 2, axis=0)
    bottom_edge = L & ~np.roll(L, -2, axis=0)
    out[top_edge] = (*LIGHT, 255)
    out[bottom_edge] = (*SHADE, 255)
    # le sous-titre en crème, arête du bas un peu plus sombre
    out[S] = (*CREAM, 255)
    out[S & ~np.roll(S, -1, axis=0)] = (*(CREAM * 0.75).astype(int), 255)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out).save(OUT, optimize=True)
    print('logo', W, '×', H, '→', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
