# vahtian (Python)

Reproducible, provenance-first evidence tooling. **Freeze** a record set into a
content-hashed, provenance-stamped, date-locked corpus; **verify** reproducibility;
keep a **hash-chained audit trail**. Stdlib-only.

The same core and on-disk format exist in the R package **`vahtian`**, so a corpus
frozen in Python verifies in R and vice versa.

```python
import vahtian
corpus = vahtian.freeze(records, search_date="2026-06-23")
corpus.save("frozen-corpus")          # frozen-corpus.jsonl + .manifest.json
assert vahtian.verify(corpus)         # tamper-evident

L = vahtian.Ledger()
L.append("human:hha", "rate", {"record_id": "pmid:12345", "value": "supported"})
L.append("ai:opus/pv1", "advise", {"record_id": "pmid:12345", "value": "supported"})
assert L.verify()                     # retro-edits break the chain
```

**Compare** a claim against a cited source's finding, deterministically. An
assistant (AI or human — the ledger records which) reduces each to the same
structured `Assertion`; `compare()` is plain code that reports where the two
agree, conflict, or say nothing, and proposes a candidate label. A human makes
the decision — the comparator never does — and every step lands in the ledger.
It checks claim–source support, not truth.

```python
from dataclasses import asdict

claim  = vahtian.Assertion(outcome="all-cause mortality", direction="decrease",
                           effect_type="HR", effect_value=0.72,
                           quote="cut mortality (HR 0.72)")
source = vahtian.Assertion(outcome="all-cause mortality", direction="decrease",
                           effect_type="HR", effect_value=0.72, locator="table 2")

L.append("ai:opus/pv1", "extract_claim", asdict(claim))
L.append("ai:opus/pv1", "extract_source", asdict(source))
a = vahtian.compare(claim, source)    # deterministic; same inputs → same result
a.record(L)                           # candidate "aligned", hashes of both inputs
L.append("human:hha", "decide", {"decision": "supported",
                                 "candidate": a.candidate,
                                 "claim_hash": a.claim_hash})
assert L.verify()
```

A field carries not just a value but *why* it holds one. A plain value is taken
as explicitly stated and `None` as *not stated*; the other states are marked so
a single `None` never collapses them together:

```python
vahtian.Assertion(
    direction=vahtian.inferred("decrease"),   # inferred, not explicitly stated
    comparator=vahtian.not_applicable(),      # doesn't apply to this design
    effect_value=vahtian.extraction_failed(), # extractor couldn't read it
    outcome=vahtian.ambiguous("mortality"),   # stated, but ambiguously
)
```

An inferred field never reaches an `aligned` candidate without a human
confirming it, and an extraction failure stays distinct from source silence
(it routes back to extraction).

## Local MCP server

Expose the reproducibility core to an AI agent over MCP — running locally, on
your machine, over stdio. Nothing is uploaded; the agent calls the same
deterministic functions shown above. The agent proposes and records; the human
decides.

```bash
pip install "vahtian[mcp]"
vahtian-mcp            # runs the stdio MCP server
```

Connect it to an MCP client. Claude Code:

```bash
claude mcp add vahtian -- vahtian-mcp
```

Claude Desktop (`claude_desktop_config.json`):

```json
{ "mcpServers": { "vahtian": { "command": "vahtian-mcp" } } }
```

Tools (all local, deterministic, no network):

| Tool | What it does |
|---|---|
| `freeze_corpus` | Dedupe a record set, lock the search date, compute the content hash; optionally save the frozen corpus locally. |
| `verify_corpus` | Check a saved corpus is untampered, or that a record set reproduces an expected hash. |
| `resolve_record_id` | Return the stable identity (PMID > DOI > title-hash) for a record. |
| `audit_append` | Append one entry to a local, hash-chained audit ledger (append-only). |
| `audit_verify` | Verify a ledger's chain is intact — retro-edits and deletions fail. |

The server checks reproducibility and records who did what; it does not judge
evidence or establish truth.

`vahti` (Finnish) = sentinel / guard. Human-first. AI-second. Auditable. Apache-2.0.
