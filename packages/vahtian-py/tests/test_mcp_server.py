"""Tests for the local MCP server wrappers.

Skips where the optional 'mcp' dependency is absent (the default CI installs the
core without extras); runs wherever `pip install "vahtian[mcp]"` has been done.
"""
import json
import pytest

pytest.importorskip("mcp", reason="install the [mcp] extra to test the MCP server")

from vahtian import mcp_server as s  # noqa: E402


RECORDS = [
    {"pmid": "35692956", "title": "A", "provenance": [{"src": "pubmed"}]},
    {"doi": "10.1/X", "title": "B"},
    {"pmid": "35692956", "title": "A", "provenance": [{"src": "openalex"}]},  # dup of #1
]


def test_freeze_dedupes_and_hashes():
    m = s.freeze_corpus(RECORDS)
    assert m["n_records"] == 2  # duplicate merged by record_id
    assert m["content_hash"].startswith("sha256:")


def test_verify_reproduces_from_raw_records():
    m = s.freeze_corpus(RECORDS)
    good = s.verify_corpus(records=RECORDS, expected_content_hash=m["content_hash"])
    assert good["ok"] is True
    changed = s.verify_corpus(
        records=RECORDS + [{"pmid": "9", "title": "C"}],
        expected_content_hash=m["content_hash"],
    )
    assert changed["ok"] is False


def test_verify_requires_enough_arguments():
    with pytest.raises(ValueError):
        s.verify_corpus()


def test_freeze_and_verify_on_disk(tmp_path):
    pfx = str(tmp_path / "corpus")
    saved = s.freeze_corpus(RECORDS, save_to=pfx)
    assert "saved" in saved
    result = s.verify_corpus(path_prefix=pfx)
    assert result["ok"] is True
    assert result["n_records"] == 2


def test_resolve_record_id_prefers_pmid_then_doi():
    assert s.resolve_record_id({"pmid": "123", "doi": "10.1/x"})["record_id"] == "pmid:123"
    assert s.resolve_record_id({"doi": "10.1/X"})["record_id"] == "doi:10.1/x"


def test_audit_chain_appends_and_detects_tampering(tmp_path):
    led = str(tmp_path / "ledger.jsonl")
    s.audit_append(led, actor="human:hha", action="freeze", payload={"n": 2})
    second = s.audit_append(led, actor="ai:opus/v1", action="advise", payload={"note": "advisory"})
    assert second["n_entries"] == 2
    assert s.audit_verify(led)["ok"] is True

    lines = open(led).read().splitlines()
    entry = json.loads(lines[0])
    entry["actor"] = "someone-else"
    lines[0] = json.dumps(entry)
    open(led, "w").write("\n".join(lines) + "\n")
    assert s.audit_verify(led)["ok"] is False


def test_all_expected_tools_registered():
    import asyncio

    tools = asyncio.get_event_loop().run_until_complete(s.mcp.list_tools())
    assert sorted(t.name for t in tools) == [
        "audit_append",
        "audit_verify",
        "freeze_corpus",
        "resolve_record_id",
        "verify_corpus",
    ]
