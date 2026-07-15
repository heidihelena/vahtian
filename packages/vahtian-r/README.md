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

**Compare** a claim against a cited source's finding, deterministically. An
assistant (AI or human — the ledger records which) reduces each to the same
structured assertion; `vahtian_compare()` is plain code that reports where the
two agree, conflict, or say nothing, and proposes a candidate label. A human
makes the decision — the comparator never does — and every step lands in the
ledger. It checks claim–source support, not truth.

```r
claim  <- assertion(outcome = "all-cause mortality", direction = "decrease",
                    effect_type = "HR", effect_value = 0.72,
                    quote = "cut mortality (HR 0.72)")
source <- assertion(outcome = "all-cause mortality", direction = "decrease",
                    effect_type = "HR", effect_value = 0.72, locator = "table 2")

L <- ledger_append(L, "ai:opus/pv1", "extract_claim",  unclass(claim))
L <- ledger_append(L, "ai:opus/pv1", "extract_source", unclass(source))
a <- vahtian_compare(claim, source)   # deterministic; same inputs, same result
L <- assessment_record(L, a)          # candidate "aligned", hashes of both inputs
L <- ledger_append(L, "human:hha", "decide",
                   list(decision = "supported", candidate = a$candidate,
                        claim_hash = a$claim_hash))
stopifnot(ledger_verify(L))
```

Assertion and assessment hashes are byte-identical with the Python package —
the same golden-hash gate covers `vahtian_compare()` in both CIs.

## Install

```r
# R-universe (continuous builds):
install.packages("vahtian", repos = "https://heidihelena.r-universe.dev")
```

`vahti` (Finnish) = sentinel / guard. Human-first. AI-second. Auditable. Apache-2.0.
