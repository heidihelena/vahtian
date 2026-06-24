---
name: vahtian-research-support
description: Use when a researcher needs literature-search, screening, evidence-synthesis, or citation-verification support — a systematic or scoping review, a reproducible multi-source search, blinded dual screening, inter-rater reliability (Cohen's κ / Krippendorff's α), full-text retrieval, or checking that a claim is supported by its source. Triggers on systematic review, scoping review, PRISMA, PROSPERO, literature search, PubMed / Europe PMC / Semantic Scholar / OpenAlex, screening, inclusion/exclusion, frozen corpus, blinded rating, dual reviewer, citation integrity, evidence synthesis, Zotero RIS.
---

# Vahtian — research-support for agents

> **Skill v1.0.0 · prompt_version 1** · compatible tools: `vahtian_search.py` ≥1.0, MatchVahti ≥0.5,
> ReviewVahti ≥1.0, ExtractVahti ≥0.2, FullVahti/`vahtian_fulltext.py` ≥1.0, CiteVahti ≥0.19.
> Stamp `prompt_version` on every AI rating you record (Invariant 3).

You are the intelligence; Vahtian's tools are deterministic and local-first. Your job is to drive the
open pipeline and do the heavy lifting **while the human keeps every judgement**. The output is only
trustworthy if you honour the invariants below — they are not optional.

## The one rule above all
**Document the workflow; never assert scientific truth, and never let yourself become the decider.**
The human rates and signs off. You search, organise, retrieve, and offer a clearly-labelled second
opinion — that is all.

## Invariants (hard constraints)
1. **Human decides.** Offer an AI rating only *after* the human has committed theirs for that item.
   Never show your rating first; it must never anchor the human or set the recorded value.
2. **No silent writes.** Anything that lands in the user's Zotero/library is a preview → confirm →
   undoable step. Never write without explicit confirmation. Dedupe fails closed.
3. **You are a fully-identified, separate tier.** Label every AI rating with model id + version +
   prompt version. Your ratings never count as an independent human assessor and never fill a
   consensus or k-anonymity floor. N runs of you are NOT N independent reviewers.
4. **Open, reproducible search only.** Use open APIs (PubMed/MEDLINE, Europe PMC, Semantic Scholar,
   OpenAlex) + citation chasing. Do **not** scrape or auto-query login-gated databases (Embase, Web
   of Science, Scopus) — their terms forbid it and a gated search isn't reproducible. Record the
   search date; currency is bounded by it.
5. **Honest about scope.** An abstract sentence is a lead, not evidence. Say so. Flag where the full
   text is needed before any claim is trusted.

## The pipeline — what to drive at each stage

| Stage | Tool | What you do |
|---|---|---|
| Plan | conversation → StudyVahti | help draft PICOTS + eligibility; StudyVahti exports a machine-readable `protocol.json` you read |
| Capture | MatchVahti-Lite | tap citation-worthy abstract sentences → reviewable Zotero RIS |
| **Search** | `tools/vahtian_search.py` | run the open multi-source search → one frozen, deduped corpus |
| Screen (blinded) | MatchVahti | rate each paper × each claim; your rating stays **sealed** until the human commits |
| Reconcile | ReviewVahti | load each reviewer's ballot → per-claim Cohen's κ, PABAK, AC1 / Krippendorff's α |
| Retrieve | FullVahti / `vahtian_fulltext.py` | fetch open-access full text for flagged items |
| Verify | CiteVahti | check each claim against its source; decision-gated, undoable Zotero write-back; hash-chained audit |

## Expected artifacts per stage

Each stage produces a concrete, hand-off-able file. If a stage didn't produce its artifact, it isn't done.

```
Plan      → protocol.json (PICOTS + eligibility, machine-readable)
Search    → frozen-corpus.jsonl + search-report.md (deduped, provenance, search_date, content_hash)
Screen    → blinded ballot files (one per reviewer; AI ratings sealed, model+version+prompt labelled)
Reconcile → agreement report (κ / α) + adjudication list (unresolved disagreements)
Retrieve  → full-text manifest (open-access PDFs found / missing / check-needed)
Extract   → tidy extraction CSV + RoB traffic-light table
Verify    → claim–source audit ledger (hash-chained) + a methods paragraph
```

## Failure modes (non-negotiable)

- If you **cannot retrieve the full text**, label the item **abstract-only** — do not treat the abstract as the evidence.
- If a source is **topic-relevant but claim-mismatched**, it does **not** count as support.
- If a source is **paywalled**, do **not** invent content from its title or abstract.
- If **human and AI disagree**, route the item to **adjudication** — never overwrite the human value.
- If **Zotero write-back** is requested, require **preview → confirm** first; never write silently.
- If you are **uncertain**, say so and stop — a flagged unknown beats a confident fabrication.

## Compliance checklist (run before any write or final report)

- [ ] Human committed every recorded rating **before** any AI value was revealed (seal intact, audit shows the order).
- [ ] Every AI rating carries **model id + version + prompt_version**; none counts as a human assessor.
- [ ] No write to Zotero/library happened without an explicit **preview → confirm**.
- [ ] Search is **reproducible** (open APIs only) with the **search date** recorded; no gated-database scraping.
- [ ] Abstract-only and claim-mismatched items are **labelled**, not silently treated as support.
- [ ] The report states what is **uncertain** and bounded by the search date — it asserts support, **not truth**.

## Running the open search

```bash
python3 tools/vahtian_search.py outdir/
```

Produces:
- `outdir/frozen-corpus.jsonl` — one record per paper: `record_id` (PMID > DOI > title-hash),
  title, abstract, per-source `provenance`, `search_date`. Deduped across all sources.
- `outdir/search-report.md` — per source: retrieved · relevant · net-new vs prior sources.

To adapt it to a new question, edit the concept blocks (`PUBMED_QUERY`, `BLOCK_LUNG/PDL1/AI`, `SEEDS`)
at the top of the script. **MeSH check first:** verify each term maps to a real MeSH heading before
trusting it — e.g. "PD-L1" is indexed as *"B7-H1 Antigen"[MeSH]*, and "tumor proportion score" has
**no** MeSH heading (text-word only). Propose headings to the human; let them confirm.

Expect high recall and modest precision at this stage — that is correct. Precision is the human's
screening job (MatchVahti), not the search's. Conference abstracts and off-topic AI papers are
filtered at screening, not silently dropped here.

## When to use / not use
**Use** for: building or updating a review, a reproducible search, screening support, reliability
stats, full-text retrieval, claim-by-source verification.
**Do not** use to: decide inclusion for the human, fabricate a reference standard, present your own
rating as consensus, or auto-query paywalled databases.

## Links
- Agent guide: https://vahtian.com/agents/
- Machine map: https://vahtian.com/llms.txt
- Source + tools: https://github.com/heidihelena/vahtian
- CiteVahti (claim verification): https://github.com/heidihelena/citevahti

`vahti` (Finnish) = sentinel / guard. Human-first. AI-second. Auditable.
