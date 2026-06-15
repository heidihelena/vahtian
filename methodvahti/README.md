# MethodVahti — Qualitative Heterogeneity Scoring

Part of the [EpiNet](https://github.com/heidihelena/epinet) toolkit · [Vahtian](https://vahtian.com) · Apache-2.0 licence

## What this module does

`qualitative_heterogeneity_score()` estimates heterogeneity in qualitative
research designs for use in sample size optimisation and methods reporting.

It returns one **primary score** (hierarchical) and two **diagnostic scores**
(marginal map, sparse interaction stress) — never a single number presented
as ground truth.

## Why three scores

| Score | Purpose | Evidence basis |
|---|---|---|
| `hierarchical_heterogeneity_score` | Primary — feeds optimisation | ○ Author hypothesis |
| `marginal_heterogeneity_map` | Descriptive diagnostic | ◆ Consensus |
| `sparse_interaction_stress` | Sparsity visible, not hidden | ○ Author hypothesis |

## Outcome severity weights

**These are NOT observed rates.**
They are severity amplification weights — how much a given outcome type
amplifies the cell heterogeneity score relative to other outcomes.

```
1.0 = maximum governance concern
0.0 = no amplification
```

Default values are author hypotheses about expected severity.
Research teams **should** audit and adjust with pilot data.
Every change is recorded with timestamp, reason, and who made it.

```python
from methodvahti.heterogeneity import default_severity_catalogue

catalogue = default_severity_catalogue()
catalogue["judge_human_disagreement"].change(
    new_weight=0.75,
    changed_by="research_team",
    reason="Pilot audit (n=12) suggested lower disagreement than assumed.",
)
```

The audit log is included in the MethodVahti PDF report.

## Governance parameters

All λ and γ values are **team decisions**, not learned constants:

| Parameter | Meaning | Default | Evidence basis |
|---|---|---|---|
| `lambda_within` | Worst-case weight within dimension | 0.65 | ◌ Opinion range |
| `lambda_between` | Worst-case weight across dimensions | 0.50 | ◌ Opinion range |
| `gamma_sparsity` | Sparsity stress penalty | 0.20 | ◌ Opinion range |
| `min_n` | Evidence floor per cell | 5 | ◇ Contested |
| `shrink` | Bayesian shrinkage of sparse cells | True | ○ Author hypothesis |

## Quick start

```python
from methodvahti.heterogeneity import (
    qualitative_heterogeneity_score,
    default_severity_catalogue,
)

result = qualitative_heterogeneity_score(
    records,
    dimensions=[
        "study_design", "population", "setting", "language",
        "data_collection", "analysis_method",
        "theoretical_framework", "trustworthiness",
    ],
    outcome="judge_human_disagreement",
    lambda_within=0.65,
    lambda_between=0.50,
    gamma_sparsity=0.20,
    min_n=5,
    shrink=True,
)

H = result.primary_score["value"]   # → feed into epinet_estimate()
```

## Feeding into sample size optimisation

`H` flows into the optimisation + reporting layer (`methodvahti_pdf`), which
synthesises **three** sample-size models — linear saturation, network
complexity, fuzzy-set QCA — and adjusts for information power. The three
estimates are always returned alongside the synthesis: the number is decision
support, never a verdict.

```python
from methodvahti_pdf import optimise_n, build

opt = optimise_n({
    "heterogeneity": result.primary_score["value"],
    "theme_prevalence": 0.30,
    "depth": "explanatory",          # descriptive | explanatory | theoretical
    "specificity": 0.65,
    "theory_strength": 0.50,
    "data_quality": 0.75,
    "power": 0.80,
    "mixed_methods": True,
    "min_detectable_diff": 0.20,
})
opt["optimal_n"]   # synthesis;  opt["models"] holds all three;  opt["stable"]
```

## The COREQ/SRQR PDF report

`build()` renders a brand-styled, peer-review-ready PDF — study profile, the
three-model comparison, fuzzy-set sensitivity, epistemic limitations, the full
COREQ 32-item checklist, and a citation + audit record. **The researcher
confirms N before the PDF is generated.**

```python
build({
    "report_id": "MV-2026-001",
    "study_title": "...",
    "research_question": "...", "orientation": "IPA",
    "optimisation": opt,             # or "optimisation_params": { ... }
    "chosen_n": 18,                  # the researcher's decision
    "chosen_rationale": "...",       # in their own words
    "stopping_criterion": "...",
    # ...see examples/methodvahti_pdf_example.py for the full schema
}, "methodvahti-report-2026-001.pdf")
```

The PDF layer needs reportlab (the only dependency, kept out of the core):

```bash
pip install "methodvahti[pdf]"      # or: pip install "reportlab>=4"
```

The PDF embeds **Liberation Sans/Mono** (bundled in `assets/fonts/`, SIL OFL) — the
same system-stack approximation the brand's social-card generator uses — so the
report carries its own fonts and needs nothing installed on the reader's machine.
If the bundled fonts are ever absent it falls back to the PDF base-14 (Helvetica).

## Interactive explorer

A browser-only visualisation of these exact models lives at
[vahtian.com/methodvahti/explore](https://vahtian.com/methodvahti/explore/)
(`methodvahti/explore/index.html` in this repo). It ports `optimise_n` to
JavaScript and lets researchers *see* how their design choices move N — a
three-model comparison with a stability band, a sensitivity tornado, an
N-vs-heterogeneity sweep, and a Monte-Carlo saturation curve. Self-contained,
no external requests, nothing uploaded.

## What this module does NOT do

- Does not infer causality
- Does not replace researcher judgment
- Does not produce a single correct answer
- Does not validate study quality
- Primary score is an **author hypothesis** — not externally validated

## Tests

```bash
python -m pytest tests/ -v
# heterogeneity: 29 offline tests
# optimise_n:    deterministic tests, fully offline
# build():       1 PDF smoke test (auto-skipped if reportlab is absent)
```

## Citation

```
Vahtian. (2026). MethodVahti: Qualitative heterogeneity scoring
for sample size optimisation. In: EpiNet toolkit.
GitHub: heidihelena/epinet, branch: methodvahti-heterogeneity.
Apache-2.0 licence.
```

DOI will be assigned on Zenodo release.
