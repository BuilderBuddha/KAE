# AnV Integration

**Status:** Future architecture — **documentation only**  
**Scope:** No AnV API, connectors, or automation implemented.

---

## Division of Responsibility

| System | Role |
|--------|------|
| **AnV** | Decides **whether** acquisition is worthwhile — prioritization, ROI, saturation, scheduling intent |
| **KAE** | **Executes** acquisition — discover, validate, classify, provenance, store in Axiom |

> **KAE executes acquisition. AnV decides whether acquisition is worthwhile.**

AnV does not write to the Axiom Knowledge Repository directly. KAE does not decide global acquisition strategy without AnV input (when integrated). Each system owns a distinct layer:

```
┌─────────────────────────────────────────────────────────┐
│                        AnV                               │
│  Prioritize · Evaluate worth · Plan acquisition targets  │
└──────────────────────────┬──────────────────────────────┘
                           │ acquisition request / policy
                           ▼
┌─────────────────────────────────────────────────────────┐
│                        KAE                               │
│  Acquire · Validate · Classify · Provenance · Store      │
└──────────────────────────┬──────────────────────────────┘
                           │ acquisition metrics
                           ▼
┌─────────────────────────────────────────────────────────┐
│                        AnV                               │
│  Learn · Re-prioritize · Adjust acquisition strategy     │
└─────────────────────────────────────────────────────────┘
```

KAE remains connector-driven and gate-enforced. AnV integration adds a **decision and feedback loop** around acquisition — not a replacement for the KAE pipeline.

---

## Future Acquisition Types

AnV may request or authorize KAE acquisition from any connector-supported source. Planned types include:

| Category | Examples |
|----------|----------|
| **Web** | Public websites, pricing pages, benefit platforms, product documentation |
| **Research** | Research papers, academic journals |
| **Government** | Government publications, regulatory sites |
| **Media / code** | YouTube, GitHub |
| **Documents** | PDFs |
| **Future connectors** | Any source implementing `KnowledgeConnector` |

Each type maps to a KAE connector (existing or planned). AnV selects targets; KAE selects the connector and runs the pipeline.

Web and computer-assisted acquisition remain **DIOS-gated** before entering KAE (see [ARCHITECTURE.md](ARCHITECTURE.md)).

---

## Future Workflow

When AnV integration is active, a completed acquisition follows this workflow:

```
Acquire
      ↓
Validate
      ↓
Classify
      ↓
Generate Source Record
      ↓
Store in Axiom
      ↓
Return acquisition metrics to AnV
```

### Mapping to KAE pipeline

| AnV workflow step | KAE pipeline stage(s) |
|-------------------|------------------------|
| **Acquire** | Discover → Extract → Normalize |
| **Validate** | Validate (+ mandatory gates: health, Git readiness on commit) |
| **Classify** | Classify |
| **Generate Source Record** | Generate Provenance → Generate Source Record → Emit |
| **Store in Axiom** | Export to Axiom Knowledge Repository |
| **Return metrics to AnV** | Post-acquisition metrics payload (planned API) |

AnV-initiated acquisitions pass the **same mandatory gates** as manual or scheduled imports:

Validation → Classification → Provenance → Repository Health → Git Readiness

Failed validation returns metrics to AnV with `success: false` and **no repository writes**.

---

## Acquisition Metrics (AnV Feedback)

After each acquisition (success or failure), KAE returns a structured **acquisition metrics** payload to AnV.

### Metric fields

| Metric | Description |
|--------|-------------|
| **Cost** | Estimated or actual acquisition cost (API fees, compute, human review time) |
| **Time** | Duration from acquire start to store complete (milliseconds) |
| **Knowledge gained** | Count and summary of new/updated source records, tokens or documents added |
| **Saturation improvement** | Delta in domain/topic coverage — how much AnV's target knowledge gap was reduced |
| **Confidence** | Classification and source-trust confidence aggregate |
| **Reuse potential** | Estimated applicability across products/engines (links to `ApplicableProducts` where tagged) |

### Illustrative metrics payload (planned)

```yaml
AcquisitionMetrics:
  acquisitionId: string
  connectorId: string
  sourceType: string              # e.g. web, pdf, github, youtube
  sourceTarget: string            # URL, path, or identifier
  requestedBy: AnV                # system identifier
  success: boolean
  cost:
    estimatedUsd: number | null
    computeMs: number
  time:
    totalMs: number
    validateMs: number
    exportMs: number
  knowledgeGained:
    sourcesCreated: number
    sourcesUpdated: number
    sourcesSkipped: number
    documentsProcessed: number
    createdSourceIds: string[]
  saturationImprovement:
    domain: string                # AnV-defined domain or topic
    priorCoverage: number         # 0.0–1.0
    postCoverage: number
    delta: number
  confidence:
    average: number               # 0.0–1.0
    uncertainCount: number
  reusePotential:
    applicableProducts: string[]
    score: number                 # 0.0–1.0 heuristic
  errors: string[]
  warnings: string[]
  repositoryPath: string
  importReportPath: string | null
  completedAt: string             # ISO 8601
```

Metrics enable AnV to:

- Stop acquiring saturated domains
- Prioritize high reuse-potential sources
- Balance cost vs knowledge gained
- Escalate low-confidence acquisitions for review

---

## Integration Boundaries

| Concern | Owner |
|---------|-------|
| Acquisition worthiness / priority | **AnV** |
| Connector execution / validation / storage | **KAE** |
| Trust boundary for computer-use / web | **DIOS** |
| Verification / policy on stored knowledge | **DIOS** |
| Natural-systems domain rules | **NSIP** (see [NSIP_PROGRAM.md](NSIP_PROGRAM.md)) |
| Repository integrity / Git readiness | **KAE** (`@scooper/repository-engine`) |

KAE does not embed AnV decision logic. AnV does not bypass KAE safety gates.

---

## Planned Integration Points (not implemented)

| Interface | Direction | Purpose |
|-----------|-----------|---------|
| `AnV.requestAcquisition` | AnV → KAE | Submit acquisition target, connector hint, priority, domain context |
| `KAE.acquisitionMetrics` | KAE → AnV | Return post-acquisition metrics payload |
| `AnV.acquisitionPolicy` | AnV → KAE | Rate limits, cost caps, allowed connector types |
| `KAE.acquisitionStatus` | KAE → AnV | In-progress status for long-running acquisitions |

Delivery mechanism (REST, IPC, message queue) is TBD. Desktop KAE may expose metrics via future API; AnV consumes asynchronously.

---

## Relationship to Other Programs

| Program | Interaction with AnV |
|---------|---------------------|
| **Scheduled acquisition** | AnV may define schedules; KAE executes on trigger |
| **NSIP** | AnV may prioritize natural-systems domains; KAE/NSIP execute with NSIP tagging |
| **DIOS** | AnV requests may require DIOS pre-approval for web/computer-use sources |
| **Campaign 2 connectors** | AnV targets map to PDF, GitHub, YouTube, Web connectors |

---

## Roadmap

| Phase | Deliverable |
|-------|-------------|
| AnV 0 | Integration architecture and metrics schema (this document) |
| AnV 1 | Manual acquisition with metrics export (file/API stub) |
| AnV 2 | AnV → KAE acquisition request interface |
| AnV 3 | Automated feedback loop — AnV re-prioritizes from metrics |
| AnV 4 | Cost tracking and saturation modeling |

See [ROADMAP.md](ROADMAP.md).

---

## Related Documents

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | KAE core architecture |
| [ROADMAP.md](ROADMAP.md) | KAE program roadmap |
| [NSIP_PROGRAM.md](NSIP_PROGRAM.md) | Natural Systems Intelligence Program |

---

*KAE executes. AnV decides. Metrics close the loop.*
