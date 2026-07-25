---
id: fake-enthusiasm-announcement
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — fake enthusiasm
anchor: Fake enthusiasm
detector: regex
pattern: \b(?:we(?:'re| are) (?:thrilled|excited|delighted|proud)|thrilled to announce|excited to announce)\b
source: vahtian-copy-editor/SKILL.md (Structural tells)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

We're thrilled to announce that SynthVahti is now live!

## Shipped replacement

SynthVahti is live.

## Why

The voice is a sentinel on watch, not a press office. State what shipped. The
announcer skill inherits this: a release note says what changed and what it does
not do.
