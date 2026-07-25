---
id: made-of-claims-not-documents
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — antithesis family, "made of X, not Y"
anchor: "made of X, not Y"
detector: regex
pattern: \bis made of \w+, not \w+
source: 55efe3d (#275)
caught_by: founder
date: 2026-07-25
---

## Snippet

Research is usually organised around documents: a folder for papers, a folder for drafts, notes filed by topic. A thesis, though, is made of claims, not documents, and every claim has a status you can name.

## Shipped replacement

Research is usually organised around documents: a folder for papers, a folder for drafts, notes filed by topic. A thesis is built from claims, and every claim has a status you can name.

## Why

The contrast is already carried by the preceding sentence, so "not documents"
restates it. Cutting the negation also cuts "though", an unearned-balance
hedge on a claim the paragraph supports outright.
