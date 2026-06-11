# Vahtian brand style — the canonical spec

For every Vahtian page, mark, and figure (and for the comic agent). The rule above
all rules: **a Vahtian page never reaches out.** Researchers may be offline, behind
an institutional firewall, or wary of third-party tracking — a citation-integrity
brand that phones home contradicts itself.

## Self-contained, always
- **No external requests.** No CDNs, no Google Fonts, no analytics/`gtag`, no
  third-party scripts, no remote images. Verify with: `grep -nE
  "googleapis|fonts\.|cdn|@import|<script src|analytics|gtag" index.html` → empty.
- **Fonts: local only.** Use the **system stack** (below) — zero bytes, zero
  requests, works offline. If a distinctive brand font is ever wanted, **self-host
  a bundled `.woff2`** (same-origin) — never a font CDN.
- **Assets: inline or same-origin.** Marks are **inline SVG** (or `/brand/marks/*.svg`).
  `og:image` points at a same-origin file. No remote asset URLs.
- Prefer **single-file pages** (inline CSS) for the marketing/landing surfaces.

### Font stacks
```css
/* UI / body */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ui-sans-serif, system-ui, sans-serif;
/* code / monospace */
font-family: ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace;
```

## Color
```
Navy   #2D2440   tiles, dark UI, mark grounds
Violet #8B6FC9   brand line, links
Lilac  #C5B8E8   inner glyph / accents
Ink    #1C1830   body text      Muted #5B5570   secondary
BG     #FAF9FC   page           Card  #FFFFFF    Line #E7E3F0
```

**State hues — reserved for the `[oo/o/r/d]` codes only. A rule: never green,
never alarm-red** (support/readiness is a *measurement, not a verdict*):

| Code | Hue | Stroke | Chip fill | Chip text |
|---|---|---|---|---|
| `[oo]` verified / ready | **Amber** | `#C98A00` | `#FFF2D8` | `#5A4300` |
| `[o]` needs support | **Teal** | `#1E9E8A` | `#D8F4ED` | `#08544A` |
| `[r]` review needed | **Violet** | `#8B6FC9` | `#ECE3FF` | `#432C7A` |
| `[d]` decided / not ready | **Rose** | `#C24D7E` | `#FBE0EA` | `#7A1F45` |

- **Color is never the only cue** — always show the bracketed code too (accessibility).
- **Characters keep natural colors** (no dressing mascots in the four state hues).

### Product mark accents (the `-vahti` family)
Each product mark = the shared **bracket "gate"** + one glyph, navy tile, lilac glyph:

| Mark | Glyph | Accent |
|---|---|---|
| Vahtian (company) | shield | Violet `#8B6FC9` |
| CiteVahti | two dots `[oo]` | Violet `#8B6FC9` |
| StudyVahti | flask | Indigo `#5566B5` |
| DictVahti | document lines | Indigo `#5566B5` |
| ReviewVahti | eye | Teal `#1E9E8A` |
| GuidelineVahti | check | Amber `#C98A00` |
| AtlasVahti | constellation | Rose `#C24D7E` |

Marks live in [`brand/marks/`](marks/); the specimen is [`brand/vahti-family.png`](vahti-family.png).
Pronunciation hint for new audiences: CiteVahti = “site-VAH-tee”.
