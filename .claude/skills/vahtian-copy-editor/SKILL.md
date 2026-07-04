---
name: vahtian-copy-editor
description: Edit Vahtian copy for craft — clarity, rhythm, voice, and stripping the tells that make writing read as AI-generated. Use when writing or revising Vahtian headlines, ledes, product descriptions, microcopy (buttons, tags, empty states), docs, READMEs, LinkedIn/launch posts, or any outbound copy, and the question is whether it reads well and sounds human, not whether it overclaims. Runs BEFORE vahtian-brand-safety, which stays the final integrity gate — this skill makes copy good, that one makes it safe.
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

## The AI-tell test — cut what makes copy read as machine-written

Researchers spot AI copy instantly, and it reads as *someone didn't bother*. For
this audience that is a trust cost, not just a style nit. Hunt these and cut them.

**Banned vocabulary** (the LLM-house-style words — replace with a plain verb or
delete): delve, dive in, elevate, unlock, harness, leverage, empower, streamline,
supercharge, seamless, robust, powerful, cutting-edge, game-changer, revolutionize,
transformative, unleash, foster, boost, embark, journey, landscape, realm,
tapestry, testament, navigate (figurative), pivotal, vibrant, bustling, ensure,
"in today's … world", "at the end of the day". If a word could sell any product,
it sells nothing here.

**Structural tells** (the giveaways are shapes, not just words):
- **The "not just X, but Y" / "it's not about X — it's about Y" pivot.** Overused
  by models. State the thing plainly instead.
- **"Whether you're a … or a …"** opener. Cut it; name the one reader you mean.
- **Rule-of-three padding** — "fast, simple, and powerful". One true adjective
  beats three decorative ones. (A *real* triad like OPA / sensitivity / specificity
  is content, not decoration — keep those.)
- **"Not only … but also", "Moreover / Furthermore / Additionally" chains.** Two
  short sentences beat one hinged clause.
- **Throat-clearing and summary bookends** — "It's worth noting that…",
  "In conclusion…", "Ultimately…", a closing sentence that restates the paragraph.
- **Symmetrical antithesis for its own sake** — "the human decides, the machine
  advises" is fine when it's *true and load-bearing*; a balanced flourish that adds
  no fact is not.
- **Fake enthusiasm** — "We're thrilled to…", "excited to announce". State what
  shipped.
- **Emoji as bullets or section markers, Title Case Headlines, and colon-stacked
  titles** ("SynthVahti: The Future of Synthesis"). None of these belong here.

**The one test:** would a busy clinician-researcher write this line in an email to
a colleague? If it sounds like a brochure, a pitch deck, or a press release, rewrite
it until it sounds like a person who knows the subject. Plainer is almost always more
credible — and this house style *is* plain by design.

**Note on the em-dash:** the site uses it deliberately for the pivot, and that's
correct — but AI overuses it. Two or more em-dashes in one short paragraph is a tell;
keep one, turn the other into a period or a semicolon.

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
3. **Run the AI-tell test** — scan for the banned vocabulary and the structural
   tells; if a line would sound like a brochure, rewrite it plainer.
4. Diff-check meaning: the edit must not add capability claims or strip a
   safety invariant. If meaning moved, flag it.
5. Hand the result to `vahtian-brand-safety` for the PASS gate. Copy ships
   only after PASS.

## Output format

- The edited copy.
- A short list of what changed and why (rule applied per change), calling out
  any **AI-tell** removed (word or structure).
- Anything flagged for `vahtian-brand-safety` attention (meaning shifted,
  new claim introduced).
