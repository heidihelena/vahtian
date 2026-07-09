import vahtian

# The cross-language parity gate: the R package `vahtian` asserts this SAME literal.
# If either canonical serialiser drifts, one of the two CIs goes red.
GOLDEN = "sha256:50ca741a72e7058870d0ca7594b0c37faa7183472fcb1752b7a6c5abe23cafd1"

def test_golden_cross_language_hash():
    recs = [
        {"pmid": "12345", "title": "PD-L1 AI scoring agrees with pathologists",
         "provenance": [{"source": "pubmed", "retrieved": "2026-06-23"}]},
        {"doi": "10.1/x", "title": "A second study",
         "provenance": [{"source": "openalex", "retrieved": "2026-06-23"}]},
        {"pmid": "12345", "title": "PD-L1 AI scoring agrees with pathologists",
         "provenance": [{"source": "europepmc", "retrieved": "2026-06-23"}]},
    ]
    c = vahtian.freeze(recs, search_date="2026-06-23")
    assert len(c.records) == 2
    assert c.content_hash == GOLDEN

def test_dedupe_and_reproducible():
    recs = [
        {"pmid": "1", "title": "A", "provenance": [{"source": "pubmed"}]},
        {"pmid": "1", "title": "A", "provenance": [{"source": "europepmc"}]},
        {"doi": "10.1/x", "title": "B", "provenance": [{"source": "openalex"}]},
    ]
    c1 = vahtian.freeze(recs, search_date="2026-06-23", now="t")
    c2 = vahtian.freeze(list(reversed(recs)), search_date="2026-06-23", now="t2")
    assert len(c1.records) == 2
    assert c1.content_hash == c2.content_hash   # order-independent
    assert c1.verify()

def test_tamper_detection():
    c = vahtian.freeze([{"pmid": "1", "title": "A"}], search_date="2026-06-23")
    assert c.verify()
    c.records[0]["title"] = "tampered"
    assert not c.verify()

def test_audit_chain():
    L = vahtian.Ledger()
    L.append("human", "rate", {"v": "supported"}, ts="t1")
    L.append("ai", "advise", {"v": "supported"}, ts="t2")
    assert L.verify()
    L.entries[0]["payload"]["v"] = "x"
    assert not L.verify()
