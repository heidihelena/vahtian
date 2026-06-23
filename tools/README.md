# Vahtian open tools

Agent-drivable, open, reproducible. Standard library only — no `pip install`, no account, no
network calls beyond the public research APIs each tool names.

## `vahtian_search.py` — open multi-source literature search → one frozen corpus

Turns one question into one **reproducible** corpus, so anyone can re-run the search:

```bash
python3 tools/vahtian_search.py outdir/
```

Outputs:
- `outdir/frozen-corpus.jsonl` — one record per paper: `record_id` (PMID > DOI > title-hash), title,
  abstract, per-source `provenance`, `search_date`. **Deduped** across all sources (PMID > DOI > title).
- `outdir/search-report.md` — per source: retrieved · relevant · net-new vs prior sources, plus a
  `content_hash` over the record set.

### Sources
PubMed/MEDLINE (NCBI E-utilities) · Europe PMC · Semantic Scholar · OpenAlex · forward/backward
**citation chasing** (Semantic Scholar).

**Login-gated databases (Embase, Web of Science, Scopus) are excluded by design** — their terms forbid
programmatic querying, and a search behind a subscription cannot be re-run by your readers. Open APIs +
citation chasing keep the whole search reproducible. (See [vahtian.com/agents](https://vahtian.com/agents/).)

### Adapting it to a new question
Edit the concept blocks at the top of the script (`PUBMED_QUERY`, `BLOCK_LUNG/PDL1/AI`, `SEEDS`).
**Run a MeSH check first** — verify each term maps to a real MeSH heading before trusting it. (Example
from the PD-L1 pilot: "PD-L1" is indexed as *"B7-H1 Antigen"[MeSH]*; "tumor proportion score" has **no**
MeSH heading and stays a text-word.)

Expect **high recall, modest precision** here — that is correct. Precision is the human's screening job,
not the search's. Conference abstracts and off-topic AI papers are removed at screening, never silently
dropped at search time.

## See also
- `vahtian_fulltext.py` (in the CiteVahti / MatchVahti tooling) — closes the open-access full-text loop.
- The [research-support skill](../skill/SKILL.md) — teaches an agent to drive these tools correctly.
