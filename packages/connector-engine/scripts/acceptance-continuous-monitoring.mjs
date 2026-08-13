import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ConnectorManager } from '@scooper/connector-engine';
import {
  answerKnowledgeQuestion,
} from '@scooper/repository-engine';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function withTempRepository(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kae-monitoring-'));
  try {
    return await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function youtubeVideo(videoId, title, marker) {
  return {
    videoId,
    title,
    description: marker,
    transcript: `Transcript for ${title}. ${marker}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishDate: '2026-07-03',
    duration: '1:00',
    channelTitle: 'KAE Mock Channel',
    captionsAvailable: true,
    captionStatus: 'acquired',
    hasTranscriptTimestamps: false,
    metadata: {
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      connectorId: 'youtube',
      captionStatus: 'acquired',
    },
  };
}

function githubItem(id, title, marker, updatedAt) {
  return {
    kind: 'readme',
    id,
    title,
    body: `Repository update: ${marker}`,
    url: `https://github.com/kae/mock#${id}`,
    updatedAt,
    metadata: { repository: 'kae/mock' },
  };
}

async function main() {
  const results = {
    monitoring: false,
    resume: false,
    changeDetection: false,
    autoAcquisition: false,
    postSyncRefresh: false,
    vigsyAwareness: false,
    eventLog: false,
  };

  await withTempRepository(async (repositoryPath) => {
    const youtubeMarker = `KAE_AUTO_YOUTUBE_${Date.now()}`;
    const githubMarker = `KAE_AUTO_GITHUB_${Date.now()}`;

    const youtubeBase = youtubeVideo('ytbase00001', 'Baseline YouTube Item', 'baseline youtube');
    const youtubeNew = youtubeVideo('ytnew000001', 'Continuous YouTube Delta', youtubeMarker);
    const youtubeUpdated = youtubeVideo('ytnew000001', 'Continuous YouTube Delta Updated', youtubeMarker);
    const githubBase = githubItem('kae/mock#readme', 'Baseline GitHub README', 'baseline github', '2026-07-03T10:00:00.000Z');
    const githubNew = githubItem('kae/mock#release-1', 'Continuous GitHub Release', githubMarker, '2026-07-03T10:05:00.000Z');

    const firstLaunch = new ConnectorManager();
    await firstLaunch.initialize(repositoryPath);
    await firstLaunch.connect('youtube', {
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
      settings: {
        targetUrl: 'https://www.youtube.com/channel/mock',
        mockVideos: [youtubeBase],
      },
    });
    await firstLaunch.connect('github', {
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
      settings: {
        repository: 'kae/mock',
        includeIssues: false,
        includePullRequests: false,
        includeCommits: false,
        includeReleases: false,
        mockItems: [githubBase],
      },
    });

    await firstLaunch.monitorConnector('youtube');
    await firstLaunch.monitorConnector('github');
    firstLaunch.stopMonitoring();
    results.monitoring = firstLaunch
      .getEvents()
      .some((event) => event.type === 'checked' && event.connectorId === 'youtube');

    const restarted = new ConnectorManager();
    await restarted.initialize(repositoryPath);
    const resumedStatuses = await restarted.getStatuses({ repositoryPath });
    results.resume = ['youtube', 'github'].every((connectorId) =>
      resumedStatuses.some(
        (status) => status.connectorId === connectorId && status.monitoring.active,
      ),
    );

    await restarted.updateConfig('youtube', {
      settings: {
        targetUrl: 'https://www.youtube.com/channel/mock',
        mockVideos: [youtubeBase, youtubeNew],
      },
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
    });
    await restarted.updateConfig('github', {
      settings: {
        repository: 'kae/mock',
        includeIssues: false,
        includePullRequests: false,
        includeCommits: false,
        includeReleases: false,
        mockItems: [githubBase, githubNew],
      },
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
    });

    const youtubeAuto = await restarted.monitorConnector('youtube');
    const githubAuto = await restarted.monitorConnector('github');
    results.changeDetection = restarted
      .getEvents()
      .some((event) => event.type === 'change_detected' && event.connectorId === 'youtube')
      && restarted
        .getEvents()
        .some((event) => event.type === 'change_detected' && event.connectorId === 'github');
    results.autoAcquisition = Boolean(
      youtubeAuto?.success
        && githubAuto?.success
        && youtubeAuto.documents.some((doc) => doc.content.includes(youtubeMarker))
        && githubAuto.documents.some((doc) => doc.content.includes(githubMarker)),
    );

    await restarted.updateConfig('youtube', {
      settings: {
        targetUrl: 'https://www.youtube.com/channel/mock',
        mockVideos: [youtubeBase, youtubeUpdated],
      },
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
    });
    await restarted.monitorConnector('youtube');

    results.postSyncRefresh = Boolean(
      youtubeAuto?.evidenceIndexBuiltAt
        && youtubeAuto?.relationshipIndexBuiltAt
        && youtubeAuto?.briefingGeneratedAt
        && githubAuto?.evidenceIndexBuiltAt
        && githubAuto?.relationshipIndexBuiltAt
        && githubAuto?.briefingGeneratedAt,
    );

    const answer = await answerKnowledgeQuestion(repositoryPath, youtubeMarker, { providerId: 'mock' });
    results.vigsyAwareness = answer.evidenceUsed.length > 0
      || `${answer.directAnswer}\n${answer.reasonedSummary}`.includes(youtubeMarker);

    await restarted.updateConfig('github', {
      settings: { repository: '', mockItems: [] },
      scheduledSyncEnabled: true,
      scheduleIntervalMinutes: 60,
    });
    await restarted.monitorConnector('github');

    const eventTypes = new Set(restarted.getEvents().map((event) => event.type));
    results.eventLog = [
      'checked',
      'change_detected',
      'acquired',
      'skipped_duplicate',
      'failed',
      'awareness_refreshed',
    ].every((type) => eventTypes.has(type));

    restarted.stopMonitoring();
  });

  console.log('\n=== Continuous Acquisition Acceptance ===');
  console.log(`Continuous monitoring: ${results.monitoring ? 'PASS' : 'FAIL'}`);
  console.log(`Resume on launch: ${results.resume ? 'PASS' : 'FAIL'}`);
  console.log(`Change detection: ${results.changeDetection ? 'PASS' : 'FAIL'}`);
  console.log(`Auto-acquisition: ${results.autoAcquisition ? 'PASS' : 'FAIL'}`);
  console.log(`Post-sync refresh: ${results.postSyncRefresh ? 'PASS' : 'FAIL'}`);
  console.log(`Vigsy auto-awareness: ${results.vigsyAwareness ? 'PASS' : 'FAIL'}`);
  console.log(`Connector event log: ${results.eventLog ? 'PASS' : 'FAIL'}`);

  const failures = Object.entries(results)
    .filter(([, pass]) => !pass)
    .map(([name]) => name);
  if (failures.length > 0) {
    console.error(`Remaining blockers: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('Remaining blockers: none');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
