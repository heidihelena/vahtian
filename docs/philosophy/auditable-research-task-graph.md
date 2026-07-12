# From Atomic Task Graph to Auditable Research Task Graph

**Status:** internal philosophy note — founder doctrine, not user-facing copy.
Anything derived from this document for marketing or product UI goes through
`vahtian-brand-safety` and must remain consistent with `AD_CLAIMS.md`.

**Source under review:** *Atomic Task Graph (ATG)* — arXiv:2607.01942 [cs.AI],
July 2026 preprint, 14 pages. <https://doi.org/10.48550/arXiv.2607.01942>

**Date:** 2026-07-12

---

## Core judgment

This paper fits Vahtian very well as an **execution architecture**, but poorly
as a complete **research-governance philosophy**.

ATG gives Vahtian a technical answer to this question:

> How should an agentic research workflow be represented so that its steps,
> dependencies, failures, and repairs remain visible?

Vahtian supplies the missing epistemic answer:

> Who is allowed to judge a step as acceptable, what evidence supports that
> judgment, what uncertainty remains, and when must the system abstain?

The strongest synthesis is:

> **ATG provides the workflow graph. Vahtian provides the evidence,
> validation, and authority model for every node and edge.**

The paper should therefore influence the architecture of the Vahtian Research
OS, CiteVahti, StudyVahti, ReviewVahti, GuidelineVahti, and AuditLite. It
should not become Vahtian's doctrine unchanged.

---

## 1. What the paper proposes

The paper argues that most LLM agents still execute complex tasks as
essentially linear textual trajectories. Even where an agent uses plans,
trees, or multiple roles, the relationships between intermediate outputs often
remain implicit. This makes errors difficult to localize and encourages broad
replanning that may overwrite work that was already correct.

ATG replaces that linear trajectory with an explicit directed acyclic graph:

- each node is an atomic tool operation;
- each edge records that one node's output becomes another node's input;
- coarse tasks are recursively decomposed into executable nodes;
- each decomposition preserves the parent task's input-output interface;
- independent branches can run in parallel;
- each node records its inputs, outputs, execution state, and errors;
- failures are repaired within the smallest affected subgraph rather than by
  restarting the entire process.

The paper also adds a pre-execution "thought experiment." The agent simulates
the graph before execution and checks for missing steps, unsuitable tools,
broken dependencies, interface mismatches, and implausible paths.

This is a control framework. It does not train a new model. The experiments
use 7B to 8B open-source models and report large gains against several linear,
tree-based, graph-based, and multi-agent baselines on ALFWorld, WebShop, and
ScienceWorld.

---

## 2. Why this is deeply compatible with Vahtian

### Vahtian rejects invisible process

A central Vahtian principle is that the useful product is not merely an
answer. It is a defensible record of how the answer was produced.

ATG formalizes this structurally. A normal chatbot gives:

```
question → long invisible process → answer
```

ATG gives:

```
question
  ├── retrieve inputs
  ├── inspect constraints
  ├── run analysis
  ├── assess assumptions
  ├── generate output
  └── verify deliverable
```

The graph exposes dependencies rather than burying them in a transcript. The
paper explicitly records node inputs, outputs, execution state, and error
messages.

That is close to Vahtian's concept of a research audit trail. The difference
is that Vahtian would require more than technical state. It would also record:

- source provenance;
- human or machine authorship;
- evidence type;
- verification status;
- uncertainty;
- decision authority;
- deviations from protocol;
- reasons for acceptance, rejection, or abstention.

ATG provides the skeleton. Vahtian adds the epistemic metadata.

### Vahtian treats structure as a gradient

The Research OS principle is: **capture → working → settled**.

ATG's recursive graph compilation closely matches that progression. A
high-level task begins as a coarse node. It is then progressively decomposed
until each operation is executable. The paper treats planning as compilation
from semantic intent into an operational graph rather than as a one-shot plan.

A Vahtian implementation could map this directly:

| Vahtian state | ATG equivalent |
|---|---|
| Capture | Coarse user objective |
| Working | Partially decomposed graph |
| Settled workflow | Reviewed executable graph |
| Execution | Atomic tool nodes run |
| Audit | Node and edge records inspected |
| Revision | Small affected subgraph repaired |

This is preferable to requiring researchers to perfectly structure a study at
the beginning. The workflow can begin loosely and become more explicit when
action, reproducibility, or review requires it. That is consistent with the
principle that structure should support work without policing early thought.

### Vahtian prefers small, local, replaceable tools

ATG treats tools as atomic functional units with explicit input-output
interfaces. A search API, calculator, code executor, database query, or
specialist function can each become a node.

This fits the Vahtian product family better than building one enormous "AI
researcher." For example:

```
Import manuscript
      ↓
Segment claims
      ↓
Resolve citations
      ↓
Retrieve source text
      ↓
Assess claim-source support
      ↓
Human rating
      ↓
AI blinded rating
      ↓
Adjudication
      ↓
Export audit record
```

Each operation can remain independently inspectable and replaceable. CiteVahti
does not need to become a monolithic model. It can remain a graph of bounded
operations: parser; identifier resolver; PDF retriever; sentence matcher;
support assessor; conflict detector; adjudication interface; export generator.

This is strategically important. Vahtian can improve one node without
rebuilding the entire system.

### Vahtian is local-first, and ATG supports smaller models

The paper's results suggest that better control architecture can compensate
for some limitations of smaller open-source models. ATG with 7B to 8B
backbones substantially outperformed the same models using weaker control
frameworks and, on some benchmark-model combinations, exceeded GPT-4 with
ReAct.

This supports Vahtian's local-first position. The commercial implication is
**not**:

> small local models are now as reliable as frontier models.

The proper implication is:

> local models become more useful when their work is bounded, decomposed,
> stateful, and recoverable.

That distinction matters. The paper does not establish scientific validity,
clinical safety, or universal equivalence to larger models. It shows that
architecture matters substantially on three interactive text benchmarks.

For Vahtian, this supports a system in which:

- sensitive data remain local;
- several small models can serve bounded roles;
- deterministic tools handle deterministic work;
- outputs are persisted at node level;
- failed nodes can be rerun;
- human decisions remain explicit.

This is stronger than asking one local model to read an entire study vault and
behave like an autonomous senior researcher.

---

## 3. Where ATG is weaker than Vahtian philosophy

### "Validated" is underspecified

The paper repeatedly refers to preserving "validated" regions of the graph.
Yet validation largely means that a node passed an internal pre-execution
check or executed without an obvious operational failure.

In research, these are different claims:

1. the tool ran;
2. the output has the expected format;
3. the output is internally consistent;
4. the source supports the output;
5. the method is scientifically appropriate;
6. the interpretation is defensible;
7. a qualified human accepted the decision.

ATG tends to compress these into successful execution. Vahtian must not.

A node that produces a regression table successfully has not established that
the model specification was appropriate; that missingness was handled
correctly; that the estimand matches the research question; that assumptions
were acceptable; that the result was interpreted correctly; or that selective
analysis did not occur.

Vahtian should replace the binary term *validated* with a typed status system:

```
execution_status: succeeded
schema_status: passed
source_status: verified
method_status: human_approved
interpretation_status: pending
uncertainty_status: material
```

This prevents operational success from masquerading as epistemic validity.

### The paper has no serious human-authority model

The ATG agent plans, executes, checks, localizes, and repairs. Human oversight
is not a central component of the framework — the paper contains no
substantive human-in-the-loop architecture beyond a reference to WebGPT.

That conflicts with Vahtian's human-first principle. Vahtian should introduce
several node classes:

**Machine-executable nodes** — parse RIS; calculate an effect estimate; render
a plot; hash a protocol; compare two files. These may run automatically.

**Machine-assessment nodes** — classify a study design; assess whether a
citation appears supportive; suggest potential assumptions; flag inconsistent
terminology. These may produce proposals or warnings, never final authority.

**Human-decision nodes** — approve the research question; accept an inclusion
decision; judge risk of bias; approve a construct definition; adjudicate
conflicting ratings; accept a protocol deviation; sign off on interpretation.
These must block downstream execution when the decision is consequential.

ATG has executable dependencies. **Vahtian needs authority dependencies.** A
downstream node should not merely ask, "Is the predecessor complete?" It
should ask:

> Was the predecessor completed by an actor with sufficient authority, under
> the required protocol, using the required evidence?

### ATG identifies technical failure, not epistemic failure

The paper's pre-execution checks cover consistency, missing steps, tool
appropriateness, dependency validity, and constraints. These are useful, but
they do not adequately cover research errors such as:

- wrong causal question;
- construct drift;
- post hoc outcome switching;
- inappropriate comparator;
- collider adjustment;
- measurement incompatibility;
- unsupported inferential leap;
- generalization beyond the sampled population;
- confusion between absence of evidence and evidence of absence;
- citation that is topically relevant but does not support the claim.

ATG asks whether the plan **can** execute. Vahtian asks whether the plan
**deserves** to execute. This distinction should become part of the Vahtian
product language:

> **Execution correctness is not research correctness.**

### The graph structure can create false confidence

Graphs look formal. Formal appearance can conceal weak semantics. An explicit
edge from node A to node B proves only that B consumed A's output. It does not
prove that A is credible or that the dependency is scientifically justified.

For example:

```
AI classifies exposure
        ↓
Regression uses exposure
        ↓
Paper reports association
```

The graph is technically clear. It may still be scientifically weak because
exposure classification was not validated; the source variable did not measure
the intended construct; uncertainty from classification was not propagated;
and human review was absent.

Vahtian should therefore distinguish edge types:

- **computational edges**: output passed to input;
- **evidential edges**: source supports a claim;
- **inferential edges**: result permits a conclusion under stated assumptions;
- **governance edges**: approval is required before proceeding;
- **provenance edges**: an object was derived from another object;
- **contradiction edges**: one object challenges another;
- **uncertainty edges**: uncertainty is propagated downstream.

ATG mainly models the first type. Vahtian's value lies in the other five.

### Repairing the smallest subgraph may be scientifically insufficient

Minimal repair is one of the paper's strongest engineering ideas. When a node
fails, ATG traces it back to the smallest historical ancestor and repairs only
the affected subgraph while freezing the rest.

This is efficient, but research errors are sometimes non-local. A changed
construct definition may affect eligibility, coding, variable definitions,
analysis, figures, discussion, and conclusion. A changed causal estimand may
invalidate the entire analysis graph. A corrected citation may alter only one
sentence.

Therefore Vahtian should support two repair modes:

**Local operational repair** — use when the interface remains valid. Examples:
failed PDF retrieval; malformed file; incorrect plotting command; missing
export field.

**Semantic invalidation** — use when the meaning of an upstream object
changes. Examples: revised construct; changed outcome definition; new protocol
version; changed eligibility criterion; altered causal question; new
adjudication decision. (A retraction or erratum of a cited source is the
canonical external trigger.)

Semantic invalidation must propagate through all downstream nodes whose
conclusions depend on the changed meaning, even when their files remain
technically executable. This is a major Vahtian extension to ATG.

---

## 4. The strongest Vahtian adaptation

A Vahtian task node should not be only

```
v_j = (i_j, f_j, o_j)
```

— input, function, and output, as in the paper. It should be closer to:

```
v_j = (i_j, f_j, o_j, p_j, a_j, s_j, u_j, q_j, d_j)
```

where:

- `i_j`: inputs;
- `f_j`: operation or tool;
- `o_j`: outputs;
- `p_j`: provenance;
- `a_j`: actor and authority;
- `s_j`: validation statuses;
- `u_j`: uncertainty;
- `q_j`: applicable protocol or quality rule;
- `d_j`: decision rationale.

A practical node record might look like this:

```yaml
node_id: citation_support_0042
task_type: machine_assessment
objective: assess whether source supports manuscript claim
inputs:
  claim_id: claim_0042
  source_id: pmid_38123456
  source_passage_id: passage_009
tool:
  name: citevahti_local
  version: 0.21.0
  model: local-model-name
  prompt_hash: sha256:...
output:
  rating: partial_support
  confidence: 0.63
  rationale: >
    The source supports the association but not the manuscript's
    causal wording.
provenance:
  manuscript_hash: sha256:...
  source_pdf_hash: sha256:...
  extracted_text_hash: sha256:...
authority:
  machine_can_finalize: false
  human_review_required: true
  required_role: reviewer
status:
  execution: succeeded
  source_resolution: verified
  machine_assessment: complete
  human_assessment: pending
  adjudication: not_required_yet
uncertainty:
  source_passage_ambiguity: moderate
  claim_scope_mismatch: likely
protocol:
  protocol_id: citevahti-support-v1
  protocol_hash: sha256:...
audit:
  created_at: 2026-07-12T...
  supersedes: null
```

This is an Atomic Task Graph transformed into an **Auditable Research Task
Graph**.

---

## 5. Product-by-product implications

### CiteVahti

ATG fits CiteVahti extremely well. The claim-to-evidence workflow naturally
forms a graph:

```
Document
   ↓
Claim extraction
   ↓
Citation linkage
   ↓
Identifier resolution
   ↓
Source retrieval
   ↓
Relevant passage selection
   ├── Human rating
   └── AI rating
          ↓
Comparison
   ├── Agreement → accepted record
   └── Conflict  → adjudication
                        ↓
                     Export
```

The important addition is that human and AI assessments should remain separate
branches until reconciliation. They should not be collapsed into one opaque
rating.

ATG's branch structure is ideal for blinded parallel assessment. Its state
tracking supports:

- rerunning AI assessment without changing the human rating;
- replacing a model while retaining previous outputs;
- correcting one source without rerunning unrelated claims;
- identifying every downstream result affected by a changed claim;
- preserving already adjudicated claims.

This could become CiteVahti's internal orchestration model.

### FullVahti

FullVahti has a simpler graph:

```
Zotero item
   ↓
Identifier extraction
   ├── DOI
   ├── PMID
   └── title fallback
          ↓
OA lookup
   ├── repository
   ├── publisher
   └── unresolved
          ↓
PDF validation
   ↓
Zotero attachment
   ↓
status tag + run report
```

ATG's minimal repair is directly useful here. A failed repository lookup
should not require repeating successful DOI resolution. A malformed PDF should
restart from retrieval or file validation, not from the entire item-import
process. This is an uncomplicated and high-value use case.

### StudyVahti

StudyVahti may gain the most from this architecture. A registry study can be
represented as a graph of research objects:

```
Research question
      ↓
Target population
      ↓
Estimand
      ↓
Variable dictionary
      ↓
Cohort construction
      ↓
Analysis dataset
      ├── descriptive analysis
      ├── primary model
      ├── assumptions
      ├── sensitivity analyses
      └── missingness analysis
                ↓
          Results objects
                ↓
        Tables and figures
                ↓
        Manuscript claims
```

Each manuscript claim can retain links to the table cell; the generated result
object; the analysis script; the dataset version; the variable definition; the
protocol or SAP item; and the human interpretation.

This would make StudyVahti more than a template vault. It becomes a
dependency-aware study record. The major product promise would be:

> **Change one decision and see what must be reviewed again.**

That is more valuable than merely storing files.

### AuditLite

This paper strongly supports AuditLite as an emerging product. AuditLite
should inspect an existing workflow graph and ask:

- Are required inputs present?
- Are inputs and outputs type-compatible?
- Are steps missing?
- Are tools appropriate for the stated task?
- Are unsupported dependencies present?
- Are conclusions traceable to results?
- Are results traceable to code and data?
- Were any downstream objects left unchanged after an upstream semantic change?
- Which nodes were machine-generated?
- Which decisions lack human approval?
- Which nodes claim "validated" status without a defined validation procedure?
- Which branches disagree?
- Which parts can be repaired locally?
- Which changes require broad invalidation?

This is closely related to the paper's pre-execution thought experiment, but
made appropriate for scientific work.

ATG checks whether the workflow is executable. AuditLite should check whether
the workflow is defensible, complete, and internally traceable.

### ReviewVahti

A peer-review workflow can use parallel branches:

```
Manuscript
   ├── reporting-guideline assessment
   ├── methods assessment
   ├── statistics assessment
   ├── claim-evidence assessment
   └── scope and interpretation assessment
             ↓
       reviewer synthesis
             ↓
        human sign-off
```

This reduces the risk of one large model generating a long generic review from
a growing context. Each concern becomes a node with: manuscript location;
evidence; concern type; severity; requested action; reviewer rationale; human
approval.

ATG's localized context can reduce generic drift. Vahtian's human authority
layer prevents the model from becoming the reviewer.

### GuidelineVahti

For guideline development, the graph could represent:

```
Clinical question → PICO → Search strategy → Study selection
→ Data extraction → Risk of bias → Evidence synthesis
→ GRADE domains → Evidence-to-decision framework
→ Ballot → Recommendation
```

This is a natural dependency graph. However, GuidelineVahti must model
disagreement, revision rounds, conflicts of interest, abstention, and
authority. A simple DAG may be insufficient because guideline processes
revisit earlier stages.

The practical answer is:

- use a DAG for each version;
- preserve version-to-version lineage;
- treat each revision as a new immutable graph state;
- link superseded nodes rather than silently overwriting them.

That protects the audit trail.

---

## 6. How this should change the Obsidian Research OS

The vault should not become an agent that reads every note and invents a
global plan. It should gradually construct a graph from existing work.

Each research object becomes a note or machine-readable record: Question,
Protocol, Construct, Variable, Dataset, Analysis, Result, Figure, Claim,
Citation, Decision, Deviation, Review.

Each object gets explicit relations:

```
depends_on:
derived_from:
supports:
contradicts:
approved_by:
implements:
deviates_from:
supersedes:
invalidates:
```

The agent's job is to:

1. suggest missing links;
2. detect unresolved dependencies;
3. propose executable nodes;
4. run permitted local tools;
5. record outputs;
6. flag semantic changes;
7. request human decisions at gates;
8. preserve earlier states.

The graph view then becomes useful. It stops being decorative knowledge
visualization and becomes an operational study map.

A qualitative study might show:

```
Research question → Sampling rationale → Interview guide
→ Interview files → Transcripts → Initial coding
→ Codebook revisions → Categories → Themes
→ Interpretive claims → Illustrative quotations
```

A changed code definition can mark relevant coded passages and downstream
themes for review. It should not automatically rewrite the interpretation.

---

## 7. The philosophical difference

ATG is based on an **engineering ontology**:

- a task has an objective;
- tools transform inputs into outputs;
- a valid graph produces an acceptable result;
- failures can be localized;
- successful components can be reused.

Vahtian needs an **epistemic ontology**:

- objectives may be contested or underspecified;
- inputs may be biased, incomplete, or conceptually unstable;
- tools carry assumptions;
- outputs may be plausible without being warranted;
- validation is role-specific;
- uncertainty must remain visible;
- some disagreements should not be resolved automatically;
- an acceptable output may still be scientifically indefensible;
- abstention is sometimes the correct result.

ATG optimizes completion. Vahtian optimizes defensibility under uncertainty.

That is why the paper fits **below** the philosophy rather than replacing it.

---

## 8. Important limits of the evidence

The paper is a July 2026 arXiv preprint. It evaluates ATG on three text-based
interactive benchmarks: ALFWorld, WebShop, and ScienceWorld. The authors
explicitly state that multimodal and real-world settings require further
validation. They also acknowledge dependence on the backbone model's
decomposition ability, difficulty localizing failures under noisy observations
or long-range dependencies, and extra overhead for simple tasks.

The results therefore do not establish that ATG is ready for autonomous
scientific workflows. Specific unanswered questions include:

- whether the decomposition is scientifically meaningful;
- whether hidden assumptions survive interface-preserving compilation;
- whether failure localization works when an error is conceptual rather than
  operational;
- whether graph repair correctly propagates uncertainty;
- whether human review can be integrated without creating false automation;
- whether the large benchmark gains reproduce independently;
- whether the framework remains efficient with thousands of research objects;
- whether a DAG adequately represents iterative qualitative interpretation,
  protocol amendments, and consensus rounds.

The paper should be treated as a strong architectural pattern, not as proof of
research reliability.

---

## 9. Best Vahtian formulation

The paper's language translated into Vahtian doctrine:

| ATG concept | Vahtian version |
|---|---|
| Atomic task node | Bounded research operation |
| Input-output interface | Explicit research object contract |
| Dependency edge | Computational, evidential, inferential, or governance relation |
| Successful execution | Operation completed |
| Validated region | Region with typed verification status |
| Thought experiment | Preflight audit |
| Local repair | Minimal operational repair |
| Graph history | Immutable provenance record |
| Acceptable output | Human-approved, protocol-consistent deliverable |
| Agent autonomy | Permission-bounded execution |
| Failure | Operational, evidential, methodological, or governance failure |
| Final answer | Auditable deliverable with unresolved uncertainty visible |

---

## 10. Strategic conclusion

This paper gives Vahtian the technical foundation for the agentic Research OS.
It supports these decisions:

1. Do not build one autonomous research agent. Build a graph executor
   coordinating small, bounded tools.
2. Make the graph persistent. Chat history is not the workflow record.
3. Store every node's input, output, status, provenance, tool version, and
   decision authority.
4. Separate execution success from scientific validation.
5. Use human decision nodes as mandatory gates.
6. Support local repair, but propagate semantic invalidation broadly when
   meanings change.
7. Keep AI ratings separate from human ratings until explicit reconciliation.
8. Use smaller local models for narrow nodes rather than asking them to reason
   over the entire vault.
9. Turn AuditLite into the graph auditor. Its core function is to inspect
   dependencies, missing steps, validation claims, unsupported transitions,
   and stale downstream objects.
10. Define Vahtian's architecture as an **Auditable Research Task Graph**.

The central Vahtian claim becomes:

> Research AI should not produce an answer through an invisible trajectory.
> It should operate through a visible graph of bounded tasks, evidence
> dependencies, human decisions, and repairable failures.

ATG explains how to make the work graph executable. Vahtian explains how to
make it scientifically defensible — meaning the *record* of who decided what,
on what evidence, stays inspectable; not that Vahtian certifies the science
itself.
