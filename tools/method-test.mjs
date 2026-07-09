#!/usr/bin/env node
// Golden-parity + edge-case test for the MethodVahti sample-size core.
// Asserts methodvahti/optimise.mjs reproduces methodvahti/fixtures/golden.json
// (the Python optimise_n reference, regenerated in CI by tools/golden_method.py).
// The integer outputs must match exactly; the information-power index within TOL.
// Run: node tools/method-test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { optimise, synth } from "../methodvahti/optimise.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOL = 1e-3;               // golden ip is round(ip, 3); raw ip is within 5e-4
let fails = 0;
const eq = (name, got, want) => {
  if (got === want) { console.log(`ok   ${name}: ${got}`); }
  else { console.error(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); fails++; }
};
const approx = (name, got, want) => {
  const d = Math.abs(got - want);
  if (d <= TOL) console.log(`ok   ${name}: ${got.toFixed(4)} ≈ ${want}`);
  else { console.error(`FAIL ${name}: got ${got}, want ${want} (Δ ${d.toExponential(2)})`); fails++; }
};
const ok = (name, cond) => { if (cond) console.log(`ok   ${name}`); else { console.error(`FAIL ${name}`); fails++; } };

// 1. Golden parity vs the Python reference, scenario by scenario.
const gold = JSON.parse(readFileSync(join(root, "methodvahti/fixtures/golden.json"), "utf8"));
ok("golden fixture has scenarios", Array.isArray(gold) && gold.length >= 8);
for (const g of gold) {
  const o = optimise(g.params);
  eq(`${g.name}: optimal_n`, o.optimal_n, g.optimal_n);
  eq(`${g.name}: stable`, o.stable, g.stable);
  eq(`${g.name}: range.lo`, o.lo, g.stability_range[0]);
  eq(`${g.name}: range.hi`, o.hi, g.stability_range[1]);
  eq(`${g.name}: model.linear`, o.models.linear, g.models.linear_saturation);
  eq(`${g.name}: model.network`, o.models.network, g.models.network_complexity);
  eq(`${g.name}: model.fuzzy`, o.models.fuzzy, g.models.fuzzy_set_qca);
  approx(`${g.name}: info-power index`, o.ip, g.information_power_index);
}

// 2. Edge: extreme inputs stay finite and above the N=4 per-model floor.
const hot = optimise({ H: 1, p: 0.02, S: 0, T: 0, Q: 0.5, power: 0.99, depth: "theoretical" });
ok("extreme heterogeneous is finite", Number.isFinite(hot.optimal_n) && hot.optimal_n >= 4);
const cold = optimise({ H: 0, p: 1, S: 1, T: 1, Q: 1, power: 0.5, depth: "descriptive" });
ok("extreme homogeneous is finite and small", Number.isFinite(cold.optimal_n) && cold.optimal_n >= 4);

// 3. Edge: the mixed-methods comparative floor raises N as the detectable diff shrinks.
const base = { H: 0.45, p: 0.25, S: 0.55, T: 0.5, Q: 0.65, power: 0.8, depth: "explanatory" };
const wide = optimise({ ...base, mixed: true, mdd: 0.30 });
const narrow = optimise({ ...base, mixed: true, mdd: 0.05 });
ok("smaller detectable difference needs a larger (or equal) N", narrow.optimal_n >= wide.optimal_n);

// 4. Edge: monotonic — more heterogeneity never lowers the synthesised N.
let prev = -Infinity, mono = true;
for (let H = 0; H <= 1.0001; H += 0.1) {
  const n = optimise({ ...base, H }).optimal_n;
  if (n < prev - 0) mono = false; prev = n;
}
ok("N is non-decreasing in heterogeneity", mono);

// 5. Sanity: synth() returns the three raw model estimates.
const s = synth(base);
ok("synth returns three models", Array.isArray(s.models) && s.models.length === 3);

if (fails) { console.error(`\n${fails} check(s) FAILED`); process.exit(1); }
console.log("\nAll checks passed.");
