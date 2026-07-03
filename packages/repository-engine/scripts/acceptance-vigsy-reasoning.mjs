import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import { answerKnowledgeQuestion, buildEvidenceIndex } from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

const QUESTIONS = [
  'What did we decide about Repository Repair?',
  'Summarize POSCA UX.',
  'What happened with ChatGPT import media?',
  'Show evidence that videos work.',
  'What are the unresolved blockers in KAE?',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertGrounded(answer) {
  assert(answer.directAnswer?.trim(), 'direct answer required');
  assert(answer.reasonedSummary?.trim(), 'reasoned summary required');
  assert(answer.evidenceUsed.length > 0, 'supporting evidence required');
  assert(answer.confidence, 'confidence required');
  assert(['high', 'medium', 'low', 'insufficient'].includes(answer.confidence.level), 'valid confidence level');
  assert(answer.explorerLinks.length > 0, 'explorer links required');
  assert(
    answer.evidenceUsed.every((item) => item.explorerPath && item.excerpt),
    'evidence citations must have path and excerpt',
  );

  const combined = `${answer.directAnswer} ${answer.reasonedSummary}`.toLowerCase();
  assert(
    !combined.includes("i don't know") || answer.confidence.level === 'insufficient',
    'unsupported certainty when evidence is weak',
  );
}

async function testQuestion(question) {
  const answer = await answerKnowledgeQuestion(repositoryPath, question);
  assertGrounded(answer);
  console.log(`PASS ${question}`);
  console.log(`  intent=${answer.intent} confidence=${answer.confidence.level} evidence=${answer.evidenceUsed.length}`);
  return answer;
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);
  await buildEvidenceIndex(repositoryPath);

  const answers = [];
  for (const question of QUESTIONS) {
    answers.push(await testQuestion(question));
  }

  const repair = answers[0];
  assert(repair.intent === 'decision', 'repository repair uses decision intent');
  assert(repair.evidenceUsed.length >= 1, 'repository repair has evidence');

  const posca = answers[1];
  assert(posca.intent === 'summarize', 'POSCA UX uses summarize intent');

  const media = answers[2];
  assert(media.evidenceUsed.length >= 1, 'ChatGPT import media has evidence');
  assert(
    /media|chatgpt|import|asset|upload/i.test(media.directAnswer + media.reasonedSummary),
    'ChatGPT import media answer references media evidence',
  );

  const videos = answers[3];
  assert(videos.intent === 'show_evidence', 'videos question uses show_evidence intent');
  assert(
    videos.attachments.length > 0 || videos.evidenceUsed.some((item) => item.kind === 'attachment'),
    'videos question surfaces attachment evidence',
  );

  const blockers = answers[4];
  assert(blockers.intent === 'blockers', 'blockers question uses blockers intent');

  console.log('\nAll Vigsy acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
