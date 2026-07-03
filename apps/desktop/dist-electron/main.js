var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { protocol, app, BrowserWindow, ipcMain, shell, clipboard, dialog } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import require$$0 from "fs";
import require$$1 from "path";
import require$$0$1 from "zlib";
import require$$0$2 from "crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
const APP_NAME = "KAE";
const APP_FULL_NAME = "Knowledge Acquisition Engine";
function getRepositoryStatusDisplay(health) {
  var _a, _b;
  if (!health) {
    return {
      level: "attention",
      headline: "Status Unknown",
      subline: "Unable to load repository health."
    };
  }
  const errorCount = ((_a = health.categorizedIssues) == null ? void 0 : _a.errors.length) ?? health.issues.filter((i) => i.severity === "error").length;
  const warningCount = ((_b = health.categorizedIssues) == null ? void 0 : _b.warnings.length) ?? health.issues.filter((i) => i.severity === "warning").length;
  if (errorCount > 0) {
    return {
      level: "critical",
      headline: "Repository Requires Attention",
      subline: `${errorCount} error(s) and ${warningCount} warning(s) detected.`
    };
  }
  if (warningCount > 0) {
    return {
      level: "attention",
      headline: "Repository Requires Attention",
      subline: `No errors. ${warningCount} warning(s) detected.`
    };
  }
  return {
    level: "healthy",
    headline: "Repository Healthy",
    subline: "No Issues Found"
  };
}
function categorizeHealthIssues(issues) {
  const result = {
    errors: [],
    warnings: [],
    information: [],
    recommendations: []
  };
  for (const issue2 of issues) {
    const cat = issue2.category ?? issue2.severity;
    if (cat === "error")
      result.errors.push(issue2);
    else if (cat === "warning")
      result.warnings.push(issue2);
    else if (cat === "recommendation")
      result.recommendations.push(issue2);
    else
      result.information.push(issue2);
  }
  return result;
}
class NotImplementedError extends Error {
  constructor(feature) {
    super(`${feature} is not implemented yet (Phase 1 architecture only).`);
    this.name = "NotImplementedError";
  }
}
const DEFAULT_REPOSITORY_PATH = "C:\\Users\\alber\\Axiom-Knowledge";
const DEFAULT_APP_SETTINGS = {
  theme: "dark",
  logLevel: "info",
  maxConcurrentJobs: 2,
  outputDirectory: "./output"
};
const DEFAULT_REPOSITORY_CONFIG = {
  path: DEFAULT_REPOSITORY_PATH,
  name: "Axiom Knowledge",
  autoSync: false
};
function createDefaultConfig() {
  return {
    repository: { ...DEFAULT_REPOSITORY_CONFIG },
    settings: { ...DEFAULT_APP_SETTINGS }
  };
}
function createImportJob(id, format, source) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id,
    format,
    source,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    progress: 0
  };
}
class InMemoryJobQueue {
  constructor() {
    __publicField(this, "jobs", []);
  }
  enqueue(job) {
    this.jobs.push(job);
  }
  dequeue() {
    const next = this.jobs.find((j) => j.status === "queued" || j.status === "pending");
    return next;
  }
  getAll() {
    return [...this.jobs];
  }
  getById(id) {
    return this.jobs.find((j) => j.id === id);
  }
  updateStatus(id, status, progress, error) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job)
      return;
    job.status = status;
    job.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (progress !== void 0)
      job.progress = progress;
    if (error !== void 0)
      job.error = error;
  }
  clear() {
    this.jobs = [];
  }
}
class BaseImporter {
  canImport(file) {
    var _a;
    const ext = ((_a = file.extension) == null ? void 0 : _a.toLowerCase()) ?? "";
    return this.supportedExtensions.some((e) => e.toLowerCase() === ext);
  }
  async import(_file, _context) {
    throw new NotImplementedError(`Importer "${this.name}"`);
  }
}
class ImporterRegistry {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(plugin) {
    this.plugins.set(plugin.id, plugin);
  }
  unregister(id) {
    this.plugins.delete(id);
  }
  get(id) {
    return this.plugins.get(id);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
  findForFile(file) {
    return this.getAll().find((p) => p.canImport(file));
  }
}
const importerRegistry = new ImporterRegistry();
const ALL_CATEGORIES = [
  "VIGS",
  "Founder OS",
  "Axiom",
  "Book",
  "Knowledge Recovery",
  "Source Material",
  "Technical Build",
  "Other / Review Needed"
];
const SCORE_THRESHOLD = 2;
const UNCERTAIN_THRESHOLD = 3;
const CATEGORY_KEYWORDS = {
  VIGS: [
    "vigs",
    "financial wellness",
    "audit",
    "amortization",
    "employer",
    "pilot",
    "fiduciary",
    "loan",
    "annuity",
    "cost report",
    "benefits",
    "retirement",
    "financial math",
    "payment timing",
    "auditor",
    "wellness"
  ],
  "Founder OS": [
    "founder",
    "notion",
    "command center",
    "operating system",
    "productivity",
    "executive workspace",
    "coaching",
    "task system",
    "campaign",
    "playbook",
    "scorecard",
    "workspace",
    "habit",
    "behavior design",
    "tiny habits",
    "executive",
    "company os",
    "founder os"
  ],
  Axiom: [
    "axiom",
    "ai workflow",
    "agent",
    "capability",
    "knowledge repository",
    "automation",
    "director mode",
    "ai tool",
    "llm",
    "gpt",
    "moat",
    "retrieval",
    "orchestration",
    "knowledge graph",
    "decision intelligence",
    "ai-first",
    "product strategy",
    "distribution",
    "gtm"
  ],
  Book: [
    "book",
    "chapter",
    "manuscript",
    "outline",
    "publisher",
    "isbn",
    "foreword",
    "preface",
    "narrative arc",
    "table of contents",
    "writing"
  ],
  "Knowledge Recovery": [
    "krc",
    "knowledge recovery",
    "inventoried",
    "capability extraction",
    "source registry",
    "batch",
    "recovery campaign",
    "gold source"
  ],
  "Source Material": [
    "pasted",
    "transcript",
    "youtube",
    "podcast",
    "article",
    "export",
    "html",
    "pdf",
    "screenshot",
    "notes from",
    "summary of",
    "workshop",
    "lecture",
    "interview",
    "reference material"
  ],
  "Technical Build": [
    "code",
    "typescript",
    "javascript",
    "react",
    "electron",
    "api",
    "deploy",
    "git",
    "npm",
    "build",
    "architecture",
    "database",
    "server",
    "debug",
    "compile",
    "function",
    "component",
    "vite",
    "node",
    "python",
    "sql",
    "implementation",
    "refactor",
    "bug",
    "test"
  ]
};
function classifyConversation(doc) {
  var _a, _b, _c, _d;
  const corpus = buildCorpus(doc);
  const recurringTerms = extractRecurringTerms(corpus);
  const categoryScores = scoreCategories(corpus, doc, recurringTerms);
  const ranked = ALL_CATEGORIES.filter((c) => c !== "Other / Review Needed").map((c) => ({ category: c, score: categoryScores[c] })).sort((a, b) => b.score - a.score);
  const topScore = ((_a = ranked[0]) == null ? void 0 : _a.score) ?? 0;
  const secondScore = ((_b = ranked[1]) == null ? void 0 : _b.score) ?? 0;
  let categories = ranked.filter((r) => r.score >= SCORE_THRESHOLD).map((r) => r.category);
  let uncertain = false;
  let primaryCategory;
  let rationale;
  if (topScore < UNCERTAIN_THRESHOLD || topScore === 0) {
    uncertain = true;
    primaryCategory = "Other / Review Needed";
    categories = categories.length > 0 ? [...categories, "Other / Review Needed"] : ["Other / Review Needed"];
    rationale = `Low classification confidence (top score ${topScore}). Routed to review.`;
  } else if (topScore === secondScore && topScore >= SCORE_THRESHOLD) {
    uncertain = true;
    primaryCategory = "Other / Review Needed";
    categories = [.../* @__PURE__ */ new Set([...categories, "Other / Review Needed"])];
    rationale = `Tied scores between "${(_c = ranked[0]) == null ? void 0 : _c.category}" and "${(_d = ranked[1]) == null ? void 0 : _d.category}". Routed to review.`;
  } else {
    primaryCategory = ranked[0].category;
    if (categories.length === 0)
      categories = [primaryCategory];
    rationale = `Primary match "${primaryCategory}" (score ${topScore}) from title, content, and recurring terms.`;
  }
  const messageCount = doc.metadata.messageCount;
  if (typeof messageCount === "number" && messageCount === 0) {
    uncertain = true;
    primaryCategory = "Other / Review Needed";
    if (!categories.includes("Other / Review Needed")) {
      categories = [...categories, "Other / Review Needed"];
    }
    rationale = "No extractable messages. Preserved for manual review.";
  }
  const confidence = Math.min(100, Math.round(topScore / Math.max(topScore + secondScore, 1) * 100));
  return {
    categories: [...new Set(categories)],
    primaryCategory,
    confidence: uncertain ? Math.min(confidence, 40) : confidence,
    inferredProject: inferProject(primaryCategory, doc.title, recurringTerms),
    recurringTerms: recurringTerms.slice(0, 12),
    uncertain,
    rationale,
    categoryScores
  };
}
function classifyConversationBatch(documents) {
  const results = /* @__PURE__ */ new Map();
  for (const doc of documents) {
    results.set(String(doc.metadata.conversationId ?? doc.id), classifyConversation(doc));
  }
  return results;
}
function buildCorpus(doc) {
  const fileRefs = Array.isArray(doc.metadata.fileReferences) ? doc.metadata.fileReferences.filter((r) => typeof r === "string").join(" ") : "";
  return `${doc.title} ${doc.content} ${fileRefs}`.toLowerCase();
}
function scoreCategories(corpus, doc, recurringTerms) {
  const scores = Object.fromEntries(ALL_CATEGORIES.map((c) => [c, 0]));
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (corpus.includes(kw))
        scores[category] += kw.includes(" ") ? 3 : 1;
    }
  }
  if (typeof doc.metadata.pastedTranscriptCount === "number" && doc.metadata.pastedTranscriptCount > 0) {
    scores["Source Material"] += 4;
  }
  for (const term of recurringTerms.slice(0, 5)) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => kw.includes(term) || term.includes(kw.split(" ")[0] ?? ""))) {
        scores[category] += 1;
      }
    }
  }
  scores["Other / Review Needed"] = 0;
  return scores;
}
function extractRecurringTerms(corpus) {
  const words = corpus.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length >= 5);
  const freq = /* @__PURE__ */ new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  return [...freq.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).map(([word]) => word);
}
function inferProject(primary, title, terms) {
  if (primary !== "Other / Review Needed")
    return primary;
  const titleLower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => titleLower.includes(kw)))
      return `${category} (uncertain)`;
  }
  if (terms.length > 0)
    return `Unlabeled — terms: ${terms.slice(0, 3).join(", ")}`;
  return "Unlabeled";
}
function generateSourceRecords(connectorId, normalized) {
  return normalized.map((doc) => ({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    format: doc.format,
    metadata: {
      ...doc.metadata,
      connectorId
    }
  }));
}
function generateProvenance(connectorId, source, documents) {
  const acquiredAt = (/* @__PURE__ */ new Date()).toISOString();
  return documents.map((doc) => ({
    id: doc.id,
    connectorId,
    sourceFile: source.name,
    acquiredAt,
    conversationId: String(doc.metadata.conversationId ?? doc.id),
    metadata: {
      title: doc.title,
      format: doc.format
    }
  }));
}
function emitImportPackage(connector, source, documents, provenance) {
  const classifications = classifyConversationBatch(documents);
  return {
    connectorId: connector.id,
    source,
    documents,
    provenance,
    classifications,
    metadata: {
      documentCount: documents.length,
      emittedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
const PASTED_TRANSCRIPT_MIN_LENGTH = 500;
const SKIP_ROLES = /* @__PURE__ */ new Set(["system"]);
function isChatGptExport(conversations) {
  if (!Array.isArray(conversations) || conversations.length === 0)
    return false;
  const sample = conversations[0];
  return typeof sample === "object" && sample !== null && "mapping" in sample && typeof sample.mapping === "object";
}
function parseConversationsJson(raw) {
  const data = parseConversationsJsonArray(raw);
  return data.map(parseConversation);
}
function parseConversationsJsonArray(raw) {
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("conversations.json must be a JSON array.");
  }
  if (!isChatGptExport(data)) {
    throw new Error("Unrecognized export format: expected ChatGPT conversations.json structure.");
  }
  return data;
}
async function parseConversationsIncremental(conversations, options = {}) {
  const { signal, batchSize = 25, onProgress } = options;
  const results = [];
  let messagesProcessed = 0;
  for (let i = 0; i < conversations.length; i++) {
    if (signal == null ? void 0 : signal.aborted) {
      throw new Error("Validation cancelled by user.");
    }
    const parsed = parseConversation(conversations[i]);
    results.push(parsed);
    messagesProcessed += parsed.messages.length;
    if (i % batchSize === 0 || i === conversations.length - 1) {
      onProgress == null ? void 0 : onProgress({
        conversationsTotal: conversations.length,
        conversationsProcessed: i + 1,
        messagesProcessed
      });
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
  return results;
}
function parseConversation(conv) {
  var _a;
  const conversationId = conv.conversation_id ?? conv.id ?? cryptoRandomId();
  const title = (((_a = conv.title) == null ? void 0 : _a.trim()) || "Untitled Conversation").slice(0, 200);
  const thread = extractActiveThread(conv);
  const messages = thread.map((node) => extractMessage(node.message)).filter((m) => m !== null);
  const pastedTranscripts = messages.filter((m) => m.isPastedTranscript).map((m) => m.text);
  const fileReferences = [...new Set(messages.flatMap((m) => m.fileReferences))];
  return {
    conversationId,
    title,
    createTime: conv.create_time,
    updateTime: conv.update_time,
    messages,
    pastedTranscripts,
    fileReferences,
    assetPaths: fileReferences
  };
}
function extractActiveThread(conv) {
  const mapping = conv.mapping ?? {};
  let nodeId = conv.current_node;
  if (!nodeId || !mapping[nodeId]) {
    nodeId = findLatestLeaf(mapping);
  }
  if (!nodeId)
    return [];
  const path2 = [];
  const visited = /* @__PURE__ */ new Set();
  while (nodeId && mapping[nodeId] && !visited.has(nodeId)) {
    visited.add(nodeId);
    path2.push(mapping[nodeId]);
    nodeId = mapping[nodeId].parent;
  }
  return path2.reverse();
}
function findLatestLeaf(mapping) {
  var _a;
  let bestId;
  let bestTime = -1;
  for (const node of Object.values(mapping)) {
    if (node.children.length > 0)
      continue;
    const time = ((_a = node.message) == null ? void 0 : _a.create_time) ?? 0;
    if (time >= bestTime) {
      bestTime = time;
      bestId = node.id;
    }
  }
  return bestId;
}
function extractMessage(message) {
  var _a;
  if (!((_a = message == null ? void 0 : message.author) == null ? void 0 : _a.role))
    return null;
  const role = message.author.role;
  if (SKIP_ROLES.has(role))
    return null;
  const text = extractMessageText(message).trim();
  if (!text)
    return null;
  const fileReferences = extractFileReferences(message, text);
  return {
    role,
    text,
    createTime: message.create_time ?? void 0,
    isPastedTranscript: role === "user" && text.length >= PASTED_TRANSCRIPT_MIN_LENGTH,
    fileReferences
  };
}
function extractMessageText(message) {
  const content = message.content;
  if (!content)
    return "";
  if (Array.isArray(content.parts)) {
    return content.parts.map((part) => {
      if (typeof part === "string")
        return part;
      if (part && typeof part === "object") {
        const obj = part;
        if (typeof obj.text === "string")
          return obj.text;
        if (typeof obj.content === "string")
          return obj.content;
      }
      return "";
    }).filter(Boolean).join("\n");
  }
  if (typeof content.text === "string")
    return content.text;
  return "";
}
function extractFileReferences(message, text) {
  const refs = [];
  const metadata = message.metadata ?? {};
  const attachments = metadata.attachments;
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att && typeof att === "object") {
        const obj = att;
        if (typeof obj.name === "string")
          refs.push(obj.name);
        if (typeof obj.id === "string")
          refs.push(obj.id);
      }
    }
  }
  const fileRegex = /(?:file-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|dalle-generations\/[^\s"']+|uploaded[^\s"']*\.[a-zA-Z0-9]+)/gi;
  const matches = text.match(fileRegex);
  if (matches)
    refs.push(...matches);
  return [...new Set(refs)];
}
function cryptoRandomId() {
  return `unknown-${Date.now()}`;
}
function buildTranscriptMarkdown(messages) {
  const lines = [];
  for (const msg of messages) {
    const heading = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : msg.role;
    lines.push(`### ${heading}`);
    if (msg.createTime) {
      lines.push(`*${formatUnixTime(msg.createTime)}*`);
    }
    lines.push("");
    lines.push(msg.text);
    lines.push("");
    if (msg.fileReferences.length > 0) {
      lines.push("**File references:**");
      for (const ref of msg.fileReferences) {
        lines.push(`- ${ref}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}
function formatUnixTime(ts) {
  const ms = ts > 1e12 ? ts : ts * 1e3;
  return new Date(ms).toISOString();
}
function conversationToDocument(conv, assets, options = {}) {
  const { sharedAssetList } = options;
  const transcript = buildTranscriptMarkdown(conv.messages);
  const pastedSection = conv.pastedTranscripts.length > 0 ? `

## Pasted Source Text

${conv.pastedTranscripts.join("\n\n---\n\n")}` : "";
  const relatedAssets = assets.filter((a) => conv.fileReferences.some((ref) => a.zipPath.includes(ref) || a.fileName.includes(ref)) || conv.assetPaths.some((ref) => a.zipPath.includes(ref)));
  const metadata = {
    conversationId: conv.conversationId,
    createTime: conv.createTime,
    updateTime: conv.updateTime,
    messageCount: conv.messages.length,
    userMessageCount: conv.messages.filter((m) => m.role === "user").length,
    assistantMessageCount: conv.messages.filter((m) => m.role === "assistant").length,
    pastedTranscriptCount: conv.pastedTranscripts.length,
    fileReferences: conv.fileReferences
  };
  if (relatedAssets.length > 0) {
    metadata.assets = relatedAssets.map((a) => ({
      zipPath: a.zipPath,
      fileName: a.fileName
    }));
  }
  if (sharedAssetList) {
    metadata.allZipAssets = sharedAssetList;
  }
  return {
    id: conv.conversationId,
    title: conv.title,
    content: `${transcript}${pastedSection}`,
    format: "chatgpt-export-zip",
    metadata
  };
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var util = { exports: {} };
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  constants = {
    /* The local file header */
    LOCHDR: 30,
    // LOC header size
    LOCSIG: 67324752,
    // "PK\003\004"
    LOCVER: 4,
    // version needed to extract
    LOCFLG: 6,
    // general purpose bit flag
    LOCHOW: 8,
    // compression method
    LOCTIM: 10,
    // modification time (2 bytes time, 2 bytes date)
    LOCCRC: 14,
    // uncompressed file crc-32 value
    LOCSIZ: 18,
    // compressed size
    LOCLEN: 22,
    // uncompressed size
    LOCNAM: 26,
    // filename length
    LOCEXT: 28,
    // extra field length
    /* The Data descriptor */
    EXTSIG: 134695760,
    // "PK\007\008"
    EXTHDR: 16,
    // EXT header size
    EXTCRC: 4,
    // uncompressed file crc-32 value
    EXTSIZ: 8,
    // compressed size
    EXTLEN: 12,
    // uncompressed size
    /* The central directory file header */
    CENHDR: 46,
    // CEN header size
    CENSIG: 33639248,
    // "PK\001\002"
    CENVEM: 4,
    // version made by
    CENVER: 6,
    // version needed to extract
    CENFLG: 8,
    // encrypt, decrypt flags
    CENHOW: 10,
    // compression method
    CENTIM: 12,
    // modification time (2 bytes time, 2 bytes date)
    CENCRC: 16,
    // uncompressed file crc-32 value
    CENSIZ: 20,
    // compressed size
    CENLEN: 24,
    // uncompressed size
    CENNAM: 28,
    // filename length
    CENEXT: 30,
    // extra field length
    CENCOM: 32,
    // file comment length
    CENDSK: 34,
    // volume number start
    CENATT: 36,
    // internal file attributes
    CENATX: 38,
    // external file attributes (host system dependent)
    CENOFF: 42,
    // LOC header offset
    /* The entries in the end of central directory */
    ENDHDR: 22,
    // END header size
    ENDSIG: 101010256,
    // "PK\005\006"
    ENDSUB: 8,
    // number of entries on this disk
    ENDTOT: 10,
    // total number of entries
    ENDSIZ: 12,
    // central directory size in bytes
    ENDOFF: 16,
    // offset of first CEN header
    ENDCOM: 20,
    // zip file comment length
    END64HDR: 20,
    // zip64 END header size
    END64SIG: 117853008,
    // zip64 Locator signature, "PK\006\007"
    END64START: 4,
    // number of the disk with the start of the zip64
    END64OFF: 8,
    // relative offset of the zip64 end of central directory
    END64NUMDISKS: 16,
    // total number of disks
    ZIP64SIG: 101075792,
    // zip64 signature, "PK\006\006"
    ZIP64HDR: 56,
    // zip64 record minimum size
    ZIP64LEAD: 12,
    // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
    ZIP64SIZE: 4,
    // zip64 size of the central directory record
    ZIP64VEM: 12,
    // zip64 version made by
    ZIP64VER: 14,
    // zip64 version needed to extract
    ZIP64DSK: 16,
    // zip64 number of this disk
    ZIP64DSKDIR: 20,
    // number of the disk with the start of the record directory
    ZIP64SUB: 24,
    // number of entries on this disk
    ZIP64TOT: 32,
    // total number of entries
    ZIP64SIZB: 40,
    // zip64 central directory size in bytes
    ZIP64OFF: 48,
    // offset of start of central directory with respect to the starting disk number
    ZIP64EXTRA: 56,
    // extensible data sector
    /* Compression methods */
    STORED: 0,
    // no compression
    SHRUNK: 1,
    // shrunk
    REDUCED1: 2,
    // reduced with compression factor 1
    REDUCED2: 3,
    // reduced with compression factor 2
    REDUCED3: 4,
    // reduced with compression factor 3
    REDUCED4: 5,
    // reduced with compression factor 4
    IMPLODED: 6,
    // imploded
    // 7 reserved for Tokenizing compression algorithm
    DEFLATED: 8,
    // deflated
    ENHANCED_DEFLATED: 9,
    // enhanced deflated
    PKWARE: 10,
    // PKWare DCL imploded
    // 11 reserved by PKWARE
    BZIP2: 12,
    //  compressed using BZIP2
    // 13 reserved by PKWARE
    LZMA: 14,
    // LZMA
    // 15-17 reserved by PKWARE
    IBM_TERSE: 18,
    // compressed using IBM TERSE
    IBM_LZ77: 19,
    // IBM LZ77 z
    AES_ENCRYPT: 99,
    // WinZIP AES encryption method
    /* General purpose bit flag */
    // values can obtained with expression 2**bitnr
    FLG_ENC: 1,
    // Bit 0: encrypted file
    FLG_COMP1: 2,
    // Bit 1, compression option
    FLG_COMP2: 4,
    // Bit 2, compression option
    FLG_DESC: 8,
    // Bit 3, data descriptor
    FLG_ENH: 16,
    // Bit 4, enhanced deflating
    FLG_PATCH: 32,
    // Bit 5, indicates that the file is compressed patched data.
    FLG_STR: 64,
    // Bit 6, strong encryption (patented)
    // Bits 7-10: Currently unused.
    FLG_EFS: 2048,
    // Bit 11: Language encoding flag (EFS)
    // Bit 12: Reserved by PKWARE for enhanced compression.
    // Bit 13: encrypted the Central Directory (patented).
    // Bits 14-15: Reserved by PKWARE.
    FLG_MSK: 4096,
    // mask header values
    /* Load type */
    FILE: 2,
    BUFFER: 1,
    NONE: 0,
    /* 4.5 Extensible data fields */
    EF_ID: 0,
    EF_SIZE: 2,
    /* Header IDs */
    ID_ZIP64: 1,
    ID_AVINFO: 7,
    ID_PFS: 8,
    ID_OS2: 9,
    ID_NTFS: 10,
    ID_OPENVMS: 12,
    ID_UNIX: 13,
    ID_FORK: 14,
    ID_PATCH: 15,
    ID_X509_PKCS7: 20,
    ID_X509_CERTID_F: 21,
    ID_X509_CERTID_C: 22,
    ID_STRONGENC: 23,
    ID_RECORD_MGT: 24,
    ID_X509_PKCS7_RL: 25,
    ID_IBM1: 101,
    ID_IBM2: 102,
    ID_POSZIP: 18064,
    EF_ZIP64_OR_32: 4294967295,
    EF_ZIP64_OR_16: 65535,
    EF_ZIP64_SUNCOMP: 0,
    EF_ZIP64_SCOMP: 8,
    EF_ZIP64_RHO: 16,
    EF_ZIP64_DSN: 24
  };
  return constants;
}
var errors = {};
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  (function(exports) {
    const errors2 = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function E(message) {
      return function(...args) {
        if (args.length) {
          message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
        }
        return new Error("ADM-ZIP: " + message);
      };
    }
    for (const msg of Object.keys(errors2)) {
      exports[msg] = E(errors2[msg]);
    }
  })(errors);
  return errors;
}
var utils;
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  const fsystem = require$$0;
  const pth = require$$1;
  const Constants = requireConstants();
  const Errors = requireErrors();
  const isWin = typeof process === "object" && "win32" === process.platform;
  const is_Obj = (obj) => typeof obj === "object" && obj !== null;
  const crcTable = new Uint32Array(256).map((t, c) => {
    for (let k = 0; k < 8; k++) {
      if ((c & 1) !== 0) {
        c = 3988292384 ^ c >>> 1;
      } else {
        c >>>= 1;
      }
    }
    return c >>> 0;
  });
  function Utils(opts) {
    this.sep = pth.sep;
    this.fs = fsystem;
    if (is_Obj(opts)) {
      if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
        this.fs = opts.fs;
      }
    }
  }
  utils = Utils;
  Utils.prototype.makeDir = function(folder) {
    const self = this;
    function mkdirSync(fpath) {
      let resolvedPath = fpath.split(self.sep)[0];
      fpath.split(self.sep).forEach(function(name) {
        if (!name || name.substr(-1, 1) === ":") return;
        resolvedPath += self.sep + name;
        var stat;
        try {
          stat = self.fs.statSync(resolvedPath);
        } catch (e) {
          if (e.message && e.message.startsWith("ENOENT")) {
            self.fs.mkdirSync(resolvedPath);
          } else {
            throw e;
          }
        }
        if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
      });
    }
    mkdirSync(folder);
  };
  Utils.prototype.writeFileTo = function(path2, content, overwrite, attr) {
    const self = this;
    if (self.fs.existsSync(path2)) {
      if (!overwrite) return false;
      var stat = self.fs.statSync(path2);
      if (stat.isDirectory()) {
        return false;
      }
    }
    var folder = pth.dirname(path2);
    if (!self.fs.existsSync(folder)) {
      self.makeDir(folder);
    }
    var fd;
    try {
      fd = self.fs.openSync(path2, "w", 438);
    } catch (e) {
      self.fs.chmodSync(path2, 438);
      fd = self.fs.openSync(path2, "w", 438);
    }
    if (fd) {
      try {
        self.fs.writeSync(fd, content, 0, content.length, 0);
      } finally {
        self.fs.closeSync(fd);
      }
    }
    self.fs.chmodSync(path2, attr || 438);
    return true;
  };
  Utils.prototype.writeFileToAsync = function(path2, content, overwrite, attr, callback) {
    if (typeof attr === "function") {
      callback = attr;
      attr = void 0;
    }
    const self = this;
    self.fs.exists(path2, function(exist) {
      if (exist && !overwrite) return callback(false);
      self.fs.stat(path2, function(err, stat) {
        if (exist && stat.isDirectory()) {
          return callback(false);
        }
        var folder = pth.dirname(path2);
        self.fs.exists(folder, function(exists) {
          if (!exists) self.makeDir(folder);
          self.fs.open(path2, "w", 438, function(err2, fd) {
            if (err2) {
              self.fs.chmod(path2, 438, function() {
                self.fs.open(path2, "w", 438, function(err3, fd2) {
                  self.fs.write(fd2, content, 0, content.length, 0, function() {
                    self.fs.close(fd2, function() {
                      self.fs.chmod(path2, attr || 438, function() {
                        callback(true);
                      });
                    });
                  });
                });
              });
            } else if (fd) {
              self.fs.write(fd, content, 0, content.length, 0, function() {
                self.fs.close(fd, function() {
                  self.fs.chmod(path2, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            } else {
              self.fs.chmod(path2, attr || 438, function() {
                callback(true);
              });
            }
          });
        });
      });
    });
  };
  Utils.prototype.findFiles = function(path2) {
    const self = this;
    function findSync(dir, pattern, recursive) {
      let files = [];
      self.fs.readdirSync(dir).forEach(function(file) {
        const path3 = pth.join(dir, file);
        const stat = self.fs.statSync(path3);
        {
          files.push(pth.normalize(path3) + (stat.isDirectory() ? self.sep : ""));
        }
        if (stat.isDirectory() && recursive) files = files.concat(findSync(path3, pattern, recursive));
      });
      return files;
    }
    return findSync(path2, void 0, true);
  };
  Utils.prototype.findFilesAsync = function(dir, cb) {
    const self = this;
    let results = [];
    self.fs.readdir(dir, function(err, list) {
      if (err) return cb(err);
      let list_length = list.length;
      if (!list_length) return cb(null, results);
      list.forEach(function(file) {
        file = pth.join(dir, file);
        self.fs.stat(file, function(err2, stat) {
          if (err2) return cb(err2);
          if (stat) {
            results.push(pth.normalize(file) + (stat.isDirectory() ? self.sep : ""));
            if (stat.isDirectory()) {
              self.findFilesAsync(file, function(err3, res) {
                if (err3) return cb(err3);
                results = results.concat(res);
                if (!--list_length) cb(null, results);
              });
            } else {
              if (!--list_length) cb(null, results);
            }
          }
        });
      });
    });
  };
  Utils.prototype.getAttributes = function() {
  };
  Utils.prototype.setAttributes = function() {
  };
  Utils.crc32update = function(crc, byte) {
    return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  };
  Utils.crc32 = function(buf) {
    if (typeof buf === "string") {
      buf = Buffer.from(buf, "utf8");
    }
    let len = buf.length;
    let crc = -1;
    for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
    return ~crc >>> 0;
  };
  Utils.methodToString = function(method) {
    switch (method) {
      case Constants.STORED:
        return "STORED (" + method + ")";
      case Constants.DEFLATED:
        return "DEFLATED (" + method + ")";
      default:
        return "UNSUPPORTED (" + method + ")";
    }
  };
  Utils.canonical = function(path2) {
    if (!path2) return "";
    const safeSuffix = pth.posix.normalize("/" + path2.split("\\").join("/"));
    return pth.join(".", safeSuffix);
  };
  Utils.zipnamefix = function(path2) {
    if (!path2) return "";
    const safeSuffix = pth.posix.normalize("/" + path2.split("\\").join("/"));
    return pth.posix.join(".", safeSuffix);
  };
  Utils.findLast = function(arr, callback) {
    if (!Array.isArray(arr)) throw new TypeError("arr is not array");
    const len = arr.length >>> 0;
    for (let i = len - 1; i >= 0; i--) {
      if (callback(arr[i], i, arr)) {
        return arr[i];
      }
    }
    return void 0;
  };
  Utils.sanitize = function(prefix, name) {
    prefix = pth.resolve(pth.normalize(prefix));
    var parts = name.split("/");
    for (var i = 0, l = parts.length; i < l; i++) {
      var path2 = pth.normalize(pth.join(prefix, parts.slice(i, l).join(pth.sep)));
      if (path2 === prefix || path2.startsWith(prefix + pth.sep)) {
        return path2;
      }
    }
    return pth.normalize(pth.join(prefix, pth.basename(name)));
  };
  Utils.toBuffer = function toBuffer(input, encoder) {
    if (Buffer.isBuffer(input)) {
      return input;
    } else if (input instanceof Uint8Array) {
      return Buffer.from(input);
    } else {
      return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
    }
  };
  Utils.readBigUInt64LE = function(buffer, index) {
    const lo = buffer.readUInt32LE(index);
    const hi = buffer.readUInt32LE(index + 4);
    return hi * 4294967296 + lo;
  };
  Utils.writeBigUInt64LE = function(buffer, value, index) {
    const lo = value >>> 0;
    const hi = Math.floor(value / 4294967296) >>> 0;
    buffer.writeUInt32LE(lo, index);
    buffer.writeUInt32LE(hi, index + 4);
  };
  Utils.fromDOS2Date = function(val) {
    return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
  };
  Utils.fromDate2DOS = function(val) {
    let date = 0;
    let time = 0;
    if (val.getFullYear() > 1979) {
      date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
      time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
    }
    return date << 16 | time;
  };
  Utils.isWin = isWin;
  Utils.crcTable = crcTable;
  return utils;
}
var fattr;
var hasRequiredFattr;
function requireFattr() {
  if (hasRequiredFattr) return fattr;
  hasRequiredFattr = 1;
  const pth = require$$1;
  fattr = function(path2, { fs: fs2 }) {
    var _path = path2 || "", _obj = newAttr(), _stat = null;
    function newAttr() {
      return {
        directory: false,
        readonly: false,
        hidden: false,
        executable: false,
        mtime: 0,
        atime: 0
      };
    }
    if (_path && fs2.existsSync(_path)) {
      _stat = fs2.statSync(_path);
      _obj.directory = _stat.isDirectory();
      _obj.mtime = _stat.mtime;
      _obj.atime = _stat.atime;
      _obj.executable = (73 & _stat.mode) !== 0;
      _obj.readonly = (128 & _stat.mode) === 0;
      _obj.hidden = pth.basename(_path)[0] === ".";
    } else {
      console.warn("Invalid path: " + _path);
    }
    return {
      get directory() {
        return _obj.directory;
      },
      get readOnly() {
        return _obj.readonly;
      },
      get hidden() {
        return _obj.hidden;
      },
      get mtime() {
        return _obj.mtime;
      },
      get atime() {
        return _obj.atime;
      },
      get executable() {
        return _obj.executable;
      },
      decodeAttributes: function() {
      },
      encodeAttributes: function() {
      },
      toJSON: function() {
        return {
          path: _path,
          isDirectory: _obj.directory,
          isReadOnly: _obj.readonly,
          isHidden: _obj.hidden,
          isExecutable: _obj.executable,
          mTime: _obj.mtime,
          aTime: _obj.atime
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return fattr;
}
var decoder;
var hasRequiredDecoder;
function requireDecoder() {
  if (hasRequiredDecoder) return decoder;
  hasRequiredDecoder = 1;
  decoder = {
    efs: true,
    encode: (data) => Buffer.from(data, "utf8"),
    decode: (data) => data.toString("utf8")
  };
  return decoder;
}
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util.exports;
  hasRequiredUtil = 1;
  util.exports = requireUtils();
  util.exports.Constants = requireConstants();
  util.exports.Errors = requireErrors();
  util.exports.FileAttr = requireFattr();
  util.exports.decoder = requireDecoder();
  return util.exports;
}
var headers = {};
var entryHeader;
var hasRequiredEntryHeader;
function requireEntryHeader() {
  if (hasRequiredEntryHeader) return entryHeader;
  hasRequiredEntryHeader = 1;
  var Utils = requireUtil(), Constants = Utils.Constants;
  entryHeader = function() {
    var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
    _verMade |= Utils.isWin ? 2560 : 768;
    _flags |= Constants.FLG_EFS;
    const _localHeader = {
      extraLen: 0
    };
    const uint32 = (val) => Math.max(0, val) >>> 0;
    const uint8 = (val) => Math.max(0, val) & 255;
    _time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
    return {
      get made() {
        return _verMade;
      },
      set made(val) {
        _verMade = val;
      },
      get version() {
        return _version;
      },
      set version(val) {
        _version = val;
      },
      get flags() {
        return _flags;
      },
      set flags(val) {
        _flags = val;
      },
      get flags_efs() {
        return (_flags & Constants.FLG_EFS) > 0;
      },
      set flags_efs(val) {
        if (val) {
          _flags |= Constants.FLG_EFS;
        } else {
          _flags &= ~Constants.FLG_EFS;
        }
      },
      get flags_desc() {
        return (_flags & Constants.FLG_DESC) > 0;
      },
      set flags_desc(val) {
        if (val) {
          _flags |= Constants.FLG_DESC;
        } else {
          _flags &= ~Constants.FLG_DESC;
        }
      },
      get method() {
        return _method;
      },
      set method(val) {
        switch (val) {
          case Constants.STORED:
            this.version = 10;
            break;
          case Constants.DEFLATED:
          default:
            this.version = 20;
        }
        _method = val;
      },
      get time() {
        return Utils.fromDOS2Date(this.timeval);
      },
      set time(val) {
        val = new Date(val);
        this.timeval = Utils.fromDate2DOS(val);
      },
      get timeval() {
        return _time;
      },
      set timeval(val) {
        _time = uint32(val);
      },
      get timeHighByte() {
        return uint8(_time >>> 8);
      },
      get crc() {
        return _crc;
      },
      set crc(val) {
        _crc = uint32(val);
      },
      get compressedSize() {
        return _compressedSize;
      },
      set compressedSize(val) {
        _compressedSize = uint32(val);
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = uint32(val);
      },
      get fileNameLength() {
        return _fnameLen;
      },
      set fileNameLength(val) {
        _fnameLen = val;
      },
      get extraLength() {
        return _extraLen;
      },
      set extraLength(val) {
        _extraLen = val;
      },
      get extraLocalLength() {
        return _localHeader.extraLen;
      },
      set extraLocalLength(val) {
        _localHeader.extraLen = val;
      },
      get commentLength() {
        return _comLen;
      },
      set commentLength(val) {
        _comLen = val;
      },
      get diskNumStart() {
        return _diskStart;
      },
      set diskNumStart(val) {
        _diskStart = uint32(val);
      },
      get inAttr() {
        return _inattr;
      },
      set inAttr(val) {
        _inattr = uint32(val);
      },
      get attr() {
        return _attr;
      },
      set attr(val) {
        _attr = uint32(val);
      },
      // get Unix file permissions
      get fileAttr() {
        return (_attr || 0) >> 16 & 4095;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = uint32(val);
      },
      get encrypted() {
        return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
      },
      get centralHeaderSize() {
        return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
      },
      get realDataOffset() {
        return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
      },
      get localHeader() {
        return _localHeader;
      },
      loadLocalHeaderFromBinary: function(input) {
        var data = input.slice(_offset, _offset + Constants.LOCHDR);
        if (data.readUInt32LE(0) !== Constants.LOCSIG) {
          throw Utils.Errors.INVALID_LOC();
        }
        _localHeader.version = data.readUInt16LE(Constants.LOCVER);
        _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
        _localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
        _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
        _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
        _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
        _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
        _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
        _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
        _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
        const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
        const extraEnd = extraStart + _localHeader.extraLen;
        return input.slice(extraStart, extraEnd);
      },
      loadFromBinary: function(data) {
        if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
          throw Utils.Errors.INVALID_CEN();
        }
        _verMade = data.readUInt16LE(Constants.CENVEM);
        _version = data.readUInt16LE(Constants.CENVER);
        _flags = data.readUInt16LE(Constants.CENFLG);
        _method = data.readUInt16LE(Constants.CENHOW);
        _time = data.readUInt32LE(Constants.CENTIM);
        _crc = data.readUInt32LE(Constants.CENCRC);
        _compressedSize = data.readUInt32LE(Constants.CENSIZ);
        _size = data.readUInt32LE(Constants.CENLEN);
        _fnameLen = data.readUInt16LE(Constants.CENNAM);
        _extraLen = data.readUInt16LE(Constants.CENEXT);
        _comLen = data.readUInt16LE(Constants.CENCOM);
        _diskStart = data.readUInt16LE(Constants.CENDSK);
        _inattr = data.readUInt16LE(Constants.CENATT);
        _attr = data.readUInt32LE(Constants.CENATX);
        _offset = data.readUInt32LE(Constants.CENOFF);
      },
      localHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.LOCHDR);
        data.writeUInt32LE(Constants.LOCSIG, 0);
        data.writeUInt16LE(_version, Constants.LOCVER);
        data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.LOCFLG);
        data.writeUInt16LE(_method, Constants.LOCHOW);
        data.writeUInt32LE(_time, Constants.LOCTIM);
        data.writeUInt32LE(_crc, Constants.LOCCRC);
        data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
        data.writeUInt32LE(_size, Constants.LOCLEN);
        data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
        data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
        return data;
      },
      centralHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
        data.writeUInt32LE(Constants.CENSIG, 0);
        data.writeUInt16LE(_verMade, Constants.CENVEM);
        data.writeUInt16LE(_version, Constants.CENVER);
        data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.CENFLG);
        data.writeUInt16LE(_method, Constants.CENHOW);
        data.writeUInt32LE(_time, Constants.CENTIM);
        data.writeUInt32LE(_crc, Constants.CENCRC);
        data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
        data.writeUInt32LE(_size, Constants.CENLEN);
        data.writeUInt16LE(_fnameLen, Constants.CENNAM);
        data.writeUInt16LE(_extraLen, Constants.CENEXT);
        data.writeUInt16LE(_comLen, Constants.CENCOM);
        data.writeUInt16LE(_diskStart, Constants.CENDSK);
        data.writeUInt16LE(_inattr, Constants.CENATT);
        data.writeUInt32LE(_attr, Constants.CENATX);
        data.writeUInt32LE(_offset, Constants.CENOFF);
        return data;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return nr + " bytes";
        };
        return {
          made: _verMade,
          version: _version,
          flags: _flags,
          method: Utils.methodToString(_method),
          time: this.time,
          crc: "0x" + _crc.toString(16).toUpperCase(),
          compressedSize: bytes(_compressedSize),
          size: bytes(_size),
          fileNameLength: bytes(_fnameLen),
          extraLength: bytes(_extraLen),
          commentLength: bytes(_comLen),
          diskNumStart: _diskStart,
          inAttr: _inattr,
          attr: _attr,
          offset: _offset,
          centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return entryHeader;
}
var mainHeader;
var hasRequiredMainHeader;
function requireMainHeader() {
  if (hasRequiredMainHeader) return mainHeader;
  hasRequiredMainHeader = 1;
  var Utils = requireUtil(), Constants = Utils.Constants;
  mainHeader = function() {
    var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
    const needsZip64 = () => _volumeEntries > Constants.EF_ZIP64_OR_16 || _totalEntries > Constants.EF_ZIP64_OR_16 || _size > Constants.EF_ZIP64_OR_32 || _offset > Constants.EF_ZIP64_OR_32;
    return {
      get diskEntries() {
        return _volumeEntries;
      },
      set diskEntries(val) {
        _volumeEntries = _totalEntries = val;
      },
      get totalEntries() {
        return _totalEntries;
      },
      set totalEntries(val) {
        _totalEntries = _volumeEntries = val;
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = val;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = val;
      },
      get commentLength() {
        return _commentLength;
      },
      set commentLength(val) {
        _commentLength = val;
      },
      get mainHeaderSize() {
        return (needsZip64() ? Constants.ZIP64HDR + Constants.END64HDR : 0) + Constants.ENDHDR + _commentLength;
      },
      loadFromBinary: function(data) {
        if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
          throw Utils.Errors.INVALID_END();
        }
        if (data.readUInt32LE(0) === Constants.ENDSIG) {
          _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
          _totalEntries = data.readUInt16LE(Constants.ENDTOT);
          _size = data.readUInt32LE(Constants.ENDSIZ);
          _offset = data.readUInt32LE(Constants.ENDOFF);
          _commentLength = data.readUInt16LE(Constants.ENDCOM);
        } else {
          _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
          _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
          _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZB);
          _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
          _commentLength = 0;
        }
      },
      toBinary: function() {
        if (!needsZip64()) {
          var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
          b.writeUInt32LE(Constants.ENDSIG, 0);
          b.writeUInt32LE(0, 4);
          b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
          b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
          b.writeUInt32LE(_size, Constants.ENDSIZ);
          b.writeUInt32LE(_offset, Constants.ENDOFF);
          b.writeUInt16LE(_commentLength, Constants.ENDCOM);
          b.fill(" ", Constants.ENDHDR);
          return b;
        }
        var b = Buffer.alloc(this.mainHeaderSize);
        let offset = 0;
        b.writeUInt32LE(Constants.ZIP64SIG, offset);
        Utils.writeBigUInt64LE(b, Constants.ZIP64HDR - Constants.ZIP64LEAD, offset + Constants.ZIP64SIZE);
        b.writeUInt16LE(45, offset + Constants.ZIP64VEM);
        b.writeUInt16LE(45, offset + Constants.ZIP64VER);
        b.writeUInt32LE(0, offset + Constants.ZIP64DSK);
        b.writeUInt32LE(0, offset + Constants.ZIP64DSKDIR);
        Utils.writeBigUInt64LE(b, _volumeEntries, offset + Constants.ZIP64SUB);
        Utils.writeBigUInt64LE(b, _totalEntries, offset + Constants.ZIP64TOT);
        Utils.writeBigUInt64LE(b, _size, offset + Constants.ZIP64SIZB);
        Utils.writeBigUInt64LE(b, _offset, offset + Constants.ZIP64OFF);
        const zip64EndOffset = _offset + _size;
        offset += Constants.ZIP64HDR;
        b.writeUInt32LE(Constants.END64SIG, offset);
        b.writeUInt32LE(0, offset + Constants.END64START);
        Utils.writeBigUInt64LE(b, zip64EndOffset, offset + Constants.END64OFF);
        b.writeUInt32LE(1, offset + Constants.END64NUMDISKS);
        offset += Constants.END64HDR;
        b.writeUInt32LE(Constants.ENDSIG, offset);
        b.writeUInt32LE(0, offset + 4);
        b.writeUInt16LE(Math.min(_volumeEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDSUB);
        b.writeUInt16LE(Math.min(_totalEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDTOT);
        b.writeUInt32LE(Math.min(_size, Constants.EF_ZIP64_OR_32), offset + Constants.ENDSIZ);
        b.writeUInt32LE(Math.min(_offset, Constants.EF_ZIP64_OR_32), offset + Constants.ENDOFF);
        b.writeUInt16LE(_commentLength, offset + Constants.ENDCOM);
        b.fill(" ", offset + Constants.ENDHDR);
        return b;
      },
      toJSON: function() {
        const offset = function(nr, len) {
          let offs = nr.toString(16).toUpperCase();
          while (offs.length < len) offs = "0" + offs;
          return "0x" + offs;
        };
        return {
          diskEntries: _volumeEntries,
          totalEntries: _totalEntries,
          size: _size + " bytes",
          offset: offset(_offset, 4),
          commentLength: _commentLength
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return mainHeader;
}
var hasRequiredHeaders;
function requireHeaders() {
  if (hasRequiredHeaders) return headers;
  hasRequiredHeaders = 1;
  headers.EntryHeader = requireEntryHeader();
  headers.MainHeader = requireMainHeader();
  return headers;
}
var methods = {};
var deflater;
var hasRequiredDeflater;
function requireDeflater() {
  if (hasRequiredDeflater) return deflater;
  hasRequiredDeflater = 1;
  deflater = function(inbuf) {
    var zlib = require$$0$1;
    var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return zlib.deflateRawSync(inbuf, opts);
      },
      deflateAsync: function(callback) {
        var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
  return deflater;
}
var inflater;
var hasRequiredInflater;
function requireInflater() {
  var _a;
  if (hasRequiredInflater) return inflater;
  hasRequiredInflater = 1;
  const version = +(((_a = process == null ? void 0 : process.versions) == null ? void 0 : _a.node) ?? "").split(".")[0] || 0;
  inflater = function(inbuf, expectedLength) {
    var zlib = require$$0$1;
    const option = version >= 15 && expectedLength > 0 ? { maxOutputLength: expectedLength } : {};
    return {
      inflate: function() {
        return zlib.inflateRawSync(inbuf, option);
      },
      inflateAsync: function(callback) {
        var tmp = zlib.createInflateRaw(option), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
  return inflater;
}
var zipcrypto;
var hasRequiredZipcrypto;
function requireZipcrypto() {
  if (hasRequiredZipcrypto) return zipcrypto;
  hasRequiredZipcrypto = 1;
  const { randomFillSync } = require$$0$2;
  const Errors = requireErrors();
  const crctable = new Uint32Array(256).map((t, crc) => {
    for (let j = 0; j < 8; j++) {
      if (0 !== (crc & 1)) {
        crc = crc >>> 1 ^ 3988292384;
      } else {
        crc >>>= 1;
      }
    }
    return crc >>> 0;
  });
  const uMul = (a, b) => Math.imul(a, b) >>> 0;
  const crc32update = (pCrc32, bval) => {
    return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
  };
  const genSalt = () => {
    if ("function" === typeof randomFillSync) {
      return randomFillSync(Buffer.alloc(12));
    } else {
      return genSalt.node();
    }
  };
  genSalt.node = () => {
    const salt = Buffer.alloc(12);
    const len = salt.length;
    for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
    return salt;
  };
  const config2 = {
    genSalt
  };
  function Initkeys(pw) {
    const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let i = 0; i < pass.length; i++) {
      this.updateKeys(pass[i]);
    }
  }
  Initkeys.prototype.updateKeys = function(byteValue) {
    const keys = this.keys;
    keys[0] = crc32update(keys[0], byteValue);
    keys[1] += keys[0] & 255;
    keys[1] = uMul(keys[1], 134775813) + 1;
    keys[2] = crc32update(keys[2], keys[1] >>> 24);
    return byteValue;
  };
  Initkeys.prototype.next = function() {
    const k = (this.keys[2] | 2) >>> 0;
    return uMul(k, k ^ 1) >> 8 & 255;
  };
  function make_decrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data) {
      const result = Buffer.alloc(data.length);
      let pos = 0;
      for (let c of data) {
        result[pos++] = keys.updateKeys(c ^ keys.next());
      }
      return result;
    };
  }
  function make_encrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data, result, pos = 0) {
      if (!result) result = Buffer.alloc(data.length);
      for (let c of data) {
        const k = keys.next();
        result[pos++] = c ^ k;
        keys.updateKeys(c);
      }
      return result;
    };
  }
  function decrypt(data, header, pwd) {
    if (!data || !Buffer.isBuffer(data) || data.length < 12) {
      return Buffer.alloc(0);
    }
    const decrypter = make_decrypter(pwd);
    const salt = decrypter(data.slice(0, 12));
    const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
    if (salt[11] !== verifyByte) {
      throw Errors.WRONG_PASSWORD();
    }
    return decrypter(data.slice(12));
  }
  function _salter(data) {
    if (Buffer.isBuffer(data) && data.length >= 12) {
      config2.genSalt = function() {
        return data.slice(0, 12);
      };
    } else if (data === "node") {
      config2.genSalt = genSalt.node;
    } else {
      config2.genSalt = genSalt;
    }
  }
  function encrypt(data, header, pwd, oldlike = false) {
    if (data == null) data = Buffer.alloc(0);
    if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
    const encrypter = make_encrypter(pwd);
    const salt = config2.genSalt();
    salt[11] = header.crc >>> 24 & 255;
    if (oldlike) salt[10] = header.crc >>> 16 & 255;
    const result = Buffer.alloc(data.length + 12);
    encrypter(salt, result);
    return encrypter(data, result, 12);
  }
  zipcrypto = { decrypt, encrypt, _salter };
  return zipcrypto;
}
var hasRequiredMethods;
function requireMethods() {
  if (hasRequiredMethods) return methods;
  hasRequiredMethods = 1;
  methods.Deflater = requireDeflater();
  methods.Inflater = requireInflater();
  methods.ZipCrypto = requireZipcrypto();
  return methods;
}
var zipEntry;
var hasRequiredZipEntry;
function requireZipEntry() {
  if (hasRequiredZipEntry) return zipEntry;
  hasRequiredZipEntry = 1;
  var Utils = requireUtil(), Headers = requireHeaders(), Constants = Utils.Constants, Methods = requireMethods();
  zipEntry = function(options, input) {
    var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
    const opts = options;
    const decoder2 = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
    _efs = decoder2.hasOwnProperty("efs") ? decoder2.efs : false;
    function getCompressedDataFromZip() {
      if (!input || !(input instanceof Uint8Array)) {
        return Buffer.alloc(0);
      }
      _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
      return input.slice(_centralHeader.realDataOffset, _centralHeader.realDataOffset + _centralHeader.compressedSize);
    }
    function crc32OK(data) {
      if (!_centralHeader.flags_desc && !_centralHeader.localHeader.flags_desc) {
        if (Utils.crc32(data) !== _centralHeader.localHeader.crc) {
          return false;
        }
      } else {
        const descriptor = {};
        const dataEndOffset = _centralHeader.realDataOffset + _centralHeader.compressedSize;
        if (input.readUInt32LE(dataEndOffset) == Constants.LOCSIG || input.readUInt32LE(dataEndOffset) == Constants.CENSIG) {
          throw Utils.Errors.DESCRIPTOR_NOT_EXIST();
        }
        if (input.readUInt32LE(dataEndOffset) == Constants.EXTSIG) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN);
        } else if (input.readUInt16LE(dataEndOffset + 12) === 19280) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC - 4);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ - 4);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN - 4);
        } else {
          throw Utils.Errors.DESCRIPTOR_UNKNOWN();
        }
        if (descriptor.compressedSize !== _centralHeader.compressedSize || descriptor.size !== _centralHeader.size || descriptor.crc !== _centralHeader.crc) {
          throw Utils.Errors.DESCRIPTOR_FAULTY();
        }
        if (Utils.crc32(data) !== descriptor.crc) {
          return false;
        }
      }
      return true;
    }
    function decompress(async, callback, pass) {
      if (typeof callback === "undefined" && typeof async === "string") {
        pass = async;
        async = void 0;
      }
      if (_isDirectory) {
        if (async && callback) {
          callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
        }
        return Buffer.alloc(0);
      }
      var compressedData = getCompressedDataFromZip();
      if (compressedData.length === 0) {
        if (async && callback) callback(compressedData);
        return compressedData;
      }
      if (_centralHeader.encrypted) {
        if ("string" !== typeof pass && !Buffer.isBuffer(pass)) {
          throw Utils.Errors.INVALID_PASS_PARAM();
        }
        compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
      }
      var data = Buffer.alloc(_centralHeader.size);
      switch (_centralHeader.method) {
        case Utils.Constants.STORED:
          compressedData.copy(data);
          if (!crc32OK(data)) {
            if (async && callback) callback(data, Utils.Errors.BAD_CRC());
            throw Utils.Errors.BAD_CRC();
          } else {
            if (async && callback) callback(data);
            return data;
          }
        case Utils.Constants.DEFLATED:
          var inflater2 = new Methods.Inflater(compressedData, _centralHeader.size);
          if (!async) {
            const result = inflater2.inflate(data);
            result.copy(data, 0);
            if (!crc32OK(data)) {
              throw Utils.Errors.BAD_CRC(`"${decoder2.decode(_entryName)}"`);
            }
            return data;
          } else {
            inflater2.inflateAsync(function(result) {
              result.copy(result, 0);
              if (callback) {
                if (!crc32OK(result)) {
                  callback(result, Utils.Errors.BAD_CRC());
                } else {
                  callback(result);
                }
              }
            });
          }
          break;
        default:
          if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
          throw Utils.Errors.UNKNOWN_METHOD();
      }
    }
    function compress(async, callback) {
      if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
        if (async && callback) callback(getCompressedDataFromZip());
        return getCompressedDataFromZip();
      }
      if (uncompressedData.length && !_isDirectory) {
        var compressedData;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            _centralHeader.compressedSize = _centralHeader.size;
            compressedData = Buffer.alloc(uncompressedData.length);
            uncompressedData.copy(compressedData);
            if (async && callback) callback(compressedData);
            return compressedData;
          default:
          case Utils.Constants.DEFLATED:
            var deflater2 = new Methods.Deflater(uncompressedData);
            if (!async) {
              var deflated = deflater2.deflate();
              _centralHeader.compressedSize = deflated.length;
              return deflated;
            } else {
              deflater2.deflateAsync(function(data) {
                compressedData = Buffer.alloc(data.length);
                _centralHeader.compressedSize = data.length;
                data.copy(compressedData);
                callback && callback(compressedData);
              });
            }
            deflater2 = null;
            break;
        }
      } else if (async && callback) {
        callback(Buffer.alloc(0));
      } else {
        return Buffer.alloc(0);
      }
    }
    function readUInt64LE(buffer, offset) {
      return Utils.readBigUInt64LE(buffer, offset);
    }
    function parseExtra(data) {
      try {
        var offset = 0;
        var signature, size, part;
        while (offset + 4 < data.length) {
          signature = data.readUInt16LE(offset);
          offset += 2;
          size = data.readUInt16LE(offset);
          offset += 2;
          part = data.slice(offset, offset + size);
          offset += size;
          if (Constants.ID_ZIP64 === signature) {
            parseZip64ExtendedInformation(part);
          }
        }
      } catch (error) {
        throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function parseZip64ExtendedInformation(data) {
      var size, compressedSize, offset, diskNumStart;
      if (data.length >= Constants.EF_ZIP64_SCOMP) {
        size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
        if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
          _centralHeader.size = size;
        }
      }
      if (data.length >= Constants.EF_ZIP64_RHO) {
        compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
        if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
          _centralHeader.compressedSize = compressedSize;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN) {
        offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
        if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
          _centralHeader.offset = offset;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN + 4) {
        diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
        if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
          _centralHeader.diskNumStart = diskNumStart;
        }
      }
    }
    return {
      get entryName() {
        return decoder2.decode(_entryName);
      },
      get rawEntryName() {
        return _entryName;
      },
      set entryName(val) {
        _entryName = Utils.toBuffer(val, decoder2.encode);
        var lastChar = _entryName[_entryName.length - 1];
        _isDirectory = lastChar === 47 || lastChar === 92;
        _centralHeader.fileNameLength = _entryName.length;
      },
      get efs() {
        if (typeof _efs === "function") {
          return _efs(this.entryName);
        } else {
          return _efs;
        }
      },
      get extra() {
        return _extra;
      },
      set extra(val) {
        _extra = val;
        _centralHeader.extraLength = val.length;
        parseExtra(val);
      },
      get comment() {
        return decoder2.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder2.encode);
        _centralHeader.commentLength = _comment.length;
        if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var n = decoder2.decode(_entryName);
        return _isDirectory ? n.substr(n.length - 1).split("/").pop() : n.split("/").pop();
      },
      get isDirectory() {
        return _isDirectory;
      },
      getCompressedData: function() {
        return compress(false, null);
      },
      getCompressedDataAsync: function(callback) {
        compress(true, callback);
      },
      setData: function(value) {
        uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
        if (!_isDirectory && uncompressedData.length) {
          _centralHeader.size = uncompressedData.length;
          _centralHeader.method = Utils.Constants.DEFLATED;
          _centralHeader.crc = Utils.crc32(value);
          _centralHeader.changed = true;
        } else {
          _centralHeader.method = Utils.Constants.STORED;
        }
      },
      getData: function(pass) {
        if (_centralHeader.changed) {
          return uncompressedData;
        } else {
          return decompress(false, null, pass);
        }
      },
      getDataAsync: function(callback, pass) {
        if (_centralHeader.changed) {
          callback(uncompressedData);
        } else {
          decompress(true, callback, pass);
        }
      },
      set attr(attr) {
        _centralHeader.attr = attr;
      },
      get attr() {
        return _centralHeader.attr;
      },
      set header(data) {
        _centralHeader.loadFromBinary(data);
      },
      get header() {
        return _centralHeader;
      },
      packCentralHeader: function() {
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLength = _extra.length;
        var header = _centralHeader.centralHeaderToBinary();
        var addpos = Utils.Constants.CENHDR;
        _entryName.copy(header, addpos);
        addpos += _entryName.length;
        _extra.copy(header, addpos);
        addpos += _centralHeader.extraLength;
        _comment.copy(header, addpos);
        return header;
      },
      packLocalHeader: function() {
        let addpos = 0;
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLocalLength = _extralocal.length;
        const localHeaderBuf = _centralHeader.localHeaderToBinary();
        const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
        localHeaderBuf.copy(localHeader, addpos);
        addpos += localHeaderBuf.length;
        _entryName.copy(localHeader, addpos);
        addpos += _entryName.length;
        _extralocal.copy(localHeader, addpos);
        addpos += _extralocal.length;
        return localHeader;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: _centralHeader.toJSON(),
          compressedData: bytes(input),
          data: bytes(uncompressedData)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  };
  return zipEntry;
}
var zipFile;
var hasRequiredZipFile;
function requireZipFile() {
  if (hasRequiredZipFile) return zipFile;
  hasRequiredZipFile = 1;
  const ZipEntry = requireZipEntry();
  const Headers = requireHeaders();
  const Utils = requireUtil();
  zipFile = function(inBuffer, options) {
    var entryList = [], entryTable = {}, _comment = Buffer.alloc(0), mainHeader2 = new Headers.MainHeader(), loadedEntries = false;
    const temporary = /* @__PURE__ */ new Set();
    const opts = options;
    const { noSort, decoder: decoder2 } = opts;
    if (inBuffer) {
      readMainHeader(opts.readEntries);
    } else {
      loadedEntries = true;
    }
    function makeTemporaryFolders() {
      const foldersList = /* @__PURE__ */ new Set();
      for (const elem of Object.keys(entryTable)) {
        const elements = elem.split("/");
        elements.pop();
        if (!elements.length) continue;
        for (let i = 0; i < elements.length; i++) {
          const sub = elements.slice(0, i + 1).join("/") + "/";
          foldersList.add(sub);
        }
      }
      for (const elem of foldersList) {
        if (!(elem in entryTable)) {
          const tempfolder = new ZipEntry(opts);
          tempfolder.entryName = elem;
          tempfolder.attr = 16;
          tempfolder.temporary = true;
          entryList.push(tempfolder);
          entryTable[tempfolder.entryName] = tempfolder;
          temporary.add(tempfolder);
        }
      }
    }
    function readEntries() {
      loadedEntries = true;
      entryTable = {};
      if (mainHeader2.diskEntries > (inBuffer.length - mainHeader2.offset) / Utils.Constants.CENHDR) {
        throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
      }
      entryList = new Array(mainHeader2.diskEntries);
      var index = mainHeader2.offset;
      for (var i = 0; i < entryList.length; i++) {
        var tmp = index, entry = new ZipEntry(opts, inBuffer);
        entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
        entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
        if (entry.header.extraLength) {
          entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
        }
        if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
        index += entry.header.centralHeaderSize;
        entryList[i] = entry;
        entryTable[entry.entryName] = entry;
      }
      temporary.clear();
      makeTemporaryFolders();
    }
    function readMainHeader(readNow) {
      var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
      const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
      if (trailingSpace) max = 0;
      for (i; i >= n; i--) {
        if (inBuffer[i] !== 80) continue;
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
          endOffset = i;
          commentEnd = i;
          endStart = i + Utils.Constants.ENDHDR;
          n = i - Utils.Constants.END64HDR;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
          n = max;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
          endOffset = i;
          endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
          break;
        }
      }
      if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
      mainHeader2.loadFromBinary(inBuffer.slice(endOffset, endStart));
      if (mainHeader2.commentLength) {
        _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
      }
      if (readNow) readEntries();
    }
    function sortEntries() {
      if (entryList.length > 1 && !noSort) {
        entryList.sort((a, b) => a.entryName.toLowerCase().localeCompare(b.entryName.toLowerCase()));
      }
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        if (!loadedEntries) {
          readEntries();
        }
        return entryList.filter((e) => !temporary.has(e));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return decoder2.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder2.encode);
        mainHeader2.commentLength = _comment.length;
      },
      getEntryCount: function() {
        if (!loadedEntries) {
          return mainHeader2.diskEntries;
        }
        return entryList.length;
      },
      forEach: function(callback) {
        this.entries.forEach(callback);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        return entryTable[entryName] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(entry) {
        if (!loadedEntries) {
          readEntries();
        }
        entryList.push(entry);
        entryTable[entry.entryName] = entry;
        mainHeader2.totalEntries = entryList.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(entryName, withsubfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
        list.forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const index = entryList.indexOf(entry);
        if (index >= 0) {
          entryList.splice(index, 1);
          delete entryTable[entryName];
          mainHeader2.totalEntries = entryList.length;
        }
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(entry, subfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        if (typeof entry === "object") {
          if (entry.isDirectory && subfolders) {
            const list = [];
            const name = entry.entryName;
            for (const zipEntry2 of entryList) {
              if (zipEntry2.entryName.startsWith(name)) {
                list.push(zipEntry2);
              }
            }
            return list;
          } else {
            return [entry];
          }
        }
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(entry) {
        if (entry && entry.isDirectory) {
          const list = this.getEntryChildren(entry);
          return list.includes(entry) ? list.length - 1 : list.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        if (!loadedEntries) {
          readEntries();
        }
        sortEntries();
        const dataBlock = [];
        const headerBlocks = [];
        let totalSize = 0;
        let dindex = 0;
        mainHeader2.size = 0;
        mainHeader2.offset = 0;
        let totalEntries = 0;
        for (const entry of this.entries) {
          const compressedData = entry.getCompressedData();
          entry.header.offset = dindex;
          const localHeader = entry.packLocalHeader();
          const dataLength = localHeader.length + compressedData.length;
          dindex += dataLength;
          dataBlock.push(localHeader);
          dataBlock.push(compressedData);
          const centralHeader = entry.packCentralHeader();
          headerBlocks.push(centralHeader);
          mainHeader2.size += centralHeader.length;
          totalSize += dataLength + centralHeader.length;
          totalEntries++;
        }
        totalSize += mainHeader2.mainHeaderSize;
        mainHeader2.offset = dindex;
        mainHeader2.totalEntries = totalEntries;
        dindex = 0;
        const outBuffer = Buffer.alloc(totalSize);
        for (const content of dataBlock) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        for (const content of headerBlocks) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        const mh = mainHeader2.toBinary();
        if (_comment) {
          _comment.copy(mh, mh.length - _comment.length);
        }
        mh.copy(outBuffer, dindex);
        inBuffer = outBuffer;
        loadedEntries = false;
        return outBuffer;
      },
      toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        try {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const centralHeaders = [];
          let totalSize = 0;
          let dindex = 0;
          let totalEntries = 0;
          mainHeader2.size = 0;
          mainHeader2.offset = 0;
          const compress2Buffer = function(entryLists) {
            if (entryLists.length > 0) {
              const entry = entryLists.shift();
              const name = entry.entryName + entry.extra.toString();
              if (onItemStart) onItemStart(name);
              entry.getCompressedDataAsync(function(compressedData) {
                if (onItemEnd) onItemEnd(name);
                entry.header.offset = dindex;
                const localHeader = entry.packLocalHeader();
                const dataLength = localHeader.length + compressedData.length;
                dindex += dataLength;
                dataBlock.push(localHeader);
                dataBlock.push(compressedData);
                const centalHeader = entry.packCentralHeader();
                centralHeaders.push(centalHeader);
                mainHeader2.size += centalHeader.length;
                totalSize += dataLength + centalHeader.length;
                totalEntries++;
                compress2Buffer(entryLists);
              });
            } else {
              totalSize += mainHeader2.mainHeaderSize;
              mainHeader2.offset = dindex;
              mainHeader2.totalEntries = totalEntries;
              dindex = 0;
              const outBuffer = Buffer.alloc(totalSize);
              dataBlock.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              centralHeaders.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              const mh = mainHeader2.toBinary();
              if (_comment) {
                _comment.copy(mh, mh.length - _comment.length);
              }
              mh.copy(outBuffer, dindex);
              inBuffer = outBuffer;
              loadedEntries = false;
              onSuccess(outBuffer);
            }
          };
          compress2Buffer(Array.from(this.entries));
        } catch (e) {
          onFail(e);
        }
      }
    };
  };
  return zipFile;
}
var admZip;
var hasRequiredAdmZip;
function requireAdmZip() {
  if (hasRequiredAdmZip) return admZip;
  hasRequiredAdmZip = 1;
  const Utils = requireUtil();
  const pth = require$$1;
  const ZipEntry = requireZipEntry();
  const ZipFile = requireZipFile();
  const get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
  const get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
  const get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
  const defaultOptions = {
    // option "noSort" : if true it disables files sorting
    noSort: false,
    // read entries during load (initial loading may be slower)
    readEntries: false,
    // default method is none
    method: Utils.Constants.NONE,
    // file system
    fs: null
  };
  admZip = function(input, options) {
    let inBuffer = null;
    const opts = Object.assign(/* @__PURE__ */ Object.create(null), defaultOptions);
    if (input && "object" === typeof input) {
      if (!(input instanceof Uint8Array)) {
        Object.assign(opts, input);
        input = opts.input ? opts.input : void 0;
        if (opts.input) delete opts.input;
      }
      if (Buffer.isBuffer(input)) {
        inBuffer = input;
        opts.method = Utils.Constants.BUFFER;
        input = void 0;
      }
    }
    Object.assign(opts, options);
    const filetools = new Utils(opts);
    if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
      opts.decoder = Utils.decoder;
    }
    if (input && "string" === typeof input) {
      if (filetools.fs.existsSync(input)) {
        opts.method = Utils.Constants.FILE;
        opts.filename = input;
        inBuffer = filetools.fs.readFileSync(input);
      } else {
        throw Utils.Errors.INVALID_FILENAME();
      }
    }
    const _zip = new ZipFile(inBuffer, opts);
    const { canonical, sanitize, zipnamefix } = Utils;
    function getEntry(entry) {
      if (entry && _zip) {
        var item;
        if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
        if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
        if (item) {
          return item;
        }
      }
      return null;
    }
    function fixPath(zipPath) {
      const { join, normalize, sep } = pth.posix;
      return join(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
    }
    function filenameFilter(filterfn) {
      if (filterfn instanceof RegExp) {
        return /* @__PURE__ */ (function(rx) {
          return function(filename) {
            return rx.test(filename);
          };
        })(filterfn);
      } else if ("function" !== typeof filterfn) {
        return () => true;
      }
      return filterfn;
    }
    const relativePath = (local, entry) => {
      let lastChar = entry.slice(-1);
      lastChar = lastChar === filetools.sep ? filetools.sep : "";
      return pth.relative(local, entry) + lastChar;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(entry, pass) {
        var item = getEntry(entry);
        return item && item.getData(pass) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(entry) {
        const item = getEntry(entry);
        if (item) {
          return _zip.getChildCount(item);
        }
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(entry, callback) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(callback);
        } else {
          callback(null, "getEntry failed for:" + entry);
        }
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(entry, encoding) {
        var item = getEntry(entry);
        if (item) {
          var data = item.getData();
          if (data && data.length) {
            return data.toString(encoding || "utf8");
          }
        }
        return "";
      },
      /**
       * Asynchronous readAsText
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsTextAsync: function(entry, callback, encoding) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(function(data, err) {
            if (err) {
              callback(data, err);
              return;
            }
            if (data && data.length) {
              callback(data.toString(encoding || "utf8"));
            } else {
              callback("");
            }
          });
        } else {
          callback("");
        }
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(entry, withsubfolders = true) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteFile(item.entryName, withsubfolders);
        }
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(entry) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteEntry(item.entryName);
        }
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(comment) {
        _zip.comment = comment;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return _zip.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(entry, comment) {
        var item = getEntry(entry);
        if (item) {
          item.comment = comment;
        }
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(entry) {
        var item = getEntry(entry);
        if (item) {
          return item.comment || "";
        }
        return "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(entry, content) {
        var item = getEntry(entry);
        if (item) {
          item.setData(content);
        }
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(localPath, zipPath, zipName, comment) {
        if (filetools.fs.existsSync(localPath)) {
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p = pth.win32.basename(pth.win32.normalize(localPath));
          zipPath += zipName ? zipName : p;
          const _attr = filetools.fs.statSync(localPath);
          const data = _attr.isFile() ? filetools.fs.readFileSync(localPath) : Buffer.alloc(0);
          if (_attr.isDirectory()) zipPath += filetools.sep;
          this.addFile(zipPath, data, comment, _attr);
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath);
        }
      },
      /**
       * Callback for showing if everything was done.
       *
       * @callback doneCallback
       * @param {Error} err - Error object
       * @param {boolean} done - was request fully completed
       */
      /**
       * Adds a file from the disk to the archive
       *
       * @param {(object|string)} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the file.
       * @param {string} [options.comment] - Optional file comment.
       * @param {string} [options.zipPath] - Optional path inside the zip
       * @param {string} [options.zipName] - Optional name for the file
       * @param {doneCallback} callback - The callback that handles the response.
       */
      addLocalFileAsync: function(options2, callback) {
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        const localPath = pth.resolve(options2.localPath);
        const { comment } = options2;
        let { zipPath, zipName } = options2;
        const self = this;
        filetools.fs.stat(localPath, function(err, stats) {
          if (err) return callback(err, false);
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p = pth.win32.basename(pth.win32.normalize(localPath));
          zipPath += zipName ? zipName : p;
          if (stats.isFile()) {
            filetools.fs.readFile(localPath, function(err2, data) {
              if (err2) return callback(err2, false);
              self.addFile(zipPath, data, comment, stats);
              return setImmediate(callback, void 0, true);
            });
          } else if (stats.isDirectory()) {
            zipPath += filetools.sep;
            self.addFile(zipPath, Buffer.alloc(0), comment, stats);
            return setImmediate(callback, void 0, true);
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(localPath, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath = pth.normalize(localPath);
        if (filetools.fs.existsSync(localPath)) {
          const items = filetools.findFiles(localPath);
          const self = this;
          if (items.length) {
            for (const filepath of items) {
              const p = pth.join(zipPath, relativePath(localPath, filepath));
              if (filter(p)) {
                self.addLocalFile(filepath, pth.dirname(p));
              }
            }
          }
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath);
        }
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(localPath, callback, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath = pth.normalize(localPath);
        var self = this;
        filetools.fs.open(localPath, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
          } else if (err) {
            callback(void 0, err);
          } else {
            var items = filetools.findFiles(localPath);
            var i = -1;
            var next = function() {
              i += 1;
              if (i < items.length) {
                var filepath = items[i];
                var p = relativePath(localPath, filepath).split("\\").join("/");
                p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                if (filter(p)) {
                  filetools.fs.stat(filepath, function(er0, stats) {
                    if (er0) callback(void 0, er0);
                    if (stats.isFile()) {
                      filetools.fs.readFile(filepath, function(er1, data) {
                        if (er1) {
                          callback(void 0, er1);
                        } else {
                          self.addFile(zipPath + p, data, "", stats);
                          next();
                        }
                      });
                    } else {
                      self.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
                      next();
                    }
                  });
                } else {
                  process.nextTick(() => {
                    next();
                  });
                }
              } else {
                callback(true, void 0);
              }
            };
            next();
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {object | string} options - options object, if it is string it us used as localPath.
       * @param {string} options.localPath - Local path to the folder.
       * @param {string} [options.zipPath] - optional path inside zip.
       * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [options.namefix] - optional function to help fix filename
       * @param {doneCallback} callback - The callback that handles the response.
       *
       */
      addLocalFolderAsync2: function(options2, callback) {
        const self = this;
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        const localPath = pth.resolve(fixPath(options2.localPath));
        let { zipPath, filter, namefix } = options2;
        if (filter instanceof RegExp) {
          filter = /* @__PURE__ */ (function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          })(filter);
        } else if ("function" !== typeof filter) {
          filter = function() {
            return true;
          };
        }
        zipPath = zipPath ? fixPath(zipPath) : "";
        if (namefix === "latin1") {
          namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
        }
        if (typeof namefix !== "function") namefix = (str) => str;
        const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
        const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
        filetools.fs.open(localPath, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
          } else if (err) {
            callback(void 0, err);
          } else {
            filetools.findFilesAsync(localPath, function(err2, fileEntries) {
              if (err2) return callback(err2);
              fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
              if (!fileEntries.length) callback(void 0, false);
              setImmediate(
                fileEntries.reverse().reduce(function(next, entry) {
                  return function(err3, done) {
                    if (err3 || done === false) return setImmediate(next, err3, false);
                    self.addLocalFileAsync(
                      {
                        localPath: entry,
                        zipPath: pth.dirname(relPathFix(entry)),
                        zipName: fileNameFix(entry)
                      },
                      next
                    );
                  };
                }, callback)
              );
            });
          }
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - path where files will be extracted
       * @param {object} props - optional properties
       * @param {string} [props.zipPath] - optional path inside zip
       * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
       * @param {function|string} [props.namefix] - optional function to help fix filename
       */
      addLocalFolderPromise: function(localPath, props) {
        return new Promise((resolve, reject) => {
          this.addLocalFolderAsync2(Object.assign({ localPath }, props), (err, done) => {
            if (err) reject(err);
            if (done) resolve(this);
          });
        });
      },
      /**
       * Allows you to create a entry (file or directory) in the zip file.
       * If you want to create a directory the entryName must end in / and a null buffer should be provided.
       * Comment and attributes are optional
       *
       * @param {string} entryName
       * @param {Buffer | string} content - file content as buffer or utf8 coded string
       * @param {string} [comment] - file comment
       * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
       */
      addFile: function(entryName, content, comment, attr) {
        entryName = zipnamefix(entryName);
        let entry = getEntry(entryName);
        const update = entry != null;
        if (!update) {
          entry = new ZipEntry(opts);
          entry.entryName = entryName;
        }
        entry.comment = comment || "";
        const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
        if (isStat) {
          entry.header.time = attr.mtime;
        }
        var fileattr = entry.isDirectory ? 16 : 0;
        let unix = entry.isDirectory ? 16384 : 32768;
        if (isStat) {
          unix |= 4095 & attr.mode;
        } else if ("number" === typeof attr) {
          unix |= 4095 & attr;
        } else {
          unix |= entry.isDirectory ? 493 : 420;
        }
        fileattr = (fileattr | unix << 16) >>> 0;
        entry.attr = fileattr;
        entry.setData(content);
        if (!update) _zip.setEntry(entry);
        return entry;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(password) {
        _zip.password = password;
        return _zip ? _zip.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(name) {
        return getEntry(name);
      },
      getEntryCount: function() {
        return _zip.getEntryCount();
      },
      forEach: function(callback) {
        return _zip.forEach(callback);
      },
      /**
       * Extracts the given entry to the given targetPath
       * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
       *
       * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
       * @param {string} targetPath - Target folder where to write the file
       * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
       * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
       * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
       * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
       *
       * @return Boolean
       */
      extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
        overwrite = get_Bool(false, overwrite);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        maintainEntryPath = get_Bool(true, maintainEntryPath);
        outFileName = get_Str(keepOriginalPermission, outFileName);
        var item = getEntry(entry);
        if (!item) {
          throw Utils.Errors.NO_ENTRY();
        }
        var entryName = canonical(item.entryName);
        var target = sanitize(targetPath, outFileName && !item.isDirectory ? canonical(outFileName) : maintainEntryPath ? entryName : pth.basename(entryName));
        if (item.isDirectory) {
          var children = _zip.getEntryChildren(item);
          children.forEach(function(child) {
            if (child.isDirectory) return;
            var content2 = child.getData();
            if (!content2) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            var name = canonical(child.entryName);
            var childName = sanitize(targetPath, maintainEntryPath ? name : pth.basename(name));
            const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : void 0;
            filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
          });
          return true;
        }
        var content = item.getData(_zip.password);
        if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
        if (filetools.fs.existsSync(target) && !overwrite) {
          throw Utils.Errors.CANT_OVERRIDE();
        }
        const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
        filetools.writeFileTo(target, content, overwrite, fileAttr);
        return true;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(pass) {
        if (!_zip) {
          return false;
        }
        for (var entry of _zip.entries) {
          try {
            if (entry.isDirectory) {
              continue;
            }
            var content = _zip.entries[entry].getData(pass);
            if (!content) {
              return false;
            }
          } catch (err) {
            return false;
          }
        }
        return true;
      },
      /**
       * Extracts the entire archive to the given location
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {string|Buffer} [pass] password
       */
      extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        pass = get_Str(keepOriginalPermission, pass);
        overwrite = get_Bool(false, overwrite);
        if (!_zip) throw Utils.Errors.NO_ZIP();
        _zip.entries.forEach(function(entry) {
          var entryName = sanitize(targetPath, canonical(entry.entryName));
          if (entry.isDirectory) {
            filetools.makeDir(entryName);
            return;
          }
          var content = entry.getData(pass);
          if (!content) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          filetools.writeFileTo(entryName, content, overwrite, fileAttr);
          try {
            filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
          } catch (err) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
        });
      },
      /**
       * Asynchronous extractAllTo
       *
       * @param {string} targetPath Target location
       * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
       *                  Default is FALSE
       * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
       *                  Default is FALSE
       * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
       */
      extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
        callback = get_Fun(overwrite, keepOriginalPermission, callback);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        overwrite = get_Bool(false, overwrite);
        if (!callback) {
          return new Promise((resolve, reject) => {
            this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this);
              }
            });
          });
        }
        if (!_zip) {
          callback(Utils.Errors.NO_ZIP());
          return;
        }
        targetPath = pth.resolve(targetPath);
        const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
        const getError = (msg, file) => new Error(msg + ': "' + file + '"');
        const dirEntries = [];
        const fileEntries = [];
        _zip.entries.forEach((e) => {
          if (e.isDirectory) {
            dirEntries.push(e);
          } else {
            fileEntries.push(e);
          }
        });
        for (const entry of dirEntries) {
          const dirPath = getPath(entry);
          const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          try {
            filetools.makeDir(dirPath);
            if (dirAttr) filetools.fs.chmodSync(dirPath, dirAttr);
            filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
          } catch (er) {
            callback(getError("Unable to create folder", dirPath));
          }
        }
        fileEntries.reverse().reduce(function(next, entry) {
          return function(err) {
            if (err) {
              next(err);
            } else {
              const entryName = pth.normalize(canonical(entry.entryName));
              const filePath = sanitize(targetPath, entryName);
              entry.getDataAsync(function(content, err_1) {
                if (err_1) {
                  next(err_1);
                } else if (!content) {
                  next(Utils.Errors.CANT_EXTRACT_FILE());
                } else {
                  const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
                  filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                    if (!succ) {
                      next(getError("Unable to write file", filePath));
                    }
                    filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function(err_2) {
                      if (err_2) {
                        next(getError("Unable to set times", filePath));
                      } else {
                        next();
                      }
                    });
                  });
                }
              });
            }
          };
        }, callback)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(targetFileName, callback) {
        if (arguments.length === 1) {
          if (typeof targetFileName === "function") {
            callback = targetFileName;
            targetFileName = "";
          }
        }
        if (!targetFileName && opts.filename) {
          targetFileName = opts.filename;
        }
        if (!targetFileName) return;
        var zipData = _zip.compressToBuffer();
        if (zipData) {
          var ok = filetools.writeFileTo(targetFileName, zipData, true);
          if (typeof callback === "function") callback(!ok ? new Error("failed") : null, "");
        }
      },
      /**
      	         *
      	         * @param {string} targetFileName
      	         * @param {object} [props]
      	         * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
      	         * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
      
      	         * @returns {Promise<void>}
      	         */
      writeZipPromise: function(targetFileName, props) {
        const { overwrite, perm } = Object.assign({ overwrite: true }, props);
        return new Promise((resolve, reject) => {
          if (!targetFileName && opts.filename) targetFileName = opts.filename;
          if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
          this.toBufferPromise().then((zipData) => {
            const ret = (done) => done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file");
            filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
          }, reject);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((resolve, reject) => {
          _zip.toAsyncBuffer(resolve, reject);
        });
      },
      /**
       * Returns the content of the entire zip file as a Buffer object
       *
       * @prop {function} [onSuccess]
       * @prop {function} [onFail]
       * @prop {function} [onItemStart]
       * @prop {function} [onItemEnd]
       * @returns {Buffer}
       */
      toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        if (typeof onSuccess === "function") {
          _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
          return null;
        }
        return _zip.compressToBuffer();
      }
    };
  };
  return admZip;
}
var admZipExports = requireAdmZip();
const AdmZip = /* @__PURE__ */ getDefaultExportFromCjs(admZipExports);
const CONVERSATIONS_JSON = "conversations.json";
const SKIP_ASSET_PATTERNS = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i
];
function throwIfAborted$1(signal) {
  if (signal == null ? void 0 : signal.aborted) {
    throw new Error("Validation cancelled by user.");
  }
}
function extractChatGptZip(zipPath, options = {}) {
  var _a, _b, _c;
  const { loadAssetData = true, signal, callbacks } = options;
  throwIfAborted$1(signal);
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  (_a = callbacks == null ? void 0 : callbacks.onZipOpened) == null ? void 0 : _a.call(callbacks, entries.length);
  throwIfAborted$1(signal);
  const conversationsEntry = entries.find((e) => !e.isDirectory && e.entryName.replace(/\\/g, "/").endsWith(CONVERSATIONS_JSON));
  if (!conversationsEntry) {
    throw new Error("Not a ChatGPT export ZIP: conversations.json was not found in the archive.");
  }
  const conversationsPath = conversationsEntry.entryName.replace(/\\/g, "/");
  const conversationsJsonSize = conversationsEntry.header.size;
  (_b = callbacks == null ? void 0 : callbacks.onConversationsJsonLocated) == null ? void 0 : _b.call(callbacks, conversationsPath, conversationsJsonSize);
  throwIfAborted$1(signal);
  const conversationsJson = conversationsEntry.getData().toString("utf8");
  const assets = [];
  let assetCandidateCount = 0;
  for (const entry of entries) {
    throwIfAborted$1(signal);
    if (entry.isDirectory)
      continue;
    const normalized = entry.entryName.replace(/\\/g, "/");
    const baseName = path.basename(normalized);
    if (SKIP_ASSET_PATTERNS.some((p) => p.test(baseName) || p.test(normalized)))
      continue;
    if (normalized.endsWith(".json") && !normalized.includes("/"))
      continue;
    assetCandidateCount++;
    const asset = {
      zipPath: normalized,
      fileName: baseName
    };
    if (loadAssetData) {
      asset.data = entry.getData();
    }
    assets.push(asset);
  }
  (_c = callbacks == null ? void 0 : callbacks.onEntriesDiscovered) == null ? void 0 : _c.call(callbacks, entries.length, assetCandidateCount);
  return {
    conversationsJson,
    conversationsPath,
    assets,
    archiveEntryCount: entries.length
  };
}
class ChatGptConnector {
  constructor() {
    __publicField(this, "id", "chatgpt-export-zip");
    __publicField(this, "name", "ChatGPT Connector");
    __publicField(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    __publicField(this, "supportedExtensions", [".zip"]);
  }
  canHandle(file) {
    var _a;
    return ((_a = file.extension) == null ? void 0 : _a.toLowerCase()) === ".zip";
  }
  async discover(source) {
    return {
      connectorId: this.id,
      source,
      format: "chatgpt-export-zip",
      metadata: {
        fileName: source.name
      }
    };
  }
  async extract(discovered) {
    const extracted = extractChatGptZip(discovered.source.path, { loadAssetData: false });
    const conversations = parseConversationsJson(extracted.conversationsJson);
    return {
      connectorId: this.id,
      source: discovered.source,
      rawDocuments: conversations,
      assets: extracted.assets.map((a) => {
        var _a;
        return {
          path: a.zipPath,
          fileName: a.fileName,
          dataBase64: (_a = a.data) == null ? void 0 : _a.toString("base64")
        };
      }),
      metadata: {
        conversationsPath: extracted.conversationsPath,
        conversationCount: conversations.length
      }
    };
  }
  async normalize(extracted) {
    const assets = extracted.assets.map((a) => ({
      zipPath: a.path,
      fileName: a.fileName,
      data: Buffer.from(a.dataBase64 ?? "", "base64")
    }));
    const assetList = assets.map((a) => ({ zipPath: a.zipPath, fileName: a.fileName }));
    return extracted.rawDocuments.map((conv, index) => {
      const doc = conversationToDocument(conv, assets, {
        sharedAssetList: index === 0 ? assetList : void 0
      });
      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        format: doc.format,
        metadata: doc.metadata
      };
    });
  }
}
const chatGptConnector = new ChatGptConnector();
const STAGE_LABELS = {
  "zip-selected": "ZIP selected",
  "zip-opening": "Opening ZIP archive",
  "zip-opened": "ZIP opened",
  "entries-discovered": "Archive entries discovered",
  "conversations-json-located": "conversations.json located",
  "parsing-started": "Parsing conversations",
  "parsing-conversations": "Processing conversations",
  "planning-import": "Planning import (read-only)",
  completed: "Validation complete",
  failed: "Validation failed",
  cancelled: "Validation cancelled"
};
function throwIfAborted(signal) {
  if (signal == null ? void 0 : signal.aborted) {
    throw new Error("Validation cancelled by user.");
  }
}
function formatBytes(bytes) {
  if (bytes < 1024)
    return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
async function runChatGptValidationPipeline(file, callbacks = {}) {
  const startedAt = Date.now();
  const warnings = [];
  let archiveEntryCount = 0;
  let conversationsJsonPath;
  let conversationsJsonSizeBytes;
  let conversationsTotal = 0;
  let conversationsProcessed = 0;
  let messagesProcessed = 0;
  const emit = (stage, status, partial = {}) => {
    var _a;
    (_a = callbacks.onProgress) == null ? void 0 : _a.call(callbacks, {
      status,
      stage,
      stageLabel: STAGE_LABELS[stage],
      fileName: file.name,
      archiveEntryCount,
      conversationsJsonPath,
      conversationsJsonSizeBytes,
      conversationsTotal,
      conversationsProcessed,
      messagesProcessed,
      warningsGenerated: warnings.length,
      startedAt: new Date(startedAt).toISOString(),
      elapsedMs: Date.now() - startedAt,
      ...partial
    });
  };
  const log = (level, message, context) => {
    var _a;
    (_a = callbacks.log) == null ? void 0 : _a.call(callbacks, level, message, context);
  };
  try {
    emit("zip-selected", "running", { detail: file.name });
    log("info", `ZIP selected: ${file.name}`, { path: file.path });
    emit("zip-opening", "running");
    log("info", "Opening ZIP archive (read-only)…");
    const extracted = extractChatGptZip(file.path, {
      loadAssetData: false,
      signal: callbacks.signal,
      callbacks: {
        onZipOpened: (entryCount) => {
          archiveEntryCount = entryCount;
          emit("zip-opened", "running", {
            archiveEntryCount: entryCount,
            detail: `${entryCount} entries`
          });
          log("info", `ZIP opened: ${entryCount} archive entries`);
        },
        onEntriesDiscovered: (fileCount, assetCount) => {
          emit("entries-discovered", "running", {
            archiveEntryCount: fileCount,
            detail: `${assetCount} asset file(s), metadata only`
          });
          log("info", `Archive entries discovered: ${fileCount} total, ${assetCount} asset file(s)`);
        },
        onConversationsJsonLocated: (entryPath, sizeBytes) => {
          conversationsJsonPath = entryPath;
          conversationsJsonSizeBytes = sizeBytes;
          emit("conversations-json-located", "running", {
            conversationsJsonPath: entryPath,
            conversationsJsonSizeBytes: sizeBytes,
            detail: `${entryPath} (${formatBytes(sizeBytes)})`
          });
          log("info", `conversations.json located: ${entryPath} (${formatBytes(sizeBytes)})`);
        }
      }
    });
    throwIfAborted(callbacks.signal);
    emit("parsing-started", "running");
    log("info", "Conversations parsing started…");
    const rawConversations = parseConversationsJsonArray(extracted.conversationsJson);
    conversationsTotal = rawConversations.length;
    log("info", `Total conversations detected: ${conversationsTotal}`, {
      conversationsTotal
    });
    emit("parsing-started", "running", {
      conversationsTotal,
      detail: `${conversationsTotal} conversations`
    });
    const parsedConversations = await parseConversationsIncremental(rawConversations, {
      signal: callbacks.signal,
      onProgress: (progress) => {
        conversationsProcessed = progress.conversationsProcessed;
        messagesProcessed = progress.messagesProcessed;
        emit("parsing-conversations", "running", {
          conversationsTotal: progress.conversationsTotal,
          conversationsProcessed: progress.conversationsProcessed,
          messagesProcessed: progress.messagesProcessed,
          detail: `${progress.conversationsProcessed}/${progress.conversationsTotal} conversations, ${progress.messagesProcessed} messages`
        });
        if (progress.conversationsProcessed % 100 === 0 || progress.conversationsProcessed === progress.conversationsTotal) {
          log("info", `Conversations processed: ${progress.conversationsProcessed}/${progress.conversationsTotal} (${progress.messagesProcessed} messages)`, {
            conversationsProcessed: progress.conversationsProcessed,
            conversationsTotal: progress.conversationsTotal,
            messagesProcessed: progress.messagesProcessed
          });
        }
      }
    });
    throwIfAborted(callbacks.signal);
    const assetList = extracted.assets.map((a) => ({
      zipPath: a.zipPath,
      fileName: a.fileName
    }));
    const normalized = parsedConversations.map((conv, index) => conversationToDocument(conv, extracted.assets, {
      validationMode: true,
      sharedAssetList: index === 0 ? assetList : void 0
    }));
    const documents = generateSourceRecords(chatGptConnector.id, normalized);
    const provenance = generateProvenance(chatGptConnector.id, file, documents);
    const importPackage = emitImportPackage(chatGptConnector, file, documents, provenance);
    if (warnings.length > 0) {
      log("warn", `Warnings generated: ${warnings.length}`, { warnings });
    }
    emit("completed", "complete", {
      conversationsTotal,
      conversationsProcessed,
      messagesProcessed,
      detail: `${conversationsProcessed} conversations validated`
    });
    log("info", `Validation pipeline complete: ${documents.length} conversation(s), ${messagesProcessed} message(s)`);
    return importPackage;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cancelled = message.includes("cancelled");
    emit(cancelled ? "cancelled" : "failed", cancelled ? "cancelled" : "failed", {
      error: message,
      detail: message
    });
    log(cancelled ? "warn" : "error", `Validation ${cancelled ? "cancelled" : "failed"}: ${message}`, {
      error: message
    });
    throw err;
  }
}
class ChatGptExportZipImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "chatgpt-export-zip");
    __publicField(this, "name", "ChatGPT Connector");
    __publicField(this, "description", "Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.");
    __publicField(this, "supportedExtensions", [".zip"]);
  }
  async import(file, context) {
    var _a, _b, _c, _d;
    const jobId = context.jobId ?? crypto.randomUUID();
    const errors2 = [];
    if (context.importPackage) {
      (_a = context.log) == null ? void 0 : _a.call(context, "info", `Using validated import package: ${context.importPackage.documents.length} document(s) — no ZIP re-parse`);
      return {
        jobId,
        success: true,
        documents: context.importPackage.documents,
        errors: errors2,
        summary: {
          conversationsFound: context.importPackage.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: errors2,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    }
    (_b = context.log) == null ? void 0 : _b.call(context, "info", `Starting memory-safe ChatGPT import: ${file.name}`);
    try {
      const importPackage = await runChatGptValidationPipeline(file, {
        log: (level, message) => {
          var _a2;
          return (_a2 = context.log) == null ? void 0 : _a2.call(context, level, message);
        },
        onProgress: (progress) => {
          var _a2;
          if (progress.conversationsTotal > 0) {
            const pct = Math.round(progress.conversationsProcessed / progress.conversationsTotal * 100);
            (_a2 = context.onProgress) == null ? void 0 : _a2.call(context, pct);
          }
        },
        signal: context.signal
      });
      (_c = context.log) == null ? void 0 : _c.call(context, "info", `Import package ready: ${importPackage.documents.length} document(s)`);
      return {
        jobId,
        success: true,
        documents: importPackage.documents,
        errors: errors2,
        summary: {
          conversationsFound: importPackage.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: errors2,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors2.push(message);
      (_d = context.log) == null ? void 0 : _d.call(context, "error", message);
      return {
        jobId,
        success: false,
        documents: [],
        errors: errors2,
        summary: {
          conversationsFound: 0,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: errors2,
          outputFolder: `${context.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    }
  }
}
class PdfImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "pdf");
    __publicField(this, "name", "PDF");
    __publicField(this, "description", "Import content from PDF documents.");
    __publicField(this, "supportedExtensions", [".pdf"]);
  }
}
class MarkdownImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "markdown");
    __publicField(this, "name", "Markdown");
    __publicField(this, "description", "Import Markdown (.md) files.");
    __publicField(this, "supportedExtensions", [".md", ".markdown"]);
  }
}
class HtmlImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "html");
    __publicField(this, "name", "HTML");
    __publicField(this, "description", "Import HTML web pages and exports.");
    __publicField(this, "supportedExtensions", [".html", ".htm"]);
  }
}
class DocxImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "docx");
    __publicField(this, "name", "DOCX");
    __publicField(this, "description", "Import Microsoft Word documents.");
    __publicField(this, "supportedExtensions", [".docx"]);
  }
}
class TxtImporter extends BaseImporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "txt");
    __publicField(this, "name", "Plain Text");
    __publicField(this, "description", "Import plain text files.");
    __publicField(this, "supportedExtensions", [".txt"]);
  }
}
const stubImporters = [
  new ChatGptExportZipImporter(),
  new PdfImporter(),
  new MarkdownImporter(),
  new HtmlImporter(),
  new DocxImporter(),
  new TxtImporter()
];
class ExporterRegistry {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(plugin) {
    this.plugins.set(plugin.id, plugin);
  }
  unregister(id) {
    this.plugins.delete(id);
  }
  get(id) {
    return this.plugins.get(id);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
}
const exporterRegistry = new ExporterRegistry();
class BaseExporter {
  async export(_documents, _repositoryPath, _context) {
    throw new NotImplementedError(`Exporter "${this.name}"`);
  }
}
const KRC_ID_PATTERN = /KRC-(\d{4})/gi;
const CONVERSATION_ID_PATTERN = /## ChatGPT Conversation ID\s*\n([^\n]+)/;
const CATEGORY_SUBDIRS = [
  "VIGS",
  "Founder_OS",
  "Axiom",
  "Book",
  "Knowledge_Recovery",
  "Source_Material",
  "Technical_Build",
  "Other_Review_Needed"
];
async function listMarkdownFilesRecursive(dir) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listMarkdownFilesRecursive(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}
async function findHighestKrcNumber(repositoryPath) {
  let highest = 0;
  const sourcesDir = path.join(repositoryPath, "Sources");
  const files = await listMarkdownFilesRecursive(sourcesDir);
  for (const filePath of files) {
    const base = path.basename(filePath);
    const match = base.match(/KRC-(\d{4})/i);
    if (match)
      highest = Math.max(highest, parseInt(match[1], 10));
  }
  const registryPath = path.join(repositoryPath, "Registries", "SOURCE_REGISTRY.md");
  try {
    const registry = await fs.readFile(registryPath, "utf8");
    for (const match of registry.matchAll(KRC_ID_PATTERN)) {
      highest = Math.max(highest, parseInt(match[1], 10));
    }
  } catch {
  }
  return highest;
}
function formatKrcId(num) {
  return `KRC-${String(num).padStart(4, "0")}`;
}
function slugifyTitle(title) {
  return title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 80) || "Untitled";
}
async function loadExistingConversationMap(repositoryPath) {
  const map = /* @__PURE__ */ new Map();
  const sourcesDir = path.join(repositoryPath, "Sources");
  const files = await listMarkdownFilesRecursive(sourcesDir);
  for (const filePath of files) {
    const base = path.basename(filePath);
    const krcMatch = base.match(/^(KRC-\d{4})/i);
    if (!krcMatch)
      continue;
    const content = await fs.readFile(filePath, "utf8");
    const convMatch = content.match(CONVERSATION_ID_PATTERN);
    if (convMatch) {
      map.set(convMatch[1].trim(), krcMatch[1].toUpperCase());
    }
  }
  return map;
}
async function ensureRepositoryDirs(repositoryPath) {
  await fs.mkdir(path.join(repositoryPath, "Sources"), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, "Uploads"), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, "Registries"), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, "ExecutiveSessions"), { recursive: true });
  for (const sub of CATEGORY_SUBDIRS) {
    await fs.mkdir(path.join(repositoryPath, "Sources", sub), { recursive: true });
    await fs.mkdir(path.join(repositoryPath, "ExecutiveSessions", sub), { recursive: true });
  }
}
async function safeWriteFile(filePath, content, overwrite) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
    if (!overwrite)
      return "skipped";
    await fs.writeFile(filePath, content, "utf8");
    return "updated";
  } catch {
    await fs.writeFile(filePath, content, "utf8");
    return "created";
  }
}
async function safeWriteBinaryFile(filePath, data, overwrite) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
    if (!overwrite)
      return "skipped";
    await fs.writeFile(filePath, data);
    return "updated";
  } catch {
    await fs.writeFile(filePath, data);
    return "created";
  }
}
function formatTimestamp$1(ts) {
  if (typeof ts !== "number")
    return "Unknown";
  const ms = ts > 1e12 ? ts : ts * 1e3;
  return new Date(ms).toISOString();
}
function extractSessionSummary(doc) {
  var _a, _b;
  const content = doc.content.trim();
  if (!content)
    return "No extractable conversation content. Flagged for manual review.";
  const userMatch = content.match(/### User\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/);
  const assistantMatch = content.match(/### Assistant\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/);
  const userText = ((_a = userMatch == null ? void 0 : userMatch[1]) == null ? void 0 : _a.trim().slice(0, 400)) ?? "";
  const assistantText = ((_b = assistantMatch == null ? void 0 : assistantMatch[1]) == null ? void 0 : _b.trim().slice(0, 400)) ?? "";
  const parts = [];
  if (userText)
    parts.push(`**User focus:** ${userText}${userText.length >= 400 ? "…" : ""}`);
  if (assistantText)
    parts.push(`**Assistant response:** ${assistantText}${assistantText.length >= 400 ? "…" : ""}`);
  return parts.join("\n\n") || content.slice(0, 600);
}
function extractKeyTopics(doc, classification) {
  const topics = /* @__PURE__ */ new Set();
  topics.add(classification.inferredProject);
  for (const term of classification.recurringTerms.slice(0, 5)) {
    topics.add(term);
  }
  if (typeof doc.metadata.pastedTranscriptCount === "number" && doc.metadata.pastedTranscriptCount > 0) {
    topics.add("Pasted source material");
  }
  return [...topics].filter(Boolean);
}
function buildExecutiveSessionMarkdown(krcId, doc, classification, sourceRelativePath) {
  const title = doc.title.trim() || "Untitled Conversation";
  const importDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const lines = [
    `# Executive Session Record — ${title}`,
    "",
    "## Source ID",
    krcId,
    "",
    "## Session Date",
    formatTimestamp$1(doc.metadata.createTime),
    "",
    "## Classification",
    `- Primary: ${classification.primaryCategory}`,
    `- Categories: ${classification.categories.join(", ")}`,
    `- Confidence: ${classification.confidence}%`,
    `- Project: ${classification.inferredProject}`,
    `- Uncertain: ${classification.uncertain ? "Yes — review needed" : "No"}`,
    "",
    "## Rationale",
    classification.rationale,
    "",
    "## Session Summary",
    extractSessionSummary(doc),
    "",
    "## Key Topics",
    ...extractKeyTopics(doc, classification).map((t) => `- ${t}`),
    "",
    "## Recurring Terms",
    ...classification.recurringTerms.length > 0 ? classification.recurringTerms.map((t) => `- ${t}`) : ["- None detected"],
    "",
    "## Action / Follow-up",
    classification.uncertain ? "Manual review required. Verify project assignment and capability extraction." : "Pending detailed capability extraction.",
    "",
    "## Transcript Reference",
    sourceRelativePath,
    "",
    "## Notes",
    `Auto-generated by KAE on ${importDate}.`
  ];
  return lines.join("\n");
}
function buildExecutiveSessionFilename(krcId, doc) {
  const slug = doc.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Untitled";
  return `${krcId}_${slug}_SESSION.md`;
}
function deriveTopicFromContent(content) {
  var _a;
  const match = content.match(/## Topic\s*\n([^\n#]+)/);
  return ((_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) ?? "ChatGPT conversation import";
}
async function appendSourceRegistry(repositoryPath, entries) {
  if (entries.length === 0)
    return;
  const registryPath = path.join(repositoryPath, "Registries", "SOURCE_REGISTRY.md");
  let content;
  try {
    content = await fs.readFile(registryPath, "utf8");
  } catch {
    content = [
      "# Axiom Source Registry",
      "",
      "Campaign: Knowledge Recovery Campaign",
      "Repository Version: v0.3",
      "Sources Inventoried: 0",
      "",
      "| Source ID | Title | Topic | Primary Product | Status |",
      "|---|---|---|---|---|"
    ].join("\n");
  }
  const newRows = entries.map((e) => `| ${e.krcId} | ${e.title.replace(/\|/g, "\\|")} | ${e.topic.replace(/\|/g, "\\|")} | ${e.primaryProduct} | ${e.status} |`).join("\n");
  content = content.trimEnd() + "\n" + newRows + "\n";
  const totalMatch = content.match(/Sources Inventoried:\s*(\d+)/);
  const existingCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const newCount = existingCount + entries.length;
  content = content.replace(/Sources Inventoried:\s*\d+/, `Sources Inventoried: ${newCount}`);
  await fs.writeFile(registryPath, content, "utf8");
}
async function updateKrcStatus(repositoryPath, sourcesAdded, batchLabel) {
  if (sourcesAdded === 0)
    return;
  const statusPath = path.join(repositoryPath, "Registries", "KRC_STATUS.md");
  let content;
  try {
    content = await fs.readFile(statusPath, "utf8");
  } catch {
    content = [
      "# Knowledge Recovery Campaign",
      "",
      "Repository Version: v0.5",
      "",
      "Approximate Sources Inventoried: 0"
    ].join("\n");
  }
  const approxMatch = content.match(/Approximate Sources Inventoried:\s*(\d+)/);
  const currentApprox = approxMatch ? parseInt(approxMatch[1], 10) : 0;
  content = content.replace(/Approximate Sources Inventoried:\s*\d+/, `Approximate Sources Inventoried: ${currentApprox + sourcesAdded}`);
  const importNote = `
${batchLabel}
- KAE import: ${sourcesAdded} new source(s) on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  if (!content.includes(batchLabel)) {
    content = content.trimEnd() + importNote + "\n";
  }
  await fs.writeFile(statusPath, content, "utf8");
}
function buildRegistryEntry(krcId, title, markdownContent, primaryProduct) {
  return {
    krcId,
    title,
    topic: deriveTopicFromContent(markdownContent),
    primaryProduct: primaryProduct ?? "TBD",
    status: markdownContent.includes("Review Needed") ? "Review Needed" : "Inventoried"
  };
}
function formatTimestamp(ts) {
  if (typeof ts !== "number")
    return "Unknown";
  const ms = ts > 1e12 ? ts : ts * 1e3;
  return new Date(ms).toISOString();
}
function deriveTopic(doc, classification) {
  if (classification.uncertain)
    return "Unclassified — review needed";
  const pastedCount = doc.metadata.pastedTranscriptCount;
  if (typeof pastedCount === "number" && pastedCount > 0) {
    return "Pasted source text / ChatGPT conversation";
  }
  return `${classification.primaryCategory} / ChatGPT conversation`;
}
function buildAppliesTo(classification) {
  const lines = [];
  const products = ["Axiom", "Founder OS", "VIGS"];
  for (const product of products) {
    const match = classification.categories.some((c) => c === product || product === "Founder OS" && c === "Founder OS");
    lines.push(`- ${product}: ${match ? "Yes" : "Possible"}`);
  }
  return lines;
}
function buildSourceMarkdown(krcId, doc, classification) {
  const title = doc.title.trim() || "Untitled Conversation";
  const conversationId = String(doc.metadata.conversationId ?? doc.id);
  const importDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const messageCount = doc.metadata.messageCount ?? 0;
  const lines = [
    `# ${krcId} — ${title}`,
    "",
    "## Status",
    classification.uncertain ? "Review Needed" : "Inventoried",
    "",
    "## Description",
    messageCount === 0 ? "Empty or unparseable ChatGPT conversation — preserved for review." : `ChatGPT conversation acquired by KAE (${messageCount} messages).`,
    "",
    "## Topic",
    deriveTopic(doc, classification),
    "",
    "## Primary Product",
    classification.uncertain ? "Review Needed" : classification.primaryCategory,
    "",
    "## Categories",
    ...classification.categories.map((c) => `- ${c}`),
    "",
    "## Inferred Project",
    classification.inferredProject,
    "",
    "## Classification Confidence",
    `${classification.confidence}%`,
    "",
    "## Classification Rationale",
    classification.rationale,
    "",
    "## Applies To",
    ...buildAppliesTo(classification),
    "",
    "## ChatGPT Conversation ID",
    conversationId,
    "",
    "## Create Time",
    formatTimestamp(doc.metadata.createTime),
    "",
    "## Update Time",
    formatTimestamp(doc.metadata.updateTime),
    "",
    "## Extraction Status",
    "Pending detailed capability extraction.",
    "",
    "## Notes",
    `Acquired by KAE from ChatGPT export on ${importDate}. Auto-classified.`,
    "",
    "## Transcript",
    "",
    doc.content.trim() || "_No extractable transcript content._"
  ];
  if (classification.recurringTerms.length > 0) {
    lines.push("", "## Recurring Terms", "");
    for (const term of classification.recurringTerms) {
      lines.push(`- ${term}`);
    }
  }
  const fileRefs = doc.metadata.fileReferences;
  if (Array.isArray(fileRefs) && fileRefs.length > 0) {
    lines.push("", "## File References", "");
    for (const ref of fileRefs) {
      if (typeof ref === "string")
        lines.push(`- ${ref}`);
    }
  }
  return lines.join("\n");
}
function buildSourceFilename(krcId, doc) {
  return `${krcId}_${slugifyTitle(doc.title)}.md`;
}
function resolveCategoryFolder(classification) {
  if (classification.uncertain || classification.primaryCategory === "Other / Review Needed") {
    return "Other_Review_Needed";
  }
  const folderMap = {
    VIGS: "VIGS",
    "Founder OS": "Founder_OS",
    Axiom: "Axiom",
    Book: "Book",
    "Knowledge Recovery": "Knowledge_Recovery",
    "Source Material": "Source_Material",
    "Technical Build": "Technical_Build",
    "Other / Review Needed": "Other_Review_Needed"
  };
  return folderMap[classification.primaryCategory] ?? "Other_Review_Needed";
}
function buildImportReviewSection(batch) {
  const lines = [
    `## Import Batch — ${batch.importDate}`,
    "",
    `- **Source file:** ${batch.importFileName}`,
    `- **Conversations processed:** ${batch.conversationsProcessed}`,
    `- **Classified:** ${batch.classified.length}`,
    `- **Uncertain / review needed:** ${batch.uncertain.length}`,
    `- **Skipped (duplicates):** ${batch.skipped.length}`,
    `- **Errors:** ${batch.errors.length}`,
    ""
  ];
  if (batch.classified.length > 0) {
    lines.push("### Classified", "", buildReviewTable(batch.classified), "");
  }
  if (batch.uncertain.length > 0) {
    lines.push("### Uncertain / Review Needed", "", buildReviewTable(batch.uncertain), "");
  }
  if (batch.skipped.length > 0) {
    lines.push("### Skipped", "", buildReviewTable(batch.skipped), "");
  }
  if (batch.errors.length > 0) {
    lines.push("### Errors", "", buildReviewTable(batch.errors), "");
  }
  lines.push("---", "");
  return lines.join("\n");
}
function buildReviewTable(entries) {
  const header = "| KRC ID | Title | Primary Category | All Categories | Confidence | Status | Notes |";
  const sep = "|---|---|---|---|---|---|---|";
  const rows = entries.map((e) => {
    const notes = [e.notes, e.sourcePath ? `Source: ${e.sourcePath}` : ""].filter(Boolean).join("; ");
    return `| ${e.krcId} | ${escapeCell(e.title)} | ${e.primaryCategory} | ${e.categories.join(", ")} | ${e.confidence}% | ${e.status} | ${escapeCell(notes)} |`;
  });
  return [header, sep, ...rows].join("\n");
}
function escapeCell(value) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function buildImportReviewHeader() {
  return [
    "# Import Review",
    "",
    "Auto-generated by KAE. Lists conversation classifications, uncertain items, skips, and errors.",
    ""
  ].join("\n");
}
async function appendImportReview(repositoryPath, batch) {
  const reviewPath = path.join(repositoryPath, "Registries", "IMPORT_REVIEW.md");
  let content;
  try {
    content = await fs.readFile(reviewPath, "utf8");
  } catch {
    content = buildImportReviewHeader();
  }
  content = content.trimEnd() + "\n\n" + buildImportReviewSection(batch);
  await fs.writeFile(reviewPath, content, "utf8");
  return reviewPath;
}
function loadAssetsFromZip(zipPath, refs) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const entryByPath = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    if (entry.isDirectory)
      continue;
    entryByPath.set(entry.entryName.replace(/\\/g, "/"), entry);
  }
  const loaded = /* @__PURE__ */ new Map();
  for (const ref of refs) {
    const entry = entryByPath.get(ref.zipPath);
    if (entry)
      loaded.set(ref.zipPath, entry.getData());
  }
  return loaded;
}
async function writeAxiomSources(documents, repositoryPath, context) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const errors2 = [];
  const createdSourceIds = [];
  let sourcesCreated = 0;
  let sessionsCreated = 0;
  let skippedDuplicates = 0;
  let classified = 0;
  let uncertain = 0;
  await ensureRepositoryDirs(repositoryPath);
  const classifications = classifyConversationBatch(documents);
  for (const doc of documents) {
    const convId = String(doc.metadata.conversationId ?? doc.id);
    doc.metadata.classification = classifications.get(convId);
  }
  let nextKrcNum = await findHighestKrcNumber(repositoryPath) + 1;
  const existingConversations = await loadExistingConversationMap(repositoryPath);
  const newRegistryEntries = [];
  const importBatchLabel = `KAE Import — ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  const batchUploadDir = path.join(repositoryPath, "Uploads", `chatgpt-import-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`);
  let assetsWritten = false;
  const reviewBatch = {
    importDate: (/* @__PURE__ */ new Date()).toISOString(),
    importFileName: (context == null ? void 0 : context.importFileName) ?? "unknown.zip",
    conversationsProcessed: documents.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: []
  };
  const total = documents.length;
  let processed = 0;
  for (const doc of documents) {
    processed++;
    (_a = context == null ? void 0 : context.onProgress) == null ? void 0 : _a.call(context, Math.round(processed / total * 100));
    const conversationId = String(doc.metadata.conversationId ?? doc.id);
    const classification = classifications.get(conversationId) ?? classifyConversation(doc);
    doc.metadata.classification = classification;
    const existingKrcId = existingConversations.get(conversationId);
    const categoryFolder = resolveCategoryFolder(classification);
    let krcId;
    let overwrite;
    if (existingKrcId) {
      krcId = existingKrcId;
      overwrite = true;
      (_b = context == null ? void 0 : context.log) == null ? void 0 : _b.call(context, "info", `Updating existing source ${krcId} for conversation ${conversationId}`);
    } else {
      krcId = formatKrcId(nextKrcNum);
      nextKrcNum++;
      overwrite = false;
    }
    const filename = buildSourceFilename(krcId, doc);
    const sourcePath = path.join(repositoryPath, "Sources", categoryFolder, filename);
    const sourceRelativePath = `Sources/${categoryFolder}/${filename}`;
    const markdown = buildSourceMarkdown(krcId, doc, classification);
    const sessionFilename = buildExecutiveSessionFilename(krcId, doc);
    const sessionPath = path.join(repositoryPath, "ExecutiveSessions", categoryFolder, sessionFilename);
    const sessionRelativePath = `ExecutiveSessions/${categoryFolder}/${sessionFilename}`;
    const sessionMarkdown = buildExecutiveSessionMarkdown(krcId, doc, classification, sourceRelativePath);
    const reviewEntry = {
      krcId,
      conversationId,
      title: doc.title,
      primaryCategory: classification.primaryCategory,
      categories: classification.categories,
      confidence: classification.confidence,
      uncertain: classification.uncertain,
      status: "classified",
      sourcePath: sourceRelativePath,
      sessionPath: sessionRelativePath
    };
    try {
      const result = await safeWriteFile(sourcePath, markdown, overwrite);
      if (result === "skipped") {
        skippedDuplicates++;
        reviewEntry.status = "skipped";
        reviewEntry.notes = "Duplicate file — not overwritten";
        reviewBatch.skipped.push(reviewEntry);
        (_c = context == null ? void 0 : context.log) == null ? void 0 : _c.call(context, "warn", `Skipped duplicate file: ${filename}`);
        continue;
      }
      existingConversations.set(conversationId, krcId);
      if (result === "created") {
        sourcesCreated++;
        createdSourceIds.push(krcId);
        newRegistryEntries.push(buildRegistryEntry(krcId, doc.title, markdown, classification.uncertain ? "Review Needed" : classification.primaryCategory));
      } else if (result === "updated") {
        reviewEntry.status = "updated";
      }
      await safeWriteFile(sessionPath, sessionMarkdown, overwrite);
      sessionsCreated++;
      (_d = context == null ? void 0 : context.log) == null ? void 0 : _d.call(context, "info", `Executive session: ${sessionRelativePath}`);
      if (classification.uncertain) {
        uncertain++;
        reviewEntry.status = reviewEntry.status === "updated" ? "updated" : "uncertain";
        reviewBatch.uncertain.push(reviewEntry);
      } else {
        classified++;
        reviewBatch.classified.push(reviewEntry);
      }
      (_e = context == null ? void 0 : context.log) == null ? void 0 : _e.call(context, "info", `${result === "created" ? "Created" : "Updated"} [${classification.primaryCategory}] ${krcId}: ${sourceRelativePath}`);
      if (!assetsWritten) {
        await writeBatchAssets(batchUploadDir, doc, context);
        assetsWritten = true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors2.push(`${krcId}: ${message}`);
      reviewEntry.status = "error";
      reviewEntry.notes = message;
      reviewBatch.errors.push(reviewEntry);
      (_f = context == null ? void 0 : context.log) == null ? void 0 : _f.call(context, "error", `Failed to write ${krcId}: ${message}`);
    }
  }
  let reviewFile;
  try {
    if (newRegistryEntries.length > 0) {
      await appendSourceRegistry(repositoryPath, newRegistryEntries);
    }
    await updateKrcStatus(repositoryPath, newRegistryEntries.length, importBatchLabel);
    reviewFile = await appendImportReview(repositoryPath, reviewBatch);
    (_g = context == null ? void 0 : context.log) == null ? void 0 : _g.call(context, "info", `Import review written: ${reviewFile}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors2.push(`Registry/review update: ${message}`);
    (_h = context == null ? void 0 : context.log) == null ? void 0 : _h.call(context, "error", message);
  }
  const outputFolder = path.join(repositoryPath, "Sources");
  return {
    sourcesCreated,
    sessionsCreated,
    skippedDuplicates,
    errors: errors2,
    outputFolder,
    createdSourceIds,
    classified,
    uncertain,
    reviewFile
  };
}
async function writeBatchAssets(uploadDir, doc, context) {
  var _a, _b;
  const assets = doc.metadata.allZipAssets;
  if (!Array.isArray(assets) || assets.length === 0)
    return;
  await fs.mkdir(uploadDir, { recursive: true });
  const needsZipLoad = assets.some((a) => !a.dataBase64);
  let zipBuffers;
  if (needsZipLoad && (context == null ? void 0 : context.sourceZipPath)) {
    (_a = context.log) == null ? void 0 : _a.call(context, "info", `Extracting ${assets.length} asset(s) from ZIP at write time`);
    zipBuffers = loadAssetsFromZip(context.sourceZipPath, assets);
  }
  for (const asset of assets) {
    const data = asset.dataBase64 ? Buffer.from(asset.dataBase64, "base64") : zipBuffers == null ? void 0 : zipBuffers.get(asset.zipPath);
    if (!data || !asset.fileName)
      continue;
    const destPath = path.join(uploadDir, asset.fileName);
    const result = await safeWriteBinaryFile(destPath, data, false);
    if (result !== "skipped") {
      (_b = context == null ? void 0 : context.log) == null ? void 0 : _b.call(context, "info", `Preserved asset: Uploads/${path.basename(uploadDir)}/${asset.fileName}`);
    }
  }
}
class AxiomExporter extends BaseExporter {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "axiom");
    __publicField(this, "name", "Axiom Knowledge Repository");
  }
  async export(documents, repositoryPath, context) {
    return writeAxiomSources(documents, repositoryPath, context);
  }
}
const axiomExporter = new AxiomExporter();
const DEFAULT_REGISTRIES = [
  "Registries/SOURCE_REGISTRY.md",
  "Registries/KRC_STATUS.md",
  "Registries/IMPORT_REVIEW.md"
];
function buildImportDiffPreview(plannedRecords, uploadsPattern) {
  const sourcesAdded = [];
  const sourcesUpdated = [];
  const sessionsAdded = [];
  const sessionsUpdated = [];
  const duplicatesSkipped = [];
  for (const record of plannedRecords) {
    if (record.action === "create") {
      sourcesAdded.push(record.sourcePath);
      sessionsAdded.push(record.sessionPath);
    } else if (record.action === "update") {
      sourcesUpdated.push(record.sourcePath);
      sessionsUpdated.push(record.sessionPath);
    } else if (record.action === "skip") {
      duplicatesSkipped.push(record.sourcePath);
    }
  }
  const hasChanges = sourcesAdded.length + sourcesUpdated.length > 0;
  const registriesUpdated = hasChanges ? [...DEFAULT_REGISTRIES] : [];
  const uploadsAdded = hasChanges ? [uploadsPattern.replace("{timestamp}", "<timestamp>")] : [];
  const modifiedFiles = [...sourcesAdded, ...sourcesUpdated, ...sessionsAdded, ...sessionsUpdated];
  return {
    sourcesAdded,
    sourcesUpdated,
    sessionsAdded,
    sessionsUpdated,
    registriesUpdated,
    uploadsAdded,
    duplicatesSkipped,
    modifiedFiles,
    deletedFiles: [],
    estimatedTotalChanges: sourcesAdded.length + sourcesUpdated.length + sessionsAdded.length + sessionsUpdated.length + registriesUpdated.length + uploadsAdded.length
  };
}
async function planAxiomImport(documents, repositoryPath, importFileName) {
  const errors2 = [];
  const warnings = [];
  const blockingErrors = [];
  const plannedRecords = [];
  let estimatedSourcesToCreate = 0;
  let estimatedSourcesToUpdate = 0;
  let estimatedDuplicatesSkipped = 0;
  let uncertainCount = 0;
  const classifications = classifyConversationBatch(documents);
  let nextKrcNum = await findHighestKrcNumber(repositoryPath) + 1;
  const existingConversations = await loadExistingConversationMap(repositoryPath);
  const sourcesRoot = path.join(repositoryPath, "Sources");
  const uploadsPattern = path.join(repositoryPath, "Uploads", "chatgpt-import-{timestamp}");
  const executiveSessionsRoot = path.join(repositoryPath, "ExecutiveSessions");
  const registryPath = path.join(repositoryPath, "Registries", "SOURCE_REGISTRY.md");
  const reviewPath = path.join(repositoryPath, "Registries", "IMPORT_REVIEW.md");
  let uploadedFilesCount = 0;
  const uploadedFileNames = [];
  const firstDoc = documents[0];
  if (firstDoc) {
    const assets = firstDoc.metadata.allZipAssets;
    if (Array.isArray(assets)) {
      uploadedFilesCount = assets.length;
      uploadedFileNames.push(...assets.map((a) => a.fileName).filter(Boolean));
    }
  }
  for (const doc of documents) {
    const conversationId = String(doc.metadata.conversationId ?? doc.id);
    const classification = classifications.get(conversationId) ?? classifyConversation(doc);
    const existingKrcId = existingConversations.get(conversationId);
    const categoryFolder = resolveCategoryFolder(classification);
    let krcId;
    let action;
    if (existingKrcId) {
      krcId = existingKrcId;
      action = "update";
    } else {
      krcId = formatKrcId(nextKrcNum);
      nextKrcNum++;
      action = "create";
    }
    const filename = buildSourceFilename(krcId, doc);
    const sourcePath = path.join(sourcesRoot, categoryFolder, filename);
    const sourceRelativePath = `Sources/${categoryFolder}/${filename}`;
    const sessionFilename = buildExecutiveSessionFilename(krcId, doc);
    const sessionRelativePath = `ExecutiveSessions/${categoryFolder}/${sessionFilename}`;
    if (action === "create") {
      try {
        await fs.access(sourcePath);
        action = "skip";
      } catch {
      }
    }
    if (action === "create")
      estimatedSourcesToCreate++;
    else if (action === "update")
      estimatedSourcesToUpdate++;
    else if (action === "skip")
      estimatedDuplicatesSkipped++;
    if (classification.uncertain)
      uncertainCount++;
    plannedRecords.push({
      conversationId,
      title: doc.title,
      krcId,
      action,
      primaryCategory: classification.primaryCategory,
      categories: classification.categories,
      uncertain: classification.uncertain,
      sourcePath: sourceRelativePath,
      sessionPath: sessionRelativePath
    });
  }
  if (uncertainCount > 0) {
    warnings.push(`${uncertainCount} conversation(s) require manual review (uncertain classification).`);
  }
  if (estimatedDuplicatesSkipped > 0) {
    warnings.push(`${estimatedDuplicatesSkipped} file(s) already exist and will be skipped.`);
  }
  try {
    await fs.access(repositoryPath);
  } catch {
    warnings.push("Repository path does not exist yet — it will be created on import.");
  }
  const valid = blockingErrors.length === 0 && documents.length > 0;
  const diffPreview = buildImportDiffPreview(plannedRecords, uploadsPattern);
  return {
    valid,
    fileName: importFileName,
    filePath: "",
    zipReadable: true,
    chatGptStructureDetected: true,
    conversationsJsonPresent: true,
    conversationsFound: documents.length,
    uploadedFilesCount,
    uploadedFileNames,
    estimatedSourcesToCreate,
    estimatedSourcesToUpdate,
    estimatedDuplicatesSkipped,
    uncertainCount,
    errors: errors2,
    warnings,
    blockingErrors,
    plannedRecords,
    diffPreview,
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot,
      uploadsPattern,
      executiveSessionsRoot,
      registryPath,
      reviewPath
    },
    repositoryPath
  };
}
function buildFailedValidationReport(fileName, filePath, repositoryPath, error) {
  return {
    valid: false,
    fileName,
    filePath,
    zipReadable: false,
    chatGptStructureDetected: false,
    conversationsJsonPresent: false,
    conversationsFound: 0,
    uploadedFilesCount: 0,
    uploadedFileNames: [],
    estimatedSourcesToCreate: 0,
    estimatedSourcesToUpdate: 0,
    estimatedDuplicatesSkipped: 0,
    uncertainCount: 0,
    errors: [error],
    warnings: [],
    blockingErrors: [error],
    plannedRecords: [],
    diffPreview: buildImportDiffPreview([], path.join(repositoryPath, "Uploads", "chatgpt-import-{timestamp}")),
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: path.join(repositoryPath, "Sources"),
      uploadsPattern: path.join(repositoryPath, "Uploads", "chatgpt-import-{timestamp}"),
      executiveSessionsRoot: path.join(repositoryPath, "ExecutiveSessions"),
      registryPath: path.join(repositoryPath, "Registries", "SOURCE_REGISTRY.md"),
      reviewPath: path.join(repositoryPath, "Registries", "IMPORT_REVIEW.md")
    },
    repositoryPath
  };
}
async function validateChatGptZipImport(file, repositoryPath, options = {}) {
  var _a, _b, _c, _d;
  const started = Date.now();
  const warnings = [];
  const log = (level, message, context) => {
    var _a2;
    (_a2 = options.log) == null ? void 0 : _a2.call(options, level, message, context);
  };
  try {
    log("info", "Validation started (read-only — repository will not be modified)", {
      fileName: file.name,
      repositoryPath
    });
    const importPackage = await runChatGptValidationPipeline(file, {
      log: options.log,
      onProgress: options.onProgress,
      signal: options.signal
    });
    (_a = options.onImportPackageReady) == null ? void 0 : _a.call(options, importPackage);
    (_b = options.onProgress) == null ? void 0 : _b.call(options, {
      status: "running",
      stage: "planning-import",
      stageLabel: "Planning import (read-only)",
      fileName: file.name,
      conversationsTotal: importPackage.documents.length,
      conversationsProcessed: importPackage.documents.length,
      messagesProcessed: importPackage.documents.reduce((sum, doc) => sum + Number(doc.metadata.messageCount ?? 0), 0),
      warningsGenerated: warnings.length,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      detail: "Scanning repository for planned changes"
    });
    log("info", "Planning import (read-only repository scan)…");
    const report = await planAxiomImport(importPackage.documents, repositoryPath, file.name);
    report.filePath = file.path;
    report.zipReadable = true;
    report.chatGptStructureDetected = true;
    report.conversationsJsonPresent = true;
    report.valid = report.blockingErrors.length === 0 && importPackage.documents.length > 0;
    report.validatedAt = (/* @__PURE__ */ new Date()).toISOString();
    report.durationMs = Date.now() - started;
    if (importPackage.documents.length === 0) {
      const msg = "No conversations found in export.";
      report.errors.push(msg);
      report.blockingErrors.push(msg);
      report.valid = false;
    }
    if (report.uncertainCount > 0) {
      const warning = `${report.uncertainCount} conversation(s) classified as uncertain and will route to Other / Review Needed.`;
      report.warnings.push(warning);
      warnings.push(warning);
    }
    if (report.estimatedDuplicatesSkipped > 0) {
      const warning = `${report.estimatedDuplicatesSkipped} duplicate(s) will be skipped during import.`;
      report.warnings.push(warning);
      warnings.push(warning);
    }
    if (warnings.length > 0) {
      log("warn", `Validation warnings: ${warnings.length}`, { warnings });
    }
    (_c = options.onProgress) == null ? void 0 : _c.call(options, {
      status: report.valid ? "complete" : "failed",
      stage: report.valid ? "completed" : "failed",
      stageLabel: report.valid ? "Validation complete" : "Validation failed",
      fileName: file.name,
      conversationsTotal: report.conversationsFound,
      conversationsProcessed: report.conversationsFound,
      messagesProcessed: importPackage.documents.reduce((sum, doc) => sum + Number(doc.metadata.messageCount ?? 0), 0),
      warningsGenerated: report.warnings.length,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      detail: report.valid ? `${report.conversationsFound} conversations ready for review` : report.blockingErrors.join("; ") || "Validation failed",
      error: report.valid ? void 0 : report.blockingErrors.join("; ") || "Validation failed"
    });
    if (report.valid) {
      log("info", `Validation completed successfully in ${report.durationMs}ms`, {
        conversationsFound: report.conversationsFound,
        estimatedSourcesToCreate: report.estimatedSourcesToCreate,
        estimatedSourcesToUpdate: report.estimatedSourcesToUpdate,
        warnings: report.warnings.length
      });
    } else {
      log("error", `Validation failed — repository unchanged. ${report.blockingErrors.join("; ")}`, {
        blockingErrors: report.blockingErrors,
        errors: report.errors
      });
    }
    return report;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cancelled = message.includes("cancelled");
    const report = buildFailedValidationReport(file.name, file.path, repositoryPath, message);
    report.durationMs = Date.now() - started;
    report.validatedAt = (/* @__PURE__ */ new Date()).toISOString();
    (_d = options.onProgress) == null ? void 0 : _d.call(options, {
      status: cancelled ? "cancelled" : "failed",
      stage: cancelled ? "cancelled" : "failed",
      stageLabel: cancelled ? "Validation cancelled" : "Validation failed",
      fileName: file.name,
      conversationsTotal: 0,
      conversationsProcessed: 0,
      messagesProcessed: 0,
      warningsGenerated: 0,
      startedAt: new Date(started).toISOString(),
      elapsedMs: Date.now() - started,
      error: message,
      detail: message
    });
    log(cancelled ? "warn" : "error", `Validation ${cancelled ? "cancelled" : "failed"} — repository unchanged. ${message}`, { error: message });
    return report;
  }
}
const execFileAsync$1 = promisify(execFile);
async function pathExists$2(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function findLatestSnapshot$1(repositoryPath) {
  const snapshotsDir = path.join(repositoryPath, ".kae-snapshots");
  try {
    const entries = await fs.readdir(snapshotsDir);
    const sorted = entries.sort().reverse();
    return sorted[0] ? path.join(snapshotsDir, sorted[0]) : void 0;
  } catch {
    return void 0;
  }
}
async function checkGitReadiness(repositoryPath, health) {
  const checks = [];
  let gitReady = false;
  let gitBranch;
  let gitDirty = false;
  try {
    const { stdout: branchOut } = await execFileAsync$1("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repositoryPath
    });
    gitBranch = branchOut.trim();
    gitReady = true;
    checks.push({
      id: "git-repo",
      label: "Git repository",
      passed: true,
      message: `Repository is under Git control (branch: ${gitBranch}).`,
      severity: "info"
    });
  } catch {
    checks.push({
      id: "git-repo",
      label: "Git repository",
      passed: false,
      message: "Repository path is not a Git repository.",
      severity: "warning"
    });
  }
  if (gitReady) {
    try {
      const { stdout: statusOut } = await execFileAsync$1("git", ["status", "--porcelain"], {
        cwd: repositoryPath
      });
      gitDirty = statusOut.trim().length > 0;
      checks.push({
        id: "git-clean",
        label: "Working tree clean",
        passed: !gitDirty,
        message: gitDirty ? "Working tree has uncommitted changes." : "Working tree is clean.",
        severity: gitDirty ? "warning" : "info"
      });
    } catch {
      checks.push({
        id: "git-clean",
        label: "Working tree clean",
        passed: false,
        message: "Unable to read Git status.",
        severity: "warning"
      });
    }
  }
  const duplicateIds = (health == null ? void 0 : health.duplicateIds) ?? [];
  checks.push({
    id: "duplicate-ids",
    label: "No duplicate KRC IDs",
    passed: duplicateIds.length === 0,
    message: duplicateIds.length === 0 ? "No duplicate source IDs detected." : `${duplicateIds.length} duplicate ID(s): ${duplicateIds.slice(0, 5).join(", ")}${duplicateIds.length > 5 ? "…" : ""}`,
    severity: duplicateIds.length > 0 ? "error" : "info"
  });
  const missingRegistries = (health == null ? void 0 : health.categorizedIssues.warnings.filter((i) => i.code === "MISSING_REGISTRY")) ?? [];
  checks.push({
    id: "registries",
    label: "Required registries present",
    passed: missingRegistries.length === 0,
    message: missingRegistries.length === 0 ? "All required registries are present." : `${missingRegistries.length} registry file(s) missing.`,
    severity: missingRegistries.length > 0 ? "warning" : "info"
  });
  const errors2 = (health == null ? void 0 : health.categorizedIssues.errors) ?? [];
  checks.push({
    id: "integrity",
    label: "No integrity errors",
    passed: errors2.length === 0,
    message: errors2.length === 0 ? "No broken references or integrity errors detected." : `${errors2.length} integrity error(s) require attention.`,
    severity: errors2.length > 0 ? "error" : "info"
  });
  const snapshotPath = await findLatestSnapshot$1(repositoryPath);
  checks.push({
    id: "snapshot",
    label: "Import snapshot available",
    passed: Boolean(snapshotPath),
    message: snapshotPath ? `Latest snapshot: ${path.basename(snapshotPath)}` : "No import snapshot found (created automatically before imports).",
    severity: snapshotPath ? "info" : "info"
  });
  if (!await pathExists$2(repositoryPath)) {
    checks.push({
      id: "repo-exists",
      label: "Repository path exists",
      passed: false,
      message: "Repository path does not exist yet.",
      severity: "warning"
    });
  }
  const blocking = checks.some((c) => !c.passed && c.severity === "error");
  const ready = !blocking && duplicateIds.length === 0;
  return {
    ready,
    status: ready ? "READY" : "NOT READY",
    checks
  };
}
const execFileAsync = promisify(execFile);
const KRC_PATTERN$1 = /KRC-\d{4}/g;
async function pathExists$1(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function collectMarkdownFiles$1(dir) {
  const results = [];
  if (!await pathExists$1(dir))
    return results;
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory())
        await walk(full);
      else if (entry.name.endsWith(".md"))
        results.push(full);
    }
  }
  await walk(dir);
  return results;
}
function toRelative$1(repositoryPath, absolutePath) {
  return path.relative(repositoryPath, absolutePath).replace(/\\/g, "/");
}
function pushIssue(issues, issue2) {
  issues.push(issue2);
}
async function checkRepositoryHealth(repositoryPath) {
  const issues = [];
  const duplicateIds = [];
  const idLocations = /* @__PURE__ */ new Map();
  if (!await pathExists$1(repositoryPath)) {
    pushIssue(issues, {
      severity: "warning",
      category: "warning",
      code: "REPO_MISSING",
      message: "Repository path does not exist.",
      path: repositoryPath,
      recovery: "Configure the repository path in Settings or import to create it."
    });
  }
  const requiredDirs = ["Sources", "ExecutiveSessions", "Registries", "Uploads"];
  for (const dir of requiredDirs) {
    const full = path.join(repositoryPath, dir);
    if (!await pathExists$1(full)) {
      pushIssue(issues, {
        severity: "warning",
        category: "warning",
        code: "MISSING_DIR",
        message: `Missing directory: ${dir}`,
        path: full,
        relativePath: dir,
        recovery: `Directory will be created automatically on first import.`
      });
    }
  }
  const registries = ["SOURCE_REGISTRY.md", "KRC_STATUS.md", "IMPORT_REVIEW.md"];
  for (const file of registries) {
    const full = path.join(repositoryPath, "Registries", file);
    if (!await pathExists$1(full)) {
      pushIssue(issues, {
        severity: "warning",
        category: "warning",
        code: "MISSING_REGISTRY",
        message: `Missing registry: ${file}`,
        path: full,
        relativePath: `Registries/${file}`,
        recovery: "Registry files are created during the first successful import."
      });
    }
  }
  const sourceFiles = await collectMarkdownFiles$1(path.join(repositoryPath, "Sources"));
  const sessionFiles = await collectMarkdownFiles$1(path.join(repositoryPath, "ExecutiveSessions"));
  const sessionByKrc = /* @__PURE__ */ new Map();
  for (const filePath of sessionFiles) {
    const name = path.basename(filePath);
    const match = name.match(KRC_PATTERN$1);
    if (match == null ? void 0 : match[0])
      sessionByKrc.set(match[0], filePath);
  }
  for (const filePath of sourceFiles) {
    const name = path.basename(filePath);
    const relativePath = toRelative$1(repositoryPath, filePath);
    const matches = name.match(KRC_PATTERN$1);
    if (!matches) {
      pushIssue(issues, {
        severity: "info",
        category: "info",
        code: "NO_KRC_ID",
        message: `Source file has no KRC ID in filename: ${name}`,
        path: filePath,
        relativePath
      });
      continue;
    }
    for (const id of matches) {
      const list = idLocations.get(id) ?? [];
      list.push(filePath);
      idLocations.set(id, list);
    }
    if (/[<>:"|?*]/.test(name)) {
      pushIssue(issues, {
        severity: "error",
        category: "error",
        code: "INVALID_FILENAME",
        message: `Invalid characters in filename: ${name}`,
        path: filePath,
        relativePath,
        recovery: "Rename the file to remove invalid characters."
      });
    }
    const krcId = matches[0];
    if (!sessionByKrc.has(krcId)) {
      pushIssue(issues, {
        severity: "warning",
        category: "warning",
        code: "MISSING_SESSION",
        message: `No executive session found for ${krcId}`,
        path: filePath,
        relativePath,
        recovery: "Re-import or manually create the executive session record."
      });
    }
    try {
      const content = await fs.readFile(filePath, "utf8");
      if (!content.includes("## Metadata") && !content.includes("Acquired by KAE")) {
        pushIssue(issues, {
          severity: "info",
          category: "info",
          code: "MISSING_METADATA",
          message: `Source ${krcId} may be missing standard metadata block`,
          path: filePath,
          relativePath
        });
      }
    } catch {
      pushIssue(issues, {
        severity: "error",
        category: "error",
        code: "UNREADABLE_FILE",
        message: `Unable to read source file: ${name}`,
        path: filePath,
        relativePath,
        recovery: "Verify file permissions and encoding."
      });
    }
  }
  for (const [id, locations] of idLocations) {
    if (locations.length > 1) {
      duplicateIds.push(id);
      pushIssue(issues, {
        severity: "error",
        category: "error",
        code: "DUPLICATE_ID",
        message: `Duplicate KRC ID ${id} found in ${locations.length} files`,
        path: locations[0],
        relativePath: toRelative$1(repositoryPath, locations[0]),
        recovery: "Remove or merge duplicate source files before committing."
      });
    }
  }
  if (sourceFiles.length === 0 && await pathExists$1(repositoryPath)) {
    pushIssue(issues, {
      severity: "info",
      category: "recommendation",
      code: "EMPTY_SOURCES",
      message: "No source files found in the repository.",
      recovery: "Import a ChatGPT export to populate the knowledge repository."
    });
  }
  if (!await pathExists$1(path.join(repositoryPath, ".kae-snapshots"))) {
    pushIssue(issues, {
      severity: "info",
      category: "recommendation",
      code: "NO_SNAPSHOTS",
      message: "No import snapshots yet.",
      recovery: "Snapshots are created automatically before each import."
    });
  }
  let gitReady = false;
  let gitBranch;
  let gitDirty;
  try {
    const { stdout: branchOut } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: repositoryPath
    });
    const { stdout: statusOut } = await execFileAsync("git", ["status", "--porcelain"], {
      cwd: repositoryPath
    });
    gitReady = true;
    gitBranch = branchOut.trim();
    gitDirty = statusOut.trim().length > 0;
    if (gitDirty) {
      pushIssue(issues, {
        severity: "info",
        category: "recommendation",
        code: "GIT_DIRTY",
        message: "Git working tree has uncommitted changes.",
        recovery: "Review changes and commit when ready."
      });
    }
  } catch {
    pushIssue(issues, {
      severity: "info",
      category: "recommendation",
      code: "NOT_GIT",
      message: "Repository is not initialized as a Git repository.",
      recovery: "Run git init in the repository folder for version control."
    });
  }
  const categorizedIssues = categorizeHealthIssues(issues);
  const hasErrors = categorizedIssues.errors.length > 0;
  const partial = {
    ready: !hasErrors && await pathExists$1(repositoryPath),
    statusLevel: "healthy",
    statusHeadline: "",
    statusSubline: "",
    repositoryPath,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sourceCount: sourceFiles.length,
    sessionCount: sessionFiles.length,
    duplicateIds,
    issues,
    categorizedIssues,
    gitReady,
    gitBranch,
    gitDirty,
    gitReadiness: { ready: false, status: "NOT READY", checks: [] }
  };
  const status = getRepositoryStatusDisplay(partial);
  partial.statusLevel = status.level;
  partial.statusHeadline = status.headline;
  partial.statusSubline = status.subline;
  partial.gitReadiness = await checkGitReadiness(repositoryPath, partial);
  return partial;
}
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory())
      await copyDir(srcPath, destPath);
    else
      await fs.copyFile(srcPath, destPath);
  }
}
async function createRepositorySnapshot(repositoryPath, sessionId) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const snapshotRoot = path.join(repositoryPath, ".kae-snapshots", `${timestamp}_${sessionId}`);
  await fs.mkdir(snapshotRoot, { recursive: true });
  const dirsToSnapshot = ["Sources", "ExecutiveSessions", "Registries"];
  for (const dir of dirsToSnapshot) {
    const src = path.join(repositoryPath, dir);
    try {
      await fs.access(src);
      await copyDir(src, path.join(snapshotRoot, dir));
    } catch {
    }
  }
  return snapshotRoot;
}
async function writeSessionManifest(repositoryPath, manifest) {
  const sessionsDir = path.join(repositoryPath, ".kae-sessions");
  await fs.mkdir(sessionsDir, { recursive: true });
  const manifestPath = path.join(sessionsDir, `${manifest.sessionId}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return manifestPath;
}
const CHATGPT_IMPORT_KRC_MIN = 53;
const CHATGPT_IMPORT_KRC_MAX = 122;
function parseChatGptSourceTimes(content) {
  var _a;
  const header = content.slice(0, 4096);
  const titleMatch = header.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: titleMatch == null ? void 0 : titleMatch[1],
    title: (_a = titleMatch == null ? void 0 : titleMatch[2]) == null ? void 0 : _a.trim(),
    createTime: extractSection$1(header, "Create Time"),
    updateTime: extractSection$1(header, "Update Time")
  };
}
async function listChatGptImportEntries(repositoryPath) {
  const files = await browseRepository(repositoryPath);
  const imports = files.filter((f) => f.category === "sources" && isChatGptImportSourceFileName(f.name));
  const entries = [];
  for (const file of imports) {
    let header = "";
    try {
      const full = await readRepositoryFile(repositoryPath, file.relativePath);
      header = full.slice(0, 4096);
    } catch {
    }
    const meta = parseChatGptSourceTimes(header);
    const sortTime = meta.updateTime ?? meta.createTime ?? file.modifiedAt ?? "";
    entries.push({
      name: file.name,
      relativePath: file.relativePath,
      krcId: meta.krcId ?? file.name,
      title: meta.title ?? file.name.replace(/\.md$/i, ""),
      createTime: meta.createTime,
      updateTime: meta.updateTime,
      sortTime,
      sizeBytes: file.sizeBytes,
      modifiedAt: file.modifiedAt
    });
  }
  return entries.sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());
}
function isChatGptImportSourceFileName(fileName) {
  const match = fileName.match(/^KRC-(\d{4})_/i);
  if (!match)
    return false;
  const num = parseInt(match[1], 10);
  return num >= CHATGPT_IMPORT_KRC_MIN && num <= CHATGPT_IMPORT_KRC_MAX;
}
function extractSection$1(content, heading) {
  var _a;
  const pattern = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m");
  const match = content.match(pattern);
  return (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim();
}
function parseListSection(section) {
  if (!section)
    return [];
  return section.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
}
function parseMessageBlock(block) {
  var _a, _b, _c, _d;
  const lines = block.split("\n");
  const role = (_a = lines[0]) == null ? void 0 : _a.trim();
  if (!role)
    return null;
  let timestamp;
  let bodyStart = 1;
  if (((_b = lines[1]) == null ? void 0 : _b.startsWith("*")) && ((_c = lines[1]) == null ? void 0 : _c.endsWith("*"))) {
    timestamp = lines[1].slice(1, -1).trim();
    bodyStart = 2;
  }
  const rest = lines.slice(bodyStart).join("\n").trim();
  const fileSplit = rest.split(/\n\*\*File references:\*\*\s*\n/i);
  const text = ((_d = fileSplit[0]) == null ? void 0 : _d.trim()) ?? "";
  const fileReferences = [];
  if (fileSplit[1]) {
    for (const line of fileSplit[1].split("\n")) {
      const ref = line.replace(/^-\s*/, "").trim();
      if (ref)
        fileReferences.push(ref);
    }
  }
  return { role, timestamp, text, fileReferences };
}
function parseChatGptSourceMarkdown(content) {
  const titleMatch = content.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!titleMatch)
    return null;
  const transcriptIdx = content.indexOf("## Transcript");
  const header = transcriptIdx >= 0 ? content.slice(0, transcriptIdx) : content;
  const transcript = transcriptIdx >= 0 ? content.slice(transcriptIdx + "## Transcript".length) : "";
  const messages = [];
  for (const block of transcript.split(/^### /m).slice(1)) {
    const parsed = parseMessageBlock(block);
    if (parsed)
      messages.push(parsed);
  }
  return {
    krcId: titleMatch[1],
    title: titleMatch[2].trim(),
    conversationId: extractSection$1(header, "ChatGPT Conversation ID"),
    createTime: extractSection$1(header, "Create Time"),
    updateTime: extractSection$1(header, "Update Time"),
    description: extractSection$1(header, "Description"),
    fileReferences: parseListSection(extractSection$1(header, "File References")),
    messages
  };
}
function detectMimeType(buffer, refHint) {
  if (buffer.length >= 4 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return "image/jpeg";
  }
  if (buffer.length >= 6 && buffer[0] === 71 && buffer[1] === 73 && buffer[2] === 70) {
    return "image/gif";
  }
  if (buffer.length >= 12 && buffer[4] === 102 && buffer[5] === 116 && buffer[6] === 121 && buffer[7] === 112) {
    return "video/mp4";
  }
  if (buffer.length >= 4 && buffer[0] === 37 && buffer[1] === 80 && buffer[2] === 68 && buffer[3] === 70) {
    return "application/pdf";
  }
  const hint = (refHint == null ? void 0 : refHint.toLowerCase()) ?? "";
  if (hint.endsWith(".png"))
    return "image/png";
  if (hint.endsWith(".jpg") || hint.endsWith(".jpeg"))
    return "image/jpeg";
  if (hint.endsWith(".gif"))
    return "image/gif";
  if (hint.endsWith(".webp"))
    return "image/webp";
  if (hint.endsWith(".mp4"))
    return "video/mp4";
  if (hint.endsWith(".webm"))
    return "video/webm";
  if (hint.endsWith(".mov"))
    return "video/quicktime";
  return "application/octet-stream";
}
function assetKindFromMime(mimeType) {
  if (mimeType.startsWith("image/"))
    return "image";
  if (mimeType.startsWith("video/"))
    return "video";
  return "other";
}
async function findLatestChatGptUploadDir(repositoryPath) {
  const uploadsRoot = path.join(repositoryPath, "Uploads");
  let entries;
  try {
    entries = await fs.readdir(uploadsRoot);
  } catch {
    return null;
  }
  const importDirs = entries.filter((name) => name.startsWith("chatgpt-import-")).sort().reverse();
  if (importDirs.length === 0)
    return null;
  return `Uploads/${importDirs[0]}`;
}
async function buildUploadAssetIndex(repositoryPath, uploadRelativeDir) {
  const index = /* @__PURE__ */ new Map();
  const fullDir = path.join(repositoryPath, uploadRelativeDir);
  let files;
  try {
    files = await fs.readdir(fullDir);
  } catch {
    return index;
  }
  for (const fileName of files) {
    const relativePath = `${uploadRelativeDir}/${fileName}`.replace(/\\/g, "/");
    index.set(fileName.toLowerCase(), relativePath);
    const base = fileName.replace(/\.dat$/i, "");
    index.set(base.toLowerCase(), relativePath);
    if (base.startsWith("file_")) {
      index.set(base.slice("file_".length).toLowerCase(), relativePath);
    }
  }
  return index;
}
function resolveUploadRef(ref, index) {
  const trimmed = ref.trim();
  if (!trimmed)
    return null;
  const candidates = [
    trimmed,
    trimmed.toLowerCase(),
    `${trimmed}.dat`,
    `${trimmed.toLowerCase()}.dat`,
    trimmed.replace(/^file_/, ""),
    `file_${trimmed}`,
    `file_${trimmed}.dat`
  ];
  for (const candidate of candidates) {
    const hit = index.get(candidate.toLowerCase());
    if (hit)
      return hit;
  }
  const base = path.basename(trimmed).toLowerCase();
  for (const [key, value] of index.entries()) {
    if (key.includes(base) || base.includes(key))
      return value;
  }
  return null;
}
async function resolveChatGptAssets(repositoryPath, refs) {
  const uploadDir = await findLatestChatGptUploadDir(repositoryPath);
  if (!uploadDir)
    return [];
  const index = await buildUploadAssetIndex(repositoryPath, uploadDir);
  const resolved = [];
  const seen = /* @__PURE__ */ new Set();
  for (const ref of refs) {
    const relativePath = resolveUploadRef(ref, index);
    if (!relativePath || seen.has(relativePath))
      continue;
    seen.add(relativePath);
    const fullPath = path.join(repositoryPath, relativePath);
    let buffer;
    try {
      buffer = await fs.readFile(fullPath);
    } catch {
      continue;
    }
    const mimeType = detectMimeType(buffer, ref);
    resolved.push({
      ref,
      relativePath,
      fileName: path.basename(relativePath),
      mimeType,
      kind: assetKindFromMime(mimeType)
    });
  }
  return resolved;
}
function extractSection(content, heading) {
  var _a;
  const pattern = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m");
  const match = content.match(pattern);
  return (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim();
}
function parseExecutiveSessionMarkdown(content, fileName) {
  var _a;
  const titleMatch = content.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m);
  const title = ((_a = titleMatch == null ? void 0 : titleMatch[1]) == null ? void 0 : _a.trim()) ?? fileName.replace(/\.md$/i, "");
  const linkedKrcId = extractSection(content, "Source ID");
  const sessionDate = extractSection(content, "Session Date");
  const summaryText = extractSection(content, "Session Summary") ?? "";
  const transcriptReference = extractSection(content, "Transcript Reference");
  const summaryReferences = [];
  if (transcriptReference)
    summaryReferences.push(transcriptReference);
  for (const heading of ["Key Topics", "Recurring Terms", "Classification", "Rationale"]) {
    const section = extractSection(content, heading);
    if (!section)
      continue;
    for (const line of section.split("\n")) {
      const trimmed = line.replace(/^-\s*/, "").trim();
      if (trimmed)
        summaryReferences.push(trimmed);
    }
  }
  const sessionId = fileName.replace(/\.md$/i, "");
  return {
    sessionId,
    title,
    linkedKrcId,
    sessionDate,
    summaryText,
    summaryReferences: [...new Set(summaryReferences)],
    transcriptReference
  };
}
const EVIDENCE_INDEX_DIR = ".kae-index";
const EVIDENCE_INDEX_FILE = "evidence-index.json";
const EVIDENCE_INDEX_VERSION = 1;
function evidenceIndexPath(repositoryPath) {
  return path.join(repositoryPath, EVIDENCE_INDEX_DIR, EVIDENCE_INDEX_FILE);
}
async function loadEvidenceIndex(repositoryPath) {
  const indexPath = evidenceIndexPath(repositoryPath);
  try {
    const raw = await fs.readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed.version !== EVIDENCE_INDEX_VERSION || !Array.isArray(parsed.records)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
async function saveEvidenceIndex(repositoryPath, index) {
  const dir = path.join(repositoryPath, EVIDENCE_INDEX_DIR);
  await fs.mkdir(dir, { recursive: true });
  const indexPath = evidenceIndexPath(repositoryPath);
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
  return indexPath;
}
const STOP_WORDS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "been",
  "from",
  "with",
  "this",
  "that",
  "they",
  "will",
  "your",
  "what",
  "when",
  "how",
  "who",
  "why",
  "which"
]);
function tokenizeSearchTerms(text) {
  const tokens = text.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  return [...new Set(tokens)];
}
function tokenizeQuery(query) {
  const trimmed = query.trim();
  if (!trimmed)
    return [];
  if (/^krc-\d{4}$/i.test(trimmed)) {
    return [trimmed.toLowerCase()];
  }
  const phrase = trimmed.toLowerCase();
  const tokens = tokenizeSearchTerms(trimmed);
  if (tokens.length === 0 && phrase.length > 0) {
    return [phrase];
  }
  return tokens;
}
function excerpt(text, max = 160) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}
function inferSourceType(fileName) {
  if (isChatGptImportSourceFileName(fileName))
    return "chatgpt-import";
  if (fileName.startsWith("KRC-"))
    return "krc-source";
  return "markdown";
}
function countByKind(records) {
  const stats = {
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    recordCount: records.length,
    sources: 0,
    conversations: 0,
    messages: 0,
    attachments: 0,
    executiveSessions: 0
  };
  for (const record of records) {
    switch (record.kind) {
      case "source":
        stats.sources += 1;
        break;
      case "conversation":
        stats.conversations += 1;
        break;
      case "message":
        stats.messages += 1;
        break;
      case "attachment":
        stats.attachments += 1;
        break;
      case "executive_session":
        stats.executiveSessions += 1;
        break;
    }
  }
  return stats;
}
function indexChatGptSource(relativePath, content, uploadIndex, records) {
  const parsed = parseChatGptSourceMarkdown(content);
  if (!parsed)
    return;
  const sourceType = inferSourceType(path.basename(relativePath));
  const repository = {
    krcId: parsed.krcId,
    repositoryPath: relativePath,
    category: "sources",
    sourceType
  };
  const conversation = {
    conversationId: parsed.conversationId,
    title: parsed.title,
    created: parsed.createTime,
    updated: parsed.updateTime
  };
  records.push({
    id: `${parsed.krcId}:source`,
    kind: "source",
    repository,
    conversation,
    excerpt: excerpt(parsed.description ?? parsed.title)
  });
  records.push({
    id: `${parsed.krcId}:conversation`,
    kind: "conversation",
    repository,
    conversation,
    excerpt: excerpt(parsed.title)
  });
  const attachmentRefs = new Set(parsed.fileReferences);
  const messageAttachmentLinks = /* @__PURE__ */ new Map();
  parsed.messages.forEach((message, index) => {
    const messageId = `${parsed.krcId}:msg:${index}`;
    const searchTerms = tokenizeSearchTerms(message.text);
    messageAttachmentLinks.set(messageId, message.fileReferences);
    records.push({
      id: messageId,
      kind: "message",
      repository,
      conversation,
      message: {
        messageId,
        role: message.role,
        timestamp: message.timestamp,
        text: message.text,
        searchTerms
      },
      excerpt: excerpt(message.text)
    });
    for (const ref of message.fileReferences) {
      attachmentRefs.add(ref);
    }
  });
  for (const ref of attachmentRefs) {
    const attachmentId = `${parsed.krcId}:att:${ref}`;
    const assetPath = uploadIndex ? resolveUploadRef(ref, uploadIndex) : null;
    const filename = path.basename(ref);
    let linkedMessageId;
    for (const [messageId, refs] of messageAttachmentLinks.entries()) {
      if (refs.includes(ref)) {
        linkedMessageId = messageId;
        break;
      }
    }
    records.push({
      id: attachmentId,
      kind: "attachment",
      repository,
      conversation,
      attachment: {
        attachmentId,
        filename,
        assetPath: assetPath ?? void 0,
        linkedMessageId,
        resolved: Boolean(assetPath)
      },
      excerpt: filename
    });
  }
}
function indexGenericSource(relativePath, content, records) {
  var _a;
  const fileName = path.basename(relativePath);
  const titleMatch = content.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m);
  const krcId = titleMatch == null ? void 0 : titleMatch[1];
  const title = ((_a = titleMatch == null ? void 0 : titleMatch[2]) == null ? void 0 : _a.trim()) ?? fileName.replace(/\.md$/i, "");
  records.push({
    id: `${relativePath}:source`,
    kind: "source",
    repository: {
      krcId,
      repositoryPath: relativePath,
      category: "sources",
      sourceType: inferSourceType(fileName)
    },
    conversation: { title },
    excerpt: excerpt(content)
  });
}
function indexExecutiveSession(relativePath, content, records) {
  const parsed = parseExecutiveSessionMarkdown(content, path.basename(relativePath));
  if (!parsed)
    return;
  const summaryText = [parsed.summaryText, ...parsed.summaryReferences].join("\n");
  records.push({
    id: `${relativePath}:session`,
    kind: "executive_session",
    repository: {
      krcId: parsed.linkedKrcId,
      repositoryPath: relativePath,
      category: "sessions",
      sourceType: "executive-session"
    },
    conversation: {
      title: parsed.title,
      created: parsed.sessionDate
    },
    session: {
      sessionId: parsed.sessionId,
      linkedKrcId: parsed.linkedKrcId,
      summaryReferences: parsed.summaryReferences,
      transcriptReference: parsed.transcriptReference
    },
    excerpt: excerpt(summaryText || parsed.title)
  });
}
async function buildEvidenceIndex(repositoryPath) {
  const files = await browseRepository(repositoryPath);
  const records = [];
  const uploadDir = await findLatestChatGptUploadDir(repositoryPath);
  const uploadIndex = uploadDir ? await buildUploadAssetIndex(repositoryPath, uploadDir) : null;
  for (const file of files) {
    if (!file.relativePath.endsWith(".md"))
      continue;
    if (file.category !== "sources" && file.category !== "sessions")
      continue;
    let content;
    try {
      content = await readRepositoryFile(repositoryPath, file.relativePath);
    } catch {
      continue;
    }
    if (file.category === "sessions") {
      indexExecutiveSession(file.relativePath, content, records);
      continue;
    }
    if (isChatGptImportSourceFileName(file.name) && parseChatGptSourceMarkdown(content)) {
      indexChatGptSource(file.relativePath, content, uploadIndex, records);
    } else {
      indexGenericSource(file.relativePath, content, records);
    }
  }
  const builtAt = (/* @__PURE__ */ new Date()).toISOString();
  const index = {
    version: EVIDENCE_INDEX_VERSION,
    repositoryPath,
    builtAt,
    recordCount: records.length,
    records
  };
  await saveEvidenceIndex(repositoryPath, index);
  return index;
}
function summarizeEvidenceIndex(index) {
  const stats = countByKind(index.records);
  stats.builtAt = index.builtAt;
  return stats;
}
function normalizeRole(role) {
  return role.trim().toLowerCase();
}
function isUserRole(role) {
  const normalized = normalizeRole(role);
  return normalized === "user" || normalized.startsWith("user ");
}
function isAssistantRole(role) {
  const normalized = normalizeRole(role);
  return normalized === "assistant" || normalized.startsWith("assistant ");
}
function recordCategory(record) {
  if (record.kind === "executive_session")
    return "session";
  if (record.kind === "attachment")
    return "attachment";
  if (record.repository.category === "sessions")
    return "session";
  return "source";
}
function resultTitle(record) {
  var _a, _b, _c, _d;
  if (record.kind === "attachment" && record.attachment) {
    return record.attachment.filename;
  }
  if (record.kind === "executive_session") {
    return ((_a = record.conversation) == null ? void 0 : _a.title) ?? ((_b = record.session) == null ? void 0 : _b.sessionId) ?? "Executive Session";
  }
  if (record.kind === "message" && record.message) {
    const title = ((_c = record.conversation) == null ? void 0 : _c.title) ?? record.repository.krcId ?? "Message";
    return `${title} — ${record.message.role}`;
  }
  return ((_d = record.conversation) == null ? void 0 : _d.title) ?? record.repository.krcId ?? record.repository.repositoryPath;
}
function drilldownPath(record) {
  var _a, _b, _c;
  if (record.kind === "executive_session") {
    if ((_a = record.session) == null ? void 0 : _a.transcriptReference) {
      return record.session.transcriptReference;
    }
    const sourceRef = (_b = record.session) == null ? void 0 : _b.summaryReferences.find((ref) => ref.startsWith("Sources/"));
    if (sourceRef)
      return sourceRef;
    return record.repository.repositoryPath;
  }
  if (record.kind === "attachment" && ((_c = record.attachment) == null ? void 0 : _c.assetPath)) {
    return record.repository.repositoryPath;
  }
  return record.repository.repositoryPath;
}
function haystackForRecord(record) {
  var _a, _b;
  const parts = [
    record.repository.krcId ?? "",
    record.repository.repositoryPath,
    ((_a = record.conversation) == null ? void 0 : _a.title) ?? "",
    ((_b = record.conversation) == null ? void 0 : _b.conversationId) ?? "",
    record.excerpt
  ];
  if (record.message) {
    parts.push(record.message.text, record.message.role, ...record.message.searchTerms);
  }
  if (record.attachment) {
    parts.push(record.attachment.filename, record.attachment.assetPath ?? "");
  }
  if (record.session) {
    parts.push(record.session.sessionId, record.session.linkedKrcId ?? "", ...record.session.summaryReferences);
  }
  return parts.join("\n").toLowerCase();
}
function scoreRecord(record, query, queryTokens) {
  var _a, _b, _c;
  const matchFields = /* @__PURE__ */ new Set();
  let score = 0;
  const qLower = query.toLowerCase();
  const krcId = (_a = record.repository.krcId) == null ? void 0 : _a.toLowerCase();
  if (krcId && (krcId === qLower || krcId.includes(qLower))) {
    score += 100;
    matchFields.add("krcId");
  }
  const title = ((_c = (_b = record.conversation) == null ? void 0 : _b.title) == null ? void 0 : _c.toLowerCase()) ?? "";
  if (title && title.includes(qLower)) {
    score += 40;
    matchFields.add("title");
  }
  if (record.kind === "attachment" && record.attachment) {
    const filename = record.attachment.filename.toLowerCase();
    if (filename.includes(qLower) || queryTokens.some((token) => filename.includes(token))) {
      score += 50;
      matchFields.add("filename");
      matchFields.add("attachment");
    }
  }
  if (record.kind === "message" && record.message) {
    const textLower = record.message.text.toLowerCase();
    const phraseHit = textLower.includes(qLower);
    const tokenHits = queryTokens.filter((token) => textLower.includes(token)).length;
    if (phraseHit || tokenHits > 0) {
      score += phraseHit ? 30 : tokenHits * 8;
      matchFields.add("message");
      matchFields.add("keyword");
      if (isUserRole(record.message.role)) {
        matchFields.add("prompt");
        if (phraseHit)
          score += 10;
      }
      if (isAssistantRole(record.message.role)) {
        matchFields.add("response");
        if (phraseHit)
          score += 10;
      }
    }
  }
  if (record.kind === "executive_session") {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower) || queryTokens.some((token) => haystack.includes(token))) {
      score += 25;
      matchFields.add("session");
      matchFields.add("keyword");
    }
  }
  if (record.kind === "source" || record.kind === "conversation") {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower) || queryTokens.some((token) => haystack.includes(token))) {
      score += 15;
      matchFields.add("keyword");
    }
  }
  if (score === 0) {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower)) {
      score += 5;
      matchFields.add("keyword");
    } else {
      const tokenHits = queryTokens.filter((token) => haystack.includes(token)).length;
      if (tokenHits > 0) {
        score += tokenHits * 3;
        matchFields.add("keyword");
      }
    }
  }
  return { score, matchFields: [...matchFields] };
}
function toSearchResult(record, score, matchFields) {
  var _a, _b, _c;
  return {
    recordId: record.id,
    kind: record.kind,
    score,
    matchFields,
    title: resultTitle(record),
    snippet: record.excerpt,
    drilldownPath: drilldownPath(record),
    krcId: record.repository.krcId,
    conversationTitle: (_a = record.conversation) == null ? void 0 : _a.title,
    messageRole: (_b = record.message) == null ? void 0 : _b.role,
    attachmentFilename: (_c = record.attachment) == null ? void 0 : _c.filename,
    category: recordCategory(record)
  };
}
function searchEvidenceIndex(index, query, limit = 50) {
  const trimmed = query.trim();
  if (!trimmed)
    return [];
  const queryTokens = tokenizeQuery(trimmed);
  const hits = [];
  for (const record of index.records) {
    const { score, matchFields } = scoreRecord(record, trimmed, queryTokens);
    if (score <= 0 || matchFields.length === 0)
      continue;
    hits.push(toSearchResult(record, score, matchFields));
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
function evidenceResultsToRepositoryResults(hits) {
  return hits.map((hit) => ({
    path: hit.drilldownPath,
    title: hit.title,
    snippet: hit.snippet,
    category: hit.category,
    score: hit.score,
    evidenceKind: hit.kind,
    recordId: hit.recordId,
    matchFields: hit.matchFields,
    krcId: hit.krcId,
    conversationTitle: hit.conversationTitle,
    messageRole: hit.messageRole,
    attachmentFilename: hit.attachmentFilename
  }));
}
async function ensureEvidenceIndex(repositoryPath) {
  const existing = await loadEvidenceIndex(repositoryPath);
  if (existing && existing.repositoryPath === repositoryPath) {
    return existing;
  }
  return buildEvidenceIndex(repositoryPath);
}
async function searchEvidence(repositoryPath, query, limit = 50) {
  const index = await ensureEvidenceIndex(repositoryPath);
  return searchEvidenceIndex(index, query, limit);
}
function categorizeRelativePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.startsWith("Sources/"))
    return "sources";
  if (normalized.startsWith("ExecutiveSessions/"))
    return "sessions";
  if (normalized.startsWith("Registries/"))
    return "registries";
  if (normalized.startsWith("ImportReports/"))
    return "reports";
  if (normalized.startsWith("Uploads/"))
    return "uploads";
  return "other";
}
async function walkRepository(root, current, entries) {
  const dirEntries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of dirEntries) {
    if (entry.name.startsWith(".kae-"))
      continue;
    const full = path.join(current, entry.name);
    const relative = path.relative(root, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      await walkRepository(root, full, entries);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".json")) {
      let sizeBytes;
      let modifiedAt;
      try {
        const stat = await fs.stat(full);
        sizeBytes = stat.size;
        modifiedAt = stat.mtime.toISOString();
      } catch {
      }
      entries.push({
        name: entry.name,
        relativePath: relative,
        category: categorizeRelativePath(relative),
        sizeBytes,
        modifiedAt
      });
    }
  }
}
async function browseRepository(repositoryPath) {
  const entries = [];
  try {
    await fs.access(repositoryPath);
    await walkRepository(repositoryPath, repositoryPath, entries);
  } catch {
    return [];
  }
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
async function readRepositoryFile(repositoryPath, relativePath) {
  const full = path.join(repositoryPath, relativePath);
  const normalizedRoot = path.resolve(repositoryPath);
  const normalizedFull = path.resolve(full);
  if (!normalizedFull.startsWith(normalizedRoot)) {
    throw new Error("Invalid file path.");
  }
  return fs.readFile(full, "utf8");
}
function snippetAroundMatch(content, index, radius = 80) {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
}
async function searchRepository(repositoryPath, query, limit = 50) {
  const q = query.trim();
  if (!q)
    return [];
  try {
    const hits = await searchEvidence(repositoryPath, q, limit);
    if (hits.length > 0) {
      return evidenceResultsToRepositoryResults(hits);
    }
  } catch {
  }
  return searchRepositoryLegacy(repositoryPath, q, limit);
}
async function searchRepositoryLegacy(repositoryPath, query, limit = 50) {
  const q = query.toLowerCase();
  const files = await browseRepository(repositoryPath);
  const results = [];
  for (const file of files) {
    if (!file.relativePath.endsWith(".md"))
      continue;
    let content;
    try {
      content = await readRepositoryFile(repositoryPath, file.relativePath);
    } catch {
      continue;
    }
    const lower = content.toLowerCase();
    const titleMatch = file.name.replace(/\.md$/i, "");
    let score = 0;
    if (titleMatch.toLowerCase().includes(q))
      score += 10;
    const occurrences = lower.split(q).length - 1;
    if (occurrences === 0)
      continue;
    score += occurrences;
    const index = lower.indexOf(q);
    results.push({
      path: file.relativePath,
      title: titleMatch,
      snippet: snippetAroundMatch(content, index),
      category: file.category === "sessions" ? "session" : file.category === "registries" ? "registry" : file.category === "reports" ? "report" : "source",
      score
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
async function findLatestSnapshot(repositoryPath) {
  const snapshotsDir = path.join(repositoryPath, ".kae-snapshots");
  try {
    const entries = await fs.readdir(snapshotsDir);
    const sorted = entries.sort().reverse();
    return sorted[0] ? path.join(snapshotsDir, sorted[0]) : void 0;
  } catch {
    return void 0;
  }
}
async function readLastImportDate(repositoryPath) {
  var _a;
  const reviewPath = path.join(repositoryPath, "Registries", "IMPORT_REVIEW.md");
  try {
    const content = await fs.readFile(reviewPath, "utf8");
    const match = content.match(/Import Date:\s*([^\n]+)/i);
    return (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim();
  } catch {
    return void 0;
  }
}
async function getRepositoryStats(repositoryPath) {
  const health = await checkRepositoryHealth(repositoryPath);
  let registryCount = 0;
  try {
    const regDir = path.join(repositoryPath, "Registries");
    const files = await fs.readdir(regDir);
    registryCount = files.filter((f) => f.endsWith(".md")).length;
  } catch {
    registryCount = 0;
  }
  return {
    repositoryPath,
    sourceCount: health.sourceCount,
    sessionCount: health.sessionCount,
    registryCount,
    lastImportDate: await readLastImportDate(repositoryPath),
    lastSnapshotPath: await findLatestSnapshot(repositoryPath),
    healthReady: health.ready,
    issueCount: health.issues.length
  };
}
function formatDuration(ms) {
  if (ms < 1e3)
    return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}
function buildReportMarkdown(report) {
  const lines = [
    "# KAE Import Report",
    "",
    `**Report ID:** ${report.reportId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Duration:** ${formatDuration(report.durationMs)}`,
    "",
    "## Summary",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Connector | ${report.connectorName} |`,
    `| Source file | ${report.sourceFile} |`,
    `| Repository | ${report.repositoryPath} |`,
    `| Imported | ${report.imported} |`,
    `| Updated | ${report.updated} |`,
    `| Skipped | ${report.skipped} |`,
    `| Sessions | ${report.sessionsCreated} |`,
    `| Git readiness | ${report.gitReadiness.status} |`,
    ""
  ];
  if (report.snapshotPath) {
    lines.push(`**Snapshot:** \`${report.snapshotPath}\``, "");
  }
  if (report.warnings.length > 0) {
    lines.push("## Warnings", "");
    for (const w of report.warnings)
      lines.push(`- ${w}`);
    lines.push("");
  }
  if (report.errors.length > 0) {
    lines.push("## Errors", "");
    for (const e of report.errors)
      lines.push(`- ${e}`);
    lines.push("");
  }
  if (report.sourcesCreated.length > 0) {
    lines.push("## Sources Created", "");
    for (const id of report.sourcesCreated)
      lines.push(`- ${id}`);
    lines.push("");
  }
  if (report.registriesUpdated.length > 0) {
    lines.push("## Registries Updated", "");
    for (const r of report.registriesUpdated)
      lines.push(`- ${r}`);
    lines.push("");
  }
  lines.push("## Git Readiness Checks", "");
  for (const check of report.gitReadiness.checks) {
    lines.push(`- ${check.passed ? "✓" : "✗"} **${check.label}** — ${check.message}`);
  }
  lines.push("", "---", "*Generated by KAE — Knowledge Acquisition Engine*");
  return lines.join("\n");
}
async function writeImportReport(repositoryPath, report) {
  const reportsDir = path.join(repositoryPath, "ImportReports");
  await fs.mkdir(reportsDir, { recursive: true });
  const timestamp = report.generatedAt.replace(/[:.]/g, "-");
  const fileName = `import-report-${timestamp}.md`;
  const reportFilePath = path.join(reportsDir, fileName);
  const markdown = buildReportMarkdown({ ...report });
  await fs.writeFile(reportFilePath, markdown, "utf8");
  return reportFilePath;
}
const KRC_PATTERN = /KRC-(\d{4})/i;
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function collectMarkdownFiles(dir) {
  const results = [];
  if (!await pathExists(dir))
    return results;
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory())
        await walk(full);
      else if (entry.name.endsWith(".md"))
        results.push(full);
    }
  }
  await walk(dir);
  return results;
}
function toRelative(repositoryPath, absolutePath) {
  return path.relative(repositoryPath, absolutePath).replace(/\\/g, "/");
}
function extractKrcId(fileName) {
  const match = fileName.match(KRC_PATTERN);
  return match ? match[0].toUpperCase() : null;
}
function categoryFromRelative(relativePath, root) {
  const parts = relativePath.replace(/\\/g, "/").split("/");
  if (parts[0] === root && parts.length >= 2)
    return parts[1] ?? "";
  return "";
}
async function scanSources(repositoryPath) {
  const sourcesDir = path.join(repositoryPath, "Sources");
  const files = await collectMarkdownFiles(sourcesDir);
  const results = [];
  for (const absolutePath of files) {
    const relativePath = toRelative(repositoryPath, absolutePath);
    const fileName = path.basename(absolutePath);
    const stat = await fs.stat(absolutePath);
    results.push({
      absolutePath,
      relativePath,
      fileName,
      krcId: extractKrcId(fileName),
      categoryFolder: categoryFromRelative(relativePath, "Sources"),
      mtimeMs: stat.mtimeMs
    });
  }
  return results;
}
async function scanSessions(repositoryPath) {
  const sessionsDir = path.join(repositoryPath, "ExecutiveSessions");
  const files = await collectMarkdownFiles(sessionsDir);
  const results = [];
  for (const absolutePath of files) {
    const relativePath = toRelative(repositoryPath, absolutePath);
    const fileName = path.basename(absolutePath);
    results.push({
      absolutePath,
      relativePath,
      fileName,
      krcId: extractKrcId(fileName),
      categoryFolder: categoryFromRelative(relativePath, "ExecutiveSessions")
    });
  }
  return results;
}
async function parseSourceRegistry(repositoryPath) {
  const registryPath = path.join(repositoryPath, "Registries", "SOURCE_REGISTRY.md");
  const rows = [];
  try {
    const content = await fs.readFile(registryPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\|\s*(KRC-\d{4})\s*\|\s*([^|]+)\s*\|/);
      if (match) {
        rows.push({
          krcId: match[1].toUpperCase(),
          title: match[2].trim(),
          line
        });
      }
    }
  } catch {
  }
  return rows;
}
async function listUploadFolders(repositoryPath) {
  const uploadsDir = path.join(repositoryPath, "Uploads");
  if (!await pathExists(uploadsDir))
    return [];
  const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => `Uploads/${e.name}`);
}
function issue(type, message, affectedFiles, extra) {
  return {
    id: randomUUID(),
    type,
    message,
    affectedFiles,
    ...extra
  };
}
async function analyzeRepositoryRepair(repositoryPath) {
  const issues = [];
  const sources = await scanSources(repositoryPath);
  const sessions = await scanSessions(repositoryPath);
  const registryRows = await parseSourceRegistry(repositoryPath);
  const uploadFolders = await listUploadFolders(repositoryPath);
  const sourcesByKrc = /* @__PURE__ */ new Map();
  const sessionsByKrc = /* @__PURE__ */ new Map();
  const registryByKrc = new Map(registryRows.map((r) => [r.krcId, r]));
  for (const source of sources) {
    if (!source.krcId) {
      issues.push(issue("invalid-krc-filename", `Source file has no valid KRC ID pattern: ${source.fileName}`, [source.relativePath]));
      continue;
    }
    const list = sourcesByKrc.get(source.krcId) ?? [];
    list.push(source);
    sourcesByKrc.set(source.krcId, list);
  }
  for (const session of sessions) {
    if (!session.krcId)
      continue;
    const list = sessionsByKrc.get(session.krcId) ?? [];
    list.push(session);
    sessionsByKrc.set(session.krcId, list);
  }
  for (const [krcId, locations] of sourcesByKrc) {
    if (locations.length > 1) {
      const paths = locations.map((s) => s.relativePath);
      issues.push(issue("duplicate-krc-id", `Duplicate KRC ID ${krcId} found in ${locations.length} source files`, paths, {
        krcId,
        details: {
          canonical: paths[0],
          duplicates: paths.slice(1),
          mtimes: locations.map((s) => s.mtimeMs)
        }
      }));
    }
  }
  for (const source of sources) {
    if (!source.krcId)
      continue;
    const sessionList = sessionsByKrc.get(source.krcId) ?? [];
    if (sessionList.length === 0) {
      issues.push(issue("missing-executive-session", `No executive session found for ${source.krcId}`, [source.relativePath], { krcId: source.krcId }));
    } else {
      const session = sessionList[0];
      if (session.categoryFolder !== source.categoryFolder) {
        issues.push(issue("source-session-mismatch", `Category mismatch for ${source.krcId}: source in ${source.categoryFolder}, session in ${session.categoryFolder}`, [source.relativePath, session.relativePath], { krcId: source.krcId }));
      }
    }
    if (!registryByKrc.has(source.krcId)) {
      issues.push(issue("missing-registry-entry", `Source ${source.krcId} is missing from SOURCE_REGISTRY.md`, [source.relativePath, "Registries/SOURCE_REGISTRY.md"], { krcId: source.krcId }));
    }
  }
  const sourceKrcIds = new Set(sources.map((s) => s.krcId).filter(Boolean));
  for (const session of sessions) {
    if (!session.krcId)
      continue;
    if (!sourceKrcIds.has(session.krcId)) {
      issues.push(issue("orphan-executive-session", `Executive session exists without matching source for ${session.krcId}`, [session.relativePath], { krcId: session.krcId }));
    }
  }
  for (const row of registryRows) {
    if (!sourceKrcIds.has(row.krcId)) {
      issues.push(issue("broken-registry-reference", `Registry references ${row.krcId} but no matching source file exists`, ["Registries/SOURCE_REGISTRY.md"], { krcId: row.krcId, details: { registryTitle: row.title } }));
    }
  }
  if (uploadFolders.length === 0 && sources.length > 0) {
    issues.push(issue("upload-folder-mismatch", "No upload folders found under Uploads/ — imported assets may be missing", ["Uploads/"]));
  }
  return issues;
}
async function generateRepairPlan(repositoryPath) {
  var _a;
  const issues = await analyzeRepositoryRepair(repositoryPath);
  const actions = [];
  for (const repairIssue of issues) {
    switch (repairIssue.type) {
      case "duplicate-krc-id": {
        const paths = repairIssue.affectedFiles;
        const mtimes = ((_a = repairIssue.details) == null ? void 0 : _a.mtimes) ?? [];
        const sorted = [...paths].sort((a, b) => {
          const aIdx = paths.indexOf(a);
          const bIdx = paths.indexOf(b);
          return (mtimes[aIdx] ?? 0) - (mtimes[bIdx] ?? 0);
        });
        const canonical = sorted[0];
        for (const duplicatePath of sorted.slice(1)) {
          actions.push({
            id: randomUUID(),
            issueId: repairIssue.id,
            type: "reassign-krc-id",
            description: `Reassign duplicate ${repairIssue.krcId} in ${duplicatePath}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${canonical}`,
            riskLevel: "medium",
            autoRepairSafe: true,
            manualReviewRequired: false,
            affectedFiles: [duplicatePath],
            metadata: {
              oldKrcId: repairIssue.krcId,
              canonicalPath: canonical
            }
          });
        }
        break;
      }
      case "missing-executive-session":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "generate-executive-session",
          description: `Generate executive session for ${repairIssue.krcId}`,
          proposedFix: "Create placeholder executive session from source metadata with repair provenance note",
          riskLevel: "low",
          autoRepairSafe: true,
          manualReviewRequired: false,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId }
        });
        break;
      case "missing-registry-entry":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "add-registry-entry",
          description: `Add registry entry for ${repairIssue.krcId}`,
          proposedFix: "Append row to SOURCE_REGISTRY.md from source file metadata",
          riskLevel: "low",
          autoRepairSafe: true,
          manualReviewRequired: false,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId }
        });
        break;
      case "source-session-mismatch":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "generate-executive-session",
          description: `Regenerate session in matching category for ${repairIssue.krcId}`,
          proposedFix: "Generate new executive session in source category folder; preserve existing session for manual review",
          riskLevel: "medium",
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId }
        });
        break;
      case "orphan-executive-session":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "flag-manual-review",
          description: `Review orphan session for ${repairIssue.krcId}`,
          proposedFix: "Manual review required — do not delete without confirmation",
          riskLevel: "high",
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles
        });
        break;
      case "broken-registry-reference":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "flag-manual-review",
          description: `Review broken registry reference for ${repairIssue.krcId}`,
          proposedFix: "Manual review required — registry row references missing source",
          riskLevel: "medium",
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId }
        });
        break;
      case "invalid-krc-filename":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "move-to-review",
          description: `Review source with invalid KRC filename: ${repairIssue.affectedFiles[0]}`,
          proposedFix: "Move to Other_Review_Needed and assign new KRC ID — requires manual confirmation",
          riskLevel: "high",
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles
        });
        break;
      case "upload-folder-mismatch":
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: "flag-manual-review",
          description: "Review missing upload folders",
          proposedFix: "Informational — re-import or verify asset uploads manually",
          riskLevel: "low",
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles
        });
        break;
    }
  }
  const autoRepairCount = actions.filter((a) => a.autoRepairSafe && !a.manualReviewRequired).length;
  const manualReviewCount = actions.filter((a) => a.manualReviewRequired).length;
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath,
    issues,
    actions,
    autoRepairCount,
    manualReviewCount
  };
}
function sectionValue(content, heading) {
  var _a, _b;
  const regex = new RegExp(`## ${heading}\\s*\\n([^#\\n][^\\n]*)`, "i");
  return (_b = (_a = content.match(regex)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim();
}
function parseSourceMarkdown(content, relativePath) {
  var _a, _b, _c;
  const fileName = relativePath.split("/").pop() ?? relativePath;
  const krcFromName = ((_b = (_a = fileName.match(/KRC-\d{4}/i)) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase()) ?? "KRC-0000";
  const titleMatch = content.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  const title = ((_c = titleMatch == null ? void 0 : titleMatch[2]) == null ? void 0 : _c.trim()) ?? sectionValue(content, "Description") ?? "Untitled";
  const parts = relativePath.replace(/\\/g, "/").split("/");
  const categoryFolder = parts[0] === "Sources" && parts.length >= 2 ? parts[1] : "Other_Review_Needed";
  return {
    krcId: krcFromName,
    title,
    primaryProduct: sectionValue(content, "Primary Product") ?? "Review Needed",
    topic: sectionValue(content, "Topic") ?? "ChatGPT conversation",
    status: sectionValue(content, "Status") ?? "Inventoried",
    conversationId: sectionValue(content, "ChatGPT Conversation ID"),
    createTime: sectionValue(content, "Create Time"),
    updateTime: sectionValue(content, "Update Time"),
    categoryFolder
  };
}
function patchSourceKrcId(content, oldKrcId, newKrcId, repairNote) {
  let updated = content;
  const escapedOld = oldKrcId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const titleMatch = content.match(new RegExp(`^#\\s*${escapedOld}\\s*[—–-]\\s*(.+)$`, "m"));
  if (titleMatch) {
    updated = updated.replace(new RegExp(`^#\\s*${escapedOld}\\s*[—–-]\\s*.+$`, "m"), `# ${newKrcId} — ${titleMatch[1].trim()}`);
  }
  if (updated.includes("## Source ID")) {
    updated = updated.replace(new RegExp(`(## Source ID\\s*\\n)${escapedOld}`, "i"), `$1${newKrcId}`);
  }
  if (!updated.includes("## KAE Repair Provenance")) {
    updated = `${updated.trimEnd()}

## KAE Repair Provenance
${repairNote}
`;
  }
  return updated;
}
const REPAIR_SESSION_NOTE = "Generated by KAE Repository Repair because source KRC existed without matching executive session.";
function buildRepairExecutiveSessionMarkdown(krcId, sourceRelativePath, parsed, repairNote = REPAIR_SESSION_NOTE) {
  const title = parsed.title;
  const sessionDate = parsed.createTime ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${title}`,
    "",
    "## Source ID",
    krcId,
    "",
    "## Session Date",
    sessionDate,
    "",
    "## Classification",
    `- Primary: ${parsed.primaryProduct}`,
    `- Status: ${parsed.status}`,
    "",
    "## Session Summary",
    `Placeholder executive session generated from source record ${krcId}.`,
    `Topic: ${parsed.topic}`,
    "",
    "## Key Topics",
    `- ${parsed.topic}`,
    "",
    "## Action / Follow-up",
    "Review source transcript and complete capability extraction when ready.",
    "",
    "## Transcript Reference",
    sourceRelativePath,
    "",
    "## Notes",
    repairNote,
    `Generated on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ].join("\n");
}
function buildRepairSessionFilename(krcId, title) {
  return `${krcId}_${slugifyTitle(title)}_SESSION.md`;
}
function buildRepairSourceFilename(krcId, title) {
  return `${krcId}_${slugifyTitle(title)}.md`;
}
const DUPLICATE_REPAIR_NOTE = (oldId, newId, date) => `Reassigned from ${oldId} to ${newId} by KAE Repository Repair on ${date}. Canonical record retains ${oldId}; this duplicate was preserved with a new ID.`;
async function executeReassignKrcId(repositoryPath, action, nextKrcCounter, log) {
  var _a;
  const sourceRelative = action.affectedFiles[0];
  if (!sourceRelative) {
    return {
      actionId: action.id,
      type: action.type,
      success: false,
      message: "No source file specified",
      filesChanged: []
    };
  }
  const oldKrcId = String(((_a = action.metadata) == null ? void 0 : _a.oldKrcId) ?? "");
  const sourcePath = path.join(repositoryPath, sourceRelative);
  const content = await fs.readFile(sourcePath, "utf8");
  const parsed = parseSourceMarkdown(content, sourceRelative);
  nextKrcCounter.value += 1;
  const newKrcId = formatKrcId(nextKrcCounter.value);
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const repairNote = DUPLICATE_REPAIR_NOTE(oldKrcId, newKrcId, date);
  const updatedContent = patchSourceKrcId(content, oldKrcId, newKrcId, repairNote);
  const categoryDir = path.join(repositoryPath, "Sources", parsed.categoryFolder);
  const newFileName = buildRepairSourceFilename(newKrcId, parsed.title);
  const newSourcePath = path.join(categoryDir, newFileName);
  const newSourceRelative = `Sources/${parsed.categoryFolder}/${newFileName}`;
  await fs.mkdir(categoryDir, { recursive: true });
  await fs.writeFile(newSourcePath, updatedContent, "utf8");
  if (newSourcePath !== sourcePath) {
    await fs.unlink(sourcePath);
  }
  const sessionDir = path.join(repositoryPath, "ExecutiveSessions", parsed.categoryFolder);
  await fs.mkdir(sessionDir, { recursive: true });
  const sessionFileName = buildRepairSessionFilename(newKrcId, parsed.title);
  const sessionPath = path.join(sessionDir, sessionFileName);
  const sessionRelative = `ExecutiveSessions/${parsed.categoryFolder}/${sessionFileName}`;
  const sessionContent = buildRepairExecutiveSessionMarkdown(newKrcId, newSourceRelative, { ...parsed, title: parsed.title }, `Generated by KAE Repository Repair after reassigning duplicate ${oldKrcId} → ${newKrcId}.`);
  await fs.writeFile(sessionPath, sessionContent, "utf8");
  await appendSourceRegistry(repositoryPath, [
    buildRegistryEntry(newKrcId, parsed.title, updatedContent, parsed.primaryProduct)
  ]);
  log("info", `Reassigned duplicate ${oldKrcId} → ${newKrcId}`, {
    oldPath: sourceRelative,
    newPath: newSourceRelative,
    sessionPath: sessionRelative
  });
  return {
    actionId: action.id,
    type: action.type,
    success: true,
    message: `Reassigned ${oldKrcId} → ${newKrcId}`,
    filesChanged: [newSourceRelative, sessionRelative, "Registries/SOURCE_REGISTRY.md"]
  };
}
async function executeGenerateSession(repositoryPath, action, log) {
  var _a;
  const sourceRelative = action.affectedFiles.find((f) => f.startsWith("Sources/"));
  if (!sourceRelative) {
    return {
      actionId: action.id,
      type: action.type,
      success: false,
      message: "No source file found for session generation",
      filesChanged: []
    };
  }
  const krcId = String(((_a = action.metadata) == null ? void 0 : _a.krcId) ?? "");
  const sourcePath = path.join(repositoryPath, sourceRelative);
  const content = await fs.readFile(sourcePath, "utf8");
  const parsed = parseSourceMarkdown(content, sourceRelative);
  const sessionDir = path.join(repositoryPath, "ExecutiveSessions", parsed.categoryFolder);
  await fs.mkdir(sessionDir, { recursive: true });
  const sessionFileName = buildRepairSessionFilename(krcId || parsed.krcId, parsed.title);
  const sessionPath = path.join(sessionDir, sessionFileName);
  const sessionRelative = `ExecutiveSessions/${parsed.categoryFolder}/${sessionFileName}`;
  if (await fileExists(sessionPath)) {
    return {
      actionId: action.id,
      type: action.type,
      success: false,
      message: `Session already exists: ${sessionRelative}`,
      filesChanged: []
    };
  }
  const sessionContent = buildRepairExecutiveSessionMarkdown(krcId || parsed.krcId, sourceRelative, parsed);
  await fs.writeFile(sessionPath, sessionContent, "utf8");
  log("info", `Generated executive session for ${krcId || parsed.krcId}`, {
    sessionPath: sessionRelative,
    sourcePath: sourceRelative
  });
  return {
    actionId: action.id,
    type: action.type,
    success: true,
    message: `Generated session for ${krcId || parsed.krcId}`,
    filesChanged: [sessionRelative]
  };
}
async function executeAddRegistryEntry(repositoryPath, action, log) {
  const sourceRelative = action.affectedFiles.find((f) => f.startsWith("Sources/"));
  if (!sourceRelative) {
    return {
      actionId: action.id,
      type: action.type,
      success: false,
      message: "No source file for registry entry",
      filesChanged: []
    };
  }
  const sourcePath = path.join(repositoryPath, sourceRelative);
  const content = await fs.readFile(sourcePath, "utf8");
  const parsed = parseSourceMarkdown(content, sourceRelative);
  await appendSourceRegistry(repositoryPath, [
    buildRegistryEntry(parsed.krcId, parsed.title, content, parsed.primaryProduct)
  ]);
  log("info", `Added registry entry for ${parsed.krcId}`, { sourcePath: sourceRelative });
  return {
    actionId: action.id,
    type: action.type,
    success: true,
    message: `Added registry entry for ${parsed.krcId}`,
    filesChanged: ["Registries/SOURCE_REGISTRY.md"]
  };
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function executeRepairPlan(plan, options = {}) {
  const log = options.log ?? (() => {
  });
  const sessionId = options.sessionId ?? `repair-${crypto.randomUUID()}`;
  const repositoryPath = plan.repositoryPath;
  const healthBefore = await checkRepositoryHealth(repositoryPath);
  log("info", "Pre-repair health check complete", {
    duplicateIds: healthBefore.duplicateIds,
    issueCount: healthBefore.issues.length
  });
  const snapshotPath = await createRepositorySnapshot(repositoryPath, sessionId);
  log("info", `Pre-repair snapshot created: ${snapshotPath}`, { snapshotPath });
  const safeActions = plan.actions.filter((a) => a.autoRepairSafe && !a.manualReviewRequired);
  const skipped = plan.actions.length - safeActions.length;
  let highestKrc = await findHighestKrcNumber(repositoryPath);
  const nextKrcCounter = { value: highestKrc };
  const results = [];
  const allFilesChanged = [];
  for (const action of safeActions) {
    try {
      let result;
      switch (action.type) {
        case "reassign-krc-id":
          result = await executeReassignKrcId(repositoryPath, action, nextKrcCounter, log);
          break;
        case "generate-executive-session":
          result = await executeGenerateSession(repositoryPath, action, log);
          break;
        case "add-registry-entry":
          result = await executeAddRegistryEntry(repositoryPath, action, log);
          break;
        default:
          result = {
            actionId: action.id,
            type: action.type,
            success: false,
            message: `Unsupported auto-repair action: ${action.type}`,
            filesChanged: []
          };
      }
      results.push(result);
      if (result.success)
        allFilesChanged.push(...result.filesChanged);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("error", `Repair action failed: ${action.description} — ${message}`, {
        actionId: action.id,
        type: action.type
      });
      results.push({
        actionId: action.id,
        type: action.type,
        success: false,
        message,
        filesChanged: []
      });
    }
  }
  const healthAfter = await checkRepositoryHealth(repositoryPath);
  log("info", "Post-repair health check complete", {
    duplicateIds: healthAfter.duplicateIds,
    issueCount: healthAfter.issues.length,
    ready: healthAfter.ready
  });
  return {
    completedAt: (/* @__PURE__ */ new Date()).toISOString(),
    snapshotPath,
    actionsExecuted: results,
    actionsSkipped: skipped,
    filesChanged: [...new Set(allFilesChanged)],
    healthBefore,
    healthAfter
  };
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
protocol.registerSchemesAsPrivileged([
  {
    scheme: "kae-asset",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  }
]);
function parseKaeAssetRequestUrl(url) {
  const prefix = "kae-asset://resolve/";
  if (!url.startsWith(prefix)) {
    throw new Error("Invalid asset URL.");
  }
  return decodeURIComponent(url.slice(prefix.length));
}
let mainWindow = null;
let lastValidationReport = null;
let lastValidatedImportPackage = null;
let lastValidatedFilePath = null;
let lastImportSummary = null;
let activeValidationAbort = null;
let lastRepairPlan = null;
let lastRepairResult = null;
const config = createDefaultConfig();
const jobQueue = new InMemoryJobQueue();
const logs = [];
function repoPath() {
  return config.repository.path;
}
function resolveRepoFile(relativePath) {
  const full = path.resolve(repoPath(), relativePath);
  const root = path.resolve(repoPath());
  if (!full.startsWith(root)) throw new Error("Invalid file path.");
  return full;
}
function addLog(level, source, message, context) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    source,
    message,
    context
  };
  logs.unshift(entry);
  if (logs.length > 500) logs.pop();
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:log-added", entry);
  return entry;
}
async function appendPersistentImportLog(message) {
  const logPath = path.join(repoPath(), ".kae-sessions", "import-trace.log");
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}
`;
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, line, "utf8");
  } catch {
  }
}
function createTimeline() {
  return [
    { id: "validate-zip", label: "Validate ZIP", status: "pending" },
    { id: "analyze-export", label: "Analyze Export", status: "pending" },
    { id: "generate-sources", label: "Generate Sources", status: "pending" },
    { id: "create-snapshot", label: "Create Snapshot", status: "pending" },
    { id: "update-repository", label: "Update Repository", status: "pending" },
    { id: "update-registries", label: "Update Registries", status: "pending" },
    { id: "health-check", label: "Health Check", status: "pending" },
    { id: "git-readiness", label: "Git Readiness", status: "pending" },
    { id: "complete", label: "Complete", status: "pending" }
  ];
}
function emitTimeline(steps) {
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:import-timeline", steps);
}
function setStep(steps, id, status, detail) {
  const step = steps.find((s) => s.id === id);
  if (step) {
    step.status = status;
    step.detail = detail;
  }
  emitTimeline([...steps]);
}
function registerPlugins() {
  stubImporters.forEach((importer) => importerRegistry.register(importer));
  exporterRegistry.register(axiomExporter);
  addLog("info", "system", `Registered ${stubImporters.length} connector plugin(s)`);
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${APP_NAME} — ${APP_FULL_NAME}`,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function emitValidationProgress(progress) {
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:validation-progress", progress);
}
async function validateImport(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const fileRef = { path: filePath, name: fileName, extension: ext };
  if (activeValidationAbort) {
    activeValidationAbort.abort();
  }
  activeValidationAbort = new AbortController();
  const { signal } = activeValidationAbort;
  addLog("info", "import", `Validating: ${fileName} (read-only — no repository writes)`, {
    filePath,
    fileName
  });
  try {
    const report = await validateChatGptZipImport(fileRef, repoPath(), {
      signal,
      log: (level, message, context) => addLog(level, "import", message, context),
      onProgress: emitValidationProgress,
      onImportPackageReady: (importPackage) => {
        lastValidatedImportPackage = importPackage;
        lastValidatedFilePath = filePath;
        void appendPersistentImportLog(
          `Validation cached import package: ${importPackage.documents.length} document(s) from ${fileName}`
        );
      }
    });
    lastValidationReport = report;
    if (report.valid) {
      addLog(
        "info",
        "import",
        `Validation complete in ${report.durationMs ?? 0}ms: ${report.conversationsFound} conversation(s) — awaiting user confirmation`,
        {
          conversationsFound: report.conversationsFound,
          estimatedSourcesToCreate: report.estimatedSourcesToCreate,
          estimatedSourcesToUpdate: report.estimatedSourcesToUpdate,
          warnings: report.warnings.length
        }
      );
    } else if (!signal.aborted) {
      addLog(
        "error",
        "import",
        `Validation failed — repository unchanged. ${report.blockingErrors.join("; ") || report.errors.join("; ") || "Unknown error"}`,
        {
          blockingErrors: report.blockingErrors,
          errors: report.errors
        }
      );
    }
    return report;
  } finally {
    activeValidationAbort = null;
  }
}
async function runImport(filePath, formatId) {
  var _a, _b, _c;
  const started = Date.now();
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const jobId = crypto.randomUUID();
  const fileRef = { path: filePath, name: fileName, extension: ext };
  const timeline = createTimeline();
  emitTimeline(timeline);
  await appendPersistentImportLog(`Confirm import started: ${fileName} (${filePath})`);
  setStep(timeline, "validate-zip", "running");
  addLog("info", "import", `Pre-import validation gate: ${fileName}`);
  let validationReport;
  try {
    if ((lastValidationReport == null ? void 0 : lastValidationReport.valid) && lastValidationReport.filePath === filePath && lastValidatedImportPackage && lastValidatedFilePath === filePath) {
      validationReport = lastValidationReport;
      await appendPersistentImportLog(
        `Reusing validated import package: ${lastValidatedImportPackage.documents.length} document(s) — no ZIP re-parse`
      );
      addLog(
        "info",
        "import",
        `Reusing cached validation and import package (${lastValidatedImportPackage.documents.length} documents)`
      );
    } else {
      validationReport = await validateChatGptZipImport(fileRef, repoPath(), {
        log: (level, message, context) => addLog(level, "import", message, context),
        onImportPackageReady: (importPackage) => {
          lastValidatedImportPackage = importPackage;
          lastValidatedFilePath = filePath;
        }
      });
      lastValidationReport = validationReport;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStep(timeline, "validate-zip", "failed", msg);
    addLog("error", "import", `Validation error — repository unchanged. ${msg}`);
    throw new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${msg}. Recovery: fix the export and validate again.`
    );
  }
  if (!validationReport.valid) {
    const reason = validationReport.blockingErrors.join("; ") || "Validation failed";
    setStep(timeline, "validate-zip", "failed", reason);
    addLog("error", "import", `Import blocked — repository unchanged. ${reason}`);
    throw new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${reason}. Recovery: review the validation report and fix the export.`
    );
  }
  setStep(timeline, "validate-zip", "complete", `${validationReport.conversationsFound} conversations`);
  const job = createImportJob(jobId, formatId, fileRef);
  job.status = "queued";
  jobQueue.enqueue(job);
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", job);
  jobQueue.updateStatus(jobId, "running", 0);
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", jobQueue.getById(jobId));
  const importer = importerRegistry.get(formatId);
  if (!importer) {
    const error = `No connector registered for format: ${formatId}`;
    jobQueue.updateStatus(jobId, "failed", 0, error);
    addLog("error", "import", `${error} — repository unchanged.`);
    throw new Error(error);
  }
  setStep(timeline, "create-snapshot", "running");
  addLog("info", "repository", "Creating pre-import snapshot…");
  const snapshotPath = await createRepositorySnapshot(repoPath(), jobId);
  const manifestPath = await writeSessionManifest(repoPath(), {
    sessionId: jobId,
    connectorId: formatId,
    sourceFile: fileName,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: repoPath(),
    snapshotPath,
    validationPassed: true,
    plannedCreates: validationReport.estimatedSourcesToCreate,
    plannedUpdates: validationReport.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: snapshotPath, manifestPath: "" }
  });
  setStep(timeline, "create-snapshot", "complete", path.basename(snapshotPath));
  addLog("info", "repository", `Snapshot saved: ${snapshotPath}`);
  setStep(timeline, "analyze-export", "running");
  await appendPersistentImportLog(
    `Analyze export: using cached package=${Boolean(lastValidatedImportPackage && lastValidatedFilePath === filePath)}, documents=${(lastValidatedImportPackage == null ? void 0 : lastValidatedImportPackage.documents.length) ?? "unknown"}`
  );
  const importContext = {
    repositoryPath: repoPath(),
    outputDirectory: config.settings.outputDirectory,
    jobId,
    importPackage: lastValidatedFilePath === filePath ? lastValidatedImportPackage ?? void 0 : void 0,
    sourceZipPath: filePath,
    log: (level, message) => addLog(level, "import", message),
    onProgress: (progress) => {
      jobQueue.updateStatus(jobId, "running", progress);
      mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", jobQueue.getById(jobId));
    }
  };
  addLog("info", "import", `Import started: ${fileName}`);
  const importResult = await importer.import(fileRef, importContext);
  if (!importResult.success || importResult.documents.length === 0) {
    const error = ((_a = importResult.errors) == null ? void 0 : _a.join("; ")) || "Import produced no documents";
    setStep(timeline, "analyze-export", "failed", error);
    jobQueue.updateStatus(jobId, "failed", 100, error);
    addLog(
      "error",
      "import",
      `Import failed after snapshot — repository may be partially updated. Rollback: ${snapshotPath}. Error: ${error}`
    );
    throw new Error(
      `Import failed. Snapshot available at ${snapshotPath}. What happened: connector produced no documents. Why: ${error}. Recovery: restore from snapshot if needed.`
    );
  }
  setStep(timeline, "analyze-export", "complete", `${importResult.documents.length} documents`);
  setStep(timeline, "generate-sources", "running");
  jobQueue.updateStatus(jobId, "running", 85);
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", jobQueue.getById(jobId));
  setStep(timeline, "update-repository", "running");
  const exportResult = await axiomExporter.export(importResult.documents, repoPath(), {
    log: (level, message) => addLog(level, "export", message),
    onProgress: (progress) => {
      jobQueue.updateStatus(jobId, "running", 85 + Math.round(progress * 0.15));
      mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", jobQueue.getById(jobId));
    },
    importFileName: fileName,
    sourceZipPath: filePath
  });
  setStep(timeline, "generate-sources", "complete");
  setStep(timeline, "update-repository", "complete", `${exportResult.sourcesCreated} sources`);
  setStep(timeline, "update-registries", "complete", exportResult.reviewFile ?? "Registries updated");
  setStep(timeline, "health-check", "running");
  const health = await checkRepositoryHealth(repoPath());
  setStep(timeline, "health-check", "complete", health.statusSubline);
  setStep(timeline, "git-readiness", "running");
  const gitReadiness = health.gitReadiness;
  setStep(timeline, "git-readiness", "complete", gitReadiness.status);
  const durationMs = Date.now() - started;
  const connector = importerRegistry.get(formatId);
  const summary = {
    conversationsFound: ((_b = importResult.summary) == null ? void 0 : _b.conversationsFound) ?? importResult.documents.length,
    sourcesCreated: exportResult.sourcesCreated,
    skippedDuplicates: exportResult.skippedDuplicates,
    errors: [...importResult.errors ?? [], ...exportResult.errors],
    outputFolder: exportResult.outputFolder,
    createdSourceIds: exportResult.createdSourceIds,
    classified: exportResult.classified,
    uncertain: exportResult.uncertain,
    reviewFile: exportResult.reviewFile,
    durationMs,
    connectorId: formatId,
    connectorName: (connector == null ? void 0 : connector.name) ?? formatId,
    sessionsCreated: exportResult.sessionsCreated ?? exportResult.sourcesCreated,
    snapshotPath,
    gitReadiness,
    timeline: [...timeline]
  };
  const importReport = {
    reportId: jobId,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs,
    connectorId: formatId,
    connectorName: (connector == null ? void 0 : connector.name) ?? "ChatGPT Connector",
    sourceFile: fileName,
    repositoryPath: repoPath(),
    imported: exportResult.sourcesCreated,
    updated: validationReport.estimatedSourcesToUpdate,
    skipped: exportResult.skippedDuplicates,
    warnings: validationReport.warnings,
    errors: summary.errors,
    sourcesCreated: exportResult.createdSourceIds,
    sessionsCreated: exportResult.sessionsCreated ?? exportResult.sourcesCreated,
    registriesUpdated: ((_c = validationReport.diffPreview) == null ? void 0 : _c.registriesUpdated) ?? [],
    snapshotPath,
    manifestPath,
    gitReadiness,
    reportFilePath: ""
  };
  try {
    summary.importReportPath = await writeImportReport(repoPath(), importReport);
    addLog("info", "import", `Import report saved: ${summary.importReportPath}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    summary.errors.push(`Import report: ${msg}`);
    addLog("warn", "import", `Could not write import report: ${msg}`);
  }
  setStep(timeline, "complete", "complete", `Done in ${(durationMs / 1e3).toFixed(1)}s`);
  summary.timeline = [...timeline];
  lastImportSummary = summary;
  const completedJob = jobQueue.getById(jobId);
  completedJob.summary = summary;
  jobQueue.updateStatus(jobId, "completed", 100);
  addLog(
    "info",
    "import",
    `Import complete in ${durationMs}ms: ${summary.sourcesCreated} source(s), ${summary.skippedDuplicates} skipped`,
    { summary, snapshotPath, manifestPath }
  );
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:job-updated", jobQueue.getById(jobId));
  mainWindow == null ? void 0 : mainWindow.webContents.send("kae:import-complete", summary);
  return summary;
}
function setupIpc() {
  ipcMain.handle(
    "kae:get-importers",
    () => importerRegistry.getAll().map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      supportedExtensions: i.supportedExtensions
    }))
  );
  ipcMain.handle("kae:get-repository-config", () => config.repository);
  ipcMain.handle("kae:set-repository-config", (_event, repo) => {
    config.repository = repo;
    addLog("info", "repository", `Repository path set to ${repo.path}`);
    return config.repository;
  });
  ipcMain.handle("kae:get-settings", () => config.settings);
  ipcMain.handle("kae:set-settings", (_event, settings) => {
    config.settings = settings;
    addLog("info", "settings", "Application settings updated");
    return config.settings;
  });
  ipcMain.handle("kae:get-jobs", () => jobQueue.getAll());
  ipcMain.handle("kae:get-logs", () => logs);
  ipcMain.handle("kae:get-default-repository-path", () => DEFAULT_REPOSITORY_PATH);
  ipcMain.handle("kae:get-repository-health", async () => checkRepositoryHealth(repoPath()));
  ipcMain.handle("kae:get-git-readiness", async () => {
    const health = await checkRepositoryHealth(repoPath());
    return health.gitReadiness;
  });
  ipcMain.handle("kae:get-repository-stats", async () => getRepositoryStats(repoPath()));
  ipcMain.handle("kae:browse-repository", async () => browseRepository(repoPath()));
  ipcMain.handle(
    "kae:read-repository-file",
    async (_event, relativePath) => readRepositoryFile(repoPath(), relativePath)
  );
  ipcMain.handle("kae:parse-chatgpt-source", async (_event, relativePath) => {
    const content = await readRepositoryFile(repoPath(), relativePath);
    const parsed = parseChatGptSourceMarkdown(content);
    if (!parsed) return null;
    const allRefs = new Set(parsed.fileReferences);
    for (const msg of parsed.messages) {
      for (const ref of msg.fileReferences) allRefs.add(ref);
    }
    const assets = await resolveChatGptAssets(repoPath(), [...allRefs]);
    return { parsed, assets };
  });
  ipcMain.handle(
    "kae:read-repository-asset",
    async (_event, relativePath, refHint) => {
      const full = resolveRepoFile(relativePath);
      const buffer = await fs.readFile(full);
      const mimeType = detectMimeType(buffer, refHint ?? path.basename(relativePath));
      const normalized = relativePath.replace(/\\/g, "/");
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(normalized)}`,
        mimeType,
        sizeBytes: buffer.length
      };
    }
  );
  ipcMain.handle(
    "kae:list-chatgpt-import-entries",
    async () => listChatGptImportEntries(repoPath())
  );
  ipcMain.handle(
    "kae:search-repository",
    async (_event, query) => searchRepository(repoPath(), query)
  );
  ipcMain.handle("kae:build-evidence-index", async () => {
    const index = await buildEvidenceIndex(repoPath());
    return summarizeEvidenceIndex(index);
  });
  ipcMain.handle("kae:search-knowledge", async (_event, query) => {
    const hits = await searchEvidence(repoPath(), query);
    return evidenceResultsToRepositoryResults(hits);
  });
  ipcMain.handle("kae:open-repository-path", async () => {
    await shell.openPath(repoPath());
  });
  ipcMain.handle("kae:open-repository-file", async (_event, relativePath) => {
    await shell.openPath(resolveRepoFile(relativePath));
  });
  ipcMain.handle("kae:reveal-repository-file", async (_event, relativePath) => {
    shell.showItemInFolder(resolveRepoFile(relativePath));
  });
  ipcMain.handle("kae:copy-text", async (_event, text) => {
    clipboard.writeText(text);
    return true;
  });
  ipcMain.handle("kae:get-last-validation", () => lastValidationReport);
  ipcMain.handle("kae:get-last-import-summary", () => lastImportSummary);
  ipcMain.handle("kae:get-last-repair-plan", () => lastRepairPlan);
  ipcMain.handle("kae:get-last-repair-result", () => lastRepairResult);
  ipcMain.handle("kae:select-zip-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "Select ChatGPT Export ZIP",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
  ipcMain.handle("kae:analyze-repository-repair", async () => {
    addLog("info", "repair", "Repository repair analysis started (read-only)");
    const plan = await generateRepairPlan(repoPath());
    lastRepairPlan = plan;
    lastRepairResult = null;
    addLog("info", "repair", `Repair analysis complete: ${plan.issues.length} issue(s), ${plan.autoRepairCount} auto-repair action(s)`, {
      issueCount: plan.issues.length,
      autoRepairCount: plan.autoRepairCount,
      manualReviewCount: plan.manualReviewCount
    });
    return plan;
  });
  ipcMain.handle("kae:execute-repository-repair", async (_event, plan) => {
    addLog("info", "repair", `Repository repair confirmed — ${plan.autoRepairCount} safe action(s) will be applied`);
    const result = await executeRepairPlan(plan, {
      log: (level, message, context) => addLog(level, "repair", message, context)
    });
    lastRepairResult = result;
    lastRepairPlan = plan;
    addLog("info", "repair", `Repository repair complete: ${result.filesChanged.length} file(s) changed`, {
      snapshotPath: result.snapshotPath,
      duplicatesBefore: result.healthBefore.duplicateIds,
      duplicatesAfter: result.healthAfter.duplicateIds,
      ready: result.healthAfter.ready
    });
    return result;
  });
  ipcMain.handle("kae:validate-chatgpt-zip", async (_event, filePath) => {
    if (!filePath || !filePath.toLowerCase().endsWith(".zip")) {
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    }
    return validateImport(filePath);
  });
  ipcMain.handle("kae:cancel-validation", () => {
    if (activeValidationAbort) {
      activeValidationAbort.abort();
      addLog("warn", "import", "Validation cancelled by user — repository unchanged");
      emitValidationProgress({
        status: "cancelled",
        stage: "cancelled",
        stageLabel: "Validation cancelled",
        conversationsTotal: 0,
        conversationsProcessed: 0,
        messagesProcessed: 0,
        warningsGenerated: 0,
        startedAt: (/* @__PURE__ */ new Date()).toISOString(),
        elapsedMs: 0,
        detail: "Cancelled by user",
        error: "Validation cancelled by user."
      });
      return true;
    }
    return false;
  });
  ipcMain.handle("kae:import-chatgpt-zip", async (_event, filePath) => {
    if (!filePath || !filePath.toLowerCase().endsWith(".zip")) {
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    }
    return runImport(filePath, "chatgpt-export-zip");
  });
}
app.whenReady().then(async () => {
  protocol.handle("kae-asset", async (request) => {
    const relativePath = parseKaeAssetRequestUrl(request.url);
    const full = resolveRepoFile(relativePath);
    const buffer = await fs.readFile(full);
    const mimeType = detectMimeType(buffer, path.basename(relativePath));
    return new Response(buffer, { headers: { "Content-Type": mimeType } });
  });
  registerPlugins();
  setupIpc();
  addLog("info", "system", `${APP_NAME} started — ${APP_FULL_NAME}`);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
