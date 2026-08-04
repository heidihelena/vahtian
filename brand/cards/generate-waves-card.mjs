// Generate the /waves/ social share card.
// Usage: node brand/cards/generate-waves-card.mjs
//
// The card is a real frame of the artwork, not a drawing of it: the script
// serves the repo, opens waves/ambient.html, drives its deterministic
// window.__frame(t) hook at a fixed sim time, and screenshots the canvas with
// the title block composited on top. Change SIM_T to pick a different wave.
//
// Dark canvas is deliberate here (the site's cards are otherwise light): this
// card shows an artwork whose medium is a black sea, and a light card would
// misrepresent what the visitor is about to open.

import { createServer } from "node:http";
import { createReadStream, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
// JPEG, not PNG: the sea is a dense stochastic point field, which PNG stores at
// ~850 kB and JPEG at a tenth of that with no visible loss at card size.
const OUTPUT = join(HERE, "waves-share-card.jpg");
const require = createRequire(import.meta.url);
const { chromium } = require(
  join(ROOT, ".claude", "skills", "run-vahtian", "node_modules", "playwright"),
);

// Sim time of the captured frame. The note walk is seeded, so this is stable.
// At 147.3 the four waves on screen carry C5, D5, A5, C6: pink, gold, pale blue,
// pale rose. A card about colour has to show the colours the mapping produces.
const SIM_T = 147.3;

// The C-D-G-A ladder read straight out of the piece, so the strip on the card
// can never drift from the colours the artwork actually plays. Source of both:
// palettecore experiments/waves_to_shore.py (output/waves_to_shore.json).
const LADDER = [
  ...readFileSync(join(ROOT, "waves", "ambient.html"), "utf8").matchAll(
    /\{ note: "([^"]+)", f: [\d.]+, hex: "(#[0-9A-Fa-f]{6})" \}/g,
  ),
].map(([, note, hex]) => ({ note, hex }));
if (LADDER.length !== 13) throw new Error(`ladder parse got ${LADDER.length}, expected 13`);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
};

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(req.url.split("?")[0]));
  const file = join(ROOT, path);
  const ext = path.slice(path.lastIndexOf("."));
  res.setHeader("Content-Type", TYPES[ext] || "application/octet-stream");
  createReadStream(file)
    .on("error", () => {
      res.statusCode = 404;
      res.end("not found");
    })
    .pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ headless: true });
// Rendered at 2400x1260 and shot back down to 1200x630. The sea's point count
// scales with area, so supersampling is what gives the card the density the
// piece has fullscreen; at card size straight on it renders as thin dust.
const page = await browser.newPage({
  viewport: { width: 2400, height: 1260 },
  deviceScaleFactor: 0.5,
});
await page.goto(`${base}/waves/ambient.html`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

await page.evaluate(({ t, ladder }) => {
  document.getElementById("hud").remove();
  window.__resize(2400, 1260);
  window.__frame(t);

  const card = document.createElement("div");
  card.innerHTML = `
    <div class="scrim"></div>
    <div class="type">
      <p class="kicker">waves to the shore</p>
      <p class="ask">does music have a colour?</p>
    </div>
    <p class="by">Heidi Anders&eacute;n &middot; vahtian.com/waves</p>
    <div class="ladder">${ladder
      .map((e) => `<i style="background:${e.hex}" title="${e.note}"></i>`)
      .join("")}</div>
`;
  card.setAttribute(
    "style",
    "position:fixed;inset:0;font-family:'Nudica','Avenir Next',system-ui,sans-serif",
  );
  document.body.appendChild(card);

  const css = document.createElement("style");
  css.textContent = `
    .scrim{position:absolute;inset:0;
      background:linear-gradient(100deg,rgba(0,0,0,.86) 0%,rgba(0,0,0,.6) 34%,rgba(0,0,0,0) 72%)}
    .type{position:absolute;left:144px;top:428px}
    .kicker{margin:0 0 36px;font-size:38px;font-weight:300;letter-spacing:.22em;
      color:#CFC9C2;opacity:.72}
    .ask{margin:0;font-size:124px;line-height:1.06;font-weight:300;font-style:italic;
      letter-spacing:.005em;color:#F2EEE8}
    .by{position:absolute;left:144px;bottom:122px;margin:0;font-size:38px;font-weight:300;
      letter-spacing:.14em;color:#CFC9C2;opacity:.62}
    .ladder{position:absolute;left:0;right:0;bottom:0;height:58px;display:flex}
    .ladder i{flex:1}
`;
  document.head.appendChild(css);
}, { t: SIM_T, ladder: LADDER });

await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUTPUT, type: "jpeg", quality: 80 });
await browser.close();
server.close();

const bytes = readFileSync(OUTPUT).length;
console.log(`✓ brand/cards/waves-share-card.jpg (${Math.round(bytes / 1024)} kB)`);
