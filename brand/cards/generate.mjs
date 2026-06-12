// Social-card generator — renders 1200×630 Open Graph cards for every page.
// Usage: npm i @resvg/resvg-js && node generate.mjs
// Output: ./<name>-card.svg + ./<name>-card.png (same-origin, served from /brand/cards/).
//
// STYLE.md applies: navy ground, bracket-gate mark, lilac glyph, no decoration.
// Fonts are resolved at build time (Liberation Sans/Mono ≈ the system stack the
// site uses); the shipped artifact is the PNG, so pages still make zero requests.

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

const SANS = 'Liberation Sans, DejaVu Sans, sans-serif';
const MONO = 'Liberation Mono, DejaVu Sans Mono, monospace';

const NAVY = '#2D2440', VIOLET = '#8B6FC9', LILAC = '#C5B8E8', PALE = '#FAF9FC';

// Inner glyphs from brand/marks/*.svg, drawn on the shared 32-unit grid.
const GLYPHS = {
  vahtian: `<path d="M16 10.3 L19.6 12 L19.6 15 L16 19.6 L12.4 15 L12.4 12 Z" fill="none" stroke="${VIOLET}" stroke-width="1.8" stroke-linejoin="round"/>`,
  citevahti: `<circle cx="13.9" cy="16" r="1.7" fill="${VIOLET}"/><circle cx="18.1" cy="16" r="1.7" fill="${VIOLET}"/>`,
  studyvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.2 10.5 H17.8"/><path d="M14.6 10.7 V13.8 L12.3 19.4 L19.7 19.4 L17.4 13.8 V10.7"/><path d="M13.5 17.1 H18.5"/></g>`,
  dictvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 13 H19"/><path d="M13 16 H19"/><path d="M13 19 H16"/></g>`,
  'matchvahti-lite': `<circle cx="13.9" cy="16" r="1.9" fill="${VIOLET}"/><circle cx="18.1" cy="16" r="1.9" fill="${VIOLET}"/><path d="M13.9 16 H18.1" stroke="${VIOLET}" stroke-width="2.3" stroke-linecap="round"/>`,
};

// Light tile (pale ground, navy brackets) — reads as the mark *on* the navy card.
function markTile(glyph, x, y, size) {
  const s = size / 32;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect width="32" height="32" rx="7" fill="${PALE}"/>
    <g fill="none" stroke="${NAVY}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 9 H9 V23 H12"/><path d="M20 9 H23 V23 H20"/>
    </g>${glyph}</g>`;
}

const CARDS = [
  {
    name: 'vahtian',
    kicker: 'CITATION-INTEGRITY INFRASTRUCTURE',
    title: ['Auditable citation', 'integrity, at', 'publication scale.'],
    sub: ['Blinded human → AI → adjudication, with a', 'hash-chained audit trail. Free and local-first.'],
  },
  {
    name: 'citevahti',
    kicker: 'CITEVAHTI — FOR RESEARCHERS & LABS',
    title: ['Run unit tests on', 'your manuscript.'],
    sub: ['Verify the claim before you cite it —', 'local-first, auditable, Zotero-safe.'],
  },
  {
    name: 'studyvahti',
    kicker: 'STUDYVAHTI — FREE STUDY-PLANNING TOOL',
    title: ['Plan the study before', 'you build the database.'],
    sub: ['PICOTS structure, a variable codebook, and', 'protocol-readiness triage. In your browser.'],
  },
  {
    name: 'dictvahti',
    kicker: 'DICTVAHTI — FREE REDCAP LINTER',
    title: ['Lint your REDCap', 'data dictionary.'],
    sub: ['26 deterministic checks with one-click fixes —', 'nothing leaves your machine.'],
  },
  {
    name: 'matchvahti-lite',
    kicker: 'MATCHVAHTI-LITE — FREE CITATION CAPTURE',
    title: ['Capture the', 'citable sentence.'],
    sub: ['Read a PubMed abstract · tap the sentence ·', 'export to Zotero. Nothing is uploaded.'],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function svgCard({ name, kicker, title, sub }) {
  kicker = esc(kicker); title = title.map(esc); sub = sub.map(esc);
  const W = 1200, H = 630, X = 84;
  const threeLines = title.length === 3;
  const titleSize = threeLines ? 58 : 62;
  const titleTop = threeLines ? 196 : 226;
  const lineGap = titleSize + 12;
  const titleEls = title.map((t, i) =>
    `<text x="${X}" y="${titleTop + i * lineGap}" font-family="${SANS}" font-size="${titleSize}" font-weight="700" fill="#FFFFFF" letter-spacing="-0.5">${t}</text>`).join('\n  ');
  const subTop = titleTop + title.length * lineGap + 26;
  const subEls = sub.map((t, i) =>
    `<text x="${X}" y="${subTop + i * 36}" font-family="${SANS}" font-size="25" fill="${LILAC}">${t}</text>`).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name} social card">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <text x="${X}" y="138" font-family="${MONO}" font-size="21" font-weight="700" fill="${VIOLET}" letter-spacing="3">${kicker}</text>
  ${titleEls}
  ${subEls}
  <text x="${X}" y="566" font-family="${MONO}" font-size="24" font-weight="700" fill="${VIOLET}">[ vahtian.com ]</text>
  ${markTile(GLYPHS[name], 924, 204, 222)}
</svg>`;
}

for (const card of CARDS) {
  const svg = svgCard(card);
  writeFileSync(join(OUT, `${card.name}-card.svg`), svg + '\n');
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  }).render().asPng();
  writeFileSync(join(OUT, `${card.name}-card.png`), png);
  console.log(`✓ ${card.name}-card.png (${png.length} bytes)`);
}
