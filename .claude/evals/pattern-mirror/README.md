# Pattern Mirror calibration corpus

The negative control for `/pattern-mirror/`: prose that predates generative models,
written by a multilingual academic, against which the rules must stay quiet.

## Why this corpus and not another

AI detectors score this author's pre-2022 doctoral prose at around 60% "AI". The
published false-positive rate of seven detectors on TOEFL essays by non-native
writers is 61.3% (Liang et al., *Patterns* 2023). Those two facts are the reason
Pattern Mirror measures documented weaknesses in scientific prose and refuses to
measure authorship, and this corpus is how that refusal stays honest: a rule that
lights up careful multilingual academic writing has reproduced the bias in a new
costume, and it changes or it goes.

## Contents

`corpus/` holds excerpts from *Determinants of Respiratory Health* (Andersén H,
Tampere University Dissertations 598, 2022, ISBN 978-952-03-2399-8), used by the
author. Written and defended before ChatGPT was released.

| File | Section | Words |
|---|---|---|
| `abstract.txt` | Abstract | 568 |
| `intro.txt` | 1 Introduction | 383 |
| `litrev.txt` | 2.1 Respiratory symptoms | 379 |
| `disc_method.txt` | 6.1 Methodology | 647 |
| `disc_ineq.txt` | 6.6 Observed inequalities | 540 |
| `clean-methods.txt` | synthetic clean methods prose, citations and numerals | 101 |
| `article-learn.txt` | the Learn article, extracted from its own page | 1480 |

Section labels matter: the tool suppresses rules that do not apply to a section,
so each file must be run with the label in the table above. `run.mjs` holds the
labels; do not run these files by hand without them.

## What the run found (2026-07-28)

Four findings in 2517 words of thesis prose:

| Anchor | Rule | Reading |
|---|---|---|
| 6.6 P4 S7 | empty intensifier | "**Quite clearly**, we need new strategies…" A real find. |
| 6.1 P3 S3 | universal generalisation | "All individuals were born after the wars." True by the rule; the caveat covers it (the universal is about the author's own cohort). Awaiting the author's ruling. |
| 6.6 P2 S1 | parallelism overload | Three points enumerated with a repeated frame. A deliberate enumeration, which the caveat names. Awaiting the author's ruling. |
| 1 P3 | paragraph with nothing concrete | The aims paragraph: no number, no named thing, no citation. The caveat covers it ("a framing paragraph holding off on specifics on purpose"). Awaiting the author's ruling. |

**This count was wrong until `run.mjs` existed.** Both pages said three findings,
because the fourth was missed when the corpus was tallied by hand. That is the
argument for the runner in one line, and both pages now say four.

`clean-methods.txt` returns nothing. Deliberately formulaic prose (the page's own
example, 127 words) returns 13 findings.

### The Learn article, as a second kind of control

The thesis asks *does a rule stay quiet on good prose*. The article asks *does the
tool catch what it claims to catch, in prose written to a deadline by the person
who wrote the rules*. It is held to Structural and Language only: it is an essay,
and `/pattern-mirror/` says outright that the Evidence group over-fires on essays,
so its 18 Evidence findings are the tool being out of its range and are recorded
rather than budgeted.

Six Structural and Language findings remain, and all six are the article quoting
something on purpose: three name the measured words themselves ("delves",
"underscores", "intricate"), two quote bad sentences the article is holding up as
bad, and one is the disclaimer whose job is to state a range ("whether a person or
a machine wrote anything"). Each is covered by its rule's own `fine` line. If a
seventh appears, the article has drifted or a rule has.

**This is one run on one thesis. It is not a measured error rate**, and no number
derived from it belongs in copy: `AD_CLAIMS.md` rules out accuracy and percentage
claims without a published benchmark, and six files by one author is not one.

## Where the vocabulary list comes from

Not taste. Kobak, González-Márquez, Horvát and Lause counted word frequencies across
15 million PubMed abstracts from 2010 to 2024 and identified 900 excess words, 407 of
them style rather than content (*Science Advances* 2025;11(27):eadt3813, preprint
arXiv:2406.07016, data at github.com/berenslab/llm-excess-vocab). `excess-style-words.json`
holds all 407 with per-year counts recomputed here.

The 25 sharpest risers between 2022 and 2024:

| word | 2022 abstracts | 2024 abstracts | 2022 % | 2024 % | rise |
|---|---:|---:|---:|---:|---:|
| delves | 102 | 5,152 | 0.007 | 0.357 | 47.8× |
| delved | 52 | 1,018 | 0.004 | 0.071 | 18.5× |
| showcasing | 227 | 3,305 | 0.017 | 0.229 | 13.8× |
| underscores | 1,426 | 20,755 | 0.104 | 1.439 | 13.8× |
| meticulously | 217 | 2,401 | 0.016 | 0.167 | 10.5× |
| delving | 73 | 797 | 0.005 | 0.055 | 10.3× |
| delve | 276 | 2,834 | 0.020 | 0.197 | 9.7× |
| underscoring | 893 | 8,228 | 0.065 | 0.570 | 8.7× |
| surpassing | 448 | 3,998 | 0.033 | 0.277 | 8.4× |
| commendable | 80 | 698 | 0.006 | 0.048 | 8.3× |
| excels | 62 | 507 | 0.004 | 0.035 | 7.7× |
| intricacies | 206 | 1,664 | 0.015 | 0.115 | 7.7× |
| intricate | 1,832 | 14,315 | 0.134 | 0.993 | 7.4× |
| underscore | 2,286 | 16,539 | 0.167 | 1.147 | 6.8× |
| garnered | 813 | 5,267 | 0.059 | 0.365 | 6.1× |
| underscored | 459 | 2,833 | 0.034 | 0.196 | 5.8× |
| intricately | 235 | 1,417 | 0.017 | 0.098 | 5.7× |
| comprehending | 296 | 1,771 | 0.022 | 0.123 | 5.7× |
| groundbreaking | 197 | 1,177 | 0.014 | 0.082 | 5.7× |
| encompassed | 770 | 4,476 | 0.056 | 0.310 | 5.5× |
| emphasizing | 2,944 | 16,936 | 0.216 | 1.174 | 5.5× |
| realm | 621 | 3,260 | 0.045 | 0.226 | 5.0× |
| renowned | 297 | 1,540 | 0.022 | 0.107 | 4.9× |
| grappling | 71 | 368 | 0.005 | 0.025 | 4.9× |
| necessitating | 1,577 | 8,088 | 0.116 | 0.561 | 4.9× |

**Threshold: a rise of 3× or more**, which gives 78 words. That cut was chosen against
the thesis corpus in this directory: at 3× it produces **no hits at all** on 2517 words
of pre-2022 doctoral prose, and at 2× it produces two ("crucial", "highlights"). A cut
that flags careful academic writing is the wrong cut.

Only the subset that also has a plainer alternative is in the rule. A word rising in
frequency is not automatically weak writing: "offering" rose 4.7× and is a perfectly
ordinary word, so it is not flagged. The frequency data justifies *why a word is on the
list*, and the finding shown to the writer stays about the writing.

**The rise is not shown to the user and must never be.** A finding that says "this word
surged after ChatGPT" is an authorship claim with the label filed off, which is the one
thing this tool refuses to make. The numbers live here, in the documentation, as the
provenance of a rule.

## Em dashes are counted and not flagged

**Revised 2026-07-28 on the author's instruction: "Sometime you repeat too many
times, therefore the ai tells and words like actually should be counted. Em dashes
as well."** The section below still holds for *flagging* — no rule touches
punctuation, and none should. What changed is that counting and flagging are now
two different things.

Repetition is the part the per-sentence rules could not see. Each instance of
"actually" is one weak word; four of them in a page is the thing a reader actually
notices, and no finding anchored to one sentence shows it. So every marker the
rules recognise is tallied across the whole text with a rate per 100 words, in a
panel that carries no anchors and marks nothing wrong. Em dashes are in that panel
because a density is worth seeing.

The line that has to hold: a count is not an accusation, and the panel says so on
the page. If the em dash count ever acquires a threshold, a colour for "too many",
or a sentence implying what a high number means, it has become the thing this tool
refuses to be.

The count exposed a bug in the rule it reused. `intensifiers()` required whitespace
directly after the word, so "Actually, the reviewers agreed" and "Clearly, we need
X" never matched — the commonest empty use of both, and the exact example this
README uses to justify the `clearly` exemption. Optional punctuation now sits
between the word and the next one. The thesis corpus is unchanged by the fix.

## The original decision, which still governs flagging

Wikipedia's *Signs of AI writing* calls em dash overkill "probably the most infamous
tell". Vahtian's own house style avoids them (`AD_CLAIMS.md`, Punctuation). Neither is a
reason to flag them here. Em dash use is voice, it is the tell most likely to be wrong
about an individual writer, and Style and voice are out of scope for exactly that
reason. The house rule governs Vahtian's own copy; it does not govern a researcher's
manuscript.

## Four rules this corpus broke, and how they changed

1. **Citation detection** missed `(GINA, 2021; Scadding, 1959)`, so a sentence
   carrying two citations was reported as a claim with none. Any parenthesis
   containing a year now counts. The detector fails toward silence on purpose.
2. **"Very severe COPD"** was flagged as an empty intensifier. It is GOLD stage 4,
   as "very low" is a GRADE rating. Graded terms are vocabulary, not emphasis.
3. **"Significantly different between language groups"** was flagged in a
   Discussion, where the statistical suppression did not reach. It now follows the
   word rather than the section.
4. **Restatement** fired on a sentence that specified the one before it. Overlap
   alone cannot separate development from restatement, so the second sentence must
   now add little of its own as well.

## Two patterns the corpus could not catch, and a reader could

The thesis is pre-2022 prose, so it is a negative control: it proves a rule does not
fire where it should not. It cannot prove a rule fires where it should. Two patterns
sat in the rules unnoticed until the author read the Learn article and named them.

1. **The antithesis family was only checked inside one sentence.** Its commoner form
   is split across two: one sentence denies, the next supplies the replacement.
   "That is not a defensive posture. It is what good scientific writing was always
   supposed to be." The regex required both halves before a full stop, so every such
   pair in the article passed. `antithesis-split` is a pair rule, off in Results and
   Methods, where "The difference was not significant. It was 0.3 (95% CI…)" is a
   negative finding and its number.

   This is the likeliest explanation for the antithesis detector meeting a chapter
   said to hold about twenty and reporting none.

2. **The authenticity adverbs were not intensifiers.** "Genuinely", "honestly",
   "clearly", "obviously", "undeniably", "certainly": each asserts that the writer
   means it, which a manuscript already assumes. Added to the intensifier rule, not
   to the vocabulary rule, because that list is bound to Kobak's measured
   frequencies and these words are not in it. Craft rules need a reason; only the
   vocabulary rule needs a citation.

   `clearly` carries an exemption of the same shape as the GRADED one: "clearly
   visible", "clearly defined" describe how a thing was seen or drawn, which is
   information. "Clearly, we need X" is emphasis.

Neither change moves the thesis: the corpus produced the same four findings before
and after. Cost to the article: five sentences rewritten and five words cut.

## Syntactic form is not epistemic status

Reported 2026-07-28, from a run on a philosophy paper: 18 of 24 findings were
universal generalisations, and 14 of those were wrong. One rule dominating a
report that heavily is itself the signal.

All 14 fell into four roles, and in each the universal is legitimate:

| Role | Example | Why the rule was wrong |
|---|---|---|
| A stipulated definition | the paper's own C1/C2/C3 criteria | Universal by construction. There is nothing to cite it to. |
| A claim carrying its own bound | "Four are necessary: given the premises, a solver lacking them cannot solve the problem at all." | The bound the checker asked for was already in the sentence. |
| A hypothesis named, not asserted | the "Constraint" explanation, one of three the paper adjudicates | The claim is under test, not being made. |
| A falsification condition | five hits inside "How this account could be wrong" | Universals are the point: they are offered for refutation. |

Plus one AI-disclosure declaration, which is a statement about tools and not an
empirical claim about the world.

The fix reads role rather than shape. `DEFINE`, `BOUNDED`, `NAMED_POSITION` and
`DISCLOSURE` suppress the rule sentence by sentence. Headings open zones: a
paragraph of twelve words or fewer that does not end in a full stop and matches
the falsification vocabulary stands down the universal, hedge-stacking and
no-anchor rules for every paragraph under it, until the next heading. Hedge
stacking already carried "this is a limitations paragraph" as its `fine` line;
when the heading says so, the writer should not have to read that line twelve
times.

`corpus/roles.txt` is that report, reconstructed from the sentences quoted in it
— **not the paper itself, which is not in this repo.** Budget zero.

### And one detector bug, from the same report

The split-antithesis rule fired on:

> The world is not fully observed. **This is** the operative uncertainty.

Statement then label, not denial then replacement. The rule matched any "This
is" after any sentence containing a negation, without checking that the two
halves concerned the same thing. `DENY` now requires a determiner after the
negation, so the denial denies a *thing*: "not **a** defensive posture", "not
**a** writing problem". Bare-noun antitheses ("is not rhythm. It is
specificity") are missed as a result. That is the trade, and this detector fails
toward silence.

`corpus/antithesis-true.txt` is the mirror of `roles.txt`: two real split
antitheses with a floor of two, so a future tightening that silences the rule
fails the run. A corpus of negative controls can only catch over-firing; the
floor is what catches a rule going quiet.

## Running it

```bash
node .claude/evals/pattern-mirror/run.mjs           # corpus, summary table
node .claude/evals/pattern-mirror/run.mjs --full    # every finding, with its sentence
node .claude/evals/pattern-mirror/run.mjs FILE:section
```

`run.mjs` loads the rules out of `/pattern-mirror/index.html` itself and calls
`analyse()`. There is no second copy of the rules to drift, and a page that stops
parsing fails the run. Exit code 1 if a file goes over the budget recorded in the
script.

Re-run after any rule change and record what moved. A rule edit that adds a finding
here needs a reason written down; a rule edit that removes the "Quite clearly"
finding has broken something.

To refresh `corpus/article-learn.txt` after editing the article, re-extract its
`<main>` text — the file is a copy, and a stale copy passes while the page is broken.

## Adding to it

More pre-2022 academic prose is welcome, especially by writers in a second or third
language, and especially prose that is *weak* in documented ways. The corpus is not
a purity test: writing can be bad without a machine touching it, and the tool should
say so. What it must not do is flag careful prose for sounding foreign.
