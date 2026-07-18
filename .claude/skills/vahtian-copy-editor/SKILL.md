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
  the number (28 checks), the artifact (a `.ris` file, a hash-chained trail).
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
- **The "That is not X. It is Y." reversal.** ("That is not a minor convenience.
  It is the point.") The July 2026 Learn audit found 10+ per section. At most one
  per page; recast the rest as plain assertions ("That durability is the point.").
- **The recycled CTA anecdote.** ("You wrote X, and a reviewer wrote back Y. That
  is not carelessness: … It does not decide Z. That stays yours.") Fine once; the
  audit found it byte-identical on three sibling pages. Check the pages this one
  links to — if a signature sentence or CTA shape repeats, vary this one.
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
- **The "X is the whole Y" aphoristic closer** — "that is the whole point", "which
  is the whole skill", "the asymmetry is the whole problem". A sentence engineered
  to land as a tidy summary. The July 2026 Learn sweep found the tells cluster in
  the sentences written to *close* a section, exactly where a model over-polishes.
  Cut the closer; the preceding sentence already made the point.
- **Formula pivots that recur across sibling pages** — "The fix is…", "The good
  news is…", a bold-lead-in every paragraph. Fine once; a tell when the same shape
  opens paragraphs on page after page. Vary or delete.
- **Cliché auto-writing** — "writes itself", "almost writes itself". Say the plain
  thing ("the case is easy to make").
- **Filler intensifiers** — "actually", "really", "truly", "genuinely" as emphasis
  crutches ("that is where your certainty actually lives"). Keep only where the word
  carries a real contrast ("what you *actually* did" vs claimed); drop the rest.
- **Bold-label:value lists masquerading as prose** — "Study. … Aim — narrow: …
  Recovery. … Prevention." A worked example decomposed into labelled fragments reads
  machine-generated; rewrite as two flowing sentences. (A genuine reference menu —
  five distinct copy-paste statements, a glossary — can keep its labels.)
- **Printable fill-in templates as filler** — a monospace `____` form that adds no
  value the reader would print. Cut it; a four-line inline checklist does the job.
- **Rhetorical questions as teaching** — "why does this paragraph earn its place?"
  Make it a declarative instruction.

**The one test:** would a busy clinician-researcher write this line in an email to
a colleague? If it sounds like a brochure, a pitch deck, or a press release, rewrite
it until it sounds like a person who knows the subject. Plainer is almost always more
credible — and this house style *is* plain by design.

**Note on the em-dash:** the site uses it deliberately for the pivot, and that's
correct — but AI overuses it. Two or more em-dashes in one short paragraph is a tell;
keep one, turn the other into a period or a semicolon.

## The fact pass — check before you polish

Craft cannot save a false sentence, and this audience checks. Every one of these
burned us in the July 2026 Learn audit; check them before wordsmithing:

- **Copyable commands must actually run.** Check every flag against the real CLI
  (`--help` or the argparse source in the repo). A published command that errors
  (`--model logistic_regression` did not exist) fails the reader at the payoff step.
- **Competitor claims come from competitor docs, not from memory.** We claimed
  NVivo/MAXQDA map nodes were dead drawings; their docs show one click opens the
  coded segments. Check the claim on their help pages, then sell the differentiator
  that survives (ours: plain files you own vs a proprietary project database).
- **Named frameworks must match their published structure** — or lose the name and
  own the idea ("our distillation"). Never describe a framework a reader can look
  up and not find.
- **"Studies show" needs a link.** Provenance or flag applies to our own copy: cite
  the actual study/review, or rewrite as reasoning from mechanism.
- **Verify every DOI before shipping — and dogfood our own tool to do it.** DOIs
  written from memory are frequently wrong or mismatched: the July 2026 Learn batch
  shipped a "research questions" citation whose DOI resolved to a *statistics* paper,
  and a correct-but-fragile Springer DOI that stalled on slow 4G. For each citation,
  check that the DOI resolves *and* points to the right paper — run the reference
  list through Vahtian's own free browser tool, `/reference-check/` (checks each DOI
  against Crossref, flags retractions, preprints, duplicates), the way a reader
  would; CiteVahti covers claim↔source support. Then **prefer a single-hop
  open-access URL over a publisher DOI that wraps the paper in a cookie/redirect
  handshake** — those stall on slow connections. Open-access on PubMed Central →
  link `pmc.ncbi.nlm.nih.gov/articles/PMCxxxxxxx/` (find the PMCID via the NCBI id
  converter; confirm OA with Unpaywall). Label every external citation `(open
  access)` or `(paywall)` so a reader on 4G knows before clicking. If we ask readers
  to check their citations, our own must survive the same check.
- **Platform-specific instructions are checked per platform.** macOS vs Windows
  menu paths, `python` vs `python3` — the reader on the other OS hits a wall.
- **No absolute the same page contradicts.** If the page later concedes the
  exception, write the mechanism instead of the absolute.

## The honest-limit budget

The caveat is voice, not fine print (above) — and it is also *rationed*. Each
limit appears **once per page**, with the benefit attached ("…so you can show
your working"). Never open a CTA with a negation — lead with what the reader
gets; the limit sits inside the close, once. This complements
`vahtian-brand-safety`: that skill requires the invariant be *visible*; this one
stops it being *repeated* until it reads as nervousness. One well-placed limit
does both jobs.

**A limit is a sentence, not a labelled box (founder-set, Heidi 2026-07-18).**
The July 2026 Learn build shipped a "The honest limit." callout box on every
page; Heidi read the *box* as AI slop — the label plus the formulaic "not X —
what it does is Y" body announced itself as boilerplate. Weave the limit into
the prose where it belongs instead, once, and never as a titled container. Keep
the honesty; drop the packaging.

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

1. **Run the fact pass first** — commands, competitor claims, framework names,
   "studies show", platform paths. A polished false sentence is worse than a
   clumsy true one.
2. Read the copy aloud (mentally); mark every place you stumble or skim.
3. Apply the rules above — cut first, rearrange second, rewrite last; count the
   honest limits (once per page, benefit attached, never opening the CTA).
4. **Run the AI-tell test** — scan for the banned vocabulary and the structural
   tells; if a line would sound like a brochure, rewrite it plainer.
5. Diff-check meaning: the edit must not add capability claims or strip a
   safety invariant. If meaning moved, flag it.
6. Hand the result to `vahtian-brand-safety` for the PASS gate. Copy ships
   only after PASS.

## Output format

- The edited copy.
- A short list of what changed and why (rule applied per change), calling out
  any **AI-tell** removed (word or structure).
- Anything flagged for `vahtian-brand-safety` attention (meaning shifted,
  new claim introduced).
