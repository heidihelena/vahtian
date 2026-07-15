# vahtian 0.2.0

* Per-field epistemic states on `assertion()`: a plain value is explicitly
  stated and `NULL` is not stated, while `inferred()`, `ambiguous()`,
  `not_applicable()`, and `extraction_failed()` record the other reasons a
  field holds (or lacks) a value — so a single `NULL` no longer collapses
  distinct states. `vahtian_compare()` surfaces the most actionable absent
  state per field (extraction_failed > ambiguous > not_applicable > not_stated)
  and records each side's state in the assessment; an inferred key field never
  reaches an "aligned" candidate without a human, and an extraction failure is
  kept distinct from source silence. Comparator format bumped to
  `vahtian-compare/2`; the cross-language golden hash is updated in lockstep.

# vahtian 0.1.1

* `assertion()` / `vahtian_compare()` / `assessment_record()`: reduce a claim
  and a cited source's finding to the same structured assertion, compare them
  field by field (deterministic, no model), and record the run in the audit
  ledger. Assertion and assessment hashes are byte-identical with the Python
  package, covered by the cross-language golden-hash test. Checks claim–source
  support, not truth.

# vahtian 0.1.0

* First release.
* `vahtian_freeze()` / `vahtian_verify()` / `vahtian_content_hash()`: freeze a
  record set into a content-hashed, provenance-stamped, date-locked corpus and
  verify it (tamper-evident).
* `ledger()` / `ledger_append()` / `ledger_verify()`: a hash-chained,
  tamper-evident audit trail.
* The canonical format and content hash are byte-identical with the Python
  package 'vahtian', verified by a cross-language golden-hash test.
