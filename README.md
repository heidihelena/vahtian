# vahtian

Company site for **Vahtian** — citation-integrity infrastructure.

`vahti` (Finnish) = sentinel / guard. Vahtian builds the sentinel layer for
research citations: a blinded human → AI → adjudication workflow with a
decision-gated, undoable write and a hash-chained audit trail.

- **CiteVahti** — for researchers & labs (live): https://github.com/heidihelena/citevahti
- **StudyVahti** — free study-planning & readiness tool: /studyvahti
- **DictVahti** — free REDCap dictionary linter: /dictvahti
- **MethodVahti** — qualitative sample-size justification → COREQ/SRQR methods PDF
  (free beta for individuals, project licence for institutions): /methodvahti
- ReviewVahti · GuidelineVahti · AtlasVahti — roadmap.

Static pages (one `index.html` per product, plus `404.html` and `sitemap.xml`),
deployed via Cloudflare Pages to vahtian.com.
No trackers, no external dependencies.

## Brand & social tooling

- `brand/STYLE.md` — the canonical brand spec; `brand/PHILOSOPHY.md` — the mark system.
- `brand/cards/` — 1200×630 Open Graph cards, one per page. Regenerate with
  `npm i @resvg/resvg-js && node brand/cards/generate.mjs`.
- `brand/carousel/` — self-contained LinkedIn carousel builder (`noindex`, zero
  external requests). Preset decks per product, theme & format switching, post-caption
  drafts, deck save/load as JSON, export as PDF (LinkedIn document post) or
  per-slide PNGs.
