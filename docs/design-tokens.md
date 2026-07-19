# Vahtian design tokens

The single source of truth for colour and type tokens. Read this before adding
a `:root{}` block to a page or changing a colour value.

## The architecture (two layers, one home)

Tokens live in **`brand/site-refresh.css`**, loaded on every page:

1. **Primitives** — the raw brand values, in `:root`:
   ```css
   :root{
     --vh-navy:#2D2440; --vh-violet:#8B6FC9; --vh-lilac:#C5B8E8;
     --vh-ink:#1c1830;  --vh-muted:#5b5570;  --vh-bg:#faf9fc;
     --vh-paper:#f2effa; --vh-line:#e7e3f0;
   }
   ```
2. **Semantic tokens** — what components actually reference, mapped from the
   primitives, on `body.vh-content`:
   ```css
   body.vh-content{
     --ink; --navy; --violet; --lilac; --link; --muted; --bg; --card; --line;
     --lav; --font-mono; …
   }
   ```

## The rule that matters

**`body.vh-content{}` wins over a page's inline `:root{}`.** A selector on the
body element (specificity 0,2,0) beats the inherited `:root` value (0,1,0). So
for any page with `class="vh-content"` on `<body>`, the semantic token values
above are already authoritative — a page's own `:root{--link:…}` is dead code,
silently overridden.

Consequences:

- **Change a core colour in one place:** edit `body.vh-content` in
  `site-refresh.css`; it takes effect on every `.vh-content` page.
- **Do not add a drifted value to `body.vh-content`.** Because it overrides
  per-page `:root`, adding e.g. `--paper2` there would silently repaint any page
  that set its own `--paper2`. Only invariant tokens (one value everywhere, like
  `--lilac`, `--font-mono`) belong here until the per-page blocks are removed.
- **New pages:** rely on the shared tokens. Do not paste a `:root{}` block of
  core tokens — it will be overridden anyway. Define only genuinely page-local
  tokens (a status-fill set, a one-off accent) in the page.

## Status / callout tokens (not yet centralized)

The semantic **status** tokens — `--amber`/`--teal`/`--rose` and their
`-fill`/`-text` variants, used by rating chips and verdicts — are still declared
per page. They encode meaning (supports / caution / contrasts) and are the
intended exception to the lilac palette. Centralizing them into a shared
`status` layer is a good follow-up, but they must keep their three-way
distinction.

## Known cleanup (a reviewed follow-up, not a blind sweep)

Most pages still carry an inline `:root{}` of core tokens that `body.vh-content`
already overrides — dead but harmless. Removing them is safe **only** where the
page uses no token that `body.vh-content` doesn't provide, and must be
**spot-checked visually** page by page: CI (drift audit, pa11y, Lighthouse) does
**not** catch a colour regression. Do it in small, rendered batches, not one
global find-and-replace.
