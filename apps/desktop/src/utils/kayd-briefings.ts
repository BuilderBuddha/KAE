import type {
  ConnectorStatus,
  ExecutiveContinuity,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';

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

/** Dashboard briefing — short, calm, executive cadence. */
export function buildKaydDashboardBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages: string[] = [];

  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);

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
        ? "One source is waiting to synchronize."
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

/** Knowledge Sources workspace briefing. */
export function buildKaydImportBriefing(continuity: ExecutiveContinuity | null | undefined): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);
  messages.push('I connect knowledge sources to your repository.');
  messages.push('Choose a source below, or tell me what you would like to bring in.');
  messages.push('What would you like to connect first?');
  return messages;
}

/** Repository explorer briefing. */
export function buildKaydExplorerBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  fileCount: number,
  chatGptCount: number,
): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);
  messages.push('Your repository is structured and ready to browse.');
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
export function buildKaydSearchBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  indexSummary: string | null,
): string[] {
  const messages: string[] = [];
  const welcome = welcomeLine(continuity);
  if (welcome) messages.push(welcome);
  messages.push('I can search across your evidence index.');
  if (indexSummary) {
    messages.push(`The index currently covers ${indexSummary}.`);
  }
  messages.push('What would you like to find?');
  return messages;
}
