"""Ch. 1.2.5 (D1): sampling heterogeneity is the sole numeric input to
optimise_n(), and the boundary crossing is explicit. Release gates."""

import pytest

from methodvahti.heterogeneity import sampling_heterogeneity_score
from methodvahti.defensibility import classify_defensibility
from methodvahti_pdf import optimise_n, sampling_heterogeneity_input

RECORDS = [
    {"design": "cohort", "sampling": "purposive", "outcome": "disagreement",
     "outcome_present": bool(i % 3)} for i in range(12)
]
BASE = {"theme_prevalence": 0.30, "depth": "explanatory", "specificity": 0.5,
        "theory_strength": 0.5, "data_quality": 0.5, "power": 0.80}


def _result():
    return sampling_heterogeneity_score(
        RECORDS, dimensions=["design", "sampling"], outcome="disagreement")


def test_explicit_crossing_equals_raw_value():
    r = _result()
    via_helper = optimise_n({**sampling_heterogeneity_input(r), **BASE})
    ps = r.primary_score if hasattr(r, "primary_score") else r["primary_score"]
    direct = optimise_n({"heterogeneity": ps["value"], **BASE})
    assert via_helper["optimal_n"] == direct["optimal_n"]


def test_helper_rejects_defensibility_classification():
    c = classify_defensibility({"sampling": "Limited", "analysis": "Strong"})
    with pytest.raises(ValueError, match="never enters sample-size"):
        sampling_heterogeneity_input(c)


def test_helper_requires_declared_construct():
    with pytest.raises(ValueError):
        sampling_heterogeneity_input({"primary_score": {"value": 0.4}})


def test_optimise_n_rejects_label_strings():
    for label in ("Strong", "Adequate", "Limited"):
        with pytest.raises(ValueError, match="boundary is absolute"):
            optimise_n({"heterogeneity": label, **BASE})


def test_optimise_n_rejects_result_objects():
    with pytest.raises(ValueError, match="cross the boundary"):
        optimise_n({"heterogeneity": _result(), **BASE})
    c = classify_defensibility({"a": "Adequate"})
    with pytest.raises(ValueError):
        optimise_n({"heterogeneity": c, **BASE})


def test_provenance_names_the_construct():
    out = optimise_n({"heterogeneity": 0.35, **BASE})
    assert out["inputs"]["heterogeneity_construct"] == "sampling heterogeneity"
