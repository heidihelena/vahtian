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

Section labels matter: the tool suppresses rules that do not apply to a section,
so each file must be run with the label in the table above.

## What the run found (2026-07-28)

Three findings in 2517 words of thesis prose:

| Anchor | Rule | Reading |
|---|---|---|
| 6.6 P4 S7 | empty intensifier | "**Quite clearly**, we need new strategies…" A real find. |
| 6.1 P3 S3 | universal generalisation | "All individuals were born after the wars." True by the rule; the caveat covers it (the universal is about the author's own cohort). Awaiting the author's ruling. |
| 6.6 P2 S1 | parallelism overload | Three points enumerated with a repeated frame. A deliberate enumeration, which the caveat names. Awaiting the author's ruling. |

`clean-methods.txt` returns nothing. Deliberately formulaic prose (the page's own
example, 127 words) returns 13 findings.

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

## Em dashes are not flagged, on purpose

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

## Running it

```bash
# from the repo root, with the page served or via the harness
node .claude/skills/run-vahtian/driver.mjs /pattern-mirror
```

There is no automated runner for this corpus yet. Until there is, re-run it by hand
after any rule change and record what moved. A rule edit that adds a finding here
needs a reason written down; a rule edit that removes the "Quite clearly" finding
has broken something.

## Adding to it

More pre-2022 academic prose is welcome, especially by writers in a second or third
language, and especially prose that is *weak* in documented ways. The corpus is not
a purity test: writing can be bad without a machine touching it, and the tool should
say so. What it must not do is flag careful prose for sounding foreign.
