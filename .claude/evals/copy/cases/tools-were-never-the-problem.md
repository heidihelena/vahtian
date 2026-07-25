---
id: tools-were-never-the-problem
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — antithesis family, "X was never the problem — Y is"
anchor: "X was never the problem — Y is"
detector: regex
pattern: \b(?:was|were) never the problem\b
source: 55efe3d (#275)
caught_by: founder
date: 2026-07-25
---

## Snippet

Papers, notebooks, Zotero libraries, highlighted PDFs, supervisor meetings: nobody holds a doctoral project in their head, and nobody ever did. The tools were never the problem. What slips away is the reasoning behind decisions, why this cut-off, why that method, why the paper that contradicted the plan did not change it.

## Shipped replacement

Papers, notebooks, Zotero libraries, highlighted PDFs, supervisor meetings: nobody holds a doctoral project in their head, and nobody ever did. What none of these tools was built to hold is the reasoning behind a decision: why this cut-off, why that method, why the paper that contradicted the plan did not change it. That is what slips away.

## Why

The negation-then-correction shape, one of the five the founder counted in the
essay. The replacement states what the tools do not hold without the see-saw,
and moves "that is what slips away" to the end where it lands as a fact rather
than a reversal.
