"""
MethodVahti — qualitative_heterogeneity_score
Vahtian · v0.3.0

IMPORTANT CLARIFICATION — OUTCOME_SEVERITY weights:
    These are NOT observed disagreement rates.
    They are severity amplification weights:
        1.0 = maximum governance concern
        0.0 = no amplification
    The weight determines how much a given outcome type amplifies
    the cell heterogeneity score relative to other outcomes.
    Default values are author hypotheses about expected severity.
    Research teams SHOULD audit and adjust with pilot data.

Audit trail:
    Every change to severity weights is recorded with reason + timestamp.
    This audit log is included in the PDF methods report.

Primary score:   hierarchical_heterogeneity_score
    H_within(d)  = λ_within  * max(cell_h) + (1-λ_within)  * weighted_mean(cell_h)
    H_between    = λ_between * max(H_within) + (1-λ_between) * weighted_mean(H_within)

Diagnostics:
    marginal_heterogeneity_map
    sparse_interaction_stress
    entropy_by_dimension

Evidence basis:
    ◆ Consensus        — entropy, frequency marginals
    ◇ Contested        — weighted mean aggregation
    ○ Author hypothesis — hierarchical structure, shrinkage, composite formula,
                          default severity weights
    ◌ Opinion range    — λ_within, λ_between, γ, severity weight values
"""

from __future__ import annotations
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


# ── Severity weight — named, documented, auditable ────────────────────────────

@dataclass
class OutcomeSeverity:
    """
    Severity amplification weight for one outcome type.

    weight : float [0.0–1.0]
        How much this outcome type amplifies cell heterogeneity.
        NOT an observed rate. NOT a probability.
        1.0 = maximum governance concern.
        0.0 = no amplification of heterogeneity.

    evidence : str
        Epistemic basis for the default weight.

    sensitivity_range : tuple[float, ...]
        Recommended values to test in sensitivity analysis.

    audit_log : list[dict]
        Every change is recorded. Shown in PDF.
    """
    weight:            float
    meaning:           str
    evidence:          str
    sensitivity_range: tuple
    default:           float
    audit_log:         list[dict] = field(default_factory=list)

    def change(self, new_weight: float, changed_by: str, reason: str) -> None:
        """Record a weight change with full audit trail."""
        self.audit_log.append({
            "changed_from": self.weight,
            "changed_to":   new_weight,
            "changed_by":   changed_by,
            "reason":       reason,
            "timestamp":    datetime.now(timezone.utc).isoformat(),
        })
        self.weight = new_weight

    def sensitivity_check(self) -> dict[float, str]:
        """
        What changes if we use sensitivity_range values instead?
        Returns descriptive labels — not scores (scores need full records).
        """
        checks = {}
        for v in self.sensitivity_range:
            if v < self.weight:
                checks[v] = "Lower severity → lower cell amplification → lower H"
            elif v > self.weight:
                checks[v] = "Higher severity → higher cell amplification → higher H"
            else:
                checks[v] = "Current value"
        return checks


# ── Default severity catalogue ────────────────────────────────────────────────

def default_severity_catalogue() -> dict[str, OutcomeSeverity]:
    """
    Default outcome severity weights.
    All are ○ Author hypothesis — expected severity, not empirical rates.
    Research teams should review these in pilot audit.
    """
    return {
        "judge_error": OutcomeSeverity(
            weight=1.00,
            meaning="Severity amplification weight — NOT an observed rate. "
                    "Clear retrospectively-identifiable error. "
                    "Maximum governance concern. Weight 1.0 = full amplification.",
            evidence="○ Author hypothesis — assumed worst-case severity",
            sensitivity_range=(0.80, 0.90, 1.00),
            default=1.00,
        ),
        "judge_human_disagreement": OutcomeSeverity(
            weight=0.90,
            meaning="Legitimate disagreement between two raters both acting "
                    "in good faith. High governance concern but not necessarily "
                    "error. Weight 0.90 = near-maximum amplification. "
                    "Pilot audit may suggest lower value (e.g. 0.70–0.80) "
                    "if disagreement is lower than initially assumed.",
            evidence="○ Author hypothesis — expected severity before pilot audit",
            sensitivity_range=(0.70, 0.80, 0.90),
            default=0.90,
        ),
        "criterion_disagreement": OutcomeSeverity(
            weight=0.70,
            meaning="The criterion itself is contested in the field. "
                    "Moderate governance concern — reflects field-level "
                    "methodological dispute, not individual error.",
            evidence="○ Author hypothesis",
            sensitivity_range=(0.50, 0.60, 0.70),
            default=0.70,
        ),
        "grey_zone": OutcomeSeverity(
            weight=0.60,
            meaning="Criterion does not clearly apply. Lower governance concern "
                    "— ambiguity in application, not in judgment.",
            evidence="○ Author hypothesis",
            sensitivity_range=(0.40, 0.50, 0.60),
            default=0.60,
        ),
    }


# ── Result types ──────────────────────────────────────────────────────────────

@dataclass
class HeterogeneityResult:
    primary_score:             dict
    marginal_map:              dict
    sparse_interaction_stress: dict
    entropy_by_dimension:      dict[str, float]
    dimension_detail:          dict[str, dict]
    governance:                dict
    severity_catalogue:        dict[str, dict]   # serialised for PDF
    evidence_note:             str
    n_total:                   int


# ── Shannon entropy (normalised) ◆ ───────────────────────────────────────────

def _entropy(counts: dict[str, int]) -> float:
    total = sum(counts.values())
    k = len(counts)
    if total == 0 or k <= 1:
        return 0.0
    raw = -sum((c / total) * math.log2(c / total)
               for c in counts.values() if c > 0)
    return round(raw / math.log2(k), 4)


# ── Within-dimension marginal analysis ───────────────────────────────────────

def _marginal_h(records: list[dict],
                dim: str,
                outcome: str,
                severity: OutcomeSeverity,
                min_n: int,
                shrink: bool) -> dict:
    """
    For one dimension: count per value, compute per-value cell H.
    Cell H = (outcome rate in value) * severity.weight
    Sparse cells: shrink toward dimension mean (Bayesian) or inflate floor.
    ○ Author hypothesis — cell scoring formula.
    """
    value_counts: dict[str, int] = {}
    value_outcome: dict[str, int] = {}
    for r in records:
        val = str(r.get(dim, "unknown"))
        value_counts[val] = value_counts.get(val, 0) + 1
        if r.get("outcome") == outcome:
            value_outcome[val] = value_outcome.get(val, 0) + 1

    n_total = len(records)
    if n_total == 0:
        return {"cells": {}, "entropy": 0.0, "n_flagged": 0, "n_cells": 0}

    w = severity.weight
    dim_mean_rate = (sum(value_outcome.values()) / n_total
                     if value_outcome else 0.0)

    cells: dict[str, dict] = {}
    n_flagged = 0

    for val, n_val in value_counts.items():
        n_out = value_outcome.get(val, 0)
        raw_rate = n_out / n_val if n_val > 0 else 0.0
        flagged = n_val < min_n

        if flagged and shrink:
            # Bayesian shrinkage toward dimension mean ○
            alpha = n_val / (n_val + min_n)
            rate = alpha * raw_rate + (1 - alpha) * dim_mean_rate
        elif flagged:
            # Sparse inflation floor ○
            rate = max(raw_rate, 0.40 * w)
        else:
            rate = raw_rate

        h_cell = min(rate * w, 1.0)
        if flagged:
            n_flagged += 1

        cells[val] = {
            "n":           n_val,
            "n_outcome":   n_out,
            "raw_rate":    round(raw_rate, 4),
            "h_cell":      round(h_cell, 4),
            "flagged":     flagged,
            "shrunk":      flagged and shrink,
        }

    return {
        "cells":     cells,
        "entropy":   _entropy(value_counts),
        "n_flagged": n_flagged,
        "n_cells":   len(cells),
    }


# ── H_within ─────────────────────────────────────────────────────────────────

def _h_within(dim_result: dict, lambda_within: float) -> float:
    cells = dim_result["cells"]
    if not cells:
        return 0.0
    scores = [(c["h_cell"], c["n"]) for c in cells.values()]
    h_max = max(s for s, _ in scores)
    total_n = sum(n for _, n in scores)
    h_wm = (sum(s * n for s, n in scores) / total_n if total_n > 0 else 0.0)
    return round(lambda_within * h_max + (1 - lambda_within) * h_wm, 4)


# ── H_between ────────────────────────────────────────────────────────────────

def _h_between(h_within_vals: list[float],
               n_per_dim: list[int],
               lambda_between: float) -> float:
    if not h_within_vals:
        return 0.0
    h_max = max(h_within_vals)
    total_n = sum(n_per_dim)
    h_wm = (sum(h * n for h, n in zip(h_within_vals, n_per_dim)) / total_n
            if total_n > 0 else sum(h_within_vals) / len(h_within_vals))
    return round(lambda_between * h_max + (1 - lambda_between) * h_wm, 4)


# ── Sparse interaction stress ─────────────────────────────────────────────────

def _sparse_stress(records: list[dict],
                   dimensions: list[str],
                   outcome: str,
                   severity: OutcomeSeverity,
                   min_n: int,
                   gamma_sparsity: float) -> dict:
    counts: dict[tuple, int] = {}
    outcome_counts: dict[tuple, int] = {}
    for r in records:
        key = tuple(str(r.get(d, "unknown")) for d in dimensions)
        counts[key] = counts.get(key, 0) + 1
        if r.get("outcome") == outcome:
            outcome_counts[key] = outcome_counts.get(key, 0) + 1

    n_total = len(records)
    if n_total == 0:
        return {"value": 0.0, "sparsity_ratio": 0.0,
                "gamma_sparsity": gamma_sparsity,
                "n_flagged": 0, "n_cells": 0}

    w = severity.weight
    cell_scores: list[float] = []
    cell_ns: list[int] = []
    n_flagged = 0

    for key, n_cell in counts.items():
        n_out = outcome_counts.get(key, 0)
        rate = n_out / n_cell if n_cell > 0 else 0.0
        flagged = n_cell < min_n
        if flagged:
            n_flagged += 1
            rate = max(rate, 0.50 * w)
        cell_scores.append(min(rate * w, 1.0))
        cell_ns.append(n_cell)

    n_cells = len(cell_scores)
    sparsity_ratio = n_flagged / n_cells if n_cells > 0 else 0.0
    h_max = max(cell_scores) if cell_scores else 0.0
    total_n = sum(cell_ns)
    h_wm = (sum(s * n for s, n in zip(cell_scores, cell_ns)) / total_n
            if total_n > 0 else 0.0)
    h_full = round(0.65 * h_max + 0.35 * h_wm, 4)
    stress = round(h_full + gamma_sparsity * sparsity_ratio, 4)

    return {
        "value":                  stress,
        "h_full_before_penalty":  h_full,
        "sparsity_ratio":         round(sparsity_ratio, 4),
        "gamma_sparsity":         gamma_sparsity,
        "n_flagged":              n_flagged,
        "n_cells":                n_cells,
        "interpretation": (
            "Stress diagnostic only. Shows what full cross-tabulation gives. "
            "High stress + high sparsity means result is driven by data gaps, "
            "not evidence. Primary hierarchical score is preferred. "
            "Sparsity is visible here, not hidden."
        ),
    }


# ── Marginal map ──────────────────────────────────────────────────────────────

def _marginal_map(h_within_vals: dict[str, float]) -> dict:
    sorted_dims = sorted(h_within_vals.items(), key=lambda x: x[1], reverse=True)
    highest = sorted_dims[0][0] if sorted_dims else "—"
    mean_val = (sum(h_within_vals.values()) / len(h_within_vals)
                if h_within_vals else 0.0)
    return {
        "value":            round(mean_val, 4),
        "highest_dimension":highest,
        "highest_value":    round(h_within_vals.get(highest, 0.0), 4),
        "per_dimension":    {d: round(v, 4) for d, v in sorted_dims},
        "evidence":         "◆ Descriptive — unweighted mean of within-dim scores",
    }


# ── Serialise severity catalogue for PDF ─────────────────────────────────────

def _serialise_severity(catalogue: dict[str, OutcomeSeverity]) -> dict[str, dict]:
    out = {}
    for name, sev in catalogue.items():
        out[name] = {
            "weight":            sev.weight,
            "default":           sev.default,
            "meaning":           sev.meaning,
            "evidence":          sev.evidence,
            "sensitivity_range": list(sev.sensitivity_range),
            "sensitivity_check": sev.sensitivity_check(),
            "audit_log":         sev.audit_log,
            "changed":           sev.weight != sev.default,
        }
    return out


# ── Main function ─────────────────────────────────────────────────────────────

def qualitative_heterogeneity_score(
    records:          list[dict],
    dimensions:       list[str],
    outcome:          str,
    mode:             str = "all",
    primary:          str = "hierarchical",
    lambda_within:    float = 0.65,
    lambda_between:   float = 0.50,
    gamma_sparsity:   float = 0.20,
    min_n:            int = 5,
    shrink:           bool = True,
    severity_catalogue: Optional[dict[str, OutcomeSeverity]] = None,
) -> HeterogeneityResult:
    """
    Qualitative heterogeneity score — hierarchical aggregation.

    severity_catalogue : dict[str, OutcomeSeverity]
        Pass a modified catalogue to override default severity weights.
        Use OutcomeSeverity.change() to record audit trail before passing.
        If None, default_severity_catalogue() is used.

    We do not hide sparsity.
    We do not let sparsity alone determine heterogeneity.
    We do not pretend qualitative heterogeneity is one natural number.
    We give optimisation one explicit, governance-parameterised score.
    """
    n_total = len(records)
    if severity_catalogue is None:
        severity_catalogue = default_severity_catalogue()

    severity = severity_catalogue.get(outcome)
    if severity is None:
        # Unknown outcome — default moderate severity
        severity = OutcomeSeverity(
            weight=0.70, meaning="Unknown outcome type",
            evidence="○ Default — unknown outcome",
            sensitivity_range=(0.50, 0.60, 0.70), default=0.70,
        )

    # Within-dimension
    dim_results: dict[str, dict] = {}
    h_within_vals: dict[str, float] = {}

    for dim in dimensions:
        dr = _marginal_h(records, dim, outcome, severity, min_n, shrink)
        hw = _h_within(dr, lambda_within)
        dim_results[dim] = {**dr, "h_within": hw}
        h_within_vals[dim] = hw

    # Primary: hierarchical
    h_hier = _h_between(
        list(h_within_vals.values()),
        [n_total] * len(dimensions),
        lambda_between,
    )

    primary_score = {
        "name":           "hierarchical_heterogeneity_score",
        "value":          h_hier,
        "lambda_within":  lambda_within,
        "lambda_between": lambda_between,
        "outcome":        outcome,
        "severity_weight_used": severity.weight,
        "severity_meaning":     severity.meaning,
        "severity_evidence":    severity.evidence,
        "sensitivity_range":    list(severity.sensitivity_range),
        "interpretation": (
            f"H estimated within each of {len(dimensions)} dimensions, "
            f"then aggregated across dimensions. "
            f"λ_within={lambda_within} (worst-case cell weight within dimension). "
            f"λ_between={lambda_between} (worst-case dimension weight). "
            f"Severity weight for '{outcome}': {severity.weight} — "
            f"amplification factor, NOT an observed rate."
        ),
        "evidence": "○ Author hypothesis (Vahtian, 2026)",
    }

    mmap    = _marginal_map(h_within_vals)
    stress  = _sparse_stress(records, dimensions, outcome,
                             severity, min_n, gamma_sparsity)
    entropy = {dim: dim_results[dim]["entropy"] for dim in dimensions}

    governance = {
        "lambda_within":    lambda_within,
        "lambda_between":   lambda_between,
        "gamma_sparsity":   gamma_sparsity,
        "min_n":            min_n,
        "shrink":           shrink,
        "outcome":          outcome,
        "severity_weight":  severity.weight,
        "severity_default": severity.default,
        "severity_changed": severity.weight != severity.default,
        "severity_audit_log": severity.audit_log,
        "note": (
            "λ_within, λ_between, γ, and severity weights are governance choices "
            "made by the research team. They are not learned from data and are "
            "not universal constants. Severity weights are amplification factors "
            "for outcome types — NOT observed rates. "
            "All changes are recorded in the audit log."
        ),
    }

    evidence_note = (
        "PRIMARY: hierarchical H [○ Author hypothesis, Vahtian 2026]. "
        f"Severity weight for '{outcome}': {severity.weight} "
        f"[amplification factor, NOT a rate; {severity.evidence}]. "
        "Sensitivity range: " + str(severity.sensitivity_range) + ". "
        "MARGINAL MAP: descriptive [◆ Consensus]. "
        "ENTROPY: Shannon normalised [◆ Consensus]. "
        "SPARSE STRESS: full cross-tab + γ penalty [○ Author hypothesis]. "
        "λ parameters: governance choices [◌ Opinion range]. "
        "Shrinkage: Bayesian toward dimension mean [○ Author hypothesis]."
    )

    return HeterogeneityResult(
        primary_score=primary_score,
        marginal_map=mmap,
        sparse_interaction_stress=stress,
        entropy_by_dimension=entropy,
        dimension_detail=dim_results,
        governance=governance,
        severity_catalogue=_serialise_severity(severity_catalogue),
        evidence_note=evidence_note,
        n_total=n_total,
    )


# ── Demo: with pilot audit adjustment ────────────────────────────────────────

def _demo_records(n=120) -> list[dict]:
    import random; random.seed(42)
    return [dict(
        study_design=random.choice(
            ["phenomenology","grounded_theory","ethnography",
             "thematic_analysis","IPA","case_study"]),
        population=random.choice(
            ["adult_cancer_patients","clinicians","caregivers","mixed","survivors"]),
        setting=random.choice(
            ["hospital_outpatient","primary_care","community","online","inpatient"]),
        language=random.choice(["English","Nordic","mixed","other"]),
        data_collection=random.choice(
            ["interview","focus_group","observation","document_analysis"]),
        analysis_method=random.choice(
            ["thematic_analysis","framework","IPA",
             "grounded_theory","content_analysis"]),
        theoretical_framework=random.choice(
            ["phenomenology","social_constructivism","critical_realism",
             "interpretivism","none_stated"]),
        trustworthiness=random.choice(["high","moderate","low","not_reported"]),
        outcome=random.choices(
            ["judge_human_disagreement","grey_zone",
             "criterion_disagreement","judge_error"],
            weights=[0.35,0.35,0.20,0.10])[0],
    ) for _ in range(n)]


if __name__ == "__main__":
    import json

    records = _demo_records(120)

    # Pilot audit: team adjusts severity weight with documented reason
    catalogue = default_severity_catalogue()
    catalogue["judge_human_disagreement"].change(
        new_weight=0.75,
        changed_by="research_team",
        reason="Pilot audit (n=12) suggested lower disagreement rate "
               "than initial stress assumption. Observed disagreement "
               "approx 18%, not the 30%+ implied by weight 0.90.",
    )

    result = qualitative_heterogeneity_score(
        records,
        dimensions=[
            "study_design", "population", "setting", "language",
            "data_collection", "analysis_method",
            "theoretical_framework", "trustworthiness",
        ],
        outcome="judge_human_disagreement",
        mode="all",
        primary="hierarchical",
        lambda_within=0.65,
        lambda_between=0.50,
        gamma_sparsity=0.20,
        min_n=5,
        shrink=True,
        severity_catalogue=catalogue,
    )

    p = result.primary_score
    print(f"\n{'='*62}")
    print(f"  MethodVahti v0.3.0 — Qualitative Heterogeneity Score")
    print(f"{'='*62}")
    print(f"  N total: {result.n_total}")

    print(f"\n  PRIMARY SCORE")
    print(f"  {p['name']}: {p['value']}")
    print(f"  λ_within={p['lambda_within']}  λ_between={p['lambda_between']}")
    print(f"  Severity weight: {p['severity_weight_used']} "
          f"(default was {result.severity_catalogue['judge_human_disagreement']['default']})")
    print(f"  Meaning: {p['severity_meaning'][:80]}...")
    print(f"  Sensitivity range: {p['sensitivity_range']}")

    m = result.marginal_map
    print(f"\n  MARGINAL MAP  (descriptive)")
    print(f"  value: {m['value']}  highest: {m['highest_dimension']} "
          f"({m['highest_value']})")
    for d, v in m["per_dimension"].items():
        bar = "█" * int(v * 30)
        print(f"    {d:28s}  {v:.3f}  {bar}")

    st = result.sparse_interaction_stress
    print(f"\n  SPARSE STRESS  (diagnostic)")
    print(f"  value: {st['value']}  sparsity: {st['sparsity_ratio']} "
          f"({st['n_flagged']}/{st['n_cells']} flagged)")

    print(f"\n  ENTROPY BY DIMENSION")
    for d, e in sorted(result.entropy_by_dimension.items(),
                       key=lambda x: x[1], reverse=True):
        print(f"    {d:28s}  {e:.3f}")

    print(f"\n  SEVERITY AUDIT LOG")
    log = result.severity_catalogue["judge_human_disagreement"]["audit_log"]
    for entry in log:
        print(f"    {entry['timestamp']}")
        print(f"    {entry['changed_from']} → {entry['changed_to']}")
        print(f"    by: {entry['changed_by']}")
        print(f"    reason: {entry['reason']}")

    out = {
        "primary_score":             result.primary_score,
        "marginal_map":              result.marginal_map,
        "sparse_interaction_stress": result.sparse_interaction_stress,
        "entropy_by_dimension":      result.entropy_by_dimension,
        "governance":                result.governance,
        "severity_catalogue":        result.severity_catalogue,
        "evidence_note":             result.evidence_note,
        "n_total":                   result.n_total,
    }
    with open("/home/claude/heterogeneity_result.json", "w") as f:
        json.dump(out, f, indent=2)
    print(f"\n  Saved → /home/claude/heterogeneity_result.json")
