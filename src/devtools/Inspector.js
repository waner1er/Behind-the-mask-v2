import { perso } from '../data/sprites.js';
import { ORDER } from '../config/anims.js';
import { isHero } from '../config/cast.js';
import { CRS } from '../config/combat.js';

const SOURCES = { planches: 'nouvelles planches', crs: 'planche CRS (sources)', ennemi: 'planche de méchant' };
const ZOOM = 2, PAD = 4;

// L'inspecteur des images : l'état de chaque planche, puis chaque anim d'un perso, image par
// image, avec l'ancrage (vert), les hanches (jaune) et la bouche de l'arme (rouge).
export class Inspector {
  constructor({ status, rows, atlas, list }) {
    Object.assign(this, { status, rows, atlas, list });
    this.shown = 'pierre';
  }

  show(id) {
    this.shown = id;
    this.render();
  }

  render() {
    this.#renderStatus();
    this.rows.innerHTML = '';
    const p = perso(this.shown);
    this.#order(p).forEach((name) => this.rows.appendChild(this.#row(p, name)));
  }

  #renderStatus() {
    this.status.innerHTML = this.list.map(({ id, name }) => {
      const p = perso(id), miss = p.manque.length;
      const src = SOURCES[p.source] || 'ancienne planche';
      return `<b>${name}</b> : ${src}, ${miss ? miss + ' anim(s) à générer' : 'complet'}`;
    }).join('<br>');
  }

  // les anims attendues pour ce perso, présentes ou non
  #order(p) {
    if (isHero(this.shown)) return ORDER;
    if (this.shown === CRS.id) return ['idle', 'walk', 'run', ...ORDER.slice(1)];
    return [...Object.keys(p.anims), ...p.manque.filter((n) => !p.anims[n])];
  }

  #row(p, name) {
    const row = document.createElement('div');
    row.className = 'anim';
    const a = p.anims[name], fresh = !p.manque.includes(name);
    const cls = !a ? 'none' : fresh ? 'new' : 'old';
    const why = !a ? 'manque' : fresh ? 'planche' : 'ancienne';
    row.innerHTML = `<span class="${cls}">${name}<br>${why}${a ? ' · ' + a.frames.length + ' img' : ''}</span>`;
    if (a) row.appendChild(this.#strip(p, a));
    return row;
  }

  // toutes les images de l'anim côte à côte, alignées sur leur ancrage
  #strip(p, a) {
    const top = Math.max(...a.frames.map((f) => f[5])), bottom = Math.max(...a.frames.map((f) => f[3] - f[5]));
    const left = Math.max(...a.frames.map((f) => f[4])), right = Math.max(...a.frames.map((f) => f[2] - f[4]));
    const cw = left + right + PAD * 2, ch = top + bottom + PAD * 2;
    const c = document.createElement('canvas');
    c.width = cw * a.frames.length; c.height = ch;
    c.style.width = c.width * ZOOM + 'px'; c.style.height = c.height * ZOOM + 'px';
    const g = c.getContext('2d');
    a.frames.forEach((f, k) => {
      const ox = k * cw + PAD + left, oy = PAD + top;
      g.drawImage(this.atlas, f[0], f[1], f[2], f[3], ox - f[4], oy - f[5], f[2], f[3]);
      g.fillStyle = '#0f0'; g.fillRect(ox - 2, oy, 5, 1);
      g.fillStyle = '#ff0'; g.fillRect(ox - 6, oy - p.hanches, 13, 1);
      if (f.length > 6) { g.fillStyle = '#f00'; g.fillRect(ox + f[6] - 1, oy + f[7] - 1, 3, 3); }
      g.fillStyle = '#0004'; g.fillRect((k + 1) * cw - 1, 0, 1, ch);
    });
    return c;
  }
}
