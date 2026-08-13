import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExecutiveBriefing, ExecutiveAwarenessCard } from '@scooper/core';
import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { filterExecutiveBriefingForInvestigation } from '../../utils/investigation-workflow';

function isVigsyConversationLocalLink(pathOrId: string | undefined): boolean {
  if (!pathOrId) return false;
  return /ExecutiveSessions[/\\]KAE[/\\]VIGSY-/i.test(pathOrId) || /VIGSY-[0-9A-F]{8}/i.test(pathOrId);
}

/** Drop prior conversation-local Vigsy Recent Decisions from a blank conversation's supporting drawer. */
function filterBriefingForFreshConversation(briefing: ExecutiveBriefing | null): ExecutiveBriefing | null {
  if (!briefing) return briefing;
  const cards: ExecutiveAwarenessCard[] = briefing.cards
    .map((card) => {
      if (card.category !== 'recent_decision') return card;
      const links = (card.evidenceLinks ?? []).filter(
        (link) =>
          !isVigsyConversationLocalLink(link.explorerPath) &&
          !isVigsyConversationLocalLink(link.recordId),
      );
      if (links.length === 0) return null;
      return {
        ...card,
        evidenceLinks: links,
        summary: links[0]
          ? `${links[0].label} — ${(card.summary.split('—')[1] ?? card.summary).trim()}`.slice(0, 180)
          : card.summary,
      };
    })
    .filter((card): card is ExecutiveAwarenessCard => card != null);
  return { ...briefing, cards };
}

function supportingSummary(briefing: ExecutiveBriefing | null): {
  sourceCount: number;
  confidence: number | null;
  sentence: string;
} {
  if (!briefing || briefing.cards.length === 0) {
    return {
      sourceCount: 0,
      confidence: null,
      sentence: 'Expand for decisions, blockers, health, and Explorer links.',
    };
  }
  const cards = briefing.cards.filter((card) => !card.isPlaceholder);
  const confidences = cards.map((card) => card.confidence).filter((n) => Number.isFinite(n));
  const confidence =
    confidences.length > 0
      ? Math.round(confidences.reduce((sum, n) => sum + n, 0) / confidences.length)
      : null;
  const top = cards[0];
  const sentence = top
    ? `${top.title}: ${top.summary.trim().slice(0, 120)}${top.summary.trim().length > 120 ? '…' : ''}`
    : 'Expand for supporting awareness detail.';
  return {
    sourceCount: briefing.evidenceRecordCount || cards.length,
    confidence,
    sentence,
  };
}

/**
 * Supporting awareness — always collapsed by default on KayD.
 * Full cards and Open-in-Explorer remain available when expanded.
 */
export function KaydExecutiveBriefingInline({ demoted = true }: { demoted?: boolean }) {
  const { investigationActive, activeInvestigation, turns } = useVigsyConversation();
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.kae.getExecutiveBriefing();
      setBriefing(result.briefing);
      if (result.stale) {
        setBackgroundRefreshing(true);
        const fresh = await window.kae.refreshExecutiveBriefing();
        setBriefing(fresh);
      }
    } finally {
      setLoading(false);
      setBackgroundRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  useEffect(() => {
    const offBriefing = window.kae.onExecutiveBriefingUpdated(() => void loadBriefing());
    const offMemory = window.kae.onExecutiveMemoryUpdated(() => void loadBriefing());
    return () => {
      offBriefing();
      offMemory();
    };
  }, [loadBriefing]);

  const displayBriefing = useMemo(() => {
    if (investigationActive) {
      return filterExecutiveBriefingForInvestigation(briefing, activeInvestigation?.searchQuery);
    }
    // New / blank conversation: keep durable awareness, exclude prior conversation-local Vigsy decisions.
    if ((turns?.length ?? 0) === 0) {
      return filterBriefingForFreshConversation(briefing);
    }
    return briefing;
  }, [activeInvestigation?.searchQuery, briefing, investigationActive, turns]);

  const summary = useMemo(() => supportingSummary(displayBriefing), [displayBriefing]);

  const panel = (
    <ExecutiveBriefingPanel
      variant="inline"
      briefing={displayBriefing}
      loading={loading}
      backgroundRefreshing={backgroundRefreshing}
      onRefresh={() => void loadBriefing()}
    />
  );

  if (!demoted) {
    return <div className="kayd-briefing-inline kayd-briefing-inline--continued">{panel}</div>;
  }

  const metaParts = [
    summary.sourceCount > 0 ? `${summary.sourceCount.toLocaleString()} sources` : null,
    summary.confidence != null ? `${summary.confidence}% confidence` : null,
  ].filter(Boolean);

  return (
    <details className="kayd-briefing-inline kayd-briefing-inline--demoted" data-supporting-collapsed="true">
      <summary className="kayd-supporting-drawer__summary muted">
        <span className="kayd-supporting-drawer__title">Supporting context</span>
        {metaParts.length > 0 ? (
          <span className="kayd-supporting-drawer__meta"> · {metaParts.join(' · ')}</span>
        ) : null}
        <span className="kayd-supporting-drawer__hint">{summary.sentence}</span>
      </summary>
      <div className="kayd-briefing-inline__body">{panel}</div>
    </details>
  );
}
