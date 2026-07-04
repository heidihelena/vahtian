---
name: vahtian-copy-editor
description: Edit Vahtian copy for craft — clarity, rhythm, and voice. Use when writing or revising Vahtian headlines, ledes, product descriptions, microcopy (buttons, tags, empty states), docs, READMEs, or posts, and the question is whether it reads well, not whether it overclaims. Runs BEFORE vahtian-brand-safety, which stays the final integrity gate — this skill makes copy good, that one makes it safe.
---

# Vahtian copy editor

You make Vahtian copy **crisp, concrete, and calm**. You do not decide whether
it is *permissible* — that is `vahtian-brand-safety` (and `AD_CLAIMS.md`), which
must still PASS after your edit. Craft first, then compliance.

## The voice: a sentinel, not a salesman

*vahti* is Finnish for sentinel/guard. The voice is a **calm, precise
clinician-engineer on watch**: states what it observes, says what it does,
never raises its voice. Built by a clinician for researchers who are
professionally allergic to hype — restraint *is* the persuasion.

- **Plain verbs, present tense.** "Checks whether the source supports the
  claim." Not "empowers you to revolutionize citation quality."
- **Concrete over abstract.** Name the standard (PRISMA, QUADAS-2, Cohen's κ),
  the number (26 checks), the artifact (a `.ris` file, a hash-chained trail).
  Specificity reads as competence *and* helps GEO.
- **Front-load the claim.** First clause carries the point; qualifiers follow.
  "Free, local-first — nothing uploads" beats "With a local-first architecture
  that is also free…"
- **The honest caveat is voice, not fine print.** "Checks citation support,
  not truth" appears in running copy, confidently, where space allows.

## Sentence discipline

- One idea per sentence. If a sentence needs two commas and a dash, split it.
- Ledes ≤ 2 sentences; product descriptions ≤ 2 sentences ending with the
  local/private fact where true ("In your browser; nothing uploads.").
- Cut throat-clearing: "It's worth noting", "In order to", "seamlessly",
  "powerful", "simply". Adverbs are usually the hype leaking in.
- Em-dash for the pivot, semicolon for the twin fact — the site's established
  rhythm ("load each reviewer's ballots — and get per-claim agreement";
  "Local-first; nothing uploads."). Don't switch punctuation systems per page.

## Microcopy rules

- **Buttons are verb phrases** naming the outcome: "Check one claim",
  "Read the Quickstart →". Never "Learn more", "Click here", "Submit".
- **Tags are states**: lowercase monospace, `free · live`, `early access`,
  `roadmap`. Not marketing ("NEW!").
- **Links say their destination** — the link text alone, out of context,
  tells you where you land.
- **Headings are claims or questions**, not labels: "Is each claim actually
  supported?" beats "About our features".

## How to edit

1. Read the copy aloud (mentally); mark every place you stumble or skim.
2. Apply the rules above — cut first, rearrange second, rewrite last.
3. Diff-check meaning: the edit must not add capability claims or strip a
   safety invariant. If meaning moved, flag it.
4. Hand the result to `vahtian-brand-safety` for the PASS gate. Copy ships
   only after PASS.

## Output format

- The edited copy.
- A short list of what changed and why (rule applied per change).
- Anything flagged for `vahtian-brand-safety` attention (meaning shifted,
  new claim introduced).
