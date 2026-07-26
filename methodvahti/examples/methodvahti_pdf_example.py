"""
MethodVahti PDF — worked example
Vahtian · Apache-2.0 · part of the EpiNet toolkit

Runs the full path: heterogeneity score (optional) → optimise_n() → build().
Writes a COREQ/SRQR-compatible PDF to the current directory.

    pip install "reportlab>=4"          # the PDF layer's only dependency
    python examples/methodvahti_pdf_example.py
"""

from methodvahti.heterogeneity import (
    sampling_heterogeneity_score, default_severity_catalogue)
from methodvahti_pdf import optimise_n, build


# 1 ── (optional) heterogeneity from coded pilot records ----------------------
# If you have coded records, cross the construct boundary explicitly:
#   opt = optimise_n({**sampling_heterogeneity_input(result), ...})
# Here we use a direct estimate for brevity; see
# examples/methodvahti_heterogeneity_example.py. Defensibility never enters
# sample-size optimisation (VALIDATION.md Ch. 1.2.5, D1).
H = 0.35

# 2 ── optimise N across three models -----------------------------------------
opt = optimise_n({
    "heterogeneity": H,
    "theme_prevalence": 0.30,
    "depth": "explanatory",
    "specificity": 0.65,
    "theory_strength": 0.50,
    "data_quality": 0.75,
    "power": 0.80,
    "mixed_methods": True,
    "min_detectable_diff": 0.20,
})
print("Three models:", opt["models"])
print(f"Optimal N = {opt['optimal_n']}  "
      f"({'stable' if opt['stable'] else 'sensitive'}; "
      f"range {opt['stability_range']})")

# 3 ── researcher confirms N, then build the report ---------------------------
report = {
    "report_id": "MV-2026-001",
    "study_title": "Treatment decision-making in advanced NSCLC",
    "research_group": "Nordic Oncology Qualitative Group",
    "researcher_name": "H. Andersen",
    "researcher_credentials": "PhD candidate, RN",
    "reflexivity": ("Clinician-researcher; prior oncology nursing experience may "
                    "sensitise interpretation toward clinician framings."),
    "research_question": ("How do patients with advanced NSCLC reason about "
                          "treatment trade-offs?"),
    "orientation": "Interpretative phenomenological analysis (IPA)",
    "approach": "Interpretivist / constructivist",
    "collection_method": "Semi-structured interviews",
    "analysis_strategy": "IPA double-coding with reflexive memoing",
    "optimisation": opt,                      # or pass optimisation_params
    "chosen_n": 18,
    "chosen_rationale": ("Synthesis suggested ~16; added 2 for population breadth "
                         "across two centres."),
    "stopping_criterion": ("No new meaning-level themes across three consecutive "
                           "interviews per centre."),
    "adaptive_plan": "Review at N=12; extend to 22 if meaning saturation unclear.",
    "fuzzy_concept": "High decisional conflict",
    "fuzzy_sensitivity": {
        "0.5 anchor at moderate conflict": "2 cases move in/out of the set",
        "Stricter 0.7 anchor": "No change to the sufficiency claim",
    },
    "fuzzy_calibration_rationale": "Anchors set on validated DCS thresholds.",
    "fuzzy_conclusion_impact": "Sufficiency claim robust to anchor choice.",
    "can_conclude": [
        "The range of trade-off reasoning patterns present",
        "How clinician framing enters patient reasoning",
    ],
    "cannot_conclude": [
        "Population prevalence of any single pattern",
        "Causal effect of framing on the eventual choice",
    ],
    "transferability": ("Two Nordic tertiary centres; transfer to community "
                        "oncology is untested."),
    "severity_audit_log": [{
        "timestamp": "2026-06-15T10:00:00Z",
        "changed_from": 0.90, "changed_to": 0.75, "changed_by": "research_team",
        "reason": "Pilot audit (n=12): observed disagreement approx 18%.",
    }],
}

path = build(report, "methodvahti-report-2026-001.pdf")
print("PDF written:", path)
