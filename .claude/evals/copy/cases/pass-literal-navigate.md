---
id: pass-literal-navigate
verdict: PASS
skill: vahtian-copy-editor
rule: Banned vocabulary — "navigate" is banned figuratively, not literally
anchor: navigate (figurative)
detector: regex
pattern: \b(?:delve|elevate|unlock|harness|leverage|empower(?:s|ed|ing)?|streamline[sd]?|supercharge|seamless(?:ly)?|cutting-edge|game-changer|revolutioni[sz]e|transformative|unleash|tapestry|testament)\b
source: vahtian-copy-editor/SKILL.md (Banned vocabulary)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Navigate to the Zotero tab, preview the write, then confirm.

## Why

Documents why the context-dependent bans (navigate, ensure, boost, foster,
journey, landscape, robust, powerful) are deliberately absent from the
deterministic pattern: the word list is only enforceable where the word is
unconditionally wrong. "Navigate to the Zotero tab" is a literal instruction and
the plainest way to say it. Keeping those words out of the regex is what stops
the pattern flagging correct microcopy — the exclusion is the rule, not an
oversight.
