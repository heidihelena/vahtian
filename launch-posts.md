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

---
---

# Reference check — 2026-07-28 · AWAITING FOUNDER APPROVAL

> **Status: draft only. Nothing posted.** Brand-safety: PASS (this pass).
> Say "go" to post, or edit first. Announces what is live now (author list,
> journal, coverage of DOI-less entries). The Markdown export is still in an
> open PR and is deliberately not mentioned.

## 1. LinkedIn (primary, as requested)

> Reference lists get repaired by a language model now, and the damage has a shape:
> the first author survives, and a name in the middle quietly becomes someone else.
> The first author is the one everybody eyeballs.
>
> The first version of this check compared the first author only, and never looked
> at the journal at all. Both are fixed.
>
> Paste a reference list into the free reference check on vahtian.com. Every DOI is
> resolved against Crossref, then compared with what you actually wrote:
>
> - the title
> - the full author list, not the first name alone
> - the journal, abbreviated or in full, so "N Engl J Med" matches "The New England Journal of Medicine"
> - the year
>
> It also reads the surnames out of your citation and tests each one against the
> record's whole author list, so a name the paper does not carry anywhere is flagged
> wherever it sits.
>
> It now says what it could not check, too. A reference without a DOI cannot be
> resolved, so it is listed back to you, unchecked, and counted on its own. A total
> that silently counts only the DOI-bearing entries claims coverage the run never had.
>
> What it will not tell you: whether the cited paper supports the sentence citing it.
> That needs the full text and a human reading it. This checks that a reference points
> at the paper it claims to point at, and shows you which field disagrees when one does.
>
> Free, in your browser, nothing uploaded, no account. DOI lookups go to Crossref, and
> to Unpaywall for open-access status.
>
> Disclosure: I built it. Clinician (MD, PhD), so not a neutral party.
>
> https://vahtian.com/reference-check/

## 2. Short blurb (<=300 chars, for replies and bios)

> Free reference check, in your browser: paste a list, every DOI is resolved against
> Crossref and the title, authors, journal and year compared with what you wrote. A
> name the paper does not carry is flagged. No-DOI entries are listed unchecked.
> https://vahtian.com/reference-check/

### Posting notes (reference check)
- Lead with the **problem** (repaired lists lose names in the middle), not the field list.
- Keep the caveat in running copy: it checks that a reference resolves and matches its record, **not** that the source supports the claim.
- Never say it finds every bad reference, and never call a list clean: a reference with no DOI is listed, not checked, and Crossref's retraction metadata is incomplete.
- Disclosure line is mandatory (developer, clinician MD, PhD).
- Do not mention the Markdown export until #305 is merged and live.
- One honest post, then engage in the comments.

---

# Zotero Citation Checker — 2026-07-30

Shipped: vahtian.com/zotero-citation-checker/ (free, no account, no size cap,
browser-local) + FullVahti 0.1.20 (Tools-menu link). Facts drafts may claim:
finds citations missing from the bibliography, duplicate publications cited
under different Zotero items, uncited reference-list entries, broken citation
fields, flattened citations (Track Changes / Google Docs export), numbering
gaps; paragraph/footnote/table locations; Markdown + CSV report; optional CSL
JSON library export adds the orphan check. Caveat that rides along: it reports
what the checks observed in the document's field data; a clean report is not a
certificate. Disclosure in every post: built by the developer, a clinician
(MD, PhD).

## 1. Zotero forum

**Title:** Free browser tool: check a manuscript's Zotero citations before
submission (missing, duplicate, broken fields)

Hi all. I'm a thoracic oncology clinician (MD, PhD) and I build open research
tools. This one came out of problems I kept seeing in long manuscripts and
theses, and in this forum's archives.

Zotero Citation Checker reads a .docx in your browser and reports, with
paragraph-level locations:

- citations in the text with no matching entry in the reference list
- the same paper cited through two different Zotero items (each gets its own
  number, and the library duplicate detector cannot see this from inside the
  document)
- reference-list entries that nothing cites
- citation fields whose stored data no longer parses, so Refresh cannot
  recover them
- citation-shaped plain text: fields flattened by Track Changes or a Google
  Docs round trip
- numbering gaps in numeric styles

The file is processed locally in the browser and is not uploaded; no account,
no size limit. If you also drop an exported copy of your library (CSL JSON),
it flags citations whose item no longer exists in your library. The report
downloads as Markdown or CSV.

Honest scope: it reads the document's Zotero field data and reports what it
finds. It changes nothing in your document (every finding comes with the
Zotero/Word repair step instead), and a clean report is not a certificate; it
covers what these checks can reach.

https://vahtian.com/zotero-citation-checker/
The FullVahti plugin (0.1.20) links to it from the Tools menu.

Feedback very welcome, especially documents where the extraction gets
something wrong.

## 2. Medium (article, teach-first)

**Title:** Your bibliography can be broken while Zotero says everything is fine

Zotero's duplicate detector, and every check it runs, looks at your library.
Your examiner reads your document. Between the two sits a gap where the
classic thesis disasters live.

Four failures that happen inside the document, invisible from the library:

**1. The same paper, two numbers.** Import a paper once from PubMed and once
from a PDF and you have two Zotero items for one publication. Cite both and
your bibliography lists it twice, under two numbers. Your library looks clean;
the duplicate detector compares library items, not the citations in your
manuscript. Fix: select both items in Zotero, right-click, Merge Items, then
refresh the document.

**2. Cited in the text, missing from the reference list.** Usually a refresh
that never happened, or a citation pasted in from another document as plain
text. Fix: refresh from the Zotero tab in Word; if the entry stays missing,
re-insert that citation from Zotero.

**3. The flattened citation.** Accepting tracked changes, a Google Docs round
trip, or copying between documents can leave citation text without its live
field. It looks identical on the page and never updates again. Fix: there is
no repair; re-insert from Zotero.

**4. The ghost entry.** A reference-list entry that nothing cites anymore,
left over from a deleted paragraph. Numeric styles then carry gaps too. Fix:
refresh, then read the list against the text.

Finding these by hand in a 250-page thesis means checking every citation
against every entry, twice. That is the part worth automating, and the
checking is mechanical: a Word document stores each Zotero citation as a field
with the reference data inside it, so the failures above are detectable by
rule, no AI reading your text.

I built a free checker that does exactly this in your browser:
https://vahtian.com/zotero-citation-checker/ Drop the .docx, get every finding
with its paragraph and the repair step. The file never leaves your machine.
It reports what it observed in the document's field data; a clean report is
not a certificate, and whether each source supports the claim it is attached
to is a different question (that one I work on at vahtian.com). I'm a
clinician (MD, PhD) and I build these tools myself; corrections welcome.

## 3. LinkedIn (first-person, incident → point → open door)

The library was clean. The manuscript was not.

[HEIDI: one true specific here — the document or review where you last hit
this: a duplicate reference pair, a citation that vanished from a
bibliography, or a Track Changes casualty. One or two sentences, yours.]

Zotero checks your library. Nothing in the standard workflow checks the
document: whether every citation still has its entry, whether one paper is
cited under two numbers because it exists as two items, whether a field
survived Track Changes as a field or as dead text.

So I built the missing check. Drop a .docx, it reads the Zotero fields in your
browser (nothing uploads) and lists every finding with its paragraph and the
repair step. Free, no account. It reports what it can observe in the field
data; a clean report is not a certificate.

If you are submitting a thesis or a manuscript this autumn, run it first:
https://vahtian.com/zotero-citation-checker/

Built by me, a clinician (MD, PhD), as part of the Vahtian tool family.

## 4. Bluesky (≤300 chars)

Zotero's duplicate detector checks your library, not your manuscript. It
cannot see one paper cited under two numbers, or a citation Track Changes
turned into dead text. I built a free in-browser check for that. File never
uploads. https://vahtian.com/zotero-citation-checker/

## 5. Threads (≤500 chars)

A citation that survived Track Changes can come out dead: still looks like a
citation, never updates again. Multiply by 200 references and a thesis
deadline.

I built a free checker: drop your .docx, it reads the Zotero fields in your
browser and lists what is missing, duplicated, or dead, with the paragraph and
the fix. Nothing uploads. It reports what it can see in the field data, no
more. Built it myself (clinician, MD/PhD).

https://vahtian.com/zotero-citation-checker/

## 6. Facebook (organic; PhD / academic writing groups where self-promo is allowed)

Before you submit the thesis, one check that is not in Zotero: the document
itself.

Zotero keeps the library tidy, but the manuscript can still hold citations
with no reference-list entry, the same paper under two numbers (two Zotero
items, one publication), and citations that Track Changes flattened into plain
text that will never update.

I made a free browser tool that reads your .docx locally (it is not uploaded
anywhere) and lists every one of these with its paragraph and the repair step
in Zotero or Word. No account. It reports what the checks observed; a clean
report is not a certificate.

https://vahtian.com/zotero-citation-checker/

I am the developer (clinician, MD/PhD), sharing because these failures cost
real resubmissions. Mods, delete if not allowed.

## 7. Instagram (caption; needs a visual — brief the cover via visual-taste)

[VISUAL: calm instrument-style card, summary line motif:
"47 citations checked · 3 flags · 2 notes", per visual-taste tokens.]

Your bibliography can be broken while your Zotero library is clean.

Same paper under two citation numbers. A reference the text no longer cites.
A citation Track Changes quietly turned into plain text.

I built a free checker: drop your Word file, it reads the Zotero citation
fields in your browser and lists every problem with its paragraph and the fix.
Nothing gets uploaded. It reports what it can see in the field data, no more.

Link in bio (or type: vahtian.com/zotero-citation-checker)

Built by a clinician who also writes the code. #zotero #phdlife #academicwriting
#thesis #researchtools

