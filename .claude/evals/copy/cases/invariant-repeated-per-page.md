---
id: invariant-repeated-per-page
verdict: FAIL
skill: vahtian-brand-safety
rule: Visible once is enough — repetition adds no safety
anchor: Visible once is enough.
detector: judgement
source: vahtian-brand-safety/SKILL.md; July 2026 Learn audit
caught_by: audit
date: 2026-07-25
---

## Snippet

A single Learn page carrying "does not decide truth" in the lede, again under
the first heading, again in a callout, again before the CTA, again in the FAQ,
and again in the footer note. Six restatements of one limit.

## Shipped replacement

One statement of the limit, in running prose, with the benefit attached.

## Why

The interesting case in the corpus: brand-safety requires the invariant be
visible, and the same skill caps it at once, so a fix in one direction is a
regression in the other. Nervous repetition also costs credibility with an
audience allergic to hype, and it buys no safety. Establishing the count needs
the whole page, so this stays judgement-only, and it is routed back to
`vahtian-copy-editor` to consolidate rather than simply deleted.
