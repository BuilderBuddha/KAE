import { BaseImporter } from '../registry.js';
import { ChatGptExportZipImporter } from '../chatgpt/chatgpt-zip-importer.js';

export { ChatGptExportZipImporter } from '../chatgpt/chatgpt-zip-importer.js';

export class PdfImporter extends BaseImporter {
  readonly id = 'pdf' as const;
  readonly name = 'PDF';
  readonly description = 'Import content from PDF documents.';
  readonly supportedExtensions = ['.pdf'] as const;
}

export class MarkdownImporter extends BaseImporter {
  readonly id = 'markdown' as const;
  readonly name = 'Markdown';
  readonly description = 'Import Markdown (.md) files.';
  readonly supportedExtensions = ['.md', '.markdown'] as const;
}

export class HtmlImporter extends BaseImporter {
  readonly id = 'html' as const;
  readonly name = 'HTML';
  readonly description = 'Import HTML web pages and exports.';
  readonly supportedExtensions = ['.html', '.htm'] as const;
}

export class DocxImporter extends BaseImporter {
  readonly id = 'docx' as const;
  readonly name = 'DOCX';
  readonly description = 'Import Microsoft Word documents.';
  readonly supportedExtensions = ['.docx'] as const;
}

export class TxtImporter extends BaseImporter {
  readonly id = 'txt' as const;
  readonly name = 'Plain Text';
  readonly description = 'Import plain text files.';
  readonly supportedExtensions = ['.txt'] as const;
}

/** All importer plugins. */
export const stubImporters = [
  new ChatGptExportZipImporter(),
  new PdfImporter(),
  new MarkdownImporter(),
  new HtmlImporter(),
  new DocxImporter(),
  new TxtImporter(),
];
