"""Builds a flat gemstone vector for every Gem-Type.

Style: thick outline in the gem's darkest shade, 3 to 5 flat tones, no gradients.
Fusions are built from their two halves' gemstones, overlapped in different arrangements.

Run:  python3 scripts/gemstones.py
Out:  public/images/gemstones/<slug>.svg

To change a gemstone, edit its line in GEMS below (cut, color, extras) and re-run.
"""
import math, os, re, glob, hashlib
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/images/gemstones')
os.makedirs(OUT, exist_ok=True)

# slug: (cut, base color, extras)
# cuts: round oval emerald emerald-long square pear heart triangle marquise hexagon pentagon diamond
#       cabochon cab-oval pearl ingot nugget torus
# extras: multi=[colors] bands=color flecks=color swirl=color slit=True split=[a,b] watermelon=True
GEMS = {
    # 1.2
    'cubic-zirconia': ('diamond', '#ece8fb', {}),
    'diamond-pearl': ('pearl', '#efe6f6', {}),
    'diamond-spinel': ('heart', '#ff5fa8', {}),
    # 2.1
    'demantoid': ('round', '#46c95f', {}),
    'hematite-era-0': ('hexagon', '#5a4650', {}),
    'hessonite-era-0': ('square', '#c9581f', {}),
    'hessonite-era-1': ('square', '#f08a3c', {}),
    'pyrope': ('oval', '#c8213f', {}),
    'sapphire': ('round', '#3b6ff0', {}),
    'zoisite': ('pear', '#8a5bd6', {'multi': ['#8a5bd6', '#5fbf6a']}),
    # 2.2
    'charoite': ('cab-oval', '#8b4fc9', {'swirl': '#c9a6f2'}),
    'emerald': ('emerald', '#2fbf6f', {}),
    'gold-era-0-1': ('ingot', '#e8b923', {}),
    'gold-era-2a': ('nugget', '#f2c94c', {}),
    'hematite-era-2': ('hexagon', '#6e4a52', {}),
    'kyanite': ('marquise', '#3f6fe0', {}),
    'nacre': ('pearl', '#e3dcf2', {'multi': ['#e3dcf2', '#c9f0ec', '#f6dceb']}),
    'pink-tourmaline': ('emerald-long', '#ff6fa6', {}),
    'labradorite': ('cab-oval', '#3a4a5a', {'bands': '#4fd0e0'}),
    'celestine': ('cabochon', '#8fc6f0', {}),
    'seraphinite': ('cab-oval', '#2f7a5a', {'bands': '#cfe8dc'}),
    'iolite': ('round', '#5a5ad6', {}),
    'astrophyllite': ('emerald-long', '#a8742a', {}),
    'platinum': ('ingot', '#dfe3ea', {}),
    'rhodochrosite': ('cab-oval', '#e8507a', {'bands': '#f7a8bf'}),
    'scapolite': ('square', '#f2cf5b', {}),
    # 2.3
    'crocoite': ('emerald-long', '#e0501f', {}),
    'agate': ('cab-oval', '#7b8fe0', {'bands': '#c4ceff'}),
    'amber': ('cab-oval', '#f5a623', {}),
    'aquamarine': ('pear', '#6fdcec', {}),
    'azurite': ('triangle', '#2b4fc9', {}),
    'beryl': ('hexagon', '#7fe8be', {}),
    'catseye': ('cab-oval', '#c9a43b', {'slit': True}),
    'fluorite': ('square', '#9b7ff0', {'multi': ['#9b7ff0', '#6fd8b8']}),
    'jade': ('cabochon', '#3fbf7f', {}),
    'morganite': ('oval', '#f5a3c2', {}),
    'onyx': ('cab-oval', '#2a2730', {'bands': '#e9e6ee'}),
    'polyhedroid-agate': ('hexagon', '#c98bd6', {'split': ['#c98bd6', '#f2e6f6']}),
    # 3.1
    'black-tourmaline-schorl': ('emerald-long', '#34303c', {}),
    'dragon-s-breath-fire-opal': ('cab-oval', '#ff5a2a', {'flecks': '#ffd34a'}),
    'titanium': ('ingot', '#c7ccd6', {}),
    'topaz': ('square', '#f6c443', {}),
    # 3.2
    'quartz': ('pentagon', '#e6dcff', {}),
    'amethyst': ('quartz', '#9b59d6', {}),
    'aventurine': ('quartz', '#4fbf7a', {}),
    'blue-quartz': ('quartz', '#5f8fff', {}),
    'carnelian': ('quartz', '#e2552c', {}),
    'cherry-quartz': ('quartz', '#ff4f6e', {}),
    'citrine': ('quartz', '#f2b632', {}),
    'jasper': ('quartz', '#e0662d', {}),
    'milky-quartz': ('quartz', '#e8e2f0', {}),
    'obsidian': ('triangle', '#43355a', {}),
    'prasiolite': ('quartz', '#9fd66a', {}),
    'rose-quartz': ('quartz', '#ff9ec4', {}),
    'smoky-quartz': ('quartz', '#8a7a6b', {}),
    'bumblebee-jasper': ('quartz', '#f2b52e', {'bands': '#2a2218'}),
    'zebra-jasper': ('quartz', '#ece8df', {'bands': '#2a2730'}),
    # 3.3
    'aragonite': ('hexagon', '#e8a66a', {}),
    'eucryptite': ('triangle', '#f0e6a8', {}),
    'prasiolite-goshenite': ('round', '#b6e38a', {'split': ['#b6e38a', '#eef2f6']}),
    'ruby': ('square', '#e0213b', {}),
    # 4.1
    'angelite': ('oval', '#8fb8f0', {}),
    'bronze-era-0-1': ('ingot', '#b87333', {}),
    'opal': ('cabochon', '#f0e8ff', {'flecks': '#7fe0d6'}),
    'padparadscha-sapphire': ('oval', '#ff9a7a', {}),
    'peridot-era-0': ('triangle', '#86cc3e', {}),
    'rutile': ('emerald', '#d9b46a', {'flecks': '#8a5a1f'}),
    'serpentine': ('pear', '#7fbf5a', {}),
    'steel-era-0-1': ('ingot', '#8f99ab', {}),
    'steel-era-2a': ('ingot', '#b8c0cf', {}),
    'stellite': ('hexagon', '#a9b6d6', {}),
    'tungsten': ('ingot', '#6f7684', {}),
    'willemite': ('hexagon', '#5fe0a8', {}),
    'zircon': ('diamond', '#5a8bff', {}),
    # 4.2
    'bismuth': ('square', '#ff8fd0', {'multi': ['#ff8fd0', '#7fd6ff', '#ffd27f']}),
    'blue-tourmaline-indicolite-era-2a': ('emerald-long', '#3f7fe0', {}),
    'blue-tourmaline-indicolite-era-1': ('emerald-long', '#3f7fe0', {}),
    'calcite': ('diamond', '#f2e6c4', {}),
    'chromium': ('ingot', '#c0c7d4', {}),
    'chrysoberyl': ('oval', '#e6d24a', {}),
    'clinohumite': ('oval', '#ff8a3d', {}),
    'cobalt': ('ingot', '#3f5fc9', {}),
    'goshenite': ('round', '#e6ecf4', {}),
    'green-tourmaline-chrome': ('emerald-long', '#3fbf5a', {}),
    'lapis': ('pear', '#2f4fd6', {}),
    'larimar': ('cabochon', '#7fdcff', {'swirl': '#f2fcff'}),
    'malachite': ('cab-oval', '#2fae6f', {'bands': '#0f6e40'}),
    'nephrite': ('cabochon', '#3f9f6a', {}),
    'orange-spodumene': ('marquise', '#ff9a3d', {}),
    'peridot-era-1': ('triangle', '#a6e35b', {}),
    'peridot-era-2a': ('triangle', '#b8f06a', {}),
    'pezzottaite': ('heart', '#ff6f8f', {}),
    'selenite': ('marquise', '#efeafc', {}),
    'shattuckite': ('cabochon', '#2f7fd6', {'swirl': '#7fc0ff'}),
    'silver': ('ingot', '#d6dbe6', {}),
    'snowflake-obsidian': ('cabochon', '#2a2730', {'flecks': '#f2f0f6'}),
    'spodumene': ('emerald', '#b7a3f0', {}),
    'sunstone': ('oval', '#ff9b4a', {'flecks': '#ffe08a'}),
    'tektite': ('marquise', '#4f6040', {}),
    'tivcral': ('ingot', '#5a6170', {}),
    'turquoise': ('cabochon', '#3fd6c9', {'swirl': '#1f8a80'}),
    'verdelite': ('emerald-long', '#2f9f4f', {}),
    'yooperlite': ('cabochon', '#7a7480', {'flecks': '#ff9b3d'}),
    # 4.3
    'bronze-era-2': ('ingot', '#c98b4a', {}),
    'brown-tourmaline-dravite': ('emerald-long', '#8a5a2f', {}),
    'cavansite': ('round', '#2f7fff', {}),
    'copper': ('ingot', '#d9784a', {}),
    'graphene': ('torus', '#6b6f78', {}),
    'iron': ('ingot', '#8d939c', {}),
    # 5.1
    'pearl': ('pearl', '#f3e9ef', {}),
    'specialty-pearl': ('pearl', '#f6dff0', {'multi': ['#f6dff0', '#dff0f6']}),
    'spinel': ('heart', '#ff5aa0', {}),
    'watermelon-tourmaline': ('emerald-long', '#ff6f9a', {'watermelon': True}),
    # 5.2
    'coal': ('nugget', '#3a3a42', {}),
    'richterite': ('marquise', '#8a5a4a', {}),
    'salt': ('square', '#f4f4f8', {}),
    'uranium': ('ingot', '#7d8a72', {}),
    # Lost Lights
    'iris-agate': ('cab-oval', '#9b8cff', {'bands': '#ffb3e0', 'multi': ['#9b8cff', '#7fe0ff', '#ffd27f']}),
    'rainbow-angelite': ('oval', '#ff8fb0', {'multi': ['#ff8fb0', '#ffd27f', '#7fe0b0', '#7fb0ff', '#c08fff']}),
    'rainbow-obsidian': ('triangle', '#43355a', {'multi': ['#43355a', '#6a3f8a', '#2f6a7a', '#7a5a2f']}),
    'rainbow-quartz': ('quartz', '#ff8fb0', {'multi': ['#ff8fb0', '#ffd27f', '#7fe0b0', '#7fb0ff', '#c08fff', '#ff9f7f']}),
    'titanium-aura-quartz': ('quartz', '#5a7fff', {'multi': ['#5a7fff', '#c95aff', '#5affd0', '#ffd25a', '#ff7ab0', '#7ad0ff']}),
    'wittichenite': ('hexagon', '#5a6a8a', {}),
}

# ---------- color helpers ----------
def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
def to_hex(t): return '#%02x%02x%02x' % tuple(max(0, min(255, round(v))) for v in t)
def mix(c, other, t):
    a, b = hx(c), hx(other); return to_hex(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))
def lum(c):
    r, g, b = hx(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255
import colorsys

def _hsl(c):
    r, g, b = (v / 255 for v in hx(c))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return h * 360, s, l

def _hex(h, s, l):
    r, g, b = colorsys.hls_to_rgb((h % 360) / 360, max(0, min(1, l)), max(0, min(1, s)))
    return to_hex((r * 255, g * 255, b * 255))

def _toward(h, target, amount):
    d = ((target - h + 540) % 360) - 180
    return h + max(-abs(d), min(abs(d), amount)) * (1 if d >= 0 else -1)

def tones(c):
    """The same shading recipe as the hand-made gemstones: shadows get darker, richer, and lean
    toward violet; lights get brighter and lean warm (reds, yellows, greens) or cool (blues, purples);
    the outline is a deep, saturated version of the gem's own color."""
    h, s, l = _hsl(c)
    warm = h < 150 or h >= 300
    lit = 60 if warm else 195
    grey = s < 0.12
    sat = (lambda x: s) if grey else (lambda x: min(1, x))
    if l > 0.85:   # pale gems (white, pearl-like): soft shadows, no heavy color push
        return {
            'outline': _hex(h, min(1, s * 0.6 + 0.2), 0.32),
            'dark': _hex(h, s * 0.7, l - 0.2),
            'mdark': _hex(h, s * 0.8, l - 0.1),
            'base': c,
            'light': _hex(h, s, min(0.97, l + 0.05)),
            'hi': '#ffffff',
        }
    return {
        'outline': _hex(_toward(h, 270, 25), sat(s * 1.1 + 0.15), 0.17 if l < 0.8 else 0.3),
        'dark': _hex(_toward(h, 270, 12), sat(s * 1.05 + 0.08), l * 0.6),
        'mdark': _hex(_toward(h, 270, 6), sat(s * 1.02 + 0.04), l * 0.8),
        'base': c,
        'light': _hex(_toward(h, lit, 10), sat(s * 0.98), l + (1 - l) * 0.38),
        'hi': _hex(_toward(h, lit, 22), sat(s * 0.85), l + (1 - l) * 0.75),
    }

# ---------- shape outlines (200 x 200 box) ----------
C = (100, 100)
def ellipse_pts(rx, ry, n, rot=0):
    return [(100 + rx * math.cos(rot + 2 * math.pi * i / n), 100 + ry * math.sin(rot + 2 * math.pi * i / n)) for i in range(n)]
def poly_reg(r, n, rot=-math.pi / 2):
    return [(100 + r * math.cos(rot + 2 * math.pi * i / n), 100 + r * math.sin(rot + 2 * math.pi * i / n)) for i in range(n)]
def oct_rect(w, h, cut):
    x0, x1, y0, y1 = 100 - w / 2, 100 + w / 2, 100 - h / 2, 100 + h / 2
    return [(x0 + cut, y0), (x1 - cut, y0), (x1, y0 + cut), (x1, y1 - cut), (x1 - cut, y1), (x0 + cut, y1), (x0, y1 - cut), (x0, y0 + cut)]
def sample(fn, n):
    return [fn(i / n) for i in range(n)]
def pear_fn(t):
    a = 2 * math.pi * t - math.pi / 2
    x = math.cos(a); y = math.sin(a)
    w = 62 * (1 - 0.55 * max(0, -y)) if y < 0 else 62
    return (100 + w * x, 112 + (84 if y > 0 else 96) * y * (1 if y > 0 else 1))
def heart_fn(t):
    a = 2 * math.pi * t
    x = 16 * math.sin(a) ** 3
    y = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
    return (100 + x * 5.2, 96 + y * 5.0)
    rs = [80, 70, 84, 66, 78, 72, 86, 68, 76, 74]
    return [(100 + r * math.cos(2 * math.pi * i / 10 + 0.2), 100 + r * 0.82 * math.sin(2 * math.pi * i / 10 + 0.2)) for i, r in enumerate(rs)]

def nugget_pts():
    rs = [80, 70, 84, 66, 78, 72, 86, 68, 76, 74]
    return [(100 + r * math.cos(2 * math.pi * i / 10 + 0.2), 100 + r * 0.82 * math.sin(2 * math.pi * i / 10 + 0.2)) for i, r in enumerate(rs)]

def outline_for(cut):
    if cut == 'round': return ('circle', 84, 84), ellipse_pts(84, 84, 8, math.pi / 8)
    if cut == 'oval': return ('circle', 66, 86), ellipse_pts(66, 86, 8, math.pi / 8)
    if cut == 'emerald': return None, oct_rect(172, 124, 20)
    if cut == 'emerald-long': return None, oct_rect(112, 172, 18)
    if cut == 'square': return None, oct_rect(150, 150, 22)
    if cut == 'pear': return None, sample(pear_fn, 12)
    if cut == 'heart': return None, sample(heart_fn, 14)
    if cut == 'triangle': return None, [(100, 18), (184, 164), (16, 164)]
    if cut == 'marquise': return None, [(100, 10), (138, 40), (156, 100), (138, 160), (100, 190), (62, 160), (44, 100), (62, 40)]
    if cut == 'hexagon': return None, poly_reg(88, 6, 0)
    if cut == 'pentagon': return None, poly_reg(90, 5)
    if cut == 'diamond': return None, [(68, 34), (132, 34), (172, 76), (100, 176), (28, 76)]
    if cut == 'nugget': return None, nugget_pts()
    raise ValueError(cut)

def pts(p): return ' '.join('%.1f,%.1f' % xy for xy in p)
def scale(p, s, c=C): return [(c[0] + (x - c[0]) * s, c[1] + (y - c[1]) * s) for x, y in p]
def centroid(p):
    return (sum(x for x, _ in p) / len(p), sum(y for _, y in p) / len(p))

LIGHT = (-0.62, -0.78)  # light from the top left

def facet_tone(mid, ctr, T):
    dx, dy = mid[0] - ctr[0], mid[1] - ctr[1]
    d = math.hypot(dx, dy) or 1
    b = (dx * LIGHT[0] + dy * LIGHT[1]) / d
    return T['light'] if b > 0.45 else T['base'] if b > -0.05 else T['mdark'] if b > -0.6 else T['dark']

def faceted(cut, base, ex):
    T = tones(base)
    curve, P = outline_for(cut)
    ctr = centroid(P) if cut in ('triangle', 'diamond', 'pear', 'heart') else C
    out = []
    shape_el = (f'<ellipse cx="100" cy="100" rx="{curve[1]}" ry="{curve[2]}"' if curve else f'<polygon points="{pts(P)}"')
    out.append(shape_el + f' fill="{T["dark"]}"/>')
    tbl = scale(P, 0.5 if cut not in ('emerald', 'emerald-long', 'square') else 0.62, ctr)
    multi = ex.get('multi')
    n = len(P)
    for i in range(n):
        q = [P[i], P[(i + 1) % n], tbl[(i + 1) % n], tbl[i]]
        mid = centroid(q)
        if multi:
            hue = multi[i % len(multi)]
            fill = facet_tone(mid, ctr, tones(hue))
        elif ex.get('watermelon'):
            fill = facet_tone(mid, ctr, tones('#3fbf5a'))
        else:
            fill = facet_tone(mid, ctr, T)
        out.append(f'<polygon points="{pts(q)}" fill="{fill}"/>')
    core = T['base'] if not ex.get('watermelon') else '#ff6f9a'
    if ex.get('split'):
        a, b = ex['split']
        out.append(f'<polygon points="{pts(tbl)}" fill="{tones(a)["base"]}"/>')
        half = [p for p in tbl if p[0] >= ctr[0] - 0.1]
        out.append(f'<polygon points="{pts(sorted(half, key=lambda p: math.atan2(p[1]-ctr[1], p[0]-ctr[0])))}" fill="{tones(b)["base"]}"/>')
    else:
        out.append(f'<polygon points="{pts(tbl)}" fill="{core}"/>')
    # highlight: a sliver of the table toward the light
    k = max(range(n), key=lambda i: tbl[i][0] * LIGHT[0] + tbl[i][1] * LIGHT[1])
    hi = [tbl[k], tbl[(k + 1) % n], (ctr[0] * 0.55 + tbl[k][0] * 0.45, ctr[1] * 0.55 + tbl[k][1] * 0.45)]
    out.append(f'<polygon points="{pts(hi)}" fill="{tones(core)["hi"]}" opacity="0.9"/>')
    if ex.get('flecks'):
        out += fleck_marks(ex['flecks'], tbl)
    stroke = (f'<ellipse cx="100" cy="100" rx="{curve[1]}" ry="{curve[2]}"' if curve else f'<polygon points="{pts(P)}"')
    out.append(stroke + f' fill="none" stroke="{T["outline"]}" stroke-width="9" stroke-linejoin="round"/>')
    return out

def fleck_marks(color, area=None, seed=7):
    import random
    r = random.Random(seed)
    marks = []
    for _ in range(9):
        x, y = 100 + r.uniform(-34, 34), 100 + r.uniform(-34, 34)
        s = r.uniform(2.5, 5)
        marks.append(f'<polygon points="{x:.1f},{y - s:.1f} {x + s:.1f},{y:.1f} {x:.1f},{y + s:.1f} {x - s:.1f},{y:.1f}" fill="{color}"/>')
    return marks

def cabochon(cut, base, ex):
    T = tones(base)
    rx, ry = (76, 76) if cut in ('cabochon', 'pearl') else (64, 84)
    out = [f'<defs><clipPath id="cl"><ellipse cx="100" cy="100" rx="{rx}" ry="{ry}"/></clipPath></defs>',
           f'<ellipse cx="100" cy="100" rx="{rx}" ry="{ry}" fill="{T["base"]}"/>']
    g = ['<g clip-path="url(#cl)">']
    if ex.get('multi'):
        cols = ex['multi']
        for i, c in enumerate(cols):
            y = 100 - ry + (2 * ry) * i / len(cols)
            g.append(f'<rect x="0" y="{y:.1f}" width="200" height="{2 * ry / len(cols) + 1:.1f}" fill="{c}"/>')
    if ex.get('bands'):
        bc = ex['bands']
        for k, off in enumerate((-46, -14, 18, 50)):
            w = 9 if k % 2 == 0 else 6
            g.append(f'<path d="M0,{100 + off} C 50,{100 + off - 22} 110,{100 + off + 20} 200,{100 + off - 10}" fill="none" stroke="{bc}" stroke-width="{w}"/>')
    if ex.get('swirl'):
        sc = ex['swirl']
        g.append(f'<path d="M30,120 C 60,80 90,140 120,100 S 170,70 180,96" fill="none" stroke="{sc}" stroke-width="6" stroke-linecap="round"/>')
        g.append(f'<path d="M40,150 C 80,130 110,160 150,136" fill="none" stroke="{sc}" stroke-width="4" stroke-linecap="round" opacity=".8"/>')
    if ex.get('flecks'):
        g += fleck_marks(ex['flecks'])
    if ex.get('slit'):
        g.append(f'<path d="M100,{100 - ry + 6} C 112,80 112,120 100,{100 + ry - 6} C 106,120 106,80 100,{100 - ry + 6} Z" fill="{T["hi"]}"/>')
    # dome shading: a darker lower crescent and a light upper area
    g.append(f'<ellipse cx="108" cy="{100 + ry * 0.35:.1f}" rx="{rx * 0.95:.1f}" ry="{ry * 0.75:.1f}" fill="{T["dark"]}" opacity="0.28"/>')
    g.append('</g>')
    out += g
    out.append(f'<ellipse cx="{100 - rx * 0.35:.1f}" cy="{100 - ry * 0.42:.1f}" rx="{rx * 0.26:.1f}" ry="{ry * 0.16:.1f}" fill="{T["hi"]}" opacity="0.85" transform="rotate(-24 {100 - rx * 0.35:.1f} {100 - ry * 0.42:.1f})"/>')
    out.append(f'<ellipse cx="100" cy="100" rx="{rx}" ry="{ry}" fill="none" stroke="{T["outline"]}" stroke-width="9"/>')
    return out

def ingot(base, ex):
    T = tones(base)
    top = [(58, 58), (142, 58), (164, 98), (36, 98)]
    front = [(36, 98), (164, 98), (164, 140), (36, 140)]
    right = [(142, 58), (176, 82), (176, 124), (164, 140), (164, 98)]
    out = [f'<polygon points="{pts(front)}" fill="{T["base"]}"/>',
           f'<polygon points="{pts(top)}" fill="{T["light"]}"/>',
           f'<polygon points="{pts(right)}" fill="{T["mdark"]}"/>',
           f'<polygon points="70,66 112,66 104,80 64,80" fill="{T["hi"]}"/>',
           f'<line x1="48" y1="120" x2="152" y2="120" stroke="{T["mdark"]}" stroke-width="4"/>']
    whole = [(58, 58), (142, 58), (176, 82), (176, 124), (164, 140), (36, 140), (36, 98)]
    out.append(f'<polygon points="{pts(whole)}" fill="none" stroke="{T["outline"]}" stroke-width="9" stroke-linejoin="round"/>')
    out.append(f'<polyline points="36,98 164,98 176,82" fill="none" stroke="{T["outline"]}" stroke-width="3"/>')
    out.append(f'<line x1="164" y1="98" x2="164" y2="140" stroke="{T["outline"]}" stroke-width="3"/>')
    return out

def torus(base, ex):
    T = tones(base)
    return [f'<ellipse cx="100" cy="104" rx="80" ry="58" fill="{T["base"]}"/>',
            f'<ellipse cx="100" cy="92" rx="70" ry="40" fill="{T["light"]}"/>',
            f'<ellipse cx="100" cy="100" rx="30" ry="16" fill="{T["dark"]}"/>',
            f'<ellipse cx="74" cy="78" rx="18" ry="7" fill="{T["hi"]}" transform="rotate(-14 74 78)"/>',
            f'<ellipse cx="100" cy="100" rx="30" ry="16" fill="none" stroke="{T["outline"]}" stroke-width="5"/>',
            f'<ellipse cx="100" cy="104" rx="80" ry="58" fill="none" stroke="{T["outline"]}" stroke-width="9"/>']

OVERRIDES = os.path.join(ROOT, 'scripts/gemstone-overrides')

def override_body(slug):
    """A hand-made gemstone in scripts/gemstone-overrides/<slug>.svg replaces the generated one."""
    f = os.path.join(OVERRIDES, slug + '.svg')
    if not os.path.exists(f):
        return None
    src = open(f).read()
    view = re.search(r'viewBox="([^"]+)"', src).group(1)
    inner = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', src, flags=re.S)
    return f'<svg viewBox="{view}" width="200" height="200">{inner}</svg>'

QUARTZ_SHADE = [(0, 0.0), (60, 0.30), (120, 0.45), (180, -0.45), (240, 0.15), (300, -0.25)]  # angle (deg, y down): + lighter, - darker

def quartz_shade(deg):
    deg %= 360
    pts_ = QUARTZ_SHADE + [(360, QUARTZ_SHADE[0][1])]
    for (a0, v0), (a1, v1) in zip(pts_, pts_[1:]):
        if a0 <= deg <= a1:
            return v0 + (v1 - v0) * (deg - a0) / (a1 - a0)
    return 0

def quartz_cut(base, ex):
    n = ex.get('sides', 6)
    T = tones(base)
    outline = mix(base, '#1a0040', 0.62)
    R, r_in = 88, 49
    out = [f'<circle cx="100" cy="100" r="{R}" fill="{outline}"/>']
    vert = [(100 + r_in * math.cos(-math.pi / 2 + 2 * math.pi * i / n), 100 + r_in * math.sin(-math.pi / 2 + 2 * math.pi * i / n)) for i in range(n)]
    multi = ex.get('multi')
    for i in range(n):
        a0 = -math.pi / 2 + 2 * math.pi * i / n
        a1 = a0 + 2 * math.pi / n
        arc = [(100 + (R - 7) * math.cos(a0 + (a1 - a0) * k / 12), 100 + (R - 7) * math.sin(a0 + (a1 - a0) * k / 12)) for k in range(13)]
        q = [vert[i]] + arc + [vert[(i + 1) % n]]
        c = multi[i % len(multi)] if multi else base
        v = quartz_shade(math.degrees((a0 + a1) / 2))
        fill = mix(c, '#ffffff', v) if v >= 0 else mix(c, '#0a0420', -v)
        out.append(f'<polygon points="{pts(q)}" fill="{fill}"/>')
    out.append(f'<polygon points="{pts(vert)}" fill="{mix(base, "#ffffff", 0.78)}"/>')
    if ex.get('bands'):
        out.append(f'<path d="M30,92 C 70,70 120,118 170,86 M38,128 C 80,108 120,146 164,120" fill="none" stroke="{ex["bands"]}" stroke-width="8" opacity=".85"/>')
    return out

def gem_svg_body(slug):
    ov = override_body(slug)
    if ov:
        return ov
    cut, base, ex = GEMS[slug]
    if cut == 'quartz':
        body = quartz_cut(base, ex)
    elif cut in ('cabochon', 'cab-oval', 'pearl'):
        body = cabochon(cut, base, ex)
    elif cut == 'ingot':
        body = ingot(base, ex)
    elif cut == 'torus':
        body = torus(base, ex)
    else:
        body = faceted(cut, base, ex)
    # make clip ids unique per gem so composed fusions don't clash
    return '\n'.join(body).replace('id="cl"', f'id="cl-{slug}"').replace('url(#cl)', f'url(#cl-{slug})')

def write(slug, inner, view='0 0 200 200'):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="200" height="200">\n{inner}\n</svg>\n'
    with open(os.path.join(OUT, slug + '.svg'), 'w') as f:
        f.write(svg)

# Fusion layouts, from Oliver's examples: two stones at the same size, about 62% of the box,
# offset diagonally so roughly a third of each overlaps. One stone sits in front.
# Each entry: (gem slug, x, y, scale), drawn in order, so the last one is in front.
S = 0.65
DEFAULT_LAYOUT = lambda a, b: [(b, 0, 68, S), (a, 68, 0, S)]   # first half in front, top right
FUSION_LAYOUTS = {
    'rhodonite': [('pearl', 0, 68, S), ('ruby', 68, 0, S)],
    'opal-fusion': [('pearl', 0, 68, S), ('amethyst', 68, 0, S)],
    'garnet-sapphire-variant': [('ruby', 68, 0, S), ('sapphire', 0, 68, S)],
    'sugilite': [('ruby', 68, 68, S), ('amethyst', 0, 0, S)],
    'malachite-fusion': [('lapis', 68, 68, S), ('jasper', 0, 0, S)],
    'sphene': [('pearl', 36, 70, S), ('peridot-era-2a', 34, 0, S)],
}

def main():
    data = {}
    for f in glob.glob(os.path.join(ROOT, 'src/data/gem-types/*.yml')):
        d = yaml.safe_load(open(f))
        data[d['slug']] = d
    made, missing = 0, []
    for slug, d in data.items():
        if d['kind'] == 'fusion':
            continue
        if slug not in GEMS and not override_body(slug):
            missing.append(slug); continue
        write(slug, gem_svg_body(slug)); made += 1
    for slug, d in data.items():
        if d['kind'] != 'fusion':
            continue
        if slug in FUSION_LAYOUTS:
            layout = FUSION_LAYOUTS[slug]
        else:
            comps = d.get('components') or []
            comps = [c if c in GEMS else next((k for k in GEMS if k.startswith(c + '-')), None) for c in comps]
            if len(comps) != 2 or None in comps:
                missing.append(slug + ' (fusion halves)'); continue
            layout = DEFAULT_LAYOUT(*comps)
        parts = []
        for c, x, y, s in layout:
            parts.append(f'<g transform="translate({x} {y}) scale({s})">\n{gem_svg_body(c)}\n</g>')
        write(slug, '\n'.join(parts))
        made += 1
    print(f'Wrote {made} gemstones to public/images/gemstones')
    if missing:
        print('No gemstone yet for:', ', '.join(missing))

if __name__ == '__main__':
    main()
