import vahtian

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
