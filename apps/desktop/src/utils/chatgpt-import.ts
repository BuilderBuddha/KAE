export const CHATGPT_IMPORT_KRC_MIN = 53;
export const CHATGPT_IMPORT_KRC_MAX = 122;

/** True for KRC-0053 … KRC-0122 ChatGPT import sources. */
export function isChatGptImportSourceFileName(fileName: string): boolean {
  const match = fileName.match(/^KRC-(\d{4})_/i);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= CHATGPT_IMPORT_KRC_MIN && num <= CHATGPT_IMPORT_KRC_MAX;
}
