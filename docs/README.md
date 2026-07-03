# KAE Documentation

**KAE** (Knowledge Acquisition Engine, pronounced "Kay") is the universal knowledge acquisition system for the Axiom ecosystem. It acquires trusted knowledge from any source, validates it, generates provenance, and ingests it into the Axiom Knowledge Repository.

## Architecture

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full system design, connector pipeline, mandatory acquisition gates, and **planned scheduled knowledge acquisition** (documentation only — not implemented).

## Campaign 1 — Production Foundation

Current focus: connector-driven architecture with ChatGPT as the reference connector.

### Connector Pipeline

```
Discover Source → Extract → Normalize → Validate → Classify
  → Generate Provenance → Generate Source Record → Emit Import Package
```

Every acquisition — present or future, manual or scheduled — must pass:

**Validation → Classification → Provenance → Repository Health → Git Readiness**

### Repository Target

Default Axiom Knowledge Repository path:

```
C:\Users\alber\Axiom-Knowledge
```

## Package Layout

```
apps/desktop              Electron + React UI
packages/core             Types, connector contracts, branding
packages/connector-engine Standard pipeline orchestrator
packages/repository-engine Health checks, snapshots, search, browse
packages/importers        Connectors (ChatGPT reference implementation)
packages/exporters        Axiom repository writer
packages/capability-engine Classification
packages/parser           Document parsing abstractions
packages/source-engine    Source resolution
packages/graph            Knowledge graph structures
```

## Connectors

| Connector | Status |
|-----------|--------|
| ChatGPT Export ZIP | Production reference |
| YouTube, PDF, GitHub, etc. | Campaign 2+ — same pipeline, new connector implementations |

Connector architecture remains **source-agnostic**. Computer-assisted acquisition (future) operates behind **DIOS verification** before entering the pipeline — see [ARCHITECTURE.md](ARCHITECTURE.md).

## Roadmap

See **[ROADMAP.md](ROADMAP.md)** for the full KAE program timeline (Campaign 2 connectors, scheduled acquisition, NSIP, AnV).

**Natural Systems Intelligence Program (NSIP)** — permanent program to discover, evaluate, catalog, and acquire natural-system knowledge for the Axiom ecosystem. Documentation only. See **[NSIP_PROGRAM.md](NSIP_PROGRAM.md)**.

**AnV integration** — AnV decides whether acquisition is worthwhile; KAE executes and returns metrics. Documentation only. See **[ANV_INTEGRATION.md](ANV_INTEGRATION.md)**.

## Documents

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, gates, scheduled acquisition (future) |
| [ROADMAP.md](ROADMAP.md) | KAE program roadmap |
| [NSIP_PROGRAM.md](NSIP_PROGRAM.md) | Natural Systems Intelligence Program (NSIP) |
| [ANV_INTEGRATION.md](ANV_INTEGRATION.md) | AnV decision layer + KAE metrics feedback |
| [NSIA_PROGRAM.md](NSIA_PROGRAM.md) | Superseded NSIA name (redirect) |
| [RC_AUDIT.md](RC_AUDIT.md) | Campaign 1.1 release candidate audit |

## Commands

```bash
npm install
npm run dev          # start KAE desktop app
npm run build        # full build
node scripts/test-validate.mjs   # validate-only, no repository writes
```
