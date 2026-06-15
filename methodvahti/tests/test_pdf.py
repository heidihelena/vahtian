"""
Unit tests — methodvahti_pdf.optimise_n (+ a guarded build smoke test).

optimise_n is pure Python and tested fully offline with no dependencies.
The build() smoke test is skipped automatically if reportlab is not installed.
"""

import os
import tempfile
import unittest

from methodvahti_pdf import optimise_n, _san


BASE = {
    "heterogeneity": 0.35, "theme_prevalence": 0.30, "depth": "explanatory",
    "specificity": 0.60, "theory_strength": 0.50, "data_quality": 0.60,
    "power": 0.80,
}


class TestOptimiseN(unittest.TestCase):

    def test_returns_required_keys(self):
        r = optimise_n(BASE)
        for k in ("optimal_n", "stable", "stability_range", "models",
                  "information_power_index", "evidence", "interpretation"):
            self.assertIn(k, r)

    def test_optimal_n_is_positive_int(self):
        r = optimise_n(BASE)
        self.assertIsInstance(r["optimal_n"], int)
        self.assertGreater(r["optimal_n"], 0)

    def test_three_models_present_and_positive(self):
        r = optimise_n(BASE)
        for name in ("linear_saturation", "network_complexity", "fuzzy_set_qca"):
            self.assertIn(name, r["models"])
            self.assertGreaterEqual(r["models"][name], 4)

    def test_optimal_in_stability_range(self):
        r = optimise_n(BASE)
        lo, hi = r["stability_range"]
        self.assertLessEqual(lo, r["optimal_n"])
        self.assertLessEqual(r["optimal_n"], hi)

    def test_higher_heterogeneity_raises_n(self):
        lo = optimise_n({**BASE, "heterogeneity": 0.10})["optimal_n"]
        hi = optimise_n({**BASE, "heterogeneity": 0.90})["optimal_n"]
        self.assertGreater(hi, lo)

    def test_higher_specificity_lowers_n(self):
        broad = optimise_n({**BASE, "specificity": 0.10})["optimal_n"]
        narrow = optimise_n({**BASE, "specificity": 0.95})["optimal_n"]
        self.assertGreaterEqual(broad, narrow)

    def test_depth_orders_n(self):
        d = optimise_n({**BASE, "depth": "descriptive"})["optimal_n"]
        e = optimise_n({**BASE, "depth": "explanatory"})["optimal_n"]
        t = optimise_n({**BASE, "depth": "theoretical"})["optimal_n"]
        self.assertLessEqual(d, e)
        self.assertLessEqual(e, t)

    def test_stable_flag_is_bool(self):
        self.assertIsInstance(optimise_n(BASE)["stable"], bool)

    def test_clamps_out_of_range_inputs(self):
        r = optimise_n({**BASE, "heterogeneity": 5.0, "specificity": -3.0})
        self.assertGreater(r["optimal_n"], 0)

    def test_mixed_methods_sets_comparative_floor(self):
        r = optimise_n({**BASE, "mixed_methods": True, "min_detectable_diff": 0.20})
        self.assertIsNotNone(r["comparative_floor"])
        self.assertGreater(r["comparative_floor"], 0)

    def test_no_mixed_methods_no_floor(self):
        self.assertIsNone(optimise_n(BASE)["comparative_floor"])

    def test_evidence_marks_author_hypothesis(self):
        self.assertIn("Author hypothesis", optimise_n(BASE)["evidence"])

    def test_missing_heterogeneity_defaults_to_zero(self):
        r = optimise_n({"depth": "descriptive"})
        self.assertGreater(r["optimal_n"], 0)


class TestSanitiser(unittest.TestCase):

    def test_strips_evidence_glyphs(self):
        self.assertEqual(_san("○ Author hypothesis"), "Author hypothesis")
        self.assertEqual(_san("◆ Consensus map"), "Consensus map")

    def test_keeps_plain_text(self):
        self.assertEqual(_san("plain text"), "plain text")


class TestBuildSmoke(unittest.TestCase):

    def test_build_writes_pdf(self):
        try:
            import reportlab  # noqa: F401
        except ImportError:
            self.skipTest("reportlab not installed")
        from methodvahti_pdf import build
        report = {
            "report_id": "MV-TEST", "study_title": "Smoke test",
            "optimisation_params": BASE,
            "research_question": "Does it render?",
            "can_conclude": ["yes"], "cannot_conclude": ["nothing else"],
        }
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "smoke.pdf")
            path = build(report, out)
            self.assertTrue(os.path.exists(path))
            self.assertGreater(os.path.getsize(path), 1000)
            with open(path, "rb") as f:
                self.assertEqual(f.read(5), b"%PDF-")


if __name__ == "__main__":
    unittest.main(verbosity=2)
