import type { ExecutiveContinuity, ExecutiveSessionRecord } from '@scooper/core';
import { DEFAULT_FOUNDER_NAME } from './persist.js';

function daysBetween(isoDate: string, now: Date): number {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return 0;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  return Math.max(0, Math.round((start.getTime() - end.getTime()) / 86_400_000));
}

function timeReference(days: number): string {
  if (days === 0) return 'Earlier today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** Builds a natural welcome-back message from executive session memory. */
export function buildExecutiveContinuity(
  session: ExecutiveSessionRecord | null,
  founderName: string = DEFAULT_FOUNDER_NAME,
): ExecutiveContinuity {
  if (!session || session.lifecycle === 'archived') {
    return {
      welcomeMessage: `Welcome back${founderName ? ` ${founderName}` : ''}. Ask me anything about your knowledge.`,
      session: null,
      hasUnfinishedWork: false,
      daysSinceLastActivity: 0,
    };
  }

  const days = daysBetween(session.updatedAt, new Date());
  const parts: string[] = [`Welcome back${founderName ? ` ${founderName}` : ''}.`];

  if (session.currentCampaign) {
    parts.push(`${timeReference(days)} we were working on ${session.currentCampaign}.`);
  } else if (days > 0) {
    parts.push(`${timeReference(days)} we left off on ${session.title}.`);
  }

  const lastAccomplishment = session.currentAccomplishments[session.currentAccomplishments.length - 1];
  if (lastAccomplishment) {
    parts.push(`We completed ${lastAccomplishment.label}.`);
  }

  const unfinishedCount = session.unfinishedWork.length || session.currentBlockers.length;
  if (unfinishedCount > 0) {
    parts.push(
      unfinishedCount === 1
        ? 'One implementation remains unfinished.'
        : `${unfinishedCount} implementations remain unfinished.`,
    );
  }

  if (session.recommendedNextAction) {
    parts.push(`Would you like to ${session.recommendedNextAction}?`);
  } else {
    parts.push('Would you like to continue?');
  }

  return {
    welcomeMessage: parts.join(' '),
    recommendedNextAction: session.recommendedNextAction,
    session,
    hasUnfinishedWork: unfinishedCount > 0,
    daysSinceLastActivity: days,
  };
}
