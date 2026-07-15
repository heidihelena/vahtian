# Deterministic claim–source comparison — mirrors the Python `vahtian.compare`.
#
# An assistant (AI or human — the ledger records which) reduces a claim and a
# cited source's finding to the same structured assertion; vahtian_compare() —
# plain code, no model — reports field by field where the two agree, conflict,
# or say nothing, and proposes a candidate label for a human to accept or
# override. Assertion and assessment hashes reuse the package's canonical
# serialiser, so they are byte-identical with the Python package. It checks
# claim–source support, not truth.
#
# A field carries not just a value but *why* it holds one (or doesn't). A plain
# value is taken as explicitly stated; NULL means the source did not state it.
# The other epistemic states — extractor failed, not applicable to the study
# design, ambiguous in the source, or inferred rather than stated — are marked
# explicitly via extraction_failed(), not_applicable(), ambiguous(), and
# inferred(). A single NULL must not collapse these apart: an inferred field
# never counts toward an "aligned" candidate without a human confirming it, and
# an extraction failure routes back to extraction, not read as source silence.

.COMPARATOR_ID <- "vahtian-compare/2"

# ---- field epistemic states: why a field holds (or lacks) a value ----
.STATED <- "stated"
.NOT_STATED <- "not_stated"
.EXTRACTION_FAILED <- "extraction_failed"
.NOT_APPLICABLE <- "not_applicable"
.AMBIGUOUS <- "ambiguous"
.INFERRED <- "inferred"

.USABLE <- c(.STATED, .INFERRED)
# Most actionable absent state first: fix the extractor, then resolve ambiguity,
# then note structural non-applicability, then plain silence.
.ABSENT_ORDER <- c(.EXTRACTION_FAILED, .AMBIGUOUS, .NOT_APPLICABLE, .NOT_STATED)

.FREE_TEXT <- c("population", "exposure", "comparator", "outcome")
.CONTROLLED <- c("direction", "effect_type")
.NUMERIC_F <- c("effect_value", "ci_low", "ci_high")

.field <- function(value, state) structure(list(value = value, state = state),
                                           class = "vahtian_field")

#' Mark a field value as inferred, ambiguous, not applicable, or extraction-failed
#'
#' Wrap an assertion field to record *why* it holds (or lacks) a value, so a
#' single NULL does not collapse distinct states. A plain value is taken as
#' explicitly stated and NULL as not stated, so these helpers are only needed
#' for the other cases.
#' @param value the value read from the text, where one applies.
#' @return a "vahtian_field" wrapper for use in assertion().
#' @rdname field_states
#' @examples
#' assertion(direction = inferred("decrease"))
#' @export
inferred <- function(value) .field(value, .INFERRED)

#' @rdname field_states
#' @export
ambiguous <- function(value = NULL) .field(value, .AMBIGUOUS)

#' @rdname field_states
#' @export
not_applicable <- function() .field(NULL, .NOT_APPLICABLE)

#' @rdname field_states
#' @export
extraction_failed <- function() .field(NULL, .EXTRACTION_FAILED)

#' Build a structured assertion (one claim or source finding)
#'
#' Reduces a claim or a cited source's finding to comparable PICO-shaped fields.
#' A plain value is taken as explicitly stated; NULL means the source did not
#' state it. For the other epistemic states wrap the field with inferred(),
#' ambiguous(), not_applicable(), or extraction_failed(). quote and locator
#' point back to the exact words being formalised, so a human can check the
#' reduction.
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

# (value, state) for a raw field: a field wrapper passes through; NULL is
# not_stated; anything else is an explicitly stated value.
.resolve <- function(raw) {
  if (inherits(raw, "vahtian_field")) return(list(value = raw$value, state = raw$state))
  if (is.null(raw)) return(list(value = NULL, state = .NOT_STATED))
  list(value = raw, state = .STATED)
}

# Python: " ".join(str(s).split()).lower()
.norm <- function(v) tolower(gsub("\\s+", " ", trimws(as.character(v))))

.cell <- function(status, cv, sv, cs, ss) {
  list(status = status, claim = cv, source = sv, claim_state = cs, source_state = ss)
}

.compare_field <- function(claim_raw, source_raw, kind, et_conflict, rel_tol) {
  cr <- .resolve(claim_raw); sr <- .resolve(source_raw)
  cv <- cr$value; cs <- cr$state; sv <- sr$value; ss <- sr$state
  absent <- Filter(function(st) !(st %in% .USABLE), c(cs, ss))
  if (length(absent)) {                       # most actionable absent state wins
    status <- .ABSENT_ORDER[min(match(absent, .ABSENT_ORDER))]
    return(.cell(status, cv, sv, cs, ss))
  }
  if (identical(kind, "numeric") && et_conflict)
    return(.cell("not_comparable", cv, sv, cs, ss))
  status <- if (identical(kind, "free")) {
    if (identical(.norm(cv), .norm(sv))) "agrees" else "differs"
  } else if (identical(kind, "controlled")) {
    if (identical(.norm(cv), .norm(sv))) "agrees" else "conflicts"
  } else {
    a <- as.numeric(cv); b <- as.numeric(sv)
    if (abs(a - b) <= rel_tol * max(abs(a), abs(b))) "agrees" else "conflicts"
  }
  .cell(status, cv, sv, cs, ss)
}

#' Compare a claim assertion against a source assertion, deterministically
#'
#' Plain code, no model. Each field resolves to a value and an epistemic state;
#' when a field is not usable on at least one side its status is the most
#' actionable absent state (extraction_failed > ambiguous > not_applicable >
#' not_stated) rather than a bare "missing". Usable-vs-usable fields compare as
#' free-text (agrees / differs — wording differences are for the human, never a
#' conflict), controlled or numeric (agrees / conflicts), with a mismatched
#' effect type making numbers not_comparable. Candidate: any conflict giving
#' "conflicting"; "aligned" only when direction and outcome both agree and are
#' explicitly stated on both sides (never inferred), with no free-text
#' divergence and no unresolved field anywhere; otherwise "insufficient".
#' Byte-compatible with the Python package.
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
  fields <- list()
  for (name in .FREE_TEXT)
    fields[[name]] <- .compare_field(claim[[name]], source[[name]], "free", FALSE, rel_tol)
  for (name in .CONTROLLED)
    fields[[name]] <- .compare_field(claim[[name]], source[[name]], "controlled", FALSE, rel_tol)
  et_conflict <- identical(fields$effect_type$status, "conflicts")
  for (name in .NUMERIC_F)
    fields[[name]] <- .compare_field(claim[[name]], source[[name]], "numeric", et_conflict, rel_tol)

  statuses <- vapply(fields, function(f) f$status, character(1))
  key_stated <- all(vapply(list(fields$direction, fields$outcome),
                           function(c) identical(c$claim_state, .STATED) &&
                                       identical(c$source_state, .STATED), logical(1)))
  unresolved <- any(statuses %in% c(.EXTRACTION_FAILED, .AMBIGUOUS))
  candidate <- if (any(statuses == "conflicts")) "conflicting"
    else if (identical(fields$direction$status, "agrees") &&
             identical(fields$outcome$status, "agrees") &&
             key_stated && !any(statuses == "differs") && !unresolved) "aligned"
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
#' Appends the assessment (comparator version, tolerance, input hashes, field
#' statuses with per-side epistemic state, candidate) as a ledger entry, actor =
#' the comparator id. The human decision is a separate entry the caller appends.
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
