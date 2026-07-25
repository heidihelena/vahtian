---
id: doi-resolves-to-wrong-paper
verdict: FAIL
skill: vahtian-copy-editor
rule: The fact pass — every citation through /reference-check/ before shipping
anchor: Citations pass `/reference-check/` before shipping — a required gate, not a suggestion.
detector: judgement
source: vahtian-copy-editor/SKILL.md (fact pass); July 2026 Learn batch
caught_by: audit
date: 2026-07-25
---

## Snippet

A citation on research questions whose DOI, written from memory, resolved to a
statistics paper. Valid DOI, wrong paper.

## Shipped replacement

Every reference in the list run through `/reference-check/`, every "does not
check out" cleared before the page ships, and the link preferred as a
single-hop open-access URL labelled `(open access)` or `(paywall)`.

## Why

The valid-DOI-wrong-paper case is invisible to any check that only asks whether
the DOI resolves. It needs a Crossref title/first-author/year comparison, which
is what our own free tool does — dogfooding confirmed it flags exactly this
mismatch. If we ask readers to check their citations, ours must survive the same
tool. Judgement-only: it requires a network lookup, not a pattern.
