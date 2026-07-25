---
id: unbenchmarked-accuracy-claim
verdict: FAIL
skill: vahtian-brand-safety
rule: No unbenchmarked accuracy claims
anchor: No unbenchmarked accuracy claims.
detector: regex
pattern: \b(?:\d{1,3}(?:\.\d+)?% accurate|detects all citation errors|never miss(?:es)? a bad citation|catches every|100% safe|guarantee[sd]?\b.{0,30}\b(?:accura|correct)|proves your)\b
source: vahtian-brand-safety/SKILL.md (invariant rule 3 + forbidden phrasings)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

99% accurate — detects all citation errors, so you never miss a bad citation.

## Shipped replacement

Catch citations that don't support the sentence, and overstated claims. Our own
laptop test reports its numbers as indicative, not a validation.

## Why

There is no published validation study, so any percentage is unsourced. Our own
local-model test page states this against itself: we wrote both the claims and
the reference labels, so the numbers are indicative. That is the standard the
marketing copy has to meet too.
