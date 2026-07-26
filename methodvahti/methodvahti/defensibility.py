"""Defensibility classification — the least-favourable dimension rule.

Implements VALIDATION.md Ch. 1.2.4/1.2.5. The public contract is a rule-based
ordinal classification, never a number:

    least-favourable dimension rule
    + downward escalation
    + justified reviewer override

The frozen scale (Ch. 1.2.5, D2) is Strong / Adequate / Limited. "Not assessable"
is a data-state, not a fourth ordinal rating: it is reported, excluded from the
rule, and never occupies a position on the scale. There is no "Not defensible"
level — fatal or critical concerns are explicit flags, and a flag can force the
overall classification to Limited with written reasoning.

This module shares nothing with the sampling-heterogeneity construct
(heterogeneity.py) — no imports, no aggregation machinery, no report text
(Ch. 1.2.5, D3). The classification describes a design profile. It never says a
sample is adequate, and it is not a quality score.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# ── Frozen vocabulary (Ch. 1.2.5, D2) ────────────────────────────────────────

DEFENSIBILITY_LABELS = ("Strong", "Adequate", "Limited")
NOT_ASSESSABLE = "Not assessable"

# Internal ordering only. The public contract is "least favourable", not an
# arithmetic minimum; this table exists so the rule can be applied, and it is
# deliberately not exported.
_FAVOURABILITY = {"Strong": 0, "Adequate": 1, "Limited": 2}

STATEMENT = (
    "This is an ordinal judgement derived from the dimension profile. "
    "It is not a numerical quality score."
)

EVIDENCE_GRADE = "○ author hypothesis"  # ○ — see VALIDATION.md Ch. 0.2


# ── Declared judgements attached to a classification ─────────────────────────

@dataclass(frozen=True)
class Flag:
    """An explicit fatal/critical concern, reported separately from the scale.

    A flag with force_limited=True forces the overall classification to
    Limited; that force requires written reasoning (Ch. 1.2.5, D2).
    """
    description: str
    dimension: Optional[str] = None
    force_limited: bool = False
    reasoning: str = ""


@dataclass(frozen=True)
class Escalation:
    """Downward-only adjustment when material concerns accumulate.

    The judgement of when concerns are material is the reviewer's — the tool
    never decides it (Ch. 1.2.4). Written reasoning is mandatory.
    """
    to_label: str
    reasoning: str


@dataclass(frozen=True)
class Override:
    """Reviewer override of the classification. Written justification is
    mandatory; an undocumented override is the only unacceptable one."""
    to_label: str
    justification: str


# ── Validation helpers ───────────────────────────────────────────────────────

def _require_label(label: str, context: str) -> None:
    if label not in DEFENSIBILITY_LABELS:
        raise ValueError(
            f"{context}: {label!r} is not on the frozen scale "
            f"{DEFENSIBILITY_LABELS} (\"{NOT_ASSESSABLE}\" is a data-state, "
            "not an ordinal rating)"
        )


def _require_text(text: str, context: str) -> None:
    if not text or not text.strip():
        raise ValueError(f"{context}: written text is mandatory and was empty")


def _less_favourable(a: str, b: str) -> bool:
    """True if label `a` is strictly less favourable than label `b`."""
    return _FAVOURABILITY[a] > _FAVOURABILITY[b]


# ── The classification ───────────────────────────────────────────────────────

def classify_defensibility(
    profile: dict[str, str],
    *,
    flags: tuple[Flag, ...] | list[Flag] = (),
    escalation: Optional[Escalation] = None,
    override: Optional[Override] = None,
) -> dict:
    """Classify overall defensibility from a dimension profile.

    The overall judgement cannot be more favourable than the least defensible
    dimension. Accumulated material concerns may push it lower (escalation,
    with reasoning). A reviewer may override it (with written justification).
    Nothing pushes it higher than the rule allows except a justified override.

    Returns a classification record. It contains labels, names, and text —
    no numeric score of any kind.
    """
    if not profile:
        raise ValueError("profile is empty: at least one dimension is required")

    assessed: dict[str, str] = {}
    not_assessable: list[str] = []
    for dim, label in profile.items():
        if label == NOT_ASSESSABLE:
            not_assessable.append(dim)
            continue
        _require_label(label, f"dimension {dim!r}")
        assessed[dim] = label

    for f in flags:
        _require_text(f.description, "flag description")
        if f.force_limited:
            _require_text(
                f.reasoning,
                "a flag that forces the classification to Limited requires reasoning",
            )

    # 1. Least-favourable dimension rule (over assessed dimensions only;
    #    "Not assessable" is a data-state and takes no part in the rule).
    if not assessed:
        return _record(
            overall=NOT_ASSESSABLE,
            derivation="no dimension assessable",
            weakest=[],
            profile=profile,
            not_assessable=not_assessable,
            flags=flags,
            escalation=None,
            override=None,
        )

    worst_rank = max(_FAVOURABILITY[lbl] for lbl in assessed.values())
    overall = DEFENSIBILITY_LABELS[worst_rank]
    weakest = sorted(d for d, l in assessed.items() if _FAVOURABILITY[l] == worst_rank)
    derivation = "least-favourable dimension rule"

    # 2. Fatal/critical flags may force Limited (with reasoning, checked above).
    if any(f.force_limited for f in flags) and overall != "Limited":
        overall = "Limited"
        derivation = "forced to Limited by flagged critical concern"

    # 3. Downward escalation — strictly less favourable, reasoning mandatory.
    if escalation is not None:
        _require_label(escalation.to_label, "escalation target")
        _require_text(escalation.reasoning, "escalation reasoning")
        if not _less_favourable(escalation.to_label, overall):
            raise ValueError(
                "escalation is downward-only: "
                f"{escalation.to_label!r} is not less favourable than {overall!r}"
            )
        overall = escalation.to_label
        derivation += " + downward escalation"

    # 4. Justified reviewer override — final, and always on the record.
    if override is not None:
        _require_label(override.to_label, "override target")
        _require_text(override.justification, "override justification")
        overall = override.to_label
        derivation += " + reviewer override (justified)"

    return _record(
        overall=overall,
        derivation=derivation,
        weakest=weakest,
        profile=profile,
        not_assessable=not_assessable,
        flags=flags,
        escalation=escalation,
        override=override,
    )


def _record(*, overall, derivation, weakest, profile, not_assessable,
            flags, escalation, override) -> dict:
    return {
        "construct": "methodological defensibility",
        "overall": overall,
        "derivation": derivation,
        "weakest_dimensions": weakest,
        "profile": dict(profile),
        "not_assessable": list(not_assessable),
        "incomplete": bool(not_assessable),
        "flags": [
            {
                "description": f.description,
                "dimension": f.dimension,
                "force_limited": f.force_limited,
                "reasoning": f.reasoning,
            }
            for f in flags
        ],
        "escalation": (
            {"to_label": escalation.to_label, "reasoning": escalation.reasoning}
            if escalation else None
        ),
        "override": (
            {"to_label": override.to_label, "justification": override.justification}
            if override else None
        ),
        "statement": STATEMENT,
        "evidence_grade": EVIDENCE_GRADE,
    }


# ── Report rendering (Ch. 1.2.4 recommended form) ────────────────────────────

def render_report(result: dict) -> str:
    """Render the classification in the Ch. 1.2.4 report form. Plain text;
    the full profile always accompanies the overall judgement."""
    lines = [f"Overall defensibility: {result['overall']}", ""]

    if result["overall"] == NOT_ASSESSABLE:
        lines.append("No dimension could be assessed; no classification is made.")
    else:
        lines.append(
            "The overall judgement cannot be more favourable than the least "
            "defensible dimension."
        )
        if result["weakest_dimensions"]:
            lines.append(
                "The weakest dimension was: "
                + ", ".join(result["weakest_dimensions"]) + "."
            )
    lines += ["", result["statement"], ""]

    lines.append("Dimension profile:")
    for dim, label in result["profile"].items():
        lines.append(f"  - {dim}: {label}")

    if result["not_assessable"]:
        lines += ["", "Not assessable (reported, outside the rule): "
                  + ", ".join(result["not_assessable"])]
    for f in result["flags"]:
        where = f" [{f['dimension']}]" if f["dimension"] else ""
        forced = " — forces Limited" if f["force_limited"] else ""
        lines.append(f"Flagged concern{where}: {f['description']}{forced}")
        if f["reasoning"]:
            lines.append(f"  Reasoning: {f['reasoning']}")
    if result["escalation"]:
        lines.append(
            f"Downward escalation to {result['escalation']['to_label']}: "
            f"{result['escalation']['reasoning']}"
        )
    if result["override"]:
        lines.append(
            f"Reviewer override to {result['override']['to_label']}: "
            f"{result['override']['justification']}"
        )

    lines += ["", f"Evidence grade: {result['evidence_grade']}"]
    return "\n".join(lines)
