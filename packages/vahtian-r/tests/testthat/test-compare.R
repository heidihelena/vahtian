.claim <- function(...) {
  do.call(assertion, utils::modifyList(
    list(population = "adults with COPD", exposure = "triple therapy",
         comparator = "dual therapy", outcome = "all-cause mortality",
         direction = "decrease", effect_type = "HR", effect_value = 0.72,
         ci_low = 0.58, ci_high = 0.89),
    list(...)))
}

test_that("golden cross-language assessment hash matches the Python package", {
  # Same fixture as the Python test; the GOLDEN hash was computed by `vahtian` (Python).
  a <- vahtian_compare(.claim(quote = "cut mortality (HR 0.72)"),
                       .claim(locator = "table 2"))
  expect_identical(a$candidate, "aligned")
  expect_identical(
    a$claim_hash,
    "sha256:d7951f8a621551d5b5a9091a5007bf027b7b8871be1d2497580a152384bd2aa5"
  )
  payload_hash <- paste0("sha256:", digest::digest(enc2utf8(vahtian:::.canonical(unclass(a))),
                                                   algo = "sha256", serialize = FALSE))
  expect_identical(
    payload_hash,
    "sha256:d840fcbaf3f66ac061a7a63bb35e2f3bd3b2f58dcbf70a90a5cb412c1cd39219"
  )
})

test_that("direction conflict yields conflicting", {
  a <- vahtian_compare(.claim(direction = "decrease"), .claim(direction = "increase"))
  expect_identical(a$fields$direction$status, "conflicts")
  expect_identical(a$candidate, "conflicting")
})

test_that("numeric tolerance matches math.isclose semantics", {
  a <- vahtian_compare(.claim(effect_value = 0.72), .claim(effect_value = 0.92))
  expect_identical(a$fields$effect_value$status, "conflicts")
  b <- vahtian_compare(.claim(effect_value = 0.720), .claim(effect_value = 0.7205))
  expect_identical(b$fields$effect_value$status, "agrees")
})

test_that("mismatched effect types make numbers not_comparable", {
  a <- vahtian_compare(.claim(effect_type = "HR"), .claim(effect_type = "OR"))
  expect_identical(a$fields$effect_type$status, "conflicts")
  expect_identical(a$fields$effect_value$status, "not_comparable")
  expect_identical(a$candidate, "conflicting")
})

test_that("free-text wording differs, never conflicts; missing is not_stated", {
  a <- vahtian_compare(.claim(population = "adults with COPD"),
                       .claim(population = "COPD patients over 40"))
  expect_identical(a$fields$population$status, "differs")
  expect_identical(a$candidate, "insufficient")
  b <- vahtian_compare(assertion(outcome = "mortality", direction = "decrease"),
                       assertion(outcome = "mortality"))
  expect_identical(b$fields$direction$status, "not_stated")
  expect_identical(b$fields$direction$source_state, "not_stated")
  expect_identical(b$candidate, "insufficient")
})

test_that("epistemic states: inferred, extraction_failed, ambiguous, not_applicable", {
  # An inferred key field never reaches "aligned" without a human.
  inf <- vahtian_compare(.claim(direction = inferred("decrease")), .claim())
  expect_identical(inf$fields$direction$status, "agrees")
  expect_identical(inf$fields$direction$claim_state, "inferred")
  expect_identical(inf$candidate, "insufficient")

  # Extraction failure is distinct from the source simply not stating it.
  ef <- vahtian_compare(.claim(outcome = extraction_failed()), .claim())
  expect_identical(ef$fields$outcome$status, "extraction_failed")
  expect_identical(ef$candidate, "insufficient")
  expect_identical(vahtian_compare(.claim(outcome = NULL), .claim())$fields$outcome$status,
                   "not_stated")

  # Ambiguity blocks alignment; not_applicable on a non-key field is tolerated.
  amb <- vahtian_compare(.claim(direction = ambiguous("decrease")), .claim())
  expect_identical(amb$fields$direction$status, "ambiguous")
  expect_identical(amb$candidate, "insufficient")
  na <- vahtian_compare(.claim(comparator = not_applicable()),
                        .claim(comparator = not_applicable()))
  expect_identical(na$fields$comparator$status, "not_applicable")
  expect_identical(na$candidate, "aligned")
})

test_that("absent-state severity ordering (most actionable wins)", {
  a <- vahtian_compare(.claim(exposure = extraction_failed()), .claim(exposure = NULL))
  expect_identical(a$fields$exposure$status, "extraction_failed")
  b <- vahtian_compare(.claim(exposure = ambiguous()), .claim(exposure = not_applicable()))
  expect_identical(b$fields$exposure$status, "ambiguous")
})

test_that("full audit flow: extract, compare, decide — verifiable and tamper-evident", {
  claim <- .claim(quote = "cut mortality (HR 0.72)")
  finding <- .claim(locator = "table 2")
  L <- ledger()
  L <- ledger_append(L, "ai:model/x", "extract_claim", unclass(claim), ts = "t1")
  L <- ledger_append(L, "ai:model/x", "extract_source", unclass(finding), ts = "t2")
  a <- vahtian_compare(claim, finding)
  L <- assessment_record(L, a, ts = "t3")
  L <- ledger_append(L, "human:hha", "decide",
                     list(decision = "supported", candidate = a$candidate,
                          claim_hash = a$claim_hash, source_hash = a$source_hash),
                     ts = "t4")
  expect_true(ledger_verify(L))
  L$entries[[3]]$payload$candidate <- "aligned-forever"
  expect_false(ledger_verify(L))
})
