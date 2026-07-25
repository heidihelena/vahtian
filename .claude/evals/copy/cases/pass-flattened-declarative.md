---
id: pass-flattened-declarative
verdict: PASS
skill: vahtian-copy-editor
rule: Structural tells — antithesis flattened to plain assertion
anchor: flatten the rest to plain declaratives
detector: regex
pattern: \b(?:that|this|it) is not [^.!?]{2,60}\.\s+(?:it|that|this) is\b
source: 55efe3d (#275), the text that shipped
caught_by: founder
date: 2026-07-25
---

## Snippet

Papers, notebooks, Zotero libraries, highlighted PDFs, supervisor meetings: nobody holds a doctoral project in their head, and nobody ever did. What none of these tools was built to hold is the reasoning behind a decision: why this cut-off, why that method, why the paper that contradicted the plan did not change it. That is what slips away.

A language model can generate a plausible answer faster than you can reconstruct your own past thinking. When the fluent answer arrives in seconds and the real reason lives in a notebook you cannot find, the fluent answer wins by default. The model has outrun your memory of your own reasoning.

## Why

The other half of the corpus: copy that must not be flagged. This is what
shipped after the founder catch, so a future edit that starts flagging it has
made the rule over-trigger. The prose still carries contrast — "nobody ever
did", "wins by default" — without the see-saw, which is the distinction the rule
is actually drawing.
