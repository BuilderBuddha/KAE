/** Builds a renderer-safe URL served by the Electron kae-asset protocol. */
export function buildKaeAssetUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  return `kae-asset://resolve/${encodeURIComponent(normalized)}`;
}

export function parseKaeAssetUrl(url: string): string | null {
  const prefix = 'kae-asset://resolve/';
  if (!url.startsWith(prefix)) return null;
  return decodeURIComponent(url.slice(prefix.length));
}
