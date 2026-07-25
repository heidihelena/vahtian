---
id: filler-intensifier-actually
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — filler intensifiers
anchor: Filler intensifiers
detector: judgement
source: vahtian-copy-editor/SKILL.md (Structural tells); site-wide pass, founder-authorised 2026-07-25
caught_by: founder
date: 2026-07-25
---

## Snippet

That is where your certainty actually lives.

And the five the site-wide pass removed:

> The direction, though, is not really in doubt.
> that is a genuinely useful first pass
> A good review takes hours and genuinely improves the paper.
> "cheaper open publishing" are not really opposites
> You wonder whether the introduction should really begin somewhere else.

## Shipped replacement

That is where your certainty lives. Each of the five with the intensifier
deleted and nothing else changed.

## Why

Judgement-only on purpose. The rule keeps "actually" where it carries a real
contrast — "what you *actually* did" versus what you claimed is correct and
load-bearing — and cuts it as an emphasis crutch. A word-list detector cannot
tell those apart, and a regex on `\bactually\b` would flag the legitimate use on
live pages. Deciding which one you are looking at is the whole check.

**The pass that proves it (2026-07-25).** Founder authorised removing the
crutches site-wide. 120 instances of actually/really/truly/genuinely across 55
pages; **5 were crutches.** The other 115 carry the claimed-versus-actual
contrast that is the brand's core distinction ("the version you actually ran",
"whether the source actually supports the claim", "what a person actually
accepted"), sit inside a quoted researcher voice, or mark a statistical null
("if there were truly no effect"). A regex would have been wrong 115 times out
of 120. Keep this case judgement-only; a future pass that converts it to a
pattern to raise the automated count would make the harness worse.
