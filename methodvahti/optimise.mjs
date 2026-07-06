// Canonical qualitative sample-size core for MethodVahti.
//
// Ported 1:1 from `methodvahti_pdf.optimise_n` (Python) — the Python is the
// source of truth (it generates the report and has unit tests). The Explorer
// page imports this module directly, and the CI parity test
// (tools/method-test.mjs) asserts this module reproduces the Python reference
// captured in methodvahti/fixtures/golden.json. Keep the two in lockstep: an
// integrity brand cannot let the free explorer and the paid report disagree.
//
// Model basis (author-calibrated — the citations justify the shape, not the
// exact coefficients; see VALIDATION.md):
//   linear saturation   — Guest et al. 2006; Hennink et al. 2017
//   network complexity  — information power, Malterud et al. 2016
//   fuzzy-set QCA       — configurational adequacy (Ragin)

export const DEPTH_BASE = { descriptive: 9, explanatory: 16, theoretical: 24 };
export const clamp01 = x => Math.max(0, Math.min(1, x));

// Python's built-in round() is banker's rounding (half-to-even). Match it so the
// explorer's stable/sensitive verdict is identical to the report's, bit-for-bit.
export function roundHalfEven(x) {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return (f % 2 === 0) ? f : f + 1;
}

export function modelLinear(base, H, p, Q) {
  return base * (1 + 0.9 * H) * (1 + 0.5 * (1 - p)) * (1 - 0.25 * (Q - 0.5) * 2);
}
export function modelNetwork(base, H, S, T, Q) {
  return base * (1 + 1.1 * H) * (1 - 0.35 * S) * (1 - 0.25 * T) * (1 - 0.15 * (Q - 0.5) * 2);
}
export function modelFuzzy(base, H, S, floor) {
  const n = base * 0.8 + 18 * H * (1 - S);
  return floor != null ? Math.max(n, floor) : n;
}

export function synth(P) {
  const base = DEPTH_BASE[P.depth] || DEPTH_BASE.explanatory;
  const floor = (P.mixed && P.mdd) ? Math.ceil(2 + 1 / Math.max(P.mdd, 0.05)) : null;
  const m = [Math.max(4, modelLinear(base, P.H, P.p, P.Q)),
             Math.max(4, modelNetwork(base, P.H, P.S, P.T, P.Q)),
             Math.max(4, modelFuzzy(base, P.H, P.S, floor))];
  const center = (m[0] + m[1] + m[2]) / 3;
  const ip = (P.S + P.T + P.Q + (1 - P.H)) / 4;
  const ipF = 1 - 0.20 * (ip - 0.5) * 2;
  const powF = 1 + 0.50 * (P.power - 0.80);
  return { optimal: center * ipF * powF, models: m, ip, floor };
}

export function optimise(P) {
  const r = synth(P);
  const optimal_n = Math.ceil(r.optimal);
  // Stability: perturb H, p, S, T, Q by ±0.05 one at a time and re-synthesise.
  const keys = ['H', 'p', 'S', 'T', 'Q']; const vals = [optimal_n];
  for (const k of keys) { for (const d of [-0.05, 0.05]) {
    const Q2 = Object.assign({}, P); Q2[k] = clamp01(P[k] + d);
    vals.push(Math.ceil(synth(Q2).optimal));
  }}
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const stable = (hi - lo) <= Math.max(1, roundHalfEven(0.10 * optimal_n));
  return { optimal_n, stable, lo, hi, ip: r.ip,
           models: { linear: Math.ceil(r.models[0]), network: Math.ceil(r.models[1]), fuzzy: Math.ceil(r.models[2]) } };
}
