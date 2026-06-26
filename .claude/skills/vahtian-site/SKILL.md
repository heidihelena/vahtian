---
name: vahtian-site
description: Build and maintain the Vahtian static site (vahtian.com) to a professional standard. Use when adding a new page or tool, doing a site-wide quality pass, or whenever you touch HTML/meta/sitemap/footer — it enforces the per-page completeness, consistency, accessibility, SEO/GEO, security, and editorial standards that automated checks (Lighthouse) do NOT measure, and prevents the per-page drift (meta, footer, sitemap) that creeps into a hand-maintained multi-page site. Complements run-vahtian (serve/screenshot), vahtian-brand-safety (copy), vahtian-ux-auditor (UX), and vahtian-frontend-implementer (edits).
---

# Vahtian site — professional build & maintenance standard

The site already passes Lighthouse ~100. This skill is about everything Lighthouse
does **not** measure: consistency, accessibility depth, AI-citability, security,
editorial integrity, and drift prevention on a hand-maintained, zero-build,
static HTML/CSS/vanilla-JS site hosted on Cloudflare Workers.

**The site's invariant comes first.** Vahtian records whether a cited source
supports a specific claim and keeps an auditable record; it does **not** certify
scientific truth, quality, or correctness. Every page must be consistent with
this. When in doubt about copy, run `vahtian-brand-safety` before shipping.

## The golden rule: no page ships alone

The #1 failure mode on this site is **drift** — a new page or tool ships missing
the meta set, with a slightly different footer, or absent from the sitemap; or a
`noindex` page lands in the sitemap. Treat every page as part of a system, not a
one-off. Before any new page or tool is "done", run the checklist in
`references/new-page-checklist.md` — it is the single source of truth.

Copy the `<head>` from `references/head-template.html` rather than hand-writing
meta tags. The strongest existing pages to mirror are `citevahti/` and
`studyvahti/`.

## What "professional" means here, by dimension

Each item is tagged **[do]** (adopt — high impact-to-effort for a solo maintainer)
or **[grows]** (worth it as the site/team grows; don't over-engineer yet).

### 1. Consistency & drift prevention  [do]
- **Every page** carries the full head set: `title`, `description`, `canonical`,
  full Open Graph (`og:type/url/title/description/image` + `image:width/height/alt`
  + `site_name`), `twitter:card`, a JSON-LD block, `theme-color`, and a brand
  favicon. See the template.
- **Every footer** is identical in shape: `© <year> Vahtian · <context> · source ·
  Cite · Privacy` (About where relevant), plus the one-line invariant disclaimer.
- **Every page** is added to `sitemap.xml` **unless** it is `noindex`.
- Run the audit grep (checklist §Verify) after any structural change — it catches
  drift in seconds.

### 2. Accessibility beyond automated audits  [do]
- **`prefers-reduced-motion`**: any interaction-/load-triggered motion (the canvas
  lighthouse hero, transitions) must be paused or not started under
  `@media (prefers-reduced-motion: reduce)`. This satisfies **WCAG 2.2 SC 2.3.3
  (Animation from Interactions)**. The media query at default is sufficient — a
  visible "stop animation" toggle is **not** required (verified). The hero JS
  already checks `matchMedia('(prefers-reduced-motion: reduce)')`; keep that contract
  for any new animation.
- **Keyboard & focus**: every interactive control reachable and operable by keyboard;
  visible focus ring; logical tab order; no keyboard traps.
- **Accessible names**: icon-only links/buttons need `aria-label`; decorative SVG/img
  get `aria-hidden="true"` / `alt=""`; meaningful images get real `alt`.
- **One `<h1>` per page**, sensible heading order. (Watch for `<h1>` hidden inside JS
  template strings — those are not page headings; don't "fix" them.)
- **Live regions**: don't inject promotional/CTA content into an `aria-live` region —
  it re-announces on every update. (This is why the ForskAI card lives in the sidebar,
  not the readiness panel.)

### 3. Performance discipline  [do] / field data [grows]
- Keep the zero-build, **zero-external-request** model: inline critical CSS, self-host
  fonts, no CDN JS, no trackers. This is already best-in-class — protect it.
- Lazy-load below-the-fold images (`loading="lazy"`); ship sized social cards (1200×630).
- **[grows]** Track Core Web Vitals *field* data (CrUX / a privacy-respecting RUM) once
  there's real traffic — a one-time lab score ≠ field performance.

### 4. SEO + GEO (generative-engine optimization) + structured data  [do]
- **Structured data per page type**: `SoftwareApplication` for tools, `WebPage`/`AboutPage`
  for content, `Organization`/`WebSite` on the homepage. Validate it parses.
- **GEO — be cited by AI answer engines** (verified, GEO-bench): content that includes
  **citations, statistics, and direct quotations** is measurably more likely to be
  surfaced/cited by generative engines. For Vahtian this is honest and on-brand — cite
  the standards (PRISMA, QUADAS-2, GRADE…), name real methods, give concrete numbers.
  Purely stylistic fluency also helps; keyword stuffing does not.
- Maintain `llms.txt` and the `/agents/` page — explicit, machine-readable affordances
  for AI assistants are a differentiator, not noise.
- **Sitemap rule** (verified): every URL in the sitemap must be its own `canonical` and
  should be indexable. Keep `noindex` pages **out** of the sitemap — this is cleanliness,
  not a hard Google penalty (the "penalty" claim is weak), but do it anyway.

### 5. Editorial & brand integrity  [do]
- **Anti-overclaim is a feature, not modesty.** Research confirms hype in science is a
  deliberate, widespread strategy that researchers simultaneously practice and distrust —
  so honest, non-overclaiming copy is a real trust advantage with this audience. Never
  imply Vahtian verifies truth, detects all problems, or replaces judgment.
- Consistent voice: plain language, active voice, concrete verbs; "checks whether a cited
  source **supports** a claim" — never "verifies facts" / "guarantees integrity".
- Run `vahtian-brand-safety` on any new product copy before shipping.

### 6. Security  [do]
- Stay **zero-dependency**: no third-party scripts means almost no supply-chain surface.
- Keep/extend the strict per-page **CSP** on the app-like tools (e.g. reviewvahti uses
  `default-src 'none'` + explicit allows). `application/ld+json` is data, not script — it
  is safe under a strict `script-src`.
- **[grows]** Add site-wide security response headers via a Cloudflare Worker
  (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Strict-Transport-Security`, `Permissions-Policy`). Use **SRI** (`integrity=…`) for any
  external resource you ever add (ideally: never add one).

### 7. Engineering hygiene & CI  [done]
GitHub Actions CI runs on every PR + push to main (`.github/workflows/ci.yml`):
- **Drift audit** (`.github/scripts/audit.sh`) — the **hard gate**. Runs the §Verify
  checks: meta completeness, JSON-LD validity, noindex/sitemap conflicts, footer
  consistency, sitemap integrity, and internal-link resolution. A failing audit blocks
  the merge. **Run it locally before pushing:** `bash .github/scripts/audit.sh`.
- **Lighthouse CI** (`lighthouserc.json`) — performance/a11y/SEO **budgets**;
  `continue-on-error` so score variance never blocks a merge. Tighten thresholds over time.
- **pa11y-ci** (`.pa11yci`) — WCAG 2.2 AA on the key pages via a local static server;
  `continue-on-error` until consistently green, then promote it to a hard gate.

Keep `audit.sh` in sync with this checklist: when you add a new site-wide invariant,
add a check so drift fails CI instead of reaching production.

## Workflow for a new page or tool

1. **Copy** `references/head-template.html` into the new page's `<head>`; fill every slot.
2. **Build** the body, matching an existing peer page's structure/classes (cite/, fullvahti/).
3. **Brand-safety**: run `vahtian-brand-safety` on the copy.
4. **Render**: use `run-vahtian` to screenshot desktop + mobile; check it visually.
5. **Wire it in**: sitemap entry (unless noindex), homepage router + tool card if it's a tool,
   footer links present.
6. **Verify**: run the checklist's audit grep; fix any drift.
7. **Social card**: generate a bespoke 1200×630 card via `brand/cards/generate.mjs` (needs
   `@resvg/resvg-js`, installed temporarily and **not** committed) and point `og:image` at it.

## Workflow for a site-wide quality pass

Run the audit grep across all pages (checklist §Verify) → fix drift → spot-check the
weakest pages with `vahtian-ux-auditor` → confirm all pages serve 200 and JSON-LD parses.

## Evidence base

Standards above are grounded in a verified research pass (3-0 adversarial votes unless noted):
WCAG 2.2 SC 2.3.3 (w3.org); GEO / GEO-bench (arXiv 2311.09735); Lighthouse CI & pa11y-ci
(official repos); sitemap-canonical hygiene; science-hype editorial findings (Nature 2025).
Over-strong claims that were **refuted** and deliberately excluded: a visible animation
toggle being required (the media query suffices); noindex-in-sitemap being a hard Google
penalty; sitemap trimming directly raising indexation.
