# vahtian (R)

Reproducible, provenance-first evidence tooling. **Freeze** a record set into a
content-hashed, provenance-stamped, date-locked corpus; **verify** reproducibility;
keep a **hash-chained audit trail**.

The canonical format and `content_hash` are **byte-identical** with the Python
package [`vahtian`](https://pypi.org/project/vahtian/) — a corpus frozen in Python
verifies in R and vice versa. A golden-hash parity test runs in both languages' CI.

```r
recs <- list(
  list(pmid = "12345", title = "PD-L1 AI scoring agrees with pathologists",
       provenance = list(list(source = "pubmed", retrieved = "2026-06-23")))
)
corpus <- vahtian_freeze(recs, search_date = "2026-06-23")
stopifnot(vahtian_verify(corpus))           # tamper-evident

L <- ledger()
L <- ledger_append(L, "human:hha", "rate",   list(record_id = "pmid:12345", value = "supported"))
L <- ledger_append(L, "ai:opus/pv1", "advise", list(record_id = "pmid:12345", value = "supported"))
stopifnot(ledger_verify(L))                  # retro-edits break the chain
```

## Install

```r
# R-universe (continuous builds):
install.packages("vahtian", repos = "https://heidihelena.r-universe.dev")
```

`vahti` (Finnish) = sentinel / guard. Human-first. AI-second. Auditable. Apache-2.0.
