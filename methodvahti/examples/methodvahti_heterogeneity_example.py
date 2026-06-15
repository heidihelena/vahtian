"""
MethodVahti heterogeneity — worked example
heidihelena/epinet · branch: methodvahti-heterogeneity

Scenario: Meta-synthesis of qualitative studies on treatment
decision-making in advanced NSCLC. Research team audits default
severity weights after pilot inter-rater exercise (n=12 records).
"""

from methodvahti.heterogeneity import (
    qualitative_heterogeneity_score,
    default_severity_catalogue,
)
import json

# ── 1. Pilot audit: team adjusts severity weight ──────────────────────────────

catalogue = default_severity_catalogue()
catalogue["judge_human_disagreement"].change(
    new_weight=0.75,
    changed_by="research_team",
    reason=(
        "Pilot inter-rater exercise (n=12 records, two raters). "
        "Observed disagreement rate 18% (2/12 records). "
        "Default weight 0.90 assumed higher severity than observed. "
        "Adjusted to 0.75 per team governance decision."
    ),
)

# ── 2. Records (replace with your actual coded records) ───────────────────────
# Each record = one qualitative study or one coded interview segment.
# Keys must match the `dimensions` list.
# `outcome` must match an entry in the severity catalogue.

example_records = [
    # Format: {dimension_1: value, ..., "outcome": outcome_type}
    {"study_design": "IPA", "population": "patients", "setting": "outpatient",
     "language": "English", "data_collection": "interview",
     "analysis_method": "IPA", "theoretical_framework": "phenomenology",
     "trustworthiness": "high", "outcome": "grey_zone"},
    {"study_design": "grounded_theory", "population": "clinicians",
     "setting": "hospital", "language": "Nordic", "data_collection": "interview",
     "analysis_method": "grounded_theory", "theoretical_framework": "interpretivism",
     "trustworthiness": "moderate", "outcome": "judge_human_disagreement"},
    {"study_design": "thematic_analysis", "population": "caregivers",
     "setting": "community", "language": "English",
     "data_collection": "focus_group", "analysis_method": "thematic_analysis",
     "theoretical_framework": "social_constructivism",
     "trustworthiness": "high", "outcome": "criterion_disagreement"},
    # Add your full record set here
]

# ── 3. Run ────────────────────────────────────────────────────────────────────

result = qualitative_heterogeneity_score(
    example_records,
    dimensions=[
        "study_design", "population", "setting", "language",
        "data_collection", "analysis_method",
        "theoretical_framework", "trustworthiness",
    ],
    outcome="judge_human_disagreement",
    lambda_within=0.65,    # team governance choice
    lambda_between=0.50,   # team governance choice
    gamma_sparsity=0.20,   # team governance choice
    min_n=5,
    shrink=True,
    severity_catalogue=catalogue,
)

# ── 4. Extract for methods report ─────────────────────────────────────────────

print("PRIMARY SCORE (feeds into sample size optimisation):")
print(f"  H = {result.primary_score['value']}")
print(f"  {result.primary_score['interpretation'][:100]}...")

print("\nMARGINAL MAP (descriptive diagnostic):")
for dim, v in result.marginal_map["per_dimension"].items():
    print(f"  {dim:30s}  {v:.3f}")

print("\nSPARSE INTERACTION STRESS (diagnostic — sparsity visible):")
st = result.sparse_interaction_stress
print(f"  value: {st['value']}  sparsity: {st['sparsity_ratio']}")

print("\nSEVERITY AUDIT LOG:")
for entry in result.severity_catalogue["judge_human_disagreement"]["audit_log"]:
    print(f"  {entry['timestamp']}: {entry['changed_from']} → {entry['changed_to']}")
    print(f"  by: {entry['changed_by']}")
    print(f"  reason: {entry['reason']}")

# H flows into MethodVahti PDF optimisation layer:
H = result.primary_score["value"]
print(f"\nFeed into optimise_n(heterogeneity={H}, ...)")
