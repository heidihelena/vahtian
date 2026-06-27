"""`vahtian` CLI — verify a frozen corpus or an audit ledger."""
import sys
from . import load, __version__
from .audit import Ledger

def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if not argv or argv[0] in ("-h", "--help"):
        print("vahtian", __version__, "\n  vahtian verify <corpus-prefix>   # check a frozen corpus is untampered")
        return 0
    if argv[0] == "verify" and len(argv) > 1:
        c = load(argv[1])
        ok = c.verify()
        print(("OK  " if ok else "FAIL ") + f"{len(c.records)} records · {c.search_date} · {c.content_hash}")
        return 0 if ok else 1
    print("unknown command:", argv[0]); return 2
