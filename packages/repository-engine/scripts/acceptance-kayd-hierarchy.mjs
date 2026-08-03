/**
 * Phase 2.2: KayD conversation-first page hierarchy.
 * Source contracts + pure helpers. Mocked only — no API charges.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceFingerprint, verifyGroundedAnswer } from '@scooper/ai-orchestration';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function suggestionDedupeKey(prompt) {
  const t = prompt.trim().toLowerCase();
  if (!t) return '';
  if (/chatgpt/.test(t) && /import/.test(t)) return 'topic:chatgpt-import';
  if (/repository\s*repair/.test(t)) return 'topic:repository-repair';
  if (/posca/.test(t)) return 'topic:posca';
  return `exact:${t}`;
}

function selectStarterPrompts(chips, max = 3) {
  const seen = new Set();
  const selected = [];
  for (const chip of chips) {
    const key = suggestionDedupeKey(chip);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push(chip.trim());
    if (selected.length >= max) break;
  }
  return selected;
}

async function main() {
  console.log('KayD conversation-first hierarchy regression (Phase 2.2)');

  const panelPath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydChatPanel.tsx');
  const panelSrc = readFileSync(panelPath, 'utf8');
  const vigsyPath = join(repoRoot, 'apps/desktop/src/screens/VigsyScreen.tsx');
  const vigsySrc = readFileSync(vigsyPath, 'utf8');
  const inlinePath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydExecutiveBriefingInline.tsx');
  const inlineSrc = readFileSync(inlinePath, 'utf8');
  const cssPath = join(repoRoot, 'apps/desktop/src/styles/global.css');
  const cssSrc = readFileSync(cssPath, 'utf8');

  // 1–2. Composer before Supporting context (cold + active)
  assert(panelSrc.includes('data-hierarchy="cold"'), 'cold hierarchy unit present');
  assert(panelSrc.includes('data-hierarchy="active"'), 'active hierarchy unit present');
  assert(panelSrc.includes('data-region="supporting-context"'), 'supporting region marked');
  assert(panelSrc.includes('data-composer-before-supporting'), 'composer-before-supporting marker');
  const coldIdx = panelSrc.indexOf('data-hierarchy="cold"');
  const activeIdx = panelSrc.indexOf('data-hierarchy="active"');
  const supportingIdx = panelSrc.indexOf('data-region="supporting-context"');
  assert(coldIdx > 0 && supportingIdx > coldIdx, 'cold unit precedes supporting in source');
  assert(activeIdx > 0 && supportingIdx > activeIdx, 'active unit precedes supporting in source');
  assert(panelSrc.includes('primaryActions'), 'primary actions slot after composer on cold path');
  console.log('PASS composer before Supporting context (cold + active)');

  // 3–4. Supporting collapsed by default; expand preserves panel
  assert(inlineSrc.includes('data-supporting-collapsed="true"'), 'supporting collapsed by default');
  assert(inlineSrc.includes('Supporting context'), 'Supporting context label');
  assert(inlineSrc.includes('ExecutiveBriefingPanel'), 'expanded body keeps full panel');
  assert(inlineSrc.includes('demoted = true'), 'demoted by default');
  assert(vigsySrc.includes('<KaydExecutiveBriefingInline demoted'), 'Vigsy always demotes supporting');
  assert(!/<KaydExecutiveBriefingInline\s*\/>/.test(vigsySrc), 'no expanded-by-default briefing');
  console.log('PASS Supporting context collapsed; evidence preserved on expand');

  // 5–7. Sticky composer in KayD viewport
  assert(panelSrc.includes('kayd-chat-panel__composer--sticky'), 'sticky composer class');
  assert(cssSrc.includes('.kayd-chat-panel__composer--sticky'), 'sticky composer CSS');
  assert(cssSrc.includes('position: sticky'), 'sticky positioning');
  assert(cssSrc.includes('padding-bottom: 28px') || cssSrc.includes('padding-bottom: 28'), 'supporting padding vs cover');
  console.log('PASS sticky composer + padding');

  // 8–9. One KayD composer; no cross-page dock on KayD
  assert(vigsySrc.includes('KAYD_HOME_COMPOSER_ID'), 'home composer id');
  assert(!vigsySrc.includes('KaydInvestigationDock'), 'no dock on VigsyScreen');
  const workspaceSrc = readFileSync(join(repoRoot, 'apps/desktop/src/utils/kayd-workspace.ts'), 'utf8');
  assert(workspaceSrc.includes("showsInvestigationDock"), 'dock helper retained');
  assert(workspaceSrc.includes('hasConversation'), 'Phase 2.1 hasConversation gate retained');
  assert(
    !/KAYD_INVESTIGATION_DOCK_SCREENS[\s\S]*?'vigsy'/.test(workspaceSrc),
    'vigsy not in dock allowlist',
  );
  console.log('PASS one KayD composer; dock absent on KayD');

  // 10–11. Max three suggestions; dedupe ChatGPT Import variants
  const starters = [
    'What happened with ChatGPT Import?',
    'What did we decide about Repository Repair?',
    'What happened with ChatGPT import media?',
    'Summarize POSCA UX.',
  ];
  const selected = selectStarterPrompts(starters, 3);
  assert(selected.length === 3, 'at most three starters');
  assert(selected.filter((s) => /chatgpt/i.test(s)).length === 1, 'duplicate ChatGPT Import removed');
  assert(selected.some((s) => /Repository Repair/i.test(s)), 'repair prompt kept');
  assert(selected.some((s) => /POSCA/i.test(s)), 'POSCA prompt kept');
  const chipsSrc = readFileSync(join(repoRoot, 'apps/desktop/src/components/vigsy/KaydGuidedChips.tsx'), 'utf8');
  assert(chipsSrc.includes('maxVisible'), 'guided chips capped');
  const followSrc = readFileSync(join(repoRoot, 'apps/desktop/src/components/vigsy/VigsyFollowUpChips.tsx'), 'utf8');
  assert(followSrc.includes('KAYD_PRIMARY_FOLLOW_UP_LIMIT') || followSrc.includes('maxVisible'), 'follow-ups capped');
  assert(followSrc.includes("label: 'Why?'"), 'topic-relevant Why prioritized');
  console.log('PASS ≤3 suggestions + ChatGPT dedupe');

  // 12–14. Phase 1 + 2.1 intact
  const phase1a = readFileSync(join(repoRoot, 'packages/repository-engine/scripts/acceptance-kayd-single-answer.mjs'), 'utf8');
  const phase1b = readFileSync(join(repoRoot, 'packages/repository-engine/scripts/acceptance-explorer-browse.mjs'), 'utf8');
  const phase21 = readFileSync(join(repoRoot, 'packages/repository-engine/scripts/acceptance-persistent-composer.mjs'), 'utf8');
  assert(phase1a.includes('streamTextReveal'), 'Phase 1 presentation retained');
  assert(phase1b.includes('ensurePinnedEntryVisible'), 'Phase 1 explorer retained');
  assert(phase21.includes('hasConversation'), 'Phase 2.1 gate retained');
  assert(phase21.includes("'import'"), 'Phase 2.1 Knowledge Sources dock retained');
  const hookSrc = readFileSync(join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts'), 'utf8');
  assert(hookSrc.includes('presentationAfterTransportToken'), 'Phase 1 no-token-paint retained');
  console.log('PASS Phase 1 + Phase 2.1 contracts retained');

  // 15. Fingerprints
  const skeleton = {
    question: 'q',
    intent: 'general',
    searchQuery: 'ChatGPT Import',
    directAnswer: 'Answer',
    reasonedSummary: 's',
    evidenceUsed: [
      {
        recordId: 'krc-real-001',
        label: 'ChatGPT Import',
        excerpt: 'e',
        kind: 'decision',
        explorerPath: 'Knowledge/Decisions/import.md',
      },
    ],
    confidence: { level: 'high', score: 90, rationale: 'ok' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [],
  };
  const verified = verifyGroundedAnswer(skeleton, {
    ...skeleton,
    usedOfflineFallback: false,
    reasoningProviderId: 'openai',
  });
  assert(evidenceFingerprint(skeleton) === evidenceFingerprint(verified), 'fingerprint unchanged');
  console.log('PASS evidence fingerprints unchanged');

  // 16. Cold v2.9 opener identity
  assert(vigsySrc.includes('KAYD_BRIEFING_STATUS.home'), 'home briefing status retained');
  assert(vigsySrc.includes('KaydChatPanel'), 'v2.9 panel retained');
  assert(vigsySrc.includes('/^what would you like/i'), 'opener seal still recognizes tackle-first line');
  console.log('PASS cold v2.9 opener identity retained');

  console.log('\nAll KayD conversation-first hierarchy tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
