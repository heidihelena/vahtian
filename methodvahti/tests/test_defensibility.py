"""Release-gate tests for the defensibility classification (VALIDATION.md
Ch. 1.2.3 "Testable now" + Ch. 1.2.5). These are gates, not diagnostics: a
future maintainer may not reason past them (Ch. 3.4)."""

import pytest

from methodvahti.defensibility import (
    DEFENSIBILITY_LABELS,
    NOT_ASSESSABLE,
    Escalation,
    Flag,
    Override,
    classify_defensibility,
    render_report,
)

BASE = {
    "research_question": "Strong",
    "sampling": "Limited",
    "data_collection": "Adequate",
    "analysis": "Adequate",
    "reflexivity": "Strong",
}


# ── The rule ─────────────────────────────────────────────────────────────────

def test_overall_is_least_favourable_dimension():
    r = classify_defensibility(BASE)
    assert r["overall"] == "Limited"
    assert r["weakest_dimensions"] == ["sampling"]
    assert r["derivation"] == "least-favourable dimension rule"


def test_all_strong_classifies_strong():
    r = classify_defensibility({"a": "Strong", "b": "Strong"})
    assert r["overall"] == "Strong"


def test_no_favourable_dimension_raises_overall():
    # Adding Strong dimensions must never improve the classification.
    weak = {"sampling": "Limited"}
    strong_added = {**weak, **{f"d{i}": "Strong" for i in range(10)}}
    assert (classify_defensibility(weak)["overall"]
            == classify_defensibility(strong_added)["overall"] == "Limited")


def test_monotonicity_improving_a_dimension_never_worsens():
    worse = classify_defensibility({"a": "Limited", "b": "Adequate"})
    better = classify_defensibility({"a": "Adequate", "b": "Adequate"})
    order = {"Strong": 0, "Adequate": 1, "Limited": 2}
    assert order[better["overall"]] <= order[worse["overall"]]


# ── Release gate: replication invariance (axiom A2) ──────────────────────────

def test_replication_invariance():
    """Coding the same construct twice must not change the classification."""
    once = classify_defensibility(BASE)
    twice = classify_defensibility({**BASE, "sampling_recoded": "Limited"})
    assert once["overall"] == twice["overall"]


def test_codebook_granularity_invariance():
    """COREQ-style fine splitting vs SRQR-style coarse coding of the same
    judgements must classify identically (the defect that killed the λ mix)."""
    coarse = {"reporting": "Adequate", "sampling": "Limited"}
    fine = {f"reporting_item_{i}": "Adequate" for i in range(32)}
    fine["sampling"] = "Limited"
    assert (classify_defensibility(coarse)["overall"]
            == classify_defensibility(fine)["overall"])


# ── Release gate: ordinal invariance (axiom A3) ──────────────────────────────

def test_ordinal_invariance_under_relabelling():
    """The classification must depend only on the order of the labels, not on
    any spacing. Relabelling monotonically and mapping back is identity."""
    relabel = {"Strong": "Strong", "Adequate": "Adequate", "Limited": "Limited"}
    r1 = classify_defensibility(BASE)
    r2 = classify_defensibility({d: relabel[l] for d, l in BASE.items()})
    assert r1["overall"] == r2["overall"]
    assert r1["weakest_dimensions"] == r2["weakest_dimensions"]


def test_permutation_invariance():
    items = list(BASE.items())
    r1 = classify_defensibility(dict(items))
    r2 = classify_defensibility(dict(reversed(items)))
    assert r1["overall"] == r2["overall"]
    assert r1["weakest_dimensions"] == r2["weakest_dimensions"]


# ── Not assessable is a data-state, not a rating ─────────────────────────────

def test_not_assessable_excluded_from_rule_but_reported():
    r = classify_defensibility({**BASE, "ethics": NOT_ASSESSABLE})
    assert r["overall"] == "Limited"           # rule unchanged
    assert r["not_assessable"] == ["ethics"]   # reported
    assert r["incomplete"] is True


def test_all_not_assessable_propagates_data_state():
    r = classify_defensibility({"a": NOT_ASSESSABLE, "b": NOT_ASSESSABLE})
    assert r["overall"] == NOT_ASSESSABLE
    assert r["weakest_dimensions"] == []


def test_not_assessable_never_caps_mechanically():
    # One Strong assessed + one not-assessable → Strong (incomplete), not a cap.
    r = classify_defensibility({"a": "Strong", "b": NOT_ASSESSABLE})
    assert r["overall"] == "Strong"
    assert r["incomplete"] is True


# ── Flags, escalation, override ──────────────────────────────────────────────

def test_flag_forces_limited_with_reasoning():
    r = classify_defensibility(
        {"a": "Strong"},
        flags=[Flag("undisclosed sponsor wrote the protocol",
                    force_limited=True, reasoning="critical integrity concern")],
    )
    assert r["overall"] == "Limited"
    assert "forced to Limited" in r["derivation"]


def test_flag_forcing_limited_without_reasoning_rejected():
    with pytest.raises(ValueError):
        classify_defensibility({"a": "Strong"},
                               flags=[Flag("bad", force_limited=True)])


def test_escalation_is_downward_only():
    with pytest.raises(ValueError):
        classify_defensibility(
            BASE, escalation=Escalation("Strong", "trying to go up"))


def test_escalation_requires_reasoning():
    with pytest.raises(ValueError):
        classify_defensibility(
            {"a": "Strong"}, escalation=Escalation("Adequate", "   "))


def test_escalation_with_reasoning_recorded():
    r = classify_defensibility(
        {"a": "Strong", "b": "Adequate"},
        escalation=Escalation("Limited",
                              "multiple mid-level concerns across dimensions"))
    assert r["overall"] == "Limited"
    assert r["escalation"]["reasoning"]


def test_override_requires_written_justification():
    with pytest.raises(ValueError):
        classify_defensibility(BASE, override=Override("Adequate", ""))


def test_override_recorded_and_final():
    r = classify_defensibility(
        BASE, override=Override("Adequate",
                                "sampling limitation is mitigated by design X"))
    assert r["overall"] == "Adequate"
    assert "reviewer override (justified)" in r["derivation"]
    assert r["override"]["justification"]


# ── The public surface is ordinal, never numeric ─────────────────────────────

def test_no_numeric_values_in_result():
    r = classify_defensibility(BASE)
    def walk(x):
        if isinstance(x, bool) or x is None or isinstance(x, str):
            return
        if isinstance(x, (int, float)):
            raise AssertionError(f"numeric value leaked: {x!r}")
        if isinstance(x, dict):
            for v in x.values():
                walk(v)
        elif isinstance(x, (list, tuple)):
            for v in x:
                walk(v)
    walk(r)


def test_no_score_vocabulary_in_result_keys():
    r = classify_defensibility(BASE)
    assert not any("score" in k.lower() for k in r)


def test_unknown_label_rejected():
    with pytest.raises(ValueError):
        classify_defensibility({"a": "Excellent"})
    with pytest.raises(ValueError):
        classify_defensibility({"a": "Not defensible"})  # deliberately absent


def test_empty_profile_rejected():
    with pytest.raises(ValueError):
        classify_defensibility({})


# ── Report form ──────────────────────────────────────────────────────────────

def test_report_carries_statement_profile_and_weakest():
    txt = render_report(classify_defensibility(BASE))
    assert "not a numerical quality score" in txt
    assert "cannot be more favourable than the least defensible dimension" in txt
    assert "sampling: Limited" in txt
    assert "reflexivity: Strong" in txt
    assert "○ author hypothesis" in txt


def test_module_shares_nothing_with_heterogeneity():
    """Ch. 1.2.5 D3: no shared implementation between the constructs."""
    import methodvahti.defensibility as d
    src = open(d.__file__).read()
    assert "from methodvahti.heterogeneity" not in src
    assert "from .heterogeneity" not in src
    assert "import heterogeneity" not in src
    # And no λ vocabulary in the defensibility construct.
    assert "lambda_within" not in src
    assert "lambda_between" not in src
