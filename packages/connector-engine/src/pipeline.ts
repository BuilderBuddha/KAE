import type {
  ConnectorContext,
  ConnectorStage,
  DiscoveredSource,
  ExtractedContent,
  FileReference,
  ImportPackage,
  ImporterFormatId,
  KnowledgeConnector,
  NormalizedDocument,
  ParsedDocument,
  ProvenanceRecord,
} from '@scooper/core';
import { classifyConversationBatch } from '@scooper/capability-engine';

function stageLog(
  context: ConnectorContext,
  stage: ConnectorStage,
  message: string,
): void {
  context.log?.('info', `[${stage}] ${message}`);
}

/** Maps normalized documents to parsed source records. */
export function generateSourceRecords(
  connectorId: string,
  normalized: NormalizedDocument[],
): ParsedDocument[] {
  return normalized.map((doc) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    format: doc.format as ImporterFormatId,
    metadata: {
      ...doc.metadata,
      connectorId,
    },
  }));
}

/** Generates provenance records for acquired knowledge items. */
export function generateProvenance(
  connectorId: string,
  source: FileReference,
  documents: ParsedDocument[],
): ProvenanceRecord[] {
  const acquiredAt = new Date().toISOString();
  return documents.map((doc) => ({
    id: doc.id,
    connectorId,
    sourceFile: source.name,
    acquiredAt,
    conversationId: String(doc.metadata.conversationId ?? doc.id),
    metadata: {
      title: doc.title,
      format: doc.format,
    },
  }));
}

/** Emits a complete import package from pipeline artifacts. */
export function emitImportPackage(
  connector: KnowledgeConnector,
  source: FileReference,
  documents: ParsedDocument[],
  provenance: ProvenanceRecord[],
): ImportPackage {
  const classifications = classifyConversationBatch(documents);
  return {
    connectorId: connector.id,
    source,
    documents,
    provenance,
    classifications,
    metadata: {
      documentCount: documents.length,
      emittedAt: new Date().toISOString(),
    },
  };
}

/** Runs the standard connector pipeline through emit (no repository writes). */
export async function runConnectorPipeline(
  connector: KnowledgeConnector,
  source: FileReference,
  context: ConnectorContext,
): Promise<ImportPackage> {
  const reportProgress = (stage: ConnectorStage, progress: number) => {
    context.onProgress?.(stage, progress);
  };

  const checkAborted = () => {
    if (context.signal?.aborted) {
      throw new Error('Operation cancelled.');
    }
  };

  checkAborted();
  reportProgress('discover', 5);
  stageLog(context, 'discover', `Discovering source: ${source.name}`);
  const discovered: DiscoveredSource = await connector.discover(source);

  checkAborted();
  reportProgress('extract', 20);
  stageLog(context, 'extract', 'Extracting raw content');
  const extracted: ExtractedContent = await connector.extract(discovered);

  checkAborted();
  reportProgress('normalize', 40);
  stageLog(context, 'normalize', 'Normalizing documents');
  const normalized: NormalizedDocument[] = await connector.normalize(extracted);

  reportProgress('validate', 55);
  stageLog(context, 'validate', `Validated ${normalized.length} document(s)`);

  reportProgress('classify', 70);
  stageLog(context, 'classify', 'Classifying knowledge items');

  reportProgress('provenance', 80);
  const documents = generateSourceRecords(connector.id, normalized);
  const provenance = generateProvenance(connector.id, source, documents);
  stageLog(context, 'provenance', `Generated ${provenance.length} provenance record(s)`);

  reportProgress('source-record', 90);
  stageLog(context, 'source-record', `Prepared ${documents.length} source record(s)`);

  reportProgress('emit', 100);
  const importPackage = emitImportPackage(connector, source, documents, provenance);
  stageLog(context, 'emit', 'Import package ready');
  return importPackage;
}
