# Vahtian research-support skill

A drop-in skill that teaches an LLM/agent to do research-support work with Vahtian's open tools —
**human-first, reproducibly, auditably**.

[vahtian.com/agents](https://vahtian.com/agents/) · Apache-2.0 · [heidihelena/vahtian](https://github.com/heidihelena/vahtian)

## What it does

When a researcher is working with an agent (Claude Code, Claude Desktop, or any tool-using LLM), the
skill teaches the agent the open evidence pipeline and the invariants that keep its output trustworthy:

1. **Plan** — help draft PICOTS + eligibility (StudyVahti exports a machine-readable protocol)
2. **Search** — run `tools/vahtian_search.py` → one frozen, deduped, provenance-stamped corpus
3. **Screen, blinded** — rate papers against claims; the AI rating stays sealed until the human commits
4. **Reconcile** — inter-rater reliability (Cohen's κ, PABAK, AC1, Krippendorff's α) via ReviewVahti
5. **Retrieve** — open-access full text via FullVahti
6. **Check** — claim-by-source assessment with decision-gated, undoable Zotero write-back (CiteVahti)

The agent does the heavy lifting; the human keeps every judgement.

## Install

- **Claude Code / Superpowers-style skills:** copy `SKILL.md` into your skills directory (or point your
  skill loader at this folder). The agent picks it up by its `name`/`description` triggers.
- **Any agent:** paste `SKILL.md` as a system/instruction file. It is plain Markdown.

## The non-negotiables

- The human decides; the AI is a blinded, advisory second rater.
- No silent writes — preview → confirm → undoable.
- The AI is a fully-identified, separate tier — never an independent human assessor.
- Open, reproducible search only (no paywalled-database scraping).
- Honest about scope — an abstract sentence is a lead, not evidence.

See [`SKILL.md`](SKILL.md) for the full instructions.
