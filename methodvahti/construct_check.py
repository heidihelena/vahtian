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

Since v0.4.0 this is a *scope demonstration*, not a defect report. Under the
construct separation (VALIDATION.md Ch. 1.2.5, D1/D3) the sampling-heterogeneity
score legitimately REQUIRES per-record outcome data — that is its construct —
while the outcome-free appraisal question that Table 3 poses is answered by the
DEFENSIBILITY CLASSIFICATION (Ch. 1.2.4), which consumes dimension judgements
and no outcome column at all. Part 2 below demonstrates that resolution on the
same three Table-3 rows.

RUN
---
    python construct_check.py

Exit code is 0 when BOTH constructs behave as specified: the sampling score
returns H == 0.0 on outcome-free Table-3 shape (its scope boundary holds), and
the defensibility classification produces an ordinal judgement from outcome-free
appraisal input (the resolution is in place). Exit 1 if either has drifted.
"""

from __future__ import annotations

import sys

from methodvahti.heterogeneity import sampling_heterogeneity_score
from methodvahti.defensibility import classify_defensibility, NOT_ASSESSABLE


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
    print("  RESOLUTION (v0.4.0, Ch. 1.2.4/1.2.5): the outcome-free question is")
    print("  answered by the defensibility CLASSIFICATION, not by a score. Part 2")
    print("  appraises the same three rows (ILLUSTRATIVE hand judgements) and")
    print("  classifies without any outcome column.")
    print("=" * 68)
    print()

    # PART 2 — the same rows, appraised (illustrative judgements, not data)
    # and classified. No outcome column anywhere.
    appraisals = [
        {"study_design": "Strong", "sampling": "Adequate",
         "analysis": "Adequate", "theoretical_framework": "Limited",
         "trustworthiness": "Adequate"},
        {"study_design": "Strong", "sampling": "Adequate",
         "analysis": "Strong", "theoretical_framework": "Strong",
         "trustworthiness": "Strong"},
        {"study_design": "Adequate", "sampling": NOT_ASSESSABLE,
         "analysis": "Adequate", "theoretical_framework": "Limited",
         "trustworthiness": "Limited"},
    ]
    classification_ok = True
    print("  PART 2 — defensibility classification on outcome-free appraisal")
    print("  (judgements below are illustrative, not measured):")
    for i, prof in enumerate(appraisals, 1):
        c = classify_defensibility(prof)
        print(f"    review {i}: overall = {c['overall']:<14s} "
              f"weakest = {', '.join(c['weakest_dimensions']) or '—'}"
              + ("  [incomplete]" if c["incomplete"] else ""))
        if c["overall"] not in ("Strong", "Adequate", "Limited", NOT_ASSESSABLE):
            classification_ok = False
    print()

    if all_primary_zero and classification_ok:
        print("  STATUS: both constructs behave as specified —")
        print("          sampling score: outcome-free input -> H == 0.0 (scope")
        print("          boundary holds; use it only with outcome data);")
        print("          defensibility: outcome-free appraisal -> ordinal")
        print("          classification (the Ch. 1.2.1 gap is closed).")
        return 0
    print("  STATUS: DRIFT — one of the constructs no longer matches its spec.")
    print("          Re-check VALIDATION.md Ch. 1.2.4/1.2.5 and Ch. 15.")
    return 1


if __name__ == "__main__":
    sys.exit(run())
