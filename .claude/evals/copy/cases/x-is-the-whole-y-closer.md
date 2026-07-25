---
id: x-is-the-whole-y-closer
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — the "X is the whole Y" aphoristic closer
anchor: The "X is the whole Y" aphoristic closer
detector: regex
pattern: \b(?:is|was) the whole (?:point|skill|problem|game|job|thing)\b
source: vahtian-copy-editor/SKILL.md (Structural tells); July 2026 Learn sweep
caught_by: audit
date: 2026-07-25
---

## Snippet

Recording who decided what, and when, is the whole point.

## Shipped replacement

Cut the closer. The preceding sentence already made the point.

## Why

The sweep found the tells cluster in the sentences written to *close* a section,
exactly where a model over-polishes. A sentence engineered to land as a tidy
summary usually restates the one above it, so the fix is deletion rather than
rewriting.
