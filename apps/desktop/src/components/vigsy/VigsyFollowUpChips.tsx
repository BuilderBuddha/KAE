import type { VigsyKnowledgeAnswer } from '@scooper/core';

export type FollowUpAction =
  | { type: 'ask'; question: string }
  | { type: 'expand'; section: string }
  | { type: 'explorer'; path: string };

interface VigsyFollowUpChipsProps {
  answer: VigsyKnowledgeAnswer;
  onAction: (action: FollowUpAction) => void;
}

const CHIPS: Array<{
  label: string;
  resolve: (answer: VigsyKnowledgeAnswer) => FollowUpAction;
}> = [
  { label: 'Show Timeline', resolve: () => ({ type: 'expand', section: 'timeline' }) },
  {
    label: 'Why?',
    resolve: (answer) => ({ type: 'ask', question: `Why? (about ${answer.searchQuery})` }),
  },
  { label: 'Show Sources', resolve: () => ({ type: 'expand', section: 'evidence' }) },
  {
    label: 'Open Conversation',
    resolve: (answer) => ({
      type: 'explorer',
      path: answer.explorerLinks[0]?.path ?? answer.evidenceUsed[0]?.explorerPath ?? '',
    }),
  },
  {
    label: 'Show Images',
    resolve: (answer) => ({
      type: 'ask',
      question: `Show images related to ${answer.searchQuery}`,
    }),
  },
  {
    label: 'Show Videos',
    resolve: (answer) => ({
      type: 'ask',
      question: `Show me the videos related to ${answer.searchQuery}`,
    }),
  },
  { label: 'Related Decisions', resolve: () => ({ type: 'expand', section: 'decisions' }) },
  {
    label: 'Summarize More',
    resolve: (answer) => ({ type: 'ask', question: `Summarize more about ${answer.searchQuery}` }),
  },
];

export function VigsyFollowUpChips({ answer, onAction }: VigsyFollowUpChipsProps) {
  return (
    <div className="vigsy-chips" role="group" aria-label="Suggested follow-up actions">
      {CHIPS.map((chip) => {
        const action = chip.resolve(answer);
        const disabled = action.type === 'explorer' && !action.path;
        return (
          <button
            key={chip.label}
            type="button"
            className="vigsy-chip"
            disabled={disabled}
            onClick={() => onAction(action)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
