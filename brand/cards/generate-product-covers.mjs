// Product-cover generator for screenshot-led kits.
// Usage: node brand/cards/generate-product-covers.mjs
// The screenshots remain the source of truth: this script only crops and frames them.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FONT_DIR = join(ROOT, "brand", "fonts");
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(ROOT, ".claude", "skills", "run-vahtian", "node_modules", "playwright"),
);

const fontFace = (family, file, weight) => {
  const data = readFileSync(join(FONT_DIR, file)).toString("base64");
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight}}`;
};
const FONT_CSS = [
  fontFace("Nudica", "nudica-medium.woff2", 500),
  fontFace("Nudica", "nudica-bold.woff2", 700),
  fontFace("Nudica Mono", "nudica-mono-medium.woff2", 500),
  fontFace("Marksy", "marksy-regular.woff2", 500),
  fontFace("Marksy", "marksy-bold.woff2", 600),
].join("");

const COLORS = {
  navy: "#2D2440",
  violet: "#8B6FC9",
  lilac: "#C5B8E8",
  pale: "#FAF9FC",
  muted: "#D8D1E8",
};

const COVERS = [
  {
    directory: "reviewer-response-builder",
    source: "reviewer-response-builder-preview.png",
    output: "reviewer-response-builder-cover",
    kicker: "REVISE AND RESUBMIT",
    title: ["Reviewer", "Response", "Builder"],
    note: ["One comment / one answer /", "one real change"],
  },
  {
    directory: "reviewers-notebook",
    source: "reviewers-notebook-preview.png",
    output: "reviewers-notebook-cover",
    kicker: "PEER REVIEW, BEFORE THE VERDICT",
    title: ["Reviewer's", "Notebook"],
    note: ["Ask / offer / drop"],
  },
];

const escapeXml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function coverSvg(config) {
  const sourcePath = join(ROOT, config.directory, config.source);
  const source = readFileSync(sourcePath).toString("base64");
  const titleStart = config.title.length === 3 ? 172 : 198;
  const titleGap = 62;
  const ruleY = titleStart + (config.title.length - 1) * titleGap + 40;
  const noteStart = ruleY + 72;
  const title = config.title
    .map(
      (line, index) =>
        `<text x="66" y="${titleStart + index * titleGap}" class="title">${escapeXml(line)}</text>`,
    )
    .join("\n  ");
  const note = config.note
    .map(
      (line, index) =>
        `<text x="66" y="${noteStart + index * 42}" class="note">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(config.title.join(" "))}">
  <style>
    ${FONT_CSS}
    .kicker { font-family: "Nudica Mono"; font-size: 20px; font-weight: 500; letter-spacing: 1.2px; fill: ${COLORS.lilac}; }
    .title { font-family: "Nudica"; font-size: 60px; font-weight: 700; letter-spacing: -1px; fill: #fff; }
    .note { font-family: "Marksy"; font-size: 35px; font-weight: 600; letter-spacing: 1px; fill: ${COLORS.lilac}; }
    .footer { font-family: "Nudica Mono"; font-size: 18px; font-weight: 500; letter-spacing: 1px; fill: ${COLORS.muted}; }
  </style>
  <defs>
    <clipPath id="shot"><rect x="626" y="58" width="530" height="482" rx="3"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="${COLORS.navy}"/>
  <text x="66" y="82" class="kicker">${escapeXml(config.kicker)}</text>
  ${title}
  <path d="M68 ${ruleY} C178 ${ruleY - 3}, 282 ${ruleY + 4}, 392 ${ruleY} S505 ${ruleY + 3}, 552 ${ruleY - 1}" fill="none" stroke="${COLORS.lilac}" stroke-width="5" stroke-linecap="round"/>
  <path d="M68 ${ruleY + 10} C180 ${ruleY + 14}, 280 ${ruleY + 6}, 390 ${ruleY + 11} S500 ${ruleY + 8}, 552 ${ruleY + 12}" fill="none" stroke="${COLORS.lilac}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
  ${note}
  <text x="66" y="565" class="footer">LOCAL-FIRST · VAHTIAN.COM</text>
  <rect x="614" y="46" width="554" height="506" rx="7" fill="${COLORS.violet}"/>
  <rect x="626" y="58" width="530" height="482" fill="${COLORS.pale}"/>
  <image href="data:image/png;base64,${source}" x="626" y="58" width="530" height="482" preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)"/>
  <path d="M625 566 C742 561, 864 571, 976 565 S1095 569, 1160 564" fill="none" stroke="${COLORS.lilac}" stroke-width="4" stroke-linecap="round"/>
  <path d="M638 577 C760 580, 864 571, 990 577 S1090 574, 1153 578" fill="none" stroke="${COLORS.lilac}" stroke-width="2" stroke-linecap="round" opacity=".85"/>
</svg>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

for (const cover of COVERS) {
  const svg = coverSvg(cover);
  const outputBase = join(ROOT, cover.directory, cover.output);
  writeFileSync(`${outputBase}.svg`, `${svg}\n`);
  await page.setContent(`<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}</style>${svg}`);
  await page.screenshot({ path: `${outputBase}.png`, type: "png" });
  console.log(`✓ ${relative(ROOT, outputBase)}.png`);
}

await browser.close();
