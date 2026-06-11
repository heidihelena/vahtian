# vahtian.com — task list (high gain / low effort first)

Evaluation date: 2026-06-10. Site is live, fast, fully self-contained, and
STYLE.md-compliant. Gaps are conversion + discoverability, not craft.

## Tier 1 — do first (≤15 min each, direct gain)

- [x] **Hero CTA on homepage.** Add `Try CiteVahti →` (primary) and
      `View on GitHub` (ghost) buttons to the `index.html` hero. The only live
      product is currently below the fold behind a small text link.
      *Gain: conversion. Effort: ~10 min (button styles already exist on the
      CiteVahti page — copy them).*
- [x] **"Get notified" path on roadmap products.** ReviewVahti, GuidelineVahti,
      AtlasVahti cards are dead ends. Add a mailto link per card, e.g.
      `mailto:hello@vahtian.com?subject=ReviewVahti%20interest` — zero infra,
      consistent with the no-trackers rule.
      *Gain: lead capture for the paid side. Effort: ~10 min.*
- [x] **Fix canonical on /citevahti.** Server resolves to `/citevahti/`
      (307 redirect) but `<link rel="canonical">` and og:url say `/citevahti`.
      Make them match the trailing-slash URL.
      *Gain: SEO hygiene. Effort: 2 min.*
- [x] **Add `sitemap.xml`** listing `/` and `/citevahti/` (currently 404).
      robots.txt is already served by Cloudflare — no action needed there.
      *Gain: indexing. Effort: 5 min.* → submit to Google Search Console (Heidi).
- [x] **Add `.gitignore`** with `.DS_Store` (three are sitting untracked).
      *Effort: 2 min.*

## Tier 2 — same week (≤30 min each)

- [ ] **Proper OG image (1200×630).** `brand/vahti-family.png` is 1404×520
      (2.7:1) — social cards expect 1.91:1, so previews crop badly. Make a navy
      card: Vahtian mark + "Auditable citation integrity, at publication
      scale." Reuse for both pages (or a CiteVahti variant for /citevahti/).
- [x] **JSON-LD structured data.** `Organization` + `WebSite` on `/`,
      `SoftwareApplication` on `/citevahti/`, `WebApplication` on
      `/studyvahti/` and `/dictvahti/`. Researchers find tools via AI
      assistants — structured data feeds those answers.
- [ ] **Custom `404.html`** (Cloudflare Pages picks it up automatically).
      Branded navy page, link home. Currently the default.
- [ ] **`_headers` file** for Cloudflare Pages: `X-Content-Type-Options:
      nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
      `X-Frame-Options: DENY`, and a CSP — trivially strict since the site
      makes zero external requests.
- [ ] **apple-touch-icon.** Add a 180×180 PNG (derive from
      `brand/marks/png/vahtian.png`) + `<link rel="apple-touch-icon">` on both
      pages. The data-URI SVG favicon doesn't cover iOS home screen / Safari.
- [ ] **Enable Cloudflare zone analytics** (dashboard, server-side, no beacon
      script — stays consistent with "no trackers"). Right now there is no way
      to know if anyone visits at all.

## Tier 3 — decide / medium effort

- [ ] **StudyVahti:** the mark exists in `brand/marks/` and in the family PNG
      but it is absent from the homepage product list — add it as roadmap, or
      confirm the omission is intentional.
- [ ] **Show, don't tell on /citevahti/:** one screenshot or terminal capture
      of the blinded rating + guarded Zotero write would do more than any copy.
- [ ] **Real email capture** (only if mailto links start converting):
      Buttondown or a tiny Cloudflare Worker form — keeps the no-third-party-
      script rule if self-hosted.
- [ ] **Ship to PyPI / VS Code Marketplace** (citevahti repo, not this one) —
      the install story is the biggest friction in the funnel; the page
      already promises "coming to PyPI."
