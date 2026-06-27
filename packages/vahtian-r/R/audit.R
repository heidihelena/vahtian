# Hash-chained, tamper-evident audit ledger — mirrors the Python `vahtian.audit`.
# Each entry hashes the previous entry's hash, so any retro-edit breaks the chain.

GENESIS <- paste0("sha256:", paste(rep("0", 64), collapse = ""))

.entry_hash <- function(prev_hash, body) {
  paste0("sha256:",
         digest::digest(enc2utf8(paste0(prev_hash, .canonical(body))),
                        algo = "sha256", serialize = FALSE))
}

#' Create an empty audit ledger
#'
#' Returns a new ledger with no entries; append to it with ledger_append().
#' @return an object of class "vahtian_ledger".
#' @examples
#' ledger_verify(ledger())
#' @export
ledger <- function() structure(list(entries = list()), class = "vahtian_ledger")

#' Append a hash-chained entry to a ledger
#'
#' Each entry hashes the previous entry's hash, so any later edit, reordering, or
#' deletion is detectable by ledger_verify().
#' @param L a "vahtian_ledger".
#' @param actor who acted, e.g. "human:hha" or "ai:opus/pv1".
#' @param action the action, e.g. "rate" or "advise".
#' @param payload a named list of details (optional).
#' @param ts timestamp string (optional; defaults to current UTC time).
#' @return the ledger with the new entry appended.
#' @examples
#' L <- ledger_append(ledger(), "human:hha", "rate", list(value = "supported"))
#' ledger_verify(L)
#' @export
ledger_append <- function(L, actor, action, payload = NULL, ts = NULL) {
  prev <- if (length(L$entries)) L$entries[[length(L$entries)]]$entry_hash else GENESIS
  body <- list(
    seq = length(L$entries),
    ts = ts %||% format(as.POSIXlt(Sys.time(), tz = "UTC")),
    actor = actor,
    action = action,
    payload = payload %||% structure(list(), names = character(0)),
    prev_hash = prev
  )
  entry <- c(body, list(entry_hash = .entry_hash(prev, body)))
  L$entries <- c(L$entries, list(entry))
  L
}

#' Verify a ledger's hash chain is intact
#'
#' Walks the chain and recomputes each entry hash; returns FALSE if any entry was
#' edited, reordered, or removed.
#' @param L a "vahtian_ledger".
#' @return TRUE if no entry has been edited, reordered, or removed.
#' @examples
#' L <- ledger_append(ledger(), "human", "rate", list(value = "supported"))
#' ledger_verify(L)
#' @export
ledger_verify <- function(L) {
  prev <- GENESIS
  for (e in L$entries) {
    body <- e[c("seq", "ts", "actor", "action", "payload", "prev_hash")]
    if (!identical(e$prev_hash, prev) || !identical(.entry_hash(prev, body), e$entry_hash))
      return(FALSE)
    prev <- e$entry_hash
  }
  TRUE
}
