# Vahtian SEO + copy standard

The company standard for every page's **`<title>`, meta `description`, and heading
structure**. It sits on top of the two voice authorities and never overrides them:

- **Voice + craft:** `.claude/skills/vahtian-copy-editor` (how copy should read).
- **Claims + safety:** `.claude/skills/vahtian-brand-safety` and `AD_CLAIMS.md`
  (what copy is allowed to say). On any conflict, **`AD_CLAIMS.md` wins**.

The `vahtian-voice-seo` agent (`.claude/agents/vahtian-voice-seo.md`) applies this
standard. This document is what it enforces; update the doc first, then the agent.

---

## The invariant (load-bearing, never trade away for a keyword)

> Vahtian assesses whether a cited source **supports** a specific claim, and records
> who decided what — human first, AI second, with an auditable trail. It does **not**
> certify scientific truth, clinical validity, manuscript quality, publication
> readiness, or the absence of problems.

Every title and description ladders up to *support, recorded, auditable* — never
*truth, proof, guarantee*.

---

## `<title>`

- **Length:** aim **50–60 characters**, hard ceiling **65** (Google truncates ~60).
- **Unique** across the whole site (no two pages share a title).
- **Front-load the primary term.** The first ~40 chars carry the searchable phrase,
  because that is what shows in a narrow SERP. `CiteVahti — check a source supports a
  claim` beats `The tool that helps you with citations, called CiteVahti`.
- **One separator system.** Pivot inside the title with a **comma** (house voice —
  Heidi does not type em-dashes; the default pivot is a comma). Close with a
  **middle-dot suffix**:
  - Product / tool / kit pages → `… · Vahtian`
  - Learn articles → `… · Vahtian Learn`
  - Blog posts → `… · Vahtian Blog`
  Do not mix `|`, ` — `, and ` · ` for the suffix; the suffix separator is ` · `.
- **No hype adjectives** (best, ultimate, revolutionary, powerful) and **no
  overclaim verbs** (verify, prove, guarantee, ensure).

## Meta `description`

- **Length:** aim **140–155 characters**, hard ceiling **160**, floor **70**
  (Google truncates ~155–160; under 70 wastes the slot).
- **Unique** across the site.
- **One or two complete sentences**, ending at a sentence boundary — never a
  mid-clause cut or a trailing ellipsis.
- **Front-load the value + primary keyword** in the first sentence; a page must be
  describable from its first sentence alone.
- **Name one concrete specific** where it fits — a standard (PRISMA, QUADAS-2,
  COREQ, Cohen's κ), a number (28 checks), or an artifact (a `.ris` file, a
  hash-chained trail). Specificity reads as competence and helps GEO/AI answers.
- **Keep the honest caveat** where the source page carries one ("checks support,
  not truth", "aggregates only", "nothing uploads"). Trimming length must never
  drop a hedge and leave a bare claim.
- **House voice:** plain present-tense verbs, comma pivots not em-dashes, no AI
  tells (no "delve", "seamless", "empower", "in today's fast-paced…").

## Headings

- **Exactly one `<h1>`** per page (the app-generated download/report documents that
  live inside a template string are out of scope — only the live page DOM counts).
- The `<h1>` states the page's **primary promise/keyword**, aligned with the title.
- **No level skips** in the live document (`h1 → h2 → h3`, never `h1 → h3`). Card
  grids that used `h3` for visual size should use the correct level and be sized with
  CSS.
- Section headings are **descriptive**, not clever-only — a reader scanning headings
  should understand the page. A Marksy/handwritten accent heading is fine as long as
  the words still describe the section.

---

## Hard rules (a rewrite that breaks one is rejected, no matter how good the SEO)

1. **Support, not truth.** Never "verify/prove/guarantee/fact-check/ensure accuracy"
   in a title or description. The house verbs are **check / test / assess**.
2. **Human first, AI second.** Never frame AI as the judge or as "checking your
   citations for you".
3. **No unbenchmarked numbers.** No accuracy %, no "catches every…", no user counts —
   there is no published validation study. Deterministic counts that the code backs
   (28 dictionary checks, 7 audit questions) are allowed.
4. **CiteVahti's `[oo]` label is "accepted", never "verified"** (frozen since v0.16).
5. **Local-first / nothing-uploads** claims stay accurate to the specific page.

---

## Definition of done for a page

- Title ≤ 65 chars, unique, front-loaded, ` · Vahtian[/ Learn/ Blog]` suffix.
- Description 70–160 chars, unique, complete sentence(s), keyword front-loaded, a
  concrete specific where natural, every hedge preserved.
- One live `<h1>`, no heading-level skips.
- `vahtian-brand-safety` would PASS the new title and description.
- `bash .github/scripts/audit.sh` stays green (description/canonical/OG/JSON-LD
  present; internal links resolve).
