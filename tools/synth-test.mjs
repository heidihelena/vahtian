#!/usr/bin/env node
// Golden-parity + edge-case test for the SynthVahti statistics core.
// Asserts synth.mjs reproduces fixtures/golden.json (the metafor reference,
// regenerated in CI by tools/golden_synth.R) within TOL. Run: node tools/synth-test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsv, synthesise, poolProportion } from "../synthvahti/synth.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOL = 1e-4;
let fails = 0;
const approx = (name, got, want) => {
  const d = Math.abs(got - want);
  if (!(d <= TOL)) { console.error(`FAIL ${name}: got ${got}, want ${want} (Δ ${d.toExponential(2)})`); fails++; }
  else console.log(`ok   ${name}: ${got.toFixed(6)} ≈ ${want.toFixed(6)}`);
};
const ok = (name, cond) => { if (cond) console.log(`ok   ${name}`); else { console.error(`FAIL ${name}`); fails++; } };

// 1. Golden parity vs metafor (DL, logit), incl. a zero-cell continuity-corrected study.
const gold = JSON.parse(readFileSync(join(root, "synthvahti/fixtures/golden.json"), "utf8"));
const csv = readFileSync(join(root, "synthvahti/fixtures/golden.csv"), "utf8");
const model = synthesise(parseCsv(csv));
const cut = model.cutoffs.find(c => c.cutoff === ">=1%");
ok("golden fixture pools 5 studies", cut && cut.opa && cut.opa.k === 5);
approx("OPA pooled", cut.opa.pooled, gold.opa.pooled);
approx("OPA CI low",  cut.opa.lo,     gold.opa.lo);
approx("OPA CI high", cut.opa.hi,     gold.opa.hi);
approx("OPA tau^2",   cut.opa.tau2,   gold.opa.tau2);
approx("OPA I^2",     cut.opa.I2,     gold.opa.I2);
approx("OPA Q",       cut.opa.Q,      gold.opa.Q);

// 2. Edge: k=1 — no heterogeneity, pooled == the single study's proportion.
const one = poolProportion([{ label: "s", events: 90, n: 100 }]);
ok("k=1 returns a result", one && one.k === 1);
approx("k=1 tau^2 is 0", one.tau2, 0);
approx("k=1 pooled == 0.90", one.pooled, 0.90);

// 3. Edge: zero cell gets the continuity correction (does not divide by zero / NaN).
const zero = poolProportion([{ label: "z", events: 0, n: 40 }, { label: "y", events: 20, n: 40 }]);
ok("zero-cell pooled is finite", zero && Number.isFinite(zero.pooled) && zero.pooled > 0 && zero.pooled < 1);

// 4. Edge: empty / unpoolable input returns null, not a throw.
ok("no poolable studies -> null", poolProportion([]) === null);

// 5. Edge: a row missing the 2x2 and opa is skipped with a reason, not silently dropped.
const bad = synthesise(parseCsv("record_id,cutoff,tp,fp,fn,tn\nrowX,>=1%,,,,"));
ok("malformed row is reported in skipped[]", bad.skipped.length === 1 && bad.skipped[0].row === 2);

if (fails) { console.error(`\n${fails} check(s) FAILED`); process.exit(1); }
console.log("\nAll checks passed.");
