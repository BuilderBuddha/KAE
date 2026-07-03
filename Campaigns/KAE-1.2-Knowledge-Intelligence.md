# KAE Campaign 1.2 — Knowledge Intelligence

**Status:** Planning  
**Predecessor:** Campaign 1.1 — Release Candidate Hardening (`84cdc68`, tag `kae-rc-chatgpt-import-v1`)  
**Repository:** https://github.com/BuilderBuddha/KAE.git  
**Date:** 2026-07-02

---

## 1. Campaign name

**Campaign 1.2 — Knowledge Intelligence**

---

## 2. Objective

Make KAE able to **search, connect, summarize, and reason across imported knowledge with evidence drilldown**.

Campaign 1.1 delivered durable acquisition: validated ChatGPT import, repository repair, 70 conversation sources (KRC-0053–0122), executive sessions, attachment preservation, and Explorer rendering. Campaign 1.2 turns that corpus into **queryable, linkable, explainable intelligence** — every answer traceable to a source file, conversation turn, or attachment.

---

## 3. Scope

| Area | In scope |
|------|----------|
| **Search** | Natural-language and keyword search across sources, sessions, and ChatGPT transcripts |
| **Evidence** | Drilldown from search/summary results to exact source path, KRC ID, message, and attachment |
| **Relationships** | Extract and surface links between sources (shared topics, KRC refs, conversation IDs, products) |
| **Timelines** | Decision-relevant date ordering from conversation `createTime` / `updateTime` and message timestamps |
| **Synthesis** | Read-only executive session enrichment from existing corpus (no overwrite of Campaign 1.1 artifacts without explicit gate) |
| **Graph layer** | Implement `packages/graph` against imported repository content (in-memory index first) |
| **UI** | Extend existing Search screen and Explorer drilldown — no redesign |
| **Data** | Operate on Axiom Knowledge Repository files already written by KAE (Sources, ExecutiveSessions, Uploads) |

**Baseline corpus:** 70 ChatGPT import sources, executive sessions, `Uploads/chatgpt-import-*`, registries, import reports.

---

## 4. Non-scope

| Area | Out of scope |
|------|--------------|
| **VIGS** | No VIGS code or product changes |
| **Axiom architecture docs** | No edits to `AnV/`, `Axiom/` overview or capability-map files unless explicitly requested |
| **New connectors** | No PDF, web, YouTube, or NSIP live search (Campaign 2) |
| **Importer redesign** | No changes to ChatGPT ZIP pipeline except read-only helpers for indexing |
| **UI redesign** | No new shell, navigation model, or visual overhaul |
| **Autonomous agents** | No unsupervised write-back to repository from LLM synthesis |
| **External LLM dependency** | Phase 1–2 must work offline with local indexing; optional LLM assist is later phase only |
| **NSIP** | Natural-systems acquisition remains documentation-only per NSIP_PROGRAM |

---

## 5. Success criteria

1. **Search returns evidence** — A query for a known phrase from an imported ChatGPT conversation returns the correct KRC source with a snippet and one-click drilldown to Explorer preview.
2. **Conversation-aware** — Search can target user prompts vs assistant responses (filter or labeled hits).
3. **Attachment-aware** — Search or drilldown surfaces linked `Uploads/chatgpt-import-*` assets when a conversation references them.
4. **Connect** — At least one relationship type is visible (e.g. same `primaryCategory`, shared KRC product tags, or co-occurring terms) between two imported sources.
5. **Timeline** — User can view imported conversations sorted by decision-relevant date with message-level timestamps on drilldown.
6. **Synthesis (read-only)** — Executive session view or generated supplement summarizes a topic across ≥2 sources with citations (path + KRC ID).
7. **No regression** — Campaign 1.1 Explorer ChatGPT Import view, repair workflow, and import gates remain functional.
8. **Performance** — Full-text index build for 70-source corpus completes in &lt;30s on dev machine; search returns in &lt;2s.

---

## 6. Required capabilities

### 6.1 Natural-language search

- Accept plain-language queries (not only exact substring).
- Phase 1: tokenized keyword + phrase matching with scoring (title, heading, transcript, metadata).
- Phase 2+: optional semantic ranking behind feature flag.
- Return ranked results with confidence/score and result type.

### 6.2 Source search

- Search KRC source markdown under `Sources/**`.
- Index: title, description, categories, transcript, file references, conversation ID.
- Respect category folders (VIGS, Founder_OS, Axiom, etc.) as filters.

### 6.3 Conversation search

- Search within `## Transcript` sections: `### User` and `### Assistant` blocks.
- Return hit granularity: source file + message role + excerpt.
- Support filtering to ChatGPT import range (KRC-0053–0122) and future imports.

### 6.4 Attachment-aware search

- Index attachment references from source metadata and per-message `**File references:**` blocks.
- Resolve `file_*` hashes to `Uploads/chatgpt-import-*` paths where possible.
- Include attachment filename / ref in search hits; mark unresolved refs explicitly.

### 6.5 Evidence drilldown

- Every search result links to:
  - `relativePath` (source or session)
  - KRC ID and conversation title
  - Snippet with match offset
  - Optional: open in Explorer with ChatGPT structured preview
- No “answer without citation” in UI surfaces.

### 6.6 Knowledge graph relationship extraction

- Build on `packages/graph` (`KnowledgeNode`, `KnowledgeEdge`).
- Extract nodes from: KRC sources, categories, products (Applies To), recurring terms.
- Extract edges: `classified_as`, `references_product`, `shares_topic`, `same_conversation_thread` (future threading).
- Persist index as `.kae-index/` JSON alongside repository (read-only to Sources).

### 6.7 Decision timeline extraction

- Parse `Create Time`, `Update Time`, and per-message timestamps from ChatGPT sources.
- Produce ordered timeline events: `{ date, krcId, title, eventType, excerpt? }`.
- Surface in Search or dedicated timeline panel (minimal UI extension).

### 6.8 Executive session synthesis

- Read existing `ExecutiveSessions/**` markdown.
- Generate **supplemental** synthesis blocks (topic summary + cited source list) without overwriting Campaign 1.1 session files in Phase 1.
- Citations: `KRC-XXXX`, path, optional message excerpt.
- Gate: user-triggered, read-only preview before any write.

---

## 7. Ranked implementation phases

### Phase 1 — Evidence-first search (P0)

- Repository indexer: scan Sources + ExecutiveSessions + attachment refs.
- Enhanced search engine in `repository-engine` (replace linear scan for indexed repos).
- Search UI: result types, filters (source / session / ChatGPT import), drilldown to Explorer.
- **Deliverable:** Find any imported prompt/response by keyword with one-click evidence.

### Phase 2 — Conversation and attachment intelligence (P0)

- Message-level index (user vs assistant).
- Attachment ref index linked to Uploads paths.
- Unresolved attachment reporting in search metadata.
- **Deliverable:** Search “screenshot” or `file_*` ref returns conversation + asset link.

### Phase 3 — Relationship graph (P1)

- Implement `GraphBuilder.buildFromDocuments` for KRC corpus.
- Extract nodes/edges from classification metadata and recurring terms.
- Search UI: “related sources” on result detail.
- **Deliverable:** Graph with ≥100 nodes / ≥50 edges from 70-source import.

### Phase 4 — Decision timeline (P1)

- Timeline builder from source timestamps.
- Minimal timeline view (list by date desc) integrated with Search or Explorer filter.
- **Deliverable:** Newest decisions visible; matches ChatGPT Import sort order semantics.

### Phase 5 — Executive session synthesis (P2)

- Cross-source topic clustering (keyword / category based first).
- Read-only synthesis preview with citations.
- Optional write to `ExecutiveSessions/Synthesis/` subfolder with snapshot gate.
- **Deliverable:** Topic query returns multi-source summary with KRC citations.

### Phase 6 — Natural-language uplift (P2, optional)

- Query expansion (synonyms, stemming) without external API.
- Optional: local or configured LLM for reranking only — never sole evidence source.
- **Deliverable:** Improved recall on paraphrased queries with citation requirement unchanged.

---

## 8. First implementation slice

**Slice 1.2a — Indexed evidence search (Phase 1 only)**

| Component | Work |
|-----------|------|
| `packages/repository-engine/src/index/` | New module: build/load search index from repository markdown |
| `packages/repository-engine/src/search.ts` | Refactor `searchRepository` to use index when present; fallback to scan |
| Index schema | `{ krcId, path, category, title, roles: { user[], assistant[] }, attachmentRefs[], timestamps }` |
| IPC | `kae:build-search-index`, `kae:search-knowledge` (extends current search) |
| `SearchScreen.tsx` | Result type badges, “Open in Explorer”, ChatGPT import filter |
| Tests | Index 70 sources; query known prompt from KRC-0053; drilldown opens structured preview |

**Out of slice 1.2a:** graph edges, LLM synthesis, timeline UI, index writes to Sources.

**Estimated touch:** 4–6 files in `repository-engine`, 2 in `desktop`, 0 importer changes.

---

## 9. Acceptance tests

| # | Test | Pass condition |
|---|------|----------------|
| T1 | Index build | `npm run typecheck` + index builds for `Axiom-Knowledge` with 70 ChatGPT sources |
| T2 | Prompt search | Query text unique to KRC-0053 user prompt returns KRC-0053 as top hit |
| T3 | Response search | Query text unique to an assistant reply returns correct source with `assistant` label |
| T4 | Attachment search | Query `file_000000005b1c71f5` returns KRC-0058 with upload path |
| T5 | Evidence drilldown | Click result → Explorer opens source with ChatGPT structured preview |
| T6 | Session search | Query in executive session body returns session + source link |
| T7 | No import regression | ChatGPT Import (70) Explorer view unchanged |
| T8 | Performance | Index build &lt;30s; search &lt;2s on 70-source corpus |
| T9 | Unresolved attachment | Display-name-only ref shows reason, not silent failure |
| T10 | Repair + health | Repository health remains `ready` after index write to `.kae-index/` |

---

## 10. Risks and guardrails

| Risk | Mitigation |
|------|------------|
| **Hallucinated summaries** | Phase 1–4 are extractive only; synthesis (Phase 5) requires citations; no uncited answers in UI |
| **Index drift** | Rebuild index on import complete + manual “Refresh index” on Dashboard |
| **Large ZIP / memory** | Index stores excerpts and offsets, not full binary assets |
| **Overwrite executive sessions** | Synthesis writes only to new subfolder or preview-only until gated |
| **Scope creep into Campaign 2** | No new connectors; intelligence operates on existing repository files only |
| **VIGS / Axiom doc pollution** | Indexer skips or tags architecture docs separately; default search filters to `sources` + ChatGPT import |
| **Attachment resolution gaps** | ~50% of refs are display-name-only; document as known limitation; do not fake links |
| **Performance on growth** | Index file in `.kae-index/`; incremental update is Phase 2+ |

**Guardrails (hard rules):**

1. Every user-visible answer must link to `relativePath` + KRC ID or session path.
2. No repository writes without snapshot/manifest gate (same as Campaign 1.1).
3. No changes to `packages/importers` ChatGPT pipeline except read-only parsers shared with indexer.
4. No UI redesign — extend Search and Explorer only.
5. Campaign 1.2 PRs must not touch VIGS or Axiom architecture markdown.

---

## Recommended next step

Implement **Slice 1.2a — Indexed evidence search**: add `.kae-index/` builder, upgrade `searchRepository`, wire Search screen drilldown to Explorer ChatGPT preview, and run acceptance tests T1–T5.

---

*Campaign 1.2 — Knowledge Intelligence. Evidence first; connect and synthesize second.*
