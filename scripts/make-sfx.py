"""Builds the Listen player's band and studio sounds from scratch (no samples, nothing to license).

Run:  python3 scripts/make-sfx.py
Out:  public/audio/sfx/<name>.mp3

Crowd voices can't be made this way. Drop real clips into public/audio/sfx/ named laugh.mp3, laugh-big.mp3,
aww.mp3, ooh.mp3, gasp.mp3 and groan.mp3, then re-run this script so they're added to manifest.json.
The player only plays sounds listed in manifest.json. See CUES in ListenPlayer.astro.
"""
import os, subprocess, tempfile
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public/audio/sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def t(sec): return np.arange(int(SR * sec)) / SR
def bp(x, lo, hi, order=2): b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def lp(x, f, order=2): b, a = butter(order, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f, order=2): b, a = butter(order, f / (SR / 2), 'high'); return lfilter(b, a, x)
def note(n): return 440.0 * 2 ** ((n - 69) / 12)
def env(n, a=0.01, d=0.2, s=0.6, r=0.2, length=None):
    length = length or n / SR
    tt = np.arange(n) / SR
    e = np.ones(n) * s
    e[tt < a] = tt[tt < a] / a
    m = (tt >= a) & (tt < a + d); e[m] = 1 - (1 - s) * (tt[m] - a) / d
    rel = tt > length - r; e[rel] *= np.clip((length - tt[rel]) / r, 0, 1)
    return e
def room(x, size=0.6, wet=0.25):
    ir = rng.standard_normal(int(SR * size)) * np.exp(-np.arange(int(SR * size)) / (SR * size / 5))
    ir = lp(ir, 5000)
    y = fftconvolve(x, ir)[: len(x) + int(SR * size)]
    y = y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
    out = np.zeros(len(y)); out[: len(x)] += x * (1 - wet); return out + y * wet
def mix(length, *parts):
    out = np.zeros(int(SR * length))
    for start, sig in parts:
        i = int(SR * start); j = min(len(out), i + len(sig)); out[i:j] += sig[: j - i]
    return out

def brass(freqs, dur, bright=2500, vib=5.5):
    tt = t(dur); sig = np.zeros(len(tt))
    for f in freqs:
        ph = 2 * np.pi * f * tt + 0.004 * np.sin(2 * np.pi * vib * tt) * f
        saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
        sig += saw
    cut = np.linspace(bright * 1.3, bright * 0.6, len(tt))
    sig = lp(sig, bright, 2) * env(len(tt), 0.02, 0.12, 0.7, min(0.25, dur / 3))
    return sig / len(freqs)

def piano(f, dur):
    tt = t(dur); s = sum(np.sin(2 * np.pi * f * k * tt) * (0.6 ** (k - 1)) for k in range(1, 6))
    return s * np.exp(-tt * 3.5) * env(len(tt), 0.003, 0.05, 1, 0.08)

def kick(dur=0.35):
    tt = t(dur); f = 50 + 90 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)

def snare(dur=0.2, tone=0.4):
    tt = t(dur); n = bp(rng.standard_normal(len(tt)), 1500, 7000) * np.exp(-tt * 25)
    return n + tone * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 30)

def cymbal(dur=1.8):
    tt = t(dur); n = hp(rng.standard_normal(len(tt)), 5000, 3)
    metal = sum(np.sin(2 * np.pi * f * tt) for f in (3150, 4870, 6230, 7410, 8990)) * 0.15
    return (n + metal) * np.exp(-tt * 2.6) * env(len(tt), 0.002, 0.05, 1, 0.3)

def claps(dur, rate, loud=1.0, swell=True):
    n = int(SR * dur); out = np.zeros(n)
    count = int(rate * dur)
    for _ in range(count):
        start = rng.uniform(0, dur - 0.05)
        L = int(SR * rng.uniform(0.006, 0.014))
        burst = bp(rng.standard_normal(L + 200), rng.uniform(700, 1100), rng.uniform(2200, 4200))[:L] * np.exp(-np.arange(L) / (L / 3))
        i = int(SR * start); out[i:i + L] += burst * rng.uniform(0.3, 1.0)
    tt = np.arange(n) / SR
    shape = np.minimum(1, tt / 0.35) * np.clip((dur - tt) / (dur * 0.45), 0, 1) if swell else 1
    return hp(room(out * shape * loud, 0.8, 0.35), 400, 2)

def whistle(dur, f=2900):
    tt = t(dur); trill = 1 + 0.06 * np.sign(np.sin(2 * np.pi * 32 * tt))
    tone = np.sin(2 * np.pi * np.cumsum(f * trill) / SR) + 0.25 * bp(rng.standard_normal(len(tt)), 2500, 3500)
    return tone * env(len(tt), 0.015, 0.05, 0.9, 0.04)

def save(name, x, gain=0.85):
    x = np.asarray(x, dtype=float)
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    fade = int(SR * 0.02); x[-fade:] *= np.linspace(1, 0, fade)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        import wave
        w = wave.open(f.name, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f.name, '-ac', '1', '-b:a', '96k', os.path.join(OUT, name + '.mp3')], check=True)
        os.unlink(f.name)

# --- band ---
C = [60, 64, 67, 72]
save('sting', mix(1.1, (0, brass([note(n) for n in (55, 59, 62, 65)], 0.16)), (0.2, brass([note(n) for n in C], 0.7)),
                  (0, kick()), (0.2, kick()), (0.2, cymbal(0.9) * 0.5)))
save('fanfare', mix(2.4, (0, brass([note(n) for n in (60, 64, 67)], 0.18)), (0.22, brass([note(n) for n in (62, 65, 69)], 0.18)),
                    (0.44, brass([note(n) for n in (64, 67, 71)], 0.18)), (0.7, brass([note(n) for n in (65, 69, 72, 77)], 1.6)),
                    *[(i * 0.22, snare(0.15)) for i in range(3)], (0.7, kick()), (0.7, cymbal(1.6) * 0.6)))
melody = [(72, .25), (76, .25), (79, .5), (77, .25), (76, .25), (74, .5), (76, .25), (77, .25), (79, .25), (84, .25), (83, .5), (84, 1.0)]
parts, pos = [], 0.0
for n_, d in melody:
    parts.append((pos, brass([note(n_), note(n_ - 12)], d * 0.95, 3000) * 0.9)); pos += d
for beat_ in range(int(pos / 0.25)):
    parts.append((beat_ * 0.25, kick(0.3) if beat_ % 4 in (0, 2) else snare(0.15) * 0.7))
for i, ch in enumerate([(48, 52, 55), (53, 57, 60), (55, 59, 62), (48, 52, 55, 60)]):
    parts.append((i * 1.0, brass([note(n) for n in ch], 1.0 if i < 3 else 1.4, 1500) * 0.5))
parts.append((pos - 1.0, cymbal(1.6) * 0.6))
save('theme', mix(pos + 1.0, *parts))
save('cymbal', cymbal(1.8))
roll = np.zeros(int(SR * 1.6))
for i in range(int(1.25 * 22)):
    s_ = snare(0.08, 0.2) * (0.25 + 0.75 * i / 27); j = int(SR * i / 22); roll[j:j + len(s_)] += s_[: len(roll) - j]
save('drumroll', mix(2.8, (0, roll), (1.25, cymbal(1.5)), (1.25, kick())))
wah = [(58, .45), (57, .45), (56, .45), (55, 1.3)]
parts, pos = [], 0.0
for n_, d in wah:
    tt = t(d); f = note(n_ - 12) * (1 + (0.02 * np.sin(2 * np.pi * 6 * tt) if d > 1 else 0))
    ph = np.cumsum(f * np.ones(len(tt))) / SR; saw = 2 * (ph % 1) - 1
    wahf = lp(saw, 900, 2) * env(len(tt), 0.04, 0.1, 0.8, 0.12)
    parts.append((pos, wahf)); pos += d
save('trombone', mix(pos + 0.2, *parts))
save('sour', mix(1.6, *[(0.01 * k, piano(note(n), 1.5)) for k, n in enumerate((60, 61, 66, 67))]))
save('bassdrop', mix(1.6, (0, brass([note(36)], 0.55, 600)), (0.6, brass([note(31)], 0.9, 500))))
save('keys', mix(1.3, (0, piano(note(72), 0.6)), (0.25, piano(note(76), 0.6)), (0.5, piano(note(74), 0.8))))
# --- studio ---
save('whistle', mix(0.6, (0, whistle(0.45))))
save('whistle2', mix(1.0, (0, whistle(0.22)), (0.35, whistle(0.4))))
save('applause', claps(3.0, 260), 0.6)
save('applause-light', claps(2.0, 40, swell=True), 0.45)
cheer = claps(4.0, 420)
for _ in range(6):
    st = rng.uniform(0.2, 2.5); w = whistle(rng.uniform(0.3, 0.6), rng.uniform(1800, 2600)) * 0.12
    cheer[int(SR * st): int(SR * st) + len(w)] += w
save('cheer', cheer, 0.7)
names = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith('.mp3'))
import json
json.dump(names, open(os.path.join(OUT, 'manifest.json'), 'w'))
print('made', names)
