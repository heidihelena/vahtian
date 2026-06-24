#!/usr/bin/env node
// run-vahtian driver — serve the static Vahtian site and screenshot it.
//
// The Vahtian site is plain static HTML deployed via Cloudflare (wrangler
// `assets.directory = "."`). There is no build step. This driver mirrors that:
// it starts a tiny static server rooted at the repo (resolving clean URLs the
// way Cloudflare does — `/studyvahti` -> `/studyvahti/index.html`, unknown ->
// `404.html`), drives it with Playwright's bundled Chromium headless, and
// writes screenshots at desktop + mobile widths so a UX/brand-safety review
// can actually SEE the page instead of guessing from the HTML source.
//
// Usage:
//   node .claude/skills/run-vahtian/driver.mjs                 # shoot defaults
//   node .claude/skills/run-vahtian/driver.mjs / /studyvahti   # shoot listed paths
//   node .claude/skills/run-vahtian/driver.mjs --check         # serve + assert 200s, no shots
//
// Output: PNGs in .claude/skills/run-vahtian/shots/<slug>.{desktop,mobile}.png
// Exit code is non-zero if any requested path does not return HTTP 200.

import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Playwright is installed globally in this container; resolve it from there.
const require = createRequire(import.meta.url);
let chromium;
try {
  chromium = require('playwright').chromium;
} catch {
  chromium = require('/opt/node22/lib/node_modules/playwright').chromium;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');           // .claude/skills/run-vahtian -> repo root
const SHOTS = join(HERE, 'shots');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf',
};

// Resolve a request path to a file on disk the way the Cloudflare asset
// handler does: exact file, then path/index.html, then the 404 page.
function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.includes('..')) return { file: join(REPO, '404.html'), status: 404 };
  const candidates = [];
  if (extname(p)) candidates.push(join(REPO, p));
  else {
    candidates.push(join(REPO, p, 'index.html'));
    candidates.push(join(REPO, p));               // e.g. /llms.txt already has ext, handled above
  }
  for (const c of candidates) if (existsSync(c) && extname(c)) return { file: c, status: 200 };
  return { file: join(REPO, '404.html'), status: 404 };
}

function startServer() {
  return new Promise((res) => {
    const server = createServer(async (req, rsp) => {
      const { file, status } = resolveFile(req.url);
      try {
        const body = await readFile(file);
        rsp.writeHead(status, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
        rsp.end(body);
      } catch {
        rsp.writeHead(500); rsp.end('server error');
      }
    });
    server.listen(0, '127.0.0.1', () => res({ server, port: server.address().port }));
  });
}

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/+|\/+$/g, '').replace(/\//g, '-')) || 'home';

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes('--check');
  const paths = argv.filter((a) => !a.startsWith('--'));
  const targets = paths.length ? paths : ['/', '/studyvahti', '/dictvahti', '/matchvahti-lite', '/reviewvahti'];

  await mkdir(SHOTS, { recursive: true });
  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  console.log(`serving ${REPO} at ${base}`);

  let failed = 0;
  const browser = checkOnly ? null : await chromium.launch();
  try {
    for (const path of targets) {
      const url = base + path;
      // Status check via a throwaway request.
      const head = await fetch(url).then((r) => r.status).catch(() => 0);
      const ok = head === 200;
      if (!ok) failed++;
      console.log(`${ok ? 'OK ' : 'FAIL'} ${head}  ${path}`);
      if (checkOnly || !browser) continue;

      for (const [label, viewport] of [
        ['desktop', { width: 1280, height: 900 }],
        ['mobile', { width: 390, height: 844 }],
      ]) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
        await page.goto(url, { waitUntil: 'networkidle' });
        const out = join(SHOTS, `${slug(path)}.${label}.png`);
        await page.screenshot({ path: out, fullPage: true });
        console.log(`  shot ${label.padEnd(7)} -> ${out}`);
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
  if (failed) { console.error(`\n${failed} path(s) did not return 200`); process.exit(1); }
  console.log('\ndone');
}

main().catch((e) => { console.error(e); process.exit(1); });
