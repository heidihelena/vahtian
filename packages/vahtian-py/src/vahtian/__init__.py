"""vahtian — reproducible, provenance-first evidence tooling.

Freeze a record set into a content-hashed, provenance-stamped, date-locked
corpus; verify reproducibility; keep a hash-chained audit trail. The same core
and on-disk format exist in the R package `vahtian`, so artifacts interoperate.

Human-first. AI-second. Auditable. Apache-2.0.
"""
from .provenance import Corpus, freeze, load, content_hash, record_id, SPEC_VERSION
from .audit import Ledger
from .compare import (Assertion, Assessment, Field, compare, COMPARATOR_ID,
                      inferred, ambiguous, not_applicable, extraction_failed)

__version__ = "0.2.0"
__all__ = ["Corpus", "freeze", "load", "verify", "content_hash", "record_id",
           "Ledger", "SPEC_VERSION", "__version__",
           "Assertion", "Assessment", "Field", "compare", "COMPARATOR_ID",
           "inferred", "ambiguous", "not_applicable", "extraction_failed"]


def verify(corpus: "Corpus") -> bool:
    """Convenience: vahtian.verify(corpus) == corpus.verify()."""
    return corpus.verify()
