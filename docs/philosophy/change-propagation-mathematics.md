# The Vahtian Change Graph — mathematics of change propagation

**Status:** internal philosophy note — founder doctrine, companion to
[`auditable-research-task-graph.md`](./auditable-research-task-graph.md).
Not user-facing copy; anything derived for marketing or product UI goes
through `vahtian-brand-safety` and must remain consistent with `AD_CLAIMS.md`.

**Date:** 2026-07-12

---

## Why this mathematics, and not ATG's

ATG's formalism is built around **task completion**: a node is done or not
done, a region is validated or failed, repair restores executability. That is
the wrong pattern for research, where the governing event is not completion
but **change** — a construct is revised, an outcome is redefined, a source is
retracted — and the governing question is *what must now be looked at again*.

So Vahtian builds the mathematics around **change propagation, not task
completion**. Change upstream; look downstream. Everything is connected by
six.

---

## 1. The typed research graph

$$G = (V, E)$$

Each node $v \in V$ is a research object:

question · construct · protocol decision · variable · dataset · analysis ·
result · table · figure · claim · citation · interpretation

Each edge is typed and weighted:

$$e = (u, v, \tau, w)$$

where $\tau$ is the dependency type and $w \in [0,1]$ is dependency strength.

$$\tau \in \{\text{computational}, \text{semantic}, \text{evidential}, \text{inferential}, \text{governance}, \text{provenance}\}$$

---

## 2. The six-step principle

Treat six as the **maximum default propagation depth**:

$$d(u,v) \leq 6$$

When node $u$ changes, inspect all reachable nodes within six dependency
steps:

$$R_6(u) = \{v \in V : 1 \leq d(u,v) \leq 6\}$$

This is not because six is a universal law. It is a practical review horizon:
most meaningful downstream research consequences should become visible within
six typed transformations.

Example:

$$\text{construct} \rightarrow \text{variable} \rightarrow \text{analysis dataset} \rightarrow \text{model} \rightarrow \text{result} \rightarrow \text{claim} \rightarrow \text{conclusion}$$

The conclusion is six edges downstream from the construct definition.

### The six-layer justification

"Everything is connected by six" is made precise by six transformation
layers:

1. **Intent** — research question, estimand, construct
2. **Design** — protocol, eligibility, sampling, measurement
3. **Representation** — variables, coding, transcripts, datasets
4. **Computation** — analysis, model, synthesis, visualisation
5. **Evidence** — result, table, figure, quotation, source passage
6. **Assertion** — claim, interpretation, conclusion, recommendation

A change can cross up to six epistemic transformations from intent to
assertion. Six layers give five inter-layer transitions, so a six-hop horizon
covers the full intent-to-assertion traversal with one intra-layer step to
spare. That gives six a defensible structural meaning — better than invoking
six degrees of separation loosely.

---

## 3. Change magnitude

Every change receives a magnitude:

$$\Delta(u) \in [0,1]$$

| Change | $\Delta$ |
|---|---|
| spelling correction | 0.01 |
| formatting change | 0.02 |
| citation replacement | 0.20 |
| variable recoding | 0.60 |
| changed outcome definition | 0.85 |
| changed research question | 1.00 |

---

## 4. Propagated impact

Impact decreases with distance but increases with dependency strength. For a
path

$$p = (u = v_0, v_1, \ldots, v_k = v)$$

define path impact with **per-edge, type-specific decay**:

$$I_p(u,v) = \Delta(u) \prod_{j=1}^{k} w_j \, \lambda_{\tau_j}$$

where $\lambda_{\tau} \in (0,1]$ is the decay parameter of edge type $\tau$.
A reasonable default for decaying types is $\lambda = 0.85$.

> **Convention note (normalized at capture).** The founder draft gave two
> forms: a uniform $\lambda^{k-1}$ (no decay on the first hop) and the typed
> per-edge product above (decay on every hop). This document adopts the typed
> per-edge form as canonical, since the semantic override (§6) requires decay
> to be a property of each edge, not of path length. The uniform form is the
> special case where every edge has the same $\lambda$, differing only by one
> factor of $\lambda$.

If multiple paths connect $u$ and $v$, use the strongest path:

$$I(u,v) = \max_{p\,:\,u \leadsto v,\ |p| \leq 6} I_p(u,v)$$

Taking the maximum avoids incorrectly adding several correlated paths.

---

## 5. Node sensitivity and review pressure

Some downstream objects require review even after a small upstream change.
Assign each node a sensitivity $s(v) \in [0,1]$:

| Node | Sensitivity |
|---|---|
| working note | 0.10 |
| exploratory plot | 0.25 |
| primary analysis | 0.80 |
| abstract result | 0.90 |
| conclusion | 1.00 |
| clinical recommendation | 1.00 |

Define **review pressure**:

$$P(u,v) = I(u,v)\, s(v)$$

### Trigger rules

Three levels, with initial defaults $\theta_1 = 0.10$, $\theta_2 = 0.30$:

| Condition | Action |
|---|---|
| $P(u,v) < \theta_1$ | No review |
| $\theta_1 \leq P(u,v) < \theta_2$ | Inspect |
| $P(u,v) \geq \theta_2$ | Mandatory review |

---

## 6. Semantic override

Distance decay must not apply normally to certain edge types. A semantic
change can invalidate distant outputs completely.

- For **semantic** or **governance** dependencies: $\lambda_{\tau} = 1$
- For formatting or weak provenance links: $\lambda_{\tau} < 1$

This is why decay is typed per edge (§4) rather than one universal parameter.

---

## 7. Hard invalidation rules

Some changes trigger mandatory review regardless of calculated score. Define
an override indicator $H(u,v) \in \{0,1\}$. Then review is required if

$$P(u,v) \geq \theta_2 \quad \text{or} \quad H(u,v) = 1$$

Hard triggers include:

- research question changed
- construct definition changed
- inclusion criteria changed
- primary outcome changed
- analysis population changed
- exposure or outcome recoded
- model estimand changed
- adjudication decision reversed
- protocol version changed
- source evidence withdrawn or corrected

---

## 8. The review set

For a changed node $u$, the system produces

$$\mathcal{Q}(u) = \{v \in R(u) : P(u,v) \geq \theta_1 \ \lor\ H(u,v) = 1\}$$

divided into $\mathcal{Q}_{\text{inspect}}(u)$ and
$\mathcal{Q}_{\text{mandatory}}(u)$.

The user sees:

```
Changed:
  Primary outcome definition

Mandatory review:
  - variable dictionary
  - cohort construction
  - primary analysis
  - Table 2
  - abstract results
  - conclusion

Inspect:
  - sensitivity analysis
  - discussion limitations
  - supplementary figure

Unaffected:
  - recruitment description
  - authorship information
  - background references
```

---

## 9. Review ordering

Review upstream objects before downstream objects. For each affected node:

$$\text{priority}(v) = P(u,v) \times c(v) \times a(v)$$

where $c(v)$ is consequence severity and $a(v)$ is authority requirement.
Then sort by:

1. shortest dependency distance;
2. highest priority;
3. governance gate status.

This prevents reviewing the conclusion before fixing the analysis.

---

## 10. Multiple simultaneous changes

For a set of changed nodes $C$, combine impacts with a noisy-OR:

$$I_C(v) = 1 - \prod_{u \in C} \bigl(1 - I(u,v)\bigr)$$

$$P_C(v) = I_C(v)\, s(v)$$

This gives a bounded, probability-like combined score. It is preferable to
simple addition because the score remains within $[0,1]$.

---

## 11. Core Vahtian rule

> **A change must trigger review wherever it can alter meaning, evidence,
> computation, or authority.**

The system never claims that an affected node is *wrong*. It states:

- why the node may be affected;
- through which dependency path;
- how strong the impact is;
- whether inspection or mandatory review is required;
- **who has authority to clear it**.

The product is therefore not an automatic invalidation engine. It is a
**dependency-aware review trigger system**. Clearing a flag is always a human
decision, recorded with actor, rationale, and timestamp in the audit trail.

---

## 12. Naming

The mathematical object:

- plainly: **Vahtian Change Graph**
- memorably: **Six-Hop Epistemic Change Propagation**
- technically: **Typed Epistemic Dependency Graph with bounded change
  propagation**

---

## Amendments proposed at capture

Flagged during transcription for founder decision; none silently applied
except the notation convention in §4.

### A1. Hard triggers must escape the six-hop horizon (structural)

As drafted, the review set is restricted to $R_6(u)$, so a node seven or more
hops downstream is never flagged — *even when* $H(u,v) = 1$ or every edge on
the path is semantic with $\lambda_\tau = 1$ and $w = 1$, meaning the model
itself says impact does not decay. A retracted source feeding a long chain of
semantic dependencies would silently escape review beyond hop six.

Proposed resolution: the six-hop horizon applies only to **decaying** edge
types. Traversal along non-decaying edges ($\lambda_\tau = 1$: semantic,
governance) does not consume horizon budget; equivalently, hard triggers
propagate until they reach a human gate that has been explicitly re-cleared,
regardless of distance. §8 above already writes $R(u)$ rather than $R_6(u)$
in anticipation of this amendment.

### A2. $c(v)$ versus $s(v)$ (possible redundancy)

§5 introduces sensitivity $s(v)$ ("requires review even after small
changes"); §9 introduces consequence severity $c(v)$ in the priority formula,
where $P(u,v)$ already contains $s(v)$. If $c$ and $s$ measure the same thing,
priority double-counts it as $s(v)^2$. Either define the distinction
(e.g. $s$ = epistemic fragility of the object, $c$ = real-world cost of it
being wrong — a clinical recommendation is high on both, an exploratory plot
high on neither) or drop $c(v)$ from the priority formula.

### A3. Parameters are themselves auditable decisions

$\Delta$ assignments, $s(v)$, $w$, $\lambda_\tau$, $\theta_1$, $\theta_2$ are
not physical constants; they are calibration choices. Consistent with the
invariant, each parameter set should be versioned and hash-recorded like a
protocol (`propagation-params-v1`), so "why was this node *not* flagged?" has
an auditable answer. Defaults ship as proposals; a study can tighten them; the
audit trail records who set them.

### A4. Max-path is conservative in the right direction, with one caveat

Taking $\max$ over paths (§4) under-counts genuinely independent convergent
evidence paths (noisy-OR over paths would count them, but over-counts
correlated ones). Max is the safer default for a *trigger* system only in the
sense that it never inflates scores; note that it can *under*-flag a node
reached by many individually-weak paths. If that pattern shows up in practice,
revisit with a correlation-aware combination. Not blocking.
