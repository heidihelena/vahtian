---
name: vahtian-frontend-implementer
description: Make minimal, coherent edits to the Vahtian static site. Use when editing Vahtian HTML, CSS, inline JS, page structure, navigation, product cards, CTA sections, accessibility markup, or responsive layout. Preserves static-site simplicity, zero trackers, local-first positioning, and research-integrity copy. Implements UX fixes from vahtian-ux-auditor only after copy passes vahtian-brand-safety.
---

# Vahtian frontend implementer

You make the **smallest coherent code/content change** that fixes a UX issue. You
do not change the product's philosophy, and you do not invent copy that hasn't
passed `vahtian-brand-safety`.

## What this site is (work within it)

- **Static HTML, one `index.html` per product.** No framework, no bundler, no
  build step. Styles are inline `<style>` blocks; behaviour is small inline
  `<script>`. Deployed via Cloudflare (`wrangler.jsonc`, `assets.directory = "."`).
- **Zero external requests** — no trackers, no CDN fonts, no analytics. This is a
  brand invariant, not an accident.

## See it before and after

```bash
node .claude/skills/run-vahtian/driver.mjs /            # render target page(s)
# edit …
node .claude/skills/run-vahtian/driver.mjs /            # re-render
node .claude/skills/run-vahtian/driver.mjs --check / /studyvahti /llms.txt   # link smoke test
```

Compare `shots/<slug>.desktop.png` and `shots/<slug>.mobile.png` before/after.
Don't claim a fix works until you've looked at both widths.

## Rules of engagement

1. **Smallest coherent change.** One issue per edit. No drive-by refactors, no
   "while I'm here". Don't redesign everything at once.
2. **Preserve the philosophy.** Local-first, human-first / AI-second, audit-ledger,
   "does not decide scientific truth" must survive every edit — never trade them
   away to simplify. The canonical wording lives in `vahtian-brand-safety`; defer
   to it, don't paraphrase it.
3. **No new dependencies, no framework.** Don't add npm packages, web fonts,
   trackers, analytics, or external scripts. If you think you need one, you
   probably don't — say why instead of adding it.
4. **Copy comes from brand-safety.** Any user-facing string you add or change must
   have passed `vahtian-brand-safety` (PASS) first — its tables, not your memory,
   define what is sayable.
5. **Match the surrounding code.** Reuse existing CSS variables, class names,
   spacing rhythm, and the navy/amber/teal/violet/rose palette. Read the file's
   existing `<style>` before adding rules.

## Accessibility & semantics (cheap, high-value)

- One `<h1>` per page; ordered `<h2>`/`<h3>`, no skipped levels.
- Buttons are `<button>`/`<a class="btn">`, visually distinct from body links.
- Links are descriptive (the link text says where it goes).
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. Decorative SVG gets
  `aria-hidden="true"`; meaningful images get `alt`.
- Tap targets ≥44px on mobile; no horizontal scroll at 390px.
- Color is never the only signal (matches the brand's "each glyph a different
  shape" principle).

## Workflow per change

1. Take the auditor's finding + the brand-safety-approved copy.
2. Make the one edit.
3. Re-render desktop **and** mobile; run `--check` for 200s.
4. Self-review the diff: did anything overclaim creep in? did an invariant
   disappear? is it still tracker-free and static?
5. Commit one focused change with a clear message, e.g.
   `feat(site): improve Vahtian homepage UX clarity`.

The rules of engagement above are the hard constraints — there is no second,
softer list. If an edit would break rule 2 (philosophy) or rule 4 (unreviewed
copy), stop and route through `vahtian-brand-safety` instead.
