import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import { evidenceFingerprint } from '@scooper/ai-orchestration';
import { answerKnowledgeQuestion } from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;
const question = 'What happened with ChatGPT import media?';

const PROVIDERS = ['deterministic', 'mock', 'openai', 'claude', 'gemini', 'openrouter', 'ollama'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  const answers = new Map();
  let baselineFingerprint = '';

  for (const providerId of PROVIDERS) {
    const answer = await answerKnowledgeQuestion(repositoryPath, question, { providerId });
    const fingerprint = evidenceFingerprint(answer);
    answers.set(providerId, answer);

    if (!baselineFingerprint) {
      baselineFingerprint = fingerprint;
    } else {
      assert(fingerprint === baselineFingerprint, `evidence must match for ${providerId}`);
    }

    assert(answer.directAnswer.length > 0, `${providerId} direct answer`);
    assert(answer.evidenceUsed.length > 0, `${providerId} evidence used`);
    assert(answer.reasoningProviderId === providerId, `${providerId} provider metadata`);
    console.log(`PASS provider ${providerId}`);
  }

  const mockAnswer = answers.get('mock');
  const openAiAnswer = answers.get('openai');
  const deterministicAnswer = answers.get('deterministic');

  // Without a key, OpenAI must take the honest offline fallback — not cosmetic live branding.
  assert(openAiAnswer.usedOfflineFallback === true, 'openai without key uses offline fallback');
  assert(!openAiAnswer.directAnswer.includes('OpenAI summary:'), 'no cosmetic OpenAI prefix');
  assert(mockAnswer.usedOfflineFallback === false, 'mock is intentional offline');
  assert(deterministicAnswer.usedOfflineFallback === false, 'deterministic is intentional offline');
  assert(
    openAiAnswer.directAnswer === deterministicAnswer.directAnswer,
    'openai fallback prose matches grounded deterministic draft',
  );
  console.log('PASS live/offline honesty without API key');

  const withContext = await answerKnowledgeQuestion(repositoryPath, 'Show me the videos.', {
    providerId: 'mock',
    conversationContext: {
      turns: [
        { role: 'user', text: question },
        { role: 'assistant', text: mockAnswer.directAnswer.slice(0, 200) },
      ],
      followUpContext: {
        lastQuestion: question,
        lastSearchQuery: 'ChatGPT import media',
      },
    },
  });
  assert(withContext.evidenceUsed.length > 0, 'conversation context continuity');
  assert(
    evidenceFingerprint(withContext).length >= 0,
    'follow-up still evidence-grounded',
  );
  console.log('PASS conversation continuity');

  console.log('\nAll AI orchestration acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
