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
    "sha256:ad7b7194217b02072d56a2c0f1559c4ec2f1ffec5d2fac9f3fd4e52be3786c59"
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
  expect_identical(b$candidate, "insufficient")
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
