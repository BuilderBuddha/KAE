import type { ConversationCategory, ConversationClassification, ParsedDocument } from '@scooper/core';

const ALL_CATEGORIES: ConversationCategory[] = [
  'VIGS',
  'Founder OS',
  'Axiom',
  'Book',
  'Knowledge Recovery',
  'Source Material',
  'Technical Build',
  'Other / Review Needed',
];

const SCORE_THRESHOLD = 2;
const UNCERTAIN_THRESHOLD = 3;

/** Maps categories to Sources subfolder names. */
export const CATEGORY_FOLDERS: Record<ConversationCategory, string> = {
  VIGS: 'VIGS',
  'Founder OS': 'Founder_OS',
  Axiom: 'Axiom',
  Book: 'Book',
  'Knowledge Recovery': 'Knowledge_Recovery',
  'Source Material': 'Source_Material',
  'Technical Build': 'Technical_Build',
  'Other / Review Needed': 'Other_Review_Needed',
};

const CATEGORY_KEYWORDS: Record<Exclude<ConversationCategory, 'Other / Review Needed'>, string[]> = {
  VIGS: [
    'vigs', 'financial wellness', 'audit', 'amortization', 'employer', 'pilot',
    'fiduciary', 'loan', 'annuity', 'cost report', 'benefits', 'retirement',
    'financial math', 'payment timing', 'auditor', 'wellness',
  ],
  'Founder OS': [
    'founder', 'notion', 'command center', 'operating system', 'productivity',
    'executive workspace', 'coaching', 'task system', 'campaign', 'playbook',
    'scorecard', 'workspace', 'habit', 'behavior design', 'tiny habits',
    'executive', 'company os', 'founder os',
  ],
  Axiom: [
    'axiom', 'ai workflow', 'agent', 'capability', 'knowledge repository',
    'automation', 'director mode', 'ai tool', 'llm', 'gpt', 'moat',
    'retrieval', 'orchestration', 'knowledge graph', 'decision intelligence',
    'ai-first', 'product strategy', 'distribution', 'gtm',
  ],
  Book: [
    'book', 'chapter', 'manuscript', 'outline', 'publisher', 'isbn',
    'foreword', 'preface', 'narrative arc', 'table of contents', 'writing',
  ],
  'Knowledge Recovery': [
    'krc', 'knowledge recovery', 'inventoried', 'capability extraction',
    'source registry', 'batch', 'recovery campaign', 'gold source',
  ],
  'Source Material': [
    'pasted', 'transcript', 'youtube', 'podcast', 'article', 'export',
    'html', 'pdf', 'screenshot', 'notes from', 'summary of', 'workshop',
    'lecture', 'interview', 'reference material',
  ],
  'Technical Build': [
    'code', 'typescript', 'javascript', 'react', 'electron', 'api', 'deploy',
    'git', 'npm', 'build', 'architecture', 'database', 'server', 'debug',
    'compile', 'function', 'component', 'vite', 'node', 'python', 'sql',
    'implementation', 'refactor', 'bug', 'test',
  ],
};

/** Classifies a parsed conversation document. */
export function classifyConversation(doc: ParsedDocument): ConversationClassification {
  const corpus = buildCorpus(doc);
  const recurringTerms = extractRecurringTerms(corpus);
  const categoryScores = scoreCategories(corpus, doc, recurringTerms);

  const ranked = ALL_CATEGORIES.filter((c) => c !== 'Other / Review Needed')
    .map((c) => ({ category: c, score: categoryScores[c] }))
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score ?? 0;
  const secondScore = ranked[1]?.score ?? 0;

  let categories: ConversationCategory[] = ranked
    .filter((r) => r.score >= SCORE_THRESHOLD)
    .map((r) => r.category);

  let uncertain = false;
  let primaryCategory: ConversationCategory;
  let rationale: string;

  if (topScore < UNCERTAIN_THRESHOLD || topScore === 0) {
    uncertain = true;
    primaryCategory = 'Other / Review Needed';
    categories = categories.length > 0 ? [...categories, 'Other / Review Needed'] : ['Other / Review Needed'];
    rationale = `Low classification confidence (top score ${topScore}). Routed to review.`;
  } else if (topScore === secondScore && topScore >= SCORE_THRESHOLD) {
    uncertain = true;
    primaryCategory = 'Other / Review Needed';
    categories = [...new Set<ConversationCategory>([...categories, 'Other / Review Needed'])];
    rationale = `Tied scores between "${ranked[0]?.category}" and "${ranked[1]?.category}". Routed to review.`;
  } else {
    primaryCategory = ranked[0].category;
    if (categories.length === 0) categories = [primaryCategory];
    rationale = `Primary match "${primaryCategory}" (score ${topScore}) from title, content, and recurring terms.`;
  }

  const messageCount = doc.metadata.messageCount;
  if (typeof messageCount === 'number' && messageCount === 0) {
    uncertain = true;
    primaryCategory = 'Other / Review Needed';
    if (!categories.includes('Other / Review Needed')) {
      categories = [...categories, 'Other / Review Needed'];
    }
    rationale = 'No extractable messages. Preserved for manual review.';
  }

  const confidence = Math.min(100, Math.round((topScore / Math.max(topScore + secondScore, 1)) * 100));

  return {
    categories: [...new Set(categories)],
    primaryCategory,
    confidence: uncertain ? Math.min(confidence, 40) : confidence,
    inferredProject: inferProject(primaryCategory, doc.title, recurringTerms),
    recurringTerms: recurringTerms.slice(0, 12),
    uncertain,
    rationale,
    categoryScores,
  };
}

/** Classifies a batch of documents automatically. */
export function classifyConversationBatch(
  documents: ParsedDocument[],
): Map<string, ConversationClassification> {
  const results = new Map<string, ConversationClassification>();
  for (const doc of documents) {
    results.set(String(doc.metadata.conversationId ?? doc.id), classifyConversation(doc));
  }
  return results;
}

function buildCorpus(doc: ParsedDocument): string {
  const fileRefs = Array.isArray(doc.metadata.fileReferences)
    ? doc.metadata.fileReferences.filter((r): r is string => typeof r === 'string').join(' ')
    : '';
  return `${doc.title} ${doc.content} ${fileRefs}`.toLowerCase();
}

function scoreCategories(
  corpus: string,
  doc: ParsedDocument,
  recurringTerms: string[],
): Record<ConversationCategory, number> {
  const scores = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, 0]),
  ) as Record<ConversationCategory, number>;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<ConversationCategory, 'Other / Review Needed'>,
    string[],
  ][]) {
    for (const kw of keywords) {
      if (corpus.includes(kw)) scores[category] += kw.includes(' ') ? 3 : 1;
    }
  }

  if (typeof doc.metadata.pastedTranscriptCount === 'number' && doc.metadata.pastedTranscriptCount > 0) {
    scores['Source Material'] += 4;
  }

  for (const term of recurringTerms.slice(0, 5)) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
      Exclude<ConversationCategory, 'Other / Review Needed'>,
      string[],
    ][]) {
      if (keywords.some((kw) => kw.includes(term) || term.includes(kw.split(' ')[0] ?? ''))) {
        scores[category] += 1;
      }
    }
  }

  scores['Other / Review Needed'] = 0;
  return scores;
}

function extractRecurringTerms(corpus: string): string[] {
  const words = corpus
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 5);

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function inferProject(
  primary: ConversationCategory,
  title: string,
  terms: string[],
): string {
  if (primary !== 'Other / Review Needed') return primary;
  const titleLower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<ConversationCategory, 'Other / Review Needed'>,
    string[],
  ][]) {
    if (keywords.some((kw) => titleLower.includes(kw))) return `${category} (uncertain)`;
  }
  if (terms.length > 0) return `Unlabeled — terms: ${terms.slice(0, 3).join(', ')}`;
  return 'Unlabeled';
}

export { ALL_CATEGORIES };
