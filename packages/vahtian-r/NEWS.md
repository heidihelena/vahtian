# vahtian 0.1.0

* First release.
* `vahtian_freeze()` / `vahtian_verify()` / `vahtian_content_hash()`: freeze a
  record set into a content-hashed, provenance-stamped, date-locked corpus and
  verify it (tamper-evident).
* `ledger()` / `ledger_append()` / `ledger_verify()`: a hash-chained,
  tamper-evident audit trail.
* The canonical format and content hash are byte-identical with the Python
  package 'vahtian', verified by a cross-language golden-hash test.
