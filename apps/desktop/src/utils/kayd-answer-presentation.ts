/**
 * KayD answer presentation contract — thinking, then one progressive reveal.
 * IPC transport tokens must never paint visible prose.
 */

export interface VisibleAssistantPresentation {
  thinking: boolean;
  streaming: boolean;
  text: string;
}

/** Initial assistant turn while the provider / verify / format pipeline runs. */
export function initialThinkingPresentation(): VisibleAssistantPresentation {
  return { thinking: true, streaming: false, text: '' };
}

/**
 * Stream transport chunks are for accumulation/transport only.
 * Visible answer text must remain unchanged (thinking stays on).
 */
export function presentationAfterTransportToken(
  prev: VisibleAssistantPresentation,
  _tokenText: string,
): VisibleAssistantPresentation {
  void _tokenText;
  return {
    thinking: true,
    streaming: false,
    text: prev.text,
  };
}

/** After verify + format: start progressive reveal from empty (no draft flash). */
export function presentationReadyToReveal(): VisibleAssistantPresentation {
  return { thinking: false, streaming: true, text: '' };
}

/** Progressive reveal callback — only the verified/formatted answer. */
export function presentationRevealChunk(visible: string): VisibleAssistantPresentation {
  return { thinking: false, streaming: true, text: visible };
}

/** Final settled answer. */
export function presentationComplete(finalText: string): VisibleAssistantPresentation {
  return { thinking: false, streaming: false, text: finalText };
}

/** True when a candidate paint would expose raw provider prose before format/reveal. */
export function wouldPaintPrematureAnswer(
  thinking: boolean,
  proposedVisibleText: string,
  formattedAnswer: string | null,
): boolean {
  if (!proposedVisibleText.trim()) return false;
  if (thinking) return true;
  if (formattedAnswer == null) return true;
  if (proposedVisibleText !== formattedAnswer && !formattedAnswer.startsWith(proposedVisibleText)) {
    return true;
  }
  return false;
}
