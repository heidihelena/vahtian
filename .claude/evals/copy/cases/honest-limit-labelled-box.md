---
id: honest-limit-labelled-box
verdict: FAIL
skill: vahtian-copy-editor
rule: The honest-limit budget — a limit is a sentence, not a labelled box
anchor: A limit is a sentence, not a labelled box (founder-set, Heidi 2026-07-18)
detector: regex
pattern: (?:<strong>|<h[1-6][^>]*>)\s*The honest limit\.
source: vahtian-copy-editor/SKILL.md (honest-limit budget); July 2026 Learn build
caught_by: founder
date: 2026-07-18
---

## Snippet

<div class="note"><p><strong>The honest limit.</strong> CiteVahti does not decide whether your claim is true — what it does is record whether the source you cited supports it.</p></div>

## Shipped replacement

The limit woven into the running prose where it belongs, once: "CiteVahti
records whether the cited source supports your sentence, so you can show a
supervisor how each decision was made."

## Why

Heidi read the *container* as AI slop: the label plus the formulaic "not X —
what it does is Y" body announced itself as boilerplate on every page. The
honesty stays; the packaging goes.

The pattern matches only the literal titled label. "An honest limit of this
test." introducing a specific self-critical note is a different move and is not
caught here.
