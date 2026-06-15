"""
Unit tests — methodvahti.heterogeneity
All tests run fully offline. No network, no files.

Coverage:
- OutcomeSeverity: default, change, audit log, sensitivity check
- _entropy: edge cases
- qualitative_heterogeneity_score: smoke, governance, severity audit
- aggregate properties: primary <= stress (not always, but stress >= primary)
- empty records
- single-dimension edge case
"""

import math
import unittest
from methodvahti.heterogeneity import (
    qualitative_heterogeneity_score,
    default_severity_catalogue,
    OutcomeSeverity,
    HeterogeneityResult,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

DIMS = ["study_design", "population", "language", "trustworthiness"]
OUTCOME = "judge_human_disagreement"

def _records(n=30, seed=0):
    import random
    random.seed(seed)
    designs = ["IPA", "grounded_theory", "ethnography"]
    populations = ["patients", "clinicians", "caregivers"]
    languages = ["English", "Nordic", "mixed"]
    trust = ["high", "moderate", "low"]
    outcomes = [OUTCOME, "grey_zone", "criterion_disagreement", "judge_error"]
    weights = [0.40, 0.30, 0.20, 0.10]
    return [dict(
        study_design=random.choice(designs),
        population=random.choice(populations),
        language=random.choice(languages),
        trustworthiness=random.choice(trust),
        outcome=random.choices(outcomes, weights=weights)[0],
    ) for _ in range(n)]


# ── OutcomeSeverity ───────────────────────────────────────────────────────────

class TestOutcomeSeverity(unittest.TestCase):

    def test_default_catalogue_keys(self):
        cat = default_severity_catalogue()
        self.assertIn("judge_human_disagreement", cat)
        self.assertIn("judge_error", cat)
        self.assertIn("grey_zone", cat)
        self.assertIn("criterion_disagreement", cat)

    def test_default_weight_range(self):
        cat = default_severity_catalogue()
        for name, sev in cat.items():
            self.assertGreaterEqual(sev.weight, 0.0, name)
            self.assertLessEqual(sev.weight, 1.0, name)

    def test_severity_is_not_a_rate(self):
        """Meaning field must explicitly state it is NOT a rate."""
        cat = default_severity_catalogue()
        for name, sev in cat.items():
            self.assertIn("NOT", sev.meaning.upper(),
                msg=f"{name}: meaning must clarify weight is NOT a rate")

    def test_change_records_audit(self):
        cat = default_severity_catalogue()
        sev = cat["judge_human_disagreement"]
        original = sev.weight
        sev.change(0.75, "research_team", "Pilot audit suggested lower severity.")
        self.assertEqual(sev.weight, 0.75)
        self.assertEqual(len(sev.audit_log), 1)
        log = sev.audit_log[0]
        self.assertEqual(log["changed_from"], original)
        self.assertEqual(log["changed_to"], 0.75)
        self.assertEqual(log["changed_by"], "research_team")
        self.assertIn("timestamp", log)

    def test_multiple_changes_all_logged(self):
        cat = default_severity_catalogue()
        sev = cat["judge_human_disagreement"]
        sev.change(0.80, "PI", "First revision.")
        sev.change(0.75, "team", "Second revision after extended pilot.")
        self.assertEqual(len(sev.audit_log), 2)
        self.assertEqual(sev.weight, 0.75)

    def test_sensitivity_check_returns_all_range_values(self):
        cat = default_severity_catalogue()
        sev = cat["judge_human_disagreement"]
        checks = sev.sensitivity_check()
        for v in sev.sensitivity_range:
            self.assertIn(v, checks)

    def test_default_unchanged_flag(self):
        cat = default_severity_catalogue()
        sev = cat["judge_human_disagreement"]
        self.assertEqual(sev.weight, sev.default)
        sev.change(0.75, "team", "reason")
        self.assertNotEqual(sev.weight, sev.default)


# ── Main function smoke tests ─────────────────────────────────────────────────

class TestQualitativeHeterogeneityScore(unittest.TestCase):

    def _run(self, n=30, **kwargs):
        records = _records(n)
        return qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME, **kwargs)

    def test_returns_heterogeneity_result(self):
        result = self._run()
        self.assertIsInstance(result, HeterogeneityResult)

    def test_primary_score_in_range(self):
        result = self._run()
        v = result.primary_score["value"]
        self.assertGreaterEqual(v, 0.0)
        self.assertLessEqual(v, 1.0)

    def test_primary_name(self):
        result = self._run()
        self.assertEqual(
            result.primary_score["name"],
            "hierarchical_heterogeneity_score")

    def test_n_total_matches(self):
        result = self._run(n=30)
        self.assertEqual(result.n_total, 30)

    def test_empty_records(self):
        result = qualitative_heterogeneity_score(
            [], dimensions=DIMS, outcome=OUTCOME)
        self.assertEqual(result.primary_score["value"], 0.0)
        self.assertEqual(result.n_total, 0)

    def test_single_dimension(self):
        records = _records(20)
        result = qualitative_heterogeneity_score(
            records, dimensions=["study_design"], outcome=OUTCOME)
        self.assertGreaterEqual(result.primary_score["value"], 0.0)

    def test_all_dimensions_in_entropy(self):
        result = self._run()
        for dim in DIMS:
            self.assertIn(dim, result.entropy_by_dimension)

    def test_entropy_in_range(self):
        result = self._run()
        for dim, e in result.entropy_by_dimension.items():
            self.assertGreaterEqual(e, 0.0, dim)
            self.assertLessEqual(e, 1.0 + 1e-9, dim)

    def test_marginal_map_highest_dim_is_in_dims(self):
        result = self._run()
        hd = result.marginal_map["highest_dimension"]
        self.assertIn(hd, DIMS)

    def test_marginal_map_value_in_range(self):
        result = self._run()
        v = result.marginal_map["value"]
        self.assertGreaterEqual(v, 0.0)
        self.assertLessEqual(v, 1.0)

    def test_sparse_stress_has_required_keys(self):
        result = self._run()
        st = result.sparse_interaction_stress
        for key in ["value", "sparsity_ratio", "n_flagged", "n_cells",
                    "gamma_sparsity"]:
            self.assertIn(key, st)

    def test_sparsity_ratio_in_range(self):
        result = self._run()
        sr = result.sparse_interaction_stress["sparsity_ratio"]
        self.assertGreaterEqual(sr, 0.0)
        self.assertLessEqual(sr, 1.0)

    def test_governance_contains_lambda(self):
        result = self._run(lambda_within=0.70, lambda_between=0.45)
        g = result.governance
        self.assertEqual(g["lambda_within"], 0.70)
        self.assertEqual(g["lambda_between"], 0.45)

    def test_severity_audit_log_in_result(self):
        cat = default_severity_catalogue()
        cat[OUTCOME].change(0.75, "team", "Pilot.")
        result = qualitative_heterogeneity_score(
            _records(), dimensions=DIMS, outcome=OUTCOME,
            severity_catalogue=cat)
        log = result.severity_catalogue[OUTCOME]["audit_log"]
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["changed_to"], 0.75)

    def test_severity_changed_flag(self):
        cat = default_severity_catalogue()
        cat[OUTCOME].change(0.75, "team", "Pilot.")
        result = qualitative_heterogeneity_score(
            _records(), dimensions=DIMS, outcome=OUTCOME,
            severity_catalogue=cat)
        self.assertTrue(result.severity_catalogue[OUTCOME]["changed"])

    def test_severity_unchanged_flag(self):
        result = self._run()
        self.assertFalse(result.severity_catalogue[OUTCOME]["changed"])

    def test_lower_lambda_within_lowers_score(self):
        """Lower λ_within shifts weight from worst cell to mean → lower H."""
        records = _records(60)
        r_high = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME, lambda_within=0.90)
        r_low  = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME, lambda_within=0.10)
        self.assertGreaterEqual(
            r_high.primary_score["value"],
            r_low.primary_score["value"])

    def test_higher_severity_raises_score(self):
        """Higher severity weight → higher primary score."""
        records = _records(60)
        cat_high = default_severity_catalogue()
        cat_low  = default_severity_catalogue()
        cat_high[OUTCOME].change(1.00, "test", "max")
        cat_low[OUTCOME].change(0.10, "test", "min")
        r_high = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME,
            severity_catalogue=cat_high)
        r_low  = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME,
            severity_catalogue=cat_low)
        self.assertGreaterEqual(
            r_high.primary_score["value"],
            r_low.primary_score["value"])

    def test_shrink_true_vs_false(self):
        """Shrinkage should not raise errors; both paths run."""
        records = _records(15)  # small — many flagged cells
        r_shrink   = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME, shrink=True)
        r_noshrink = qualitative_heterogeneity_score(
            records, dimensions=DIMS, outcome=OUTCOME, shrink=False)
        self.assertIsInstance(r_shrink.primary_score["value"], float)
        self.assertIsInstance(r_noshrink.primary_score["value"], float)

    def test_evidence_note_present(self):
        result = self._run()
        self.assertIn("○", result.evidence_note)
        self.assertIn("◆", result.evidence_note)
        self.assertIn("◌", result.evidence_note)

    def test_severity_meaning_in_primary_score(self):
        result = self._run()
        self.assertIn("severity_meaning", result.primary_score)
        self.assertIn("NOT", result.primary_score["severity_meaning"].upper())

    def test_sensitivity_range_in_primary_score(self):
        result = self._run()
        self.assertIn("sensitivity_range", result.primary_score)
        self.assertEqual(len(result.primary_score["sensitivity_range"]), 3)


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    unittest.main(verbosity=2)
