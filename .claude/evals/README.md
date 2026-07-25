# Copy-skill regression corpus

A held-out record of Vahtian copy that was **actually caught** — by the founder,
by an audit, by review, or by the canonical rule tables. Each case names the rule
that caught it and pins a verbatim `anchor` from that skill's `SKILL.md`.

The point is to make editing `vahtian-copy-editor` and `vahtian-brand-safety`
safe to do often. Before this existed, a skill edit was validated by reading it
and agreeing with it. A rule that a real regression paid for could be trimmed in
the name of tidying, and nothing would notice until the same copy shipped again.

```bash
node .claude/evals/run.mjs              # verify the corpus (hard CI gate)
node .claude/evals/run.mjs --judgement  # list the cases that need reading
```

## What the runner checks, without a model

1. **Every case is well formed** — required fields, unique id matching the
   filename, ISO-8601 date, `FAIL` cases carry the replacement that shipped,
   `PASS` cases do not.
2. **The rule is still in the skill.** The `anchor` must appear verbatim in
   `.claude/skills/<skill>/SKILL.md` (whitespace-normalised, so re-wrapping a
   paragraph is fine). This is the regression gate: you cannot silently delete a
   rule a real failure paid for. Retiring a case is allowed — in the same commit,
   with a reason.
3. **The detectors still work.** For `detector: regex` cases, the pattern must
   still fire on the failing snippet, must stay quiet on `PASS` copy, and — for
   `FAIL` cases — must not match the replacement that shipped. That last one
   catches a "fix" that left the tell in place.

## What it deliberately does not do

- **It does not scan the live site.** Most of these rules are budgets, not bans:
  one antithesis per piece, one em-dash per page, one statement of a limit, an
  anecdote that is fine once. Grepping the site for these patterns would fail on
  defensible copy, and a gate that cries wolf gets switched off. The patterns
  validate the corpus.
- **It does not judge the judgement cases.** 12 of 39 have no deterministic
  detector, because the tell is a count across a whole piece, a claim needing a
  network lookup, or a word that is correct in one context and a crutch in
  another. `--judgement` lists them; the owning skill reads them.
- **It never lets a skill score itself.** The corpus is the fixed reference. A
  skill edit is checked against cases written before the edit, never against the
  edited skill's own opinion of its output. That separation is the whole design:
  the same evaluator driving updates and reporting results is how you get a
  system that improves its scores and nothing else.

## Case format

```yaml
---
id: made-of-claims-not-documents     # must equal the filename
verdict: FAIL                        # FAIL = must be flagged · PASS = must not be
skill: vahtian-copy-editor           # the skill under test
rule: Structural tells — antithesis family, "made of X, not Y"
anchor: "made of X, not Y"           # verbatim substring that must stay in SKILL.md
detector: regex                      # regex | judgement
pattern: \bis made of \w+, not \w+   # regex cases only
flags: i                             # optional, default i
source: 55efe3d (#275)               # commit / PR / rule table
caught_by: founder                   # founder | audit | review | ci | rule-table
date: 2026-07-25
---
## Snippet             — the copy under test
## Shipped replacement — FAIL cases only: what actually shipped
## Why                 — why this verdict, and why this detector
```

`caught_by` is the provenance, and it is not decoration. `founder`, `audit` and
`review` mean a real regression: this copy existed and someone stopped it.
`rule-table` means the case is lifted from the canonical forbidden-phrase table
in `vahtian-brand-safety/SKILL.md` — authoritative, but never shipped. Do not
label an invented example as a founder catch.

## The PASS half matters more than it looks

11 of 39 cases are `PASS` — copy that must *not* be flagged. Without them, every
incentive points one way: a skill edit that widens a rule looks like an
improvement, and the corpus keeps agreeing until the skills flag everything and
get ignored. Seven rules are pinned at both edges by a FAIL/PASS pair sharing one
pattern:

| Rule | Must flag | Must not flag |
|---|---|---|
| Antithesis reversal | `antithesis-literal-reversal` | `pass-flattened-declarative` |
| Banned vocabulary | `banned-vocabulary-hype` | `pass-literal-navigate` |
| Truth vs support | `verifies-truth-fact-check` | `pass-unit-tests-metaphor` |
| AI as judge | `ai-decides-the-judge` | `pass-blinded-second-opinion` |
| Contributed data | `anonymous-contributed-data` | `pass-de-identified-optin` |
| Longevity promise | `future-proof-longevity` | `pass-opens-in-any-editor-today` |
| Evidence provenance | `studies-show-no-source` | `pass-cited-provenance` |

`invariant-repeated-per-page` is the case that shows why judgement cannot be
fully automated away: `vahtian-brand-safety` requires the invariant be visible,
and the same skill caps it at once per page. A fix in either direction is a
regression in the other.

## Adding a case

Add one whenever a copy problem is caught that the skills should have caught.
That is the loop this directory exists to close:

1. Something is caught — founder read, audit, review comment.
2. The rule that should have caught it goes into the owning `SKILL.md` (or gets
   sharpened if it was there and missed).
3. A case here pins it, quoting the real copy and the fix that shipped.
4. `node .claude/evals/run.mjs` passes, so the anchor is real and the detector
   fires.

Prefer `detector: judgement` over a pattern you are not confident in. A weak
regex that over-fires is worse than an honest "this one needs reading" — the
corpus is a record of what we know, and pretending a judgement call is
mechanical is how the record starts lying.
