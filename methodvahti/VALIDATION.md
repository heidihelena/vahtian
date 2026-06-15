# MethodVahti — Open Validation Plan

Status: **in progress.** The primary hierarchical heterogeneity score is an
author hypothesis (○ in the evidence grading) — Vahtian's construction, not
externally validated. This document records the candidate open-access data and
the validation design we are pursuing. It is deliberately public: the page at
[vahtian.com/methodvahti](https://vahtian.com/methodvahti/) points here so the
"open validation, in progress" claim is backed by something concrete.

> **Honesty note.** Until this validation lands, the heterogeneity score is
> **decision support, not ground truth.** Two structural facts shape the whole
> plan:
> 1. **No open dataset was built to test a qualitative heterogeneity score.**
>    The criterion has to be *assembled* from extracted-characteristics tables
>    and saturation datasets.
> 2. **No validated quantitative heterogeneity index exists for qualitative
>    synthesis** (unlike I²/τ² in quantitative meta-analysis). Qualitative
>    synthesis treats heterogeneity narratively by design. There is therefore no
>    gold-standard numeric criterion to benchmark against — GRADE-CERQual's
>    graded judgments are the nearest proxy. This absence is itself part of the
>    rationale for the tool, *and* the reason validation is hard.

## Method note on this research

A deep-research pass (2026-06-15) ran fan-out web search plus the PubMed/PMC
interface. `WebSearch` and PubMed returned reliable content; direct page
fetches (`WebFetch`) were HTTP-403-blocked on most publisher/repository domains
(ScienceDirect, Zenodo, OSF, PLOS, QDR). Consequence: **DOIs below are
verified**, but a few **licenses and field-level contents must be confirmed by
manually opening the record** before they are relied upon. Items so flagged are
marked _inspect before use_.

---

## 1. Directly usable datasets

### A. Giltenane et al. (2025) — Cochrane QES/MMR reporting-quality dataset ⭐ dimensional analogue
- **DOI:** https://doi.org/10.1002/cesm.70023 · *Cochrane Evidence Synthesis and
  Methods* · PMID 40656452 · PMC12245134 · open access (Wiley/Cochrane CC —
  confirm exact variant).
- **What:** All 31 qualitative evidence syntheses + mixed-methods reviews in the
  Cochrane Library (20 QES, 11 MMR, 2013–2023). **Table 3** gives per review:
  review type, settings + population, QES method (thematic synthesis / framework
  / meta-ethnography / realist / narrative), included study types, **number of
  primary studies included**, and study focus. Plus per-indicator
  reporting-quality outcomes on a green/amber/red scale across ~30 domains
  (theory, equity, reflexivity, CERQual use, saturation/purposive sampling,
  language inclusion, …).
- **Maps to MethodVahti dimensions** almost 1:1: study_design = QES method;
  population; setting; language = non-English-inclusion indicator;
  analysis_method; theoretical_framework = theory-development indicator;
  trustworthiness = CERQual + quality-appraisal indicators.
- **Validation use:** compute a heterogeneity score per review from Table 3; test
  whether it correlates with (i) number of included studies and (ii) the human
  reporting-quality judgments.
- **Key caveat (also a finding):** the authors explicitly **did not compute
  inter-rater reliability** ("not considered appropriate in this context"),
  resolving disagreements by consensus. So this corpus can ground the
  *severity/quality* outcome but **cannot** directly ground MethodVahti's
  `judge_human_disagreement` outcome.

### B. Sabbatini / Tomasi et al. (2022) — Bologna FICLIT interview + QualCoder corpus
- **DOI:** https://doi.org/10.5281/zenodo.6123290
- **License:** **CC0-1.0** (Creative Commons Zero — public domain dedication).
- **What:** 19 anonymized qualitative interview transcripts (.txt) with
  arts/humanities scholars (Univ. of Bologna, Nov–Dec 2021), grouped into 5
  research areas, plus a QualCoder v2.9 grounded-theory coding file and README.
- **Validation use:** a genuinely open, CC0, machine-readable coded corpus.
  Re-derive a cumulative-new-codes-per-interview saturation curve and
  codes/themes per transcript as a per-study outcome. Because it is CC0 it is
  also the **lowest-friction corpus to double-code** in order to *manufacture* a
  real inter-coder `judge_human_disagreement` signal (see §4).
- **Limitation:** single coder originally (no native inter-coder disagreement);
  one population/setting, so it exercises within-cell scoring but not
  between-dimension aggregation.

### C. Lowe, Norris, Farris & Babbage (2020) — operationalized saturation metric
- **DOI:** https://doi.org/10.1371/journal.pone.0232076 · *PLOS ONE* · **CC-BY**.
- **What:** "A simple method to assess and report thematic saturation." A
  reproducible saturation statistic with explicit parameters — **base size**,
  **run length**, **new-information threshold**.
- **Validation use:** the math to convert any coded corpus (B above, or QDR
  deposits) into a saturation outcome the heterogeneity score can be regressed
  against. _Verified via WebSearch only; not PubMed-indexed._

---

## 2. Useful but partial

### D. Hennink & Kaiser (2022) — saturation systematic review ⭐ best criterion source
- **DOI:** https://doi.org/10.1016/j.socscimed.2021.114523 · *Soc Sci Med*
  292:114523 · PMID 34785096 · gold OA (no PMCID — confirm CC on ScienceDirect).
- **What:** reviews 23 studies (17 empirical, 6 statistical-modeling). Empirical
  saturation range **9–17 interviews / 4–8 focus groups**; larger N for
  heterogeneous populations, broad aims, multi-country, or meaning saturation.
  **Appendix A** = supplementary table of included studies.
- **Validation use:** the **best external criterion for "does the score predict
  required N."** Extract Appendix A (N-at-saturation per study) + code each
  study's design characteristics, then test rank-correlation with the MethodVahti
  score. _Partial: Appendix A granularity must be verified by opening the
  supplement — inspect before use._

### E. Namey, Guest, McKenna & Chen (2016) — saturation vs data-collection mode
- **DOI:** https://doi.org/10.1177/1098214016630406 · *Am J Eval* (likely
  paywalled; ERIC EJ1108491). 40 interviews + 40 focus groups; median events to
  80%/90% saturation = 8/16 (interviews), 3/5 (FGDs).
- **Validation use:** a clean data point linking the **data_collection** dimension
  (interview vs FGD) to a saturation outcome. Aggregate figures, not per-unit data.

### F. Guest, Bunce & Johnson (2006) — foundational saturation experiment
- **DOI:** https://doi.org/10.1177/1525822X05279903 · *Field Methods* 18:59–82 ·
  open PDF mirror: https://qualquant.org/wp-content/uploads/2013/07/guest-2006-how-many-interviews.FM_.pdf
- Saturation by **12 interviews** (basic metathemes by 6). Hagaman & Wutich
  (2017, https://doi.org/10.1177/1525822X16640447) extended it: 20–40 for
  cross-site metathemes. The 2006→2017 contrast itself encodes a "heterogeneity
  raises required N" effect the score should reproduce.

### G. Repositories to mine (access-gated — filter to open tier)
- **Qualitative Data Repository (QDR):** re3data
  https://www.re3data.org/repository/r3d100011038 · data.qdr.syr.edu. Coded
  transcripts, codebooks, some IRR materials — but many deposits are gated
  (registration / Standard Access agreements).
- **UK Data Service ReShare + QualiBank:** https://ukdataservice.ac.uk/ —
  self-deposit repo + in-data qualitative search. "Five Safes" tiering; only the
  **Open** tier is truly open.

### H. OSF inter-rater deposits — leads only, NOT confirmed
Search surfaced OSF projects titled "Inter-rater reliability data" (osf.io/jq654),
"Inter-Rater Reliability" (osf.io/3hkb4), and an example (osf.io/wfme6). **None
could be opened or verified** (variables, coder counts, license, relevance).
Treat as leads to inspect manually — do not cite as data sources yet.

---

## 3. Methods anchors (verified)

| Source | Role | Identifier |
|---|---|---|
| Tong, Sainsbury & Craig (2007) **COREQ** (32 items) | Item taxonomy mapping to dimensions | https://doi.org/10.1093/intqhc/mzm042 (PMID 17872937) |
| O'Brien, Harris, Beckman, Reed & Cook (2014) **SRQR** (21 items) | Alternative reporting taxonomy | https://doi.org/10.1097/ACM.0000000000000388 |
| Malterud, Siersma & Guassora (2016) **Information Power** | Theory-driven *competitor* / sample-size criterion | https://doi.org/10.1177/1049732315617444 |
| Hennink, Kaiser & Marconi (2017) **code vs meaning saturation** | Two outcome operationalizations (~9 vs ~16–24) | https://doi.org/10.1177/1049732316665344 |
| GRADE-CERQual (Lewin et al.) | Nearest existing *graded* judgment to benchmark a trustworthiness/severity score | PMIDs 29384079 / 29384080 · PMC5791044 · cerqual.org |

---

## 4. Recommended validation design

**Frame.** Use the **Giltenane et al. (2025)** Cochrane corpus (Table 3) as the
primary frame — it already supplies per-dimension coded values for 31 reviews.

**Procedure.**
1. Independently re-code each review's per-dimension cell values from Table 3
   with **two coders**. This *also generates* a real `judge_human_disagreement`
   signal the original paper declined to compute.
2. Run MethodVahti to produce its hierarchical score per review.
3. Pre-register two confirmatory tests:
   - **Convergent** — Spearman correlation between the score and the number of
     included primary studies (proxy for breadth / required evidence).
   - **Criterion** — whether higher heterogeneity predicts reporting-quality /
     CERQual difficulty (the traffic-light outcomes), using λ_within / λ_between
     and the entropy / sparse-interaction diagnostics as ordinal-model predictors.
4. **Saturation arm (separate):** on **Hennink & Kaiser (2022)** Appendix A,
   regress MethodVahti scores (from each included study's coded design
   characteristics) onto reported **N-at-saturation**, harmonizing the outcome
   via the **Lowe et al. (2020)** operationalization.
5. **Low-friction pilot:** double-code the **CC0 Bologna corpus** (item B) to
   prototype the `judge_human_disagreement` extraction end-to-end before
   touching gated repositories.

**Single best next dataset to pursue:** **Hennink & Kaiser (2022) Appendix A**
(`10.1016/j.socscimed.2021.114523`) — the only open resource pairing per-study
design characteristics with a continuous realized outcome (N-at-saturation)
across 23 studies, i.e. the exact predictor→criterion shape needed. First action:
open the ScienceDirect supplement to confirm Appendix A's column granularity and
the article's CC license.

---

## 5. Gaps / what does not exist openly

- **No purpose-built corpus** pairs MethodVahti-style multi-dimensional design
  coding with a per-cell inter-rater **disagreement** outcome. The corpus with
  the right dimensional shape (Cochrane) avoided IRR; the coded corpora (Bologna)
  are single-coder.
- **`judge_human_disagreement` is essentially ungrounded in open data** — it must
  be *manufactured* by double-coding an open corpus, not downloaded.
- **N-at-saturation data are mostly aggregate**, not per-unit microdata.
- **No validated quantitative heterogeneity index** exists for qualitative
  synthesis; CERQual graded judgments are the nearest proxy criterion.
- **QDR / UK Data Service deposits are frequently access-gated**; the open subset
  is small and must be filtered manually.

---

_Compiled 2026-06-15. Article metadata/full text for Hennink & Kaiser (2022),
Tong et al. (2007), and Giltenane et al. (2025) retrieved via PubMed/PubMed
Central. DOIs verified; licenses/fields flagged "inspect before use" pending
manual confirmation._
