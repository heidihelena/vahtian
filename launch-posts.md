# Launch posts — CiteVahti (community / organic)

Ready-to-adapt copy for the decided channels: **GitHub**, the **Zotero community**, and
**biomedical research-methods** spaces. ~€0 paid. All copy follows [AD_CLAIMS.md](AD_CLAIMS.md):
checks citation *support*, not truth; no accuracy/medical overclaims; CTA = **try the
3-minute demo**. **Always disclose that you are the developer** — research communities value
that, and it's required (see DISCLOSURE.md).

---

## 1. GitHub release / "Show" post

> **CiteVahti — run unit tests on your manuscript's citations**
>
> CiteVahti is a free, open-source, **local-first citation-support audit tool for manuscript
> claims**. Before you submit, it helps you test whether the paper you cited actually supports
> the sentence you attached it to — claim by claim — and keeps an auditable trail of your
> decisions.
>
> - You rate each claim's support first; an optional AI second opinion stays **blinded** until
>   you do. **You** decide.
> - Catches overstated claims and **retracted** papers; writes verified references to Zotero
>   (undoable), and exports your manuscript to Word with live citations.
> - Local-first: your manuscript and ratings stay on your machine. No account, no telemetry.
>
> Try it in 3 minutes with `citevahti demo` (no Zotero/AI/setup), or the Claude Desktop
> one-click. It checks citation *support*, not truth — final responsibility stays with you.
>
> *Disclosure: I'm the developer (clinician, MD/PhD). Feedback very welcome.*
>
> Repo + demo: https://github.com/heidihelena/citevahti

---

## 2. Zotero forums

> **A local-first tool that audits whether your cited source supports each claim (Zotero +
> Better BibTeX)**
>
> I built CiteVahti to scratch a pre-submission itch: not "is this reference real?" but "does
> this paper actually support *this sentence*?" It reads candidates, you rate support
> (AI blinded until you do), and verified references are written back to Zotero as an
> **audited, undoable** step — using your **Better BibTeX** citekeys, so a `[@key]` in your
> Markdown matches your library and survives the export to Word.
>
> Local-first, free, open source. It checks citation *support*, not truth.
>
> *Disclosure: I'm the developer.* Would love feedback from heavy Zotero users on the
> write-back + citekey flow. https://github.com/heidihelena/citevahti

---

## 3. Biomedical research-methods (Mastodon / Bluesky / methods forums)

> Pre-submission citation audit, made systematic: **CiteVahti** turns each manuscript claim
> into a test — does the cited paper support it? — with a blinded human→AI→adjudication
> workflow and a hash-chained **audit trail** you can put in your methods. Flags overstated
> claims and retractions. Local-first, free, open source.
>
> Not an oracle: it records *your* judgment of citation support, not scientific truth; you stay
> responsible. *Disclosure: developed by me (clinician, MD/PhD).*
>
> 3-min demo + repo: https://github.com/heidihelena/citevahti

---

## 4. Short blurb (≤300 chars, for bios / replies / listservs)

> CiteVahti (free, open source, local-first): test whether each manuscript claim is actually
> supported by the source cited for it, before you submit. You rate; AI is a blinded second
> opinion. Checks citation support, not truth. github.com/heidihelena/citevahti

---

### Posting notes
- Lead with the **problem** (does the source support the claim?), not the tech.
- Never say "AI checks your citations" or imply it verifies truth/quality.
- Use a UTM tag on links if you want to see what converts (e.g. `?utm_source=zotero-forum`).
- Reply to questions; don't blast. One honest post per community, then engage.

---
---

# SynthVahti — 2026-07-04 · AWAITING FOUNDER APPROVAL

> **Status: drafts only. Nothing posted.** Brand-safety: PASS (this pass).
> Say "go" to release per channel, or edit first. All copy follows
> [AD_CLAIMS.md](AD_CLAIMS.md): reads as *agreement, not accuracy*; no
> accuracy/guarantee/medical overclaims; disclose the developer relationship.

## 1. GitHub release / "Show" post

> **SynthVahti — pool agreement across studies in your browser, keep HSROC in R**
>
> SynthVahti is a free, **local-first** tool for the synthesis step of a
> diagnostic-test-accuracy review. Point it at the `extraction.csv` from
> ExtractVahti and it pools overall percent agreement, sensitivity, and
> specificity across studies with random-effects meta-analysis, then draws the
> forest and funnel figures.
>
> - Random-effects pooling (DerSimonian–Laird, logit scale) with I² and τ²; the
>   forest x-axis zooms to your data so the confidence intervals are actually readable.
> - Export the figures as PNG, formatted for print.
> - The headline models stay where they belong: a generated, package-versioned
>   `synthesis.R` runs the **bivariate / HSROC** model and **Deeks'** publication-bias
>   test in real R, with `sessionInfo()`/`renv` so the analysis is reproducible.
> - Nothing uploads — your extraction never leaves the browser.
>
> It reads as **agreement against an imperfect reference, not accuracy** — a
> ≥2-pathologist consensus shares error with the comparator, and the tool says so
> on every figure. The browser half is the pooling and the figures; the R hand-off
> is the headline analysis.
>
> *Disclosure: I'm the developer (clinician, MD/PhD). Feedback very welcome,
> especially from anyone doing DTA meta-analysis.*
>
> Try it: https://vahtian.com/synthvahti/ · source: https://github.com/heidihelena/vahtian

## 2. Zotero / reference-manager community

> **A local-first tool that pools agreement from a DTA extraction and hands the HSROC model back to R**
>
> If you extract diagnostic-accuracy data (QUADAS-2 and a 2×2 per study), SynthVahti
> takes that `extraction.csv` and does the browser-friendly half of synthesis:
> random-effects pooling of overall percent agreement, sensitivity, and specificity,
> plus forest and funnel figures you can export as PNG. The bivariate / HSROC model
> and Deeks' publication-bias test are generated as a `synthesis.R` you run in R —
> package-versioned, so the numbers are reproducible.
>
> Local-first, free, nothing uploads. It reports **agreement against an imperfect
> reference, not accuracy** — and keeps that framing on every figure.
>
> *Disclosure: I'm the developer.* Would love feedback on the CSV contract and the
> generated R from anyone who does this for a living. https://vahtian.com/synthvahti/

## 3. Biomedical research-methods (Mastodon / Bluesky / methods forums)

> Synthesis step for a DTA review, split honestly: **SynthVahti** pools agreement
> (OPA / sensitivity / specificity) across studies in the browser with random-effects
> meta-analysis and draws print-ready forest + funnel figures — then generates a
> package-versioned `synthesis.R` for the headline bivariate/HSROC model and Deeks'
> test in real R. Local-first, free, nothing uploads.
>
> It reads as **agreement against an imperfect reference, not accuracy** — the
> reference standard shares error with the comparator, and the figures say so.
> *Disclosure: developed by me (clinician, MD/PhD).*
>
> https://vahtian.com/synthvahti/

## 4. Short blurb (≤300 chars)

> SynthVahti (free, local-first): pool agreement — OPA, sensitivity, specificity —
> across DTA studies in your browser, with forest & funnel figures; the HSROC model
> is a generated, versioned synthesis.R for real R. Agreement, not accuracy. Nothing
> uploads. https://vahtian.com/synthvahti/

### Posting notes (SynthVahti)
- Lead with the **problem** (pooling agreement + keeping HSROC honest in R), not the stats stack.
- Never call the pooled sens/spec "accuracy" — always "agreement against an imperfect reference".
- Never imply the figures certify a result or make it publication-*ready*; they are formatted for print, nothing more.
- UTM tags optional (`?utm_source=zotero-forum`); links stay cookieless.
- One honest post per community, then engage — don't blast.
