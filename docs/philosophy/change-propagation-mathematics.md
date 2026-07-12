# The Vahtian Change Graph — mathematics of change propagation

**Status:** internal philosophy note — founder doctrine, companion to
[`auditable-research-task-graph.md`](./auditable-research-task-graph.md).
Not user-facing copy; anything derived for marketing or product UI goes
through `vahtian-brand-safety` and must remain consistent with `AD_CLAIMS.md`.

**Version:** 3 (2026-07-12). Version 1 captured the founder's initial model
with four amendments flagged at capture. Version 2 incorporated the founder's
resolutions: **A1** (budgeted horizon; hard triggers escape the six-hop
bound) changed the model materially; **A2** (fragility vs. consequence) and
**A3** (parameters as protocol objects) were necessary cleanup; **A4**
(max-over-paths) remains deferred, with all qualifying paths recorded.
Version 3 adds the detection-theoretic justification of six: the horizon
derives from a miss-probability bound, and the unit of review is six
**distinct dependency channels**, not six adjacent nodes.

---

## Why this mathematics, and not ATG's

ATG's formalism is built around **task completion**: a node is done or not
done, a region is validated or failed, repair restores executability. That is
the wrong pattern for research, where the governing event is not completion
but **change** — a construct is revised, an outcome is redefined, a source is
retracted — and the governing question is *what must now be looked at again*.

So Vahtian builds the mathematics around **change propagation, not task
completion**. Change upstream; look downstream. Everything is connected by
six — but six limits *search*, never *invalidation*.

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

Partition the edge types:

$$E_{\text{persistent}} = \{\text{semantic}, \text{governance}\}$$

$$E_{\text{decaying}} = E \setminus E_{\text{persistent}}$$

The six-hop limit applies only to decaying transitions.

---

## 2. The six-step principle, budgeted

Six is the **maximum default review-search depth for decaying propagation** —
a practical horizon, not a universal law. Most meaningful downstream research
consequences of ordinary weak changes should become visible within six typed
transformations.

### Budgeted path length (A1 resolution)

Replace ordinary path length with a review-horizon budget. For a path
$p = (e_1, \ldots, e_k)$ define its cost:

$$b(p) = \sum_{j=1}^{k} c(\tau_j), \qquad c(\tau) = \begin{cases} 0, & \tau \in E_{\text{persistent}} \\ 1, & \tau \in E_{\text{decaying}} \end{cases}$$

The admissible path set is:

$$\mathcal{P}_6(u,v) = \{p : u \leadsto v,\ b(p) \leq 6\}$$

A semantic or governance edge does not consume the six-hop budget. This
allows

$$\text{retracted source} \rightarrow \text{evidence assessment} \rightarrow \text{interpretation} \rightarrow \text{recommendation} \rightarrow \cdots$$

to propagate indefinitely through persistent dependencies. **Six remains a
search horizon for ordinary weak propagation, not an invalidation boundary.**

> *Implementation note.* $\mathcal{P}_6$ is computed by shortest-budget
> traversal (Dijkstra over $c(\tau)$ costs): persistent edges cost 0, decaying
> edges cost 1, and a node is admissible if its minimum budget from $u$ is at
> most 6. The graph is a DAG (see the ARTG note), so traversal terminates.

### Why six — from heuristic to detection model

There is no universal probability. "Six nearest nodes are unaffected" only
becomes informative after defining how effects propagate. The cleanest model
estimates the probability that a change remains **undetected** beyond the
first six relevant downstream nodes.

Let

$$q_i = P(\text{node } i \text{ is unaffected} \mid \text{change has reached its predecessor})$$

Under conditional independence,

$$P(\text{first six nodes are all unaffected}) = \prod_{i=1}^{6} q_i$$

and if every node has the same unaffected probability $q$, then
$P_6 = q^6$:

| $q$ (each node unaffected) | $P_6$ (all six unaffected) |
|---|---|
| 0.9 | 53.1% |
| 0.8 | 26.2% |
| 0.7 | 11.8% |
| 0.6 | 4.7% |
| 0.5 | 1.6% |
| 0.4 | 0.41% |
| 0.3 | 0.073% |

So six is compelling only if each downstream dependency has a meaningful
chance of being affected. Formalize by choosing an acceptable miss
probability $\alpha$ and requiring $q^h \leq \alpha$, giving the required
horizon:

$$h \geq \frac{\log \alpha}{\log q}$$

For $\alpha = 0.05$:

| $q$ | Minimum horizon $h$ |
|---|---|
| 0.9 | 29 |
| 0.8 | 14 |
| 0.7 | 9 |
| 0.6 | 6 |
| 0.5 | 5 |
| 0.4 | 4 |

This reveals the real meaning of six: **it corresponds to a model in which
each relevant dependency has no more than a 60% probability of remaining
unaffected** — at least a 40% probability of transmitting meaningful change —
at a 5% miss tolerance.

#### Correlation breaks the naive count

Independence is usually false. Nearby research objects are correlated: six
manuscript claims may all derive from the same table, so they are not six
independent opportunities to detect impact. Use an effective number of
independent nodes:

$$n_{\text{eff}} = \frac{n}{1 + (n-1)\rho}$$

where $\rho$ is average correlation between impact states, and

$$P(\text{all unaffected}) \approx q^{\,n_{\text{eff}}}$$

For six nodes with $q = 0.6$:

| $\rho$ | $n_{\text{eff}}$ | $P(\text{all appear unaffected})$ |
|---|---|---|
| 0 | 6 | 4.7% |
| 0.2 | 3 | 21.6% |
| 0.5 | ≈1.71 | 41.7% |
| 0.8 | 1.2 | 54.2% |

Therefore **six nearest nodes must not mean six arbitrary nodes.** They
should be six independent dependency channels — six distinct epistemic
transformations:

1. **Intent** — semantic definition (research question, estimand, construct)
2. **Design** — protocol, eligibility, sampling, measurement
3. **Representation** — variables, coding, transcripts, datasets
4. **Computation** — analysis, model, synthesis, visualisation
5. **Evidence** — result, table, figure, quotation, source passage
6. **Assertion** — claim, interpretation, conclusion, recommendation

Each layer is a different *mechanism* through which change can appear. (Six
layers also give five inter-layer transitions, so a six-hop budget covers the
full intent-to-assertion traversal with one intra-layer step to spare — the
structural and probabilistic readings of six coincide.)

#### The channel rule

> **Inspect at least six distinct dependency channels, not merely six
> adjacent nodes.**

Estimate the residual escape probability as

$$P_{\text{escape}} = \prod_{k=1}^{6} (1 - r_k)$$

where $r_k$ is the probability that channel $k$ reveals a meaningful
consequence. If all six channels have detection probability $r$, requiring
$(1-r)^6 \leq 0.05$ gives

$$r \geq 1 - 0.05^{1/6} \approx 0.393$$

— each channel must have roughly a 39% or greater chance of revealing
impact.

The defensible claim, stated with its assumptions:

> Six is a minimum review depth **when** the six checks represent
> sufficiently distinct dependency channels **and** each has at least about a
> 40% probability of detecting meaningful propagation. Under those
> assumptions, the chance that all six fail to reveal an effect is below 5%.
> **Without those assumptions, six is a heuristic, not a probability
> guarantee.**

> *Implementation note.* This constrains traversal, not just doctrine: if the
> six-hop budget is spent on many intra-layer hops (high $\rho$, few
> channels), the review set has correlated coverage and the effective horizon
> collapses toward $n_{\text{eff}} \approx 1$–2. Channel-aware traversal
> should therefore prefer spending budget across distinct layers, and the
> audit output should report which of the six channels the review set
> actually covers.

---

## 3. Change events and magnitude

A change is an event, not just a node:

$$z = (u, \kappa, t)$$

where $u$ is the changed node, $\kappa$ is the change class, and $t$ is the
event time or version.

Every change receives a magnitude $\Delta(u) \in [0,1]$:

| Change | $\Delta$ |
|---|---|
| spelling correction | 0.01 |
| formatting change | 0.02 |
| citation replacement | 0.20 |
| variable recoding | 0.60 |
| changed outcome definition | 0.85 |
| changed research question | 1.00 |

---

## 4. Hard-trigger propagation is stateful

A hard trigger is not a pairwise indicator $H(u,v)$. It is a **propagated
state** initiated by a change event.

Let $h_z(v) \in \{0,1\}$ indicate whether the hard-trigger state from event
$z$ has reached node $v$. Initialize $h_z(u) = 1$. The state propagates
across edge $e = (x, y, \tau, w)$ — that is, $h_z(y) = 1$ — when
$h_z(x) = 1$ and at least one of:

- $\tau \in E_{\text{persistent}}$;
- $b(p_{u \leadsto y}) \leq 6$ for the traversed path;
- the change class $\kappa$ has an explicit global invalidation rule.

This separates ordinary impact **scoring** from invalidation **state**. Hard
invalidation must not depend on a continuous impact score.

Hard-trigger change classes include:

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

## 5. Human gates stop propagation only after re-clearance

A governance gate does not automatically stop traversal. Let

$$g(v, z) \in \{\text{not\_required}, \text{pending}, \text{cleared}, \text{rejected}\}$$

Propagation **continues through** a gate while $g(v,z) = \text{pending}$ or
$g(v,z) = \text{rejected}$. It may terminate at that branch only when
$g(v,z) = \text{cleared}$ **and the clearance explicitly applies to the
triggering change event $z$**.

This matters because an old approval is not valid for a new upstream change.
A gate is event-specific. The clearance object binds

$$(\text{gate node}, \text{change event}, \text{reviewer}, \text{time}, \text{rationale})$$

For example:

```yaml
clearance_id: clr_0042
gate_node: clinical_recommendation_07
change_event: source_retraction_2026_014
status: cleared
reviewer: human_12
rationale: >
  recommendation unchanged because the retracted source was
  non-contributory
reviewed_inputs:
  - evidence_table_v8
  - recommendation_text_v3
protocol_hash: sha256:...
timestamp: 2026-07-12T14:32:00+03:00
```

> *Implementation note.* When a gate transitions to `cleared` for event $z$,
> the hard-trigger state $h_z$ is recomputed: nodes downstream of the gate
> lose the flag **via that branch**, but keep it if reached through another
> still-uncleared path. Clearance prunes one branch; it does not globally
> extinguish the event.

---

## 6. Impact function (non-hard propagation)

$$I_p(u,v) = \Delta(u) \prod_{j=1}^{k} w_j \, \lambda_{\tau_j}$$

with type-specific decay:

$$\lambda_\tau = 1 \ \text{for persistent edge types}, \qquad 0 < \lambda_\tau < 1 \ \text{for decaying edge types}$$

Aggregate over admissible paths by maximum:

$$I(u,v) = \max_{p \in \mathcal{P}_6(u,v)} I_p(u,v)$$

The hard-trigger state $h_z(v)$ remains separate from this score.

---

## 7. Node fragility, consequence, and authority (A2 resolution)

Keep both terms, defined narrowly so nothing is double-counted:

**Epistemic fragility** $s(v) \in [0,1]$ — how easily the node's validity is
disturbed by upstream change. Raw immutable source file: low; derived
exposure classification: high; causal interpretation: high; formatting-only
object: low.

**Consequence severity** $c(v) \in [0,1]$ — the cost if the node remains
wrong. Exploratory plot: low; abstract conclusion: moderate to high; clinical
recommendation: very high; regulatory submission statement: very high.

**Authority factor** $a(v)$ — whether specialist or formal sign-off is
required (governance burden).

**Review pressure** (epistemic):

$$P(u,v) = I(u,v)\, s(v)$$

**Operational priority**:

$$\pi(u,v) = P(u,v) \cdot c(v) \cdot a(v)$$

The interpretation:

$$\text{priority} = \text{likelihood of being affected} \times \text{cost if wrong} \times \text{required authority}$$

There is no double-counting when $s$ means susceptibility to invalidation,
$c$ means harm if wrong, and $a$ means governance burden.

### Trigger thresholds

With initial defaults $\theta_1 = 0.10$, $\theta_2 = 0.30$:

| Condition | Action |
|---|---|
| $P(u,v) < \theta_1$ | No review |
| $\theta_1 \leq P(u,v) < \theta_2$ | Inspect |
| $P(u,v) \geq \theta_2$ | Mandatory review |

### Hard reviews override priority

Priority controls **order, not obligation**. For hard-triggered nodes
($h_z(v) = 1$), mandatory review remains mandatory even if $\pi(u,v)$ is
low. A retracted source may propagate to a low-consequence supplementary
sentence; that sentence still requires review because the evidential chain is
invalidated. The score may place it later in the queue, but cannot remove it.

---

## 8. The review set

For event $z$ originating at $u$:

$$\mathcal{Q}(z) = \mathcal{Q}_{\text{scored}}(z) \cup \mathcal{Q}_{\text{hard}}(z)$$

where

$$\mathcal{Q}_{\text{scored}}(z) = \{v : \exists p \in \mathcal{P}_6(u,v),\ P(u,v) \geq \theta_1\}$$

$$\mathcal{Q}_{\text{hard}}(z) = \{v : h_z(v) = 1\}$$

A node can be outside the six-hop scored region and still belong to the
mandatory hard-review set — this removes the version-1 contradiction.

Mandatory review:

$$\mathcal{Q}_{\text{mandatory}}(z) = \{v : P(u,v) \geq \theta_2\} \cup \mathcal{Q}_{\text{hard}}(z)$$

except nodes with a valid **event-specific** clearance
$g(v,z) = \text{cleared}$.

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

Review upstream objects before downstream objects: sort by shortest
dependency distance, then highest priority $\pi$, then governance gate
status. This prevents reviewing the conclusion before fixing the analysis.

---

## 9. Multiple simultaneous changes

For a set of change events $C$, combine impacts with a noisy-OR:

$$I_C(v) = 1 - \prod_{u \in C} \bigl(1 - I(u,v)\bigr), \qquad P_C(v) = I_C(v)\, s(v)$$

Bounded and probability-like; preferable to simple addition because the score
remains within $[0,1]$. Hard-trigger states from distinct events remain
distinct — each $h_z$ requires its own event-specific clearance.

---

## 10. Propagation parameters are protocol objects (A3 resolution)

All parameters belong to a versioned policy object:

$$\Theta = (\lambda_\tau,\ \theta_1,\ \theta_2,\ w,\ s,\ c,\ a,\ c(\tau),\ H_\kappa)$$

where $H_\kappa$ contains hard-trigger rules by change class:

```yaml
policy_id: propagation-params-v1
version: 1.0.0
horizon:
  decaying_edge_budget: 6
edge_budget_cost:
  semantic: 0
  governance: 0
  computational: 1
  evidential: 1
  inferential: 1
  provenance: 1
decay:
  semantic: 1.00
  governance: 1.00
  computational: 0.85
  evidential: 0.90
  inferential: 0.90
  provenance: 0.75
thresholds:
  inspect: 0.10
  mandatory: 0.30
hard_trigger_rules:
  source_retracted:
    propagate_over:
      - semantic
      - evidential
      - inferential
      - governance
    stop_condition: event_specific_human_clearance
  primary_outcome_changed:
    propagate_over:
      - semantic
      - computational
      - inferential
      - governance
    stop_condition: event_specific_human_clearance
scoring:
  path_aggregation: max
  multi_event_aggregation: noisy_or
created_by: human
approved_by: methods_owner
created_at: 2026-07-12
```

Canonicalize and hash it:

$$h_\Theta = \operatorname{SHA256}(\operatorname{canonicalJSON}(\Theta))$$

Every review decision stores:

```yaml
propagation_policy:
  policy_id: propagation-params-v1
  hash: sha256:...
```

Then the system can answer *"Why was this node not flagged?"* with: the
active policy version; traversed paths; exhausted horizon budget; edge types;
scores; thresholds; hard-trigger state; gate clearance status.

### Parameter changes must themselves trigger review

A changed propagation policy can alter previous review sets, so the policy
object is itself a graph node. If $\Theta_1 \rightarrow \Theta_2$, prior
events may need replay:

$$\mathcal{E}_{\text{replay}} = \{z : \mathcal{Q}_{\Theta_1}(z) \neq \mathcal{Q}_{\Theta_2}(z)\}$$

In practice, recompute previous unresolved or high-consequence change events
under the new policy. Otherwise a threshold adjustment could silently alter
what the system considers safe.

---

## 11. Path aggregation: max-over-paths as version 1 (A4, deferred)

Keep $I(u,v) = \max_p I_p(u,v)$ for the initial model. Three advantages:
interpretable; conservative against artificial inflation; explainable through
one dominant path.

**Record all qualifying paths**, even though only the maximum path controls
the score. The audit output can then say:

```
Primary trigger path:
  source retraction
  → evidence assessment
  → pooled estimate
  → abstract conclusion
Additional supporting paths: 2
Aggregation rule: maximum path impact
```

A later alternative could distinguish correlated and independent paths. For
independent paths:

$$I_{\text{combined}}(u,v) = 1 - \prod_{p} \bigl(1 - I_p(u,v)\bigr)$$

But independence is rarely known. Using this by default would create
pseudo-precision.

---

## 12. Core Vahtian rules

> **A change must trigger review wherever it can alter meaning, evidence,
> computation, or authority.**

> **Six limits decaying review search, never semantic or governance
> invalidation.**

> **A hard trigger propagates until every affected branch reaches an
> event-specific human clearance.**

> **Inspect at least six distinct dependency channels, not merely six
> adjacent nodes.**

The system never claims that an affected node is *wrong*. It states:

- why the node may be affected;
- through which dependency path;
- how strong the impact is;
- whether inspection or mandatory review is required;
- **who has authority to clear it**.

The product is therefore not an automatic invalidation engine. It is a
**dependency-aware review trigger system**. Clearing a flag is always a human
decision, bound to the specific change event and recorded with actor,
rationale, and timestamp in the audit trail.

---

## 13. Naming

The mathematical object:

- plainly: **Vahtian Change Graph**
- memorably: **Six-Hop Epistemic Change Propagation**
- technically: **Typed Epistemic Dependency Graph with bounded change
  propagation**
