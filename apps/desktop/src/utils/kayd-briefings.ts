import type {
  ConnectorStatus,
  ExecutiveBriefing,
  ExecutiveContinuity,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { PRIMARY_KNOWLEDGE_SOURCES, type ImportSourceDisplay } from './import-source-display';
import {
  executiveSessionInvite,
  formatAttentionBrief,
  pushUniqueLine,
} from './executive-brief-flow';

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

/** Tasks needing executive attention — bullet list for the briefing. */
function buildWhatNeedsAttention(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  executiveBriefing?: ExecutiveBriefing | null,
  connectors?: ConnectorStatus[],
): string {
  const tasks: string[] = [];

  if (continuity?.session?.currentBlockers?.length) {
    for (const blocker of continuity.session.currentBlockers.slice(0, 3)) {
      const line = blocker.detail?.trim() || blocker.label;
      if (line) tasks.push(line);
    }
  }

  if (continuity?.session?.unfinishedWork?.length) {
    for (const item of continuity.session.unfinishedWork.slice(0, 3)) {
      if (item.trim()) tasks.push(item.trim());
    }
  }

  if (health?.statusLevel === 'attention' || health?.statusLevel === 'critical') {
    const detail = health.statusSubline?.trim();
    tasks.push(detail ?? 'Repository health needs a look.');
  }

  const stale = staleConnectorCount(connectors);
  if (stale > 0) {
    tasks.push(stale === 1 ? 'One knowledge source is waiting to sync.' : `${stale} knowledge sources are waiting to sync.`);
  }

  if (executiveBriefing?.cards.length) {
    for (const card of executiveBriefing.cards) {
      if (card.isPlaceholder) continue;
      if (
        card.category === 'recent_blocker' ||
        card.category === 'repository_health' ||
        card.category === 'suggested_next_action'
      ) {
        const line = card.summary.trim() ? `${card.title}: ${card.summary.trim()}` : card.title;
        if (!tasks.some((t) => t.includes(card.title))) tasks.push(line);
      }
    }
  }

  if (tasks.length === 0) {
    return '• Nothing urgent is flagged right now.';
  }

  return tasks.map((task) => `• ${task}`).join('\n');
}

function buildWhereWeAre(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
): string {
  if (continuity?.session?.currentCampaign) {
    const objective = continuity.session.currentObjective?.trim();
    return objective
      ? `We're in ${continuity.session.currentCampaign}, focused on ${objective}.`
      : `We're in ${continuity.session.currentCampaign}.`;
  }

  const welcome = welcomeLine(continuity);
  if (welcome) {
    return welcome.replace(/^Welcome back[,.]?\s*/i, 'Welcome back. ');
  }

  if (health?.statusLevel === 'healthy') {
    return 'Welcome back — the knowledge base is in good shape for a working session.';
  }

  return 'Welcome back — ready to pick up where we left off.';
}

function buildLastSessionLine(continuity: ExecutiveContinuity | null | undefined): string | null {
  const session = continuity?.session;
  if (!session) return null;
  const title = session.title?.trim();
  if (!title) return null;

  const accomplishment = session.currentAccomplishments?.[0];
  if (accomplishment) {
    const detail = accomplishment.detail?.trim() || accomplishment.label;
    return `Last time we worked on ${title} — ${detail}`;
  }

  if (continuity && continuity.daysSinceLastActivity > 0) {
    return `Last time we worked on ${title}, about ${continuity.daysSinceLastActivity} day(s) ago.`;
  }

  return `Last time we worked on ${title}.`;
}

function buildWhatsChanged(
  health: RepositoryHealthReport | null,
  connectors: ConnectorStatus[] | undefined,
  continuity: ExecutiveContinuity | null | undefined,
): string | null {
  const changes: string[] = [];

  const repoChange = continuity?.session?.currentRepositoryChanges?.[0];
  if (repoChange) {
    changes.push(repoChange.detail?.trim() || repoChange.label);
  }

  const importCard = continuity?.session?.currentAccomplishments?.find((item) =>
    /import|sync|connect/i.test(item.label),
  );
  if (importCard) {
    changes.push(importCard.detail?.trim() || importCard.label);
  }

  if (health?.statusLevel === 'healthy') {
    changes.push('Health has stayed steady.');
  } else if (health?.statusLevel === 'attention') {
    const detail = health.statusSubline?.trim();
    changes.push(detail ?? 'A couple of items shifted since we last met.');
  }

  const stale = staleConnectorCount(connectors);
  if (stale > 0) {
    changes.push(stale === 1 ? 'One source has not synced recently.' : `${stale} sources have not synced recently.`);
  }

  if (changes.length === 0) return 'Steady since we last met — nothing major shifted.';
  return changes[0];
}

/** KayD home — flowing executive brief (awareness cards render separately below). */
export function buildKaydHomeBriefing(
  continuity: ExecutiveContinuity | null | undefined,
  health: RepositoryHealthReport | null,
  _stats: RepositoryStats | null,
  _gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
  executiveBriefing?: ExecutiveBriefing | null,
): string[] {
  const messages: string[] = [];

  pushUniqueLine(messages, buildWhereWeAre(continuity, health));

  const lastSession = buildLastSessionLine(continuity);
  if (lastSession) pushUniqueLine(messages, lastSession);

  const changed = buildWhatsChanged(health, connectors, continuity);
  if (changed) {
    const line = changed.match(/^(steady|since|last|one|health)/i)
      ? changed
      : `Since we last met, ${changed.charAt(0).toLowerCase()}${changed.slice(1)}`;
    pushUniqueLine(messages, line);
  }

  const attention = formatAttentionBrief(
    buildWhatNeedsAttention(continuity, health, executiveBriefing, connectors),
  );
  if (attention) pushUniqueLine(messages, attention);

  const nextStep =
    continuity?.recommendedNextAction?.trim() ||
    continuity?.session?.recommendedNextAction?.trim() ||
    'tell me what you want to move forward today.';
  const nextLine = nextStep.match(/^i['']d|^tell me|^pick|^close|^decide/i)
    ? nextStep
    : `I'd start with ${nextStep.replace(/\.$/, '')}.`;
  pushUniqueLine(messages, nextLine);

  pushUniqueLine(messages, executiveSessionInvite('home'));
  return messages;
}

/** Dashboard workspace — health context, not a repeat of KayD home. */
export function buildKaydDashboardBriefing(
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
): string[] {
  const messages: string[] = [];

  if (health?.statusLevel === 'healthy') {
    pushUniqueLine(messages, 'This is your health desk — everything looks stable right now.');
  } else if (health?.statusLevel === 'attention' || health?.statusLevel === 'critical') {
    const detail = health.statusSubline?.trim();
    pushUniqueLine(
      messages,
      detail
        ? `Health desk — a few items need a decision: ${detail}`
        : 'Health desk — a few items need a decision before the next push.',
    );
  } else {
    pushUniqueLine(messages, 'This is your health desk — scan status, then tell me what to fix first.');
  }

  if (stats) {
    pushUniqueLine(
      messages,
      `${stats.sourceCount} sources and ${stats.sessionCount} executive sessions are in play.`,
    );
  }

  if (gitReadiness && !gitReadiness.ready) {
    pushUniqueLine(messages, `Git is not ready yet — ${gitReadiness.status}.`);
  }

  const stale = staleConnectorCount(connectors);
  if (stale > 0) {
    pushUniqueLine(
      messages,
      stale === 1 ? 'One connector still needs a sync.' : `${stale} connectors still need a sync.`,
    );
  }

  pushUniqueLine(messages, executiveSessionInvite('workspace'));
  return messages;
}

/** Knowledge Sources — connector-specific guidance, not KayD echo. */
export function buildKaydImportBriefing(connectors?: ConnectorStatus[]): string[] {
  const connected = connectedSourceLabels(connectors ?? []);
  const messages: string[] = [];

  if (connected.length === 0) {
    pushUniqueLine(messages, 'No sources are connected yet — pick one below and I will walk you through it.');
  } else if (connected.length === 1) {
    pushUniqueLine(
      messages,
      `${connected[0]} is live — sync or add another source from the panel below.`,
    );
  } else {
    pushUniqueLine(
      messages,
      `${connected.length} sources are live — choose one to sync, configure, or troubleshoot.`,
    );
  }

  pushUniqueLine(messages, executiveSessionInvite('workspace'));
  return messages;
}

/** Connector management — operational focus. */
export function buildKaydConnectorsBriefing(connectorCount: number, connectedCount: number): string[] {
  const messages: string[] = [];
  if (connectorCount === 0) {
    pushUniqueLine(messages, 'No connectors are configured yet.');
  } else {
    pushUniqueLine(
      messages,
      `${connectedCount} of ${connectorCount} connectors are connected — check sync health below.`,
    );
  }
  pushUniqueLine(messages, 'Flag any connector that looks stale and we will fix it.');
  return messages;
}

/** Repository explorer — file context, not investigation echo. */
export function buildKaydExplorerBriefing(fileCount: number, chatGptCount: number): string[] {
  const messages: string[] = [];
  if (fileCount > 0) {
    pushUniqueLine(
      messages,
      `${fileCount} files are in the tree${chatGptCount > 0 ? `, including ${chatGptCount} ChatGPT import(s)` : ''}.`,
    );
  } else {
    pushUniqueLine(messages, 'The repository tree is empty — import knowledge to populate it.');
  }
  pushUniqueLine(messages, 'Open a file below or ask me what changed since last session.');
  return messages;
}

/** Search workspace — index context unique to this screen. */
export function buildKaydSearchBriefing(indexSummary: string | null): string[] {
  const messages: string[] = [];
  if (indexSummary) {
    pushUniqueLine(messages, `${indexSummary} are indexed — tell me what to hunt for.`);
  } else {
    pushUniqueLine(messages, 'Search spans your full evidence index — tell me what to hunt for.');
  }
  pushUniqueLine(messages, 'I will keep the investigation thread while you scan hits below.');
  return messages;
}

/** Dashboard walkthrough — details beyond the opener, no repeated health line. */
export function buildKaydDashboardWalkthrough(
  health: RepositoryHealthReport | null,
  stats: RepositoryStats | null,
  gitReadiness: GitReadinessReport | null,
  connectors?: ConnectorStatus[],
  openerLines?: string[],
): string[] {
  const lines: string[] = [];
  const opener = openerLines ?? [];

  if (stats) {
    const line = `${stats.sourceCount} sources and ${stats.sessionCount} executive sessions are indexed.`;
    if (!opener.some((existing) => existing.includes(String(stats.sourceCount)))) {
      pushUniqueLine(lines, line);
    }
  }

  if (gitReadiness) {
    const line = `Git readiness is ${gitReadiness.ready ? 'good' : 'not ready'} — ${gitReadiness.status}.`;
    pushUniqueLine(lines, line);
  }

  const stale = staleConnectorCount(connectors);
  if (stale > 0 && health?.statusLevel !== 'attention') {
    pushUniqueLine(
      lines,
      stale === 1 ? 'One source is waiting to sync.' : `${stale} sources are waiting to sync.`,
    );
  }

  pushUniqueLine(lines, 'Use repair tools below, or ask me what to prioritize.');
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
