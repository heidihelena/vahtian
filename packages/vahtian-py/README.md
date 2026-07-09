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

`vahti` (Finnish) = sentinel / guard. Human-first. AI-second. Auditable. Apache-2.0.
