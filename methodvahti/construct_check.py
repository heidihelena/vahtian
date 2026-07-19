#!/usr/bin/env python3
"""
MethodVahti — construct/unit reconciliation check
Vahtian · part of the validation framework (see VALIDATION.md Ch. 1.2)

WHAT THIS SCRIPT DEMONSTRATES
-----------------------------
The shipped ``qualitative_heterogeneity_score`` computes a single corpus-level
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
finding. The resolution is a method/product decision for the owner (see the
DECISION block printed at the end and VALIDATION.md Ch. 1.2).

RUN
---
    python construct_check.py

Exit code is 0 on the *expected* mismatch (primary H == 0.0 on Table-3 shape)
and 1 if the shipped behaviour has changed — so this doubles as a guard that the
finding written into VALIDATION.md still holds against the shipped code.
"""

from __future__ import annotations

import sys

from methodvahti.heterogeneity import qualitative_heterogeneity_score


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
        result = qualitative_heterogeneity_score(
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
    print("  DECISION FOR THE OWNER (MD/PhD) — method/product call, not the")
    print("  framework author's to make. Two mutually exclusive resolutions:")
    print("    (A) Redesign the score to accept OUTCOME-FREE design coding —")
    print("        derive per-review heterogeneity from the spread/entropy of")
    print("        design dimensions themselves (changes the construct and the")
    print("        shipped API; invalidates the current severity-weight model).")
    print("    (B) Base the validation on data that HAS a per-record 'outcome' —")
    print("        e.g. the double-coded disagreement signal from an open corpus")
    print("        (keeps the shipped score; changes the primary dataset and")
    print("        makes the input-assignment step the thing to be validated).")
    print("  Until (A) or (B) is chosen, the plan's primary convergent/criterion")
    print("  study is NOT executable against its own primary dataset.")
    print("=" * 68)

    # Expected state = mismatch reproduced (primary H == 0.0). If the shipped
    # code ever stops returning 0.0 here, the VALIDATION.md finding is stale.
    if all_primary_zero:
        print("  STATUS: mismatch reproduced as documented (primary H == 0.0).")
        return 0
    print("  STATUS: CHANGED — primary H is no longer 0.0 on Table-3 shape.")
    print("          VALIDATION.md Ch. 1.2 must be revised to match the code.")
    return 1


if __name__ == "__main__":
    sys.exit(run())
