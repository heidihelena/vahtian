# MethodVahti — design defensibility & sampling heterogeneity

Part of the [EpiNet](https://github.com/heidihelena/epinet) toolkit · [Vahtian](https://vahtian.com) · Apache-2.0 licence · v0.4.0

## Two constructs, one absolute boundary

MethodVahti answers two different questions about a qualitative study design,
and keeps them structurally apart (VALIDATION.md Ch. 1.2.5):

```
sampling heterogeneity  → numeric               → optimise_n()
defensibility profile   → ordinal classification → report and reviewer judgement
```

- **Sampling heterogeneity** — *how heterogeneous are the design cells, and how
  many participants does that demand?* A numeric, harm-direction estimate
  (higher = greater sampling difficulty) that feeds sample-size optimisation.
- **Defensibility** — *how defensible are the design's methodological
  decisions, judged before any results exist?* An **ordinal classification with
  a full dimension profile. There is no overall number, on purpose.**

Neither construct ever crosses into the other. The pipe between the sampling
score and `optimise_n()` refuses defensibility input — even deliberately.

## Defensibility classification

```python
from methodvahti import classify_defensibility, render_report

result = classify_defensibility({
    "research_question": "Strong",
    "sampling":          "Adequate",
    "data_collection":   "Adequate",
    "analysis":          "Limited",
    "reflexivity":       "Strong",
})
print(render_report(result))
```

```
Overall defensibility: Limited

The overall judgement cannot be more favourable than the least
defensible dimension.
The weakest dimension was: analysis.

This is an ordinal judgement derived from the dimension profile.
It is not a numerical quality score.
...
```

The rule, in full: **least-favourable dimension rule + downward escalation +
justified reviewer override.**

- Frozen scale: `Strong` · `Adequate` · `Limited`. `"Not assessable"` is a
  data-state — reported, never a rating.
- Accumulated material concerns may push the overall *lower* (escalation,
  written reasoning mandatory). Nothing pushes it higher.
- The reviewer may override the classification — with a written justification
  that is always carried into the report.
- Fatal or critical concerns are explicit `Flag`s; a flag can force the overall
  to `Limited`, with written reasoning.

This mirrors how established appraisal instruments aggregate (RoB 2, ROBINS-I,
AMSTAR 2, QUADAS-2, MMAT): least-favourable or critical-domain rules for an
overall ordinal judgement, or no overall summary score at all — never a
best-feature rule, never an average (VALIDATION.md Ch. 1.2.4).

## Sampling heterogeneity → sample size

```python
from methodvahti import sampling_heterogeneity_score
from methodvahti_pdf import optimise_n, sampling_heterogeneity_input

result = sampling_heterogeneity_score(records,
                                      dimensions=["design", "sampling"],
                                      outcome="judge_human_disagreement")

opt = optimise_n({
    **sampling_heterogeneity_input(result),   # the one sanctioned crossing
    "depth": "explanatory",
    "specificity": 0.65,
    "data_quality": 0.75,
})
print(opt["optimal_n"], opt["stability_range"])
```

`optimise_n` synthesises three sample-size models (linear saturation, network
complexity, fuzzy-set QCA) with an information-power adjustment, and always
returns all three plus a stability range — never a lone point estimate. The
researcher confirms N; the tool proposes.

The score's `max`/λ worst-case weighting is **conservative in this construct**
(higher = harder to sample) and is confined to it (defensibility uses no λ and
no numbers). Severity weights are amplification hypotheses, not observed rates
— audit and adjust them with pilot data:

```python
from methodvahti import default_severity_catalogue

catalogue = default_severity_catalogue()
catalogue["judge_human_disagreement"].change(
    new_weight=0.75,
    changed_by="research_team",
    reason="Pilot audit (n=12) suggested lower disagreement than assumed.",
)
```

Every change is audit-logged with timestamp, reason, and author, and the log is
included in the PDF report. Governance parameters (λ, γ, `min_n`, `shrink`) are
team decisions, not learned constants; defaults and evidence grades are frozen
in VALIDATION.md Ch. 15.

> **Renamed in v0.4.0:** `qualitative_heterogeneity_score` is a deprecated
> alias of `sampling_heterogeneity_score` and will be removed at the next
> MAJOR release.

## The COREQ/SRQR PDF report

`methodvahti_pdf.build()` renders the methods report (COREQ 32-item reference,
severity audit log, all three sample-size models, the stability verdict). The
free in-browser explorer (`optimise.mjs`) is ported 1:1 from the Python and CI
holds them bit-identical — the explorer and the paid report cannot disagree.

## What this module does NOT do

- It never says a sample is **adequate**, **sufficient**, or **validated** —
  those words do not appear in any output.
- The defensibility classification is **not a quality score** and cannot rank
  studies against each other.
- It does not infer causality and does not replace researcher judgement.
- Both constructs are graded **○ author hypothesis** (VALIDATION.md Ch. 0.2):
  Vahtian's own construction, not externally validated. The full validation
  framework, including what has *not* been tested, is `VALIDATION.md`.
- Agent guidance (how an AI assistant should and should not drive this tool)
  is `SKILL.md`.

## Tests

```bash
python3 -m pytest tests/   # 90 tests: rule gates, construct separation,
                           # boundary wiring, golden Python↔JS parity
python3 construct_check.py # scope demonstration: both constructs on
                           # outcome-free Table-3-shaped input
```

## Citation

```
Vahtian. (2026). MethodVahti: design defensibility classification and
sampling-heterogeneity estimation for qualitative study design.
In: EpiNet toolkit. GitHub: heidihelena/epinet. Apache-2.0 licence.
```

DOI will be assigned on Zenodo release.
