# KAE Roadmap

**Documentation only.** Items marked *Planned* or *Future* are not implemented unless stated otherwise in [RC_AUDIT.md](RC_AUDIT.md).

---

## Current — Campaign 1 / 1.1 (in progress)

| Item | Status |
|------|--------|
| ChatGPT connector (reference implementation) | **Active** — production RC |
| Connector pipeline (discover → emit) | **Shipped** |
| Validation gate + diff preview | **Shipped** |
| Repository safety (snapshots, manifests) | **Shipped** |
| Repository health + Git readiness | **Shipped** |
| Import reports | **Shipped** |
| Repository Explorer, Dashboard, Search | **Shipped** |
| Full production ChatGPT export import | **User action** |

---

## Campaign 2 — Additional Connectors (planned)

Generic acquisition connectors on the existing pipeline. No NSIP live search.

| Connector | Status |
|-----------|--------|
| PDF | Planned |
| DOCX | Planned |
| YouTube | Planned |
| Meetings | Planned |
| GitHub | Planned |
| Web (DIOS-gated) | Planned |
| RSS / Email / Cloud | Planned |

All Campaign 2 connectors implement `KnowledgeConnector` and pass mandatory acquisition gates.

---

## Future — Scheduled Knowledge Acquisition (planned)

Documented in [ARCHITECTURE.md](ARCHITECTURE.md).

- Daily / weekly imports
- Repository synchronization
- Per-connector schedules
- Computer-assisted acquisition (behind DIOS verification)
- Knowledge monitoring

Uses the same connector pipeline and gates as interactive imports.

---

## Permanent Program — Natural Systems Intelligence Program (NSIP)

**Full specification:** [NSIP_PROGRAM.md](NSIP_PROGRAM.md)

Natural systems are a **permanent knowledge domain** in the Axiom ecosystem. NSIP is an architectural component of KAE — not a separate application.

### Purpose

Discover, evaluate, catalog, classify, and acquire high-quality natural-system knowledge to inspire engineering, AI, product design, organizational design, and systems architecture. Nature provides transferable engineering principles; it is not copied literally.

### Foundational doctrine

> Nature is a source of hypotheses. Evidence determines whether the hypothesis survives.

### Reference baseline

INCOSE — *Natural Systems and the Systems Engineering Process: A Primer* (Tier 1 foundational reference).

### NSIP pipeline (planned)

```
Search → Evaluate Source Quality → Catalog → Classify Domain
  → Extract Mechanisms → Identify Transferable Principles
  → Generate Source Record → Store in Axiom → Tag Products
  → Available to DIOS and Vigsy
```

### Domains

Biology · Ecology · Physics · Hydrology · Geology · Astronomy · Mathematics · Biomimicry · Complex Adaptive Systems · Systems Engineering · Cybernetics · Network Science

### Knowledge model

`NaturalSystem.Domain` · `ObservedMechanism` · `TransferablePrinciple` · `ApplicableProducts` · `EvidenceStrength` · `ValidationStatus` · `PossibleHypotheses`

### Explicitly not started

- Live web search / automation
- NSIP connectors
- Automated mechanism extraction without review policy

### Roadmap phases (planned)

| Phase | Deliverable |
|-------|-------------|
| NSIP 0 | Taxonomy, doctrine, knowledge model, INCOSE baseline (documented) |
| NSIP 1 | Catalog registry + manual import of reference baseline |
| NSIP 2 | Rule-based quality evaluation engine |
| NSIP 3 | Tier-1 academic search connector (DIOS-gated) |
| NSIP 4 | Scheduled NSIP acquisition + DIOS/Vigsy consumption hooks |

---

## Future — AnV Integration (planned)

**Full specification:** [ANV_INTEGRATION.md](ANV_INTEGRATION.md)

### Division of responsibility

| System | Role |
|--------|------|
| **AnV** | Decides whether acquisition is worthwhile |
| **KAE** | Executes acquisition |

### Future workflow

```
Acquire → Validate → Classify → Generate Source Record → Store in Axiom → Return metrics to AnV
```

### Acquisition types (via KAE connectors)

Public websites · Pricing pages · Benefit platforms · Product documentation · Research papers · Academic journals · Government publications · Regulatory sites · YouTube · GitHub · PDFs · Future connectors

### Metrics returned to AnV

Cost · Time · Knowledge gained · Saturation improvement · Confidence · Reuse potential

### Roadmap phases (planned)

| Phase | Deliverable |
|-------|-------------|
| AnV 0 | Architecture and metrics schema (documented) |
| AnV 1 | Manual acquisition with metrics export |
| AnV 2 | AnV → KAE acquisition request interface |
| AnV 3 | Automated feedback loop from metrics |
| AnV 4 | Cost tracking and saturation modeling |

---

## Dependency Graph (simplified)

```
Campaign 1 (ChatGPT) ──► Campaign 2 (connectors)
                              │
                              ▼
                    Scheduled acquisition
                              │
                              ▼
              NSIP (permanent natural-systems domain)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
         DIOS reasoning                  Vigsy consumption
              │
              ▼
    AnV (prioritize · evaluate worth · learn from metrics)
              │
              ▼
         KAE (execute acquisition)
```

---

## Related Documents

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design and gates |
| [NSIP_PROGRAM.md](NSIP_PROGRAM.md) | NSIP full specification |
| [ANV_INTEGRATION.md](ANV_INTEGRATION.md) | AnV integration specification |
| [NSIA_PROGRAM.md](NSIA_PROGRAM.md) | Superseded NSIA name (redirect) |
| [RC_AUDIT.md](RC_AUDIT.md) | Campaign 1.1 audit |

---

*KAE roadmap — connector-first, gate-enforced, with NSIP as permanent natural-systems intelligence.*
