---
id: pass-blinded-second-opinion
verdict: PASS
skill: vahtian-brand-safety
rule: Safer replacements — the AI is a blinded second opinion you can ignore
anchor: the AI is a blinded second opinion you can ignore
detector: regex
pattern: \b(?:AI decides|fully automated review|AI checks your citations|let the AI decide)\b
source: vahtian-brand-safety/SKILL.md (safer replacements)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

You rate each claim first. The AI is a blinded second opinion you can ignore, and the trail records who decided what.

## Why

The approved way to say the AI does something useful with citations, which is a
real capability we are allowed to sell. Pairs with `ai-decides-the-judge` and
mirrors the shipped skill's Invariant 1 — the AI rating is sealed until the human
commits.
