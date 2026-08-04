import { useState } from 'react';
import type { ExecutiveBriefTask } from '@scooper/core';
import { useNavigation } from '../../context/NavigationContext';

interface KaydExecutiveBriefPreviewProps {
  task: ExecutiveBriefTask;
  busy?: boolean;
  onApprove: () => void;
  onRequestRevision: () => void;
  onCancel: () => void;
}

/** Calm preview card for governed Executive Brief — executive-first; evidence collapsed by default. */
export function KaydExecutiveBriefPreview({
  task,
  busy,
  onApprove,
  onRequestRevision,
  onCancel,
}: KaydExecutiveBriefPreviewProps) {
  const { openInExplorer } = useNavigation();
  const { preview, evidence, state, writeResult, failure } = task;
  const canAct = state === 'preview-ready' || state === 'revision-requested';
  const saved = state === 'saved-and-registered' && writeResult?.saved;
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const fingerprintShort = evidence.fingerprint.slice(0, 16);
  const sourceCount = evidence.evidenceUsed.length;

  return (
    <section
      className="kayd-executive-brief-preview"
      aria-label="Executive Brief preview"
      data-state={state}
      data-evidence-collapsed={evidenceOpen ? 'false' : 'true'}
    >
      <header className="kayd-executive-brief-preview__header">
        <h3 className="kayd-executive-brief-preview__title">{preview.title}</h3>
        <p className="kayd-executive-brief-preview__status muted">
          {saved
            ? `Saved · ${writeResult.relativePath}`
            : failure
              ? `Not saved — ${failure.message}`
              : state === 'revision-requested'
                ? 'Revision requested — reply in KayD, then review the updated preview.'
                : preview.notYetSavedNotice}
        </p>
      </header>

      <div className="kayd-executive-brief-preview__body">
        <section>
          <h4>Executive conclusion</h4>
          <p>{preview.executiveConclusion}</p>
        </section>
        <section>
          <h4>What changed or matters</h4>
          <p className="kayd-executive-brief-preview__pre">{preview.whatChangedOrMatters}</p>
        </section>
        <section>
          <h4>Uncertainty / gaps</h4>
          <p>{preview.uncertaintyAndGaps}</p>
        </section>
        <section>
          <h4>Recommended next action</h4>
          <p>{preview.recommendedNextAction}</p>
        </section>

        <details
          className="kayd-executive-brief-preview__evidence"
          open={evidenceOpen}
          onToggle={(event) => setEvidenceOpen((event.target as HTMLDetailsElement).open)}
        >
          <summary className="kayd-executive-brief-preview__evidence-summary">
            Supporting evidence · {sourceCount} source{sourceCount === 1 ? '' : 's'} · fingerprint{' '}
            {fingerprintShort}…
          </summary>
          <pre className="kayd-executive-brief-preview__pre">{preview.supportingEvidenceSummary}</pre>
          <ul className="kayd-executive-brief-preview__links">
            {evidence.evidenceUsed.map((item) => (
              <li key={item.recordId}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => openInExplorer(item.explorerPath)}
                >
                  Open {item.krcId ?? item.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="muted kayd-executive-brief-preview__freeze">
            Frozen evidence remains complete in the saved artifact · revisions {task.revisionCount}
          </p>
        </details>
      </div>

      {canAct ? (
        <div className="kayd-executive-brief-preview__actions form__actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={busy}
            onClick={onApprove}
          >
            Approve &amp; save
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            disabled={busy}
            onClick={onRequestRevision}
          >
            Request revision
          </button>
          <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}
