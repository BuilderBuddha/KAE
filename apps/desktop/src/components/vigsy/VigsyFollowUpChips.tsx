import type { VigsyKnowledgeAnswer } from '@scooper/core';
import {
  investigationViewQuestion,
  extractInvestigationTopic,
  type InvestigationView,
} from '../../utils/investigation-workflow';
import { KAYD_PRIMARY_FOLLOW_UP_LIMIT, selectFollowUpChipIndices } from '../../utils/kayd-prompt-suggestions';

export type FollowUpAction = {
  type: 'ask';
  question: string;
  /** Explicit capability-chip origin — never inferred from free-typed text alone. */
  origin?: 'capability' | 'user';
};

interface VigsyFollowUpChipsProps {
  answer: VigsyKnowledgeAnswer;
  onAction: (action: FollowUpAction) => void;
  busy?: boolean;
  maxVisible?: number;
}

/** Primary follow-ups — Why / Sources / Timeline first (topic-relevant, max three). */
const CHIPS: Array<{ label: string; view: InvestigationView }> = [
  { label: 'Why?', view: 'why' },
  { label: 'Show Sources', view: 'sources' },
  { label: 'Show Timeline', view: 'timeline' },
  { label: 'Open Conversation', view: 'conversation' },
  { label: 'Show Images', view: 'images' },
  { label: 'Show Videos', view: 'videos' },
  { label: 'Related Knowledge', view: 'related' },
  { label: 'Summarize More', view: 'summarize' },
];

export function VigsyFollowUpChips({
  answer,
  onAction,
  busy,
  maxVisible = KAYD_PRIMARY_FOLLOW_UP_LIMIT,
}: VigsyFollowUpChipsProps) {
  const topic = extractInvestigationTopic(answer.searchQuery);
  const indices = selectFollowUpChipIndices(CHIPS.length, maxVisible);
  const visible = indices.map((index) => CHIPS[index]);

  return (
    <div
      className="vigsy-chips vigsy-chips--compact"
      role="group"
      aria-label="Suggested follow-up actions"
      data-max-suggestions={maxVisible}
    >
      {visible.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className="vigsy-chip"
          disabled={busy}
          onClick={() =>
            onAction({
              type: 'ask',
              question: investigationViewQuestion(chip.view, topic),
              origin: 'capability',
            })
          }
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
