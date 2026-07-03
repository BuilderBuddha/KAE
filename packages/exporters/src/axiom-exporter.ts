import type { ExportContext, ExportResult, ParsedDocument } from '@scooper/core';
import { BaseExporter } from './registry.js';
import { writeAxiomSources } from './axiom/write-sources.js';

/** Exports structured knowledge to the Axiom Knowledge Repository. */
export class AxiomExporter extends BaseExporter {
  readonly id = 'axiom';
  readonly name = 'Axiom Knowledge Repository';

  async export(
    documents: ParsedDocument[],
    repositoryPath: string,
    context?: ExportContext,
  ): Promise<ExportResult> {
    return writeAxiomSources(documents, repositoryPath, context);
  }
}

export const axiomExporter = new AxiomExporter();
