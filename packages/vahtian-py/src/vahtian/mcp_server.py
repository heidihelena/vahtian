"""Local (stdio) MCP server for the Vahtian reproducibility core.

Exposes the deterministic, offline parts of `vahtian` as MCP tools an agent can
call: freeze a record set into a content-hashed, provenance-stamped corpus,
verify it is untampered, compute the reproducible content hash, resolve a stable
record id, and keep a hash-chained audit ledger.

Local-first by construction: every tool runs in this process on local data and
makes no network calls. Nothing is uploaded. The agent proposes; the human
decides — these tools record and verify, they do not judge evidence.

Run it:  `pip install "vahtian[mcp]"` then `vahtian-mcp` (stdio), or connect it
in an MCP client (Claude Code / Claude Desktop) pointing at the `vahtian-mcp`
command.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from .provenance import freeze, load, content_hash, record_id
from .audit import Ledger

try:
    from mcp.server.fastmcp import FastMCP
except ModuleNotFoundError as exc:  # pragma: no cover - guidance path
    raise SystemExit(
        "The MCP server needs the optional 'mcp' dependency. "
        'Install it with:  pip install "vahtian[mcp]"'
    ) from exc

mcp = FastMCP("vahtian")


@mcp.tool(
    annotations={
        "title": "Freeze an evidence corpus",
        "readOnlyHint": False,      # may write files when save_to is given
        "destructiveHint": False,
        "idempotentHint": True,     # same records → same hash and files
        "openWorldHint": False,     # local only, no network
    }
)
def freeze_corpus(
    records: list[dict[str, Any]],
    search_date: Optional[str] = None,
    save_to: Optional[str] = None,
) -> dict[str, Any]:
    """Dedupe a record set, lock the search date, and compute its content hash.

    Records are deduplicated by stable id (PMID > DOI > title-hash), provenance is
    merged across sources, and a reproducible sha256 content hash is computed —
    re-running the same search and re-freezing yields the same hash. Runs locally;
    nothing is uploaded.

    Args:
        records: The evidence records to freeze (each a JSON object; PMID/DOI/title
            used for identity, an optional "provenance" list is merged per record).
        search_date: ISO date the search was run (YYYY-MM-DD). Defaults to today.
        save_to: Optional local path prefix. If given, writes `<prefix>.jsonl` and
            `<prefix>.manifest.json` to disk.

    Returns:
        The corpus manifest: spec, n_records, search_date, content_hash, created,
        plus the written file paths when save_to is used.
    """
    corpus = freeze(records, search_date)
    result = dict(corpus.manifest())
    if save_to:
        corpus.save(save_to)
        result["saved"] = {
            "corpus": f"{save_to}.jsonl",
            "manifest": f"{save_to}.manifest.json",
        }
    return result


@mcp.tool(
    annotations={
        "title": "Verify a corpus is untampered",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def verify_corpus(
    path_prefix: Optional[str] = None,
    records: Optional[list[dict[str, Any]]] = None,
    expected_content_hash: Optional[str] = None,
) -> dict[str, Any]:
    """Check that a frozen corpus still matches its content hash (tamper-evident).

    Provide either a local `path_prefix` to a saved corpus, or `records` together
    with the `expected_content_hash` to check them against. Read-only; no network.

    Args:
        path_prefix: Local path prefix of a saved corpus (loads `<prefix>.jsonl`
            and `<prefix>.manifest.json`).
        records: In-memory records to verify (used with expected_content_hash).
        expected_content_hash: The hash the records must reproduce.

    In records mode, the check is a reproduction test: the records are frozen
    (deduped and canonicalised) and the resulting hash is compared to
    expected_content_hash.

    Returns:
        ok (bool), computed_hash, expected_hash, and n_records.
    """
    if path_prefix:
        corpus = load(path_prefix)
        return {
            "ok": corpus.verify(),
            "computed_hash": content_hash(corpus.records),
            "expected_hash": corpus.content_hash,
            "n_records": len(corpus.records),
        }
    if records is None or expected_content_hash is None:
        raise ValueError(
            "Provide either path_prefix, or both records and expected_content_hash."
        )
    # Reproduce the frozen hash: freezing dedupes and canonicalises, so passing the
    # original (pre-freeze) records still reproduces the corpus hash.
    corpus = freeze(records)
    return {
        "ok": corpus.content_hash == expected_content_hash,
        "computed_hash": corpus.content_hash,
        "expected_hash": expected_content_hash,
        "n_records": len(corpus.records),
    }


@mcp.tool(
    annotations={
        "title": "Resolve a stable record id",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def resolve_record_id(record: dict[str, Any]) -> dict[str, Any]:
    """Return the stable identity Vahtian uses for a record: PMID > DOI > title-hash.

    Useful for reasoning about deduplication before freezing. Read-only, local.

    Args:
        record: A single record object (uses its pmid, doi, or title).

    Returns:
        record_id.
    """
    return {"record_id": record_id(record)}


@mcp.tool(
    annotations={
        "title": "Append to a hash-chained audit ledger",
        "readOnlyHint": False,
        "destructiveHint": False,   # append-only; existing entries are never rewritten
        "idempotentHint": False,
        "openWorldHint": False,
    }
)
def audit_append(
    path: str,
    actor: str,
    action: str,
    payload: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Append one entry to a local, hash-chained audit ledger (creates it if new).

    Each entry hashes the previous entry, so any later edit or deletion breaks the
    chain and `audit_verify` will catch it. Append-only and local; existing entries
    are never rewritten. Records who did what, in order — it does not judge.

    Args:
        path: Local ledger file path (JSONL). Created if it does not exist.
        actor: Who performed the action (e.g. a person's id, or a labelled AI tier
            with model + version — an AI actor never counts as a human assessor).
        action: What was done (a short verb phrase).
        payload: Optional structured detail for the entry.

    Returns:
        The appended entry (seq, ts, actor, action, payload, prev_hash, entry_hash)
        and the total entry count.
    """
    ledger = _load_ledger(path)
    entry = ledger.append(actor, action, payload)
    ledger.save(path)
    return {"entry": entry, "n_entries": len(ledger.entries)}


@mcp.tool(
    annotations={
        "title": "Verify an audit ledger's chain",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
def audit_verify(path: str) -> dict[str, Any]:
    """Verify a local audit ledger's hash chain is intact (no edits or deletions).

    Read-only, local. Returns ok=false if any entry was retro-edited, reordered, or
    removed.

    Args:
        path: Local ledger file path (JSONL) to check.

    Returns:
        ok (bool) and n_entries.
    """
    ledger = _load_ledger(path)
    return {"ok": ledger.verify(), "n_entries": len(ledger.entries)}


def _load_ledger(path: str) -> Ledger:
    """Load an existing JSONL ledger into a Ledger, or return an empty one."""
    ledger = Ledger()
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    ledger.entries.append(json.loads(line))
    except FileNotFoundError:
        pass
    return ledger


def main() -> None:
    """Console entry point: run the stdio MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
