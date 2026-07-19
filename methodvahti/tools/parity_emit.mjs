#!/usr/bin/env node
// parity_emit.mjs — emit the JavaScript optimise_n output for every scenario in
// methodvahti/fixtures/golden.json as a JSON array on stdout.
//
// This is the JS half of the Python<->JS parity test (VALIDATION.md Ch. 3.3 /
// experiment #15). tests/test_parity.py runs the PYTHON optimise_n live on the
// same scenarios and asserts the two implementations agree. Emitting live JS
// (rather than trusting the frozen golden numbers) is what makes it a genuine
// two-implementation parity check: if optimise.mjs drifts from methodvahti_pdf,
// this test fails even when golden.json is stale.
//
// Run standalone:  node methodvahti/tools/parity_emit.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { optimise } from "../optimise.mjs";

const here = dirname(fileURLToPath(import.meta.url));       // methodvahti/tools
const goldPath = join(here, "..", "fixtures", "golden.json");
const gold = JSON.parse(readFileSync(goldPath, "utf8"));

const out = gold.map(g => {
  const o = optimise(g.params);
  return {
    name: g.name,
    optimal_n: o.optimal_n,
    stable: o.stable,
    stability_range: [o.lo, o.hi],
    models: {
      linear_saturation: o.models.linear,
      network_complexity: o.models.network,
      fuzzy_set_qca: o.models.fuzzy,
    },
    information_power_index: o.ip,   // raw; the test rounds to compare
  };
});

process.stdout.write(JSON.stringify(out));
