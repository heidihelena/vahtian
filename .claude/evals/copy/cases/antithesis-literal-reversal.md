---
id: antithesis-literal-reversal
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — the "That is not X. It is Y." reversal
anchor: The "That is not X. It is Y." reversal
detector: regex
pattern: \b(?:that|this|it) is not [^.!?]{2,60}\.\s+(?:it|that|this) is\b
source: vahtian-copy-editor/SKILL.md (Structural tells), July 2026 Learn audit
caught_by: audit
date: 2026-07-25
---

## Snippet

That is not a minor convenience. It is the point.

## Shipped replacement

That durability is the point.

## Why

The literal two-sentence template is the one member of the antithesis family a
pattern can catch without over-firing. The audit found 10+ per section. Budget
is at most one per page, so this pattern locates candidates; it does not by
itself convict the survivor.
