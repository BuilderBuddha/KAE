import type {
  ConnectorChangeDetection,
  ConnectorSyncContext,
  FileReference,
  ParsedDocument,
} from '@scooper/core';
import { BaseConnector } from './base.js';
import { fetchGitHubRepository, type GitHubItemPayload } from './github-fetch.js';
import { buildGitHubDocument } from './github-markdown.js';

function mockItemsFromSettings(settings: Record<string, unknown>): GitHubItemPayload[] {
  const mockItems = settings.mockItems;
  return Array.isArray(mockItems) ? (mockItems as GitHubItemPayload[]) : [];
}

function changeKeysFromContext(context: ConnectorSyncContext): Set<string> | null {
  const keys = context.config.settings.__changeKeys;
  return Array.isArray(keys) ? new Set(keys.map(String)) : null;
}

/** GitHub connector — repository, README, issues, PRs, commits, and releases. */
export class GitHubConnector extends BaseConnector {
  readonly id = 'github';
  readonly name = 'GitHub Connector';
  readonly description =
    'Acquire repository README, issues, pull requests, commits, and releases from GitHub.';
  readonly supportedExtensions = [] as const;
  readonly capabilities = {
    implementationStatus: 'full' as const,
    supportsScheduledSync: true,
    supportsOAuth: false,
    supportsApiKey: true,
    supportsFilePicker: false,
    supportsUrlInput: true,
    supportsFolderPicker: false,
    acquisitionModes: ['repository'] as const,
  };

  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: false,
      connected: false,
      scheduledSyncEnabled: false,
      settings: {
        repository: '',
        includeIssues: true,
        includePullRequests: true,
        includeCommits: true,
        includeReleases: true,
      },
    };
  }

  async discover(source: FileReference) {
    return {
      connectorId: this.id,
      source,
      format: 'github',
      metadata: { repository: source.path },
    };
  }

  async extract(_discovered: import('@scooper/core').DiscoveredSource): Promise<import('@scooper/core').ExtractedContent> {
    throw new Error('GitHub connector uses syncInternal.');
  }

  async normalize(_extracted: import('@scooper/core').ExtractedContent): Promise<import('@scooper/core').NormalizedDocument[]> {
    throw new Error('GitHub connector uses syncInternal.');
  }

  async syncInternal(
    _source: FileReference | null,
    context: ConnectorSyncContext,
  ): Promise<ParsedDocument[]> {
    const repository = String(context.config.settings.repository ?? '').trim();
    if (!repository) {
      throw new Error('GitHub connector requires owner/repo in settings.');
    }

    const changedKeys = changeKeysFromContext(context);
    const mockItems = mockItemsFromSettings(context.config.settings);
    if (mockItems.length > 0) {
      return mockItems
        .filter((item) => !changedKeys || changedKeys.has(`github:${item.id}`))
        .map((item) => buildGitHubDocument(repository, item));
    }

    const token = String(context.config.settings.apiKey ?? '').trim();
    const payload = await fetchGitHubRepository(repository, {
      token: token || undefined,
      includeIssues: Boolean(context.config.settings.includeIssues ?? true),
      includePullRequests: Boolean(context.config.settings.includePullRequests ?? true),
      includeCommits: Boolean(context.config.settings.includeCommits ?? true),
      includeReleases: Boolean(context.config.settings.includeReleases ?? true),
      log: context.log,
    });

    return payload.items
      .filter((item) => !changedKeys || changedKeys.has(`github:${item.id}`))
      .map((item) => buildGitHubDocument(repository, item));
  }

  async detectChanges(context: ConnectorSyncContext): Promise<ConnectorChangeDetection> {
    const checkedAt = new Date().toISOString();
    const repository = String(context.config.settings.repository ?? '').trim();
    if (!repository) {
      throw new Error('GitHub connector requires owner/repo in settings.');
    }

    const mockItems = mockItemsFromSettings(context.config.settings);
    if (mockItems.length > 0) {
      const keys = mockItems.map((item) => `github:${item.id}`);
      const cursor = mockItems
        .map((item) => `${item.id}:${item.updatedAt ?? item.title}`)
        .join('|');
      return {
        connectorId: this.id,
        checkedAt,
        cursor,
        changeKeys: keys,
        summary: `Checked ${mockItems.length} mock GitHub item(s)`,
      };
    }

    const token = String(context.config.settings.apiKey ?? '').trim();
    const payload = await fetchGitHubRepository(repository, {
      token: token || undefined,
      includeIssues: Boolean(context.config.settings.includeIssues ?? true),
      includePullRequests: Boolean(context.config.settings.includePullRequests ?? true),
      includeCommits: Boolean(context.config.settings.includeCommits ?? true),
      includeReleases: Boolean(context.config.settings.includeReleases ?? true),
      log: context.log,
    });
    const keys = payload.items.map((item) => `github:${item.id}`);
    const cursor = payload.items
      .map((item) => `${item.id}:${item.updatedAt ?? item.title}`)
      .join('|');
    return {
      connectorId: this.id,
      checkedAt,
      cursor,
      changeKeys: keys,
      summary: `Checked ${payload.items.length} GitHub item(s)`,
    };
  }
}

export const githubConnector = new GitHubConnector();
