"""Hash-chained, tamper-evident audit ledger — who did what, in order.

Each entry hashes the previous entry's hash, so any retro-edit or deletion breaks
the chain and verify() catches it. Shared format with the R package.
"""
from __future__ import annotations
import json, hashlib
from datetime import datetime, timezone

GENESIS = "sha256:" + "0" * 64


def _canonical(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _entry_hash(prev_hash: str, body: dict) -> str:
    h = hashlib.sha256()
    h.update(prev_hash.encode("utf-8"))
    h.update(_canonical(body).encode("utf-8"))
    return "sha256:" + h.hexdigest()


class Ledger:
    def __init__(self):
        self.entries: list[dict] = []

    def append(self, actor: str, action: str, payload: dict | None = None, *, ts: str | None = None) -> dict:
        prev = self.entries[-1]["entry_hash"] if self.entries else GENESIS
        body = {"seq": len(self.entries), "ts": ts or datetime.now(timezone.utc).isoformat(),
                "actor": actor, "action": action, "payload": payload or {}, "prev_hash": prev}
        entry = {**body, "entry_hash": _entry_hash(prev, body)}
        self.entries.append(entry)
        return entry

    def verify(self) -> bool:
        prev = GENESIS
        for e in self.entries:
            body = {k: e[k] for k in ("seq", "ts", "actor", "action", "payload", "prev_hash")}
            if e["prev_hash"] != prev or _entry_hash(prev, body) != e["entry_hash"]:
                return False
            prev = e["entry_hash"]
        return True

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            for e in self.entries:
                f.write(_canonical(e) + "\n")
