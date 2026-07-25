---
id: heading-built-on-not-the
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — antithesis family in a section heading
anchor: even a section heading built on "…, not the …"
detector: regex
pattern: <h[1-6][^>]*>[^<>]{4,60},\s+not the \w+</h[1-6]>
source: 55efe3d (#275)
caught_by: founder
date: 2026-07-25
---

## Snippet

<h2>Organise the knowing, not the documents</h2>

## Shipped replacement

<h2>Organise around what you know</h2>

## Why

A heading is the most repeated surface on a page, so a see-saw there sets the
cadence for everything under it. Headings are claims or questions; this one is a
claim plus its own foil.
