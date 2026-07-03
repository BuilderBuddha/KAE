# KAE Architecture

**KAE** (Knowledge Acquisition Engine, pronounced "Kay") is the universal knowledge acquisition system for the Axiom ecosystem. Its purpose is to acquire trusted knowledge from any source, validate it, generate provenance, and ingest it into the Axiom Knowledge Repository.

This document describes the current architecture, the connector model, and planned future capabilities. **Documentation only** — scheduled acquisition is not implemented.

---

## Design Principles

1. **Connector-driven** — Every acquisition method is a connector that plugs into the same pipeline. The core engine contains no source-specific logic.
2. **Validate before write** — No repository mutation until validation succeeds and (for interactive imports) the user explicitly confirms.
3. **Provenance by default** — Every acquired knowledge item carries provenance suitable for audit and trust.
4. **Repository safety** — Snapshots, session manifests, health checks, and Git readiness are part of the acquisition lifecycle, not optional add-ons.
5. **Source-agnostic core** — ChatGPT is the reference connector (Campaign 1). Future connectors implement the same interface without redesigning the engine.

---

## Connector Pipeline

All knowledge acquisition — manual or scheduled — flows through the standard pipeline:

```
Discover Source
      ↓
   Extract
      ↓
  Normalize
      ↓
   Validate
      ↓
  Classify
      ↓
Generate Provenance
      ↓
Generate Source Record
      ↓
Emit Import Package
      ↓
Export to Axiom Repository
```

| Stage | Responsibility |
|-------|----------------|
| Discover | Identify source type, location, and metadata |
| Extract | Pull raw content and assets from the source |
| Normalize | Convert to engine-neutral document format |
| Validate | Read-only checks; no repository writes |
| Classify | Assign categories and confidence |
| Provenance | Record acquisition origin and trust chain |
| Source Record | Produce `ParsedDocument` artifacts |
| Emit | Package documents for export |
| Export | Write to Axiom repository (after gates pass) |

**Reference implementation:** ChatGPT Export ZIP connector (`packages/importers/src/chatgpt/`).

**Orchestration:** `@scooper/connector-engine` runs connector stages; `@scooper/exporters` writes to the repository.

---

## Mandatory Acquisition Gates

Every acquisition — whether triggered by a user in the desktop app or by a future scheduler — **must** pass through these gates before the repository is considered updated and commit-ready:

| Gate | Purpose |
|------|---------|
| **Validation** | ZIP/source integrity, structure, counts, blocking errors, diff preview |
| **Classification** | Category assignment, uncertain routing, review flags |
| **Provenance** | Source file, connector ID, timestamps, conversation/source IDs |
| **Repository Health** | Integrity checks, duplicate IDs, missing registries, broken references |
| **Git Readiness** | Clean/dirty tree, duplicate IDs, snapshot presence, READY / NOT READY |

Scheduled runs do not bypass validation or safety. A failed gate blocks export; the repository remains unchanged (or roll back from snapshot per session manifest).

---

## Current System Layout

```
apps/desktop              Electron + React UI (Import, Dashboard, Explorer, Search)
packages/core             Types, connector contracts, branding, health status helpers
packages/connector-engine Pipeline orchestrator (discover → emit)
packages/repository-engine Health, snapshots, Git readiness, browse, search, import reports
packages/importers        Connectors (ChatGPT = reference)
packages/exporters        Axiom repository writer and import planning
packages/capability-engine Conversation / knowledge classification
packages/parser           Document parsing abstractions (stubs)
packages/source-engine    Source resolution (stubs)
packages/graph            Knowledge graph structures (stubs)
```

**Default repository:** `C:\Users\alber\Axiom-Knowledge`

---

## Connectors

| Connector | Status |
|-----------|--------|
| ChatGPT Export ZIP | Production reference (Campaign 1) |
| YouTube, PDF, Meetings, GitHub, Web, RSS, Email, Cloud | Campaign 2+ — same pipeline, new `KnowledgeConnector` implementations |

Adding a connector requires:

- Implement `KnowledgeConnector` (`packages/core/src/connector/pipeline.ts`)
- Register with the importer/connector registry
- No changes to core validation, export, or repository safety layers

---

## Future Capability: Scheduled Knowledge Acquisition

> **Status:** Planned — not implemented. Campaign 1–1.1 deliver interactive, user-confirmed ChatGPT import. Scheduling is a future architecture extension.

Scheduled acquisition extends KAE from on-demand imports to **time-based and event-based acquisition** while reusing the identical connector pipeline and mandatory gates.

### Planned use cases

| Pattern | Description |
|---------|-------------|
| **Daily imports** | Recurring pull from configured sources (e.g. nightly ChatGPT export drop folder) |
| **Weekly imports** | Lower-frequency batch sync |
| **Repository synchronization** | Align Axiom Knowledge with external source-of-truth on a schedule |
| **Connector schedules** | Per-connector cron or interval (each connector defines what “sync” means) |
| **Computer-assisted acquisition** | Automated gathering via computer-use / browser automation (see DIOS below) |
| **Knowledge monitoring** | Detect new or changed source material and enqueue acquisition jobs |

### Architectural model (planned)

```
┌─────────────────────────────────────────────────────────┐
│                  Schedule / Trigger Layer                │
│  (cron, file watcher, webhook, monitoring, DIOS-assisted) │
└──────────────────────────┬──────────────────────────────┘
                           │ enqueue job
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    KAE Job Queue                         │
│              (same queue as manual imports)              │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Connector Pipeline (unchanged)                │
│   Discover → … → Validate → Classify → Provenance → Emit │
└──────────────────────────┬──────────────────────────────┘
                           │ gates must pass
                           ▼
┌─────────────────────────────────────────────────────────┐
│         Validation · Health · Git Readiness                │
└──────────────────────────┬──────────────────────────────┘
                           │ approved
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Export + Snapshot + Import Report             │
└─────────────────────────────────────────────────────────┘
```

### Scheduled vs interactive imports

| Aspect | Interactive (now) | Scheduled (future) |
|--------|-------------------|---------------------|
| Trigger | User drop/browse/confirm | Timer, watcher, or monitor |
| Confirmation | Explicit user confirm after validation preview | Policy-based (e.g. auto-commit if validation + health + Git READY) |
| Pipeline | Connector pipeline | **Same** connector pipeline |
| Gates | Validation, health, Git | **Same** gates — no shortcuts |
| Safety | Snapshot before write | **Same** snapshot and manifest behavior |

Policy for unattended runs (auto-commit vs hold-for-review) is a product decision for a future campaign; the architecture requires that **gates run regardless**.

---

## Computer-Use and DIOS Verification

**Computer-assisted acquisition** (browser automation, desktop automation, assisted export retrieval) is a planned schedule/trigger pattern, not a separate ingestion path.

**Requirement:** Computer-use capabilities must always operate **behind DIOS verification**.

| Layer | Role |
|-------|------|
| Computer-use | Gather or trigger source material (export download, page capture, etc.) |
| DIOS | Verify identity, intent, policy, and safety before material enters KAE |
| KAE | Treat verified output as a normal connector source → full pipeline + gates |

DIOS is the trust boundary between autonomous computer action and the knowledge engine. KAE does not execute unverified computer-use output directly into the repository.

Flow (planned):

```
Computer-use action → DIOS verification → Verified source artifact
                                              ↓
                                    KAE Discover / Extract / …
```

Connector architecture remains **source-agnostic**: computer-assisted sources still implement `KnowledgeConnector`; only the discover/extract stages differ.

---

## What Is Not in Scope (Current Campaigns)

- Scheduled or unattended imports (this document describes future design only)
- New connectors beyond ChatGPT (Campaign 2+)
- DIOS implementation inside KAE (integration point documented; DIOS is external)
- Persisted schedule configuration (future)
- **AnV integration** — documented in [ANV_INTEGRATION.md](ANV_INTEGRATION.md); no API implemented

---

## Permanent Program: Natural Systems Intelligence Program (NSIP)

> **Status:** Architectural documentation — not implemented.

Natural systems are a **permanent knowledge domain** within the Axiom ecosystem. NSIP is a permanent KAE program component responsible for discovering, evaluating, cataloging, classifying, and acquiring high-quality natural-system knowledge to inspire engineering, AI, product design, organizational design, and systems architecture.

**Foundational doctrine:** Nature is a source of hypotheses. Evidence determines whether the hypothesis survives.

**Reference baseline:** INCOSE — *Natural Systems and the Systems Engineering Process: A Primer*.

NSIP feeds the standard KAE connector pipeline and mandatory gates. Knowledge model fields: `NaturalSystem.Domain`, `ObservedMechanism`, `TransferablePrinciple`, `ApplicableProducts`, `EvidenceStrength`, `ValidationStatus`, `PossibleHypotheses`.

See **[NSIP_PROGRAM.md](NSIP_PROGRAM.md)** and **[ROADMAP.md](ROADMAP.md)**. (Former NSIA spec: [NSIA_PROGRAM.md](NSIA_PROGRAM.md).)

---

## Future Integration: AnV

> **Status:** Documentation only — not implemented.

**AnV** decides whether acquisition is worthwhile. **KAE** executes acquisition.

Future workflow:

```
Acquire → Validate → Classify → Generate Source Record → Store in Axiom → Return acquisition metrics to AnV
```

AnV may request acquisition from web sources, PDFs, GitHub, YouTube, research papers, government publications, regulatory sites, and future connectors. KAE returns metrics including **cost**, **time**, **knowledge gained**, **saturation improvement**, **confidence**, and **reuse potential**.

See **[ANV_INTEGRATION.md](ANV_INTEGRATION.md)**.

---

## Related Documents

| Document | Contents |
|----------|----------|
| [README.md](README.md) | Docs index and quick reference |
| [ROADMAP.md](ROADMAP.md) | KAE program roadmap |
| [ANV_INTEGRATION.md](ANV_INTEGRATION.md) | AnV decision layer + KAE execution + metrics |
| [NSIP_PROGRAM.md](NSIP_PROGRAM.md) | Natural Systems Intelligence Program (permanent) |
| [NSIA_PROGRAM.md](NSIA_PROGRAM.md) | Superseded NSIA name (redirect) |
| [RC_AUDIT.md](RC_AUDIT.md) | Campaign 1.1 release candidate audit |
| [../README.md](../README.md) | Repository root quick start |

---

*KAE architecture — connector-driven, gate-enforced, source-agnostic. Scheduled acquisition reuses this foundation without redesign.*
