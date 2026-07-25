---
id: banned-vocabulary-hype
verdict: FAIL
skill: vahtian-copy-editor
rule: Banned vocabulary — the LLM-house-style words
anchor: Banned vocabulary
detector: regex
pattern: \b(?:delve|elevate|unlock|harness|leverage|empower(?:s|ed|ing)?|streamline[sd]?|supercharge|seamless(?:ly)?|cutting-edge|game-changer|revolutioni[sz]e|transformative|unleash|tapestry|testament)\b
source: vahtian-copy-editor/SKILL.md (Banned vocabulary), quoted as the counter-example to plain verbs
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Vahtian empowers you to revolutionize citation quality with a powerful, seamless workflow that unlocks transformative rigour.

## Shipped replacement

Checks whether the source supports the claim.

## Why

The house style is plain by design. Every word in the snippet could sell any
product, which is exactly why it sells nothing to researchers. This is the one
tell that survives a literal word list, so it belongs in the deterministic half
of the corpus.
