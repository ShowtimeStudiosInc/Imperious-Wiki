"""Builds the Cubic Zirconia entry banner: one faceted gemstone per Diamond color.

Run:  python3 scripts/cz-banner.py
Out:  public/images/gem-types/cubic-zirconia.webp  (1400 x 520)

Needs: pip install cairosvg pillow

Each gem is cut like a brilliant: a table in the middle, a ring of star and
kite facets around it, shaded by which way each facet faces the light (top
left). Thin light seams between facets, a few tinted facets for fire, and a
couple of glints keep them reading as cut stone instead of plastic.
"""
import math, os, colorsys, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/images/gem-types/cubic-zirconia.webp')
W, H = 1400, 520
LIGHT = math.radians(-135)  # light comes from the top left

# (shape, color, x, y, size)
GEMS = [
    ('kite',    '#8a3fe0',   90, 238, 62),   # Nightshade Violet
    ('round',   '#d8304a',  262, 315, 72),   # Maroon Red
    ('kite',    '#f07a1e',  437, 238, 62),   # Saturn Light
    ('hexagon', '#e8b81e',  612, 315, 74),   # Theta Gold
    ('round',   '#2f5ff0',  787, 235, 72),   # Epsilon Blue
    ('kite',    '#4a4458',  962, 318, 62),   # Alpha Black
    ('round',   '#ece8fb', 1137, 235, 72),   # Omega White
    ('heart',   '#ff5fb5', 1310, 320, 66),   # Bi-Colored Kandy
]


def hx(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))


def to_hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(v * 255))) for v in rgb)


def shade(base, t):
    """t from -1 (deep shadow) to 1 (bright). Keeps hue, moves lightness and saturation."""
    h, l, s = colorsys.rgb_to_hls(*hx(base))
    if t >= 0:
        l2 = l + (0.96 - l) * (t ** 1.3) * 0.85
        s2 = s * (1 - 0.35 * t)
    else:
        l2 = l * (1 + t * 0.72)
        s2 = min(1, s * (1 + 0.15 * -t))
    return to_hex(colorsys.hls_to_rgb(h, l2, s2))


def hue_shift(base, deg, light=0.72):
    h, l, s = colorsys.rgb_to_hls(*hx(base))
    return to_hex(colorsys.hls_to_rgb((h + deg / 360) % 1, light, max(0.65, s)))


def outline(shape, cx, cy, r):
    if shape == 'round':
        n = 12
        return [(cx + r * math.cos(2 * math.pi * i / n - math.pi / 2),
                 cy + r * math.sin(2 * math.pi * i / n - math.pi / 2)) for i in range(n)]
    if shape == 'hexagon':
        return [(cx + r * math.cos(math.pi / 3 * i), cy + r * math.sin(math.pi / 3 * i)) for i in range(6)]
    if shape == 'kite':
        # crown on top, long pavilion point at the bottom
        return [(cx - r * 0.55, cy - r * 0.78), (cx + r * 0.55, cy - r * 0.78), (cx + r, cy - r * 0.28),
                (cx + r * 0.5, cy + r * 0.38), (cx, cy + r * 1.02), (cx - r * 0.5, cy + r * 0.38),
                (cx - r, cy - r * 0.28)]
    if shape == 'heart':
        pts = []
        for i in range(20):
            t = 2 * math.pi * i / 20
            x = 16 * math.sin(t) ** 3
            y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
            pts.append((cx + x * r / 17, cy - y * r / 17 - r * 0.1))
        return pts
    raise ValueError(shape)


def centroid(p):
    return (sum(x for x, _ in p) / len(p), sum(y for _, y in p) / len(p))


def poly(p, fill, extra=''):
    return '<polygon points="%s" fill="%s"%s/>' % (' '.join('%.1f,%.1f' % xy for xy in p), fill, extra)


def light_t(cx, cy, fx, fy, bias=0.0):
    a = math.atan2(fy - cy, fx - cx)
    return max(-1, min(1, math.cos(a - LIGHT) * 0.95 + bias))


def gem(shape, base, cx, cy, r, idx):
    out = []
    o = outline(shape, cx, cy, r)
    n = len(o)
    # table: the same shape as the stone, scaled down around its own center
    # and nudged a little toward the light, so the middle always matches the outline
    ocx, ocy = centroid(o)
    k = 0.48
    tc = (ocx - r * 0.05, ocy - r * 0.06)
    tbl = [(tc[0] + (x - ocx) * k, tc[1] + (y - ocy) * k) for x, y in o]

    # soft colored glow behind the stone
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r * 1.55:.0f}" fill="url(#glow{idx})"/>')

    facets = []
    fire_every = 5
    for i in range(n):
        a, b = o[i], o[(i + 1) % n]
        ta, tb = tbl[i], tbl[(i + 1) % n]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        # star facet (table edge to the girdle midpoint) and two girdle halves
        star = [ta, tb, mid]
        g1 = [a, mid, ta]
        g2 = [mid, b, tb]
        for j, f in enumerate((g1, star, g2)):
            fx, fy = centroid(f)
            t = light_t(cx, cy, fx, fy, bias=0.15 if j == 1 else -0.05)
            # alternate facets a little so neighbours never match exactly
            t = max(-1, min(1, t + (0.12 if (i + j) % 2 else -0.08)))
            col = shade(base, t)
            facets.append(poly(f, col))
            if (i * 3 + j) % fire_every == 2 and t > -0.3:
                tint = hue_shift(base, (60, -70, 150)[(i + j) % 3])
                facets.append(poly(f, tint, ' opacity="0.22"'))
    out += facets

    # table: light, with a darker diagonal step for depth
    out.append(poly(tbl, shade(base, 0.35)))
    tcx, tcy = centroid(tbl)
    half = [p for p in tbl if (p[0] - tcx) + (p[1] - tcy) > 0]
    if len(half) >= 2:
        out.append(poly([(tcx, tcy)] + half, shade(base, -0.05), ' opacity="0.55"'))
    out.append(poly(tbl, 'none', f' stroke="{shade(base, 0.9)}" stroke-width="1.6" stroke-opacity="0.8"'))

    # seams: thin bright lines from table corners out to the girdle
    seam = shade(base, 0.95)
    lines = []
    for i in range(n):
        a, b = o[i], o[(i + 1) % n]
        ta, tb = tbl[i], tbl[(i + 1) % n]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        lines.append('M%.1f,%.1fL%.1f,%.1fL%.1f,%.1fM%.1f,%.1fL%.1f,%.1f' % (ta + mid + tb + ta + a))
    out.append(f'<path d="{" ".join(lines)}" fill="none" stroke="{seam}" stroke-width="1.1" stroke-opacity="0.45" stroke-linejoin="round"/>')

    # crisp outer edge: dark rim plus a thin lit edge on the top left
    out.append(poly(o, 'none', f' stroke="{shade(base, -0.82)}" stroke-width="4.5" stroke-linejoin="round"'))
    lit = [p for p in o if light_t(cx, cy, *p) > 0.35]
    if len(lit) > 1:
        d = 'M' + 'L'.join('%.1f,%.1f' % p for p in lit)
        out.append(f'<path d="{d}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-opacity="0.55" stroke-linecap="round"/>')

    # glints
    gx, gy = tbl[0] if shape != 'round' else tbl[n * 5 // 8]
    out.append(glint(gx, gy, r * 0.2))
    if idx % 2 == 0:
        ex, ey = o[n // 3]
        out.append(glint(ex, ey, r * 0.11, 0.65))
    return out


def glint(x, y, s, op=0.95):
    w = s * 0.16
    d = (f'M{x},{y - s} Q{x + w},{y - w} {x + s},{y} Q{x + w},{y + w} {x},{y + s} '
         f'Q{x - w},{y + w} {x - s},{y} Q{x - w},{y - w} {x},{y - s}Z')
    return f'<path d="{d}" fill="#ffffff" opacity="{op}"/>'


def build():
    defs = ['<radialGradient id="bg" cx="50%" cy="55%" r="75%">'
            '<stop offset="0" stop-color="#36205e"/><stop offset="1" stop-color="#140c24"/></radialGradient>']
    body = [f'<rect width="{W}" height="{H}" fill="url(#bg)"/>']
    for i, (shape, base, x, y, r) in enumerate(GEMS):
        defs.append(f'<radialGradient id="glow{i}"><stop offset="0" stop-color="{base}" stop-opacity="0.32"/>'
                    f'<stop offset="1" stop-color="{base}" stop-opacity="0"/></radialGradient>')
        body += gem(shape, base, x, y, r, i)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
            f'<defs>{"".join(defs)}</defs>{"".join(body)}</svg>')


if __name__ == '__main__':
    import cairosvg
    from PIL import Image
    png = cairosvg.svg2png(bytestring=build().encode(), output_width=W, output_height=H)
    Image.open(io.BytesIO(png)).convert('RGB').save(OUT, 'WEBP', quality=92)
    print('Wrote', os.path.relpath(OUT, ROOT))
