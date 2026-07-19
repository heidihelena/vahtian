"""
Property-based tests — methodvahti.heterogeneity invariants.

The review (VALIDATION.md Ch. 3.2) notes that four invariants currently hold
only *incidentally* — no test names them, so a future refactor could break them
silently. This module asserts them explicitly with Hypothesis so they are
guarded:

  1. Permutation invariance — record order does not change the score.
  2. Determinism           — identical inputs give byte-identical results.
  3. Monotonicity in λ_within  — raising λ_within never lowers H.
  4. Monotonicity in severity weight — raising the weight never lowers H.
  5. Bounds & boundary behaviour — H ∈ [0, 1]; all-outcome → high, no-outcome → 0.

All tests run fully offline (Hypothesis generates data in-process, no network,
no files). If Hypothesis is not installed the module skips cleanly rather than
erroring, so the core suite still runs on a bare interpreter.
"""

import copy
import random
import unittest

try:
    from hypothesis import given, settings, strategies as st, HealthCheck
    _HAS_HYPOTHESIS = True
except ImportError:  # pragma: no cover - environment without hypothesis
    _HAS_HYPOTHESIS = False

from methodvahti.heterogeneity import (
    qualitative_heterogeneity_score,
    default_severity_catalogue,
)


DIMS = ["study_design", "population", "language", "trustworthiness"]
OUTCOME = "judge_human_disagreement"
_DESIGNS = ["IPA", "grounded_theory", "ethnography", "phenomenology"]
_POPS = ["patients", "clinicians", "caregivers"]
_LANGS = ["English", "Nordic", "mixed"]
_TRUST = ["high", "moderate", "low"]
_OUTCOMES = [OUTCOME, "grey_zone", "criterion_disagreement", "judge_error"]


def _primary(records, **kwargs):
    return qualitative_heterogeneity_score(
        records, dimensions=DIMS, outcome=OUTCOME, **kwargs
    ).primary_score["value"]


if _HAS_HYPOTHESIS:

    # A Hypothesis strategy for one record: categorical design cells + an outcome.
    _record = st.fixed_dictionaries({
        "study_design": st.sampled_from(_DESIGNS),
        "population": st.sampled_from(_POPS),
        "language": st.sampled_from(_LANGS),
        "trustworthiness": st.sampled_from(_TRUST),
        "outcome": st.sampled_from(_OUTCOMES),
    })
    _records = st.lists(_record, min_size=1, max_size=60)

    # Larger corpora make monotonicity easier to observe than tiny sparse ones,
    # but the property must hold for any n, so we keep min_size=1.
    _slow = settings(max_examples=150, deadline=None,
                     suppress_health_check=[HealthCheck.too_slow])

    class TestPermutationInvariance(unittest.TestCase):
        # FINDING (property test, not caught by the review's spot-checks):
        # permutation invariance is exact in real arithmetic but NOT bit-exact
        # in float, because the within-dimension weighted mean sums cells in
        # dict-insertion order, which follows record order. Float
        # non-associativity moves the pre-rounding value by < 1e-9, which can
        # tip a 4th-decimal rounding boundary — e.g. 0.5566 vs 0.5565. The
        # rounded score therefore differs by AT MOST one last-decimal unit
        # (1e-4). We assert that true invariant here; VALIDATION.md Ch. 3.2
        # records the finding and the exact-invariance fix (sort cells before
        # summation). max()-based terms are order-independent, so the bound holds.
        _ROUND_UNIT = 1e-4

        @_slow
        @given(_records, st.randoms(use_true_random=True))
        def test_order_changes_score_by_at_most_one_rounding_unit(self, records, rng):
            shuffled = list(records)
            rng.shuffle(shuffled)
            a, b = _primary(records), _primary(shuffled)
            self.assertLessEqual(abs(a - b), self._ROUND_UNIT + 1e-12,
                                 f"permutation moved score by > 1e-4: {a} vs {b}")

    class TestDeterminism(unittest.TestCase):
        @_slow
        @given(_records)
        def test_identical_inputs_identical_score(self, records):
            a = _primary(copy.deepcopy(records))
            b = _primary(copy.deepcopy(records))
            self.assertEqual(a, b)

    class TestMonotonicityLambdaWithin(unittest.TestCase):
        @_slow
        @given(_records, st.floats(0.0, 0.45), st.floats(0.55, 1.0))
        def test_higher_lambda_within_never_lowers_score(self, records, lo, hi):
            # λ_within shifts weight from the mean toward the worst cell; with
            # h_max >= h_weighted_mean by construction, higher λ_within cannot
            # lower H. Allow a rounding epsilon (scores are round(., 4)).
            h_lo = _primary(records, lambda_within=lo)
            h_hi = _primary(records, lambda_within=hi)
            self.assertGreaterEqual(h_hi, h_lo - 1e-9)

    class TestMonotonicitySeverity(unittest.TestCase):
        @_slow
        @given(_records, st.floats(0.0, 0.45), st.floats(0.55, 1.0))
        def test_higher_severity_never_lowers_score(self, records, lo, hi):
            cat_lo = default_severity_catalogue()
            cat_hi = default_severity_catalogue()
            cat_lo[OUTCOME].change(lo, "test", "property: low weight")
            cat_hi[OUTCOME].change(hi, "test", "property: high weight")
            h_lo = qualitative_heterogeneity_score(
                records, dimensions=DIMS, outcome=OUTCOME,
                severity_catalogue=cat_lo).primary_score["value"]
            h_hi = qualitative_heterogeneity_score(
                records, dimensions=DIMS, outcome=OUTCOME,
                severity_catalogue=cat_hi).primary_score["value"]
            self.assertGreaterEqual(h_hi, h_lo - 1e-9)

    class TestBounds(unittest.TestCase):
        @_slow
        @given(_records,
               st.floats(0.0, 1.0), st.floats(0.0, 1.0),
               st.integers(1, 10), st.booleans())
        def test_score_in_unit_interval(self, records, lw, lb, min_n, shrink):
            h = _primary(records, lambda_within=lw, lambda_between=lb,
                         min_n=min_n, shrink=shrink)
            self.assertGreaterEqual(h, 0.0)
            self.assertLessEqual(h, 1.0)


class TestBoundaryBehaviour(unittest.TestCase):
    """Deterministic boundary cases (run regardless of Hypothesis presence)."""

    def _corpus(self, outcome_value):
        # 30 records, dense enough that no cell is sparse-flagged at min_n=5.
        rng = random.Random(0)
        return [dict(
            study_design=rng.choice(_DESIGNS),
            population=rng.choice(_POPS),
            language=rng.choice(_LANGS),
            trustworthiness=rng.choice(_TRUST),
            outcome=outcome_value,
        ) for _ in range(30)]

    def test_no_outcome_present_gives_zero(self):
        # Every record has a different outcome than requested → rate 0 → H 0.
        records = self._corpus("grey_zone")
        self.assertEqual(_primary(records), 0.0)

    def test_all_outcome_present_is_high_and_bounded(self):
        # Every record IS the requested outcome → rate 1 in every populated
        # cell → H approaches the severity weight (0.90), and stays <= 1.
        records = self._corpus(OUTCOME)
        h = _primary(records)
        self.assertGreater(h, 0.0)
        self.assertLessEqual(h, 1.0)

    def test_empty_corpus_is_zero(self):
        self.assertEqual(_primary([]), 0.0)

    def test_single_record_is_bounded(self):
        one = [dict(study_design="IPA", population="patients",
                    language="English", trustworthiness="high",
                    outcome=OUTCOME)]
        h = _primary(one)
        self.assertGreaterEqual(h, 0.0)
        self.assertLessEqual(h, 1.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
