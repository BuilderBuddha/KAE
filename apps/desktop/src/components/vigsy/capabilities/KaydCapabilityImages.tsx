import type { VigsyKnowledgeAnswer } from '@scooper/core';
import { useNavigation } from '../../../context/NavigationContext';

function isImage(label: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(label);
}

/** Visual evidence — images capability only. */
export function KaydCapabilityImages({ answer }: { answer: VigsyKnowledgeAnswer }) {
  const { openInExplorer } = useNavigation();
  const images = answer.attachments.filter((item) => isImage(item.label));

  if (images.length === 0) {
    return <p className="muted kayd-capability__empty">No images indexed for this investigation.</p>;
  }

  return (
    <ul className="kayd-capability-images">
      {images.map((item) => (
        <li key={item.recordId}>
          <button
            type="button"
            className="kayd-capability-images__item"
            onClick={() => openInExplorer(item.explorerPath)}
          >
            <span className="kayd-capability-images__label">{item.label}</span>
            <span className="kayd-capability-images__excerpt muted">{item.excerpt}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
