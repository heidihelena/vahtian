---
id: pass-unit-tests-metaphor
verdict: PASS
skill: vahtian-brand-safety
rule: Safer replacements — run unit tests on your manuscript's citations
anchor: run unit tests on your manuscript's citations
detector: regex
pattern: \b(?:verif(?:y|ies) (?:truth|your science)|fact-check(?:s|ed|ing)? your (?:paper|manuscript)|(?:make|be) sure your claims are correct)\b
source: vahtian-brand-safety/SKILL.md (safer replacements)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Run unit tests on your manuscript's citations.

## Why

An approved line, and the one most likely to be mistaken for an overclaim on a
fast read. A unit test checks a specific expectation and reports pass or fail; it
does not certify the program correct. That is the accurate analogy for
claim-source support, which is why the metaphor is on the safer-replacements
list rather than the forbidden table.
