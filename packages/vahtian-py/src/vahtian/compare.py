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

A field carries not just a value but *why* it holds one (or doesn't). A plain
value is taken as explicitly stated; None means the source did not state it. The
other epistemic states — the extractor failed, the field does not apply to the
study design, the source is ambiguous, or the value was inferred rather than
stated — are marked explicitly via extraction_failed(), not_applicable(),
ambiguous(), and inferred(). A single None must not collapse these apart: an
inferred field never counts toward an "aligned" candidate without a human
confirming it, and an extraction failure routes back to extraction rather than
reading as source silence.
"""
from __future__ import annotations
import json, hashlib, math
from dataclasses import dataclass, asdict

COMPARATOR_ID = "vahtian-compare/2"

# ---- field epistemic states: why a field holds (or lacks) a value ----
STATED = "stated"                        # explicitly stated in the text
NOT_STATED = "not_stated"                # the text did not state it
EXTRACTION_FAILED = "extraction_failed"  # the extractor could not read it
NOT_APPLICABLE = "not_applicable"        # does not apply to this study design
AMBIGUOUS = "ambiguous"                  # present but ambiguous in the source
INFERRED = "inferred"                    # inferred, not explicitly stated

# A value is usable for comparison only when explicitly stated or inferred.
_USABLE = (STATED, INFERRED)
# When a field is not usable on at least one side, the most actionable state
# wins (most severe first): fix the extractor before anything else, then
# resolve ambiguity, then note structural non-applicability, then plain silence.
_ABSENT_ORDER = (EXTRACTION_FAILED, AMBIGUOUS, NOT_APPLICABLE, NOT_STATED)

# ---- field comparison statuses (for usable-vs-usable fields) ----
AGREES = "agrees"
DIFFERS = "differs"          # free-text wording varies — for the human to judge
CONFLICTS = "conflicts"      # controlled/numeric values genuinely disagree
NOT_COMPARABLE = "not_comparable"  # e.g. an RR against an OR

# ---- candidate labels — proposals for a human decision, never verdicts ----
ALIGNED = "aligned"
CONFLICTING = "conflicting"
INSUFFICIENT = "insufficient"

_FREE_TEXT = ("population", "exposure", "comparator", "outcome")
_CONTROLLED = ("direction", "effect_type")
_NUMERIC = ("effect_value", "ci_low", "ci_high")


def _canonical(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


@dataclass(frozen=True)
class Field:
    """A field value plus the epistemic state explaining why it holds one.

    Construct via the helpers (inferred/ambiguous/not_applicable/
    extraction_failed) rather than directly; a plain value or None on an
    Assertion is resolved to STATED / NOT_STATED automatically.
    """
    value: object = None
    state: str = STATED


def inferred(value) -> Field:
    """A value inferred from the text, not explicitly stated."""
    return Field(value, INFERRED)


def ambiguous(value=None) -> Field:
    """The source states something, but ambiguously; value is what was read, if any."""
    return Field(value, AMBIGUOUS)


def not_applicable() -> Field:
    """The field does not apply to this study design."""
    return Field(None, NOT_APPLICABLE)


def extraction_failed() -> Field:
    """The extractor could not read this field — route back to extraction."""
    return Field(None, EXTRACTION_FAILED)


@dataclass
class Assertion:
    """One claim or source finding, reduced to comparable PICO-shaped fields.

    A plain value is taken as explicitly stated; None means the source did not
    state it. For the other states, wrap the field with inferred(), ambiguous(),
    not_applicable(), or extraction_failed(). quote and locator point back to the
    exact words being formalised, so a human can check the reduction itself.
    """
    population: object = None
    exposure: object = None
    comparator: object = None
    outcome: object = None
    direction: object = None     # "increase" | "decrease" | "no_difference"
    effect_type: object = None   # e.g. "RR", "OR", "HR", "MD"
    effect_value: object = None
    ci_low: object = None
    ci_high: object = None
    quote: str | None = None     # exact words this assertion formalises
    locator: str | None = None   # where they appear (e.g. "abstract", "table 2")

    def hash(self) -> str:
        return "sha256:" + hashlib.sha256(_canonical(asdict(self)).encode("utf-8")).hexdigest()


def _resolve(raw) -> tuple:
    """(value, state) for a raw field: Field passes through; None → not_stated;
    anything else → an explicitly stated value."""
    if isinstance(raw, Field):
        return raw.value, raw.state
    if raw is None:
        return None, NOT_STATED
    return raw, STATED


def _norm(value) -> str:
    return " ".join(str(value).split()).lower()


def _cell(status, cv, sv, cs, ss) -> dict:
    return {"status": status, "claim": cv, "source": sv,
            "claim_state": cs, "source_state": ss}


def _compare_field(claim_raw, source_raw, kind, *, effect_types_conflict, rel_tol) -> dict:
    cv, cs = _resolve(claim_raw)
    sv, ss = _resolve(source_raw)
    absent = [st for st in (cs, ss) if st not in _USABLE]
    if absent:  # at least one side has no usable value — surface the most actionable state
        return _cell(min(absent, key=_ABSENT_ORDER.index), cv, sv, cs, ss)
    if kind == "numeric" and effect_types_conflict:
        return _cell(NOT_COMPARABLE, cv, sv, cs, ss)
    if kind == "free":
        status = AGREES if _norm(cv) == _norm(sv) else DIFFERS
    elif kind == "controlled":
        status = AGREES if _norm(cv) == _norm(sv) else CONFLICTS
    else:  # numeric
        status = AGREES if math.isclose(float(cv), float(sv), rel_tol=rel_tol) else CONFLICTS
    return _cell(status, cv, sv, cs, ss)


@dataclass
class Assessment:
    """One comparator run: field-by-field statuses plus a candidate label.

    Each field cell records both sides' value AND epistemic state (claim_state /
    source_state), so a reader can tell agreement from mere shared silence, and
    inferred from explicitly stated. candidate is a proposal ("aligned" |
    "conflicting" | "insufficient") for a human to accept or override — the human
    decision is a separate ledger entry. claim_hash/source_hash tie the run to
    the exact assertions compared.
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

    Each field resolves to a value and an epistemic state. When a field is not
    usable on at least one side, its status is the most actionable absent state
    (extraction_failed > ambiguous > not_applicable > not_stated) rather than a
    bare "missing". Usable-vs-usable fields compare as before: free-text wording
    differences are DIFFERS (flagged for the human, never a conflict), controlled
    and numeric values can CONFLICT, and a mismatched effect type makes the
    numbers NOT_COMPARABLE.

    Candidate rules: any conflict → "conflicting"; else "aligned" only when
    direction and outcome both AGREE *and are explicitly stated on both sides*
    (never inferred), with no free-text divergence and no unresolved field
    (extraction_failed / ambiguous) anywhere; otherwise "insufficient".
    """
    fields = {}
    for name in _FREE_TEXT:
        fields[name] = _compare_field(getattr(claim, name), getattr(source, name),
                                      "free", effect_types_conflict=False, rel_tol=rel_tol)
    for name in _CONTROLLED:
        fields[name] = _compare_field(getattr(claim, name), getattr(source, name),
                                      "controlled", effect_types_conflict=False, rel_tol=rel_tol)
    effect_types_conflict = fields["effect_type"]["status"] == CONFLICTS
    for name in _NUMERIC:
        fields[name] = _compare_field(getattr(claim, name), getattr(source, name), "numeric",
                                      effect_types_conflict=effect_types_conflict, rel_tol=rel_tol)

    statuses = [f["status"] for f in fields.values()]
    direction, outcome = fields["direction"], fields["outcome"]
    key_stated = all(c["claim_state"] == STATED and c["source_state"] == STATED
                     for c in (direction, outcome))
    unresolved = any(s in (EXTRACTION_FAILED, AMBIGUOUS) for s in statuses)
    if CONFLICTS in statuses:
        candidate = CONFLICTING
    elif (direction["status"] == AGREES and outcome["status"] == AGREES
          and key_stated and DIFFERS not in statuses and not unresolved):
        candidate = ALIGNED
    else:
        candidate = INSUFFICIENT
    return Assessment(claim_hash=claim.hash(), source_hash=source.hash(),
                      comparator=COMPARATOR_ID, rel_tol=rel_tol,
                      fields=fields, candidate=candidate)
