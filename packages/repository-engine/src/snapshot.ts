import fs from 'node:fs/promises';
import path from 'node:path';
import type { ImportSessionManifest } from '@scooper/core';

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(srcPath, destPath);
    else await fs.copyFile(srcPath, destPath);
  }
}

/** Creates a timestamped snapshot of key repository directories before import. */
export async function createRepositorySnapshot(
  repositoryPath: string,
  sessionId: string,
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotRoot = path.join(repositoryPath, '.kae-snapshots', `${timestamp}_${sessionId}`);
  await fs.mkdir(snapshotRoot, { recursive: true });

  const dirsToSnapshot = ['Sources', 'ExecutiveSessions', 'Registries'];
  for (const dir of dirsToSnapshot) {
    const src = path.join(repositoryPath, dir);
    try {
      await fs.access(src);
      await copyDir(src, path.join(snapshotRoot, dir));
    } catch {
      // directory may not exist yet
    }
  }

  return snapshotRoot;
}

/** Writes an import session manifest with rollback information. */
export async function writeSessionManifest(
  repositoryPath: string,
  manifest: ImportSessionManifest,
): Promise<string> {
  const sessionsDir = path.join(repositoryPath, '.kae-sessions');
  await fs.mkdir(sessionsDir, { recursive: true });
  const manifestPath = path.join(sessionsDir, `${manifest.sessionId}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  return manifestPath;
}
