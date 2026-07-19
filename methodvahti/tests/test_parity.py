"""
Python <-> JavaScript parity test — the two implementations of optimise_n.

MethodVahti ships the sample-size core twice: the Python reference
(``methodvahti_pdf.optimise_n``, which renders the paid report) and a JavaScript
port (``methodvahti/optimise.mjs``, which drives the free browser explorer). An
integrity tool cannot let the free explorer and the paid report disagree
(VALIDATION.md Ch. 3.3).

This test runs the PYTHON optimise_n live on every ``fixtures/golden.json``
scenario, invokes Node to run the JAVASCRIPT optimise on the same scenarios
(``tools/parity_emit.mjs``), and asserts:

  * the integer outputs (optimal_n, stability range, three model estimates) match
    exactly, and
  * the information-power index matches within TOL (golden pins it at 3 dp).

If Node is unavailable the test skips (it is not a Python-core regression). If a
scenario diverges, the assertion names the scenario and field — the divergence
is reported, never hidden.
"""

import json
import os
import shutil
import subprocess
import unittest

from methodvahti_pdf import optimise_n


# golden.json params use the JS short keys; optimise_n uses long keys.
_KEYMAP = {
    "H": "heterogeneity",
    "p": "theme_prevalence",
    "S": "specificity",
    "T": "theory_strength",
    "Q": "data_quality",
    "power": "power",
    "depth": "depth",
    "mixed": "mixed_methods",
    "mdd": "min_detectable_diff",
}

_TOL = 1e-3  # golden ip is round(ip, 3); raw ip agrees to < 5e-4

_HERE = os.path.dirname(os.path.abspath(__file__))
_PKG_ROOT = os.path.dirname(_HERE)                       # methodvahti/
_GOLDEN = os.path.join(_PKG_ROOT, "fixtures", "golden.json")
_EMITTER = os.path.join(_PKG_ROOT, "tools", "parity_emit.mjs")


def _py_params(golden_params):
    return {_KEYMAP[k]: v for k, v in golden_params.items()}


class TestPythonJsParity(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.node = shutil.which("node")
        if cls.node is None:
            raise unittest.SkipTest("node not available; skipping JS parity")
        if not os.path.exists(_EMITTER):
            raise unittest.SkipTest(f"parity emitter missing: {_EMITTER}")
        with open(_GOLDEN, encoding="utf-8") as fh:
            cls.gold = json.load(fh)
        proc = subprocess.run(
            [cls.node, _EMITTER],
            capture_output=True, text=True, timeout=60,
        )
        if proc.returncode != 0:
            raise AssertionError(
                f"parity_emit.mjs failed (rc={proc.returncode}):\n{proc.stderr}")
        cls.js = {row["name"]: row for row in json.loads(proc.stdout)}

    def test_scenarios_line_up(self):
        py_names = {g["name"] for g in self.gold}
        self.assertEqual(py_names, set(self.js), "scenario sets differ")
        self.assertGreaterEqual(len(self.gold), 8)

    def test_python_matches_javascript(self):
        for g in self.gold:
            name = g["name"]
            js = self.js[name]
            py = optimise_n(_py_params(g["params"]))
            with self.subTest(scenario=name):
                self.assertEqual(py["optimal_n"], js["optimal_n"],
                                 f"{name}: optimal_n")
                self.assertEqual(py["stable"], js["stable"],
                                 f"{name}: stable")
                self.assertEqual(list(py["stability_range"]),
                                 list(js["stability_range"]),
                                 f"{name}: stability_range")
                for model in ("linear_saturation", "network_complexity",
                              "fuzzy_set_qca"):
                    self.assertEqual(py["models"][model], js["models"][model],
                                     f"{name}: models.{model}")
                self.assertAlmostEqual(
                    py["information_power_index"],
                    js["information_power_index"],
                    delta=_TOL, msg=f"{name}: information_power_index")


if __name__ == "__main__":
    unittest.main(verbosity=2)
