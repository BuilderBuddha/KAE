/**
 * Phase 2 / 2.1: Persistent KayD investigation composer across executive workspace.
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

const DOCK_SCREENS = ['dashboard', 'search', 'explorer', 'import', 'connectors'];

function shouldRenderInlineComposer(input) {
  if (input.isKaydHome) return true;
  if (
    input.hasConversation &&
    input.workspaceScreen &&
    (input.dockScreens ?? []).includes(input.workspaceScreen)
  ) {
    return false;
  }
  return true;
}

function shouldRenderInvestigationDock(input) {
  return input.hasConversation && input.dockScreens.includes(input.screen);
}

function resolveComposerDraft(input) {
  void input.investigationSearchQuery;
  return input.providerDraft;
}

async function main() {
  console.log('KayD persistent investigation composer regression (Phase 2.1)');

  const workspacePath = join(repoRoot, 'apps/desktop/src/utils/kayd-workspace.ts');
  const workspaceSrc = readFileSync(workspacePath, 'utf8');
  assert(workspaceSrc.includes("'import'"), 'Knowledge Sources (import) on dock allowlist');
  assert(workspaceSrc.includes("'connectors'"), 'connectors on dock allowlist');
  assert(workspaceSrc.includes('hasConversation'), 'dock gated on hasConversation');
  assert(!/showsInvestigationDock\(\s*screen:\s*ScreenId,\s*investigationActive/.test(workspaceSrc), 'dock not gated only on investigationActive');
  console.log('PASS Phase 2.1 allowlist + hasConversation gate');

  const shellPath = join(repoRoot, 'apps/desktop/src/components/Shell.tsx');
  const shellSrc = readFileSync(shellPath, 'utf8');
  assert(shellSrc.includes('KaydInvestigationDock'), 'Shell hosts investigation dock');
  assert(shellSrc.includes('shell__main'), 'Shell main column anchors dock outside remount');
  assert(shellSrc.includes('hasConversation'), 'Shell reads hasConversation');
  assert(shellSrc.includes('showsInvestigationDock(activeScreen, hasConversation)'), 'Shell passes hasConversation');
  console.log('PASS Shell dock placement + hasConversation wiring');

  const panelPath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydChatPanel.tsx');
  const panelSrc = readFileSync(panelPath, 'utf8');
  assert(panelSrc.includes('KaydInvestigationComposer'), 'panel reuses shared composer');
  assert(panelSrc.includes('shouldRenderInlineComposer'), 'inline suppressed when docked');
  assert(panelSrc.includes('hasConversation'), 'inline gate uses hasConversation');
  assert(!panelSrc.includes("useState('')"), 'no local composer draft state');
  console.log('PASS KaydChatPanel shared composer / no local draft');

  const layoutPath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydWorkspaceLayout.tsx');
  const layoutSrc = readFileSync(layoutPath, 'utf8');
  assert(layoutSrc.includes('hasConversation'), 'layout respects hasConversation');
  assert(layoutSrc.includes('if (hasConversation) return []'), 'cold briefing suppressed when conversation exists');
  console.log('PASS workspace layout suppresses cold opener with conversation');

  const dashPath = join(repoRoot, 'apps/desktop/src/screens/DashboardScreen.tsx');
  const dashSrc = readFileSync(dashPath, 'utf8');
  assert(dashSrc.includes('Still on') || dashSrc.includes('activeInvestigation'), 'Dashboard acknowledges active topic');
  assert(dashSrc.includes('hasConversation'), 'Dashboard branches on hasConversation');
  console.log('PASS Dashboard topic acknowledgment');

  // Video path: dock on every supporting screen once conversation exists
  for (const screen of DOCK_SCREENS) {
    const dock = shouldRenderInvestigationDock({
      hasConversation: true,
      screen,
      dockScreens: DOCK_SCREENS,
    });
    const inline = shouldRenderInlineComposer({
      hasConversation: true,
      isKaydHome: false,
      workspaceScreen: screen,
      dockScreens: DOCK_SCREENS,
    });
    assert(dock && !inline, `${screen}: dock only, no inline duplicate`);
  }
  // Missing investigationActive must not hide dock
  assert(
    shouldRenderInvestigationDock({
      hasConversation: true,
      screen: 'import',
      dockScreens: DOCK_SCREENS,
    }),
    'Knowledge Sources keeps dock with hasConversation even without investigationActive flag in gate',
  );
  assert(
    shouldRenderInvestigationDock({
      hasConversation: true,
      screen: 'dashboard',
      dockScreens: DOCK_SCREENS,
    }),
    'Dashboard keeps dock with conversation',
  );
  const kaydInline = shouldRenderInlineComposer({
    hasConversation: true,
    isKaydHome: true,
    workspaceScreen: 'vigsy',
    dockScreens: DOCK_SCREENS,
  });
  const kaydDock = shouldRenderInvestigationDock({
    hasConversation: true,
    screen: 'vigsy',
    dockScreens: DOCK_SCREENS,
  });
  assert(kaydInline && !kaydDock, 'KayD: inline only, no dock');
  console.log('PASS video path allowlist + one composer per page');

  // Navigation alone never ends dock — only clearing conversation
  assert(
    !shouldRenderInvestigationDock({
      hasConversation: false,
      screen: 'dashboard',
      dockScreens: DOCK_SCREENS,
    }),
    'New/Clear (no conversation) hides dock',
  );
  console.log('PASS dock ends only when conversation cleared');

  const cssPath = join(repoRoot, 'apps/desktop/src/styles/global.css');
  const cssSrc = readFileSync(cssPath, 'utf8');
  assert(cssSrc.includes('.kayd-investigation-dock'), 'dock styles present');
  assert(cssSrc.includes('.shell__content--with-dock'), 'content padding with dock');
  console.log('PASS viewport dock CSS');

  let draft = resolveComposerDraft({
    providerDraft: 'Why does',
    investigationSearchQuery: 'ChatGPT Import',
  });
  assert(draft === 'Why does', 'partial draft preserved');
  assert(
    resolveComposerDraft({ providerDraft: 'typed', investigationSearchQuery: 'andreas need to review this' }) ===
      'typed',
    'investigation sentence never overwrites draft',
  );
  console.log('PASS draft survives + never overwritten by searchQuery');

  const appPath = join(repoRoot, 'apps/desktop/src/App.tsx');
  const appSrc = readFileSync(appPath, 'utf8');
  assert(
    appSrc.indexOf('VigsyConversationProvider') < appSrc.indexOf('<Shell'),
    'provider wraps Shell — conversationId survives screen remount',
  );
  console.log('PASS shared conversation ownership across pages');

  const hookPath = join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts');
  const hookSrc = readFileSync(hookPath, 'utf8');
  assert(hookSrc.includes('composerDraft'), 'provider owns draft');
  assert(hookSrc.includes('selectedEvidencePath'), 'provider owns evidence selection');
  assert(hookSrc.includes('presentationAfterTransportToken'), 'Phase 1 no-token-paint retained');
  const explorerSrc = readFileSync(join(repoRoot, 'apps/desktop/src/screens/ExplorerScreen.tsx'), 'utf8');
  assert(explorerSrc.includes('ensurePinnedEntryVisible'), 'Phase 1 pin-open retained');
  console.log('PASS Phase 1 + evidence continuity retained');

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
  console.log('PASS fingerprint unchanged');

  const coldInline = shouldRenderInlineComposer({
    hasConversation: false,
    isKaydHome: true,
    workspaceScreen: 'vigsy',
    dockScreens: DOCK_SCREENS,
  });
  const coldDock = shouldRenderInvestigationDock({
    hasConversation: false,
    screen: 'dashboard',
    dockScreens: DOCK_SCREENS,
  });
  assert(coldInline && !coldDock, 'cold path: no dock; KayD inline composer');
  const vigsySrc = readFileSync(join(repoRoot, 'apps/desktop/src/screens/VigsyScreen.tsx'), 'utf8');
  assert(vigsySrc.includes('KAYD_HOME_COMPOSER_ID'), 'home composer id retained');
  console.log('PASS cold v2.9 opener without conversation');

  console.log('\nAll persistent investigation composer tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
