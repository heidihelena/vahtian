"""Deterministic claim–source comparison — the CiteVahti core, AI-second by construction.

The division of labour is fixed. An assistant (AI or human — the ledger records
which) reduces a claim and a cited source's finding to the same structured
Assertion form. compare() — plain code, no model — reports field by field where
the two assertions agree, conflict, or say nothing, and derives a *candidate*
label for a human to accept or override. The comparator stamps its own version
and content hashes of both inputs, so the same inputs always reproduce the same
assessment. It checks whether two structured reductions align; it does not
certify that the claim is true, only record how the comparison came out and who
decided what.
"""
from __future__ import annotations
import json, hashlib, math
from dataclasses import dataclass, asdict

COMPARATOR_ID = "vahtian-compare/1"

# Field statuses. Free-text fields can only ever DIFFER (wording varies without
# meaning conflict); controlled and numeric fields can genuinely CONFLICT.
AGREES = "agrees"
DIFFERS = "differs"
CONFLICTS = "conflicts"
NOT_STATED = "not_stated"
NOT_COMPARABLE = "not_comparable"

# Candidate labels — proposals for a human decision, never verdicts.
ALIGNED = "aligned"
CONFLICTING = "conflicting"
INSUFFICIENT = "insufficient"

_FREE_TEXT = ("population", "exposure", "comparator", "outcome")
_CONTROLLED = ("direction", "effect_type")
_NUMERIC = ("effect_value", "ci_low", "ci_high")


def _canonical(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


@dataclass
class Assertion:
    """One claim or source finding, reduced to comparable PICO-shaped fields.

    Leave a field None when the text does not state it — the comparator treats
    that as not_stated, never as agreement. quote and locator point back to the
    exact words being formalised, so a human can check the reduction itself.
    """
    population: str | None = None
    exposure: str | None = None
    comparator: str | None = None
    outcome: str | None = None
    direction: str | None = None     # "increase" | "decrease" | "no_difference"
    effect_type: str | None = None   # e.g. "RR", "OR", "HR", "MD"
    effect_value: float | None = None
    ci_low: float | None = None
    ci_high: float | None = None
    quote: str | None = None         # exact words this assertion formalises
    locator: str | None = None       # where they appear (e.g. "abstract", "table 2")

    def hash(self) -> str:
        return "sha256:" + hashlib.sha256(_canonical(asdict(self)).encode("utf-8")).hexdigest()


def _norm(value) -> str:
    return " ".join(str(value).split()).lower()


def _cell(name: str, claim: Assertion, source: Assertion, status: str) -> dict:
    return {"status": status, "claim": getattr(claim, name), "source": getattr(source, name)}


def _text_status(a, b, *, controlled: bool) -> str:
    if a is None or b is None:
        return NOT_STATED
    if _norm(a) == _norm(b):
        return AGREES
    return CONFLICTS if controlled else DIFFERS


def _numeric_status(a, b, rel_tol: float) -> str:
    if a is None or b is None:
        return NOT_STATED
    return AGREES if math.isclose(float(a), float(b), rel_tol=rel_tol) else CONFLICTS


@dataclass
class Assessment:
    """One comparator run: field-by-field statuses plus a candidate label.

    candidate is a proposal ("aligned" | "conflicting" | "insufficient") for a
    human to accept or override — the human decision is a separate ledger entry.
    claim_hash/source_hash tie the run to the exact assertions compared.
    """
    claim_hash: str
    source_hash: str
    comparator: str
    rel_tol: float
    fields: dict
    candidate: str

    def payload(self) -> dict:
        return asdict(self)

    def record(self, ledger) -> dict:
        """Append this run to a hash-chained audit Ledger; returns the entry."""
        return ledger.append(self.comparator, "compare", self.payload())


def compare(claim: Assertion, source: Assertion, *, rel_tol: float = 0.01) -> Assessment:
    """Field-by-field comparison of two assertions. Deterministic: same inputs,
    same rel_tol, same comparator version → identical assessment.

    Candidate rules: any conflict → "conflicting"; direction and outcome both
    agree with no conflicts and no free-text divergence → "aligned"; anything
    else → "insufficient". Free-text wording differences never count as
    conflict — they are flagged for the human, who judges whether the wording
    means the same thing.
    """
    fields = {}
    for name in _FREE_TEXT:
        s = _text_status(getattr(claim, name), getattr(source, name), controlled=False)
        fields[name] = _cell(name, claim, source, s)
    for name in _CONTROLLED:
        s = _text_status(getattr(claim, name), getattr(source, name), controlled=True)
        fields[name] = _cell(name, claim, source, s)
    effect_types_conflict = fields["effect_type"]["status"] == CONFLICTS
    for name in _NUMERIC:
        if effect_types_conflict:  # an RR is not an OR — numbers can't be compared
            fields[name] = _cell(name, claim, source, NOT_COMPARABLE)
        else:
            s = _numeric_status(getattr(claim, name), getattr(source, name), rel_tol)
            fields[name] = _cell(name, claim, source, s)

    statuses = [f["status"] for f in fields.values()]
    if CONFLICTS in statuses:
        candidate = CONFLICTING
    elif (fields["direction"]["status"] == AGREES
          and fields["outcome"]["status"] == AGREES
          and DIFFERS not in statuses):
        candidate = ALIGNED
    else:
        candidate = INSUFFICIENT
    return Assessment(claim_hash=claim.hash(), source_hash=source.hash(),
                      comparator=COMPARATOR_ID, rel_tol=rel_tol,
                      fields=fields, candidate=candidate)
