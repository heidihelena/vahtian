---
name: vahtian-brand-safety
description: Review Vahtian copy for research-integrity safety. Use when reviewing or writing Vahtian UI labels, product descriptions, agent-workflow text, documentation, prompts, GitHub READMEs, LinkedIn posts, ad copy, or landing pages. Preserves Vahtian's invariant — it assesses claim-source support and records auditable decisions; it does NOT certify truth, manuscript quality, publication readiness, or absence of problems. Catches overclaims and AI-as-judge framing before they ship.
---

# Vahtian brand-safety reviewer

This skill keeps the site from drifting into AI hype. Vahtian is built by a
clinician (MD, PhD); overclaiming is both a trust risk and a compliance risk.

**This is the single canonical home of the invariant and copy rules.** The
other skills (`vahtian-ux-auditor`, `vahtian-frontend-implementer`, `CLAUDE.md`)
defer here rather than restating them. In-repo source of truth for marketing
claims: `AD_CLAIMS.md` — on any conflict between this skill and `AD_CLAIMS.md`,
**`AD_CLAIMS.md` wins**; update this skill to match it, never the reverse.

## The invariant (never let copy break this)

> **Vahtian assesses whether a cited source supports a specific claim, and
> records who decided what — with a human first, AI second, and an auditable
> trail. It does NOT certify scientific truth, clinical validity, manuscript
> quality, publication readiness, or the absence of citation problems.**

Three rules that follow from it:

1. **The human decides.** AI is a *blinded second opinion the human can ignore*,
   offered only after the human has rated. Copy must never make AI the judge.
2. **Support, not truth.** Vahtian checks *whether the cited source supports the
   sentence* — not whether the sentence is true.
3. **No unbenchmarked accuracy claims.** No percentages, no "catches every…",
   no "reviewer-proof" — there is no published validation study.

## Forbidden / risky phrasings — flag every one

| ❌ Don't say | Why it's unsafe |
|---|---|
| "verifies truth", "fact-check your paper", "make sure your claims are correct" | Checks *support*, not truth |
| "guarantees", "proves", "100% safe", "never miss a bad citation" | Guarantee with no benchmark |
| "fully automated review", "AI decides", "AI checks your citations" | Makes AI the judge — breaks human-first |
| "publication-ready", "reviewer-proof" | Certifies publication suitability |
| "eliminates bias" | Overclaim; Vahtian *records* and *preserves disagreement* |
| "detects all citation errors", "99% accurate" | Accuracy claim without published study |
| "certifies evidence", "verify your science", "clinical validity" | Certification / truth framing |
| "anonymous" (for contributed data) | Always "**de-identified**"; contribution is opt-in, default-off |
| "future-proof", "will open in any editor in twenty years", "works forever" | Guarantee-shaped promise about longevity — say "most likely to still open", "opens in any editor **today**" |
| "studies show…", "most researchers find…" with no source | Evidence claim without provenance — cite it or rewrite as reasoning from mechanism |
| "NVivo/MAXQDA cannot do X" (or any competitor claim) unchecked | False competitor claims are the fastest trust kill with this audience — check the competitor's own docs; sell the differentiator that survives |

## Safer replacements — steer copy toward these

- "checks claim-source support" / "**run unit tests on your manuscript's citations**"
- "assesses whether the cited source supports the claim"
- "catch citations that don't support the sentence — and overstated claims"
- "records support decisions" / "an auditable trail you can show a supervisor or journal"
- "preserves disagreement" · "routes disagreement to adjudication"
- "supports blinded second review" · "the AI is a blinded second opinion you can ignore"
- "keeps the human decision visible" · "**You** decide."
- "local-first — your manuscript and ratings stay on your device" · "free beta · no account, no telemetry"

## How to review

1. Read every user-facing string in the diff (or the page).
2. For each, ask: does it imply Vahtian **decides truth**, **certifies** anything,
   makes **AI the judge**, or makes an **unbenchmarked accuracy/guarantee** claim?
3. If yes → quote the offending phrase, name which rule it breaks, propose the
   safer replacement from above (or one in the same spirit).
4. Confirm the safety invariants are still **visible** on the page, not removed in
   the name of "simplifying": local-first, human-first/AI-second, audit trail,
   and an explicit "does not decide scientific truth".
5. Where space allows, keep the honest caveat within reach:
   *"checks citation support, not truth."*
6. **Visible once is enough.** The invariant must appear on the page; it must
   not appear five times. If the same limit is restated to the point of reading
   as nervousness (the July 2026 Learn audit found up to six per page), that is
   a craft regression — flag it back to `vahtian-copy-editor` to consolidate
   into one statement with the benefit attached. Repetition adds no safety.

## Output format

- **Verdict:** PASS / CHANGES REQUIRED.
- **Violations:** quoted phrase → rule broken → safer replacement.
- **Missing invariants:** any of {local-first, human-first, audit trail, no truth
  certification} that a reader can no longer see.
- **Notes:** anything borderline worth a second look.

A change does not ship until this skill returns PASS.
