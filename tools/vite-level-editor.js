import fs from 'node:fs';
import path from 'node:path';

// Plugin Vite (dev seulement) : l'éditeur du jeu enregistre un niveau par POST /__level.
// Le fichier src/data/levels/{id}.json est réécrit, une ligne par élément, et le jeu n'est
// pas rechargé pour autant (l'éditeur garde la main).
export function levelEditor(root) {
  const dir = path.join(root, 'src/data/levels');
  let justSaved = null;
  return {
    name: 'level-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__level', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const def = JSON.parse(body);
            if (!/^[\w-]+$/.test(def.id)) throw new Error('id de niveau invalide');
            justSaved = path.join(dir, `${def.id}.json`);
            fs.writeFileSync(justSaved, format(def));
            res.statusCode = 200;
            res.end('ok');
          } catch (err) {
            res.statusCode = 400;
            res.end(String(err.message));
          }
        });
      });
    },
    // le fichier que l'éditeur vient d'écrire ne recharge pas la page
    handleHotUpdate({ file }) {
      if (justSaved && path.resolve(file) === justSaved) {
        justSaved = null;
        return [];
      }
      return undefined;
    },
  };
}

// une clé par ligne, et pour les listes d'objets un objet par ligne
function format(def) {
  const lines = Object.entries(def).map(([k, v]) => {
    if (Array.isArray(v) && v.length && typeof v[0] === 'object' && !Array.isArray(v[0])) {
      return `  "${k}": [\n${v.map((o) => `    ${JSON.stringify(o)}`).join(',\n')}\n  ]`;
    }
    return `  "${k}": ${JSON.stringify(v)}`;
  });
  return `{\n${lines.join(',\n')}\n}\n`;
}
