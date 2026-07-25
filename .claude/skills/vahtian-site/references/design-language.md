# Vahtian design language — tokens, components, and the taste bar

Extracted from the shipped pages (`index.html`, `citevahti/`, `studyvahti/`).
This is the raise-the-bar reference: "match the surrounding code" preserves
quality; this file defines it. When a page and this file disagree, fix the page
— or, if the page is deliberately better, update this file in the same PR.

## Tokens

**Palette.** The live source is `body.vh-content` in `brand/site-refresh.css`,
which aliases the `--vh-*` primitives defined in the same file. Read it there,
not from a page: a `:root` declaration in a page or an archetype stylesheet is
**shadowed** by the body-scoped one and paints nothing. That is not a footgun in
theory — this table used to record `--link:#6F52B8` copied from the homepage's
inert `:root`, while 87 of 100 pages rendered `#5f479d`.

| Token | Value | Role |
|---|---|---|
| `--navy` | `#2D2440` | Brand ground: mark backgrounds, primary buttons, dark blocks |
| `--violet` | `#8B6FC9` | Brand accent: CiteVahti/MatchVahti marks, live tags |
| `--lilac` | `#C5B8E8` | Light accent on dark surfaces; subtle underlines on light |
| `--amber` | `#C98A00` | GuidelineVahti accent |
| `--teal` | `#1E9E8A` | ReviewVahti accent; "free" tags |
| `--rose` | `#C24D7E` | FullVahti/AtlasVahti accent |
| *indigo* | `#5566B5` | StudyVahti/MethodVahti/DictVahti/ExtractVahti accent; "beta" tags |
| `--ink` / `--muted` | `#1c1830` / `#5b5570` | Text / secondary text |
| `--bg` / `--card` / `--line` | `#faf9fc` / `#fff` / `#e7e3f0` | Page / surface / hairline |
| `--link` | `#5f479d` | Body-text links — deep violet. 6.96:1 on `--bg`, 7.31:1 on `--card`. Don't lighten it. |

**The product accents are live — do not collapse them to violet.** `--teal`,
`--amber`, `--rose` and indigo carry the per-product identity (CiteVahti alone
uses three), and they are consumed across the site: `--amber` 20 times, `--teal`
19, `--rose` 15, indigo 28, plus the literals on 8–23 pages each. A sweep that
aliases them to one purple erases the mark system in §Components, where each
product glyph gets its own accent. `brand/methodvahti-refresh.css` does alias
`--teal`/`--amber`/`--indigo`/`--rose` to a single purple, but that is scoped to
MethodVahti's four pages and is deliberate; it is not the site direction.

**Type.** System stack, `16px/1.6` body. `h1` `clamp(30px,6vw,48px)`,
`line-height:1.08`, `letter-spacing:-.02em`. Ledes `clamp(17px,2.6vw,20px)`,
`max-width:62ch`. `h2` 20px. Kickers and all machine/state text (tags, tier
labels, code) are `ui-monospace` 11–13px, uppercase kickers with `.08em`
tracking. **Monospace means "machine or state" — never decoration.**

**Rhythm.** Sections `padding:34px 0` + hairline top border. Cards
`border-radius:12px` (11px for small boxes, 9px buttons), padding 14–16px,
grid gaps 12–14px. Content column `max-width:780px`.

## Components (mirror these, don't reinvent)

- **Buttons** — the one component with a canonical implementation, in
  `brand/footer.css`. **Never hand-roll `.btn` in a page's `<style>`**: 54 pages
  did, in 21 distinct forms, which is what the shared rule replaced.
  - Anatomy: `<a class="btn primary">Label <i class="arr">→</i></a>`
  - Sizes: `.sm` (dense UI) · default · `.lg` (page CTA). Radius `9px` at every
    size — that was unanimous across all 21 hand-rolled forms; don't vary it.
  - Tones: `.primary` solid navy/white; `.ghost` transparent with a **violet**
    hairline. Not `--line` grey: a UI component boundary needs 3:1 (WCAG 1.4.11)
    and `--line` gives 1.20:1 against the page, violet 3.84:1.
  - On a dark band (`.hero-band`, `.band-navy`, `.buyband`) both invert: primary
    becomes lilac on navy text, ghost keeps a lilac outline.
  - States are part of the component: hover, `:active`, `:disabled`. The audit
    that produced this found 7 hover rules and zero `:active`/`:disabled` across
    56 buttons — a control that doesn't answer the pointer reads as broken.
  - **No margin.** Spacing belongs to the container; three different
    `margin-top`s baked into `.btn` is how the 21 forms began to diverge.
  - The label is Nudica; only the trailing arrow is Marksy, matching the
    hand-drawn arrows already used by `.voc-related a::after` and `.row::after`.
    Marksy does a job here — pointing — rather than decorating one.
  - **One primary per surface** — a secondary action is always a ghost, never a
    second primary.
- **Status tags**: monospace chips, lowercase (`free · live`, `early access`);
  color pairs are fixed (`live`=violet, `free`=teal, `beta`=indigo, `soon`=muted).
- **Product cards** (`.p`): mark + name + inline tag + one-sentence description;
  left accent spine in **the accent of the product's own mark**; whole card is
  the link (stretched from the name) with a static `→` affordance and underlined
  name. Lone/odd-trailing cards span full width for deliberate emphasis.
- **Marks**: every product glyph = the `[ ]` bracket frame + a distinct inner
  shape on navy, one accent color per product. New product → new mark in this
  system, never a stock icon.
- **Dark surfaces**: exactly two — the lighthouse hero band and the trust
  contract block. Don't add a third; scarcity is what makes them land.
- **Lighthouse motif**: the animated canvas hero belongs to the brand home
  (and product heroes as a static beam). It respects
  `prefers-reduced-motion` — keep that contract.

## The taste bar — do / don't

- **Do** differentiate repeating lists by something the items already own
  (their mark's accent). **Don't** paint variety on with arbitrary colors.
- **Do** make links legible without hover: underline, arrow, or button shape.
  **Don't** style a link as plain bold ink and rely on hover — mobile has no hover.
- **Do** make the whole card/row the tap target when it has one destination.
  **Don't** leave a 15px text link as the only way in.
- **Do** keep hierarchy by weight and space (one big thing per screen).
  **Don't** create hierarchy by adding a second accent color to the same surface.
- **Do** keep transitions ≤200ms, hover-only, and disabled under
  `prefers-reduced-motion`. **Don't** animate on load or scroll.
- **Do** end every visual change by looking at both `run-vahtian` shots.
  **Don't** ship taste from HTML source.
