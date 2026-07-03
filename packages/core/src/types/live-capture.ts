export type LiveCaptureSourceKind = 'chatgpt' | 'cursor' | 'pasted';

export interface LiveCaptureInput {
  title: string;
  transcript: string;
  sourceKind: LiveCaptureSourceKind;
  campaign?: string;
  notes?: string;
}

export interface LiveCaptureResult {
  krcId: string;
  sourceRelativePath: string;
  executiveSessionRelativePath: string;
  messageCount: number;
  evidenceIndexBuiltAt: string;
  relationshipIndexBuiltAt: string;
  briefingGeneratedAt: string;
}
