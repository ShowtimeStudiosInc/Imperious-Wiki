"""Traces a flat gemstone image (PNG with a transparent background) into an SVG override.

Usage:  python3 scripts/trace_gemstone.py path/to/image.png <slug>
Writes: scripts/gemstone-overrides/<slug>.svg
Then re-run scripts/gemstones.py so the site (and any fusion using this gem) picks it up.
"""
import sys, os
import cv2, numpy as np

src, slug = sys.argv[1], sys.argv[2]
MERGE = float(sys.argv[3]) if len(sys.argv) > 3 else 30  # lower = keep colors that are close together apart
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
if im.shape[2] == 3:
    im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
# Every image is worked at the same size (600 px on its long side), so edges come out equally smooth
# whether the source was small or large. K scales the clean-up sizes, which were tuned at 300 px.
f = 600 / max(im.shape[:2])
im = cv2.resize(im, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC if f > 1 else cv2.INTER_AREA)
K = 2
odd = lambda n: int(n * K) | 1
im = cv2.copyMakeBorder(im, 16, 16, 16, 16, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
# A median blur removes dither and noise textures before the colors are counted.
rgb = cv2.medianBlur(np.ascontiguousarray(im[..., :3]), odd(5))[..., ::-1].astype(int)
alpha = im[..., 3]
opaque = alpha >= 128

# Palette: the flat colors that cover a real share of the gem, near-duplicates merged.
px = rgb[opaque].reshape(-1, 3)
q = (px // 6) * 6
vals, counts = np.unique(q, axis=0, return_counts=True)
order = np.argsort(-counts)
palette = []
for i in order:
    if counts[i] < len(px) * 0.004:
        break
    c = vals[i] + 3
    if all(((c - p) ** 2).sum() > MERGE ** 2 for p in palette):
        palette.append(c)
palette = np.array(palette)
dist = ((rgb[..., None, :] - palette[None, None, :, :]) ** 2).sum(-1)
lab = dist.argmin(-1)
lab[~opaque] = -1
# Majority filter: anti-aliased pixels between two colors often land on a third color and
# leave thin slivers along edges. Each pixel takes the label most common around it.
# The outline is left alone so thin outlines survive.
# The outline is the color that runs along the outer edge of the gem.
_edge = opaque & ~cv2.erode(opaque.astype(np.uint8), np.ones((odd(3), odd(3)), np.uint8)).astype(bool)
_out = int(np.bincount(lab[_edge], minlength=len(palette)).argmax())
was_outline = lab == _out
votes = np.stack([cv2.blur((lab == i).astype(np.float32), (odd(7), odd(7))) for i in range(len(palette))])
votes[_out] = 0
lab = votes.argmax(0)
lab[was_outline] = _out
lab[~opaque] = -1

outline = _out
hexc = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in c)

def smooth_run(p, closed, sigma=5.0):
    """Gaussian-smooths a run of contour points. Open runs keep their two end points fixed."""
    n = len(p)
    if n < 5:
        return p
    r = int(sigma * 2.5)
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    if closed:
        pad = np.concatenate([p[-r:], p, p[:r]])
        return np.stack([np.convolve(pad[:, j], k, 'valid') for j in range(2)], 1)
    pad = np.concatenate([np.repeat(p[:1], r, 0), p, np.repeat(p[-1:], r, 0)])
    out = np.stack([np.convolve(pad[:, j], k, 'valid') for j in range(2)], 1)
    w = np.minimum(np.arange(n), np.arange(n)[::-1]) / max(1, r)
    w = np.clip(w, 0, 1)[:, None]          # ease back to the true points near each corner
    return p * (1 - w) + out * w

def refine(c):
    """Turns a pixel contour into a clean shape: straight edges stay straight, sharp corners stay
    sharp, and curves are smoothed so no pixel steps or wobbles show."""
    pts = c[:, 0, :].astype(float)
    n = len(pts)
    key = cv2.approxPolyDP(c, 3.0 * K, True)[:, 0, :].astype(float)
    corners = []
    if len(key) >= 3:
        for i in range(len(key)):
            a, b, cc = key[i - 1], key[i], key[(i + 1) % len(key)]
            v1, v2 = a - b, cc - b
            cos = (v1 @ v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9)
            if cos > -0.82:  # the edge turns by more than about 35 degrees here
                corners.append(int(np.argmin(((pts - b) ** 2).sum(1))))
    corners = sorted(set(corners))
    if len(corners) < 2:
        sm = smooth_run(pts, True, 3.0 * K)
        ap = cv2.approxPolyDP(sm.astype(np.float32).reshape(-1, 1, 2), 0.35 * K, True)[:, 0, :]
    else:
        out = []
        for j, i0 in enumerate(corners):
            i1 = corners[(j + 1) % len(corners)]
            run = pts[i0:i1 + 1] if i1 > i0 else np.concatenate([pts[i0:], pts[:i1 + 1]])
            run = smooth_run(run, False, 3.0 * K)
            ap_run = cv2.approxPolyDP(run.astype(np.float32).reshape(-1, 1, 2), 0.35 * K, False)[:, 0, :]
            out.extend(ap_run[:-1])
        ap = np.array(out)
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in ap) + ' Z '

def polys(mask, color, holes=False, open_k=5, blur=9):
    open_k, blur = odd(open_k) if open_k > 1 else 1, odd(blur)
    m = mask.astype(np.uint8) * 255
    # smooth the edges so pixel steps and tiny crop flats at the image border don't show as bumps
    m = cv2.GaussianBlur(m, (blur, blur), 0)
    m = ((m > 127) * 255).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((open_k, open_k), np.uint8))
    mode = cv2.RETR_CCOMP if holes else cv2.RETR_EXTERNAL
    cs, _ = cv2.findContours(m, mode, cv2.CHAIN_APPROX_NONE)
    d = ''
    for c in cs:
        if cv2.contourArea(c) < 25 * K * K:
            continue
        d += refine(c)
    return f'<path d="{d.strip()}" fill="{color}" fill-rule="evenodd"/>' if d else ''

fills = sorted((i for i in range(len(palette)) if i != outline), key=lambda i: -(lab == i).sum())
# 1) the whole silhouette in the outline color, so the outer edge is never lighter than the outline,
# 2) the inside in the main color (slightly grown so no seams show), 3) each other flat color,
# 4) the outline ring again on top so nothing covers it.
inside = cv2.dilate(((lab >= 0) & (lab != outline)).astype(np.uint8), np.ones((odd(5), odd(5)), np.uint8)).astype(bool) & opaque
shapes = [polys(opaque, hexc(palette[outline])), polys(inside, hexc(palette[fills[0]]))]
grow = lambda m: cv2.dilate(m.astype(np.uint8), np.ones((odd(5), odd(5)), np.uint8)).astype(bool) & opaque
shapes += [polys(grow(lab == i), hexc(palette[i]), holes=True) for i in fills[1:]]
shapes.append(polys(lab == outline, hexc(palette[outline]), holes=True, open_k=1, blur=5))
shapes = [x for x in shapes if x]

h, w = lab.shape
s = max(w, h)
view = f'{-(s - w) / 2:g} {-(s - h) / 2:g} {s} {s}'
out = os.path.join(ROOT, 'scripts/gemstone-overrides', slug + '.svg')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="200" height="200">\n' + '\n'.join(shapes) + '\n</svg>\n')
print(f'{slug}: {len(palette)} colors, {len(shapes)} shapes -> {os.path.relpath(out, ROOT)}')
