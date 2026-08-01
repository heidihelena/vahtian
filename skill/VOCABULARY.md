# Vahtian vocabulary

The house names states in several places: `supports` / `contrasts` / `unclear`, `ok` / `no` / `nr`,
`addressed` / `gap`, `PASS` / `RISK` / `FAIL`. Some of those are one idea wearing different words.
Some are different things wearing the same word. Nothing said which, so a rule written against one
of them quietly failed to cover the others.

This file names the **objects**. It is short on purpose: a glossary longer than a page rots, and a
rotted glossary is worse than none, because rules go on citing definitions that have moved.

`node .claude/evals/vocabulary.mjs` checks the skills against it, deterministically and without a
model. It is what caught the collisions recorded below.

## Why objects rather than words

Every rule that failed review in the `presubmission-check` build failed the same way: the rule
banned a **word** while leaving the **object** reachable. Ban the checklist table, get twenty-two
numbered paragraphs. Ban the word "addressed", get an empty column the author fills in. The rule
that finally held named the thing itself, a complete item-ordered sweep the author can transcribe
without reading their own paper, and then no format mattered.

So: name what a state is *about*, then rules can be written against the thing instead of the label.

## The objects, and the states each takes

| Object | What it is | States | Who sets them | Defined in |
|---|---|---|---|---|
| **Support** | one claim against one cited source | `match_status`: supports / contrasts / overstated / unclear / not_relevant, and the finer `human_support_rating` | the human first, AI second and labelled | `~/matchvahti/schema/match_result.md` |
| **Resolution** | one reference against a public register | resolves / does not resolve / resolves to a different record / unchecked | the register, deterministically | `reference-check`, `skill/SKILL.md` |
| **Presence** | one element of a manuscript, such as a funding statement | addressed / gap / needs the author's judgement | wording detects, the human judges adequacy | `pre-submission-check`, `skill/presubmission-check/SKILL.md` |
| **Recoverability** | a planned design, before any data exists | PASS / RISK / FAIL | simulation | recoverlite, Design Pilot |
| **Copy gate** | a piece of copy against the claims rules | PASS / RISK | the brand-safety skill | `.claude/skills/vahtian-brand-safety/` |

### The collisions this file exists to stop

Found by running the checker, not by reading:

- **`PASS` means three things.** Recoverability of a design, a copy gate verdict, and, in
  "a twelve-page pass halved the prose", an editing sweep. Three objects, one token. When you write
  `PASS`, say what it is about, in the same sentence.
- **`not run` is not a state.** It describes a **step**, not a finding: no check happened, so there
  is nothing to be in a state at all. This is why it gets its own report section and never folds
  into a cleared count. Getting this wrong produced a report where a step that never happened read
  as a step that passed.
- **A `mark` is not a `finding`.** A finding is an observation, and an agent may make one. A mark is
  an attestation the author gives an editor, and only the author may set one. The two look identical
  on a screen and are completely different acts.

### The rule for a new state set

A new set is allowed when it rates an **object no existing set covers**, and the file that
introduces it says which object, in the same paragraph. It is drift when it rates an object that
already has a set. Support ratings in particular are **frozen**: map onto `match_status` and
`human_support_rating` rather than inventing a parallel scale, so results stay comparable across the
tools.

The presence set (addressed / gap / needs judgement) is a separate object, not a second support
scale. It rates whether an element of a manuscript is there, not whether a source supports a claim.

## Trust words, and the scope of the rule

Products record claim-to-source **support**, never truth. Copy says check, test, assess.

The rule governs **claims about research or about what a tool establishes**. It does not govern an
engineer's note that a command was checked. "Verified working this session" in a build skill is a
statement about a command, not about science, and the checker scopes accordingly: shipped skills
under `skill/` carry product claims and are checked; `.claude/skills/` is internal tooling and is
checked only where it quotes product copy.

`verifyChain`, `verifyAudit` and `verify()` stay as identifiers. Their UI labels still say check.

## Use and mention

A skill that forbids a phrase has to contain the phrase. The first run of the checker flagged twenty
trust words and every one was a prohibition: rows in brand-safety's table of banned phrases, and a
`Never write "..."` whose negation had wrapped onto the previous line. A checker that counts those
is not strict, it is broken, and it teaches everyone to ignore its output.

So both the checker and any rule written from this file distinguish a phrase being **used** from a
phrase being **named**. Quotes, table rows of banned phrases, and a prohibition anywhere in the
sentence all mark a mention.

## Anchors

A definition here can name the file it governs, so it cannot rot unnoticed. The checker asserts each
anchored phrase still appears verbatim in its file, the same gate `.claude/evals/run.mjs` uses for
the copy corpus.

<!-- anchor: skill/presubmission-check/SKILL.md :: Never re-implement a Vahtian browser tool and report the result as a Vahtian run. -->
<!-- anchor: skill/presubmission-check/SKILL.md :: *Not run* is not a fourth state, because it describes a **step** rather than a finding -->
<!-- anchor: skill/SKILL.md :: Document the workflow; never assert scientific truth, and never let yourself become the decider. -->
