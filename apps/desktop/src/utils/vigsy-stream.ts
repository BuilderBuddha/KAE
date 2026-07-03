/** Simulates streaming by revealing text in chunks (deterministic answers have no server stream). */
export async function streamText(
  fullText: string,
  onChunk: (visible: string) => void,
  chunkSize = 3,
  delayMs = 12,
): Promise<void> {
  if (!fullText) {
    onChunk('');
    return;
  }

  let index = 0;
  while (index < fullText.length) {
    index = Math.min(fullText.length, index + chunkSize);
    onChunk(fullText.slice(0, index));
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
