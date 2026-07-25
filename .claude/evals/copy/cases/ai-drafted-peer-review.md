---
id: ai-drafted-peer-review
verdict: FAIL
skill: vahtian-brand-safety
rule: Peer-review context — never frame the tool as drafting the review
anchor: "AI-drafted/AI-generated peer review"
detector: regex
pattern: \b(?:AI-(?:drafted|generated) peer review|let AI review the manuscript|outsource the review to AI|AI writes your review)\b
source: vahtian-brand-safety/SKILL.md; Brem et al., IEEE Eng. Manag. Rev. 2026, 10.1109/EMR.2026.3702480
caught_by: rule-table
date: 2026-07-25
---

## Snippet

Reviewer's Notebook: let AI review the manuscript and turn its notes into your report.

## Shipped replacement

Structures your own review notes against the claims in the manuscript. The
manuscript stays on your machine; nothing uploads. Your name stands behind the
review.

## Why

The strongest rule in the table, because it is the one with third-party
consequences. A reviewer accepts confidentiality, accountability and
IP-protection duties, and uploading the manuscript to a third-party AI breaks all
three at once. Also never imply Vahtian is "approved" or "compliant" for peer
review — no third-party tool currently meets that bar.
