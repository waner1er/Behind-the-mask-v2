"""Découpe la planche des TV du clip (ressources/sprites/clip/tv.png) en un atlas Phaser.

Usage : python3 tools/build_clip_props.py
Planche générée dans Figma (prompt : ressources/prompts/clip.md) : 5 petites TV cathodiques en
haut, la grosse TV sur son échafaudage (intacte, puis écran brisé) en bas, des éclats de verre à
droite. Chaque objet est isolé sur le fond magenta, réduit à l'échelle des persos et ancré au
milieu de son pied → public/assets/clip/props.png et props.atlas.json (frames tv1…tv5,
bigtv, bigtv_broken, shard1…). Dépendances : numpy, scipy, pillow.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

from build_sprites import magenta, shrink

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'ressources/sprites/clip/tv.png'
DEST = ROOT / 'public/assets/clip'
# réduction par sorte d'objet (la planche ne tient pas l'échelle demandée) : les petites TV font
# à peu près une tête de perso, la grosse TV et son échafaudage la hauteur de la façade
SCALE = {'tv': 0.22, 'bigtv': 0.29, 'shard': 0.3}


def main():
    src = np.array(Image.open(SRC).convert('RGB'))
    fg = ~magenta(src.astype(int))
    # les antennes et les étincelles touchent presque leur TV : on les y rattache
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=4))
    objs = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        mask = (lab[sl] == i + 1) & fg[sl]
        if mask.sum() < 60:
            continue
        y0, x0, y1, x1 = sl[0].start, sl[1].start, sl[0].stop, sl[1].stop
        objs.append({'box': (x0, y0, x1, y1), 'mask': mask, 'area': int(mask.sum())})
    H = src.shape[0]
    big = sorted([o for o in objs if o['box'][3] - o['box'][1] > H * 0.35], key=lambda o: o['box'][0])
    small = sorted([o for o in objs if o not in big and o['box'][1] < H * 0.3 and o['area'] > 1500], key=lambda o: o['box'][0])
    shards = sorted([o for o in objs if o not in big and o not in small], key=lambda o: (o['box'][1], o['box'][0]))
    named = [(f'tv{k + 1}', o) for k, o in enumerate(small)]
    named += list(zip(['bigtv', 'bigtv_broken'], big))
    named += [(f'shard{k + 1}', o) for k, o in enumerate(shards)]
    kind = lambda name: name.rstrip('0123456789').replace('_broken', '')
    imgs = [(name, shrink(src, o['box'], o['mask'], SCALE[kind(name)])) for name, o in named]
    # une étagère par image, côte à côte
    width = 1024
    x = y = rowh = 0
    pos = {}
    for name, im in sorted(imgs, key=lambda t: -t[1].height):
        if x + im.width > width:
            x, y, rowh = 0, y + rowh + 1, 0
        pos[name] = (x, y)
        x += im.width + 1
        rowh = max(rowh, im.height)
    atlas = Image.new('RGBA', (width, y + rowh))
    frames = {}
    for name, im in imgs:
        px, py = pos[name]
        atlas.paste(im, (px, py))
        w, h = im.size
        frames[name] = {'frame': {'x': px, 'y': py, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h},
                        'anchor': {'x': 0.5, 'y': 1}}
    DEST.mkdir(parents=True, exist_ok=True)
    atlas.save(DEST / 'props.png', optimize=True)
    (DEST / 'props.atlas.json').write_text(json.dumps({'frames': frames, 'meta': {'image': 'props.png', 'scale': '1'}}, separators=(',', ':')))
    for name, im in imgs:
        print(f'{name:14} {im.width:3} x {im.height:3}')


if __name__ == '__main__':
    main()
