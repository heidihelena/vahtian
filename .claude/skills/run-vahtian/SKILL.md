---
name: run-vahtian
description: Run, serve, and screenshot the Vahtian static site (vahtian.com) locally. Use when asked to launch, preview, build, or take a screenshot of the Vahtian homepage or any product page (CiteVahti, StudyVahti, MethodVahti, DictVahti, MatchVahti-Lite, ReviewVahti, ExtractVahti, GuidelineVahti), or to see a UI/UX/copy change rendered before committing. Driver serves the static files exactly as Cloudflare does and shoots desktop + mobile PNGs with headless Chromium.
---

# Run Vahtian

Vahtian's site is **plain static HTML** — one `index.html` per product, deployed
via Cloudflare (`wrangler.jsonc`: `assets.directory = "."`). **There is no build
step, no framework, no bundler, no trackers.** You don't "start" it so much as
serve the directory.

The agent path is the driver: `.claude/skills/run-vahtian/driver.mjs`. It starts
a tiny static server that resolves clean URLs the way Cloudflare does
(`/studyvahti` → `/studyvahti/index.html`, unknown → `404.html`), then drives it
with Playwright's bundled headless Chromium and writes **desktop + mobile**
screenshots. Use it whenever you need to *see* the rendered page — every UX or
copy change should be looked at, not inferred from HTML source.

> All paths below are relative to the repo root (`<unit>/` = the `vahtian/` repo).

## Prerequisites

Already present in this container — no `apt-get` needed:

- **Node 22** (`.node-version` pins `22`).
- **Playwright + Chromium**, installed globally at
  `/opt/node22/lib/node_modules/playwright`. The driver resolves it from there
  automatically; no `npm install` in the repo.

If Chromium is ever missing, install the browser only (the npm package is
already global):

```bash
npx playwright install chromium
```

## Run (agent path) — the driver

```bash
# Screenshot the default set (home + the four live product pages),
# desktop (1280×900) and mobile (390×844):
node .claude/skills/run-vahtian/driver.mjs

# Screenshot specific paths only:
node .claude/skills/run-vahtian/driver.mjs / /studyvahti /reviewvahti

# Status check only (serve + assert every path returns 200, no browser):
node .claude/skills/run-vahtian/driver.mjs --check / /studyvahti /llms.txt
```

Screenshots land in `.claude/skills/run-vahtian/shots/<slug>.{desktop,mobile}.png`
(`/` → `home`, `/matchvahti-lite` → `matchvahti-lite`). **Open them and look** —
a UX/brand-safety review is only real if you saw the pixels. `--check` exits
non-zero if any requested path fails to return 200, so it doubles as a link
smoke test.

Verified working this session — `node .claude/skills/run-vahtian/driver.mjs /`
produced `shots/home.desktop.png` and `shots/home.mobile.png` showing the hero,
the "Which Vahti should I use?" chooser, the product cards, the audit workflow,
and the "Vahtian does not decide scientific truth" trust block.

## Run (human path)

For an interactive browser, serve the directory and open it yourself — headless,
this is useless, but it's what mirrors production locally:

```bash
npx wrangler dev            # Cloudflare's own asset server (needs network for first run)
# or, no-dependency:
python3 -m http.server 8000 # then visit http://localhost:8000/  (trailing slash matters)
```

`python3 -m http.server` only resolves `/studyvahti/` **with** a trailing slash;
the driver's server resolves both, which is why the driver is the reliable path.

## The UX-review loop this driver feeds

This driver exists to make the three Vahtian review skills *real*. The intended
loop (one focused change per iteration):

1. `node driver.mjs /` → look at `home.desktop.png` **and** `home.mobile.png`.
2. **vahtian-ux-auditor** — find the highest-impact comprehension/CTA/hierarchy issue.
3. **vahtian-brand-safety** — confirm the proposed copy keeps the invariant
   (assesses claim-source support; never certifies truth).
4. **vahtian-frontend-implementer** — make the smallest coherent edit.
5. Re-shoot, re-review, revise once, then commit one focused change.

## Gotchas

- **`.claude/` is git-ignored**, but `.gitignore` has an exception for
  `.claude/skills/` so this skill + driver commit. The `shots/` directory stays
  ignored (PNGs are large, regenerable) — don't try to commit screenshots.
- **Absolute clean URLs.** Pages link to `/studyvahti`, not `studyvahti/`. A
  naive `file://` open or a plain `http.server` mishandles these; the driver's
  resolver matches Cloudflare's `not_found_handling: "404-page"` behaviour.
- **`networkidle` is safe here** because the site makes *zero* external requests
  (no trackers, no CDN fonts). If a future change adds an external request,
  `page.goto(..., {waitUntil:'networkidle'})` could hang — keep the site
  request-free (it's a brand invariant anyway).
- **`fullPage: true`** captures the whole scroll height — these pages are long,
  so a "mobile" shot is tall (~800px wide at 2× DPR, several thousand px tall).
  That's intended for reading hierarchy top-to-bottom.

## Troubleshooting

- `Cannot find module 'playwright'` → the global resolve fallback already points
  at `/opt/node22/lib/node_modules/playwright`; if that path changed, run
  `npm root -g` and update the fallback in `driver.mjs`.
- `browserType.launch: Executable doesn't exist` → `npx playwright install chromium`.
- A path prints `FAIL 404` → the file or its `index.html` doesn't exist at that
  path under the repo root; check the slug matches a real directory.
