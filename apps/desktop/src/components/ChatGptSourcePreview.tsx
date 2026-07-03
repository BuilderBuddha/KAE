import { useMemo } from 'react';
import type { ChatGptSourcePreviewData } from '../types/kae';
import { buildKaeAssetUrl } from '../utils/kae-asset-url';

interface ChatGptSourcePreviewProps {
  data: ChatGptSourcePreviewData;
}

function roleLabel(role: string): string {
  if (role.toLowerCase() === 'user') return 'User prompt';
  if (role.toLowerCase() === 'assistant') return 'ChatGPT response';
  return role;
}

function unresolvedReason(ref: string): string {
  if (ref.startsWith('file_') || /^[a-f0-9]{32}$/i.test(ref)) {
    return 'No matching file found in Uploads/chatgpt-import-*';
  }
  if (ref.includes('.')) {
    return 'Display name only — upload stored under a file_* hash without this filename';
  }
  return 'Reference could not be matched to an imported upload';
}

function registerAssetKeys(
  map: Map<string, ChatGptSourcePreviewData['assets'][0]>,
  asset: ChatGptSourcePreviewData['assets'][0],
): void {
  const keys = [
    asset.ref,
    asset.fileName,
    asset.relativePath,
    asset.fileName.replace(/\.dat$/i, ''),
  ];
  if (asset.fileName.startsWith('file_')) {
    keys.push(asset.fileName.slice('file_'.length).replace(/\.dat$/i, ''));
  }
  for (const key of keys) {
    if (key) map.set(key, asset);
  }
}

export function ChatGptSourcePreview({ data }: ChatGptSourcePreviewProps) {
  const { parsed, assets } = data;

  const assetByRef = useMemo(() => {
    const map = new Map<string, (typeof assets)[0]>();
    for (const asset of assets) registerAssetKeys(map, asset);
    return map;
  }, [assets]);

  const lookupAsset = (ref: string) => {
    const direct = assetByRef.get(ref);
    if (direct) return direct;
    const withoutFile = ref.replace(/^file_/, '');
    return assetByRef.get(withoutFile) ?? assetByRef.get(`file_${withoutFile}`);
  };

  const renderResolvedAsset = (ref: string, asset: (typeof assets)[0]) => {
    const previewUrl = buildKaeAssetUrl(asset.relativePath);
    return (
      <li key={`${ref}-${asset.relativePath}`} className={`chatgpt-asset chatgpt-asset--${asset.kind}`}>
        <div className="chatgpt-asset__header">
          <div>
            <code>{ref}</code>
            <p className="chatgpt-asset__path muted">{asset.relativePath}</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => window.kae.openRepositoryFile(asset.relativePath)}
          >
            Open file
          </button>
        </div>
        {asset.kind === 'image' && (
          <img src={previewUrl} alt={ref} className="chatgpt-asset__image" />
        )}
        {asset.kind === 'video' && (
          <video src={previewUrl} controls className="chatgpt-asset__video" preload="metadata">
            <track kind="captions" />
          </video>
        )}
        {asset.kind === 'other' && (
          <p className="chatgpt-asset__hint">
            {asset.mimeType} — use <strong>Open file</strong> to view in your system app.
          </p>
        )}
      </li>
    );
  };

  const renderUnresolvedAsset = (ref: string) => (
    <li key={ref} className="chatgpt-asset chatgpt-asset--missing">
      <code>{ref}</code>
      <p className="chatgpt-asset__unresolved">
        Unresolved: {unresolvedReason(ref)}
      </p>
    </li>
  );

  const renderAttachment = (ref: string) => {
    const asset = lookupAsset(ref);
    if (asset) return renderResolvedAsset(ref, asset);
    return renderUnresolvedAsset(ref);
  };

  const allRefs = useMemo(() => {
    const refs = new Set<string>(parsed.fileReferences);
    for (const msg of parsed.messages) {
      for (const ref of msg.fileReferences) refs.add(ref);
    }
    return [...refs];
  }, [parsed]);

  const unresolvedCount = allRefs.filter((ref) => !lookupAsset(ref)).length;

  return (
    <div className="chatgpt-source-preview">
      <header className="chatgpt-source-preview__header">
        <h3 className="chatgpt-source-preview__title">
          {parsed.krcId} — {parsed.title}
        </h3>
        {parsed.description && <p className="muted">{parsed.description}</p>}
        <dl className="chatgpt-source-preview__meta">
          {parsed.conversationId && (
            <div>
              <dt>Conversation ID</dt>
              <dd><code>{parsed.conversationId}</code></dd>
            </div>
          )}
          {parsed.createTime && (
            <div>
              <dt>Created</dt>
              <dd>{parsed.createTime}</dd>
            </div>
          )}
          {parsed.updateTime && (
            <div>
              <dt>Updated</dt>
              <dd>{parsed.updateTime}</dd>
            </div>
          )}
          <div>
            <dt>Messages</dt>
            <dd>{parsed.messages.length}</dd>
          </div>
          <div>
            <dt>Attachments resolved</dt>
            <dd>
              {assets.length} of {allRefs.length}
              {unresolvedCount > 0 ? ` (${unresolvedCount} unresolved)` : ''}
            </dd>
          </div>
        </dl>
      </header>

      {allRefs.length > 0 && (
        <section className="chatgpt-source-preview__section">
          <h4>Attachments &amp; uploads</h4>
          <ul className="chatgpt-asset-list">{allRefs.map(renderAttachment)}</ul>
        </section>
      )}

      <section className="chatgpt-source-preview__section">
        <h4>Conversation</h4>
        <div className="chatgpt-messages">
          {parsed.messages.map((msg, index) => (
            <article
              key={`${msg.role}-${index}`}
              className={`chatgpt-message chatgpt-message--${msg.role.toLowerCase()}`}
            >
              <header className="chatgpt-message__header">
                <strong>{roleLabel(msg.role)}</strong>
                {msg.timestamp && <time className="muted">{msg.timestamp}</time>}
              </header>
              <div className="chatgpt-message__body">{msg.text}</div>
              {msg.fileReferences.length > 0 && (
                <div className="chatgpt-message__refs">
                  <span className="chatgpt-message__refs-label">Attachments in this message</span>
                  <ul className="chatgpt-asset-list chatgpt-asset-list--inline">
                    {msg.fileReferences.map(renderAttachment)}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
