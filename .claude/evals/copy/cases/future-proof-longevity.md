---
id: future-proof-longevity
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — guarantee-shaped promise about longevity
anchor: "future-proof", "will open in any editor in twenty years", "works forever"
detector: regex
pattern: \b(?:future-proof(?:ed|ing)?|works forever|in any editor in twenty years|guaranteed to open)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Plain text is future-proof: your vault works forever.

## Shipped replacement

Plain text opens in any editor today, and is the format most likely to still
open in twenty years.

## Why

The benefit survives the honest version. "Most likely to still open" is a claim
about format longevity we can defend; "forever" is a promise about software
nobody has written yet.
