import type {
  ConnectorStatus,
  ExecutiveBriefing,
  ExecutiveContinuity,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { PRIMARY_KNOWLEDGE_SOURCES, type ImportSourceDisplay } from './import-source-display';

/** Vigsy-style status subtitles shown during briefing thinking pulse. */
export const KAYD_BRIEFING_STATUS = {
  home: 'Reviewing your repository',
  dashboard: 'Reviewing workspace health',
  import: 'Reviewing knowledge sources',
  connectors: 'Reviewing connector health',
  explorer: 'Reviewing repository structure',
  search: 'Reviewing search index',
} as const;

function connectedSourceLabels(connectors: ConnectorStatus[]): string[] {
  const byId = new Map(connectors.map((status) => [status.connectorId, status]));
  return PRIMARY_KNOWLEDGE_SOURCES.filter((source) => {
    if (source.uiOnly) return false;
    const status = byId.get(source.id);
    return status?.config.connected && status.implementationStatus === 'full';
  }).map((source) => source.label);
}

function welcomeLine(continuity: ExecutiveContinuity | null | undefined): string | null {
  if (!continuity?.welcomeMessage) return null;
  const match = continuity.welcomeMessage.match(/^Welcome back[^.]*\./);
  return match?.[0] ?? null;
}

function staleConnectorCount(connectors: ConnectorStatus[] | undefined): number {
  if (!connectors?.length) return 0;
  return connectors.filter(
    (c) =>
      c.config.connected &&
      c.implementationStatus === 'full' &&
      !c.monitoring.lastSuccessfulAutoSyncAt &&
      !c.lastSyncAt,
  ).length;
}

function homeSummaryLine(
  health: RepositoryHealthReport | null,
  connectors?: ConnectorStatus[],
): string | null {
  if (health?.statusLevel === 'healthy') {
    return 'Repository health looks good.';
  }
  if (health?.statusLevel === 'attention') {
    const detail = health.statusSubline?.trim();
    return detail ? `A few items need attention — ${detail}` : 'A few items need attention.';
  }
  if (health?.statusLevel === 'critical') {
    const detail = health.statusSubline?.trim();
    return detail ? `Repository health needs attention — ${detail}` : 'Repository health needs attention.';
  }
  const stale = staleConnectorCount(connectors);
  if (stale > 0) {
    return stale === 1 ? 'One source is waiting to synchronize.' : `${stale} sources are waiting to synchronize.`;
  }
  return null;
}

/** Executive awareness cards as spoken briefing lines. */
export function executiveBriefingLines(briefing: ExecutiveBriefing | null | undefined): string[] {
  if (!briefing?.cards.length) return [];
  return briefing.cards
    .filter((card) => !card.isPlaceholder)
    .map((card) => {
      const summary = card.summary.trim();
      return summary ? `${card.title}: ${summary}` : card.title;
    });
}

/** KayD home — greeting, summary, and awareness cards in the opener text flow. */
export function buildKaydHomeBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  _stats: RepositoryStats | null,
  _gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
  executiveBriefing?: ExecutiveBriefing | null,
): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);

  const summary = homeSummaryLine(health, connectors);
  if (summary) messages.push(summary);

  const cardLines = executiveBriefingLines(executiveBriefing);
  if (cardLines.length > 0) {
    messages.push(...cardLines);
  }

  messages.push('What would you like to work on today?');
  return messages;
}

/** Dashboard workspace — one concise intro line. */
export function buildKaydDashboardBriefing(
  health: RepositoryHealthReport | null,
  _stats: RepositoryStats | null,
  _gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const summary = homeSummaryLine(health, connectors);
  if (summary) return [summary];
  return ['Here is your repository dashboard.'];
}

/** Knowledge Sources workspace briefing. */
export function buildKaydImportBriefing(connectors?: ConnectorStatus[]): string[] {
  const connected = connectedSourceLabels(connectors ?? []);

  if (connected.length === 0) {
    return ['Pick a source below — I can walk you through it.'];
  }

  if (connected.length === 1) {
    return [`${connected[0]} is connected — manage it below or add another source.`];
  }

  return [
    `${connected.length} sources are connected — select one below to sync or configure.`,
  ];
}

/** Connector management workspace briefing. */
export function buildKaydConnectorsBriefing(_connectorCount: number, _connectedCount: number): string[] {
  return ['Review connector health, sync status, and monitoring.'];
}

/** Repository explorer briefing. */
export function buildKaydExplorerBriefing(_fileCount: number, _chatGptCount: number): string[] {
  return ['Select a file below, or ask me what changed.'];
}

/** Search workspace briefing. */
export function buildKaydSearchBriefing(_indexSummary: string | null): string[] {
  return ['Search runs across your full evidence index — what should I find?'];
}

/** Dashboard walkthrough — alive guided lines after the opener. */
export function buildKaydDashboardWalkthrough(
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const lines: string[] = [];
  const summary = homeSummaryLine(health, connectors);
  if (summary) lines.push(summary);
  if (stats) {
    lines.push(
      `${stats.sourceCount} sources and ${stats.sessionCount} executive sessions are indexed in your repository.`,
    );
  }
  if (gitReadiness) {
    lines.push(`Git readiness is ${gitReadiness.ready ? 'good' : 'not ready'} — ${gitReadiness.status}.`);
  }
  lines.push('Use repair and health tools below, or ask me what needs attention first.');
  return lines;
}

function formatConnectorTime(value?: string): string {
  if (!value) return 'not yet';
  return new Date(value).toLocaleString();
}

/** Step-by-step KayD guidance when a knowledge source is selected. */
export function buildKaydConnectorWalkthrough(
  source: ImportSourceDisplay,
  status?: ConnectorStatus,
): string[] {
  if (source.uiOnly) {
    return [
      `${source.label} is on the roadmap — not connectable in this build yet.`,
      'When it ships, I will guide you through export, connect, and first sync right here.',
    ];
  }

  if (!status) {
    return [`Loading ${source.label} — one moment while I check connector status.`];
  }

  const sourceId = source.id;
  const sourceLabel = source.label;

  if (status.implementationStatus === 'stub') {
    return [
      `${sourceLabel} is on the roadmap — not connectable in this build yet.`,
      'I will walk you through setup here once the connector is ready.',
    ];
  }

  const connected = status.config.connected;
  const health = status.health.status;

  switch (sourceId) {
    case 'chatgpt-export-zip':
      if (connected) {
        return [
          `${sourceLabel} is connected. Health: ${health}.`,
          'To sync new conversations: click Sync now below and choose your export ZIP.',
          'Exports come from ChatGPT → Settings → Data Controls → Export data.',
          `Last sync: ${formatConnectorTime(status.lastSyncAt)} · ${status.itemsImported} items imported.`,
        ];
      }
      return [
        `Let's connect ${sourceLabel}.`,
        'Step 1 — Export from ChatGPT: Settings → Data Controls → Export data (you will get a ZIP by email).',
        'Step 2 — Click Connect below, then drop or browse to your export ZIP in the panel underneath.',
        'Step 3 — After validation passes, confirm import. I will index conversations for KayD search.',
      ];
    case 'github':
      if (connected) {
        return [
          `${sourceLabel} is connected (${String(status.config.settings.repository ?? 'repo not set')}).`,
          'Use Sync now to pull markdown and repository updates into your knowledge base.',
          `Monitoring: ${status.monitoring.active ? 'active' : 'inactive'} · Health: ${health}.`,
        ];
      }
      return [
        `Let's connect ${sourceLabel}.`,
        'Step 1 — Click Configure and enter owner/repo (e.g. octocat/Hello-World).',
        'Step 2 — Add a GitHub token if the repo is private (optional for public repos).',
        'Step 3 — Click Connect, then Sync now to import repository knowledge.',
      ];
    case 'youtube':
      if (connected) {
        return [
          `${sourceLabel} is connected. Health: ${health}.`,
          'Use Sync now after setting a video, playlist, or channel URL in Configure.',
          `Last sync: ${formatConnectorTime(status.lastSyncAt)} · ${status.itemsImported} items imported.`,
        ];
      }
      return [
        `Let's connect ${sourceLabel}.`,
        'Step 1 — Click Configure and paste a YouTube video, playlist, or channel URL.',
        'Step 2 — Set max videos (default 5) to control import size.',
        'Step 3 — Click Connect, then Sync now to pull transcripts into the repository.',
      ];
    case 'local-folder':
      if (connected) {
        return [
          `${sourceLabel} is connected. Health: ${health}.`,
          'Use Sync now to pick a folder and import supported files.',
          `Last sync: ${formatConnectorTime(status.lastSyncAt)} · ${status.itemsImported} items imported.`,
        ];
      }
      return [
        `Let's connect ${sourceLabel}.`,
        'Step 1 — Click Configure and enter the folder path, or leave blank to pick at sync time.',
        'Step 2 — Click Connect to enable the connector.',
        'Step 3 — Click Sync now and choose the folder to import.',
      ];
    case 'cursor':
    case 'claude':
      return [
        `${sourceLabel} connector is not available in this build yet.`,
        'When it ships, I will guide you through export format, connect, and first sync here.',
      ];
    default:
      if (connected) {
        return [
          `${sourceLabel} is connected. Health: ${health}.`,
          'Use the actions below to configure, sync, or disconnect.',
        ];
      }
      return [
        `Select ${sourceLabel} below.`,
        'Click Connect to enable, Configure for settings, then Sync now to import.',
      ];
  }
}
