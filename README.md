# vahtian

Company site for **Vahtian** — research citation integrity.

**Vahtian verifies whether each manuscript claim is supported by the evidence
cited for it** — through a blinded human → AI → adjudication workflow with a
decision-gated, undoable write and a hash-chained audit trail.

> **Vahtian does not decide scientific truth.** It records whether a cited source
> supports a specific claim: who rated it, what the AI advised, how disagreements
> were adjudicated, and what was finally written.

Human-first. AI-second. Auditable. Free local tools for researchers;
infrastructure for journals, guideline groups, and research organizations.

## The product ladder

**Start** — verify the claims in your own manuscript
- **CiteVahti** — verify that each claim is supported by the source cited for it
  *(free beta)*: https://github.com/heidihelena/citevahti

**Prepare** — get the study and its evidence right before analysis
- **StudyVahti** — plan a defensible study before data collection *(free · live)*: /studyvahti
- **MethodVahti** — justify your sample size → COREQ/SRQR methods PDF
  *(free beta for individuals, project licence for institutions)*: /methodvahti
- **DictVahti** — clean the REDCap data dictionary before analysis *(free · live)*: /dictvahti
- **MatchVahti-Lite** — capture citation-worthy evidence from abstracts *(free · live)*: /matchvahti-lite

**Scale** — claim-checking as governed infrastructure *(roadmap)*
- **ReviewVahti** — editorial claim-checking workflow for journals
- **GuidelineVahti** — governed claim–evidence decisions for panels
- **AtlasVahti** — de-identified validation-pattern analytics

Static pages (one `index.html` per product, plus `404.html` and `sitemap.xml`),
deployed via Cloudflare to vahtian.com. No trackers, no external dependencies.

`vahti` (Finnish) = *sentinel / guard* — the watch over what gets cited.

## Brand & social tooling

- `brand/STYLE.md` — the canonical brand spec; `brand/PHILOSOPHY.md` — the mark system.
- `brand/cards/` — 1200×630 Open Graph cards, one per page. Regenerate with
  `npm i @resvg/resvg-js && node brand/cards/generate.mjs`.
- `brand/carousel/` — self-contained LinkedIn carousel builder (`noindex`, zero
  external requests). Preset decks per product, theme & format switching, post-caption
  drafts, deck save/load as JSON, export as PDF (LinkedIn document post) or
  per-slide PNGs.

## MethodVahti package

`methodvahti/` is a self-contained Python package (Apache-2.0) for qualitative
heterogeneity scoring + a COREQ/SRQR methods-report PDF. See
[`methodvahti/README.md`](methodvahti/README.md). Tests: `cd methodvahti &&
python -m pytest tests/ -v`.
