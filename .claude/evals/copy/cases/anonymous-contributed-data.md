---
id: anonymous-contributed-data
verdict: FAIL
skill: vahtian-brand-safety
rule: Forbidden phrasings — "anonymous" for contributed data
anchor: Always "**de-identified**"; contribution is opt-in, default-off
detector: regex
pattern: \banonymous(?:ly|ised|ized)?\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Contribute your ratings anonymously to help improve the tool.

## Shipped replacement

Contribution is opt-in and default-off. If you turn it on, records are
de-identified before they leave your device.

## Why

"Anonymous" is a claim about re-identification risk that a de-identified
research record cannot support. The word choice is also where a data-collection
promise quietly becomes a data-collection default, so the opt-in and default-off
facts travel with it.
