---
id: wrong-question-better-question
verdict: FAIL
skill: vahtian-copy-editor
rule: Structural tells — antithesis family, "the wrong question / the better question"
anchor: "the wrong question / the better question"
detector: regex
pattern: the wrong question\.\s*The better question
source: 029518d (#277)
caught_by: founder
date: 2026-07-25
---

## Snippet

Most discussions about AI ask whether students will stop thinking. That is the wrong question. The better question is why so much thinking was never captured in the first place.

## Shipped replacement

Most discussions about AI ask whether students will stop thinking. A more useful question is why so much doctoral reasoning was never captured in the first place.

## Why

Dismiss-then-substitute, in two sentences where one does the work. "A more
useful question" concedes the first question has some merit, which is truer than
calling it wrong. The replacement also swaps "so much thinking" for "so much
doctoral reasoning" — the specific noun, per Concrete over abstract.

Note the pattern is deliberately tight: it requires the two-sentence
dismiss-then-substitute shape. "answers the wrong question" as a plain
predicate is legitimate and appears on live pages.
