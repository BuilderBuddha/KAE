import type { ScreenId } from '../../types/navigation';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { resolveComposerDraft } from '../../utils/kayd-persistent-composer';

interface KaydInvestigationComposerProps {
  composerId: string;
  className?: string;
  rows?: number;
  /** When true, idle submits from a non-KayD screen navigate to KayD first. */
  workspaceScreen?: ScreenId;
}

/**
 * Shared KayD investigation composer — draft owned by VigsyConversationProvider.
 * Never auto-fills from searchQuery.
 */
export function KaydInvestigationComposer({
  composerId,
  className = '',
  rows = 2,
  workspaceScreen,
}: KaydInvestigationComposerProps) {
  const { navigate } = useNavigation();
  const {
    busy,
    ready,
    hasConversation,
    investigationActive,
    activeInvestigation,
    composerDraft,
    setComposerDraft,
    submitQuestion,
  } = useVigsyConversation();

  const draft = resolveComposerDraft({
    providerDraft: composerDraft,
    investigationSearchQuery: activeInvestigation?.searchQuery,
  });

  const placeholder = busy
    ? 'KayD is thinking…'
    : hasConversation
      ? 'Continue the investigation…'
      : 'What would you like to work on today?';

  const handleSubmit = async () => {
    const question = draft.trim();
    if (!question || busy || !ready) return;
    setComposerDraft('');
    if (workspaceScreen && workspaceScreen !== 'vigsy' && !investigationActive) {
      navigate('vigsy');
    }
    await submitQuestion(question);
  };

  return (
    <form
      className={`kayd-investigation-composer ${className}`.trim()}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <label className="sr-only" htmlFor={composerId}>
        Ask KayD
      </label>
      <textarea
        id={composerId}
        className="kayd-chat-panel__input kayd-investigation-composer__input"
        rows={rows}
        placeholder={ready ? placeholder : 'Loading conversation…'}
        value={draft}
        onChange={(e) => setComposerDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        disabled={busy || !ready}
        aria-busy={busy}
      />
      <button
        type="submit"
        className="btn btn--primary btn--sm kayd-investigation-composer__send"
        disabled={busy || !ready || !draft.trim()}
      >
        Send
      </button>
    </form>
  );
}
