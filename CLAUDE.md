# Vahtian — repo guide for Claude

Vahtian is a research-integrity toolkit for biomedical researchers (StudyVahti,
CiteVahti, ReviewVahti, …), built by a clinician (MD, PhD). This repo holds the
static marketing site (repo root, one `index.html` per product, deployed via
Cloudflare — no framework, no build step, zero external requests/trackers) and
the packages (`packages/vahtian-py/`, `packages/vahtian-r/`). `skill/` at the
repo root is a **shipped product artifact** (a distributable agent skill), not
internal tooling — don't confuse it with `.claude/skills/`.

## The invariant (applies to every edit, every session)

> **Vahtian assesses whether a cited source supports a specific claim, and
> records who decided what — with a human first, AI second, and an auditable
> trail. It does NOT certify scientific truth, clinical validity, manuscript
> quality, publication readiness, or the absence of citation problems.**

Never write or approve copy that makes AI the judge, certifies truth or
publication readiness, or claims unbenchmarked accuracy. The enforcement skill
is `.claude/skills/vahtian-brand-safety/` (full rules + phrase tables); the
canonical marketing-claims document is `AD_CLAIMS.md` — on conflict,
`AD_CLAIMS.md` wins.

## Which skill for what

| Task | Skill |
|---|---|
| Render / screenshot a page | `run-vahtian` (driver serves + shoots desktop/mobile PNGs) |
| Find UX problems (diagnose only) | `vahtian-ux-auditor` |
| Review or write any user-facing copy | `vahtian-brand-safety` — copy doesn't ship without PASS |
| Edit site HTML/CSS/JS | `vahtian-frontend-implementer` (smallest coherent change) |
| Add a page / site-wide quality pass | `vahtian-site` (meta, footer, sitemap, JSON-LD — CI gate: `.github/scripts/audit.sh`) |
| Release Python/R packages | `vahtian-publishing` (PyPI Trusted Publishing via `.github/workflows/publish.yml`) |
| Announce a shipped change (posts, release notes) | `vahtian-announcer` — drafts + queues; never posts without founder sign-off |
| Edit a copy skill's rules | run `node .claude/evals/run.mjs` first — CI gate: `.claude/evals/` |

Editing `vahtian-copy-editor` or `vahtian-brand-safety` is gated. The corpus in
`.claude/evals/copy/cases/` pins every copy rule to the failure that produced it,
so an edit that drops a rule a real regression paid for fails CI. Add a case
whenever a new copy problem is caught: `.claude/evals/README.md`.

## Content review — learn articles and blog posts (Heidi gate, since 2026-08-01)

- **Heidi approves every content page on the rendered preview, before merge.**
  Merge deploys to production, so merging is never the way to see the page.
  Every push to a PR branch builds a full preview site (Cloudflare Workers
  Builds); put the direct article preview URL in the PR body and in the queue
  row: `https://<branch-alias>-vahtian.heidi-andersen.workers.dev/<path>/`.
  Push the branch early so the preview exists while the article is written.
- **Never merge mid-correction.** Corrections land on the branch (same preview
  URL updates); Heidi approves the final rendered state, then merge.
- **Heidi-supplied text is canonical source material.** Her wording ships; the
  agent adds structure, links, and formatting around it. Any change to her
  wording is a flagged suggestion, never a silent rewrite. (#345/#346 lesson:
  an agent replaced her content and the live page briefly carried wrong facts.)
- The review queue lives in the Vahtian_OS vault: `30-revenue/Learn-Queue.md`
  (statuses `drafting` → `in-review [G]` → `approved` → `live`).

## Hard floor (even when no skill fires)

- No trackers, analytics, CDN fonts, or external requests on the site.
- No new dependencies or frameworks; match the existing inline-style idiom.
- Local-first, human-first/AI-second, and audit-trail messaging must survive
  every edit — look at rendered pages (via `run-vahtian`) before claiming a
  visual change works.
