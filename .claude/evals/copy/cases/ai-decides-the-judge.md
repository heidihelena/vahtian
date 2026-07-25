---
id: ai-decides-the-judge
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — makes AI the judge, breaks human-first
anchor: Makes AI the judge — breaks human-first
detector: regex
pattern: \b(?:AI decides|fully automated review|AI checks your citations|let the AI decide)\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Fully automated review: the AI checks your citations and flags the bad ones.

## Shipped replacement

You rate each claim first. The AI is a blinded second opinion you can ignore,
and the trail records who decided what.

## Why

Breaks invariant rule 1, and it breaks the product, not just the copy: the
shipped skill's Invariant 1 forbids revealing an AI rating before the human has
committed theirs, precisely so the AI cannot anchor the decision. Copy that
advertises AI as the decider describes a tool we deliberately did not build.
