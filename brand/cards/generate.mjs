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
const FONT_DIR = join(OUT, '..', '..', 'methodvahti', 'methodvahti', 'assets', 'fonts');
const FONTS = [
  'LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf',
  'LiberationSans-Italic.ttf', 'LiberationSans-BoldItalic.ttf',
  'LiberationMono-Regular.ttf',
].map((f) => join(FONT_DIR, f));

const SANS = 'Liberation Sans, DejaVu Sans, sans-serif';
const MONO = 'Liberation Mono, DejaVu Sans Mono, monospace';

const NAVY = '#2D2440', VIOLET = '#8B6FC9', LILAC = '#C5B8E8', PALE = '#FAF9FC', AMBER = '#C98A00';

// Inner glyphs from brand/marks/*.svg, drawn on the shared 32-unit grid.
const GLYPHS = {
  vahtian: `<path d="M16 10.3 L19.6 12 L19.6 15 L16 19.6 L12.4 15 L12.4 12 Z" fill="none" stroke="${VIOLET}" stroke-width="1.8" stroke-linejoin="round"/>`,
  citevahti: `<circle cx="13.9" cy="16" r="1.7" fill="${VIOLET}"/><circle cx="18.1" cy="16" r="1.7" fill="${VIOLET}"/>`,
  studyvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.2 10.5 H17.8"/><path d="M14.6 10.7 V13.8 L12.3 19.4 L19.7 19.4 L17.4 13.8 V10.7"/><path d="M13.5 17.1 H18.5"/></g>`,
  dictvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 13 H19"/><path d="M13 16 H19"/><path d="M13 19 H16"/></g>`,
  'matchvahti-lite': `<circle cx="13.9" cy="16" r="1.9" fill="${VIOLET}"/><circle cx="18.1" cy="16" r="1.9" fill="${VIOLET}"/><path d="M13.9 16 H18.1" stroke="${VIOLET}" stroke-width="2.3" stroke-linecap="round"/>`,
  methodvahti: `<g fill="${VIOLET}"><circle cx="14" cy="14" r="1.5"/><circle cx="18" cy="14" r="1.5"/><circle cx="14" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></g>`,
  reviewvahti: `<ellipse cx="16" cy="16" rx="4.4" ry="2.8" fill="none" stroke="${VIOLET}" stroke-width="1.7"/><circle cx="16" cy="16" r="1.5" fill="${VIOLET}"/>`,
  extractvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.7" stroke-linejoin="round"><rect x="11.5" y="11.5" width="9" height="9" rx="1.2"/><path d="M16 11.5 V20.5 M11.5 16 H20.5"/></g>`,
  guidelinevahti: `<path d="M12.8 16 L15.2 18.5 L19.3 13" fill="none" stroke="${VIOLET}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  synthvahti: `<path d="M12 19 L15 14 L18 16 L20 11" fill="none" stroke="${VIOLET}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  fullvahti: `<g fill="none" stroke="${VIOLET}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10.5 V17"/><path d="M13 14.5 L16 17.5 L19 14.5"/><path d="M12.2 20.5 H19.8"/></g>`,
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

// Static lighthouse vignette — the frozen frame of the site's sentinel hero:
// a beam sweeping a small citation graph, one node verified to amber [oo].
const STARS = [[742,96],[800,150],[884,104],[958,150],[1126,120],[718,250],
  [992,196],[1150,300],[860,150],[924,372],[788,182],[1090,238]];
function scene() {
  const lampX = 1050, lampY = 276, baseY = 440, hb = 30, ht = 17;
  const nodes = [
    { x: 927, y: 300, amber: true }, { x: 836, y: 250 }, { x: 882, y: 352 },
    { x: 990, y: 248 }, { x: 818, y: 314 }, { x: 964, y: 338 },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,4],[3,5]];
  const beamLen = 380, ha = 0.155, th = Math.atan2(nodes[0].y - lampY, nodes[0].x - lampX);
  const p = (a, L) => [lampX + Math.cos(a) * L, lampY + Math.sin(a) * L];
  const [ax, ay] = p(th - ha, beamLen), [bx, by] = p(th + ha, beamLen);
  const [cx, cy] = p(th - ha * 0.34, beamLen), [dx, dy] = p(th + ha * 0.34, beamLen);
  const tipx = (ax + bx) / 2, tipy = (ay + by) / 2;
  const defs = `<linearGradient id="beamG" gradientUnits="userSpaceOnUse" x1="${lampX}" y1="${lampY}" x2="${tipx.toFixed(1)}" y2="${tipy.toFixed(1)}"><stop offset="0" stop-color="${LILAC}" stop-opacity="0.26"/><stop offset="0.55" stop-color="${VIOLET}" stop-opacity="0.07"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></linearGradient>
    <linearGradient id="beamCoreG" gradientUnits="userSpaceOnUse" x1="${lampX}" y1="${lampY}" x2="${tipx.toFixed(1)}" y2="${tipy.toFixed(1)}"><stop offset="0" stop-color="#F5F2FB" stop-opacity="0.5"/><stop offset="0.4" stop-color="${LILAC}" stop-opacity="0.12"/><stop offset="1" stop-color="${LILAC}" stop-opacity="0"/></linearGradient>`;
  const stars = STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${LILAC}" opacity="0.5"/>`).join('');
  const edgeEls = edges.map(([i, j]) => {
    const a = nodes[i], b = nodes[j], hot = a.amber || b.amber;
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${hot ? LILAC : '#6f63a0'}" stroke-width="${hot ? 1.4 : 1}" opacity="${hot ? 0.5 : 0.3}"/>`;
  }).join('');
  const nodeEls = nodes.map((n) => n.amber
    ? `<circle cx="${n.x}" cy="${n.y}" r="34" fill="url(#amberG)"/><circle cx="${n.x}" cy="${n.y}" r="5" fill="#F5F2FB"/><circle cx="${n.x}" cy="${n.y}" r="11" fill="none" stroke="${AMBER}" stroke-width="2"/><circle cx="${n.x - 4.2}" cy="${n.y}" r="2.1" fill="#E0A52A"/><circle cx="${n.x + 4.2}" cy="${n.y}" r="2.1" fill="#E0A52A"/>`
    : `<circle cx="${n.x}" cy="${n.y}" r="22" fill="url(#nodeG)"/><circle cx="${n.x}" cy="${n.y}" r="3.4" fill="${LILAC}"/>`).join('');
  const bands = [0.18, 0.48, 0.78].map((f) => {
    const f1 = f + 0.13, yt = lampY + 14;
    const y0 = yt + (baseY - yt) * f, y1 = yt + (baseY - yt) * f1;
    const w0 = ht + (hb - ht) * f, w1 = ht + (hb - ht) * f1;
    return `<polygon points="${lampX - w0},${y0.toFixed(1)} ${lampX + w0},${y0.toFixed(1)} ${lampX + w1},${y1.toFixed(1)} ${lampX - w1},${y1.toFixed(1)}" fill="${LILAC}" opacity="0.16"/>`;
  }).join('');
  const tower = `${lampX - hb},${baseY} ${lampX - ht},${lampY + 14} ${lampX + ht},${lampY + 14} ${lampX + hb},${baseY}`;
  const body = `${stars}
  <polygon points="${lampX},${lampY} ${ax.toFixed(1)},${ay.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}" fill="url(#beamG)"/>
  <polygon points="${lampX},${lampY} ${cx.toFixed(1)},${cy.toFixed(1)} ${dx.toFixed(1)},${dy.toFixed(1)}" fill="url(#beamCoreG)"/>
  ${edgeEls}${nodeEls}
  <path d="M${lampX - 78},${baseY + 46} Q${lampX - 20},${baseY - 10} ${lampX},${baseY - 6} Q${lampX + 26},${baseY - 8} ${lampX + 78},${baseY + 46} Z" fill="#120d22"/>
  <polygon points="${tower}" fill="#34294e"/>
  ${bands}
  <polygon points="${tower}" fill="none" stroke="${VIOLET}" stroke-width="1.4" opacity="0.55"/>
  <rect x="${lampX - ht * 1.4}" y="${lampY - 14}" width="${ht * 2.8}" height="28" fill="#0f0b1c"/>
  <polygon points="${lampX - ht * 1.5},${lampY - 14} ${lampX},${lampY - 30} ${lampX + ht * 1.5},${lampY - 14}" fill="#34294e"/>
  <circle cx="${lampX}" cy="${lampY}" r="52" fill="url(#lampG)"/>
  <circle cx="${lampX}" cy="${lampY}" r="3.4" fill="#F5F2FB"/>`;
  return { defs, body };
}

const CARDS = [
  {
    name: 'vahtian',
    kicker: 'RESEARCH CITATION INTEGRITY',
    title: ['Does the evidence', 'support the claim?'],
    sub: ['Blinded human → AI → adjudication,', 'recorded in a hash-chained audit trail.'],
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
  {
    name: 'methodvahti',
    kicker: 'METHODVAHTI — FOR QUALITATIVE RESEARCHERS',
    title: ['Justify your', 'sample size,', 'honestly.'],
    sub: ['Three sample-size models + a heterogeneity score,', 'into a COREQ/SRQR methods PDF. Free beta.'],
  },
  {
    name: 'reviewvahti',
    kicker: 'REVIEWVAHTI — SCREENING RELIABILITY',
    title: ['How well did your', 'reviewers agree?'],
    sub: ['Cohen’s κ, PABAK, AC1, Krippendorff’s α', 'across 2–7 reviewers. In your browser.'],
  },
  {
    name: 'extractvahti',
    kicker: 'EXTRACTVAHTI — DTA EXTRACTION + RISK OF BIAS',
    title: ['Extract once.', 'Appraise once.'],
    sub: ['QUADAS-2 / QUADAS-C / PROBAST-AI, into tidy', 'CSV for meta-analysis in R. Local-first.'],
  },
  {
    name: 'guidelinevahti',
    kicker: 'GUIDELINEVAHTI — PANEL CONSENSUS',
    title: ['Turn panel votes', 'into consensus.'],
    sub: ['RAND/UCLA · Delphi · GRADE recommendations,', 'anonymous, in the browser.'],
  },
  {
    name: 'synthvahti',
    kicker: 'SYNTHVAHTI — DTA AGREEMENT SYNTHESIS',
    title: ['Pool agreement.', 'Keep HSROC in R.'],
    sub: ['Random-effects pooling + forest/funnel figures', 'in the browser; a versioned R script for the rest.'],
  },
  {
    name: 'fullvahti',
    kicker: 'FULLVAHTI — ZOTERO PLUGIN',
    title: ['Find the', 'open-access PDF.'],
    sub: ['Unpaywall + PMC, in two clicks, with an honest', 'report of what’s missing. Never bypasses a paywall.'],
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function svgCard({ name, kicker, title, sub }) {
  kicker = esc(kicker); title = title.map(esc); sub = sub.map(esc);
  const W = 1200, H = 630, X = 96;
  // One uniform type scale for every card — same fonts, same sizes, more air.
  const titleSize = 54, lineGap = 68, titleTop = 214;
  const titleEls = title.map((t, i) =>
    `<text x="${X}" y="${titleTop + i * lineGap}" font-family="${SANS}" font-size="${titleSize}" font-weight="700" fill="#FFFFFF" letter-spacing="-0.5">${t}</text>`).join('\n  ');
  const subTop = titleTop + title.length * lineGap + 30;
  const subEls = sub.map((t, i) =>
    `<text x="${X}" y="${subTop + i * 38}" font-family="${SANS}" font-size="24" fill="${LILAC}">${t}</text>`).join('\n  ');
  const sc = scene();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${name} social card">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150f28"/><stop offset="0.62" stop-color="#1d1630"/><stop offset="1" stop-color="#171127"/></linearGradient>
    <radialGradient id="lampG"><stop offset="0" stop-color="#F5F2FB" stop-opacity="0.95"/><stop offset="0.4" stop-color="${LILAC}" stop-opacity="0.5"/><stop offset="1" stop-color="${LILAC}" stop-opacity="0"/></radialGradient>
    <radialGradient id="nodeG"><stop offset="0" stop-color="${LILAC}" stop-opacity="0.55"/><stop offset="1" stop-color="${LILAC}" stop-opacity="0"/></radialGradient>
    <radialGradient id="amberG"><stop offset="0" stop-color="#E0A52A" stop-opacity="0.7"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>
    ${sc.defs}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${sc.body}
  ${markTile(GLYPHS[name], X, 48, 72)}
  <text x="${X}" y="156" font-family="${MONO}" font-size="21" font-weight="700" fill="${LILAC}" letter-spacing="3">${kicker}</text>
  ${titleEls}
  ${subEls}
  <text x="${X}" y="566" font-family="${MONO}" font-size="24" font-weight="700" fill="${LILAC}">[ vahtian.com ]</text>
</svg>`;
}

for (const card of CARDS) {
  const svg = svgCard(card);
  writeFileSync(join(OUT, `${card.name}-card.svg`), svg + '\n');
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      // Bundle the Liberation fonts (≈ the system sans stack) so output is
      // deterministic and sans on any machine — never a serif fallback.
      fontFiles: FONTS,
      loadSystemFonts: false,
      defaultFontFamily: 'Liberation Sans',
    },
  }).render().asPng();
  writeFileSync(join(OUT, `${card.name}-card.png`), png);
  console.log(`✓ ${card.name}-card.png (${png.length} bytes)`);
}
