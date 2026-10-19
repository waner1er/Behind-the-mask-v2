"""Extrait le décor de rue (bande du haut de ressources/sources/ms-bg.png) pour la démo.

Usage : python3 tools/build_decor.py
Sortie : public/assets/decor/rue.png, 2140 × 342, à taille réelle (la démo tourne en 608 × 342).
Le bas de la planche (morceaux de décor détachés) n'est pas utilisé pour l'instant.
Dépendance : pillow.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BAND = (16, 10, 2156, 352)    # x0, y0, x1, y1 de la bande, sans le liseré blanc

im = Image.open(ROOT / 'ressources/sources/ms-bg.png').convert('RGB')
dest = ROOT / 'public/assets/decor'
dest.mkdir(parents=True, exist_ok=True)
im.crop(BAND).save(dest / 'rue.png', optimize=True)
print('public/assets/decor/rue.png', BAND[2] - BAND[0], '×', BAND[3] - BAND[1])
