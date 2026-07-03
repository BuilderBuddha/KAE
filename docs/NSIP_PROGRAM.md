# Natural Systems Intelligence Program (NSIP)

**Status:** Permanent architectural program — **documentation only**  
**Component:** KAE / Axiom ecosystem  
**Scope:** No connectors, web automation, or live search implemented.

---

## Purpose

Natural systems are a **permanent knowledge domain** within the Axiom ecosystem.

KAE should eventually **discover, evaluate, catalog, classify, and acquire** high-quality knowledge from natural systems to inspire:

- Engineering
- AI
- Product design
- Organizational design
- Systems architecture

**Nature is not copied literally.** Nature provides **transferable engineering principles**.

NSIP is a permanent program layered on KAE's connector architecture. It extends acquisition with domain taxonomy, source quality rules, mechanism extraction, and structured Axiom tagging — without bypassing validation, provenance, repository health, or Git readiness gates.

---

## Foundational Doctrine

> **Nature is a source of hypotheses.**  
> **Evidence determines whether the hypothesis survives.**

| Concept | Meaning |
|---------|---------|
| Observation | What the natural system does (mechanism-level, factual) |
| Principle | Proposed transferable engineering insight |
| Hypothesis | Testable design claim derived from the principle |
| Validation | Evidence from experiment, engineering practice, or operational data |
| Adoption | Use in Axiom products only when `ValidationStatus` supports it |

NSIP records enter Axiom Knowledge as **hypothesis-bearing intelligence**, never as authoritative mandates to copy nature literally.

---

## Reference Baseline

NSIP adopts the following as the **initial foundational reference** for the Natural Systems domain:

**INCOSE — *Natural Systems and the Systems Engineering Process: A Primer***

| Attribute | Value |
|-----------|-------|
| Role | Canonical entry point for natural-systems ↔ systems-engineering translation |
| Priority | Tier 1 (highest source quality) |
| Use | Domain framing, vocabulary, initial mechanism catalog, quality bar for future sources |
| Status | Documented baseline — manual cataloging when NSIP acquisition begins |

Future NSIP sources should be evaluated against and cross-referenced with this primer where applicable.

---

## Architectural Component: NSIP

NSIP is a **permanent KAE program component** (not a separate application).

### Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Search natural systems knowledge** | Discover candidate sources across approved domains and quality tiers |
| **Organize by engineering function** | Group mechanisms and principles by what they help engineers do (e.g. resilience, routing, feedback) |
| **Build transferable engineering principles** | Distill observations into principles suitable for design decisions |
| **Support hypothesis generation** | Capture `PossibleHypotheses` linked to mechanisms and principles |
| **Feed Axiom Knowledge** | Export tagged source records through standard KAE pipeline |
| **Supply DIOS reasoning** | Provide evidence-graded material for verification and policy decisions |

### Position in KAE architecture

```
┌─────────────────────────────────────────────────────────┐
│     Natural Systems Intelligence Program (NSIP)          │
│  search · evaluate · catalog · classify · extract        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              KAE Connector Pipeline                      │
│  Normalize → Validate → Classify → Provenance → Emit     │
└──────────────────────────┬──────────────────────────────┘
                           │ mandatory gates
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Axiom Knowledge Repository                  │
│         (Natural Systems permanent domain)               │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
           DIOS                      Vigsy
      (reasoning · verify)      (consumption · apply)
```

NSIP does not replace KAE. It defines **what** to acquire from natural systems and **how** to tag it; KAE defines **how** acquisition is executed safely.

---

## Knowledge Domains

Each source receives one or more `NaturalSystem.Domain` tags.

| Domain ID | Domain | Example focus areas |
|-----------|--------|---------------------|
| `NSIP.Biology` | Biology | Adaptation, immune systems, nervous systems, evolution, symbiosis |
| `NSIP.Ecology` | Ecology | Ecosystems, resilience, succession, resource allocation, feedback |
| `NSIP.Physics` | Physics | Equilibrium, energy, waves, fields, entropy, emergence |
| `NSIP.Hydrology` | Hydrology | Flow, routing, distribution, erosion, accumulation |
| `NSIP.Geology` | Geology | Layered systems, pressure, fault tolerance, long-term evolution |
| `NSIP.Astronomy` | Astronomy | Orbital stability, gravitational organization, scale |
| `NSIP.Mathematics` | Mathematics | Fractals, networks, optimization, information theory |
| `NSIP.Biomimicry` | Biomimicry | Nature-inspired design, form-to-function translation |
| `NSIP.ComplexAdaptiveSystems` | Complex Adaptive Systems | Self-organization, agents, adaptation, non-linearity |
| `NSIP.SystemsEngineering` | Systems Engineering | Requirements, interfaces, verification, trade studies |
| `NSIP.Cybernetics` | Cybernetics | Control, feedback, regulation, goal-directed behavior |
| `NSIP.NetworkScience` | Network Science | Topology, centrality, robustness, cascading failure |

Sources may span multiple domains. One domain is designated **primary**; others are secondary.

---

## Future Acquisition Pipeline

NSIP acquisition flows through a dedicated curation pipeline that **feeds** the standard KAE export path:

```
Search
      ↓
Evaluate Source Quality
      ↓
Catalog Source
      ↓
Classify Domain
      ↓
Extract Mechanisms
      ↓
Identify Transferable Principles
      ↓
Generate Source Record
      ↓
Store in Axiom Knowledge
      ↓
Tag Applicable Products
      ↓
Available to DIOS and Vigsy
```

### Stage definitions

| Stage | Responsibility |
|-------|----------------|
| **Search** | Discover candidates across NSIP domains and Tier-1 sources (not implemented) |
| **Evaluate Source Quality** | Apply quality rules; reject or quarantine low-trust material |
| **Catalog Source** | Register metadata: institution, DOI, publication type, acquisition date |
| **Classify Domain** | Assign `NaturalSystem.Domain` tag(s) |
| **Extract Mechanisms** | Document `ObservedMechanism` — how the natural system works |
| **Identify Transferable Principles** | Derive engineering principles; do not copy form literally |
| **Generate Source Record** | Produce KAE source record with NSIP knowledge model fields |
| **Store in Axiom Knowledge** | Export via KAE (validation, provenance, health, Git readiness) |
| **Tag Applicable Products** | Set `ApplicableProducts`, `EvidenceStrength`, `ValidationStatus` |
| **Available to DIOS and Vigsy** | Downstream consumption for reasoning and application |

---

## Source Quality

### Highest priority (Tier 1)

| Source type | Examples |
|-------------|----------|
| **INCOSE** | Standards, primers, proceedings (including reference baseline primer) |
| **NASA** | Technical reports, systems studies |
| **NSF** | National Science Foundation research |
| **NIH** | Life and biomedical sciences |
| **NOAA** | Atmospheric, ocean, climate systems |
| **USGS** | Geological and hydrological surveys |
| Peer-reviewed journals | Indexed, methodological rigor |
| Academic publishers | Established university and society presses |
| Engineering societies | IEEE, ASME, AIAA, and equivalents |
| University research | Primary .edu research and lab publications |

### Lower priority (Tier 2 — review required)

- Government reports outside Tier-1 agencies
- Conference proceedings with peer review
- Established textbooks

### Deprioritize / reject

| Source type | Action |
|-------------|--------|
| Commercial blogs | Deprioritize |
| Opinion pieces | Deprioritize |
| Unsourced articles | Reject |
| Mystical or unscientific analogies | Reject |
| Unsupported causation claims | Reject |

---

## Knowledge Model

Each imported Natural Systems source should eventually include the following Axiom metadata fields.

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `NaturalSystem.Domain` | `string[]` | Primary and secondary NSIP domain IDs |
| `ObservedMechanism` | `object[]` | Documented natural mechanisms (see schema) |
| `TransferablePrinciple` | `object[]` | Engineering principles derived from mechanisms |
| `ApplicableProducts` | `string[]` | `Axiom`, `DIOS`, `Vigsy`, `FounderOS`, `KAE`, `VIGS` |
| `EvidenceStrength` | `enum` | `strong` \| `moderate` \| `weak` \| `anecdotal` \| `unknown` |
| `ValidationStatus` | `enum` | `unvalidated` \| `under-review` \| `validated` \| `rejected` \| `superseded` |
| `PossibleHypotheses` | `object[]` | Testable claims linked to principles (see schema) |

### `ObservedMechanism` schema

```yaml
ObservedMechanism:
  id: string                 # e.g. NSIP-OM-0001
  title: string
  domain: string             # NSIP domain ID
  description: string          # factual mechanism description
  systemContext: string        # organism, ecosystem, physical system, etc.
  citations: string[]          # pointers within source
```

### `TransferablePrinciple` schema

```yaml
TransferablePrinciple:
  id: string                   # e.g. NSIP-TP-0001
  title: string
  mechanismIds: string[]       # links to ObservedMechanism
  principle: string            # transferable engineering insight
  notLiteralCopy: true         # explicit: form is not copied
  engineeringFunctions: string[]  # e.g. resilience, routing, feedback
  applicableProducts: string[]
  evidenceStrength: EvidenceStrength
  validationStatus: ValidationStatus
```

### `PossibleHypotheses` schema

```yaml
PossibleHypotheses:
  id: string                   # e.g. NSIP-HY-0001
  principleId: string          # links to TransferablePrinciple
  hypothesis: string           # falsifiable design claim
  testApproach: string         # how the hypothesis could be tested
  validationStatus: ValidationStatus
```

### Example (illustrative)

```yaml
NaturalSystem.Domain: [NSIP.Ecology, NSIP.ComplexAdaptiveSystems]
ObservedMechanism:
  - id: NSIP-OM-0042
    title: Ecological succession after disturbance
    domain: NSIP.Ecology
    description: Ecosystems recover through ordered seral stages, each enabling the next.
    systemContext: Temperate forest after fire
TransferablePrinciple:
  - id: NSIP-TP-0018
    title: Phased capability restoration
    mechanismIds: [NSIP-OM-0042]
    principle: Complex systems may recover through ordered capability layers rather than single-step restoration.
    notLiteralCopy: true
    engineeringFunctions: [migration, resilience, rollout]
    applicableProducts: [Axiom, FounderOS, VIGS]
    evidenceStrength: weak
    validationStatus: unvalidated
PossibleHypotheses:
  - id: NSIP-HY-0007
    principleId: NSIP-TP-0018
    hypothesis: Phased rollout reduces failure rate vs big-bang cutover for systems with >3 dependent subsystems.
    testApproach: Compare incident rates across phased vs single-cutover migrations in comparable systems.
    validationStatus: unvalidated
ApplicableProducts: [Axiom, DIOS, Vigsy, FounderOS, VIGS]
EvidenceStrength: moderate
ValidationStatus: unvalidated
```

### Planned storage convention

```
Sources/NaturalSystems/{Domain}/{KRC-####}_{Title}.md
Registries/NATURAL_SYSTEMS_CATALOG.md
```

---

## Future Connector Requirements

NSIP acquisition will use **KAE connectors** — not a parallel engine.

| Planned connector | Purpose |
|-------------------|---------|
| NSIP Catalog Import | Manual / curated catalog entries (including INCOSE primer) |
| NSIP Academic Search | Tier-1 institutional and journal discovery |
| NSIP PDF / Paper | DOI-metadata paper ingest |
| NSIP Web Source | Approved URLs after quality pre-check (DIOS-gated) |

Every NSIP connector **must**:

1. Implement `KnowledgeConnector`
2. Pass all mandatory KAE acquisition gates
3. Emit full NSIP knowledge model fields
4. Default `ValidationStatus` to `unvalidated`
5. Never set `validated` without linked evidence
6. Operate behind **DIOS verification** for computer-use or web automation

**Not in scope now:** live search, scraping, automated extraction without review policy, NSIP-specific UI beyond KAE Explorer/Search.

---

## Consumption

| Consumer | Role |
|----------|------|
| **DIOS** | Verify hypotheses, enforce evidence policy, block unvalidated principles for production use |
| **Vigsy** | Retrieve principles tagged `ApplicableProducts: Vigsy` |
| **Axiom** | Permanent natural-systems knowledge domain |
| **Founder OS** | Organizational and strategic design patterns |
| **VIGS** | Product-specific application |
| **KAE** | Re-acquisition and catalog maintenance |

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for NSIP phases. Campaign 1 / 1.1 focuses on ChatGPT; NSIP remains documented architecture only.

| Phase | Deliverable |
|-------|-------------|
| NSIP 0 | Taxonomy, doctrine, knowledge model, INCOSE baseline (this document) |
| NSIP 1 | Catalog registry + manual import of reference baseline |
| NSIP 2 | Rule-based quality evaluation |
| NSIP 3 | Tier-1 academic search connector (DIOS-gated) |
| NSIP 4 | Scheduled NSIP acquisition + DIOS/Vigsy consumption hooks |

---

## Related Documents

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | KAE core architecture |
| [ROADMAP.md](ROADMAP.md) | Full KAE roadmap |
| [ANV_INTEGRATION.md](ANV_INTEGRATION.md) | AnV prioritization + KAE metrics feedback |
| [NSIA_PROGRAM.md](NSIA_PROGRAM.md) | Superseded name — redirects here |

---

*NSIP — permanent natural-systems intelligence for the Axiom ecosystem. Hypotheses from nature; survival by evidence.*
