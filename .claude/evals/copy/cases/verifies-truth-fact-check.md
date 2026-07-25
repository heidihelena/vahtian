---
id: verifies-truth-fact-check
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — checks support, not truth
anchor: "verifies truth", "fact-check your paper"
detector: regex
pattern: \b(?:verif(?:y|ies) (?:truth|your science)|fact-check(?:s|ed|ing)? your (?:paper|manuscript)|(?:make|be) sure your claims are correct)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

CiteVahti fact-checks your paper so you can be sure your claims are correct.

## Shipped replacement

Assesses whether the cited source supports the claim.

## Why

Breaks invariant rule 2. Whether a source supports a sentence and whether the
sentence is true are different questions, and only the first is answerable from
the source. Claiming the second is the overclaim the whole product exists to
avoid.
