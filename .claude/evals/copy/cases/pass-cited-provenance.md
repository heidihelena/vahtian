---
id: pass-cited-provenance
verdict: PASS
skill: vahtian-brand-safety
rule: Evidence claims carry provenance
anchor: cite it or rewrite as reasoning from mechanism
detector: regex
pattern: \b(?:studies show|research shows|most researchers (?:find|report|agree)|it is well known that)\b
source: learn/ palette article; rule in vahtian-brand-safety/SKILL.md
caught_by: review
date: 2026-07-25
---

## Snippet

Crameri, Shephard and Heron showed in Nature Communications (2020) how widespread the damage is: rainbow maps and unchecked colour choices distort published data across whole fields.

## Why

A named-source evidence claim, which is the remedy the rule asks for. Guards a
pattern that would otherwise be tempting to widen until it flags every
evidence-shaped sentence, including the properly cited ones.
