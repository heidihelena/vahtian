---
id: recycled-cta-anecdote
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — the recycled CTA anecdote
anchor: The recycled CTA anecdote
detector: judgement
source: 029518d (#277); July 2026 Learn audit
caught_by: audit
date: 2026-07-25
---

## Snippet

> You called your study "inductive", and a reviewer pointed out you actually started from an existing framework. That is not carelessness. These terms overlap in practice … It flags the mismatch. It does not decide which reasoning fits your question. That stays yours.

> This is not carelessness. Nothing in a normal figure workflow checks whether two colours stay distinguishable for a reader with deuteranopia …

> This is not carelessness. Ordinary workflows scatter the path: prompts in one tool, code in another, decisions in nobody's file.

## Shipped replacement

Vary the anecdote per page and keep the shape once. Where the reassurance is
load-bearing, write the specific reason this reader is not careless rather than
reusing the sentence.

## Why

Judgement-only by construction: each instance is fine in isolation, and the
audit's finding was that the shape had gone byte-identical across sibling pages.
Establishing that needs the set of pages, not one snippet — a single-snippet
detector cannot see repetition. The check is "follow the links out of this page
and look for your own signature sentence".
