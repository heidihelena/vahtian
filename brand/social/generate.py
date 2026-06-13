#!/usr/bin/env python3
"""Generate Vahtian social / video-call banners.

Self-contained per brand/STYLE.md: no external requests, local fonts only,
inline SVG. Off-white-lavender ground, dark text, lavender citation graph
(nodes + edges) as the accent, the Vahtian mark on the left.

Outputs an .svg source and a .png render for each size, plus a logo-only
variant (mark + graph, no text).
"""
import math
import random
import cairosvg

# ---- palette (brand/STYLE.md) ----------------------------------------------
INK     = "#1C1830"   # body / main text (dark)
MUTED   = "#5B5570"   # secondary text
VIOLET  = "#8B6FC9"   # brand line, edges, url
LILAC   = "#C5B8E8"   # inner glyph / node accents
NAVY     = "#2D2440"  # mark tile
BG_TOP  = "#FBFAFE"   # off-white lavender (light)
BG_BOT  = "#EDE7F7"   # off-white lavender (deeper tint)

HEADLINE = "Make research claims checkable."
SUBHEAD  = "Auditable software for citation integrity and biomedical evidence."
URL      = "vahtian.com"

SANS = "Liberation Sans, DejaVu Sans, sans-serif"
MONO = "Liberation Mono, DejaVu Sans Mono, monospace"

# The Vahtian mark (shield in a bracket gate), drawn on a 32-unit grid.
def mark(x, y, size):
    s = size / 32.0
    return (
        f'<g transform="translate({x:.2f},{y:.2f}) scale({s:.4f})">'
        f'<rect width="32" height="32" rx="7" fill="{NAVY}"/>'
        f'<g fill="none" stroke="{VIOLET}" stroke-width="2.3" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="M12 9 H9 V23 H12"/><path d="M20 9 H23 V23 H20"/></g>'
        f'<path d="M16 10.3 L19.6 12 L19.6 15 L16 19.6 L12.4 15 L12.4 12 Z" '
        f'fill="none" stroke="{LILAC}" stroke-width="1.8" stroke-linejoin="round"/>'
        f'</g>'
    )

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# Rough advance width for Liberation Sans, used only to auto-fit font sizes
# so text never overflows the frame.
def fit(text, avail, ideal, factor):
    by_width = avail / max(1, len(text) * factor)
    return min(ideal, by_width)

def graph(W, H, seed):
    """A faint lavender citation graph: nodes joined to near neighbours."""
    rng = random.Random(seed)
    pad = min(W, H) * 0.04
    n = max(10, min(70, int(W * H / 24000)))
    pts = []
    for _ in range(n):
        pts.append((rng.uniform(pad, W - pad), rng.uniform(pad, H - pad)))
    thresh = math.hypot(W, H) * 0.11
    ew = max(0.8, H * 0.0035)
    edges = []
    for i, (xi, yi) in enumerate(pts):
        d = sorted(
            ((math.hypot(xi - xj, yi - yj), j)
             for j, (xj, yj) in enumerate(pts) if j != i)
        )
        for dist, j in d[:2]:
            if dist <= thresh and (j, i) not in edges:
                edges.append((i, j))
    parts = [f'<g opacity="0.9">']
    for i, j in edges:
        x1, y1 = pts[i]; x2, y2 = pts[j]
        parts.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{VIOLET}" stroke-width="{ew:.2f}" stroke-opacity="0.16"/>'
        )
    for k, (x, y) in enumerate(pts):
        hub = (k % 7 == 0)
        r = (H * 0.011) if hub else (H * 0.0055 + (k % 3) * H * 0.0012)
        fill = VIOLET if hub else LILAC
        op = 0.42 if hub else 0.5
        if hub:  # verified-looking ring, kept in brand lavender (no state hues)
            parts.append(
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*1.9:.1f}" fill="none" '
                f'stroke="{VIOLET}" stroke-width="{ew:.2f}" stroke-opacity="0.22"/>'
            )
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" '
            f'fill="{fill}" fill-opacity="{op}"/>'
        )
    parts.append('</g>')
    return "".join(parts)

def banner(W, H, seed, with_text=True):
    mh = min(W, H)
    hmargin = round(W * 0.045)
    s = min(H * 0.34, W * 0.12)            # mark size
    mark_x = hmargin
    mark_y = (H - s) / 2.0

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" role="img" aria-label="Vahtian banner">',
        '<defs>'
        f'<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{BG_TOP}"/>'
        f'<stop offset="1" stop-color="{BG_BOT}"/></linearGradient>'
        '</defs>',
        f'<rect width="{W}" height="{H}" fill="url(#bg)"/>',
        graph(W, H, seed),
    ]

    if with_text:
        tx = max(mark_x + s + W * 0.04, W * 0.33)
        avail = W - tx - hmargin
        hf = fit(HEADLINE, avail, H * 0.17, 0.55)
        sf = fit(SUBHEAD, avail, hf * 0.42, 0.52)
        head_y = H * 0.45
        sub_y = head_y + hf * 0.80
        uf = max(14, min(40, H * 0.06))
        svg.append(
            f'<text x="{tx:.1f}" y="{head_y:.1f}" font-family="{SANS}" '
            f'font-size="{hf:.1f}" font-weight="700" fill="{INK}" '
            f'letter-spacing="-0.5">{esc(HEADLINE)}</text>'
        )
        svg.append(
            f'<text x="{tx:.1f}" y="{sub_y:.1f}" font-family="{SANS}" '
            f'font-size="{sf:.1f}" fill="{MUTED}">{esc(SUBHEAD)}</text>'
        )
        svg.append(
            f'<text x="{W - hmargin:.1f}" y="{H - mh * 0.07:.1f}" '
            f'font-family="{MONO}" font-size="{uf:.1f}" font-weight="700" '
            f'fill="{VIOLET}" text-anchor="end">{esc(URL)}</text>'
        )
        svg.append(mark(mark_x, mark_y, s))
    else:
        # logo-only: centre the mark, keep the graph as quiet texture
        cs = min(H * 0.42, W * 0.18)
        svg.append(mark((W - cs) / 2, (H - cs) / 2, cs))

    svg.append('</svg>')
    return "".join(svg)

SIZES = [
    ("linkedin-personal",  1584, 396),   # LinkedIn profile background
    ("linkedin-company",   1128, 191),   # LinkedIn company page cover
    ("facebook-cover",     1640, 624),   # Facebook page cover
    ("teams-background",   1920, 1080),  # Teams / video-call background
]

if __name__ == "__main__":
    for i, (name, W, H) in enumerate(SIZES):
        for suffix, txt in (("", True), ("-logo", False)):
            src = banner(W, H, seed=11 + i, with_text=txt)
            base = f"brand/social/{name}{suffix}-{W}x{H}"
            with open(base + ".svg", "w") as f:
                f.write(src)
            cairosvg.svg2png(bytestring=src.encode(), write_to=base + ".png",
                             output_width=W, output_height=H)
            print("wrote", base + ".png")
