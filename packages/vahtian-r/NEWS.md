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
