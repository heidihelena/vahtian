---
id: filler-intensifier-actually
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — filler intensifiers
anchor: Filler intensifiers
detector: judgement
source: vahtian-copy-editor/SKILL.md (Structural tells), quoted from the July 2026 sweep
caught_by: audit
date: 2026-07-25
---

## Snippet

That is where your certainty actually lives.

## Shipped replacement

That is where your certainty lives.

## Why

Judgement-only on purpose. The rule keeps "actually" where it carries a real
contrast — "what you *actually* did" versus what you claimed is correct and
load-bearing — and cuts it as an emphasis crutch. A word-list detector cannot
tell those apart, and a regex on `\bactually\b` would flag the legitimate use on
live pages. Deciding which one you are looking at is the whole check.
