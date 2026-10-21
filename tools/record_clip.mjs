// La vidéo du clip de démo sur « Metal Slug » : ouvre clip.html#export dans Chrome (sans
// fenêtre), joue le clip image par image à 60 i/s, et passe les captures à ffmpeg, qui les
// agrandit (×3, pixels nets, bandes noires jusqu'au 1080p) et y colle le morceau.
//
//   npm run dev                       # dans un autre terminal
//   npm run clip:video [-- sortie.mp4] [--url http://127.0.0.1:5173/clip.html]
//
// Chrome : CHROME=/chemin/vers/chrome si ce n'est pas /usr/bin/google-chrome.
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { CLIP } from '../src/config/clip.js';

const args = process.argv.slice(2);
const urlAt = args.indexOf('--url');
const url = (urlAt >= 0 ? args.splice(urlAt, 2)[1] : 'http://127.0.0.1:5173/clip.html') + '#export';
const out = args[0] ?? 'clip-metal-slug.mp4';
const BATCH = 30;
const BAR = 30;                       // largeur de la barre de progression, en caractères
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// La progression sur une seule ligne du terminal : barre, pourcentage, position dans le morceau,
// temps écoulé et temps restant estimé (au rythme moyen depuis le début du rendu).
function progress(n, total, started) {
  const part = Math.min(1, n / total), spent = (Date.now() - started) / 1000;
  const full = Math.round(part * BAR), left = part > 0 ? spent * (1 - part) / part : 0;
  const bar = '█'.repeat(full) + '░'.repeat(BAR - full);
  const eta = n ? `reste ~${mmss(left)}` : 'calcul…';
  process.stdout.write(`\r[${bar}] ${(part * 100).toFixed(1).padStart(5)} %  morceau ${mmss(n / 60)} / ${mmss(total / 60)}  écoulé ${mmss(spent)}  ${eta}   `);
}

process.stdout.write('Ouverture de Chrome… ');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', (e) => console.error('page :', e.message));
process.stdout.write(`chargement de ${url}… `);
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.clipExport, { timeout: 60000 });
await page.evaluate(() => window.clipExport.ready());
console.log('prêt.');

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', '60', '-i', '-',
  '-i', `public/${CLIP.music}`,
  '-vf', 'scale=iw*3:ih*3:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.ceil(CLIP.duration * 60);
const started = Date.now();
let n = 0;
console.log(`Rendu de ${out} (${total} images, 1080p 60 i/s)`);
progress(0, total, started);
for (;;) {
  const frames = await page.evaluate((k) => window.clipExport.frames(k), BATCH);
  for (const f of frames) {
    if (!ffmpeg.stdin.write(Buffer.from(f.slice(f.indexOf(',') + 1), 'base64'))) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }
  }
  n += frames.length;
  progress(n, total, started);
  if (frames.length < BATCH) break;
}
progress(total, total, started);
process.stdout.write('\nFin de l\'encodage (ffmpeg)…');
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on('close', r));
await browser.close();
console.log(` terminé en ${mmss((Date.now() - started) / 1000)} → ${out}`);
