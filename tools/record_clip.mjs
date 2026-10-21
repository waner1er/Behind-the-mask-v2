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

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1280,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.on('pageerror', (e) => console.error('page :', e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.clipExport, { timeout: 60000 });
await page.evaluate(() => window.clipExport.ready());

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', '60', '-i', '-',
  '-i', `public/${CLIP.music}`,
  '-vf', 'scale=iw*3:ih*3:flags=neighbor,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.ceil(CLIP.duration * 60);
let n = 0;
for (;;) {
  const frames = await page.evaluate((k) => window.clipExport.frames(k), BATCH);
  for (const f of frames) {
    if (!ffmpeg.stdin.write(Buffer.from(f.slice(f.indexOf(',') + 1), 'base64'))) {
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
    }
  }
  n += frames.length;
  process.stdout.write(`\r${n} / ${total} images`);
  if (frames.length < BATCH) break;
}
ffmpeg.stdin.end();
await new Promise((r) => ffmpeg.on('close', r));
await browser.close();
console.log(`\n${out}`);
