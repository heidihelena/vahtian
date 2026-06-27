# Frozen, provenance-stamped evidence corpus — the Vahtian reproducibility core.
#
# The canonical serialiser below reproduces Python's
# json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
# byte-for-byte, so content_hash() matches the Python package `vahtian` exactly.

`%||%` <- function(a, b) if (is.null(a)) b else a

# ---- canonical JSON (must match Python json.dumps sort_keys, compact, utf-8) ----

.json_string <- function(s) {
  s <- enc2utf8(as.character(s))
  cps <- utf8ToInt(s)
  esc <- vapply(cps, function(cp) {
    if (cp == 0x22) "\\\""
    else if (cp == 0x5C) "\\\\"
    else if (cp == 0x08) "\\b"
    else if (cp == 0x0C) "\\f"
    else if (cp == 0x0A) "\\n"
    else if (cp == 0x0D) "\\r"
    else if (cp == 0x09) "\\t"
    else if (cp < 0x20) sprintf("\\u%04x", cp)
    else intToUtf8(cp)
  }, character(1))
  paste0("\"", paste0(esc, collapse = ""), "\"")
}

.json_number <- function(x) {
  if (is.finite(x) && x == round(x) && abs(x) < 1e15) {
    return(format(x, scientific = FALSE, trim = TRUE, nsmall = 0))
  }
  format(x, scientific = FALSE, trim = TRUE)
}

.canonical <- function(x) {
  if (is.null(x)) return("null")
  if (is.list(x)) {
    nm <- names(x)
    if (!is.null(nm) && (length(x) == 0 || all(nzchar(nm)))) {       # object
      ks <- sort(nm)
      parts <- vapply(ks, function(k) paste0(.json_string(k), ":", .canonical(x[[k]])),
                      character(1))
      return(paste0("{", paste(parts, collapse = ","), "}"))
    }
    parts <- vapply(x, .canonical, character(1))                     # array
    return(paste0("[", paste(parts, collapse = ","), "]"))
  }
  if (is.logical(x) && length(x) == 1) return(if (isTRUE(x)) "true" else "false")
  if (is.character(x) && length(x) == 1) return(.json_string(x))
  if (is.numeric(x) && length(x) == 1) return(.json_number(x))
  if (length(x) > 1) {                                              # atomic vector -> array
    parts <- vapply(seq_along(x), function(i) .canonical(x[[i]]), character(1))
    return(paste0("[", paste(parts, collapse = ","), "]"))
  }
  stop("vahtian: cannot canonicalise value of class ", class(x))
}

.record_id <- function(rec) {
  if (!is.null(rec$pmid) && nzchar(as.character(rec$pmid)))
    return(paste0("pmid:", trimws(as.character(rec$pmid))))
  if (!is.null(rec$doi) && nzchar(as.character(rec$doi)))
    return(paste0("doi:", tolower(trimws(as.character(rec$doi)))))
  title <- tolower(trimws(as.character(rec$title %||% "")))
  paste0("title:", substr(digest::digest(enc2utf8(title), algo = "sha256", serialize = FALSE), 1, 16))
}

#' Content hash of a record set
#'
#' sha256 over records sorted by record id, each canonicalised and newline-terminated.
#' Byte-identical to the Python package `vahtian`.
#' @param records a list of records (each a named list).
#' @return a string like "sha256:...".
#' @examples
#' vahtian_content_hash(list(list(pmid = "1", title = "A")))
#' @importFrom digest digest
#' @export
vahtian_content_hash <- function(records) {
  ord <- records[order(vapply(records, .record_id, character(1)))]
  blob <- paste0(vapply(ord, function(r) paste0(.canonical(r), "\n"), character(1)),
                 collapse = "")
  paste0("sha256:", digest::digest(enc2utf8(blob), algo = "sha256", serialize = FALSE))
}

#' Freeze a record set into a content-hashed, provenance-stamped corpus
#'
#' Dedupes by record id (PMID > DOI > title-hash), merges and canonically sorts
#' provenance, locks the search date, and computes the content hash.
#' @param records list of records (named lists).
#' @param search_date ISO date string; defaults to today.
#' @param now timestamp string for the manifest; defaults to current UTC time.
#' @return an object of class "vahtian_corpus".
#' @examples
#' corpus <- vahtian_freeze(list(list(pmid = "1", title = "A")))
#' corpus$content_hash
#' @importFrom utils modifyList
#' @export
vahtian_freeze <- function(records, search_date = NULL, now = NULL) {
  by_id <- list()
  for (rec in records) {
    rid <- .record_id(rec)
    merged <- rec
    merged$record_id <- rid
    if (!is.null(by_id[[rid]])) {
      prov <- c(by_id[[rid]]$provenance %||% list(), merged$provenance %||% list())
      merged <- modifyList(by_id[[rid]], merged)
      merged$provenance <- prov
    }
    by_id[[rid]] <- merged
  }
  records <- unname(by_id)
  for (i in seq_along(records)) {
    prov <- records[[i]]$provenance
    if (is.list(prov) && length(prov) > 0) {
      keys <- vapply(prov, .canonical, character(1))
      records[[i]]$provenance <- prov[order(keys)]
    }
  }
  structure(
    list(records = records,
         search_date = search_date %||% as.character(Sys.Date()),
         content_hash = vahtian_content_hash(records),
         created = now %||% format(as.POSIXlt(Sys.time(), tz = "UTC"))),
    class = "vahtian_corpus"
  )
}

#' Verify a corpus is untampered
#'
#' Recomputes the content hash and compares it to the stored value.
#' @param corpus a "vahtian_corpus".
#' @return TRUE if the stored hash still matches the records.
#' @examples
#' corpus <- vahtian_freeze(list(list(pmid = "1", title = "A")))
#' vahtian_verify(corpus)
#' @export
vahtian_verify <- function(corpus) {
  identical(vahtian_content_hash(corpus$records), corpus$content_hash)
}
