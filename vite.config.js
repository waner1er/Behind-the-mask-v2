import { defineConfig } from 'vite';
import { levelEditor } from './tools/vite-level-editor.js';

// Trois pages : le jeu (index.html), la galerie (galerie.html) et le banc d'essai (demo.html).
// Les images et les sons du jeu sont dans public/assets/ et copiés tels quels ; le code compilé
// va dans bundle/. base relative : le build marche aussi depuis un sous-dossier (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [levelEditor(import.meta.dirname)],
  // en dev, Valet renvoie http://vigigames.test vers ce serveur (valet proxy)
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['vigigames.test'],
    // le rechargement à chaud se connecte directement à Vite (le proxy de Valet ne passe pas les websockets)
    hmr: { host: '127.0.0.1', clientPort: 5173 },
  },
  build: {
    target: 'es2022',
    assetsDir: 'bundle',
    // Phaser seul fait ~1,4 Mo (non découpable) : on ne veut l'alerte que pour notre code
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      input: {
        index: 'index.html',
        galerie: 'galerie.html',
        demo: 'demo.html',
        clip: 'clip.html',
      },
      output: {
        // Phaser dans son propre fichier : il change rarement, le navigateur le garde en cache
        codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }] },
      },
    },
  },
});
