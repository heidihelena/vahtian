// Generate the Vahtian homepage social share card.
// Usage: node brand/cards/generate-vahtian-share-card.mjs
//
// The shipped PNG is the Open Graph asset. The SVG remains as an editable,
// same-origin source and loads the licensed Vahtian fonts from ../fonts/.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FONT_DIR = join(HERE, "..", "fonts");
const OUTPUT = join(HERE, "vahtian-share-card");
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(ROOT, ".claude", "skills", "run-vahtian", "node_modules", "playwright"),
);

const COLORS = {
  violet: "#8B6FC9",
  ink: "#1C1830",
  pale: "#FAF9FC",
};

const fontDataUrl = (filename) => {
  const data = readFileSync(join(FONT_DIR, filename)).toString("base64");
  return `data:font/woff2;base64,${data}`;
};

const FONT_DATA = {
  nudicaBold: fontDataUrl("nudica-bold.woff2"),
  nudicaMono: fontDataUrl("nudica-mono-medium.woff2"),
  marksyBold: fontDataUrl("marksy-bold.woff2"),
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Vahtian.com — Your future reviewer has questions. Good. Show your work.">
  <style>
    @font-face {
      font-family: "Nudica";
      src: url("${FONT_DATA.nudicaBold}") format("woff2");
      font-weight: 700;
    }
    @font-face {
      font-family: "Nudica Mono";
      src: url("${FONT_DATA.nudicaMono}") format("woff2");
      font-weight: 500;
    }
    @font-face {
      font-family: "Marksy";
      src: url("${FONT_DATA.marksyBold}") format("woff2");
      font-weight: 600;
    }
    .domain {
      font: 500 25px "Nudica Mono", monospace;
      letter-spacing: 1.2px;
      fill: ${COLORS.pale};
    }
    .headline {
      font: 700 78px "Nudica", sans-serif;
      letter-spacing: -1.8px;
      fill: ${COLORS.ink};
    }
    .note {
      font: 600 58px "Marksy", cursive;
      letter-spacing: .4px;
      fill: ${COLORS.pale};
    }
  </style>
  <defs>
    <pattern id="field-grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.45" fill="${COLORS.ink}" opacity=".12"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="${COLORS.violet}"/>
  <rect width="1200" height="630" fill="url(#field-grid)"/>

  <text x="88" y="78" class="domain">vahtian.com</text>

  <text x="86" y="238" class="headline">Your future reviewer</text>
  <text x="86" y="326" class="headline">has questions.</text>

  <g transform="rotate(-1 88 465)">
    <text x="88" y="465" class="note">Good. Show your work.</text>
    <path d="M90 488 C205 480, 318 495, 433 486 S603 491, 686 483"
          fill="none" stroke="${COLORS.pale}" stroke-width="6"
          stroke-linecap="round"/>
    <path d="M94 500 C220 506, 330 492, 452 500 S610 496, 680 501"
          fill="none" stroke="${COLORS.pale}" stroke-width="2.5"
          stroke-linecap="round" opacity=".78"/>
  </g>
</svg>`;

writeFileSync(`${OUTPUT}.svg`, `${svg}\n`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(`${OUTPUT}.svg`).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${OUTPUT}.png`, type: "png" });
await browser.close();

console.log("✓ brand/cards/vahtian-share-card.png");
