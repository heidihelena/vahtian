test_that("golden cross-language hash matches the Python package byte-for-byte", {
  # Same fixture as the Python test; the GOLDEN hash was computed by `vahtian` (Python).
  recs <- list(
    list(pmid = "12345", title = "PD-L1 AI scoring agrees with pathologists",
         provenance = list(list(source = "pubmed", retrieved = "2026-06-23"))),
    list(doi = "10.1/x", title = "A second study",
         provenance = list(list(source = "openalex", retrieved = "2026-06-23"))),
    list(pmid = "12345", title = "PD-L1 AI scoring agrees with pathologists",
         provenance = list(list(source = "europepmc", retrieved = "2026-06-23")))
  )
  corpus <- vahtian_freeze(recs, search_date = "2026-06-23", now = "fixed")
  expect_equal(length(corpus$records), 2L)              # deduped by record id
  expect_identical(
    corpus$content_hash,
    "sha256:50ca741a72e7058870d0ca7594b0c37faa7183472fcb1752b7a6c5abe23cafd1"
  )
  expect_true(vahtian_verify(corpus))
})

test_that("reproducible independent of source order", {
  recs <- list(
    list(pmid = "1", title = "A", provenance = list(list(source = "pubmed"))),
    list(pmid = "1", title = "A", provenance = list(list(source = "europepmc")))
  )
  a <- vahtian_freeze(recs, search_date = "2026-06-23", now = "t")
  b <- vahtian_freeze(rev(recs), search_date = "2026-06-23", now = "t2")
  expect_identical(a$content_hash, b$content_hash)
})

test_that("tamper detection", {
  corpus <- vahtian_freeze(list(list(pmid = "1", title = "A")), search_date = "2026-06-23")
  expect_true(vahtian_verify(corpus))
  corpus$records[[1]]$title <- "tampered"
  expect_false(vahtian_verify(corpus))
})

test_that("audit chain detects retro-edits", {
  L <- ledger()
  L <- ledger_append(L, "human", "rate", list(v = "supported"), ts = "t1")
  L <- ledger_append(L, "ai", "advise", list(v = "supported"), ts = "t2")
  expect_true(ledger_verify(L))
  L$entries[[1]]$payload$v <- "x"
  expect_false(ledger_verify(L))
})
