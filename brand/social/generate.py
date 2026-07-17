#!/usr/bin/env python3
"""Generate Vahtian social and video-call banners.

The default exports are art-only: no copy and no logo. The drawing language
follows the Vahtian rough field-note standard with quiet construction strokes,
uneven medium forms, and a few pressed-in violet marks.
"""

import random
from pathlib import Path


INK = "#1C1830"
MUTED = "#5B5570"
VIOLET = "#8B6FC9"
VIOLET_DARK = "#6F52B8"
LILAC = "#C5B8E8"
PAPER = "#FAF9FC"
PAPER_LILAC = "#F1ECF8"
LINE = "#DDD5EA"
NAVY = "#2D2440"

OUT = Path(__file__).resolve().parent


def mark(x, y, size):
    """The stable Vahtian mark; the surrounding artwork carries the roughness."""
    scale = size / 32.0
    return (
        f'<g transform="translate({x:.2f},{y:.2f}) scale({scale:.4f})">'
        f'<rect width="32" height="32" rx="7" fill="{NAVY}"/>'
        f'<g fill="none" stroke="{VIOLET}" stroke-width="2.3" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M12 9 H9 V23 H12"/><path d="M20 9 H23 V23 H20"/>'
        '</g>'
        f'<path d="M16 10.3 L19.6 12 L19.6 15 L16 19.6 L12.4 15 L12.4 12 Z" '
        f'fill="none" stroke="{LILAC}" stroke-width="1.8" stroke-linejoin="round"/>'
        '</g>'
    )


def rough_defs(seed):
    return (
        '<defs>'
        f'<filter id="rough" filterUnits="userSpaceOnUse" x="-100" y="-100" '
        'width="4000" height="2400">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="{seed}"/>'
        '<feDisplacementMap in="SourceGraphic" scale="2.8"/>'
        '</filter>'
        '</defs>'
    )


def student_icon(x, y, size):
    s = size / 100.0
    return f'''
    <g transform="translate({x:.1f},{y:.1f}) scale({s:.4f})" fill="none"
       stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 31 L50 18 L82 31 L50 44 Z" stroke="{INK}" stroke-width="4.2"/>
      <path d="M28 35 C30 50 39 57 50 57 C62 57 70 49 72 35" stroke="{MUTED}" stroke-width="3.1"/>
      <path d="M82 31 C84 42 81 50 76 55" stroke="{VIOLET_DARK}" stroke-width="6.8"/>
      <path d="M24 87 C28 69 37 62 50 62 C65 62 74 70 78 88" stroke="{INK}" stroke-width="4.8"/>
      <path d="M33 82 C45 78 57 79 69 83" stroke="{LINE}" stroke-width="2.0"/>
    </g>'''


def team_icon(x, y, size):
    s = size / 100.0
    return f'''
    <g transform="translate({x:.1f},{y:.1f}) scale({s:.4f})" fill="none"
       stroke-linecap="round" stroke-linejoin="round">
      <path d="M38 29 C38 18 43 14 51 16 C60 17 64 23 62 31 C61 39 55 43 47 41 C40 39 37 35 38 29 Z" stroke="{INK}" stroke-width="4.7"/>
      <path d="M15 42 C15 34 19 31 25 32 C32 33 35 38 33 44 C32 50 28 53 22 51 C17 50 14 47 15 42 Z" stroke="{MUTED}" stroke-width="3.0"/>
      <path d="M68 42 C68 34 72 31 78 32 C85 33 88 38 86 44 C85 50 81 53 75 51 C70 50 67 47 68 42 Z" stroke="{MUTED}" stroke-width="3.8"/>
      <path d="M31 77 C34 58 40 51 50 51 C61 51 68 59 70 78" stroke="{VIOLET_DARK}" stroke-width="7.2"/>
      <path d="M7 78 C10 62 16 56 25 56 C31 56 36 59 40 65" stroke="{INK}" stroke-width="3.4"/>
      <path d="M61 65 C66 59 71 56 78 56 C87 56 92 64 94 79" stroke="{INK}" stroke-width="4.2"/>
      <path d="M18 88 C41 83 63 84 86 89" stroke="{LINE}" stroke-width="2.2"/>
    </g>'''


def book_icon(x, y, size):
    s = size / 100.0
    return f'''
    <g transform="translate({x:.1f},{y:.1f}) scale({s:.4f})" fill="none"
       stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 22 C25 18 39 21 50 30 L50 82 C38 73 24 70 9 74 Z" stroke="{INK}" stroke-width="4.4"/>
      <path d="M91 22 C75 18 61 21 50 30 L50 82 C63 73 76 70 91 74 Z" stroke="{INK}" stroke-width="3.2"/>
      <path d="M18 35 C28 32 37 34 43 38 M18 47 C28 44 36 46 42 50" stroke="{LINE}" stroke-width="2.1"/>
      <path d="M58 38 C66 33 75 32 83 34 M58 50 C66 45 75 44 83 46" stroke="{MUTED}" stroke-width="2.8"/>
      <path d="M68 21 L68 61 L75 55 L82 62 L82 20" stroke="{VIOLET_DARK}" stroke-width="6.5"/>
      <path d="M8 82 C27 77 40 80 50 88 C62 80 75 77 93 82" stroke="{LILAC}" stroke-width="5.1"/>
    </g>'''


def paper_marks(W, H, rng):
    """Quiet construction marks that keep the banner from feeling digitally exact."""
    sw = max(1.2, H * 0.006)
    parts = [f'<g filter="url(#rough)" opacity="0.7" fill="none">']
    for row in (0.24, 0.49, 0.76):
        y = H * row + rng.uniform(-H * 0.018, H * 0.018)
        x1 = W * rng.uniform(0.05, 0.12)
        x2 = W * rng.uniform(0.87, 0.96)
        bend = rng.uniform(-H * 0.04, H * 0.04)
        parts.append(
            f'<path d="M{x1:.1f} {y:.1f} C{W*.34:.1f} {y+bend:.1f} '
            f'{W*.65:.1f} {y-bend:.1f} {x2:.1f} {y+rng.uniform(-3,3):.1f}" '
            f'stroke="{LINE}" stroke-width="{sw:.2f}" stroke-dasharray="{sw*1.2:.1f} {sw*4.2:.1f}"/>'
        )
    parts.append('</g>')
    return ''.join(parts)


def field_note_art(W, H, seed):
    rng = random.Random(seed)
    short = H / W < 0.38
    sw = max(2.0, H * 0.011)
    y = H * (0.58 if short else 0.54)
    start = W * (0.23 if short else 0.08)
    end = W * 0.94

    parts = [paper_marks(W, H, rng), '<g filter="url(#rough)" fill="none" stroke-linecap="round" stroke-linejoin="round">']
    parts.append(
        f'<path d="M{start:.1f} {y+H*.035:.1f} C{W*.39:.1f} {H*.23:.1f} '
        f'{W*.59:.1f} {H*.82:.1f} {end:.1f} {H*.38:.1f}" '
        f'stroke="{LILAC}" stroke-width="{sw*.72:.2f}" opacity="0.78"/>'
    )
    parts.append(
        f'<path d="M{start:.1f} {y:.1f} C{W*.38:.1f} {H*.20:.1f} '
        f'{W*.60:.1f} {H*.78:.1f} {end:.1f} {H*.35:.1f}" '
        f'stroke="{VIOLET_DARK}" stroke-width="{sw*1.55:.2f}" opacity="0.93"/>'
    )
    for px, py, radius, width in (
        (W * 0.36, H * 0.36, H * 0.055, sw * 0.55),
        (W * 0.62, H * 0.63, H * 0.075, sw * 0.82),
        (W * 0.84, H * 0.43, H * 0.045, sw * 0.45),
    ):
        parts.append(
            f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{radius*1.08:.1f}" ry="{radius:.1f}" '
            f'transform="rotate({rng.uniform(-9, 7):.1f} {px:.1f} {py:.1f})" '
            f'stroke="{VIOLET}" stroke-width="{width:.2f}"/>'
        )
    parts.append('</g>')

    icon_size = H * (0.44 if short else 0.29)
    if short:
        icon_y = H * 0.31
        parts.extend((
            student_icon(W * 0.30, icon_y, icon_size),
            team_icon(W * 0.56, H * 0.42, icon_size * 0.94),
            book_icon(W * 0.79, H * 0.18, icon_size * 1.04),
        ))
    else:
        parts.extend((
            student_icon(W * 0.055, H * 0.14, icon_size),
            team_icon(W * 0.76, H * 0.59, icon_size * 0.96),
            book_icon(W * 0.80, H * 0.08, icon_size * 1.06),
        ))
    return ''.join(parts)


def banner(W, H, seed, with_mark=False):
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" role="img" aria-label="Vahtian rough field-note banner">',
        rough_defs(seed),
        f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
        f'<path d="M0 {H*.83:.1f} C{W*.24:.1f} {H*.76:.1f} {W*.53:.1f} {H*.96:.1f} '
        f'{W:.1f} {H*.72:.1f} L{W:.1f} {H:.1f} L0 {H:.1f} Z" fill="{PAPER_LILAC}"/>',
        field_note_art(W, H, seed),
    ]
    if with_mark:
        size = min(H * 0.22, W * 0.065)
        mark_x = W * 0.055 if H / W >= 0.5 else W - size - W * 0.045
        svg.append(mark(mark_x, H - size - H * 0.09, size))
    svg.append('</svg>')
    return ''.join(svg)


SIZES = [
    ("linkedin-personal", 1584, 396),
    ("linkedin-company", 1128, 191),
    ("facebook-cover", 1640, 624),
    ("teams-background", 1920, 1080),
]

# The plain filename is intentionally the quiet, art-only default.
VARIANTS = (
    ("", False),
    ("-logo", True),
)


if __name__ == "__main__":
    import cairosvg

    for index, (name, width, height) in enumerate(SIZES):
        for suffix, logo in VARIANTS:
            source = banner(
                width,
                height,
                seed=31 + index,
                with_mark=logo,
            )
            base = OUT / f"{name}{suffix}-{width}x{height}"
            base.with_suffix(".svg").write_text(source, encoding="utf-8")
            cairosvg.svg2png(
                bytestring=source.encode("utf-8"),
                write_to=str(base.with_suffix(".png")),
                output_width=width,
                output_height=height,
            )
            print("wrote", base.with_suffix(".png"))
