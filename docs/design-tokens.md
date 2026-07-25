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
**spot-checked visually** page by page. Do it in small, rendered batches, not
one global find-and-replace.

Since every page is scanned by pa11y, CI *does* now catch a colour change that
drops text below WCAG AA contrast. It still does not catch a colour that is
wrong but legible, which is most of what a bad sweep would produce, so the
visual spot-check stands.

## The epistemic-notes state markers (open decision, founder's call)

`/learn/epistemic-notes/` is the one page exempted from the pa11y scan. Its four
state markers set an Okabe-Ito colour as the text colour of a glyph:

    <span style="color:#8B6FC9">&#9670;</span> Open
    <span style="color:#E69F00">&#9650;</span> Working
    <span style="color:#009E73">&#9679;</span> Evidence
    <span style="color:#CC79A7">&#9632;</span> Ruled out

Against the page background (`#f2effa`) they measure 3.55, 1.98, 3.01 and 2.70
to one, where small text needs 4.5. So the page fails WCAG AA on eight elements.

**Why this is not the colour-blindness problem it looks like.** Each glyph is a
distinct shape and is immediately followed by its own word. A reader who cannot
separate the hues still gets the state from the shape and the label, so the
Okabe-Ito guarantee is not carrying any load here. Our own article is titled
*colour-blind-safe **figure** palettes*: Okabe-Ito was chosen for fills in a
chart, where colour is the only channel available. As the colour of small text
it is simply too light, which is a different question with a different answer.

**If you want the page to pass**, these hold the hue to within a third of a
degree and clear 4.5:1:

| marker | now | ratio | proposed | ratio |
|---|---|---|---|---|
| Open | `#8B6FC9` | 3.55 | `#7B5BC1` | 4.50 |
| Working | `#E69F00` | 1.98 | `#916400` | 4.59 |
| Evidence | `#009E73` | 3.01 | `#007D5B` | 4.53 |
| Ruled out | `#CC79A7` | 2.70 | `#B34482` | 4.55 |

Amber moves furthest, because `#E69F00` at 1.98:1 is the least legible of the
four as text. If that darkening reads as muddy next to the figure palette the
article teaches, the alternative is to drop colour from the glyphs and let shape
and label do the work they are already doing.

This is a palette decision, so it is recorded rather than applied. Whichever way
it goes, remove the `a11y_exempt` entry in `.github/scripts/audit.sh` so the
page rejoins the scan.
