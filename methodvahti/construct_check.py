#!/usr/bin/env python3
"""
MethodVahti — construct/unit reconciliation check
Vahtian · part of the validation framework (see VALIDATION.md Ch. 1.2)

WHAT THIS SCRIPT DEMONSTRATES
-----------------------------
The shipped ``sampling_heterogeneity_score`` computes a single corpus-level
scalar from the *rate of a per-record ``outcome``* across design dimensions.
The Cochrane Giltenane et al. (2025) "Table 3" corpus — the primary frame the
open validation plan proposes to use — codes each review's *design
characteristics* but has **no per-record ``outcome`` column**.

Fed Table-3-shaped records, the function therefore finds an outcome rate of
zero in every cell, so the primary hierarchical score and the marginal map are
**0.0** for every outcome type. The ``sparse_interaction_stress`` diagnostic is
non-zero, but only because sparse cells are inflated toward a floor — i.e. it is
driven entirely by the data gap, not by any evidence, exactly as the tool's own
interpretation string warns.

This is a *reproducible demonstration of a specification mismatch*, not a bug
report and not a redesign. It is the evidence behind the review's #1 critical
finding — and, since the owner's 2026-07-19 decision (VALIDATION.md Ch. 1.2.1),
the standing guard that the LEGACY per-`outcome` code still does NOT implement the
now-agreed outcome-independent defensibility construct and must be redesigned
(Ch. 1.2.2).

RUN
---
    python construct_check.py

Exit code is 0 on the *expected* mismatch (primary H == 0.0 on Table-3 shape)
and 1 if the shipped behaviour has changed — so this doubles as a guard that the
finding written into VALIDATION.md still holds against the shipped code.
"""

from __future__ import annotations

import sys

from methodvahti.heterogeneity import sampling_heterogeneity_score


# The seven design dimensions that Giltenane Table 3 supplies ~1:1 (README §1.A).
TABLE3_DIMENSIONS = [
    "study_design",       # QES method (thematic synthesis / meta-ethnography / …)
    "population",
    "setting",
    "language",           # non-English-inclusion indicator
    "analysis_method",
    "theoretical_framework",
    "trustworthiness",    # CERQual + quality-appraisal indicators
]

# A faithful sketch of three Cochrane Table-3 rows: design coding only, and
# crucially NO ``outcome`` key on any record. This is the exact shape the
# validation plan's convergent/criterion tests would feed the function.
TABLE3_RECORDS = [
    {
        "study_design": "thematic_synthesis",
        "population": "patients",
        "setting": "hospital",
        "language": "English",
        "analysis_method": "thematic",
        "theoretical_framework": "none_stated",
        "trustworthiness": "CERQual",
    },
    {
        "study_design": "meta_ethnography",
        "population": "clinicians",
        "setting": "primary_care",
        "language": "mixed",
        "analysis_method": "meta_ethnography",
        "theoretical_framework": "interpretivism",
        "trustworthiness": "GRADE",
    },
    {
        "study_design": "framework",
        "population": "caregivers",
        "setting": "community",
        "language": "English",
        "analysis_method": "framework",
        "theoretical_framework": "none_stated",
        "trustworthiness": "none",
    },
]

# The four outcome types in the default severity catalogue.
OUTCOMES = [
    "judge_human_disagreement",
    "criterion_disagreement",
    "grey_zone",
    "judge_error",
]


def run() -> int:
    print("=" * 68)
    print("  MethodVahti — construct/unit reconciliation check")
    print("  (VALIDATION.md Ch. 1.2 — the construct/unit mismatch)")
    print("=" * 68)
    print(f"  Records: {len(TABLE3_RECORDS)} Cochrane-Table-3-shaped reviews")
    print(f"  Dimensions coded: {len(TABLE3_DIMENSIONS)}")
    print("  Per-record 'outcome' column present: NO  (Table 3 has none)")
    print()
    print(f"  {'outcome requested':28s}  {'primary H':>10s}  "
          f"{'marginal':>9s}  {'stress':>7s}")
    print("  " + "-" * 60)

    all_primary_zero = True
    for outcome in OUTCOMES:
        result = sampling_heterogeneity_score(
            TABLE3_RECORDS,
            dimensions=TABLE3_DIMENSIONS,
            outcome=outcome,
        )
        primary = result.primary_score["value"]
        marginal = result.marginal_map["value"]
        stress = result.sparse_interaction_stress["value"]
        if primary != 0.0:
            all_primary_zero = False
        print(f"  {outcome:28s}  {primary:>10.4f}  "
              f"{marginal:>9.4f}  {stress:>7.4f}")

    print()
    print("  READING")
    print("  Primary H and the marginal map are 0.0 for every outcome type:")
    print("  no record carries the per-record 'outcome' the score consumes, so")
    print("  every cell's outcome rate is zero. The non-zero 'stress' value is")
    print("  a pure data-gap artifact (sparse-cell inflation on 3 records), NOT")
    print("  evidence of heterogeneity — exactly what the tool's own stress")
    print("  interpretation warns about.")
    print()
    print("  OWNER DECISION (2026-07-19) — recorded, VALIDATION.md Ch. 1.2.1:")
    print("  adopt the OUTCOME-INDEPENDENT methodological-defensibility construct")
    print("  (design, sampling, outcome-DEFINITION quality, confounder handling,")
    print("  bias domains, reporting completeness — features available BEFORE")
    print("  results exist). Under that construct, Table-3-style design coding IS")
    print("  scoreable in principle; no 'outcome' column is needed.")
    print()
    print("  WHY THIS DEMO STILL MATTERS: the LEGACY code above still requires a")
    print("  per-record 'outcome' and so returns H = 0.0 on Table-3 shape. It does")
    print("  NOT yet implement the agreed construct. The redesign (Ch. 1.2.2) is")
    print("  the next implementation phase; this script guards the finding until")
    print("  then (its exit-code contract flips once the new score is in).")
    print("=" * 68)

    # Expected state = mismatch reproduced (primary H == 0.0). If the shipped
    # code ever stops returning 0.0 here, the VALIDATION.md finding is stale.
    if all_primary_zero:
        print("  STATUS: legacy mismatch still present (primary H == 0.0);")
        print("          outcome-independent redesign (Ch. 1.2.2) not yet landed.")
        return 0
    print("  STATUS: CHANGED — primary H is no longer 0.0 on Table-3 shape.")
    print("          If the redesign (Ch. 1.2.2) landed, update this guard and")
    print("          re-freeze VALIDATION.md Ch. 15 for the new score.")
    return 1


if __name__ == "__main__":
    sys.exit(run())
