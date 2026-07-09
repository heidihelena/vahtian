"""Frozen, provenance-stamped evidence corpus — the Vahtian reproducibility core.

A corpus is a deduped set of records, each carrying per-source provenance and a
locked search date, summarised by a content hash. Re-running the search and
re-freezing must reproduce the same hash; verify() proves it (tamper-evident).

The on-disk format (frozen-corpus.jsonl + .manifest.json) is shared byte-for-byte
with the R package, so a corpus frozen in Python verifies in R and vice versa.
"""
from __future__ import annotations
import json, hashlib
from dataclasses import dataclass, field, asdict
from datetime import date, datetime, timezone

SPEC_VERSION = "vahtian-corpus/1"


def record_id(rec: dict) -> str:
    """Stable identity: PMID > DOI > title-hash. Matches the R implementation."""
    if rec.get("pmid"):
        return f"pmid:{str(rec['pmid']).strip()}"
    if rec.get("doi"):
        return "doi:" + str(rec["doi"]).strip().lower()
    title = (rec.get("title") or "").strip().lower()
    return "title:" + hashlib.sha256(title.encode("utf-8")).hexdigest()[:16]


def _canonical(obj) -> str:
    # Deterministic serialisation: sorted keys, no whitespace, UTF-8.
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def content_hash(records: list[dict]) -> str:
    """sha256 over records sorted by record_id — order-independent, reproducible."""
    ordered = sorted(records, key=record_id)
    h = hashlib.sha256()
    for r in ordered:
        h.update(_canonical(r).encode("utf-8"))
        h.update(b"\n")
    return "sha256:" + h.hexdigest()


@dataclass
class Corpus:
    records: list[dict]
    search_date: str
    content_hash: str
    created: str = field(default="")
    spec: str = SPEC_VERSION

    def verify(self) -> bool:
        """True iff the stored content_hash still matches the records (untampered)."""
        return content_hash(self.records) == self.content_hash

    def manifest(self) -> dict:
        return {"spec": self.spec, "n_records": len(self.records),
                "search_date": self.search_date, "content_hash": self.content_hash,
                "created": self.created}

    def save(self, path_prefix: str) -> None:
        with open(path_prefix + ".jsonl", "w", encoding="utf-8") as f:
            for r in sorted(self.records, key=record_id):
                f.write(_canonical(r) + "\n")
        with open(path_prefix + ".manifest.json", "w", encoding="utf-8") as f:
            f.write(json.dumps(self.manifest(), indent=2))


def freeze(records: list[dict], search_date: str | None = None, *, now: str | None = None) -> Corpus:
    """Dedupe by record_id, lock the search date, compute the content hash."""
    by_id: dict[str, dict] = {}
    for rec in records:
        rid = record_id(rec)
        merged = dict(rec); merged["record_id"] = rid
        if rid in by_id:  # merge provenance across sources
            prov = by_id[rid].get("provenance", []) + merged.get("provenance", [])
            merged = {**by_id[rid], **merged, "provenance": prov}
        by_id[rid] = merged
    records = list(by_id.values())
    for r in records:                       # canonicalise provenance order so the hash
        prov = r.get("provenance")          # is independent of source arrival order
        if isinstance(prov, list):
            r["provenance"] = sorted(prov, key=_canonical)
    sd = search_date or date.today().isoformat()
    return Corpus(records=records, search_date=sd,
                  content_hash=content_hash(records),
                  created=now or datetime.now(timezone.utc).isoformat())


def load(path_prefix: str) -> Corpus:
    records = []
    with open(path_prefix + ".jsonl", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    with open(path_prefix + ".manifest.json", encoding="utf-8") as f:
        m = json.load(f)
    return Corpus(records=records, search_date=m["search_date"],
                  content_hash=m["content_hash"], created=m.get("created", ""),
                  spec=m.get("spec", SPEC_VERSION))
