const HOLD = 4.5;          // une ligne reste au plus 4,5 s à l'écran
const SING = 3;            // le surlignage avance pendant au plus 3 s (le temps de chanter la ligne)

// Les paroles d'un morceau, lues dans paroles.md (la section « ## 02. … » jusqu'au « --- »
// suivant), et leurs repères de temps : la ligne à afficher à l'instant t, et la part déjà
// chantée (pour le surlignage façon karaoké).
export class Lyrics {
  constructor(markdown, section, cues) {
    const start = markdown.indexOf(`## ${section}`);
    const body = start < 0 ? '' : markdown.slice(start).split('\n---')[0];
    const [heading, ...rest] = body.split('\n');
    this.title = heading.replace(/^##\s*\d+\.\s*/, '').trim();
    this.lines = rest.map((l) => l.trim()).filter(Boolean);
    this.cues = cues.map(([at, line], i) => {
      const next = cues[i + 1]?.[0] ?? Infinity;
      return { at, text: this.lines[line] ?? '', end: Math.min(next, at + HOLD), sung: Math.min(next - at - 0.3, SING) };
    });
  }

  // { text, progress } de la ligne affichée à l'instant t, ou null
  at(t) {
    const c = this.cues.findLast((c) => c.at <= t);
    if (!c || t >= c.end) return null;
    return { text: c.text, progress: Math.min(1, (t - c.at) / c.sung), age: t - c.at, left: c.end - t };
  }
}
