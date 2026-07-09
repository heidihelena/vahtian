#!/usr/bin/env python3
"""Regenerate methodvahti/fixtures/golden.json from the Python reference
`optimise_n` (methodvahti_pdf).

The Python is the source of truth: it generates the report and has unit tests.
CI runs this, then tools/method-test.mjs asserts the browser core
(methodvahti/optimise.mjs) reproduces these values. An integrity brand cannot
let the free explorer and the paid report disagree on the number.

optimise_n is pure stdlib (math only) — no third-party dependencies.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "methodvahti"))
from methodvahti_pdf import optimise_n  # noqa: E402

# Scenarios use the explorer's short keys (H, p, S, T, Q, power, depth, mixed,
# mdd); we map them to optimise_n's argument names below. The last few are
# chosen to exercise depth tiers, power extremes, the mixed-methods floor, and
# the half-integer stability-threshold boundary (N where 0.10*N ≈ x.5).
SCENARIOS = [
    {"name": "defaults",                 "H": 0.35, "p": 0.30, "S": 0.65, "T": 0.50, "Q": 0.75, "power": 0.80, "depth": "explanatory"},
    {"name": "homogeneous_descriptive",  "H": 0.10, "p": 0.50, "S": 0.80, "T": 0.70, "Q": 0.85, "power": 0.80, "depth": "descriptive"},
    {"name": "heterogeneous_theoretical","H": 0.90, "p": 0.15, "S": 0.30, "T": 0.30, "Q": 0.55, "power": 0.90, "depth": "theoretical"},
    {"name": "rare_theme",               "H": 0.50, "p": 0.05, "S": 0.50, "T": 0.50, "Q": 0.60, "power": 0.80, "depth": "explanatory"},
    {"name": "high_power",               "H": 0.40, "p": 0.30, "S": 0.60, "T": 0.55, "Q": 0.70, "power": 0.99, "depth": "explanatory"},
    {"name": "low_power",                "H": 0.40, "p": 0.30, "S": 0.60, "T": 0.55, "Q": 0.70, "power": 0.50, "depth": "explanatory"},
    {"name": "mixed_methods",            "H": 0.45, "p": 0.25, "S": 0.55, "T": 0.50, "Q": 0.65, "power": 0.80, "depth": "explanatory", "mixed": True, "mdd": 0.20},
    {"name": "mixed_small_diff",         "H": 0.45, "p": 0.25, "S": 0.55, "T": 0.50, "Q": 0.65, "power": 0.80, "depth": "explanatory", "mixed": True, "mdd": 0.08},
    {"name": "boundary_rounding",        "H": 0.60, "p": 0.20, "S": 0.40, "T": 0.40, "Q": 0.60, "power": 0.80, "depth": "theoretical"},
    {"name": "extreme_homogeneous",      "H": 0.00, "p": 0.80, "S": 0.95, "T": 0.90, "Q": 0.95, "power": 0.80, "depth": "descriptive"},
    {"name": "extreme_heterogeneous",    "H": 1.00, "p": 0.10, "S": 0.10, "T": 0.10, "Q": 0.40, "power": 0.95, "depth": "theoretical"},
]


def to_params(s):
    return {
        "heterogeneity": s["H"],
        "theme_prevalence": s["p"],
        "depth": s["depth"],
        "specificity": s["S"],
        "theory_strength": s["T"],
        "data_quality": s["Q"],
        "power": s["power"],
        "mixed_methods": s.get("mixed", False),
        "min_detectable_diff": s.get("mdd"),
    }


def main():
    out = []
    for s in SCENARIOS:
        r = optimise_n(to_params(s))
        params = {k: s[k] for k in ("H", "p", "S", "T", "Q", "power", "depth")}
        if s.get("mixed"):
            params["mixed"] = True
            params["mdd"] = s["mdd"]
        out.append({
            "name": s["name"],
            "params": params,
            "optimal_n": r["optimal_n"],
            "stable": r["stable"],
            "stability_range": r["stability_range"],
            "models": r["models"],
            "information_power_index": r["information_power_index"],
        })
    path = os.path.join(ROOT, "methodvahti", "fixtures", "golden.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print(f"wrote {len(out)} scenarios to {os.path.relpath(path, ROOT)}")


if __name__ == "__main__":
    main()
