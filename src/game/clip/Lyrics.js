const SING = 3.2;          // une ligne se chante en 3,2 s au plus (ou jusqu'à la suivante)

// Les paroles d'un morceau, lues dans paroles.md (la section « ## 02. … » jusqu'au « --- »
// suivant), posées sur leurs repères de temps et découpées en mots. Le mot chanté à l'instant t
// est estimé en répartissant les mots de la ligne sur sa durée.
export class Lyrics {
  constructor(markdown, section, cues) {
    const start = markdown.indexOf(`## ${section}`);
    const body = start < 0 ? '' : markdown.slice(start).split('\n---')[0];
    const [heading, ...rest] = body.split('\n');
    this.title = heading.replace(/^##\s*\d+\.\s*/, '').trim();
    const lines = rest.map((l) => l.trim()).filter(Boolean);
    this.cues = cues.map(([at, line], i) => {
      const next = cues[i + 1]?.[0] ?? Infinity;
      return { at, end: Math.min(next, at + SING), words: (lines[line] ?? '').split(/\s+/).filter(Boolean) };
    });
  }

  // { cue, word } : la ligne en train d'être chantée et le n° du mot chanté, ou null
  at(t) {
    const cue = this.cues.findLast((c) => c.at <= t);
    if (!cue || t >= cue.end || !cue.words.length) return null;
    const word = Math.min(cue.words.length - 1, Math.floor((t - cue.at) / (cue.end - cue.at) * cue.words.length));
    return { cue, word };
  }
}
