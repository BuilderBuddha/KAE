# KAE — Knowledge Acquisition Engine

KAE is the universal Knowledge Acquisition Engine for the Axiom ecosystem. It acquires trusted knowledge from external sources, validates imports before any repository writes, generates provenance, and ingests structured knowledge into the [Axiom Knowledge Repository](C:\Users\alber\Axiom-Knowledge).

> **Note:** The workspace folder may still be named `Scooper` during migration. Application branding, UI, and documentation use **KAE**.

## Quick Start

```bash
npm install
npm run dev
```

## Features (Campaign 1)

- **Connector pipeline** — standardized stages every future connector plugs into
- **ChatGPT connector** — reference production implementation
- **Validation gate** — full dry-run preview with errors and warnings before import
- **Repository safety** — timestamped snapshots and session manifests before writes
- **Repository health check** — integrity validation and Git readiness
- **Repository explorer** — browse sources, sessions, registries, and reports
- **Import dashboard** — repository status, counts, and import history
- **Knowledge search** — full-text search across imported markdown

## Monorepo Structure

See [docs/README.md](docs/README.md) for package layout and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.

## Roadmap (documentation only)

See **[docs/ROADMAP.md](docs/ROADMAP.md)** for the full program timeline.

| Program | Summary | Doc |
|---------|---------|-----|
| **Scheduled acquisition** | Daily/weekly imports, sync, DIOS-gated computer-use | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **NSIP** | Permanent natural-systems intelligence domain for Axiom ecosystem | [NSIP_PROGRAM.md](docs/NSIP_PROGRAM.md) |
| **AnV** | Acquisition prioritization; KAE executes and returns metrics | [ANV_INTEGRATION.md](docs/ANV_INTEGRATION.md) |

All future programs use the same connector pipeline and mandatory gates. **No AnV API or additional connectors implemented.**

## License

Private — Axiom ecosystem internal tool.
