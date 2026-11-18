"""Traces a flat gemstone image (PNG with a transparent background) into an SVG override.

Usage:  python3 scripts/trace_gemstone.py path/to/image.png <slug>
Writes: scripts/gemstone-overrides/<slug>.svg
Then re-run scripts/gemstones.py so the site (and any fusion using this gem) picks it up.
"""
import sys, os
import cv2, numpy as np

src, slug = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
if im.shape[2] == 3:
    im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
im = cv2.copyMakeBorder(im, 8, 8, 8, 8, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
rgb = im[..., :3][..., ::-1].astype(int)
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
    if all(((c - p) ** 2).sum() > 30 ** 2 for p in palette):
        palette.append(c)
palette = np.array(palette)
dist = ((rgb[..., None, :] - palette[None, None, :, :]) ** 2).sum(-1)
lab = dist.argmin(-1)
lab[~opaque] = -1
# Majority filter: anti-aliased pixels between two colors often land on a third color and
# leave thin slivers along edges. Each pixel takes the label most common around it.
votes = np.stack([cv2.blur((lab == i).astype(np.float32), (7, 7)) for i in range(len(palette))])
lab = votes.argmax(0)
lab[~opaque] = -1

lum = palette @ np.array([0.299, 0.587, 0.114])
outline = int(np.argmin(lum))
hexc = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in c)

def polys(mask, color, holes=False):
    m = mask.astype(np.uint8) * 255
    # smooth the edges so pixel steps and tiny crop flats at the image border don't show as bumps
    m = cv2.GaussianBlur(m, (7, 7), 0)
    m = ((m > 127) * 255).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    mode = cv2.RETR_CCOMP if holes else cv2.RETR_EXTERNAL
    cs, _ = cv2.findContours(m, mode, cv2.CHAIN_APPROX_NONE)
    d = ''
    for c in cs:
        if cv2.contourArea(c) < 25:
            continue
        ap = cv2.approxPolyDP(c, 1.0, True)
        d += 'M' + ' L'.join(f'{p[0][0]},{p[0][1]}' for p in ap) + ' Z '
    return f'<path d="{d.strip()}" fill="{color}" fill-rule="evenodd"/>' if d else ''

fills = sorted((i for i in range(len(palette)) if i != outline), key=lambda i: -(lab == i).sum())
# 1) the whole silhouette in the outline color, so the outer edge is never lighter than the outline,
# 2) the inside in the main color (slightly grown so no seams show), 3) each other flat color,
# 4) the outline ring again on top so nothing covers it.
inside = cv2.dilate(((lab >= 0) & (lab != outline)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & opaque
shapes = [polys(opaque, hexc(palette[outline])), polys(inside, hexc(palette[fills[0]]))]
grow = lambda m: cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & opaque
shapes += [polys(grow(lab == i), hexc(palette[i])) for i in fills[1:]]
shapes.append(polys(lab == outline, hexc(palette[outline]), holes=True))
shapes = [x for x in shapes if x]

h, w = lab.shape
s = max(w, h)
view = f'{-(s - w) / 2:g} {-(s - h) / 2:g} {s} {s}'
out = os.path.join(ROOT, 'scripts/gemstone-overrides', slug + '.svg')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="200" height="200">\n' + '\n'.join(shapes) + '\n</svg>\n')
print(f'{slug}: {len(palette)} colors, {len(shapes)} shapes -> {os.path.relpath(out, ROOT)}')
