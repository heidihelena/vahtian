# Ad & marketing claim guardrails — CiteVahti

*Draft approved by founder. Keep ad copy truthful and platform-safe. CiteVahti is built
by a clinician, MD, PhD; overclaiming is both a trust risk and a compliance risk.*

## The one true line

> **Run unit tests on your manuscript's citations** — does each claim actually match the
> paper cited for it?

Everything else should ladder up to that. CiteVahti checks **citation support**, not truth.

## Audience, channels & budget (decided)

- **Primary audience:** biomedical manuscript **authors** and **supervisors** doing a
  **pre-submission citation audit**.
- **Positioning:** *CiteVahti is a local-first citation-support audit tool for manuscript
  claims — it helps authors test whether the cited evidence supports each claim before
  submission.*
- **Channels (organic, ~€0 paid):** GitHub (source of truth), the **Zotero community**, and
  **biomedical research-methods** channels. No paid Meta/IG ads for now — the "Platform
  notes" below apply only if that changes.
- **CTA:** *"Try the 3-minute demo"* / `citevahti demo` → then the GitHub repo.

## Conflict of interest & disclosure

CiteVahti is developed by the author (clinician, MD/PhD). It **does not certify** scientific
truth, manuscript quality, publication suitability, or the absence of citation problems —
final responsibility stays with the human author, reviewer, editor, or institution. Any
post, talk, teaching, or write-up should **disclose the tool use and the developer
relationship where relevant**. Canonical statement + ready-to-adapt methods text:
<https://github.com/heidihelena/citevahti/blob/main/docs/DISCLOSURE.md>.

## ✅ Say this (truthful, on-brand)

- "Check whether each claim is supported by the source cited for it."
- "Catch citations that don't support the sentence — and overstated claims."
- "Flag retracted papers before a reviewer does."
- "**You** decide. The AI is a blinded second opinion you can ignore."
- "Local-first — your manuscript and ratings stay on your device."
- "Export to Word with live citations."
- "Free beta." · "No account. No telemetry."
- "An auditable trail you can show a supervisor or journal."

## ❌ Don't say this (overclaim / risky)

- ❌ "AI checks your citations" / "AI-powered citation checker." (Implies the AI decides —
  false — and reads as a weaker copy of bigger tools. Our edge is *human-first + audit*.)
- ❌ Anything implying it verifies **truth** or **clinical validity**: "verify your science,"
  "make sure your claims are correct," "fact-check your paper." It checks *support*, not *truth*.
- ❌ **Accuracy / percentage claims** without a published benchmark: "99% accurate,"
  "catches every bad citation," "reviewer-proof." We have no validation study yet.
- ❌ **Medical/health outcome** framing of any kind (Meta restricts this; the product makes
  no such claims).
- ❌ "Anonymous" for contributed data — always "**de-identified**" (and contribution is
  opt-in, default-off).
- ❌ Guarantees: "never miss a bad citation," "100% safe."

## Platform notes (Meta / Instagram)

- Health-adjacent + sensational claims get flagged or rejected, stay modest and specific.
- Prefer **UTM-tagged links** for attribution so the site stays cookieless (no tracking
  pixel) — consistent with the [privacy page](/privacy/). If a conversion pixel is ever
  added, it needs a consent banner and a privacy-notice update.
- Every ad set's landing page must reach a **Privacy** link (footer) — done.

## Always within reach

- The honest caveat, where space allows: *"checks citation support, not truth."*
- Link to [known limitations](https://github.com/heidihelena/citevahti/blob/main/docs/KNOWN_LIMITATIONS.md).
- CTA for an early/1-star tool: **"Try the 3-minute demo"** converts better than "Install."

## Terminology & style (source of truth)

Canonical conventions for all Vahtian copy. When a page conflicts with this list, fix the page.

### Word hierarchy — say the precise property, not the brand word

Reserve strong positioning words for exactly what they mean:

| Use | For |
|---|---|
| **traceable** | provenance — you can see where something came from |
| **reproducible** | a computation that repeats under the same inputs/environment |
| **reviewable / inspectable** | a decision or record a person can open and check |
| **documented** | a rationale that has been written down |
| **defensible** | *only* the resulting **human argument** — never a tool, form, study, or output as a property |

- Don't call a tool, study, form, or output "defensible." A tool helps you *build and document* a rationale; the researcher's argument is what may be defensible. (So: "document your sampling decision," not "defensible study"/"defend your sample" as a tool promise.)
- Replace **"honest"** as a quality claim with the measurable property: "a **complete** report of what's missing," "**leakage-aware** evaluation," "**explicit** missing-item report," "**declared** assumptions," "**scenario-specific** evaluation," "no **silent** imputation," "no paywall **bypass**." Keep "honest/honestly" only as ordinary candid voice in essays, not as a product claim.

### Never / always

- **Never "anonymous"** as a data or privacy claim (re-identification is rarely provable). Use **"de-identified,"** "aggregates only," or, for Delphi, "blinded voting." Contribution of any data is opt-in, default-off.
- The invariant words stay: *support* (not truth), *records/keeps* (not certifies), *human decides / AI second*.

### Canonical names & punctuation

- Product names: **CiteVahti, StudyVahti, MethodVahti, DictVahti, MatchVahti-Lite** (hyphen), **ReviewVahti, FullVahti, ExtractVahti, SynthVahti, GuidelineVahti, AtlasVahti**; packages **EpiNet, RecoverLite, AuditLite**. Kits: **QualiVahti Local, Research Domain Cube, Manuscript Kit, Reviewer Response Builder, Reviewer's Notebook, AI Disclosure Kit, MethodVahti Sample Defence Pack**.
- **"open-source"** as an adjective (open-source tools); **"open source"** as a noun (released as open source).
- Author credential: **"MD, PhD"** (comma), everywhere — bylines, meta, and JSON-LD `honorificSuffix`.
- **"risk-of-bias"** hyphenated as a modifier (risk-of-bias assessment).
- **"full text"** noun / **"full-text"** adjective (full-text PDF).
- Category line: **"auditable research workflow infrastructure"** (org-level); CiteVahti remains the citation-integrity flagship.
- **Local-first labels** (see `/privacy/#local-first`): *Fully offline* · *Local processing, external metadata lookup* · *Browser-local, no upload*.

### Punctuation

- **No em dashes** in new or edited copy — use a colon, comma, or parentheses. (A mechanical sitewide sweep of legacy em dashes is a pending cleanup; do not add new ones.)
