import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import { buildExecutiveBriefing } from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cardByCategory(briefing, category) {
  return briefing.cards.find((card) => card.category === category);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);
  const briefing = await buildExecutiveBriefing(repositoryPath);
  console.log(`Awareness cards: ${briefing.cards.length}`);

  assert(briefing.cards.length >= 6, 'briefing should include six awareness categories');

  const decision = cardByCategory(briefing, 'recent_decision');
  assert(decision, 'recent decision card');
  assert(decision.evidenceLinks.length >= 1, 'recent decision evidence links');

  const blocker = cardByCategory(briefing, 'recent_blocker');
  assert(blocker, 'blocker card');
  assert(
    blocker.evidenceLinks.length >= 1 || blocker.isPlaceholder,
    'blocker card has evidence or placeholder',
  );

  const nextAction = cardByCategory(briefing, 'suggested_next_action');
  assert(nextAction, 'suggested next action card');
  assert(nextAction.evidenceLinks.length >= 1, 'suggested next action evidence links');

  const topic = cardByCategory(briefing, 'high_relationship_topic');
  assert(topic, 'high-relationship topic card');

  const health = cardByCategory(briefing, 'repository_health');
  assert(health, 'repository health card');
  assert(health.evidenceLinks.length >= 1, 'repository health evidence links');

  const cardsWithLinks = briefing.cards.filter((card) => card.evidenceLinks.length > 0);
  assert(cardsWithLinks.length >= 5, 'most cards include evidence links');

  console.log('PASS recent decision');
  console.log('PASS blocker');
  console.log('PASS suggested next actions');
  console.log('PASS high-relationship topic');
  console.log('PASS repository health');
  console.log(`PASS evidence links — ${cardsWithLinks.length}/${briefing.cards.length} cards`);
  console.log('\nAll executive awareness acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
