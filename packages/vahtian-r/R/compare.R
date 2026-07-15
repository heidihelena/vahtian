# Deterministic claim–source comparison — mirrors the Python `vahtian.compare`.
#
# An assistant (AI or human — the ledger records which) reduces a claim and a
# cited source's finding to the same structured assertion; vahtian_compare() —
# plain code, no model — reports field by field where the two agree, conflict,
# or say nothing, and proposes a candidate label for a human to accept or
# override. Assertion and assessment hashes reuse the package's canonical
# serialiser, so they are byte-identical with the Python package. It checks
# claim–source support, not truth.

.COMPARATOR_ID <- "vahtian-compare/1"

.FREE_TEXT <- c("population", "exposure", "comparator", "outcome")
.CONTROLLED <- c("direction", "effect_type")
.NUMERIC_F <- c("effect_value", "ci_low", "ci_high")

#' Build a structured assertion (one claim or source finding)
#'
#' Reduces a claim or a cited source's finding to comparable PICO-shaped
#' fields. Leave a field NULL when the text does not state it — the comparator
#' treats that as not_stated, never as agreement. quote and locator point back
#' to the exact words being formalised, so a human can check the reduction.
#' @param population,exposure,comparator,outcome free-text fields.
#' @param direction "increase", "decrease", or "no_difference".
#' @param effect_type e.g. "RR", "OR", "HR", "MD".
#' @param effect_value,ci_low,ci_high numeric fields.
#' @param quote exact words this assertion formalises.
#' @param locator where they appear (e.g. "abstract", "table 2").
#' @return an object of class "vahtian_assertion".
#' @examples
#' assertion(outcome = "all-cause mortality", direction = "decrease")
#' @export
assertion <- function(population = NULL, exposure = NULL, comparator = NULL,
                      outcome = NULL, direction = NULL, effect_type = NULL,
                      effect_value = NULL, ci_low = NULL, ci_high = NULL,
                      quote = NULL, locator = NULL) {
  structure(list(population = population, exposure = exposure,
                 comparator = comparator, outcome = outcome,
                 direction = direction, effect_type = effect_type,
                 effect_value = effect_value, ci_low = ci_low,
                 ci_high = ci_high, quote = quote, locator = locator),
            class = "vahtian_assertion")
}

.assertion_hash <- function(a) {
  paste0("sha256:", digest::digest(enc2utf8(.canonical(unclass(a))),
                                   algo = "sha256", serialize = FALSE))
}

# Python: " ".join(str(s).split()).lower()
.norm <- function(v) tolower(gsub("\\s+", " ", trimws(as.character(v))))

.text_status <- function(a, b, controlled) {
  if (is.null(a) || is.null(b)) return("not_stated")
  if (identical(.norm(a), .norm(b))) return("agrees")
  if (controlled) "conflicts" else "differs"
}

# Python: math.isclose(a, b, rel_tol=rel_tol) with abs_tol = 0
.numeric_status <- function(a, b, rel_tol) {
  if (is.null(a) || is.null(b)) return("not_stated")
  a <- as.numeric(a); b <- as.numeric(b)
  if (abs(a - b) <= rel_tol * max(abs(a), abs(b))) "agrees" else "conflicts"
}

#' Compare a claim assertion against a source assertion, deterministically
#'
#' Plain code, no model: reports field-by-field statuses (agrees / differs /
#' conflicts / not_stated / not_comparable) and derives a candidate label for
#' a human to accept or override — "conflicting" on any conflict; "aligned"
#' when direction and outcome agree with no conflicts and no free-text
#' divergence; otherwise "insufficient". Free-text wording differences never
#' count as conflict — the human judges whether the wording means the same
#' thing. Same inputs, same rel_tol, same comparator version give an
#' identical assessment, byte-compatible with the Python package.
#' @param claim a "vahtian_assertion" for the claim.
#' @param source a "vahtian_assertion" for the cited source's finding.
#' @param rel_tol relative tolerance for numeric agreement (recorded in the
#'   assessment).
#' @return an object of class "vahtian_assessment": claim_hash, source_hash,
#'   comparator, rel_tol, fields, candidate.
#' @examples
#' a <- vahtian_compare(assertion(outcome = "mortality", direction = "decrease"),
#'                      assertion(outcome = "mortality", direction = "decrease"))
#' a$candidate
#' @export
vahtian_compare <- function(claim, source, rel_tol = 0.01) {
  cell <- function(name, status) {
    list(status = status, claim = claim[[name]], source = source[[name]])
  }
  fields <- list()
  for (name in .FREE_TEXT)
    fields[[name]] <- cell(name, .text_status(claim[[name]], source[[name]], FALSE))
  for (name in .CONTROLLED)
    fields[[name]] <- cell(name, .text_status(claim[[name]], source[[name]], TRUE))
  et_conflict <- identical(fields$effect_type$status, "conflicts")
  for (name in .NUMERIC_F) {
    s <- if (et_conflict) "not_comparable"   # an RR is not an OR
         else .numeric_status(claim[[name]], source[[name]], rel_tol)
    fields[[name]] <- cell(name, s)
  }
  statuses <- vapply(fields, function(f) f$status, character(1))
  candidate <- if (any(statuses == "conflicts")) "conflicting"
    else if (identical(fields$direction$status, "agrees") &&
             identical(fields$outcome$status, "agrees") &&
             !any(statuses == "differs")) "aligned"
    else "insufficient"
  structure(list(claim_hash = .assertion_hash(claim),
                 source_hash = .assertion_hash(source),
                 comparator = .COMPARATOR_ID,
                 rel_tol = rel_tol,
                 fields = fields,
                 candidate = candidate),
            class = "vahtian_assessment")
}

#' Record a comparison run in a hash-chained audit ledger
#'
#' Appends the assessment (comparator version, tolerance, input hashes,
#' field statuses, candidate) as a ledger entry, actor = the comparator id.
#' The human decision is a separate entry the caller appends.
#' @param L a "vahtian_ledger".
#' @param assessment a "vahtian_assessment" from vahtian_compare().
#' @param ts timestamp string (optional; defaults to current UTC time).
#' @return the ledger with the comparison entry appended.
#' @examples
#' a <- vahtian_compare(assertion(outcome = "mortality"),
#'                      assertion(outcome = "mortality"))
#' L <- assessment_record(ledger(), a)
#' ledger_verify(L)
#' @export
assessment_record <- function(L, assessment, ts = NULL) {
  ledger_append(L, assessment$comparator, "compare", unclass(assessment), ts = ts)
}
