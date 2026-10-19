"""Atlas au format Phaser (JSON Hash) à partir de l'index sprites.json.

Usage : python3 tools/phaser_atlas.py [public/assets/sprites]
Lit sprites.json, écrit sprites.atlas.json à côté de sprites.png. Appelé aussi par build_sprites.py.

Chaque image de l'index [x, y, w, h, ax, ay, …] devient une frame Phaser nommée
persos/{perso}/{anim}/{k} ou fx/{effet}/{k} (k à partir de 0), avec son point d'ancrage
(anchor, en fraction de la frame) : Phaser y place l'origine du sprite, et le retourne autour.
Le jeu retrouve ces noms avec le même parcours (src/data/atlas.js).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def frame(f):
    x, y, w, h, ax, ay = f[:6]
    return {'frame': {'x': x, 'y': y, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h},
            'anchor': {'x': ax / w, 'y': ay / h}}


def phaser_atlas(index, image='sprites.png'):
    frames = {}
    for who, p in index['persos'].items():
        for name, a in p['anims'].items():
            for k, f in enumerate(a['frames']):
                frames[f'persos/{who}/{name}/{k}'] = frame(f)
    for name, a in index['fx'].items():
        for k, f in enumerate(a['frames']):
            frames[f'fx/{name}/{k}'] = frame(f)
    return {'frames': frames, 'meta': {'image': image, 'format': 'RGBA8888', 'scale': '1'}}


def write(dest):
    dest = Path(dest)
    index = json.loads((dest / 'sprites.json').read_text())
    (dest / 'sprites.atlas.json').write_text(json.dumps(phaser_atlas(index), separators=(',', ':')))


if __name__ == '__main__':
    write(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'public/assets/sprites')
