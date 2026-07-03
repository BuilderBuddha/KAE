export interface GitHubItemPayload {
  kind: 'readme' | 'wiki' | 'issue' | 'pull_request' | 'commit' | 'release';
  id: string;
  title: string;
  body: string;
  url: string;
  updatedAt?: string;
  metadata: Record<string, unknown>;
}

export interface GitHubRepositoryPayload {
  repository: string;
  description: string;
  defaultBranch: string;
  items: GitHubItemPayload[];
}

interface GitHubFetchOptions {
  token?: string;
  includeIssues: boolean;
  includePullRequests: boolean;
  includeCommits: boolean;
  includeReleases: boolean;
  log?: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void;
}

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'KAE-Connector/1.0',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }
  return response.json() as Promise<T>;
}

async function fetchReadmeFallback(owner: string, repo: string): Promise<string> {
  for (const branch of ['main', 'master']) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README`;
    const response = await fetch(url, { headers: { 'User-Agent': 'KAE-Connector/1.0' } });
    if (response.ok) {
      return response.text();
    }
  }
  throw new Error(`README not found for ${owner}/${repo}`);
}

export async function fetchGitHubRepository(
  repository: string,
  options: GitHubFetchOptions,
): Promise<GitHubRepositoryPayload> {
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository "${repository}". Use owner/repo format.`);
  }

  let repoMeta: {
    full_name: string;
    description: string | null;
    default_branch: string;
    html_url: string;
  };
  try {
    repoMeta = await ghFetch(`/repos/${owner}/${repo}`, options.token);
  } catch (err) {
    options.log?.('warn', `GitHub repo metadata unavailable, using fallback: ${String(err)}`);
    repoMeta = {
      full_name: `${owner}/${repo}`,
      description: '',
      default_branch: 'master',
      html_url: `https://github.com/${owner}/${repo}`,
    };
  }

  const items: GitHubItemPayload[] = [];

  try {
    const readme = await ghFetch<{ content: string; html_url: string }>(
      `/repos/${owner}/${repo}/readme`,
      options.token,
    );
    const decoded = Buffer.from(readme.content, 'base64').toString('utf8');
    items.push({
      kind: 'readme',
      id: `${repository}#readme`,
      title: `${repo} README`,
      body: decoded,
      url: readme.html_url,
      metadata: { repository },
    });
  } catch (err) {
    options.log?.('warn', `README API unavailable, trying raw fallback: ${String(err)}`);
    try {
      const decoded = await fetchReadmeFallback(owner, repo);
      items.push({
        kind: 'readme',
        id: `${repository}#readme`,
        title: `${repo} README`,
        body: decoded,
        url: `https://github.com/${owner}/${repo}#readme`,
        metadata: { repository },
      });
    } catch (fallbackErr) {
      options.log?.('warn', `README unavailable: ${String(fallbackErr)}`);
    }
  }

  if (options.includeIssues) {
    try {
      const issues = await ghFetch<
        Array<{ number: number; title: string; body: string | null; html_url: string; updated_at: string }>
      >(`/repos/${owner}/${repo}/issues?state=all&per_page=10`, options.token);
      for (const issue of issues) {
        if (issue.html_url.includes('/pull/')) continue;
        items.push({
          kind: 'issue',
          id: `${repository}#issue-${issue.number}`,
          title: `Issue #${issue.number}: ${issue.title}`,
          body: issue.body ?? '',
          url: issue.html_url,
          updatedAt: issue.updated_at,
          metadata: { number: issue.number },
        });
      }
    } catch (err) {
      options.log?.('warn', `Issues unavailable: ${String(err)}`);
    }
  }

  if (options.includePullRequests) {
    try {
      const pulls = await ghFetch<
        Array<{ number: number; title: string; body: string | null; html_url: string; updated_at: string }>
      >(`/repos/${owner}/${repo}/pulls?state=all&per_page=10`, options.token);
      for (const pr of pulls) {
        items.push({
          kind: 'pull_request',
          id: `${repository}#pr-${pr.number}`,
          title: `PR #${pr.number}: ${pr.title}`,
          body: pr.body ?? '',
          url: pr.html_url,
          updatedAt: pr.updated_at,
          metadata: { number: pr.number },
        });
      }
    } catch (err) {
      options.log?.('warn', `Pull requests unavailable: ${String(err)}`);
    }
  }

  if (options.includeCommits) {
    try {
      const commits = await ghFetch<
        Array<{ sha: string; commit: { message: string }; html_url: string }>
      >(`/repos/${owner}/${repo}/commits?per_page=10`, options.token);
      for (const commit of commits) {
        items.push({
          kind: 'commit',
          id: `${repository}#commit-${commit.sha.slice(0, 7)}`,
          title: `Commit ${commit.sha.slice(0, 7)}`,
          body: commit.commit.message,
          url: commit.html_url,
          metadata: { sha: commit.sha },
        });
      }
    } catch (err) {
      options.log?.('warn', `Commits unavailable: ${String(err)}`);
    }
  }

  if (options.includeReleases) {
    try {
      const releases = await ghFetch<
        Array<{ id: number; name: string | null; body: string | null; html_url: string; published_at: string }>
      >(`/repos/${owner}/${repo}/releases?per_page=10`, options.token);
      for (const release of releases) {
        items.push({
          kind: 'release',
          id: `${repository}#release-${release.id}`,
          title: release.name ?? `Release ${release.id}`,
          body: release.body ?? '',
          url: release.html_url,
          updatedAt: release.published_at,
          metadata: { releaseId: release.id },
        });
      }
    } catch (err) {
      options.log?.('warn', `Releases unavailable: ${String(err)}`);
    }
  }

  if (items.length === 0) {
    throw new Error(`No GitHub content acquired for ${repository}`);
  }

  return {
    repository: repoMeta.full_name,
    description: repoMeta.description ?? '',
    defaultBranch: repoMeta.default_branch,
    items,
  };
}
