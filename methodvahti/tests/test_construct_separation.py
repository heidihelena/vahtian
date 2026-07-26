"""Ch. 1.2.5 (D1/D3): the boundary between constructs is absolute, both ways."""

import warnings

import pytest

import methodvahti
from methodvahti.heterogeneity import (
    sampling_heterogeneity_score,
    qualitative_heterogeneity_score,
)

RECORDS = [
    {"design": "cohort", "sampling": "purposive", "outcome": "disagreement",
     "outcome_present": bool(i % 3)} for i in range(12)
]
ARGS = dict(dimensions=["design", "sampling"], outcome="disagreement")


def test_deprecated_alias_warns_and_is_identical():
    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        with pytest.raises(DeprecationWarning):
            qualitative_heterogeneity_score(RECORDS, **ARGS)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        old = qualitative_heterogeneity_score(RECORDS, **ARGS)
    new = sampling_heterogeneity_score(RECORDS, **ARGS)
    assert old == new


def test_primary_score_names_its_construct_and_scopes_worst_case():
    r = sampling_heterogeneity_score(RECORDS, **ARGS)
    ps = r.primary_score if hasattr(r, "primary_score") else r["primary_score"]
    assert ps["construct"] == "sampling heterogeneity"
    interp = ps["interpretation"]
    assert "sampling" in interp
    assert "not a defensibility" in interp


def test_heterogeneity_module_does_not_import_defensibility():
    import methodvahti.heterogeneity as h
    src = open(h.__file__).read()
    assert "from methodvahti.defensibility" not in src
    assert "from .defensibility" not in src
    assert "import defensibility" not in src


def test_package_exports_both_constructs_under_canonical_names():
    assert hasattr(methodvahti, "sampling_heterogeneity_score")
    assert hasattr(methodvahti, "classify_defensibility")
