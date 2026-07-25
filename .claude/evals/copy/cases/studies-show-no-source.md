---
id: studies-show-no-source
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — evidence claim without provenance
anchor: "studies show…", "most researchers find…" with no source
detector: regex
pattern: \b(?:studies show|research shows|most researchers (?:find|report|agree)|it is well known that)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table); July 2026 Learn audit
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Studies show that most researchers find citation errors in their own published work.

## Shipped replacement

Cite the actual study, or rewrite as reasoning from mechanism.

## Why

Provenance or flag applies to our own copy, not only to our users'. A tool that
assesses whether a source supports a claim cannot make unsourced evidence claims
in its own marketing, and this audience checks.
