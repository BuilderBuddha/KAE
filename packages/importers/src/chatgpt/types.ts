/** ChatGPT export conversation object from conversations.json. */
export interface ChatGptConversation {
  title?: string;
  create_time?: number;
  update_time?: number;
  conversation_id?: string;
  id?: string;
  current_node?: string;
  mapping?: Record<string, ChatGptMessageNode>;
}

/** A node in the ChatGPT conversation message tree. */
export interface ChatGptMessageNode {
  id: string;
  message?: ChatGptMessage | null;
  parent: string | null;
  children: string[];
}

/** Message payload inside a mapping node. */
export interface ChatGptMessage {
  id: string;
  author: {
    role: string;
    name?: string | null;
    metadata?: Record<string, unknown>;
  };
  create_time?: number | null;
  update_time?: number | null;
  content?: {
    content_type?: string;
    parts?: unknown[];
    text?: string;
  };
  metadata?: Record<string, unknown>;
}

/** Extracted message for source record generation. */
export interface ExtractedMessage {
  role: string;
  text: string;
  createTime?: number;
  isPastedTranscript: boolean;
  fileReferences: string[];
}

/** Parsed conversation ready for export. */
export interface ParsedChatGptConversation {
  conversationId: string;
  title: string;
  createTime?: number;
  updateTime?: number;
  messages: ExtractedMessage[];
  pastedTranscripts: string[];
  fileReferences: string[];
  assetPaths: string[];
}

/** Asset file extracted from the export ZIP. */
export interface ZipAssetEntry {
  zipPath: string;
  fileName: string;
  data?: Buffer;
}
