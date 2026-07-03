import type {
  ConnectorStatus,
  ExecutiveContinuity,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { PRIMARY_KNOWLEDGE_SOURCES } from './import-source-display';

function formatNameList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

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

function dashboardBriefingBody(
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages: string[] = [];

  messages.push("I reviewed today's knowledge activity before you arrived.");

  if (health) {
    if (health.statusLevel === 'healthy') {
      messages.push('Repository health remains excellent.');
    } else if (health.statusLevel === 'attention') {
      const detail = health.statusSubline?.trim();
      messages.push(detail ? `A few items need attention. ${detail}` : 'A few items need attention.');
    } else {
      const detail = health.statusSubline?.trim();
      messages.push(detail ? `Repository health needs attention. ${detail}` : 'Repository health needs attention.');
    }
  }

  if (stats) {
    const sessions = stats.sessionCount ?? 0;
    if (sessions > 0) {
      messages.push(
        `${sessions} executive session${sessions === 1 ? '' : 's'} ${sessions === 1 ? 'has' : 'have'} been indexed.`,
      );
    }
    const sources = stats.sourceCount ?? 0;
    if (sources > 0) {
      messages.push(`${sources} knowledge source${sources === 1 ? '' : 's'} are currently available.`);
    }
  }

  if (gitReadiness?.ready) {
    messages.push('Git is ready.');
    if (health?.gitDirty) {
      messages.push('There are uncommitted changes whenever you want a checkpoint.');
    }
  } else if (gitReadiness) {
    messages.push("Git isn't fully ready yet. I left the details below.");
  }

  const stale = staleConnectorCount(connectors);
  if (stale > 0) {
    messages.push(
      stale === 1
        ? 'One source is waiting to synchronize.'
        : `${stale} sources are waiting to synchronize.`,
    );
  }

  messages.push(
    stale > 0 || (stats?.sessionCount ?? 0) > 0
      ? "Would you like me to walk you through today's changes?"
      : 'What would you like to work on today?',
  );

  return messages;
}

/** KayD home — greeting plus full repository briefing. */
export function buildKaydHomeBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);
  messages.push(...dashboardBriefingBody(health, stats, gitReadiness, connectors));
  return messages;
}

/** Dashboard workspace — tab-specific briefing only (no greeting). */
export function buildKaydDashboardBriefing(
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages = ['Here is your repository dashboard.'];
  const body = dashboardBriefingBody(health, stats, gitReadiness, connectors);
  messages.push(...body.slice(1));
  return messages;
}

/** Knowledge Sources workspace briefing. */
export function buildKaydImportBriefing(connectors?: ConnectorStatus[]): string[] {
  const connected = connectedSourceLabels(connectors ?? []);

  if (connected.length === 0) {
    return [
      'I connect knowledge sources to your repository.',
      'Choose a source below, or tell me what you would like to bring in.',
      'What would you like to connect first?',
    ];
  }

  if (connected.length === 1) {
    return [
      `You're connected to ${connected[0]}.`,
      'You can manage it below, or tell me if you want to add another source.',
      'What would you like to do next?',
    ];
  }

  return [
    `You have ${connected.length} sources connected: ${formatNameList(connected)}.`,
    'I can help you sync, configure, or add another source.',
    'Which source should we work on?',
  ];
}

/** Repository explorer briefing. */
export function buildKaydExplorerBriefing(fileCount: number, chatGptCount: number): string[] {
  const messages: string[] = ['Your repository is structured and ready to browse.'];
  if (chatGptCount > 0) {
    messages.push(`${chatGptCount} ChatGPT conversation${chatGptCount === 1 ? '' : 's'} are indexed here.`);
  }
  if (fileCount > 0) {
    messages.push(`${fileCount} file${fileCount === 1 ? '' : 's'} are available across your knowledge tree.`);
  }
  messages.push('Ask me about a source, or select a file below.');
  return messages;
}

/** Search workspace briefing. */
export function buildKaydSearchBriefing(indexSummary: string | null): string[] {
  const messages: string[] = ['I can search across your evidence index.'];
  if (indexSummary) {
    messages.push(`The index currently covers ${indexSummary}.`);
  }
  messages.push('What would you like to find?');
  return messages;
}
