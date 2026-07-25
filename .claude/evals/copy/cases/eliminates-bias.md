---
id: eliminates-bias
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — "eliminates bias"
anchor: "eliminates bias"
detector: regex
pattern: \b(?:eliminates? bias|removes? bias|bias-free|unbiased assessment)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Blinded dual screening eliminates bias from your review.

## Shipped replacement

Blinded dual screening records each reviewer's rating independently and routes
disagreement to adjudication, so the disagreement stays visible.

## Why

Vahtian *records* and *preserves* disagreement. Blinding changes what a rater can
see; it does not remove bias, and κ exists precisely because raters still
disagree. The mechanism is the honest and more useful claim.
