var ai = Object.defineProperty;
var ci = (t, e, n) => e in t ? ai(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var _ = (t, e, n) => ci(t, typeof e != "symbol" ? e + "" : e, n);
import { safeStorage as tn, app as $e, protocol as xs, BrowserWindow as nn, ipcMain as N, shell as Tt, clipboard as ui, dialog as _n } from "electron";
import R from "node:fs/promises";
import S from "node:path";
import { fileURLToPath as di } from "node:url";
import li from "fs";
import sn from "path";
import _s from "zlib";
import fi from "crypto";
import { execFile as Ns } from "node:child_process";
import { promisify as Ls } from "node:util";
import { randomUUID as W } from "node:crypto";
const Ps = "KAE", Fs = "Knowledge Acquisition Engine";
function mi(t) {
  var s, r;
  if (!t)
    return {
      level: "attention",
      headline: "Status Unknown",
      subline: "Unable to load repository health."
    };
  const e = ((s = t.categorizedIssues) == null ? void 0 : s.errors.length) ?? t.issues.filter((i) => i.severity === "error").length, n = ((r = t.categorizedIssues) == null ? void 0 : r.warnings.length) ?? t.issues.filter((i) => i.severity === "warning").length;
  return e > 0 ? {
    level: "critical",
    headline: "Repository Requires Attention",
    subline: `${e} error(s) and ${n} warning(s) detected.`
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
function pi(t) {
  const e = {
    errors: [],
    warnings: [],
    information: [],
    recommendations: []
  };
  for (const n of t) {
    const s = n.category ?? n.severity;
    s === "error" ? e.errors.push(n) : s === "warning" ? e.warnings.push(n) : s === "recommendation" ? e.recommendations.push(n) : e.information.push(n);
  }
  return e;
}
class Os extends Error {
  constructor(e) {
    super(`${e} is not implemented yet (Phase 1 architecture only).`), this.name = "NotImplementedError";
  }
}
const Us = "C:\\Users\\alber\\Axiom-Knowledge", Ms = {
  theme: "dark",
  logLevel: "info",
  maxConcurrentJobs: 2,
  outputDirectory: "./output",
  aiProvider: "mock",
  aiStreaming: !0,
  aiTemperature: 0.2
}, hi = {
  path: Us,
  name: "Axiom Knowledge",
  autoSync: !1
};
function gi() {
  return {
    repository: { ...hi },
    settings: { ...Ms }
  };
}
function yi(t, e, n) {
  const s = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: t,
    format: e,
    source: n,
    status: "pending",
    createdAt: s,
    updatedAt: s,
    progress: 0
  };
}
class wi {
  constructor() {
    _(this, "jobs", []);
  }
  enqueue(e) {
    this.jobs.push(e);
  }
  dequeue() {
    return this.jobs.find((n) => n.status === "queued" || n.status === "pending");
  }
  getAll() {
    return [...this.jobs];
  }
  getById(e) {
    return this.jobs.find((n) => n.id === e);
  }
  updateStatus(e, n, s, r) {
    const i = this.jobs.find((o) => o.id === e);
    i && (i.status = n, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), s !== void 0 && (i.progress = s), r !== void 0 && (i.error = r));
  }
  clear() {
    this.jobs = [];
  }
}
const js = [
  "VIGS",
  "Founder OS",
  "Axiom",
  "Book",
  "Knowledge Recovery",
  "Source Material",
  "Technical Build",
  "Other / Review Needed"
], Nn = 2, vi = 3, Jt = {
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
function rn(t) {
  var p, h, I, b;
  const e = Ii(t), n = Ei(e), s = Si(e, t, n), r = js.filter((C) => C !== "Other / Review Needed").map((C) => ({ category: C, score: s[C] })).sort((C, A) => A.score - C.score), i = ((p = r[0]) == null ? void 0 : p.score) ?? 0, o = ((h = r[1]) == null ? void 0 : h.score) ?? 0;
  let c = r.filter((C) => C.score >= Nn).map((C) => C.category), a = !1, l, d;
  i < vi || i === 0 ? (a = !0, l = "Other / Review Needed", c = c.length > 0 ? [...c, "Other / Review Needed"] : ["Other / Review Needed"], d = `Low classification confidence (top score ${i}). Routed to review.`) : i === o && i >= Nn ? (a = !0, l = "Other / Review Needed", c = [.../* @__PURE__ */ new Set([...c, "Other / Review Needed"])], d = `Tied scores between "${(I = r[0]) == null ? void 0 : I.category}" and "${(b = r[1]) == null ? void 0 : b.category}". Routed to review.`) : (l = r[0].category, c.length === 0 && (c = [l]), d = `Primary match "${l}" (score ${i}) from title, content, and recurring terms.`);
  const u = t.metadata.messageCount;
  typeof u == "number" && u === 0 && (a = !0, l = "Other / Review Needed", c.includes("Other / Review Needed") || (c = [...c, "Other / Review Needed"]), d = "No extractable messages. Preserved for manual review.");
  const f = Math.min(100, Math.round(i / Math.max(i + o, 1) * 100));
  return {
    categories: [...new Set(c)],
    primaryCategory: l,
    confidence: a ? Math.min(f, 40) : f,
    inferredProject: Ci(l, t.title, n),
    recurringTerms: n.slice(0, 12),
    uncertain: a,
    rationale: d,
    categoryScores: s
  };
}
function on(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t)
    e.set(String(n.metadata.conversationId ?? n.id), rn(n));
  return e;
}
function Ii(t) {
  const e = Array.isArray(t.metadata.fileReferences) ? t.metadata.fileReferences.filter((n) => typeof n == "string").join(" ") : "";
  return `${t.title} ${t.content} ${e}`.toLowerCase();
}
function Si(t, e, n) {
  const s = Object.fromEntries(js.map((r) => [r, 0]));
  for (const [r, i] of Object.entries(Jt))
    for (const o of i)
      t.includes(o) && (s[r] += o.includes(" ") ? 3 : 1);
  typeof e.metadata.pastedTranscriptCount == "number" && e.metadata.pastedTranscriptCount > 0 && (s["Source Material"] += 4);
  for (const r of n.slice(0, 5))
    for (const [i, o] of Object.entries(Jt))
      o.some((c) => c.includes(r) || r.includes(c.split(" ")[0] ?? "")) && (s[i] += 1);
  return s["Other / Review Needed"] = 0, s;
}
function Ei(t) {
  const e = t.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((s) => s.length >= 5), n = /* @__PURE__ */ new Map();
  for (const s of e)
    n.set(s, (n.get(s) ?? 0) + 1);
  return [...n.entries()].filter(([, s]) => s >= 2).sort((s, r) => r[1] - s[1]).map(([s]) => s);
}
function Ci(t, e, n) {
  if (t !== "Other / Review Needed")
    return t;
  const s = e.toLowerCase();
  for (const [r, i] of Object.entries(Jt))
    if (i.some((o) => s.includes(o)))
      return `${r} (uncertain)`;
  return n.length > 0 ? `Unlabeled — terms: ${n.slice(0, 3).join(", ")}` : "Unlabeled";
}
function se(t, e, n) {
  var s;
  (s = t.log) == null || s.call(t, "info", `[${e}] ${n}`);
}
function an(t, e) {
  return e.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    format: n.format,
    metadata: {
      ...n.metadata,
      connectorId: t
    }
  }));
}
function cn(t, e, n) {
  const s = (/* @__PURE__ */ new Date()).toISOString();
  return n.map((r) => ({
    id: r.id,
    connectorId: t,
    sourceFile: e.name,
    acquiredAt: s,
    conversationId: String(r.metadata.conversationId ?? r.id),
    metadata: {
      title: r.title,
      format: r.format
    }
  }));
}
function un(t, e, n, s) {
  const r = on(n);
  return {
    connectorId: t.id,
    source: e,
    documents: n,
    provenance: s,
    classifications: r,
    metadata: {
      documentCount: n.length,
      emittedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function dn(t, e, n) {
  const s = (u, f) => {
    var p;
    (p = n.onProgress) == null || p.call(n, u, f);
  }, r = () => {
    var u;
    if ((u = n.signal) != null && u.aborted)
      throw new Error("Operation cancelled.");
  };
  r(), s("discover", 5), se(n, "discover", `Discovering source: ${e.name}`);
  const i = await t.discover(e);
  r(), s("extract", 20), se(n, "extract", "Extracting raw content");
  const o = await t.extract(i);
  r(), s("normalize", 40), se(n, "normalize", "Normalizing documents");
  const c = await t.normalize(o);
  s("validate", 55), se(n, "validate", `Validated ${c.length} document(s)`), s("classify", 70), se(n, "classify", "Classifying knowledge items"), s("provenance", 80);
  const a = an(t.id, c), l = cn(t.id, e, a);
  se(n, "provenance", `Generated ${l.length} provenance record(s)`), s("source-record", 90), se(n, "source-record", `Prepared ${a.length} source record(s)`), s("emit", 100);
  const d = un(t, e, a, l);
  return se(n, "emit", "Import package ready"), d;
}
const ki = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  emitImportPackage: un,
  generateProvenance: cn,
  generateSourceRecords: an,
  runConnectorPipeline: dn
}, Symbol.toStringTag, { value: "Module" }));
class Ri {
  constructor() {
    _(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(e) {
    this.plugins.set(e.id, e);
  }
  unregister(e) {
    this.plugins.delete(e);
  }
  get(e) {
    return this.plugins.get(e);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
}
const bi = new Ri();
class Ai {
  async export(e, n, s) {
    throw new Os(`Exporter "${this.name}"`);
  }
}
function $i(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var de = { exports: {} }, Dt, Ln;
function Bs() {
  return Ln || (Ln = 1, Dt = {
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
  }), Dt;
}
var xt = {}, Pn;
function ln() {
  return Pn || (Pn = 1, (function(t) {
    const e = {
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
        return r.length && (s = s.replace(/\{(\d)\}/g, (i, o) => r[o] || "")), new Error("ADM-ZIP: " + s);
      };
    }
    for (const s of Object.keys(e))
      t[s] = n(e[s]);
  })(xt)), xt;
}
var _t, Fn;
function Ti() {
  if (Fn) return _t;
  Fn = 1;
  const t = li, e = sn, n = Bs(), s = ln(), r = typeof process == "object" && process.platform === "win32", i = (a) => typeof a == "object" && a !== null, o = new Uint32Array(256).map((a, l) => {
    for (let d = 0; d < 8; d++)
      (l & 1) !== 0 ? l = 3988292384 ^ l >>> 1 : l >>>= 1;
    return l >>> 0;
  });
  function c(a) {
    this.sep = e.sep, this.fs = t, i(a) && i(a.fs) && typeof a.fs.statSync == "function" && (this.fs = a.fs);
  }
  return _t = c, c.prototype.makeDir = function(a) {
    const l = this;
    function d(u) {
      let f = u.split(l.sep)[0];
      u.split(l.sep).forEach(function(p) {
        if (!(!p || p.substr(-1, 1) === ":")) {
          f += l.sep + p;
          var h;
          try {
            h = l.fs.statSync(f);
          } catch (I) {
            if (I.message && I.message.startsWith("ENOENT"))
              l.fs.mkdirSync(f);
            else
              throw I;
          }
          if (h && h.isFile()) throw s.FILE_IN_THE_WAY(`"${f}"`);
        }
      });
    }
    d(a);
  }, c.prototype.writeFileTo = function(a, l, d, u) {
    const f = this;
    if (f.fs.existsSync(a)) {
      if (!d) return !1;
      var p = f.fs.statSync(a);
      if (p.isDirectory())
        return !1;
    }
    var h = e.dirname(a);
    f.fs.existsSync(h) || f.makeDir(h);
    var I;
    try {
      I = f.fs.openSync(a, "w", 438);
    } catch {
      f.fs.chmodSync(a, 438), I = f.fs.openSync(a, "w", 438);
    }
    if (I)
      try {
        f.fs.writeSync(I, l, 0, l.length, 0);
      } finally {
        f.fs.closeSync(I);
      }
    return f.fs.chmodSync(a, u || 438), !0;
  }, c.prototype.writeFileToAsync = function(a, l, d, u, f) {
    typeof u == "function" && (f = u, u = void 0);
    const p = this;
    p.fs.exists(a, function(h) {
      if (h && !d) return f(!1);
      p.fs.stat(a, function(I, b) {
        if (h && b.isDirectory())
          return f(!1);
        var C = e.dirname(a);
        p.fs.exists(C, function(A) {
          A || p.makeDir(C), p.fs.open(a, "w", 438, function(T, g) {
            T ? p.fs.chmod(a, 438, function() {
              p.fs.open(a, "w", 438, function(m, v) {
                p.fs.write(v, l, 0, l.length, 0, function() {
                  p.fs.close(v, function() {
                    p.fs.chmod(a, u || 438, function() {
                      f(!0);
                    });
                  });
                });
              });
            }) : g ? p.fs.write(g, l, 0, l.length, 0, function() {
              p.fs.close(g, function() {
                p.fs.chmod(a, u || 438, function() {
                  f(!0);
                });
              });
            }) : p.fs.chmod(a, u || 438, function() {
              f(!0);
            });
          });
        });
      });
    });
  }, c.prototype.findFiles = function(a) {
    const l = this;
    function d(u, f, p) {
      let h = [];
      return l.fs.readdirSync(u).forEach(function(I) {
        const b = e.join(u, I), C = l.fs.statSync(b);
        h.push(e.normalize(b) + (C.isDirectory() ? l.sep : "")), C.isDirectory() && p && (h = h.concat(d(b, f, p)));
      }), h;
    }
    return d(a, void 0, !0);
  }, c.prototype.findFilesAsync = function(a, l) {
    const d = this;
    let u = [];
    d.fs.readdir(a, function(f, p) {
      if (f) return l(f);
      let h = p.length;
      if (!h) return l(null, u);
      p.forEach(function(I) {
        I = e.join(a, I), d.fs.stat(I, function(b, C) {
          if (b) return l(b);
          C && (u.push(e.normalize(I) + (C.isDirectory() ? d.sep : "")), C.isDirectory() ? d.findFilesAsync(I, function(A, T) {
            if (A) return l(A);
            u = u.concat(T), --h || l(null, u);
          }) : --h || l(null, u));
        });
      });
    });
  }, c.prototype.getAttributes = function() {
  }, c.prototype.setAttributes = function() {
  }, c.crc32update = function(a, l) {
    return o[(a ^ l) & 255] ^ a >>> 8;
  }, c.crc32 = function(a) {
    typeof a == "string" && (a = Buffer.from(a, "utf8"));
    let l = a.length, d = -1;
    for (let u = 0; u < l; ) d = c.crc32update(d, a[u++]);
    return ~d >>> 0;
  }, c.methodToString = function(a) {
    switch (a) {
      case n.STORED:
        return "STORED (" + a + ")";
      case n.DEFLATED:
        return "DEFLATED (" + a + ")";
      default:
        return "UNSUPPORTED (" + a + ")";
    }
  }, c.canonical = function(a) {
    if (!a) return "";
    const l = e.posix.normalize("/" + a.split("\\").join("/"));
    return e.join(".", l);
  }, c.zipnamefix = function(a) {
    if (!a) return "";
    const l = e.posix.normalize("/" + a.split("\\").join("/"));
    return e.posix.join(".", l);
  }, c.findLast = function(a, l) {
    if (!Array.isArray(a)) throw new TypeError("arr is not array");
    const d = a.length >>> 0;
    for (let u = d - 1; u >= 0; u--)
      if (l(a[u], u, a))
        return a[u];
  }, c.sanitize = function(a, l) {
    a = e.resolve(e.normalize(a));
    for (var d = l.split("/"), u = 0, f = d.length; u < f; u++) {
      var p = e.normalize(e.join(a, d.slice(u, f).join(e.sep)));
      if (p === a || p.startsWith(a + e.sep))
        return p;
    }
    return e.normalize(e.join(a, e.basename(l)));
  }, c.toBuffer = function(l, d) {
    return Buffer.isBuffer(l) ? l : l instanceof Uint8Array ? Buffer.from(l) : typeof l == "string" ? d(l) : Buffer.alloc(0);
  }, c.readBigUInt64LE = function(a, l) {
    const d = a.readUInt32LE(l);
    return a.readUInt32LE(l + 4) * 4294967296 + d;
  }, c.writeBigUInt64LE = function(a, l, d) {
    const u = l >>> 0, f = Math.floor(l / 4294967296) >>> 0;
    a.writeUInt32LE(u, d), a.writeUInt32LE(f, d + 4);
  }, c.fromDOS2Date = function(a) {
    return new Date((a >> 25 & 127) + 1980, Math.max((a >> 21 & 15) - 1, 0), Math.max(a >> 16 & 31, 1), a >> 11 & 31, a >> 5 & 63, (a & 31) << 1);
  }, c.fromDate2DOS = function(a) {
    let l = 0, d = 0;
    return a.getFullYear() > 1979 && (l = (a.getFullYear() - 1980 & 127) << 9 | a.getMonth() + 1 << 5 | a.getDate(), d = a.getHours() << 11 | a.getMinutes() << 5 | a.getSeconds() >> 1), l << 16 | d;
  }, c.isWin = r, c.crcTable = o, _t;
}
var Nt, On;
function Di() {
  if (On) return Nt;
  On = 1;
  const t = sn;
  return Nt = function(e, { fs: n }) {
    var s = e || "", r = o(), i = null;
    function o() {
      return {
        directory: !1,
        readonly: !1,
        hidden: !1,
        executable: !1,
        mtime: 0,
        atime: 0
      };
    }
    return s && n.existsSync(s) ? (i = n.statSync(s), r.directory = i.isDirectory(), r.mtime = i.mtime, r.atime = i.atime, r.executable = (73 & i.mode) !== 0, r.readonly = (128 & i.mode) === 0, r.hidden = t.basename(s)[0] === ".") : console.warn("Invalid path: " + s), {
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
  }, Nt;
}
var Lt, Un;
function xi() {
  return Un || (Un = 1, Lt = {
    efs: !0,
    encode: (t) => Buffer.from(t, "utf8"),
    decode: (t) => t.toString("utf8")
  }), Lt;
}
var Mn;
function Je() {
  return Mn || (Mn = 1, de.exports = Ti(), de.exports.Constants = Bs(), de.exports.Errors = ln(), de.exports.FileAttr = Di(), de.exports.decoder = xi()), de.exports;
}
var ot = {}, Pt, jn;
function _i() {
  if (jn) return Pt;
  jn = 1;
  var t = Je(), e = t.Constants;
  return Pt = function() {
    var n = 20, s = 10, r = 0, i = 0, o = 0, c = 0, a = 0, l = 0, d = 0, u = 0, f = 0, p = 0, h = 0, I = 0, b = 0;
    n |= t.isWin ? 2560 : 768, r |= e.FLG_EFS;
    const C = {
      extraLen: 0
    }, A = (g) => Math.max(0, g) >>> 0, T = (g) => Math.max(0, g) & 255;
    return o = t.fromDate2DOS(/* @__PURE__ */ new Date()), {
      get made() {
        return n;
      },
      set made(g) {
        n = g;
      },
      get version() {
        return s;
      },
      set version(g) {
        s = g;
      },
      get flags() {
        return r;
      },
      set flags(g) {
        r = g;
      },
      get flags_efs() {
        return (r & e.FLG_EFS) > 0;
      },
      set flags_efs(g) {
        g ? r |= e.FLG_EFS : r &= ~e.FLG_EFS;
      },
      get flags_desc() {
        return (r & e.FLG_DESC) > 0;
      },
      set flags_desc(g) {
        g ? r |= e.FLG_DESC : r &= ~e.FLG_DESC;
      },
      get method() {
        return i;
      },
      set method(g) {
        switch (g) {
          case e.STORED:
            this.version = 10;
            break;
          case e.DEFLATED:
          default:
            this.version = 20;
        }
        i = g;
      },
      get time() {
        return t.fromDOS2Date(this.timeval);
      },
      set time(g) {
        g = new Date(g), this.timeval = t.fromDate2DOS(g);
      },
      get timeval() {
        return o;
      },
      set timeval(g) {
        o = A(g);
      },
      get timeHighByte() {
        return T(o >>> 8);
      },
      get crc() {
        return c;
      },
      set crc(g) {
        c = A(g);
      },
      get compressedSize() {
        return a;
      },
      set compressedSize(g) {
        a = A(g);
      },
      get size() {
        return l;
      },
      set size(g) {
        l = A(g);
      },
      get fileNameLength() {
        return d;
      },
      set fileNameLength(g) {
        d = g;
      },
      get extraLength() {
        return u;
      },
      set extraLength(g) {
        u = g;
      },
      get extraLocalLength() {
        return C.extraLen;
      },
      set extraLocalLength(g) {
        C.extraLen = g;
      },
      get commentLength() {
        return f;
      },
      set commentLength(g) {
        f = g;
      },
      get diskNumStart() {
        return p;
      },
      set diskNumStart(g) {
        p = A(g);
      },
      get inAttr() {
        return h;
      },
      set inAttr(g) {
        h = A(g);
      },
      get attr() {
        return I;
      },
      set attr(g) {
        I = A(g);
      },
      // get Unix file permissions
      get fileAttr() {
        return (I || 0) >> 16 & 4095;
      },
      get offset() {
        return b;
      },
      set offset(g) {
        b = A(g);
      },
      get encrypted() {
        return (r & e.FLG_ENC) === e.FLG_ENC;
      },
      get centralHeaderSize() {
        return e.CENHDR + d + u + f;
      },
      get realDataOffset() {
        return b + e.LOCHDR + C.fnameLen + C.extraLen;
      },
      get localHeader() {
        return C;
      },
      loadLocalHeaderFromBinary: function(g) {
        var m = g.slice(b, b + e.LOCHDR);
        if (m.readUInt32LE(0) !== e.LOCSIG)
          throw t.Errors.INVALID_LOC();
        C.version = m.readUInt16LE(e.LOCVER), C.flags = m.readUInt16LE(e.LOCFLG), C.flags_desc = (C.flags & e.FLG_DESC) > 0, C.method = m.readUInt16LE(e.LOCHOW), C.time = m.readUInt32LE(e.LOCTIM), C.crc = m.readUInt32LE(e.LOCCRC), C.compressedSize = m.readUInt32LE(e.LOCSIZ), C.size = m.readUInt32LE(e.LOCLEN), C.fnameLen = m.readUInt16LE(e.LOCNAM), C.extraLen = m.readUInt16LE(e.LOCEXT);
        const v = b + e.LOCHDR + C.fnameLen, y = v + C.extraLen;
        return g.slice(v, y);
      },
      loadFromBinary: function(g) {
        if (g.length !== e.CENHDR || g.readUInt32LE(0) !== e.CENSIG)
          throw t.Errors.INVALID_CEN();
        n = g.readUInt16LE(e.CENVEM), s = g.readUInt16LE(e.CENVER), r = g.readUInt16LE(e.CENFLG), i = g.readUInt16LE(e.CENHOW), o = g.readUInt32LE(e.CENTIM), c = g.readUInt32LE(e.CENCRC), a = g.readUInt32LE(e.CENSIZ), l = g.readUInt32LE(e.CENLEN), d = g.readUInt16LE(e.CENNAM), u = g.readUInt16LE(e.CENEXT), f = g.readUInt16LE(e.CENCOM), p = g.readUInt16LE(e.CENDSK), h = g.readUInt16LE(e.CENATT), I = g.readUInt32LE(e.CENATX), b = g.readUInt32LE(e.CENOFF);
      },
      localHeaderToBinary: function() {
        var g = Buffer.alloc(e.LOCHDR);
        return g.writeUInt32LE(e.LOCSIG, 0), g.writeUInt16LE(s, e.LOCVER), g.writeUInt16LE(r & ~e.FLG_DESC, e.LOCFLG), g.writeUInt16LE(i, e.LOCHOW), g.writeUInt32LE(o, e.LOCTIM), g.writeUInt32LE(c, e.LOCCRC), g.writeUInt32LE(a, e.LOCSIZ), g.writeUInt32LE(l, e.LOCLEN), g.writeUInt16LE(d, e.LOCNAM), g.writeUInt16LE(C.extraLen, e.LOCEXT), g;
      },
      centralHeaderToBinary: function() {
        var g = Buffer.alloc(e.CENHDR + d + u + f);
        return g.writeUInt32LE(e.CENSIG, 0), g.writeUInt16LE(n, e.CENVEM), g.writeUInt16LE(s, e.CENVER), g.writeUInt16LE(r & ~e.FLG_DESC, e.CENFLG), g.writeUInt16LE(i, e.CENHOW), g.writeUInt32LE(o, e.CENTIM), g.writeUInt32LE(c, e.CENCRC), g.writeUInt32LE(a, e.CENSIZ), g.writeUInt32LE(l, e.CENLEN), g.writeUInt16LE(d, e.CENNAM), g.writeUInt16LE(u, e.CENEXT), g.writeUInt16LE(f, e.CENCOM), g.writeUInt16LE(p, e.CENDSK), g.writeUInt16LE(h, e.CENATT), g.writeUInt32LE(I, e.CENATX), g.writeUInt32LE(b, e.CENOFF), g;
      },
      toJSON: function() {
        const g = function(m) {
          return m + " bytes";
        };
        return {
          made: n,
          version: s,
          flags: r,
          method: t.methodToString(i),
          time: this.time,
          crc: "0x" + c.toString(16).toUpperCase(),
          compressedSize: g(a),
          size: g(l),
          fileNameLength: g(d),
          extraLength: g(u),
          commentLength: g(f),
          diskNumStart: p,
          inAttr: h,
          attr: I,
          offset: b,
          centralHeaderSize: g(e.CENHDR + d + u + f)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, Pt;
}
var Ft, Bn;
function Ni() {
  if (Bn) return Ft;
  Bn = 1;
  var t = Je(), e = t.Constants;
  return Ft = function() {
    var n = 0, s = 0, r = 0, i = 0, o = 0;
    const c = () => n > e.EF_ZIP64_OR_16 || s > e.EF_ZIP64_OR_16 || r > e.EF_ZIP64_OR_32 || i > e.EF_ZIP64_OR_32;
    return {
      get diskEntries() {
        return n;
      },
      set diskEntries(a) {
        n = s = a;
      },
      get totalEntries() {
        return s;
      },
      set totalEntries(a) {
        s = n = a;
      },
      get size() {
        return r;
      },
      set size(a) {
        r = a;
      },
      get offset() {
        return i;
      },
      set offset(a) {
        i = a;
      },
      get commentLength() {
        return o;
      },
      set commentLength(a) {
        o = a;
      },
      get mainHeaderSize() {
        return (c() ? e.ZIP64HDR + e.END64HDR : 0) + e.ENDHDR + o;
      },
      loadFromBinary: function(a) {
        if ((a.length !== e.ENDHDR || a.readUInt32LE(0) !== e.ENDSIG) && (a.length < e.ZIP64HDR || a.readUInt32LE(0) !== e.ZIP64SIG))
          throw t.Errors.INVALID_END();
        a.readUInt32LE(0) === e.ENDSIG ? (n = a.readUInt16LE(e.ENDSUB), s = a.readUInt16LE(e.ENDTOT), r = a.readUInt32LE(e.ENDSIZ), i = a.readUInt32LE(e.ENDOFF), o = a.readUInt16LE(e.ENDCOM)) : (n = t.readBigUInt64LE(a, e.ZIP64SUB), s = t.readBigUInt64LE(a, e.ZIP64TOT), r = t.readBigUInt64LE(a, e.ZIP64SIZB), i = t.readBigUInt64LE(a, e.ZIP64OFF), o = 0);
      },
      toBinary: function() {
        if (!c()) {
          var a = Buffer.alloc(e.ENDHDR + o);
          return a.writeUInt32LE(e.ENDSIG, 0), a.writeUInt32LE(0, 4), a.writeUInt16LE(n, e.ENDSUB), a.writeUInt16LE(s, e.ENDTOT), a.writeUInt32LE(r, e.ENDSIZ), a.writeUInt32LE(i, e.ENDOFF), a.writeUInt16LE(o, e.ENDCOM), a.fill(" ", e.ENDHDR), a;
        }
        var a = Buffer.alloc(this.mainHeaderSize);
        let l = 0;
        a.writeUInt32LE(e.ZIP64SIG, l), t.writeBigUInt64LE(a, e.ZIP64HDR - e.ZIP64LEAD, l + e.ZIP64SIZE), a.writeUInt16LE(45, l + e.ZIP64VEM), a.writeUInt16LE(45, l + e.ZIP64VER), a.writeUInt32LE(0, l + e.ZIP64DSK), a.writeUInt32LE(0, l + e.ZIP64DSKDIR), t.writeBigUInt64LE(a, n, l + e.ZIP64SUB), t.writeBigUInt64LE(a, s, l + e.ZIP64TOT), t.writeBigUInt64LE(a, r, l + e.ZIP64SIZB), t.writeBigUInt64LE(a, i, l + e.ZIP64OFF);
        const d = i + r;
        return l += e.ZIP64HDR, a.writeUInt32LE(e.END64SIG, l), a.writeUInt32LE(0, l + e.END64START), t.writeBigUInt64LE(a, d, l + e.END64OFF), a.writeUInt32LE(1, l + e.END64NUMDISKS), l += e.END64HDR, a.writeUInt32LE(e.ENDSIG, l), a.writeUInt32LE(0, l + 4), a.writeUInt16LE(Math.min(n, e.EF_ZIP64_OR_16), l + e.ENDSUB), a.writeUInt16LE(Math.min(s, e.EF_ZIP64_OR_16), l + e.ENDTOT), a.writeUInt32LE(Math.min(r, e.EF_ZIP64_OR_32), l + e.ENDSIZ), a.writeUInt32LE(Math.min(i, e.EF_ZIP64_OR_32), l + e.ENDOFF), a.writeUInt16LE(o, l + e.ENDCOM), a.fill(" ", l + e.ENDHDR), a;
      },
      toJSON: function() {
        const a = function(l, d) {
          let u = l.toString(16).toUpperCase();
          for (; u.length < d; ) u = "0" + u;
          return "0x" + u;
        };
        return {
          diskEntries: n,
          totalEntries: s,
          size: r + " bytes",
          offset: a(i, 4),
          commentLength: o
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, Ft;
}
var Kn;
function Ks() {
  return Kn || (Kn = 1, ot.EntryHeader = _i(), ot.MainHeader = Ni()), ot;
}
var Me = {}, Ot, Gn;
function Li() {
  return Gn || (Gn = 1, Ot = function(t) {
    var e = _s, n = { chunkSize: (parseInt(t.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return e.deflateRawSync(t, n);
      },
      deflateAsync: function(s) {
        var r = e.createDeflateRaw(n), i = [], o = 0;
        r.on("data", function(c) {
          i.push(c), o += c.length;
        }), r.on("end", function() {
          var c = Buffer.alloc(o), a = 0;
          c.fill(0);
          for (var l = 0; l < i.length; l++) {
            var d = i[l];
            d.copy(c, a), a += d.length;
          }
          s && s(c);
        }), r.end(t);
      }
    };
  }), Ot;
}
var Ut, zn;
function Pi() {
  var e;
  if (zn) return Ut;
  zn = 1;
  const t = +(((e = process == null ? void 0 : process.versions) == null ? void 0 : e.node) ?? "").split(".")[0] || 0;
  return Ut = function(n, s) {
    var r = _s;
    const i = t >= 15 && s > 0 ? { maxOutputLength: s } : {};
    return {
      inflate: function() {
        return r.inflateRawSync(n, i);
      },
      inflateAsync: function(o) {
        var c = r.createInflateRaw(i), a = [], l = 0;
        c.on("data", function(d) {
          a.push(d), l += d.length;
        }), c.on("end", function() {
          var d = Buffer.alloc(l), u = 0;
          d.fill(0);
          for (var f = 0; f < a.length; f++) {
            var p = a[f];
            p.copy(d, u), u += p.length;
          }
          o && o(d);
        }), c.end(n);
      }
    };
  }, Ut;
}
var Mt, Hn;
function Fi() {
  if (Hn) return Mt;
  Hn = 1;
  const { randomFillSync: t } = fi, e = ln(), n = new Uint32Array(256).map((p, h) => {
    for (let I = 0; I < 8; I++)
      (h & 1) !== 0 ? h = h >>> 1 ^ 3988292384 : h >>>= 1;
    return h >>> 0;
  }), s = (p, h) => Math.imul(p, h) >>> 0, r = (p, h) => n[(p ^ h) & 255] ^ p >>> 8, i = () => typeof t == "function" ? t(Buffer.alloc(12)) : i.node();
  i.node = () => {
    const p = Buffer.alloc(12), h = p.length;
    for (let I = 0; I < h; I++) p[I] = Math.random() * 256 & 255;
    return p;
  };
  const o = {
    genSalt: i
  };
  function c(p) {
    const h = Buffer.isBuffer(p) ? p : Buffer.from(p);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let I = 0; I < h.length; I++)
      this.updateKeys(h[I]);
  }
  c.prototype.updateKeys = function(p) {
    const h = this.keys;
    return h[0] = r(h[0], p), h[1] += h[0] & 255, h[1] = s(h[1], 134775813) + 1, h[2] = r(h[2], h[1] >>> 24), p;
  }, c.prototype.next = function() {
    const p = (this.keys[2] | 2) >>> 0;
    return s(p, p ^ 1) >> 8 & 255;
  };
  function a(p) {
    const h = new c(p);
    return function(I) {
      const b = Buffer.alloc(I.length);
      let C = 0;
      for (let A of I)
        b[C++] = h.updateKeys(A ^ h.next());
      return b;
    };
  }
  function l(p) {
    const h = new c(p);
    return function(I, b, C = 0) {
      b || (b = Buffer.alloc(I.length));
      for (let A of I) {
        const T = h.next();
        b[C++] = A ^ T, h.updateKeys(A);
      }
      return b;
    };
  }
  function d(p, h, I) {
    if (!p || !Buffer.isBuffer(p) || p.length < 12)
      return Buffer.alloc(0);
    const b = a(I), C = b(p.slice(0, 12)), A = (h.flags & 8) === 8 ? h.timeHighByte : h.crc >>> 24;
    if (C[11] !== A)
      throw e.WRONG_PASSWORD();
    return b(p.slice(12));
  }
  function u(p) {
    Buffer.isBuffer(p) && p.length >= 12 ? o.genSalt = function() {
      return p.slice(0, 12);
    } : p === "node" ? o.genSalt = i.node : o.genSalt = i;
  }
  function f(p, h, I, b = !1) {
    p == null && (p = Buffer.alloc(0)), Buffer.isBuffer(p) || (p = Buffer.from(p.toString()));
    const C = l(I), A = o.genSalt();
    A[11] = h.crc >>> 24 & 255, b && (A[10] = h.crc >>> 16 & 255);
    const T = Buffer.alloc(p.length + 12);
    return C(A, T), C(p, T, 12);
  }
  return Mt = { decrypt: d, encrypt: f, _salter: u }, Mt;
}
var Zn;
function Oi() {
  return Zn || (Zn = 1, Me.Deflater = Li(), Me.Inflater = Pi(), Me.ZipCrypto = Fi()), Me;
}
var jt, Vn;
function Gs() {
  if (Vn) return jt;
  Vn = 1;
  var t = Je(), e = Ks(), n = t.Constants, s = Oi();
  return jt = function(r, i) {
    var o = new e.EntryHeader(), c = Buffer.alloc(0), a = Buffer.alloc(0), l = !1, d = null, u = Buffer.alloc(0), f = Buffer.alloc(0), p = !0;
    const h = r, I = typeof h.decoder == "object" ? h.decoder : t.decoder;
    p = I.hasOwnProperty("efs") ? I.efs : !1;
    function b() {
      return !i || !(i instanceof Uint8Array) ? Buffer.alloc(0) : (f = o.loadLocalHeaderFromBinary(i), i.slice(o.realDataOffset, o.realDataOffset + o.compressedSize));
    }
    function C(y) {
      if (!o.flags_desc && !o.localHeader.flags_desc) {
        if (t.crc32(y) !== o.localHeader.crc)
          return !1;
      } else {
        const w = {}, E = o.realDataOffset + o.compressedSize;
        if (i.readUInt32LE(E) == n.LOCSIG || i.readUInt32LE(E) == n.CENSIG)
          throw t.Errors.DESCRIPTOR_NOT_EXIST();
        if (i.readUInt32LE(E) == n.EXTSIG)
          w.crc = i.readUInt32LE(E + n.EXTCRC), w.compressedSize = i.readUInt32LE(E + n.EXTSIZ), w.size = i.readUInt32LE(E + n.EXTLEN);
        else if (i.readUInt16LE(E + 12) === 19280)
          w.crc = i.readUInt32LE(E + n.EXTCRC - 4), w.compressedSize = i.readUInt32LE(E + n.EXTSIZ - 4), w.size = i.readUInt32LE(E + n.EXTLEN - 4);
        else
          throw t.Errors.DESCRIPTOR_UNKNOWN();
        if (w.compressedSize !== o.compressedSize || w.size !== o.size || w.crc !== o.crc)
          throw t.Errors.DESCRIPTOR_FAULTY();
        if (t.crc32(y) !== w.crc)
          return !1;
      }
      return !0;
    }
    function A(y, w, E) {
      if (typeof w > "u" && typeof y == "string" && (E = y, y = void 0), l)
        return y && w && w(Buffer.alloc(0), t.Errors.DIRECTORY_CONTENT_ERROR()), Buffer.alloc(0);
      var k = b();
      if (k.length === 0)
        return y && w && w(k), k;
      if (o.encrypted) {
        if (typeof E != "string" && !Buffer.isBuffer(E))
          throw t.Errors.INVALID_PASS_PARAM();
        k = s.ZipCrypto.decrypt(k, o, E);
      }
      var $ = Buffer.alloc(o.size);
      switch (o.method) {
        case t.Constants.STORED:
          if (k.copy($), C($))
            return y && w && w($), $;
          throw y && w && w($, t.Errors.BAD_CRC()), t.Errors.BAD_CRC();
        case t.Constants.DEFLATED:
          var U = new s.Inflater(k, o.size);
          if (y)
            U.inflateAsync(function(D) {
              D.copy(D, 0), w && (C(D) ? w(D) : w(D, t.Errors.BAD_CRC()));
            });
          else {
            if (U.inflate($).copy($, 0), !C($))
              throw t.Errors.BAD_CRC(`"${I.decode(c)}"`);
            return $;
          }
          break;
        default:
          throw y && w && w(Buffer.alloc(0), t.Errors.UNKNOWN_METHOD()), t.Errors.UNKNOWN_METHOD();
      }
    }
    function T(y, w) {
      if ((!d || !d.length) && Buffer.isBuffer(i))
        return y && w && w(b()), b();
      if (d.length && !l) {
        var E;
        switch (o.method) {
          case t.Constants.STORED:
            return o.compressedSize = o.size, E = Buffer.alloc(d.length), d.copy(E), y && w && w(E), E;
          default:
          case t.Constants.DEFLATED:
            var k = new s.Deflater(d);
            if (y)
              k.deflateAsync(function(U) {
                E = Buffer.alloc(U.length), o.compressedSize = U.length, U.copy(E), w && w(E);
              });
            else {
              var $ = k.deflate();
              return o.compressedSize = $.length, $;
            }
            k = null;
            break;
        }
      } else if (y && w)
        w(Buffer.alloc(0));
      else
        return Buffer.alloc(0);
    }
    function g(y, w) {
      return t.readBigUInt64LE(y, w);
    }
    function m(y) {
      try {
        for (var w = 0, E, k, $; w + 4 < y.length; )
          E = y.readUInt16LE(w), w += 2, k = y.readUInt16LE(w), w += 2, $ = y.slice(w, w + k), w += k, n.ID_ZIP64 === E && v($);
      } catch {
        throw t.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function v(y) {
      var w, E, k, $;
      y.length >= n.EF_ZIP64_SCOMP && (w = g(y, n.EF_ZIP64_SUNCOMP), o.size === n.EF_ZIP64_OR_32 && (o.size = w)), y.length >= n.EF_ZIP64_RHO && (E = g(y, n.EF_ZIP64_SCOMP), o.compressedSize === n.EF_ZIP64_OR_32 && (o.compressedSize = E)), y.length >= n.EF_ZIP64_DSN && (k = g(y, n.EF_ZIP64_RHO), o.offset === n.EF_ZIP64_OR_32 && (o.offset = k)), y.length >= n.EF_ZIP64_DSN + 4 && ($ = y.readUInt32LE(n.EF_ZIP64_DSN), o.diskNumStart === n.EF_ZIP64_OR_16 && (o.diskNumStart = $));
    }
    return {
      get entryName() {
        return I.decode(c);
      },
      get rawEntryName() {
        return c;
      },
      set entryName(y) {
        c = t.toBuffer(y, I.encode);
        var w = c[c.length - 1];
        l = w === 47 || w === 92, o.fileNameLength = c.length;
      },
      get efs() {
        return typeof p == "function" ? p(this.entryName) : p;
      },
      get extra() {
        return u;
      },
      set extra(y) {
        u = y, o.extraLength = y.length, m(y);
      },
      get comment() {
        return I.decode(a);
      },
      set comment(y) {
        if (a = t.toBuffer(y, I.encode), o.commentLength = a.length, a.length > 65535) throw t.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var y = I.decode(c);
        return l ? y.substr(y.length - 1).split("/").pop() : y.split("/").pop();
      },
      get isDirectory() {
        return l;
      },
      getCompressedData: function() {
        return T(!1, null);
      },
      getCompressedDataAsync: function(y) {
        T(!0, y);
      },
      setData: function(y) {
        d = t.toBuffer(y, t.decoder.encode), !l && d.length ? (o.size = d.length, o.method = t.Constants.DEFLATED, o.crc = t.crc32(y), o.changed = !0) : o.method = t.Constants.STORED;
      },
      getData: function(y) {
        return o.changed ? d : A(!1, null, y);
      },
      getDataAsync: function(y, w) {
        o.changed ? y(d) : A(!0, y, w);
      },
      set attr(y) {
        o.attr = y;
      },
      get attr() {
        return o.attr;
      },
      set header(y) {
        o.loadFromBinary(y);
      },
      get header() {
        return o;
      },
      packCentralHeader: function() {
        o.flags_efs = this.efs, o.extraLength = u.length;
        var y = o.centralHeaderToBinary(), w = t.Constants.CENHDR;
        return c.copy(y, w), w += c.length, u.copy(y, w), w += o.extraLength, a.copy(y, w), y;
      },
      packLocalHeader: function() {
        let y = 0;
        o.flags_efs = this.efs, o.extraLocalLength = f.length;
        const w = o.localHeaderToBinary(), E = Buffer.alloc(w.length + c.length + o.extraLocalLength);
        return w.copy(E, y), y += w.length, c.copy(E, y), y += c.length, f.copy(E, y), y += f.length, E;
      },
      toJSON: function() {
        const y = function(w) {
          return "<" + (w && w.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: o.toJSON(),
          compressedData: y(i),
          data: y(d)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, jt;
}
var Bt, qn;
function Ui() {
  if (qn) return Bt;
  qn = 1;
  const t = Gs(), e = Ks(), n = Je();
  return Bt = function(s, r) {
    var i = [], o = {}, c = Buffer.alloc(0), a = new e.MainHeader(), l = !1;
    const d = /* @__PURE__ */ new Set(), u = r, { noSort: f, decoder: p } = u;
    s ? b(u.readEntries) : l = !0;
    function h() {
      const A = /* @__PURE__ */ new Set();
      for (const T of Object.keys(o)) {
        const g = T.split("/");
        if (g.pop(), !!g.length)
          for (let m = 0; m < g.length; m++) {
            const v = g.slice(0, m + 1).join("/") + "/";
            A.add(v);
          }
      }
      for (const T of A)
        if (!(T in o)) {
          const g = new t(u);
          g.entryName = T, g.attr = 16, g.temporary = !0, i.push(g), o[g.entryName] = g, d.add(g);
        }
    }
    function I() {
      if (l = !0, o = {}, a.diskEntries > (s.length - a.offset) / n.Constants.CENHDR)
        throw n.Errors.DISK_ENTRY_TOO_LARGE();
      i = new Array(a.diskEntries);
      for (var A = a.offset, T = 0; T < i.length; T++) {
        var g = A, m = new t(u, s);
        m.header = s.slice(g, g += n.Constants.CENHDR), m.entryName = s.slice(g, g += m.header.fileNameLength), m.header.extraLength && (m.extra = s.slice(g, g += m.header.extraLength)), m.header.commentLength && (m.comment = s.slice(g, g + m.header.commentLength)), A += m.header.centralHeaderSize, i[T] = m, o[m.entryName] = m;
      }
      d.clear(), h();
    }
    function b(A) {
      var T = s.length - n.Constants.ENDHDR, g = Math.max(0, T - 65535), m = g, v = s.length, y = -1, w = 0;
      for ((typeof u.trailingSpace == "boolean" ? u.trailingSpace : !1) && (g = 0), T; T >= m; T--)
        if (s[T] === 80) {
          if (s.readUInt32LE(T) === n.Constants.ENDSIG) {
            y = T, w = T, v = T + n.Constants.ENDHDR, m = T - n.Constants.END64HDR;
            continue;
          }
          if (s.readUInt32LE(T) === n.Constants.END64SIG) {
            m = g;
            continue;
          }
          if (s.readUInt32LE(T) === n.Constants.ZIP64SIG) {
            y = T, v = T + n.readBigUInt64LE(s, T + n.Constants.ZIP64SIZE) + n.Constants.ZIP64LEAD;
            break;
          }
        }
      if (y == -1) throw n.Errors.INVALID_FORMAT();
      a.loadFromBinary(s.slice(y, v)), a.commentLength && (c = s.slice(w + n.Constants.ENDHDR)), A && I();
    }
    function C() {
      i.length > 1 && !f && i.sort((A, T) => A.entryName.toLowerCase().localeCompare(T.entryName.toLowerCase()));
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        return l || I(), i.filter((A) => !d.has(A));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return p.decode(c);
      },
      set comment(A) {
        c = n.toBuffer(A, p.encode), a.commentLength = c.length;
      },
      getEntryCount: function() {
        return l ? i.length : a.diskEntries;
      },
      forEach: function(A) {
        this.entries.forEach(A);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(A) {
        return l || I(), o[A] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(A) {
        l || I(), i.push(A), o[A.entryName] = A, a.totalEntries = i.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(A, T = !0) {
        l || I();
        const g = o[A];
        this.getEntryChildren(g, T).map((v) => v.entryName).forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(A) {
        l || I();
        const T = o[A], g = i.indexOf(T);
        g >= 0 && (i.splice(g, 1), delete o[A], a.totalEntries = i.length);
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(A, T = !0) {
        if (l || I(), typeof A == "object")
          if (A.isDirectory && T) {
            const g = [], m = A.entryName;
            for (const v of i)
              v.entryName.startsWith(m) && g.push(v);
            return g;
          } else
            return [A];
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(A) {
        if (A && A.isDirectory) {
          const T = this.getEntryChildren(A);
          return T.includes(A) ? T.length - 1 : T.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        l || I(), C();
        const A = [], T = [];
        let g = 0, m = 0;
        a.size = 0, a.offset = 0;
        let v = 0;
        for (const E of this.entries) {
          const k = E.getCompressedData();
          E.header.offset = m;
          const $ = E.packLocalHeader(), U = $.length + k.length;
          m += U, A.push($), A.push(k);
          const D = E.packCentralHeader();
          T.push(D), a.size += D.length, g += U + D.length, v++;
        }
        g += a.mainHeaderSize, a.offset = m, a.totalEntries = v, m = 0;
        const y = Buffer.alloc(g);
        for (const E of A)
          E.copy(y, m), m += E.length;
        for (const E of T)
          E.copy(y, m), m += E.length;
        const w = a.toBinary();
        return c && c.copy(w, w.length - c.length), w.copy(y, m), s = y, l = !1, y;
      },
      toAsyncBuffer: function(A, T, g, m) {
        try {
          l || I(), C();
          const v = [], y = [];
          let w = 0, E = 0, k = 0;
          a.size = 0, a.offset = 0;
          const $ = function(U) {
            if (U.length > 0) {
              const D = U.shift(), x = D.entryName + D.extra.toString();
              g && g(x), D.getCompressedDataAsync(function(O) {
                m && m(x), D.header.offset = E;
                const M = D.packLocalHeader(), K = M.length + O.length;
                E += K, v.push(M), v.push(O);
                const G = D.packCentralHeader();
                y.push(G), a.size += G.length, w += K + G.length, k++, $(U);
              });
            } else {
              w += a.mainHeaderSize, a.offset = E, a.totalEntries = k, E = 0;
              const D = Buffer.alloc(w);
              v.forEach(function(O) {
                O.copy(D, E), E += O.length;
              }), y.forEach(function(O) {
                O.copy(D, E), E += O.length;
              });
              const x = a.toBinary();
              c && c.copy(x, x.length - c.length), x.copy(D, E), s = D, l = !1, A(D);
            }
          };
          $(Array.from(this.entries));
        } catch (v) {
          T(v);
        }
      }
    };
  }, Bt;
}
var Kt, Wn;
function Mi() {
  if (Wn) return Kt;
  Wn = 1;
  const t = Je(), e = sn, n = Gs(), s = Ui(), r = (...a) => t.findLast(a, (l) => typeof l == "boolean"), i = (...a) => t.findLast(a, (l) => typeof l == "string"), o = (...a) => t.findLast(a, (l) => typeof l == "function"), c = {
    // option "noSort" : if true it disables files sorting
    noSort: !1,
    // read entries during load (initial loading may be slower)
    readEntries: !1,
    // default method is none
    method: t.Constants.NONE,
    // file system
    fs: null
  };
  return Kt = function(a, l) {
    let d = null;
    const u = Object.assign(/* @__PURE__ */ Object.create(null), c);
    a && typeof a == "object" && (a instanceof Uint8Array || (Object.assign(u, a), a = u.input ? u.input : void 0, u.input && delete u.input), Buffer.isBuffer(a) && (d = a, u.method = t.Constants.BUFFER, a = void 0)), Object.assign(u, l);
    const f = new t(u);
    if ((typeof u.decoder != "object" || typeof u.decoder.encode != "function" || typeof u.decoder.decode != "function") && (u.decoder = t.decoder), a && typeof a == "string")
      if (f.fs.existsSync(a))
        u.method = t.Constants.FILE, u.filename = a, d = f.fs.readFileSync(a);
      else
        throw t.Errors.INVALID_FILENAME();
    const p = new s(d, u), { canonical: h, sanitize: I, zipnamefix: b } = t;
    function C(m) {
      if (m && p) {
        var v;
        if (typeof m == "string" && (v = p.getEntry(e.posix.normalize(m))), typeof m == "object" && typeof m.entryName < "u" && typeof m.header < "u" && (v = p.getEntry(m.entryName)), v)
          return v;
      }
      return null;
    }
    function A(m) {
      const { join: v, normalize: y, sep: w } = e.posix;
      return v(e.isAbsolute(m) ? "/" : ".", y(w + m.split("\\").join(w) + w));
    }
    function T(m) {
      return m instanceof RegExp ? /* @__PURE__ */ (function(v) {
        return function(y) {
          return v.test(y);
        };
      })(m) : typeof m != "function" ? () => !0 : m;
    }
    const g = (m, v) => {
      let y = v.slice(-1);
      return y = y === f.sep ? f.sep : "", e.relative(m, v) + y;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(m, v) {
        var y = C(m);
        return y && y.getData(v) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(m) {
        const v = C(m);
        if (v)
          return p.getChildCount(v);
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(m, v) {
        var y = C(m);
        y ? y.getDataAsync(v) : v(null, "getEntry failed for:" + m);
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(m, v) {
        var y = C(m);
        if (y) {
          var w = y.getData();
          if (w && w.length)
            return w.toString(v || "utf8");
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
      readAsTextAsync: function(m, v, y) {
        var w = C(m);
        w ? w.getDataAsync(function(E, k) {
          if (k) {
            v(E, k);
            return;
          }
          E && E.length ? v(E.toString(y || "utf8")) : v("");
        }) : v("");
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(m, v = !0) {
        var y = C(m);
        y && p.deleteFile(y.entryName, v);
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(m) {
        var v = C(m);
        v && p.deleteEntry(v.entryName);
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(m) {
        p.comment = m;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return p.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(m, v) {
        var y = C(m);
        y && (y.comment = v);
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(m) {
        var v = C(m);
        return v && v.comment || "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(m, v) {
        var y = C(m);
        y && y.setData(v);
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(m, v, y, w) {
        if (f.fs.existsSync(m)) {
          v = v ? A(v) : "";
          const E = e.win32.basename(e.win32.normalize(m));
          v += y || E;
          const k = f.fs.statSync(m), $ = k.isFile() ? f.fs.readFileSync(m) : Buffer.alloc(0);
          k.isDirectory() && (v += f.sep), this.addFile(v, $, w, k);
        } else
          throw t.Errors.FILE_NOT_FOUND(m);
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
      addLocalFileAsync: function(m, v) {
        m = typeof m == "object" ? m : { localPath: m };
        const y = e.resolve(m.localPath), { comment: w } = m;
        let { zipPath: E, zipName: k } = m;
        const $ = this;
        f.fs.stat(y, function(U, D) {
          if (U) return v(U, !1);
          E = E ? A(E) : "";
          const x = e.win32.basename(e.win32.normalize(y));
          if (E += k || x, D.isFile())
            f.fs.readFile(y, function(O, M) {
              return O ? v(O, !1) : ($.addFile(E, M, w, D), setImmediate(v, void 0, !0));
            });
          else if (D.isDirectory())
            return E += f.sep, $.addFile(E, Buffer.alloc(0), w, D), setImmediate(v, void 0, !0);
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(m, v, y) {
        if (y = T(y), v = v ? A(v) : "", m = e.normalize(m), f.fs.existsSync(m)) {
          const w = f.findFiles(m), E = this;
          if (w.length)
            for (const k of w) {
              const $ = e.join(v, g(m, k));
              y($) && E.addLocalFile(k, e.dirname($));
            }
        } else
          throw t.Errors.FILE_NOT_FOUND(m);
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(m, v, y, w) {
        w = T(w), y = y ? A(y) : "", m = e.normalize(m);
        var E = this;
        f.fs.open(m, "r", function(k) {
          if (k && k.code === "ENOENT")
            v(void 0, t.Errors.FILE_NOT_FOUND(m));
          else if (k)
            v(void 0, k);
          else {
            var $ = f.findFiles(m), U = -1, D = function() {
              if (U += 1, U < $.length) {
                var x = $[U], O = g(m, x).split("\\").join("/");
                O = O.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""), w(O) ? f.fs.stat(x, function(M, K) {
                  M && v(void 0, M), K.isFile() ? f.fs.readFile(x, function(G, B) {
                    G ? v(void 0, G) : (E.addFile(y + O, B, "", K), D());
                  }) : (E.addFile(y + O + "/", Buffer.alloc(0), "", K), D());
                }) : process.nextTick(() => {
                  D();
                });
              } else
                v(!0, void 0);
            };
            D();
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
      addLocalFolderAsync2: function(m, v) {
        const y = this;
        m = typeof m == "object" ? m : { localPath: m };
        const w = e.resolve(A(m.localPath));
        let { zipPath: E, filter: k, namefix: $ } = m;
        k instanceof RegExp ? k = /* @__PURE__ */ (function(x) {
          return function(O) {
            return x.test(O);
          };
        })(k) : typeof k != "function" && (k = function() {
          return !0;
        }), E = E ? A(E) : "", $ === "latin1" && ($ = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "")), typeof $ != "function" && ($ = (x) => x);
        const U = (x) => e.join(E, $(g(w, x))), D = (x) => e.win32.basename(e.win32.normalize($(x)));
        f.fs.open(w, "r", function(x) {
          x && x.code === "ENOENT" ? v(void 0, t.Errors.FILE_NOT_FOUND(w)) : x ? v(void 0, x) : f.findFilesAsync(w, function(O, M) {
            if (O) return v(O);
            M = M.filter((K) => k(U(K))), M.length || v(void 0, !1), setImmediate(
              M.reverse().reduce(function(K, G) {
                return function(B, V) {
                  if (B || V === !1) return setImmediate(K, B, !1);
                  y.addLocalFileAsync(
                    {
                      localPath: G,
                      zipPath: e.dirname(U(G)),
                      zipName: D(G)
                    },
                    K
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
      addLocalFolderPromise: function(m, v) {
        return new Promise((y, w) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: m }, v), (E, k) => {
            E && w(E), k && y(this);
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
      addFile: function(m, v, y, w) {
        m = b(m);
        let E = C(m);
        const k = E != null;
        k || (E = new n(u), E.entryName = m), E.comment = y || "";
        const $ = typeof w == "object" && w instanceof f.fs.Stats;
        $ && (E.header.time = w.mtime);
        var U = E.isDirectory ? 16 : 0;
        let D = E.isDirectory ? 16384 : 32768;
        return $ ? D |= 4095 & w.mode : typeof w == "number" ? D |= 4095 & w : D |= E.isDirectory ? 493 : 420, U = (U | D << 16) >>> 0, E.attr = U, E.setData(v), k || p.setEntry(E), E;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(m) {
        return p.password = m, p ? p.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(m) {
        return C(m);
      },
      getEntryCount: function() {
        return p.getEntryCount();
      },
      forEach: function(m) {
        return p.forEach(m);
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
      extractEntryTo: function(m, v, y, w, E, k) {
        w = r(!1, w), E = r(!1, E), y = r(!0, y), k = i(E, k);
        var $ = C(m);
        if (!$)
          throw t.Errors.NO_ENTRY();
        var U = h($.entryName), D = I(v, k && !$.isDirectory ? h(k) : y ? U : e.basename(U));
        if ($.isDirectory) {
          var x = p.getEntryChildren($);
          return x.forEach(function(K) {
            if (K.isDirectory) return;
            var G = K.getData();
            if (!G)
              throw t.Errors.CANT_EXTRACT_FILE();
            var B = h(K.entryName), V = I(v, y ? B : e.basename(B));
            const J = E ? K.header.fileAttr : void 0;
            f.writeFileTo(V, G, w, J);
          }), !0;
        }
        var O = $.getData(p.password);
        if (!O) throw t.Errors.CANT_EXTRACT_FILE();
        if (f.fs.existsSync(D) && !w)
          throw t.Errors.CANT_OVERRIDE();
        const M = E ? m.header.fileAttr : void 0;
        return f.writeFileTo(D, O, w, M), !0;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(m) {
        if (!p)
          return !1;
        for (var v of p.entries)
          try {
            if (v.isDirectory)
              continue;
            var y = p.entries[v].getData(m);
            if (!y)
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
      extractAllTo: function(m, v, y, w) {
        if (y = r(!1, y), w = i(y, w), v = r(!1, v), !p) throw t.Errors.NO_ZIP();
        p.entries.forEach(function(E) {
          var k = I(m, h(E.entryName));
          if (E.isDirectory) {
            f.makeDir(k);
            return;
          }
          var $ = E.getData(w);
          if (!$)
            throw t.Errors.CANT_EXTRACT_FILE();
          const U = y ? E.header.fileAttr : void 0;
          f.writeFileTo(k, $, v, U);
          try {
            f.fs.utimesSync(k, E.header.time, E.header.time);
          } catch {
            throw t.Errors.CANT_EXTRACT_FILE();
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
      extractAllToAsync: function(m, v, y, w) {
        if (w = o(v, y, w), y = r(!1, y), v = r(!1, v), !w)
          return new Promise((D, x) => {
            this.extractAllToAsync(m, v, y, function(O) {
              O ? x(O) : D(this);
            });
          });
        if (!p) {
          w(t.Errors.NO_ZIP());
          return;
        }
        m = e.resolve(m);
        const E = (D) => I(m, e.normalize(h(D.entryName))), k = (D, x) => new Error(D + ': "' + x + '"'), $ = [], U = [];
        p.entries.forEach((D) => {
          D.isDirectory ? $.push(D) : U.push(D);
        });
        for (const D of $) {
          const x = E(D), O = y ? D.header.fileAttr : void 0;
          try {
            f.makeDir(x), O && f.fs.chmodSync(x, O), f.fs.utimesSync(x, D.header.time, D.header.time);
          } catch {
            w(k("Unable to create folder", x));
          }
        }
        U.reverse().reduce(function(D, x) {
          return function(O) {
            if (O)
              D(O);
            else {
              const M = e.normalize(h(x.entryName)), K = I(m, M);
              x.getDataAsync(function(G, B) {
                if (B)
                  D(B);
                else if (!G)
                  D(t.Errors.CANT_EXTRACT_FILE());
                else {
                  const V = y ? x.header.fileAttr : void 0;
                  f.writeFileToAsync(K, G, v, V, function(J) {
                    J || D(k("Unable to write file", K)), f.fs.utimes(K, x.header.time, x.header.time, function(we) {
                      we ? D(k("Unable to set times", K)) : D();
                    });
                  });
                }
              });
            }
          };
        }, w)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(m, v) {
        if (arguments.length === 1 && typeof m == "function" && (v = m, m = ""), !m && u.filename && (m = u.filename), !!m) {
          var y = p.compressToBuffer();
          if (y) {
            var w = f.writeFileTo(m, y, !0);
            typeof v == "function" && v(w ? null : new Error("failed"), "");
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
      writeZipPromise: function(m, v) {
        const { overwrite: y, perm: w } = Object.assign({ overwrite: !0 }, v);
        return new Promise((E, k) => {
          !m && u.filename && (m = u.filename), m || k("ADM-ZIP: ZIP File Name Missing"), this.toBufferPromise().then(($) => {
            const U = (D) => D ? E(D) : k("ADM-ZIP: Wasn't able to write zip file");
            f.writeFileToAsync(m, $, y, w, U);
          }, k);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((m, v) => {
          p.toAsyncBuffer(m, v);
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
      toBuffer: function(m, v, y, w) {
        return typeof m == "function" ? (p.toAsyncBuffer(m, v, y, w), null) : p.compressToBuffer();
      }
    };
  }, Kt;
}
var ji = Mi();
const zs = /* @__PURE__ */ $i(ji), Bi = /KRC-(\d{4})/gi, Ki = /## ChatGPT Conversation ID\s*\n([^\n]+)/, Gi = [
  "VIGS",
  "Founder_OS",
  "Axiom",
  "Book",
  "Knowledge_Recovery",
  "Source_Material",
  "Technical_Build",
  "Other_Review_Needed"
];
async function fn(t) {
  const e = [];
  let n;
  try {
    n = await R.readdir(t, { withFileTypes: !0 });
  } catch {
    return e;
  }
  for (const s of n) {
    const r = S.join(t, s.name);
    s.isDirectory() ? e.push(...await fn(r)) : s.name.endsWith(".md") && e.push(r);
  }
  return e;
}
async function St(t) {
  let e = 0;
  const n = S.join(t, "Sources"), s = await fn(n);
  for (const i of s) {
    const c = S.basename(i).match(/KRC-(\d{4})/i);
    c && (e = Math.max(e, parseInt(c[1], 10)));
  }
  const r = S.join(t, "Registries", "SOURCE_REGISTRY.md");
  try {
    const i = await R.readFile(r, "utf8");
    for (const o of i.matchAll(Bi))
      e = Math.max(e, parseInt(o[1], 10));
  } catch {
  }
  return e;
}
function Et(t) {
  return `KRC-${String(t).padStart(4, "0")}`;
}
function Xe(t) {
  return t.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 80) || "Untitled";
}
async function mn(t) {
  const e = /* @__PURE__ */ new Map(), n = S.join(t, "Sources"), s = await fn(n);
  for (const r of s) {
    const o = S.basename(r).match(/^(KRC-\d{4})/i);
    if (!o)
      continue;
    const a = (await R.readFile(r, "utf8")).match(Ki);
    a && e.set(a[1].trim(), o[1].toUpperCase());
  }
  return e;
}
async function Hs(t) {
  await R.mkdir(S.join(t, "Sources"), { recursive: !0 }), await R.mkdir(S.join(t, "Uploads"), { recursive: !0 }), await R.mkdir(S.join(t, "Registries"), { recursive: !0 }), await R.mkdir(S.join(t, "ExecutiveSessions"), { recursive: !0 });
  for (const e of Gi)
    await R.mkdir(S.join(t, "Sources", e), { recursive: !0 }), await R.mkdir(S.join(t, "ExecutiveSessions", e), { recursive: !0 });
}
async function Yn(t, e, n) {
  await R.mkdir(S.dirname(t), { recursive: !0 });
  try {
    return await R.access(t), n ? (await R.writeFile(t, e, "utf8"), "updated") : "skipped";
  } catch {
    return await R.writeFile(t, e, "utf8"), "created";
  }
}
async function zi(t, e, n) {
  await R.mkdir(S.dirname(t), { recursive: !0 });
  try {
    return await R.access(t), n ? (await R.writeFile(t, e), "updated") : "skipped";
  } catch {
    return await R.writeFile(t, e), "created";
  }
}
function Hi(t) {
  if (typeof t != "number")
    return "Unknown";
  const e = t > 1e12 ? t : t * 1e3;
  return new Date(e).toISOString();
}
function Zi(t) {
  var c, a;
  const e = t.content.trim();
  if (!e)
    return "No extractable conversation content. Flagged for manual review.";
  const n = e.match(/### User\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), s = e.match(/### Assistant\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), r = ((c = n == null ? void 0 : n[1]) == null ? void 0 : c.trim().slice(0, 400)) ?? "", i = ((a = s == null ? void 0 : s[1]) == null ? void 0 : a.trim().slice(0, 400)) ?? "", o = [];
  return r && o.push(`**User focus:** ${r}${r.length >= 400 ? "…" : ""}`), i && o.push(`**Assistant response:** ${i}${i.length >= 400 ? "…" : ""}`), o.join(`

`) || e.slice(0, 600);
}
function Vi(t, e) {
  const n = /* @__PURE__ */ new Set();
  n.add(e.inferredProject);
  for (const s of e.recurringTerms.slice(0, 5))
    n.add(s);
  return typeof t.metadata.pastedTranscriptCount == "number" && t.metadata.pastedTranscriptCount > 0 && n.add("Pasted source material"), [...n].filter(Boolean);
}
function qi(t, e, n, s) {
  const r = e.title.trim() || "Untitled Conversation", i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    t,
    "",
    "## Session Date",
    Hi(e.metadata.createTime),
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
    Zi(e),
    "",
    "## Key Topics",
    ...Vi(e, n).map((c) => `- ${c}`),
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
function Zs(t, e) {
  const n = e.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Untitled";
  return `${t}_${n}_SESSION.md`;
}
function Wi(t) {
  var n;
  const e = t.match(/## Topic\s*\n([^\n#]+)/);
  return ((n = e == null ? void 0 : e[1]) == null ? void 0 : n.trim()) ?? "ChatGPT conversation import";
}
async function pn(t, e) {
  if (e.length === 0)
    return;
  const n = S.join(t, "Registries", "SOURCE_REGISTRY.md");
  let s;
  try {
    s = await R.readFile(n, "utf8");
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
  const r = e.map((a) => `| ${a.krcId} | ${a.title.replace(/\|/g, "\\|")} | ${a.topic.replace(/\|/g, "\\|")} | ${a.primaryProduct} | ${a.status} |`).join(`
`);
  s = s.trimEnd() + `
` + r + `
`;
  const i = s.match(/Sources Inventoried:\s*(\d+)/), c = (i ? parseInt(i[1], 10) : 0) + e.length;
  s = s.replace(/Sources Inventoried:\s*\d+/, `Sources Inventoried: ${c}`), await R.writeFile(n, s, "utf8");
}
async function Yi(t, e, n) {
  if (e === 0)
    return;
  const s = S.join(t, "Registries", "KRC_STATUS.md");
  let r;
  try {
    r = await R.readFile(s, "utf8");
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
  const i = r.match(/Approximate Sources Inventoried:\s*(\d+)/), o = i ? parseInt(i[1], 10) : 0;
  r = r.replace(/Approximate Sources Inventoried:\s*\d+/, `Approximate Sources Inventoried: ${o + e}`);
  const c = `
${n}
- KAE import: ${e} new source(s) on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  r.includes(n) || (r = r.trimEnd() + c + `
`), await R.writeFile(s, r, "utf8");
}
function hn(t, e, n, s) {
  return {
    krcId: t,
    title: e,
    topic: Wi(n),
    primaryProduct: s ?? "TBD",
    status: n.includes("Review Needed") ? "Review Needed" : "Inventoried"
  };
}
function Jn(t) {
  if (typeof t != "number")
    return "Unknown";
  const e = t > 1e12 ? t : t * 1e3;
  return new Date(e).toISOString();
}
function Ji(t, e) {
  if (e.uncertain)
    return "Unclassified — review needed";
  const n = t.metadata.pastedTranscriptCount;
  return typeof n == "number" && n > 0 ? "Pasted source text / ChatGPT conversation" : `${e.primaryCategory} / ChatGPT conversation`;
}
function Xi(t) {
  const e = [], n = ["Axiom", "Founder OS", "VIGS"];
  for (const s of n) {
    const r = t.categories.some((i) => i === s || s === "Founder OS" && i === "Founder OS");
    e.push(`- ${s}: ${r ? "Yes" : "Possible"}`);
  }
  return e;
}
function Qi(t, e, n) {
  const s = e.title.trim() || "Untitled Conversation", r = String(e.metadata.conversationId ?? e.id), i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), o = e.metadata.messageCount ?? 0, c = [
    `# ${t} — ${s}`,
    "",
    "## Status",
    n.uncertain ? "Review Needed" : "Inventoried",
    "",
    "## Description",
    o === 0 ? "Empty or unparseable ChatGPT conversation — preserved for review." : `ChatGPT conversation acquired by KAE (${o} messages).`,
    "",
    "## Topic",
    Ji(e, n),
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
    ...Xi(n),
    "",
    "## ChatGPT Conversation ID",
    r,
    "",
    "## Create Time",
    Jn(e.metadata.createTime),
    "",
    "## Update Time",
    Jn(e.metadata.updateTime),
    "",
    "## Extraction Status",
    "Pending detailed capability extraction.",
    "",
    "## Notes",
    `Acquired by KAE from ChatGPT export on ${i}. Auto-classified.`,
    "",
    "## Transcript",
    "",
    e.content.trim() || "_No extractable transcript content._"
  ];
  if (n.recurringTerms.length > 0) {
    c.push("", "## Recurring Terms", "");
    for (const l of n.recurringTerms)
      c.push(`- ${l}`);
  }
  const a = e.metadata.fileReferences;
  if (Array.isArray(a) && a.length > 0) {
    c.push("", "## File References", "");
    for (const l of a)
      typeof l == "string" && c.push(`- ${l}`);
  }
  return c.join(`
`);
}
function Vs(t, e) {
  return `${t}_${Xe(e.title)}.md`;
}
function qs(t) {
  return t.uncertain || t.primaryCategory === "Other / Review Needed" ? "Other_Review_Needed" : {
    VIGS: "VIGS",
    "Founder OS": "Founder_OS",
    Axiom: "Axiom",
    Book: "Book",
    "Knowledge Recovery": "Knowledge_Recovery",
    "Source Material": "Source_Material",
    "Technical Build": "Technical_Build",
    "Other / Review Needed": "Other_Review_Needed"
  }[t.primaryCategory] ?? "Other_Review_Needed";
}
function eo(t) {
  const e = [
    `## Import Batch — ${t.importDate}`,
    "",
    `- **Source file:** ${t.importFileName}`,
    `- **Conversations processed:** ${t.conversationsProcessed}`,
    `- **Classified:** ${t.classified.length}`,
    `- **Uncertain / review needed:** ${t.uncertain.length}`,
    `- **Skipped (duplicates):** ${t.skipped.length}`,
    `- **Errors:** ${t.errors.length}`,
    ""
  ];
  return t.classified.length > 0 && e.push("### Classified", "", at(t.classified), ""), t.uncertain.length > 0 && e.push("### Uncertain / Review Needed", "", at(t.uncertain), ""), t.skipped.length > 0 && e.push("### Skipped", "", at(t.skipped), ""), t.errors.length > 0 && e.push("### Errors", "", at(t.errors), ""), e.push("---", ""), e.join(`
`);
}
function at(t) {
  const e = "| KRC ID | Title | Primary Category | All Categories | Confidence | Status | Notes |", n = "|---|---|---|---|---|---|---|", s = t.map((r) => {
    const i = [r.notes, r.sourcePath ? `Source: ${r.sourcePath}` : ""].filter(Boolean).join("; ");
    return `| ${r.krcId} | ${Xn(r.title)} | ${r.primaryCategory} | ${r.categories.join(", ")} | ${r.confidence}% | ${r.status} | ${Xn(i)} |`;
  });
  return [e, n, ...s].join(`
`);
}
function Xn(t) {
  return t.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function to() {
  return [
    "# Import Review",
    "",
    "Auto-generated by KAE. Lists conversation classifications, uncertain items, skips, and errors.",
    ""
  ].join(`
`);
}
async function no(t, e) {
  const n = S.join(t, "Registries", "IMPORT_REVIEW.md");
  let s;
  try {
    s = await R.readFile(n, "utf8");
  } catch {
    s = to();
  }
  return s = s.trimEnd() + `

` + eo(e), await R.writeFile(n, s, "utf8"), n;
}
function so(t, e) {
  const s = new zs(t).getEntries(), r = /* @__PURE__ */ new Map();
  for (const o of s)
    o.isDirectory || r.set(o.entryName.replace(/\\/g, "/"), o);
  const i = /* @__PURE__ */ new Map();
  for (const o of e) {
    const c = r.get(o.zipPath);
    c && i.set(o.zipPath, c.getData());
  }
  return i;
}
async function Ws(t, e, n) {
  var v, y, w, E, k, $, U, D;
  const s = [], r = [];
  let i = 0, o = 0, c = 0, a = 0, l = 0;
  await Hs(e);
  const d = on(t);
  for (const x of t) {
    const O = String(x.metadata.conversationId ?? x.id);
    x.metadata.classification = d.get(O);
  }
  let u = await St(e) + 1;
  const f = await mn(e), p = [], h = `KAE Import — ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`, I = S.join(e, "Uploads", `chatgpt-import-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`);
  let b = !1;
  const C = {
    importDate: (/* @__PURE__ */ new Date()).toISOString(),
    importFileName: (n == null ? void 0 : n.importFileName) ?? "unknown.zip",
    conversationsProcessed: t.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: []
  }, A = t.length;
  let T = 0;
  for (const x of t) {
    T++, (v = n == null ? void 0 : n.onProgress) == null || v.call(n, Math.round(T / A * 100));
    const O = String(x.metadata.conversationId ?? x.id), M = d.get(O) ?? rn(x);
    x.metadata.classification = M;
    const K = f.get(O), G = qs(M);
    let B, V;
    K ? (B = K, V = !0, (y = n == null ? void 0 : n.log) == null || y.call(n, "info", `Updating existing source ${B} for conversation ${O}`)) : (B = Et(u), u++, V = !1);
    const J = Vs(B, x), we = S.join(e, "Sources", G, J), ve = `Sources/${G}/${J}`, Le = Qi(B, x, M), Pe = Zs(B, x), rt = S.join(e, "ExecutiveSessions", G, Pe), Fe = `ExecutiveSessions/${G}/${Pe}`, it = qi(B, x, M, ve), P = {
      krcId: B,
      conversationId: O,
      title: x.title,
      primaryCategory: M.primaryCategory,
      categories: M.categories,
      confidence: M.confidence,
      uncertain: M.uncertain,
      status: "classified",
      sourcePath: ve,
      sessionPath: Fe
    };
    try {
      const z = await Yn(we, Le, V);
      if (z === "skipped") {
        c++, P.status = "skipped", P.notes = "Duplicate file — not overwritten", C.skipped.push(P), (w = n == null ? void 0 : n.log) == null || w.call(n, "warn", `Skipped duplicate file: ${J}`);
        continue;
      }
      f.set(O, B), z === "created" ? (i++, r.push(B), p.push(hn(B, x.title, Le, M.uncertain ? "Review Needed" : M.primaryCategory))) : z === "updated" && (P.status = "updated"), await Yn(rt, it, V), o++, (E = n == null ? void 0 : n.log) == null || E.call(n, "info", `Executive session: ${Fe}`), M.uncertain ? (l++, P.status = P.status === "updated" ? "updated" : "uncertain", C.uncertain.push(P)) : (a++, C.classified.push(P)), (k = n == null ? void 0 : n.log) == null || k.call(n, "info", `${z === "created" ? "Created" : "Updated"} [${M.primaryCategory}] ${B}: ${ve}`), b || (await ro(I, x, n), b = !0);
    } catch (z) {
      const Y = z instanceof Error ? z.message : String(z);
      s.push(`${B}: ${Y}`), P.status = "error", P.notes = Y, C.errors.push(P), ($ = n == null ? void 0 : n.log) == null || $.call(n, "error", `Failed to write ${B}: ${Y}`);
    }
  }
  let g;
  try {
    p.length > 0 && await pn(e, p), await Yi(e, p.length, h), g = await no(e, C), (U = n == null ? void 0 : n.log) == null || U.call(n, "info", `Import review written: ${g}`);
  } catch (x) {
    const O = x instanceof Error ? x.message : String(x);
    s.push(`Registry/review update: ${O}`), (D = n == null ? void 0 : n.log) == null || D.call(n, "error", O);
  }
  const m = S.join(e, "Sources");
  return {
    sourcesCreated: i,
    sessionsCreated: o,
    skippedDuplicates: c,
    errors: s,
    outputFolder: m,
    createdSourceIds: r,
    classified: a,
    uncertain: l,
    reviewFile: g
  };
}
async function ro(t, e, n) {
  var o, c;
  const s = e.metadata.allZipAssets;
  if (!Array.isArray(s) || s.length === 0)
    return;
  await R.mkdir(t, { recursive: !0 });
  const r = s.some((a) => !a.dataBase64);
  let i;
  r && (n != null && n.sourceZipPath) && ((o = n.log) == null || o.call(n, "info", `Extracting ${s.length} asset(s) from ZIP at write time`), i = so(n.sourceZipPath, s));
  for (const a of s) {
    const l = a.dataBase64 ? Buffer.from(a.dataBase64, "base64") : i == null ? void 0 : i.get(a.zipPath);
    if (!l || !a.fileName)
      continue;
    const d = S.join(t, a.fileName);
    await zi(d, l, !1) !== "skipped" && ((c = n == null ? void 0 : n.log) == null || c.call(n, "info", `Preserved asset: Uploads/${S.basename(t)}/${a.fileName}`));
  }
}
class io extends Ai {
  constructor() {
    super(...arguments);
    _(this, "id", "axiom");
    _(this, "name", "Axiom Knowledge Repository");
  }
  async export(n, s, r) {
    return Ws(n, s, r);
  }
}
const Ys = new io(), oo = [
  "Registries/SOURCE_REGISTRY.md",
  "Registries/KRC_STATUS.md",
  "Registries/IMPORT_REVIEW.md"
];
function Js(t, e) {
  const n = [], s = [], r = [], i = [], o = [];
  for (const u of t)
    u.action === "create" ? (n.push(u.sourcePath), r.push(u.sessionPath)) : u.action === "update" ? (s.push(u.sourcePath), i.push(u.sessionPath)) : u.action === "skip" && o.push(u.sourcePath);
  const c = n.length + s.length > 0, a = c ? [...oo] : [], l = c ? [e.replace("{timestamp}", "<timestamp>")] : [], d = [...n, ...s, ...r, ...i];
  return {
    sourcesAdded: n,
    sourcesUpdated: s,
    sessionsAdded: r,
    sessionsUpdated: i,
    registriesUpdated: a,
    uploadsAdded: l,
    duplicatesSkipped: o,
    modifiedFiles: d,
    deletedFiles: [],
    estimatedTotalChanges: n.length + s.length + r.length + i.length + a.length + l.length
  };
}
async function ao(t, e, n) {
  const s = [], r = [], i = [], o = [];
  let c = 0, a = 0, l = 0, d = 0;
  const u = on(t);
  let f = await St(e) + 1;
  const p = await mn(e), h = S.join(e, "Sources"), I = S.join(e, "Uploads", "chatgpt-import-{timestamp}"), b = S.join(e, "ExecutiveSessions"), C = S.join(e, "Registries", "SOURCE_REGISTRY.md"), A = S.join(e, "Registries", "IMPORT_REVIEW.md");
  let T = 0;
  const g = [], m = t[0];
  if (m) {
    const w = m.metadata.allZipAssets;
    Array.isArray(w) && (T = w.length, g.push(...w.map((E) => E.fileName).filter(Boolean)));
  }
  for (const w of t) {
    const E = String(w.metadata.conversationId ?? w.id), k = u.get(E) ?? rn(w), $ = p.get(E), U = qs(k);
    let D, x;
    $ ? (D = $, x = "update") : (D = Et(f), f++, x = "create");
    const O = Vs(D, w), M = S.join(h, U, O), K = `Sources/${U}/${O}`, G = Zs(D, w), B = `ExecutiveSessions/${U}/${G}`;
    if (x === "create")
      try {
        await R.access(M), x = "skip";
      } catch {
      }
    x === "create" ? c++ : x === "update" ? a++ : x === "skip" && l++, k.uncertain && d++, o.push({
      conversationId: E,
      title: w.title,
      krcId: D,
      action: x,
      primaryCategory: k.primaryCategory,
      categories: k.categories,
      uncertain: k.uncertain,
      sourcePath: K,
      sessionPath: B
    });
  }
  d > 0 && r.push(`${d} conversation(s) require manual review (uncertain classification).`), l > 0 && r.push(`${l} file(s) already exist and will be skipped.`);
  try {
    await R.access(e);
  } catch {
    r.push("Repository path does not exist yet — it will be created on import.");
  }
  const v = i.length === 0 && t.length > 0, y = Js(o, I);
  return {
    valid: v,
    fileName: n,
    filePath: "",
    zipReadable: !0,
    chatGptStructureDetected: !0,
    conversationsJsonPresent: !0,
    conversationsFound: t.length,
    uploadedFilesCount: T,
    uploadedFileNames: g,
    estimatedSourcesToCreate: c,
    estimatedSourcesToUpdate: a,
    estimatedDuplicatesSkipped: l,
    uncertainCount: d,
    errors: s,
    warnings: r,
    blockingErrors: i,
    plannedRecords: o,
    diffPreview: y,
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: h,
      uploadsPattern: I,
      executiveSessionsRoot: b,
      registryPath: C,
      reviewPath: A
    },
    repositoryPath: e
  };
}
function co(t, e, n, s) {
  return {
    valid: !1,
    fileName: t,
    filePath: e,
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
    diffPreview: Js([], S.join(n, "Uploads", "chatgpt-import-{timestamp}")),
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: S.join(n, "Sources"),
      uploadsPattern: S.join(n, "Uploads", "chatgpt-import-{timestamp}"),
      executiveSessionsRoot: S.join(n, "ExecutiveSessions"),
      registryPath: S.join(n, "Registries", "SOURCE_REGISTRY.md"),
      reviewPath: S.join(n, "Registries", "IMPORT_REVIEW.md")
    },
    repositoryPath: n
  };
}
const gn = 1, Xs = ".kae-connectors", Qs = "connectors.json";
function Qn() {
  return {
    version: gn,
    connectors: {},
    syncHistory: [],
    schedules: [],
    totals: {},
    monitoring: {},
    events: []
  };
}
async function uo(t) {
  const e = S.join(t, Xs, Qs);
  try {
    const n = await R.readFile(e, "utf8"), s = JSON.parse(n);
    return {
      ...Qn(),
      ...s,
      version: gn
    };
  } catch {
    return Qn();
  }
}
async function X(t, e) {
  const n = S.join(t, Xs);
  await R.mkdir(n, { recursive: !0 });
  const s = S.join(n, Qs);
  return await R.writeFile(s, JSON.stringify({ ...e, version: gn }, null, 2), "utf8"), s;
}
const es = Ls(Ns);
async function lo(t) {
  try {
    return await R.access(t), !0;
  } catch {
    return !1;
  }
}
async function fo(t) {
  const e = S.join(t, ".kae-snapshots");
  try {
    const s = (await R.readdir(e)).sort().reverse();
    return s[0] ? S.join(e, s[0]) : void 0;
  } catch {
    return;
  }
}
async function mo(t, e) {
  const n = [];
  let s = !1, r, i = !1;
  try {
    const { stdout: f } = await es("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: t
    });
    r = f.trim(), s = !0, n.push({
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
      const { stdout: f } = await es("git", ["status", "--porcelain"], {
        cwd: t
      });
      i = f.trim().length > 0, n.push({
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
  const o = (e == null ? void 0 : e.duplicateIds) ?? [];
  n.push({
    id: "duplicate-ids",
    label: "No duplicate KRC IDs",
    passed: o.length === 0,
    message: o.length === 0 ? "No duplicate source IDs detected." : `${o.length} duplicate ID(s): ${o.slice(0, 5).join(", ")}${o.length > 5 ? "…" : ""}`,
    severity: o.length > 0 ? "error" : "info"
  });
  const c = (e == null ? void 0 : e.categorizedIssues.warnings.filter((f) => f.code === "MISSING_REGISTRY")) ?? [];
  n.push({
    id: "registries",
    label: "Required registries present",
    passed: c.length === 0,
    message: c.length === 0 ? "All required registries are present." : `${c.length} registry file(s) missing.`,
    severity: c.length > 0 ? "warning" : "info"
  });
  const a = (e == null ? void 0 : e.categorizedIssues.errors) ?? [];
  n.push({
    id: "integrity",
    label: "No integrity errors",
    passed: a.length === 0,
    message: a.length === 0 ? "No broken references or integrity errors detected." : `${a.length} integrity error(s) require attention.`,
    severity: a.length > 0 ? "error" : "info"
  });
  const l = await fo(t);
  n.push({
    id: "snapshot",
    label: "Import snapshot available",
    passed: !!l,
    message: l ? `Latest snapshot: ${S.basename(l)}` : "No import snapshot found (created automatically before imports).",
    severity: "info"
  }), await lo(t) || n.push({
    id: "repo-exists",
    label: "Repository path exists",
    passed: !1,
    message: "Repository path does not exist yet.",
    severity: "warning"
  });
  const u = !n.some((f) => !f.passed && f.severity === "error") && o.length === 0;
  return {
    ready: u,
    status: u ? "READY" : "NOT READY",
    checks: n
  };
}
const ts = Ls(Ns), ns = /KRC-\d{4}/g;
async function me(t) {
  try {
    return await R.access(t), !0;
  } catch {
    return !1;
  }
}
async function ss(t) {
  const e = [];
  if (!await me(t))
    return e;
  async function n(s) {
    const r = await R.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && e.push(o);
    }
  }
  return await n(t), e;
}
function rs(t, e) {
  return S.relative(t, e).replace(/\\/g, "/");
}
function q(t, e) {
  t.push(e);
}
async function ye(t) {
  const e = [], n = [], s = /* @__PURE__ */ new Map();
  await me(t) || q(e, {
    severity: "warning",
    category: "warning",
    code: "REPO_MISSING",
    message: "Repository path does not exist.",
    path: t,
    recovery: "Configure the repository path in Settings or import to create it."
  });
  const r = ["Sources", "ExecutiveSessions", "Registries", "Uploads"];
  for (const b of r) {
    const C = S.join(t, b);
    await me(C) || q(e, {
      severity: "warning",
      category: "warning",
      code: "MISSING_DIR",
      message: `Missing directory: ${b}`,
      path: C,
      relativePath: b,
      recovery: "Directory will be created automatically on first import."
    });
  }
  const i = ["SOURCE_REGISTRY.md", "KRC_STATUS.md", "IMPORT_REVIEW.md"];
  for (const b of i) {
    const C = S.join(t, "Registries", b);
    await me(C) || q(e, {
      severity: "warning",
      category: "warning",
      code: "MISSING_REGISTRY",
      message: `Missing registry: ${b}`,
      path: C,
      relativePath: `Registries/${b}`,
      recovery: "Registry files are created during the first successful import."
    });
  }
  const o = await ss(S.join(t, "Sources")), c = await ss(S.join(t, "ExecutiveSessions")), a = /* @__PURE__ */ new Map();
  for (const b of c) {
    const A = S.basename(b).match(ns);
    A != null && A[0] && a.set(A[0], b);
  }
  for (const b of o) {
    const C = S.basename(b), A = rs(t, b), T = C.match(ns);
    if (!T) {
      q(e, {
        severity: "info",
        category: "info",
        code: "NO_KRC_ID",
        message: `Source file has no KRC ID in filename: ${C}`,
        path: b,
        relativePath: A
      });
      continue;
    }
    for (const m of T) {
      const v = s.get(m) ?? [];
      v.push(b), s.set(m, v);
    }
    /[<>:"|?*]/.test(C) && q(e, {
      severity: "error",
      category: "error",
      code: "INVALID_FILENAME",
      message: `Invalid characters in filename: ${C}`,
      path: b,
      relativePath: A,
      recovery: "Rename the file to remove invalid characters."
    });
    const g = T[0];
    a.has(g) || q(e, {
      severity: "warning",
      category: "warning",
      code: "MISSING_SESSION",
      message: `No executive session found for ${g}`,
      path: b,
      relativePath: A,
      recovery: "Re-import or manually create the executive session record."
    });
    try {
      const m = await R.readFile(b, "utf8");
      !m.includes("## Metadata") && !m.includes("Acquired by KAE") && q(e, {
        severity: "info",
        category: "info",
        code: "MISSING_METADATA",
        message: `Source ${g} may be missing standard metadata block`,
        path: b,
        relativePath: A
      });
    } catch {
      q(e, {
        severity: "error",
        category: "error",
        code: "UNREADABLE_FILE",
        message: `Unable to read source file: ${C}`,
        path: b,
        relativePath: A,
        recovery: "Verify file permissions and encoding."
      });
    }
  }
  for (const [b, C] of s)
    C.length > 1 && (n.push(b), q(e, {
      severity: "error",
      category: "error",
      code: "DUPLICATE_ID",
      message: `Duplicate KRC ID ${b} found in ${C.length} files`,
      path: C[0],
      relativePath: rs(t, C[0]),
      recovery: "Remove or merge duplicate source files before committing."
    }));
  o.length === 0 && await me(t) && q(e, {
    severity: "info",
    category: "recommendation",
    code: "EMPTY_SOURCES",
    message: "No source files found in the repository.",
    recovery: "Import a ChatGPT export to populate the knowledge repository."
  }), await me(S.join(t, ".kae-snapshots")) || q(e, {
    severity: "info",
    category: "recommendation",
    code: "NO_SNAPSHOTS",
    message: "No import snapshots yet.",
    recovery: "Snapshots are created automatically before each import."
  });
  let l = !1, d, u;
  try {
    const { stdout: b } = await ts("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: t
    }), { stdout: C } = await ts("git", ["status", "--porcelain"], {
      cwd: t
    });
    l = !0, d = b.trim(), u = C.trim().length > 0, u && q(e, {
      severity: "info",
      category: "recommendation",
      code: "GIT_DIRTY",
      message: "Git working tree has uncommitted changes.",
      recovery: "Review changes and commit when ready."
    });
  } catch {
    q(e, {
      severity: "info",
      category: "recommendation",
      code: "NOT_GIT",
      message: "Repository is not initialized as a Git repository.",
      recovery: "Run git init in the repository folder for version control."
    });
  }
  const f = pi(e), h = {
    ready: !(f.errors.length > 0) && await me(t),
    statusLevel: "healthy",
    statusHeadline: "",
    statusSubline: "",
    repositoryPath: t,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sourceCount: o.length,
    sessionCount: c.length,
    duplicateIds: n,
    issues: e,
    categorizedIssues: f,
    gitReady: l,
    gitBranch: d,
    gitDirty: u,
    gitReadiness: { ready: !1, status: "NOT READY", checks: [] }
  }, I = mi(h);
  return h.statusLevel = I.level, h.statusHeadline = I.headline, h.statusSubline = I.subline, h.gitReadiness = await mo(t, h), h;
}
async function er(t, e) {
  await R.mkdir(e, { recursive: !0 });
  const n = await R.readdir(t, { withFileTypes: !0 });
  for (const s of n) {
    const r = S.join(t, s.name), i = S.join(e, s.name);
    s.isDirectory() ? await er(r, i) : await R.copyFile(r, i);
  }
}
async function tr(t, e) {
  const n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = S.join(t, ".kae-snapshots", `${n}_${e}`);
  await R.mkdir(s, { recursive: !0 });
  const r = ["Sources", "ExecutiveSessions", "Registries"];
  for (const i of r) {
    const o = S.join(t, i);
    try {
      await R.access(o), await er(o, S.join(s, i));
    } catch {
    }
  }
  return s;
}
async function po(t, e) {
  const n = S.join(t, ".kae-sessions");
  await R.mkdir(n, { recursive: !0 });
  const s = S.join(n, `${e.sessionId}.json`);
  return await R.writeFile(s, JSON.stringify(e, null, 2), "utf8"), s;
}
const ho = 53, go = 122;
function yo(t) {
  var s;
  const e = t.slice(0, 4096), n = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: n == null ? void 0 : n[1],
    title: (s = n == null ? void 0 : n[2]) == null ? void 0 : s.trim(),
    createTime: he(e, "Create Time"),
    updateTime: he(e, "Update Time")
  };
}
async function nr(t) {
  const n = (await kt(t)).filter((r) => r.category === "sources" && sr(r.name)), s = [];
  for (const r of n) {
    let i = "";
    try {
      i = (await Ve(t, r.relativePath)).slice(0, 4096);
    } catch {
    }
    const o = yo(i), c = o.updateTime ?? o.createTime ?? r.modifiedAt ?? "";
    s.push({
      name: r.name,
      relativePath: r.relativePath,
      krcId: o.krcId ?? r.name,
      title: o.title ?? r.name.replace(/\.md$/i, ""),
      createTime: o.createTime,
      updateTime: o.updateTime,
      sortTime: c,
      sizeBytes: r.sizeBytes,
      modifiedAt: r.modifiedAt
    });
  }
  return s.sort((r, i) => new Date(i.sortTime).getTime() - new Date(r.sortTime).getTime());
}
function sr(t) {
  const e = t.match(/^KRC-(\d{4})_/i);
  if (!e)
    return !1;
  const n = parseInt(e[1], 10);
  return n >= ho && n <= go;
}
function he(t, e) {
  var r;
  const n = new RegExp(`^## ${e}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = t.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function wo(t) {
  return t ? t.split(`
`).map((e) => e.replace(/^-\s*/, "").trim()).filter(Boolean) : [];
}
function vo(t) {
  var l, d, u, f;
  const e = t.split(`
`), n = (l = e[0]) == null ? void 0 : l.trim();
  if (!n)
    return null;
  let s, r = 1;
  (d = e[1]) != null && d.startsWith("*") && ((u = e[1]) != null && u.endsWith("*")) && (s = e[1].slice(1, -1).trim(), r = 2);
  const o = e.slice(r).join(`
`).trim().split(/\n\*\*File references:\*\*\s*\n/i), c = ((f = o[0]) == null ? void 0 : f.trim()) ?? "", a = [];
  if (o[1])
    for (const p of o[1].split(`
`)) {
      const h = p.replace(/^-\s*/, "").trim();
      h && a.push(h);
    }
  return { role: n, timestamp: s, text: c, fileReferences: a };
}
function yn(t) {
  const e = t.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!e)
    return null;
  const n = t.indexOf("## Transcript"), s = n >= 0 ? t.slice(0, n) : t, r = n >= 0 ? t.slice(n + 13) : "", i = [];
  for (const o of r.split(/^### /m).slice(1)) {
    const c = vo(o);
    c && i.push(c);
  }
  return {
    krcId: e[1],
    title: e[2].trim(),
    conversationId: he(s, "ChatGPT Conversation ID"),
    createTime: he(s, "Create Time"),
    updateTime: he(s, "Update Time"),
    description: he(s, "Description"),
    fileReferences: wo(he(s, "File References")),
    messages: i
  };
}
function wn(t, e) {
  if (t.length >= 4 && t[0] === 137 && t[1] === 80 && t[2] === 78 && t[3] === 71)
    return "image/png";
  if (t.length >= 3 && t[0] === 255 && t[1] === 216 && t[2] === 255)
    return "image/jpeg";
  if (t.length >= 6 && t[0] === 71 && t[1] === 73 && t[2] === 70)
    return "image/gif";
  if (t.length >= 12 && t[4] === 102 && t[5] === 116 && t[6] === 121 && t[7] === 112)
    return "video/mp4";
  if (t.length >= 4 && t[0] === 37 && t[1] === 80 && t[2] === 68 && t[3] === 70)
    return "application/pdf";
  const n = (e == null ? void 0 : e.toLowerCase()) ?? "";
  return n.endsWith(".png") ? "image/png" : n.endsWith(".jpg") || n.endsWith(".jpeg") ? "image/jpeg" : n.endsWith(".gif") ? "image/gif" : n.endsWith(".webp") ? "image/webp" : n.endsWith(".mp4") ? "video/mp4" : n.endsWith(".webm") ? "video/webm" : n.endsWith(".mov") ? "video/quicktime" : "application/octet-stream";
}
function Io(t) {
  return t.startsWith("image/") ? "image" : t.startsWith("video/") ? "video" : "other";
}
async function rr(t) {
  const e = S.join(t, "Uploads");
  let n;
  try {
    n = await R.readdir(e);
  } catch {
    return null;
  }
  const s = n.filter((r) => r.startsWith("chatgpt-import-")).sort().reverse();
  return s.length === 0 ? null : `Uploads/${s[0]}`;
}
async function ir(t, e) {
  const n = /* @__PURE__ */ new Map(), s = S.join(t, e);
  let r;
  try {
    r = await R.readdir(s);
  } catch {
    return n;
  }
  for (const i of r) {
    const o = `${e}/${i}`.replace(/\\/g, "/");
    n.set(i.toLowerCase(), o);
    const c = i.replace(/\.dat$/i, "");
    n.set(c.toLowerCase(), o), c.startsWith("file_") && n.set(c.slice(5).toLowerCase(), o);
  }
  return n;
}
function or(t, e) {
  const n = t.trim();
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
    const o = e.get(i.toLowerCase());
    if (o)
      return o;
  }
  const r = S.basename(n).toLowerCase();
  for (const [i, o] of e.entries())
    if (i.includes(r) || r.includes(i))
      return o;
  return null;
}
async function So(t, e) {
  const n = await rr(t);
  if (!n)
    return [];
  const s = await ir(t, n), r = [], i = /* @__PURE__ */ new Set();
  for (const o of e) {
    const c = or(o, s);
    if (!c || i.has(c))
      continue;
    i.add(c);
    const a = S.join(t, c);
    let l;
    try {
      l = await R.readFile(a);
    } catch {
      continue;
    }
    const d = wn(l, o);
    r.push({
      ref: o,
      relativePath: c,
      fileName: S.basename(c),
      mimeType: d,
      kind: Io(d)
    });
  }
  return r;
}
function je(t, e) {
  var r;
  const n = new RegExp(`^## ${e}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = t.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function Eo(t, e) {
  var d;
  const n = t.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m), s = ((d = n == null ? void 0 : n[1]) == null ? void 0 : d.trim()) ?? e.replace(/\.md$/i, ""), r = je(t, "Source ID"), i = je(t, "Session Date"), o = je(t, "Session Summary") ?? "", c = je(t, "Transcript Reference"), a = [];
  c && a.push(c);
  for (const u of ["Key Topics", "Recurring Terms", "Classification", "Rationale"]) {
    const f = je(t, u);
    if (f)
      for (const p of f.split(`
`)) {
        const h = p.replace(/^-\s*/, "").trim();
        h && a.push(h);
      }
  }
  return {
    sessionId: e.replace(/\.md$/i, ""),
    title: s,
    linkedKrcId: r,
    sessionDate: i,
    summaryText: o,
    summaryReferences: [...new Set(a)],
    transcriptReference: c
  };
}
const De = ".kae-index", Co = "evidence-index.json", ar = 1;
function Ct(t) {
  return S.join(t, De, Co);
}
async function cr(t) {
  const e = Ct(t);
  try {
    const n = await R.readFile(e, "utf8"), s = JSON.parse(n);
    return s.version !== ar || !Array.isArray(s.records) ? null : s;
  } catch {
    return null;
  }
}
async function ko(t, e) {
  const n = S.join(t, De);
  await R.mkdir(n, { recursive: !0 });
  const s = Ct(t);
  return await R.writeFile(s, JSON.stringify(e, null, 2), "utf8"), s;
}
const Ro = /* @__PURE__ */ new Set([
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
function Ze(t) {
  const e = t.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter((n) => n.length > 1 && !Ro.has(n));
  return [...new Set(e)];
}
function xe(t) {
  const e = t.trim();
  if (!e)
    return [];
  if (/^krc-\d{4}$/i.test(e))
    return [e.toLowerCase()];
  const n = e.toLowerCase(), s = Ze(e);
  return s.length === 0 && n.length > 0 ? [n] : s;
}
function Ge(t, e = 160) {
  return t.replace(/\s+/g, " ").trim().slice(0, e);
}
function ur(t) {
  return sr(t) ? "chatgpt-import" : t.startsWith("KRC-") ? "krc-source" : "markdown";
}
function bo(t) {
  const e = {
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    recordCount: t.length,
    sources: 0,
    conversations: 0,
    messages: 0,
    attachments: 0,
    executiveSessions: 0
  };
  for (const n of t)
    switch (n.kind) {
      case "source":
        e.sources += 1;
        break;
      case "conversation":
        e.conversations += 1;
        break;
      case "message":
        e.messages += 1;
        break;
      case "attachment":
        e.attachments += 1;
        break;
      case "executive_session":
        e.executiveSessions += 1;
        break;
    }
  return e;
}
function Ao(t, e, n, s) {
  const r = yn(e);
  if (!r)
    return;
  const i = ur(S.basename(t)), o = {
    krcId: r.krcId,
    repositoryPath: t,
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
    repository: o,
    conversation: c,
    excerpt: Ge(r.description ?? r.title)
  }), s.push({
    id: `${r.krcId}:conversation`,
    kind: "conversation",
    repository: o,
    conversation: c,
    excerpt: Ge(r.title)
  });
  const a = new Set(r.fileReferences), l = /* @__PURE__ */ new Map();
  r.messages.forEach((d, u) => {
    const f = `${r.krcId}:msg:${u}`, p = Ze(d.text);
    l.set(f, d.fileReferences), s.push({
      id: f,
      kind: "message",
      repository: o,
      conversation: c,
      message: {
        messageId: f,
        role: d.role,
        timestamp: d.timestamp,
        text: d.text,
        searchTerms: p
      },
      excerpt: Ge(d.text)
    });
    for (const h of d.fileReferences)
      a.add(h);
  });
  for (const d of a) {
    const u = `${r.krcId}:att:${d}`, f = n ? or(d, n) : null, p = S.basename(d);
    let h;
    for (const [I, b] of l.entries())
      if (b.includes(d)) {
        h = I;
        break;
      }
    s.push({
      id: u,
      kind: "attachment",
      repository: o,
      conversation: c,
      attachment: {
        attachmentId: u,
        filename: p,
        assetPath: f ?? void 0,
        linkedMessageId: h,
        resolved: !!f
      },
      excerpt: p
    });
  }
}
function $o(t, e, n) {
  var c;
  const s = S.basename(t), r = e.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m), i = r == null ? void 0 : r[1], o = ((c = r == null ? void 0 : r[2]) == null ? void 0 : c.trim()) ?? s.replace(/\.md$/i, "");
  n.push({
    id: `${t}:source`,
    kind: "source",
    repository: {
      krcId: i,
      repositoryPath: t,
      category: "sources",
      sourceType: ur(s)
    },
    conversation: { title: o },
    excerpt: Ge(e)
  });
}
function To(t, e, n) {
  const s = Eo(e, S.basename(t));
  if (!s)
    return;
  const r = [s.summaryText, ...s.summaryReferences].join(`
`);
  n.push({
    id: `${t}:session`,
    kind: "executive_session",
    repository: {
      krcId: s.linkedKrcId,
      repositoryPath: t,
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
    excerpt: Ge(r || s.title)
  });
}
async function Qe(t) {
  const e = await kt(t), n = [], s = await rr(t), r = s ? await ir(t, s) : null;
  for (const c of e) {
    if (!c.relativePath.endsWith(".md") || c.category !== "sources" && c.category !== "sessions")
      continue;
    let a;
    try {
      a = await Ve(t, c.relativePath);
    } catch {
      continue;
    }
    if (c.category === "sessions") {
      To(c.relativePath, a, n);
      continue;
    }
    yn(a) ? Ao(c.relativePath, a, r, n) : $o(c.relativePath, a, n);
  }
  const i = (/* @__PURE__ */ new Date()).toISOString(), o = {
    version: ar,
    repositoryPath: t,
    builtAt: i,
    recordCount: n.length,
    records: n
  };
  return await ko(t, o), o;
}
function Do(t) {
  const e = bo(t.records);
  return e.builtAt = t.builtAt, e;
}
function dr(t) {
  return t.trim().toLowerCase();
}
function xo(t) {
  const e = dr(t);
  return e === "user" || e.startsWith("user ");
}
function _o(t) {
  const e = dr(t);
  return e === "assistant" || e.startsWith("assistant ");
}
function No(t) {
  return t.kind === "executive_session" ? "session" : t.kind === "attachment" ? "attachment" : t.repository.category === "sessions" ? "session" : "source";
}
function Lo(t) {
  var e, n, s, r;
  return t.kind === "attachment" && t.attachment ? t.attachment.filename : t.kind === "executive_session" ? ((e = t.conversation) == null ? void 0 : e.title) ?? ((n = t.session) == null ? void 0 : n.sessionId) ?? "Executive Session" : t.kind === "message" && t.message ? `${((s = t.conversation) == null ? void 0 : s.title) ?? t.repository.krcId ?? "Message"} — ${t.message.role}` : ((r = t.conversation) == null ? void 0 : r.title) ?? t.repository.krcId ?? t.repository.repositoryPath;
}
function Po(t) {
  var e, n, s;
  if (t.kind === "executive_session") {
    if ((e = t.session) != null && e.transcriptReference)
      return t.session.transcriptReference;
    const r = (n = t.session) == null ? void 0 : n.summaryReferences.find((i) => i.startsWith("Sources/"));
    return r || t.repository.repositoryPath;
  }
  return t.kind === "attachment" && ((s = t.attachment) != null && s.assetPath), t.repository.repositoryPath;
}
function ct(t) {
  var n, s;
  const e = [
    t.repository.krcId ?? "",
    t.repository.repositoryPath,
    ((n = t.conversation) == null ? void 0 : n.title) ?? "",
    ((s = t.conversation) == null ? void 0 : s.conversationId) ?? "",
    t.excerpt
  ];
  return t.message && e.push(t.message.text, t.message.role, ...t.message.searchTerms), t.attachment && e.push(t.attachment.filename, t.attachment.assetPath ?? ""), t.session && e.push(t.session.sessionId, t.session.linkedKrcId ?? "", ...t.session.summaryReferences), e.join(`
`).toLowerCase();
}
function Fo(t, e, n) {
  var a, l, d;
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  const i = e.toLowerCase(), o = (a = t.repository.krcId) == null ? void 0 : a.toLowerCase();
  o && (o === i || o.includes(i)) && (r += 100, s.add("krcId"));
  const c = ((d = (l = t.conversation) == null ? void 0 : l.title) == null ? void 0 : d.toLowerCase()) ?? "";
  if (c && c.includes(i) && (r += 40, s.add("title")), t.kind === "attachment" && t.attachment) {
    const u = t.attachment.filename.toLowerCase();
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 50, s.add("filename"), s.add("attachment"));
  }
  if (t.kind === "message" && t.message) {
    const u = t.message.text.toLowerCase(), f = u.includes(i), p = n.filter((h) => u.includes(h)).length;
    (f || p > 0) && (r += f ? 30 : p * 8, s.add("message"), s.add("keyword"), xo(t.message.role) && (s.add("prompt"), f && (r += 10)), _o(t.message.role) && (s.add("response"), f && (r += 10)));
  }
  if (t.kind === "executive_session") {
    const u = ct(t);
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 25, s.add("session"), s.add("keyword"));
  }
  if (t.kind === "source" || t.kind === "conversation") {
    const u = ct(t);
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 15, s.add("keyword"));
  }
  if (r === 0) {
    const u = ct(t);
    if (u.includes(i))
      r += 5, s.add("keyword");
    else {
      const f = n.filter((p) => u.includes(p)).length;
      f > 0 && (r += f * 3, s.add("keyword"));
    }
  }
  if (n.length > 1) {
    const u = ct(t);
    n.every((f) => u.includes(f)) && (r += 25, s.add("keyword"));
  }
  return { score: r, matchFields: [...s] };
}
function Oo(t, e, n) {
  var s, r, i;
  return {
    recordId: t.id,
    kind: t.kind,
    score: e,
    matchFields: n,
    title: Lo(t),
    snippet: t.excerpt,
    drilldownPath: Po(t),
    krcId: t.repository.krcId,
    conversationTitle: (s = t.conversation) == null ? void 0 : s.title,
    messageRole: (r = t.message) == null ? void 0 : r.role,
    attachmentFilename: (i = t.attachment) == null ? void 0 : i.filename,
    category: No(t)
  };
}
function lr(t, e, n = 50) {
  const s = e.trim();
  if (!s)
    return [];
  const r = xe(s), i = [];
  for (const o of t.records) {
    const { score: c, matchFields: a } = Fo(o, s, r);
    c <= 0 || a.length === 0 || i.push(Oo(o, c, a));
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
function fr(t) {
  return t.map((e) => ({
    path: e.drilldownPath,
    title: e.title,
    snippet: e.snippet,
    category: e.category,
    score: e.score,
    evidenceKind: e.kind,
    recordId: e.recordId,
    matchFields: e.matchFields,
    krcId: e.krcId,
    conversationTitle: e.conversationTitle,
    messageRole: e.messageRole,
    attachmentFilename: e.attachmentFilename
  }));
}
async function _e(t) {
  const e = await cr(t);
  return e && e.repositoryPath === t ? e : Qe(t);
}
async function mr(t, e, n = 50) {
  const s = await _e(t);
  return lr(s, e, n);
}
function Uo(t) {
  const e = t.replace(/\\/g, "/");
  return e.startsWith("Sources/") ? "sources" : e.startsWith("ExecutiveSessions/") ? "sessions" : e.startsWith("Registries/") ? "registries" : e.startsWith("ImportReports/") ? "reports" : e.startsWith("Uploads/") ? "uploads" : "other";
}
async function pr(t, e, n) {
  const s = await R.readdir(e, { withFileTypes: !0 });
  for (const r of s) {
    if (r.name.startsWith(".kae-"))
      continue;
    const i = S.join(e, r.name), o = S.relative(t, i).replace(/\\/g, "/");
    if (r.isDirectory())
      await pr(t, i, n);
    else if (r.name.endsWith(".md") || r.name.endsWith(".json")) {
      let c, a;
      try {
        const l = await R.stat(i);
        c = l.size, a = l.mtime.toISOString();
      } catch {
      }
      n.push({
        name: r.name,
        relativePath: o,
        category: Uo(o),
        sizeBytes: c,
        modifiedAt: a
      });
    }
  }
}
async function kt(t) {
  const e = [];
  try {
    await R.access(t), await pr(t, t, e);
  } catch {
    return [];
  }
  return e.sort((n, s) => n.relativePath.localeCompare(s.relativePath));
}
async function Ve(t, e) {
  const n = S.join(t, e), s = S.resolve(t);
  if (!S.resolve(n).startsWith(s))
    throw new Error("Invalid file path.");
  return R.readFile(n, "utf8");
}
function Mo(t, e, n = 80) {
  const s = Math.max(0, e - n), r = Math.min(t.length, e + n);
  return t.slice(s, r).replace(/\s+/g, " ").trim();
}
async function jo(t, e, n = 50) {
  const s = e.trim();
  if (!s)
    return [];
  try {
    const r = await mr(t, s, n);
    if (r.length > 0)
      return fr(r);
  } catch {
  }
  return Bo(t, s, n);
}
async function Bo(t, e, n = 50) {
  const s = e.toLowerCase(), r = await kt(t), i = [];
  for (const o of r) {
    if (!o.relativePath.endsWith(".md"))
      continue;
    let c;
    try {
      c = await Ve(t, o.relativePath);
    } catch {
      continue;
    }
    const a = c.toLowerCase(), l = o.name.replace(/\.md$/i, "");
    let d = 0;
    l.toLowerCase().includes(s) && (d += 10);
    const u = a.split(s).length - 1;
    if (u === 0)
      continue;
    d += u;
    const f = a.indexOf(s);
    i.push({
      path: o.relativePath,
      title: l,
      snippet: Mo(c, f),
      category: o.category === "sessions" ? "session" : o.category === "registries" ? "registry" : o.category === "reports" ? "report" : "source",
      score: d
    });
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
async function Ko(t) {
  const e = S.join(t, ".kae-snapshots");
  try {
    const s = (await R.readdir(e)).sort().reverse();
    return s[0] ? S.join(e, s[0]) : void 0;
  } catch {
    return;
  }
}
async function Go(t) {
  var n;
  const e = S.join(t, "Registries", "IMPORT_REVIEW.md");
  try {
    const r = (await R.readFile(e, "utf8")).match(/Import Date:\s*([^\n]+)/i);
    return (n = r == null ? void 0 : r[1]) == null ? void 0 : n.trim();
  } catch {
    return;
  }
}
async function hr(t) {
  const e = await ye(t);
  let n = 0;
  try {
    const s = S.join(t, "Registries");
    n = (await R.readdir(s)).filter((i) => i.endsWith(".md")).length;
  } catch {
    n = 0;
  }
  return {
    repositoryPath: t,
    sourceCount: e.sourceCount,
    sessionCount: e.sessionCount,
    registryCount: n,
    lastImportDate: await Go(t),
    lastSnapshotPath: await Ko(t),
    healthReady: e.ready,
    issueCount: e.issues.length
  };
}
function zo(t) {
  return t < 1e3 ? `${t}ms` : `${(t / 1e3).toFixed(1)}s`;
}
function Ho(t) {
  const e = [
    "# KAE Import Report",
    "",
    `**Report ID:** ${t.reportId}`,
    `**Generated:** ${t.generatedAt}`,
    `**Duration:** ${zo(t.durationMs)}`,
    "",
    "## Summary",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Connector | ${t.connectorName} |`,
    `| Source file | ${t.sourceFile} |`,
    `| Repository | ${t.repositoryPath} |`,
    `| Imported | ${t.imported} |`,
    `| Updated | ${t.updated} |`,
    `| Skipped | ${t.skipped} |`,
    `| Sessions | ${t.sessionsCreated} |`,
    `| Git readiness | ${t.gitReadiness.status} |`,
    ""
  ];
  if (t.snapshotPath && e.push(`**Snapshot:** \`${t.snapshotPath}\``, ""), t.warnings.length > 0) {
    e.push("## Warnings", "");
    for (const n of t.warnings)
      e.push(`- ${n}`);
    e.push("");
  }
  if (t.errors.length > 0) {
    e.push("## Errors", "");
    for (const n of t.errors)
      e.push(`- ${n}`);
    e.push("");
  }
  if (t.sourcesCreated.length > 0) {
    e.push("## Sources Created", "");
    for (const n of t.sourcesCreated)
      e.push(`- ${n}`);
    e.push("");
  }
  if (t.registriesUpdated.length > 0) {
    e.push("## Registries Updated", "");
    for (const n of t.registriesUpdated)
      e.push(`- ${n}`);
    e.push("");
  }
  e.push("## Git Readiness Checks", "");
  for (const n of t.gitReadiness.checks)
    e.push(`- ${n.passed ? "✓" : "✗"} **${n.label}** — ${n.message}`);
  return e.push("", "---", "*Generated by KAE — Knowledge Acquisition Engine*"), e.join(`
`);
}
async function Zo(t, e) {
  const n = S.join(t, "ImportReports");
  await R.mkdir(n, { recursive: !0 });
  const r = `import-report-${e.generatedAt.replace(/[:.]/g, "-")}.md`, i = S.join(n, r), o = Ho({ ...e });
  return await R.writeFile(i, o, "utf8"), i;
}
const Vo = /KRC-(\d{4})/i;
async function gr(t) {
  try {
    return await R.access(t), !0;
  } catch {
    return !1;
  }
}
async function yr(t) {
  const e = [];
  if (!await gr(t))
    return e;
  async function n(s) {
    const r = await R.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && e.push(o);
    }
  }
  return await n(t), e;
}
function wr(t, e) {
  return S.relative(t, e).replace(/\\/g, "/");
}
function vr(t) {
  const e = t.match(Vo);
  return e ? e[0].toUpperCase() : null;
}
function Ir(t, e) {
  const n = t.replace(/\\/g, "/").split("/");
  return n[0] === e && n.length >= 2 ? n[1] ?? "" : "";
}
async function qo(t) {
  const e = S.join(t, "Sources"), n = await yr(e), s = [];
  for (const r of n) {
    const i = wr(t, r), o = S.basename(r), c = await R.stat(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: vr(o),
      categoryFolder: Ir(i, "Sources"),
      mtimeMs: c.mtimeMs
    });
  }
  return s;
}
async function Wo(t) {
  const e = S.join(t, "ExecutiveSessions"), n = await yr(e), s = [];
  for (const r of n) {
    const i = wr(t, r), o = S.basename(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: vr(o),
      categoryFolder: Ir(i, "ExecutiveSessions")
    });
  }
  return s;
}
async function Yo(t) {
  const e = S.join(t, "Registries", "SOURCE_REGISTRY.md"), n = [];
  try {
    const s = await R.readFile(e, "utf8");
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
async function Jo(t) {
  const e = S.join(t, "Uploads");
  return await gr(e) ? (await R.readdir(e, { withFileTypes: !0 })).filter((s) => s.isDirectory()).map((s) => `Uploads/${s.name}`) : [];
}
function re(t, e, n, s) {
  return {
    id: W(),
    type: t,
    message: e,
    affectedFiles: n,
    ...s
  };
}
async function Xo(t) {
  const e = [], n = await qo(t), s = await Wo(t), r = await Yo(t), i = await Jo(t), o = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), a = new Map(r.map((d) => [d.krcId, d]));
  for (const d of n) {
    if (!d.krcId) {
      e.push(re("invalid-krc-filename", `Source file has no valid KRC ID pattern: ${d.fileName}`, [d.relativePath]));
      continue;
    }
    const u = o.get(d.krcId) ?? [];
    u.push(d), o.set(d.krcId, u);
  }
  for (const d of s) {
    if (!d.krcId)
      continue;
    const u = c.get(d.krcId) ?? [];
    u.push(d), c.set(d.krcId, u);
  }
  for (const [d, u] of o)
    if (u.length > 1) {
      const f = u.map((p) => p.relativePath);
      e.push(re("duplicate-krc-id", `Duplicate KRC ID ${d} found in ${u.length} source files`, f, {
        krcId: d,
        details: {
          canonical: f[0],
          duplicates: f.slice(1),
          mtimes: u.map((p) => p.mtimeMs)
        }
      }));
    }
  for (const d of n) {
    if (!d.krcId)
      continue;
    const u = c.get(d.krcId) ?? [];
    if (u.length === 0)
      e.push(re("missing-executive-session", `No executive session found for ${d.krcId}`, [d.relativePath], { krcId: d.krcId }));
    else {
      const f = u[0];
      f.categoryFolder !== d.categoryFolder && e.push(re("source-session-mismatch", `Category mismatch for ${d.krcId}: source in ${d.categoryFolder}, session in ${f.categoryFolder}`, [d.relativePath, f.relativePath], { krcId: d.krcId }));
    }
    a.has(d.krcId) || e.push(re("missing-registry-entry", `Source ${d.krcId} is missing from SOURCE_REGISTRY.md`, [d.relativePath, "Registries/SOURCE_REGISTRY.md"], { krcId: d.krcId }));
  }
  const l = new Set(n.map((d) => d.krcId).filter(Boolean));
  for (const d of s)
    d.krcId && (l.has(d.krcId) || e.push(re("orphan-executive-session", `Executive session exists without matching source for ${d.krcId}`, [d.relativePath], { krcId: d.krcId })));
  for (const d of r)
    l.has(d.krcId) || e.push(re("broken-registry-reference", `Registry references ${d.krcId} but no matching source file exists`, ["Registries/SOURCE_REGISTRY.md"], { krcId: d.krcId, details: { registryTitle: d.title } }));
  return i.length === 0 && n.length > 0 && e.push(re("upload-folder-mismatch", "No upload folders found under Uploads/ — imported assets may be missing", ["Uploads/"])), e;
}
async function Qo(t) {
  var i;
  const e = await Xo(t), n = [];
  for (const o of e)
    switch (o.type) {
      case "duplicate-krc-id": {
        const c = o.affectedFiles, a = ((i = o.details) == null ? void 0 : i.mtimes) ?? [], l = [...c].sort((u, f) => {
          const p = c.indexOf(u), h = c.indexOf(f);
          return (a[p] ?? 0) - (a[h] ?? 0);
        }), d = l[0];
        for (const u of l.slice(1))
          n.push({
            id: W(),
            issueId: o.id,
            type: "reassign-krc-id",
            description: `Reassign duplicate ${o.krcId} in ${u}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${d}`,
            riskLevel: "medium",
            autoRepairSafe: !0,
            manualReviewRequired: !1,
            affectedFiles: [u],
            metadata: {
              oldKrcId: o.krcId,
              canonicalPath: d
            }
          });
        break;
      }
      case "missing-executive-session":
        n.push({
          id: W(),
          issueId: o.id,
          type: "generate-executive-session",
          description: `Generate executive session for ${o.krcId}`,
          proposedFix: "Create placeholder executive session from source metadata with repair provenance note",
          riskLevel: "low",
          autoRepairSafe: !0,
          manualReviewRequired: !1,
          affectedFiles: o.affectedFiles,
          metadata: { krcId: o.krcId }
        });
        break;
      case "missing-registry-entry":
        n.push({
          id: W(),
          issueId: o.id,
          type: "add-registry-entry",
          description: `Add registry entry for ${o.krcId}`,
          proposedFix: "Append row to SOURCE_REGISTRY.md from source file metadata",
          riskLevel: "low",
          autoRepairSafe: !0,
          manualReviewRequired: !1,
          affectedFiles: o.affectedFiles,
          metadata: { krcId: o.krcId }
        });
        break;
      case "source-session-mismatch":
        n.push({
          id: W(),
          issueId: o.id,
          type: "generate-executive-session",
          description: `Regenerate session in matching category for ${o.krcId}`,
          proposedFix: "Generate new executive session in source category folder; preserve existing session for manual review",
          riskLevel: "medium",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: o.affectedFiles,
          metadata: { krcId: o.krcId }
        });
        break;
      case "orphan-executive-session":
        n.push({
          id: W(),
          issueId: o.id,
          type: "flag-manual-review",
          description: `Review orphan session for ${o.krcId}`,
          proposedFix: "Manual review required — do not delete without confirmation",
          riskLevel: "high",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: o.affectedFiles
        });
        break;
      case "broken-registry-reference":
        n.push({
          id: W(),
          issueId: o.id,
          type: "flag-manual-review",
          description: `Review broken registry reference for ${o.krcId}`,
          proposedFix: "Manual review required — registry row references missing source",
          riskLevel: "medium",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: o.affectedFiles,
          metadata: { krcId: o.krcId }
        });
        break;
      case "invalid-krc-filename":
        n.push({
          id: W(),
          issueId: o.id,
          type: "move-to-review",
          description: `Review source with invalid KRC filename: ${o.affectedFiles[0]}`,
          proposedFix: "Move to Other_Review_Needed and assign new KRC ID — requires manual confirmation",
          riskLevel: "high",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: o.affectedFiles
        });
        break;
      case "upload-folder-mismatch":
        n.push({
          id: W(),
          issueId: o.id,
          type: "flag-manual-review",
          description: "Review missing upload folders",
          proposedFix: "Informational — re-import or verify asset uploads manually",
          riskLevel: "low",
          autoRepairSafe: !1,
          manualReviewRequired: !0,
          affectedFiles: o.affectedFiles
        });
        break;
    }
  const s = n.filter((o) => o.autoRepairSafe && !o.manualReviewRequired).length, r = n.filter((o) => o.manualReviewRequired).length;
  return {
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: t,
    issues: e,
    actions: n,
    autoRepairCount: s,
    manualReviewCount: r
  };
}
function le(t, e) {
  var s, r;
  const n = new RegExp(`## ${e}\\s*\\n([^#\\n][^\\n]*)`, "i");
  return (r = (s = t.match(n)) == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function vn(t, e) {
  var a, l, d;
  const s = ((l = (a = (e.split("/").pop() ?? e).match(/KRC-\d{4}/i)) == null ? void 0 : a[0]) == null ? void 0 : l.toUpperCase()) ?? "KRC-0000", r = t.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m), i = ((d = r == null ? void 0 : r[2]) == null ? void 0 : d.trim()) ?? le(t, "Description") ?? "Untitled", o = e.replace(/\\/g, "/").split("/"), c = o[0] === "Sources" && o.length >= 2 ? o[1] : "Other_Review_Needed";
  return {
    krcId: s,
    title: i,
    primaryProduct: le(t, "Primary Product") ?? "Review Needed",
    topic: le(t, "Topic") ?? "ChatGPT conversation",
    status: le(t, "Status") ?? "Inventoried",
    conversationId: le(t, "ChatGPT Conversation ID"),
    createTime: le(t, "Create Time"),
    updateTime: le(t, "Update Time"),
    categoryFolder: c
  };
}
function ea(t, e, n, s) {
  let r = t;
  const i = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), o = t.match(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*(.+)$`, "m"));
  return o && (r = r.replace(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*.+$`, "m"), `# ${n} — ${o[1].trim()}`)), r.includes("## Source ID") && (r = r.replace(new RegExp(`(## Source ID\\s*\\n)${i}`, "i"), `$1${n}`)), r.includes("## KAE Repair Provenance") || (r = `${r.trimEnd()}

## KAE Repair Provenance
${s}
`), r;
}
const ta = "Generated by KAE Repository Repair because source KRC existed without matching executive session.";
function Sr(t, e, n, s = ta) {
  const r = n.title, i = n.createTime ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    t,
    "",
    "## Session Date",
    i,
    "",
    "## Classification",
    `- Primary: ${n.primaryProduct}`,
    `- Status: ${n.status}`,
    "",
    "## Session Summary",
    `Placeholder executive session generated from source record ${t}.`,
    `Topic: ${n.topic}`,
    "",
    "## Key Topics",
    `- ${n.topic}`,
    "",
    "## Action / Follow-up",
    "Review source transcript and complete capability extraction when ready.",
    "",
    "## Transcript Reference",
    e,
    "",
    "## Notes",
    s,
    `Generated on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ].join(`
`);
}
function Er(t, e) {
  return `${t}_${Xe(e)}_SESSION.md`;
}
function na(t, e) {
  return `${t}_${Xe(e)}.md`;
}
const sa = (t, e, n) => `Reassigned from ${t} to ${e} by KAE Repository Repair on ${n}. Canonical record retains ${t}; this duplicate was preserved with a new ID.`;
async function ra(t, e, n, s) {
  var v;
  const r = e.affectedFiles[0];
  if (!r)
    return {
      actionId: e.id,
      type: e.type,
      success: !1,
      message: "No source file specified",
      filesChanged: []
    };
  const i = String(((v = e.metadata) == null ? void 0 : v.oldKrcId) ?? ""), o = S.join(t, r), c = await R.readFile(o, "utf8"), a = vn(c, r);
  n.value += 1;
  const l = Et(n.value), d = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), u = sa(i, l, d), f = ea(c, i, l, u), p = S.join(t, "Sources", a.categoryFolder), h = na(l, a.title), I = S.join(p, h), b = `Sources/${a.categoryFolder}/${h}`;
  await R.mkdir(p, { recursive: !0 }), await R.writeFile(I, f, "utf8"), I !== o && await R.unlink(o);
  const C = S.join(t, "ExecutiveSessions", a.categoryFolder);
  await R.mkdir(C, { recursive: !0 });
  const A = Er(l, a.title), T = S.join(C, A), g = `ExecutiveSessions/${a.categoryFolder}/${A}`, m = Sr(l, b, { ...a, title: a.title }, `Generated by KAE Repository Repair after reassigning duplicate ${i} → ${l}.`);
  return await R.writeFile(T, m, "utf8"), await pn(t, [
    hn(l, a.title, f, a.primaryProduct)
  ]), s("info", `Reassigned duplicate ${i} → ${l}`, {
    oldPath: r,
    newPath: b,
    sessionPath: g
  }), {
    actionId: e.id,
    type: e.type,
    success: !0,
    message: `Reassigned ${i} → ${l}`,
    filesChanged: [b, g, "Registries/SOURCE_REGISTRY.md"]
  };
}
async function ia(t, e, n) {
  var p;
  const s = e.affectedFiles.find((h) => h.startsWith("Sources/"));
  if (!s)
    return {
      actionId: e.id,
      type: e.type,
      success: !1,
      message: "No source file found for session generation",
      filesChanged: []
    };
  const r = String(((p = e.metadata) == null ? void 0 : p.krcId) ?? ""), i = S.join(t, s), o = await R.readFile(i, "utf8"), c = vn(o, s), a = S.join(t, "ExecutiveSessions", c.categoryFolder);
  await R.mkdir(a, { recursive: !0 });
  const l = Er(r || c.krcId, c.title), d = S.join(a, l), u = `ExecutiveSessions/${c.categoryFolder}/${l}`;
  if (await aa(d))
    return {
      actionId: e.id,
      type: e.type,
      success: !1,
      message: `Session already exists: ${u}`,
      filesChanged: []
    };
  const f = Sr(r || c.krcId, s, c);
  return await R.writeFile(d, f, "utf8"), n("info", `Generated executive session for ${r || c.krcId}`, {
    sessionPath: u,
    sourcePath: s
  }), {
    actionId: e.id,
    type: e.type,
    success: !0,
    message: `Generated session for ${r || c.krcId}`,
    filesChanged: [u]
  };
}
async function oa(t, e, n) {
  const s = e.affectedFiles.find((c) => c.startsWith("Sources/"));
  if (!s)
    return {
      actionId: e.id,
      type: e.type,
      success: !1,
      message: "No source file for registry entry",
      filesChanged: []
    };
  const r = S.join(t, s), i = await R.readFile(r, "utf8"), o = vn(i, s);
  return await pn(t, [
    hn(o.krcId, o.title, i, o.primaryProduct)
  ]), n("info", `Added registry entry for ${o.krcId}`, { sourcePath: s }), {
    actionId: e.id,
    type: e.type,
    success: !0,
    message: `Added registry entry for ${o.krcId}`,
    filesChanged: ["Registries/SOURCE_REGISTRY.md"]
  };
}
async function aa(t) {
  try {
    return await R.access(t), !0;
  } catch {
    return !1;
  }
}
async function ca(t, e = {}) {
  const n = e.log ?? (() => {
  }), s = e.sessionId ?? `repair-${crypto.randomUUID()}`, r = t.repositoryPath, i = await ye(r);
  n("info", "Pre-repair health check complete", {
    duplicateIds: i.duplicateIds,
    issueCount: i.issues.length
  });
  const o = await tr(r, s);
  n("info", `Pre-repair snapshot created: ${o}`, { snapshotPath: o });
  const c = t.actions.filter((h) => h.autoRepairSafe && !h.manualReviewRequired), a = t.actions.length - c.length, d = { value: await St(r) }, u = [], f = [];
  for (const h of c)
    try {
      let I;
      switch (h.type) {
        case "reassign-krc-id":
          I = await ra(r, h, d, n);
          break;
        case "generate-executive-session":
          I = await ia(r, h, n);
          break;
        case "add-registry-entry":
          I = await oa(r, h, n);
          break;
        default:
          I = {
            actionId: h.id,
            type: h.type,
            success: !1,
            message: `Unsupported auto-repair action: ${h.type}`,
            filesChanged: []
          };
      }
      u.push(I), I.success && f.push(...I.filesChanged);
    } catch (I) {
      const b = I instanceof Error ? I.message : String(I);
      n("error", `Repair action failed: ${h.description} — ${b}`, {
        actionId: h.id,
        type: h.type
      }), u.push({
        actionId: h.id,
        type: h.type,
        success: !1,
        message: b,
        filesChanged: []
      });
    }
  const p = await ye(r);
  return n("info", "Post-repair health check complete", {
    duplicateIds: p.duplicateIds,
    issueCount: p.issues.length,
    ready: p.ready
  }), {
    completedAt: (/* @__PURE__ */ new Date()).toISOString(),
    snapshotPath: o,
    actionsExecuted: u,
    actionsSkipped: a,
    filesChanged: [...new Set(f)],
    healthBefore: i,
    healthAfter: p
  };
}
function ua(t, e) {
  const n = `${t} ${e ?? ""}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)/.test(n) || n.includes("screenshot") ? "image" : /\.(mp4|webm|mov|m4v|avi)/.test(n) || n.includes("video") ? "video" : "other";
}
function is(t) {
  if (!t)
    return 0;
  const e = Date.parse(t);
  return Number.isNaN(e) ? 0 : e;
}
function ie(t, e, n, s) {
  return { id: t, title: e, items: n, emptyMessage: s };
}
function oe(t, e, n) {
  return { label: t, explorerPath: e, ...n };
}
function da(t) {
  var e, n, s;
  return t.kind === "executive_session" ? {
    krcId: ((e = t.session) == null ? void 0 : e.linkedKrcId) ?? t.repository.krcId,
    sourcePath: ((n = t.session) == null ? void 0 : n.transcriptReference) ?? ((s = t.session) == null ? void 0 : s.summaryReferences.find((r) => r.startsWith("Sources/"))) ?? t.repository.repositoryPath
  } : {
    krcId: t.repository.krcId,
    sourcePath: t.repository.repositoryPath
  };
}
function la(t, e) {
  return t.records.filter((n) => n.repository.krcId === e);
}
function fa(t, e) {
  return t.records.find((n) => n.id === e);
}
function ma(t, e) {
  return t.find((n) => n.kind === "source" && n.id === `${e}:source`);
}
function pa(t, e) {
  return t.find((n) => n.kind === "conversation" && n.id === `${e}:conversation`);
}
function ha(t, e) {
  if (e)
    return t.records.find((n) => {
      var s;
      return n.kind === "executive_session" && (((s = n.session) == null ? void 0 : s.linkedKrcId) === e || n.repository.krcId === e);
    });
}
function ga(t, e) {
  if (!e || !t.message)
    return !1;
  const n = e.toLowerCase();
  return t.message.text.toLowerCase().includes(n) || xe(e).some((s) => t.message.text.toLowerCase().includes(s));
}
function ya(t, e) {
  if (!e || !t.attachment)
    return !1;
  const n = e.toLowerCase(), s = t.attachment.filename.toLowerCase();
  return s.includes(n) || xe(e).some((r) => s.includes(r));
}
function wa(t, e, n, s, r) {
  const i = [];
  return i.push(`Evidence anchor: ${t.kind.replace(/_/g, " ")}`), e && i.push(`KRC ${e}`), n && i.push(`"${n}"`), s && i.push(`matched query "${s}"`), r != null && r.excerpt ? i.push(`Session summary: ${r.excerpt}`) : t.excerpt && i.push(t.excerpt), i.join(" · ");
}
function va(t, e, n, s, r = 5) {
  var c;
  const i = /* @__PURE__ */ new Set([
    ...Ze(n),
    ...s ? xe(s) : []
  ]);
  if (i.size === 0)
    return [];
  const o = [];
  for (const a of t.records) {
    if (a.kind !== "source" || a.repository.krcId === e)
      continue;
    const l = ((c = a.conversation) == null ? void 0 : c.title) ?? "";
    let u = Ze(l).filter((f) => i.has(f)).length;
    s && l.toLowerCase().includes(s.toLowerCase()) && (u += 3), u > 0 && o.push({ record: a, score: u });
  }
  return o.sort((a, l) => {
    var d, u;
    return l.score - a.score || (((d = l.record.conversation) == null ? void 0 : d.title) ?? "").localeCompare(((u = a.record.conversation) == null ? void 0 : u.title) ?? "");
  }).slice(0, r).map((a) => a.record);
}
function Ia(t) {
  var n, s, r, i;
  let e = null;
  for (const o of t) {
    if (o.kind === "message" && o.message) {
      const c = o.message.timestamp ?? ((n = o.conversation) == null ? void 0 : n.updated) ?? "", a = is(c);
      (!e || a >= e.ms) && (e = { record: o, timestamp: c, ms: a });
    }
    if (o.kind === "attachment" && ((s = o.attachment) != null && s.resolved)) {
      const c = ((r = o.conversation) == null ? void 0 : r.updated) ?? ((i = o.conversation) == null ? void 0 : i.created) ?? "", a = is(c);
      (!e || a >= e.ms) && (e = { record: o, timestamp: c, ms: a });
    }
  }
  return e ? { record: e.record, timestamp: e.timestamp } : null;
}
function Cr(t, e, n) {
  var E, k, $, U, D, x, O, M, K, G, B, V, J, we, ve, Le, Pe, rt, Fe, it;
  const s = fa(t, e);
  if (!s)
    return null;
  const { krcId: r, sourcePath: i } = da(s), o = r ? la(t, r) : [s], c = (r ? ma(o, r) : void 0) ?? t.records.find((P) => P.kind === "source" && P.repository.repositoryPath === i) ?? (s.kind === "source" ? s : void 0), a = r ? pa(o, r) : void 0, l = a ?? c, d = ha(t, r), u = ((E = a == null ? void 0 : a.conversation) == null ? void 0 : E.title) ?? ((k = l == null ? void 0 : l.conversation) == null ? void 0 : k.title) ?? (($ = s.conversation) == null ? void 0 : $.title) ?? ((U = c == null ? void 0 : c.conversation) == null ? void 0 : U.title) ?? "Untitled", f = o.filter((P) => P.kind === "message").sort((P, z) => {
    var Oe, Ue;
    const Y = Number(((Oe = P.message) == null ? void 0 : Oe.messageId.split(":msg:")[1]) ?? 0), Dn = Number(((Ue = z.message) == null ? void 0 : Ue.messageId.split(":msg:")[1]) ?? 0);
    return Y - Dn;
  }), p = o.filter((P) => P.kind === "attachment"), h = va(t, r, u, n), I = Ia(o), b = wa(s, r, u, n, d), C = ie("sourceFile", "Source File", [
    oe((c == null ? void 0 : c.repository.repositoryPath.split("/").pop()) ?? i, i, {
      recordId: c == null ? void 0 : c.id,
      kind: "source",
      subtitle: r,
      highlighted: s.kind === "source"
    })
  ]), A = ie("conversation", "Conversation", l ? [
    oe(u, i, {
      recordId: (a == null ? void 0 : a.id) ?? (c == null ? void 0 : c.id),
      kind: (a == null ? void 0 : a.kind) ?? "conversation",
      subtitle: [
        (D = l.conversation) == null ? void 0 : D.conversationId,
        (x = l.conversation) != null && x.created ? `Created ${l.conversation.created}` : void 0,
        (O = l.conversation) != null && O.updated ? `Updated ${l.conversation.updated}` : void 0
      ].filter(Boolean).join(" · "),
      highlighted: s.kind === "conversation"
    })
  ] : [], "No conversation metadata indexed."), T = ie("messages", "Messages", f.map((P) => {
    var z, Y;
    return oe(`${((z = P.message) == null ? void 0 : z.role) ?? "Message"}: ${P.excerpt}`, i, {
      recordId: P.id,
      kind: "message",
      subtitle: (Y = P.message) == null ? void 0 : Y.timestamp,
      highlighted: P.id === s.id || ga(P, n)
    });
  }), "No messages indexed."), g = ie("attachments", "Attachments", p.map((P) => {
    var Oe, Ue, xn;
    const z = ((Oe = P.attachment) == null ? void 0 : Oe.filename) ?? "Attachment", Y = ua(z, (Ue = P.attachment) == null ? void 0 : Ue.assetPath);
    return oe(`${Y === "image" ? "Screenshot" : Y === "video" ? "Video" : "File"}: ${z}`, i, {
      recordId: P.id,
      kind: "attachment",
      subtitle: (xn = P.attachment) != null && xn.resolved ? P.attachment.assetPath : "Unresolved reference",
      highlighted: P.id === s.id || ya(P, n)
    });
  }), "No attachments indexed."), m = ie("executiveSession", "Executive Session", d ? [
    oe(((M = d.conversation) == null ? void 0 : M.title) ?? ((K = d.session) == null ? void 0 : K.sessionId) ?? "Session", d.repository.repositoryPath, {
      recordId: d.id,
      kind: "executive_session",
      subtitle: (G = d.session) == null ? void 0 : G.linkedKrcId,
      highlighted: s.kind === "executive_session"
    })
  ] : [], "No executive session indexed for this KRC."), v = ie("relatedSources", "Related Sources", h.map((P) => {
    var z;
    return oe(((z = P.conversation) == null ? void 0 : z.title) ?? P.repository.krcId ?? P.repository.repositoryPath, P.repository.repositoryPath, {
      recordId: P.id,
      kind: "source",
      subtitle: P.repository.krcId
    });
  }), "No related sources found."), y = [];
  if (y.push({
    kind: "conversation",
    label: u,
    subtitle: r,
    timestamp: ((B = a == null ? void 0 : a.conversation) == null ? void 0 : B.updated) ?? ((V = a == null ? void 0 : a.conversation) == null ? void 0 : V.created),
    explorerPath: i,
    recordId: a == null ? void 0 : a.id
  }), d && y.push({
    kind: "executive_session",
    label: ((J = d.conversation) == null ? void 0 : J.title) ?? "Executive Session",
    subtitle: (we = d.session) == null ? void 0 : we.linkedKrcId,
    timestamp: (ve = d.conversation) == null ? void 0 : ve.created,
    explorerPath: d.repository.repositoryPath,
    recordId: d.id
  }), y.push({
    kind: "related_sources",
    label: h.length > 0 ? `${h.length} related source${h.length === 1 ? "" : "s"}` : "No related sources",
    subtitle: h.slice(0, 3).map((P) => P.repository.krcId).filter(Boolean).join(", "),
    explorerPath: ((Le = h[0]) == null ? void 0 : Le.repository.repositoryPath) ?? i,
    recordId: (Pe = h[0]) == null ? void 0 : Pe.id
  }), I) {
    const P = I.record.kind === "message" ? `${(rt = I.record.message) == null ? void 0 : rt.role}: ${I.record.excerpt}` : ((Fe = I.record.attachment) == null ? void 0 : Fe.filename) ?? I.record.excerpt;
    y.push({
      kind: "newest_evidence",
      label: P,
      timestamp: I.timestamp || void 0,
      explorerPath: i,
      recordId: I.record.id
    });
  } else
    y.push({
      kind: "newest_evidence",
      label: s.excerpt || u,
      timestamp: (it = a == null ? void 0 : a.conversation) == null ? void 0 : it.updated,
      explorerPath: i,
      recordId: s.id
    });
  const w = ie("timeline", "Timeline", y.map((P) => oe(P.label, P.explorerPath, {
    recordId: P.recordId,
    subtitle: [P.subtitle, P.timestamp].filter(Boolean).join(" · ")
  })));
  return {
    anchorRecordId: e,
    anchorKrcId: r,
    anchorSourcePath: i,
    query: n,
    decisionSummary: b,
    sections: {
      decisionSummary: ie("decisionSummary", "Decision Summary", [
        oe(b, i, { highlighted: !0 })
      ]),
      sourceFile: C,
      conversation: A,
      messages: T,
      attachments: g,
      executiveSession: m,
      relatedSources: v,
      timeline: w
    },
    timeline: y
  };
}
async function Sa(t, e, n) {
  const s = await _e(t);
  return Cr(s, e, n);
}
const Ea = {
  mock: "Here's what I found:",
  openai: "OpenAI summary:",
  claude: "Claude read on this:",
  gemini: "Gemini analysis:",
  openrouter: "OpenRouter synthesis:",
  ollama: "Local model view:"
}, Ca = {
  mock: "Supporting detail:",
  openai: "GPT rationale:",
  claude: "Claude reasoning:",
  gemini: "Gemini context:",
  openrouter: "Router notes:",
  ollama: "Local notes:"
};
function ka(t) {
  return /what changed\s*[—-]/i.test(t) && /what i recommend next\s*[—-]/i.test(t);
}
function Re(t, e, n) {
  const s = t.groundedAnswer.directAnswer.trim(), r = t.groundedAnswer.reasonedSummary.trim();
  if (ka(s))
    return {
      providerId: e,
      model: n ?? "offline",
      directAnswer: s,
      reasonedSummary: r,
      usedOfflineFallback: !0
    };
  const i = Ea[e], o = Ca[e], c = /^here'?s what i found/i.test(s) ? s.replace(/^here'?s what i found:?\s*/i, `${i} `) : `${i} ${s}`;
  return {
    providerId: e,
    model: n ?? "offline",
    directAnswer: c,
    reasonedSummary: `${o} ${r}`,
    usedOfflineFallback: !0
  };
}
function Ra(t) {
  const { context: e, groundedAnswer: n } = t, s = n.evidenceUsed.slice(0, 8).map((r) => `- ${r.label}: ${r.excerpt}`);
  return [
    "You are KayD, an executive investigation partner.",
    "Use ONLY the curated evidence below. Do not invent facts or citations.",
    "Structure directAnswer as three short paragraphs:",
    "1) What changed — key finding",
    "2) Why it matters — executive significance",
    "3) What I recommend next — one concrete next step",
    "Keep reasonedSummary brief — point to evidence, do not dump citations.",
    'Return JSON: {"directAnswer":"...","reasonedSummary":"..."}',
    "",
    `Question: ${e.question}`,
    e.campaign ? `Campaign: ${e.campaign}` : "",
    e.objective ? `Objective: ${e.objective}` : "",
    e.blockers.length ? `Blockers: ${e.blockers.join("; ")}` : "",
    e.accomplishments.length ? `Accomplishments: ${e.accomplishments.join("; ")}` : "",
    "",
    "Evidence:",
    ...s,
    "",
    `Deterministic steering draft:
${n.directAnswer}`
  ].filter(Boolean).join(`
`);
}
async function ba(t) {
  const e = t.trim();
  try {
    const s = JSON.parse(e);
    if (s.directAnswer && s.reasonedSummary)
      return { directAnswer: s.directAnswer, reasonedSummary: s.reasonedSummary };
  } catch {
  }
  const n = e.match(/\{[\s\S]*\}/);
  if (!n)
    return null;
  try {
    const s = JSON.parse(n[0]);
    if (s.directAnswer && s.reasonedSummary)
      return { directAnswer: s.directAnswer, reasonedSummary: s.reasonedSummary };
  } catch {
    return null;
  }
  return null;
}
function Aa() {
  return {
    capabilities: {
      id: "mock",
      displayName: "Mock (offline)",
      supportsStreaming: !0,
      supportsTools: !1,
      requiresApiKey: !1,
      offline: !0,
      defaultModel: "mock-v1"
    },
    async reason(t) {
      return Re(t, "mock");
    }
  };
}
function $a() {
  return {
    capabilities: {
      id: "deterministic",
      displayName: "Deterministic (no AI)",
      supportsStreaming: !1,
      supportsTools: !1,
      requiresApiKey: !1,
      offline: !0
    },
    async reason(t) {
      return {
        providerId: "deterministic",
        model: "deterministic",
        directAnswer: t.groundedAnswer.directAnswer,
        reasonedSummary: t.groundedAnswer.reasonedSummary
      };
    }
  };
}
function et(t, e, n, s, r, i, o) {
  return {
    capabilities: {
      id: t,
      displayName: e,
      supportsStreaming: !1,
      supportsTools: !1,
      requiresApiKey: o,
      offline: !1,
      defaultModel: n
    },
    async reason(c, a) {
      const l = (a == null ? void 0 : a.model) ?? n;
      if (!(a != null && a.apiKey) && o)
        return Re(c, t, l);
      const d = Ra(c);
      try {
        const u = { "Content-Type": "application/json" };
        t === "claude" && (a != null && a.apiKey) ? (u["x-api-key"] = a.apiKey, u["anthropic-version"] = "2023-06-01") : a != null && a.apiKey && (u.Authorization = `Bearer ${a.apiKey}`);
        const f = await fetch(s(a ?? {}), {
          method: "POST",
          headers: u,
          body: JSON.stringify(r(d, l))
        });
        if (!f.ok)
          return { ...Re(c, t, l), usedOfflineFallback: !0 };
        const p = await f.json(), h = i(p), I = h ? await ba(h) : null;
        return I ? {
          providerId: t,
          model: l,
          directAnswer: I.directAnswer,
          reasonedSummary: I.reasonedSummary
        } : { ...Re(c, t, l), usedOfflineFallback: !0 };
      } catch {
        return { ...Re(c, t, l), usedOfflineFallback: !0 };
      }
    }
  };
}
const Ta = et("openai", "OpenAI", "gpt-4o-mini", () => "https://api.openai.com/v1/chat/completions", (t, e) => ({
  model: e,
  messages: [
    { role: "system", content: "Respond with JSON only." },
    { role: "user", content: t }
  ],
  temperature: 0.2
}), (t) => {
  var n, s, r;
  return ((r = (s = (n = t.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), Da = et("claude", "Claude", "claude-3-5-haiku-latest", () => "https://api.anthropic.com/v1/messages", (t, e) => ({
  model: e,
  max_tokens: 1024,
  messages: [{ role: "user", content: t }]
}), (t) => {
  var n, s;
  return ((s = (n = t.content) == null ? void 0 : n[0]) == null ? void 0 : s.text) ?? null;
}, !0), xa = et("gemini", "Gemini", "gemini-1.5-flash", (t) => `https://generativelanguage.googleapis.com/v1beta/models/${t.model ?? "gemini-1.5-flash"}:generateContent?key=${t.apiKey ?? ""}`, (t) => ({
  contents: [{ parts: [{ text: t }] }]
}), (t) => {
  var n, s, r, i, o;
  return ((o = (i = (r = (s = (n = t.candidates) == null ? void 0 : n[0]) == null ? void 0 : s.content) == null ? void 0 : r.parts) == null ? void 0 : i[0]) == null ? void 0 : o.text) ?? null;
}, !0), _a = et("openrouter", "OpenRouter", "openai/gpt-4o-mini", () => "https://openrouter.ai/api/v1/chat/completions", (t, e) => ({
  model: e,
  messages: [{ role: "user", content: t }]
}), (t) => {
  var n, s, r;
  return ((r = (s = (n = t.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), Na = et("ollama", "Local (Ollama)", "llama3.2", (t) => `${t.baseUrl ?? "http://127.0.0.1:11434"}/api/chat`, (t, e) => ({
  model: e,
  stream: !1,
  messages: [{ role: "user", content: t }]
}), (t) => {
  var n;
  return ((n = t.message) == null ? void 0 : n.content) ?? null;
}, !1);
function La(t, e, n) {
  return {
    providerId: t,
    status: "offline",
    message: "Provider runs in offline mode (no API key required).",
    supportsStreaming: e,
    secureStorage: n
  };
}
function os(t, e, n) {
  return {
    providerId: t,
    status: "missing_key",
    message: "API key is not configured. Using fallback responses.",
    supportsStreaming: e,
    secureStorage: n
  };
}
async function Pa(t, e, n, s, r) {
  try {
    const i = await fetch(e, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${n}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      })
    });
    return i.ok ? {
      providerId: t,
      status: "connected",
      message: "Provider responded successfully.",
      supportsStreaming: s,
      secureStorage: r
    } : {
      providerId: t,
      status: "unavailable",
      message: `Provider returned HTTP ${i.status}.`,
      supportsStreaming: s,
      secureStorage: r
    };
  } catch (i) {
    return {
      providerId: t,
      status: "unavailable",
      message: i instanceof Error ? i.message : "Provider unreachable.",
      supportsStreaming: s,
      secureStorage: r
    };
  }
}
async function as(t, e, n, s) {
  if (s.offline || t === "mock" || t === "deterministic")
    return La(t, s.supportsStreaming, n);
  if (s.requiresApiKey && !(e != null && e.apiKey))
    return os(t, s.supportsStreaming, n);
  if (t === "openai" || t === "openrouter")
    return Pa(t, t === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", (e == null ? void 0 : e.apiKey) ?? "", s.supportsStreaming, n);
  if (t === "ollama") {
    const r = (e == null ? void 0 : e.baseUrl) ?? "http://127.0.0.1:11434";
    try {
      if ((await fetch(`${r}/api/tags`)).ok)
        return {
          providerId: t,
          status: "connected",
          message: "Ollama is reachable.",
          supportsStreaming: s.supportsStreaming,
          secureStorage: n
        };
    } catch {
    }
    return {
      providerId: t,
      status: "unavailable",
      message: "Ollama is not reachable at the configured base URL.",
      supportsStreaming: s.supportsStreaming,
      secureStorage: n
    };
  }
  return e != null && e.apiKey ? {
    providerId: t,
    status: "connected",
    message: "API key configured. Live verification skipped for this provider.",
    supportsStreaming: s.supportsStreaming,
    secureStorage: n
  } : os(t, s.supportsStreaming, n);
}
function gt(t, e, n, s) {
  const r = n.split(/(\s+)/);
  for (const i of r)
    i && s({ kind: "token", text: i, providerId: t });
  s({ kind: e, text: n, providerId: t });
}
async function Fa(t, e, n, s) {
  return {
    providerId: t,
    directAnswer: e,
    reasonedSummary: n,
    usedOfflineFallback: s
  };
}
function ke(t) {
  return t.reasonStream ? t : {
    ...t,
    capabilities: { ...t.capabilities, supportsStreaming: !0 },
    async reasonStream(e, n, s) {
      const r = await t.reason(e, n);
      return gt(r.providerId, "direct_answer", r.directAnswer, s), gt(r.providerId, "summary", r.reasonedSummary, s), s({ kind: "done", text: "", providerId: r.providerId }), r;
    }
  };
}
function Oa(t) {
  return {
    ...t,
    capabilities: { ...t.capabilities, supportsStreaming: !0 },
    async reasonStream(e, n, s) {
      const r = Re(e, "mock");
      return gt("mock", "direct_answer", r.directAnswer, s), gt("mock", "summary", r.reasonedSummary, s), s({ kind: "done", text: "", providerId: "mock" }), Fa("mock", r.directAnswer, r.reasonedSummary, !0);
    }
  };
}
class Ua {
  constructor(e) {
    _(this, "providers", /* @__PURE__ */ new Map());
    _(this, "activeId", "mock");
    _(this, "credentials", {});
    _(this, "secureStorageMode", "dev_fallback");
    for (const n of e ?? Ma())
      this.providers.set(n.capabilities.id, ke(n));
  }
  register(e) {
    this.providers.set(e.capabilities.id, e);
  }
  setActive(e) {
    if (!this.providers.has(e))
      throw new Error(`Unknown AI provider: ${e}`);
    this.activeId = e;
  }
  getActiveId() {
    return this.activeId;
  }
  getActive() {
    const e = this.providers.get(this.activeId);
    if (!e)
      throw new Error(`Active provider not registered: ${this.activeId}`);
    return e;
  }
  setCredentials(e) {
    this.credentials = { ...e };
  }
  setSecureStorageMode(e) {
    this.secureStorageMode = e;
  }
  listCapabilities() {
    return [...this.providers.values()].map((e) => e.capabilities);
  }
  async reason(e) {
    return this.getActive().reason(e, this.credentials);
  }
  async reasonStream(e, n) {
    const s = this.getActive();
    if (this.credentials.streaming && s.reasonStream)
      return s.reasonStream(e, this.credentials, n);
    const r = await s.reason(e, this.credentials);
    return n({ kind: "direct_answer", text: r.directAnswer, providerId: r.providerId }), n({ kind: "summary", text: r.reasonedSummary, providerId: r.providerId }), n({ kind: "done", text: "", providerId: r.providerId }), r;
  }
  async testActiveProviderHealth() {
    const e = this.getActive();
    return as(e.capabilities.id, this.credentials, this.secureStorageMode, e.capabilities);
  }
  async testProviderHealth(e) {
    const n = this.providers.get(e);
    if (!n)
      throw new Error(`Unknown AI provider: ${e}`);
    return as(e, this.credentials, this.secureStorageMode, n.capabilities);
  }
}
function Ma() {
  return [
    $a(),
    Oa(Aa()),
    ke(Ta),
    ke(Da),
    ke(xa),
    ke(_a),
    ke(Na)
  ];
}
function ja() {
  return new Ua();
}
let Gt = null;
function ze() {
  return Gt || (Gt = ja()), Gt;
}
function Ba(t, e) {
  return {
    question: t.question,
    intent: t.intent,
    searchQuery: t.searchQuery,
    directAnswer: e.directAnswer.trim() || t.directAnswer,
    reasonedSummary: e.reasonedSummary.trim() || t.reasonedSummary,
    evidenceUsed: t.evidenceUsed,
    confidence: t.confidence,
    timeline: t.timeline,
    relatedSources: t.relatedSources,
    attachments: t.attachments,
    explorerLinks: t.explorerLinks,
    relationshipInsights: t.relationshipInsights
  };
}
function He(t) {
  return t.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function Ka(t, e, n) {
  return `${He(t)}::${e}::${He(n)}`;
}
function Q(t, e, n) {
  const s = Ka(n.fromId, n.relationshipType, n.toId);
  e.has(s) || (e.add(s), t.push({ ...n, relationshipId: s, createdAutomatically: !0 }));
}
function Ga(t) {
  const e = /* @__PURE__ */ new Map();
  for (const n of t.records) {
    const s = n.repository.krcId;
    if (!s)
      continue;
    const r = e.get(s) ?? [];
    r.push(n), e.set(s, r);
  }
  return e;
}
function cs(t) {
  return t.find((e) => e.kind === "conversation") ?? t.find((e) => e.kind === "source");
}
function za(t) {
  var n, s;
  const e = [(n = t.conversation) == null ? void 0 : n.title, t.excerpt, (s = t.message) == null ? void 0 : s.text].filter(Boolean).join(" ");
  return new Set(Ze(e));
}
function Ha(t, e) {
  return [...t].filter((n) => e.has(n));
}
function Za(t) {
  const e = t.match(/Campaign\s+[\d.]+[a-z]?/gi) ?? [];
  return [...new Set(e.map((n) => n.trim()))];
}
function ut(t, e, n, s) {
  const r = new Map(t.map((l) => [l.id, l])), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const l of t) {
    const d = za(l);
    o.set(l.id, d);
    for (const u of d) {
      if (u.length < 4)
        continue;
      const f = i.get(u) ?? [];
      f.push(l.id), i.set(u, f);
    }
  }
  const c = /* @__PURE__ */ new Map(), a = s.maxBucketSize ?? 20;
  for (const l of i.values())
    if (!(l.length < 2 || l.length > a))
      for (let d = 0; d < l.length; d++)
        for (let u = d + 1; u < l.length; u++) {
          const f = l[d] < l[u] ? `${l[d]}|${l[u]}` : `${l[u]}|${l[d]}`;
          c.set(f, (c.get(f) ?? 0) + 1);
        }
  for (const [l, d] of c) {
    if (d < s.minShared)
      continue;
    const [u, f] = l.split("|"), p = r.get(u), h = r.get(f);
    if (!p || !h || s.skipSameKrc && p.repository.krcId === h.repository.krcId)
      continue;
    const I = Ha(o.get(u) ?? /* @__PURE__ */ new Set(), o.get(f) ?? /* @__PURE__ */ new Set());
    Q(e, n, {
      fromId: p.id,
      toId: h.id,
      relationshipType: s.relationshipType,
      reason: `${s.reasonPrefix}: ${I.slice(0, 4).join(", ")}`,
      confidence: Math.min(s.maxConfidence, 35 + d * 10),
      supportingEvidenceIds: [p.id, h.id]
    });
  }
}
function Va(t) {
  var e;
  return (e = t.session) != null && e.summaryReferences ? t.session.summaryReferences.filter((n) => n.length > 2 && !n.startsWith("Sources/")).slice(0, 8) : [];
}
function qa(t) {
  var f, p, h, I, b, C, A, T, g;
  const e = [], n = /* @__PURE__ */ new Set(), s = Ga(t), r = /* @__PURE__ */ new Map();
  for (const m of t.records)
    m.kind === "executive_session" && ((f = m.session) != null && f.linkedKrcId) && r.set(m.session.linkedKrcId, m);
  for (const [m, v] of s.entries()) {
    const y = cs(v), w = v.find(($) => $.kind === "source"), E = v.filter(($) => $.kind === "attachment");
    y && w && Q(e, n, {
      fromId: y.id,
      toId: w.id,
      relationshipType: "conversation_source",
      reason: `Shared KRC ${m}`,
      confidence: 98,
      supportingEvidenceIds: [y.id, w.id]
    });
    const k = r.get(m);
    y && k && (Q(e, n, {
      fromId: y.id,
      toId: k.id,
      relationshipType: "conversation_executive_session",
      reason: `Executive session linked to ${m}`,
      confidence: 95,
      supportingEvidenceIds: [y.id, k.id]
    }), w && Q(e, n, {
      fromId: k.id,
      toId: w.id,
      relationshipType: "executive_session_source",
      reason: `Transcript reference for ${m}`,
      confidence: 96,
      supportingEvidenceIds: [k.id, w.id]
    }));
    for (const $ of E)
      y && (Q(e, n, {
        fromId: $.id,
        toId: y.id,
        relationshipType: "attachment_conversation",
        reason: `Attachment linked to conversation ${m}`,
        confidence: (p = $.attachment) != null && p.resolved ? 90 : 70,
        supportingEvidenceIds: [$.id, y.id]
      }), Q(e, n, {
        fromId: y.id,
        toId: $.id,
        relationshipType: "conversation_attachment",
        reason: `Conversation references attachment in ${m}`,
        confidence: (h = $.attachment) != null && h.resolved ? 88 : 68,
        supportingEvidenceIds: [y.id, $.id]
      })), w && Q(e, n, {
        fromId: $.id,
        toId: w.id,
        relationshipType: "attachment_source",
        reason: `Attachment referenced by source ${m}`,
        confidence: (I = $.attachment) != null && I.resolved ? 92 : 72,
        supportingEvidenceIds: [$.id, w.id]
      });
  }
  const i = [];
  for (const [, m] of s.entries()) {
    const v = cs(m);
    v && i.push(v);
  }
  ut(i, e, n, {
    relationshipType: "conversation_conversation",
    reasonPrefix: "Shared title concepts",
    minShared: 2,
    maxConfidence: 85,
    skipSameKrc: !1
  });
  const o = t.records.filter((m) => m.kind === "executive_session");
  ut(o, e, n, {
    relationshipType: "executive_session_executive_session",
    reasonPrefix: "Shared session topics",
    minShared: 2,
    maxConfidence: 80,
    skipSameKrc: !1
  });
  const c = t.records.filter((m) => {
    var y;
    if (m.kind === "executive_session")
      return !0;
    const v = `${m.excerpt} ${((y = m.message) == null ? void 0 : y.text) ?? ""}`.toLowerCase();
    return /\b(decision|decided|agreed|conclusion)\b/.test(v);
  });
  ut(c, e, n, {
    relationshipType: "decision_decision",
    reasonPrefix: "Shared decision language",
    minShared: 2,
    maxConfidence: 78,
    skipSameKrc: !0,
    maxBucketSize: 25
  }), ut(i, e, n, {
    relationshipType: "topic_topic",
    reasonPrefix: "Shared topic",
    minShared: 1,
    maxConfidence: 65,
    skipSameKrc: !1,
    maxBucketSize: 12
  });
  const a = /* @__PURE__ */ new Map();
  for (const m of t.records) {
    const v = [m.excerpt, (b = m.message) == null ? void 0 : b.text, (C = m.conversation) == null ? void 0 : C.title].filter(Boolean).join(" ");
    for (const y of Za(v)) {
      const w = He(y), E = a.get(w) ?? [];
      E.push(m), a.set(w, E);
    }
  }
  for (const [m, v] of a.entries()) {
    const y = [...new Map(v.map((w) => [w.id, w])).values()];
    if (!(y.length < 2 || y.length > 30))
      for (let w = 0; w < y.length; w++)
        for (let E = w + 1; E < y.length; E++)
          Q(e, n, {
            fromId: y[w].id,
            toId: y[E].id,
            relationshipType: "campaign_campaign",
            reason: `Shared campaign reference (${m.replace(/-/g, " ")})`,
            confidence: 82,
            supportingEvidenceIds: [y[w].id, y[E].id]
          });
  }
  const l = /* @__PURE__ */ new Map();
  for (const m of o)
    for (const v of Va(m)) {
      const y = He(v), w = l.get(y) ?? [];
      w.push(m), l.set(y, w);
    }
  for (const [, m] of l.entries())
    if (!(m.length < 2))
      for (let v = 0; v < m.length; v++)
        for (let y = v + 1; y < m.length; y++)
          Q(e, n, {
            fromId: m[v].id,
            toId: m[y].id,
            relationshipType: "capability_capability",
            reason: `Shared capability "${((A = m[v].conversation) == null ? void 0 : A.title) ?? "capability"}"`,
            confidence: 72,
            supportingEvidenceIds: [m[v].id, m[y].id]
          });
  const d = t.records.filter((m) => m.kind === "attachment"), u = /* @__PURE__ */ new Map();
  for (const m of d) {
    const v = He(((T = m.attachment) == null ? void 0 : T.filename) ?? m.excerpt), y = u.get(v) ?? [];
    y.push(m), u.set(v, y);
  }
  for (const [, m] of u.entries())
    if (!(m.length < 2))
      for (let v = 0; v < m.length; v++)
        for (let y = v + 1; y < m.length; y++)
          m[v].repository.krcId !== m[y].repository.krcId && Q(e, n, {
            fromId: m[v].id,
            toId: m[y].id,
            relationshipType: "attachment_conversation",
            reason: `Shared attachment filename "${((g = m[v].attachment) == null ? void 0 : g.filename) ?? "file"}"`,
            confidence: 74,
            supportingEvidenceIds: [m[v].id, m[y].id]
          });
  return e;
}
const Wa = "relationship-index.json", Ya = 1;
function Rt(t) {
  return S.join(t, De, Wa);
}
async function kr(t) {
  try {
    const e = await R.readFile(Rt(t), "utf8"), n = JSON.parse(e);
    return n.version !== Ya || !Array.isArray(n.relationships) ? null : n;
  } catch {
    return null;
  }
}
async function Ja(t, e) {
  const n = S.join(t, De);
  await R.mkdir(n, { recursive: !0 });
  const s = Rt(t);
  return await R.writeFile(s, JSON.stringify(e, null, 2), "utf8"), s;
}
function Xa(t) {
  var e;
  return t.kind === "attachment" && t.attachment ? t.attachment.filename : ((e = t.conversation) == null ? void 0 : e.title) ?? t.repository.krcId ?? t.id;
}
function Qa(t, e) {
  return {
    recordId: t.id,
    label: Xa(t),
    excerpt: t.excerpt,
    explorerPath: t.repository.repositoryPath,
    krcId: t.repository.krcId,
    kind: t.kind,
    relationshipType: e.relationshipType,
    reason: e.reason,
    confidence: e.confidence
  };
}
function ec(t, e) {
  return t.records.find((n) => n.id === e) ?? t.records.find((n) => n.repository.krcId === e) ?? t.records.find((n) => n.id.startsWith(`${e}:`));
}
async function Te(t) {
  const e = await _e(t), n = qa(e), s = (/* @__PURE__ */ new Date()).toISOString(), r = {
    version: 1,
    repositoryPath: t,
    builtAt: s,
    relationshipCount: n.length,
    relationships: n
  };
  return await Ja(t, r), r;
}
async function qe(t) {
  const e = await kr(t);
  return e && e.repositoryPath === t ? e : Te(t);
}
function tc(t) {
  const e = {};
  for (const n of t.relationships)
    e[n.relationshipType] = (e[n.relationshipType] ?? 0) + 1;
  return {
    builtAt: t.builtAt,
    relationshipCount: t.relationshipCount,
    byType: e
  };
}
function Xt(t, e, n = 50) {
  const s = xe(e), r = e.toLowerCase(), i = [];
  for (const o of t.relationships) {
    const c = `${o.fromId} ${o.toId} ${o.relationshipType} ${o.reason}`.toLowerCase();
    let a = 0;
    c.includes(r) && (a += 20), a += s.filter((l) => c.includes(l)).length * 8, a > 0 && i.push({ rel: o, score: a });
  }
  return i.sort((o, c) => c.score - o.score || c.rel.confidence - o.rel.confidence).slice(0, n).map((o) => o.rel);
}
function Rr(t, e) {
  const n = e.toLowerCase();
  return t.relationships.filter((s) => {
    if (s.fromId === e || s.toId === e || s.supportingEvidenceIds.includes(e))
      return !0;
    if (n.startsWith("krc-")) {
      const r = (i) => i.toLowerCase().startsWith(n);
      if (r(s.fromId) || r(s.toId) || s.supportingEvidenceIds.some(r))
        return !0;
    }
    return s.reason.toLowerCase().includes(n);
  });
}
async function br(t, e, n, s = 20) {
  const [r, i] = await Promise.all([
    _e(t),
    qe(t)
  ]);
  let o = Rr(i, e);
  o.length === 0 && n && (o = Xt(i, n, s * 3)), o.length === 0 && (o = Xt(i, e, s * 3));
  const c = [], a = /* @__PURE__ */ new Set();
  for (const l of o.sort((d, u) => u.confidence - d.confidence)) {
    const d = l.fromId === e || l.supportingEvidenceIds[0] === e ? l.toId : l.fromId, u = ec(r, d);
    if (!(!u || a.has(u.id)) && (a.add(u.id), c.push(Qa(u, l)), c.length >= s))
      break;
  }
  return c;
}
function nc(t) {
  const e = [], n = [], s = [], r = [], i = [];
  for (const o of t)
    o.relationshipType === "decision_decision" && e.push(o), (o.relationshipType === "conversation_conversation" || o.relationshipType === "conversation_source" || o.kind === "conversation" || o.kind === "source") && n.push(o), o.relationshipType === "campaign_campaign" && s.push(o), (o.relationshipType === "attachment_source" || o.relationshipType === "attachment_conversation" || o.relationshipType === "conversation_attachment" || o.kind === "attachment") && r.push(o), (o.relationshipType === "conversation_executive_session" || o.relationshipType === "executive_session_executive_session" || o.relationshipType === "executive_session_source" || o.kind === "executive_session") && i.push(o);
  return {
    relatedDecisions: e,
    relatedConversations: n,
    relatedCampaigns: s,
    relatedAttachments: r,
    relatedExecutiveSessions: i
  };
}
const sc = [
  /\bwhat did we decide\b/i,
  /\bwhat was decided\b/i,
  /\bour decision\b/i,
  /\bdecide about\b/i
], rc = [/\bsummarize\b/i, /\bsummary of\b/i, /\bgive me an overview\b/i], ic = [
  /\bshow evidence\b/i,
  /\bprove that\b/i,
  /\bevidence that\b/i,
  /\bdemonstrate\b/i
], oc = [
  /\bblockers?\b/i,
  /\bunresolved\b/i,
  /\bremaining\b/i,
  /\bissues?\b/i,
  /\brisks?\b/i,
  /\btodo\b/i,
  /\bopen problems?\b/i
], ac = [
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
function Ar(t) {
  const e = t.trim();
  return sc.some((n) => n.test(e)) ? "decision" : rc.some((n) => n.test(e)) ? "summarize" : ic.some((n) => n.test(e)) ? "show_evidence" : oc.some((n) => n.test(e)) ? "blockers" : "general";
}
function cc(t) {
  let e = t.trim();
  for (const n of ac)
    e = e.replace(n, "");
  return e = e.replace(/\b(in kae|for kae)\b/gi, "").trim(), e || t.trim();
}
const uc = ["decided", "decision", "agreed", "conclusion", "resolved", "plan"], dc = [
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
function In(t) {
  const e = t.toLowerCase();
  return dc.some((n) => e.includes(n));
}
function bt(t) {
  const e = t.toLowerCase();
  return uc.some((n) => e.includes(n));
}
function lc(t) {
  if (!t)
    return 0;
  const e = Date.parse(t);
  return Number.isNaN(e) ? 0 : e;
}
function yt(t) {
  var e, n, s;
  return lc(((e = t.message) == null ? void 0 : e.timestamp) ?? ((n = t.conversation) == null ? void 0 : n.updated) ?? ((s = t.conversation) == null ? void 0 : s.created));
}
function Sn(t) {
  var e, n, s, r;
  return [
    t.excerpt,
    (e = t.message) == null ? void 0 : e.text,
    (n = t.conversation) == null ? void 0 : n.title,
    (r = (s = t.session) == null ? void 0 : s.summaryReferences) == null ? void 0 : r.join(" ")
  ].filter(Boolean).join(" ");
}
function $r(t) {
  var e;
  return t.kind === "attachment" && t.attachment ? t.attachment.filename : ((e = t.conversation) == null ? void 0 : e.title) ?? t.repository.krcId ?? t.id;
}
function En(t) {
  return {
    recordId: t.id,
    label: $r(t),
    explorerPath: t.repository.repositoryPath,
    krcId: t.repository.krcId,
    kind: t.kind
  };
}
function Tr(t) {
  return {
    label: t.message,
    explorerPath: t.relativePath ?? "Registries/SOURCE_REGISTRY.md"
  };
}
function fc(t) {
  return t.kind === "executive_session" ? 92 : bt(Sn(t)) ? 78 : 65;
}
function us(t, e) {
  return t.find((n) => n.id === e) ?? t.find((n) => n.repository.krcId === e) ?? t.find((n) => e.startsWith(n.repository.krcId ?? ""));
}
function mc(t) {
  const e = t.filter((r) => {
    const i = Sn(r);
    return r.kind === "executive_session" || bt(i);
  }).sort((r, i) => yt(i) - yt(r)).slice(0, 4), n = e[0], s = n ? fc(n) : 50;
  return {
    cardId: "recent-decisions",
    category: "recent_decision",
    title: "Recent Decisions",
    summary: n ? `${$r(n)} — ${n.excerpt.slice(0, 140)}${n.excerpt.length > 140 ? "…" : ""}` : "No indexed decision evidence found yet.",
    whyItMatters: "Recent decisions anchor what the team agreed to and what Vigsy can ground answers on.",
    confidence: s,
    evidenceLinks: e.map(En)
  };
}
function pc(t, e) {
  const n = e.issues.filter((a) => a.severity === "error" || a.severity === "warning"), s = t.filter((a) => In(Sn(a))).sort((a, l) => yt(l) - yt(a)).slice(0, 4), r = [
    ...n.slice(0, 2).map(Tr),
    ...s.map(En)
  ], i = /* @__PURE__ */ new Set(), o = r.filter((a) => {
    const l = a.recordId ?? a.explorerPath;
    return i.has(l) ? !1 : (i.add(l), !0);
  });
  return o.length === 0 ? {
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
    summary: o[0].label,
    whyItMatters: "Unresolved blockers can stall campaigns until they are visible and tracked.",
    confidence: n.length > 0 ? 90 : 72,
    evidenceLinks: o.slice(0, 4)
  };
}
function hc(t) {
  const e = [...t].sort((s, r) => r.sortTime.localeCompare(s.sortTime)), n = e[0];
  return {
    cardId: "recent-imports",
    category: "recent_import",
    title: "Recent Imports",
    summary: n ? `Latest ChatGPT import: ${n.title} (${n.krcId})` : "No ChatGPT imports indexed in the repository.",
    whyItMatters: "Fresh imports expand the evidence Vigsy can search, relate, and reason over.",
    confidence: n ? 94 : 60,
    evidenceLinks: e.slice(0, 3).map((s) => ({
      label: `${s.krcId} — ${s.title}`,
      explorerPath: s.relativePath,
      krcId: s.krcId,
      kind: "source"
    }))
  };
}
function gc(t) {
  const e = t.reason.match(/"([^"]+)"/);
  return (e == null ? void 0 : e[1]) ?? t.reason.replace(/^Shared (topic|campaign reference) /i, "").trim();
}
function yc(t, e) {
  const n = /* @__PURE__ */ new Map();
  for (const l of e) {
    if (l.relationshipType !== "campaign_campaign" && l.relationshipType !== "topic_topic" && l.relationshipType !== "conversation_conversation")
      continue;
    const d = gc(l), u = n.get(d);
    u ? u.count += 1 : n.set(d, { count: 1, rel: l });
  }
  const r = [...n.entries()].sort((l, d) => d[1].count - l[1].count)[0];
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
  const [i, { count: o, rel: c }] = r, a = us(t, c.toId) ?? us(t, c.fromId) ?? t[0];
  return {
    cardId: "high-relationship-topic",
    category: "high_relationship_topic",
    title: "High-Relationship Topic",
    summary: `"${i}" appears in ${o} indexed relationships.`,
    whyItMatters: "Topics with many relationships are strong anchors for executive awareness and follow-up questions.",
    confidence: Math.min(95, 60 + o * 3),
    evidenceLinks: a ? [En(a)] : [
      {
        label: c.reason,
        explorerPath: c.supportingEvidenceIds[0] ?? "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
function wc(t) {
  const e = [];
  for (const i of t.categorizedIssues.recommendations.slice(0, 3))
    e.push({
      label: i.recovery ? `${i.message} — ${i.recovery}` : i.message,
      explorerPath: i.relativePath ?? "Registries/SOURCE_REGISTRY.md"
    });
  for (const i of t.issues.filter((o) => o.recovery).slice(0, 3)) {
    if (e.length >= 4)
      break;
    e.push({
      label: `${i.message} — ${i.recovery}`,
      explorerPath: i.relativePath ?? "Registries/SOURCE_REGISTRY.md"
    });
  }
  t.gitReady || e.push({
    label: "Review git readiness before the next import",
    explorerPath: "Registries/SOURCE_REGISTRY.md"
  }), t.gitDirty && e.push({
    label: "Commit or stash uncommitted repository changes",
    explorerPath: "Registries/SOURCE_REGISTRY.md"
  });
  const n = /* @__PURE__ */ new Set(), s = e.filter((i) => n.has(i.label) ? !1 : (n.add(i.label), !0)), r = s.length > 0 ? s : [
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
function vc(t) {
  const e = t.statusLevel === "healthy" ? 93 : t.statusLevel === "attention" ? 78 : 62;
  return {
    cardId: "repository-health",
    category: "repository_health",
    title: "Repository Health",
    summary: t.statusHeadline,
    whyItMatters: t.statusSubline,
    confidence: e,
    evidenceLinks: t.issues.length > 0 ? t.issues.slice(0, 4).map(Tr) : [
      {
        label: "Repository structure verified",
        explorerPath: "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
async function Dr(t) {
  const [e, n, s, , r] = await Promise.all([
    _e(t),
    qe(t),
    ye(t),
    hr(t),
    nr(t)
  ]), i = [
    mc(e.records),
    pc(e.records, s),
    hc(r),
    yc(e.records, n.relationships),
    wc(s),
    vc(s)
  ];
  return {
    version: 1,
    repositoryPath: t,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceRecordCount: e.recordCount,
    relationshipCount: n.relationshipCount,
    cards: i
  };
}
const Ic = "executive-briefing-cache.json", xr = 1;
function _r(t) {
  return S.join(t, De, Ic);
}
async function Sc(t) {
  const e = Ct(t), n = Rt(t), [s, r] = await Promise.all([
    cr(t),
    kr(t)
  ]);
  let i = 0, o = 0;
  try {
    i = (await R.stat(e)).mtimeMs;
  } catch {
  }
  try {
    o = (await R.stat(n)).mtimeMs;
  } catch {
  }
  return {
    evidenceIndexBuiltAt: (s == null ? void 0 : s.builtAt) ?? "",
    evidenceIndexMtimeMs: i,
    relationshipIndexBuiltAt: (r == null ? void 0 : r.builtAt) ?? "",
    relationshipIndexMtimeMs: o
  };
}
async function Ec(t) {
  try {
    const e = await R.readFile(_r(t), "utf8"), n = JSON.parse(e);
    return n.version !== xr || !n.briefing || !Array.isArray(n.briefing.cards) ? null : n;
  } catch {
    return null;
  }
}
async function Nr(t, e, n) {
  const s = await Sc(t), r = {
    version: xr,
    repositoryPath: t,
    cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceIndexBuiltAt: s.evidenceIndexBuiltAt,
    evidenceIndexMtimeMs: s.evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: s.relationshipIndexBuiltAt,
    relationshipIndexMtimeMs: s.relationshipIndexMtimeMs,
    briefing: e
  }, i = S.join(t, De);
  await R.mkdir(i, { recursive: !0 });
  const o = _r(t);
  return await R.writeFile(o, JSON.stringify(r, null, 2), "utf8"), o;
}
async function Cc(t, e) {
  try {
    if ((await R.stat(Ct(t))).mtimeMs > e.evidenceIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  try {
    if ((await R.stat(Rt(t))).mtimeMs > e.relationshipIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  return !1;
}
async function Lr(t) {
  const e = await Ec(t);
  if (!e || e.repositoryPath !== t) {
    const s = await Dr(t);
    return await Nr(t, s), { briefing: s, fromCache: !1, stale: !1 };
  }
  const n = await Cc(t, e);
  return { briefing: e.briefing, fromCache: !0, stale: n };
}
async function tt(t) {
  const e = await Dr(t);
  return await Nr(t, e), e;
}
const kc = "executive-memory", Pr = "Albert";
function At(t) {
  return S.join(t, ".kae-sessions", kc);
}
function Fr(t) {
  return S.join(At(t), "manifest.json");
}
function Qt(t, e) {
  return S.join(At(t), "sessions", `${e}.json`);
}
function Or(t, e) {
  return S.join(At(t), "archive", `${e}.json`);
}
async function Ur(t) {
  const e = At(t);
  await R.mkdir(S.join(e, "sessions"), { recursive: !0 }), await R.mkdir(S.join(e, "archive"), { recursive: !0 });
}
async function nt(t) {
  try {
    const e = await R.readFile(Fr(t), "utf8"), n = JSON.parse(e);
    if (n.version === 1 && n.repositoryPath)
      return n;
  } catch {
  }
  return {
    version: 1,
    repositoryPath: t,
    founderName: Pr,
    sessions: []
  };
}
async function Mr(t, e) {
  await Ur(t), await R.writeFile(Fr(t), JSON.stringify(e, null, 2), "utf8");
}
async function $t(t, e) {
  const s = (await nt(t)).sessions.find((r) => r.conversationId === e);
  return s ? Cn(t, s.sessionId) : null;
}
async function Cn(t, e) {
  for (const n of [
    () => R.readFile(Qt(t, e), "utf8"),
    () => R.readFile(Or(t, e), "utf8")
  ])
    try {
      const s = await n(), r = JSON.parse(s);
      if (r.sessionId && r.conversationId)
        return r;
    } catch {
    }
  return null;
}
async function jr(t) {
  const e = await nt(t);
  return e.activeSessionId ? Cn(t, e.activeSessionId) : null;
}
async function We(t, e, n) {
  await Ur(t);
  const s = n != null && n.archive ? Or(t, e.sessionId) : Qt(t, e.sessionId);
  if (await R.writeFile(s, JSON.stringify(e, null, 2), "utf8"), n != null && n.archive)
    try {
      await R.unlink(Qt(t, e.sessionId));
    } catch {
    }
}
function Br(t, e = "Vigsy conversation") {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    sessionId: W(),
    conversationId: t,
    lifecycle: "active",
    title: e,
    createdAt: n,
    updatedAt: n,
    currentDecisions: [],
    currentBlockers: [],
    currentAccomplishments: [],
    currentFiles: [],
    currentEvidence: [],
    currentRepositoryChanges: [],
    unfinishedWork: []
  };
}
async function wt(t, e, n = !0) {
  const s = await nt(t);
  s.repositoryPath = t, s.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString(), n && (s.activeSessionId = e.sessionId);
  const r = s.sessions.findIndex((o) => o.sessionId === e.sessionId), i = {
    sessionId: e.sessionId,
    conversationId: e.conversationId,
    lifecycle: e.lifecycle,
    updatedAt: e.updatedAt
  };
  return r >= 0 ? s.sessions[r] = i : s.sessions.push(i), await Mr(t, s), s;
}
async function Rc(t, e) {
  await qe(t);
  const n = [
    ...e.evidenceUsed.map((d) => d.recordId),
    ...e.explorerLinks.map((d) => d.krcId).filter(Boolean)
  ], s = [...new Set(n)].slice(0, 5), r = [];
  for (const d of s) {
    const u = await br(t, d, e.searchQuery, 12);
    r.push(...u);
  }
  const i = /* @__PURE__ */ new Map();
  for (const d of r) {
    const u = i.get(d.recordId);
    (!u || d.confidence > u.confidence) && i.set(d.recordId, d);
  }
  const o = nc([...i.values()]), c = {
    relatedDecisions: o.relatedDecisions.slice(0, 6),
    relatedConversations: o.relatedConversations.slice(0, 6),
    relatedCampaigns: o.relatedCampaigns.slice(0, 6),
    relatedAttachments: o.relatedAttachments.slice(0, 6),
    relatedExecutiveSessions: o.relatedExecutiveSessions.slice(0, 6)
  }, a = [...e.relatedSources], l = new Set(a.map((d) => d.recordId));
  for (const d of o.relatedConversations.slice(0, 4))
    l.has(d.recordId) || (l.add(d.recordId), a.push({
      recordId: d.recordId,
      label: d.label,
      excerpt: d.excerpt,
      explorerPath: d.explorerPath,
      krcId: d.krcId,
      kind: d.kind
    }));
  return {
    ...e,
    relatedSources: a,
    relationshipInsights: c
  };
}
function bc(t) {
  if (!t)
    return 0;
  const e = Date.parse(t);
  return Number.isNaN(e) ? 0 : e;
}
function ds(t) {
  var r, i, o;
  const e = ((r = t.message) == null ? void 0 : r.timestamp) ?? ((i = t.conversation) == null ? void 0 : i.updated) ?? ((o = t.conversation) == null ? void 0 : o.created) ?? "", n = bc(e);
  if (!n)
    return 0;
  const s = (Date.now() - n) / (1e3 * 60 * 60 * 24);
  return s < 30 ? 15 : s < 180 ? 8 : 0;
}
function Ac(t, e, n) {
  var o, c, a, l, d, u;
  const s = [];
  let r = 0;
  const i = [
    t.excerpt,
    (o = t.message) == null ? void 0 : o.text,
    (c = t.conversation) == null ? void 0 : c.title,
    (l = (a = t.session) == null ? void 0 : a.summaryReferences) == null ? void 0 : l.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
  if (e === "decision" && (t.kind === "executive_session" && (r += 45, s.push("executive session")), t.kind === "message" && ((d = t.message) != null && d.role.toLowerCase().includes("assistant")) && (r += 20, s.push("assistant response")), bt(i) && (r += 25, s.push("decision language")), r += ds(t), ds(t) > 0 && s.push("recent evidence")), e === "summarize" && ((t.kind === "conversation" || t.kind === "source") && (r += 30, s.push("conversation source")), t.kind === "executive_session" && (r += 25, s.push("session summary"))), e === "show_evidence") {
    if (t.kind === "attachment") {
      r += 50, s.push("attachment evidence");
      const f = ((u = t.attachment) == null ? void 0 : u.filename.toLowerCase()) ?? "";
      (f.includes("video") || /\.(mp4|webm|mov)/.test(f)) && (r += 30, s.push("video attachment")), (f.includes("screenshot") || /\.(png|jpe?g)/.test(f)) && (r += 20, s.push("image attachment"));
    }
    t.kind === "source" && (r += 25, s.push("source file")), t.kind === "message" && (r += 15, s.push("message evidence"));
  }
  return e === "blockers" && (In(i) && (r += 50, s.push("blocker language")), (t.kind === "executive_session" || t.kind === "message") && (r += 15, s.push("narrative evidence"))), n.length > 1 && n.every((f) => i.includes(f)) && (r += 20, s.push("all query terms matched")), { boost: r, reasons: s };
}
function $c(t, e, n) {
  var s, r, i;
  return {
    recordId: t.recordId,
    kind: t.kind,
    score: t.score,
    title: t.title,
    excerpt: t.snippet,
    explorerPath: t.drilldownPath,
    krcId: t.krcId,
    conversationTitle: t.conversationTitle,
    messageRole: t.messageRole,
    matchReasons: [...t.matchFields, ...n],
    timestamp: ((s = e.message) == null ? void 0 : s.timestamp) ?? ((r = e.conversation) == null ? void 0 : r.updated) ?? ((i = e.conversation) == null ? void 0 : i.created)
  };
}
function Tc(t, e, n = 30) {
  var u;
  const s = Ar(e), r = cc(e), i = xe(r), o = lr(t, r, 80), c = new Map(t.records.map((f) => [f.id, f])), a = [];
  for (const f of o) {
    const p = c.get(f.recordId);
    if (!p)
      continue;
    const { boost: h, reasons: I } = Ac(p, s, i);
    a.push({
      ...$c(f, p, I),
      score: f.score + h
    });
  }
  a.sort((f, p) => p.score - f.score);
  const l = [], d = /* @__PURE__ */ new Set();
  for (const f of a)
    if (!d.has(f.recordId) && (d.add(f.recordId), l.push(f), l.length >= n))
      break;
  if (s === "show_evidence") {
    const f = /video|mp4|webm|mov/i.test(r), p = l.some((h) => h.kind === "attachment");
    if (f && !p)
      for (const h of t.records) {
        if (h.kind !== "attachment" || !h.attachment)
          continue;
        const I = h.attachment.filename.toLowerCase();
        if (!(!I.includes("video") && !/\.(mp4|webm|mov|m4v)/.test(I)) && !d.has(h.id) && (d.add(h.id), l.push({
          recordId: h.id,
          kind: "attachment",
          score: 60,
          title: h.attachment.filename,
          excerpt: h.excerpt,
          explorerPath: h.repository.repositoryPath,
          krcId: h.repository.krcId,
          conversationTitle: (u = h.conversation) == null ? void 0 : u.title,
          matchReasons: ["video attachment scan"]
        }), l.filter((b) => b.kind === "attachment").length >= 5))
          break;
      }
  }
  return { intent: s, searchQuery: r, queryTerms: i, items: l };
}
function Dc(t, e, n, s = 3) {
  const r = /* @__PURE__ */ new Set(), i = [];
  for (const o of e) {
    if (!o.krcId || r.has(o.krcId))
      continue;
    r.add(o.krcId);
    const c = e.find((l) => l.krcId === o.krcId);
    if (!c)
      continue;
    const a = Cr(t, c.recordId, n);
    if (a && i.push(a), i.length >= s)
      break;
  }
  return i;
}
function xc(t) {
  const e = [], n = /* @__PURE__ */ new Set();
  for (const s of t)
    !s.krcId || n.has(s.krcId) || (n.add(s.krcId), e.push(s.krcId));
  return e;
}
function _c(t) {
  const e = [], n = /* @__PURE__ */ new Set();
  for (const s of t)
    for (const r of s.timeline) {
      const i = `${r.kind}:${r.explorerPath}:${r.label}`;
      n.has(i) || (n.add(i), e.push(r));
    }
  return e.slice(0, 8);
}
function Nc(t) {
  const e = [];
  for (const n of t)
    for (const s of n.sections.relatedSources.items)
      e.push({
        recordId: s.recordId ?? s.explorerPath,
        kind: s.kind ?? "source",
        score: 0,
        title: s.label,
        excerpt: s.subtitle ?? s.label,
        explorerPath: s.explorerPath,
        krcId: s.subtitle,
        matchReasons: ["related source"]
      });
  return e;
}
function Lc(t, e) {
  const { intent: n, searchQuery: s, queryTerms: r, items: i } = Tc(t, e), o = Dc(t, i, s).filter((u) => u !== null), c = i.filter((u) => u.kind === "executive_session");
  let a = i.filter((u) => u.kind === "attachment");
  const l = i.filter((u) => u.kind === "message");
  if (n === "show_evidence" && a.length === 0)
    for (const u of o)
      for (const f of u.sections.attachments.items)
        a.push({
          recordId: f.recordId ?? f.explorerPath,
          kind: "attachment",
          score: 0,
          title: f.label,
          excerpt: f.subtitle ?? f.label,
          explorerPath: f.explorerPath,
          krcId: u.anchorKrcId,
          matchReasons: ["drilldown attachment"]
        });
  const d = Nc(o);
  return {
    question: e,
    intent: n,
    searchQuery: s,
    queryTerms: r,
    items: i,
    topKrcIds: xc(i),
    executiveSessions: c,
    attachments: a,
    messages: l,
    relatedSources: d,
    timeline: _c(o)
  };
}
function Pc(t) {
  const e = t.executiveMemory ?? null, n = t.conversation ?? { turns: [] };
  return {
    question: t.question,
    repositoryPath: t.repositoryPath,
    conversation: n,
    executiveMemory: e,
    evidence: t.evidence,
    executiveBriefing: t.executiveBriefing ?? null,
    campaign: e == null ? void 0 : e.currentCampaign,
    objective: e == null ? void 0 : e.currentObjective,
    blockers: [
      ...(e == null ? void 0 : e.currentBlockers.map((s) => s.label)) ?? [],
      ...(e == null ? void 0 : e.unfinishedWork) ?? []
    ],
    accomplishments: (e == null ? void 0 : e.currentAccomplishments.map((s) => s.label)) ?? [],
    repositorySummary: t.executiveBriefing ? `${t.executiveBriefing.evidenceRecordCount} evidence records; ${t.executiveBriefing.relationshipCount} relationships` : void 0
  };
}
function Fc(t) {
  return t == null ? void 0 : t.conversationContext;
}
function be(t, e = 220) {
  var r, i;
  const n = t.trim().replace(/^#+\s*/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\bKRC-\d+\b/gi, "").replace(/\s+/g, " ");
  if (!n)
    return "";
  if (n.length <= e)
    return n;
  const s = (i = (r = n.match(/^[^.!?]+[.!?]/)) == null ? void 0 : r[0]) == null ? void 0 : i.trim();
  return s && s.length <= e ? s : `${n.slice(0, e - 1).trim()}…`;
}
function dt(t) {
  return t.replace(/^#+\s*/gm, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\bKRC-\d+\b/gi, "").replace(/\s+/g, " ").trim();
}
function Kr(t) {
  return t.items[0];
}
function Oc(t, e) {
  const n = t.searchQuery;
  return e.level === "insufficient" ? `We're early on "${n}" — I need a bit more context before I can brief with confidence.` : t.executiveSessions.length > 0 ? `We're working "${n}" in line with your active executive sessions and recent decisions.` : `We're looking at "${n}" — I'll keep this grounded in progress, decisions, and what matters next.`;
}
function Uc(t) {
  const e = t.executiveSessions[0];
  if (!e)
    return null;
  const n = e.conversationTitle ?? e.title, s = be(e.excerpt, 200);
  return s ? `We were last focused on ${n}. ${s}` : `We were last focused on ${n}.`;
}
function Mc(t, e) {
  if (e.level === "insufficient" || t.items.length === 0)
    return "Not much new has landed in the evidence index since we last looked at this thread.";
  const n = Kr(t), s = be(n.excerpt, 240);
  switch (t.intent) {
    case "decision": {
      const i = t.executiveSessions[0];
      if (i)
        return `A decision thread is active — ${be(i.excerpt, 220)}`;
      break;
    }
    case "summarize":
      return be(t.items.slice(0, 3).map((o) => o.excerpt).join(" "), 260) || "The through-line across recent work is becoming clearer.";
    case "blockers": {
      const i = t.items.filter((o) => /blocker|unresolved|remaining|issue|risk|todo|pending|missing/i.test(o.excerpt));
      if (i.length > 0)
        return `${i.length} open thread(s) mention blockers or unresolved work — ${be(i[0].excerpt, 180)}`;
      break;
    }
  }
  const r = t.topKrcIds.length > 1 ? ` ${t.topKrcIds.length} threads corroborate this.` : "";
  return s ? `${s}${r}` : "Recent work on this topic has shifted since the last session.";
}
function jc(t) {
  const e = [], n = t.items.filter((s) => /blocker|unresolved|remaining|issue|risk|todo|pending|missing|attention|repair/i.test(s.excerpt));
  for (const s of n.slice(0, 4)) {
    const r = be(s.excerpt, 140);
    r && !e.includes(r) && e.push(r);
  }
  return t.intent === "blockers" && e.length === 0 && e.push("Confirm whether any blocker still blocks the next executive move."), e.length === 0 ? "• Nothing urgent is flagged — we can keep the investigation moving." : e.map((s) => `• ${s}`).join(`
`);
}
function Bc(t, e) {
  if (e.level === "insufficient")
    return "Name the campaign or outcome you care about, and I will re-ground this briefing.";
  const n = t.executiveSessions[0], s = Kr(t);
  return t.intent === "blockers" ? s ? "Decide whether this blocker belongs on your active tracker, then assign an owner." : "Clarify which campaign this blocker affects so we can set the next move." : t.intent === "decision" && n ? `Close the loop on ${n.conversationTitle ?? n.title} — confirm what was decided and what follows.` : n ? `Pick up ${n.conversationTitle ?? n.title} and decide the next executive action.` : s ? `Review the strongest thread on "${t.searchQuery}", then tell me which outcome you want to steer toward.` : `Tell me the outcome you want on "${t.searchQuery}" and I will keep the investigation pointed there.`;
}
function Kc(t, e) {
  const n = [
    `Here's where we are — ${dt(Oc(t, e))}`
  ], s = Uc(t);
  return s && n.push(`Last session — ${dt(s)}`), n.push(`What's changed — ${dt(Mc(t, e))}`), n.push(`What needs attention —
${jc(t)}`), n.push(`Recommended next step — ${dt(Bc(t, e))}`), n.join(`

`);
}
function Gc(t, e) {
  if (t.items.length === 0)
    return "Supporting awareness — no corroborating threads yet. Ask me to widen the search if you need more backup.";
  const n = e.level === "high" ? "Confidence is high" : e.level === "medium" ? "Confidence is moderate" : e.level === "low" ? "Confidence is lower" : "Confidence is limited", s = t.items.length, r = t.executiveSessions.length > 0 ? ` ${t.executiveSessions.length} executive session(s) back this up.` : "";
  return `Supporting awareness — ${n} across ${s} corroborating thread(s).${r} Use the lenses below if you want sources, timeline, or repository detail.`;
}
function zc(t) {
  return {
    recordId: t.recordId,
    label: t.title,
    excerpt: t.excerpt,
    explorerPath: t.explorerPath,
    krcId: t.krcId,
    kind: t.kind
  };
}
function zt(t, e) {
  const n = [], s = /* @__PURE__ */ new Set();
  for (const r of t)
    if (!s.has(r.recordId) && (s.add(r.recordId), n.push(zc(r)), n.length >= e))
      break;
  return n;
}
function Hc(t) {
  const e = t.items[0];
  if (!e || t.items.length === 0)
    return {
      level: "insufficient",
      score: 0,
      rationale: "No matching evidence was found in the repository index."
    };
  let n = Math.min(100, Math.round(e.score));
  const s = [`Top hit score ${e.score}`];
  t.executiveSessions.length > 0 && (n += 15, s.push(`${t.executiveSessions.length} executive session(s)`));
  const r = t.topKrcIds.length;
  r > 1 && (n += Math.min(15, r * 5), s.push(`${r} corroborating KRC sources`)), t.queryTerms.length > 1 && t.items.some((c) => t.queryTerms.every((a) => c.excerpt.toLowerCase().includes(a))) && (n += 10, s.push("all query terms present in evidence")), t.items.length < 3 && (n -= 15, s.push("limited evidence volume")), n = Math.max(0, Math.min(100, n));
  let i = "low";
  return n >= 75 ? i = "high" : n >= 50 ? i = "medium" : n < 25 && (i = "insufficient"), t.items.length === 1 && n < 40 && (i = "insufficient", s.push("single weak evidence hit")), {
    level: i,
    score: n,
    rationale: s.join("; ")
  };
}
function Zc(t, e) {
  return Kc(t, e);
}
function Vc(t, e) {
  return Gc(t, e);
}
function qc(t) {
  const e = [], n = /* @__PURE__ */ new Set();
  for (const s of t.topKrcIds.slice(0, 5)) {
    const r = t.items.find((i) => i.krcId === s);
    !r || n.has(r.explorerPath) || (n.add(r.explorerPath), e.push({
      label: `${s} — ${r.conversationTitle ?? r.title}`,
      path: r.explorerPath,
      krcId: s
    }));
  }
  for (const s of t.executiveSessions.slice(0, 2))
    n.has(s.explorerPath) || (n.add(s.explorerPath), e.push({
      label: `Executive Session — ${s.title}`,
      path: s.explorerPath,
      krcId: s.krcId
    }));
  return e;
}
class Wc {
  compose(e) {
    const n = Hc(e), s = zt(e.items, 8), r = zt(e.attachments, 6), i = zt(e.relatedSources, 5);
    return {
      question: e.question,
      intent: e.intent,
      searchQuery: e.searchQuery,
      directAnswer: Zc(e, n),
      reasonedSummary: Vc(e, n),
      evidenceUsed: s,
      confidence: n,
      timeline: e.timeline,
      relatedSources: i,
      attachments: r,
      explorerLinks: qc(e)
    };
  }
}
const Yc = new Wc();
function Jc(t, e = Yc) {
  return e.compose(t);
}
async function Gr(t, e, n, s) {
  const r = await _e(t), i = Lc(r, e), o = Jc(i), c = Fc(n), a = c != null && c.conversationId ? await $t(t, c.conversationId) : await jr(t), l = await Lr(t), d = Pc({
    repositoryPath: t,
    question: e,
    evidence: i,
    conversation: c,
    executiveMemory: a,
    executiveBriefing: l.briefing
  }), u = ze(), f = (n == null ? void 0 : n.providerId) ?? "mock";
  u.setActive(f), u.setCredentials({
    apiKey: n == null ? void 0 : n.apiKey,
    model: n == null ? void 0 : n.model,
    baseUrl: n == null ? void 0 : n.baseUrl,
    temperature: n == null ? void 0 : n.temperature,
    streaming: n == null ? void 0 : n.streaming
  });
  const p = { context: d, groundedAnswer: o }, h = s ? await u.reasonStream(p, s) : await u.reason(p), I = Ba(o, h);
  return Rc(t, I);
}
async function Xc(t, e, n) {
  return Gr(t, e, n);
}
async function Qc(t, e, n, s) {
  return Gr(t, e, { ...n, streaming: !0 }, s);
}
const eu = "conversations", tu = "active.json";
function kn(t) {
  return S.join(t, ".kae-sessions", eu);
}
function Rn(t, e) {
  return S.join(kn(t), `${e}.json`);
}
function bn(t) {
  return S.join(kn(t), tu);
}
async function nu(t) {
  const e = kn(t);
  return await R.mkdir(e, { recursive: !0 }), e;
}
async function zr(t) {
  try {
    const e = await R.readFile(bn(t), "utf8"), n = JSON.parse(e);
    return n.conversationId ? n : null;
  } catch {
    return null;
  }
}
async function su(t, e) {
  try {
    const n = await R.readFile(Rn(t, e), "utf8"), s = JSON.parse(n);
    return !s.conversationId || !Array.isArray(s.turns) ? null : s;
  } catch {
    return null;
  }
}
async function ru(t) {
  const e = await zr(t);
  return e ? su(t, e.conversationId) : null;
}
async function Hr(t, e) {
  await nu(t);
  const n = Rn(t, e.conversationId);
  await R.writeFile(n, JSON.stringify(e, null, 2), "utf8");
  const s = {
    conversationId: e.conversationId,
    updatedAt: e.updatedAt
  };
  return await R.writeFile(bn(t), JSON.stringify(s, null, 2), "utf8"), n;
}
function iu(t) {
  const e = (/* @__PURE__ */ new Date()).toISOString();
  return {
    conversationId: W(),
    title: t ?? "Vigsy conversation",
    createdAt: e,
    updatedAt: e,
    turns: []
  };
}
async function ou(t) {
  const e = iu();
  return await Hr(t, e), e;
}
async function au(t, e) {
  try {
    await R.unlink(Rn(t, e));
  } catch {
  }
  const n = await zr(t);
  if ((n == null ? void 0 : n.conversationId) === e)
    try {
      await R.unlink(bn(t));
    } catch {
    }
}
const cu = /campaign\s+([\d.]+[a-z]?)\s*(?:[—–-]\s*([^\n.?]+)|(?=\s|$))/gi, ls = /\b(completed?|finished|implemented|shipped|passed|pass\b|done with)\b/i, uu = /\b(import(?:ed)?|repair(?:ed)?|index(?:ed)?|rebuilt|snapshot|rollback)\b/i;
function fe(t, e, n) {
  return {
    id: W(),
    label: t.trim(),
    detail: e == null ? void 0 : e.trim(),
    sourceTurnId: n,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Ie(t, e) {
  const n = new Set(t.map((r) => r.label.toLowerCase())), s = [...t];
  for (const r of e) {
    const i = r.label.toLowerCase();
    n.has(i) || (n.add(i), s.push(r));
  }
  return s.slice(-24);
}
function du(t) {
  var i, o;
  const e = [...t.matchAll(cu)];
  if (e.length === 0)
    return;
  const n = e[e.length - 1], s = (i = n[1]) == null ? void 0 : i.trim(), r = (o = n[2]) == null ? void 0 : o.trim();
  if (s)
    return r ? `Campaign ${s} — ${r}` : `Campaign ${s}`;
}
function lu(t) {
  var e, n;
  return [t.question, t.displayText, t.supportingText, (e = t.answer) == null ? void 0 : e.directAnswer, (n = t.answer) == null ? void 0 : n.reasonedSummary].filter(Boolean).join(`
`);
}
function fu(t, e) {
  var i;
  const n = lu(t), s = {}, r = du(n);
  if (r && (s.currentCampaign = r), t.role === "user" && t.question && !e.currentObjective && (s.currentObjective = t.question.trim()), t.role === "assistant" && t.answer) {
    const o = [t.answer.directAnswer, t.answer.reasonedSummary].join(" "), c = t.question ? Ar(t.question) : "general";
    (c === "decision" || bt(o)) && (s.currentDecisions = Ie(e.currentDecisions, [
      fe(t.answer.directAnswer.slice(0, 160), t.question, t.turnId)
    ])), (c === "blockers" || In(o)) && (s.currentBlockers = Ie(e.currentBlockers, [
      fe(t.answer.directAnswer.slice(0, 160), t.question, t.turnId)
    ])), (ls.test(o) || ls.test(t.displayText)) && (s.currentAccomplishments = Ie(e.currentAccomplishments, [
      fe(t.answer.directAnswer.slice(0, 160), t.question, t.turnId)
    ]));
    const a = t.answer.evidenceUsed.map((d) => fe(d.label, d.recordId, t.turnId));
    s.currentEvidence = Ie(e.currentEvidence, a);
    const l = [
      ...t.answer.explorerLinks.map((d) => fe(d.label, d.path, t.turnId)),
      ...t.answer.attachments.map((d) => fe(d.label, d.explorerPath, t.turnId))
    ];
    s.currentFiles = Ie(e.currentFiles, l), t.followUpContext && (s.followUpContext = t.followUpContext);
  }
  if (uu.test(n)) {
    const o = ((i = t.question) == null ? void 0 : i.trim()) || n.slice(0, 120);
    s.currentRepositoryChanges = Ie(e.currentRepositoryChanges, [
      fe(o, void 0, t.turnId)
    ]);
  }
  return s;
}
function mu(t) {
  const e = [];
  for (const n of t.currentBlockers)
    e.push(n.label);
  if (t.currentBlockers.length === 0)
    for (const n of t.unfinishedWork)
      /unfinished|remaining|blocker|not yet|todo/i.test(n) && e.push(n);
  return [...new Set(e)].slice(0, 6);
}
function pu(t) {
  var e;
  return t.currentBlockers.length > 0 ? `continue working on ${t.currentBlockers[t.currentBlockers.length - 1].label}` : t.currentObjective ? `continue with ${t.currentObjective}` : (e = t.followUpContext) != null && e.lastSearchQuery ? `pick up where we left off on ${t.followUpContext.lastSearchQuery}` : "continue where we left off";
}
function hu(t, e) {
  let n = {
    ...e,
    title: t.title || e.title,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  for (const r of t.turns) {
    const i = fu(r, n);
    n = { ...n, ...i };
  }
  const s = [...t.turns].reverse().find((r) => r.role === "assistant");
  return s != null && s.followUpContext && (n.followUpContext = s.followUpContext), n.unfinishedWork = mu(n), n.recommendedNextAction = pu(n), n;
}
const gu = "KAE";
function yu(t) {
  return `VIGSY-${t.slice(0, 8).toUpperCase()}`;
}
function Se(t, e) {
  return e.length === 0 ? [`## ${t}`, "- None recorded yet.", ""] : [`## ${t}`, ...e.map((n) => `- ${n.label}${n.detail ? ` (${n.detail})` : ""}`), ""];
}
async function wu(t, e, n) {
  const s = yu(n.conversationId), r = Xe(n.title || "Vigsy_Conversation"), i = `${s}_${r}_SESSION.md`, o = `ExecutiveSessions/${gu}/${i}`, c = S.join(t, o), a = `.kae-sessions/conversations/${n.conversationId}.json`, l = n.turns.filter((f) => f.role === "user" && f.question).slice(-3).map((f) => `- **Q:** ${f.question}`), d = [...n.turns].reverse().find((f) => f.role === "assistant");
  d != null && d.displayText && l.push(`- **Latest:** ${d.displayText.slice(0, 280)}`);
  const u = [
    `# Executive Session Record — ${n.title}`,
    "",
    "## Source ID",
    s,
    "",
    "## Session Date",
    e.updatedAt,
    "",
    "## Classification",
    "- Primary: vigsy-conversation",
    `- Lifecycle: ${e.lifecycle}`,
    `- Campaign: ${e.currentCampaign ?? "Not set"}`,
    `- Objective: ${e.currentObjective ?? "Not set"}`,
    "",
    "## Session Summary",
    l.length > 0 ? l.join(`
`) : "Active Vigsy conversation session.",
    "",
    ...Se("Current Decisions", e.currentDecisions),
    ...Se("Current Blockers", e.currentBlockers),
    ...Se("Current Accomplishments", e.currentAccomplishments),
    ...Se("Current Files", e.currentFiles),
    ...Se("Current Evidence", e.currentEvidence),
    ...Se("Repository Changes", e.currentRepositoryChanges),
    "## Action / Follow-up",
    e.recommendedNextAction ?? "Continue the active Vigsy conversation thread.",
    "",
    "## Transcript Reference",
    a,
    "",
    "## Notes",
    `Auto-maintained by KAE Continuous Executive Memory on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ];
  return await R.mkdir(S.dirname(c), { recursive: !0 }), await R.writeFile(c, u.join(`
`), "utf8"), o;
}
function vu(t, e) {
  const n = new Date(t);
  if (Number.isNaN(n.getTime()))
    return 0;
  const s = new Date(e.getFullYear(), e.getMonth(), e.getDate()), r = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.max(0, Math.round((s.getTime() - r.getTime()) / 864e5));
}
function fs(t) {
  return t === 0 ? "Earlier today" : t === 1 ? "Yesterday" : `${t} days ago`;
}
function Iu(t, e = Pr) {
  if (!t || t.lifecycle === "archived")
    return {
      welcomeMessage: `Welcome back${e ? ` ${e}` : ""}. Ask me anything about your knowledge.`,
      session: null,
      hasUnfinishedWork: !1,
      daysSinceLastActivity: 0
    };
  const n = vu(t.updatedAt, /* @__PURE__ */ new Date()), s = [`Welcome back${e ? ` ${e}` : ""}.`];
  t.currentCampaign ? s.push(`${fs(n)} we were working on ${t.currentCampaign}.`) : n > 0 && s.push(`${fs(n)} we left off on ${t.title}.`);
  const r = t.currentAccomplishments[t.currentAccomplishments.length - 1];
  r && s.push(`We completed ${r.label}.`);
  const i = t.unfinishedWork.length || t.currentBlockers.length;
  return i > 0 && s.push(i === 1 ? "One implementation remains unfinished." : `${i} implementations remain unfinished.`), t.recommendedNextAction ? s.push(`Would you like to ${t.recommendedNextAction}?`) : s.push("Would you like to continue?"), {
    welcomeMessage: s.join(" "),
    recommendedNextAction: t.recommendedNextAction,
    session: t,
    hasUnfinishedWork: i > 0,
    daysSinceLastActivity: n
  };
}
async function ms(t, e) {
  const n = await $t(t, e.conversationId);
  if (n)
    return (n.lifecycle === "paused" || n.lifecycle === "closed") && (n.lifecycle = "active", n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await We(t, n), await wt(t, n)), n;
  const s = Br(e.conversationId, e.title);
  return await We(t, s), await wt(t, s), s;
}
async function Su(t) {
  const e = await jr(t);
  !e || e.lifecycle !== "active" || (e.lifecycle = "paused", e.pausedAt = (/* @__PURE__ */ new Date()).toISOString(), e.updatedAt = e.pausedAt, await We(t, e), await wt(t, e, !1));
}
async function Eu(t, e) {
  const n = await $t(t, e);
  if (!n)
    return;
  n.lifecycle = "archived", n.archivedAt = (/* @__PURE__ */ new Date()).toISOString(), n.updatedAt = n.archivedAt, await We(t, n, { archive: !0 });
  const s = await nt(t);
  s.sessions = s.sessions.map((r) => r.conversationId === e ? { ...r, lifecycle: "archived", updatedAt: n.updatedAt } : r), s.activeSessionId === n.sessionId && (s.activeSessionId = void 0), s.lastSyncedAt = n.updatedAt, await Mr(t, s);
}
async function Cu(t, e) {
  const n = await $t(t, e.conversationId) ?? Br(e.conversationId, e.title), s = hu(e, {
    ...n,
    lifecycle: e.turns.length > 0 ? "active" : n.lifecycle
  });
  s.executiveSessionPath = await wu(t, s, e), await We(t, s), await wt(t, s);
  const r = await Qe(t), i = await Te(t), o = await tt(t);
  return {
    session: s,
    evidenceIndexBuiltAt: r.builtAt,
    relationshipIndexBuiltAt: i.builtAt,
    briefingGeneratedAt: o.generatedAt
  };
}
async function ku(t) {
  const e = await nt(t);
  let n = null;
  return e.activeSessionId && (n = await Cn(t, e.activeSessionId)), Iu(n, e.founderName);
}
const Ru = /^(user|assistant|system|human|chatgpt|cursor)\s*:\s*(.*)$/i, bu = /^(user|assistant|system)$/i;
function Au(t) {
  var r;
  const e = t.trim();
  if (!e)
    return [];
  if (/^###\s+(user|assistant)/im.test(e)) {
    const i = [];
    for (const o of e.split(/^###\s+/im).slice(1)) {
      const c = o.trim().split(`
`), a = (r = c[0]) == null ? void 0 : r.trim().toLowerCase();
      if (!a || !bu.test(a))
        continue;
      const l = a === "user" ? "user" : a === "assistant" ? "assistant" : "system";
      i.push({ role: l, text: c.slice(1).join(`
`).trim() });
    }
    if (i.length > 0)
      return i;
  }
  const n = [];
  let s = null;
  for (const i of e.split(`
`)) {
    const o = i.match(Ru);
    if (o) {
      s != null && s.text.trim() && n.push(s);
      const c = o[1].toLowerCase();
      s = { role: c === "assistant" || c === "chatgpt" || c === "cursor" ? "assistant" : c === "system" ? "system" : "user", text: o[2] ?? "" };
      continue;
    }
    s ? s.text += `${s.text ? `
` : ""}${i}` : s = { role: "user", text: i };
  }
  return s != null && s.text.trim() && n.push(s), n.length === 0 ? [{ role: "user", text: e }] : n;
}
function $u(t, e, n) {
  if (t != null && t.trim())
    return t.trim().slice(0, 120);
  const s = e.find((r) => r.role === "user");
  return s != null && s.text.trim() ? s.text.trim().slice(0, 120) : `${n} session ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
}
function ps(t) {
  switch (t) {
    case "chatgpt":
      return "ChatGPT live capture";
    case "cursor":
      return "Cursor live capture";
    default:
      return "Pasted transcript capture";
  }
}
function Tu(t, e, n, s) {
  var c;
  const r = (/* @__PURE__ */ new Date()).toISOString(), i = `live-${Date.now()}`, o = s.map((a) => `### ${a.role === "assistant" ? "Assistant" : a.role === "system" ? "System" : "User"}
*${r}*

${a.text.trim()}`);
  return [
    `# ${t} — ${e}`,
    "",
    "## Status",
    "Inventoried",
    "",
    "## Description",
    `${ps(n.sourceKind)} acquired by KAE.`,
    n.campaign ? `Campaign: ${n.campaign}` : "",
    "",
    "## Topic",
    ps(n.sourceKind),
    "",
    "## Primary Product",
    "Axiom",
    "",
    "## ChatGPT Conversation ID",
    i,
    "",
    "## Create Time",
    r,
    "",
    "## Update Time",
    r,
    "",
    "## Notes",
    ((c = n.notes) == null ? void 0 : c.trim()) || "Captured via KAE live session capture.",
    "",
    "## Transcript",
    "",
    o.join(`

`)
  ].filter((a) => a !== "").join(`
`);
}
function Du(t, e, n, s, r) {
  const i = r.slice(0, 4).map((o) => `- **${o.role}:** ${o.text.slice(0, 200)}`).join(`
`);
  return [
    `# Executive Session Record — ${e}`,
    "",
    "## Source ID",
    t,
    "",
    "## Session Date",
    (/* @__PURE__ */ new Date()).toISOString(),
    "",
    "## Classification",
    "- Primary: live-capture",
    `- Source kind: ${s.sourceKind}`,
    s.campaign ? `- Campaign: ${s.campaign}` : "",
    "",
    "## Session Summary",
    i || "Live session captured into KAE.",
    "",
    "## Action / Follow-up",
    "Review captured session and continue work in Vigsy.",
    "",
    "## Transcript Reference",
    n,
    "",
    "## Notes",
    `Auto-maintained by KAE live session capture on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ].filter((o) => o !== "").join(`
`);
}
const lt = "KAE";
async function xu(t, e) {
  const n = Au(e.transcript);
  if (n.length === 0)
    throw new Error("Transcript is empty.");
  await Hs(t);
  const s = await St(t) + 1, r = Et(s), i = $u(e.title, n, e.sourceKind), o = Xe(i), c = `${r}_${o}.md`, a = `${r}_${o}_SESSION.md`, l = `Sources/${lt}/${c}`, d = `ExecutiveSessions/${lt}/${a}`, u = Tu(r, i, e, n), f = Du(r, i, l, e, n);
  await R.mkdir(S.join(t, "Sources", lt), { recursive: !0 }), await R.mkdir(S.join(t, "ExecutiveSessions", lt), {
    recursive: !0
  }), await R.writeFile(S.join(t, l), u, "utf8"), await R.writeFile(S.join(t, d), f, "utf8");
  const p = await Qe(t), h = await Te(t), I = await tt(t);
  return {
    krcId: r,
    sourceRelativePath: l,
    executiveSessionRelativePath: d,
    messageCount: n.length,
    evidenceIndexBuiltAt: p.builtAt,
    relationshipIndexBuiltAt: h.builtAt,
    briefingGeneratedAt: I.generatedAt
  };
}
async function _u(t) {
  const e = await Qe(t), n = await Te(t), s = await tt(t);
  return {
    evidenceIndexBuiltAt: e.builtAt,
    relationshipIndexBuiltAt: n.builtAt,
    briefingGeneratedAt: s.generatedAt
  };
}
async function Nu(t, e) {
  const n = await mn(t), s = [];
  let r = 0, i = 0;
  for (const o of e) {
    const c = String(o.metadata.conversationId ?? o.metadata.sourceKey ?? o.id), a = n.get(c);
    if (a) {
      o.metadata.existingKrcId = a, o.metadata.conversationId = c, s.push(o), i += 1;
      continue;
    }
    o.metadata.conversationId = c, s.push(o);
  }
  return { documents: s, skippedCount: r, updatedCount: i };
}
class Lu {
  constructor(e) {
    _(this, "onSync");
    _(this, "timers", /* @__PURE__ */ new Map());
    _(this, "schedules", /* @__PURE__ */ new Map());
    this.onSync = e;
  }
  load(e) {
    this.stop();
    for (const n of e)
      this.schedules.set(n.connectorId, n), n.enabled && n.intervalMinutes > 0 && this.enable(n.connectorId, n.intervalMinutes);
  }
  export() {
    return Array.from(this.schedules.values());
  }
  enable(e, n) {
    var i;
    this.disable(e);
    const s = {
      connectorId: e,
      intervalMinutes: n,
      enabled: !0,
      lastRunAt: (i = this.schedules.get(e)) == null ? void 0 : i.lastRunAt,
      nextRunAt: new Date(Date.now() + n * 6e4).toISOString()
    };
    this.schedules.set(e, s);
    const r = setInterval(() => {
      this.onSync(e, {
        repositoryPath: "",
        log: () => {
        }
      }).then(() => {
        const o = this.schedules.get(e);
        o && this.schedules.set(e, {
          ...o,
          lastRunAt: (/* @__PURE__ */ new Date()).toISOString(),
          nextRunAt: new Date(Date.now() + n * 6e4).toISOString()
        });
      });
    }, n * 6e4);
    this.timers.set(e, r);
  }
  isActive(e) {
    return this.timers.has(e);
  }
  disable(e) {
    const n = this.timers.get(e);
    n && clearInterval(n), this.timers.delete(e);
    const s = this.schedules.get(e);
    s && this.schedules.set(e, { ...s, enabled: !1, nextRunAt: void 0 });
  }
  stop() {
    for (const e of this.timers.values())
      clearInterval(e);
    this.timers.clear();
  }
}
class Pu {
  constructor(e) {
    _(this, "scheduler");
    this.scheduler = e;
  }
  start(e) {
    this.scheduler.load(e);
  }
  stop() {
    this.scheduler.stop();
  }
  schedule(e, n) {
    this.scheduler.enable(e, n);
  }
  unschedule(e) {
    this.scheduler.disable(e);
  }
  getSchedules() {
    return this.scheduler.export();
  }
  isActive(e) {
    return this.scheduler.isActive(e);
  }
}
function hs(t, e) {
  return {
    connectorId: t,
    status: "healthy",
    message: e,
    lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
class st {
  canHandle(e) {
    var s;
    const n = ((s = e.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async connect(e, n) {
    return hs(this.id, `${this.name} connected`);
  }
  async disconnect() {
  }
  async checkHealth(e) {
    return hs(this.id, `${this.name} is operational`);
  }
  async sync(e, n) {
    var i;
    const s = Date.now(), r = [];
    try {
      let o;
      return e && this.canHandle(e) ? o = (await dn(this, e, n)).documents : o = await this.syncInternal(e, n), {
        success: !0,
        connectorId: this.id,
        itemsImported: o.length,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: o,
        errors: r,
        durationMs: Date.now() - s
      };
    } catch (o) {
      const c = o instanceof Error ? o.message : String(o);
      return r.push(c), (i = n.log) == null || i.call(n, "error", c), {
        success: !1,
        connectorId: this.id,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: r,
        durationMs: Date.now() - s
      };
    }
  }
}
async function Ht() {
  return (await import("./index-DZ9YwKkv.js")).chatGptConnector;
}
class Fu extends st {
  constructor() {
    super(...arguments);
    _(this, "id", "chatgpt-export-zip");
    _(this, "name", "ChatGPT Connector");
    _(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    _(this, "supportedExtensions", [".zip"]);
    _(this, "capabilities", {
      implementationStatus: "full",
      supportsScheduledSync: !0,
      supportsOAuth: !1,
      supportsApiKey: !1,
      supportsFilePicker: !0,
      supportsUrlInput: !1,
      supportsFolderPicker: !1,
      acquisitionModes: ["zip-export", "live-session"]
    });
  }
  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {}
    };
  }
  canHandle(n) {
    var s;
    return ((s = n.extension) == null ? void 0 : s.toLowerCase()) === ".zip";
  }
  async discover(n) {
    return (await Ht()).discover(n);
  }
  async extract(n) {
    return (await Ht()).extract(n);
  }
  async normalize(n) {
    return (await Ht()).normalize(n);
  }
  async syncInternal(n, s) {
    if (!n)
      throw new Error("ChatGPT sync requires a ZIP export file.");
    const { runConnectorPipeline: r } = await Promise.resolve().then(() => ki);
    return (await r(this, n, s)).documents;
  }
}
const Ou = new Fu(), Uu = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/, Mu = /[?&]list=([A-Za-z0-9_-]+)/, ju = /youtube\.com\/channel\/([A-Za-z0-9_-]+)/;
function gs(t) {
  const e = t.match(Uu);
  if (e)
    return { kind: "video", videoId: e[1], url: t };
  const n = t.match(ju);
  if (n)
    return { kind: "channel", channelId: n[1], url: t };
  const s = t.match(Mu);
  if (s)
    return { kind: "playlist", playlistId: s[1], url: t };
  throw new Error(`Unsupported YouTube URL: ${t}`);
}
async function Ye(t, e) {
  const n = await fetch(t, e);
  if (!n.ok)
    throw new Error(`HTTP ${n.status} for ${t}`);
  return n.text();
}
async function Bu(t, e) {
  const n = await fetch(t, e);
  if (!n.ok)
    throw new Error(`HTTP ${n.status} for ${t}`);
  return n.json();
}
async function ys(t, e, n) {
  var s;
  if (t.kind === "video" && t.videoId)
    return [t.videoId];
  if (t.kind === "channel" && t.channelId) {
    const r = `https://www.youtube.com/feeds/videos.xml?channel_id=${t.channelId}`;
    return (s = n == null ? void 0 : n.log) == null || s.call(n, "info", `Fetching channel feed: ${r}`), [...(await Ye(r)).matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((c) => c[1]).slice(0, e);
  }
  if (t.kind === "playlist" && t.playlistId) {
    const r = await Ye(`https://www.youtube.com/playlist?list=${t.playlistId}`);
    return [
      ...new Set([...r.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((o) => o[1]))
    ].slice(0, e);
  }
  throw new Error("Could not resolve YouTube video IDs.");
}
function Ku(t) {
  return t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function Gu(t) {
  return [...t.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((n) => Ku(n[1].replace(/\n/g, " ").trim())).filter(Boolean).join(`
`);
}
async function zu(t) {
  try {
    const n = (await Ye(`https://www.youtube.com/api/timedtext?type=list&v=${t}`)).match(/lang_code="([^"]+)"/), s = (n == null ? void 0 : n[1]) ?? "en", r = await Ye(`https://www.youtube.com/api/timedtext?v=${t}&lang=${s}`), i = Gu(r);
    if (i.trim())
      return i;
  } catch {
  }
  return "";
}
async function Hu(t, e) {
  var l;
  const n = `https://www.youtube.com/watch?v=${t}`, s = await Bu(`https://www.youtube.com/oembed?url=${encodeURIComponent(n)}&format=json`);
  let r = "", i, o;
  try {
    const d = await Ye(n), u = d.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
    u && (r = JSON.parse(`"${u[1]}"`));
    const f = d.match(/"publishDate":"([^"]+)"/);
    i = f == null ? void 0 : f[1];
    const p = d.match(/"lengthSeconds":"(\d+)"/);
    if (p) {
      const h = Number(p[1]), I = Math.floor(h / 60), b = h % 60;
      o = `${I}:${String(b).padStart(2, "0")}`;
    }
  } catch (d) {
    (l = e == null ? void 0 : e.log) == null || l.call(e, "warn", `Could not parse watch page for ${t}: ${String(d)}`);
  }
  const c = await zu(t), a = c.length > 0;
  return {
    videoId: t,
    title: s.title,
    description: r,
    transcript: c || r,
    thumbnailUrl: s.thumbnail_url ?? `https://i.ytimg.com/vi/${t}/hqdefault.jpg`,
    publishDate: i,
    duration: o,
    channelTitle: s.author_name,
    captionsAvailable: a,
    metadata: {
      watchUrl: n,
      connectorId: "youtube"
    }
  };
}
function ws(t) {
  const e = `youtube:${t.videoId}`, n = [
    `# ${t.title}`,
    "",
    "## Source",
    "YouTube",
    "",
    "## Video ID",
    t.videoId,
    "",
    "## Channel",
    t.channelTitle ?? "Unknown",
    "",
    "## Publish Date",
    t.publishDate ?? "Unknown",
    "",
    "## Duration",
    t.duration ?? "Unknown",
    "",
    "## Thumbnail",
    t.thumbnailUrl,
    "",
    "## Description",
    t.description || "No description available.",
    "",
    "## Transcript",
    t.transcript || "No transcript available.",
    "",
    "## Captions",
    t.captionsAvailable ? "Available" : "Unavailable",
    "",
    "## ChatGPT Conversation ID",
    e
  ];
  return {
    id: e,
    title: t.title,
    content: n.join(`
`),
    format: "youtube",
    metadata: {
      conversationId: e,
      sourceKey: e,
      connectorId: "youtube",
      videoId: t.videoId,
      thumbnailUrl: t.thumbnailUrl,
      publishDate: t.publishDate,
      duration: t.duration,
      channelTitle: t.channelTitle,
      captionsAvailable: t.captionsAvailable,
      messageCount: 1,
      ...t.metadata
    }
  };
}
function vs(t) {
  const e = t.mockVideos;
  return Array.isArray(e) ? e : [];
}
function Zu(t) {
  const e = t.config.settings.__changeKeys;
  return Array.isArray(e) ? new Set(e.map(String)) : null;
}
class Vu extends st {
  constructor() {
    super(...arguments);
    _(this, "id", "youtube");
    _(this, "name", "YouTube Connector");
    _(this, "description", "Acquire video metadata, transcripts, and captions from YouTube videos, playlists, and channels.");
    _(this, "supportedExtensions", []);
    _(this, "capabilities", {
      implementationStatus: "full",
      supportsScheduledSync: !0,
      supportsOAuth: !1,
      supportsApiKey: !1,
      supportsFilePicker: !1,
      supportsUrlInput: !0,
      supportsFolderPicker: !1,
      acquisitionModes: ["video", "playlist", "channel"]
    });
  }
  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {
        targetUrl: "",
        maxVideos: 5
      }
    };
  }
  async discover(n) {
    return {
      connectorId: this.id,
      source: n,
      format: "youtube",
      metadata: { targetUrl: n.path }
    };
  }
  async extract(n) {
    throw new Error("YouTube connector uses syncInternal.");
  }
  async normalize(n) {
    throw new Error("YouTube connector uses syncInternal.");
  }
  async syncInternal(n, s) {
    var f, p;
    const r = vs(s.config.settings), i = Zu(s);
    if (r.length > 0)
      return r.filter((h) => !i || i.has(`youtube:${h.videoId}`)).map((h) => ws(h));
    const o = String(s.config.settings.targetUrl ?? s.config.settings.url ?? "").trim();
    if (!o)
      throw new Error("YouTube connector requires a video, playlist, or channel URL.");
    const c = gs(o), a = Number(s.config.settings.maxVideos ?? 5), l = await ys(c, a, s), d = [], u = i ? l.filter((h) => i.has(`youtube:${h}`)) : l;
    for (const h of u) {
      (f = s.log) == null || f.call(s, "info", `Acquiring YouTube video ${h}`);
      const I = await Hu(h, s);
      d.push(ws(I)), (p = s.onProgress) == null || p.call(s, "extract", Math.round(d.length / u.length * 100));
    }
    return d;
  }
  async detectChanges(n) {
    const s = (/* @__PURE__ */ new Date()).toISOString(), r = vs(n.config.settings);
    if (r.length > 0) {
      const d = r.map((f) => `youtube:${f.videoId}`), u = r.map((f) => `${f.videoId}:${f.title}:${f.publishDate ?? ""}`).join("|");
      return {
        connectorId: this.id,
        checkedAt: s,
        cursor: u,
        changeKeys: d,
        summary: `Checked ${r.length} mock YouTube item(s)`
      };
    }
    const i = String(n.config.settings.targetUrl ?? n.config.settings.url ?? "").trim();
    if (!i)
      throw new Error("YouTube connector requires a video, playlist, or channel URL.");
    const o = gs(i), c = Number(n.config.settings.maxVideos ?? 5), l = (await ys(o, c, n)).map((d) => `youtube:${d}`);
    return {
      connectorId: this.id,
      checkedAt: s,
      cursor: l.join("|"),
      changeKeys: l,
      summary: `Checked ${l.length} YouTube item(s)`
    };
  }
}
const qu = new Vu();
async function Ee(t, e) {
  const n = {
    Accept: "application/vnd.github+json",
    "User-Agent": "KAE-Connector/1.0"
  };
  e && e.trim() && (n.Authorization = `Bearer ${e.trim()}`);
  const s = await fetch(`https://api.github.com${t}`, { headers: n });
  if (!s.ok)
    throw new Error(`GitHub API ${s.status} for ${t}`);
  return s.json();
}
async function Wu(t, e) {
  for (const n of ["main", "master"]) {
    const s = `https://raw.githubusercontent.com/${t}/${e}/${n}/README`, r = await fetch(s, { headers: { "User-Agent": "KAE-Connector/1.0" } });
    if (r.ok)
      return r.text();
  }
  throw new Error(`README not found for ${t}/${e}`);
}
async function Is(t, e) {
  var o, c, a, l, d, u, f;
  const [n, s] = t.split("/");
  if (!n || !s)
    throw new Error(`Invalid repository "${t}". Use owner/repo format.`);
  let r;
  try {
    r = await Ee(`/repos/${n}/${s}`, e.token);
  } catch (p) {
    (o = e.log) == null || o.call(e, "warn", `GitHub repo metadata unavailable, using fallback: ${String(p)}`), r = {
      full_name: `${n}/${s}`,
      description: "",
      default_branch: "master",
      html_url: `https://github.com/${n}/${s}`
    };
  }
  const i = [];
  try {
    const p = await Ee(`/repos/${n}/${s}/readme`, e.token), h = Buffer.from(p.content, "base64").toString("utf8");
    i.push({
      kind: "readme",
      id: `${t}#readme`,
      title: `${s} README`,
      body: h,
      url: p.html_url,
      metadata: { repository: t }
    });
  } catch (p) {
    (c = e.log) == null || c.call(e, "warn", `README API unavailable, trying raw fallback: ${String(p)}`);
    try {
      const h = await Wu(n, s);
      i.push({
        kind: "readme",
        id: `${t}#readme`,
        title: `${s} README`,
        body: h,
        url: `https://github.com/${n}/${s}#readme`,
        metadata: { repository: t }
      });
    } catch (h) {
      (a = e.log) == null || a.call(e, "warn", `README unavailable: ${String(h)}`);
    }
  }
  if (e.includeIssues)
    try {
      const p = await Ee(`/repos/${n}/${s}/issues?state=all&per_page=10`, e.token);
      for (const h of p)
        h.html_url.includes("/pull/") || i.push({
          kind: "issue",
          id: `${t}#issue-${h.number}`,
          title: `Issue #${h.number}: ${h.title}`,
          body: h.body ?? "",
          url: h.html_url,
          updatedAt: h.updated_at,
          metadata: { number: h.number }
        });
    } catch (p) {
      (l = e.log) == null || l.call(e, "warn", `Issues unavailable: ${String(p)}`);
    }
  if (e.includePullRequests)
    try {
      const p = await Ee(`/repos/${n}/${s}/pulls?state=all&per_page=10`, e.token);
      for (const h of p)
        i.push({
          kind: "pull_request",
          id: `${t}#pr-${h.number}`,
          title: `PR #${h.number}: ${h.title}`,
          body: h.body ?? "",
          url: h.html_url,
          updatedAt: h.updated_at,
          metadata: { number: h.number }
        });
    } catch (p) {
      (d = e.log) == null || d.call(e, "warn", `Pull requests unavailable: ${String(p)}`);
    }
  if (e.includeCommits)
    try {
      const p = await Ee(`/repos/${n}/${s}/commits?per_page=10`, e.token);
      for (const h of p)
        i.push({
          kind: "commit",
          id: `${t}#commit-${h.sha.slice(0, 7)}`,
          title: `Commit ${h.sha.slice(0, 7)}`,
          body: h.commit.message,
          url: h.html_url,
          metadata: { sha: h.sha }
        });
    } catch (p) {
      (u = e.log) == null || u.call(e, "warn", `Commits unavailable: ${String(p)}`);
    }
  if (e.includeReleases)
    try {
      const p = await Ee(`/repos/${n}/${s}/releases?per_page=10`, e.token);
      for (const h of p)
        i.push({
          kind: "release",
          id: `${t}#release-${h.id}`,
          title: h.name ?? `Release ${h.id}`,
          body: h.body ?? "",
          url: h.html_url,
          updatedAt: h.published_at,
          metadata: { releaseId: h.id }
        });
    } catch (p) {
      (f = e.log) == null || f.call(e, "warn", `Releases unavailable: ${String(p)}`);
    }
  if (i.length === 0)
    throw new Error(`No GitHub content acquired for ${t}`);
  return {
    repository: r.full_name,
    description: r.description ?? "",
    defaultBranch: r.default_branch,
    items: i
  };
}
function Ss(t, e) {
  const n = `github:${e.id}`, s = [
    `# ${e.title}`,
    "",
    "## Source",
    "GitHub",
    "",
    "## Repository",
    t,
    "",
    "## Item Type",
    e.kind,
    "",
    "## URL",
    e.url,
    "",
    "## Updated",
    e.updatedAt ?? "Unknown",
    "",
    "## Content",
    e.body || "No content.",
    "",
    "## ChatGPT Conversation ID",
    n
  ];
  return {
    id: n,
    title: e.title,
    content: s.join(`
`),
    format: "github",
    metadata: {
      conversationId: n,
      sourceKey: n,
      connectorId: "github",
      repository: t,
      itemKind: e.kind,
      url: e.url,
      updatedAt: e.updatedAt,
      messageCount: 1,
      ...e.metadata
    }
  };
}
function Es(t) {
  const e = t.mockItems;
  return Array.isArray(e) ? e : [];
}
function Yu(t) {
  const e = t.config.settings.__changeKeys;
  return Array.isArray(e) ? new Set(e.map(String)) : null;
}
class Ju extends st {
  constructor() {
    super(...arguments);
    _(this, "id", "github");
    _(this, "name", "GitHub Connector");
    _(this, "description", "Acquire repository README, issues, pull requests, commits, and releases from GitHub.");
    _(this, "supportedExtensions", []);
    _(this, "capabilities", {
      implementationStatus: "full",
      supportsScheduledSync: !0,
      supportsOAuth: !1,
      supportsApiKey: !0,
      supportsFilePicker: !1,
      supportsUrlInput: !0,
      supportsFolderPicker: !1,
      acquisitionModes: ["repository"]
    });
  }
  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {
        repository: "",
        includeIssues: !0,
        includePullRequests: !0,
        includeCommits: !0,
        includeReleases: !0
      }
    };
  }
  async discover(n) {
    return {
      connectorId: this.id,
      source: n,
      format: "github",
      metadata: { repository: n.path }
    };
  }
  async extract(n) {
    throw new Error("GitHub connector uses syncInternal.");
  }
  async normalize(n) {
    throw new Error("GitHub connector uses syncInternal.");
  }
  async syncInternal(n, s) {
    const r = String(s.config.settings.repository ?? "").trim();
    if (!r)
      throw new Error("GitHub connector requires owner/repo in settings.");
    const i = Yu(s), o = Es(s.config.settings);
    if (o.length > 0)
      return o.filter((l) => !i || i.has(`github:${l.id}`)).map((l) => Ss(r, l));
    const c = String(s.config.settings.apiKey ?? "").trim();
    return (await Is(r, {
      token: c || void 0,
      includeIssues: !!(s.config.settings.includeIssues ?? !0),
      includePullRequests: !!(s.config.settings.includePullRequests ?? !0),
      includeCommits: !!(s.config.settings.includeCommits ?? !0),
      includeReleases: !!(s.config.settings.includeReleases ?? !0),
      log: s.log
    })).items.filter((l) => !i || i.has(`github:${l.id}`)).map((l) => Ss(r, l));
  }
  async detectChanges(n) {
    const s = (/* @__PURE__ */ new Date()).toISOString(), r = String(n.config.settings.repository ?? "").trim();
    if (!r)
      throw new Error("GitHub connector requires owner/repo in settings.");
    const i = Es(n.config.settings);
    if (i.length > 0) {
      const d = i.map((f) => `github:${f.id}`), u = i.map((f) => `${f.id}:${f.updatedAt ?? f.title}`).join("|");
      return {
        connectorId: this.id,
        checkedAt: s,
        cursor: u,
        changeKeys: d,
        summary: `Checked ${i.length} mock GitHub item(s)`
      };
    }
    const o = String(n.config.settings.apiKey ?? "").trim(), c = await Is(r, {
      token: o || void 0,
      includeIssues: !!(n.config.settings.includeIssues ?? !0),
      includePullRequests: !!(n.config.settings.includePullRequests ?? !0),
      includeCommits: !!(n.config.settings.includeCommits ?? !0),
      includeReleases: !!(n.config.settings.includeReleases ?? !0),
      log: n.log
    }), a = c.items.map((d) => `github:${d.id}`), l = c.items.map((d) => `${d.id}:${d.updatedAt ?? d.title}`).join("|");
    return {
      connectorId: this.id,
      checkedAt: s,
      cursor: l,
      changeKeys: a,
      summary: `Checked ${c.items.length} GitHub item(s)`
    };
  }
}
const Xu = new Ju(), Zr = [".md", ".markdown", ".txt"];
async function Vr(t) {
  const e = [];
  let n;
  try {
    n = await R.readdir(t, { withFileTypes: !0 });
  } catch {
    return e;
  }
  for (const s of n) {
    const r = S.join(t, s.name);
    if (s.isDirectory()) {
      e.push(...await Vr(r));
      continue;
    }
    const i = S.extname(s.name).toLowerCase();
    Zr.includes(i) && e.push(r);
  }
  return e;
}
function Cs(t, e, n) {
  const s = S.relative(t, e).replace(/\\/g, "/"), r = `local-folder:${s}`, i = S.basename(e, S.extname(e)), o = [
    `# ${i}`,
    "",
    "## Source",
    "Local Folder",
    "",
    "## Relative Path",
    s,
    "",
    "## Content",
    n,
    "",
    "## ChatGPT Conversation ID",
    r
  ];
  return {
    id: r,
    title: i,
    content: o.join(`
`),
    format: "local-folder",
    metadata: {
      conversationId: r,
      sourceKey: r,
      connectorId: "local-folder",
      relativePath: s,
      messageCount: 1
    }
  };
}
class Qu extends st {
  constructor() {
    super(...arguments);
    _(this, "id", "local-folder");
    _(this, "name", "Local Folder Connector");
    _(this, "description", "Acquire knowledge from markdown and text files in a local directory.");
    _(this, "supportedExtensions", Zr);
    _(this, "capabilities", {
      implementationStatus: "full",
      supportsScheduledSync: !0,
      supportsOAuth: !1,
      supportsApiKey: !1,
      supportsFilePicker: !1,
      supportsUrlInput: !1,
      supportsFolderPicker: !0,
      acquisitionModes: ["folder"]
    });
  }
  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {
        folderPath: ""
      }
    };
  }
  canHandle(n) {
    return this.supportedExtensions.some((s) => {
      var r;
      return s === ((r = n.extension) == null ? void 0 : r.toLowerCase());
    });
  }
  async discover(n) {
    return {
      connectorId: this.id,
      source: n,
      format: "local-folder",
      metadata: { path: n.path }
    };
  }
  async extract(n) {
    const s = await R.readFile(n.source.path, "utf8");
    return {
      connectorId: this.id,
      source: n.source,
      rawDocuments: [{ path: n.source.path, content: s }],
      assets: [],
      metadata: {}
    };
  }
  async normalize(n) {
    const s = S.dirname(n.source.path);
    return n.rawDocuments.map((r) => {
      const i = r, o = Cs(s, i.path, i.content);
      return {
        id: o.id,
        title: o.title,
        content: o.content,
        format: o.format,
        metadata: o.metadata
      };
    });
  }
  async syncInternal(n, s) {
    const r = String((n == null ? void 0 : n.path) ?? s.config.settings.folderPath ?? "").trim();
    if (!r)
      throw new Error("Local Folder connector requires a folder path.");
    const i = await Vr(r), o = [];
    for (const c of i) {
      const a = await R.readFile(c, "utf8");
      o.push(Cs(r, c, a));
    }
    return o;
  }
}
const ed = new Qu();
function ne(t, e, n, s) {
  class r extends st {
    constructor() {
      super(...arguments);
      _(this, "id", t);
      _(this, "name", e);
      _(this, "description", n);
      _(this, "supportedExtensions", []);
      _(this, "capabilities", {
        implementationStatus: "stub",
        supportsScheduledSync: !0,
        supportsOAuth: t.includes("drive") || t === "notion",
        supportsApiKey: !0,
        supportsFilePicker: !1,
        supportsUrlInput: !0,
        supportsFolderPicker: t === "obsidian",
        acquisitionModes: s
      });
    }
    getDefaultConfig() {
      return {
        connectorId: t,
        enabled: !1,
        connected: !1,
        scheduledSyncEnabled: !1,
        settings: {}
      };
    }
    async discover(c) {
      throw new Error(`${e} is API-ready but not yet implemented.`);
    }
    async extract(c) {
      throw new Error(`${e} is API-ready but not yet implemented.`);
    }
    async normalize(c) {
      throw new Error(`${e} is API-ready but not yet implemented.`);
    }
    async syncInternal() {
      throw new Error(`${e} is API-ready but not yet implemented.`);
    }
    async checkHealth() {
      return {
        connectorId: t,
        status: "unavailable",
        message: "Stub connector — API-ready, awaiting implementation",
        lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  return new r();
}
const td = ne("claude", "Claude Connector", "Acquire knowledge from Claude conversation exports.", ["export", "session"]), nd = ne("cursor", "Cursor Connector", "Acquire knowledge from Cursor workspace sessions.", ["workspace", "session"]), sd = ne("google-drive", "Google Drive Connector", "Acquire documents from Google Drive folders.", ["folder", "file"]), rd = ne("onedrive", "OneDrive Connector", "Acquire documents from OneDrive folders.", ["folder", "file"]), id = ne("notion", "Notion Connector", "Acquire pages and databases from Notion workspaces.", ["page", "database"]), od = ne("obsidian", "Obsidian Connector", "Acquire vault notes from Obsidian.", ["vault"]), ad = ne("rss", "RSS Connector", "Acquire feed entries from RSS/Atom sources.", ["feed"]), cd = ne("websites", "Websites Connector", "Acquire content from configured website URLs.", ["url", "sitemap"]), ud = ne("podcasts", "Podcasts Connector", "Acquire show notes and transcripts from podcast feeds.", ["feed", "episode"]), dd = [
  td,
  nd,
  sd,
  rd,
  id,
  od,
  ad,
  cd,
  ud
], ld = [
  Ou,
  qu,
  Xu,
  ed
], fd = [...ld, ...dd];
function Ce() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function Zt(t) {
  return t.capabilities.supportsApiKey ? { type: "api_key", configured: !1, label: "API Key" } : t.capabilities.supportsOAuth ? { type: "oauth", configured: !1, label: "OAuth" } : { type: "none", configured: !0 };
}
class md {
  constructor() {
    _(this, "connectors", /* @__PURE__ */ new Map());
    _(this, "state", null);
    _(this, "repositoryPath", "");
    _(this, "onAwarenessRefreshed");
    _(this, "scheduler");
    _(this, "worker");
    this.scheduler = new Lu((e, n) => this.monitorConnector(e, n)), this.worker = new Pu(this.scheduler);
    for (const e of fd)
      this.connectors.set(e.id, e);
  }
  register(e) {
    this.connectors.set(e.id, e);
  }
  get(e) {
    return this.connectors.get(e);
  }
  list() {
    return Array.from(this.connectors.values());
  }
  async initialize(e) {
    this.repositoryPath = e, this.state = await uo(e);
    for (const n of this.connectors.values())
      this.state.connectors[n.id] || (this.state.connectors[n.id] = n.getDefaultConfig()), this.state.monitoring[n.id] || (this.state.monitoring[n.id] = this.defaultMonitoringRecord(n.id));
    this.worker.start(this.state.schedules);
    for (const n of Object.values(this.state.connectors))
      n.connected && n.scheduledSyncEnabled && n.scheduleIntervalMinutes && (this.worker.schedule(n.connectorId, n.scheduleIntervalMinutes), this.state.monitoring[n.connectorId] = {
        ...this.monitoringFor(n.connectorId),
        active: !0,
        nextCheckAt: this.nextCheckAt(n.scheduleIntervalMinutes)
      });
    this.state.schedules = this.worker.getSchedules(), await X(e, this.state);
  }
  setAwarenessRefreshHandler(e) {
    this.onAwarenessRefreshed = e;
  }
  ensureState() {
    if (!this.state)
      throw new Error("ConnectorManager not initialized.");
    return this.state;
  }
  configFor(e) {
    const n = this.ensureState(), s = this.get(e);
    return n.connectors[e] ?? (s == null ? void 0 : s.getDefaultConfig()) ?? {
      connectorId: e,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {}
    };
  }
  async getStatuses(e) {
    const n = this.ensureState(), s = this.buildContext(e), r = [];
    for (const i of this.connectors.values()) {
      const o = this.configFor(i.id), c = n.totals[i.id] ?? { itemsImported: 0 }, a = o.connected ? await i.checkHealth(s) : {
        connectorId: i.id,
        status: "disconnected",
        message: "Not connected",
        lastCheckedAt: Ce()
      };
      r.push({
        connectorId: i.id,
        name: i.name,
        description: i.description,
        capabilities: i.capabilities,
        config: o,
        health: a,
        auth: Zt(i),
        lastSyncAt: c.lastSyncAt,
        itemsImported: c.itemsImported,
        implementationStatus: i.capabilities.implementationStatus,
        monitoring: this.monitoringFor(i.id)
      });
    }
    return r;
  }
  async connect(e, n, s) {
    const r = this.get(e);
    if (!r)
      throw new Error(`Unknown connector: ${e}`);
    const i = this.ensureState(), o = {
      ...this.configFor(e),
      ...n,
      connectorId: e,
      connected: !0,
      enabled: !0
    }, c = this.buildContext(s), a = await r.connect(o, c);
    return i.connectors[e] = o, o.scheduledSyncEnabled && o.scheduleIntervalMinutes && (this.worker.schedule(e, o.scheduleIntervalMinutes), i.schedules = this.worker.getSchedules(), i.monitoring[e] = {
      ...this.monitoringFor(e),
      active: !0,
      nextCheckAt: this.nextCheckAt(o.scheduleIntervalMinutes)
    }), await X(this.repositoryPath, i), a;
  }
  async disconnect(e) {
    const n = this.get(e);
    if (!n)
      throw new Error(`Unknown connector: ${e}`);
    const s = this.ensureState();
    await n.disconnect();
    const r = this.configFor(e);
    s.connectors[e] = { ...r, connected: !1 }, this.worker.unschedule(e), s.schedules = this.worker.getSchedules(), s.monitoring[e] = {
      ...this.monitoringFor(e),
      active: !1,
      nextCheckAt: void 0
    }, await X(this.repositoryPath, s);
  }
  async updateConfig(e, n) {
    const s = this.ensureState(), i = { ...this.configFor(e), ...n, connectorId: e };
    return s.connectors[e] = i, i.scheduledSyncEnabled && i.scheduleIntervalMinutes && i.connected ? (this.worker.schedule(e, i.scheduleIntervalMinutes), s.schedules = this.worker.getSchedules(), s.monitoring[e] = {
      ...this.monitoringFor(e),
      active: !0,
      nextCheckAt: this.nextCheckAt(i.scheduleIntervalMinutes)
    }) : (this.worker.unschedule(e), s.schedules = this.worker.getSchedules(), s.monitoring[e] = {
      ...this.monitoringFor(e),
      active: !1,
      nextCheckAt: void 0
    }), await X(this.repositoryPath, s), i;
  }
  async syncNow(e, n, s, r) {
    var h, I;
    const i = this.get(e);
    if (!i)
      throw new Error(`Unknown connector: ${e}`);
    const o = this.ensureState(), c = (r == null ? void 0 : r.configOverride) ?? this.configFor(e);
    if (!c.connected)
      throw new Error(`Connector "${i.name}" is not connected.`);
    const a = Date.now(), l = crypto.randomUUID(), d = {
      ...this.buildContext(s),
      config: c,
      auth: Zt(i)
    };
    (h = d.log) == null || h.call(d, "info", `${r != null && r.automatic ? "Auto-sync" : "Sync"} started: ${i.name}`);
    let u;
    try {
      if (u = await i.sync(n, d), u.documents.length > 0) {
        const b = await Nu(this.repositoryPath, u.documents);
        if (u.itemsSkipped += u.documents.length - b.documents.length, u.documents = b.documents, b.documents.length > 0) {
          const C = await Ws(b.documents, this.repositoryPath, {
            importFileName: (n == null ? void 0 : n.name) ?? `${e}-sync`,
            log: (T, g) => {
              var m;
              return (m = d.log) == null ? void 0 : m.call(d, T, g);
            },
            onProgress: (T) => {
              var g;
              return (g = d.onProgress) == null ? void 0 : g.call(d, "emit", T);
            }
          });
          u.itemsImported = C.sourcesCreated, u.itemsUpdated = Math.max(b.updatedCount, C.sourcesCreated === 0 && b.documents.length > 0 ? b.documents.length : 0), u.itemsSkipped += C.skippedDuplicates;
          const A = await _u(this.repositoryPath);
          u.evidenceIndexBuiltAt = A.evidenceIndexBuiltAt, u.relationshipIndexBuiltAt = A.relationshipIndexBuiltAt, u.briefingGeneratedAt = A.briefingGeneratedAt, this.appendEvent(o, e, "awareness_refreshed", "Evidence, relationships, and awareness refreshed", {
            evidenceIndexBuiltAt: A.evidenceIndexBuiltAt,
            relationshipIndexBuiltAt: A.relationshipIndexBuiltAt,
            briefingGeneratedAt: A.briefingGeneratedAt
          }), (I = this.onAwarenessRefreshed) == null || I.call(this);
        }
      }
      u.durationMs = Date.now() - a, u.success = u.errors.length === 0, (u.itemsImported > 0 || u.itemsUpdated > 0) && this.appendEvent(o, e, "acquired", "Connector content acquired", {
        imported: u.itemsImported,
        updated: u.itemsUpdated
      }), (u.itemsSkipped > 0 || u.itemsUpdated > 0) && this.appendEvent(o, e, "skipped_duplicate", "Existing connector content was not duplicated", {
        skipped: u.itemsSkipped,
        updated: u.itemsUpdated
      });
    } catch (b) {
      const C = b instanceof Error ? b.message : String(b);
      u = {
        success: !1,
        connectorId: e,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [C],
        durationMs: Date.now() - a
      }, this.appendEvent(o, e, "failed", C);
    }
    const f = {
      syncId: l,
      connectorId: e,
      startedAt: new Date(a).toISOString(),
      completedAt: Ce(),
      success: u.success,
      itemsImported: u.itemsImported,
      itemsUpdated: u.itemsUpdated,
      itemsSkipped: u.itemsSkipped,
      error: u.errors[0]
    };
    o.syncHistory.unshift(f), o.syncHistory = o.syncHistory.slice(0, 100);
    const p = o.totals[e] ?? { itemsImported: 0 };
    return o.totals[e] = {
      itemsImported: p.itemsImported + u.itemsImported + u.itemsUpdated,
      lastSyncAt: f.completedAt
    }, await X(this.repositoryPath, o), u;
  }
  async monitorConnector(e, n) {
    const s = this.get(e);
    if (!s)
      throw new Error(`Unknown connector: ${e}`);
    const r = this.ensureState(), i = this.configFor(e);
    if (!i.connected || !i.scheduledSyncEnabled)
      return r.monitoring[e] = {
        ...this.monitoringFor(e),
        active: !1,
        nextCheckAt: void 0
      }, await X(this.repositoryPath, r), null;
    const o = {
      ...this.buildContext(n),
      config: i,
      auth: Zt(s)
    };
    try {
      const c = await this.detectChanges(s, o), a = this.monitoringFor(e), l = new Set(a.lastChangeKeys ?? []), d = c.changeKeys.filter((b) => !l.has(b)), u = !!(a.lastCursor && c.cursor !== a.lastCursor), f = this.nextCheckAt(i.scheduleIntervalMinutes);
      if (r.monitoring[e] = {
        ...a,
        active: !0,
        lastCheckedAt: c.checkedAt,
        nextCheckAt: f
      }, this.appendEvent(r, e, "checked", c.summary, {
        cursor: c.cursor,
        keys: c.changeKeys
      }), !a.lastCursor)
        return r.monitoring[e] = {
          ...r.monitoring[e],
          lastCursor: c.cursor,
          lastChangeKeys: c.changeKeys
        }, r.schedules = this.worker.getSchedules(), await X(this.repositoryPath, r), null;
      if (!u)
        return r.schedules = this.worker.getSchedules(), await X(this.repositoryPath, r), null;
      const p = d.length > 0 ? d : c.changeKeys;
      r.monitoring[e] = {
        ...r.monitoring[e],
        lastChangeDetectedAt: c.checkedAt
      }, this.appendEvent(r, e, "change_detected", "Connector source changed", {
        previousCursor: a.lastCursor,
        cursor: c.cursor,
        changedKeys: p
      });
      const h = {
        ...i,
        settings: {
          ...i.settings,
          __changeKeys: p
        }
      }, I = await this.syncNow(e, null, o, {
        automatic: !0,
        configOverride: h
      });
      return I.success && (r.monitoring[e] = {
        ...this.monitoringFor(e),
        active: !0,
        lastCheckedAt: c.checkedAt,
        nextCheckAt: f,
        lastCursor: c.cursor,
        lastChangeKeys: c.changeKeys,
        lastChangeDetectedAt: c.checkedAt,
        lastSuccessfulAutoSyncAt: Ce()
      }), r.schedules = this.worker.getSchedules(), await X(this.repositoryPath, r), I;
    } catch (c) {
      const a = c instanceof Error ? c.message : String(c);
      return this.appendEvent(r, e, "failed", a), await X(this.repositoryPath, r), {
        success: !1,
        connectorId: e,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [a],
        durationMs: 0
      };
    }
  }
  async runPipeline(e, n, s) {
    const r = this.get(e);
    if (!r)
      throw new Error(`Unknown connector: ${e}`);
    const i = Date.now(), o = this.buildContext(s);
    try {
      const c = await dn(r, n, o);
      return {
        success: !0,
        connectorId: e,
        itemsImported: c.documents.length,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: c.documents,
        errors: [],
        durationMs: Date.now() - i
      };
    } catch (c) {
      const a = c instanceof Error ? c.message : String(c);
      return {
        success: !1,
        connectorId: e,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [a],
        durationMs: Date.now() - i
      };
    }
  }
  getSyncHistory(e) {
    const n = this.ensureState();
    return e ? n.syncHistory.filter((s) => s.connectorId === e) : n.syncHistory;
  }
  getEvents(e) {
    const n = this.ensureState();
    return e ? n.events.filter((s) => s.connectorId === e) : n.events;
  }
  getSchedules() {
    return this.worker.getSchedules();
  }
  stopMonitoring() {
    this.worker.stop();
  }
  createJob(e) {
    return {
      jobId: crypto.randomUUID(),
      connectorId: e,
      startedAt: Ce(),
      status: "queued",
      progress: 0,
      itemsProcessed: 0
    };
  }
  buildContext(e) {
    return {
      repositoryPath: this.repositoryPath,
      ...e
    };
  }
  defaultMonitoringRecord(e) {
    return {
      connectorId: e,
      active: !1
    };
  }
  monitoringFor(e) {
    return this.ensureState().monitoring[e] ?? this.defaultMonitoringRecord(e);
  }
  nextCheckAt(e = 60) {
    return new Date(Date.now() + e * 6e4).toISOString();
  }
  appendEvent(e, n, s, r, i) {
    e.events.unshift({
      eventId: crypto.randomUUID(),
      connectorId: n,
      type: s,
      timestamp: Ce(),
      message: r,
      metadata: i
    }), e.events = e.events.slice(0, 500);
  }
  async detectChanges(e, n) {
    if (e.detectChanges)
      return e.detectChanges(n);
    const s = JSON.stringify(n.config.settings ?? {});
    return {
      connectorId: e.id,
      checkedAt: Ce(),
      cursor: s,
      changeKeys: [s],
      summary: `${e.name} checked`
    };
  }
}
let Vt = null;
function ae() {
  return Vt || (Vt = new md()), Vt;
}
class Ne {
  canImport(e) {
    var s;
    const n = ((s = e.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async import(e, n) {
    throw new Os(`Importer "${this.name}"`);
  }
}
class pd {
  constructor() {
    _(this, "plugins", /* @__PURE__ */ new Map());
  }
  register(e) {
    this.plugins.set(e.id, e);
  }
  unregister(e) {
    this.plugins.delete(e);
  }
  get(e) {
    return this.plugins.get(e);
  }
  getAll() {
    return Array.from(this.plugins.values());
  }
  findForFile(e) {
    return this.getAll().find((n) => n.canImport(e));
  }
}
const vt = new pd(), hd = 500, gd = /* @__PURE__ */ new Set(["system"]);
function yd(t) {
  if (!Array.isArray(t) || t.length === 0)
    return !1;
  const e = t[0];
  return typeof e == "object" && e !== null && "mapping" in e && typeof e.mapping == "object";
}
function wd(t) {
  return qr(t).map(Wr);
}
function qr(t) {
  const e = JSON.parse(t);
  if (!Array.isArray(e))
    throw new Error("conversations.json must be a JSON array.");
  if (!yd(e))
    throw new Error("Unrecognized export format: expected ChatGPT conversations.json structure.");
  return e;
}
async function vd(t, e = {}) {
  const { signal: n, batchSize: s = 25, onProgress: r } = e, i = [];
  let o = 0;
  for (let c = 0; c < t.length; c++) {
    if (n != null && n.aborted)
      throw new Error("Validation cancelled by user.");
    const a = Wr(t[c]);
    i.push(a), o += a.messages.length, (c % s === 0 || c === t.length - 1) && (r == null || r({
      conversationsTotal: t.length,
      conversationsProcessed: c + 1,
      messagesProcessed: o
    }), await new Promise((l) => setImmediate(l)));
  }
  return i;
}
function Wr(t) {
  var c;
  const e = t.conversation_id ?? t.id ?? Rd(), n = (((c = t.title) == null ? void 0 : c.trim()) || "Untitled Conversation").slice(0, 200), r = Id(t).map((a) => Ed(a.message)).filter((a) => a !== null), i = r.filter((a) => a.isPastedTranscript).map((a) => a.text), o = [...new Set(r.flatMap((a) => a.fileReferences))];
  return {
    conversationId: e,
    title: n,
    createTime: t.create_time,
    updateTime: t.update_time,
    messages: r,
    pastedTranscripts: i,
    fileReferences: o,
    assetPaths: o
  };
}
function Id(t) {
  const e = t.mapping ?? {};
  let n = t.current_node;
  if ((!n || !e[n]) && (n = Sd(e)), !n)
    return [];
  const s = [], r = /* @__PURE__ */ new Set();
  for (; n && e[n] && !r.has(n); )
    r.add(n), s.push(e[n]), n = e[n].parent;
  return s.reverse();
}
function Sd(t) {
  var s;
  let e, n = -1;
  for (const r of Object.values(t)) {
    if (r.children.length > 0)
      continue;
    const i = ((s = r.message) == null ? void 0 : s.create_time) ?? 0;
    i >= n && (n = i, e = r.id);
  }
  return e;
}
function Ed(t) {
  var r;
  if (!((r = t == null ? void 0 : t.author) != null && r.role))
    return null;
  const e = t.author.role;
  if (gd.has(e))
    return null;
  const n = Cd(t).trim();
  if (!n)
    return null;
  const s = kd(t, n);
  return {
    role: e,
    text: n,
    createTime: t.create_time ?? void 0,
    isPastedTranscript: e === "user" && n.length >= hd,
    fileReferences: s
  };
}
function Cd(t) {
  const e = t.content;
  return e ? Array.isArray(e.parts) ? e.parts.map((n) => {
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
`) : typeof e.text == "string" ? e.text : "" : "";
}
function kd(t, e) {
  const n = [], r = (t.metadata ?? {}).attachments;
  if (Array.isArray(r)) {
    for (const c of r)
      if (c && typeof c == "object") {
        const a = c;
        typeof a.name == "string" && n.push(a.name), typeof a.id == "string" && n.push(a.id);
      }
  }
  const i = /(?:file-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|dalle-generations\/[^\s"']+|uploaded[^\s"']*\.[a-zA-Z0-9]+)/gi, o = e.match(i);
  return o && n.push(...o), [...new Set(n)];
}
function Rd() {
  return `unknown-${Date.now()}`;
}
function bd(t) {
  const e = [];
  for (const n of t) {
    const s = n.role === "user" ? "User" : n.role === "assistant" ? "Assistant" : n.role;
    if (e.push(`### ${s}`), n.createTime && e.push(`*${Ad(n.createTime)}*`), e.push(""), e.push(n.text), e.push(""), n.fileReferences.length > 0) {
      e.push("**File references:**");
      for (const r of n.fileReferences)
        e.push(`- ${r}`);
      e.push("");
    }
  }
  return e.join(`
`).trim();
}
function Ad(t) {
  const e = t > 1e12 ? t : t * 1e3;
  return new Date(e).toISOString();
}
function Yr(t, e, n = {}) {
  const { sharedAssetList: s } = n, r = bd(t.messages), i = t.pastedTranscripts.length > 0 ? `

## Pasted Source Text

${t.pastedTranscripts.join(`

---

`)}` : "", o = e.filter((a) => t.fileReferences.some((l) => a.zipPath.includes(l) || a.fileName.includes(l)) || t.assetPaths.some((l) => a.zipPath.includes(l))), c = {
    conversationId: t.conversationId,
    createTime: t.createTime,
    updateTime: t.updateTime,
    messageCount: t.messages.length,
    userMessageCount: t.messages.filter((a) => a.role === "user").length,
    assistantMessageCount: t.messages.filter((a) => a.role === "assistant").length,
    pastedTranscriptCount: t.pastedTranscripts.length,
    fileReferences: t.fileReferences
  };
  return o.length > 0 && (c.assets = o.map((a) => ({
    zipPath: a.zipPath,
    fileName: a.fileName
  }))), s && (c.allZipAssets = s), {
    id: t.conversationId,
    title: t.title,
    content: `${r}${i}`,
    format: "chatgpt-export-zip",
    metadata: c
  };
}
const $d = "conversations.json", Td = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i
];
function ft(t) {
  if (t != null && t.aborted)
    throw new Error("Validation cancelled by user.");
}
function Jr(t, e = {}) {
  var p, h, I;
  const { loadAssetData: n = !0, signal: s, callbacks: r } = e;
  ft(s);
  const o = new zs(t).getEntries();
  (p = r == null ? void 0 : r.onZipOpened) == null || p.call(r, o.length), ft(s);
  const c = o.find((b) => !b.isDirectory && b.entryName.replace(/\\/g, "/").endsWith($d));
  if (!c)
    throw new Error("Not a ChatGPT export ZIP: conversations.json was not found in the archive.");
  const a = c.entryName.replace(/\\/g, "/"), l = c.header.size;
  (h = r == null ? void 0 : r.onConversationsJsonLocated) == null || h.call(r, a, l), ft(s);
  const d = c.getData().toString("utf8"), u = [];
  let f = 0;
  for (const b of o) {
    if (ft(s), b.isDirectory)
      continue;
    const C = b.entryName.replace(/\\/g, "/"), A = S.basename(C);
    if (Td.some((g) => g.test(A) || g.test(C)) || C.endsWith(".json") && !C.includes("/"))
      continue;
    f++;
    const T = {
      zipPath: C,
      fileName: A
    };
    n && (T.data = b.getData()), u.push(T);
  }
  return (I = r == null ? void 0 : r.onEntriesDiscovered) == null || I.call(r, o.length, f), {
    conversationsJson: d,
    conversationsPath: a,
    assets: u,
    archiveEntryCount: o.length
  };
}
class Dd {
  constructor() {
    _(this, "id", "chatgpt-export-zip");
    _(this, "name", "ChatGPT Connector");
    _(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    _(this, "supportedExtensions", [".zip"]);
  }
  canHandle(e) {
    var n;
    return ((n = e.extension) == null ? void 0 : n.toLowerCase()) === ".zip";
  }
  async discover(e) {
    return {
      connectorId: this.id,
      source: e,
      format: "chatgpt-export-zip",
      metadata: {
        fileName: e.name
      }
    };
  }
  async extract(e) {
    const n = Jr(e.source.path, { loadAssetData: !1 }), s = wd(n.conversationsJson);
    return {
      connectorId: this.id,
      source: e.source,
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
  async normalize(e) {
    const n = e.assets.map((r) => ({
      zipPath: r.path,
      fileName: r.fileName,
      data: Buffer.from(r.dataBase64 ?? "", "base64")
    })), s = n.map((r) => ({ zipPath: r.zipPath, fileName: r.fileName }));
    return e.rawDocuments.map((r, i) => {
      const o = Yr(r, n, {
        sharedAssetList: i === 0 ? s : void 0
      });
      return {
        id: o.id,
        title: o.title,
        content: o.content,
        format: o.format,
        metadata: o.metadata
      };
    });
  }
}
const qt = new Dd(), xd = {
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
function ks(t) {
  if (t != null && t.aborted)
    throw new Error("Validation cancelled by user.");
}
function Rs(t) {
  return t < 1024 ? `${t} B` : t < 1024 * 1024 ? `${(t / 1024).toFixed(1)} KB` : `${(t / (1024 * 1024)).toFixed(1)} MB`;
}
async function Xr(t, e = {}) {
  const n = Date.now(), s = [];
  let r = 0, i, o, c = 0, a = 0, l = 0;
  const d = (f, p, h = {}) => {
    var I;
    (I = e.onProgress) == null || I.call(e, {
      status: p,
      stage: f,
      stageLabel: xd[f],
      fileName: t.name,
      archiveEntryCount: r,
      conversationsJsonPath: i,
      conversationsJsonSizeBytes: o,
      conversationsTotal: c,
      conversationsProcessed: a,
      messagesProcessed: l,
      warningsGenerated: s.length,
      startedAt: new Date(n).toISOString(),
      elapsedMs: Date.now() - n,
      ...h
    });
  }, u = (f, p, h) => {
    var I;
    (I = e.log) == null || I.call(e, f, p, h);
  };
  try {
    d("zip-selected", "running", { detail: t.name }), u("info", `ZIP selected: ${t.name}`, { path: t.path }), d("zip-opening", "running"), u("info", "Opening ZIP archive (read-only)…");
    const f = Jr(t.path, {
      loadAssetData: !1,
      signal: e.signal,
      callbacks: {
        onZipOpened: (g) => {
          r = g, d("zip-opened", "running", {
            archiveEntryCount: g,
            detail: `${g} entries`
          }), u("info", `ZIP opened: ${g} archive entries`);
        },
        onEntriesDiscovered: (g, m) => {
          d("entries-discovered", "running", {
            archiveEntryCount: g,
            detail: `${m} asset file(s), metadata only`
          }), u("info", `Archive entries discovered: ${g} total, ${m} asset file(s)`);
        },
        onConversationsJsonLocated: (g, m) => {
          i = g, o = m, d("conversations-json-located", "running", {
            conversationsJsonPath: g,
            conversationsJsonSizeBytes: m,
            detail: `${g} (${Rs(m)})`
          }), u("info", `conversations.json located: ${g} (${Rs(m)})`);
        }
      }
    });
    ks(e.signal), d("parsing-started", "running"), u("info", "Conversations parsing started…");
    const p = qr(f.conversationsJson);
    c = p.length, u("info", `Total conversations detected: ${c}`, {
      conversationsTotal: c
    }), d("parsing-started", "running", {
      conversationsTotal: c,
      detail: `${c} conversations`
    });
    const h = await vd(p, {
      signal: e.signal,
      onProgress: (g) => {
        a = g.conversationsProcessed, l = g.messagesProcessed, d("parsing-conversations", "running", {
          conversationsTotal: g.conversationsTotal,
          conversationsProcessed: g.conversationsProcessed,
          messagesProcessed: g.messagesProcessed,
          detail: `${g.conversationsProcessed}/${g.conversationsTotal} conversations, ${g.messagesProcessed} messages`
        }), (g.conversationsProcessed % 100 === 0 || g.conversationsProcessed === g.conversationsTotal) && u("info", `Conversations processed: ${g.conversationsProcessed}/${g.conversationsTotal} (${g.messagesProcessed} messages)`, {
          conversationsProcessed: g.conversationsProcessed,
          conversationsTotal: g.conversationsTotal,
          messagesProcessed: g.messagesProcessed
        });
      }
    });
    ks(e.signal);
    const I = f.assets.map((g) => ({
      zipPath: g.zipPath,
      fileName: g.fileName
    })), b = h.map((g, m) => Yr(g, f.assets, {
      validationMode: !0,
      sharedAssetList: m === 0 ? I : void 0
    })), C = an(qt.id, b), A = cn(qt.id, t, C), T = un(qt, t, C, A);
    return s.length > 0 && u("warn", `Warnings generated: ${s.length}`, { warnings: s }), d("completed", "complete", {
      conversationsTotal: c,
      conversationsProcessed: a,
      messagesProcessed: l,
      detail: `${a} conversations validated`
    }), u("info", `Validation pipeline complete: ${C.length} conversation(s), ${l} message(s)`), T;
  } catch (f) {
    const p = f instanceof Error ? f.message : String(f), h = p.includes("cancelled");
    throw d(h ? "cancelled" : "failed", h ? "cancelled" : "failed", {
      error: p,
      detail: p
    }), u(h ? "warn" : "error", `Validation ${h ? "cancelled" : "failed"}: ${p}`, {
      error: p
    }), f;
  }
}
class _d extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "chatgpt-export-zip");
    _(this, "name", "ChatGPT Connector");
    _(this, "description", "Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.");
    _(this, "supportedExtensions", [".zip"]);
  }
  async import(n, s) {
    var o, c, a, l;
    const r = s.jobId ?? crypto.randomUUID(), i = [];
    if (s.importPackage)
      return (o = s.log) == null || o.call(s, "info", `Using validated import package: ${s.importPackage.documents.length} document(s) — no ZIP re-parse`), {
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
      const d = await Xr(n, {
        log: (u, f) => {
          var p;
          return (p = s.log) == null ? void 0 : p.call(s, u, f);
        },
        onProgress: (u) => {
          var f;
          if (u.conversationsTotal > 0) {
            const p = Math.round(u.conversationsProcessed / u.conversationsTotal * 100);
            (f = s.onProgress) == null || f.call(s, p);
          }
        },
        signal: s.signal
      });
      return (a = s.log) == null || a.call(s, "info", `Import package ready: ${d.documents.length} document(s)`), {
        jobId: r,
        success: !0,
        documents: d.documents,
        errors: i,
        summary: {
          conversationsFound: d.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: i,
          outputFolder: `${s.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    } catch (d) {
      const u = d instanceof Error ? d.message : String(d);
      return i.push(u), (l = s.log) == null || l.call(s, "error", u), {
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
class Nd extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "pdf");
    _(this, "name", "PDF");
    _(this, "description", "Import content from PDF documents.");
    _(this, "supportedExtensions", [".pdf"]);
  }
}
class Ld extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "markdown");
    _(this, "name", "Markdown");
    _(this, "description", "Import Markdown (.md) files.");
    _(this, "supportedExtensions", [".md", ".markdown"]);
  }
}
class Pd extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "html");
    _(this, "name", "HTML");
    _(this, "description", "Import HTML web pages and exports.");
    _(this, "supportedExtensions", [".html", ".htm"]);
  }
}
class Fd extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "docx");
    _(this, "name", "DOCX");
    _(this, "description", "Import Microsoft Word documents.");
    _(this, "supportedExtensions", [".docx"]);
  }
}
class Od extends Ne {
  constructor() {
    super(...arguments);
    _(this, "id", "txt");
    _(this, "name", "Plain Text");
    _(this, "description", "Import plain text files.");
    _(this, "supportedExtensions", [".txt"]);
  }
}
const bs = [
  new _d(),
  new Nd(),
  new Ld(),
  new Pd(),
  new Fd(),
  new Od()
];
async function Qr(t, e, n = {}) {
  var o, c, a, l;
  const s = Date.now(), r = [], i = (d, u, f) => {
    var p;
    (p = n.log) == null || p.call(n, d, u, f);
  };
  try {
    i("info", "Validation started (read-only — repository will not be modified)", {
      fileName: t.name,
      repositoryPath: e
    });
    const d = await Xr(t, {
      log: n.log,
      onProgress: n.onProgress,
      signal: n.signal
    });
    (o = n.onImportPackageReady) == null || o.call(n, d), (c = n.onProgress) == null || c.call(n, {
      status: "running",
      stage: "planning-import",
      stageLabel: "Planning import (read-only)",
      fileName: t.name,
      conversationsTotal: d.documents.length,
      conversationsProcessed: d.documents.length,
      messagesProcessed: d.documents.reduce((f, p) => f + Number(p.metadata.messageCount ?? 0), 0),
      warningsGenerated: r.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: "Scanning repository for planned changes"
    }), i("info", "Planning import (read-only repository scan)…");
    const u = await ao(d.documents, e, t.name);
    if (u.filePath = t.path, u.zipReadable = !0, u.chatGptStructureDetected = !0, u.conversationsJsonPresent = !0, u.valid = u.blockingErrors.length === 0 && d.documents.length > 0, u.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), u.durationMs = Date.now() - s, d.documents.length === 0) {
      const f = "No conversations found in export.";
      u.errors.push(f), u.blockingErrors.push(f), u.valid = !1;
    }
    if (u.uncertainCount > 0) {
      const f = `${u.uncertainCount} conversation(s) classified as uncertain and will route to Other / Review Needed.`;
      u.warnings.push(f), r.push(f);
    }
    if (u.estimatedDuplicatesSkipped > 0) {
      const f = `${u.estimatedDuplicatesSkipped} duplicate(s) will be skipped during import.`;
      u.warnings.push(f), r.push(f);
    }
    return r.length > 0 && i("warn", `Validation warnings: ${r.length}`, { warnings: r }), (a = n.onProgress) == null || a.call(n, {
      status: u.valid ? "complete" : "failed",
      stage: u.valid ? "completed" : "failed",
      stageLabel: u.valid ? "Validation complete" : "Validation failed",
      fileName: t.name,
      conversationsTotal: u.conversationsFound,
      conversationsProcessed: u.conversationsFound,
      messagesProcessed: d.documents.reduce((f, p) => f + Number(p.metadata.messageCount ?? 0), 0),
      warningsGenerated: u.warnings.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: u.valid ? `${u.conversationsFound} conversations ready for review` : u.blockingErrors.join("; ") || "Validation failed",
      error: u.valid ? void 0 : u.blockingErrors.join("; ") || "Validation failed"
    }), u.valid ? i("info", `Validation completed successfully in ${u.durationMs}ms`, {
      conversationsFound: u.conversationsFound,
      estimatedSourcesToCreate: u.estimatedSourcesToCreate,
      estimatedSourcesToUpdate: u.estimatedSourcesToUpdate,
      warnings: u.warnings.length
    }) : i("error", `Validation failed — repository unchanged. ${u.blockingErrors.join("; ")}`, {
      blockingErrors: u.blockingErrors,
      errors: u.errors
    }), u;
  } catch (d) {
    const u = d instanceof Error ? d.message : String(d), f = u.includes("cancelled"), p = co(t.name, t.path, e, u);
    return p.durationMs = Date.now() - s, p.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), (l = n.onProgress) == null || l.call(n, {
      status: f ? "cancelled" : "failed",
      stage: f ? "cancelled" : "failed",
      stageLabel: f ? "Validation cancelled" : "Validation failed",
      fileName: t.name,
      conversationsTotal: 0,
      conversationsProcessed: 0,
      messagesProcessed: 0,
      warningsGenerated: 0,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      error: u,
      detail: u
    }), i(f ? "warn" : "error", `Validation ${f ? "cancelled" : "failed"} — repository unchanged. ${u}`, { error: u }), p;
  }
}
const Ud = [
  "openai",
  "claude",
  "gemini",
  "openrouter",
  "ollama"
];
function An() {
  return S.join($e.getPath("userData"), "credentials");
}
function It(t) {
  return S.join(An(), `${t}.cred`);
}
function As() {
  return S.join(An(), ".mode");
}
function $n() {
  return tn.isEncryptionAvailable();
}
function ei() {
  return $n() ? "available" : "dev_fallback";
}
async function Md(t, e) {
  const n = e.trim();
  if (!n) {
    await jd(t);
    return;
  }
  if (await R.mkdir(An(), { recursive: !0 }), $n()) {
    const s = tn.encryptString(n);
    await R.writeFile(It(t), s), await R.writeFile(As(), "secure", "utf8");
    return;
  }
  await R.writeFile(It(t), Buffer.from(n, "utf8").toString("base64"), "utf8"), await R.writeFile(As(), "dev-fallback", "utf8");
}
async function ti(t) {
  try {
    const e = await R.readFile(It(t));
    return $n() ? tn.decryptString(e) : Buffer.from(e.toString("utf8"), "base64").toString("utf8");
  } catch {
    return;
  }
}
async function jd(t) {
  try {
    await R.unlink(It(t));
  } catch {
  }
}
async function ni(t) {
  const e = await ti(t);
  return !!(e != null && e.trim());
}
async function si(t) {
  if (!(t === "mock" || t === "deterministic"))
    return ti(t);
}
async function Bd() {
  const t = {};
  for (const e of Ud)
    t[e] = await ni(e);
  return t;
}
function en() {
  return S.join($e.getPath("userData"), "kae-settings.json");
}
async function Kd() {
  try {
    const t = await R.readFile(en(), "utf8"), e = JSON.parse(t), { aiApiKey: n, ...s } = e;
    return s;
  } catch {
    return {};
  }
}
async function Gd(t) {
  const { aiApiKey: e, ...n } = t;
  await R.mkdir(S.dirname(en()), { recursive: !0 }), await R.writeFile(en(), JSON.stringify(n, null, 2), "utf8");
}
function Tn(t) {
  return { ...Ms, ...t };
}
const $s = S.dirname(di(import.meta.url));
xs.registerSchemesAsPrivileged([
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
function zd(t) {
  const e = "kae-asset://resolve/";
  if (!t.startsWith(e))
    throw new Error("Invalid asset URL.");
  return decodeURIComponent(t.slice(e.length));
}
let L = null;
function Hd() {
  for (const t of nn.getAllWindows())
    t.isDestroyed() || t.webContents.reload();
}
process.env.VITE_DEV_SERVER_URL && process.on("message", (t) => {
  t === "electron-vite&type=hot-reload" && Hd();
});
let ce = null, ee = null, Be = null, ri = null, ge = null, Wt = null, Yt = null;
const ue = gi(), Z = new wi(), mt = [];
function F() {
  return ue.repository.path;
}
async function te() {
  const t = ae();
  await t.initialize(F()), t.setAwarenessRefreshHandler(() => {
    L == null || L.webContents.send("kae:executive-briefing-updated"), L == null || L.webContents.send("kae:vigsy-refreshed");
  });
}
function Ae() {
  return Tn(ue.settings);
}
async function pe() {
  const t = Ae(), e = ze();
  e.setSecureStorageMode(ei()), e.setActive(t.aiProvider);
  const n = await si(t.aiProvider);
  e.setCredentials({
    apiKey: n,
    model: t.aiModel,
    baseUrl: t.aiBaseUrl,
    temperature: t.aiTemperature,
    streaming: t.aiStreaming
  });
}
async function Ts(t) {
  const e = Ae(), n = (t == null ? void 0 : t.providerId) ?? e.aiProvider, s = (t == null ? void 0 : t.apiKey) ?? await si(n);
  return {
    providerId: n,
    apiKey: s,
    model: (t == null ? void 0 : t.model) ?? e.aiModel,
    baseUrl: (t == null ? void 0 : t.baseUrl) ?? e.aiBaseUrl,
    temperature: (t == null ? void 0 : t.temperature) ?? e.aiTemperature,
    streaming: (t == null ? void 0 : t.streaming) ?? e.aiStreaming,
    conversationContext: t == null ? void 0 : t.conversationContext
  };
}
function pt(t) {
  const e = S.resolve(F(), t), n = S.resolve(F());
  if (!e.startsWith(n)) throw new Error("Invalid file path.");
  return e;
}
function j(t, e, n, s) {
  const r = {
    id: crypto.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: t,
    source: e,
    message: n,
    context: s
  };
  return mt.unshift(r), mt.length > 500 && mt.pop(), L == null || L.webContents.send("kae:log-added", r), r;
}
async function Ke() {
  try {
    await tt(F()), L == null || L.webContents.send("kae:executive-briefing-updated");
  } catch (t) {
    const e = t instanceof Error ? t.message : String(t);
    j("warn", "awareness", `Executive briefing refresh failed: ${e}`);
  }
}
async function ht(t) {
  const e = S.join(F(), ".kae-sessions", "import-trace.log"), n = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${t}
`;
  try {
    await R.mkdir(S.dirname(e), { recursive: !0 }), await R.appendFile(e, n, "utf8");
  } catch {
  }
}
function Zd() {
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
function ii(t) {
  L == null || L.webContents.send("kae:import-timeline", t);
}
function H(t, e, n, s) {
  const r = t.find((i) => i.id === e);
  r && (r.status = n, r.detail = s), ii([...t]);
}
function Vd() {
  bs.forEach((t) => vt.register(t)), bi.register(Ys), j("info", "system", `Registered ${bs.length} connector plugin(s)`);
}
function Ds() {
  L = new nn({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${Ps} — ${Fs}`,
    webPreferences: {
      preload: S.join($s, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL ? (L.loadURL(process.env.VITE_DEV_SERVER_URL), L.webContents.openDevTools({ mode: "detach" })) : L.loadFile(S.join($s, "../dist/index.html")), L.on("closed", () => {
    L = null;
  });
}
function oi(t) {
  L == null || L.webContents.send("kae:validation-progress", t);
}
async function qd(t) {
  const e = S.basename(t), n = S.extname(e), s = { path: t, name: e, extension: n };
  ge && ge.abort(), ge = new AbortController();
  const { signal: r } = ge;
  j("info", "import", `Validating: ${e} (read-only — no repository writes)`, {
    filePath: t,
    fileName: e
  });
  try {
    const i = await Qr(s, F(), {
      signal: r,
      log: (o, c, a) => j(o, "import", c, a),
      onProgress: oi,
      onImportPackageReady: (o) => {
        ee = o, Be = t, ht(
          `Validation cached import package: ${o.documents.length} document(s) from ${e}`
        );
      }
    });
    return ce = i, i.valid ? j(
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
    ge = null;
  }
}
async function Wd(t, e) {
  var y, w, E;
  const n = Date.now(), s = S.basename(t), r = S.extname(s), i = crypto.randomUUID(), o = { path: t, name: s, extension: r }, c = Zd();
  ii(c), await ht(`Confirm import started: ${s} (${t})`), H(c, "validate-zip", "running"), j("info", "import", `Pre-import validation gate: ${s}`);
  let a;
  try {
    ce != null && ce.valid && ce.filePath === t && ee && Be === t ? (a = ce, await ht(
      `Reusing validated import package: ${ee.documents.length} document(s) — no ZIP re-parse`
    ), j(
      "info",
      "import",
      `Reusing cached validation and import package (${ee.documents.length} documents)`
    )) : (a = await Qr(o, F(), {
      log: (k, $, U) => j(k, "import", $, U),
      onImportPackageReady: (k) => {
        ee = k, Be = t;
      }
    }), ce = a);
  } catch (k) {
    const $ = k instanceof Error ? k.message : String(k);
    throw H(c, "validate-zip", "failed", $), j("error", "import", `Validation error — repository unchanged. ${$}`), new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${$}. Recovery: fix the export and validate again.`
    );
  }
  if (!a.valid) {
    const k = a.blockingErrors.join("; ") || "Validation failed";
    throw H(c, "validate-zip", "failed", k), j("error", "import", `Import blocked — repository unchanged. ${k}`), new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${k}. Recovery: review the validation report and fix the export.`
    );
  }
  H(c, "validate-zip", "complete", `${a.conversationsFound} conversations`);
  const l = yi(i, e, o);
  l.status = "queued", Z.enqueue(l), L == null || L.webContents.send("kae:job-updated", l), Z.updateStatus(i, "running", 0), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
  const d = vt.get(e);
  if (!d) {
    const k = `No connector registered for format: ${e}`;
    throw Z.updateStatus(i, "failed", 0, k), j("error", "import", `${k} — repository unchanged.`), new Error(k);
  }
  H(c, "create-snapshot", "running"), j("info", "repository", "Creating pre-import snapshot…");
  const u = await tr(F(), i), f = await po(F(), {
    sessionId: i,
    connectorId: e,
    sourceFile: s,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: F(),
    snapshotPath: u,
    validationPassed: !0,
    plannedCreates: a.estimatedSourcesToCreate,
    plannedUpdates: a.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: u, manifestPath: "" }
  });
  H(c, "create-snapshot", "complete", S.basename(u)), j("info", "repository", `Snapshot saved: ${u}`), H(c, "analyze-export", "running"), await ht(
    `Analyze export: using cached package=${!!(ee && Be === t)}, documents=${(ee == null ? void 0 : ee.documents.length) ?? "unknown"}`
  );
  const p = {
    repositoryPath: F(),
    outputDirectory: ue.settings.outputDirectory,
    jobId: i,
    importPackage: Be === t ? ee ?? void 0 : void 0,
    sourceZipPath: t,
    log: (k, $) => j(k, "import", $),
    onProgress: (k) => {
      Z.updateStatus(i, "running", k), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
    }
  };
  j("info", "import", `Import started: ${s}`);
  const h = await d.import(o, p);
  if (!h.success || h.documents.length === 0) {
    const k = ((y = h.errors) == null ? void 0 : y.join("; ")) || "Import produced no documents";
    throw H(c, "analyze-export", "failed", k), Z.updateStatus(i, "failed", 100, k), j(
      "error",
      "import",
      `Import failed after snapshot — repository may be partially updated. Rollback: ${u}. Error: ${k}`
    ), new Error(
      `Import failed. Snapshot available at ${u}. What happened: connector produced no documents. Why: ${k}. Recovery: restore from snapshot if needed.`
    );
  }
  H(c, "analyze-export", "complete", `${h.documents.length} documents`), H(c, "generate-sources", "running"), Z.updateStatus(i, "running", 85), L == null || L.webContents.send("kae:job-updated", Z.getById(i)), H(c, "update-repository", "running");
  const I = await Ys.export(h.documents, F(), {
    log: (k, $) => j(k, "export", $),
    onProgress: (k) => {
      Z.updateStatus(i, "running", 85 + Math.round(k * 0.15)), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
    },
    importFileName: s,
    sourceZipPath: t
  });
  H(c, "generate-sources", "complete"), H(c, "update-repository", "complete", `${I.sourcesCreated} sources`), H(c, "update-registries", "complete", I.reviewFile ?? "Registries updated"), H(c, "health-check", "running");
  const b = await ye(F());
  H(c, "health-check", "complete", b.statusSubline), H(c, "git-readiness", "running");
  const C = b.gitReadiness;
  H(c, "git-readiness", "complete", C.status);
  const A = Date.now() - n, T = vt.get(e), g = {
    conversationsFound: ((w = h.summary) == null ? void 0 : w.conversationsFound) ?? h.documents.length,
    sourcesCreated: I.sourcesCreated,
    skippedDuplicates: I.skippedDuplicates,
    errors: [...h.errors ?? [], ...I.errors],
    outputFolder: I.outputFolder,
    createdSourceIds: I.createdSourceIds,
    classified: I.classified,
    uncertain: I.uncertain,
    reviewFile: I.reviewFile,
    durationMs: A,
    connectorId: e,
    connectorName: (T == null ? void 0 : T.name) ?? e,
    sessionsCreated: I.sessionsCreated ?? I.sourcesCreated,
    snapshotPath: u,
    gitReadiness: C,
    timeline: [...c]
  }, m = {
    reportId: i,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs: A,
    connectorId: e,
    connectorName: (T == null ? void 0 : T.name) ?? "ChatGPT Connector",
    sourceFile: s,
    repositoryPath: F(),
    imported: I.sourcesCreated,
    updated: a.estimatedSourcesToUpdate,
    skipped: I.skippedDuplicates,
    warnings: a.warnings,
    errors: g.errors,
    sourcesCreated: I.createdSourceIds,
    sessionsCreated: I.sessionsCreated ?? I.sourcesCreated,
    registriesUpdated: ((E = a.diffPreview) == null ? void 0 : E.registriesUpdated) ?? [],
    snapshotPath: u,
    manifestPath: f,
    gitReadiness: C,
    reportFilePath: ""
  };
  try {
    g.importReportPath = await Zo(F(), m), j("info", "import", `Import report saved: ${g.importReportPath}`);
  } catch (k) {
    const $ = k instanceof Error ? k.message : String(k);
    g.errors.push(`Import report: ${$}`), j("warn", "import", `Could not write import report: ${$}`);
  }
  H(c, "complete", "complete", `Done in ${(A / 1e3).toFixed(1)}s`), g.timeline = [...c], ri = g;
  const v = Z.getById(i);
  return v.summary = g, Z.updateStatus(i, "completed", 100), j(
    "info",
    "import",
    `Import complete in ${A}ms: ${g.sourcesCreated} source(s), ${g.skippedDuplicates} skipped`,
    { summary: g, snapshotPath: u, manifestPath: f }
  ), L == null || L.webContents.send("kae:job-updated", Z.getById(i)), Ke(), L == null || L.webContents.send("kae:import-complete", g), g;
}
function Yd() {
  N.handle(
    "kae:get-importers",
    () => vt.getAll().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      supportedExtensions: t.supportedExtensions
    }))
  ), N.handle("kae:get-repository-config", () => ue.repository), N.handle("kae:set-repository-config", async (t, e) => (ue.repository = e, await te(), j("info", "repository", `Repository path set to ${e.path}`), ue.repository)), N.handle("kae:get-settings", () => Ae()), N.handle("kae:set-settings", async (t, e) => (ue.settings = Tn(e), await Gd(Ae()), await pe(), j("info", "settings", "Application settings updated"), Ae())), N.handle("kae:get-jobs", () => Z.getAll()), N.handle("kae:get-logs", () => mt), N.handle("kae:get-default-repository-path", () => Us), N.handle("kae:get-repository-health", async () => ye(F())), N.handle("kae:get-git-readiness", async () => (await ye(F())).gitReadiness), N.handle("kae:get-repository-stats", async () => hr(F())), N.handle("kae:browse-repository", async () => kt(F())), N.handle(
    "kae:read-repository-file",
    async (t, e) => Ve(F(), e)
  ), N.handle("kae:parse-chatgpt-source", async (t, e) => {
    const n = await Ve(F(), e), s = yn(n);
    if (!s) return null;
    const r = new Set(s.fileReferences);
    for (const o of s.messages)
      for (const c of o.fileReferences) r.add(c);
    const i = await So(F(), [...r]);
    return { parsed: s, assets: i };
  }), N.handle(
    "kae:read-repository-asset",
    async (t, e, n) => {
      const s = pt(e), r = await R.readFile(s), i = wn(r, n ?? S.basename(e)), o = e.replace(/\\/g, "/");
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(o)}`,
        mimeType: i,
        sizeBytes: r.length
      };
    }
  ), N.handle(
    "kae:list-chatgpt-import-entries",
    async () => nr(F())
  ), N.handle(
    "kae:search-repository",
    async (t, e) => jo(F(), e)
  ), N.handle("kae:build-evidence-index", async () => {
    const t = await Qe(F());
    return await Te(F()), Ke(), Do(t);
  }), N.handle("kae:search-knowledge", async (t, e) => {
    const n = await mr(F(), e);
    return fr(n);
  }), N.handle(
    "kae:resolve-evidence-drilldown",
    async (t, e, n) => Sa(F(), e, n)
  ), N.handle(
    "kae:answer-knowledge-question",
    async (t, e, n) => {
      const s = await Ts(n);
      return await pe(), Xc(F(), e, s);
    }
  ), N.handle(
    "kae:answer-knowledge-question-stream",
    async (t, e, n) => {
      const s = await Ts({ ...n, streaming: !0 });
      return await pe(), Qc(F(), e, s, (r) => {
        t.sender.send("kae:reasoning-stream-chunk", r);
      });
    }
  ), N.handle("kae:list-ai-providers", () => ze().listCapabilities()), N.handle("kae:test-ai-provider", async (t, e) => {
    await pe();
    const n = ze();
    return e && n.setActive(e), n.testProviderHealth(e ?? Ae().aiProvider);
  }), N.handle("kae:get-provider-health", async () => (await pe(), ze().testActiveProviderHealth())), N.handle("kae:get-provider-key-status", async () => ({
    secureStorage: ei(),
    providers: await Bd()
  })), N.handle("kae:set-provider-api-key", async (t, e, n) => (await Md(e, n), await pe(), ni(e))), N.handle("kae:capture-live-session", async (t, e) => {
    const n = await xu(F(), e);
    return Ke(), L == null || L.webContents.send("kae:executive-briefing-updated"), L == null || L.webContents.send("kae:executive-memory-updated"), j("info", "live-capture", `Captured live session ${n.krcId}`, {
      source: n.sourceRelativePath
    }), n;
  }), N.handle("kae:build-relationship-index", async () => {
    const t = await Te(F());
    return Ke(), tc(t);
  }), N.handle("kae:search-relationships", async (t, e) => {
    const n = await qe(F());
    return Xt(n, e);
  }), N.handle("kae:get-relationships-for-evidence", async (t, e) => {
    const n = await qe(F());
    return Rr(n, e);
  }), N.handle(
    "kae:get-related-evidence",
    async (t, e, n) => br(F(), e, n)
  ), N.handle("kae:get-executive-briefing", async () => Lr(F())), N.handle(
    "kae:refresh-executive-briefing",
    async () => tt(F())
  ), N.handle("kae:load-active-vigsy-conversation", async () => {
    const t = await ru(F());
    return t && await ms(F(), t), t;
  }), N.handle("kae:save-vigsy-conversation", async (t, e) => {
    const n = await Hr(F(), e);
    return e.turns.length > 0 && (await Cu(F(), e), L == null || L.webContents.send("kae:executive-memory-updated"), L == null || L.webContents.send("kae:executive-briefing-updated"), L == null || L.webContents.send("kae:vigsy-refreshed")), n;
  }), N.handle("kae:create-vigsy-conversation", async () => {
    await Su(F());
    const t = await ou(F());
    return await ms(F(), t), t;
  }), N.handle("kae:delete-vigsy-conversation", async (t, e) => {
    await Eu(F(), e), await au(F(), e);
  }), N.handle("kae:get-executive-continuity", async () => ku(F())), N.handle("kae:open-repository-path", async () => {
    await Tt.openPath(F());
  }), N.handle("kae:open-repository-file", async (t, e) => {
    await Tt.openPath(pt(e));
  }), N.handle("kae:reveal-repository-file", async (t, e) => {
    Tt.showItemInFolder(pt(e));
  }), N.handle("kae:copy-text", async (t, e) => (ui.writeText(e), !0)), N.handle("kae:get-last-validation", () => ce), N.handle("kae:get-last-import-summary", () => ri), N.handle("kae:get-last-repair-plan", () => Wt), N.handle("kae:get-last-repair-result", () => Yt), N.handle("kae:select-zip-file", async () => {
    const t = await _n.showOpenDialog({
      title: "Select ChatGPT Export ZIP",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });
    return t.canceled ? null : t.filePaths[0] ?? null;
  }), N.handle("kae:analyze-repository-repair", async () => {
    j("info", "repair", "Repository repair analysis started (read-only)");
    const t = await Qo(F());
    return Wt = t, Yt = null, j("info", "repair", `Repair analysis complete: ${t.issues.length} issue(s), ${t.autoRepairCount} auto-repair action(s)`, {
      issueCount: t.issues.length,
      autoRepairCount: t.autoRepairCount,
      manualReviewCount: t.manualReviewCount
    }), t;
  }), N.handle("kae:execute-repository-repair", async (t, e) => {
    j("info", "repair", `Repository repair confirmed — ${e.autoRepairCount} safe action(s) will be applied`);
    const n = await ca(e, {
      log: (s, r, i) => j(s, "repair", r, i)
    });
    return Yt = n, Wt = e, j("info", "repair", `Repository repair complete: ${n.filesChanged.length} file(s) changed`, {
      snapshotPath: n.snapshotPath,
      duplicatesBefore: n.healthBefore.duplicateIds,
      duplicatesAfter: n.healthAfter.duplicateIds,
      ready: n.healthAfter.ready
    }), n;
  }), N.handle("kae:validate-chatgpt-zip", async (t, e) => {
    if (!e || !e.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return qd(e);
  }), N.handle("kae:cancel-validation", () => ge ? (ge.abort(), j("warn", "import", "Validation cancelled by user — repository unchanged"), oi({
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
  }), !0) : !1), N.handle("kae:import-chatgpt-zip", async (t, e) => {
    if (!e || !e.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Wd(e, "chatgpt-export-zip");
  }), N.handle("kae:get-connector-statuses", async () => (await te(), ae().getStatuses({
    repositoryPath: F(),
    log: (t, e) => j(t, "connector", e)
  }))), N.handle("kae:connect-connector", async (t, e, n) => (await te(), ae().connect(e, n, {
    repositoryPath: F(),
    log: (s, r) => j(s, "connector", r)
  }))), N.handle("kae:disconnect-connector", async (t, e) => (await te(), await ae().disconnect(e), !0)), N.handle("kae:update-connector-config", async (t, e, n) => (await te(), ae().updateConfig(e, n))), N.handle("kae:sync-connector", async (t, e, n) => {
    await te();
    const s = n ? {
      path: n,
      name: S.basename(n),
      extension: S.extname(n)
    } : null, r = await ae().syncNow(e, s, {
      repositoryPath: F(),
      log: (i, o) => j(i, "connector", o)
    });
    return r.briefingGeneratedAt && Ke(), r;
  }), N.handle("kae:get-connector-sync-history", async (t, e) => (await te(), ae().getSyncHistory(e))), N.handle("kae:get-connector-events", async (t, e) => (await te(), ae().getEvents(e))), N.handle("kae:select-folder", async () => {
    const t = await _n.showOpenDialog(L, {
      properties: ["openDirectory"]
    });
    return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
  });
}
$e.whenReady().then(async () => {
  ue.settings = Tn(await Kd()), await pe(), xs.handle("kae-asset", async (t) => {
    const e = zd(t.url), n = pt(e), s = await R.readFile(n), r = wn(s, S.basename(e));
    return new Response(s, { headers: { "Content-Type": r } });
  }), Vd(), await te(), Yd(), j("info", "system", `${Ps} started — ${Fs}`), Ds(), $e.on("activate", () => {
    nn.getAllWindows().length === 0 && Ds();
  });
});
$e.on("window-all-closed", () => {
  process.platform !== "darwin" && $e.quit();
});
export {
  Ne as B,
  Dd as C,
  Fd as D,
  Pd as H,
  pd as I,
  Ld as M,
  Nd as P,
  Od as T,
  _d as a,
  bd as b,
  qt as c,
  yd as d,
  Jr as e,
  vd as f,
  wd as g,
  qr as h,
  vt as i,
  Wr as p,
  Xr as r,
  bs as s,
  Qr as v
};
