/**
 * Phase 3.1 presentation remediation — one task response, honest state, executive-first preview.
 * Source-contract checks; no live API charges.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isExecutiveBriefRequest,
  classifyQuestionIntent,
} from '@scooper/repository-engine';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  console.log('Phase 3.1 Executive Brief presentation remediation');

  const repoRoot = join(import.meta.dirname, '../../..');
  const presentationSrc = readFileSync(
    join(repoRoot, 'apps/desktop/src/utils/kayd-executive-brief-presentation.ts'),
    'utf8',
  );
  const hookSrc = readFileSync(join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts'), 'utf8');
  const previewSrc = readFileSync(
    join(repoRoot, 'apps/desktop/src/components/vigsy/KaydExecutiveBriefPreview.tsx'),
    'utf8',
  );

  // 1–2: one concise transition + no duplicate full KayD answer
  assert(
    presentationSrc.includes("EXECUTIVE_BRIEF_PREPARED_TRANSITION =\n  'I prepared the Executive Brief for your review.'") ||
      presentationSrc.includes("'I prepared the Executive Brief for your review.'"),
    'prepare transition defined',
  );
  assert(
    presentationSrc.includes("'I revised the Executive Brief for your review.'"),
    'revise transition defined',
  );
  assert(hookSrc.includes('executiveBriefTransitionMessage'), 'hook uses transition helper');
  assert(hookSrc.includes('shouldUseExecutiveBriefTaskResponse'), 'hook gates task response');
  assert(
    hookSrc.includes('streamText = executiveBriefTransitionMessage'),
    'brief path streams transition, not full answer',
  );
  assert(
    /taskTurnOnly \? undefined : answer/.test(hookSrc) ||
      /briefTaskResponse \? undefined : answer/.test(hookSrc),
    'brief turns do not retain duplicate full answer payload',
  );
  assert(hookSrc.includes('formatConversationalAnswer'), 'ordinary path still formats full answers');
  assert(hookSrc.includes('alreadyReadyBrief'), 'active preview blocks parallel prepare');
  console.log('PASS one concise transition + no duplicate full KayD answer');

  // 3–5: honest response state
  assert(hookSrc.includes('error: undefined'), 'success clears stale error');
  const prepareIdx = hookSrc.indexOf('setExecutiveBriefTask(prepared)');
  assert(prepareIdx > 0, 'prepare wired');
  assert(
    !hookSrc
      .slice(prepareIdx, prepareIdx + 350)
      .includes("error: 'Unable to answer from indexed evidence.'"),
    'successful preparation does not paint Unable to answer',
  );
  const reviseIdx = hookSrc.indexOf('setExecutiveBriefTask(revised)');
  assert(reviseIdx > 0, 'revise wired');
  assert(
    !hookSrc
      .slice(reviseIdx, reviseIdx + 350)
      .includes("error: 'Unable to answer from indexed evidence.'"),
    'successful revision does not paint Unable to answer',
  );
  assert(
    hookSrc.includes('Unable to prepare the Executive Brief from indexed evidence.'),
    'genuine brief failure remains visible',
  );
  assert(
    hookSrc.includes("Unable to answer from indexed evidence."),
    'genuine answer failure remains visible',
  );
  assert(
    hookSrc.includes('setExecutiveBriefTask(null)') ||
      hookSrc.includes('if (!revising && !activeBrief) setExecutiveBriefTask(null)') ||
      hookSrc.includes('if (!revising) setExecutiveBriefTask(null)'),
    'failed prepare does not leave a false successful preview',
  );
  console.log('PASS honest response state');

  // 6: evidence collapsed initially, still available/traceable
  assert(previewSrc.includes("useState(false)"), 'evidence starts collapsed');
  assert(previewSrc.includes('data-evidence-collapsed'), 'collapsed state exposed');
  assert(previewSrc.includes('<details'), 'expand-on-demand details');
  assert(previewSrc.includes('fingerprint'), 'fingerprint in summary');
  assert(previewSrc.includes('openInExplorer'), 'source-opening controls preserved');
  assert(
    previewSrc.indexOf('Executive conclusion') < previewSrc.indexOf('What changed or matters') &&
      previewSrc.indexOf('What changed or matters') < previewSrc.indexOf('Uncertainty / gaps') &&
      previewSrc.indexOf('Uncertainty / gaps') < previewSrc.indexOf('Recommended next action') &&
      previewSrc.indexOf('Recommended next action') < previewSrc.indexOf('Supporting evidence'),
    'executive-first section order',
  );
  console.log('PASS executive-first collapsed evidence');

  // 8: ordinary KayD questions retain normal conversational behavior
  assert(!isExecutiveBriefRequest('What happened with ChatGPT Import?'), 'ordinary NL not brief');
  assert(classifyQuestionIntent('What happened with ChatGPT Import?') === 'general', 'ordinary intent');
  assert(
    presentationSrc.includes("input.intent === 'executive_brief'") ||
      presentationSrc.includes("intent === 'executive_brief'"),
    'task response only when brief intent/request/revise',
  );
  assert(
    isExecutiveBriefRequest('Prepare an executive briefing on this investigation.'),
    'briefing on this investigation is a brief request',
  );
  assert(
    isExecutiveBriefRequest('Prepare an executive brief for this investigation.'),
    'for-this-investigation remains a brief request after cancel semantics',
  );
  assert(
    !isExecutiveBriefRequest('Revise the executive brief'),
    'revise-only is not a new prepare request',
  );
  assert(!isExecutiveBriefRequest('Keep the answer brief'), 'keep answer brief stays ordinary');
  assert(
    hookSrc.includes('setExecutiveBriefTask(null)') &&
      hookSrc.includes('cancelExecutiveBrief(task.taskId)'),
    'cancel clears renderer task state',
  );
  assert(
    hookSrc.includes('executiveBriefNeedsEvidenceText') ||
      presentationSrc.includes('I need an evidence-backed investigation'),
    'honest evidence-required message present',
  );
  assert(
    presentationSrc.includes('Prepare Executive Brief') &&
      presentationSrc.includes('shouldShowPrepareExecutiveBriefAction'),
    'discoverable prepare action helpers present',
  );
  console.log('PASS ordinary KayD conversational behavior retained');

  console.log('\nAll Phase 3.1 presentation remediation tests passed.');
}

main();
