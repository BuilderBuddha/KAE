var ks = Object.defineProperty;
var Ts = (e, t, n) => t in e ? ks(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var M = (e, t, n) => Ts(e, typeof t != "symbol" ? t + "" : t, n);
import { protocol as hn, app as je, BrowserWindow as gn, ipcMain as F, shell as Ve, clipboard as _s, dialog as Ds } from "electron";
import x from "node:fs/promises";
import k from "node:path";
import { fileURLToPath as xs } from "node:url";
import Ns from "fs";
import ht from "path";
import yn from "zlib";
import Ls from "crypto";
import { execFile as In } from "node:child_process";
import { promisify as vn } from "node:util";
import { randomUUID as Q } from "node:crypto";
const wn = "KAE", En = "Knowledge Acquisition Engine";
function $s(e) {
  var s, r;
  if (!e)
    return {
      level: "attention",
      headline: "Status Unknown",
      subline: "Unable to load repository health."
    };
  const t = ((s = e.categorizedIssues) == null ? void 0 : s.errors.length) ?? e.issues.filter((i) => i.severity === "error").length, n = ((r = e.categorizedIssues) == null ? void 0 : r.warnings.length) ?? e.issues.filter((i) => i.severity === "warning").length;
  return t > 0 ? {
    level: "critical",
    headline: "Repository Requires Attention",
    subline: `${t} error(s) and ${n} warning(s) detected.`
  } : n > 0 ? {
    level: "attention",
    headline: "Repository Requires Attention",
    subline: `No errors. ${n} warning(s) detected.`
  } : {
    level: "healthy",
    headline: "Repository Healthy",
    subline: "No Issues Found"
  };
}
function bs(e) {
  const t = {
    errors: [],
    warnings: [],
    information: [],
    recommendations: []
  };
  for (const n of e) {
    const s = n.category ?? n.severity;
    s === "error" ? t.errors.push(n) : s === "warning" ? t.warnings.push(n) : s === "recommendation" ? t.recommendations.push(n) : t.information.push(n);
  }
  return t;
}
class Sn extends Error {
  constructor(t) {
    super(`${t} is not implemented yet (Phase 1 architecture only).`), this.name = "NotImplementedError";
  }
}
const Rn = "C:\\Users\\alber\\Axiom-Knowledge", As = {
  theme: "dark",
  logLevel: "info",
  maxConcurrentJobs: 2,
  outputDirectory: "./output"
}, Fs = {
  path: Rn,
  name: "Axiom Knowledge",
  autoSync: !1
};
function Ps() {
  return {
    repository: { ...Fs },
    settings: { ...As }
  };
}
function Os(e, t, n) {
  const s = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: e,
    format: t,
    source: n,
    status: "pending",
    createdAt: s,
    updatedAt: s,
    progress: 0
  };
}
class Us {
  constructor() {
    M(this, "jobs", []);
  }
  enqueue(t) {
    this.jobs.push(t);
  }
  dequeue() {
    return this.jobs.find((n) => n.status === "queued" || n.status === "pending");
  }
  getAll() {
    return [...this.jobs];
  }
  getById(t) {
    return this.jobs.find((n) => n.id === t);
  }
  updateStatus(t, n, s, r) {
    const i = this.jobs.find((a) => a.id === t);
    i && (i.status = n, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), s !== void 0 && (i.progress = s), r !== void 0 && (i.error = r));
  }
  clear() {
    this.jobs = [];
  }
}
class pe {
  canImport(t) {
    var s;
    const n = ((s = t.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async import(t, n) {
    throw new Sn(`Importer "${this.name}"`);
  }
}
class Ms {
  constructor() {
    M(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(t) {
    this.plugins.set(t.id, t);
  }
  unregister(t) {
    this.plugins.delete(t);
  }
  get(t) {
    return this.plugins.get(t);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
  findForFile(t) {
    return this.getAll().find((n) => n.canImport(t));
  }
}
const ze = new Ms(), Cn = [
  "VIGS",
  "Founder OS",
  "Axiom",
  "Book",
  "Knowledge Recovery",
  "Source Material",
  "Technical Build",
  "Other / Review Needed"
], At = 2, Bs = 3, ut = {
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
function gt(e) {
  var g, I, w, T;
  const t = js(e), n = Gs(t), s = zs(t, e, n), r = Cn.filter((R) => R !== "Other / Review Needed").map((R) => ({ category: R, score: s[R] })).sort((R, C) => C.score - R.score), i = ((g = r[0]) == null ? void 0 : g.score) ?? 0, a = ((I = r[1]) == null ? void 0 : I.score) ?? 0;
  let c = r.filter((R) => R.score >= At).map((R) => R.category), o = !1, l, u;
  i < Bs || i === 0 ? (o = !0, l = "Other / Review Needed", c = c.length > 0 ? [...c, "Other / Review Needed"] : ["Other / Review Needed"], u = `Low classification confidence (top score ${i}). Routed to review.`) : i === a && i >= At ? (o = !0, l = "Other / Review Needed", c = [.../* @__PURE__ */ new Set([...c, "Other / Review Needed"])], u = `Tied scores between "${(w = r[0]) == null ? void 0 : w.category}" and "${(T = r[1]) == null ? void 0 : T.category}". Routed to review.`) : (l = r[0].category, c.length === 0 && (c = [l]), u = `Primary match "${l}" (score ${i}) from title, content, and recurring terms.`);
  const d = e.metadata.messageCount;
  typeof d == "number" && d === 0 && (o = !0, l = "Other / Review Needed", c.includes("Other / Review Needed") || (c = [...c, "Other / Review Needed"]), u = "No extractable messages. Preserved for manual review.");
  const p = Math.min(100, Math.round(i / Math.max(i + a, 1) * 100));
  return {
    categories: [...new Set(c)],
    primaryCategory: l,
    confidence: o ? Math.min(p, 40) : p,
    inferredProject: Ks(l, e.title, n),
    recurringTerms: n.slice(0, 12),
    uncertain: o,
    rationale: u,
    categoryScores: s
  };
}
function yt(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    t.set(String(n.metadata.conversationId ?? n.id), gt(n));
  return t;
}
function js(e) {
  const t = Array.isArray(e.metadata.fileReferences) ? e.metadata.fileReferences.filter((n) => typeof n == "string").join(" ") : "";
  return `${e.title} ${e.content} ${t}`.toLowerCase();
}
function zs(e, t, n) {
  const s = Object.fromEntries(Cn.map((r) => [r, 0]));
  for (const [r, i] of Object.entries(ut))
    for (const a of i)
      e.includes(a) && (s[r] += a.includes(" ") ? 3 : 1);
  typeof t.metadata.pastedTranscriptCount == "number" && t.metadata.pastedTranscriptCount > 0 && (s["Source Material"] += 4);
  for (const r of n.slice(0, 5))
    for (const [i, a] of Object.entries(ut))
      a.some((c) => c.includes(r) || r.includes(c.split(" ")[0] ?? "")) && (s[i] += 1);
  return s["Other / Review Needed"] = 0, s;
}
function Gs(e) {
  const t = e.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((s) => s.length >= 5), n = /* @__PURE__ */ new Map();
  for (const s of t)
    n.set(s, (n.get(s) ?? 0) + 1);
  return [...n.entries()].filter(([, s]) => s >= 2).sort((s, r) => r[1] - s[1]).map(([s]) => s);
}
function Ks(e, t, n) {
  if (e !== "Other / Review Needed")
    return e;
  const s = t.toLowerCase();
  for (const [r, i] of Object.entries(ut))
    if (i.some((a) => s.includes(a)))
      return `${r} (uncertain)`;
  return n.length > 0 ? `Unlabeled — terms: ${n.slice(0, 3).join(", ")}` : "Unlabeled";
}
function Zs(e, t) {
  return t.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    format: n.format,
    metadata: {
      ...n.metadata,
      connectorId: e
    }
  }));
}
function Hs(e, t, n) {
  const s = (/* @__PURE__ */ new Date()).toISOString();
  return n.map((r) => ({
    id: r.id,
    connectorId: e,
    sourceFile: t.name,
    acquiredAt: s,
    conversationId: String(r.metadata.conversationId ?? r.id),
    metadata: {
      title: r.title,
      format: r.format
    }
  }));
}
function Vs(e, t, n, s) {
  const r = yt(n);
  return {
    connectorId: e.id,
    source: t,
    documents: n,
    provenance: s,
    classifications: r,
    metadata: {
      documentCount: n.length,
      emittedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
const Ws = 500, qs = /* @__PURE__ */ new Set(["system"]);
function Ys(e) {
  if (!Array.isArray(e) || e.length === 0)
    return !1;
  const t = e[0];
  return typeof t == "object" && t !== null && "mapping" in t && typeof t.mapping == "object";
}
function Xs(e) {
  return kn(e).map(Tn);
}
function kn(e) {
  const t = JSON.parse(e);
  if (!Array.isArray(t))
    throw new Error("conversations.json must be a JSON array.");
  if (!Ys(t))
    throw new Error("Unrecognized export format: expected ChatGPT conversations.json structure.");
  return t;
}
async function Js(e, t = {}) {
  const { signal: n, batchSize: s = 25, onProgress: r } = t, i = [];
  let a = 0;
  for (let c = 0; c < e.length; c++) {
    if (n != null && n.aborted)
      throw new Error("Validation cancelled by user.");
    const o = Tn(e[c]);
    i.push(o), a += o.messages.length, (c % s === 0 || c === e.length - 1) && (r == null || r({
      conversationsTotal: e.length,
      conversationsProcessed: c + 1,
      messagesProcessed: a
    }), await new Promise((l) => setImmediate(l)));
  }
  return i;
}
function Tn(e) {
  var c;
  const t = e.conversation_id ?? e.id ?? rr(), n = (((c = e.title) == null ? void 0 : c.trim()) || "Untitled Conversation").slice(0, 200), r = Qs(e).map((o) => tr(o.message)).filter((o) => o !== null), i = r.filter((o) => o.isPastedTranscript).map((o) => o.text), a = [...new Set(r.flatMap((o) => o.fileReferences))];
  return {
    conversationId: t,
    title: n,
    createTime: e.create_time,
    updateTime: e.update_time,
    messages: r,
    pastedTranscripts: i,
    fileReferences: a,
    assetPaths: a
  };
}
function Qs(e) {
  const t = e.mapping ?? {};
  let n = e.current_node;
  if ((!n || !t[n]) && (n = er(t)), !n)
    return [];
  const s = [], r = /* @__PURE__ */ new Set();
  for (; n && t[n] && !r.has(n); )
    r.add(n), s.push(t[n]), n = t[n].parent;
  return s.reverse();
}
function er(e) {
  var s;
  let t, n = -1;
  for (const r of Object.values(e)) {
    if (r.children.length > 0)
      continue;
    const i = ((s = r.message) == null ? void 0 : s.create_time) ?? 0;
    i >= n && (n = i, t = r.id);
  }
  return t;
}
function tr(e) {
  var r;
  if (!((r = e == null ? void 0 : e.author) != null && r.role))
    return null;
  const t = e.author.role;
  if (qs.has(t))
    return null;
  const n = nr(e).trim();
  if (!n)
    return null;
  const s = sr(e, n);
  return {
    role: t,
    text: n,
    createTime: e.create_time ?? void 0,
    isPastedTranscript: t === "user" && n.length >= Ws,
    fileReferences: s
  };
}
function nr(e) {
  const t = e.content;
  return t ? Array.isArray(t.parts) ? t.parts.map((n) => {
    if (typeof n == "string")
      return n;
    if (n && typeof n == "object") {
      const s = n;
      if (typeof s.text == "string")
        return s.text;
      if (typeof s.content == "string")
        return s.content;
    }
    return "";
  }).filter(Boolean).join(`
`) : typeof t.text == "string" ? t.text : "" : "";
}
function sr(e, t) {
  const n = [], r = (e.metadata ?? {}).attachments;
  if (Array.isArray(r)) {
    for (const c of r)
      if (c && typeof c == "object") {
        const o = c;
        typeof o.name == "string" && n.push(o.name), typeof o.id == "string" && n.push(o.id);
      }
  }
  const i = /(?:file-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|dalle-generations\/[^\s"']+|uploaded[^\s"']*\.[a-zA-Z0-9]+)/gi, a = t.match(i);
  return a && n.push(...a), [...new Set(n)];
}
function rr() {
  return `unknown-${Date.now()}`;
}
function ir(e) {
  const t = [];
  for (const n of e) {
    const s = n.role === "user" ? "User" : n.role === "assistant" ? "Assistant" : n.role;
    if (t.push(`### ${s}`), n.createTime && t.push(`*${or(n.createTime)}*`), t.push(""), t.push(n.text), t.push(""), n.fileReferences.length > 0) {
      t.push("**File references:**");
      for (const r of n.fileReferences)
        t.push(`- ${r}`);
      t.push("");
    }
  }
  return t.join(`
`).trim();
}
function or(e) {
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function _n(e, t, n = {}) {
  const { sharedAssetList: s } = n, r = ir(e.messages), i = e.pastedTranscripts.length > 0 ? `

## Pasted Source Text

${e.pastedTranscripts.join(`

---

`)}` : "", a = t.filter((o) => e.fileReferences.some((l) => o.zipPath.includes(l) || o.fileName.includes(l)) || e.assetPaths.some((l) => o.zipPath.includes(l))), c = {
    conversationId: e.conversationId,
    createTime: e.createTime,
    updateTime: e.updateTime,
    messageCount: e.messages.length,
    userMessageCount: e.messages.filter((o) => o.role === "user").length,
    assistantMessageCount: e.messages.filter((o) => o.role === "assistant").length,
    pastedTranscriptCount: e.pastedTranscripts.length,
    fileReferences: e.fileReferences
  };
  return a.length > 0 && (c.assets = a.map((o) => ({
    zipPath: o.zipPath,
    fileName: o.fileName
  }))), s && (c.allZipAssets = s), {
    id: e.conversationId,
    title: e.title,
    content: `${r}${i}`,
    format: "chatgpt-export-zip",
    metadata: c
  };
}
function ar(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ie = { exports: {} }, We, Ft;
function Dn() {
  return Ft || (Ft = 1, We = {
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
  }), We;
}
var qe = {}, Pt;
function It() {
  return Pt || (Pt = 1, (function(e) {
    const t = {
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
    function n(s) {
      return function(...r) {
        return r.length && (s = s.replace(/\{(\d)\}/g, (i, a) => r[a] || "")), new Error("ADM-ZIP: " + s);
      };
    }
    for (const s of Object.keys(t))
      e[s] = n(t[s]);
  })(qe)), qe;
}
var Ye, Ot;
function cr() {
  if (Ot) return Ye;
  Ot = 1;
  const e = Ns, t = ht, n = Dn(), s = It(), r = typeof process == "object" && process.platform === "win32", i = (o) => typeof o == "object" && o !== null, a = new Uint32Array(256).map((o, l) => {
    for (let u = 0; u < 8; u++)
      (l & 1) !== 0 ? l = 3988292384 ^ l >>> 1 : l >>>= 1;
    return l >>> 0;
  });
  function c(o) {
    this.sep = t.sep, this.fs = e, i(o) && i(o.fs) && typeof o.fs.statSync == "function" && (this.fs = o.fs);
  }
  return Ye = c, c.prototype.makeDir = function(o) {
    const l = this;
    function u(d) {
      let p = d.split(l.sep)[0];
      d.split(l.sep).forEach(function(g) {
        if (!(!g || g.substr(-1, 1) === ":")) {
          p += l.sep + g;
          var I;
          try {
            I = l.fs.statSync(p);
          } catch (w) {
            if (w.message && w.message.startsWith("ENOENT"))
              l.fs.mkdirSync(p);
            else
              throw w;
          }
          if (I && I.isFile()) throw s.FILE_IN_THE_WAY(`"${p}"`);
        }
      });
    }
    u(o);
  }, c.prototype.writeFileTo = function(o, l, u, d) {
    const p = this;
    if (p.fs.existsSync(o)) {
      if (!u) return !1;
      var g = p.fs.statSync(o);
      if (g.isDirectory())
        return !1;
    }
    var I = t.dirname(o);
    p.fs.existsSync(I) || p.makeDir(I);
    var w;
    try {
      w = p.fs.openSync(o, "w", 438);
    } catch {
      p.fs.chmodSync(o, 438), w = p.fs.openSync(o, "w", 438);
    }
    if (w)
      try {
        p.fs.writeSync(w, l, 0, l.length, 0);
      } finally {
        p.fs.closeSync(w);
      }
    return p.fs.chmodSync(o, d || 438), !0;
  }, c.prototype.writeFileToAsync = function(o, l, u, d, p) {
    typeof d == "function" && (p = d, d = void 0);
    const g = this;
    g.fs.exists(o, function(I) {
      if (I && !u) return p(!1);
      g.fs.stat(o, function(w, T) {
        if (I && T.isDirectory())
          return p(!1);
        var R = t.dirname(o);
        g.fs.exists(R, function(C) {
          C || g.makeDir(R), g.fs.open(o, "w", 438, function(D, m) {
            D ? g.fs.chmod(o, 438, function() {
              g.fs.open(o, "w", 438, function(f, v) {
                g.fs.write(v, l, 0, l.length, 0, function() {
                  g.fs.close(v, function() {
                    g.fs.chmod(o, d || 438, function() {
                      p(!0);
                    });
                  });
                });
              });
            }) : m ? g.fs.write(m, l, 0, l.length, 0, function() {
              g.fs.close(m, function() {
                g.fs.chmod(o, d || 438, function() {
                  p(!0);
                });
              });
            }) : g.fs.chmod(o, d || 438, function() {
              p(!0);
            });
          });
        });
      });
    });
  }, c.prototype.findFiles = function(o) {
    const l = this;
    function u(d, p, g) {
      let I = [];
      return l.fs.readdirSync(d).forEach(function(w) {
        const T = t.join(d, w), R = l.fs.statSync(T);
        I.push(t.normalize(T) + (R.isDirectory() ? l.sep : "")), R.isDirectory() && g && (I = I.concat(u(T, p, g)));
      }), I;
    }
    return u(o, void 0, !0);
  }, c.prototype.findFilesAsync = function(o, l) {
    const u = this;
    let d = [];
    u.fs.readdir(o, function(p, g) {
      if (p) return l(p);
      let I = g.length;
      if (!I) return l(null, d);
      g.forEach(function(w) {
        w = t.join(o, w), u.fs.stat(w, function(T, R) {
          if (T) return l(T);
          R && (d.push(t.normalize(w) + (R.isDirectory() ? u.sep : "")), R.isDirectory() ? u.findFilesAsync(w, function(C, D) {
            if (C) return l(C);
            d = d.concat(D), --I || l(null, d);
          }) : --I || l(null, d));
        });
      });
    });
  }, c.prototype.getAttributes = function() {
  }, c.prototype.setAttributes = function() {
  }, c.crc32update = function(o, l) {
    return a[(o ^ l) & 255] ^ o >>> 8;
  }, c.crc32 = function(o) {
    typeof o == "string" && (o = Buffer.from(o, "utf8"));
    let l = o.length, u = -1;
    for (let d = 0; d < l; ) u = c.crc32update(u, o[d++]);
    return ~u >>> 0;
  }, c.methodToString = function(o) {
    switch (o) {
      case n.STORED:
        return "STORED (" + o + ")";
      case n.DEFLATED:
        return "DEFLATED (" + o + ")";
      default:
        return "UNSUPPORTED (" + o + ")";
    }
  }, c.canonical = function(o) {
    if (!o) return "";
    const l = t.posix.normalize("/" + o.split("\\").join("/"));
    return t.join(".", l);
  }, c.zipnamefix = function(o) {
    if (!o) return "";
    const l = t.posix.normalize("/" + o.split("\\").join("/"));
    return t.posix.join(".", l);
  }, c.findLast = function(o, l) {
    if (!Array.isArray(o)) throw new TypeError("arr is not array");
    const u = o.length >>> 0;
    for (let d = u - 1; d >= 0; d--)
      if (l(o[d], d, o))
        return o[d];
  }, c.sanitize = function(o, l) {
    o = t.resolve(t.normalize(o));
    for (var u = l.split("/"), d = 0, p = u.length; d < p; d++) {
      var g = t.normalize(t.join(o, u.slice(d, p).join(t.sep)));
      if (g === o || g.startsWith(o + t.sep))
        return g;
    }
    return t.normalize(t.join(o, t.basename(l)));
  }, c.toBuffer = function(l, u) {
    return Buffer.isBuffer(l) ? l : l instanceof Uint8Array ? Buffer.from(l) : typeof l == "string" ? u(l) : Buffer.alloc(0);
  }, c.readBigUInt64LE = function(o, l) {
    const u = o.readUInt32LE(l);
    return o.readUInt32LE(l + 4) * 4294967296 + u;
  }, c.writeBigUInt64LE = function(o, l, u) {
    const d = l >>> 0, p = Math.floor(l / 4294967296) >>> 0;
    o.writeUInt32LE(d, u), o.writeUInt32LE(p, u + 4);
  }, c.fromDOS2Date = function(o) {
    return new Date((o >> 25 & 127) + 1980, Math.max((o >> 21 & 15) - 1, 0), Math.max(o >> 16 & 31, 1), o >> 11 & 31, o >> 5 & 63, (o & 31) << 1);
  }, c.fromDate2DOS = function(o) {
    let l = 0, u = 0;
    return o.getFullYear() > 1979 && (l = (o.getFullYear() - 1980 & 127) << 9 | o.getMonth() + 1 << 5 | o.getDate(), u = o.getHours() << 11 | o.getMinutes() << 5 | o.getSeconds() >> 1), l << 16 | u;
  }, c.isWin = r, c.crcTable = a, Ye;
}
var Xe, Ut;
function dr() {
  if (Ut) return Xe;
  Ut = 1;
  const e = ht;
  return Xe = function(t, { fs: n }) {
    var s = t || "", r = a(), i = null;
    function a() {
      return {
        directory: !1,
        readonly: !1,
        hidden: !1,
        executable: !1,
        mtime: 0,
        atime: 0
      };
    }
    return s && n.existsSync(s) ? (i = n.statSync(s), r.directory = i.isDirectory(), r.mtime = i.mtime, r.atime = i.atime, r.executable = (73 & i.mode) !== 0, r.readonly = (128 & i.mode) === 0, r.hidden = e.basename(s)[0] === ".") : console.warn("Invalid path: " + s), {
      get directory() {
        return r.directory;
      },
      get readOnly() {
        return r.readonly;
      },
      get hidden() {
        return r.hidden;
      },
      get mtime() {
        return r.mtime;
      },
      get atime() {
        return r.atime;
      },
      get executable() {
        return r.executable;
      },
      decodeAttributes: function() {
      },
      encodeAttributes: function() {
      },
      toJSON: function() {
        return {
          path: s,
          isDirectory: r.directory,
          isReadOnly: r.readonly,
          isHidden: r.hidden,
          isExecutable: r.executable,
          mTime: r.mtime,
          aTime: r.atime
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, Xe;
}
var Je, Mt;
function lr() {
  return Mt || (Mt = 1, Je = {
    efs: !0,
    encode: (e) => Buffer.from(e, "utf8"),
    decode: (e) => e.toString("utf8")
  }), Je;
}
var Bt;
function Ne() {
  return Bt || (Bt = 1, ie.exports = cr(), ie.exports.Constants = Dn(), ie.exports.Errors = It(), ie.exports.FileAttr = dr(), ie.exports.decoder = lr()), ie.exports;
}
var be = {}, Qe, jt;
function ur() {
  if (jt) return Qe;
  jt = 1;
  var e = Ne(), t = e.Constants;
  return Qe = function() {
    var n = 20, s = 10, r = 0, i = 0, a = 0, c = 0, o = 0, l = 0, u = 0, d = 0, p = 0, g = 0, I = 0, w = 0, T = 0;
    n |= e.isWin ? 2560 : 768, r |= t.FLG_EFS;
    const R = {
      extraLen: 0
    }, C = (m) => Math.max(0, m) >>> 0, D = (m) => Math.max(0, m) & 255;
    return a = e.fromDate2DOS(/* @__PURE__ */ new Date()), {
      get made() {
        return n;
      },
      set made(m) {
        n = m;
      },
      get version() {
        return s;
      },
      set version(m) {
        s = m;
      },
      get flags() {
        return r;
      },
      set flags(m) {
        r = m;
      },
      get flags_efs() {
        return (r & t.FLG_EFS) > 0;
      },
      set flags_efs(m) {
        m ? r |= t.FLG_EFS : r &= ~t.FLG_EFS;
      },
      get flags_desc() {
        return (r & t.FLG_DESC) > 0;
      },
      set flags_desc(m) {
        m ? r |= t.FLG_DESC : r &= ~t.FLG_DESC;
      },
      get method() {
        return i;
      },
      set method(m) {
        switch (m) {
          case t.STORED:
            this.version = 10;
            break;
          case t.DEFLATED:
          default:
            this.version = 20;
        }
        i = m;
      },
      get time() {
        return e.fromDOS2Date(this.timeval);
      },
      set time(m) {
        m = new Date(m), this.timeval = e.fromDate2DOS(m);
      },
      get timeval() {
        return a;
      },
      set timeval(m) {
        a = C(m);
      },
      get timeHighByte() {
        return D(a >>> 8);
      },
      get crc() {
        return c;
      },
      set crc(m) {
        c = C(m);
      },
      get compressedSize() {
        return o;
      },
      set compressedSize(m) {
        o = C(m);
      },
      get size() {
        return l;
      },
      set size(m) {
        l = C(m);
      },
      get fileNameLength() {
        return u;
      },
      set fileNameLength(m) {
        u = m;
      },
      get extraLength() {
        return d;
      },
      set extraLength(m) {
        d = m;
      },
      get extraLocalLength() {
        return R.extraLen;
      },
      set extraLocalLength(m) {
        R.extraLen = m;
      },
      get commentLength() {
        return p;
      },
      set commentLength(m) {
        p = m;
      },
      get diskNumStart() {
        return g;
      },
      set diskNumStart(m) {
        g = C(m);
      },
      get inAttr() {
        return I;
      },
      set inAttr(m) {
        I = C(m);
      },
      get attr() {
        return w;
      },
      set attr(m) {
        w = C(m);
      },
      // get Unix file permissions
      get fileAttr() {
        return (w || 0) >> 16 & 4095;
      },
      get offset() {
        return T;
      },
      set offset(m) {
        T = C(m);
      },
      get encrypted() {
        return (r & t.FLG_ENC) === t.FLG_ENC;
      },
      get centralHeaderSize() {
        return t.CENHDR + u + d + p;
      },
      get realDataOffset() {
        return T + t.LOCHDR + R.fnameLen + R.extraLen;
      },
      get localHeader() {
        return R;
      },
      loadLocalHeaderFromBinary: function(m) {
        var f = m.slice(T, T + t.LOCHDR);
        if (f.readUInt32LE(0) !== t.LOCSIG)
          throw e.Errors.INVALID_LOC();
        R.version = f.readUInt16LE(t.LOCVER), R.flags = f.readUInt16LE(t.LOCFLG), R.flags_desc = (R.flags & t.FLG_DESC) > 0, R.method = f.readUInt16LE(t.LOCHOW), R.time = f.readUInt32LE(t.LOCTIM), R.crc = f.readUInt32LE(t.LOCCRC), R.compressedSize = f.readUInt32LE(t.LOCSIZ), R.size = f.readUInt32LE(t.LOCLEN), R.fnameLen = f.readUInt16LE(t.LOCNAM), R.extraLen = f.readUInt16LE(t.LOCEXT);
        const v = T + t.LOCHDR + R.fnameLen, h = v + R.extraLen;
        return m.slice(v, h);
      },
      loadFromBinary: function(m) {
        if (m.length !== t.CENHDR || m.readUInt32LE(0) !== t.CENSIG)
          throw e.Errors.INVALID_CEN();
        n = m.readUInt16LE(t.CENVEM), s = m.readUInt16LE(t.CENVER), r = m.readUInt16LE(t.CENFLG), i = m.readUInt16LE(t.CENHOW), a = m.readUInt32LE(t.CENTIM), c = m.readUInt32LE(t.CENCRC), o = m.readUInt32LE(t.CENSIZ), l = m.readUInt32LE(t.CENLEN), u = m.readUInt16LE(t.CENNAM), d = m.readUInt16LE(t.CENEXT), p = m.readUInt16LE(t.CENCOM), g = m.readUInt16LE(t.CENDSK), I = m.readUInt16LE(t.CENATT), w = m.readUInt32LE(t.CENATX), T = m.readUInt32LE(t.CENOFF);
      },
      localHeaderToBinary: function() {
        var m = Buffer.alloc(t.LOCHDR);
        return m.writeUInt32LE(t.LOCSIG, 0), m.writeUInt16LE(s, t.LOCVER), m.writeUInt16LE(r & ~t.FLG_DESC, t.LOCFLG), m.writeUInt16LE(i, t.LOCHOW), m.writeUInt32LE(a, t.LOCTIM), m.writeUInt32LE(c, t.LOCCRC), m.writeUInt32LE(o, t.LOCSIZ), m.writeUInt32LE(l, t.LOCLEN), m.writeUInt16LE(u, t.LOCNAM), m.writeUInt16LE(R.extraLen, t.LOCEXT), m;
      },
      centralHeaderToBinary: function() {
        var m = Buffer.alloc(t.CENHDR + u + d + p);
        return m.writeUInt32LE(t.CENSIG, 0), m.writeUInt16LE(n, t.CENVEM), m.writeUInt16LE(s, t.CENVER), m.writeUInt16LE(r & ~t.FLG_DESC, t.CENFLG), m.writeUInt16LE(i, t.CENHOW), m.writeUInt32LE(a, t.CENTIM), m.writeUInt32LE(c, t.CENCRC), m.writeUInt32LE(o, t.CENSIZ), m.writeUInt32LE(l, t.CENLEN), m.writeUInt16LE(u, t.CENNAM), m.writeUInt16LE(d, t.CENEXT), m.writeUInt16LE(p, t.CENCOM), m.writeUInt16LE(g, t.CENDSK), m.writeUInt16LE(I, t.CENATT), m.writeUInt32LE(w, t.CENATX), m.writeUInt32LE(T, t.CENOFF), m;
      },
      toJSON: function() {
        const m = function(f) {
          return f + " bytes";
        };
        return {
          made: n,
          version: s,
          flags: r,
          method: e.methodToString(i),
          time: this.time,
          crc: "0x" + c.toString(16).toUpperCase(),
          compressedSize: m(o),
          size: m(l),
          fileNameLength: m(u),
          extraLength: m(d),
          commentLength: m(p),
          diskNumStart: g,
          inAttr: I,
          attr: w,
          offset: T,
          centralHeaderSize: m(t.CENHDR + u + d + p)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, Qe;
}
var et, zt;
function fr() {
  if (zt) return et;
  zt = 1;
  var e = Ne(), t = e.Constants;
  return et = function() {
    var n = 0, s = 0, r = 0, i = 0, a = 0;
    const c = () => n > t.EF_ZIP64_OR_16 || s > t.EF_ZIP64_OR_16 || r > t.EF_ZIP64_OR_32 || i > t.EF_ZIP64_OR_32;
    return {
      get diskEntries() {
        return n;
      },
      set diskEntries(o) {
        n = s = o;
      },
      get totalEntries() {
        return s;
      },
      set totalEntries(o) {
        s = n = o;
      },
      get size() {
        return r;
      },
      set size(o) {
        r = o;
      },
      get offset() {
        return i;
      },
      set offset(o) {
        i = o;
      },
      get commentLength() {
        return a;
      },
      set commentLength(o) {
        a = o;
      },
      get mainHeaderSize() {
        return (c() ? t.ZIP64HDR + t.END64HDR : 0) + t.ENDHDR + a;
      },
      loadFromBinary: function(o) {
        if ((o.length !== t.ENDHDR || o.readUInt32LE(0) !== t.ENDSIG) && (o.length < t.ZIP64HDR || o.readUInt32LE(0) !== t.ZIP64SIG))
          throw e.Errors.INVALID_END();
        o.readUInt32LE(0) === t.ENDSIG ? (n = o.readUInt16LE(t.ENDSUB), s = o.readUInt16LE(t.ENDTOT), r = o.readUInt32LE(t.ENDSIZ), i = o.readUInt32LE(t.ENDOFF), a = o.readUInt16LE(t.ENDCOM)) : (n = e.readBigUInt64LE(o, t.ZIP64SUB), s = e.readBigUInt64LE(o, t.ZIP64TOT), r = e.readBigUInt64LE(o, t.ZIP64SIZB), i = e.readBigUInt64LE(o, t.ZIP64OFF), a = 0);
      },
      toBinary: function() {
        if (!c()) {
          var o = Buffer.alloc(t.ENDHDR + a);
          return o.writeUInt32LE(t.ENDSIG, 0), o.writeUInt32LE(0, 4), o.writeUInt16LE(n, t.ENDSUB), o.writeUInt16LE(s, t.ENDTOT), o.writeUInt32LE(r, t.ENDSIZ), o.writeUInt32LE(i, t.ENDOFF), o.writeUInt16LE(a, t.ENDCOM), o.fill(" ", t.ENDHDR), o;
        }
        var o = Buffer.alloc(this.mainHeaderSize);
        let l = 0;
        o.writeUInt32LE(t.ZIP64SIG, l), e.writeBigUInt64LE(o, t.ZIP64HDR - t.ZIP64LEAD, l + t.ZIP64SIZE), o.writeUInt16LE(45, l + t.ZIP64VEM), o.writeUInt16LE(45, l + t.ZIP64VER), o.writeUInt32LE(0, l + t.ZIP64DSK), o.writeUInt32LE(0, l + t.ZIP64DSKDIR), e.writeBigUInt64LE(o, n, l + t.ZIP64SUB), e.writeBigUInt64LE(o, s, l + t.ZIP64TOT), e.writeBigUInt64LE(o, r, l + t.ZIP64SIZB), e.writeBigUInt64LE(o, i, l + t.ZIP64OFF);
        const u = i + r;
        return l += t.ZIP64HDR, o.writeUInt32LE(t.END64SIG, l), o.writeUInt32LE(0, l + t.END64START), e.writeBigUInt64LE(o, u, l + t.END64OFF), o.writeUInt32LE(1, l + t.END64NUMDISKS), l += t.END64HDR, o.writeUInt32LE(t.ENDSIG, l), o.writeUInt32LE(0, l + 4), o.writeUInt16LE(Math.min(n, t.EF_ZIP64_OR_16), l + t.ENDSUB), o.writeUInt16LE(Math.min(s, t.EF_ZIP64_OR_16), l + t.ENDTOT), o.writeUInt32LE(Math.min(r, t.EF_ZIP64_OR_32), l + t.ENDSIZ), o.writeUInt32LE(Math.min(i, t.EF_ZIP64_OR_32), l + t.ENDOFF), o.writeUInt16LE(a, l + t.ENDCOM), o.fill(" ", l + t.ENDHDR), o;
      },
      toJSON: function() {
        const o = function(l, u) {
          let d = l.toString(16).toUpperCase();
          for (; d.length < u; ) d = "0" + d;
          return "0x" + d;
        };
        return {
          diskEntries: n,
          totalEntries: s,
          size: r + " bytes",
          offset: o(i, 4),
          commentLength: a
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, et;
}
var Gt;
function xn() {
  return Gt || (Gt = 1, be.EntryHeader = ur(), be.MainHeader = fr()), be;
}
var Se = {}, tt, Kt;
function pr() {
  return Kt || (Kt = 1, tt = function(e) {
    var t = yn, n = { chunkSize: (parseInt(e.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return t.deflateRawSync(e, n);
      },
      deflateAsync: function(s) {
        var r = t.createDeflateRaw(n), i = [], a = 0;
        r.on("data", function(c) {
          i.push(c), a += c.length;
        }), r.on("end", function() {
          var c = Buffer.alloc(a), o = 0;
          c.fill(0);
          for (var l = 0; l < i.length; l++) {
            var u = i[l];
            u.copy(c, o), o += u.length;
          }
          s && s(c);
        }), r.end(e);
      }
    };
  }), tt;
}
var nt, Zt;
function mr() {
  var t;
  if (Zt) return nt;
  Zt = 1;
  const e = +(((t = process == null ? void 0 : process.versions) == null ? void 0 : t.node) ?? "").split(".")[0] || 0;
  return nt = function(n, s) {
    var r = yn;
    const i = e >= 15 && s > 0 ? { maxOutputLength: s } : {};
    return {
      inflate: function() {
        return r.inflateRawSync(n, i);
      },
      inflateAsync: function(a) {
        var c = r.createInflateRaw(i), o = [], l = 0;
        c.on("data", function(u) {
          o.push(u), l += u.length;
        }), c.on("end", function() {
          var u = Buffer.alloc(l), d = 0;
          u.fill(0);
          for (var p = 0; p < o.length; p++) {
            var g = o[p];
            g.copy(u, d), d += g.length;
          }
          a && a(u);
        }), c.end(n);
      }
    };
  }, nt;
}
var st, Ht;
function hr() {
  if (Ht) return st;
  Ht = 1;
  const { randomFillSync: e } = Ls, t = It(), n = new Uint32Array(256).map((g, I) => {
    for (let w = 0; w < 8; w++)
      (I & 1) !== 0 ? I = I >>> 1 ^ 3988292384 : I >>>= 1;
    return I >>> 0;
  }), s = (g, I) => Math.imul(g, I) >>> 0, r = (g, I) => n[(g ^ I) & 255] ^ g >>> 8, i = () => typeof e == "function" ? e(Buffer.alloc(12)) : i.node();
  i.node = () => {
    const g = Buffer.alloc(12), I = g.length;
    for (let w = 0; w < I; w++) g[w] = Math.random() * 256 & 255;
    return g;
  };
  const a = {
    genSalt: i
  };
  function c(g) {
    const I = Buffer.isBuffer(g) ? g : Buffer.from(g);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let w = 0; w < I.length; w++)
      this.updateKeys(I[w]);
  }
  c.prototype.updateKeys = function(g) {
    const I = this.keys;
    return I[0] = r(I[0], g), I[1] += I[0] & 255, I[1] = s(I[1], 134775813) + 1, I[2] = r(I[2], I[1] >>> 24), g;
  }, c.prototype.next = function() {
    const g = (this.keys[2] | 2) >>> 0;
    return s(g, g ^ 1) >> 8 & 255;
  };
  function o(g) {
    const I = new c(g);
    return function(w) {
      const T = Buffer.alloc(w.length);
      let R = 0;
      for (let C of w)
        T[R++] = I.updateKeys(C ^ I.next());
      return T;
    };
  }
  function l(g) {
    const I = new c(g);
    return function(w, T, R = 0) {
      T || (T = Buffer.alloc(w.length));
      for (let C of w) {
        const D = I.next();
        T[R++] = C ^ D, I.updateKeys(C);
      }
      return T;
    };
  }
  function u(g, I, w) {
    if (!g || !Buffer.isBuffer(g) || g.length < 12)
      return Buffer.alloc(0);
    const T = o(w), R = T(g.slice(0, 12)), C = (I.flags & 8) === 8 ? I.timeHighByte : I.crc >>> 24;
    if (R[11] !== C)
      throw t.WRONG_PASSWORD();
    return T(g.slice(12));
  }
  function d(g) {
    Buffer.isBuffer(g) && g.length >= 12 ? a.genSalt = function() {
      return g.slice(0, 12);
    } : g === "node" ? a.genSalt = i.node : a.genSalt = i;
  }
  function p(g, I, w, T = !1) {
    g == null && (g = Buffer.alloc(0)), Buffer.isBuffer(g) || (g = Buffer.from(g.toString()));
    const R = l(w), C = a.genSalt();
    C[11] = I.crc >>> 24 & 255, T && (C[10] = I.crc >>> 16 & 255);
    const D = Buffer.alloc(g.length + 12);
    return R(C, D), R(g, D, 12);
  }
  return st = { decrypt: u, encrypt: p, _salter: d }, st;
}
var Vt;
function gr() {
  return Vt || (Vt = 1, Se.Deflater = pr(), Se.Inflater = mr(), Se.ZipCrypto = hr()), Se;
}
var rt, Wt;
function Nn() {
  if (Wt) return rt;
  Wt = 1;
  var e = Ne(), t = xn(), n = e.Constants, s = gr();
  return rt = function(r, i) {
    var a = new t.EntryHeader(), c = Buffer.alloc(0), o = Buffer.alloc(0), l = !1, u = null, d = Buffer.alloc(0), p = Buffer.alloc(0), g = !0;
    const I = r, w = typeof I.decoder == "object" ? I.decoder : e.decoder;
    g = w.hasOwnProperty("efs") ? w.efs : !1;
    function T() {
      return !i || !(i instanceof Uint8Array) ? Buffer.alloc(0) : (p = a.loadLocalHeaderFromBinary(i), i.slice(a.realDataOffset, a.realDataOffset + a.compressedSize));
    }
    function R(h) {
      if (!a.flags_desc && !a.localHeader.flags_desc) {
        if (e.crc32(h) !== a.localHeader.crc)
          return !1;
      } else {
        const y = {}, E = a.realDataOffset + a.compressedSize;
        if (i.readUInt32LE(E) == n.LOCSIG || i.readUInt32LE(E) == n.CENSIG)
          throw e.Errors.DESCRIPTOR_NOT_EXIST();
        if (i.readUInt32LE(E) == n.EXTSIG)
          y.crc = i.readUInt32LE(E + n.EXTCRC), y.compressedSize = i.readUInt32LE(E + n.EXTSIZ), y.size = i.readUInt32LE(E + n.EXTLEN);
        else if (i.readUInt16LE(E + 12) === 19280)
          y.crc = i.readUInt32LE(E + n.EXTCRC - 4), y.compressedSize = i.readUInt32LE(E + n.EXTSIZ - 4), y.size = i.readUInt32LE(E + n.EXTLEN - 4);
        else
          throw e.Errors.DESCRIPTOR_UNKNOWN();
        if (y.compressedSize !== a.compressedSize || y.size !== a.size || y.crc !== a.crc)
          throw e.Errors.DESCRIPTOR_FAULTY();
        if (e.crc32(h) !== y.crc)
          return !1;
      }
      return !0;
    }
    function C(h, y, E) {
      if (typeof y > "u" && typeof h == "string" && (E = h, h = void 0), l)
        return h && y && y(Buffer.alloc(0), e.Errors.DIRECTORY_CONTENT_ERROR()), Buffer.alloc(0);
      var S = T();
      if (S.length === 0)
        return h && y && y(S), S;
      if (a.encrypted) {
        if (typeof E != "string" && !Buffer.isBuffer(E))
          throw e.Errors.INVALID_PASS_PARAM();
        S = s.ZipCrypto.decrypt(S, a, E);
      }
      var _ = Buffer.alloc(a.size);
      switch (a.method) {
        case e.Constants.STORED:
          if (S.copy(_), R(_))
            return h && y && y(_), _;
          throw h && y && y(_, e.Errors.BAD_CRC()), e.Errors.BAD_CRC();
        case e.Constants.DEFLATED:
          var A = new s.Inflater(S, a.size);
          if (h)
            A.inflateAsync(function(N) {
              N.copy(N, 0), y && (R(N) ? y(N) : y(N, e.Errors.BAD_CRC()));
            });
          else {
            if (A.inflate(_).copy(_, 0), !R(_))
              throw e.Errors.BAD_CRC(`"${w.decode(c)}"`);
            return _;
          }
          break;
        default:
          throw h && y && y(Buffer.alloc(0), e.Errors.UNKNOWN_METHOD()), e.Errors.UNKNOWN_METHOD();
      }
    }
    function D(h, y) {
      if ((!u || !u.length) && Buffer.isBuffer(i))
        return h && y && y(T()), T();
      if (u.length && !l) {
        var E;
        switch (a.method) {
          case e.Constants.STORED:
            return a.compressedSize = a.size, E = Buffer.alloc(u.length), u.copy(E), h && y && y(E), E;
          default:
          case e.Constants.DEFLATED:
            var S = new s.Deflater(u);
            if (h)
              S.deflateAsync(function(A) {
                E = Buffer.alloc(A.length), a.compressedSize = A.length, A.copy(E), y && y(E);
              });
            else {
              var _ = S.deflate();
              return a.compressedSize = _.length, _;
            }
            S = null;
            break;
        }
      } else if (h && y)
        y(Buffer.alloc(0));
      else
        return Buffer.alloc(0);
    }
    function m(h, y) {
      return e.readBigUInt64LE(h, y);
    }
    function f(h) {
      try {
        for (var y = 0, E, S, _; y + 4 < h.length; )
          E = h.readUInt16LE(y), y += 2, S = h.readUInt16LE(y), y += 2, _ = h.slice(y, y + S), y += S, n.ID_ZIP64 === E && v(_);
      } catch {
        throw e.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function v(h) {
      var y, E, S, _;
      h.length >= n.EF_ZIP64_SCOMP && (y = m(h, n.EF_ZIP64_SUNCOMP), a.size === n.EF_ZIP64_OR_32 && (a.size = y)), h.length >= n.EF_ZIP64_RHO && (E = m(h, n.EF_ZIP64_SCOMP), a.compressedSize === n.EF_ZIP64_OR_32 && (a.compressedSize = E)), h.length >= n.EF_ZIP64_DSN && (S = m(h, n.EF_ZIP64_RHO), a.offset === n.EF_ZIP64_OR_32 && (a.offset = S)), h.length >= n.EF_ZIP64_DSN + 4 && (_ = h.readUInt32LE(n.EF_ZIP64_DSN), a.diskNumStart === n.EF_ZIP64_OR_16 && (a.diskNumStart = _));
    }
    return {
      get entryName() {
        return w.decode(c);
      },
      get rawEntryName() {
        return c;
      },
      set entryName(h) {
        c = e.toBuffer(h, w.encode);
        var y = c[c.length - 1];
        l = y === 47 || y === 92, a.fileNameLength = c.length;
      },
      get efs() {
        return typeof g == "function" ? g(this.entryName) : g;
      },
      get extra() {
        return d;
      },
      set extra(h) {
        d = h, a.extraLength = h.length, f(h);
      },
      get comment() {
        return w.decode(o);
      },
      set comment(h) {
        if (o = e.toBuffer(h, w.encode), a.commentLength = o.length, o.length > 65535) throw e.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var h = w.decode(c);
        return l ? h.substr(h.length - 1).split("/").pop() : h.split("/").pop();
      },
      get isDirectory() {
        return l;
      },
      getCompressedData: function() {
        return D(!1, null);
      },
      getCompressedDataAsync: function(h) {
        D(!0, h);
      },
      setData: function(h) {
        u = e.toBuffer(h, e.decoder.encode), !l && u.length ? (a.size = u.length, a.method = e.Constants.DEFLATED, a.crc = e.crc32(h), a.changed = !0) : a.method = e.Constants.STORED;
      },
      getData: function(h) {
        return a.changed ? u : C(!1, null, h);
      },
      getDataAsync: function(h, y) {
        a.changed ? h(u) : C(!0, h, y);
      },
      set attr(h) {
        a.attr = h;
      },
      get attr() {
        return a.attr;
      },
      set header(h) {
        a.loadFromBinary(h);
      },
      get header() {
        return a;
      },
      packCentralHeader: function() {
        a.flags_efs = this.efs, a.extraLength = d.length;
        var h = a.centralHeaderToBinary(), y = e.Constants.CENHDR;
        return c.copy(h, y), y += c.length, d.copy(h, y), y += a.extraLength, o.copy(h, y), h;
      },
      packLocalHeader: function() {
        let h = 0;
        a.flags_efs = this.efs, a.extraLocalLength = p.length;
        const y = a.localHeaderToBinary(), E = Buffer.alloc(y.length + c.length + a.extraLocalLength);
        return y.copy(E, h), h += y.length, c.copy(E, h), h += c.length, p.copy(E, h), h += p.length, E;
      },
      toJSON: function() {
        const h = function(y) {
          return "<" + (y && y.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: a.toJSON(),
          compressedData: h(i),
          data: h(u)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, rt;
}
var it, qt;
function yr() {
  if (qt) return it;
  qt = 1;
  const e = Nn(), t = xn(), n = Ne();
  return it = function(s, r) {
    var i = [], a = {}, c = Buffer.alloc(0), o = new t.MainHeader(), l = !1;
    const u = /* @__PURE__ */ new Set(), d = r, { noSort: p, decoder: g } = d;
    s ? T(d.readEntries) : l = !0;
    function I() {
      const C = /* @__PURE__ */ new Set();
      for (const D of Object.keys(a)) {
        const m = D.split("/");
        if (m.pop(), !!m.length)
          for (let f = 0; f < m.length; f++) {
            const v = m.slice(0, f + 1).join("/") + "/";
            C.add(v);
          }
      }
      for (const D of C)
        if (!(D in a)) {
          const m = new e(d);
          m.entryName = D, m.attr = 16, m.temporary = !0, i.push(m), a[m.entryName] = m, u.add(m);
        }
    }
    function w() {
      if (l = !0, a = {}, o.diskEntries > (s.length - o.offset) / n.Constants.CENHDR)
        throw n.Errors.DISK_ENTRY_TOO_LARGE();
      i = new Array(o.diskEntries);
      for (var C = o.offset, D = 0; D < i.length; D++) {
        var m = C, f = new e(d, s);
        f.header = s.slice(m, m += n.Constants.CENHDR), f.entryName = s.slice(m, m += f.header.fileNameLength), f.header.extraLength && (f.extra = s.slice(m, m += f.header.extraLength)), f.header.commentLength && (f.comment = s.slice(m, m + f.header.commentLength)), C += f.header.centralHeaderSize, i[D] = f, a[f.entryName] = f;
      }
      u.clear(), I();
    }
    function T(C) {
      var D = s.length - n.Constants.ENDHDR, m = Math.max(0, D - 65535), f = m, v = s.length, h = -1, y = 0;
      for ((typeof d.trailingSpace == "boolean" ? d.trailingSpace : !1) && (m = 0), D; D >= f; D--)
        if (s[D] === 80) {
          if (s.readUInt32LE(D) === n.Constants.ENDSIG) {
            h = D, y = D, v = D + n.Constants.ENDHDR, f = D - n.Constants.END64HDR;
            continue;
          }
          if (s.readUInt32LE(D) === n.Constants.END64SIG) {
            f = m;
            continue;
          }
          if (s.readUInt32LE(D) === n.Constants.ZIP64SIG) {
            h = D, v = D + n.readBigUInt64LE(s, D + n.Constants.ZIP64SIZE) + n.Constants.ZIP64LEAD;
            break;
          }
        }
      if (h == -1) throw n.Errors.INVALID_FORMAT();
      o.loadFromBinary(s.slice(h, v)), o.commentLength && (c = s.slice(y + n.Constants.ENDHDR)), C && w();
    }
    function R() {
      i.length > 1 && !p && i.sort((C, D) => C.entryName.toLowerCase().localeCompare(D.entryName.toLowerCase()));
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        return l || w(), i.filter((C) => !u.has(C));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return g.decode(c);
      },
      set comment(C) {
        c = n.toBuffer(C, g.encode), o.commentLength = c.length;
      },
      getEntryCount: function() {
        return l ? i.length : o.diskEntries;
      },
      forEach: function(C) {
        this.entries.forEach(C);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(C) {
        return l || w(), a[C] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(C) {
        l || w(), i.push(C), a[C.entryName] = C, o.totalEntries = i.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(C, D = !0) {
        l || w();
        const m = a[C];
        this.getEntryChildren(m, D).map((v) => v.entryName).forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(C) {
        l || w();
        const D = a[C], m = i.indexOf(D);
        m >= 0 && (i.splice(m, 1), delete a[C], o.totalEntries = i.length);
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(C, D = !0) {
        if (l || w(), typeof C == "object")
          if (C.isDirectory && D) {
            const m = [], f = C.entryName;
            for (const v of i)
              v.entryName.startsWith(f) && m.push(v);
            return m;
          } else
            return [C];
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(C) {
        if (C && C.isDirectory) {
          const D = this.getEntryChildren(C);
          return D.includes(C) ? D.length - 1 : D.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        l || w(), R();
        const C = [], D = [];
        let m = 0, f = 0;
        o.size = 0, o.offset = 0;
        let v = 0;
        for (const E of this.entries) {
          const S = E.getCompressedData();
          E.header.offset = f;
          const _ = E.packLocalHeader(), A = _.length + S.length;
          f += A, C.push(_), C.push(S);
          const N = E.packCentralHeader();
          D.push(N), o.size += N.length, m += A + N.length, v++;
        }
        m += o.mainHeaderSize, o.offset = f, o.totalEntries = v, f = 0;
        const h = Buffer.alloc(m);
        for (const E of C)
          E.copy(h, f), f += E.length;
        for (const E of D)
          E.copy(h, f), f += E.length;
        const y = o.toBinary();
        return c && c.copy(y, y.length - c.length), y.copy(h, f), s = h, l = !1, h;
      },
      toAsyncBuffer: function(C, D, m, f) {
        try {
          l || w(), R();
          const v = [], h = [];
          let y = 0, E = 0, S = 0;
          o.size = 0, o.offset = 0;
          const _ = function(A) {
            if (A.length > 0) {
              const N = A.shift(), L = N.entryName + N.extra.toString();
              m && m(L), N.getCompressedDataAsync(function(b) {
                f && f(L), N.header.offset = E;
                const U = N.packLocalHeader(), z = U.length + b.length;
                E += z, v.push(U), v.push(b);
                const G = N.packCentralHeader();
                h.push(G), o.size += G.length, y += z + G.length, S++, _(A);
              });
            } else {
              y += o.mainHeaderSize, o.offset = E, o.totalEntries = S, E = 0;
              const N = Buffer.alloc(y);
              v.forEach(function(b) {
                b.copy(N, E), E += b.length;
              }), h.forEach(function(b) {
                b.copy(N, E), E += b.length;
              });
              const L = o.toBinary();
              c && c.copy(L, L.length - c.length), L.copy(N, E), s = N, l = !1, C(N);
            }
          };
          _(Array.from(this.entries));
        } catch (v) {
          D(v);
        }
      }
    };
  }, it;
}
var ot, Yt;
function Ir() {
  if (Yt) return ot;
  Yt = 1;
  const e = Ne(), t = ht, n = Nn(), s = yr(), r = (...o) => e.findLast(o, (l) => typeof l == "boolean"), i = (...o) => e.findLast(o, (l) => typeof l == "string"), a = (...o) => e.findLast(o, (l) => typeof l == "function"), c = {
    // option "noSort" : if true it disables files sorting
    noSort: !1,
    // read entries during load (initial loading may be slower)
    readEntries: !1,
    // default method is none
    method: e.Constants.NONE,
    // file system
    fs: null
  };
  return ot = function(o, l) {
    let u = null;
    const d = Object.assign(/* @__PURE__ */ Object.create(null), c);
    o && typeof o == "object" && (o instanceof Uint8Array || (Object.assign(d, o), o = d.input ? d.input : void 0, d.input && delete d.input), Buffer.isBuffer(o) && (u = o, d.method = e.Constants.BUFFER, o = void 0)), Object.assign(d, l);
    const p = new e(d);
    if ((typeof d.decoder != "object" || typeof d.decoder.encode != "function" || typeof d.decoder.decode != "function") && (d.decoder = e.decoder), o && typeof o == "string")
      if (p.fs.existsSync(o))
        d.method = e.Constants.FILE, d.filename = o, u = p.fs.readFileSync(o);
      else
        throw e.Errors.INVALID_FILENAME();
    const g = new s(u, d), { canonical: I, sanitize: w, zipnamefix: T } = e;
    function R(f) {
      if (f && g) {
        var v;
        if (typeof f == "string" && (v = g.getEntry(t.posix.normalize(f))), typeof f == "object" && typeof f.entryName < "u" && typeof f.header < "u" && (v = g.getEntry(f.entryName)), v)
          return v;
      }
      return null;
    }
    function C(f) {
      const { join: v, normalize: h, sep: y } = t.posix;
      return v(t.isAbsolute(f) ? "/" : ".", h(y + f.split("\\").join(y) + y));
    }
    function D(f) {
      return f instanceof RegExp ? /* @__PURE__ */ (function(v) {
        return function(h) {
          return v.test(h);
        };
      })(f) : typeof f != "function" ? () => !0 : f;
    }
    const m = (f, v) => {
      let h = v.slice(-1);
      return h = h === p.sep ? p.sep : "", t.relative(f, v) + h;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(f, v) {
        var h = R(f);
        return h && h.getData(v) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(f) {
        const v = R(f);
        if (v)
          return g.getChildCount(v);
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(f, v) {
        var h = R(f);
        h ? h.getDataAsync(v) : v(null, "getEntry failed for:" + f);
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(f, v) {
        var h = R(f);
        if (h) {
          var y = h.getData();
          if (y && y.length)
            return y.toString(v || "utf8");
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
      readAsTextAsync: function(f, v, h) {
        var y = R(f);
        y ? y.getDataAsync(function(E, S) {
          if (S) {
            v(E, S);
            return;
          }
          E && E.length ? v(E.toString(h || "utf8")) : v("");
        }) : v("");
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(f, v = !0) {
        var h = R(f);
        h && g.deleteFile(h.entryName, v);
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(f) {
        var v = R(f);
        v && g.deleteEntry(v.entryName);
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(f) {
        g.comment = f;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return g.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(f, v) {
        var h = R(f);
        h && (h.comment = v);
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(f) {
        var v = R(f);
        return v && v.comment || "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(f, v) {
        var h = R(f);
        h && h.setData(v);
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(f, v, h, y) {
        if (p.fs.existsSync(f)) {
          v = v ? C(v) : "";
          const E = t.win32.basename(t.win32.normalize(f));
          v += h || E;
          const S = p.fs.statSync(f), _ = S.isFile() ? p.fs.readFileSync(f) : Buffer.alloc(0);
          S.isDirectory() && (v += p.sep), this.addFile(v, _, y, S);
        } else
          throw e.Errors.FILE_NOT_FOUND(f);
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
      addLocalFileAsync: function(f, v) {
        f = typeof f == "object" ? f : { localPath: f };
        const h = t.resolve(f.localPath), { comment: y } = f;
        let { zipPath: E, zipName: S } = f;
        const _ = this;
        p.fs.stat(h, function(A, N) {
          if (A) return v(A, !1);
          E = E ? C(E) : "";
          const L = t.win32.basename(t.win32.normalize(h));
          if (E += S || L, N.isFile())
            p.fs.readFile(h, function(b, U) {
              return b ? v(b, !1) : (_.addFile(E, U, y, N), setImmediate(v, void 0, !0));
            });
          else if (N.isDirectory())
            return E += p.sep, _.addFile(E, Buffer.alloc(0), y, N), setImmediate(v, void 0, !0);
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(f, v, h) {
        if (h = D(h), v = v ? C(v) : "", f = t.normalize(f), p.fs.existsSync(f)) {
          const y = p.findFiles(f), E = this;
          if (y.length)
            for (const S of y) {
              const _ = t.join(v, m(f, S));
              h(_) && E.addLocalFile(S, t.dirname(_));
            }
        } else
          throw e.Errors.FILE_NOT_FOUND(f);
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(f, v, h, y) {
        y = D(y), h = h ? C(h) : "", f = t.normalize(f);
        var E = this;
        p.fs.open(f, "r", function(S) {
          if (S && S.code === "ENOENT")
            v(void 0, e.Errors.FILE_NOT_FOUND(f));
          else if (S)
            v(void 0, S);
          else {
            var _ = p.findFiles(f), A = -1, N = function() {
              if (A += 1, A < _.length) {
                var L = _[A], b = m(f, L).split("\\").join("/");
                b = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""), y(b) ? p.fs.stat(L, function(U, z) {
                  U && v(void 0, U), z.isFile() ? p.fs.readFile(L, function(G, B) {
                    G ? v(void 0, G) : (E.addFile(h + b, B, "", z), N());
                  }) : (E.addFile(h + b + "/", Buffer.alloc(0), "", z), N());
                }) : process.nextTick(() => {
                  N();
                });
              } else
                v(!0, void 0);
            };
            N();
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
      addLocalFolderAsync2: function(f, v) {
        const h = this;
        f = typeof f == "object" ? f : { localPath: f };
        const y = t.resolve(C(f.localPath));
        let { zipPath: E, filter: S, namefix: _ } = f;
        S instanceof RegExp ? S = /* @__PURE__ */ (function(L) {
          return function(b) {
            return L.test(b);
          };
        })(S) : typeof S != "function" && (S = function() {
          return !0;
        }), E = E ? C(E) : "", _ === "latin1" && (_ = (L) => L.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "")), typeof _ != "function" && (_ = (L) => L);
        const A = (L) => t.join(E, _(m(y, L))), N = (L) => t.win32.basename(t.win32.normalize(_(L)));
        p.fs.open(y, "r", function(L) {
          L && L.code === "ENOENT" ? v(void 0, e.Errors.FILE_NOT_FOUND(y)) : L ? v(void 0, L) : p.findFilesAsync(y, function(b, U) {
            if (b) return v(b);
            U = U.filter((z) => S(A(z))), U.length || v(void 0, !1), setImmediate(
              U.reverse().reduce(function(z, G) {
                return function(B, V) {
                  if (B || V === !1) return setImmediate(z, B, !1);
                  h.addLocalFileAsync(
                    {
                      localPath: G,
                      zipPath: t.dirname(A(G)),
                      zipName: N(G)
                    },
                    z
                  );
                };
              }, v)
            );
          });
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
      addLocalFolderPromise: function(f, v) {
        return new Promise((h, y) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: f }, v), (E, S) => {
            E && y(E), S && h(this);
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
      addFile: function(f, v, h, y) {
        f = T(f);
        let E = R(f);
        const S = E != null;
        S || (E = new n(d), E.entryName = f), E.comment = h || "";
        const _ = typeof y == "object" && y instanceof p.fs.Stats;
        _ && (E.header.time = y.mtime);
        var A = E.isDirectory ? 16 : 0;
        let N = E.isDirectory ? 16384 : 32768;
        return _ ? N |= 4095 & y.mode : typeof y == "number" ? N |= 4095 & y : N |= E.isDirectory ? 493 : 420, A = (A | N << 16) >>> 0, E.attr = A, E.setData(v), S || g.setEntry(E), E;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(f) {
        return g.password = f, g ? g.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(f) {
        return R(f);
      },
      getEntryCount: function() {
        return g.getEntryCount();
      },
      forEach: function(f) {
        return g.forEach(f);
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
      extractEntryTo: function(f, v, h, y, E, S) {
        y = r(!1, y), E = r(!1, E), h = r(!0, h), S = i(E, S);
        var _ = R(f);
        if (!_)
          throw e.Errors.NO_ENTRY();
        var A = I(_.entryName), N = w(v, S && !_.isDirectory ? I(S) : h ? A : t.basename(A));
        if (_.isDirectory) {
          var L = g.getEntryChildren(_);
          return L.forEach(function(z) {
            if (z.isDirectory) return;
            var G = z.getData();
            if (!G)
              throw e.Errors.CANT_EXTRACT_FILE();
            var B = I(z.entryName), V = w(v, h ? B : t.basename(B));
            const Y = E ? z.header.fileAttr : void 0;
            p.writeFileTo(V, G, y, Y);
          }), !0;
        }
        var b = _.getData(g.password);
        if (!b) throw e.Errors.CANT_EXTRACT_FILE();
        if (p.fs.existsSync(N) && !y)
          throw e.Errors.CANT_OVERRIDE();
        const U = E ? f.header.fileAttr : void 0;
        return p.writeFileTo(N, b, y, U), !0;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(f) {
        if (!g)
          return !1;
        for (var v of g.entries)
          try {
            if (v.isDirectory)
              continue;
            var h = g.entries[v].getData(f);
            if (!h)
              return !1;
          } catch {
            return !1;
          }
        return !0;
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
      extractAllTo: function(f, v, h, y) {
        if (h = r(!1, h), y = i(h, y), v = r(!1, v), !g) throw e.Errors.NO_ZIP();
        g.entries.forEach(function(E) {
          var S = w(f, I(E.entryName));
          if (E.isDirectory) {
            p.makeDir(S);
            return;
          }
          var _ = E.getData(y);
          if (!_)
            throw e.Errors.CANT_EXTRACT_FILE();
          const A = h ? E.header.fileAttr : void 0;
          p.writeFileTo(S, _, v, A);
          try {
            p.fs.utimesSync(S, E.header.time, E.header.time);
          } catch {
            throw e.Errors.CANT_EXTRACT_FILE();
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
      extractAllToAsync: function(f, v, h, y) {
        if (y = a(v, h, y), h = r(!1, h), v = r(!1, v), !y)
          return new Promise((N, L) => {
            this.extractAllToAsync(f, v, h, function(b) {
              b ? L(b) : N(this);
            });
          });
        if (!g) {
          y(e.Errors.NO_ZIP());
          return;
        }
        f = t.resolve(f);
        const E = (N) => w(f, t.normalize(I(N.entryName))), S = (N, L) => new Error(N + ': "' + L + '"'), _ = [], A = [];
        g.entries.forEach((N) => {
          N.isDirectory ? _.push(N) : A.push(N);
        });
        for (const N of _) {
          const L = E(N), b = h ? N.header.fileAttr : void 0;
          try {
            p.makeDir(L), b && p.fs.chmodSync(L, b), p.fs.utimesSync(L, N.header.time, N.header.time);
          } catch {
            y(S("Unable to create folder", L));
          }
        }
        A.reverse().reduce(function(N, L) {
          return function(b) {
            if (b)
              N(b);
            else {
              const U = t.normalize(I(L.entryName)), z = w(f, U);
              L.getDataAsync(function(G, B) {
                if (B)
                  N(B);
                else if (!G)
                  N(e.Errors.CANT_EXTRACT_FILE());
                else {
                  const V = h ? L.header.fileAttr : void 0;
                  p.writeFileToAsync(z, G, v, V, function(Y) {
                    Y || N(S("Unable to write file", z)), p.fs.utimes(z, L.header.time, L.header.time, function(ue) {
                      ue ? N(S("Unable to set times", z)) : N();
                    });
                  });
                }
              });
            }
          };
        }, y)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(f, v) {
        if (arguments.length === 1 && typeof f == "function" && (v = f, f = ""), !f && d.filename && (f = d.filename), !!f) {
          var h = g.compressToBuffer();
          if (h) {
            var y = p.writeFileTo(f, h, !0);
            typeof v == "function" && v(y ? null : new Error("failed"), "");
          }
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
      writeZipPromise: function(f, v) {
        const { overwrite: h, perm: y } = Object.assign({ overwrite: !0 }, v);
        return new Promise((E, S) => {
          !f && d.filename && (f = d.filename), f || S("ADM-ZIP: ZIP File Name Missing"), this.toBufferPromise().then((_) => {
            const A = (N) => N ? E(N) : S("ADM-ZIP: Wasn't able to write zip file");
            p.writeFileToAsync(f, _, h, y, A);
          }, S);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((f, v) => {
          g.toAsyncBuffer(f, v);
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
      toBuffer: function(f, v, h, y) {
        return typeof f == "function" ? (g.toAsyncBuffer(f, v, h, y), null) : g.compressToBuffer();
      }
    };
  }, ot;
}
var vr = Ir();
const Ln = /* @__PURE__ */ ar(vr), wr = "conversations.json", Er = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i
];
function Ae(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function $n(e, t = {}) {
  var g, I, w;
  const { loadAssetData: n = !0, signal: s, callbacks: r } = t;
  Ae(s);
  const a = new Ln(e).getEntries();
  (g = r == null ? void 0 : r.onZipOpened) == null || g.call(r, a.length), Ae(s);
  const c = a.find((T) => !T.isDirectory && T.entryName.replace(/\\/g, "/").endsWith(wr));
  if (!c)
    throw new Error("Not a ChatGPT export ZIP: conversations.json was not found in the archive.");
  const o = c.entryName.replace(/\\/g, "/"), l = c.header.size;
  (I = r == null ? void 0 : r.onConversationsJsonLocated) == null || I.call(r, o, l), Ae(s);
  const u = c.getData().toString("utf8"), d = [];
  let p = 0;
  for (const T of a) {
    if (Ae(s), T.isDirectory)
      continue;
    const R = T.entryName.replace(/\\/g, "/"), C = k.basename(R);
    if (Er.some((m) => m.test(C) || m.test(R)) || R.endsWith(".json") && !R.includes("/"))
      continue;
    p++;
    const D = {
      zipPath: R,
      fileName: C
    };
    n && (D.data = T.getData()), d.push(D);
  }
  return (w = r == null ? void 0 : r.onEntriesDiscovered) == null || w.call(r, a.length, p), {
    conversationsJson: u,
    conversationsPath: o,
    assets: d,
    archiveEntryCount: a.length
  };
}
class Sr {
  constructor() {
    M(this, "id", "chatgpt-export-zip");
    M(this, "name", "ChatGPT Connector");
    M(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    M(this, "supportedExtensions", [".zip"]);
  }
  canHandle(t) {
    var n;
    return ((n = t.extension) == null ? void 0 : n.toLowerCase()) === ".zip";
  }
  async discover(t) {
    return {
      connectorId: this.id,
      source: t,
      format: "chatgpt-export-zip",
      metadata: {
        fileName: t.name
      }
    };
  }
  async extract(t) {
    const n = $n(t.source.path, { loadAssetData: !1 }), s = Xs(n.conversationsJson);
    return {
      connectorId: this.id,
      source: t.source,
      rawDocuments: s,
      assets: n.assets.map((r) => {
        var i;
        return {
          path: r.zipPath,
          fileName: r.fileName,
          dataBase64: (i = r.data) == null ? void 0 : i.toString("base64")
        };
      }),
      metadata: {
        conversationsPath: n.conversationsPath,
        conversationCount: s.length
      }
    };
  }
  async normalize(t) {
    const n = t.assets.map((r) => ({
      zipPath: r.path,
      fileName: r.fileName,
      data: Buffer.from(r.dataBase64 ?? "", "base64")
    })), s = n.map((r) => ({ zipPath: r.zipPath, fileName: r.fileName }));
    return t.rawDocuments.map((r, i) => {
      const a = _n(r, n, {
        sharedAssetList: i === 0 ? s : void 0
      });
      return {
        id: a.id,
        title: a.title,
        content: a.content,
        format: a.format,
        metadata: a.metadata
      };
    });
  }
}
const at = new Sr(), Rr = {
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
function Xt(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function Jt(e) {
  return e < 1024 ? `${e} B` : e < 1024 * 1024 ? `${(e / 1024).toFixed(1)} KB` : `${(e / (1024 * 1024)).toFixed(1)} MB`;
}
async function bn(e, t = {}) {
  const n = Date.now(), s = [];
  let r = 0, i, a, c = 0, o = 0, l = 0;
  const u = (p, g, I = {}) => {
    var w;
    (w = t.onProgress) == null || w.call(t, {
      status: g,
      stage: p,
      stageLabel: Rr[p],
      fileName: e.name,
      archiveEntryCount: r,
      conversationsJsonPath: i,
      conversationsJsonSizeBytes: a,
      conversationsTotal: c,
      conversationsProcessed: o,
      messagesProcessed: l,
      warningsGenerated: s.length,
      startedAt: new Date(n).toISOString(),
      elapsedMs: Date.now() - n,
      ...I
    });
  }, d = (p, g, I) => {
    var w;
    (w = t.log) == null || w.call(t, p, g, I);
  };
  try {
    u("zip-selected", "running", { detail: e.name }), d("info", `ZIP selected: ${e.name}`, { path: e.path }), u("zip-opening", "running"), d("info", "Opening ZIP archive (read-only)…");
    const p = $n(e.path, {
      loadAssetData: !1,
      signal: t.signal,
      callbacks: {
        onZipOpened: (m) => {
          r = m, u("zip-opened", "running", {
            archiveEntryCount: m,
            detail: `${m} entries`
          }), d("info", `ZIP opened: ${m} archive entries`);
        },
        onEntriesDiscovered: (m, f) => {
          u("entries-discovered", "running", {
            archiveEntryCount: m,
            detail: `${f} asset file(s), metadata only`
          }), d("info", `Archive entries discovered: ${m} total, ${f} asset file(s)`);
        },
        onConversationsJsonLocated: (m, f) => {
          i = m, a = f, u("conversations-json-located", "running", {
            conversationsJsonPath: m,
            conversationsJsonSizeBytes: f,
            detail: `${m} (${Jt(f)})`
          }), d("info", `conversations.json located: ${m} (${Jt(f)})`);
        }
      }
    });
    Xt(t.signal), u("parsing-started", "running"), d("info", "Conversations parsing started…");
    const g = kn(p.conversationsJson);
    c = g.length, d("info", `Total conversations detected: ${c}`, {
      conversationsTotal: c
    }), u("parsing-started", "running", {
      conversationsTotal: c,
      detail: `${c} conversations`
    });
    const I = await Js(g, {
      signal: t.signal,
      onProgress: (m) => {
        o = m.conversationsProcessed, l = m.messagesProcessed, u("parsing-conversations", "running", {
          conversationsTotal: m.conversationsTotal,
          conversationsProcessed: m.conversationsProcessed,
          messagesProcessed: m.messagesProcessed,
          detail: `${m.conversationsProcessed}/${m.conversationsTotal} conversations, ${m.messagesProcessed} messages`
        }), (m.conversationsProcessed % 100 === 0 || m.conversationsProcessed === m.conversationsTotal) && d("info", `Conversations processed: ${m.conversationsProcessed}/${m.conversationsTotal} (${m.messagesProcessed} messages)`, {
          conversationsProcessed: m.conversationsProcessed,
          conversationsTotal: m.conversationsTotal,
          messagesProcessed: m.messagesProcessed
        });
      }
    });
    Xt(t.signal);
    const w = p.assets.map((m) => ({
      zipPath: m.zipPath,
      fileName: m.fileName
    })), T = I.map((m, f) => _n(m, p.assets, {
      validationMode: !0,
      sharedAssetList: f === 0 ? w : void 0
    })), R = Zs(at.id, T), C = Hs(at.id, e, R), D = Vs(at, e, R, C);
    return s.length > 0 && d("warn", `Warnings generated: ${s.length}`, { warnings: s }), u("completed", "complete", {
      conversationsTotal: c,
      conversationsProcessed: o,
      messagesProcessed: l,
      detail: `${o} conversations validated`
    }), d("info", `Validation pipeline complete: ${R.length} conversation(s), ${l} message(s)`), D;
  } catch (p) {
    const g = p instanceof Error ? p.message : String(p), I = g.includes("cancelled");
    throw u(I ? "cancelled" : "failed", I ? "cancelled" : "failed", {
      error: g,
      detail: g
    }), d(I ? "warn" : "error", `Validation ${I ? "cancelled" : "failed"}: ${g}`, {
      error: g
    }), p;
  }
}
class Cr extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "chatgpt-export-zip");
    M(this, "name", "ChatGPT Connector");
    M(this, "description", "Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.");
    M(this, "supportedExtensions", [".zip"]);
  }
  async import(n, s) {
    var a, c, o, l;
    const r = s.jobId ?? crypto.randomUUID(), i = [];
    if (s.importPackage)
      return (a = s.log) == null || a.call(s, "info", `Using validated import package: ${s.importPackage.documents.length} document(s) — no ZIP re-parse`), {
        jobId: r,
        success: !0,
        documents: s.importPackage.documents,
        errors: i,
        summary: {
          conversationsFound: s.importPackage.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: i,
          outputFolder: `${s.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    (c = s.log) == null || c.call(s, "info", `Starting memory-safe ChatGPT import: ${n.name}`);
    try {
      const u = await bn(n, {
        log: (d, p) => {
          var g;
          return (g = s.log) == null ? void 0 : g.call(s, d, p);
        },
        onProgress: (d) => {
          var p;
          if (d.conversationsTotal > 0) {
            const g = Math.round(d.conversationsProcessed / d.conversationsTotal * 100);
            (p = s.onProgress) == null || p.call(s, g);
          }
        },
        signal: s.signal
      });
      return (o = s.log) == null || o.call(s, "info", `Import package ready: ${u.documents.length} document(s)`), {
        jobId: r,
        success: !0,
        documents: u.documents,
        errors: i,
        summary: {
          conversationsFound: u.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: i,
          outputFolder: `${s.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    } catch (u) {
      const d = u instanceof Error ? u.message : String(u);
      return i.push(d), (l = s.log) == null || l.call(s, "error", d), {
        jobId: r,
        success: !1,
        documents: [],
        errors: i,
        summary: {
          conversationsFound: 0,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: i,
          outputFolder: `${s.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    }
  }
}
class kr extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "pdf");
    M(this, "name", "PDF");
    M(this, "description", "Import content from PDF documents.");
    M(this, "supportedExtensions", [".pdf"]);
  }
}
class Tr extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "markdown");
    M(this, "name", "Markdown");
    M(this, "description", "Import Markdown (.md) files.");
    M(this, "supportedExtensions", [".md", ".markdown"]);
  }
}
class _r extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "html");
    M(this, "name", "HTML");
    M(this, "description", "Import HTML web pages and exports.");
    M(this, "supportedExtensions", [".html", ".htm"]);
  }
}
class Dr extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "docx");
    M(this, "name", "DOCX");
    M(this, "description", "Import Microsoft Word documents.");
    M(this, "supportedExtensions", [".docx"]);
  }
}
class xr extends pe {
  constructor() {
    super(...arguments);
    M(this, "id", "txt");
    M(this, "name", "Plain Text");
    M(this, "description", "Import plain text files.");
    M(this, "supportedExtensions", [".txt"]);
  }
}
const Qt = [
  new Cr(),
  new kr(),
  new Tr(),
  new _r(),
  new Dr(),
  new xr()
];
class Nr {
  constructor() {
    M(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(t) {
    this.plugins.set(t.id, t);
  }
  unregister(t) {
    this.plugins.delete(t);
  }
  get(t) {
    return this.plugins.get(t);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
}
const Lr = new Nr();
class $r {
  async export(t, n, s) {
    throw new Sn(`Exporter "${this.name}"`);
  }
}
const br = /KRC-(\d{4})/gi, Ar = /## ChatGPT Conversation ID\s*\n([^\n]+)/, Fr = [
  "VIGS",
  "Founder_OS",
  "Axiom",
  "Book",
  "Knowledge_Recovery",
  "Source_Material",
  "Technical_Build",
  "Other_Review_Needed"
];
async function vt(e) {
  const t = [];
  let n;
  try {
    n = await x.readdir(e, { withFileTypes: !0 });
  } catch {
    return t;
  }
  for (const s of n) {
    const r = k.join(e, s.name);
    s.isDirectory() ? t.push(...await vt(r)) : s.name.endsWith(".md") && t.push(r);
  }
  return t;
}
async function wt(e) {
  let t = 0;
  const n = k.join(e, "Sources"), s = await vt(n);
  for (const i of s) {
    const c = k.basename(i).match(/KRC-(\d{4})/i);
    c && (t = Math.max(t, parseInt(c[1], 10)));
  }
  const r = k.join(e, "Registries", "SOURCE_REGISTRY.md");
  try {
    const i = await x.readFile(r, "utf8");
    for (const a of i.matchAll(br))
      t = Math.max(t, parseInt(a[1], 10));
  } catch {
  }
  return t;
}
function Et(e) {
  return `KRC-${String(e).padStart(4, "0")}`;
}
function St(e) {
  return e.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 80) || "Untitled";
}
async function An(e) {
  const t = /* @__PURE__ */ new Map(), n = k.join(e, "Sources"), s = await vt(n);
  for (const r of s) {
    const a = k.basename(r).match(/^(KRC-\d{4})/i);
    if (!a)
      continue;
    const o = (await x.readFile(r, "utf8")).match(Ar);
    o && t.set(o[1].trim(), a[1].toUpperCase());
  }
  return t;
}
async function Pr(e) {
  await x.mkdir(k.join(e, "Sources"), { recursive: !0 }), await x.mkdir(k.join(e, "Uploads"), { recursive: !0 }), await x.mkdir(k.join(e, "Registries"), { recursive: !0 }), await x.mkdir(k.join(e, "ExecutiveSessions"), { recursive: !0 });
  for (const t of Fr)
    await x.mkdir(k.join(e, "Sources", t), { recursive: !0 }), await x.mkdir(k.join(e, "ExecutiveSessions", t), { recursive: !0 });
}
async function en(e, t, n) {
  await x.mkdir(k.dirname(e), { recursive: !0 });
  try {
    return await x.access(e), n ? (await x.writeFile(e, t, "utf8"), "updated") : "skipped";
  } catch {
    return await x.writeFile(e, t, "utf8"), "created";
  }
}
async function Or(e, t, n) {
  await x.mkdir(k.dirname(e), { recursive: !0 });
  try {
    return await x.access(e), n ? (await x.writeFile(e, t), "updated") : "skipped";
  } catch {
    return await x.writeFile(e, t), "created";
  }
}
function Ur(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Mr(e) {
  var c, o;
  const t = e.content.trim();
  if (!t)
    return "No extractable conversation content. Flagged for manual review.";
  const n = t.match(/### User\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), s = t.match(/### Assistant\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), r = ((c = n == null ? void 0 : n[1]) == null ? void 0 : c.trim().slice(0, 400)) ?? "", i = ((o = s == null ? void 0 : s[1]) == null ? void 0 : o.trim().slice(0, 400)) ?? "", a = [];
  return r && a.push(`**User focus:** ${r}${r.length >= 400 ? "…" : ""}`), i && a.push(`**Assistant response:** ${i}${i.length >= 400 ? "…" : ""}`), a.join(`

`) || t.slice(0, 600);
}
function Br(e, t) {
  const n = /* @__PURE__ */ new Set();
  n.add(t.inferredProject);
  for (const s of t.recurringTerms.slice(0, 5))
    n.add(s);
  return typeof e.metadata.pastedTranscriptCount == "number" && e.metadata.pastedTranscriptCount > 0 && n.add("Pasted source material"), [...n].filter(Boolean);
}
function jr(e, t, n, s) {
  const r = t.title.trim() || "Untitled Conversation", i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    e,
    "",
    "## Session Date",
    Ur(t.metadata.createTime),
    "",
    "## Classification",
    `- Primary: ${n.primaryCategory}`,
    `- Categories: ${n.categories.join(", ")}`,
    `- Confidence: ${n.confidence}%`,
    `- Project: ${n.inferredProject}`,
    `- Uncertain: ${n.uncertain ? "Yes — review needed" : "No"}`,
    "",
    "## Rationale",
    n.rationale,
    "",
    "## Session Summary",
    Mr(t),
    "",
    "## Key Topics",
    ...Br(t, n).map((c) => `- ${c}`),
    "",
    "## Recurring Terms",
    ...n.recurringTerms.length > 0 ? n.recurringTerms.map((c) => `- ${c}`) : ["- None detected"],
    "",
    "## Action / Follow-up",
    n.uncertain ? "Manual review required. Verify project assignment and capability extraction." : "Pending detailed capability extraction.",
    "",
    "## Transcript Reference",
    s,
    "",
    "## Notes",
    `Auto-generated by KAE on ${i}.`
  ].join(`
`);
}
function Fn(e, t) {
  const n = t.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Untitled";
  return `${e}_${n}_SESSION.md`;
}
function zr(e) {
  var n;
  const t = e.match(/## Topic\s*\n([^\n#]+)/);
  return ((n = t == null ? void 0 : t[1]) == null ? void 0 : n.trim()) ?? "ChatGPT conversation import";
}
async function Rt(e, t) {
  if (t.length === 0)
    return;
  const n = k.join(e, "Registries", "SOURCE_REGISTRY.md");
  let s;
  try {
    s = await x.readFile(n, "utf8");
  } catch {
    s = [
      "# Axiom Source Registry",
      "",
      "Campaign: Knowledge Recovery Campaign",
      "Repository Version: v0.3",
      "Sources Inventoried: 0",
      "",
      "| Source ID | Title | Topic | Primary Product | Status |",
      "|---|---|---|---|---|"
    ].join(`
`);
  }
  const r = t.map((o) => `| ${o.krcId} | ${o.title.replace(/\|/g, "\\|")} | ${o.topic.replace(/\|/g, "\\|")} | ${o.primaryProduct} | ${o.status} |`).join(`
`);
  s = s.trimEnd() + `
` + r + `
`;
  const i = s.match(/Sources Inventoried:\s*(\d+)/), c = (i ? parseInt(i[1], 10) : 0) + t.length;
  s = s.replace(/Sources Inventoried:\s*\d+/, `Sources Inventoried: ${c}`), await x.writeFile(n, s, "utf8");
}
async function Gr(e, t, n) {
  if (t === 0)
    return;
  const s = k.join(e, "Registries", "KRC_STATUS.md");
  let r;
  try {
    r = await x.readFile(s, "utf8");
  } catch {
    r = [
      "# Knowledge Recovery Campaign",
      "",
      "Repository Version: v0.5",
      "",
      "Approximate Sources Inventoried: 0"
    ].join(`
`);
  }
  const i = r.match(/Approximate Sources Inventoried:\s*(\d+)/), a = i ? parseInt(i[1], 10) : 0;
  r = r.replace(/Approximate Sources Inventoried:\s*\d+/, `Approximate Sources Inventoried: ${a + t}`);
  const c = `
${n}
- KAE import: ${t} new source(s) on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  r.includes(n) || (r = r.trimEnd() + c + `
`), await x.writeFile(s, r, "utf8");
}
function Ct(e, t, n, s) {
  return {
    krcId: e,
    title: t,
    topic: zr(n),
    primaryProduct: s ?? "TBD",
    status: n.includes("Review Needed") ? "Review Needed" : "Inventoried"
  };
}
function tn(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Kr(e, t) {
  if (t.uncertain)
    return "Unclassified — review needed";
  const n = e.metadata.pastedTranscriptCount;
  return typeof n == "number" && n > 0 ? "Pasted source text / ChatGPT conversation" : `${t.primaryCategory} / ChatGPT conversation`;
}
function Zr(e) {
  const t = [], n = ["Axiom", "Founder OS", "VIGS"];
  for (const s of n) {
    const r = e.categories.some((i) => i === s || s === "Founder OS" && i === "Founder OS");
    t.push(`- ${s}: ${r ? "Yes" : "Possible"}`);
  }
  return t;
}
function Hr(e, t, n) {
  const s = t.title.trim() || "Untitled Conversation", r = String(t.metadata.conversationId ?? t.id), i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), a = t.metadata.messageCount ?? 0, c = [
    `# ${e} — ${s}`,
    "",
    "## Status",
    n.uncertain ? "Review Needed" : "Inventoried",
    "",
    "## Description",
    a === 0 ? "Empty or unparseable ChatGPT conversation — preserved for review." : `ChatGPT conversation acquired by KAE (${a} messages).`,
    "",
    "## Topic",
    Kr(t, n),
    "",
    "## Primary Product",
    n.uncertain ? "Review Needed" : n.primaryCategory,
    "",
    "## Categories",
    ...n.categories.map((l) => `- ${l}`),
    "",
    "## Inferred Project",
    n.inferredProject,
    "",
    "## Classification Confidence",
    `${n.confidence}%`,
    "",
    "## Classification Rationale",
    n.rationale,
    "",
    "## Applies To",
    ...Zr(n),
    "",
    "## ChatGPT Conversation ID",
    r,
    "",
    "## Create Time",
    tn(t.metadata.createTime),
    "",
    "## Update Time",
    tn(t.metadata.updateTime),
    "",
    "## Extraction Status",
    "Pending detailed capability extraction.",
    "",
    "## Notes",
    `Acquired by KAE from ChatGPT export on ${i}. Auto-classified.`,
    "",
    "## Transcript",
    "",
    t.content.trim() || "_No extractable transcript content._"
  ];
  if (n.recurringTerms.length > 0) {
    c.push("", "## Recurring Terms", "");
    for (const l of n.recurringTerms)
      c.push(`- ${l}`);
  }
  const o = t.metadata.fileReferences;
  if (Array.isArray(o) && o.length > 0) {
    c.push("", "## File References", "");
    for (const l of o)
      typeof l == "string" && c.push(`- ${l}`);
  }
  return c.join(`
`);
}
function Pn(e, t) {
  return `${e}_${St(t.title)}.md`;
}
function On(e) {
  return e.uncertain || e.primaryCategory === "Other / Review Needed" ? "Other_Review_Needed" : {
    VIGS: "VIGS",
    "Founder OS": "Founder_OS",
    Axiom: "Axiom",
    Book: "Book",
    "Knowledge Recovery": "Knowledge_Recovery",
    "Source Material": "Source_Material",
    "Technical Build": "Technical_Build",
    "Other / Review Needed": "Other_Review_Needed"
  }[e.primaryCategory] ?? "Other_Review_Needed";
}
function Vr(e) {
  const t = [
    `## Import Batch — ${e.importDate}`,
    "",
    `- **Source file:** ${e.importFileName}`,
    `- **Conversations processed:** ${e.conversationsProcessed}`,
    `- **Classified:** ${e.classified.length}`,
    `- **Uncertain / review needed:** ${e.uncertain.length}`,
    `- **Skipped (duplicates):** ${e.skipped.length}`,
    `- **Errors:** ${e.errors.length}`,
    ""
  ];
  return e.classified.length > 0 && t.push("### Classified", "", Fe(e.classified), ""), e.uncertain.length > 0 && t.push("### Uncertain / Review Needed", "", Fe(e.uncertain), ""), e.skipped.length > 0 && t.push("### Skipped", "", Fe(e.skipped), ""), e.errors.length > 0 && t.push("### Errors", "", Fe(e.errors), ""), t.push("---", ""), t.join(`
`);
}
function Fe(e) {
  const t = "| KRC ID | Title | Primary Category | All Categories | Confidence | Status | Notes |", n = "|---|---|---|---|---|---|---|", s = e.map((r) => {
    const i = [r.notes, r.sourcePath ? `Source: ${r.sourcePath}` : ""].filter(Boolean).join("; ");
    return `| ${r.krcId} | ${nn(r.title)} | ${r.primaryCategory} | ${r.categories.join(", ")} | ${r.confidence}% | ${r.status} | ${nn(i)} |`;
  });
  return [t, n, ...s].join(`
`);
}
function nn(e) {
  return e.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function Wr() {
  return [
    "# Import Review",
    "",
    "Auto-generated by KAE. Lists conversation classifications, uncertain items, skips, and errors.",
    ""
  ].join(`
`);
}
async function qr(e, t) {
  const n = k.join(e, "Registries", "IMPORT_REVIEW.md");
  let s;
  try {
    s = await x.readFile(n, "utf8");
  } catch {
    s = Wr();
  }
  return s = s.trimEnd() + `

` + Vr(t), await x.writeFile(n, s, "utf8"), n;
}
function Yr(e, t) {
  const s = new Ln(e).getEntries(), r = /* @__PURE__ */ new Map();
  for (const a of s)
    a.isDirectory || r.set(a.entryName.replace(/\\/g, "/"), a);
  const i = /* @__PURE__ */ new Map();
  for (const a of t) {
    const c = r.get(a.zipPath);
    c && i.set(a.zipPath, c.getData());
  }
  return i;
}
async function Xr(e, t, n) {
  var v, h, y, E, S, _, A, N;
  const s = [], r = [];
  let i = 0, a = 0, c = 0, o = 0, l = 0;
  await Pr(t);
  const u = yt(e);
  for (const L of e) {
    const b = String(L.metadata.conversationId ?? L.id);
    L.metadata.classification = u.get(b);
  }
  let d = await wt(t) + 1;
  const p = await An(t), g = [], I = `KAE Import — ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`, w = k.join(t, "Uploads", `chatgpt-import-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`);
  let T = !1;
  const R = {
    importDate: (/* @__PURE__ */ new Date()).toISOString(),
    importFileName: (n == null ? void 0 : n.importFileName) ?? "unknown.zip",
    conversationsProcessed: e.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: []
  }, C = e.length;
  let D = 0;
  for (const L of e) {
    D++, (v = n == null ? void 0 : n.onProgress) == null || v.call(n, Math.round(D / C * 100));
    const b = String(L.metadata.conversationId ?? L.id), U = u.get(b) ?? gt(L);
    L.metadata.classification = U;
    const z = p.get(b), G = On(U);
    let B, V;
    z ? (B = z, V = !0, (h = n == null ? void 0 : n.log) == null || h.call(n, "info", `Updating existing source ${B} for conversation ${b}`)) : (B = Et(d), d++, V = !1);
    const Y = Pn(B, L), ue = k.join(t, "Sources", G, Y), fe = `Sources/${G}/${Y}`, ye = Hr(B, L, U), Ie = Fn(B, L), Le = k.join(t, "ExecutiveSessions", G, Ie), ve = `ExecutiveSessions/${G}/${Ie}`, $e = jr(B, L, U, fe), $ = {
      krcId: B,
      conversationId: b,
      title: L.title,
      primaryCategory: U.primaryCategory,
      categories: U.categories,
      confidence: U.confidence,
      uncertain: U.uncertain,
      status: "classified",
      sourcePath: fe,
      sessionPath: ve
    };
    try {
      const K = await en(ue, ye, V);
      if (K === "skipped") {
        c++, $.status = "skipped", $.notes = "Duplicate file — not overwritten", R.skipped.push($), (y = n == null ? void 0 : n.log) == null || y.call(n, "warn", `Skipped duplicate file: ${Y}`);
        continue;
      }
      p.set(b, B), K === "created" ? (i++, r.push(B), g.push(Ct(B, L.title, ye, U.uncertain ? "Review Needed" : U.primaryCategory))) : K === "updated" && ($.status = "updated"), await en(Le, $e, V), a++, (E = n == null ? void 0 : n.log) == null || E.call(n, "info", `Executive session: ${ve}`), U.uncertain ? (l++, $.status = $.status === "updated" ? "updated" : "uncertain", R.uncertain.push($)) : (o++, R.classified.push($)), (S = n == null ? void 0 : n.log) == null || S.call(n, "info", `${K === "created" ? "Created" : "Updated"} [${U.primaryCategory}] ${B}: ${fe}`), T || (await Jr(w, L, n), T = !0);
    } catch (K) {
      const q = K instanceof Error ? K.message : String(K);
      s.push(`${B}: ${q}`), $.status = "error", $.notes = q, R.errors.push($), (_ = n == null ? void 0 : n.log) == null || _.call(n, "error", `Failed to write ${B}: ${q}`);
    }
  }
  let m;
  try {
    g.length > 0 && await Rt(t, g), await Gr(t, g.length, I), m = await qr(t, R), (A = n == null ? void 0 : n.log) == null || A.call(n, "info", `Import review written: ${m}`);
  } catch (L) {
    const b = L instanceof Error ? L.message : String(L);
    s.push(`Registry/review update: ${b}`), (N = n == null ? void 0 : n.log) == null || N.call(n, "error", b);
  }
  const f = k.join(t, "Sources");
  return {
    sourcesCreated: i,
    sessionsCreated: a,
    skippedDuplicates: c,
    errors: s,
    outputFolder: f,
    createdSourceIds: r,
    classified: o,
    uncertain: l,
    reviewFile: m
  };
}
async function Jr(e, t, n) {
  var a, c;
  const s = t.metadata.allZipAssets;
  if (!Array.isArray(s) || s.length === 0)
    return;
  await x.mkdir(e, { recursive: !0 });
  const r = s.some((o) => !o.dataBase64);
  let i;
  r && (n != null && n.sourceZipPath) && ((a = n.log) == null || a.call(n, "info", `Extracting ${s.length} asset(s) from ZIP at write time`), i = Yr(n.sourceZipPath, s));
  for (const o of s) {
    const l = o.dataBase64 ? Buffer.from(o.dataBase64, "base64") : i == null ? void 0 : i.get(o.zipPath);
    if (!l || !o.fileName)
      continue;
    const u = k.join(e, o.fileName);
    await Or(u, l, !1) !== "skipped" && ((c = n == null ? void 0 : n.log) == null || c.call(n, "info", `Preserved asset: Uploads/${k.basename(e)}/${o.fileName}`));
  }
}
class Qr extends $r {
  constructor() {
    super(...arguments);
    M(this, "id", "axiom");
    M(this, "name", "Axiom Knowledge Repository");
  }
  async export(n, s, r) {
    return Xr(n, s, r);
  }
}
const Un = new Qr(), ei = [
  "Registries/SOURCE_REGISTRY.md",
  "Registries/KRC_STATUS.md",
  "Registries/IMPORT_REVIEW.md"
];
function Mn(e, t) {
  const n = [], s = [], r = [], i = [], a = [];
  for (const d of e)
    d.action === "create" ? (n.push(d.sourcePath), r.push(d.sessionPath)) : d.action === "update" ? (s.push(d.sourcePath), i.push(d.sessionPath)) : d.action === "skip" && a.push(d.sourcePath);
  const c = n.length + s.length > 0, o = c ? [...ei] : [], l = c ? [t.replace("{timestamp}", "<timestamp>")] : [], u = [...n, ...s, ...r, ...i];
  return {
    sourcesAdded: n,
    sourcesUpdated: s,
    sessionsAdded: r,
    sessionsUpdated: i,
    registriesUpdated: o,
    uploadsAdded: l,
    duplicatesSkipped: a,
    modifiedFiles: u,
    deletedFiles: [],
    estimatedTotalChanges: n.length + s.length + r.length + i.length + o.length + l.length
  };
}
async function ti(e, t, n) {
  const s = [], r = [], i = [], a = [];
  let c = 0, o = 0, l = 0, u = 0;
  const d = yt(e);
  let p = await wt(t) + 1;
  const g = await An(t), I = k.join(t, "Sources"), w = k.join(t, "Uploads", "chatgpt-import-{timestamp}"), T = k.join(t, "ExecutiveSessions"), R = k.join(t, "Registries", "SOURCE_REGISTRY.md"), C = k.join(t, "Registries", "IMPORT_REVIEW.md");
  let D = 0;
  const m = [], f = e[0];
  if (f) {
    const y = f.metadata.allZipAssets;
    Array.isArray(y) && (D = y.length, m.push(...y.map((E) => E.fileName).filter(Boolean)));
  }
  for (const y of e) {
    const E = String(y.metadata.conversationId ?? y.id), S = d.get(E) ?? gt(y), _ = g.get(E), A = On(S);
    let N, L;
    _ ? (N = _, L = "update") : (N = Et(p), p++, L = "create");
    const b = Pn(N, y), U = k.join(I, A, b), z = `Sources/${A}/${b}`, G = Fn(N, y), B = `ExecutiveSessions/${A}/${G}`;
    if (L === "create")
      try {
        await x.access(U), L = "skip";
      } catch {
      }
    L === "create" ? c++ : L === "update" ? o++ : L === "skip" && l++, S.uncertain && u++, a.push({
      conversationId: E,
      title: y.title,
      krcId: N,
      action: L,
      primaryCategory: S.primaryCategory,
      categories: S.categories,
      uncertain: S.uncertain,
      sourcePath: z,
      sessionPath: B
    });
  }
  u > 0 && r.push(`${u} conversation(s) require manual review (uncertain classification).`), l > 0 && r.push(`${l} file(s) already exist and will be skipped.`);
  try {
    await x.access(t);
  } catch {
    r.push("Repository path does not exist yet — it will be created on import.");
  }
  const v = i.length === 0 && e.length > 0, h = Mn(a, w);
  return {
    valid: v,
    fileName: n,
    filePath: "",
    zipReadable: !0,
    chatGptStructureDetected: !0,
    conversationsJsonPresent: !0,
    conversationsFound: e.length,
    uploadedFilesCount: D,
    uploadedFileNames: m,
    estimatedSourcesToCreate: c,
    estimatedSourcesToUpdate: o,
    estimatedDuplicatesSkipped: l,
    uncertainCount: u,
    errors: s,
    warnings: r,
    blockingErrors: i,
    plannedRecords: a,
    diffPreview: h,
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: I,
      uploadsPattern: w,
      executiveSessionsRoot: T,
      registryPath: R,
      reviewPath: C
    },
    repositoryPath: t
  };
}
function ni(e, t, n, s) {
  return {
    valid: !1,
    fileName: e,
    filePath: t,
    zipReadable: !1,
    chatGptStructureDetected: !1,
    conversationsJsonPresent: !1,
    conversationsFound: 0,
    uploadedFilesCount: 0,
    uploadedFileNames: [],
    estimatedSourcesToCreate: 0,
    estimatedSourcesToUpdate: 0,
    estimatedDuplicatesSkipped: 0,
    uncertainCount: 0,
    errors: [s],
    warnings: [],
    blockingErrors: [s],
    plannedRecords: [],
    diffPreview: Mn([], k.join(n, "Uploads", "chatgpt-import-{timestamp}")),
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: k.join(n, "Sources"),
      uploadsPattern: k.join(n, "Uploads", "chatgpt-import-{timestamp}"),
      executiveSessionsRoot: k.join(n, "ExecutiveSessions"),
      registryPath: k.join(n, "Registries", "SOURCE_REGISTRY.md"),
      reviewPath: k.join(n, "Registries", "IMPORT_REVIEW.md")
    },
    repositoryPath: n
  };
}
async function Bn(e, t, n = {}) {
  var a, c, o, l;
  const s = Date.now(), r = [], i = (u, d, p) => {
    var g;
    (g = n.log) == null || g.call(n, u, d, p);
  };
  try {
    i("info", "Validation started (read-only — repository will not be modified)", {
      fileName: e.name,
      repositoryPath: t
    });
    const u = await bn(e, {
      log: n.log,
      onProgress: n.onProgress,
      signal: n.signal
    });
    (a = n.onImportPackageReady) == null || a.call(n, u), (c = n.onProgress) == null || c.call(n, {
      status: "running",
      stage: "planning-import",
      stageLabel: "Planning import (read-only)",
      fileName: e.name,
      conversationsTotal: u.documents.length,
      conversationsProcessed: u.documents.length,
      messagesProcessed: u.documents.reduce((p, g) => p + Number(g.metadata.messageCount ?? 0), 0),
      warningsGenerated: r.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: "Scanning repository for planned changes"
    }), i("info", "Planning import (read-only repository scan)…");
    const d = await ti(u.documents, t, e.name);
    if (d.filePath = e.path, d.zipReadable = !0, d.chatGptStructureDetected = !0, d.conversationsJsonPresent = !0, d.valid = d.blockingErrors.length === 0 && u.documents.length > 0, d.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), d.durationMs = Date.now() - s, u.documents.length === 0) {
      const p = "No conversations found in export.";
      d.errors.push(p), d.blockingErrors.push(p), d.valid = !1;
    }
    if (d.uncertainCount > 0) {
      const p = `${d.uncertainCount} conversation(s) classified as uncertain and will route to Other / Review Needed.`;
      d.warnings.push(p), r.push(p);
    }
    if (d.estimatedDuplicatesSkipped > 0) {
      const p = `${d.estimatedDuplicatesSkipped} duplicate(s) will be skipped during import.`;
      d.warnings.push(p), r.push(p);
    }
    return r.length > 0 && i("warn", `Validation warnings: ${r.length}`, { warnings: r }), (o = n.onProgress) == null || o.call(n, {
      status: d.valid ? "complete" : "failed",
      stage: d.valid ? "completed" : "failed",
      stageLabel: d.valid ? "Validation complete" : "Validation failed",
      fileName: e.name,
      conversationsTotal: d.conversationsFound,
      conversationsProcessed: d.conversationsFound,
      messagesProcessed: u.documents.reduce((p, g) => p + Number(g.metadata.messageCount ?? 0), 0),
      warningsGenerated: d.warnings.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: d.valid ? `${d.conversationsFound} conversations ready for review` : d.blockingErrors.join("; ") || "Validation failed",
      error: d.valid ? void 0 : d.blockingErrors.join("; ") || "Validation failed"
    }), d.valid ? i("info", `Validation completed successfully in ${d.durationMs}ms`, {
      conversationsFound: d.conversationsFound,
      estimatedSourcesToCreate: d.estimatedSourcesToCreate,
      estimatedSourcesToUpdate: d.estimatedSourcesToUpdate,
      warnings: d.warnings.length
    }) : i("error", `Validation failed — repository unchanged. ${d.blockingErrors.join("; ")}`, {
      blockingErrors: d.blockingErrors,
      errors: d.errors
    }), d;
  } catch (u) {
    const d = u instanceof Error ? u.message : String(u), p = d.includes("cancelled"), g = ni(e.name, e.path, t, d);
    return g.durationMs = Date.now() - s, g.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), (l = n.onProgress) == null || l.call(n, {
      status: p ? "cancelled" : "failed",
      stage: p ? "cancelled" : "failed",
      stageLabel: p ? "Validation cancelled" : "Validation failed",
      fileName: e.name,
      conversationsTotal: 0,
      conversationsProcessed: 0,
      messagesProcessed: 0,
      warningsGenerated: 0,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      error: d,
      detail: d
    }), i(p ? "warn" : "error", `Validation ${p ? "cancelled" : "failed"} — repository unchanged. ${d}`, { error: d }), g;
  }
}
const sn = vn(In);
async function si(e) {
  try {
    return await x.access(e), !0;
  } catch {
    return !1;
  }
}
async function ri(e) {
  const t = k.join(e, ".kae-snapshots");
  try {
    const s = (await x.readdir(t)).sort().reverse();
    return s[0] ? k.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function ii(e, t) {
  const n = [];
  let s = !1, r, i = !1;
  try {
    const { stdout: p } = await sn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: e
    });
    r = p.trim(), s = !0, n.push({
      id: "git-repo",
      label: "Git repository",
      passed: !0,
      message: `Repository is under Git control (branch: ${r}).`,
      severity: "info"
    });
  } catch {
    n.push({
      id: "git-repo",
      label: "Git repository",
      passed: !1,
      message: "Repository path is not a Git repository.",
      severity: "warning"
    });
  }
  if (s)
    try {
      const { stdout: p } = await sn("git", ["status", "--porcelain"], {
        cwd: e
      });
      i = p.trim().length > 0, n.push({
        id: "git-clean",
        label: "Working tree clean",
        passed: !i,
        message: i ? "Working tree has uncommitted changes." : "Working tree is clean.",
        severity: i ? "warning" : "info"
      });
    } catch {
      n.push({
        id: "git-clean",
        label: "Working tree clean",
        passed: !1,
        message: "Unable to read Git status.",
        severity: "warning"
      });
    }
  const a = (t == null ? void 0 : t.duplicateIds) ?? [];
  n.push({
    id: "duplicate-ids",
    label: "No duplicate KRC IDs",
    passed: a.length === 0,
    message: a.length === 0 ? "No duplicate source IDs detected." : `${a.length} duplicate ID(s): ${a.slice(0, 5).join(", ")}${a.length > 5 ? "…" : ""}`,
    severity: a.length > 0 ? "error" : "info"
  });
  const c = (t == null ? void 0 : t.categorizedIssues.warnings.filter((p) => p.code === "MISSING_REGISTRY")) ?? [];
  n.push({
    id: "registries",
    label: "Required registries present",
    passed: c.length === 0,
    message: c.length === 0 ? "All required registries are present." : `${c.length} registry file(s) missing.`,
    severity: c.length > 0 ? "warning" : "info"
  });
  const o = (t == null ? void 0 : t.categorizedIssues.errors) ?? [];
  n.push({
    id: "integrity",
    label: "No integrity errors",
    passed: o.length === 0,
    message: o.length === 0 ? "No broken references or integrity errors detected." : `${o.length} integrity error(s) require attention.`,
    severity: o.length > 0 ? "error" : "info"
  });
  const l = await ri(e);
  n.push({
    id: "snapshot",
    label: "Import snapshot available",
    passed: !!l,
    message: l ? `Latest snapshot: ${k.basename(l)}` : "No import snapshot found (created automatically before imports).",
    severity: "info"
  }), await si(e) || n.push({
    id: "repo-exists",
    label: "Repository path exists",
    passed: !1,
    message: "Repository path does not exist yet.",
    severity: "warning"
  });
  const d = !n.some((p) => !p.passed && p.severity === "error") && a.length === 0;
  return {
    ready: d,
    status: d ? "READY" : "NOT READY",
    checks: n
  };
}
const rn = vn(In), on = /KRC-\d{4}/g;
async function ae(e) {
  try {
    return await x.access(e), !0;
  } catch {
    return !1;
  }
}
async function an(e) {
  const t = [];
  if (!await ae(e))
    return t;
  async function n(s) {
    const r = await x.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const a = k.join(s, i.name);
      i.isDirectory() ? await n(a) : i.name.endsWith(".md") && t.push(a);
    }
  }
  return await n(e), t;
}
function cn(e, t) {
  return k.relative(e, t).replace(/\\/g, "/");
}
function W(e, t) {
  e.push(t);
}
async function le(e) {
  const t = [], n = [], s = /* @__PURE__ */ new Map();
  await ae(e) || W(t, {
    severity: "warning",
    category: "warning",
    code: "REPO_MISSING",
    message: "Repository path does not exist.",
    path: e,
    recovery: "Configure the repository path in Settings or import to create it."
  });
  const r = ["Sources", "ExecutiveSessions", "Registries", "Uploads"];
  for (const T of r) {
    const R = k.join(e, T);
    await ae(R) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_DIR",
      message: `Missing directory: ${T}`,
      path: R,
      relativePath: T,
      recovery: "Directory will be created automatically on first import."
    });
  }
  const i = ["SOURCE_REGISTRY.md", "KRC_STATUS.md", "IMPORT_REVIEW.md"];
  for (const T of i) {
    const R = k.join(e, "Registries", T);
    await ae(R) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_REGISTRY",
      message: `Missing registry: ${T}`,
      path: R,
      relativePath: `Registries/${T}`,
      recovery: "Registry files are created during the first successful import."
    });
  }
  const a = await an(k.join(e, "Sources")), c = await an(k.join(e, "ExecutiveSessions")), o = /* @__PURE__ */ new Map();
  for (const T of c) {
    const C = k.basename(T).match(on);
    C != null && C[0] && o.set(C[0], T);
  }
  for (const T of a) {
    const R = k.basename(T), C = cn(e, T), D = R.match(on);
    if (!D) {
      W(t, {
        severity: "info",
        category: "info",
        code: "NO_KRC_ID",
        message: `Source file has no KRC ID in filename: ${R}`,
        path: T,
        relativePath: C
      });
      continue;
    }
    for (const f of D) {
      const v = s.get(f) ?? [];
      v.push(T), s.set(f, v);
    }
    /[<>:"|?*]/.test(R) && W(t, {
      severity: "error",
      category: "error",
      code: "INVALID_FILENAME",
      message: `Invalid characters in filename: ${R}`,
      path: T,
      relativePath: C,
      recovery: "Rename the file to remove invalid characters."
    });
    const m = D[0];
    o.has(m) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_SESSION",
      message: `No executive session found for ${m}`,
      path: T,
      relativePath: C,
      recovery: "Re-import or manually create the executive session record."
    });
    try {
      const f = await x.readFile(T, "utf8");
      !f.includes("## Metadata") && !f.includes("Acquired by KAE") && W(t, {
        severity: "info",
        category: "info",
        code: "MISSING_METADATA",
        message: `Source ${m} may be missing standard metadata block`,
        path: T,
        relativePath: C
      });
    } catch {
      W(t, {
        severity: "error",
        category: "error",
        code: "UNREADABLE_FILE",
        message: `Unable to read source file: ${R}`,
        path: T,
        relativePath: C,
        recovery: "Verify file permissions and encoding."
      });
    }
  }
  for (const [T, R] of s)
    R.length > 1 && (n.push(T), W(t, {
      severity: "error",
      category: "error",
      code: "DUPLICATE_ID",
      message: `Duplicate KRC ID ${T} found in ${R.length} files`,
      path: R[0],
      relativePath: cn(e, R[0]),
      recovery: "Remove or merge duplicate source files before committing."
    }));
  a.length === 0 && await ae(e) && W(t, {
    severity: "info",
    category: "recommendation",
    code: "EMPTY_SOURCES",
    message: "No source files found in the repository.",
    recovery: "Import a ChatGPT export to populate the knowledge repository."
  }), await ae(k.join(e, ".kae-snapshots")) || W(t, {
    severity: "info",
    category: "recommendation",
    code: "NO_SNAPSHOTS",
    message: "No import snapshots yet.",
    recovery: "Snapshots are created automatically before each import."
  });
  let l = !1, u, d;
  try {
    const { stdout: T } = await rn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: e
    }), { stdout: R } = await rn("git", ["status", "--porcelain"], {
      cwd: e
    });
    l = !0, u = T.trim(), d = R.trim().length > 0, d && W(t, {
      severity: "info",
      category: "recommendation",
      code: "GIT_DIRTY",
      message: "Git working tree has uncommitted changes.",
      recovery: "Review changes and commit when ready."
    });
  } catch {
    W(t, {
      severity: "info",
      category: "recommendation",
      code: "NOT_GIT",
      message: "Repository is not initialized as a Git repository.",
      recovery: "Run git init in the repository folder for version control."
    });
  }
  const p = bs(t), I = {
    ready: !(p.errors.length > 0) && await ae(e),
    statusLevel: "healthy",
    statusHeadline: "",
    statusSubline: "",
    repositoryPath: e,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sourceCount: a.length,
    sessionCount: c.length,
    duplicateIds: n,
    issues: t,
    categorizedIssues: p,
    gitReady: l,
    gitBranch: u,
    gitDirty: d,
    gitReadiness: { ready: !1, status: "NOT READY", checks: [] }
  }, w = $s(I);
  return I.statusLevel = w.level, I.statusHeadline = w.headline, I.statusSubline = w.subline, I.gitReadiness = await ii(e, I), I;
}
async function jn(e, t) {
  await x.mkdir(t, { recursive: !0 });
  const n = await x.readdir(e, { withFileTypes: !0 });
  for (const s of n) {
    const r = k.join(e, s.name), i = k.join(t, s.name);
    s.isDirectory() ? await jn(r, i) : await x.copyFile(r, i);
  }
}
async function zn(e, t) {
  const n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = k.join(e, ".kae-snapshots", `${n}_${t}`);
  await x.mkdir(s, { recursive: !0 });
  const r = ["Sources", "ExecutiveSessions", "Registries"];
  for (const i of r) {
    const a = k.join(e, i);
    try {
      await x.access(a), await jn(a, k.join(s, i));
    } catch {
    }
  }
  return s;
}
async function oi(e, t) {
  const n = k.join(e, ".kae-sessions");
  await x.mkdir(n, { recursive: !0 });
  const s = k.join(n, `${t.sessionId}.json`);
  return await x.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const ai = 53, ci = 122;
function di(e) {
  var s;
  const t = e.slice(0, 4096), n = t.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: n == null ? void 0 : n[1],
    title: (s = n == null ? void 0 : n[2]) == null ? void 0 : s.trim(),
    createTime: ce(t, "Create Time"),
    updateTime: ce(t, "Update Time")
  };
}
async function Gn(e) {
  const n = (await Ze(e)).filter((r) => r.category === "sources" && kt(r.name)), s = [];
  for (const r of n) {
    let i = "";
    try {
      i = (await De(e, r.relativePath)).slice(0, 4096);
    } catch {
    }
    const a = di(i), c = a.updateTime ?? a.createTime ?? r.modifiedAt ?? "";
    s.push({
      name: r.name,
      relativePath: r.relativePath,
      krcId: a.krcId ?? r.name,
      title: a.title ?? r.name.replace(/\.md$/i, ""),
      createTime: a.createTime,
      updateTime: a.updateTime,
      sortTime: c,
      sizeBytes: r.sizeBytes,
      modifiedAt: r.modifiedAt
    });
  }
  return s.sort((r, i) => new Date(i.sortTime).getTime() - new Date(r.sortTime).getTime());
}
function kt(e) {
  const t = e.match(/^KRC-(\d{4})_/i);
  if (!t)
    return !1;
  const n = parseInt(t[1], 10);
  return n >= ai && n <= ci;
}
function ce(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function li(e) {
  return e ? e.split(`
`).map((t) => t.replace(/^-\s*/, "").trim()).filter(Boolean) : [];
}
function ui(e) {
  var l, u, d, p;
  const t = e.split(`
`), n = (l = t[0]) == null ? void 0 : l.trim();
  if (!n)
    return null;
  let s, r = 1;
  (u = t[1]) != null && u.startsWith("*") && ((d = t[1]) != null && d.endsWith("*")) && (s = t[1].slice(1, -1).trim(), r = 2);
  const a = t.slice(r).join(`
`).trim().split(/\n\*\*File references:\*\*\s*\n/i), c = ((p = a[0]) == null ? void 0 : p.trim()) ?? "", o = [];
  if (a[1])
    for (const g of a[1].split(`
`)) {
      const I = g.replace(/^-\s*/, "").trim();
      I && o.push(I);
    }
  return { role: n, timestamp: s, text: c, fileReferences: o };
}
function Tt(e) {
  const t = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!t)
    return null;
  const n = e.indexOf("## Transcript"), s = n >= 0 ? e.slice(0, n) : e, r = n >= 0 ? e.slice(n + 13) : "", i = [];
  for (const a of r.split(/^### /m).slice(1)) {
    const c = ui(a);
    c && i.push(c);
  }
  return {
    krcId: t[1],
    title: t[2].trim(),
    conversationId: ce(s, "ChatGPT Conversation ID"),
    createTime: ce(s, "Create Time"),
    updateTime: ce(s, "Update Time"),
    description: ce(s, "Description"),
    fileReferences: li(ce(s, "File References")),
    messages: i
  };
}
function _t(e, t) {
  if (e.length >= 4 && e[0] === 137 && e[1] === 80 && e[2] === 78 && e[3] === 71)
    return "image/png";
  if (e.length >= 3 && e[0] === 255 && e[1] === 216 && e[2] === 255)
    return "image/jpeg";
  if (e.length >= 6 && e[0] === 71 && e[1] === 73 && e[2] === 70)
    return "image/gif";
  if (e.length >= 12 && e[4] === 102 && e[5] === 116 && e[6] === 121 && e[7] === 112)
    return "video/mp4";
  if (e.length >= 4 && e[0] === 37 && e[1] === 80 && e[2] === 68 && e[3] === 70)
    return "application/pdf";
  const n = (t == null ? void 0 : t.toLowerCase()) ?? "";
  return n.endsWith(".png") ? "image/png" : n.endsWith(".jpg") || n.endsWith(".jpeg") ? "image/jpeg" : n.endsWith(".gif") ? "image/gif" : n.endsWith(".webp") ? "image/webp" : n.endsWith(".mp4") ? "video/mp4" : n.endsWith(".webm") ? "video/webm" : n.endsWith(".mov") ? "video/quicktime" : "application/octet-stream";
}
function fi(e) {
  return e.startsWith("image/") ? "image" : e.startsWith("video/") ? "video" : "other";
}
async function Kn(e) {
  const t = k.join(e, "Uploads");
  let n;
  try {
    n = await x.readdir(t);
  } catch {
    return null;
  }
  const s = n.filter((r) => r.startsWith("chatgpt-import-")).sort().reverse();
  return s.length === 0 ? null : `Uploads/${s[0]}`;
}
async function Zn(e, t) {
  const n = /* @__PURE__ */ new Map(), s = k.join(e, t);
  let r;
  try {
    r = await x.readdir(s);
  } catch {
    return n;
  }
  for (const i of r) {
    const a = `${t}/${i}`.replace(/\\/g, "/");
    n.set(i.toLowerCase(), a);
    const c = i.replace(/\.dat$/i, "");
    n.set(c.toLowerCase(), a), c.startsWith("file_") && n.set(c.slice(5).toLowerCase(), a);
  }
  return n;
}
function Hn(e, t) {
  const n = e.trim();
  if (!n)
    return null;
  const s = [
    n,
    n.toLowerCase(),
    `${n}.dat`,
    `${n.toLowerCase()}.dat`,
    n.replace(/^file_/, ""),
    `file_${n}`,
    `file_${n}.dat`
  ];
  for (const i of s) {
    const a = t.get(i.toLowerCase());
    if (a)
      return a;
  }
  const r = k.basename(n).toLowerCase();
  for (const [i, a] of t.entries())
    if (i.includes(r) || r.includes(i))
      return a;
  return null;
}
async function pi(e, t) {
  const n = await Kn(e);
  if (!n)
    return [];
  const s = await Zn(e, n), r = [], i = /* @__PURE__ */ new Set();
  for (const a of t) {
    const c = Hn(a, s);
    if (!c || i.has(c))
      continue;
    i.add(c);
    const o = k.join(e, c);
    let l;
    try {
      l = await x.readFile(o);
    } catch {
      continue;
    }
    const u = _t(l, a);
    r.push({
      ref: a,
      relativePath: c,
      fileName: k.basename(c),
      mimeType: u,
      kind: fi(u)
    });
  }
  return r;
}
function Re(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function mi(e, t) {
  var u;
  const n = e.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m), s = ((u = n == null ? void 0 : n[1]) == null ? void 0 : u.trim()) ?? t.replace(/\.md$/i, ""), r = Re(e, "Source ID"), i = Re(e, "Session Date"), a = Re(e, "Session Summary") ?? "", c = Re(e, "Transcript Reference"), o = [];
  c && o.push(c);
  for (const d of ["Key Topics", "Recurring Terms", "Classification", "Rationale"]) {
    const p = Re(e, d);
    if (p)
      for (const g of p.split(`
`)) {
        const I = g.replace(/^-\s*/, "").trim();
        I && o.push(I);
      }
  }
  return {
    sessionId: t.replace(/\.md$/i, ""),
    title: s,
    linkedKrcId: r,
    sessionDate: i,
    summaryText: a,
    summaryReferences: [...new Set(o)],
    transcriptReference: c
  };
}
const me = ".kae-index", hi = "evidence-index.json", Vn = 1;
function Ke(e) {
  return k.join(e, me, hi);
}
async function Wn(e) {
  const t = Ke(e);
  try {
    const n = await x.readFile(t, "utf8"), s = JSON.parse(n);
    return s.version !== Vn || !Array.isArray(s.records) ? null : s;
  } catch {
    return null;
  }
}
async function gi(e, t) {
  const n = k.join(e, me);
  await x.mkdir(n, { recursive: !0 });
  const s = Ke(e);
  return await x.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const yi = /* @__PURE__ */ new Set([
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
function _e(e) {
  const t = e.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter((n) => n.length > 1 && !yi.has(n));
  return [...new Set(t)];
}
function he(e) {
  const t = e.trim();
  if (!t)
    return [];
  if (/^krc-\d{4}$/i.test(t))
    return [t.toLowerCase()];
  const n = t.toLowerCase(), s = _e(t);
  return s.length === 0 && n.length > 0 ? [n] : s;
}
function ke(e, t = 160) {
  return e.replace(/\s+/g, " ").trim().slice(0, t);
}
function qn(e) {
  return kt(e) ? "chatgpt-import" : e.startsWith("KRC-") ? "krc-source" : "markdown";
}
function Ii(e) {
  const t = {
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    recordCount: e.length,
    sources: 0,
    conversations: 0,
    messages: 0,
    attachments: 0,
    executiveSessions: 0
  };
  for (const n of e)
    switch (n.kind) {
      case "source":
        t.sources += 1;
        break;
      case "conversation":
        t.conversations += 1;
        break;
      case "message":
        t.messages += 1;
        break;
      case "attachment":
        t.attachments += 1;
        break;
      case "executive_session":
        t.executiveSessions += 1;
        break;
    }
  return t;
}
function vi(e, t, n, s) {
  const r = Tt(t);
  if (!r)
    return;
  const i = qn(k.basename(e)), a = {
    krcId: r.krcId,
    repositoryPath: e,
    category: "sources",
    sourceType: i
  }, c = {
    conversationId: r.conversationId,
    title: r.title,
    created: r.createTime,
    updated: r.updateTime
  };
  s.push({
    id: `${r.krcId}:source`,
    kind: "source",
    repository: a,
    conversation: c,
    excerpt: ke(r.description ?? r.title)
  }), s.push({
    id: `${r.krcId}:conversation`,
    kind: "conversation",
    repository: a,
    conversation: c,
    excerpt: ke(r.title)
  });
  const o = new Set(r.fileReferences), l = /* @__PURE__ */ new Map();
  r.messages.forEach((u, d) => {
    const p = `${r.krcId}:msg:${d}`, g = _e(u.text);
    l.set(p, u.fileReferences), s.push({
      id: p,
      kind: "message",
      repository: a,
      conversation: c,
      message: {
        messageId: p,
        role: u.role,
        timestamp: u.timestamp,
        text: u.text,
        searchTerms: g
      },
      excerpt: ke(u.text)
    });
    for (const I of u.fileReferences)
      o.add(I);
  });
  for (const u of o) {
    const d = `${r.krcId}:att:${u}`, p = n ? Hn(u, n) : null, g = k.basename(u);
    let I;
    for (const [w, T] of l.entries())
      if (T.includes(u)) {
        I = w;
        break;
      }
    s.push({
      id: d,
      kind: "attachment",
      repository: a,
      conversation: c,
      attachment: {
        attachmentId: d,
        filename: g,
        assetPath: p ?? void 0,
        linkedMessageId: I,
        resolved: !!p
      },
      excerpt: g
    });
  }
}
function wi(e, t, n) {
  var c;
  const s = k.basename(e), r = t.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m), i = r == null ? void 0 : r[1], a = ((c = r == null ? void 0 : r[2]) == null ? void 0 : c.trim()) ?? s.replace(/\.md$/i, "");
  n.push({
    id: `${e}:source`,
    kind: "source",
    repository: {
      krcId: i,
      repositoryPath: e,
      category: "sources",
      sourceType: qn(s)
    },
    conversation: { title: a },
    excerpt: ke(t)
  });
}
function Ei(e, t, n) {
  const s = mi(t, k.basename(e));
  if (!s)
    return;
  const r = [s.summaryText, ...s.summaryReferences].join(`
`);
  n.push({
    id: `${e}:session`,
    kind: "executive_session",
    repository: {
      krcId: s.linkedKrcId,
      repositoryPath: e,
      category: "sessions",
      sourceType: "executive-session"
    },
    conversation: {
      title: s.title,
      created: s.sessionDate
    },
    session: {
      sessionId: s.sessionId,
      linkedKrcId: s.linkedKrcId,
      summaryReferences: s.summaryReferences,
      transcriptReference: s.transcriptReference
    },
    excerpt: ke(r || s.title)
  });
}
async function Yn(e) {
  const t = await Ze(e), n = [], s = await Kn(e), r = s ? await Zn(e, s) : null;
  for (const c of t) {
    if (!c.relativePath.endsWith(".md") || c.category !== "sources" && c.category !== "sessions")
      continue;
    let o;
    try {
      o = await De(e, c.relativePath);
    } catch {
      continue;
    }
    if (c.category === "sessions") {
      Ei(c.relativePath, o, n);
      continue;
    }
    kt(c.name) && Tt(o) ? vi(c.relativePath, o, r, n) : wi(c.relativePath, o, n);
  }
  const i = (/* @__PURE__ */ new Date()).toISOString(), a = {
    version: Vn,
    repositoryPath: e,
    builtAt: i,
    recordCount: n.length,
    records: n
  };
  return await gi(e, a), a;
}
function Si(e) {
  const t = Ii(e.records);
  return t.builtAt = e.builtAt, t;
}
function Xn(e) {
  return e.trim().toLowerCase();
}
function Ri(e) {
  const t = Xn(e);
  return t === "user" || t.startsWith("user ");
}
function Ci(e) {
  const t = Xn(e);
  return t === "assistant" || t.startsWith("assistant ");
}
function ki(e) {
  return e.kind === "executive_session" ? "session" : e.kind === "attachment" ? "attachment" : e.repository.category === "sessions" ? "session" : "source";
}
function Ti(e) {
  var t, n, s, r;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : e.kind === "executive_session" ? ((t = e.conversation) == null ? void 0 : t.title) ?? ((n = e.session) == null ? void 0 : n.sessionId) ?? "Executive Session" : e.kind === "message" && e.message ? `${((s = e.conversation) == null ? void 0 : s.title) ?? e.repository.krcId ?? "Message"} — ${e.message.role}` : ((r = e.conversation) == null ? void 0 : r.title) ?? e.repository.krcId ?? e.repository.repositoryPath;
}
function _i(e) {
  var t, n, s;
  if (e.kind === "executive_session") {
    if ((t = e.session) != null && t.transcriptReference)
      return e.session.transcriptReference;
    const r = (n = e.session) == null ? void 0 : n.summaryReferences.find((i) => i.startsWith("Sources/"));
    return r || e.repository.repositoryPath;
  }
  return e.kind === "attachment" && ((s = e.attachment) != null && s.assetPath), e.repository.repositoryPath;
}
function Pe(e) {
  var n, s;
  const t = [
    e.repository.krcId ?? "",
    e.repository.repositoryPath,
    ((n = e.conversation) == null ? void 0 : n.title) ?? "",
    ((s = e.conversation) == null ? void 0 : s.conversationId) ?? "",
    e.excerpt
  ];
  return e.message && t.push(e.message.text, e.message.role, ...e.message.searchTerms), e.attachment && t.push(e.attachment.filename, e.attachment.assetPath ?? ""), e.session && t.push(e.session.sessionId, e.session.linkedKrcId ?? "", ...e.session.summaryReferences), t.join(`
`).toLowerCase();
}
function Di(e, t, n) {
  var o, l, u;
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  const i = t.toLowerCase(), a = (o = e.repository.krcId) == null ? void 0 : o.toLowerCase();
  a && (a === i || a.includes(i)) && (r += 100, s.add("krcId"));
  const c = ((u = (l = e.conversation) == null ? void 0 : l.title) == null ? void 0 : u.toLowerCase()) ?? "";
  if (c && c.includes(i) && (r += 40, s.add("title")), e.kind === "attachment" && e.attachment) {
    const d = e.attachment.filename.toLowerCase();
    (d.includes(i) || n.some((p) => d.includes(p))) && (r += 50, s.add("filename"), s.add("attachment"));
  }
  if (e.kind === "message" && e.message) {
    const d = e.message.text.toLowerCase(), p = d.includes(i), g = n.filter((I) => d.includes(I)).length;
    (p || g > 0) && (r += p ? 30 : g * 8, s.add("message"), s.add("keyword"), Ri(e.message.role) && (s.add("prompt"), p && (r += 10)), Ci(e.message.role) && (s.add("response"), p && (r += 10)));
  }
  if (e.kind === "executive_session") {
    const d = Pe(e);
    (d.includes(i) || n.some((p) => d.includes(p))) && (r += 25, s.add("session"), s.add("keyword"));
  }
  if (e.kind === "source" || e.kind === "conversation") {
    const d = Pe(e);
    (d.includes(i) || n.some((p) => d.includes(p))) && (r += 15, s.add("keyword"));
  }
  if (r === 0) {
    const d = Pe(e);
    if (d.includes(i))
      r += 5, s.add("keyword");
    else {
      const p = n.filter((g) => d.includes(g)).length;
      p > 0 && (r += p * 3, s.add("keyword"));
    }
  }
  if (n.length > 1) {
    const d = Pe(e);
    n.every((p) => d.includes(p)) && (r += 25, s.add("keyword"));
  }
  return { score: r, matchFields: [...s] };
}
function xi(e, t, n) {
  var s, r, i;
  return {
    recordId: e.id,
    kind: e.kind,
    score: t,
    matchFields: n,
    title: Ti(e),
    snippet: e.excerpt,
    drilldownPath: _i(e),
    krcId: e.repository.krcId,
    conversationTitle: (s = e.conversation) == null ? void 0 : s.title,
    messageRole: (r = e.message) == null ? void 0 : r.role,
    attachmentFilename: (i = e.attachment) == null ? void 0 : i.filename,
    category: ki(e)
  };
}
function Jn(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  const r = he(s), i = [];
  for (const a of e.records) {
    const { score: c, matchFields: o } = Di(a, s, r);
    c <= 0 || o.length === 0 || i.push(xi(a, c, o));
  }
  return i.sort((a, c) => c.score - a.score).slice(0, n);
}
function Qn(e) {
  return e.map((t) => ({
    path: t.drilldownPath,
    title: t.title,
    snippet: t.snippet,
    category: t.category,
    score: t.score,
    evidenceKind: t.kind,
    recordId: t.recordId,
    matchFields: t.matchFields,
    krcId: t.krcId,
    conversationTitle: t.conversationTitle,
    messageRole: t.messageRole,
    attachmentFilename: t.attachmentFilename
  }));
}
async function ge(e) {
  const t = await Wn(e);
  return t && t.repositoryPath === e ? t : Yn(e);
}
async function es(e, t, n = 50) {
  const s = await ge(e);
  return Jn(s, t, n);
}
function Ni(e) {
  const t = e.replace(/\\/g, "/");
  return t.startsWith("Sources/") ? "sources" : t.startsWith("ExecutiveSessions/") ? "sessions" : t.startsWith("Registries/") ? "registries" : t.startsWith("ImportReports/") ? "reports" : t.startsWith("Uploads/") ? "uploads" : "other";
}
async function ts(e, t, n) {
  const s = await x.readdir(t, { withFileTypes: !0 });
  for (const r of s) {
    if (r.name.startsWith(".kae-"))
      continue;
    const i = k.join(t, r.name), a = k.relative(e, i).replace(/\\/g, "/");
    if (r.isDirectory())
      await ts(e, i, n);
    else if (r.name.endsWith(".md") || r.name.endsWith(".json")) {
      let c, o;
      try {
        const l = await x.stat(i);
        c = l.size, o = l.mtime.toISOString();
      } catch {
      }
      n.push({
        name: r.name,
        relativePath: a,
        category: Ni(a),
        sizeBytes: c,
        modifiedAt: o
      });
    }
  }
}
async function Ze(e) {
  const t = [];
  try {
    await x.access(e), await ts(e, e, t);
  } catch {
    return [];
  }
  return t.sort((n, s) => n.relativePath.localeCompare(s.relativePath));
}
async function De(e, t) {
  const n = k.join(e, t), s = k.resolve(e);
  if (!k.resolve(n).startsWith(s))
    throw new Error("Invalid file path.");
  return x.readFile(n, "utf8");
}
function Li(e, t, n = 80) {
  const s = Math.max(0, t - n), r = Math.min(e.length, t + n);
  return e.slice(s, r).replace(/\s+/g, " ").trim();
}
async function $i(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  try {
    const r = await es(e, s, n);
    if (r.length > 0)
      return Qn(r);
  } catch {
  }
  return bi(e, s, n);
}
async function bi(e, t, n = 50) {
  const s = t.toLowerCase(), r = await Ze(e), i = [];
  for (const a of r) {
    if (!a.relativePath.endsWith(".md"))
      continue;
    let c;
    try {
      c = await De(e, a.relativePath);
    } catch {
      continue;
    }
    const o = c.toLowerCase(), l = a.name.replace(/\.md$/i, "");
    let u = 0;
    l.toLowerCase().includes(s) && (u += 10);
    const d = o.split(s).length - 1;
    if (d === 0)
      continue;
    u += d;
    const p = o.indexOf(s);
    i.push({
      path: a.relativePath,
      title: l,
      snippet: Li(c, p),
      category: a.category === "sessions" ? "session" : a.category === "registries" ? "registry" : a.category === "reports" ? "report" : "source",
      score: u
    });
  }
  return i.sort((a, c) => c.score - a.score).slice(0, n);
}
async function Ai(e) {
  const t = k.join(e, ".kae-snapshots");
  try {
    const s = (await x.readdir(t)).sort().reverse();
    return s[0] ? k.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function Fi(e) {
  var n;
  const t = k.join(e, "Registries", "IMPORT_REVIEW.md");
  try {
    const r = (await x.readFile(t, "utf8")).match(/Import Date:\s*([^\n]+)/i);
    return (n = r == null ? void 0 : r[1]) == null ? void 0 : n.trim();
  } catch {
    return;
  }
}
async function ns(e) {
  const t = await le(e);
  let n = 0;
  try {
    const s = k.join(e, "Registries");
    n = (await x.readdir(s)).filter((i) => i.endsWith(".md")).length;
  } catch {
    n = 0;
  }
  return {
    repositoryPath: e,
    sourceCount: t.sourceCount,
    sessionCount: t.sessionCount,
    registryCount: n,
    lastImportDate: await Fi(e),
    lastSnapshotPath: await Ai(e),
    healthReady: t.ready,
    issueCount: t.issues.length
  };
}
function Pi(e) {
  return e < 1e3 ? `${e}ms` : `${(e / 1e3).toFixed(1)}s`;
}
function Oi(e) {
  const t = [
    "# KAE Import Report",
    "",
    `**Report ID:** ${e.reportId}`,
    `**Generated:** ${e.generatedAt}`,
    `**Duration:** ${Pi(e.durationMs)}`,
    "",
    "## Summary",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Connector | ${e.connectorName} |`,
    `| Source file | ${e.sourceFile} |`,
    `| Repository | ${e.repositoryPath} |`,
    `| Imported | ${e.imported} |`,
    `| Updated | ${e.updated} |`,
    `| Skipped | ${e.skipped} |`,
    `| Sessions | ${e.sessionsCreated} |`,
    `| Git readiness | ${e.gitReadiness.status} |`,
    ""
  ];
  if (e.snapshotPath && t.push(`**Snapshot:** \`${e.snapshotPath}\``, ""), e.warnings.length > 0) {
    t.push("## Warnings", "");
    for (const n of e.warnings)
      t.push(`- ${n}`);
    t.push("");
  }
  if (e.errors.length > 0) {
    t.push("## Errors", "");
    for (const n of e.errors)
      t.push(`- ${n}`);
    t.push("");
  }
  if (e.sourcesCreated.length > 0) {
    t.push("## Sources Created", "");
    for (const n of e.sourcesCreated)
      t.push(`- ${n}`);
    t.push("");
  }
  if (e.registriesUpdated.length > 0) {
    t.push("## Registries Updated", "");
    for (const n of e.registriesUpdated)
      t.push(`- ${n}`);
    t.push("");
  }
  t.push("## Git Readiness Checks", "");
  for (const n of e.gitReadiness.checks)
    t.push(`- ${n.passed ? "✓" : "✗"} **${n.label}** — ${n.message}`);
  return t.push("", "---", "*Generated by KAE — Knowledge Acquisition Engine*"), t.join(`
`);
}
async function Ui(e, t) {
  const n = k.join(e, "ImportReports");
  await x.mkdir(n, { recursive: !0 });
  const r = `import-report-${t.generatedAt.replace(/[:.]/g, "-")}.md`, i = k.join(n, r), a = Oi({ ...t });
  return await x.writeFile(i, a, "utf8"), i;
}
const Mi = /KRC-(\d{4})/i;
async function ss(e) {
  try {
    return await x.access(e), !0;
  } catch {
    return !1;
  }
}
async function rs(e) {
  const t = [];
  if (!await ss(e))
    return t;
  async function n(s) {
    const r = await x.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const a = k.join(s, i.name);
      i.isDirectory() ? await n(a) : i.name.endsWith(".md") && t.push(a);
    }
  }
  return await n(e), t;
}
function is(e, t) {
  return k.relative(e, t).replace(/\\/g, "/");
}
function os(e) {
  const t = e.match(Mi);
  return t ? t[0].toUpperCase() : null;
}
function as(e, t) {
  const n = e.replace(/\\/g, "/").split("/");
  return n[0] === t && n.length >= 2 ? n[1] ?? "" : "";
}
async function Bi(e) {
  const t = k.join(e, "Sources"), n = await rs(t), s = [];
  for (const r of n) {
    const i = is(e, r), a = k.basename(r), c = await x.stat(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: a,
      krcId: os(a),
      categoryFolder: as(i, "Sources"),
      mtimeMs: c.mtimeMs
    });
  }
  return s;
}
async function ji(e) {
  const t = k.join(e, "ExecutiveSessions"), n = await rs(t), s = [];
  for (const r of n) {
    const i = is(e, r), a = k.basename(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: a,
      krcId: os(a),
      categoryFolder: as(i, "ExecutiveSessions")
    });
  }
  return s;
}
async function zi(e) {
  const t = k.join(e, "Registries", "SOURCE_REGISTRY.md"), n = [];
  try {
    const s = await x.readFile(t, "utf8");
    for (const r of s.split(`
`)) {
      const i = r.match(/^\|\s*(KRC-\d{4})\s*\|\s*([^|]+)\s*\|/);
      i && n.push({
        krcId: i[1].toUpperCase(),
        title: i[2].trim(),
        line: r
      });
    }
  } catch {
  }
  return n;
}
async function Gi(e) {
  const t = k.join(e, "Uploads");
  return await ss(t) ? (await x.readdir(t, { withFileTypes: !0 })).filter((s) => s.isDirectory()).map((s) => `Uploads/${s.name}`) : [];
}
function ee(e, t, n, s) {
  return {
    id: Q(),
    type: e,
    message: t,
    affectedFiles: n,
    ...s
  };
}
async function Ki(e) {
  const t = [], n = await Bi(e), s = await ji(e), r = await zi(e), i = await Gi(e), a = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), o = new Map(r.map((u) => [u.krcId, u]));
  for (const u of n) {
    if (!u.krcId) {
      t.push(ee("invalid-krc-filename", `Source file has no valid KRC ID pattern: ${u.fileName}`, [u.relativePath]));
      continue;
    }
    const d = a.get(u.krcId) ?? [];
    d.push(u), a.set(u.krcId, d);
  }
  for (const u of s) {
    if (!u.krcId)
      continue;
    const d = c.get(u.krcId) ?? [];
    d.push(u), c.set(u.krcId, d);
  }
  for (const [u, d] of a)
    if (d.length > 1) {
      const p = d.map((g) => g.relativePath);
      t.push(ee("duplicate-krc-id", `Duplicate KRC ID ${u} found in ${d.length} source files`, p, {
        krcId: u,
        details: {
          canonical: p[0],
          duplicates: p.slice(1),
          mtimes: d.map((g) => g.mtimeMs)
        }
      }));
    }
  for (const u of n) {
    if (!u.krcId)
      continue;
    const d = c.get(u.krcId) ?? [];
    if (d.length === 0)
      t.push(ee("missing-executive-session", `No executive session found for ${u.krcId}`, [u.relativePath], { krcId: u.krcId }));
    else {
      const p = d[0];
      p.categoryFolder !== u.categoryFolder && t.push(ee("source-session-mismatch", `Category mismatch for ${u.krcId}: source in ${u.categoryFolder}, session in ${p.categoryFolder}`, [u.relativePath, p.relativePath], { krcId: u.krcId }));
    }
    o.has(u.krcId) || t.push(ee("missing-registry-entry", `Source ${u.krcId} is missing from SOURCE_REGISTRY.md`, [u.relativePath, "Registries/SOURCE_REGISTRY.md"], { krcId: u.krcId }));
  }
  const l = new Set(n.map((u) => u.krcId).filter(Boolean));
  for (const u of s)
    u.krcId && (l.has(u.krcId) || t.push(ee("orphan-executive-session", `Executive session exists without matching source for ${u.krcId}`, [u.relativePath], { krcId: u.krcId })));
  for (const u of r)
    l.has(u.krcId) || t.push(ee("broken-registry-reference", `Registry references ${u.krcId} but no matching source file exists`, ["Registries/SOURCE_REGISTRY.md"], { krcId: u.krcId, details: { registryTitle: u.title } }));
  return i.length === 0 && n.length > 0 && t.push(ee("upload-folder-mismatch", "No upload folders found under Uploads/ — imported assets may be missing", ["Uploads/"])), t;
}
async function Zi(e) {
  var i;
  const t = await Ki(e), n = [];
  for (const a of t)
    switch (a.type) {
      case "duplicate-krc-id": {
        const c = a.affectedFiles, o = ((i = a.details) == null ? void 0 : i.mtimes) ?? [], l = [...c].sort((d, p) => {
          const g = c.indexOf(d), I = c.indexOf(p);
          return (o[g] ?? 0) - (o[I] ?? 0);
        }), u = l[0];
        for (const d of l.slice(1))
          n.push({
            id: Q(),
            issueId: a.id,
            type: "reassign-krc-id",
            description: `Reassign duplicate ${a.krcId} in ${d}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${u}`,
            riskLevel: "medium",
            autoRepairSafe: !0,
            manualReviewRequired: !1,
            affectedFiles: [d],
            metadata: {
              oldKrcId: a.krcId,
              canonicalPath: u
            }
          });
        break;
      }
      case "missing-executive-session":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "generate-executive-session",
          description: `Generate executive session for ${a.krcId}`,
          proposedFix: "Create placeholder executive session from source metadata with repair provenance note",
          riskLevel: "low",
          autoRepairSafe: !0,
          manualReviewRequired: !1,
          affectedFiles: a.affectedFiles,
          metadata: { krcId: a.krcId }
        });
        break;
      case "missing-registry-entry":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "add-registry-entry",
          description: `Add registry entry for ${a.krcId}`,
          proposedFix: "Append row to SOURCE_REGISTRY.md from source file metadata",
          riskLevel: "low",
          autoRepairSafe: !0,
          manualReviewRequired: !1,
          affectedFiles: a.affectedFiles,
          metadata: { krcId: a.krcId }
        });
        break;
      case "source-session-mismatch":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "generate-executive-session",
          description: `Regenerate session in matching category for ${a.krcId}`,
          proposedFix: "Generate new executive session in source category folder; preserve existing session for manual review",
          riskLevel: "medium",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: a.affectedFiles,
          metadata: { krcId: a.krcId }
        });
        break;
      case "orphan-executive-session":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "flag-manual-review",
          description: `Review orphan session for ${a.krcId}`,
          proposedFix: "Manual review required — do not delete without confirmation",
          riskLevel: "high",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: a.affectedFiles
        });
        break;
      case "broken-registry-reference":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "flag-manual-review",
          description: `Review broken registry reference for ${a.krcId}`,
          proposedFix: "Manual review required — registry row references missing source",
          riskLevel: "medium",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: a.affectedFiles,
          metadata: { krcId: a.krcId }
        });
        break;
      case "invalid-krc-filename":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "move-to-review",
          description: `Review source with invalid KRC filename: ${a.affectedFiles[0]}`,
          proposedFix: "Move to Other_Review_Needed and assign new KRC ID — requires manual confirmation",
          riskLevel: "high",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: a.affectedFiles
        });
        break;
      case "upload-folder-mismatch":
        n.push({
          id: Q(),
          issueId: a.id,
          type: "flag-manual-review",
          description: "Review missing upload folders",
          proposedFix: "Informational — re-import or verify asset uploads manually",
          riskLevel: "low",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: a.affectedFiles
        });
        break;
    }
  const s = n.filter((a) => a.autoRepairSafe && !a.manualReviewRequired).length, r = n.filter((a) => a.manualReviewRequired).length;
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: e,
    issues: t,
    actions: n,
    autoRepairCount: s,
    manualReviewCount: r
  };
}
function oe(e, t) {
  var s, r;
  const n = new RegExp(`## ${t}\\s*\\n([^#\\n][^\\n]*)`, "i");
  return (r = (s = e.match(n)) == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function Dt(e, t) {
  var o, l, u;
  const s = ((l = (o = (t.split("/").pop() ?? t).match(/KRC-\d{4}/i)) == null ? void 0 : o[0]) == null ? void 0 : l.toUpperCase()) ?? "KRC-0000", r = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m), i = ((u = r == null ? void 0 : r[2]) == null ? void 0 : u.trim()) ?? oe(e, "Description") ?? "Untitled", a = t.replace(/\\/g, "/").split("/"), c = a[0] === "Sources" && a.length >= 2 ? a[1] : "Other_Review_Needed";
  return {
    krcId: s,
    title: i,
    primaryProduct: oe(e, "Primary Product") ?? "Review Needed",
    topic: oe(e, "Topic") ?? "ChatGPT conversation",
    status: oe(e, "Status") ?? "Inventoried",
    conversationId: oe(e, "ChatGPT Conversation ID"),
    createTime: oe(e, "Create Time"),
    updateTime: oe(e, "Update Time"),
    categoryFolder: c
  };
}
function Hi(e, t, n, s) {
  let r = e;
  const i = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), a = e.match(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*(.+)$`, "m"));
  return a && (r = r.replace(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*.+$`, "m"), `# ${n} — ${a[1].trim()}`)), r.includes("## Source ID") && (r = r.replace(new RegExp(`(## Source ID\\s*\\n)${i}`, "i"), `$1${n}`)), r.includes("## KAE Repair Provenance") || (r = `${r.trimEnd()}

## KAE Repair Provenance
${s}
`), r;
}
const Vi = "Generated by KAE Repository Repair because source KRC existed without matching executive session.";
function cs(e, t, n, s = Vi) {
  const r = n.title, i = n.createTime ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    e,
    "",
    "## Session Date",
    i,
    "",
    "## Classification",
    `- Primary: ${n.primaryProduct}`,
    `- Status: ${n.status}`,
    "",
    "## Session Summary",
    `Placeholder executive session generated from source record ${e}.`,
    `Topic: ${n.topic}`,
    "",
    "## Key Topics",
    `- ${n.topic}`,
    "",
    "## Action / Follow-up",
    "Review source transcript and complete capability extraction when ready.",
    "",
    "## Transcript Reference",
    t,
    "",
    "## Notes",
    s,
    `Generated on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ].join(`
`);
}
function ds(e, t) {
  return `${e}_${St(t)}_SESSION.md`;
}
function Wi(e, t) {
  return `${e}_${St(t)}.md`;
}
const qi = (e, t, n) => `Reassigned from ${e} to ${t} by KAE Repository Repair on ${n}. Canonical record retains ${e}; this duplicate was preserved with a new ID.`;
async function Yi(e, t, n, s) {
  var v;
  const r = t.affectedFiles[0];
  if (!r)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file specified",
      filesChanged: []
    };
  const i = String(((v = t.metadata) == null ? void 0 : v.oldKrcId) ?? ""), a = k.join(e, r), c = await x.readFile(a, "utf8"), o = Dt(c, r);
  n.value += 1;
  const l = Et(n.value), u = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), d = qi(i, l, u), p = Hi(c, i, l, d), g = k.join(e, "Sources", o.categoryFolder), I = Wi(l, o.title), w = k.join(g, I), T = `Sources/${o.categoryFolder}/${I}`;
  await x.mkdir(g, { recursive: !0 }), await x.writeFile(w, p, "utf8"), w !== a && await x.unlink(a);
  const R = k.join(e, "ExecutiveSessions", o.categoryFolder);
  await x.mkdir(R, { recursive: !0 });
  const C = ds(l, o.title), D = k.join(R, C), m = `ExecutiveSessions/${o.categoryFolder}/${C}`, f = cs(l, T, { ...o, title: o.title }, `Generated by KAE Repository Repair after reassigning duplicate ${i} → ${l}.`);
  return await x.writeFile(D, f, "utf8"), await Rt(e, [
    Ct(l, o.title, p, o.primaryProduct)
  ]), s("info", `Reassigned duplicate ${i} → ${l}`, {
    oldPath: r,
    newPath: T,
    sessionPath: m
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Reassigned ${i} → ${l}`,
    filesChanged: [T, m, "Registries/SOURCE_REGISTRY.md"]
  };
}
async function Xi(e, t, n) {
  var g;
  const s = t.affectedFiles.find((I) => I.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file found for session generation",
      filesChanged: []
    };
  const r = String(((g = t.metadata) == null ? void 0 : g.krcId) ?? ""), i = k.join(e, s), a = await x.readFile(i, "utf8"), c = Dt(a, s), o = k.join(e, "ExecutiveSessions", c.categoryFolder);
  await x.mkdir(o, { recursive: !0 });
  const l = ds(r || c.krcId, c.title), u = k.join(o, l), d = `ExecutiveSessions/${c.categoryFolder}/${l}`;
  if (await Qi(u))
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: `Session already exists: ${d}`,
      filesChanged: []
    };
  const p = cs(r || c.krcId, s, c);
  return await x.writeFile(u, p, "utf8"), n("info", `Generated executive session for ${r || c.krcId}`, {
    sessionPath: d,
    sourcePath: s
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Generated session for ${r || c.krcId}`,
    filesChanged: [d]
  };
}
async function Ji(e, t, n) {
  const s = t.affectedFiles.find((c) => c.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file for registry entry",
      filesChanged: []
    };
  const r = k.join(e, s), i = await x.readFile(r, "utf8"), a = Dt(i, s);
  return await Rt(e, [
    Ct(a.krcId, a.title, i, a.primaryProduct)
  ]), n("info", `Added registry entry for ${a.krcId}`, { sourcePath: s }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Added registry entry for ${a.krcId}`,
    filesChanged: ["Registries/SOURCE_REGISTRY.md"]
  };
}
async function Qi(e) {
  try {
    return await x.access(e), !0;
  } catch {
    return !1;
  }
}
async function eo(e, t = {}) {
  const n = t.log ?? (() => {
  }), s = t.sessionId ?? `repair-${crypto.randomUUID()}`, r = e.repositoryPath, i = await le(r);
  n("info", "Pre-repair health check complete", {
    duplicateIds: i.duplicateIds,
    issueCount: i.issues.length
  });
  const a = await zn(r, s);
  n("info", `Pre-repair snapshot created: ${a}`, { snapshotPath: a });
  const c = e.actions.filter((I) => I.autoRepairSafe && !I.manualReviewRequired), o = e.actions.length - c.length, u = { value: await wt(r) }, d = [], p = [];
  for (const I of c)
    try {
      let w;
      switch (I.type) {
        case "reassign-krc-id":
          w = await Yi(r, I, u, n);
          break;
        case "generate-executive-session":
          w = await Xi(r, I, n);
          break;
        case "add-registry-entry":
          w = await Ji(r, I, n);
          break;
        default:
          w = {
            actionId: I.id,
            type: I.type,
            success: !1,
            message: `Unsupported auto-repair action: ${I.type}`,
            filesChanged: []
          };
      }
      d.push(w), w.success && p.push(...w.filesChanged);
    } catch (w) {
      const T = w instanceof Error ? w.message : String(w);
      n("error", `Repair action failed: ${I.description} — ${T}`, {
        actionId: I.id,
        type: I.type
      }), d.push({
        actionId: I.id,
        type: I.type,
        success: !1,
        message: T,
        filesChanged: []
      });
    }
  const g = await le(r);
  return n("info", "Post-repair health check complete", {
    duplicateIds: g.duplicateIds,
    issueCount: g.issues.length,
    ready: g.ready
  }), {
    completedAt: (/* @__PURE__ */ new Date()).toISOString(),
    snapshotPath: a,
    actionsExecuted: d,
    actionsSkipped: o,
    filesChanged: [...new Set(p)],
    healthBefore: i,
    healthAfter: g
  };
}
function to(e, t) {
  const n = `${e} ${t ?? ""}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)/.test(n) || n.includes("screenshot") ? "image" : /\.(mp4|webm|mov|m4v|avi)/.test(n) || n.includes("video") ? "video" : "other";
}
function dn(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function te(e, t, n, s) {
  return { id: e, title: t, items: n, emptyMessage: s };
}
function ne(e, t, n) {
  return { label: e, explorerPath: t, ...n };
}
function no(e) {
  var t, n, s;
  return e.kind === "executive_session" ? {
    krcId: ((t = e.session) == null ? void 0 : t.linkedKrcId) ?? e.repository.krcId,
    sourcePath: ((n = e.session) == null ? void 0 : n.transcriptReference) ?? ((s = e.session) == null ? void 0 : s.summaryReferences.find((r) => r.startsWith("Sources/"))) ?? e.repository.repositoryPath
  } : {
    krcId: e.repository.krcId,
    sourcePath: e.repository.repositoryPath
  };
}
function so(e, t) {
  return e.records.filter((n) => n.repository.krcId === t);
}
function ro(e, t) {
  return e.records.find((n) => n.id === t);
}
function io(e, t) {
  return e.find((n) => n.kind === "source" && n.id === `${t}:source`);
}
function oo(e, t) {
  return e.find((n) => n.kind === "conversation" && n.id === `${t}:conversation`);
}
function ao(e, t) {
  if (t)
    return e.records.find((n) => {
      var s;
      return n.kind === "executive_session" && (((s = n.session) == null ? void 0 : s.linkedKrcId) === t || n.repository.krcId === t);
    });
}
function co(e, t) {
  if (!t || !e.message)
    return !1;
  const n = t.toLowerCase();
  return e.message.text.toLowerCase().includes(n) || he(t).some((s) => e.message.text.toLowerCase().includes(s));
}
function lo(e, t) {
  if (!t || !e.attachment)
    return !1;
  const n = t.toLowerCase(), s = e.attachment.filename.toLowerCase();
  return s.includes(n) || he(t).some((r) => s.includes(r));
}
function uo(e, t, n, s, r) {
  const i = [];
  return i.push(`Evidence anchor: ${e.kind.replace(/_/g, " ")}`), t && i.push(`KRC ${t}`), n && i.push(`"${n}"`), s && i.push(`matched query "${s}"`), r != null && r.excerpt ? i.push(`Session summary: ${r.excerpt}`) : e.excerpt && i.push(e.excerpt), i.join(" · ");
}
function fo(e, t, n, s, r = 5) {
  var c;
  const i = /* @__PURE__ */ new Set([
    ..._e(n),
    ...s ? he(s) : []
  ]);
  if (i.size === 0)
    return [];
  const a = [];
  for (const o of e.records) {
    if (o.kind !== "source" || o.repository.krcId === t)
      continue;
    const l = ((c = o.conversation) == null ? void 0 : c.title) ?? "";
    let d = _e(l).filter((p) => i.has(p)).length;
    s && l.toLowerCase().includes(s.toLowerCase()) && (d += 3), d > 0 && a.push({ record: o, score: d });
  }
  return a.sort((o, l) => {
    var u, d;
    return l.score - o.score || (((u = l.record.conversation) == null ? void 0 : u.title) ?? "").localeCompare(((d = o.record.conversation) == null ? void 0 : d.title) ?? "");
  }).slice(0, r).map((o) => o.record);
}
function po(e) {
  var n, s, r, i;
  let t = null;
  for (const a of e) {
    if (a.kind === "message" && a.message) {
      const c = a.message.timestamp ?? ((n = a.conversation) == null ? void 0 : n.updated) ?? "", o = dn(c);
      (!t || o >= t.ms) && (t = { record: a, timestamp: c, ms: o });
    }
    if (a.kind === "attachment" && ((s = a.attachment) != null && s.resolved)) {
      const c = ((r = a.conversation) == null ? void 0 : r.updated) ?? ((i = a.conversation) == null ? void 0 : i.created) ?? "", o = dn(c);
      (!t || o >= t.ms) && (t = { record: a, timestamp: c, ms: o });
    }
  }
  return t ? { record: t.record, timestamp: t.timestamp } : null;
}
function ls(e, t, n) {
  var E, S, _, A, N, L, b, U, z, G, B, V, Y, ue, fe, ye, Ie, Le, ve, $e;
  const s = ro(e, t);
  if (!s)
    return null;
  const { krcId: r, sourcePath: i } = no(s), a = r ? so(e, r) : [s], c = (r ? io(a, r) : void 0) ?? e.records.find(($) => $.kind === "source" && $.repository.repositoryPath === i) ?? (s.kind === "source" ? s : void 0), o = r ? oo(a, r) : void 0, l = o ?? c, u = ao(e, r), d = ((E = o == null ? void 0 : o.conversation) == null ? void 0 : E.title) ?? ((S = l == null ? void 0 : l.conversation) == null ? void 0 : S.title) ?? ((_ = s.conversation) == null ? void 0 : _.title) ?? ((A = c == null ? void 0 : c.conversation) == null ? void 0 : A.title) ?? "Untitled", p = a.filter(($) => $.kind === "message").sort(($, K) => {
    var we, Ee;
    const q = Number(((we = $.message) == null ? void 0 : we.messageId.split(":msg:")[1]) ?? 0), $t = Number(((Ee = K.message) == null ? void 0 : Ee.messageId.split(":msg:")[1]) ?? 0);
    return q - $t;
  }), g = a.filter(($) => $.kind === "attachment"), I = fo(e, r, d, n), w = po(a), T = uo(s, r, d, n, u), R = te("sourceFile", "Source File", [
    ne((c == null ? void 0 : c.repository.repositoryPath.split("/").pop()) ?? i, i, {
      recordId: c == null ? void 0 : c.id,
      kind: "source",
      subtitle: r,
      highlighted: s.kind === "source"
    })
  ]), C = te("conversation", "Conversation", l ? [
    ne(d, i, {
      recordId: (o == null ? void 0 : o.id) ?? (c == null ? void 0 : c.id),
      kind: (o == null ? void 0 : o.kind) ?? "conversation",
      subtitle: [
        (N = l.conversation) == null ? void 0 : N.conversationId,
        (L = l.conversation) != null && L.created ? `Created ${l.conversation.created}` : void 0,
        (b = l.conversation) != null && b.updated ? `Updated ${l.conversation.updated}` : void 0
      ].filter(Boolean).join(" · "),
      highlighted: s.kind === "conversation"
    })
  ] : [], "No conversation metadata indexed."), D = te("messages", "Messages", p.map(($) => {
    var K, q;
    return ne(`${((K = $.message) == null ? void 0 : K.role) ?? "Message"}: ${$.excerpt}`, i, {
      recordId: $.id,
      kind: "message",
      subtitle: (q = $.message) == null ? void 0 : q.timestamp,
      highlighted: $.id === s.id || co($, n)
    });
  }), "No messages indexed."), m = te("attachments", "Attachments", g.map(($) => {
    var we, Ee, bt;
    const K = ((we = $.attachment) == null ? void 0 : we.filename) ?? "Attachment", q = to(K, (Ee = $.attachment) == null ? void 0 : Ee.assetPath);
    return ne(`${q === "image" ? "Screenshot" : q === "video" ? "Video" : "File"}: ${K}`, i, {
      recordId: $.id,
      kind: "attachment",
      subtitle: (bt = $.attachment) != null && bt.resolved ? $.attachment.assetPath : "Unresolved reference",
      highlighted: $.id === s.id || lo($, n)
    });
  }), "No attachments indexed."), f = te("executiveSession", "Executive Session", u ? [
    ne(((U = u.conversation) == null ? void 0 : U.title) ?? ((z = u.session) == null ? void 0 : z.sessionId) ?? "Session", u.repository.repositoryPath, {
      recordId: u.id,
      kind: "executive_session",
      subtitle: (G = u.session) == null ? void 0 : G.linkedKrcId,
      highlighted: s.kind === "executive_session"
    })
  ] : [], "No executive session indexed for this KRC."), v = te("relatedSources", "Related Sources", I.map(($) => {
    var K;
    return ne(((K = $.conversation) == null ? void 0 : K.title) ?? $.repository.krcId ?? $.repository.repositoryPath, $.repository.repositoryPath, {
      recordId: $.id,
      kind: "source",
      subtitle: $.repository.krcId
    });
  }), "No related sources found."), h = [];
  if (h.push({
    kind: "conversation",
    label: d,
    subtitle: r,
    timestamp: ((B = o == null ? void 0 : o.conversation) == null ? void 0 : B.updated) ?? ((V = o == null ? void 0 : o.conversation) == null ? void 0 : V.created),
    explorerPath: i,
    recordId: o == null ? void 0 : o.id
  }), u && h.push({
    kind: "executive_session",
    label: ((Y = u.conversation) == null ? void 0 : Y.title) ?? "Executive Session",
    subtitle: (ue = u.session) == null ? void 0 : ue.linkedKrcId,
    timestamp: (fe = u.conversation) == null ? void 0 : fe.created,
    explorerPath: u.repository.repositoryPath,
    recordId: u.id
  }), h.push({
    kind: "related_sources",
    label: I.length > 0 ? `${I.length} related source${I.length === 1 ? "" : "s"}` : "No related sources",
    subtitle: I.slice(0, 3).map(($) => $.repository.krcId).filter(Boolean).join(", "),
    explorerPath: ((ye = I[0]) == null ? void 0 : ye.repository.repositoryPath) ?? i,
    recordId: (Ie = I[0]) == null ? void 0 : Ie.id
  }), w) {
    const $ = w.record.kind === "message" ? `${(Le = w.record.message) == null ? void 0 : Le.role}: ${w.record.excerpt}` : ((ve = w.record.attachment) == null ? void 0 : ve.filename) ?? w.record.excerpt;
    h.push({
      kind: "newest_evidence",
      label: $,
      timestamp: w.timestamp || void 0,
      explorerPath: i,
      recordId: w.record.id
    });
  } else
    h.push({
      kind: "newest_evidence",
      label: s.excerpt || d,
      timestamp: ($e = o == null ? void 0 : o.conversation) == null ? void 0 : $e.updated,
      explorerPath: i,
      recordId: s.id
    });
  const y = te("timeline", "Timeline", h.map(($) => ne($.label, $.explorerPath, {
    recordId: $.recordId,
    subtitle: [$.subtitle, $.timestamp].filter(Boolean).join(" · ")
  })));
  return {
    anchorRecordId: t,
    anchorKrcId: r,
    anchorSourcePath: i,
    query: n,
    decisionSummary: T,
    sections: {
      decisionSummary: te("decisionSummary", "Decision Summary", [
        ne(T, i, { highlighted: !0 })
      ]),
      sourceFile: R,
      conversation: C,
      messages: D,
      attachments: m,
      executiveSession: f,
      relatedSources: v,
      timeline: y
    },
    timeline: h
  };
}
async function mo(e, t, n) {
  const s = await ge(e);
  return ls(s, t, n);
}
function Te(e) {
  return e.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function ho(e, t, n) {
  return `${Te(e)}::${t}::${Te(n)}`;
}
function X(e, t, n) {
  const s = ho(n.fromId, n.relationshipType, n.toId);
  t.has(s) || (t.add(s), e.push({ ...n, relationshipId: s, createdAutomatically: !0 }));
}
function go(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e.records) {
    const s = n.repository.krcId;
    if (!s)
      continue;
    const r = t.get(s) ?? [];
    r.push(n), t.set(s, r);
  }
  return t;
}
function ln(e) {
  return e.find((t) => t.kind === "conversation") ?? e.find((t) => t.kind === "source");
}
function yo(e) {
  var n, s;
  const t = [(n = e.conversation) == null ? void 0 : n.title, e.excerpt, (s = e.message) == null ? void 0 : s.text].filter(Boolean).join(" ");
  return new Set(_e(t));
}
function Io(e, t) {
  return [...e].filter((n) => t.has(n));
}
function vo(e) {
  const t = e.match(/Campaign\s+[\d.]+[a-z]?/gi) ?? [];
  return [...new Set(t.map((n) => n.trim()))];
}
function Oe(e, t, n, s) {
  const r = new Map(e.map((l) => [l.id, l])), i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
  for (const l of e) {
    const u = yo(l);
    a.set(l.id, u);
    for (const d of u) {
      if (d.length < 4)
        continue;
      const p = i.get(d) ?? [];
      p.push(l.id), i.set(d, p);
    }
  }
  const c = /* @__PURE__ */ new Map(), o = s.maxBucketSize ?? 20;
  for (const l of i.values())
    if (!(l.length < 2 || l.length > o))
      for (let u = 0; u < l.length; u++)
        for (let d = u + 1; d < l.length; d++) {
          const p = l[u] < l[d] ? `${l[u]}|${l[d]}` : `${l[d]}|${l[u]}`;
          c.set(p, (c.get(p) ?? 0) + 1);
        }
  for (const [l, u] of c) {
    if (u < s.minShared)
      continue;
    const [d, p] = l.split("|"), g = r.get(d), I = r.get(p);
    if (!g || !I || s.skipSameKrc && g.repository.krcId === I.repository.krcId)
      continue;
    const w = Io(a.get(d) ?? /* @__PURE__ */ new Set(), a.get(p) ?? /* @__PURE__ */ new Set());
    X(t, n, {
      fromId: g.id,
      toId: I.id,
      relationshipType: s.relationshipType,
      reason: `${s.reasonPrefix}: ${w.slice(0, 4).join(", ")}`,
      confidence: Math.min(s.maxConfidence, 35 + u * 10),
      supportingEvidenceIds: [g.id, I.id]
    });
  }
}
function wo(e) {
  var t;
  return (t = e.session) != null && t.summaryReferences ? e.session.summaryReferences.filter((n) => n.length > 2 && !n.startsWith("Sources/")).slice(0, 8) : [];
}
function Eo(e) {
  var p, g, I, w, T, R, C, D, m;
  const t = [], n = /* @__PURE__ */ new Set(), s = go(e), r = /* @__PURE__ */ new Map();
  for (const f of e.records)
    f.kind === "executive_session" && ((p = f.session) != null && p.linkedKrcId) && r.set(f.session.linkedKrcId, f);
  for (const [f, v] of s.entries()) {
    const h = ln(v), y = v.find((_) => _.kind === "source"), E = v.filter((_) => _.kind === "attachment");
    h && y && X(t, n, {
      fromId: h.id,
      toId: y.id,
      relationshipType: "conversation_source",
      reason: `Shared KRC ${f}`,
      confidence: 98,
      supportingEvidenceIds: [h.id, y.id]
    });
    const S = r.get(f);
    h && S && (X(t, n, {
      fromId: h.id,
      toId: S.id,
      relationshipType: "conversation_executive_session",
      reason: `Executive session linked to ${f}`,
      confidence: 95,
      supportingEvidenceIds: [h.id, S.id]
    }), y && X(t, n, {
      fromId: S.id,
      toId: y.id,
      relationshipType: "executive_session_source",
      reason: `Transcript reference for ${f}`,
      confidence: 96,
      supportingEvidenceIds: [S.id, y.id]
    }));
    for (const _ of E)
      h && (X(t, n, {
        fromId: _.id,
        toId: h.id,
        relationshipType: "attachment_conversation",
        reason: `Attachment linked to conversation ${f}`,
        confidence: (g = _.attachment) != null && g.resolved ? 90 : 70,
        supportingEvidenceIds: [_.id, h.id]
      }), X(t, n, {
        fromId: h.id,
        toId: _.id,
        relationshipType: "conversation_attachment",
        reason: `Conversation references attachment in ${f}`,
        confidence: (I = _.attachment) != null && I.resolved ? 88 : 68,
        supportingEvidenceIds: [h.id, _.id]
      })), y && X(t, n, {
        fromId: _.id,
        toId: y.id,
        relationshipType: "attachment_source",
        reason: `Attachment referenced by source ${f}`,
        confidence: (w = _.attachment) != null && w.resolved ? 92 : 72,
        supportingEvidenceIds: [_.id, y.id]
      });
  }
  const i = [];
  for (const [, f] of s.entries()) {
    const v = ln(f);
    v && i.push(v);
  }
  Oe(i, t, n, {
    relationshipType: "conversation_conversation",
    reasonPrefix: "Shared title concepts",
    minShared: 2,
    maxConfidence: 85,
    skipSameKrc: !1
  });
  const a = e.records.filter((f) => f.kind === "executive_session");
  Oe(a, t, n, {
    relationshipType: "executive_session_executive_session",
    reasonPrefix: "Shared session topics",
    minShared: 2,
    maxConfidence: 80,
    skipSameKrc: !1
  });
  const c = e.records.filter((f) => {
    var h;
    if (f.kind === "executive_session")
      return !0;
    const v = `${f.excerpt} ${((h = f.message) == null ? void 0 : h.text) ?? ""}`.toLowerCase();
    return /\b(decision|decided|agreed|conclusion)\b/.test(v);
  });
  Oe(c, t, n, {
    relationshipType: "decision_decision",
    reasonPrefix: "Shared decision language",
    minShared: 2,
    maxConfidence: 78,
    skipSameKrc: !0,
    maxBucketSize: 25
  }), Oe(i, t, n, {
    relationshipType: "topic_topic",
    reasonPrefix: "Shared topic",
    minShared: 1,
    maxConfidence: 65,
    skipSameKrc: !1,
    maxBucketSize: 12
  });
  const o = /* @__PURE__ */ new Map();
  for (const f of e.records) {
    const v = [f.excerpt, (T = f.message) == null ? void 0 : T.text, (R = f.conversation) == null ? void 0 : R.title].filter(Boolean).join(" ");
    for (const h of vo(v)) {
      const y = Te(h), E = o.get(y) ?? [];
      E.push(f), o.set(y, E);
    }
  }
  for (const [f, v] of o.entries()) {
    const h = [...new Map(v.map((y) => [y.id, y])).values()];
    if (!(h.length < 2 || h.length > 30))
      for (let y = 0; y < h.length; y++)
        for (let E = y + 1; E < h.length; E++)
          X(t, n, {
            fromId: h[y].id,
            toId: h[E].id,
            relationshipType: "campaign_campaign",
            reason: `Shared campaign reference (${f.replace(/-/g, " ")})`,
            confidence: 82,
            supportingEvidenceIds: [h[y].id, h[E].id]
          });
  }
  const l = /* @__PURE__ */ new Map();
  for (const f of a)
    for (const v of wo(f)) {
      const h = Te(v), y = l.get(h) ?? [];
      y.push(f), l.set(h, y);
    }
  for (const [, f] of l.entries())
    if (!(f.length < 2))
      for (let v = 0; v < f.length; v++)
        for (let h = v + 1; h < f.length; h++)
          X(t, n, {
            fromId: f[v].id,
            toId: f[h].id,
            relationshipType: "capability_capability",
            reason: `Shared capability "${((C = f[v].conversation) == null ? void 0 : C.title) ?? "capability"}"`,
            confidence: 72,
            supportingEvidenceIds: [f[v].id, f[h].id]
          });
  const u = e.records.filter((f) => f.kind === "attachment"), d = /* @__PURE__ */ new Map();
  for (const f of u) {
    const v = Te(((D = f.attachment) == null ? void 0 : D.filename) ?? f.excerpt), h = d.get(v) ?? [];
    h.push(f), d.set(v, h);
  }
  for (const [, f] of d.entries())
    if (!(f.length < 2))
      for (let v = 0; v < f.length; v++)
        for (let h = v + 1; h < f.length; h++)
          f[v].repository.krcId !== f[h].repository.krcId && X(t, n, {
            fromId: f[v].id,
            toId: f[h].id,
            relationshipType: "attachment_conversation",
            reason: `Shared attachment filename "${((m = f[v].attachment) == null ? void 0 : m.filename) ?? "file"}"`,
            confidence: 74,
            supportingEvidenceIds: [f[v].id, f[h].id]
          });
  return t;
}
const So = "relationship-index.json", Ro = 1;
function He(e) {
  return k.join(e, me, So);
}
async function us(e) {
  try {
    const t = await x.readFile(He(e), "utf8"), n = JSON.parse(t);
    return n.version !== Ro || !Array.isArray(n.relationships) ? null : n;
  } catch {
    return null;
  }
}
async function Co(e, t) {
  const n = k.join(e, me);
  await x.mkdir(n, { recursive: !0 });
  const s = He(e);
  return await x.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
function ko(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function To(e, t) {
  return {
    recordId: e.id,
    label: ko(e),
    excerpt: e.excerpt,
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind,
    relationshipType: t.relationshipType,
    reason: t.reason,
    confidence: t.confidence
  };
}
function _o(e, t) {
  return e.records.find((n) => n.id === t) ?? e.records.find((n) => n.repository.krcId === t) ?? e.records.find((n) => n.id.startsWith(`${t}:`));
}
async function ft(e) {
  const t = await ge(e), n = Eo(t), s = (/* @__PURE__ */ new Date()).toISOString(), r = {
    version: 1,
    repositoryPath: e,
    builtAt: s,
    relationshipCount: n.length,
    relationships: n
  };
  return await Co(e, r), r;
}
async function xe(e) {
  const t = await us(e);
  return t && t.repositoryPath === e ? t : ft(e);
}
function Do(e) {
  const t = {};
  for (const n of e.relationships)
    t[n.relationshipType] = (t[n.relationshipType] ?? 0) + 1;
  return {
    builtAt: e.builtAt,
    relationshipCount: e.relationshipCount,
    byType: t
  };
}
function pt(e, t, n = 50) {
  const s = he(t), r = t.toLowerCase(), i = [];
  for (const a of e.relationships) {
    const c = `${a.fromId} ${a.toId} ${a.relationshipType} ${a.reason}`.toLowerCase();
    let o = 0;
    c.includes(r) && (o += 20), o += s.filter((l) => c.includes(l)).length * 8, o > 0 && i.push({ rel: a, score: o });
  }
  return i.sort((a, c) => c.score - a.score || c.rel.confidence - a.rel.confidence).slice(0, n).map((a) => a.rel);
}
function fs(e, t) {
  const n = t.toLowerCase();
  return e.relationships.filter((s) => {
    if (s.fromId === t || s.toId === t || s.supportingEvidenceIds.includes(t))
      return !0;
    if (n.startsWith("krc-")) {
      const r = (i) => i.toLowerCase().startsWith(n);
      if (r(s.fromId) || r(s.toId) || s.supportingEvidenceIds.some(r))
        return !0;
    }
    return s.reason.toLowerCase().includes(n);
  });
}
async function ps(e, t, n, s = 20) {
  const [r, i] = await Promise.all([
    ge(e),
    xe(e)
  ]);
  let a = fs(i, t);
  a.length === 0 && n && (a = pt(i, n, s * 3)), a.length === 0 && (a = pt(i, t, s * 3));
  const c = [], o = /* @__PURE__ */ new Set();
  for (const l of a.sort((u, d) => d.confidence - u.confidence)) {
    const u = l.fromId === t || l.supportingEvidenceIds[0] === t ? l.toId : l.fromId, d = _o(r, u);
    if (!(!d || o.has(d.id)) && (o.add(d.id), c.push(To(d, l)), c.length >= s))
      break;
  }
  return c;
}
function xo(e) {
  const t = [], n = [], s = [], r = [], i = [];
  for (const a of e)
    a.relationshipType === "decision_decision" && t.push(a), (a.relationshipType === "conversation_conversation" || a.relationshipType === "conversation_source" || a.kind === "conversation" || a.kind === "source") && n.push(a), a.relationshipType === "campaign_campaign" && s.push(a), (a.relationshipType === "attachment_source" || a.relationshipType === "attachment_conversation" || a.relationshipType === "conversation_attachment" || a.kind === "attachment") && r.push(a), (a.relationshipType === "conversation_executive_session" || a.relationshipType === "executive_session_executive_session" || a.relationshipType === "executive_session_source" || a.kind === "executive_session") && i.push(a);
  return {
    relatedDecisions: t,
    relatedConversations: n,
    relatedCampaigns: s,
    relatedAttachments: r,
    relatedExecutiveSessions: i
  };
}
async function No(e, t) {
  await xe(e);
  const n = [
    ...t.evidenceUsed.map((u) => u.recordId),
    ...t.explorerLinks.map((u) => u.krcId).filter(Boolean)
  ], s = [...new Set(n)].slice(0, 5), r = [];
  for (const u of s) {
    const d = await ps(e, u, t.searchQuery, 12);
    r.push(...d);
  }
  const i = /* @__PURE__ */ new Map();
  for (const u of r) {
    const d = i.get(u.recordId);
    (!d || u.confidence > d.confidence) && i.set(u.recordId, u);
  }
  const a = xo([...i.values()]), c = {
    relatedDecisions: a.relatedDecisions.slice(0, 6),
    relatedConversations: a.relatedConversations.slice(0, 6),
    relatedCampaigns: a.relatedCampaigns.slice(0, 6),
    relatedAttachments: a.relatedAttachments.slice(0, 6),
    relatedExecutiveSessions: a.relatedExecutiveSessions.slice(0, 6)
  }, o = [...t.relatedSources], l = new Set(o.map((u) => u.recordId));
  for (const u of a.relatedConversations.slice(0, 4))
    l.has(u.recordId) || (l.add(u.recordId), o.push({
      recordId: u.recordId,
      label: u.label,
      excerpt: u.excerpt,
      explorerPath: u.explorerPath,
      krcId: u.krcId,
      kind: u.kind
    }));
  return {
    ...t,
    relatedSources: o,
    relationshipInsights: c
  };
}
const Lo = [
  /\bwhat did we decide\b/i,
  /\bwhat was decided\b/i,
  /\bour decision\b/i,
  /\bdecide about\b/i
], $o = [/\bsummarize\b/i, /\bsummary of\b/i, /\bgive me an overview\b/i], bo = [
  /\bshow evidence\b/i,
  /\bprove that\b/i,
  /\bevidence that\b/i,
  /\bdemonstrate\b/i
], Ao = [
  /\bblockers?\b/i,
  /\bunresolved\b/i,
  /\bremaining\b/i,
  /\bissues?\b/i,
  /\brisks?\b/i,
  /\btodo\b/i,
  /\bopen problems?\b/i
], Fo = [
  /^what did we decide about\s+/i,
  /^what happened with\s+/i,
  /^what are the\s+/i,
  /^what is the\s+/i,
  /^summarize\s+/i,
  /^show evidence that\s+/i,
  /^show me evidence (?:that|for)\s+/i,
  /^tell me about\s+/i,
  /^how did\s+/i,
  /^why did\s+/i,
  /\?+$/g
];
function Po(e) {
  const t = e.trim();
  return Lo.some((n) => n.test(t)) ? "decision" : $o.some((n) => n.test(t)) ? "summarize" : bo.some((n) => n.test(t)) ? "show_evidence" : Ao.some((n) => n.test(t)) ? "blockers" : "general";
}
function Oo(e) {
  let t = e.trim();
  for (const n of Fo)
    t = t.replace(n, "");
  return t = t.replace(/\b(in kae|for kae)\b/gi, "").trim(), t || e.trim();
}
const Uo = ["decided", "decision", "agreed", "conclusion", "resolved", "plan"], Mo = [
  "blocker",
  "unresolved",
  "remaining",
  "issue",
  "risk",
  "todo",
  "pending",
  "failed",
  "missing"
];
function ms(e) {
  const t = e.toLowerCase();
  return Mo.some((n) => t.includes(n));
}
function xt(e) {
  const t = e.toLowerCase();
  return Uo.some((n) => t.includes(n));
}
function Bo(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function un(e) {
  var r, i, a;
  const t = ((r = e.message) == null ? void 0 : r.timestamp) ?? ((i = e.conversation) == null ? void 0 : i.updated) ?? ((a = e.conversation) == null ? void 0 : a.created) ?? "", n = Bo(t);
  if (!n)
    return 0;
  const s = (Date.now() - n) / (1e3 * 60 * 60 * 24);
  return s < 30 ? 15 : s < 180 ? 8 : 0;
}
function jo(e, t, n) {
  var a, c, o, l, u, d;
  const s = [];
  let r = 0;
  const i = [
    e.excerpt,
    (a = e.message) == null ? void 0 : a.text,
    (c = e.conversation) == null ? void 0 : c.title,
    (l = (o = e.session) == null ? void 0 : o.summaryReferences) == null ? void 0 : l.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
  if (t === "decision" && (e.kind === "executive_session" && (r += 45, s.push("executive session")), e.kind === "message" && ((u = e.message) != null && u.role.toLowerCase().includes("assistant")) && (r += 20, s.push("assistant response")), xt(i) && (r += 25, s.push("decision language")), r += un(e), un(e) > 0 && s.push("recent evidence")), t === "summarize" && ((e.kind === "conversation" || e.kind === "source") && (r += 30, s.push("conversation source")), e.kind === "executive_session" && (r += 25, s.push("session summary"))), t === "show_evidence") {
    if (e.kind === "attachment") {
      r += 50, s.push("attachment evidence");
      const p = ((d = e.attachment) == null ? void 0 : d.filename.toLowerCase()) ?? "";
      (p.includes("video") || /\.(mp4|webm|mov)/.test(p)) && (r += 30, s.push("video attachment")), (p.includes("screenshot") || /\.(png|jpe?g)/.test(p)) && (r += 20, s.push("image attachment"));
    }
    e.kind === "source" && (r += 25, s.push("source file")), e.kind === "message" && (r += 15, s.push("message evidence"));
  }
  return t === "blockers" && (ms(i) && (r += 50, s.push("blocker language")), (e.kind === "executive_session" || e.kind === "message") && (r += 15, s.push("narrative evidence"))), n.length > 1 && n.every((p) => i.includes(p)) && (r += 20, s.push("all query terms matched")), { boost: r, reasons: s };
}
function zo(e, t, n) {
  var s, r, i;
  return {
    recordId: e.recordId,
    kind: e.kind,
    score: e.score,
    title: e.title,
    excerpt: e.snippet,
    explorerPath: e.drilldownPath,
    krcId: e.krcId,
    conversationTitle: e.conversationTitle,
    messageRole: e.messageRole,
    matchReasons: [...e.matchFields, ...n],
    timestamp: ((s = t.message) == null ? void 0 : s.timestamp) ?? ((r = t.conversation) == null ? void 0 : r.updated) ?? ((i = t.conversation) == null ? void 0 : i.created)
  };
}
function Go(e, t, n = 30) {
  var d;
  const s = Po(t), r = Oo(t), i = he(r), a = Jn(e, r, 80), c = new Map(e.records.map((p) => [p.id, p])), o = [];
  for (const p of a) {
    const g = c.get(p.recordId);
    if (!g)
      continue;
    const { boost: I, reasons: w } = jo(g, s, i);
    o.push({
      ...zo(p, g, w),
      score: p.score + I
    });
  }
  o.sort((p, g) => g.score - p.score);
  const l = [], u = /* @__PURE__ */ new Set();
  for (const p of o)
    if (!u.has(p.recordId) && (u.add(p.recordId), l.push(p), l.length >= n))
      break;
  if (s === "show_evidence") {
    const p = /video|mp4|webm|mov/i.test(r), g = l.some((I) => I.kind === "attachment");
    if (p && !g)
      for (const I of e.records) {
        if (I.kind !== "attachment" || !I.attachment)
          continue;
        const w = I.attachment.filename.toLowerCase();
        if (!(!w.includes("video") && !/\.(mp4|webm|mov|m4v)/.test(w)) && !u.has(I.id) && (u.add(I.id), l.push({
          recordId: I.id,
          kind: "attachment",
          score: 60,
          title: I.attachment.filename,
          excerpt: I.excerpt,
          explorerPath: I.repository.repositoryPath,
          krcId: I.repository.krcId,
          conversationTitle: (d = I.conversation) == null ? void 0 : d.title,
          matchReasons: ["video attachment scan"]
        }), l.filter((T) => T.kind === "attachment").length >= 5))
          break;
      }
  }
  return { intent: s, searchQuery: r, queryTerms: i, items: l };
}
function Ko(e, t, n, s = 3) {
  const r = /* @__PURE__ */ new Set(), i = [];
  for (const a of t) {
    if (!a.krcId || r.has(a.krcId))
      continue;
    r.add(a.krcId);
    const c = t.find((l) => l.krcId === a.krcId);
    if (!c)
      continue;
    const o = ls(e, c.recordId, n);
    if (o && i.push(o), i.length >= s)
      break;
  }
  return i;
}
function Zo(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    !s.krcId || n.has(s.krcId) || (n.add(s.krcId), t.push(s.krcId));
  return t;
}
function Ho(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    for (const r of s.timeline) {
      const i = `${r.kind}:${r.explorerPath}:${r.label}`;
      n.has(i) || (n.add(i), t.push(r));
    }
  return t.slice(0, 8);
}
function Vo(e) {
  const t = [];
  for (const n of e)
    for (const s of n.sections.relatedSources.items)
      t.push({
        recordId: s.recordId ?? s.explorerPath,
        kind: s.kind ?? "source",
        score: 0,
        title: s.label,
        excerpt: s.subtitle ?? s.label,
        explorerPath: s.explorerPath,
        krcId: s.subtitle,
        matchReasons: ["related source"]
      });
  return t;
}
function Wo(e, t) {
  const { intent: n, searchQuery: s, queryTerms: r, items: i } = Go(e, t), a = Ko(e, i, s).filter((d) => d !== null), c = i.filter((d) => d.kind === "executive_session");
  let o = i.filter((d) => d.kind === "attachment");
  const l = i.filter((d) => d.kind === "message");
  if (n === "show_evidence" && o.length === 0)
    for (const d of a)
      for (const p of d.sections.attachments.items)
        o.push({
          recordId: p.recordId ?? p.explorerPath,
          kind: "attachment",
          score: 0,
          title: p.label,
          excerpt: p.subtitle ?? p.label,
          explorerPath: p.explorerPath,
          krcId: d.anchorKrcId,
          matchReasons: ["drilldown attachment"]
        });
  const u = Vo(a);
  return {
    question: t,
    intent: n,
    searchQuery: s,
    queryTerms: r,
    items: i,
    topKrcIds: Zo(i),
    executiveSessions: c,
    attachments: o,
    messages: l,
    relatedSources: u,
    timeline: Ho(a)
  };
}
function qo(e) {
  return {
    recordId: e.recordId,
    label: e.title,
    excerpt: e.excerpt,
    explorerPath: e.explorerPath,
    krcId: e.krcId,
    kind: e.kind
  };
}
function ct(e, t) {
  const n = [], s = /* @__PURE__ */ new Set();
  for (const r of e)
    if (!s.has(r.recordId) && (s.add(r.recordId), n.push(qo(r)), n.length >= t))
      break;
  return n;
}
function Yo(e) {
  const t = e.items[0];
  if (!t || e.items.length === 0)
    return {
      level: "insufficient",
      score: 0,
      rationale: "No matching evidence was found in the repository index."
    };
  let n = Math.min(100, Math.round(t.score));
  const s = [`Top hit score ${t.score}`];
  e.executiveSessions.length > 0 && (n += 15, s.push(`${e.executiveSessions.length} executive session(s)`));
  const r = e.topKrcIds.length;
  r > 1 && (n += Math.min(15, r * 5), s.push(`${r} corroborating KRC sources`)), e.queryTerms.length > 1 && e.items.some((c) => e.queryTerms.every((o) => c.excerpt.toLowerCase().includes(o))) && (n += 10, s.push("all query terms present in evidence")), e.items.length < 3 && (n -= 15, s.push("limited evidence volume")), n = Math.max(0, Math.min(100, n));
  let i = "low";
  return n >= 75 ? i = "high" : n >= 50 ? i = "medium" : n < 25 && (i = "insufficient"), e.items.length === 1 && n < 40 && (i = "insufficient", s.push("single weak evidence hit")), {
    level: i,
    score: n,
    rationale: s.join("; ")
  };
}
function Xo(e, t) {
  if (t.level === "insufficient")
    return `I found limited evidence for "${e.searchQuery}". ${t.rationale}. Consider refining the question or checking the Search screen for raw hits.`;
  const n = e.items.slice(0, 3), s = n[0];
  switch (e.intent) {
    case "decision": {
      const r = e.executiveSessions[0];
      if (r)
        return `Based on executive session evidence (${r.krcId ?? r.title}): ${r.excerpt}`;
      const i = e.messages.find((a) => {
        var c;
        return (c = a.messageRole) == null ? void 0 : c.toLowerCase().includes("assistant");
      });
      return i ? `Based on assistant evidence (${i.krcId ?? i.title}): ${i.excerpt}` : `Based on indexed evidence (${s.krcId ?? s.title}): ${s.excerpt}`;
    }
    case "summarize":
      return `Summary grounded in ${e.topKrcIds.slice(0, 3).join(", ") || "indexed sources"}: ${n.map((i) => i.excerpt).join(" ")}`.slice(0, 500);
    case "show_evidence": {
      const r = e.attachments[0];
      return r ? `Evidence located: attachment "${r.title}" (${r.krcId ?? "source"}). ${r.excerpt}` : `Evidence located in ${s.krcId ?? s.explorerPath}: ${s.excerpt}`;
    }
    case "blockers": {
      const r = e.items.filter((i) => /blocker|unresolved|remaining|issue|risk|todo|pending|missing/i.test(i.excerpt));
      return r.length === 0 ? `No explicit blocker language found for "${e.searchQuery}" in retrieved evidence. Showing closest matches only — confidence is reduced.` : `Blocker-related evidence (${r.length} hit(s)): ${r[0].excerpt}`;
    }
    default:
      return `Based on retrieved evidence (${s.krcId ?? s.title}): ${s.excerpt}`;
  }
}
function Jo(e) {
  const t = [], n = e.items.slice(0, 6);
  if (n.length === 0)
    return "No evidence items available to summarize.";
  t.push(`Retrieved ${e.items.length} evidence record(s) for "${e.searchQuery}".`);
  for (const s of n) {
    const r = s.krcId ? `[${s.krcId}]` : `[${s.kind}]`;
    t.push(`- ${r} ${s.title}: ${s.excerpt}`);
  }
  return e.topKrcIds.length > 1 && t.push(`- Sources span ${e.topKrcIds.length} KRC records: ${e.topKrcIds.slice(0, 5).join(", ")}.`), e.attachments.length > 0 && t.push(`- ${e.attachments.length} attachment reference(s) included in evidence.`), t.join(`
`);
}
function Qo(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e.topKrcIds.slice(0, 5)) {
    const r = e.items.find((i) => i.krcId === s);
    !r || n.has(r.explorerPath) || (n.add(r.explorerPath), t.push({
      label: `${s} — ${r.conversationTitle ?? r.title}`,
      path: r.explorerPath,
      krcId: s
    }));
  }
  for (const s of e.executiveSessions.slice(0, 2))
    n.has(s.explorerPath) || (n.add(s.explorerPath), t.push({
      label: `Executive Session — ${s.title}`,
      path: s.explorerPath,
      krcId: s.krcId
    }));
  return t;
}
class ea {
  compose(t) {
    const n = Yo(t), s = ct(t.items, 8), r = ct(t.attachments, 6), i = ct(t.relatedSources, 5);
    return {
      question: t.question,
      intent: t.intent,
      searchQuery: t.searchQuery,
      directAnswer: Xo(t, n),
      reasonedSummary: Jo(t),
      evidenceUsed: s,
      confidence: n,
      timeline: t.timeline,
      relatedSources: i,
      attachments: r,
      explorerLinks: Qo(t)
    };
  }
}
const ta = new ea();
function na(e, t = ta) {
  return t.compose(e);
}
async function sa(e, t, n) {
  const s = await ge(e), r = Wo(s, t), i = na(r, n);
  return No(e, i);
}
function ra(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function Ge(e) {
  var t, n, s;
  return ra(((t = e.message) == null ? void 0 : t.timestamp) ?? ((n = e.conversation) == null ? void 0 : n.updated) ?? ((s = e.conversation) == null ? void 0 : s.created));
}
function Nt(e) {
  var t, n, s, r;
  return [
    e.excerpt,
    (t = e.message) == null ? void 0 : t.text,
    (n = e.conversation) == null ? void 0 : n.title,
    (r = (s = e.session) == null ? void 0 : s.summaryReferences) == null ? void 0 : r.join(" ")
  ].filter(Boolean).join(" ");
}
function hs(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function Lt(e) {
  return {
    recordId: e.id,
    label: hs(e),
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind
  };
}
function gs(e) {
  return {
    label: e.message,
    explorerPath: e.relativePath ?? "Registries/SOURCE_REGISTRY.md"
  };
}
function ia(e) {
  return e.kind === "executive_session" ? 92 : xt(Nt(e)) ? 78 : 65;
}
function fn(e, t) {
  return e.find((n) => n.id === t) ?? e.find((n) => n.repository.krcId === t) ?? e.find((n) => t.startsWith(n.repository.krcId ?? ""));
}
function oa(e) {
  const t = e.filter((r) => {
    const i = Nt(r);
    return r.kind === "executive_session" || xt(i);
  }).sort((r, i) => Ge(i) - Ge(r)).slice(0, 4), n = t[0], s = n ? ia(n) : 50;
  return {
    cardId: "recent-decisions",
    category: "recent_decision",
    title: "Recent Decisions",
    summary: n ? `${hs(n)} — ${n.excerpt.slice(0, 140)}${n.excerpt.length > 140 ? "…" : ""}` : "No indexed decision evidence found yet.",
    whyItMatters: "Recent decisions anchor what the team agreed to and what Vigsy can ground answers on.",
    confidence: s,
    evidenceLinks: t.map(Lt)
  };
}
function aa(e, t) {
  const n = t.issues.filter((o) => o.severity === "error" || o.severity === "warning"), s = e.filter((o) => ms(Nt(o))).sort((o, l) => Ge(l) - Ge(o)).slice(0, 4), r = [
    ...n.slice(0, 2).map(gs),
    ...s.map(Lt)
  ], i = /* @__PURE__ */ new Set(), a = r.filter((o) => {
    const l = o.recordId ?? o.explorerPath;
    return i.has(l) ? !1 : (i.add(l), !0);
  });
  return a.length === 0 ? {
    cardId: "recent-blockers",
    category: "recent_blocker",
    title: "Blockers",
    summary: "No critical blockers found in repository health or indexed evidence.",
    whyItMatters: "A clear blocker picture helps you prioritize without surprise impediments.",
    confidence: 84,
    evidenceLinks: [
      {
        label: "Repository health status",
        explorerPath: "Registries/SOURCE_REGISTRY.md"
      }
    ],
    isPlaceholder: !0
  } : {
    cardId: "recent-blockers",
    category: "recent_blocker",
    title: "Recent Blockers",
    summary: a[0].label,
    whyItMatters: "Unresolved blockers can stall campaigns until they are visible and tracked.",
    confidence: n.length > 0 ? 90 : 72,
    evidenceLinks: a.slice(0, 4)
  };
}
function ca(e) {
  const t = [...e].sort((s, r) => r.sortTime.localeCompare(s.sortTime)), n = t[0];
  return {
    cardId: "recent-imports",
    category: "recent_import",
    title: "Recent Imports",
    summary: n ? `Latest ChatGPT import: ${n.title} (${n.krcId})` : "No ChatGPT imports indexed in the repository.",
    whyItMatters: "Fresh imports expand the evidence Vigsy can search, relate, and reason over.",
    confidence: n ? 94 : 60,
    evidenceLinks: t.slice(0, 3).map((s) => ({
      label: `${s.krcId} — ${s.title}`,
      explorerPath: s.relativePath,
      krcId: s.krcId,
      kind: "source"
    }))
  };
}
function da(e) {
  const t = e.reason.match(/"([^"]+)"/);
  return (t == null ? void 0 : t[1]) ?? e.reason.replace(/^Shared (topic|campaign reference) /i, "").trim();
}
function la(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const l of t) {
    if (l.relationshipType !== "campaign_campaign" && l.relationshipType !== "topic_topic" && l.relationshipType !== "conversation_conversation")
      continue;
    const u = da(l), d = n.get(u);
    d ? d.count += 1 : n.set(u, { count: 1, rel: l });
  }
  const r = [...n.entries()].sort((l, u) => u[1].count - l[1].count)[0];
  if (!r)
    return {
      cardId: "high-relationship-topic",
      category: "high_relationship_topic",
      title: "High-Relationship Topics",
      summary: "Relationship index is building cross-evidence links across the repository.",
      whyItMatters: "Highly connected topics reveal where knowledge clusters and campaigns overlap.",
      confidence: 55,
      evidenceLinks: []
    };
  const [i, { count: a, rel: c }] = r, o = fn(e, c.toId) ?? fn(e, c.fromId) ?? e[0];
  return {
    cardId: "high-relationship-topic",
    category: "high_relationship_topic",
    title: "High-Relationship Topic",
    summary: `"${i}" appears in ${a} indexed relationships.`,
    whyItMatters: "Topics with many relationships are strong anchors for executive awareness and follow-up questions.",
    confidence: Math.min(95, 60 + a * 3),
    evidenceLinks: o ? [Lt(o)] : [
      {
        label: c.reason,
        explorerPath: c.supportingEvidenceIds[0] ?? "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
function ua(e) {
  const t = [];
  for (const i of e.categorizedIssues.recommendations.slice(0, 3))
    t.push({
      label: i.recovery ? `${i.message} — ${i.recovery}` : i.message,
      explorerPath: i.relativePath ?? "Registries/SOURCE_REGISTRY.md"
    });
  for (const i of e.issues.filter((a) => a.recovery).slice(0, 3)) {
    if (t.length >= 4)
      break;
    t.push({
      label: `${i.message} — ${i.recovery}`,
      explorerPath: i.relativePath ?? "Registries/SOURCE_REGISTRY.md"
    });
  }
  e.gitReady || t.push({
    label: "Review git readiness before the next import",
    explorerPath: "Registries/SOURCE_REGISTRY.md"
  }), e.gitDirty && t.push({
    label: "Commit or stash uncommitted repository changes",
    explorerPath: "Registries/SOURCE_REGISTRY.md"
  });
  const n = /* @__PURE__ */ new Set(), s = t.filter((i) => n.has(i.label) ? !1 : (n.add(i.label), !0)), r = s.length > 0 ? s : [
    {
      label: "Explore recent evidence with a Vigsy question",
      explorerPath: "Sources"
    }
  ];
  return {
    cardId: "suggested-next-actions",
    category: "suggested_next_action",
    title: "Suggested Next Actions",
    summary: r[0].label,
    whyItMatters: "Grounded next steps keep momentum without autonomous changes to the repository.",
    confidence: s.length > 0 ? 80 : 65,
    evidenceLinks: r.slice(0, 4)
  };
}
function fa(e) {
  const t = e.statusLevel === "healthy" ? 93 : e.statusLevel === "attention" ? 78 : 62;
  return {
    cardId: "repository-health",
    category: "repository_health",
    title: "Repository Health",
    summary: e.statusHeadline,
    whyItMatters: e.statusSubline,
    confidence: t,
    evidenceLinks: e.issues.length > 0 ? e.issues.slice(0, 4).map(gs) : [
      {
        label: "Repository structure verified",
        explorerPath: "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
async function ys(e) {
  const [t, n, s, , r] = await Promise.all([
    ge(e),
    xe(e),
    le(e),
    ns(e),
    Gn(e)
  ]), i = [
    oa(t.records),
    aa(t.records, s),
    ca(r),
    la(t.records, n.relationships),
    ua(s),
    fa(s)
  ];
  return {
    version: 1,
    repositoryPath: e,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceRecordCount: t.recordCount,
    relationshipCount: n.relationshipCount,
    cards: i
  };
}
const pa = "executive-briefing-cache.json", Is = 1;
function vs(e) {
  return k.join(e, me, pa);
}
async function ma(e) {
  const t = Ke(e), n = He(e), [s, r] = await Promise.all([
    Wn(e),
    us(e)
  ]);
  let i = 0, a = 0;
  try {
    i = (await x.stat(t)).mtimeMs;
  } catch {
  }
  try {
    a = (await x.stat(n)).mtimeMs;
  } catch {
  }
  return {
    evidenceIndexBuiltAt: (s == null ? void 0 : s.builtAt) ?? "",
    evidenceIndexMtimeMs: i,
    relationshipIndexBuiltAt: (r == null ? void 0 : r.builtAt) ?? "",
    relationshipIndexMtimeMs: a
  };
}
async function ha(e) {
  try {
    const t = await x.readFile(vs(e), "utf8"), n = JSON.parse(t);
    return n.version !== Is || !n.briefing || !Array.isArray(n.briefing.cards) ? null : n;
  } catch {
    return null;
  }
}
async function ws(e, t, n) {
  const s = await ma(e), r = {
    version: Is,
    repositoryPath: e,
    cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceIndexBuiltAt: s.evidenceIndexBuiltAt,
    evidenceIndexMtimeMs: s.evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: s.relationshipIndexBuiltAt,
    relationshipIndexMtimeMs: s.relationshipIndexMtimeMs,
    briefing: t
  }, i = k.join(e, me);
  await x.mkdir(i, { recursive: !0 });
  const a = vs(e);
  return await x.writeFile(a, JSON.stringify(r, null, 2), "utf8"), a;
}
async function ga(e, t) {
  try {
    if ((await x.stat(Ke(e))).mtimeMs > t.evidenceIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  try {
    if ((await x.stat(He(e))).mtimeMs > t.relationshipIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  return !1;
}
async function ya(e) {
  const t = await ha(e);
  if (!t || t.repositoryPath !== e) {
    const s = await ys(e);
    return await ws(e, s), { briefing: s, fromCache: !1, stale: !1 };
  }
  const n = await ga(e, t);
  return { briefing: t.briefing, fromCache: !0, stale: n };
}
async function Es(e) {
  const t = await ys(e);
  return await ws(e, t), t;
}
const pn = k.dirname(xs(import.meta.url));
hn.registerSchemesAsPrivileged([
  {
    scheme: "kae-asset",
    privileges: {
      standard: !0,
      secure: !0,
      supportFetchAPI: !0,
      stream: !0,
      corsEnabled: !0
    }
  }
]);
function Ia(e) {
  const t = "kae-asset://resolve/";
  if (!e.startsWith(t))
    throw new Error("Invalid asset URL.");
  return decodeURIComponent(e.slice(t.length));
}
let P = null, se = null, J = null, Ce = null, Ss = null, de = null, dt = null, lt = null;
const re = Ps(), H = new Us(), Ue = [];
function O() {
  return re.repository.path;
}
function Me(e) {
  const t = k.resolve(O(), e), n = k.resolve(O());
  if (!t.startsWith(n)) throw new Error("Invalid file path.");
  return t;
}
function j(e, t, n, s) {
  const r = {
    id: crypto.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: e,
    source: t,
    message: n,
    context: s
  };
  return Ue.unshift(r), Ue.length > 500 && Ue.pop(), P == null || P.webContents.send("kae:log-added", r), r;
}
async function mt() {
  try {
    await Es(O()), P == null || P.webContents.send("kae:executive-briefing-updated");
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    j("warn", "awareness", `Executive briefing refresh failed: ${t}`);
  }
}
async function Be(e) {
  const t = k.join(O(), ".kae-sessions", "import-trace.log"), n = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${e}
`;
  try {
    await x.mkdir(k.dirname(t), { recursive: !0 }), await x.appendFile(t, n, "utf8");
  } catch {
  }
}
function va() {
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
function Rs(e) {
  P == null || P.webContents.send("kae:import-timeline", e);
}
function Z(e, t, n, s) {
  const r = e.find((i) => i.id === t);
  r && (r.status = n, r.detail = s), Rs([...e]);
}
function wa() {
  Qt.forEach((e) => ze.register(e)), Lr.register(Un), j("info", "system", `Registered ${Qt.length} connector plugin(s)`);
}
function mn() {
  P = new gn({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${wn} — ${En}`,
    webPreferences: {
      preload: k.join(pn, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL ? (P.loadURL(process.env.VITE_DEV_SERVER_URL), P.webContents.openDevTools({ mode: "detach" })) : P.loadFile(k.join(pn, "../dist/index.html")), P.on("closed", () => {
    P = null;
  });
}
function Cs(e) {
  P == null || P.webContents.send("kae:validation-progress", e);
}
async function Ea(e) {
  const t = k.basename(e), n = k.extname(t), s = { path: e, name: t, extension: n };
  de && de.abort(), de = new AbortController();
  const { signal: r } = de;
  j("info", "import", `Validating: ${t} (read-only — no repository writes)`, {
    filePath: e,
    fileName: t
  });
  try {
    const i = await Bn(s, O(), {
      signal: r,
      log: (a, c, o) => j(a, "import", c, o),
      onProgress: Cs,
      onImportPackageReady: (a) => {
        J = a, Ce = e, Be(
          `Validation cached import package: ${a.documents.length} document(s) from ${t}`
        );
      }
    });
    return se = i, i.valid ? j(
      "info",
      "import",
      `Validation complete in ${i.durationMs ?? 0}ms: ${i.conversationsFound} conversation(s) — awaiting user confirmation`,
      {
        conversationsFound: i.conversationsFound,
        estimatedSourcesToCreate: i.estimatedSourcesToCreate,
        estimatedSourcesToUpdate: i.estimatedSourcesToUpdate,
        warnings: i.warnings.length
      }
    ) : r.aborted || j(
      "error",
      "import",
      `Validation failed — repository unchanged. ${i.blockingErrors.join("; ") || i.errors.join("; ") || "Unknown error"}`,
      {
        blockingErrors: i.blockingErrors,
        errors: i.errors
      }
    ), i;
  } finally {
    de = null;
  }
}
async function Sa(e, t) {
  var h, y, E;
  const n = Date.now(), s = k.basename(e), r = k.extname(s), i = crypto.randomUUID(), a = { path: e, name: s, extension: r }, c = va();
  Rs(c), await Be(`Confirm import started: ${s} (${e})`), Z(c, "validate-zip", "running"), j("info", "import", `Pre-import validation gate: ${s}`);
  let o;
  try {
    se != null && se.valid && se.filePath === e && J && Ce === e ? (o = se, await Be(
      `Reusing validated import package: ${J.documents.length} document(s) — no ZIP re-parse`
    ), j(
      "info",
      "import",
      `Reusing cached validation and import package (${J.documents.length} documents)`
    )) : (o = await Bn(a, O(), {
      log: (S, _, A) => j(S, "import", _, A),
      onImportPackageReady: (S) => {
        J = S, Ce = e;
      }
    }), se = o);
  } catch (S) {
    const _ = S instanceof Error ? S.message : String(S);
    throw Z(c, "validate-zip", "failed", _), j("error", "import", `Validation error — repository unchanged. ${_}`), new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${_}. Recovery: fix the export and validate again.`
    );
  }
  if (!o.valid) {
    const S = o.blockingErrors.join("; ") || "Validation failed";
    throw Z(c, "validate-zip", "failed", S), j("error", "import", `Import blocked — repository unchanged. ${S}`), new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${S}. Recovery: review the validation report and fix the export.`
    );
  }
  Z(c, "validate-zip", "complete", `${o.conversationsFound} conversations`);
  const l = Os(i, t, a);
  l.status = "queued", H.enqueue(l), P == null || P.webContents.send("kae:job-updated", l), H.updateStatus(i, "running", 0), P == null || P.webContents.send("kae:job-updated", H.getById(i));
  const u = ze.get(t);
  if (!u) {
    const S = `No connector registered for format: ${t}`;
    throw H.updateStatus(i, "failed", 0, S), j("error", "import", `${S} — repository unchanged.`), new Error(S);
  }
  Z(c, "create-snapshot", "running"), j("info", "repository", "Creating pre-import snapshot…");
  const d = await zn(O(), i), p = await oi(O(), {
    sessionId: i,
    connectorId: t,
    sourceFile: s,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: O(),
    snapshotPath: d,
    validationPassed: !0,
    plannedCreates: o.estimatedSourcesToCreate,
    plannedUpdates: o.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: d, manifestPath: "" }
  });
  Z(c, "create-snapshot", "complete", k.basename(d)), j("info", "repository", `Snapshot saved: ${d}`), Z(c, "analyze-export", "running"), await Be(
    `Analyze export: using cached package=${!!(J && Ce === e)}, documents=${(J == null ? void 0 : J.documents.length) ?? "unknown"}`
  );
  const g = {
    repositoryPath: O(),
    outputDirectory: re.settings.outputDirectory,
    jobId: i,
    importPackage: Ce === e ? J ?? void 0 : void 0,
    sourceZipPath: e,
    log: (S, _) => j(S, "import", _),
    onProgress: (S) => {
      H.updateStatus(i, "running", S), P == null || P.webContents.send("kae:job-updated", H.getById(i));
    }
  };
  j("info", "import", `Import started: ${s}`);
  const I = await u.import(a, g);
  if (!I.success || I.documents.length === 0) {
    const S = ((h = I.errors) == null ? void 0 : h.join("; ")) || "Import produced no documents";
    throw Z(c, "analyze-export", "failed", S), H.updateStatus(i, "failed", 100, S), j(
      "error",
      "import",
      `Import failed after snapshot — repository may be partially updated. Rollback: ${d}. Error: ${S}`
    ), new Error(
      `Import failed. Snapshot available at ${d}. What happened: connector produced no documents. Why: ${S}. Recovery: restore from snapshot if needed.`
    );
  }
  Z(c, "analyze-export", "complete", `${I.documents.length} documents`), Z(c, "generate-sources", "running"), H.updateStatus(i, "running", 85), P == null || P.webContents.send("kae:job-updated", H.getById(i)), Z(c, "update-repository", "running");
  const w = await Un.export(I.documents, O(), {
    log: (S, _) => j(S, "export", _),
    onProgress: (S) => {
      H.updateStatus(i, "running", 85 + Math.round(S * 0.15)), P == null || P.webContents.send("kae:job-updated", H.getById(i));
    },
    importFileName: s,
    sourceZipPath: e
  });
  Z(c, "generate-sources", "complete"), Z(c, "update-repository", "complete", `${w.sourcesCreated} sources`), Z(c, "update-registries", "complete", w.reviewFile ?? "Registries updated"), Z(c, "health-check", "running");
  const T = await le(O());
  Z(c, "health-check", "complete", T.statusSubline), Z(c, "git-readiness", "running");
  const R = T.gitReadiness;
  Z(c, "git-readiness", "complete", R.status);
  const C = Date.now() - n, D = ze.get(t), m = {
    conversationsFound: ((y = I.summary) == null ? void 0 : y.conversationsFound) ?? I.documents.length,
    sourcesCreated: w.sourcesCreated,
    skippedDuplicates: w.skippedDuplicates,
    errors: [...I.errors ?? [], ...w.errors],
    outputFolder: w.outputFolder,
    createdSourceIds: w.createdSourceIds,
    classified: w.classified,
    uncertain: w.uncertain,
    reviewFile: w.reviewFile,
    durationMs: C,
    connectorId: t,
    connectorName: (D == null ? void 0 : D.name) ?? t,
    sessionsCreated: w.sessionsCreated ?? w.sourcesCreated,
    snapshotPath: d,
    gitReadiness: R,
    timeline: [...c]
  }, f = {
    reportId: i,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs: C,
    connectorId: t,
    connectorName: (D == null ? void 0 : D.name) ?? "ChatGPT Connector",
    sourceFile: s,
    repositoryPath: O(),
    imported: w.sourcesCreated,
    updated: o.estimatedSourcesToUpdate,
    skipped: w.skippedDuplicates,
    warnings: o.warnings,
    errors: m.errors,
    sourcesCreated: w.createdSourceIds,
    sessionsCreated: w.sessionsCreated ?? w.sourcesCreated,
    registriesUpdated: ((E = o.diffPreview) == null ? void 0 : E.registriesUpdated) ?? [],
    snapshotPath: d,
    manifestPath: p,
    gitReadiness: R,
    reportFilePath: ""
  };
  try {
    m.importReportPath = await Ui(O(), f), j("info", "import", `Import report saved: ${m.importReportPath}`);
  } catch (S) {
    const _ = S instanceof Error ? S.message : String(S);
    m.errors.push(`Import report: ${_}`), j("warn", "import", `Could not write import report: ${_}`);
  }
  Z(c, "complete", "complete", `Done in ${(C / 1e3).toFixed(1)}s`), m.timeline = [...c], Ss = m;
  const v = H.getById(i);
  return v.summary = m, H.updateStatus(i, "completed", 100), j(
    "info",
    "import",
    `Import complete in ${C}ms: ${m.sourcesCreated} source(s), ${m.skippedDuplicates} skipped`,
    { summary: m, snapshotPath: d, manifestPath: p }
  ), P == null || P.webContents.send("kae:job-updated", H.getById(i)), mt(), P == null || P.webContents.send("kae:import-complete", m), m;
}
function Ra() {
  F.handle(
    "kae:get-importers",
    () => ze.getAll().map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      supportedExtensions: e.supportedExtensions
    }))
  ), F.handle("kae:get-repository-config", () => re.repository), F.handle("kae:set-repository-config", (e, t) => (re.repository = t, j("info", "repository", `Repository path set to ${t.path}`), re.repository)), F.handle("kae:get-settings", () => re.settings), F.handle("kae:set-settings", (e, t) => (re.settings = t, j("info", "settings", "Application settings updated"), re.settings)), F.handle("kae:get-jobs", () => H.getAll()), F.handle("kae:get-logs", () => Ue), F.handle("kae:get-default-repository-path", () => Rn), F.handle("kae:get-repository-health", async () => le(O())), F.handle("kae:get-git-readiness", async () => (await le(O())).gitReadiness), F.handle("kae:get-repository-stats", async () => ns(O())), F.handle("kae:browse-repository", async () => Ze(O())), F.handle(
    "kae:read-repository-file",
    async (e, t) => De(O(), t)
  ), F.handle("kae:parse-chatgpt-source", async (e, t) => {
    const n = await De(O(), t), s = Tt(n);
    if (!s) return null;
    const r = new Set(s.fileReferences);
    for (const a of s.messages)
      for (const c of a.fileReferences) r.add(c);
    const i = await pi(O(), [...r]);
    return { parsed: s, assets: i };
  }), F.handle(
    "kae:read-repository-asset",
    async (e, t, n) => {
      const s = Me(t), r = await x.readFile(s), i = _t(r, n ?? k.basename(t)), a = t.replace(/\\/g, "/");
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(a)}`,
        mimeType: i,
        sizeBytes: r.length
      };
    }
  ), F.handle(
    "kae:list-chatgpt-import-entries",
    async () => Gn(O())
  ), F.handle(
    "kae:search-repository",
    async (e, t) => $i(O(), t)
  ), F.handle("kae:build-evidence-index", async () => {
    const e = await Yn(O());
    return await ft(O()), mt(), Si(e);
  }), F.handle("kae:search-knowledge", async (e, t) => {
    const n = await es(O(), t);
    return Qn(n);
  }), F.handle(
    "kae:resolve-evidence-drilldown",
    async (e, t, n) => mo(O(), t, n)
  ), F.handle(
    "kae:answer-knowledge-question",
    async (e, t) => sa(O(), t)
  ), F.handle("kae:build-relationship-index", async () => {
    const e = await ft(O());
    return mt(), Do(e);
  }), F.handle("kae:search-relationships", async (e, t) => {
    const n = await xe(O());
    return pt(n, t);
  }), F.handle("kae:get-relationships-for-evidence", async (e, t) => {
    const n = await xe(O());
    return fs(n, t);
  }), F.handle(
    "kae:get-related-evidence",
    async (e, t, n) => ps(O(), t, n)
  ), F.handle("kae:get-executive-briefing", async () => ya(O())), F.handle(
    "kae:refresh-executive-briefing",
    async () => Es(O())
  ), F.handle("kae:open-repository-path", async () => {
    await Ve.openPath(O());
  }), F.handle("kae:open-repository-file", async (e, t) => {
    await Ve.openPath(Me(t));
  }), F.handle("kae:reveal-repository-file", async (e, t) => {
    Ve.showItemInFolder(Me(t));
  }), F.handle("kae:copy-text", async (e, t) => (_s.writeText(t), !0)), F.handle("kae:get-last-validation", () => se), F.handle("kae:get-last-import-summary", () => Ss), F.handle("kae:get-last-repair-plan", () => dt), F.handle("kae:get-last-repair-result", () => lt), F.handle("kae:select-zip-file", async () => {
    const e = await Ds.showOpenDialog({
      title: "Select ChatGPT Export ZIP",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });
    return e.canceled ? null : e.filePaths[0] ?? null;
  }), F.handle("kae:analyze-repository-repair", async () => {
    j("info", "repair", "Repository repair analysis started (read-only)");
    const e = await Zi(O());
    return dt = e, lt = null, j("info", "repair", `Repair analysis complete: ${e.issues.length} issue(s), ${e.autoRepairCount} auto-repair action(s)`, {
      issueCount: e.issues.length,
      autoRepairCount: e.autoRepairCount,
      manualReviewCount: e.manualReviewCount
    }), e;
  }), F.handle("kae:execute-repository-repair", async (e, t) => {
    j("info", "repair", `Repository repair confirmed — ${t.autoRepairCount} safe action(s) will be applied`);
    const n = await eo(t, {
      log: (s, r, i) => j(s, "repair", r, i)
    });
    return lt = n, dt = t, j("info", "repair", `Repository repair complete: ${n.filesChanged.length} file(s) changed`, {
      snapshotPath: n.snapshotPath,
      duplicatesBefore: n.healthBefore.duplicateIds,
      duplicatesAfter: n.healthAfter.duplicateIds,
      ready: n.healthAfter.ready
    }), n;
  }), F.handle("kae:validate-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Ea(t);
  }), F.handle("kae:cancel-validation", () => de ? (de.abort(), j("warn", "import", "Validation cancelled by user — repository unchanged"), Cs({
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
  }), !0) : !1), F.handle("kae:import-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Sa(t, "chatgpt-export-zip");
  });
}
je.whenReady().then(async () => {
  hn.handle("kae-asset", async (e) => {
    const t = Ia(e.url), n = Me(t), s = await x.readFile(n), r = _t(s, k.basename(t));
    return new Response(s, { headers: { "Content-Type": r } });
  }), wa(), Ra(), j("info", "system", `${wn} started — ${En}`), mn(), je.on("activate", () => {
    gn.getAllWindows().length === 0 && mn();
  });
});
je.on("window-all-closed", () => {
  process.platform !== "darwin" && je.quit();
});
