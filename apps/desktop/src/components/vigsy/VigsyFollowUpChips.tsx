import type { VigsyKnowledgeAnswer } from '@scooper/core';
import {
  investigationViewQuestion,
  type InvestigationView,
} from '../../utils/investigation-workflow';

export type FollowUpAction = { type: 'ask'; question: string };

interface VigsyFollowUpChipsProps {
  answer: VigsyKnowledgeAnswer;
  onAction: (action: FollowUpAction) => void;
  busy?: boolean;
}

const CHIPS: Array<{ label: string; view: InvestigationView }> = [
  { label: 'Show Timeline', view: 'timeline' },
  { label: 'Why?', view: 'why' },
  { label: 'Show Sources', view: 'sources' },
  { label: 'Open Conversation', view: 'conversation' },
  { label: 'Show Images', view: 'images' },
  { label: 'Show Videos', view: 'videos' },
  { label: 'Related Knowledge', view: 'related' },
  { label: 'Summarize More', view: 'summarize' },
];

export function VigsyFollowUpChips({ answer, onAction, busy }: VigsyFollowUpChipsProps) {
  return (
    <div className="vigsy-chips" role="group" aria-label="Suggested follow-up actions">
      {CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className="vigsy-chip"
          disabled={busy}
          onClick={() =>
            onAction({
              type: 'ask',
              question: investigationViewQuestion(chip.view, answer.searchQuery),
            })
          }
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
