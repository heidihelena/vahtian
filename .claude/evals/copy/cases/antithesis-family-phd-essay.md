---
id: antithesis-family-phd-essay
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — count the whole antithesis family, not the literal template
anchor: Count the whole antithesis *family*, not just the literal template
detector: judgement
source: 55efe3d (#275), rule codified in 07e4e4c (#276)
caught_by: founder
date: 2026-07-25
---

## Snippet

> The tools were never the problem.

> The model does not replace your thinking; it outruns your memory of it.

> A thesis, though, is made of claims, not documents, and every claim has a status you can name.

> ## Organise the knowing, not the documents

> it runs on plain files and honesty about which state a claim is really in.

Five see-saw constructions across one short essay (`blog/ai-wont-replace-the-phd/`),
including a section heading, plus the closing line the essay kept.

## Shipped replacement

Four flattened to plain declaratives, one kept at the closer where it is the
payoff. The heading became `Organise around what you know`; "made of claims, not
documents" became "A thesis is built from claims".

## Why

This is the case that has to stay judgement-only: every individual line was
defensible, and a regex for any one of them would fire on the single legitimate
use. The tell is the recurring *rhythm* across a whole piece, so the check is
"count the family in this piece, keep one" — not "does this sentence match a
template". A detector that scored each line in isolation would have passed all
five.
