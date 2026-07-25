---
id: pass-de-identified-optin
verdict: PASS
skill: vahtian-brand-safety
rule: Contributed data — de-identified, opt-in, default-off
anchor: contribution is opt-in, default-off
detector: regex
pattern: \banonymous(?:ly|ised|ized)?\b
source: vahtian-brand-safety/SKILL.md (forbidden phrasings table)
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Contribution is opt-in and default-off. If you turn it on, records are de-identified before they leave your device.

## Why

The approved form of the same offer. Pairs with `anonymous-contributed-data`:
the pattern must fire on one and stay silent on the other, which is the whole
substance of that rule.
