import fs from 'node:fs/promises';
import path from 'node:path';
import type { ConnectorFrameworkState } from '@scooper/core';

const STATE_VERSION = 1;
const STATE_DIR = '.kae-connectors';
const STATE_FILE = 'connectors.json';

function emptyState(): ConnectorFrameworkState {
  return {
    version: STATE_VERSION,
    connectors: {},
    syncHistory: [],
    schedules: [],
    totals: {},
    monitoring: {},
    events: [],
  };
}

export async function loadConnectorState(repositoryPath: string): Promise<ConnectorFrameworkState> {
  const filePath = path.join(repositoryPath, STATE_DIR, STATE_FILE);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as ConnectorFrameworkState;
    return {
      ...emptyState(),
      ...parsed,
      version: STATE_VERSION,
    };
  } catch {
    return emptyState();
  }
}

export async function saveConnectorState(
  repositoryPath: string,
  state: ConnectorFrameworkState,
): Promise<string> {
  const dir = path.join(repositoryPath, STATE_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, STATE_FILE);
  await fs.writeFile(filePath, JSON.stringify({ ...state, version: STATE_VERSION }, null, 2), 'utf8');
  return filePath;
}
