import hashlib
from dataclasses import asdict

import vahtian
from vahtian import (Assertion, compare, inferred, ambiguous,
                     not_applicable, extraction_failed)
from vahtian.compare import _canonical

# The cross-language parity gate: the R package `vahtian` asserts these SAME
# literals over the same fixture. If either canonical serialiser or either
# comparator drifts, one of the two CIs goes red. (comparator vahtian-compare/2)
GOLDEN_CLAIM = "sha256:d7951f8a621551d5b5a9091a5007bf027b7b8871be1d2497580a152384bd2aa5"
GOLDEN_ASSESSMENT = "sha256:d840fcbaf3f66ac061a7a63bb35e2f3bd3b2f58dcbf70a90a5cb412c1cd39219"


def _claim(**kw):
    base = dict(population="adults with COPD", exposure="triple therapy",
                comparator="dual therapy", outcome="all-cause mortality",
                direction="decrease", effect_type="HR", effect_value=0.72,
                ci_low=0.58, ci_high=0.89)
    base.update(kw)
    return Assertion(**base)


def test_golden_cross_language_assessment_hash():
    a = compare(_claim(quote="cut mortality (HR 0.72)"), _claim(locator="table 2"))
    assert a.claim_hash == GOLDEN_CLAIM
    payload_hash = "sha256:" + hashlib.sha256(
        _canonical(a.payload()).encode("utf-8")).hexdigest()
    assert payload_hash == GOLDEN_ASSESSMENT


def test_aligned_when_fields_match():
    a = compare(_claim(quote="reduced mortality (HR 0.72)"), _claim(locator="table 2"))
    assert a.candidate == "aligned"
    assert a.fields["effect_value"]["status"] == "agrees"


def test_deterministic_same_inputs_same_assessment():
    a1 = compare(_claim(), _claim())
    a2 = compare(_claim(), _claim())
    assert a1.payload() == a2.payload()
    assert a1.claim_hash == Assertion(**asdict(_claim())).hash()


def test_direction_conflict_is_conflicting():
    a = compare(_claim(direction="decrease"), _claim(direction="increase"))
    assert a.fields["direction"]["status"] == "conflicts"
    assert a.candidate == "conflicting"


def test_numeric_conflict_beyond_tolerance():
    a = compare(_claim(effect_value=0.72), _claim(effect_value=0.92))
    assert a.fields["effect_value"]["status"] == "conflicts"
    assert a.candidate == "conflicting"
    # Same numbers within the recorded tolerance agree.
    b = compare(_claim(effect_value=0.720), _claim(effect_value=0.7205))
    assert b.fields["effect_value"]["status"] == "agrees"
    assert b.rel_tol == 0.01


def test_effect_type_mismatch_makes_numbers_not_comparable():
    a = compare(_claim(effect_type="HR"), _claim(effect_type="OR"))
    assert a.fields["effect_type"]["status"] == "conflicts"
    assert a.fields["effect_value"]["status"] == "not_comparable"
    assert a.candidate == "conflicting"


def test_free_text_wording_differs_not_conflicts():
    a = compare(_claim(population="adults with COPD"),
                _claim(population="COPD patients over 40"))
    assert a.fields["population"]["status"] == "differs"
    assert a.candidate == "insufficient"   # flagged for the human, not a conflict


def test_missing_fields_are_not_stated_never_agreement():
    a = compare(Assertion(outcome="mortality", direction="decrease"),
                Assertion(outcome="mortality"))
    assert a.fields["direction"]["status"] == "not_stated"
    assert a.fields["direction"]["source_state"] == "not_stated"
    assert a.candidate == "insufficient"


def test_inferred_key_field_never_aligns_without_a_human():
    # Values agree, but a direction inferred (not stated) must not reach "aligned".
    a = compare(_claim(direction=inferred("decrease")), _claim())
    assert a.fields["direction"]["status"] == "agrees"
    assert a.fields["direction"]["claim_state"] == "inferred"
    assert a.candidate == "insufficient"


def test_extraction_failed_is_distinct_from_source_silence():
    a = compare(_claim(outcome=extraction_failed()), _claim())
    assert a.fields["outcome"]["status"] == "extraction_failed"
    assert a.candidate == "insufficient"
    # A field the source simply did not state resolves differently.
    b = compare(_claim(outcome=None), _claim())
    assert b.fields["outcome"]["status"] == "not_stated"


def test_ambiguous_blocks_alignment():
    a = compare(_claim(direction=ambiguous("decrease")), _claim())
    assert a.fields["direction"]["status"] == "ambiguous"
    assert a.candidate == "insufficient"


def test_not_applicable_on_nonkey_field_still_aligns():
    a = compare(_claim(comparator=not_applicable()), _claim(comparator=not_applicable()))
    assert a.fields["comparator"]["status"] == "not_applicable"
    assert a.candidate == "aligned"   # direction+outcome stated & agree; N/A tolerated


def test_absent_state_severity_ordering():
    # extraction_failed (most actionable) wins over the other side's not_stated.
    a = compare(_claim(exposure=extraction_failed()), _claim(exposure=None))
    assert a.fields["exposure"]["status"] == "extraction_failed"
    # ambiguous wins over not_applicable
    b = compare(_claim(exposure=ambiguous()), _claim(exposure=not_applicable()))
    assert b.fields["exposure"]["status"] == "ambiguous"


def test_full_audit_flow_extract_compare_decide():
    """The CiteVahti pattern end-to-end: who did what, in order, verifiable."""
    L = vahtian.Ledger()
    claim, finding = _claim(quote="cut mortality (HR 0.72)"), _claim(locator="table 2")
    L.append("ai:model/x", "extract_claim", asdict(claim), ts="t1")
    L.append("ai:model/x", "extract_source", asdict(finding), ts="t2")
    a = compare(claim, finding)
    entry = a.record(L)
    assert entry["actor"] == vahtian.COMPARATOR_ID
    L.append("human:hha", "decide",
             {"decision": "supported", "candidate": a.candidate,
              "claim_hash": a.claim_hash, "source_hash": a.source_hash}, ts="t4")
    assert L.verify()
    # Retro-editing the comparator's recorded run breaks the chain.
    L.entries[2]["payload"]["candidate"] = "aligned-forever"
    assert not L.verify()
