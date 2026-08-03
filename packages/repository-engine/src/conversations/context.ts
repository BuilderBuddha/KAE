import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { VigsyConversationFollowUpContext } from '@scooper/core';

export type VigsySessionContext = VigsyConversationFollowUpContext;

function isViableTopic(topic: string | undefined | null): boolean {
  if (!topic) return false;
  const t = topic.trim();
  if (t.length < 3) return false;
  if (/^(ab|the|a|an|it|this|that|why|what|how)$/i.test(t)) return false;
  if (/\(following up on:/i.test(t)) return false;
  if (/^why does\s+"/i.test(t)) return false;
  if (/^(why|what|how|show|walk|explain|summarize|continue)\b/i.test(t) && t.split(/\s+/).length >= 5) {
    return false;
  }
  return true;
}

function topicFromSearchQuery(searchQuery: string | undefined): string {
  if (!searchQuery) return '';
  const followUp = searchQuery.match(/\(following up on:\s*([^)]+)\)/i)?.[1]?.trim();
  if (followUp && isViableTopic(followUp)) return followUp;
  const whyQuoted = searchQuery.match(/^why does\s+"([^"]+)"\s+matter\??$/i)?.[1]?.trim();
  if (whyQuoted && isViableTopic(whyQuoted)) return whyQuoted;
  const about = searchQuery.match(
    /^(?:why does|what should we do next about|tell me more about|summarize more about)\s+(.+?)\??$/i,
  )?.[1]?.trim();
  if (about && !/^(that|this|it)$/i.test(about)) {
    const cleaned = about.replace(/^["']|["']$/g, '').trim();
    if (isViableTopic(cleaned)) return cleaned;
  }
  return isViableTopic(searchQuery) ? searchQuery.trim() : '';
}

/** Resolve retrieval question for short follow-ups without rewriting visible user text. */
export function enrichFollowUpQuestion(question: string, session: VigsySessionContext): string {
  const q = question.trim();
  const topic = session.lastSearchQuery?.trim();
  if (!q || !topic) return q;

  if (/^why does (that|this|it) matter\??$/i.test(q) || /^why\??$/i.test(q)) {
    return `Why does ${topic} matter?`;
  }
  if (/^what should we do next\??$/i.test(q)) {
    return `What should we do next about ${topic}?`;
  }
  if (/^summarize more/i.test(q)) {
    return `Summarize more about ${topic}.`;
  }
  if (/^show me the videos|^show videos|^show me videos/i.test(q)) {
    return `Show me the videos related to ${topic}.`;
  }
  if (/image/i.test(q) && q.split(/\s+/).length <= 6) {
    return `Show me the images and screenshots related to ${topic}.`;
  }
  return q;
}

export function sessionFromAnswer(
  question: string,
  answer: VigsyKnowledgeAnswer,
  previous?: VigsySessionContext,
): VigsySessionContext {
  const prior = previous?.lastSearchQuery?.trim();
  const fromAnswer = topicFromSearchQuery(answer.searchQuery);
  const stable =
    (isViableTopic(prior) ? prior : '') ||
    fromAnswer ||
    topicFromSearchQuery(question) ||
    prior ||
    '';

  return {
    lastQuestion: question.trim(),
    lastSearchQuery: stable || undefined,
    lastKrcIds: answer.explorerLinks.map((link) => link.krcId).filter(Boolean) as string[],
  };
}
