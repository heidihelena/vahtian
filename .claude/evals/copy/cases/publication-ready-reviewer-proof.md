---
id: publication-ready-reviewer-proof
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — certifies publication suitability
anchor: "publication-ready", "reviewer-proof"
detector: regex
pattern: \b(?:publication-ready|publication ready|reviewer-proof|submission-ready)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Run the check and your manuscript is publication-ready.

## Shipped replacement

Shows which claims have support recorded against them, and which are still
open.

## Why

The invariant names publication readiness explicitly as something Vahtian does
not certify. Readiness is a judgement about a whole manuscript against a
journal's expectations; the tool sees claim-source pairs.
