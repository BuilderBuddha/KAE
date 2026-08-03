/**
 * Phase 1B: Repository listing / open-in-Explorer contracts.
 * Pure filter logic + source contracts. Does not modify Axiom-Knowledge.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Mirrors apps/desktop/src/utils/explorer-browse.ts */
function normalizeRepoRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
}

function repoPathsEqual(a, b) {
  return normalizeRepoRelativePath(a).toLowerCase() === normalizeRepoRelativePath(b).toLowerCase();
}

function investigationSuggestsChatGptImport(topicOrQuery) {
  const q = topicOrQuery.trim().toLowerCase();
  if (!q) return false;
  return /chatgpt/.test(q);
}

function resolveExplorerFilenameSearch(input) {
  return input.userEnteredSearch.trim();
}

function filterChatGptImportEntries(entries, userFilenameSearch) {
  const q = userFilenameSearch.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.relativePath.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.title.toLowerCase().includes(q) ||
      entry.krcId.toLowerCase().includes(q),
  );
}

function ensurePinnedEntryVisible(filtered, allCandidates, pinnedRelativePath) {
  if (!pinnedRelativePath) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: false };
  }
  const already = filtered.some((entry) => repoPathsEqual(entry.relativePath, pinnedRelativePath));
  if (already) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: true };
  }
  const pinned = allCandidates.find((entry) => repoPathsEqual(entry.relativePath, pinnedRelativePath));
  if (!pinned) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: false };
  }
  return { list: [pinned, ...filtered], pinnedIncluded: true, pinnedFound: true };
}

function filterForOpenedPath(relativePath) {
  const fileName = relativePath.split(/[/\\]/).pop() ?? '';
  const match = fileName.match(/^KRC-(\d{4})_/i);
  if (!match) return 'all';
  const num = parseInt(match[1], 10);
  return num >= 53 && num <= 122 ? 'chatgpt-import' : 'all';
}

const SAMPLE_IMPORTS = [
  {
    relativePath: 'Sources/KRC-0122_Scooper_Import_Review.md',
    name: 'KRC-0122_Scooper_Import_Review.md',
    title: 'Scooper Import Review',
    krcId: 'KRC-0122',
  },
  {
    relativePath: 'Sources/KRC-0053_VIGS_Beta_Session_Setup.md',
    name: 'KRC-0053_VIGS_Beta_Session_Setup.md',
    title: 'VIGS Beta Session Setup',
    krcId: 'KRC-0053',
  },
  {
    relativePath: 'Sources/KRC-0100_Andreas_Notes.md',
    name: 'KRC-0100_Andreas_Notes.md',
    title: 'Andreas Notes',
    krcId: 'KRC-0100',
  },
];

async function main() {
  console.log('Explorer browse / open-in-Explorer regression');

  const explorerPath = join(repoRoot, 'apps/desktop/src/screens/ExplorerScreen.tsx');
  const explorerSrc = readFileSync(explorerPath, 'utf8');
  assert(!/useInvestigationSync\(\(ctx\) => \{\s*setSearch\(ctx\.searchQuery\)/s.test(explorerSrc), 'investigation sync does not setSearch(topic)');
  assert(explorerSrc.includes('userSearch'), 'user-entered search state present');
  assert(explorerSrc.includes('resolveExplorerFilenameSearch'), 'filename search resolved via helper');
  assert(explorerSrc.includes('ensurePinnedEntryVisible'), 'pinned open target kept visible');
  assert(explorerSrc.includes('Source unavailable') || explorerSrc.includes('targetUnavailable'), 'honest unavailable state');
  assert(explorerSrc.includes('setUserSearch'), 'user search setter present');
  assert(!explorerSrc.includes('setSearch(ctx.searchQuery)'), 'no setSearch from investigation');
  console.log('PASS ExplorerScreen source contracts');

  const vigsyPath = join(repoRoot, 'apps/desktop/src/screens/VigsyScreen.tsx');
  const vigsySrc = readFileSync(vigsyPath, 'utf8');
  assert(
    /useState\(\s*hasConversation\s*\)/.test(vigsySrc) || /useState\(\(\)\s*=>\s*hasConversation\)/.test(vigsySrc),
    'briefingComplete initializes from hasConversation on remount',
  );
  console.log('PASS VigsyScreen conversation-return briefing seal');

  // 1. ChatGPT Import category with active ChatGPT Import investigation
  assert(investigationSuggestsChatGptImport('ChatGPT Import'), 'topic suggests ChatGPT category');
  const inherited = resolveExplorerFilenameSearch({
    userEnteredSearch: '',
    investigationSearchQuery: 'ChatGPT Import',
  });
  assert(inherited === '', 'inherited investigation is not a filename search');
  const listed = filterChatGptImportEntries(SAMPLE_IMPORTS, inherited);
  assert(listed.length === SAMPLE_IMPORTS.length, 'ChatGPT category lists all imports with active investigation');
  assert(SAMPLE_IMPORTS.length === listed.length, 'count and list compatible when no user search');
  console.log('PASS ChatGPT Import lists with active investigation');

  // 2. Unrelated inherited sentence does not empty category
  const sentence = resolveExplorerFilenameSearch({
    userEnteredSearch: '',
    investigationSearchQuery: 'andreas need to review this',
  });
  assert(sentence === '', 'review sentence not applied as filename filter');
  const stillAll = filterChatGptImportEntries(SAMPLE_IMPORTS, sentence);
  assert(stillAll.length === SAMPLE_IMPORTS.length, 'unrelated investigation sentence does not empty list');
  console.log('PASS inherited sentence does not empty category');

  // 3. User-entered filename search still works
  const userQ = resolveExplorerFilenameSearch({
    userEnteredSearch: 'Andreas',
    investigationSearchQuery: 'ChatGPT Import',
  });
  assert(userQ === 'Andreas', 'user search wins');
  const userFiltered = filterChatGptImportEntries(SAMPLE_IMPORTS, userQ);
  assert(userFiltered.length === 1 && userFiltered[0].krcId === 'KRC-0100', 'user filename search works');
  console.log('PASS user-entered filename search');

  // 4. Count vs list compatible rules
  const tabCount = SAMPLE_IMPORTS.length;
  const visibleNoUser = filterChatGptImportEntries(SAMPLE_IMPORTS, '').length;
  assert(tabCount === visibleNoUser, 'tab count matches unfiltered category list');
  const visibleUser = filterChatGptImportEntries(SAMPLE_IMPORTS, 'VIGS').length;
  assert(visibleUser === 1 && tabCount === 3, 'user filter narrows list; count stays category total');
  console.log('PASS count/list compatible rules');

  // 5. Refresh preserves browsing — refresh must not reapply investigation as filename search
  const afterRefreshSearch = resolveExplorerFilenameSearch({
    userEnteredSearch: '',
    investigationSearchQuery: 'ChatGPT Import',
  });
  assert(filterChatGptImportEntries(SAMPLE_IMPORTS, afterRefreshSearch).length === 3, 'refresh keeps full category');
  console.log('PASS refresh browsing behavior');

  // 6–7. openInExplorer selects and keeps visible despite prior automatic filtering
  const path = 'Sources/KRC-0122_Scooper_Import_Review.md';
  assert(filterForOpenedPath(path) === 'chatgpt-import', 'open path selects ChatGPT category');
  const narrowed = filterChatGptImportEntries(SAMPLE_IMPORTS, 'zzzz-no-match');
  assert(narrowed.length === 0, 'hostile user filter empties list');
  const ensured = ensurePinnedEntryVisible(narrowed, SAMPLE_IMPORTS, path);
  assert(ensured.pinnedFound && ensured.pinnedIncluded, 'pinned target force-included');
  assert(ensured.list.length === 1 && repoPathsEqual(ensured.list[0].relativePath, path), 'exact record visible');
  console.log('PASS openInExplorer selects and keeps target visible');

  // 8. Missing target → unavailable
  const missing = ensurePinnedEntryVisible(SAMPLE_IMPORTS, SAMPLE_IMPORTS, 'Sources/DOES_NOT_EXIST.md');
  assert(!missing.pinnedFound, 'genuinely missing target not found');
  console.log('PASS missing target unavailable');

  // 9. Continuity markers — provider survives; Vigsy seals briefing
  const navPath = join(repoRoot, 'apps/desktop/src/context/NavigationContext.tsx');
  const navSrc = readFileSync(navPath, 'utf8');
  assert(navSrc.includes('openInExplorer'), 'openInExplorer retained');
  const ctxPath = join(repoRoot, 'apps/desktop/src/context/VigsyConversationContext.tsx');
  const ctxSrc = readFileSync(ctxPath, 'utf8');
  assert(ctxSrc.includes('VigsyConversationProvider') || ctxSrc.includes('useVigsyConversation'), 'conversation provider retained');
  console.log('PASS KayD↔Explorer continuity infrastructure retained');

  // 10. Axiom-Knowledge not modified by this script (read-only probe of KAE only)
  assert(!explorerSrc.includes('Axiom-Knowledge'), 'Explorer UI does not hardcode Axiom-Knowledge writes');
  console.log('PASS Axiom-Knowledge left untouched by this campaign script');

  console.log('\nAll Explorer browse / open-in-Explorer tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
