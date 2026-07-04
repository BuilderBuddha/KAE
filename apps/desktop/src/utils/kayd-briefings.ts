import type {
  ConnectorStatus,
  ExecutiveBriefing,
  ExecutiveContinuity,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { PRIMARY_KNOWLEDGE_SOURCES } from './import-source-display';

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

/** Executive awareness cards as spoken briefing lines — avoid duplicating inline briefing panel. */
export function executiveBriefingLines(briefing: ExecutiveBriefing | null | undefined): string[] {
  if (!briefing?.cards.length) return [];
  return briefing.cards
    .filter((card) => !card.isPlaceholder)
    .map((card) => {
      const summary = card.summary.trim();
      return summary ? `${card.title}. ${summary}` : card.title;
    });
}

/** KayD home — greeting and high-level summary; detail lives in executive briefing panel. */
export function buildKaydHomeBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  _stats: RepositoryStats | null,
  _gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);

  const summary = homeSummaryLine(health, connectors);
  if (summary) messages.push(summary);

  messages.push('Supporting awareness follows — ask me anything in the meantime.');
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
