---
id: pass-opens-in-any-editor-today
verdict: PASS
skill: vahtian-brand-safety
rule: Longevity — the defensible version of the durability claim
anchor: say "most likely to still open", "opens in any editor **today**"
detector: regex
pattern: \b(?:future-proof(?:ed|ing)?|works forever|in any editor in twenty years|guaranteed to open)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Plain text opens in any editor today, and is the format most likely to still open in twenty years.

## Why

Shows the durability benefit survives the honest framing, so the rule cannot be
argued away as costing a selling point. Pairs with `future-proof-longevity`.
