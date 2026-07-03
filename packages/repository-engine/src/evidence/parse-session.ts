export interface ParsedExecutiveSession {
  sessionId: string;
  title: string;
  linkedKrcId?: string;
  sessionDate?: string;
  summaryText: string;
  summaryReferences: string[];
  transcriptReference?: string;
}

function extractSection(content: string, heading: string): string | undefined {
  const pattern = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, 'm');
  const match = content.match(pattern);
  return match?.[1]?.trim();
}

/** Parses an Executive Session Record markdown file for indexing. */
export function parseExecutiveSessionMarkdown(
  content: string,
  fileName: string,
): ParsedExecutiveSession | null {
  const titleMatch = content.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? fileName.replace(/\.md$/i, '');
  const linkedKrcId = extractSection(content, 'Source ID');
  const sessionDate = extractSection(content, 'Session Date');
  const summaryText = extractSection(content, 'Session Summary') ?? '';
  const transcriptReference = extractSection(content, 'Transcript Reference');

  const summaryReferences: string[] = [];
  if (transcriptReference) summaryReferences.push(transcriptReference);

  for (const heading of ['Key Topics', 'Recurring Terms', 'Classification', 'Rationale']) {
    const section = extractSection(content, heading);
    if (!section) continue;
    for (const line of section.split('\n')) {
      const trimmed = line.replace(/^-\s*/, '').trim();
      if (trimmed) summaryReferences.push(trimmed);
    }
  }

  const sessionId = fileName.replace(/\.md$/i, '');

  return {
    sessionId,
    title,
    linkedKrcId,
    sessionDate,
    summaryText,
    summaryReferences: [...new Set(summaryReferences)],
    transcriptReference,
  };
}
