"""Fabrique les sons du jeu : les voix de l'annonceur (façon « HEAVY MACHINE GUN! » de Metal
Slug) et les bruitages.

Usage : .venv/bin/python tools/build_sounds.py
Entrée : tools/sons.json (répliques, effets). Sortie : public/assets/audio/sfx/{id}.mp3.

Voix : synthèse Piper (voix téléchargée une fois dans .venv/voices :
  .venv/bin/python -m piper.download_voices --data-dir .venv/voices en_US-ryan-high),
puis un effet ffmpeg (voix grave et compressée, écho de salle d'arcade ; mégaphone…).
Bruitages : synthétisés ici (bruits filtrés, ondes carrées, accords saturés).
Dépendances : numpy, scipy, piper-tts, ffmpeg.
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SPEC = json.loads((ROOT / 'tools/sons.json').read_text())
OUT = ROOT / 'public/assets/audio/sfx'
RATE = 44100
rng = np.random.default_rng(7)


# --- outils de synthèse ----------------------------------------------------------------------
def t(sec):
    return np.arange(int(sec * RATE)) / RATE


def env(n, attack=0.005, decay=None, curve=4.0):
    """Enveloppe : montée rapide, puis descente exponentielle sur toute la durée."""
    x = np.linspace(0, 1, n)
    e = np.exp(-curve * x)
    a = max(1, int(attack * RATE))
    e[:a] *= np.linspace(0, 1, a)
    return e


def noise(sec):
    return rng.uniform(-1, 1, int(sec * RATE))


def filt(x, lo=None, hi=None):
    if lo and hi:
        b, a = butter(2, [lo / (RATE / 2), hi / (RATE / 2)], 'band')
    elif lo:
        b, a = butter(2, lo / (RATE / 2), 'high')
    else:
        b, a = butter(2, hi / (RATE / 2), 'low')
    return lfilter(b, a, x)


def square(freq, tt):
    return np.sign(np.sin(2 * np.pi * np.cumsum(np.broadcast_to(freq, tt.shape)) / RATE))


def saw(freq, tt):
    ph = np.cumsum(np.broadcast_to(freq, tt.shape)) / RATE
    return 2 * (ph % 1) - 1


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# --- les bruitages ---------------------------------------------------------------------------
def sfx():
    s = {}
    # le médiator : un petit claquement pincé
    tt = t(0.07)
    s['pick'] = norm(square(np.linspace(1500, 500, tt.size), tt) * env(tt.size, curve=7) * 0.5
                     + filt(noise(0.07), lo=2000) * env(tt.size, curve=12), 0.5)
    # le larsen : un sifflement de feedback, court et saturé
    tt = t(0.09)
    f = 2300 + 180 * np.sin(2 * np.pi * 60 * tt)
    s['feedback'] = norm(np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / RATE)) * env(tt.size, curve=5), 0.45)
    # le power chord : quinte de guitare saturée (mi, si, mi)
    tt = t(0.45)
    chord = sum(saw(f0 * (1 + 0.003 * k), tt) for k, f0 in enumerate([82.4, 123.5, 164.8]))
    s['chord'] = norm(filt(np.tanh(4 * chord), hi=3500) * env(tt.size, attack=0.004, curve=4), 0.7)
    # les tirs ennemis : une détonation sèche ; le zap de l'homme-TV : un grésillement
    tt = t(0.12)
    s['enemy_shot'] = norm(filt(noise(0.12), hi=2500) * env(tt.size, curve=10) + np.sin(2 * np.pi * 140 * tt) * env(tt.size, curve=14), 0.6)
    tt = t(0.18)
    s['zap'] = norm(square(900 + 400 * np.sign(np.sin(2 * np.pi * 45 * tt)), tt) * env(tt.size, curve=4) * 0.6
                    + filt(noise(0.18), lo=3000) * 0.3 * env(tt.size, curve=6), 0.45)
    # un coup reçu : un bruit sourd
    tt = t(0.09)
    s['hit'] = norm(filt(noise(0.09), hi=900) * env(tt.size, curve=9) + np.sin(2 * np.pi * np.linspace(180, 60, tt.size) * tt) * env(tt.size, curve=8), 0.7)
    # l'explosion : grondement grave et souffle
    tt = t(1.0)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 30, tt.size)) / RATE) * env(tt.size, curve=5)
    s['explosion'] = norm(filt(noise(1.0), hi=1200) * env(tt.size, attack=0.002, curve=4.5) + 0.8 * boom, 0.95)
    tt = t(1.8)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(70, 25, tt.size)) / RATE) * env(tt.size, curve=3)
    s['big_explosion'] = norm(filt(noise(1.8), hi=900) * env(tt.size, attack=0.002, curve=3) + boom, 0.95)
    # le vinyle lancé, le corps à corps : des souffles
    tt = t(0.22)
    s['throw'] = norm(filt(noise(0.22), lo=800, hi=4000) * np.sin(np.pi * np.linspace(0, 1, tt.size)), 0.35)
    tt = t(0.12)
    s['melee'] = norm(filt(noise(0.12), lo=1500, hi=6000) * env(tt.size, curve=5), 0.45)
    # un bonus ramassé : arpège montant
    notes = [523.3, 659.3, 784.0, 1046.5]
    s['pickup'] = norm(np.concatenate([square(f0, t(0.06)) * env(int(0.06 * RATE), curve=3) for f0 in notes]), 0.35)
    # une caisse qui casse : craquement de bois
    tt = t(0.25)
    s['crate'] = norm(sum(filt(noise(0.25), lo=300 + 400 * k, hi=1500 + 900 * k) * env(tt.size, curve=6 + 3 * k) for k in range(3)), 0.6)
    # la porte de garage qui monte : un roulement métallique
    tt = t(0.7)
    s['door'] = norm(filt(noise(0.7), lo=200, hi=2500) * (0.6 + 0.4 * square(28, tt)) * np.minimum(1, 6 * (1 - tt / 0.7)), 0.45)
    # le skate : roulement des roues, avec le tac-tac des joints du trottoir
    tt = t(0.6)
    roll = filt(noise(0.6), lo=150, hi=1400) * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * tt))
    clicks = np.zeros(tt.size)
    for k in range(4):
        i = int((0.08 + k * 0.13) * RATE)
        clicks[i:i + 300] += np.exp(-np.arange(300) / 40) * 2
    s['skate'] = norm((roll + filt(clicks, hi=2500)) * np.minimum(1, 8 * tt) * np.minimum(1, 5 * (0.6 - tt)), 0.55)
    # le canon à eau : un jet qui siffle
    tt = t(0.14)
    s['water'] = norm(filt(noise(0.14), lo=2500, hi=8000) * env(tt.size, curve=3), 0.3)
    return s


def write_mp3(samples, path):
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(samples, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-b:a', '96k', str(path)], check=True)


# --- les voix ----------------------------------------------------------------------------------
def voice(model, text, effect, path):
    with tempfile.NamedTemporaryFile(suffix='.wav') as raw:
        subprocess.run([sys.executable, '-m', 'piper', '-m', str(model), '-f', raw.name],
                       input=text.encode(), check=True, capture_output=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw.name, '-af', effect + ',apad=pad_dur=0.25',
                        '-ac', '1', '-b:a', '96k', str(path)], check=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, samples in sfx().items():
        write_mp3(samples, OUT / f'{name}.mp3')
        print(f'{name:16} {samples.size / RATE:.2f} s')
    model = ROOT / '.venv/voices' / f"{SPEC['voix']}.onnx"
    if not model.exists():
        print(f'  ! voix absente : {model} (voir l\'en-tête de ce fichier)')
        return
    for name, r in SPEC['repliques'].items():
        voice(model, r['texte'], SPEC['effets'][r['effet']], OUT / f'{name}.mp3')
        print(f'{name:16} « {r["texte"]} »')


if __name__ == '__main__':
    main()
