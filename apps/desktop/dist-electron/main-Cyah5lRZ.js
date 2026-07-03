var Jr = Object.defineProperty;
var Xr = (e, t, n) => t in e ? Jr(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var _ = (e, t, n) => Xr(e, typeof t != "symbol" ? t + "" : t, n);
import { safeStorage as Xt, app as ke, protocol as Ss, BrowserWindow as Es, ipcMain as N, shell as bt, clipboard as Qr, dialog as Tn } from "electron";
import k from "node:fs/promises";
import S from "node:path";
import { fileURLToPath as ei } from "node:url";
import ti from "fs";
import Qt from "path";
import Cs from "zlib";
import ni from "crypto";
import { execFile as Rs } from "node:child_process";
import { promisify as ks } from "node:util";
import { randomUUID as W } from "node:crypto";
const bs = "KAE", As = "Knowledge Acquisition Engine";
function si(e) {
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
function ri(e) {
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
class Ts extends Error {
  constructor(t) {
    super(`${t} is not implemented yet (Phase 1 architecture only).`), this.name = "NotImplementedError";
  }
}
const xs = "C:\\Users\\alber\\Axiom-Knowledge", Ds = {
  theme: "dark",
  logLevel: "info",
  maxConcurrentJobs: 2,
  outputDirectory: "./output",
  aiProvider: "mock",
  aiStreaming: !0,
  aiTemperature: 0.2
}, ii = {
  path: xs,
  name: "Axiom Knowledge",
  autoSync: !1
};
function oi() {
  return {
    repository: { ...ii },
    settings: { ...Ds }
  };
}
function ai(e, t, n) {
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
class ci {
  constructor() {
    _(this, "jobs", []);
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
    const i = this.jobs.find((o) => o.id === t);
    i && (i.status = n, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), s !== void 0 && (i.progress = s), r !== void 0 && (i.error = r));
  }
  clear() {
    this.jobs = [];
  }
}
const $s = [
  "VIGS",
  "Founder OS",
  "Axiom",
  "Book",
  "Knowledge Recovery",
  "Source Material",
  "Technical Build",
  "Other / Review Needed"
], xn = 2, ui = 3, qt = {
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
function en(e) {
  var m, y, I, A;
  const t = di(e), n = fi(t), s = li(t, e, n), r = $s.filter((C) => C !== "Other / Review Needed").map((C) => ({ category: C, score: s[C] })).sort((C, b) => b.score - C.score), i = ((m = r[0]) == null ? void 0 : m.score) ?? 0, o = ((y = r[1]) == null ? void 0 : y.score) ?? 0;
  let c = r.filter((C) => C.score >= xn).map((C) => C.category), a = !1, d, u;
  i < ui || i === 0 ? (a = !0, d = "Other / Review Needed", c = c.length > 0 ? [...c, "Other / Review Needed"] : ["Other / Review Needed"], u = `Low classification confidence (top score ${i}). Routed to review.`) : i === o && i >= xn ? (a = !0, d = "Other / Review Needed", c = [.../* @__PURE__ */ new Set([...c, "Other / Review Needed"])], u = `Tied scores between "${(I = r[0]) == null ? void 0 : I.category}" and "${(A = r[1]) == null ? void 0 : A.category}". Routed to review.`) : (d = r[0].category, c.length === 0 && (c = [d]), u = `Primary match "${d}" (score ${i}) from title, content, and recurring terms.`);
  const l = e.metadata.messageCount;
  typeof l == "number" && l === 0 && (a = !0, d = "Other / Review Needed", c.includes("Other / Review Needed") || (c = [...c, "Other / Review Needed"]), u = "No extractable messages. Preserved for manual review.");
  const f = Math.min(100, Math.round(i / Math.max(i + o, 1) * 100));
  return {
    categories: [...new Set(c)],
    primaryCategory: d,
    confidence: a ? Math.min(f, 40) : f,
    inferredProject: pi(d, e.title, n),
    recurringTerms: n.slice(0, 12),
    uncertain: a,
    rationale: u,
    categoryScores: s
  };
}
function tn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    t.set(String(n.metadata.conversationId ?? n.id), en(n));
  return t;
}
function di(e) {
  const t = Array.isArray(e.metadata.fileReferences) ? e.metadata.fileReferences.filter((n) => typeof n == "string").join(" ") : "";
  return `${e.title} ${e.content} ${t}`.toLowerCase();
}
function li(e, t, n) {
  const s = Object.fromEntries($s.map((r) => [r, 0]));
  for (const [r, i] of Object.entries(qt))
    for (const o of i)
      e.includes(o) && (s[r] += o.includes(" ") ? 3 : 1);
  typeof t.metadata.pastedTranscriptCount == "number" && t.metadata.pastedTranscriptCount > 0 && (s["Source Material"] += 4);
  for (const r of n.slice(0, 5))
    for (const [i, o] of Object.entries(qt))
      o.some((c) => c.includes(r) || r.includes(c.split(" ")[0] ?? "")) && (s[i] += 1);
  return s["Other / Review Needed"] = 0, s;
}
function fi(e) {
  const t = e.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((s) => s.length >= 5), n = /* @__PURE__ */ new Map();
  for (const s of t)
    n.set(s, (n.get(s) ?? 0) + 1);
  return [...n.entries()].filter(([, s]) => s >= 2).sort((s, r) => r[1] - s[1]).map(([s]) => s);
}
function pi(e, t, n) {
  if (e !== "Other / Review Needed")
    return e;
  const s = t.toLowerCase();
  for (const [r, i] of Object.entries(qt))
    if (i.some((o) => s.includes(o)))
      return `${r} (uncertain)`;
  return n.length > 0 ? `Unlabeled — terms: ${n.slice(0, 3).join(", ")}` : "Unlabeled";
}
function te(e, t, n) {
  var s;
  (s = e.log) == null || s.call(e, "info", `[${t}] ${n}`);
}
function nn(e, t) {
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
function sn(e, t, n) {
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
function rn(e, t, n, s) {
  const r = tn(n);
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
async function on(e, t, n) {
  const s = (l, f) => {
    var m;
    (m = n.onProgress) == null || m.call(n, l, f);
  }, r = () => {
    var l;
    if ((l = n.signal) != null && l.aborted)
      throw new Error("Operation cancelled.");
  };
  r(), s("discover", 5), te(n, "discover", `Discovering source: ${t.name}`);
  const i = await e.discover(t);
  r(), s("extract", 20), te(n, "extract", "Extracting raw content");
  const o = await e.extract(i);
  r(), s("normalize", 40), te(n, "normalize", "Normalizing documents");
  const c = await e.normalize(o);
  s("validate", 55), te(n, "validate", `Validated ${c.length} document(s)`), s("classify", 70), te(n, "classify", "Classifying knowledge items"), s("provenance", 80);
  const a = nn(e.id, c), d = sn(e.id, t, a);
  te(n, "provenance", `Generated ${d.length} provenance record(s)`), s("source-record", 90), te(n, "source-record", `Prepared ${a.length} source record(s)`), s("emit", 100);
  const u = rn(e, t, a, d);
  return te(n, "emit", "Import package ready"), u;
}
const mi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  emitImportPackage: rn,
  generateProvenance: sn,
  generateSourceRecords: nn,
  runConnectorPipeline: on
}, Symbol.toStringTag, { value: "Module" }));
class hi {
  constructor() {
    _(this, "plugins", /* @__PURE__ */ new Map());
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
const gi = new hi();
class yi {
  async export(t, n, s) {
    throw new Ts(`Exporter "${this.name}"`);
  }
}
function wi(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var ce = { exports: {} }, At, Dn;
function _s() {
  return Dn || (Dn = 1, At = {
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
  }), At;
}
var Tt = {}, $n;
function an() {
  return $n || ($n = 1, (function(e) {
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
        return r.length && (s = s.replace(/\{(\d)\}/g, (i, o) => r[o] || "")), new Error("ADM-ZIP: " + s);
      };
    }
    for (const s of Object.keys(t))
      e[s] = n(t[s]);
  })(Tt)), Tt;
}
var xt, _n;
function vi() {
  if (_n) return xt;
  _n = 1;
  const e = ti, t = Qt, n = _s(), s = an(), r = typeof process == "object" && process.platform === "win32", i = (a) => typeof a == "object" && a !== null, o = new Uint32Array(256).map((a, d) => {
    for (let u = 0; u < 8; u++)
      (d & 1) !== 0 ? d = 3988292384 ^ d >>> 1 : d >>>= 1;
    return d >>> 0;
  });
  function c(a) {
    this.sep = t.sep, this.fs = e, i(a) && i(a.fs) && typeof a.fs.statSync == "function" && (this.fs = a.fs);
  }
  return xt = c, c.prototype.makeDir = function(a) {
    const d = this;
    function u(l) {
      let f = l.split(d.sep)[0];
      l.split(d.sep).forEach(function(m) {
        if (!(!m || m.substr(-1, 1) === ":")) {
          f += d.sep + m;
          var y;
          try {
            y = d.fs.statSync(f);
          } catch (I) {
            if (I.message && I.message.startsWith("ENOENT"))
              d.fs.mkdirSync(f);
            else
              throw I;
          }
          if (y && y.isFile()) throw s.FILE_IN_THE_WAY(`"${f}"`);
        }
      });
    }
    u(a);
  }, c.prototype.writeFileTo = function(a, d, u, l) {
    const f = this;
    if (f.fs.existsSync(a)) {
      if (!u) return !1;
      var m = f.fs.statSync(a);
      if (m.isDirectory())
        return !1;
    }
    var y = t.dirname(a);
    f.fs.existsSync(y) || f.makeDir(y);
    var I;
    try {
      I = f.fs.openSync(a, "w", 438);
    } catch {
      f.fs.chmodSync(a, 438), I = f.fs.openSync(a, "w", 438);
    }
    if (I)
      try {
        f.fs.writeSync(I, d, 0, d.length, 0);
      } finally {
        f.fs.closeSync(I);
      }
    return f.fs.chmodSync(a, l || 438), !0;
  }, c.prototype.writeFileToAsync = function(a, d, u, l, f) {
    typeof l == "function" && (f = l, l = void 0);
    const m = this;
    m.fs.exists(a, function(y) {
      if (y && !u) return f(!1);
      m.fs.stat(a, function(I, A) {
        if (y && A.isDirectory())
          return f(!1);
        var C = t.dirname(a);
        m.fs.exists(C, function(b) {
          b || m.makeDir(C), m.fs.open(a, "w", 438, function(x, h) {
            x ? m.fs.chmod(a, 438, function() {
              m.fs.open(a, "w", 438, function(p, v) {
                m.fs.write(v, d, 0, d.length, 0, function() {
                  m.fs.close(v, function() {
                    m.fs.chmod(a, l || 438, function() {
                      f(!0);
                    });
                  });
                });
              });
            }) : h ? m.fs.write(h, d, 0, d.length, 0, function() {
              m.fs.close(h, function() {
                m.fs.chmod(a, l || 438, function() {
                  f(!0);
                });
              });
            }) : m.fs.chmod(a, l || 438, function() {
              f(!0);
            });
          });
        });
      });
    });
  }, c.prototype.findFiles = function(a) {
    const d = this;
    function u(l, f, m) {
      let y = [];
      return d.fs.readdirSync(l).forEach(function(I) {
        const A = t.join(l, I), C = d.fs.statSync(A);
        y.push(t.normalize(A) + (C.isDirectory() ? d.sep : "")), C.isDirectory() && m && (y = y.concat(u(A, f, m)));
      }), y;
    }
    return u(a, void 0, !0);
  }, c.prototype.findFilesAsync = function(a, d) {
    const u = this;
    let l = [];
    u.fs.readdir(a, function(f, m) {
      if (f) return d(f);
      let y = m.length;
      if (!y) return d(null, l);
      m.forEach(function(I) {
        I = t.join(a, I), u.fs.stat(I, function(A, C) {
          if (A) return d(A);
          C && (l.push(t.normalize(I) + (C.isDirectory() ? u.sep : "")), C.isDirectory() ? u.findFilesAsync(I, function(b, x) {
            if (b) return d(b);
            l = l.concat(x), --y || d(null, l);
          }) : --y || d(null, l));
        });
      });
    });
  }, c.prototype.getAttributes = function() {
  }, c.prototype.setAttributes = function() {
  }, c.crc32update = function(a, d) {
    return o[(a ^ d) & 255] ^ a >>> 8;
  }, c.crc32 = function(a) {
    typeof a == "string" && (a = Buffer.from(a, "utf8"));
    let d = a.length, u = -1;
    for (let l = 0; l < d; ) u = c.crc32update(u, a[l++]);
    return ~u >>> 0;
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
    const d = t.posix.normalize("/" + a.split("\\").join("/"));
    return t.join(".", d);
  }, c.zipnamefix = function(a) {
    if (!a) return "";
    const d = t.posix.normalize("/" + a.split("\\").join("/"));
    return t.posix.join(".", d);
  }, c.findLast = function(a, d) {
    if (!Array.isArray(a)) throw new TypeError("arr is not array");
    const u = a.length >>> 0;
    for (let l = u - 1; l >= 0; l--)
      if (d(a[l], l, a))
        return a[l];
  }, c.sanitize = function(a, d) {
    a = t.resolve(t.normalize(a));
    for (var u = d.split("/"), l = 0, f = u.length; l < f; l++) {
      var m = t.normalize(t.join(a, u.slice(l, f).join(t.sep)));
      if (m === a || m.startsWith(a + t.sep))
        return m;
    }
    return t.normalize(t.join(a, t.basename(d)));
  }, c.toBuffer = function(d, u) {
    return Buffer.isBuffer(d) ? d : d instanceof Uint8Array ? Buffer.from(d) : typeof d == "string" ? u(d) : Buffer.alloc(0);
  }, c.readBigUInt64LE = function(a, d) {
    const u = a.readUInt32LE(d);
    return a.readUInt32LE(d + 4) * 4294967296 + u;
  }, c.writeBigUInt64LE = function(a, d, u) {
    const l = d >>> 0, f = Math.floor(d / 4294967296) >>> 0;
    a.writeUInt32LE(l, u), a.writeUInt32LE(f, u + 4);
  }, c.fromDOS2Date = function(a) {
    return new Date((a >> 25 & 127) + 1980, Math.max((a >> 21 & 15) - 1, 0), Math.max(a >> 16 & 31, 1), a >> 11 & 31, a >> 5 & 63, (a & 31) << 1);
  }, c.fromDate2DOS = function(a) {
    let d = 0, u = 0;
    return a.getFullYear() > 1979 && (d = (a.getFullYear() - 1980 & 127) << 9 | a.getMonth() + 1 << 5 | a.getDate(), u = a.getHours() << 11 | a.getMinutes() << 5 | a.getSeconds() >> 1), d << 16 | u;
  }, c.isWin = r, c.crcTable = o, xt;
}
var Dt, Nn;
function Ii() {
  if (Nn) return Dt;
  Nn = 1;
  const e = Qt;
  return Dt = function(t, { fs: n }) {
    var s = t || "", r = o(), i = null;
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
  }, Dt;
}
var $t, Ln;
function Si() {
  return Ln || (Ln = 1, $t = {
    efs: !0,
    encode: (e) => Buffer.from(e, "utf8"),
    decode: (e) => e.toString("utf8")
  }), $t;
}
var Pn;
function We() {
  return Pn || (Pn = 1, ce.exports = vi(), ce.exports.Constants = _s(), ce.exports.Errors = an(), ce.exports.FileAttr = Ii(), ce.exports.decoder = Si()), ce.exports;
}
var rt = {}, _t, Fn;
function Ei() {
  if (Fn) return _t;
  Fn = 1;
  var e = We(), t = e.Constants;
  return _t = function() {
    var n = 20, s = 10, r = 0, i = 0, o = 0, c = 0, a = 0, d = 0, u = 0, l = 0, f = 0, m = 0, y = 0, I = 0, A = 0;
    n |= e.isWin ? 2560 : 768, r |= t.FLG_EFS;
    const C = {
      extraLen: 0
    }, b = (h) => Math.max(0, h) >>> 0, x = (h) => Math.max(0, h) & 255;
    return o = e.fromDate2DOS(/* @__PURE__ */ new Date()), {
      get made() {
        return n;
      },
      set made(h) {
        n = h;
      },
      get version() {
        return s;
      },
      set version(h) {
        s = h;
      },
      get flags() {
        return r;
      },
      set flags(h) {
        r = h;
      },
      get flags_efs() {
        return (r & t.FLG_EFS) > 0;
      },
      set flags_efs(h) {
        h ? r |= t.FLG_EFS : r &= ~t.FLG_EFS;
      },
      get flags_desc() {
        return (r & t.FLG_DESC) > 0;
      },
      set flags_desc(h) {
        h ? r |= t.FLG_DESC : r &= ~t.FLG_DESC;
      },
      get method() {
        return i;
      },
      set method(h) {
        switch (h) {
          case t.STORED:
            this.version = 10;
            break;
          case t.DEFLATED:
          default:
            this.version = 20;
        }
        i = h;
      },
      get time() {
        return e.fromDOS2Date(this.timeval);
      },
      set time(h) {
        h = new Date(h), this.timeval = e.fromDate2DOS(h);
      },
      get timeval() {
        return o;
      },
      set timeval(h) {
        o = b(h);
      },
      get timeHighByte() {
        return x(o >>> 8);
      },
      get crc() {
        return c;
      },
      set crc(h) {
        c = b(h);
      },
      get compressedSize() {
        return a;
      },
      set compressedSize(h) {
        a = b(h);
      },
      get size() {
        return d;
      },
      set size(h) {
        d = b(h);
      },
      get fileNameLength() {
        return u;
      },
      set fileNameLength(h) {
        u = h;
      },
      get extraLength() {
        return l;
      },
      set extraLength(h) {
        l = h;
      },
      get extraLocalLength() {
        return C.extraLen;
      },
      set extraLocalLength(h) {
        C.extraLen = h;
      },
      get commentLength() {
        return f;
      },
      set commentLength(h) {
        f = h;
      },
      get diskNumStart() {
        return m;
      },
      set diskNumStart(h) {
        m = b(h);
      },
      get inAttr() {
        return y;
      },
      set inAttr(h) {
        y = b(h);
      },
      get attr() {
        return I;
      },
      set attr(h) {
        I = b(h);
      },
      // get Unix file permissions
      get fileAttr() {
        return (I || 0) >> 16 & 4095;
      },
      get offset() {
        return A;
      },
      set offset(h) {
        A = b(h);
      },
      get encrypted() {
        return (r & t.FLG_ENC) === t.FLG_ENC;
      },
      get centralHeaderSize() {
        return t.CENHDR + u + l + f;
      },
      get realDataOffset() {
        return A + t.LOCHDR + C.fnameLen + C.extraLen;
      },
      get localHeader() {
        return C;
      },
      loadLocalHeaderFromBinary: function(h) {
        var p = h.slice(A, A + t.LOCHDR);
        if (p.readUInt32LE(0) !== t.LOCSIG)
          throw e.Errors.INVALID_LOC();
        C.version = p.readUInt16LE(t.LOCVER), C.flags = p.readUInt16LE(t.LOCFLG), C.flags_desc = (C.flags & t.FLG_DESC) > 0, C.method = p.readUInt16LE(t.LOCHOW), C.time = p.readUInt32LE(t.LOCTIM), C.crc = p.readUInt32LE(t.LOCCRC), C.compressedSize = p.readUInt32LE(t.LOCSIZ), C.size = p.readUInt32LE(t.LOCLEN), C.fnameLen = p.readUInt16LE(t.LOCNAM), C.extraLen = p.readUInt16LE(t.LOCEXT);
        const v = A + t.LOCHDR + C.fnameLen, g = v + C.extraLen;
        return h.slice(v, g);
      },
      loadFromBinary: function(h) {
        if (h.length !== t.CENHDR || h.readUInt32LE(0) !== t.CENSIG)
          throw e.Errors.INVALID_CEN();
        n = h.readUInt16LE(t.CENVEM), s = h.readUInt16LE(t.CENVER), r = h.readUInt16LE(t.CENFLG), i = h.readUInt16LE(t.CENHOW), o = h.readUInt32LE(t.CENTIM), c = h.readUInt32LE(t.CENCRC), a = h.readUInt32LE(t.CENSIZ), d = h.readUInt32LE(t.CENLEN), u = h.readUInt16LE(t.CENNAM), l = h.readUInt16LE(t.CENEXT), f = h.readUInt16LE(t.CENCOM), m = h.readUInt16LE(t.CENDSK), y = h.readUInt16LE(t.CENATT), I = h.readUInt32LE(t.CENATX), A = h.readUInt32LE(t.CENOFF);
      },
      localHeaderToBinary: function() {
        var h = Buffer.alloc(t.LOCHDR);
        return h.writeUInt32LE(t.LOCSIG, 0), h.writeUInt16LE(s, t.LOCVER), h.writeUInt16LE(r & ~t.FLG_DESC, t.LOCFLG), h.writeUInt16LE(i, t.LOCHOW), h.writeUInt32LE(o, t.LOCTIM), h.writeUInt32LE(c, t.LOCCRC), h.writeUInt32LE(a, t.LOCSIZ), h.writeUInt32LE(d, t.LOCLEN), h.writeUInt16LE(u, t.LOCNAM), h.writeUInt16LE(C.extraLen, t.LOCEXT), h;
      },
      centralHeaderToBinary: function() {
        var h = Buffer.alloc(t.CENHDR + u + l + f);
        return h.writeUInt32LE(t.CENSIG, 0), h.writeUInt16LE(n, t.CENVEM), h.writeUInt16LE(s, t.CENVER), h.writeUInt16LE(r & ~t.FLG_DESC, t.CENFLG), h.writeUInt16LE(i, t.CENHOW), h.writeUInt32LE(o, t.CENTIM), h.writeUInt32LE(c, t.CENCRC), h.writeUInt32LE(a, t.CENSIZ), h.writeUInt32LE(d, t.CENLEN), h.writeUInt16LE(u, t.CENNAM), h.writeUInt16LE(l, t.CENEXT), h.writeUInt16LE(f, t.CENCOM), h.writeUInt16LE(m, t.CENDSK), h.writeUInt16LE(y, t.CENATT), h.writeUInt32LE(I, t.CENATX), h.writeUInt32LE(A, t.CENOFF), h;
      },
      toJSON: function() {
        const h = function(p) {
          return p + " bytes";
        };
        return {
          made: n,
          version: s,
          flags: r,
          method: e.methodToString(i),
          time: this.time,
          crc: "0x" + c.toString(16).toUpperCase(),
          compressedSize: h(a),
          size: h(d),
          fileNameLength: h(u),
          extraLength: h(l),
          commentLength: h(f),
          diskNumStart: m,
          inAttr: y,
          attr: I,
          offset: A,
          centralHeaderSize: h(t.CENHDR + u + l + f)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, _t;
}
var Nt, On;
function Ci() {
  if (On) return Nt;
  On = 1;
  var e = We(), t = e.Constants;
  return Nt = function() {
    var n = 0, s = 0, r = 0, i = 0, o = 0;
    const c = () => n > t.EF_ZIP64_OR_16 || s > t.EF_ZIP64_OR_16 || r > t.EF_ZIP64_OR_32 || i > t.EF_ZIP64_OR_32;
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
        return (c() ? t.ZIP64HDR + t.END64HDR : 0) + t.ENDHDR + o;
      },
      loadFromBinary: function(a) {
        if ((a.length !== t.ENDHDR || a.readUInt32LE(0) !== t.ENDSIG) && (a.length < t.ZIP64HDR || a.readUInt32LE(0) !== t.ZIP64SIG))
          throw e.Errors.INVALID_END();
        a.readUInt32LE(0) === t.ENDSIG ? (n = a.readUInt16LE(t.ENDSUB), s = a.readUInt16LE(t.ENDTOT), r = a.readUInt32LE(t.ENDSIZ), i = a.readUInt32LE(t.ENDOFF), o = a.readUInt16LE(t.ENDCOM)) : (n = e.readBigUInt64LE(a, t.ZIP64SUB), s = e.readBigUInt64LE(a, t.ZIP64TOT), r = e.readBigUInt64LE(a, t.ZIP64SIZB), i = e.readBigUInt64LE(a, t.ZIP64OFF), o = 0);
      },
      toBinary: function() {
        if (!c()) {
          var a = Buffer.alloc(t.ENDHDR + o);
          return a.writeUInt32LE(t.ENDSIG, 0), a.writeUInt32LE(0, 4), a.writeUInt16LE(n, t.ENDSUB), a.writeUInt16LE(s, t.ENDTOT), a.writeUInt32LE(r, t.ENDSIZ), a.writeUInt32LE(i, t.ENDOFF), a.writeUInt16LE(o, t.ENDCOM), a.fill(" ", t.ENDHDR), a;
        }
        var a = Buffer.alloc(this.mainHeaderSize);
        let d = 0;
        a.writeUInt32LE(t.ZIP64SIG, d), e.writeBigUInt64LE(a, t.ZIP64HDR - t.ZIP64LEAD, d + t.ZIP64SIZE), a.writeUInt16LE(45, d + t.ZIP64VEM), a.writeUInt16LE(45, d + t.ZIP64VER), a.writeUInt32LE(0, d + t.ZIP64DSK), a.writeUInt32LE(0, d + t.ZIP64DSKDIR), e.writeBigUInt64LE(a, n, d + t.ZIP64SUB), e.writeBigUInt64LE(a, s, d + t.ZIP64TOT), e.writeBigUInt64LE(a, r, d + t.ZIP64SIZB), e.writeBigUInt64LE(a, i, d + t.ZIP64OFF);
        const u = i + r;
        return d += t.ZIP64HDR, a.writeUInt32LE(t.END64SIG, d), a.writeUInt32LE(0, d + t.END64START), e.writeBigUInt64LE(a, u, d + t.END64OFF), a.writeUInt32LE(1, d + t.END64NUMDISKS), d += t.END64HDR, a.writeUInt32LE(t.ENDSIG, d), a.writeUInt32LE(0, d + 4), a.writeUInt16LE(Math.min(n, t.EF_ZIP64_OR_16), d + t.ENDSUB), a.writeUInt16LE(Math.min(s, t.EF_ZIP64_OR_16), d + t.ENDTOT), a.writeUInt32LE(Math.min(r, t.EF_ZIP64_OR_32), d + t.ENDSIZ), a.writeUInt32LE(Math.min(i, t.EF_ZIP64_OR_32), d + t.ENDOFF), a.writeUInt16LE(o, d + t.ENDCOM), a.fill(" ", d + t.ENDHDR), a;
      },
      toJSON: function() {
        const a = function(d, u) {
          let l = d.toString(16).toUpperCase();
          for (; l.length < u; ) l = "0" + l;
          return "0x" + l;
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
  }, Nt;
}
var Un;
function Ns() {
  return Un || (Un = 1, rt.EntryHeader = Ei(), rt.MainHeader = Ci()), rt;
}
var Fe = {}, Lt, Mn;
function Ri() {
  return Mn || (Mn = 1, Lt = function(e) {
    var t = Cs, n = { chunkSize: (parseInt(e.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return t.deflateRawSync(e, n);
      },
      deflateAsync: function(s) {
        var r = t.createDeflateRaw(n), i = [], o = 0;
        r.on("data", function(c) {
          i.push(c), o += c.length;
        }), r.on("end", function() {
          var c = Buffer.alloc(o), a = 0;
          c.fill(0);
          for (var d = 0; d < i.length; d++) {
            var u = i[d];
            u.copy(c, a), a += u.length;
          }
          s && s(c);
        }), r.end(e);
      }
    };
  }), Lt;
}
var Pt, jn;
function ki() {
  var t;
  if (jn) return Pt;
  jn = 1;
  const e = +(((t = process == null ? void 0 : process.versions) == null ? void 0 : t.node) ?? "").split(".")[0] || 0;
  return Pt = function(n, s) {
    var r = Cs;
    const i = e >= 15 && s > 0 ? { maxOutputLength: s } : {};
    return {
      inflate: function() {
        return r.inflateRawSync(n, i);
      },
      inflateAsync: function(o) {
        var c = r.createInflateRaw(i), a = [], d = 0;
        c.on("data", function(u) {
          a.push(u), d += u.length;
        }), c.on("end", function() {
          var u = Buffer.alloc(d), l = 0;
          u.fill(0);
          for (var f = 0; f < a.length; f++) {
            var m = a[f];
            m.copy(u, l), l += m.length;
          }
          o && o(u);
        }), c.end(n);
      }
    };
  }, Pt;
}
var Ft, Bn;
function bi() {
  if (Bn) return Ft;
  Bn = 1;
  const { randomFillSync: e } = ni, t = an(), n = new Uint32Array(256).map((m, y) => {
    for (let I = 0; I < 8; I++)
      (y & 1) !== 0 ? y = y >>> 1 ^ 3988292384 : y >>>= 1;
    return y >>> 0;
  }), s = (m, y) => Math.imul(m, y) >>> 0, r = (m, y) => n[(m ^ y) & 255] ^ m >>> 8, i = () => typeof e == "function" ? e(Buffer.alloc(12)) : i.node();
  i.node = () => {
    const m = Buffer.alloc(12), y = m.length;
    for (let I = 0; I < y; I++) m[I] = Math.random() * 256 & 255;
    return m;
  };
  const o = {
    genSalt: i
  };
  function c(m) {
    const y = Buffer.isBuffer(m) ? m : Buffer.from(m);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let I = 0; I < y.length; I++)
      this.updateKeys(y[I]);
  }
  c.prototype.updateKeys = function(m) {
    const y = this.keys;
    return y[0] = r(y[0], m), y[1] += y[0] & 255, y[1] = s(y[1], 134775813) + 1, y[2] = r(y[2], y[1] >>> 24), m;
  }, c.prototype.next = function() {
    const m = (this.keys[2] | 2) >>> 0;
    return s(m, m ^ 1) >> 8 & 255;
  };
  function a(m) {
    const y = new c(m);
    return function(I) {
      const A = Buffer.alloc(I.length);
      let C = 0;
      for (let b of I)
        A[C++] = y.updateKeys(b ^ y.next());
      return A;
    };
  }
  function d(m) {
    const y = new c(m);
    return function(I, A, C = 0) {
      A || (A = Buffer.alloc(I.length));
      for (let b of I) {
        const x = y.next();
        A[C++] = b ^ x, y.updateKeys(b);
      }
      return A;
    };
  }
  function u(m, y, I) {
    if (!m || !Buffer.isBuffer(m) || m.length < 12)
      return Buffer.alloc(0);
    const A = a(I), C = A(m.slice(0, 12)), b = (y.flags & 8) === 8 ? y.timeHighByte : y.crc >>> 24;
    if (C[11] !== b)
      throw t.WRONG_PASSWORD();
    return A(m.slice(12));
  }
  function l(m) {
    Buffer.isBuffer(m) && m.length >= 12 ? o.genSalt = function() {
      return m.slice(0, 12);
    } : m === "node" ? o.genSalt = i.node : o.genSalt = i;
  }
  function f(m, y, I, A = !1) {
    m == null && (m = Buffer.alloc(0)), Buffer.isBuffer(m) || (m = Buffer.from(m.toString()));
    const C = d(I), b = o.genSalt();
    b[11] = y.crc >>> 24 & 255, A && (b[10] = y.crc >>> 16 & 255);
    const x = Buffer.alloc(m.length + 12);
    return C(b, x), C(m, x, 12);
  }
  return Ft = { decrypt: u, encrypt: f, _salter: l }, Ft;
}
var Kn;
function Ai() {
  return Kn || (Kn = 1, Fe.Deflater = Ri(), Fe.Inflater = ki(), Fe.ZipCrypto = bi()), Fe;
}
var Ot, Gn;
function Ls() {
  if (Gn) return Ot;
  Gn = 1;
  var e = We(), t = Ns(), n = e.Constants, s = Ai();
  return Ot = function(r, i) {
    var o = new t.EntryHeader(), c = Buffer.alloc(0), a = Buffer.alloc(0), d = !1, u = null, l = Buffer.alloc(0), f = Buffer.alloc(0), m = !0;
    const y = r, I = typeof y.decoder == "object" ? y.decoder : e.decoder;
    m = I.hasOwnProperty("efs") ? I.efs : !1;
    function A() {
      return !i || !(i instanceof Uint8Array) ? Buffer.alloc(0) : (f = o.loadLocalHeaderFromBinary(i), i.slice(o.realDataOffset, o.realDataOffset + o.compressedSize));
    }
    function C(g) {
      if (!o.flags_desc && !o.localHeader.flags_desc) {
        if (e.crc32(g) !== o.localHeader.crc)
          return !1;
      } else {
        const w = {}, E = o.realDataOffset + o.compressedSize;
        if (i.readUInt32LE(E) == n.LOCSIG || i.readUInt32LE(E) == n.CENSIG)
          throw e.Errors.DESCRIPTOR_NOT_EXIST();
        if (i.readUInt32LE(E) == n.EXTSIG)
          w.crc = i.readUInt32LE(E + n.EXTCRC), w.compressedSize = i.readUInt32LE(E + n.EXTSIZ), w.size = i.readUInt32LE(E + n.EXTLEN);
        else if (i.readUInt16LE(E + 12) === 19280)
          w.crc = i.readUInt32LE(E + n.EXTCRC - 4), w.compressedSize = i.readUInt32LE(E + n.EXTSIZ - 4), w.size = i.readUInt32LE(E + n.EXTLEN - 4);
        else
          throw e.Errors.DESCRIPTOR_UNKNOWN();
        if (w.compressedSize !== o.compressedSize || w.size !== o.size || w.crc !== o.crc)
          throw e.Errors.DESCRIPTOR_FAULTY();
        if (e.crc32(g) !== w.crc)
          return !1;
      }
      return !0;
    }
    function b(g, w, E) {
      if (typeof w > "u" && typeof g == "string" && (E = g, g = void 0), d)
        return g && w && w(Buffer.alloc(0), e.Errors.DIRECTORY_CONTENT_ERROR()), Buffer.alloc(0);
      var R = A();
      if (R.length === 0)
        return g && w && w(R), R;
      if (o.encrypted) {
        if (typeof E != "string" && !Buffer.isBuffer(E))
          throw e.Errors.INVALID_PASS_PARAM();
        R = s.ZipCrypto.decrypt(R, o, E);
      }
      var T = Buffer.alloc(o.size);
      switch (o.method) {
        case e.Constants.STORED:
          if (R.copy(T), C(T))
            return g && w && w(T), T;
          throw g && w && w(T, e.Errors.BAD_CRC()), e.Errors.BAD_CRC();
        case e.Constants.DEFLATED:
          var U = new s.Inflater(R, o.size);
          if (g)
            U.inflateAsync(function(D) {
              D.copy(D, 0), w && (C(D) ? w(D) : w(D, e.Errors.BAD_CRC()));
            });
          else {
            if (U.inflate(T).copy(T, 0), !C(T))
              throw e.Errors.BAD_CRC(`"${I.decode(c)}"`);
            return T;
          }
          break;
        default:
          throw g && w && w(Buffer.alloc(0), e.Errors.UNKNOWN_METHOD()), e.Errors.UNKNOWN_METHOD();
      }
    }
    function x(g, w) {
      if ((!u || !u.length) && Buffer.isBuffer(i))
        return g && w && w(A()), A();
      if (u.length && !d) {
        var E;
        switch (o.method) {
          case e.Constants.STORED:
            return o.compressedSize = o.size, E = Buffer.alloc(u.length), u.copy(E), g && w && w(E), E;
          default:
          case e.Constants.DEFLATED:
            var R = new s.Deflater(u);
            if (g)
              R.deflateAsync(function(U) {
                E = Buffer.alloc(U.length), o.compressedSize = U.length, U.copy(E), w && w(E);
              });
            else {
              var T = R.deflate();
              return o.compressedSize = T.length, T;
            }
            R = null;
            break;
        }
      } else if (g && w)
        w(Buffer.alloc(0));
      else
        return Buffer.alloc(0);
    }
    function h(g, w) {
      return e.readBigUInt64LE(g, w);
    }
    function p(g) {
      try {
        for (var w = 0, E, R, T; w + 4 < g.length; )
          E = g.readUInt16LE(w), w += 2, R = g.readUInt16LE(w), w += 2, T = g.slice(w, w + R), w += R, n.ID_ZIP64 === E && v(T);
      } catch {
        throw e.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function v(g) {
      var w, E, R, T;
      g.length >= n.EF_ZIP64_SCOMP && (w = h(g, n.EF_ZIP64_SUNCOMP), o.size === n.EF_ZIP64_OR_32 && (o.size = w)), g.length >= n.EF_ZIP64_RHO && (E = h(g, n.EF_ZIP64_SCOMP), o.compressedSize === n.EF_ZIP64_OR_32 && (o.compressedSize = E)), g.length >= n.EF_ZIP64_DSN && (R = h(g, n.EF_ZIP64_RHO), o.offset === n.EF_ZIP64_OR_32 && (o.offset = R)), g.length >= n.EF_ZIP64_DSN + 4 && (T = g.readUInt32LE(n.EF_ZIP64_DSN), o.diskNumStart === n.EF_ZIP64_OR_16 && (o.diskNumStart = T));
    }
    return {
      get entryName() {
        return I.decode(c);
      },
      get rawEntryName() {
        return c;
      },
      set entryName(g) {
        c = e.toBuffer(g, I.encode);
        var w = c[c.length - 1];
        d = w === 47 || w === 92, o.fileNameLength = c.length;
      },
      get efs() {
        return typeof m == "function" ? m(this.entryName) : m;
      },
      get extra() {
        return l;
      },
      set extra(g) {
        l = g, o.extraLength = g.length, p(g);
      },
      get comment() {
        return I.decode(a);
      },
      set comment(g) {
        if (a = e.toBuffer(g, I.encode), o.commentLength = a.length, a.length > 65535) throw e.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var g = I.decode(c);
        return d ? g.substr(g.length - 1).split("/").pop() : g.split("/").pop();
      },
      get isDirectory() {
        return d;
      },
      getCompressedData: function() {
        return x(!1, null);
      },
      getCompressedDataAsync: function(g) {
        x(!0, g);
      },
      setData: function(g) {
        u = e.toBuffer(g, e.decoder.encode), !d && u.length ? (o.size = u.length, o.method = e.Constants.DEFLATED, o.crc = e.crc32(g), o.changed = !0) : o.method = e.Constants.STORED;
      },
      getData: function(g) {
        return o.changed ? u : b(!1, null, g);
      },
      getDataAsync: function(g, w) {
        o.changed ? g(u) : b(!0, g, w);
      },
      set attr(g) {
        o.attr = g;
      },
      get attr() {
        return o.attr;
      },
      set header(g) {
        o.loadFromBinary(g);
      },
      get header() {
        return o;
      },
      packCentralHeader: function() {
        o.flags_efs = this.efs, o.extraLength = l.length;
        var g = o.centralHeaderToBinary(), w = e.Constants.CENHDR;
        return c.copy(g, w), w += c.length, l.copy(g, w), w += o.extraLength, a.copy(g, w), g;
      },
      packLocalHeader: function() {
        let g = 0;
        o.flags_efs = this.efs, o.extraLocalLength = f.length;
        const w = o.localHeaderToBinary(), E = Buffer.alloc(w.length + c.length + o.extraLocalLength);
        return w.copy(E, g), g += w.length, c.copy(E, g), g += c.length, f.copy(E, g), g += f.length, E;
      },
      toJSON: function() {
        const g = function(w) {
          return "<" + (w && w.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: o.toJSON(),
          compressedData: g(i),
          data: g(u)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, Ot;
}
var Ut, zn;
function Ti() {
  if (zn) return Ut;
  zn = 1;
  const e = Ls(), t = Ns(), n = We();
  return Ut = function(s, r) {
    var i = [], o = {}, c = Buffer.alloc(0), a = new t.MainHeader(), d = !1;
    const u = /* @__PURE__ */ new Set(), l = r, { noSort: f, decoder: m } = l;
    s ? A(l.readEntries) : d = !0;
    function y() {
      const b = /* @__PURE__ */ new Set();
      for (const x of Object.keys(o)) {
        const h = x.split("/");
        if (h.pop(), !!h.length)
          for (let p = 0; p < h.length; p++) {
            const v = h.slice(0, p + 1).join("/") + "/";
            b.add(v);
          }
      }
      for (const x of b)
        if (!(x in o)) {
          const h = new e(l);
          h.entryName = x, h.attr = 16, h.temporary = !0, i.push(h), o[h.entryName] = h, u.add(h);
        }
    }
    function I() {
      if (d = !0, o = {}, a.diskEntries > (s.length - a.offset) / n.Constants.CENHDR)
        throw n.Errors.DISK_ENTRY_TOO_LARGE();
      i = new Array(a.diskEntries);
      for (var b = a.offset, x = 0; x < i.length; x++) {
        var h = b, p = new e(l, s);
        p.header = s.slice(h, h += n.Constants.CENHDR), p.entryName = s.slice(h, h += p.header.fileNameLength), p.header.extraLength && (p.extra = s.slice(h, h += p.header.extraLength)), p.header.commentLength && (p.comment = s.slice(h, h + p.header.commentLength)), b += p.header.centralHeaderSize, i[x] = p, o[p.entryName] = p;
      }
      u.clear(), y();
    }
    function A(b) {
      var x = s.length - n.Constants.ENDHDR, h = Math.max(0, x - 65535), p = h, v = s.length, g = -1, w = 0;
      for ((typeof l.trailingSpace == "boolean" ? l.trailingSpace : !1) && (h = 0), x; x >= p; x--)
        if (s[x] === 80) {
          if (s.readUInt32LE(x) === n.Constants.ENDSIG) {
            g = x, w = x, v = x + n.Constants.ENDHDR, p = x - n.Constants.END64HDR;
            continue;
          }
          if (s.readUInt32LE(x) === n.Constants.END64SIG) {
            p = h;
            continue;
          }
          if (s.readUInt32LE(x) === n.Constants.ZIP64SIG) {
            g = x, v = x + n.readBigUInt64LE(s, x + n.Constants.ZIP64SIZE) + n.Constants.ZIP64LEAD;
            break;
          }
        }
      if (g == -1) throw n.Errors.INVALID_FORMAT();
      a.loadFromBinary(s.slice(g, v)), a.commentLength && (c = s.slice(w + n.Constants.ENDHDR)), b && I();
    }
    function C() {
      i.length > 1 && !f && i.sort((b, x) => b.entryName.toLowerCase().localeCompare(x.entryName.toLowerCase()));
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        return d || I(), i.filter((b) => !u.has(b));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return m.decode(c);
      },
      set comment(b) {
        c = n.toBuffer(b, m.encode), a.commentLength = c.length;
      },
      getEntryCount: function() {
        return d ? i.length : a.diskEntries;
      },
      forEach: function(b) {
        this.entries.forEach(b);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(b) {
        return d || I(), o[b] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(b) {
        d || I(), i.push(b), o[b.entryName] = b, a.totalEntries = i.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(b, x = !0) {
        d || I();
        const h = o[b];
        this.getEntryChildren(h, x).map((v) => v.entryName).forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(b) {
        d || I();
        const x = o[b], h = i.indexOf(x);
        h >= 0 && (i.splice(h, 1), delete o[b], a.totalEntries = i.length);
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(b, x = !0) {
        if (d || I(), typeof b == "object")
          if (b.isDirectory && x) {
            const h = [], p = b.entryName;
            for (const v of i)
              v.entryName.startsWith(p) && h.push(v);
            return h;
          } else
            return [b];
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(b) {
        if (b && b.isDirectory) {
          const x = this.getEntryChildren(b);
          return x.includes(b) ? x.length - 1 : x.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        d || I(), C();
        const b = [], x = [];
        let h = 0, p = 0;
        a.size = 0, a.offset = 0;
        let v = 0;
        for (const E of this.entries) {
          const R = E.getCompressedData();
          E.header.offset = p;
          const T = E.packLocalHeader(), U = T.length + R.length;
          p += U, b.push(T), b.push(R);
          const D = E.packCentralHeader();
          x.push(D), a.size += D.length, h += U + D.length, v++;
        }
        h += a.mainHeaderSize, a.offset = p, a.totalEntries = v, p = 0;
        const g = Buffer.alloc(h);
        for (const E of b)
          E.copy(g, p), p += E.length;
        for (const E of x)
          E.copy(g, p), p += E.length;
        const w = a.toBinary();
        return c && c.copy(w, w.length - c.length), w.copy(g, p), s = g, d = !1, g;
      },
      toAsyncBuffer: function(b, x, h, p) {
        try {
          d || I(), C();
          const v = [], g = [];
          let w = 0, E = 0, R = 0;
          a.size = 0, a.offset = 0;
          const T = function(U) {
            if (U.length > 0) {
              const D = U.shift(), $ = D.entryName + D.extra.toString();
              h && h($), D.getCompressedDataAsync(function(O) {
                p && p($), D.header.offset = E;
                const M = D.packLocalHeader(), K = M.length + O.length;
                E += K, v.push(M), v.push(O);
                const G = D.packCentralHeader();
                g.push(G), a.size += G.length, w += K + G.length, R++, T(U);
              });
            } else {
              w += a.mainHeaderSize, a.offset = E, a.totalEntries = R, E = 0;
              const D = Buffer.alloc(w);
              v.forEach(function(O) {
                O.copy(D, E), E += O.length;
              }), g.forEach(function(O) {
                O.copy(D, E), E += O.length;
              });
              const $ = a.toBinary();
              c && c.copy($, $.length - c.length), $.copy(D, E), s = D, d = !1, b(D);
            }
          };
          T(Array.from(this.entries));
        } catch (v) {
          x(v);
        }
      }
    };
  }, Ut;
}
var Mt, Hn;
function xi() {
  if (Hn) return Mt;
  Hn = 1;
  const e = We(), t = Qt, n = Ls(), s = Ti(), r = (...a) => e.findLast(a, (d) => typeof d == "boolean"), i = (...a) => e.findLast(a, (d) => typeof d == "string"), o = (...a) => e.findLast(a, (d) => typeof d == "function"), c = {
    // option "noSort" : if true it disables files sorting
    noSort: !1,
    // read entries during load (initial loading may be slower)
    readEntries: !1,
    // default method is none
    method: e.Constants.NONE,
    // file system
    fs: null
  };
  return Mt = function(a, d) {
    let u = null;
    const l = Object.assign(/* @__PURE__ */ Object.create(null), c);
    a && typeof a == "object" && (a instanceof Uint8Array || (Object.assign(l, a), a = l.input ? l.input : void 0, l.input && delete l.input), Buffer.isBuffer(a) && (u = a, l.method = e.Constants.BUFFER, a = void 0)), Object.assign(l, d);
    const f = new e(l);
    if ((typeof l.decoder != "object" || typeof l.decoder.encode != "function" || typeof l.decoder.decode != "function") && (l.decoder = e.decoder), a && typeof a == "string")
      if (f.fs.existsSync(a))
        l.method = e.Constants.FILE, l.filename = a, u = f.fs.readFileSync(a);
      else
        throw e.Errors.INVALID_FILENAME();
    const m = new s(u, l), { canonical: y, sanitize: I, zipnamefix: A } = e;
    function C(p) {
      if (p && m) {
        var v;
        if (typeof p == "string" && (v = m.getEntry(t.posix.normalize(p))), typeof p == "object" && typeof p.entryName < "u" && typeof p.header < "u" && (v = m.getEntry(p.entryName)), v)
          return v;
      }
      return null;
    }
    function b(p) {
      const { join: v, normalize: g, sep: w } = t.posix;
      return v(t.isAbsolute(p) ? "/" : ".", g(w + p.split("\\").join(w) + w));
    }
    function x(p) {
      return p instanceof RegExp ? /* @__PURE__ */ (function(v) {
        return function(g) {
          return v.test(g);
        };
      })(p) : typeof p != "function" ? () => !0 : p;
    }
    const h = (p, v) => {
      let g = v.slice(-1);
      return g = g === f.sep ? f.sep : "", t.relative(p, v) + g;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(p, v) {
        var g = C(p);
        return g && g.getData(v) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(p) {
        const v = C(p);
        if (v)
          return m.getChildCount(v);
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(p, v) {
        var g = C(p);
        g ? g.getDataAsync(v) : v(null, "getEntry failed for:" + p);
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(p, v) {
        var g = C(p);
        if (g) {
          var w = g.getData();
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
      readAsTextAsync: function(p, v, g) {
        var w = C(p);
        w ? w.getDataAsync(function(E, R) {
          if (R) {
            v(E, R);
            return;
          }
          E && E.length ? v(E.toString(g || "utf8")) : v("");
        }) : v("");
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(p, v = !0) {
        var g = C(p);
        g && m.deleteFile(g.entryName, v);
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(p) {
        var v = C(p);
        v && m.deleteEntry(v.entryName);
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(p) {
        m.comment = p;
      },
      /**
       * Returns the zip comment
       *
       * @return String
       */
      getZipComment: function() {
        return m.comment || "";
      },
      /**
       * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
       * The comment cannot exceed 65535 characters in length
       *
       * @param {ZipEntry} entry
       * @param {string} comment
       */
      addZipEntryComment: function(p, v) {
        var g = C(p);
        g && (g.comment = v);
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(p) {
        var v = C(p);
        return v && v.comment || "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(p, v) {
        var g = C(p);
        g && g.setData(v);
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(p, v, g, w) {
        if (f.fs.existsSync(p)) {
          v = v ? b(v) : "";
          const E = t.win32.basename(t.win32.normalize(p));
          v += g || E;
          const R = f.fs.statSync(p), T = R.isFile() ? f.fs.readFileSync(p) : Buffer.alloc(0);
          R.isDirectory() && (v += f.sep), this.addFile(v, T, w, R);
        } else
          throw e.Errors.FILE_NOT_FOUND(p);
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
      addLocalFileAsync: function(p, v) {
        p = typeof p == "object" ? p : { localPath: p };
        const g = t.resolve(p.localPath), { comment: w } = p;
        let { zipPath: E, zipName: R } = p;
        const T = this;
        f.fs.stat(g, function(U, D) {
          if (U) return v(U, !1);
          E = E ? b(E) : "";
          const $ = t.win32.basename(t.win32.normalize(g));
          if (E += R || $, D.isFile())
            f.fs.readFile(g, function(O, M) {
              return O ? v(O, !1) : (T.addFile(E, M, w, D), setImmediate(v, void 0, !0));
            });
          else if (D.isDirectory())
            return E += f.sep, T.addFile(E, Buffer.alloc(0), w, D), setImmediate(v, void 0, !0);
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(p, v, g) {
        if (g = x(g), v = v ? b(v) : "", p = t.normalize(p), f.fs.existsSync(p)) {
          const w = f.findFiles(p), E = this;
          if (w.length)
            for (const R of w) {
              const T = t.join(v, h(p, R));
              g(T) && E.addLocalFile(R, t.dirname(T));
            }
        } else
          throw e.Errors.FILE_NOT_FOUND(p);
      },
      /**
       * Asynchronous addLocalFolder
       * @param {string} localPath
       * @param {callback} callback
       * @param {string} [zipPath] optional path inside zip
       * @param {RegExp|function} [filter] optional RegExp or Function if files match will
       *               be included.
       */
      addLocalFolderAsync: function(p, v, g, w) {
        w = x(w), g = g ? b(g) : "", p = t.normalize(p);
        var E = this;
        f.fs.open(p, "r", function(R) {
          if (R && R.code === "ENOENT")
            v(void 0, e.Errors.FILE_NOT_FOUND(p));
          else if (R)
            v(void 0, R);
          else {
            var T = f.findFiles(p), U = -1, D = function() {
              if (U += 1, U < T.length) {
                var $ = T[U], O = h(p, $).split("\\").join("/");
                O = O.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""), w(O) ? f.fs.stat($, function(M, K) {
                  M && v(void 0, M), K.isFile() ? f.fs.readFile($, function(G, B) {
                    G ? v(void 0, G) : (E.addFile(g + O, B, "", K), D());
                  }) : (E.addFile(g + O + "/", Buffer.alloc(0), "", K), D());
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
      addLocalFolderAsync2: function(p, v) {
        const g = this;
        p = typeof p == "object" ? p : { localPath: p };
        const w = t.resolve(b(p.localPath));
        let { zipPath: E, filter: R, namefix: T } = p;
        R instanceof RegExp ? R = /* @__PURE__ */ (function($) {
          return function(O) {
            return $.test(O);
          };
        })(R) : typeof R != "function" && (R = function() {
          return !0;
        }), E = E ? b(E) : "", T === "latin1" && (T = ($) => $.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "")), typeof T != "function" && (T = ($) => $);
        const U = ($) => t.join(E, T(h(w, $))), D = ($) => t.win32.basename(t.win32.normalize(T($)));
        f.fs.open(w, "r", function($) {
          $ && $.code === "ENOENT" ? v(void 0, e.Errors.FILE_NOT_FOUND(w)) : $ ? v(void 0, $) : f.findFilesAsync(w, function(O, M) {
            if (O) return v(O);
            M = M.filter((K) => R(U(K))), M.length || v(void 0, !1), setImmediate(
              M.reverse().reduce(function(K, G) {
                return function(B, V) {
                  if (B || V === !1) return setImmediate(K, B, !1);
                  g.addLocalFileAsync(
                    {
                      localPath: G,
                      zipPath: t.dirname(U(G)),
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
      addLocalFolderPromise: function(p, v) {
        return new Promise((g, w) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: p }, v), (E, R) => {
            E && w(E), R && g(this);
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
      addFile: function(p, v, g, w) {
        p = A(p);
        let E = C(p);
        const R = E != null;
        R || (E = new n(l), E.entryName = p), E.comment = g || "";
        const T = typeof w == "object" && w instanceof f.fs.Stats;
        T && (E.header.time = w.mtime);
        var U = E.isDirectory ? 16 : 0;
        let D = E.isDirectory ? 16384 : 32768;
        return T ? D |= 4095 & w.mode : typeof w == "number" ? D |= 4095 & w : D |= E.isDirectory ? 493 : 420, U = (U | D << 16) >>> 0, E.attr = U, E.setData(v), R || m.setEntry(E), E;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(p) {
        return m.password = p, m ? m.entries : [];
      },
      /**
       * Returns a ZipEntry object representing the file or folder specified by ``name``.
       *
       * @param {string} name
       * @return ZipEntry
       */
      getEntry: function(p) {
        return C(p);
      },
      getEntryCount: function() {
        return m.getEntryCount();
      },
      forEach: function(p) {
        return m.forEach(p);
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
      extractEntryTo: function(p, v, g, w, E, R) {
        w = r(!1, w), E = r(!1, E), g = r(!0, g), R = i(E, R);
        var T = C(p);
        if (!T)
          throw e.Errors.NO_ENTRY();
        var U = y(T.entryName), D = I(v, R && !T.isDirectory ? y(R) : g ? U : t.basename(U));
        if (T.isDirectory) {
          var $ = m.getEntryChildren(T);
          return $.forEach(function(K) {
            if (K.isDirectory) return;
            var G = K.getData();
            if (!G)
              throw e.Errors.CANT_EXTRACT_FILE();
            var B = y(K.entryName), V = I(v, g ? B : t.basename(B));
            const J = E ? K.header.fileAttr : void 0;
            f.writeFileTo(V, G, w, J);
          }), !0;
        }
        var O = T.getData(m.password);
        if (!O) throw e.Errors.CANT_EXTRACT_FILE();
        if (f.fs.existsSync(D) && !w)
          throw e.Errors.CANT_OVERRIDE();
        const M = E ? p.header.fileAttr : void 0;
        return f.writeFileTo(D, O, w, M), !0;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(p) {
        if (!m)
          return !1;
        for (var v of m.entries)
          try {
            if (v.isDirectory)
              continue;
            var g = m.entries[v].getData(p);
            if (!g)
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
      extractAllTo: function(p, v, g, w) {
        if (g = r(!1, g), w = i(g, w), v = r(!1, v), !m) throw e.Errors.NO_ZIP();
        m.entries.forEach(function(E) {
          var R = I(p, y(E.entryName));
          if (E.isDirectory) {
            f.makeDir(R);
            return;
          }
          var T = E.getData(w);
          if (!T)
            throw e.Errors.CANT_EXTRACT_FILE();
          const U = g ? E.header.fileAttr : void 0;
          f.writeFileTo(R, T, v, U);
          try {
            f.fs.utimesSync(R, E.header.time, E.header.time);
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
      extractAllToAsync: function(p, v, g, w) {
        if (w = o(v, g, w), g = r(!1, g), v = r(!1, v), !w)
          return new Promise((D, $) => {
            this.extractAllToAsync(p, v, g, function(O) {
              O ? $(O) : D(this);
            });
          });
        if (!m) {
          w(e.Errors.NO_ZIP());
          return;
        }
        p = t.resolve(p);
        const E = (D) => I(p, t.normalize(y(D.entryName))), R = (D, $) => new Error(D + ': "' + $ + '"'), T = [], U = [];
        m.entries.forEach((D) => {
          D.isDirectory ? T.push(D) : U.push(D);
        });
        for (const D of T) {
          const $ = E(D), O = g ? D.header.fileAttr : void 0;
          try {
            f.makeDir($), O && f.fs.chmodSync($, O), f.fs.utimesSync($, D.header.time, D.header.time);
          } catch {
            w(R("Unable to create folder", $));
          }
        }
        U.reverse().reduce(function(D, $) {
          return function(O) {
            if (O)
              D(O);
            else {
              const M = t.normalize(y($.entryName)), K = I(p, M);
              $.getDataAsync(function(G, B) {
                if (B)
                  D(B);
                else if (!G)
                  D(e.Errors.CANT_EXTRACT_FILE());
                else {
                  const V = g ? $.header.fileAttr : void 0;
                  f.writeFileToAsync(K, G, v, V, function(J) {
                    J || D(R("Unable to write file", K)), f.fs.utimes(K, $.header.time, $.header.time, function(ye) {
                      ye ? D(R("Unable to set times", K)) : D();
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
      writeZip: function(p, v) {
        if (arguments.length === 1 && typeof p == "function" && (v = p, p = ""), !p && l.filename && (p = l.filename), !!p) {
          var g = m.compressToBuffer();
          if (g) {
            var w = f.writeFileTo(p, g, !0);
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
      writeZipPromise: function(p, v) {
        const { overwrite: g, perm: w } = Object.assign({ overwrite: !0 }, v);
        return new Promise((E, R) => {
          !p && l.filename && (p = l.filename), p || R("ADM-ZIP: ZIP File Name Missing"), this.toBufferPromise().then((T) => {
            const U = (D) => D ? E(D) : R("ADM-ZIP: Wasn't able to write zip file");
            f.writeFileToAsync(p, T, g, w, U);
          }, R);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((p, v) => {
          m.toAsyncBuffer(p, v);
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
      toBuffer: function(p, v, g, w) {
        return typeof p == "function" ? (m.toAsyncBuffer(p, v, g, w), null) : m.compressToBuffer();
      }
    };
  }, Mt;
}
var Di = xi();
const Ps = /* @__PURE__ */ wi(Di), $i = /KRC-(\d{4})/gi, _i = /## ChatGPT Conversation ID\s*\n([^\n]+)/, Ni = [
  "VIGS",
  "Founder_OS",
  "Axiom",
  "Book",
  "Knowledge_Recovery",
  "Source_Material",
  "Technical_Build",
  "Other_Review_Needed"
];
async function cn(e) {
  const t = [];
  let n;
  try {
    n = await k.readdir(e, { withFileTypes: !0 });
  } catch {
    return t;
  }
  for (const s of n) {
    const r = S.join(e, s.name);
    s.isDirectory() ? t.push(...await cn(r)) : s.name.endsWith(".md") && t.push(r);
  }
  return t;
}
async function wt(e) {
  let t = 0;
  const n = S.join(e, "Sources"), s = await cn(n);
  for (const i of s) {
    const c = S.basename(i).match(/KRC-(\d{4})/i);
    c && (t = Math.max(t, parseInt(c[1], 10)));
  }
  const r = S.join(e, "Registries", "SOURCE_REGISTRY.md");
  try {
    const i = await k.readFile(r, "utf8");
    for (const o of i.matchAll($i))
      t = Math.max(t, parseInt(o[1], 10));
  } catch {
  }
  return t;
}
function vt(e) {
  return `KRC-${String(e).padStart(4, "0")}`;
}
function Ye(e) {
  return e.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 80) || "Untitled";
}
async function un(e) {
  const t = /* @__PURE__ */ new Map(), n = S.join(e, "Sources"), s = await cn(n);
  for (const r of s) {
    const o = S.basename(r).match(/^(KRC-\d{4})/i);
    if (!o)
      continue;
    const a = (await k.readFile(r, "utf8")).match(_i);
    a && t.set(a[1].trim(), o[1].toUpperCase());
  }
  return t;
}
async function Fs(e) {
  await k.mkdir(S.join(e, "Sources"), { recursive: !0 }), await k.mkdir(S.join(e, "Uploads"), { recursive: !0 }), await k.mkdir(S.join(e, "Registries"), { recursive: !0 }), await k.mkdir(S.join(e, "ExecutiveSessions"), { recursive: !0 });
  for (const t of Ni)
    await k.mkdir(S.join(e, "Sources", t), { recursive: !0 }), await k.mkdir(S.join(e, "ExecutiveSessions", t), { recursive: !0 });
}
async function Zn(e, t, n) {
  await k.mkdir(S.dirname(e), { recursive: !0 });
  try {
    return await k.access(e), n ? (await k.writeFile(e, t, "utf8"), "updated") : "skipped";
  } catch {
    return await k.writeFile(e, t, "utf8"), "created";
  }
}
async function Li(e, t, n) {
  await k.mkdir(S.dirname(e), { recursive: !0 });
  try {
    return await k.access(e), n ? (await k.writeFile(e, t), "updated") : "skipped";
  } catch {
    return await k.writeFile(e, t), "created";
  }
}
function Pi(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Fi(e) {
  var c, a;
  const t = e.content.trim();
  if (!t)
    return "No extractable conversation content. Flagged for manual review.";
  const n = t.match(/### User\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), s = t.match(/### Assistant\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), r = ((c = n == null ? void 0 : n[1]) == null ? void 0 : c.trim().slice(0, 400)) ?? "", i = ((a = s == null ? void 0 : s[1]) == null ? void 0 : a.trim().slice(0, 400)) ?? "", o = [];
  return r && o.push(`**User focus:** ${r}${r.length >= 400 ? "…" : ""}`), i && o.push(`**Assistant response:** ${i}${i.length >= 400 ? "…" : ""}`), o.join(`

`) || t.slice(0, 600);
}
function Oi(e, t) {
  const n = /* @__PURE__ */ new Set();
  n.add(t.inferredProject);
  for (const s of t.recurringTerms.slice(0, 5))
    n.add(s);
  return typeof e.metadata.pastedTranscriptCount == "number" && e.metadata.pastedTranscriptCount > 0 && n.add("Pasted source material"), [...n].filter(Boolean);
}
function Ui(e, t, n, s) {
  const r = t.title.trim() || "Untitled Conversation", i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    e,
    "",
    "## Session Date",
    Pi(t.metadata.createTime),
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
    Fi(t),
    "",
    "## Key Topics",
    ...Oi(t, n).map((c) => `- ${c}`),
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
function Os(e, t) {
  const n = t.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Untitled";
  return `${e}_${n}_SESSION.md`;
}
function Mi(e) {
  var n;
  const t = e.match(/## Topic\s*\n([^\n#]+)/);
  return ((n = t == null ? void 0 : t[1]) == null ? void 0 : n.trim()) ?? "ChatGPT conversation import";
}
async function dn(e, t) {
  if (t.length === 0)
    return;
  const n = S.join(e, "Registries", "SOURCE_REGISTRY.md");
  let s;
  try {
    s = await k.readFile(n, "utf8");
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
  const r = t.map((a) => `| ${a.krcId} | ${a.title.replace(/\|/g, "\\|")} | ${a.topic.replace(/\|/g, "\\|")} | ${a.primaryProduct} | ${a.status} |`).join(`
`);
  s = s.trimEnd() + `
` + r + `
`;
  const i = s.match(/Sources Inventoried:\s*(\d+)/), c = (i ? parseInt(i[1], 10) : 0) + t.length;
  s = s.replace(/Sources Inventoried:\s*\d+/, `Sources Inventoried: ${c}`), await k.writeFile(n, s, "utf8");
}
async function ji(e, t, n) {
  if (t === 0)
    return;
  const s = S.join(e, "Registries", "KRC_STATUS.md");
  let r;
  try {
    r = await k.readFile(s, "utf8");
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
  r = r.replace(/Approximate Sources Inventoried:\s*\d+/, `Approximate Sources Inventoried: ${o + t}`);
  const c = `
${n}
- KAE import: ${t} new source(s) on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
  r.includes(n) || (r = r.trimEnd() + c + `
`), await k.writeFile(s, r, "utf8");
}
function ln(e, t, n, s) {
  return {
    krcId: e,
    title: t,
    topic: Mi(n),
    primaryProduct: s ?? "TBD",
    status: n.includes("Review Needed") ? "Review Needed" : "Inventoried"
  };
}
function Vn(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Bi(e, t) {
  if (t.uncertain)
    return "Unclassified — review needed";
  const n = e.metadata.pastedTranscriptCount;
  return typeof n == "number" && n > 0 ? "Pasted source text / ChatGPT conversation" : `${t.primaryCategory} / ChatGPT conversation`;
}
function Ki(e) {
  const t = [], n = ["Axiom", "Founder OS", "VIGS"];
  for (const s of n) {
    const r = e.categories.some((i) => i === s || s === "Founder OS" && i === "Founder OS");
    t.push(`- ${s}: ${r ? "Yes" : "Possible"}`);
  }
  return t;
}
function Gi(e, t, n) {
  const s = t.title.trim() || "Untitled Conversation", r = String(t.metadata.conversationId ?? t.id), i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), o = t.metadata.messageCount ?? 0, c = [
    `# ${e} — ${s}`,
    "",
    "## Status",
    n.uncertain ? "Review Needed" : "Inventoried",
    "",
    "## Description",
    o === 0 ? "Empty or unparseable ChatGPT conversation — preserved for review." : `ChatGPT conversation acquired by KAE (${o} messages).`,
    "",
    "## Topic",
    Bi(t, n),
    "",
    "## Primary Product",
    n.uncertain ? "Review Needed" : n.primaryCategory,
    "",
    "## Categories",
    ...n.categories.map((d) => `- ${d}`),
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
    ...Ki(n),
    "",
    "## ChatGPT Conversation ID",
    r,
    "",
    "## Create Time",
    Vn(t.metadata.createTime),
    "",
    "## Update Time",
    Vn(t.metadata.updateTime),
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
    for (const d of n.recurringTerms)
      c.push(`- ${d}`);
  }
  const a = t.metadata.fileReferences;
  if (Array.isArray(a) && a.length > 0) {
    c.push("", "## File References", "");
    for (const d of a)
      typeof d == "string" && c.push(`- ${d}`);
  }
  return c.join(`
`);
}
function Us(e, t) {
  return `${e}_${Ye(t.title)}.md`;
}
function Ms(e) {
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
function zi(e) {
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
  return e.classified.length > 0 && t.push("### Classified", "", it(e.classified), ""), e.uncertain.length > 0 && t.push("### Uncertain / Review Needed", "", it(e.uncertain), ""), e.skipped.length > 0 && t.push("### Skipped", "", it(e.skipped), ""), e.errors.length > 0 && t.push("### Errors", "", it(e.errors), ""), t.push("---", ""), t.join(`
`);
}
function it(e) {
  const t = "| KRC ID | Title | Primary Category | All Categories | Confidence | Status | Notes |", n = "|---|---|---|---|---|---|---|", s = e.map((r) => {
    const i = [r.notes, r.sourcePath ? `Source: ${r.sourcePath}` : ""].filter(Boolean).join("; ");
    return `| ${r.krcId} | ${qn(r.title)} | ${r.primaryCategory} | ${r.categories.join(", ")} | ${r.confidence}% | ${r.status} | ${qn(i)} |`;
  });
  return [t, n, ...s].join(`
`);
}
function qn(e) {
  return e.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function Hi() {
  return [
    "# Import Review",
    "",
    "Auto-generated by KAE. Lists conversation classifications, uncertain items, skips, and errors.",
    ""
  ].join(`
`);
}
async function Zi(e, t) {
  const n = S.join(e, "Registries", "IMPORT_REVIEW.md");
  let s;
  try {
    s = await k.readFile(n, "utf8");
  } catch {
    s = Hi();
  }
  return s = s.trimEnd() + `

` + zi(t), await k.writeFile(n, s, "utf8"), n;
}
function Vi(e, t) {
  const s = new Ps(e).getEntries(), r = /* @__PURE__ */ new Map();
  for (const o of s)
    o.isDirectory || r.set(o.entryName.replace(/\\/g, "/"), o);
  const i = /* @__PURE__ */ new Map();
  for (const o of t) {
    const c = r.get(o.zipPath);
    c && i.set(o.zipPath, c.getData());
  }
  return i;
}
async function js(e, t, n) {
  var v, g, w, E, R, T, U, D;
  const s = [], r = [];
  let i = 0, o = 0, c = 0, a = 0, d = 0;
  await Fs(t);
  const u = tn(e);
  for (const $ of e) {
    const O = String($.metadata.conversationId ?? $.id);
    $.metadata.classification = u.get(O);
  }
  let l = await wt(t) + 1;
  const f = await un(t), m = [], y = `KAE Import — ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`, I = S.join(t, "Uploads", `chatgpt-import-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`);
  let A = !1;
  const C = {
    importDate: (/* @__PURE__ */ new Date()).toISOString(),
    importFileName: (n == null ? void 0 : n.importFileName) ?? "unknown.zip",
    conversationsProcessed: e.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: []
  }, b = e.length;
  let x = 0;
  for (const $ of e) {
    x++, (v = n == null ? void 0 : n.onProgress) == null || v.call(n, Math.round(x / b * 100));
    const O = String($.metadata.conversationId ?? $.id), M = u.get(O) ?? en($);
    $.metadata.classification = M;
    const K = f.get(O), G = Ms(M);
    let B, V;
    K ? (B = K, V = !0, (g = n == null ? void 0 : n.log) == null || g.call(n, "info", `Updating existing source ${B} for conversation ${O}`)) : (B = vt(l), l++, V = !1);
    const J = Us(B, $), ye = S.join(t, "Sources", G, J), we = `Sources/${G}/${J}`, $e = Gi(B, $, M), _e = Os(B, $), nt = S.join(t, "ExecutiveSessions", G, _e), Ne = `ExecutiveSessions/${G}/${_e}`, st = Ui(B, $, M, we), P = {
      krcId: B,
      conversationId: O,
      title: $.title,
      primaryCategory: M.primaryCategory,
      categories: M.categories,
      confidence: M.confidence,
      uncertain: M.uncertain,
      status: "classified",
      sourcePath: we,
      sessionPath: Ne
    };
    try {
      const z = await Zn(ye, $e, V);
      if (z === "skipped") {
        c++, P.status = "skipped", P.notes = "Duplicate file — not overwritten", C.skipped.push(P), (w = n == null ? void 0 : n.log) == null || w.call(n, "warn", `Skipped duplicate file: ${J}`);
        continue;
      }
      f.set(O, B), z === "created" ? (i++, r.push(B), m.push(ln(B, $.title, $e, M.uncertain ? "Review Needed" : M.primaryCategory))) : z === "updated" && (P.status = "updated"), await Zn(nt, st, V), o++, (E = n == null ? void 0 : n.log) == null || E.call(n, "info", `Executive session: ${Ne}`), M.uncertain ? (d++, P.status = P.status === "updated" ? "updated" : "uncertain", C.uncertain.push(P)) : (a++, C.classified.push(P)), (R = n == null ? void 0 : n.log) == null || R.call(n, "info", `${z === "created" ? "Created" : "Updated"} [${M.primaryCategory}] ${B}: ${we}`), A || (await qi(I, $, n), A = !0);
    } catch (z) {
      const Y = z instanceof Error ? z.message : String(z);
      s.push(`${B}: ${Y}`), P.status = "error", P.notes = Y, C.errors.push(P), (T = n == null ? void 0 : n.log) == null || T.call(n, "error", `Failed to write ${B}: ${Y}`);
    }
  }
  let h;
  try {
    m.length > 0 && await dn(t, m), await ji(t, m.length, y), h = await Zi(t, C), (U = n == null ? void 0 : n.log) == null || U.call(n, "info", `Import review written: ${h}`);
  } catch ($) {
    const O = $ instanceof Error ? $.message : String($);
    s.push(`Registry/review update: ${O}`), (D = n == null ? void 0 : n.log) == null || D.call(n, "error", O);
  }
  const p = S.join(t, "Sources");
  return {
    sourcesCreated: i,
    sessionsCreated: o,
    skippedDuplicates: c,
    errors: s,
    outputFolder: p,
    createdSourceIds: r,
    classified: a,
    uncertain: d,
    reviewFile: h
  };
}
async function qi(e, t, n) {
  var o, c;
  const s = t.metadata.allZipAssets;
  if (!Array.isArray(s) || s.length === 0)
    return;
  await k.mkdir(e, { recursive: !0 });
  const r = s.some((a) => !a.dataBase64);
  let i;
  r && (n != null && n.sourceZipPath) && ((o = n.log) == null || o.call(n, "info", `Extracting ${s.length} asset(s) from ZIP at write time`), i = Vi(n.sourceZipPath, s));
  for (const a of s) {
    const d = a.dataBase64 ? Buffer.from(a.dataBase64, "base64") : i == null ? void 0 : i.get(a.zipPath);
    if (!d || !a.fileName)
      continue;
    const u = S.join(e, a.fileName);
    await Li(u, d, !1) !== "skipped" && ((c = n == null ? void 0 : n.log) == null || c.call(n, "info", `Preserved asset: Uploads/${S.basename(e)}/${a.fileName}`));
  }
}
class Wi extends yi {
  constructor() {
    super(...arguments);
    _(this, "id", "axiom");
    _(this, "name", "Axiom Knowledge Repository");
  }
  async export(n, s, r) {
    return js(n, s, r);
  }
}
const Bs = new Wi(), Yi = [
  "Registries/SOURCE_REGISTRY.md",
  "Registries/KRC_STATUS.md",
  "Registries/IMPORT_REVIEW.md"
];
function Ks(e, t) {
  const n = [], s = [], r = [], i = [], o = [];
  for (const l of e)
    l.action === "create" ? (n.push(l.sourcePath), r.push(l.sessionPath)) : l.action === "update" ? (s.push(l.sourcePath), i.push(l.sessionPath)) : l.action === "skip" && o.push(l.sourcePath);
  const c = n.length + s.length > 0, a = c ? [...Yi] : [], d = c ? [t.replace("{timestamp}", "<timestamp>")] : [], u = [...n, ...s, ...r, ...i];
  return {
    sourcesAdded: n,
    sourcesUpdated: s,
    sessionsAdded: r,
    sessionsUpdated: i,
    registriesUpdated: a,
    uploadsAdded: d,
    duplicatesSkipped: o,
    modifiedFiles: u,
    deletedFiles: [],
    estimatedTotalChanges: n.length + s.length + r.length + i.length + a.length + d.length
  };
}
async function Ji(e, t, n) {
  const s = [], r = [], i = [], o = [];
  let c = 0, a = 0, d = 0, u = 0;
  const l = tn(e);
  let f = await wt(t) + 1;
  const m = await un(t), y = S.join(t, "Sources"), I = S.join(t, "Uploads", "chatgpt-import-{timestamp}"), A = S.join(t, "ExecutiveSessions"), C = S.join(t, "Registries", "SOURCE_REGISTRY.md"), b = S.join(t, "Registries", "IMPORT_REVIEW.md");
  let x = 0;
  const h = [], p = e[0];
  if (p) {
    const w = p.metadata.allZipAssets;
    Array.isArray(w) && (x = w.length, h.push(...w.map((E) => E.fileName).filter(Boolean)));
  }
  for (const w of e) {
    const E = String(w.metadata.conversationId ?? w.id), R = l.get(E) ?? en(w), T = m.get(E), U = Ms(R);
    let D, $;
    T ? (D = T, $ = "update") : (D = vt(f), f++, $ = "create");
    const O = Us(D, w), M = S.join(y, U, O), K = `Sources/${U}/${O}`, G = Os(D, w), B = `ExecutiveSessions/${U}/${G}`;
    if ($ === "create")
      try {
        await k.access(M), $ = "skip";
      } catch {
      }
    $ === "create" ? c++ : $ === "update" ? a++ : $ === "skip" && d++, R.uncertain && u++, o.push({
      conversationId: E,
      title: w.title,
      krcId: D,
      action: $,
      primaryCategory: R.primaryCategory,
      categories: R.categories,
      uncertain: R.uncertain,
      sourcePath: K,
      sessionPath: B
    });
  }
  u > 0 && r.push(`${u} conversation(s) require manual review (uncertain classification).`), d > 0 && r.push(`${d} file(s) already exist and will be skipped.`);
  try {
    await k.access(t);
  } catch {
    r.push("Repository path does not exist yet — it will be created on import.");
  }
  const v = i.length === 0 && e.length > 0, g = Ks(o, I);
  return {
    valid: v,
    fileName: n,
    filePath: "",
    zipReadable: !0,
    chatGptStructureDetected: !0,
    conversationsJsonPresent: !0,
    conversationsFound: e.length,
    uploadedFilesCount: x,
    uploadedFileNames: h,
    estimatedSourcesToCreate: c,
    estimatedSourcesToUpdate: a,
    estimatedDuplicatesSkipped: d,
    uncertainCount: u,
    errors: s,
    warnings: r,
    blockingErrors: i,
    plannedRecords: o,
    diffPreview: g,
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: y,
      uploadsPattern: I,
      executiveSessionsRoot: A,
      registryPath: C,
      reviewPath: b
    },
    repositoryPath: t
  };
}
function Xi(e, t, n, s) {
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
    diffPreview: Ks([], S.join(n, "Uploads", "chatgpt-import-{timestamp}")),
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
const fn = 1, Gs = ".kae-connectors", zs = "connectors.json";
function Wn() {
  return {
    version: fn,
    connectors: {},
    syncHistory: [],
    schedules: [],
    totals: {}
  };
}
async function Qi(e) {
  const t = S.join(e, Gs, zs);
  try {
    const n = await k.readFile(t, "utf8"), s = JSON.parse(n);
    return {
      ...Wn(),
      ...s,
      version: fn
    };
  } catch {
    return Wn();
  }
}
async function Oe(e, t) {
  const n = S.join(e, Gs);
  await k.mkdir(n, { recursive: !0 });
  const s = S.join(n, zs);
  return await k.writeFile(s, JSON.stringify({ ...t, version: fn }, null, 2), "utf8"), s;
}
const Yn = ks(Rs);
async function eo(e) {
  try {
    return await k.access(e), !0;
  } catch {
    return !1;
  }
}
async function to(e) {
  const t = S.join(e, ".kae-snapshots");
  try {
    const s = (await k.readdir(t)).sort().reverse();
    return s[0] ? S.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function no(e, t) {
  const n = [];
  let s = !1, r, i = !1;
  try {
    const { stdout: f } = await Yn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: e
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
      const { stdout: f } = await Yn("git", ["status", "--porcelain"], {
        cwd: e
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
  const o = (t == null ? void 0 : t.duplicateIds) ?? [];
  n.push({
    id: "duplicate-ids",
    label: "No duplicate KRC IDs",
    passed: o.length === 0,
    message: o.length === 0 ? "No duplicate source IDs detected." : `${o.length} duplicate ID(s): ${o.slice(0, 5).join(", ")}${o.length > 5 ? "…" : ""}`,
    severity: o.length > 0 ? "error" : "info"
  });
  const c = (t == null ? void 0 : t.categorizedIssues.warnings.filter((f) => f.code === "MISSING_REGISTRY")) ?? [];
  n.push({
    id: "registries",
    label: "Required registries present",
    passed: c.length === 0,
    message: c.length === 0 ? "All required registries are present." : `${c.length} registry file(s) missing.`,
    severity: c.length > 0 ? "warning" : "info"
  });
  const a = (t == null ? void 0 : t.categorizedIssues.errors) ?? [];
  n.push({
    id: "integrity",
    label: "No integrity errors",
    passed: a.length === 0,
    message: a.length === 0 ? "No broken references or integrity errors detected." : `${a.length} integrity error(s) require attention.`,
    severity: a.length > 0 ? "error" : "info"
  });
  const d = await to(e);
  n.push({
    id: "snapshot",
    label: "Import snapshot available",
    passed: !!d,
    message: d ? `Latest snapshot: ${S.basename(d)}` : "No import snapshot found (created automatically before imports).",
    severity: "info"
  }), await eo(e) || n.push({
    id: "repo-exists",
    label: "Repository path exists",
    passed: !1,
    message: "Repository path does not exist yet.",
    severity: "warning"
  });
  const l = !n.some((f) => !f.passed && f.severity === "error") && o.length === 0;
  return {
    ready: l,
    status: l ? "READY" : "NOT READY",
    checks: n
  };
}
const Jn = ks(Rs), Xn = /KRC-\d{4}/g;
async function le(e) {
  try {
    return await k.access(e), !0;
  } catch {
    return !1;
  }
}
async function Qn(e) {
  const t = [];
  if (!await le(e))
    return t;
  async function n(s) {
    const r = await k.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && t.push(o);
    }
  }
  return await n(e), t;
}
function es(e, t) {
  return S.relative(e, t).replace(/\\/g, "/");
}
function q(e, t) {
  e.push(t);
}
async function ge(e) {
  const t = [], n = [], s = /* @__PURE__ */ new Map();
  await le(e) || q(t, {
    severity: "warning",
    category: "warning",
    code: "REPO_MISSING",
    message: "Repository path does not exist.",
    path: e,
    recovery: "Configure the repository path in Settings or import to create it."
  });
  const r = ["Sources", "ExecutiveSessions", "Registries", "Uploads"];
  for (const A of r) {
    const C = S.join(e, A);
    await le(C) || q(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_DIR",
      message: `Missing directory: ${A}`,
      path: C,
      relativePath: A,
      recovery: "Directory will be created automatically on first import."
    });
  }
  const i = ["SOURCE_REGISTRY.md", "KRC_STATUS.md", "IMPORT_REVIEW.md"];
  for (const A of i) {
    const C = S.join(e, "Registries", A);
    await le(C) || q(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_REGISTRY",
      message: `Missing registry: ${A}`,
      path: C,
      relativePath: `Registries/${A}`,
      recovery: "Registry files are created during the first successful import."
    });
  }
  const o = await Qn(S.join(e, "Sources")), c = await Qn(S.join(e, "ExecutiveSessions")), a = /* @__PURE__ */ new Map();
  for (const A of c) {
    const b = S.basename(A).match(Xn);
    b != null && b[0] && a.set(b[0], A);
  }
  for (const A of o) {
    const C = S.basename(A), b = es(e, A), x = C.match(Xn);
    if (!x) {
      q(t, {
        severity: "info",
        category: "info",
        code: "NO_KRC_ID",
        message: `Source file has no KRC ID in filename: ${C}`,
        path: A,
        relativePath: b
      });
      continue;
    }
    for (const p of x) {
      const v = s.get(p) ?? [];
      v.push(A), s.set(p, v);
    }
    /[<>:"|?*]/.test(C) && q(t, {
      severity: "error",
      category: "error",
      code: "INVALID_FILENAME",
      message: `Invalid characters in filename: ${C}`,
      path: A,
      relativePath: b,
      recovery: "Rename the file to remove invalid characters."
    });
    const h = x[0];
    a.has(h) || q(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_SESSION",
      message: `No executive session found for ${h}`,
      path: A,
      relativePath: b,
      recovery: "Re-import or manually create the executive session record."
    });
    try {
      const p = await k.readFile(A, "utf8");
      !p.includes("## Metadata") && !p.includes("Acquired by KAE") && q(t, {
        severity: "info",
        category: "info",
        code: "MISSING_METADATA",
        message: `Source ${h} may be missing standard metadata block`,
        path: A,
        relativePath: b
      });
    } catch {
      q(t, {
        severity: "error",
        category: "error",
        code: "UNREADABLE_FILE",
        message: `Unable to read source file: ${C}`,
        path: A,
        relativePath: b,
        recovery: "Verify file permissions and encoding."
      });
    }
  }
  for (const [A, C] of s)
    C.length > 1 && (n.push(A), q(t, {
      severity: "error",
      category: "error",
      code: "DUPLICATE_ID",
      message: `Duplicate KRC ID ${A} found in ${C.length} files`,
      path: C[0],
      relativePath: es(e, C[0]),
      recovery: "Remove or merge duplicate source files before committing."
    }));
  o.length === 0 && await le(e) && q(t, {
    severity: "info",
    category: "recommendation",
    code: "EMPTY_SOURCES",
    message: "No source files found in the repository.",
    recovery: "Import a ChatGPT export to populate the knowledge repository."
  }), await le(S.join(e, ".kae-snapshots")) || q(t, {
    severity: "info",
    category: "recommendation",
    code: "NO_SNAPSHOTS",
    message: "No import snapshots yet.",
    recovery: "Snapshots are created automatically before each import."
  });
  let d = !1, u, l;
  try {
    const { stdout: A } = await Jn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: e
    }), { stdout: C } = await Jn("git", ["status", "--porcelain"], {
      cwd: e
    });
    d = !0, u = A.trim(), l = C.trim().length > 0, l && q(t, {
      severity: "info",
      category: "recommendation",
      code: "GIT_DIRTY",
      message: "Git working tree has uncommitted changes.",
      recovery: "Review changes and commit when ready."
    });
  } catch {
    q(t, {
      severity: "info",
      category: "recommendation",
      code: "NOT_GIT",
      message: "Repository is not initialized as a Git repository.",
      recovery: "Run git init in the repository folder for version control."
    });
  }
  const f = ri(t), y = {
    ready: !(f.errors.length > 0) && await le(e),
    statusLevel: "healthy",
    statusHeadline: "",
    statusSubline: "",
    repositoryPath: e,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sourceCount: o.length,
    sessionCount: c.length,
    duplicateIds: n,
    issues: t,
    categorizedIssues: f,
    gitReady: d,
    gitBranch: u,
    gitDirty: l,
    gitReadiness: { ready: !1, status: "NOT READY", checks: [] }
  }, I = si(y);
  return y.statusLevel = I.level, y.statusHeadline = I.headline, y.statusSubline = I.subline, y.gitReadiness = await no(e, y), y;
}
async function Hs(e, t) {
  await k.mkdir(t, { recursive: !0 });
  const n = await k.readdir(e, { withFileTypes: !0 });
  for (const s of n) {
    const r = S.join(e, s.name), i = S.join(t, s.name);
    s.isDirectory() ? await Hs(r, i) : await k.copyFile(r, i);
  }
}
async function Zs(e, t) {
  const n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = S.join(e, ".kae-snapshots", `${n}_${t}`);
  await k.mkdir(s, { recursive: !0 });
  const r = ["Sources", "ExecutiveSessions", "Registries"];
  for (const i of r) {
    const o = S.join(e, i);
    try {
      await k.access(o), await Hs(o, S.join(s, i));
    } catch {
    }
  }
  return s;
}
async function so(e, t) {
  const n = S.join(e, ".kae-sessions");
  await k.mkdir(n, { recursive: !0 });
  const s = S.join(n, `${t.sessionId}.json`);
  return await k.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const ro = 53, io = 122;
function oo(e) {
  var s;
  const t = e.slice(0, 4096), n = t.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: n == null ? void 0 : n[1],
    title: (s = n == null ? void 0 : n[2]) == null ? void 0 : s.trim(),
    createTime: me(t, "Create Time"),
    updateTime: me(t, "Update Time")
  };
}
async function Vs(e) {
  const n = (await St(e)).filter((r) => r.category === "sources" && qs(r.name)), s = [];
  for (const r of n) {
    let i = "";
    try {
      i = (await He(e, r.relativePath)).slice(0, 4096);
    } catch {
    }
    const o = oo(i), c = o.updateTime ?? o.createTime ?? r.modifiedAt ?? "";
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
function qs(e) {
  const t = e.match(/^KRC-(\d{4})_/i);
  if (!t)
    return !1;
  const n = parseInt(t[1], 10);
  return n >= ro && n <= io;
}
function me(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function ao(e) {
  return e ? e.split(`
`).map((t) => t.replace(/^-\s*/, "").trim()).filter(Boolean) : [];
}
function co(e) {
  var d, u, l, f;
  const t = e.split(`
`), n = (d = t[0]) == null ? void 0 : d.trim();
  if (!n)
    return null;
  let s, r = 1;
  (u = t[1]) != null && u.startsWith("*") && ((l = t[1]) != null && l.endsWith("*")) && (s = t[1].slice(1, -1).trim(), r = 2);
  const o = t.slice(r).join(`
`).trim().split(/\n\*\*File references:\*\*\s*\n/i), c = ((f = o[0]) == null ? void 0 : f.trim()) ?? "", a = [];
  if (o[1])
    for (const m of o[1].split(`
`)) {
      const y = m.replace(/^-\s*/, "").trim();
      y && a.push(y);
    }
  return { role: n, timestamp: s, text: c, fileReferences: a };
}
function pn(e) {
  const t = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!t)
    return null;
  const n = e.indexOf("## Transcript"), s = n >= 0 ? e.slice(0, n) : e, r = n >= 0 ? e.slice(n + 13) : "", i = [];
  for (const o of r.split(/^### /m).slice(1)) {
    const c = co(o);
    c && i.push(c);
  }
  return {
    krcId: t[1],
    title: t[2].trim(),
    conversationId: me(s, "ChatGPT Conversation ID"),
    createTime: me(s, "Create Time"),
    updateTime: me(s, "Update Time"),
    description: me(s, "Description"),
    fileReferences: ao(me(s, "File References")),
    messages: i
  };
}
function mn(e, t) {
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
function uo(e) {
  return e.startsWith("image/") ? "image" : e.startsWith("video/") ? "video" : "other";
}
async function Ws(e) {
  const t = S.join(e, "Uploads");
  let n;
  try {
    n = await k.readdir(t);
  } catch {
    return null;
  }
  const s = n.filter((r) => r.startsWith("chatgpt-import-")).sort().reverse();
  return s.length === 0 ? null : `Uploads/${s[0]}`;
}
async function Ys(e, t) {
  const n = /* @__PURE__ */ new Map(), s = S.join(e, t);
  let r;
  try {
    r = await k.readdir(s);
  } catch {
    return n;
  }
  for (const i of r) {
    const o = `${t}/${i}`.replace(/\\/g, "/");
    n.set(i.toLowerCase(), o);
    const c = i.replace(/\.dat$/i, "");
    n.set(c.toLowerCase(), o), c.startsWith("file_") && n.set(c.slice(5).toLowerCase(), o);
  }
  return n;
}
function Js(e, t) {
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
    const o = t.get(i.toLowerCase());
    if (o)
      return o;
  }
  const r = S.basename(n).toLowerCase();
  for (const [i, o] of t.entries())
    if (i.includes(r) || r.includes(i))
      return o;
  return null;
}
async function lo(e, t) {
  const n = await Ws(e);
  if (!n)
    return [];
  const s = await Ys(e, n), r = [], i = /* @__PURE__ */ new Set();
  for (const o of t) {
    const c = Js(o, s);
    if (!c || i.has(c))
      continue;
    i.add(c);
    const a = S.join(e, c);
    let d;
    try {
      d = await k.readFile(a);
    } catch {
      continue;
    }
    const u = mn(d, o);
    r.push({
      ref: o,
      relativePath: c,
      fileName: S.basename(c),
      mimeType: u,
      kind: uo(u)
    });
  }
  return r;
}
function Ue(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function fo(e, t) {
  var u;
  const n = e.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m), s = ((u = n == null ? void 0 : n[1]) == null ? void 0 : u.trim()) ?? t.replace(/\.md$/i, ""), r = Ue(e, "Source ID"), i = Ue(e, "Session Date"), o = Ue(e, "Session Summary") ?? "", c = Ue(e, "Transcript Reference"), a = [];
  c && a.push(c);
  for (const l of ["Key Topics", "Recurring Terms", "Classification", "Rationale"]) {
    const f = Ue(e, l);
    if (f)
      for (const m of f.split(`
`)) {
        const y = m.replace(/^-\s*/, "").trim();
        y && a.push(y);
      }
  }
  return {
    sessionId: t.replace(/\.md$/i, ""),
    title: s,
    linkedKrcId: r,
    sessionDate: i,
    summaryText: o,
    summaryReferences: [...new Set(a)],
    transcriptReference: c
  };
}
const Ae = ".kae-index", po = "evidence-index.json", Xs = 1;
function It(e) {
  return S.join(e, Ae, po);
}
async function Qs(e) {
  const t = It(e);
  try {
    const n = await k.readFile(t, "utf8"), s = JSON.parse(n);
    return s.version !== Xs || !Array.isArray(s.records) ? null : s;
  } catch {
    return null;
  }
}
async function mo(e, t) {
  const n = S.join(e, Ae);
  await k.mkdir(n, { recursive: !0 });
  const s = It(e);
  return await k.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const ho = /* @__PURE__ */ new Set([
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
function ze(e) {
  const t = e.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter((n) => n.length > 1 && !ho.has(n));
  return [...new Set(t)];
}
function Te(e) {
  const t = e.trim();
  if (!t)
    return [];
  if (/^krc-\d{4}$/i.test(t))
    return [t.toLowerCase()];
  const n = t.toLowerCase(), s = ze(t);
  return s.length === 0 && n.length > 0 ? [n] : s;
}
function Be(e, t = 160) {
  return e.replace(/\s+/g, " ").trim().slice(0, t);
}
function er(e) {
  return qs(e) ? "chatgpt-import" : e.startsWith("KRC-") ? "krc-source" : "markdown";
}
function go(e) {
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
function yo(e, t, n, s) {
  const r = pn(t);
  if (!r)
    return;
  const i = er(S.basename(e)), o = {
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
    repository: o,
    conversation: c,
    excerpt: Be(r.description ?? r.title)
  }), s.push({
    id: `${r.krcId}:conversation`,
    kind: "conversation",
    repository: o,
    conversation: c,
    excerpt: Be(r.title)
  });
  const a = new Set(r.fileReferences), d = /* @__PURE__ */ new Map();
  r.messages.forEach((u, l) => {
    const f = `${r.krcId}:msg:${l}`, m = ze(u.text);
    d.set(f, u.fileReferences), s.push({
      id: f,
      kind: "message",
      repository: o,
      conversation: c,
      message: {
        messageId: f,
        role: u.role,
        timestamp: u.timestamp,
        text: u.text,
        searchTerms: m
      },
      excerpt: Be(u.text)
    });
    for (const y of u.fileReferences)
      a.add(y);
  });
  for (const u of a) {
    const l = `${r.krcId}:att:${u}`, f = n ? Js(u, n) : null, m = S.basename(u);
    let y;
    for (const [I, A] of d.entries())
      if (A.includes(u)) {
        y = I;
        break;
      }
    s.push({
      id: l,
      kind: "attachment",
      repository: o,
      conversation: c,
      attachment: {
        attachmentId: l,
        filename: m,
        assetPath: f ?? void 0,
        linkedMessageId: y,
        resolved: !!f
      },
      excerpt: m
    });
  }
}
function wo(e, t, n) {
  var c;
  const s = S.basename(e), r = t.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m), i = r == null ? void 0 : r[1], o = ((c = r == null ? void 0 : r[2]) == null ? void 0 : c.trim()) ?? s.replace(/\.md$/i, "");
  n.push({
    id: `${e}:source`,
    kind: "source",
    repository: {
      krcId: i,
      repositoryPath: e,
      category: "sources",
      sourceType: er(s)
    },
    conversation: { title: o },
    excerpt: Be(t)
  });
}
function vo(e, t, n) {
  const s = fo(t, S.basename(e));
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
    excerpt: Be(r || s.title)
  });
}
async function Je(e) {
  const t = await St(e), n = [], s = await Ws(e), r = s ? await Ys(e, s) : null;
  for (const c of t) {
    if (!c.relativePath.endsWith(".md") || c.category !== "sources" && c.category !== "sessions")
      continue;
    let a;
    try {
      a = await He(e, c.relativePath);
    } catch {
      continue;
    }
    if (c.category === "sessions") {
      vo(c.relativePath, a, n);
      continue;
    }
    pn(a) ? yo(c.relativePath, a, r, n) : wo(c.relativePath, a, n);
  }
  const i = (/* @__PURE__ */ new Date()).toISOString(), o = {
    version: Xs,
    repositoryPath: e,
    builtAt: i,
    recordCount: n.length,
    records: n
  };
  return await mo(e, o), o;
}
function Io(e) {
  const t = go(e.records);
  return t.builtAt = e.builtAt, t;
}
function tr(e) {
  return e.trim().toLowerCase();
}
function So(e) {
  const t = tr(e);
  return t === "user" || t.startsWith("user ");
}
function Eo(e) {
  const t = tr(e);
  return t === "assistant" || t.startsWith("assistant ");
}
function Co(e) {
  return e.kind === "executive_session" ? "session" : e.kind === "attachment" ? "attachment" : e.repository.category === "sessions" ? "session" : "source";
}
function Ro(e) {
  var t, n, s, r;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : e.kind === "executive_session" ? ((t = e.conversation) == null ? void 0 : t.title) ?? ((n = e.session) == null ? void 0 : n.sessionId) ?? "Executive Session" : e.kind === "message" && e.message ? `${((s = e.conversation) == null ? void 0 : s.title) ?? e.repository.krcId ?? "Message"} — ${e.message.role}` : ((r = e.conversation) == null ? void 0 : r.title) ?? e.repository.krcId ?? e.repository.repositoryPath;
}
function ko(e) {
  var t, n, s;
  if (e.kind === "executive_session") {
    if ((t = e.session) != null && t.transcriptReference)
      return e.session.transcriptReference;
    const r = (n = e.session) == null ? void 0 : n.summaryReferences.find((i) => i.startsWith("Sources/"));
    return r || e.repository.repositoryPath;
  }
  return e.kind === "attachment" && ((s = e.attachment) != null && s.assetPath), e.repository.repositoryPath;
}
function ot(e) {
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
function bo(e, t, n) {
  var a, d, u;
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  const i = t.toLowerCase(), o = (a = e.repository.krcId) == null ? void 0 : a.toLowerCase();
  o && (o === i || o.includes(i)) && (r += 100, s.add("krcId"));
  const c = ((u = (d = e.conversation) == null ? void 0 : d.title) == null ? void 0 : u.toLowerCase()) ?? "";
  if (c && c.includes(i) && (r += 40, s.add("title")), e.kind === "attachment" && e.attachment) {
    const l = e.attachment.filename.toLowerCase();
    (l.includes(i) || n.some((f) => l.includes(f))) && (r += 50, s.add("filename"), s.add("attachment"));
  }
  if (e.kind === "message" && e.message) {
    const l = e.message.text.toLowerCase(), f = l.includes(i), m = n.filter((y) => l.includes(y)).length;
    (f || m > 0) && (r += f ? 30 : m * 8, s.add("message"), s.add("keyword"), So(e.message.role) && (s.add("prompt"), f && (r += 10)), Eo(e.message.role) && (s.add("response"), f && (r += 10)));
  }
  if (e.kind === "executive_session") {
    const l = ot(e);
    (l.includes(i) || n.some((f) => l.includes(f))) && (r += 25, s.add("session"), s.add("keyword"));
  }
  if (e.kind === "source" || e.kind === "conversation") {
    const l = ot(e);
    (l.includes(i) || n.some((f) => l.includes(f))) && (r += 15, s.add("keyword"));
  }
  if (r === 0) {
    const l = ot(e);
    if (l.includes(i))
      r += 5, s.add("keyword");
    else {
      const f = n.filter((m) => l.includes(m)).length;
      f > 0 && (r += f * 3, s.add("keyword"));
    }
  }
  if (n.length > 1) {
    const l = ot(e);
    n.every((f) => l.includes(f)) && (r += 25, s.add("keyword"));
  }
  return { score: r, matchFields: [...s] };
}
function Ao(e, t, n) {
  var s, r, i;
  return {
    recordId: e.id,
    kind: e.kind,
    score: t,
    matchFields: n,
    title: Ro(e),
    snippet: e.excerpt,
    drilldownPath: ko(e),
    krcId: e.repository.krcId,
    conversationTitle: (s = e.conversation) == null ? void 0 : s.title,
    messageRole: (r = e.message) == null ? void 0 : r.role,
    attachmentFilename: (i = e.attachment) == null ? void 0 : i.filename,
    category: Co(e)
  };
}
function nr(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  const r = Te(s), i = [];
  for (const o of e.records) {
    const { score: c, matchFields: a } = bo(o, s, r);
    c <= 0 || a.length === 0 || i.push(Ao(o, c, a));
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
function sr(e) {
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
async function xe(e) {
  const t = await Qs(e);
  return t && t.repositoryPath === e ? t : Je(e);
}
async function rr(e, t, n = 50) {
  const s = await xe(e);
  return nr(s, t, n);
}
function To(e) {
  const t = e.replace(/\\/g, "/");
  return t.startsWith("Sources/") ? "sources" : t.startsWith("ExecutiveSessions/") ? "sessions" : t.startsWith("Registries/") ? "registries" : t.startsWith("ImportReports/") ? "reports" : t.startsWith("Uploads/") ? "uploads" : "other";
}
async function ir(e, t, n) {
  const s = await k.readdir(t, { withFileTypes: !0 });
  for (const r of s) {
    if (r.name.startsWith(".kae-"))
      continue;
    const i = S.join(t, r.name), o = S.relative(e, i).replace(/\\/g, "/");
    if (r.isDirectory())
      await ir(e, i, n);
    else if (r.name.endsWith(".md") || r.name.endsWith(".json")) {
      let c, a;
      try {
        const d = await k.stat(i);
        c = d.size, a = d.mtime.toISOString();
      } catch {
      }
      n.push({
        name: r.name,
        relativePath: o,
        category: To(o),
        sizeBytes: c,
        modifiedAt: a
      });
    }
  }
}
async function St(e) {
  const t = [];
  try {
    await k.access(e), await ir(e, e, t);
  } catch {
    return [];
  }
  return t.sort((n, s) => n.relativePath.localeCompare(s.relativePath));
}
async function He(e, t) {
  const n = S.join(e, t), s = S.resolve(e);
  if (!S.resolve(n).startsWith(s))
    throw new Error("Invalid file path.");
  return k.readFile(n, "utf8");
}
function xo(e, t, n = 80) {
  const s = Math.max(0, t - n), r = Math.min(e.length, t + n);
  return e.slice(s, r).replace(/\s+/g, " ").trim();
}
async function Do(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  try {
    const r = await rr(e, s, n);
    if (r.length > 0)
      return sr(r);
  } catch {
  }
  return $o(e, s, n);
}
async function $o(e, t, n = 50) {
  const s = t.toLowerCase(), r = await St(e), i = [];
  for (const o of r) {
    if (!o.relativePath.endsWith(".md"))
      continue;
    let c;
    try {
      c = await He(e, o.relativePath);
    } catch {
      continue;
    }
    const a = c.toLowerCase(), d = o.name.replace(/\.md$/i, "");
    let u = 0;
    d.toLowerCase().includes(s) && (u += 10);
    const l = a.split(s).length - 1;
    if (l === 0)
      continue;
    u += l;
    const f = a.indexOf(s);
    i.push({
      path: o.relativePath,
      title: d,
      snippet: xo(c, f),
      category: o.category === "sessions" ? "session" : o.category === "registries" ? "registry" : o.category === "reports" ? "report" : "source",
      score: u
    });
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
async function _o(e) {
  const t = S.join(e, ".kae-snapshots");
  try {
    const s = (await k.readdir(t)).sort().reverse();
    return s[0] ? S.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function No(e) {
  var n;
  const t = S.join(e, "Registries", "IMPORT_REVIEW.md");
  try {
    const r = (await k.readFile(t, "utf8")).match(/Import Date:\s*([^\n]+)/i);
    return (n = r == null ? void 0 : r[1]) == null ? void 0 : n.trim();
  } catch {
    return;
  }
}
async function or(e) {
  const t = await ge(e);
  let n = 0;
  try {
    const s = S.join(e, "Registries");
    n = (await k.readdir(s)).filter((i) => i.endsWith(".md")).length;
  } catch {
    n = 0;
  }
  return {
    repositoryPath: e,
    sourceCount: t.sourceCount,
    sessionCount: t.sessionCount,
    registryCount: n,
    lastImportDate: await No(e),
    lastSnapshotPath: await _o(e),
    healthReady: t.ready,
    issueCount: t.issues.length
  };
}
function Lo(e) {
  return e < 1e3 ? `${e}ms` : `${(e / 1e3).toFixed(1)}s`;
}
function Po(e) {
  const t = [
    "# KAE Import Report",
    "",
    `**Report ID:** ${e.reportId}`,
    `**Generated:** ${e.generatedAt}`,
    `**Duration:** ${Lo(e.durationMs)}`,
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
async function Fo(e, t) {
  const n = S.join(e, "ImportReports");
  await k.mkdir(n, { recursive: !0 });
  const r = `import-report-${t.generatedAt.replace(/[:.]/g, "-")}.md`, i = S.join(n, r), o = Po({ ...t });
  return await k.writeFile(i, o, "utf8"), i;
}
const Oo = /KRC-(\d{4})/i;
async function ar(e) {
  try {
    return await k.access(e), !0;
  } catch {
    return !1;
  }
}
async function cr(e) {
  const t = [];
  if (!await ar(e))
    return t;
  async function n(s) {
    const r = await k.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && t.push(o);
    }
  }
  return await n(e), t;
}
function ur(e, t) {
  return S.relative(e, t).replace(/\\/g, "/");
}
function dr(e) {
  const t = e.match(Oo);
  return t ? t[0].toUpperCase() : null;
}
function lr(e, t) {
  const n = e.replace(/\\/g, "/").split("/");
  return n[0] === t && n.length >= 2 ? n[1] ?? "" : "";
}
async function Uo(e) {
  const t = S.join(e, "Sources"), n = await cr(t), s = [];
  for (const r of n) {
    const i = ur(e, r), o = S.basename(r), c = await k.stat(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: dr(o),
      categoryFolder: lr(i, "Sources"),
      mtimeMs: c.mtimeMs
    });
  }
  return s;
}
async function Mo(e) {
  const t = S.join(e, "ExecutiveSessions"), n = await cr(t), s = [];
  for (const r of n) {
    const i = ur(e, r), o = S.basename(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: dr(o),
      categoryFolder: lr(i, "ExecutiveSessions")
    });
  }
  return s;
}
async function jo(e) {
  const t = S.join(e, "Registries", "SOURCE_REGISTRY.md"), n = [];
  try {
    const s = await k.readFile(t, "utf8");
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
async function Bo(e) {
  const t = S.join(e, "Uploads");
  return await ar(t) ? (await k.readdir(t, { withFileTypes: !0 })).filter((s) => s.isDirectory()).map((s) => `Uploads/${s.name}`) : [];
}
function ne(e, t, n, s) {
  return {
    id: W(),
    type: e,
    message: t,
    affectedFiles: n,
    ...s
  };
}
async function Ko(e) {
  const t = [], n = await Uo(e), s = await Mo(e), r = await jo(e), i = await Bo(e), o = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), a = new Map(r.map((u) => [u.krcId, u]));
  for (const u of n) {
    if (!u.krcId) {
      t.push(ne("invalid-krc-filename", `Source file has no valid KRC ID pattern: ${u.fileName}`, [u.relativePath]));
      continue;
    }
    const l = o.get(u.krcId) ?? [];
    l.push(u), o.set(u.krcId, l);
  }
  for (const u of s) {
    if (!u.krcId)
      continue;
    const l = c.get(u.krcId) ?? [];
    l.push(u), c.set(u.krcId, l);
  }
  for (const [u, l] of o)
    if (l.length > 1) {
      const f = l.map((m) => m.relativePath);
      t.push(ne("duplicate-krc-id", `Duplicate KRC ID ${u} found in ${l.length} source files`, f, {
        krcId: u,
        details: {
          canonical: f[0],
          duplicates: f.slice(1),
          mtimes: l.map((m) => m.mtimeMs)
        }
      }));
    }
  for (const u of n) {
    if (!u.krcId)
      continue;
    const l = c.get(u.krcId) ?? [];
    if (l.length === 0)
      t.push(ne("missing-executive-session", `No executive session found for ${u.krcId}`, [u.relativePath], { krcId: u.krcId }));
    else {
      const f = l[0];
      f.categoryFolder !== u.categoryFolder && t.push(ne("source-session-mismatch", `Category mismatch for ${u.krcId}: source in ${u.categoryFolder}, session in ${f.categoryFolder}`, [u.relativePath, f.relativePath], { krcId: u.krcId }));
    }
    a.has(u.krcId) || t.push(ne("missing-registry-entry", `Source ${u.krcId} is missing from SOURCE_REGISTRY.md`, [u.relativePath, "Registries/SOURCE_REGISTRY.md"], { krcId: u.krcId }));
  }
  const d = new Set(n.map((u) => u.krcId).filter(Boolean));
  for (const u of s)
    u.krcId && (d.has(u.krcId) || t.push(ne("orphan-executive-session", `Executive session exists without matching source for ${u.krcId}`, [u.relativePath], { krcId: u.krcId })));
  for (const u of r)
    d.has(u.krcId) || t.push(ne("broken-registry-reference", `Registry references ${u.krcId} but no matching source file exists`, ["Registries/SOURCE_REGISTRY.md"], { krcId: u.krcId, details: { registryTitle: u.title } }));
  return i.length === 0 && n.length > 0 && t.push(ne("upload-folder-mismatch", "No upload folders found under Uploads/ — imported assets may be missing", ["Uploads/"])), t;
}
async function Go(e) {
  var i;
  const t = await Ko(e), n = [];
  for (const o of t)
    switch (o.type) {
      case "duplicate-krc-id": {
        const c = o.affectedFiles, a = ((i = o.details) == null ? void 0 : i.mtimes) ?? [], d = [...c].sort((l, f) => {
          const m = c.indexOf(l), y = c.indexOf(f);
          return (a[m] ?? 0) - (a[y] ?? 0);
        }), u = d[0];
        for (const l of d.slice(1))
          n.push({
            id: W(),
            issueId: o.id,
            type: "reassign-krc-id",
            description: `Reassign duplicate ${o.krcId} in ${l}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${u}`,
            riskLevel: "medium",
            autoRepairSafe: !0,
            manualReviewRequired: !1,
            affectedFiles: [l],
            metadata: {
              oldKrcId: o.krcId,
              canonicalPath: u
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
    repositoryPath: e,
    issues: t,
    actions: n,
    autoRepairCount: s,
    manualReviewCount: r
  };
}
function ue(e, t) {
  var s, r;
  const n = new RegExp(`## ${t}\\s*\\n([^#\\n][^\\n]*)`, "i");
  return (r = (s = e.match(n)) == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function hn(e, t) {
  var a, d, u;
  const s = ((d = (a = (t.split("/").pop() ?? t).match(/KRC-\d{4}/i)) == null ? void 0 : a[0]) == null ? void 0 : d.toUpperCase()) ?? "KRC-0000", r = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m), i = ((u = r == null ? void 0 : r[2]) == null ? void 0 : u.trim()) ?? ue(e, "Description") ?? "Untitled", o = t.replace(/\\/g, "/").split("/"), c = o[0] === "Sources" && o.length >= 2 ? o[1] : "Other_Review_Needed";
  return {
    krcId: s,
    title: i,
    primaryProduct: ue(e, "Primary Product") ?? "Review Needed",
    topic: ue(e, "Topic") ?? "ChatGPT conversation",
    status: ue(e, "Status") ?? "Inventoried",
    conversationId: ue(e, "ChatGPT Conversation ID"),
    createTime: ue(e, "Create Time"),
    updateTime: ue(e, "Update Time"),
    categoryFolder: c
  };
}
function zo(e, t, n, s) {
  let r = e;
  const i = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), o = e.match(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*(.+)$`, "m"));
  return o && (r = r.replace(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*.+$`, "m"), `# ${n} — ${o[1].trim()}`)), r.includes("## Source ID") && (r = r.replace(new RegExp(`(## Source ID\\s*\\n)${i}`, "i"), `$1${n}`)), r.includes("## KAE Repair Provenance") || (r = `${r.trimEnd()}

## KAE Repair Provenance
${s}
`), r;
}
const Ho = "Generated by KAE Repository Repair because source KRC existed without matching executive session.";
function fr(e, t, n, s = Ho) {
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
function pr(e, t) {
  return `${e}_${Ye(t)}_SESSION.md`;
}
function Zo(e, t) {
  return `${e}_${Ye(t)}.md`;
}
const Vo = (e, t, n) => `Reassigned from ${e} to ${t} by KAE Repository Repair on ${n}. Canonical record retains ${e}; this duplicate was preserved with a new ID.`;
async function qo(e, t, n, s) {
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
  const i = String(((v = t.metadata) == null ? void 0 : v.oldKrcId) ?? ""), o = S.join(e, r), c = await k.readFile(o, "utf8"), a = hn(c, r);
  n.value += 1;
  const d = vt(n.value), u = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), l = Vo(i, d, u), f = zo(c, i, d, l), m = S.join(e, "Sources", a.categoryFolder), y = Zo(d, a.title), I = S.join(m, y), A = `Sources/${a.categoryFolder}/${y}`;
  await k.mkdir(m, { recursive: !0 }), await k.writeFile(I, f, "utf8"), I !== o && await k.unlink(o);
  const C = S.join(e, "ExecutiveSessions", a.categoryFolder);
  await k.mkdir(C, { recursive: !0 });
  const b = pr(d, a.title), x = S.join(C, b), h = `ExecutiveSessions/${a.categoryFolder}/${b}`, p = fr(d, A, { ...a, title: a.title }, `Generated by KAE Repository Repair after reassigning duplicate ${i} → ${d}.`);
  return await k.writeFile(x, p, "utf8"), await dn(e, [
    ln(d, a.title, f, a.primaryProduct)
  ]), s("info", `Reassigned duplicate ${i} → ${d}`, {
    oldPath: r,
    newPath: A,
    sessionPath: h
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Reassigned ${i} → ${d}`,
    filesChanged: [A, h, "Registries/SOURCE_REGISTRY.md"]
  };
}
async function Wo(e, t, n) {
  var m;
  const s = t.affectedFiles.find((y) => y.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file found for session generation",
      filesChanged: []
    };
  const r = String(((m = t.metadata) == null ? void 0 : m.krcId) ?? ""), i = S.join(e, s), o = await k.readFile(i, "utf8"), c = hn(o, s), a = S.join(e, "ExecutiveSessions", c.categoryFolder);
  await k.mkdir(a, { recursive: !0 });
  const d = pr(r || c.krcId, c.title), u = S.join(a, d), l = `ExecutiveSessions/${c.categoryFolder}/${d}`;
  if (await Jo(u))
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: `Session already exists: ${l}`,
      filesChanged: []
    };
  const f = fr(r || c.krcId, s, c);
  return await k.writeFile(u, f, "utf8"), n("info", `Generated executive session for ${r || c.krcId}`, {
    sessionPath: l,
    sourcePath: s
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Generated session for ${r || c.krcId}`,
    filesChanged: [l]
  };
}
async function Yo(e, t, n) {
  const s = t.affectedFiles.find((c) => c.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file for registry entry",
      filesChanged: []
    };
  const r = S.join(e, s), i = await k.readFile(r, "utf8"), o = hn(i, s);
  return await dn(e, [
    ln(o.krcId, o.title, i, o.primaryProduct)
  ]), n("info", `Added registry entry for ${o.krcId}`, { sourcePath: s }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Added registry entry for ${o.krcId}`,
    filesChanged: ["Registries/SOURCE_REGISTRY.md"]
  };
}
async function Jo(e) {
  try {
    return await k.access(e), !0;
  } catch {
    return !1;
  }
}
async function Xo(e, t = {}) {
  const n = t.log ?? (() => {
  }), s = t.sessionId ?? `repair-${crypto.randomUUID()}`, r = e.repositoryPath, i = await ge(r);
  n("info", "Pre-repair health check complete", {
    duplicateIds: i.duplicateIds,
    issueCount: i.issues.length
  });
  const o = await Zs(r, s);
  n("info", `Pre-repair snapshot created: ${o}`, { snapshotPath: o });
  const c = e.actions.filter((y) => y.autoRepairSafe && !y.manualReviewRequired), a = e.actions.length - c.length, u = { value: await wt(r) }, l = [], f = [];
  for (const y of c)
    try {
      let I;
      switch (y.type) {
        case "reassign-krc-id":
          I = await qo(r, y, u, n);
          break;
        case "generate-executive-session":
          I = await Wo(r, y, n);
          break;
        case "add-registry-entry":
          I = await Yo(r, y, n);
          break;
        default:
          I = {
            actionId: y.id,
            type: y.type,
            success: !1,
            message: `Unsupported auto-repair action: ${y.type}`,
            filesChanged: []
          };
      }
      l.push(I), I.success && f.push(...I.filesChanged);
    } catch (I) {
      const A = I instanceof Error ? I.message : String(I);
      n("error", `Repair action failed: ${y.description} — ${A}`, {
        actionId: y.id,
        type: y.type
      }), l.push({
        actionId: y.id,
        type: y.type,
        success: !1,
        message: A,
        filesChanged: []
      });
    }
  const m = await ge(r);
  return n("info", "Post-repair health check complete", {
    duplicateIds: m.duplicateIds,
    issueCount: m.issues.length,
    ready: m.ready
  }), {
    completedAt: (/* @__PURE__ */ new Date()).toISOString(),
    snapshotPath: o,
    actionsExecuted: l,
    actionsSkipped: a,
    filesChanged: [...new Set(f)],
    healthBefore: i,
    healthAfter: m
  };
}
function Qo(e, t) {
  const n = `${e} ${t ?? ""}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)/.test(n) || n.includes("screenshot") ? "image" : /\.(mp4|webm|mov|m4v|avi)/.test(n) || n.includes("video") ? "video" : "other";
}
function ts(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function se(e, t, n, s) {
  return { id: e, title: t, items: n, emptyMessage: s };
}
function re(e, t, n) {
  return { label: e, explorerPath: t, ...n };
}
function ea(e) {
  var t, n, s;
  return e.kind === "executive_session" ? {
    krcId: ((t = e.session) == null ? void 0 : t.linkedKrcId) ?? e.repository.krcId,
    sourcePath: ((n = e.session) == null ? void 0 : n.transcriptReference) ?? ((s = e.session) == null ? void 0 : s.summaryReferences.find((r) => r.startsWith("Sources/"))) ?? e.repository.repositoryPath
  } : {
    krcId: e.repository.krcId,
    sourcePath: e.repository.repositoryPath
  };
}
function ta(e, t) {
  return e.records.filter((n) => n.repository.krcId === t);
}
function na(e, t) {
  return e.records.find((n) => n.id === t);
}
function sa(e, t) {
  return e.find((n) => n.kind === "source" && n.id === `${t}:source`);
}
function ra(e, t) {
  return e.find((n) => n.kind === "conversation" && n.id === `${t}:conversation`);
}
function ia(e, t) {
  if (t)
    return e.records.find((n) => {
      var s;
      return n.kind === "executive_session" && (((s = n.session) == null ? void 0 : s.linkedKrcId) === t || n.repository.krcId === t);
    });
}
function oa(e, t) {
  if (!t || !e.message)
    return !1;
  const n = t.toLowerCase();
  return e.message.text.toLowerCase().includes(n) || Te(t).some((s) => e.message.text.toLowerCase().includes(s));
}
function aa(e, t) {
  if (!t || !e.attachment)
    return !1;
  const n = t.toLowerCase(), s = e.attachment.filename.toLowerCase();
  return s.includes(n) || Te(t).some((r) => s.includes(r));
}
function ca(e, t, n, s, r) {
  const i = [];
  return i.push(`Evidence anchor: ${e.kind.replace(/_/g, " ")}`), t && i.push(`KRC ${t}`), n && i.push(`"${n}"`), s && i.push(`matched query "${s}"`), r != null && r.excerpt ? i.push(`Session summary: ${r.excerpt}`) : e.excerpt && i.push(e.excerpt), i.join(" · ");
}
function ua(e, t, n, s, r = 5) {
  var c;
  const i = /* @__PURE__ */ new Set([
    ...ze(n),
    ...s ? Te(s) : []
  ]);
  if (i.size === 0)
    return [];
  const o = [];
  for (const a of e.records) {
    if (a.kind !== "source" || a.repository.krcId === t)
      continue;
    const d = ((c = a.conversation) == null ? void 0 : c.title) ?? "";
    let l = ze(d).filter((f) => i.has(f)).length;
    s && d.toLowerCase().includes(s.toLowerCase()) && (l += 3), l > 0 && o.push({ record: a, score: l });
  }
  return o.sort((a, d) => {
    var u, l;
    return d.score - a.score || (((u = d.record.conversation) == null ? void 0 : u.title) ?? "").localeCompare(((l = a.record.conversation) == null ? void 0 : l.title) ?? "");
  }).slice(0, r).map((a) => a.record);
}
function da(e) {
  var n, s, r, i;
  let t = null;
  for (const o of e) {
    if (o.kind === "message" && o.message) {
      const c = o.message.timestamp ?? ((n = o.conversation) == null ? void 0 : n.updated) ?? "", a = ts(c);
      (!t || a >= t.ms) && (t = { record: o, timestamp: c, ms: a });
    }
    if (o.kind === "attachment" && ((s = o.attachment) != null && s.resolved)) {
      const c = ((r = o.conversation) == null ? void 0 : r.updated) ?? ((i = o.conversation) == null ? void 0 : i.created) ?? "", a = ts(c);
      (!t || a >= t.ms) && (t = { record: o, timestamp: c, ms: a });
    }
  }
  return t ? { record: t.record, timestamp: t.timestamp } : null;
}
function mr(e, t, n) {
  var E, R, T, U, D, $, O, M, K, G, B, V, J, ye, we, $e, _e, nt, Ne, st;
  const s = na(e, t);
  if (!s)
    return null;
  const { krcId: r, sourcePath: i } = ea(s), o = r ? ta(e, r) : [s], c = (r ? sa(o, r) : void 0) ?? e.records.find((P) => P.kind === "source" && P.repository.repositoryPath === i) ?? (s.kind === "source" ? s : void 0), a = r ? ra(o, r) : void 0, d = a ?? c, u = ia(e, r), l = ((E = a == null ? void 0 : a.conversation) == null ? void 0 : E.title) ?? ((R = d == null ? void 0 : d.conversation) == null ? void 0 : R.title) ?? ((T = s.conversation) == null ? void 0 : T.title) ?? ((U = c == null ? void 0 : c.conversation) == null ? void 0 : U.title) ?? "Untitled", f = o.filter((P) => P.kind === "message").sort((P, z) => {
    var Le, Pe;
    const Y = Number(((Le = P.message) == null ? void 0 : Le.messageId.split(":msg:")[1]) ?? 0), bn = Number(((Pe = z.message) == null ? void 0 : Pe.messageId.split(":msg:")[1]) ?? 0);
    return Y - bn;
  }), m = o.filter((P) => P.kind === "attachment"), y = ua(e, r, l, n), I = da(o), A = ca(s, r, l, n, u), C = se("sourceFile", "Source File", [
    re((c == null ? void 0 : c.repository.repositoryPath.split("/").pop()) ?? i, i, {
      recordId: c == null ? void 0 : c.id,
      kind: "source",
      subtitle: r,
      highlighted: s.kind === "source"
    })
  ]), b = se("conversation", "Conversation", d ? [
    re(l, i, {
      recordId: (a == null ? void 0 : a.id) ?? (c == null ? void 0 : c.id),
      kind: (a == null ? void 0 : a.kind) ?? "conversation",
      subtitle: [
        (D = d.conversation) == null ? void 0 : D.conversationId,
        ($ = d.conversation) != null && $.created ? `Created ${d.conversation.created}` : void 0,
        (O = d.conversation) != null && O.updated ? `Updated ${d.conversation.updated}` : void 0
      ].filter(Boolean).join(" · "),
      highlighted: s.kind === "conversation"
    })
  ] : [], "No conversation metadata indexed."), x = se("messages", "Messages", f.map((P) => {
    var z, Y;
    return re(`${((z = P.message) == null ? void 0 : z.role) ?? "Message"}: ${P.excerpt}`, i, {
      recordId: P.id,
      kind: "message",
      subtitle: (Y = P.message) == null ? void 0 : Y.timestamp,
      highlighted: P.id === s.id || oa(P, n)
    });
  }), "No messages indexed."), h = se("attachments", "Attachments", m.map((P) => {
    var Le, Pe, An;
    const z = ((Le = P.attachment) == null ? void 0 : Le.filename) ?? "Attachment", Y = Qo(z, (Pe = P.attachment) == null ? void 0 : Pe.assetPath);
    return re(`${Y === "image" ? "Screenshot" : Y === "video" ? "Video" : "File"}: ${z}`, i, {
      recordId: P.id,
      kind: "attachment",
      subtitle: (An = P.attachment) != null && An.resolved ? P.attachment.assetPath : "Unresolved reference",
      highlighted: P.id === s.id || aa(P, n)
    });
  }), "No attachments indexed."), p = se("executiveSession", "Executive Session", u ? [
    re(((M = u.conversation) == null ? void 0 : M.title) ?? ((K = u.session) == null ? void 0 : K.sessionId) ?? "Session", u.repository.repositoryPath, {
      recordId: u.id,
      kind: "executive_session",
      subtitle: (G = u.session) == null ? void 0 : G.linkedKrcId,
      highlighted: s.kind === "executive_session"
    })
  ] : [], "No executive session indexed for this KRC."), v = se("relatedSources", "Related Sources", y.map((P) => {
    var z;
    return re(((z = P.conversation) == null ? void 0 : z.title) ?? P.repository.krcId ?? P.repository.repositoryPath, P.repository.repositoryPath, {
      recordId: P.id,
      kind: "source",
      subtitle: P.repository.krcId
    });
  }), "No related sources found."), g = [];
  if (g.push({
    kind: "conversation",
    label: l,
    subtitle: r,
    timestamp: ((B = a == null ? void 0 : a.conversation) == null ? void 0 : B.updated) ?? ((V = a == null ? void 0 : a.conversation) == null ? void 0 : V.created),
    explorerPath: i,
    recordId: a == null ? void 0 : a.id
  }), u && g.push({
    kind: "executive_session",
    label: ((J = u.conversation) == null ? void 0 : J.title) ?? "Executive Session",
    subtitle: (ye = u.session) == null ? void 0 : ye.linkedKrcId,
    timestamp: (we = u.conversation) == null ? void 0 : we.created,
    explorerPath: u.repository.repositoryPath,
    recordId: u.id
  }), g.push({
    kind: "related_sources",
    label: y.length > 0 ? `${y.length} related source${y.length === 1 ? "" : "s"}` : "No related sources",
    subtitle: y.slice(0, 3).map((P) => P.repository.krcId).filter(Boolean).join(", "),
    explorerPath: (($e = y[0]) == null ? void 0 : $e.repository.repositoryPath) ?? i,
    recordId: (_e = y[0]) == null ? void 0 : _e.id
  }), I) {
    const P = I.record.kind === "message" ? `${(nt = I.record.message) == null ? void 0 : nt.role}: ${I.record.excerpt}` : ((Ne = I.record.attachment) == null ? void 0 : Ne.filename) ?? I.record.excerpt;
    g.push({
      kind: "newest_evidence",
      label: P,
      timestamp: I.timestamp || void 0,
      explorerPath: i,
      recordId: I.record.id
    });
  } else
    g.push({
      kind: "newest_evidence",
      label: s.excerpt || l,
      timestamp: (st = a == null ? void 0 : a.conversation) == null ? void 0 : st.updated,
      explorerPath: i,
      recordId: s.id
    });
  const w = se("timeline", "Timeline", g.map((P) => re(P.label, P.explorerPath, {
    recordId: P.recordId,
    subtitle: [P.subtitle, P.timestamp].filter(Boolean).join(" · ")
  })));
  return {
    anchorRecordId: t,
    anchorKrcId: r,
    anchorSourcePath: i,
    query: n,
    decisionSummary: A,
    sections: {
      decisionSummary: se("decisionSummary", "Decision Summary", [
        re(A, i, { highlighted: !0 })
      ]),
      sourceFile: C,
      conversation: b,
      messages: x,
      attachments: h,
      executiveSession: p,
      relatedSources: v,
      timeline: w
    },
    timeline: g
  };
}
async function la(e, t, n) {
  const s = await xe(e);
  return mr(s, t, n);
}
const fa = {
  mock: "Here's what I found:",
  openai: "OpenAI summary:",
  claude: "Claude read on this:",
  gemini: "Gemini analysis:",
  openrouter: "OpenRouter synthesis:",
  ollama: "Local model view:"
}, pa = {
  mock: "Supporting detail:",
  openai: "GPT rationale:",
  claude: "Claude reasoning:",
  gemini: "Gemini context:",
  openrouter: "Router notes:",
  ollama: "Local notes:"
};
function Ce(e, t, n) {
  const s = e.groundedAnswer.directAnswer.trim(), r = e.groundedAnswer.reasonedSummary.trim(), i = fa[t], o = pa[t], c = /^here'?s what i found/i.test(s) ? s.replace(/^here'?s what i found:?\s*/i, `${i} `) : `${i} ${s}`;
  return {
    providerId: t,
    model: n ?? "offline",
    directAnswer: c,
    reasonedSummary: `${o} ${r}`,
    usedOfflineFallback: !0
  };
}
function ma(e) {
  const { context: t, groundedAnswer: n } = e, s = n.evidenceUsed.slice(0, 8).map((r) => `- ${r.label}: ${r.excerpt}`);
  return [
    "You are Vigsy, a grounded knowledge assistant.",
    "Use ONLY the curated evidence below. Do not invent facts or citations.",
    'Return JSON: {"directAnswer":"...","reasonedSummary":"..."}',
    "",
    `Question: ${t.question}`,
    t.campaign ? `Campaign: ${t.campaign}` : "",
    t.objective ? `Objective: ${t.objective}` : "",
    t.blockers.length ? `Blockers: ${t.blockers.join("; ")}` : "",
    t.accomplishments.length ? `Accomplishments: ${t.accomplishments.join("; ")}` : "",
    "",
    "Evidence:",
    ...s,
    "",
    `Deterministic draft answer: ${n.directAnswer}`
  ].filter(Boolean).join(`
`);
}
async function ha(e) {
  const t = e.trim();
  try {
    const s = JSON.parse(t);
    if (s.directAnswer && s.reasonedSummary)
      return { directAnswer: s.directAnswer, reasonedSummary: s.reasonedSummary };
  } catch {
  }
  const n = t.match(/\{[\s\S]*\}/);
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
function ga() {
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
    async reason(e) {
      return Ce(e, "mock");
    }
  };
}
function ya() {
  return {
    capabilities: {
      id: "deterministic",
      displayName: "Deterministic (no AI)",
      supportsStreaming: !1,
      supportsTools: !1,
      requiresApiKey: !1,
      offline: !0
    },
    async reason(e) {
      return {
        providerId: "deterministic",
        model: "deterministic",
        directAnswer: e.groundedAnswer.directAnswer,
        reasonedSummary: e.groundedAnswer.reasonedSummary
      };
    }
  };
}
function Xe(e, t, n, s, r, i, o) {
  return {
    capabilities: {
      id: e,
      displayName: t,
      supportsStreaming: !1,
      supportsTools: !1,
      requiresApiKey: o,
      offline: !1,
      defaultModel: n
    },
    async reason(c, a) {
      const d = (a == null ? void 0 : a.model) ?? n;
      if (!(a != null && a.apiKey) && o)
        return Ce(c, e, d);
      const u = ma(c);
      try {
        const l = { "Content-Type": "application/json" };
        e === "claude" && (a != null && a.apiKey) ? (l["x-api-key"] = a.apiKey, l["anthropic-version"] = "2023-06-01") : a != null && a.apiKey && (l.Authorization = `Bearer ${a.apiKey}`);
        const f = await fetch(s(a ?? {}), {
          method: "POST",
          headers: l,
          body: JSON.stringify(r(u, d))
        });
        if (!f.ok)
          return { ...Ce(c, e, d), usedOfflineFallback: !0 };
        const m = await f.json(), y = i(m), I = y ? await ha(y) : null;
        return I ? {
          providerId: e,
          model: d,
          directAnswer: I.directAnswer,
          reasonedSummary: I.reasonedSummary
        } : { ...Ce(c, e, d), usedOfflineFallback: !0 };
      } catch {
        return { ...Ce(c, e, d), usedOfflineFallback: !0 };
      }
    }
  };
}
const wa = Xe("openai", "OpenAI", "gpt-4o-mini", () => "https://api.openai.com/v1/chat/completions", (e, t) => ({
  model: t,
  messages: [
    { role: "system", content: "Respond with JSON only." },
    { role: "user", content: e }
  ],
  temperature: 0.2
}), (e) => {
  var n, s, r;
  return ((r = (s = (n = e.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), va = Xe("claude", "Claude", "claude-3-5-haiku-latest", () => "https://api.anthropic.com/v1/messages", (e, t) => ({
  model: t,
  max_tokens: 1024,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n, s;
  return ((s = (n = e.content) == null ? void 0 : n[0]) == null ? void 0 : s.text) ?? null;
}, !0), Ia = Xe("gemini", "Gemini", "gemini-1.5-flash", (e) => `https://generativelanguage.googleapis.com/v1beta/models/${e.model ?? "gemini-1.5-flash"}:generateContent?key=${e.apiKey ?? ""}`, (e) => ({
  contents: [{ parts: [{ text: e }] }]
}), (e) => {
  var n, s, r, i, o;
  return ((o = (i = (r = (s = (n = e.candidates) == null ? void 0 : n[0]) == null ? void 0 : s.content) == null ? void 0 : r.parts) == null ? void 0 : i[0]) == null ? void 0 : o.text) ?? null;
}, !0), Sa = Xe("openrouter", "OpenRouter", "openai/gpt-4o-mini", () => "https://openrouter.ai/api/v1/chat/completions", (e, t) => ({
  model: t,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n, s, r;
  return ((r = (s = (n = e.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), Ea = Xe("ollama", "Local (Ollama)", "llama3.2", (e) => `${e.baseUrl ?? "http://127.0.0.1:11434"}/api/chat`, (e, t) => ({
  model: t,
  stream: !1,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n;
  return ((n = e.message) == null ? void 0 : n.content) ?? null;
}, !1);
function Ca(e, t, n) {
  return {
    providerId: e,
    status: "offline",
    message: "Provider runs in offline mode (no API key required).",
    supportsStreaming: t,
    secureStorage: n
  };
}
function ns(e, t, n) {
  return {
    providerId: e,
    status: "missing_key",
    message: "API key is not configured. Using fallback responses.",
    supportsStreaming: t,
    secureStorage: n
  };
}
async function Ra(e, t, n, s, r) {
  try {
    const i = await fetch(t, {
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
      providerId: e,
      status: "connected",
      message: "Provider responded successfully.",
      supportsStreaming: s,
      secureStorage: r
    } : {
      providerId: e,
      status: "unavailable",
      message: `Provider returned HTTP ${i.status}.`,
      supportsStreaming: s,
      secureStorage: r
    };
  } catch (i) {
    return {
      providerId: e,
      status: "unavailable",
      message: i instanceof Error ? i.message : "Provider unreachable.",
      supportsStreaming: s,
      secureStorage: r
    };
  }
}
async function ss(e, t, n, s) {
  if (s.offline || e === "mock" || e === "deterministic")
    return Ca(e, s.supportsStreaming, n);
  if (s.requiresApiKey && !(t != null && t.apiKey))
    return ns(e, s.supportsStreaming, n);
  if (e === "openai" || e === "openrouter")
    return Ra(e, e === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", (t == null ? void 0 : t.apiKey) ?? "", s.supportsStreaming, n);
  if (e === "ollama") {
    const r = (t == null ? void 0 : t.baseUrl) ?? "http://127.0.0.1:11434";
    try {
      if ((await fetch(`${r}/api/tags`)).ok)
        return {
          providerId: e,
          status: "connected",
          message: "Ollama is reachable.",
          supportsStreaming: s.supportsStreaming,
          secureStorage: n
        };
    } catch {
    }
    return {
      providerId: e,
      status: "unavailable",
      message: "Ollama is not reachable at the configured base URL.",
      supportsStreaming: s.supportsStreaming,
      secureStorage: n
    };
  }
  return t != null && t.apiKey ? {
    providerId: e,
    status: "connected",
    message: "API key configured. Live verification skipped for this provider.",
    supportsStreaming: s.supportsStreaming,
    secureStorage: n
  } : ns(e, s.supportsStreaming, n);
}
function pt(e, t, n, s) {
  const r = n.split(/(\s+)/);
  for (const i of r)
    i && s({ kind: "token", text: i, providerId: e });
  s({ kind: t, text: n, providerId: e });
}
async function ka(e, t, n, s) {
  return {
    providerId: e,
    directAnswer: t,
    reasonedSummary: n,
    usedOfflineFallback: s
  };
}
function Ee(e) {
  return e.reasonStream ? e : {
    ...e,
    capabilities: { ...e.capabilities, supportsStreaming: !0 },
    async reasonStream(t, n, s) {
      const r = await e.reason(t, n);
      return pt(r.providerId, "direct_answer", r.directAnswer, s), pt(r.providerId, "summary", r.reasonedSummary, s), s({ kind: "done", text: "", providerId: r.providerId }), r;
    }
  };
}
function ba(e) {
  return {
    ...e,
    capabilities: { ...e.capabilities, supportsStreaming: !0 },
    async reasonStream(t, n, s) {
      const r = Ce(t, "mock");
      return pt("mock", "direct_answer", r.directAnswer, s), pt("mock", "summary", r.reasonedSummary, s), s({ kind: "done", text: "", providerId: "mock" }), ka("mock", r.directAnswer, r.reasonedSummary, !0);
    }
  };
}
class Aa {
  constructor(t) {
    _(this, "providers", /* @__PURE__ */ new Map());
    _(this, "activeId", "mock");
    _(this, "credentials", {});
    _(this, "secureStorageMode", "dev_fallback");
    for (const n of t ?? Ta())
      this.providers.set(n.capabilities.id, Ee(n));
  }
  register(t) {
    this.providers.set(t.capabilities.id, t);
  }
  setActive(t) {
    if (!this.providers.has(t))
      throw new Error(`Unknown AI provider: ${t}`);
    this.activeId = t;
  }
  getActiveId() {
    return this.activeId;
  }
  getActive() {
    const t = this.providers.get(this.activeId);
    if (!t)
      throw new Error(`Active provider not registered: ${this.activeId}`);
    return t;
  }
  setCredentials(t) {
    this.credentials = { ...t };
  }
  setSecureStorageMode(t) {
    this.secureStorageMode = t;
  }
  listCapabilities() {
    return [...this.providers.values()].map((t) => t.capabilities);
  }
  async reason(t) {
    return this.getActive().reason(t, this.credentials);
  }
  async reasonStream(t, n) {
    const s = this.getActive();
    if (this.credentials.streaming && s.reasonStream)
      return s.reasonStream(t, this.credentials, n);
    const r = await s.reason(t, this.credentials);
    return n({ kind: "direct_answer", text: r.directAnswer, providerId: r.providerId }), n({ kind: "summary", text: r.reasonedSummary, providerId: r.providerId }), n({ kind: "done", text: "", providerId: r.providerId }), r;
  }
  async testActiveProviderHealth() {
    const t = this.getActive();
    return ss(t.capabilities.id, this.credentials, this.secureStorageMode, t.capabilities);
  }
  async testProviderHealth(t) {
    const n = this.providers.get(t);
    if (!n)
      throw new Error(`Unknown AI provider: ${t}`);
    return ss(t, this.credentials, this.secureStorageMode, n.capabilities);
  }
}
function Ta() {
  return [
    ya(),
    ba(ga()),
    Ee(wa),
    Ee(va),
    Ee(Ia),
    Ee(Sa),
    Ee(Ea)
  ];
}
function xa() {
  return new Aa();
}
let jt = null;
function Ke() {
  return jt || (jt = xa()), jt;
}
function Da(e, t) {
  return {
    question: e.question,
    intent: e.intent,
    searchQuery: e.searchQuery,
    directAnswer: t.directAnswer.trim() || e.directAnswer,
    reasonedSummary: t.reasonedSummary.trim() || e.reasonedSummary,
    evidenceUsed: e.evidenceUsed,
    confidence: e.confidence,
    timeline: e.timeline,
    relatedSources: e.relatedSources,
    attachments: e.attachments,
    explorerLinks: e.explorerLinks,
    relationshipInsights: e.relationshipInsights
  };
}
function Ge(e) {
  return e.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function $a(e, t, n) {
  return `${Ge(e)}::${t}::${Ge(n)}`;
}
function X(e, t, n) {
  const s = $a(n.fromId, n.relationshipType, n.toId);
  t.has(s) || (t.add(s), e.push({ ...n, relationshipId: s, createdAutomatically: !0 }));
}
function _a(e) {
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
function rs(e) {
  return e.find((t) => t.kind === "conversation") ?? e.find((t) => t.kind === "source");
}
function Na(e) {
  var n, s;
  const t = [(n = e.conversation) == null ? void 0 : n.title, e.excerpt, (s = e.message) == null ? void 0 : s.text].filter(Boolean).join(" ");
  return new Set(ze(t));
}
function La(e, t) {
  return [...e].filter((n) => t.has(n));
}
function Pa(e) {
  const t = e.match(/Campaign\s+[\d.]+[a-z]?/gi) ?? [];
  return [...new Set(t.map((n) => n.trim()))];
}
function at(e, t, n, s) {
  const r = new Map(e.map((d) => [d.id, d])), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const d of e) {
    const u = Na(d);
    o.set(d.id, u);
    for (const l of u) {
      if (l.length < 4)
        continue;
      const f = i.get(l) ?? [];
      f.push(d.id), i.set(l, f);
    }
  }
  const c = /* @__PURE__ */ new Map(), a = s.maxBucketSize ?? 20;
  for (const d of i.values())
    if (!(d.length < 2 || d.length > a))
      for (let u = 0; u < d.length; u++)
        for (let l = u + 1; l < d.length; l++) {
          const f = d[u] < d[l] ? `${d[u]}|${d[l]}` : `${d[l]}|${d[u]}`;
          c.set(f, (c.get(f) ?? 0) + 1);
        }
  for (const [d, u] of c) {
    if (u < s.minShared)
      continue;
    const [l, f] = d.split("|"), m = r.get(l), y = r.get(f);
    if (!m || !y || s.skipSameKrc && m.repository.krcId === y.repository.krcId)
      continue;
    const I = La(o.get(l) ?? /* @__PURE__ */ new Set(), o.get(f) ?? /* @__PURE__ */ new Set());
    X(t, n, {
      fromId: m.id,
      toId: y.id,
      relationshipType: s.relationshipType,
      reason: `${s.reasonPrefix}: ${I.slice(0, 4).join(", ")}`,
      confidence: Math.min(s.maxConfidence, 35 + u * 10),
      supportingEvidenceIds: [m.id, y.id]
    });
  }
}
function Fa(e) {
  var t;
  return (t = e.session) != null && t.summaryReferences ? e.session.summaryReferences.filter((n) => n.length > 2 && !n.startsWith("Sources/")).slice(0, 8) : [];
}
function Oa(e) {
  var f, m, y, I, A, C, b, x, h;
  const t = [], n = /* @__PURE__ */ new Set(), s = _a(e), r = /* @__PURE__ */ new Map();
  for (const p of e.records)
    p.kind === "executive_session" && ((f = p.session) != null && f.linkedKrcId) && r.set(p.session.linkedKrcId, p);
  for (const [p, v] of s.entries()) {
    const g = rs(v), w = v.find((T) => T.kind === "source"), E = v.filter((T) => T.kind === "attachment");
    g && w && X(t, n, {
      fromId: g.id,
      toId: w.id,
      relationshipType: "conversation_source",
      reason: `Shared KRC ${p}`,
      confidence: 98,
      supportingEvidenceIds: [g.id, w.id]
    });
    const R = r.get(p);
    g && R && (X(t, n, {
      fromId: g.id,
      toId: R.id,
      relationshipType: "conversation_executive_session",
      reason: `Executive session linked to ${p}`,
      confidence: 95,
      supportingEvidenceIds: [g.id, R.id]
    }), w && X(t, n, {
      fromId: R.id,
      toId: w.id,
      relationshipType: "executive_session_source",
      reason: `Transcript reference for ${p}`,
      confidence: 96,
      supportingEvidenceIds: [R.id, w.id]
    }));
    for (const T of E)
      g && (X(t, n, {
        fromId: T.id,
        toId: g.id,
        relationshipType: "attachment_conversation",
        reason: `Attachment linked to conversation ${p}`,
        confidence: (m = T.attachment) != null && m.resolved ? 90 : 70,
        supportingEvidenceIds: [T.id, g.id]
      }), X(t, n, {
        fromId: g.id,
        toId: T.id,
        relationshipType: "conversation_attachment",
        reason: `Conversation references attachment in ${p}`,
        confidence: (y = T.attachment) != null && y.resolved ? 88 : 68,
        supportingEvidenceIds: [g.id, T.id]
      })), w && X(t, n, {
        fromId: T.id,
        toId: w.id,
        relationshipType: "attachment_source",
        reason: `Attachment referenced by source ${p}`,
        confidence: (I = T.attachment) != null && I.resolved ? 92 : 72,
        supportingEvidenceIds: [T.id, w.id]
      });
  }
  const i = [];
  for (const [, p] of s.entries()) {
    const v = rs(p);
    v && i.push(v);
  }
  at(i, t, n, {
    relationshipType: "conversation_conversation",
    reasonPrefix: "Shared title concepts",
    minShared: 2,
    maxConfidence: 85,
    skipSameKrc: !1
  });
  const o = e.records.filter((p) => p.kind === "executive_session");
  at(o, t, n, {
    relationshipType: "executive_session_executive_session",
    reasonPrefix: "Shared session topics",
    minShared: 2,
    maxConfidence: 80,
    skipSameKrc: !1
  });
  const c = e.records.filter((p) => {
    var g;
    if (p.kind === "executive_session")
      return !0;
    const v = `${p.excerpt} ${((g = p.message) == null ? void 0 : g.text) ?? ""}`.toLowerCase();
    return /\b(decision|decided|agreed|conclusion)\b/.test(v);
  });
  at(c, t, n, {
    relationshipType: "decision_decision",
    reasonPrefix: "Shared decision language",
    minShared: 2,
    maxConfidence: 78,
    skipSameKrc: !0,
    maxBucketSize: 25
  }), at(i, t, n, {
    relationshipType: "topic_topic",
    reasonPrefix: "Shared topic",
    minShared: 1,
    maxConfidence: 65,
    skipSameKrc: !1,
    maxBucketSize: 12
  });
  const a = /* @__PURE__ */ new Map();
  for (const p of e.records) {
    const v = [p.excerpt, (A = p.message) == null ? void 0 : A.text, (C = p.conversation) == null ? void 0 : C.title].filter(Boolean).join(" ");
    for (const g of Pa(v)) {
      const w = Ge(g), E = a.get(w) ?? [];
      E.push(p), a.set(w, E);
    }
  }
  for (const [p, v] of a.entries()) {
    const g = [...new Map(v.map((w) => [w.id, w])).values()];
    if (!(g.length < 2 || g.length > 30))
      for (let w = 0; w < g.length; w++)
        for (let E = w + 1; E < g.length; E++)
          X(t, n, {
            fromId: g[w].id,
            toId: g[E].id,
            relationshipType: "campaign_campaign",
            reason: `Shared campaign reference (${p.replace(/-/g, " ")})`,
            confidence: 82,
            supportingEvidenceIds: [g[w].id, g[E].id]
          });
  }
  const d = /* @__PURE__ */ new Map();
  for (const p of o)
    for (const v of Fa(p)) {
      const g = Ge(v), w = d.get(g) ?? [];
      w.push(p), d.set(g, w);
    }
  for (const [, p] of d.entries())
    if (!(p.length < 2))
      for (let v = 0; v < p.length; v++)
        for (let g = v + 1; g < p.length; g++)
          X(t, n, {
            fromId: p[v].id,
            toId: p[g].id,
            relationshipType: "capability_capability",
            reason: `Shared capability "${((b = p[v].conversation) == null ? void 0 : b.title) ?? "capability"}"`,
            confidence: 72,
            supportingEvidenceIds: [p[v].id, p[g].id]
          });
  const u = e.records.filter((p) => p.kind === "attachment"), l = /* @__PURE__ */ new Map();
  for (const p of u) {
    const v = Ge(((x = p.attachment) == null ? void 0 : x.filename) ?? p.excerpt), g = l.get(v) ?? [];
    g.push(p), l.set(v, g);
  }
  for (const [, p] of l.entries())
    if (!(p.length < 2))
      for (let v = 0; v < p.length; v++)
        for (let g = v + 1; g < p.length; g++)
          p[v].repository.krcId !== p[g].repository.krcId && X(t, n, {
            fromId: p[v].id,
            toId: p[g].id,
            relationshipType: "attachment_conversation",
            reason: `Shared attachment filename "${((h = p[v].attachment) == null ? void 0 : h.filename) ?? "file"}"`,
            confidence: 74,
            supportingEvidenceIds: [p[v].id, p[g].id]
          });
  return t;
}
const Ua = "relationship-index.json", Ma = 1;
function Et(e) {
  return S.join(e, Ae, Ua);
}
async function hr(e) {
  try {
    const t = await k.readFile(Et(e), "utf8"), n = JSON.parse(t);
    return n.version !== Ma || !Array.isArray(n.relationships) ? null : n;
  } catch {
    return null;
  }
}
async function ja(e, t) {
  const n = S.join(e, Ae);
  await k.mkdir(n, { recursive: !0 });
  const s = Et(e);
  return await k.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
function Ba(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function Ka(e, t) {
  return {
    recordId: e.id,
    label: Ba(e),
    excerpt: e.excerpt,
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind,
    relationshipType: t.relationshipType,
    reason: t.reason,
    confidence: t.confidence
  };
}
function Ga(e, t) {
  return e.records.find((n) => n.id === t) ?? e.records.find((n) => n.repository.krcId === t) ?? e.records.find((n) => n.id.startsWith(`${t}:`));
}
async function be(e) {
  const t = await xe(e), n = Oa(t), s = (/* @__PURE__ */ new Date()).toISOString(), r = {
    version: 1,
    repositoryPath: e,
    builtAt: s,
    relationshipCount: n.length,
    relationships: n
  };
  return await ja(e, r), r;
}
async function Ze(e) {
  const t = await hr(e);
  return t && t.repositoryPath === e ? t : be(e);
}
function za(e) {
  const t = {};
  for (const n of e.relationships)
    t[n.relationshipType] = (t[n.relationshipType] ?? 0) + 1;
  return {
    builtAt: e.builtAt,
    relationshipCount: e.relationshipCount,
    byType: t
  };
}
function Wt(e, t, n = 50) {
  const s = Te(t), r = t.toLowerCase(), i = [];
  for (const o of e.relationships) {
    const c = `${o.fromId} ${o.toId} ${o.relationshipType} ${o.reason}`.toLowerCase();
    let a = 0;
    c.includes(r) && (a += 20), a += s.filter((d) => c.includes(d)).length * 8, a > 0 && i.push({ rel: o, score: a });
  }
  return i.sort((o, c) => c.score - o.score || c.rel.confidence - o.rel.confidence).slice(0, n).map((o) => o.rel);
}
function gr(e, t) {
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
async function yr(e, t, n, s = 20) {
  const [r, i] = await Promise.all([
    xe(e),
    Ze(e)
  ]);
  let o = gr(i, t);
  o.length === 0 && n && (o = Wt(i, n, s * 3)), o.length === 0 && (o = Wt(i, t, s * 3));
  const c = [], a = /* @__PURE__ */ new Set();
  for (const d of o.sort((u, l) => l.confidence - u.confidence)) {
    const u = d.fromId === t || d.supportingEvidenceIds[0] === t ? d.toId : d.fromId, l = Ga(r, u);
    if (!(!l || a.has(l.id)) && (a.add(l.id), c.push(Ka(l, d)), c.length >= s))
      break;
  }
  return c;
}
function Ha(e) {
  const t = [], n = [], s = [], r = [], i = [];
  for (const o of e)
    o.relationshipType === "decision_decision" && t.push(o), (o.relationshipType === "conversation_conversation" || o.relationshipType === "conversation_source" || o.kind === "conversation" || o.kind === "source") && n.push(o), o.relationshipType === "campaign_campaign" && s.push(o), (o.relationshipType === "attachment_source" || o.relationshipType === "attachment_conversation" || o.relationshipType === "conversation_attachment" || o.kind === "attachment") && r.push(o), (o.relationshipType === "conversation_executive_session" || o.relationshipType === "executive_session_executive_session" || o.relationshipType === "executive_session_source" || o.kind === "executive_session") && i.push(o);
  return {
    relatedDecisions: t,
    relatedConversations: n,
    relatedCampaigns: s,
    relatedAttachments: r,
    relatedExecutiveSessions: i
  };
}
const Za = [
  /\bwhat did we decide\b/i,
  /\bwhat was decided\b/i,
  /\bour decision\b/i,
  /\bdecide about\b/i
], Va = [/\bsummarize\b/i, /\bsummary of\b/i, /\bgive me an overview\b/i], qa = [
  /\bshow evidence\b/i,
  /\bprove that\b/i,
  /\bevidence that\b/i,
  /\bdemonstrate\b/i
], Wa = [
  /\bblockers?\b/i,
  /\bunresolved\b/i,
  /\bremaining\b/i,
  /\bissues?\b/i,
  /\brisks?\b/i,
  /\btodo\b/i,
  /\bopen problems?\b/i
], Ya = [
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
function wr(e) {
  const t = e.trim();
  return Za.some((n) => n.test(t)) ? "decision" : Va.some((n) => n.test(t)) ? "summarize" : qa.some((n) => n.test(t)) ? "show_evidence" : Wa.some((n) => n.test(t)) ? "blockers" : "general";
}
function Ja(e) {
  let t = e.trim();
  for (const n of Ya)
    t = t.replace(n, "");
  return t = t.replace(/\b(in kae|for kae)\b/gi, "").trim(), t || e.trim();
}
const Xa = ["decided", "decision", "agreed", "conclusion", "resolved", "plan"], Qa = [
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
function gn(e) {
  const t = e.toLowerCase();
  return Qa.some((n) => t.includes(n));
}
function Ct(e) {
  const t = e.toLowerCase();
  return Xa.some((n) => t.includes(n));
}
function ec(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function mt(e) {
  var t, n, s;
  return ec(((t = e.message) == null ? void 0 : t.timestamp) ?? ((n = e.conversation) == null ? void 0 : n.updated) ?? ((s = e.conversation) == null ? void 0 : s.created));
}
function yn(e) {
  var t, n, s, r;
  return [
    e.excerpt,
    (t = e.message) == null ? void 0 : t.text,
    (n = e.conversation) == null ? void 0 : n.title,
    (r = (s = e.session) == null ? void 0 : s.summaryReferences) == null ? void 0 : r.join(" ")
  ].filter(Boolean).join(" ");
}
function vr(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function wn(e) {
  return {
    recordId: e.id,
    label: vr(e),
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind
  };
}
function Ir(e) {
  return {
    label: e.message,
    explorerPath: e.relativePath ?? "Registries/SOURCE_REGISTRY.md"
  };
}
function tc(e) {
  return e.kind === "executive_session" ? 92 : Ct(yn(e)) ? 78 : 65;
}
function is(e, t) {
  return e.find((n) => n.id === t) ?? e.find((n) => n.repository.krcId === t) ?? e.find((n) => t.startsWith(n.repository.krcId ?? ""));
}
function nc(e) {
  const t = e.filter((r) => {
    const i = yn(r);
    return r.kind === "executive_session" || Ct(i);
  }).sort((r, i) => mt(i) - mt(r)).slice(0, 4), n = t[0], s = n ? tc(n) : 50;
  return {
    cardId: "recent-decisions",
    category: "recent_decision",
    title: "Recent Decisions",
    summary: n ? `${vr(n)} — ${n.excerpt.slice(0, 140)}${n.excerpt.length > 140 ? "…" : ""}` : "No indexed decision evidence found yet.",
    whyItMatters: "Recent decisions anchor what the team agreed to and what Vigsy can ground answers on.",
    confidence: s,
    evidenceLinks: t.map(wn)
  };
}
function sc(e, t) {
  const n = t.issues.filter((a) => a.severity === "error" || a.severity === "warning"), s = e.filter((a) => gn(yn(a))).sort((a, d) => mt(d) - mt(a)).slice(0, 4), r = [
    ...n.slice(0, 2).map(Ir),
    ...s.map(wn)
  ], i = /* @__PURE__ */ new Set(), o = r.filter((a) => {
    const d = a.recordId ?? a.explorerPath;
    return i.has(d) ? !1 : (i.add(d), !0);
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
function rc(e) {
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
function ic(e) {
  const t = e.reason.match(/"([^"]+)"/);
  return (t == null ? void 0 : t[1]) ?? e.reason.replace(/^Shared (topic|campaign reference) /i, "").trim();
}
function oc(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const d of t) {
    if (d.relationshipType !== "campaign_campaign" && d.relationshipType !== "topic_topic" && d.relationshipType !== "conversation_conversation")
      continue;
    const u = ic(d), l = n.get(u);
    l ? l.count += 1 : n.set(u, { count: 1, rel: d });
  }
  const r = [...n.entries()].sort((d, u) => u[1].count - d[1].count)[0];
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
  const [i, { count: o, rel: c }] = r, a = is(e, c.toId) ?? is(e, c.fromId) ?? e[0];
  return {
    cardId: "high-relationship-topic",
    category: "high_relationship_topic",
    title: "High-Relationship Topic",
    summary: `"${i}" appears in ${o} indexed relationships.`,
    whyItMatters: "Topics with many relationships are strong anchors for executive awareness and follow-up questions.",
    confidence: Math.min(95, 60 + o * 3),
    evidenceLinks: a ? [wn(a)] : [
      {
        label: c.reason,
        explorerPath: c.supportingEvidenceIds[0] ?? "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
function ac(e) {
  const t = [];
  for (const i of e.categorizedIssues.recommendations.slice(0, 3))
    t.push({
      label: i.recovery ? `${i.message} — ${i.recovery}` : i.message,
      explorerPath: i.relativePath ?? "Registries/SOURCE_REGISTRY.md"
    });
  for (const i of e.issues.filter((o) => o.recovery).slice(0, 3)) {
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
function cc(e) {
  const t = e.statusLevel === "healthy" ? 93 : e.statusLevel === "attention" ? 78 : 62;
  return {
    cardId: "repository-health",
    category: "repository_health",
    title: "Repository Health",
    summary: e.statusHeadline,
    whyItMatters: e.statusSubline,
    confidence: t,
    evidenceLinks: e.issues.length > 0 ? e.issues.slice(0, 4).map(Ir) : [
      {
        label: "Repository structure verified",
        explorerPath: "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
async function Sr(e) {
  const [t, n, s, , r] = await Promise.all([
    xe(e),
    Ze(e),
    ge(e),
    or(e),
    Vs(e)
  ]), i = [
    nc(t.records),
    sc(t.records, s),
    rc(r),
    oc(t.records, n.relationships),
    ac(s),
    cc(s)
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
const uc = "executive-briefing-cache.json", Er = 1;
function Cr(e) {
  return S.join(e, Ae, uc);
}
async function dc(e) {
  const t = It(e), n = Et(e), [s, r] = await Promise.all([
    Qs(e),
    hr(e)
  ]);
  let i = 0, o = 0;
  try {
    i = (await k.stat(t)).mtimeMs;
  } catch {
  }
  try {
    o = (await k.stat(n)).mtimeMs;
  } catch {
  }
  return {
    evidenceIndexBuiltAt: (s == null ? void 0 : s.builtAt) ?? "",
    evidenceIndexMtimeMs: i,
    relationshipIndexBuiltAt: (r == null ? void 0 : r.builtAt) ?? "",
    relationshipIndexMtimeMs: o
  };
}
async function lc(e) {
  try {
    const t = await k.readFile(Cr(e), "utf8"), n = JSON.parse(t);
    return n.version !== Er || !n.briefing || !Array.isArray(n.briefing.cards) ? null : n;
  } catch {
    return null;
  }
}
async function Rr(e, t, n) {
  const s = await dc(e), r = {
    version: Er,
    repositoryPath: e,
    cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceIndexBuiltAt: s.evidenceIndexBuiltAt,
    evidenceIndexMtimeMs: s.evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: s.relationshipIndexBuiltAt,
    relationshipIndexMtimeMs: s.relationshipIndexMtimeMs,
    briefing: t
  }, i = S.join(e, Ae);
  await k.mkdir(i, { recursive: !0 });
  const o = Cr(e);
  return await k.writeFile(o, JSON.stringify(r, null, 2), "utf8"), o;
}
async function fc(e, t) {
  try {
    if ((await k.stat(It(e))).mtimeMs > t.evidenceIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  try {
    if ((await k.stat(Et(e))).mtimeMs > t.relationshipIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  return !1;
}
async function kr(e) {
  const t = await lc(e);
  if (!t || t.repositoryPath !== e) {
    const s = await Sr(e);
    return await Rr(e, s), { briefing: s, fromCache: !1, stale: !1 };
  }
  const n = await fc(e, t);
  return { briefing: t.briefing, fromCache: !0, stale: n };
}
async function Qe(e) {
  const t = await Sr(e);
  return await Rr(e, t), t;
}
const pc = "executive-memory", br = "Albert";
function Rt(e) {
  return S.join(e, ".kae-sessions", pc);
}
function Ar(e) {
  return S.join(Rt(e), "manifest.json");
}
function Yt(e, t) {
  return S.join(Rt(e), "sessions", `${t}.json`);
}
function Tr(e, t) {
  return S.join(Rt(e), "archive", `${t}.json`);
}
async function xr(e) {
  const t = Rt(e);
  await k.mkdir(S.join(t, "sessions"), { recursive: !0 }), await k.mkdir(S.join(t, "archive"), { recursive: !0 });
}
async function et(e) {
  try {
    const t = await k.readFile(Ar(e), "utf8"), n = JSON.parse(t);
    if (n.version === 1 && n.repositoryPath)
      return n;
  } catch {
  }
  return {
    version: 1,
    repositoryPath: e,
    founderName: br,
    sessions: []
  };
}
async function Dr(e, t) {
  await xr(e), await k.writeFile(Ar(e), JSON.stringify(t, null, 2), "utf8");
}
async function kt(e, t) {
  const s = (await et(e)).sessions.find((r) => r.conversationId === t);
  return s ? vn(e, s.sessionId) : null;
}
async function vn(e, t) {
  for (const n of [
    () => k.readFile(Yt(e, t), "utf8"),
    () => k.readFile(Tr(e, t), "utf8")
  ])
    try {
      const s = await n(), r = JSON.parse(s);
      if (r.sessionId && r.conversationId)
        return r;
    } catch {
    }
  return null;
}
async function $r(e) {
  const t = await et(e);
  return t.activeSessionId ? vn(e, t.activeSessionId) : null;
}
async function Ve(e, t, n) {
  await xr(e);
  const s = n != null && n.archive ? Tr(e, t.sessionId) : Yt(e, t.sessionId);
  if (await k.writeFile(s, JSON.stringify(t, null, 2), "utf8"), n != null && n.archive)
    try {
      await k.unlink(Yt(e, t.sessionId));
    } catch {
    }
}
function _r(e, t = "Vigsy conversation") {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    sessionId: W(),
    conversationId: e,
    lifecycle: "active",
    title: t,
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
async function ht(e, t, n = !0) {
  const s = await et(e);
  s.repositoryPath = e, s.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString(), n && (s.activeSessionId = t.sessionId);
  const r = s.sessions.findIndex((o) => o.sessionId === t.sessionId), i = {
    sessionId: t.sessionId,
    conversationId: t.conversationId,
    lifecycle: t.lifecycle,
    updatedAt: t.updatedAt
  };
  return r >= 0 ? s.sessions[r] = i : s.sessions.push(i), await Dr(e, s), s;
}
async function mc(e, t) {
  await Ze(e);
  const n = [
    ...t.evidenceUsed.map((u) => u.recordId),
    ...t.explorerLinks.map((u) => u.krcId).filter(Boolean)
  ], s = [...new Set(n)].slice(0, 5), r = [];
  for (const u of s) {
    const l = await yr(e, u, t.searchQuery, 12);
    r.push(...l);
  }
  const i = /* @__PURE__ */ new Map();
  for (const u of r) {
    const l = i.get(u.recordId);
    (!l || u.confidence > l.confidence) && i.set(u.recordId, u);
  }
  const o = Ha([...i.values()]), c = {
    relatedDecisions: o.relatedDecisions.slice(0, 6),
    relatedConversations: o.relatedConversations.slice(0, 6),
    relatedCampaigns: o.relatedCampaigns.slice(0, 6),
    relatedAttachments: o.relatedAttachments.slice(0, 6),
    relatedExecutiveSessions: o.relatedExecutiveSessions.slice(0, 6)
  }, a = [...t.relatedSources], d = new Set(a.map((u) => u.recordId));
  for (const u of o.relatedConversations.slice(0, 4))
    d.has(u.recordId) || (d.add(u.recordId), a.push({
      recordId: u.recordId,
      label: u.label,
      excerpt: u.excerpt,
      explorerPath: u.explorerPath,
      krcId: u.krcId,
      kind: u.kind
    }));
  return {
    ...t,
    relatedSources: a,
    relationshipInsights: c
  };
}
function hc(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function os(e) {
  var r, i, o;
  const t = ((r = e.message) == null ? void 0 : r.timestamp) ?? ((i = e.conversation) == null ? void 0 : i.updated) ?? ((o = e.conversation) == null ? void 0 : o.created) ?? "", n = hc(t);
  if (!n)
    return 0;
  const s = (Date.now() - n) / (1e3 * 60 * 60 * 24);
  return s < 30 ? 15 : s < 180 ? 8 : 0;
}
function gc(e, t, n) {
  var o, c, a, d, u, l;
  const s = [];
  let r = 0;
  const i = [
    e.excerpt,
    (o = e.message) == null ? void 0 : o.text,
    (c = e.conversation) == null ? void 0 : c.title,
    (d = (a = e.session) == null ? void 0 : a.summaryReferences) == null ? void 0 : d.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
  if (t === "decision" && (e.kind === "executive_session" && (r += 45, s.push("executive session")), e.kind === "message" && ((u = e.message) != null && u.role.toLowerCase().includes("assistant")) && (r += 20, s.push("assistant response")), Ct(i) && (r += 25, s.push("decision language")), r += os(e), os(e) > 0 && s.push("recent evidence")), t === "summarize" && ((e.kind === "conversation" || e.kind === "source") && (r += 30, s.push("conversation source")), e.kind === "executive_session" && (r += 25, s.push("session summary"))), t === "show_evidence") {
    if (e.kind === "attachment") {
      r += 50, s.push("attachment evidence");
      const f = ((l = e.attachment) == null ? void 0 : l.filename.toLowerCase()) ?? "";
      (f.includes("video") || /\.(mp4|webm|mov)/.test(f)) && (r += 30, s.push("video attachment")), (f.includes("screenshot") || /\.(png|jpe?g)/.test(f)) && (r += 20, s.push("image attachment"));
    }
    e.kind === "source" && (r += 25, s.push("source file")), e.kind === "message" && (r += 15, s.push("message evidence"));
  }
  return t === "blockers" && (gn(i) && (r += 50, s.push("blocker language")), (e.kind === "executive_session" || e.kind === "message") && (r += 15, s.push("narrative evidence"))), n.length > 1 && n.every((f) => i.includes(f)) && (r += 20, s.push("all query terms matched")), { boost: r, reasons: s };
}
function yc(e, t, n) {
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
function wc(e, t, n = 30) {
  var l;
  const s = wr(t), r = Ja(t), i = Te(r), o = nr(e, r, 80), c = new Map(e.records.map((f) => [f.id, f])), a = [];
  for (const f of o) {
    const m = c.get(f.recordId);
    if (!m)
      continue;
    const { boost: y, reasons: I } = gc(m, s, i);
    a.push({
      ...yc(f, m, I),
      score: f.score + y
    });
  }
  a.sort((f, m) => m.score - f.score);
  const d = [], u = /* @__PURE__ */ new Set();
  for (const f of a)
    if (!u.has(f.recordId) && (u.add(f.recordId), d.push(f), d.length >= n))
      break;
  if (s === "show_evidence") {
    const f = /video|mp4|webm|mov/i.test(r), m = d.some((y) => y.kind === "attachment");
    if (f && !m)
      for (const y of e.records) {
        if (y.kind !== "attachment" || !y.attachment)
          continue;
        const I = y.attachment.filename.toLowerCase();
        if (!(!I.includes("video") && !/\.(mp4|webm|mov|m4v)/.test(I)) && !u.has(y.id) && (u.add(y.id), d.push({
          recordId: y.id,
          kind: "attachment",
          score: 60,
          title: y.attachment.filename,
          excerpt: y.excerpt,
          explorerPath: y.repository.repositoryPath,
          krcId: y.repository.krcId,
          conversationTitle: (l = y.conversation) == null ? void 0 : l.title,
          matchReasons: ["video attachment scan"]
        }), d.filter((A) => A.kind === "attachment").length >= 5))
          break;
      }
  }
  return { intent: s, searchQuery: r, queryTerms: i, items: d };
}
function vc(e, t, n, s = 3) {
  const r = /* @__PURE__ */ new Set(), i = [];
  for (const o of t) {
    if (!o.krcId || r.has(o.krcId))
      continue;
    r.add(o.krcId);
    const c = t.find((d) => d.krcId === o.krcId);
    if (!c)
      continue;
    const a = mr(e, c.recordId, n);
    if (a && i.push(a), i.length >= s)
      break;
  }
  return i;
}
function Ic(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    !s.krcId || n.has(s.krcId) || (n.add(s.krcId), t.push(s.krcId));
  return t;
}
function Sc(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    for (const r of s.timeline) {
      const i = `${r.kind}:${r.explorerPath}:${r.label}`;
      n.has(i) || (n.add(i), t.push(r));
    }
  return t.slice(0, 8);
}
function Ec(e) {
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
function Cc(e, t) {
  const { intent: n, searchQuery: s, queryTerms: r, items: i } = wc(e, t), o = vc(e, i, s).filter((l) => l !== null), c = i.filter((l) => l.kind === "executive_session");
  let a = i.filter((l) => l.kind === "attachment");
  const d = i.filter((l) => l.kind === "message");
  if (n === "show_evidence" && a.length === 0)
    for (const l of o)
      for (const f of l.sections.attachments.items)
        a.push({
          recordId: f.recordId ?? f.explorerPath,
          kind: "attachment",
          score: 0,
          title: f.label,
          excerpt: f.subtitle ?? f.label,
          explorerPath: f.explorerPath,
          krcId: l.anchorKrcId,
          matchReasons: ["drilldown attachment"]
        });
  const u = Ec(o);
  return {
    question: t,
    intent: n,
    searchQuery: s,
    queryTerms: r,
    items: i,
    topKrcIds: Ic(i),
    executiveSessions: c,
    attachments: a,
    messages: d,
    relatedSources: u,
    timeline: Sc(o)
  };
}
function Rc(e) {
  const t = e.executiveMemory ?? null, n = e.conversation ?? { turns: [] };
  return {
    question: e.question,
    repositoryPath: e.repositoryPath,
    conversation: n,
    executiveMemory: t,
    evidence: e.evidence,
    executiveBriefing: e.executiveBriefing ?? null,
    campaign: t == null ? void 0 : t.currentCampaign,
    objective: t == null ? void 0 : t.currentObjective,
    blockers: [
      ...(t == null ? void 0 : t.currentBlockers.map((s) => s.label)) ?? [],
      ...(t == null ? void 0 : t.unfinishedWork) ?? []
    ],
    accomplishments: (t == null ? void 0 : t.currentAccomplishments.map((s) => s.label)) ?? [],
    repositorySummary: e.executiveBriefing ? `${e.executiveBriefing.evidenceRecordCount} evidence records; ${e.executiveBriefing.relationshipCount} relationships` : void 0
  };
}
function kc(e) {
  return e == null ? void 0 : e.conversationContext;
}
function bc(e) {
  return {
    recordId: e.recordId,
    label: e.title,
    excerpt: e.excerpt,
    explorerPath: e.explorerPath,
    krcId: e.krcId,
    kind: e.kind
  };
}
function Bt(e, t) {
  const n = [], s = /* @__PURE__ */ new Set();
  for (const r of e)
    if (!s.has(r.recordId) && (s.add(r.recordId), n.push(bc(r)), n.length >= t))
      break;
  return n;
}
function Ac(e) {
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
  r > 1 && (n += Math.min(15, r * 5), s.push(`${r} corroborating KRC sources`)), e.queryTerms.length > 1 && e.items.some((c) => e.queryTerms.every((a) => c.excerpt.toLowerCase().includes(a))) && (n += 10, s.push("all query terms present in evidence")), e.items.length < 3 && (n -= 15, s.push("limited evidence volume")), n = Math.max(0, Math.min(100, n));
  let i = "low";
  return n >= 75 ? i = "high" : n >= 50 ? i = "medium" : n < 25 && (i = "insufficient"), e.items.length === 1 && n < 40 && (i = "insufficient", s.push("single weak evidence hit")), {
    level: i,
    score: n,
    rationale: s.join("; ")
  };
}
function Tc(e, t) {
  if (t.level === "insufficient")
    return `I found limited evidence for "${e.searchQuery}". ${t.rationale}. Consider refining the question or checking the Search screen for raw hits.`;
  const n = e.items.slice(0, 3), s = n[0];
  switch (e.intent) {
    case "decision": {
      const r = e.executiveSessions[0];
      if (r)
        return `Based on executive session evidence (${r.krcId ?? r.title}): ${r.excerpt}`;
      const i = e.messages.find((o) => {
        var c;
        return (c = o.messageRole) == null ? void 0 : c.toLowerCase().includes("assistant");
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
function xc(e) {
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
function Dc(e) {
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
class $c {
  compose(t) {
    const n = Ac(t), s = Bt(t.items, 8), r = Bt(t.attachments, 6), i = Bt(t.relatedSources, 5);
    return {
      question: t.question,
      intent: t.intent,
      searchQuery: t.searchQuery,
      directAnswer: Tc(t, n),
      reasonedSummary: xc(t),
      evidenceUsed: s,
      confidence: n,
      timeline: t.timeline,
      relatedSources: i,
      attachments: r,
      explorerLinks: Dc(t)
    };
  }
}
const _c = new $c();
function Nc(e, t = _c) {
  return t.compose(e);
}
async function Nr(e, t, n, s) {
  const r = await xe(e), i = Cc(r, t), o = Nc(i), c = kc(n), a = c != null && c.conversationId ? await kt(e, c.conversationId) : await $r(e), d = await kr(e), u = Rc({
    repositoryPath: e,
    question: t,
    evidence: i,
    conversation: c,
    executiveMemory: a,
    executiveBriefing: d.briefing
  }), l = Ke(), f = (n == null ? void 0 : n.providerId) ?? "mock";
  l.setActive(f), l.setCredentials({
    apiKey: n == null ? void 0 : n.apiKey,
    model: n == null ? void 0 : n.model,
    baseUrl: n == null ? void 0 : n.baseUrl,
    temperature: n == null ? void 0 : n.temperature,
    streaming: n == null ? void 0 : n.streaming
  });
  const m = { context: u, groundedAnswer: o }, y = s ? await l.reasonStream(m, s) : await l.reason(m), I = Da(o, y);
  return mc(e, I);
}
async function Lc(e, t, n) {
  return Nr(e, t, n);
}
async function Pc(e, t, n, s) {
  return Nr(e, t, { ...n, streaming: !0 }, s);
}
const Fc = "conversations", Oc = "active.json";
function In(e) {
  return S.join(e, ".kae-sessions", Fc);
}
function Sn(e, t) {
  return S.join(In(e), `${t}.json`);
}
function En(e) {
  return S.join(In(e), Oc);
}
async function Uc(e) {
  const t = In(e);
  return await k.mkdir(t, { recursive: !0 }), t;
}
async function Lr(e) {
  try {
    const t = await k.readFile(En(e), "utf8"), n = JSON.parse(t);
    return n.conversationId ? n : null;
  } catch {
    return null;
  }
}
async function Mc(e, t) {
  try {
    const n = await k.readFile(Sn(e, t), "utf8"), s = JSON.parse(n);
    return !s.conversationId || !Array.isArray(s.turns) ? null : s;
  } catch {
    return null;
  }
}
async function jc(e) {
  const t = await Lr(e);
  return t ? Mc(e, t.conversationId) : null;
}
async function Pr(e, t) {
  await Uc(e);
  const n = Sn(e, t.conversationId);
  await k.writeFile(n, JSON.stringify(t, null, 2), "utf8");
  const s = {
    conversationId: t.conversationId,
    updatedAt: t.updatedAt
  };
  return await k.writeFile(En(e), JSON.stringify(s, null, 2), "utf8"), n;
}
function Bc(e) {
  const t = (/* @__PURE__ */ new Date()).toISOString();
  return {
    conversationId: W(),
    title: e ?? "Vigsy conversation",
    createdAt: t,
    updatedAt: t,
    turns: []
  };
}
async function Kc(e) {
  const t = Bc();
  return await Pr(e, t), t;
}
async function Gc(e, t) {
  try {
    await k.unlink(Sn(e, t));
  } catch {
  }
  const n = await Lr(e);
  if ((n == null ? void 0 : n.conversationId) === t)
    try {
      await k.unlink(En(e));
    } catch {
    }
}
const zc = /campaign\s+([\d.]+[a-z]?)\s*(?:[—–-]\s*([^\n.?]+)|(?=\s|$))/gi, as = /\b(completed?|finished|implemented|shipped|passed|pass\b|done with)\b/i, Hc = /\b(import(?:ed)?|repair(?:ed)?|index(?:ed)?|rebuilt|snapshot|rollback)\b/i;
function de(e, t, n) {
  return {
    id: W(),
    label: e.trim(),
    detail: t == null ? void 0 : t.trim(),
    sourceTurnId: n,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function ve(e, t) {
  const n = new Set(e.map((r) => r.label.toLowerCase())), s = [...e];
  for (const r of t) {
    const i = r.label.toLowerCase();
    n.has(i) || (n.add(i), s.push(r));
  }
  return s.slice(-24);
}
function Zc(e) {
  var i, o;
  const t = [...e.matchAll(zc)];
  if (t.length === 0)
    return;
  const n = t[t.length - 1], s = (i = n[1]) == null ? void 0 : i.trim(), r = (o = n[2]) == null ? void 0 : o.trim();
  if (s)
    return r ? `Campaign ${s} — ${r}` : `Campaign ${s}`;
}
function Vc(e) {
  var t, n;
  return [e.question, e.displayText, e.supportingText, (t = e.answer) == null ? void 0 : t.directAnswer, (n = e.answer) == null ? void 0 : n.reasonedSummary].filter(Boolean).join(`
`);
}
function qc(e, t) {
  var i;
  const n = Vc(e), s = {}, r = Zc(n);
  if (r && (s.currentCampaign = r), e.role === "user" && e.question && !t.currentObjective && (s.currentObjective = e.question.trim()), e.role === "assistant" && e.answer) {
    const o = [e.answer.directAnswer, e.answer.reasonedSummary].join(" "), c = e.question ? wr(e.question) : "general";
    (c === "decision" || Ct(o)) && (s.currentDecisions = ve(t.currentDecisions, [
      de(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ])), (c === "blockers" || gn(o)) && (s.currentBlockers = ve(t.currentBlockers, [
      de(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ])), (as.test(o) || as.test(e.displayText)) && (s.currentAccomplishments = ve(t.currentAccomplishments, [
      de(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ]));
    const a = e.answer.evidenceUsed.map((u) => de(u.label, u.recordId, e.turnId));
    s.currentEvidence = ve(t.currentEvidence, a);
    const d = [
      ...e.answer.explorerLinks.map((u) => de(u.label, u.path, e.turnId)),
      ...e.answer.attachments.map((u) => de(u.label, u.explorerPath, e.turnId))
    ];
    s.currentFiles = ve(t.currentFiles, d), e.followUpContext && (s.followUpContext = e.followUpContext);
  }
  if (Hc.test(n)) {
    const o = ((i = e.question) == null ? void 0 : i.trim()) || n.slice(0, 120);
    s.currentRepositoryChanges = ve(t.currentRepositoryChanges, [
      de(o, void 0, e.turnId)
    ]);
  }
  return s;
}
function Wc(e) {
  const t = [];
  for (const n of e.currentBlockers)
    t.push(n.label);
  if (e.currentBlockers.length === 0)
    for (const n of e.unfinishedWork)
      /unfinished|remaining|blocker|not yet|todo/i.test(n) && t.push(n);
  return [...new Set(t)].slice(0, 6);
}
function Yc(e) {
  var t;
  return e.currentBlockers.length > 0 ? `continue working on ${e.currentBlockers[e.currentBlockers.length - 1].label}` : e.currentObjective ? `continue with ${e.currentObjective}` : (t = e.followUpContext) != null && t.lastSearchQuery ? `pick up where we left off on ${e.followUpContext.lastSearchQuery}` : "continue where we left off";
}
function Jc(e, t) {
  let n = {
    ...t,
    title: e.title || t.title,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  for (const r of e.turns) {
    const i = qc(r, n);
    n = { ...n, ...i };
  }
  const s = [...e.turns].reverse().find((r) => r.role === "assistant");
  return s != null && s.followUpContext && (n.followUpContext = s.followUpContext), n.unfinishedWork = Wc(n), n.recommendedNextAction = Yc(n), n;
}
const Xc = "KAE";
function Qc(e) {
  return `VIGSY-${e.slice(0, 8).toUpperCase()}`;
}
function Ie(e, t) {
  return t.length === 0 ? [`## ${e}`, "- None recorded yet.", ""] : [`## ${e}`, ...t.map((n) => `- ${n.label}${n.detail ? ` (${n.detail})` : ""}`), ""];
}
async function eu(e, t, n) {
  const s = Qc(n.conversationId), r = Ye(n.title || "Vigsy_Conversation"), i = `${s}_${r}_SESSION.md`, o = `ExecutiveSessions/${Xc}/${i}`, c = S.join(e, o), a = `.kae-sessions/conversations/${n.conversationId}.json`, d = n.turns.filter((f) => f.role === "user" && f.question).slice(-3).map((f) => `- **Q:** ${f.question}`), u = [...n.turns].reverse().find((f) => f.role === "assistant");
  u != null && u.displayText && d.push(`- **Latest:** ${u.displayText.slice(0, 280)}`);
  const l = [
    `# Executive Session Record — ${n.title}`,
    "",
    "## Source ID",
    s,
    "",
    "## Session Date",
    t.updatedAt,
    "",
    "## Classification",
    "- Primary: vigsy-conversation",
    `- Lifecycle: ${t.lifecycle}`,
    `- Campaign: ${t.currentCampaign ?? "Not set"}`,
    `- Objective: ${t.currentObjective ?? "Not set"}`,
    "",
    "## Session Summary",
    d.length > 0 ? d.join(`
`) : "Active Vigsy conversation session.",
    "",
    ...Ie("Current Decisions", t.currentDecisions),
    ...Ie("Current Blockers", t.currentBlockers),
    ...Ie("Current Accomplishments", t.currentAccomplishments),
    ...Ie("Current Files", t.currentFiles),
    ...Ie("Current Evidence", t.currentEvidence),
    ...Ie("Repository Changes", t.currentRepositoryChanges),
    "## Action / Follow-up",
    t.recommendedNextAction ?? "Continue the active Vigsy conversation thread.",
    "",
    "## Transcript Reference",
    a,
    "",
    "## Notes",
    `Auto-maintained by KAE Continuous Executive Memory on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ];
  return await k.mkdir(S.dirname(c), { recursive: !0 }), await k.writeFile(c, l.join(`
`), "utf8"), o;
}
function tu(e, t) {
  const n = new Date(e);
  if (Number.isNaN(n.getTime()))
    return 0;
  const s = new Date(t.getFullYear(), t.getMonth(), t.getDate()), r = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.max(0, Math.round((s.getTime() - r.getTime()) / 864e5));
}
function cs(e) {
  return e === 0 ? "Earlier today" : e === 1 ? "Yesterday" : `${e} days ago`;
}
function nu(e, t = br) {
  if (!e || e.lifecycle === "archived")
    return {
      welcomeMessage: `Welcome back${t ? ` ${t}` : ""}. Ask me anything about your knowledge.`,
      session: null,
      hasUnfinishedWork: !1,
      daysSinceLastActivity: 0
    };
  const n = tu(e.updatedAt, /* @__PURE__ */ new Date()), s = [`Welcome back${t ? ` ${t}` : ""}.`];
  e.currentCampaign ? s.push(`${cs(n)} we were working on ${e.currentCampaign}.`) : n > 0 && s.push(`${cs(n)} we left off on ${e.title}.`);
  const r = e.currentAccomplishments[e.currentAccomplishments.length - 1];
  r && s.push(`We completed ${r.label}.`);
  const i = e.unfinishedWork.length || e.currentBlockers.length;
  return i > 0 && s.push(i === 1 ? "One implementation remains unfinished." : `${i} implementations remain unfinished.`), e.recommendedNextAction ? s.push(`Would you like to ${e.recommendedNextAction}?`) : s.push("Would you like to continue?"), {
    welcomeMessage: s.join(" "),
    recommendedNextAction: e.recommendedNextAction,
    session: e,
    hasUnfinishedWork: i > 0,
    daysSinceLastActivity: n
  };
}
async function us(e, t) {
  const n = await kt(e, t.conversationId);
  if (n)
    return (n.lifecycle === "paused" || n.lifecycle === "closed") && (n.lifecycle = "active", n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await Ve(e, n), await ht(e, n)), n;
  const s = _r(t.conversationId, t.title);
  return await Ve(e, s), await ht(e, s), s;
}
async function su(e) {
  const t = await $r(e);
  !t || t.lifecycle !== "active" || (t.lifecycle = "paused", t.pausedAt = (/* @__PURE__ */ new Date()).toISOString(), t.updatedAt = t.pausedAt, await Ve(e, t), await ht(e, t, !1));
}
async function ru(e, t) {
  const n = await kt(e, t);
  if (!n)
    return;
  n.lifecycle = "archived", n.archivedAt = (/* @__PURE__ */ new Date()).toISOString(), n.updatedAt = n.archivedAt, await Ve(e, n, { archive: !0 });
  const s = await et(e);
  s.sessions = s.sessions.map((r) => r.conversationId === t ? { ...r, lifecycle: "archived", updatedAt: n.updatedAt } : r), s.activeSessionId === n.sessionId && (s.activeSessionId = void 0), s.lastSyncedAt = n.updatedAt, await Dr(e, s);
}
async function iu(e, t) {
  const n = await kt(e, t.conversationId) ?? _r(t.conversationId, t.title), s = Jc(t, {
    ...n,
    lifecycle: t.turns.length > 0 ? "active" : n.lifecycle
  });
  s.executiveSessionPath = await eu(e, s, t), await Ve(e, s), await ht(e, s);
  const r = await Je(e), i = await be(e), o = await Qe(e);
  return {
    session: s,
    evidenceIndexBuiltAt: r.builtAt,
    relationshipIndexBuiltAt: i.builtAt,
    briefingGeneratedAt: o.generatedAt
  };
}
async function ou(e) {
  const t = await et(e);
  let n = null;
  return t.activeSessionId && (n = await vn(e, t.activeSessionId)), nu(n, t.founderName);
}
const au = /^(user|assistant|system|human|chatgpt|cursor)\s*:\s*(.*)$/i, cu = /^(user|assistant|system)$/i;
function uu(e) {
  var r;
  const t = e.trim();
  if (!t)
    return [];
  if (/^###\s+(user|assistant)/im.test(t)) {
    const i = [];
    for (const o of t.split(/^###\s+/im).slice(1)) {
      const c = o.trim().split(`
`), a = (r = c[0]) == null ? void 0 : r.trim().toLowerCase();
      if (!a || !cu.test(a))
        continue;
      const d = a === "user" ? "user" : a === "assistant" ? "assistant" : "system";
      i.push({ role: d, text: c.slice(1).join(`
`).trim() });
    }
    if (i.length > 0)
      return i;
  }
  const n = [];
  let s = null;
  for (const i of t.split(`
`)) {
    const o = i.match(au);
    if (o) {
      s != null && s.text.trim() && n.push(s);
      const c = o[1].toLowerCase();
      s = { role: c === "assistant" || c === "chatgpt" || c === "cursor" ? "assistant" : c === "system" ? "system" : "user", text: o[2] ?? "" };
      continue;
    }
    s ? s.text += `${s.text ? `
` : ""}${i}` : s = { role: "user", text: i };
  }
  return s != null && s.text.trim() && n.push(s), n.length === 0 ? [{ role: "user", text: t }] : n;
}
function du(e, t, n) {
  if (e != null && e.trim())
    return e.trim().slice(0, 120);
  const s = t.find((r) => r.role === "user");
  return s != null && s.text.trim() ? s.text.trim().slice(0, 120) : `${n} session ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`;
}
function ds(e) {
  switch (e) {
    case "chatgpt":
      return "ChatGPT live capture";
    case "cursor":
      return "Cursor live capture";
    default:
      return "Pasted transcript capture";
  }
}
function lu(e, t, n, s) {
  var c;
  const r = (/* @__PURE__ */ new Date()).toISOString(), i = `live-${Date.now()}`, o = s.map((a) => `### ${a.role === "assistant" ? "Assistant" : a.role === "system" ? "System" : "User"}
*${r}*

${a.text.trim()}`);
  return [
    `# ${e} — ${t}`,
    "",
    "## Status",
    "Inventoried",
    "",
    "## Description",
    `${ds(n.sourceKind)} acquired by KAE.`,
    n.campaign ? `Campaign: ${n.campaign}` : "",
    "",
    "## Topic",
    ds(n.sourceKind),
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
function fu(e, t, n, s, r) {
  const i = r.slice(0, 4).map((o) => `- **${o.role}:** ${o.text.slice(0, 200)}`).join(`
`);
  return [
    `# Executive Session Record — ${t}`,
    "",
    "## Source ID",
    e,
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
const ct = "KAE";
async function pu(e, t) {
  const n = uu(t.transcript);
  if (n.length === 0)
    throw new Error("Transcript is empty.");
  await Fs(e);
  const s = await wt(e) + 1, r = vt(s), i = du(t.title, n, t.sourceKind), o = Ye(i), c = `${r}_${o}.md`, a = `${r}_${o}_SESSION.md`, d = `Sources/${ct}/${c}`, u = `ExecutiveSessions/${ct}/${a}`, l = lu(r, i, t, n), f = fu(r, i, d, t, n);
  await k.mkdir(S.join(e, "Sources", ct), { recursive: !0 }), await k.mkdir(S.join(e, "ExecutiveSessions", ct), {
    recursive: !0
  }), await k.writeFile(S.join(e, d), l, "utf8"), await k.writeFile(S.join(e, u), f, "utf8");
  const m = await Je(e), y = await be(e), I = await Qe(e);
  return {
    krcId: r,
    sourceRelativePath: d,
    executiveSessionRelativePath: u,
    messageCount: n.length,
    evidenceIndexBuiltAt: m.builtAt,
    relationshipIndexBuiltAt: y.builtAt,
    briefingGeneratedAt: I.generatedAt
  };
}
async function mu(e) {
  const t = await Je(e), n = await be(e), s = await Qe(e);
  return {
    evidenceIndexBuiltAt: t.builtAt,
    relationshipIndexBuiltAt: n.builtAt,
    briefingGeneratedAt: s.generatedAt
  };
}
async function hu(e, t) {
  const n = await un(e), s = [];
  let r = 0, i = 0;
  for (const o of t) {
    const c = String(o.metadata.conversationId ?? o.metadata.sourceKey ?? o.id), a = n.get(c);
    if (a) {
      o.metadata.existingKrcId = a, o.metadata.conversationId = c, s.push(o), i += 1;
      continue;
    }
    o.metadata.conversationId = c, s.push(o);
  }
  return { documents: s, skippedCount: r, updatedCount: i };
}
class gu {
  constructor(t) {
    _(this, "onSync");
    _(this, "timers", /* @__PURE__ */ new Map());
    _(this, "schedules", /* @__PURE__ */ new Map());
    this.onSync = t;
  }
  load(t) {
    for (const n of t)
      this.schedules.set(n.connectorId, n), n.enabled && n.intervalMinutes > 0 && this.enable(n.connectorId, n.intervalMinutes);
  }
  export() {
    return Array.from(this.schedules.values());
  }
  enable(t, n) {
    var i;
    this.disable(t);
    const s = {
      connectorId: t,
      intervalMinutes: n,
      enabled: !0,
      lastRunAt: (i = this.schedules.get(t)) == null ? void 0 : i.lastRunAt,
      nextRunAt: new Date(Date.now() + n * 6e4).toISOString()
    };
    this.schedules.set(t, s);
    const r = setInterval(() => {
      this.onSync(t, {
        repositoryPath: "",
        log: () => {
        }
      }).then(() => {
        const o = this.schedules.get(t);
        o && this.schedules.set(t, {
          ...o,
          lastRunAt: (/* @__PURE__ */ new Date()).toISOString(),
          nextRunAt: new Date(Date.now() + n * 6e4).toISOString()
        });
      });
    }, n * 6e4);
    this.timers.set(t, r);
  }
  disable(t) {
    const n = this.timers.get(t);
    n && clearInterval(n), this.timers.delete(t);
    const s = this.schedules.get(t);
    s && this.schedules.set(t, { ...s, enabled: !1, nextRunAt: void 0 });
  }
}
function ls(e, t) {
  return {
    connectorId: e,
    status: "healthy",
    message: t,
    lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
class tt {
  canHandle(t) {
    var s;
    const n = ((s = t.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async connect(t, n) {
    return ls(this.id, `${this.name} connected`);
  }
  async disconnect() {
  }
  async checkHealth(t) {
    return ls(this.id, `${this.name} is operational`);
  }
  async sync(t, n) {
    var i;
    const s = Date.now(), r = [];
    try {
      let o;
      return t && this.canHandle(t) ? o = (await on(this, t, n)).documents : o = await this.syncInternal(t, n), {
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
async function Kt() {
  return (await import("./index-bDg1c4kq.js")).chatGptConnector;
}
class yu extends tt {
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
    return (await Kt()).discover(n);
  }
  async extract(n) {
    return (await Kt()).extract(n);
  }
  async normalize(n) {
    return (await Kt()).normalize(n);
  }
  async syncInternal(n, s) {
    if (!n)
      throw new Error("ChatGPT sync requires a ZIP export file.");
    const { runConnectorPipeline: r } = await Promise.resolve().then(() => mi);
    return (await r(this, n, s)).documents;
  }
}
const wu = new yu(), vu = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/, Iu = /[?&]list=([A-Za-z0-9_-]+)/, Su = /youtube\.com\/channel\/([A-Za-z0-9_-]+)/;
function Eu(e) {
  const t = e.match(vu);
  if (t)
    return { kind: "video", videoId: t[1], url: e };
  const n = e.match(Su);
  if (n)
    return { kind: "channel", channelId: n[1], url: e };
  const s = e.match(Iu);
  if (s)
    return { kind: "playlist", playlistId: s[1], url: e };
  throw new Error(`Unsupported YouTube URL: ${e}`);
}
async function qe(e, t) {
  const n = await fetch(e, t);
  if (!n.ok)
    throw new Error(`HTTP ${n.status} for ${e}`);
  return n.text();
}
async function Cu(e, t) {
  const n = await fetch(e, t);
  if (!n.ok)
    throw new Error(`HTTP ${n.status} for ${e}`);
  return n.json();
}
async function Ru(e, t, n) {
  var s;
  if (e.kind === "video" && e.videoId)
    return [e.videoId];
  if (e.kind === "channel" && e.channelId) {
    const r = `https://www.youtube.com/feeds/videos.xml?channel_id=${e.channelId}`;
    return (s = n == null ? void 0 : n.log) == null || s.call(n, "info", `Fetching channel feed: ${r}`), [...(await qe(r)).matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((c) => c[1]).slice(0, t);
  }
  if (e.kind === "playlist" && e.playlistId) {
    const r = await qe(`https://www.youtube.com/playlist?list=${e.playlistId}`);
    return [
      ...new Set([...r.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((o) => o[1]))
    ].slice(0, t);
  }
  throw new Error("Could not resolve YouTube video IDs.");
}
function ku(e) {
  return e.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function bu(e) {
  return [...e.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((n) => ku(n[1].replace(/\n/g, " ").trim())).filter(Boolean).join(`
`);
}
async function Au(e) {
  try {
    const n = (await qe(`https://www.youtube.com/api/timedtext?type=list&v=${e}`)).match(/lang_code="([^"]+)"/), s = (n == null ? void 0 : n[1]) ?? "en", r = await qe(`https://www.youtube.com/api/timedtext?v=${e}&lang=${s}`), i = bu(r);
    if (i.trim())
      return i;
  } catch {
  }
  return "";
}
async function Tu(e, t) {
  var d;
  const n = `https://www.youtube.com/watch?v=${e}`, s = await Cu(`https://www.youtube.com/oembed?url=${encodeURIComponent(n)}&format=json`);
  let r = "", i, o;
  try {
    const u = await qe(n), l = u.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
    l && (r = JSON.parse(`"${l[1]}"`));
    const f = u.match(/"publishDate":"([^"]+)"/);
    i = f == null ? void 0 : f[1];
    const m = u.match(/"lengthSeconds":"(\d+)"/);
    if (m) {
      const y = Number(m[1]), I = Math.floor(y / 60), A = y % 60;
      o = `${I}:${String(A).padStart(2, "0")}`;
    }
  } catch (u) {
    (d = t == null ? void 0 : t.log) == null || d.call(t, "warn", `Could not parse watch page for ${e}: ${String(u)}`);
  }
  const c = await Au(e), a = c.length > 0;
  return {
    videoId: e,
    title: s.title,
    description: r,
    transcript: c || r,
    thumbnailUrl: s.thumbnail_url ?? `https://i.ytimg.com/vi/${e}/hqdefault.jpg`,
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
function xu(e) {
  const t = `youtube:${e.videoId}`, n = [
    `# ${e.title}`,
    "",
    "## Source",
    "YouTube",
    "",
    "## Video ID",
    e.videoId,
    "",
    "## Channel",
    e.channelTitle ?? "Unknown",
    "",
    "## Publish Date",
    e.publishDate ?? "Unknown",
    "",
    "## Duration",
    e.duration ?? "Unknown",
    "",
    "## Thumbnail",
    e.thumbnailUrl,
    "",
    "## Description",
    e.description || "No description available.",
    "",
    "## Transcript",
    e.transcript || "No transcript available.",
    "",
    "## Captions",
    e.captionsAvailable ? "Available" : "Unavailable",
    "",
    "## ChatGPT Conversation ID",
    t
  ];
  return {
    id: t,
    title: e.title,
    content: n.join(`
`),
    format: "youtube",
    metadata: {
      conversationId: t,
      sourceKey: t,
      connectorId: "youtube",
      videoId: e.videoId,
      thumbnailUrl: e.thumbnailUrl,
      publishDate: e.publishDate,
      duration: e.duration,
      channelTitle: e.channelTitle,
      captionsAvailable: e.captionsAvailable,
      messageCount: 1,
      ...e.metadata
    }
  };
}
class Du extends tt {
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
    var d, u;
    const r = String(s.config.settings.targetUrl ?? s.config.settings.url ?? "").trim();
    if (!r)
      throw new Error("YouTube connector requires a video, playlist, or channel URL.");
    const i = Eu(r), o = Number(s.config.settings.maxVideos ?? 5), c = await Ru(i, o, s), a = [];
    for (const l of c) {
      (d = s.log) == null || d.call(s, "info", `Acquiring YouTube video ${l}`);
      const f = await Tu(l, s);
      a.push(xu(f)), (u = s.onProgress) == null || u.call(s, "extract", Math.round(a.length / c.length * 100));
    }
    return a;
  }
}
const $u = new Du();
async function Se(e, t) {
  const n = {
    Accept: "application/vnd.github+json",
    "User-Agent": "KAE-Connector/1.0"
  };
  t && (n.Authorization = `Bearer ${t}`);
  const s = await fetch(`https://api.github.com${e}`, { headers: n });
  if (!s.ok)
    throw new Error(`GitHub API ${s.status} for ${e}`);
  return s.json();
}
async function _u(e, t) {
  var o;
  const [n, s] = e.split("/");
  if (!n || !s)
    throw new Error(`Invalid repository "${e}". Use owner/repo format.`);
  const r = await Se(`/repos/${n}/${s}`, t.token), i = [];
  try {
    const c = await Se(`/repos/${n}/${s}/readme`, t.token), a = Buffer.from(c.content, "base64").toString("utf8");
    i.push({
      kind: "readme",
      id: `${e}#readme`,
      title: `${s} README`,
      body: a,
      url: c.html_url,
      metadata: { repository: e }
    });
  } catch (c) {
    (o = t.log) == null || o.call(t, "warn", `README unavailable: ${String(c)}`);
  }
  if (t.includeIssues) {
    const c = await Se(`/repos/${n}/${s}/issues?state=all&per_page=10`, t.token);
    for (const a of c)
      a.html_url.includes("/pull/") || i.push({
        kind: "issue",
        id: `${e}#issue-${a.number}`,
        title: `Issue #${a.number}: ${a.title}`,
        body: a.body ?? "",
        url: a.html_url,
        updatedAt: a.updated_at,
        metadata: { number: a.number }
      });
  }
  if (t.includePullRequests) {
    const c = await Se(`/repos/${n}/${s}/pulls?state=all&per_page=10`, t.token);
    for (const a of c)
      i.push({
        kind: "pull_request",
        id: `${e}#pr-${a.number}`,
        title: `PR #${a.number}: ${a.title}`,
        body: a.body ?? "",
        url: a.html_url,
        updatedAt: a.updated_at,
        metadata: { number: a.number }
      });
  }
  if (t.includeCommits) {
    const c = await Se(`/repos/${n}/${s}/commits?per_page=10`, t.token);
    for (const a of c)
      i.push({
        kind: "commit",
        id: `${e}#commit-${a.sha.slice(0, 7)}`,
        title: `Commit ${a.sha.slice(0, 7)}`,
        body: a.commit.message,
        url: a.html_url,
        metadata: { sha: a.sha }
      });
  }
  if (t.includeReleases) {
    const c = await Se(`/repos/${n}/${s}/releases?per_page=10`, t.token);
    for (const a of c)
      i.push({
        kind: "release",
        id: `${e}#release-${a.id}`,
        title: a.name ?? `Release ${a.id}`,
        body: a.body ?? "",
        url: a.html_url,
        updatedAt: a.published_at,
        metadata: { releaseId: a.id }
      });
  }
  return {
    repository: r.full_name,
    description: r.description ?? "",
    defaultBranch: r.default_branch,
    items: i
  };
}
function Nu(e, t) {
  const n = `github:${t.id}`, s = [
    `# ${t.title}`,
    "",
    "## Source",
    "GitHub",
    "",
    "## Repository",
    e,
    "",
    "## Item Type",
    t.kind,
    "",
    "## URL",
    t.url,
    "",
    "## Updated",
    t.updatedAt ?? "Unknown",
    "",
    "## Content",
    t.body || "No content.",
    "",
    "## ChatGPT Conversation ID",
    n
  ];
  return {
    id: n,
    title: t.title,
    content: s.join(`
`),
    format: "github",
    metadata: {
      conversationId: n,
      sourceKey: n,
      connectorId: "github",
      repository: e,
      itemKind: t.kind,
      url: t.url,
      updatedAt: t.updatedAt,
      messageCount: 1,
      ...t.metadata
    }
  };
}
class Lu extends tt {
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
    var c;
    const r = String(s.config.settings.repository ?? "").trim();
    if (!r)
      throw new Error("GitHub connector requires owner/repo in settings.");
    const i = String(s.config.settings.apiKey ?? ((c = s.auth) == null ? void 0 : c.label) ?? "").trim();
    return (await _u(r, {
      token: i || void 0,
      includeIssues: !!(s.config.settings.includeIssues ?? !0),
      includePullRequests: !!(s.config.settings.includePullRequests ?? !0),
      includeCommits: !!(s.config.settings.includeCommits ?? !0),
      includeReleases: !!(s.config.settings.includeReleases ?? !0),
      log: s.log
    })).items.map((a) => Nu(r, a));
  }
}
const Pu = new Lu(), Fr = [".md", ".markdown", ".txt"];
async function Or(e) {
  const t = [];
  let n;
  try {
    n = await k.readdir(e, { withFileTypes: !0 });
  } catch {
    return t;
  }
  for (const s of n) {
    const r = S.join(e, s.name);
    if (s.isDirectory()) {
      t.push(...await Or(r));
      continue;
    }
    const i = S.extname(s.name).toLowerCase();
    Fr.includes(i) && t.push(r);
  }
  return t;
}
function fs(e, t, n) {
  const s = S.relative(e, t).replace(/\\/g, "/"), r = `local-folder:${s}`, i = S.basename(t, S.extname(t)), o = [
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
class Fu extends tt {
  constructor() {
    super(...arguments);
    _(this, "id", "local-folder");
    _(this, "name", "Local Folder Connector");
    _(this, "description", "Acquire knowledge from markdown and text files in a local directory.");
    _(this, "supportedExtensions", Fr);
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
    const s = await k.readFile(n.source.path, "utf8");
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
      const i = r, o = fs(s, i.path, i.content);
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
    const i = await Or(r), o = [];
    for (const c of i) {
      const a = await k.readFile(c, "utf8");
      o.push(fs(r, c, a));
    }
    return o;
  }
}
const Ou = new Fu();
function ee(e, t, n, s) {
  class r extends tt {
    constructor() {
      super(...arguments);
      _(this, "id", e);
      _(this, "name", t);
      _(this, "description", n);
      _(this, "supportedExtensions", []);
      _(this, "capabilities", {
        implementationStatus: "stub",
        supportsScheduledSync: !0,
        supportsOAuth: e.includes("drive") || e === "notion",
        supportsApiKey: !0,
        supportsFilePicker: !1,
        supportsUrlInput: !0,
        supportsFolderPicker: e === "obsidian",
        acquisitionModes: s
      });
    }
    getDefaultConfig() {
      return {
        connectorId: e,
        enabled: !1,
        connected: !1,
        scheduledSyncEnabled: !1,
        settings: {}
      };
    }
    async discover(c) {
      throw new Error(`${t} is API-ready but not yet implemented.`);
    }
    async extract(c) {
      throw new Error(`${t} is API-ready but not yet implemented.`);
    }
    async normalize(c) {
      throw new Error(`${t} is API-ready but not yet implemented.`);
    }
    async syncInternal() {
      throw new Error(`${t} is API-ready but not yet implemented.`);
    }
    async checkHealth() {
      return {
        connectorId: e,
        status: "unavailable",
        message: "Stub connector — API-ready, awaiting implementation",
        lastCheckedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  return new r();
}
const Uu = ee("claude", "Claude Connector", "Acquire knowledge from Claude conversation exports.", ["export", "session"]), Mu = ee("cursor", "Cursor Connector", "Acquire knowledge from Cursor workspace sessions.", ["workspace", "session"]), ju = ee("google-drive", "Google Drive Connector", "Acquire documents from Google Drive folders.", ["folder", "file"]), Bu = ee("onedrive", "OneDrive Connector", "Acquire documents from OneDrive folders.", ["folder", "file"]), Ku = ee("notion", "Notion Connector", "Acquire pages and databases from Notion workspaces.", ["page", "database"]), Gu = ee("obsidian", "Obsidian Connector", "Acquire vault notes from Obsidian.", ["vault"]), zu = ee("rss", "RSS Connector", "Acquire feed entries from RSS/Atom sources.", ["feed"]), Hu = ee("websites", "Websites Connector", "Acquire content from configured website URLs.", ["url", "sitemap"]), Zu = ee("podcasts", "Podcasts Connector", "Acquire show notes and transcripts from podcast feeds.", ["feed", "episode"]), Vu = [
  Uu,
  Mu,
  ju,
  Bu,
  Ku,
  Gu,
  zu,
  Hu,
  Zu
], qu = [
  wu,
  $u,
  Pu,
  Ou
], Wu = [...qu, ...Vu];
function Gt() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function ps(e) {
  return e.capabilities.supportsApiKey ? { type: "api_key", configured: !1, label: "API Key" } : e.capabilities.supportsOAuth ? { type: "oauth", configured: !1, label: "OAuth" } : { type: "none", configured: !0 };
}
class Yu {
  constructor() {
    _(this, "connectors", /* @__PURE__ */ new Map());
    _(this, "state", null);
    _(this, "repositoryPath", "");
    _(this, "scheduler");
    this.scheduler = new gu((t, n) => this.syncNow(t, null, n));
    for (const t of Wu)
      this.connectors.set(t.id, t);
  }
  register(t) {
    this.connectors.set(t.id, t);
  }
  get(t) {
    return this.connectors.get(t);
  }
  list() {
    return Array.from(this.connectors.values());
  }
  async initialize(t) {
    this.repositoryPath = t, this.state = await Qi(t);
    for (const n of this.connectors.values())
      this.state.connectors[n.id] || (this.state.connectors[n.id] = n.getDefaultConfig());
    this.scheduler.load(this.state.schedules), await Oe(t, this.state);
  }
  ensureState() {
    if (!this.state)
      throw new Error("ConnectorManager not initialized.");
    return this.state;
  }
  configFor(t) {
    const n = this.ensureState(), s = this.get(t);
    return n.connectors[t] ?? (s == null ? void 0 : s.getDefaultConfig()) ?? {
      connectorId: t,
      enabled: !1,
      connected: !1,
      scheduledSyncEnabled: !1,
      settings: {}
    };
  }
  async getStatuses(t) {
    const n = this.ensureState(), s = this.buildContext(t), r = [];
    for (const i of this.connectors.values()) {
      const o = this.configFor(i.id), c = n.totals[i.id] ?? { itemsImported: 0 }, a = o.connected ? await i.checkHealth(s) : {
        connectorId: i.id,
        status: "disconnected",
        message: "Not connected",
        lastCheckedAt: Gt()
      };
      r.push({
        connectorId: i.id,
        name: i.name,
        description: i.description,
        capabilities: i.capabilities,
        config: o,
        health: a,
        auth: ps(i),
        lastSyncAt: c.lastSyncAt,
        itemsImported: c.itemsImported,
        implementationStatus: i.capabilities.implementationStatus
      });
    }
    return r;
  }
  async connect(t, n, s) {
    const r = this.get(t);
    if (!r)
      throw new Error(`Unknown connector: ${t}`);
    const i = this.ensureState(), o = {
      ...this.configFor(t),
      ...n,
      connectorId: t,
      connected: !0,
      enabled: !0
    }, c = this.buildContext(s), a = await r.connect(o, c);
    return i.connectors[t] = o, await Oe(this.repositoryPath, i), a;
  }
  async disconnect(t) {
    const n = this.get(t);
    if (!n)
      throw new Error(`Unknown connector: ${t}`);
    const s = this.ensureState();
    await n.disconnect();
    const r = this.configFor(t);
    s.connectors[t] = { ...r, connected: !1 }, this.scheduler.disable(t), await Oe(this.repositoryPath, s);
  }
  async updateConfig(t, n) {
    const s = this.ensureState(), i = { ...this.configFor(t), ...n, connectorId: t };
    return s.connectors[t] = i, i.scheduledSyncEnabled && i.scheduleIntervalMinutes && i.connected ? (this.scheduler.enable(t, i.scheduleIntervalMinutes), s.schedules = this.scheduler.export()) : (this.scheduler.disable(t), s.schedules = this.scheduler.export()), await Oe(this.repositoryPath, s), i;
  }
  async syncNow(t, n, s) {
    var m;
    const r = this.get(t);
    if (!r)
      throw new Error(`Unknown connector: ${t}`);
    const i = this.ensureState(), o = this.configFor(t);
    if (!o.connected)
      throw new Error(`Connector "${r.name}" is not connected.`);
    const c = Date.now(), a = crypto.randomUUID(), d = {
      ...this.buildContext(s),
      config: o,
      auth: ps(r)
    };
    (m = d.log) == null || m.call(d, "info", `Sync started: ${r.name}`);
    let u;
    try {
      if (u = await r.sync(n, d), u.documents.length > 0) {
        const y = await hu(this.repositoryPath, u.documents);
        if (u.itemsSkipped += u.documents.length - y.documents.length, u.documents = y.documents, y.documents.length > 0) {
          const I = await js(y.documents, this.repositoryPath, {
            importFileName: (n == null ? void 0 : n.name) ?? `${t}-sync`,
            log: (C, b) => {
              var x;
              return (x = d.log) == null ? void 0 : x.call(d, C, b);
            },
            onProgress: (C) => {
              var b;
              return (b = d.onProgress) == null ? void 0 : b.call(d, "emit", C);
            }
          });
          u.itemsImported = I.sourcesCreated, u.itemsUpdated = Math.max(y.updatedCount, I.sourcesCreated === 0 && y.documents.length > 0 ? y.documents.length : 0), u.itemsSkipped += I.skippedDuplicates;
          const A = await mu(this.repositoryPath);
          u.evidenceIndexBuiltAt = A.evidenceIndexBuiltAt, u.relationshipIndexBuiltAt = A.relationshipIndexBuiltAt, u.briefingGeneratedAt = A.briefingGeneratedAt;
        }
      }
      u.durationMs = Date.now() - c, u.success = u.errors.length === 0;
    } catch (y) {
      const I = y instanceof Error ? y.message : String(y);
      u = {
        success: !1,
        connectorId: t,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [I],
        durationMs: Date.now() - c
      };
    }
    const l = {
      syncId: a,
      connectorId: t,
      startedAt: new Date(c).toISOString(),
      completedAt: Gt(),
      success: u.success,
      itemsImported: u.itemsImported,
      itemsUpdated: u.itemsUpdated,
      itemsSkipped: u.itemsSkipped,
      error: u.errors[0]
    };
    i.syncHistory.unshift(l), i.syncHistory = i.syncHistory.slice(0, 100);
    const f = i.totals[t] ?? { itemsImported: 0 };
    return i.totals[t] = {
      itemsImported: f.itemsImported + u.itemsImported + u.itemsUpdated,
      lastSyncAt: l.completedAt
    }, await Oe(this.repositoryPath, i), u;
  }
  async runPipeline(t, n, s) {
    const r = this.get(t);
    if (!r)
      throw new Error(`Unknown connector: ${t}`);
    const i = Date.now(), o = this.buildContext(s);
    try {
      const c = await on(r, n, o);
      return {
        success: !0,
        connectorId: t,
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
        connectorId: t,
        itemsImported: 0,
        itemsUpdated: 0,
        itemsSkipped: 0,
        documents: [],
        errors: [a],
        durationMs: Date.now() - i
      };
    }
  }
  getSyncHistory(t) {
    const n = this.ensureState();
    return t ? n.syncHistory.filter((s) => s.connectorId === t) : n.syncHistory;
  }
  getSchedules() {
    return this.scheduler.export();
  }
  createJob(t) {
    return {
      jobId: crypto.randomUUID(),
      connectorId: t,
      startedAt: Gt(),
      status: "queued",
      progress: 0,
      itemsProcessed: 0
    };
  }
  buildContext(t) {
    return {
      repositoryPath: this.repositoryPath,
      ...t
    };
  }
}
let zt = null;
function fe() {
  return zt || (zt = new Yu()), zt;
}
class De {
  canImport(t) {
    var s;
    const n = ((s = t.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async import(t, n) {
    throw new Ts(`Importer "${this.name}"`);
  }
}
class Ju {
  constructor() {
    _(this, "plugins", /* @__PURE__ */ new Map());
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
const gt = new Ju(), Xu = 500, Qu = /* @__PURE__ */ new Set(["system"]);
function ed(e) {
  if (!Array.isArray(e) || e.length === 0)
    return !1;
  const t = e[0];
  return typeof t == "object" && t !== null && "mapping" in t && typeof t.mapping == "object";
}
function td(e) {
  return Ur(e).map(Mr);
}
function Ur(e) {
  const t = JSON.parse(e);
  if (!Array.isArray(t))
    throw new Error("conversations.json must be a JSON array.");
  if (!ed(t))
    throw new Error("Unrecognized export format: expected ChatGPT conversations.json structure.");
  return t;
}
async function nd(e, t = {}) {
  const { signal: n, batchSize: s = 25, onProgress: r } = t, i = [];
  let o = 0;
  for (let c = 0; c < e.length; c++) {
    if (n != null && n.aborted)
      throw new Error("Validation cancelled by user.");
    const a = Mr(e[c]);
    i.push(a), o += a.messages.length, (c % s === 0 || c === e.length - 1) && (r == null || r({
      conversationsTotal: e.length,
      conversationsProcessed: c + 1,
      messagesProcessed: o
    }), await new Promise((d) => setImmediate(d)));
  }
  return i;
}
function Mr(e) {
  var c;
  const t = e.conversation_id ?? e.id ?? cd(), n = (((c = e.title) == null ? void 0 : c.trim()) || "Untitled Conversation").slice(0, 200), r = sd(e).map((a) => id(a.message)).filter((a) => a !== null), i = r.filter((a) => a.isPastedTranscript).map((a) => a.text), o = [...new Set(r.flatMap((a) => a.fileReferences))];
  return {
    conversationId: t,
    title: n,
    createTime: e.create_time,
    updateTime: e.update_time,
    messages: r,
    pastedTranscripts: i,
    fileReferences: o,
    assetPaths: o
  };
}
function sd(e) {
  const t = e.mapping ?? {};
  let n = e.current_node;
  if ((!n || !t[n]) && (n = rd(t)), !n)
    return [];
  const s = [], r = /* @__PURE__ */ new Set();
  for (; n && t[n] && !r.has(n); )
    r.add(n), s.push(t[n]), n = t[n].parent;
  return s.reverse();
}
function rd(e) {
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
function id(e) {
  var r;
  if (!((r = e == null ? void 0 : e.author) != null && r.role))
    return null;
  const t = e.author.role;
  if (Qu.has(t))
    return null;
  const n = od(e).trim();
  if (!n)
    return null;
  const s = ad(e, n);
  return {
    role: t,
    text: n,
    createTime: e.create_time ?? void 0,
    isPastedTranscript: t === "user" && n.length >= Xu,
    fileReferences: s
  };
}
function od(e) {
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
function ad(e, t) {
  const n = [], r = (e.metadata ?? {}).attachments;
  if (Array.isArray(r)) {
    for (const c of r)
      if (c && typeof c == "object") {
        const a = c;
        typeof a.name == "string" && n.push(a.name), typeof a.id == "string" && n.push(a.id);
      }
  }
  const i = /(?:file-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+|dalle-generations\/[^\s"']+|uploaded[^\s"']*\.[a-zA-Z0-9]+)/gi, o = t.match(i);
  return o && n.push(...o), [...new Set(n)];
}
function cd() {
  return `unknown-${Date.now()}`;
}
function ud(e) {
  const t = [];
  for (const n of e) {
    const s = n.role === "user" ? "User" : n.role === "assistant" ? "Assistant" : n.role;
    if (t.push(`### ${s}`), n.createTime && t.push(`*${dd(n.createTime)}*`), t.push(""), t.push(n.text), t.push(""), n.fileReferences.length > 0) {
      t.push("**File references:**");
      for (const r of n.fileReferences)
        t.push(`- ${r}`);
      t.push("");
    }
  }
  return t.join(`
`).trim();
}
function dd(e) {
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function jr(e, t, n = {}) {
  const { sharedAssetList: s } = n, r = ud(e.messages), i = e.pastedTranscripts.length > 0 ? `

## Pasted Source Text

${e.pastedTranscripts.join(`

---

`)}` : "", o = t.filter((a) => e.fileReferences.some((d) => a.zipPath.includes(d) || a.fileName.includes(d)) || e.assetPaths.some((d) => a.zipPath.includes(d))), c = {
    conversationId: e.conversationId,
    createTime: e.createTime,
    updateTime: e.updateTime,
    messageCount: e.messages.length,
    userMessageCount: e.messages.filter((a) => a.role === "user").length,
    assistantMessageCount: e.messages.filter((a) => a.role === "assistant").length,
    pastedTranscriptCount: e.pastedTranscripts.length,
    fileReferences: e.fileReferences
  };
  return o.length > 0 && (c.assets = o.map((a) => ({
    zipPath: a.zipPath,
    fileName: a.fileName
  }))), s && (c.allZipAssets = s), {
    id: e.conversationId,
    title: e.title,
    content: `${r}${i}`,
    format: "chatgpt-export-zip",
    metadata: c
  };
}
const ld = "conversations.json", fd = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i
];
function ut(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function Br(e, t = {}) {
  var m, y, I;
  const { loadAssetData: n = !0, signal: s, callbacks: r } = t;
  ut(s);
  const o = new Ps(e).getEntries();
  (m = r == null ? void 0 : r.onZipOpened) == null || m.call(r, o.length), ut(s);
  const c = o.find((A) => !A.isDirectory && A.entryName.replace(/\\/g, "/").endsWith(ld));
  if (!c)
    throw new Error("Not a ChatGPT export ZIP: conversations.json was not found in the archive.");
  const a = c.entryName.replace(/\\/g, "/"), d = c.header.size;
  (y = r == null ? void 0 : r.onConversationsJsonLocated) == null || y.call(r, a, d), ut(s);
  const u = c.getData().toString("utf8"), l = [];
  let f = 0;
  for (const A of o) {
    if (ut(s), A.isDirectory)
      continue;
    const C = A.entryName.replace(/\\/g, "/"), b = S.basename(C);
    if (fd.some((h) => h.test(b) || h.test(C)) || C.endsWith(".json") && !C.includes("/"))
      continue;
    f++;
    const x = {
      zipPath: C,
      fileName: b
    };
    n && (x.data = A.getData()), l.push(x);
  }
  return (I = r == null ? void 0 : r.onEntriesDiscovered) == null || I.call(r, o.length, f), {
    conversationsJson: u,
    conversationsPath: a,
    assets: l,
    archiveEntryCount: o.length
  };
}
class pd {
  constructor() {
    _(this, "id", "chatgpt-export-zip");
    _(this, "name", "ChatGPT Connector");
    _(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    _(this, "supportedExtensions", [".zip"]);
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
    const n = Br(t.source.path, { loadAssetData: !1 }), s = td(n.conversationsJson);
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
      const o = jr(r, n, {
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
const Ht = new pd(), md = {
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
function ms(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function hs(e) {
  return e < 1024 ? `${e} B` : e < 1024 * 1024 ? `${(e / 1024).toFixed(1)} KB` : `${(e / (1024 * 1024)).toFixed(1)} MB`;
}
async function Kr(e, t = {}) {
  const n = Date.now(), s = [];
  let r = 0, i, o, c = 0, a = 0, d = 0;
  const u = (f, m, y = {}) => {
    var I;
    (I = t.onProgress) == null || I.call(t, {
      status: m,
      stage: f,
      stageLabel: md[f],
      fileName: e.name,
      archiveEntryCount: r,
      conversationsJsonPath: i,
      conversationsJsonSizeBytes: o,
      conversationsTotal: c,
      conversationsProcessed: a,
      messagesProcessed: d,
      warningsGenerated: s.length,
      startedAt: new Date(n).toISOString(),
      elapsedMs: Date.now() - n,
      ...y
    });
  }, l = (f, m, y) => {
    var I;
    (I = t.log) == null || I.call(t, f, m, y);
  };
  try {
    u("zip-selected", "running", { detail: e.name }), l("info", `ZIP selected: ${e.name}`, { path: e.path }), u("zip-opening", "running"), l("info", "Opening ZIP archive (read-only)…");
    const f = Br(e.path, {
      loadAssetData: !1,
      signal: t.signal,
      callbacks: {
        onZipOpened: (h) => {
          r = h, u("zip-opened", "running", {
            archiveEntryCount: h,
            detail: `${h} entries`
          }), l("info", `ZIP opened: ${h} archive entries`);
        },
        onEntriesDiscovered: (h, p) => {
          u("entries-discovered", "running", {
            archiveEntryCount: h,
            detail: `${p} asset file(s), metadata only`
          }), l("info", `Archive entries discovered: ${h} total, ${p} asset file(s)`);
        },
        onConversationsJsonLocated: (h, p) => {
          i = h, o = p, u("conversations-json-located", "running", {
            conversationsJsonPath: h,
            conversationsJsonSizeBytes: p,
            detail: `${h} (${hs(p)})`
          }), l("info", `conversations.json located: ${h} (${hs(p)})`);
        }
      }
    });
    ms(t.signal), u("parsing-started", "running"), l("info", "Conversations parsing started…");
    const m = Ur(f.conversationsJson);
    c = m.length, l("info", `Total conversations detected: ${c}`, {
      conversationsTotal: c
    }), u("parsing-started", "running", {
      conversationsTotal: c,
      detail: `${c} conversations`
    });
    const y = await nd(m, {
      signal: t.signal,
      onProgress: (h) => {
        a = h.conversationsProcessed, d = h.messagesProcessed, u("parsing-conversations", "running", {
          conversationsTotal: h.conversationsTotal,
          conversationsProcessed: h.conversationsProcessed,
          messagesProcessed: h.messagesProcessed,
          detail: `${h.conversationsProcessed}/${h.conversationsTotal} conversations, ${h.messagesProcessed} messages`
        }), (h.conversationsProcessed % 100 === 0 || h.conversationsProcessed === h.conversationsTotal) && l("info", `Conversations processed: ${h.conversationsProcessed}/${h.conversationsTotal} (${h.messagesProcessed} messages)`, {
          conversationsProcessed: h.conversationsProcessed,
          conversationsTotal: h.conversationsTotal,
          messagesProcessed: h.messagesProcessed
        });
      }
    });
    ms(t.signal);
    const I = f.assets.map((h) => ({
      zipPath: h.zipPath,
      fileName: h.fileName
    })), A = y.map((h, p) => jr(h, f.assets, {
      validationMode: !0,
      sharedAssetList: p === 0 ? I : void 0
    })), C = nn(Ht.id, A), b = sn(Ht.id, e, C), x = rn(Ht, e, C, b);
    return s.length > 0 && l("warn", `Warnings generated: ${s.length}`, { warnings: s }), u("completed", "complete", {
      conversationsTotal: c,
      conversationsProcessed: a,
      messagesProcessed: d,
      detail: `${a} conversations validated`
    }), l("info", `Validation pipeline complete: ${C.length} conversation(s), ${d} message(s)`), x;
  } catch (f) {
    const m = f instanceof Error ? f.message : String(f), y = m.includes("cancelled");
    throw u(y ? "cancelled" : "failed", y ? "cancelled" : "failed", {
      error: m,
      detail: m
    }), l(y ? "warn" : "error", `Validation ${y ? "cancelled" : "failed"}: ${m}`, {
      error: m
    }), f;
  }
}
class hd extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "chatgpt-export-zip");
    _(this, "name", "ChatGPT Connector");
    _(this, "description", "Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.");
    _(this, "supportedExtensions", [".zip"]);
  }
  async import(n, s) {
    var o, c, a, d;
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
      const u = await Kr(n, {
        log: (l, f) => {
          var m;
          return (m = s.log) == null ? void 0 : m.call(s, l, f);
        },
        onProgress: (l) => {
          var f;
          if (l.conversationsTotal > 0) {
            const m = Math.round(l.conversationsProcessed / l.conversationsTotal * 100);
            (f = s.onProgress) == null || f.call(s, m);
          }
        },
        signal: s.signal
      });
      return (a = s.log) == null || a.call(s, "info", `Import package ready: ${u.documents.length} document(s)`), {
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
      const l = u instanceof Error ? u.message : String(u);
      return i.push(l), (d = s.log) == null || d.call(s, "error", l), {
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
class gd extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "pdf");
    _(this, "name", "PDF");
    _(this, "description", "Import content from PDF documents.");
    _(this, "supportedExtensions", [".pdf"]);
  }
}
class yd extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "markdown");
    _(this, "name", "Markdown");
    _(this, "description", "Import Markdown (.md) files.");
    _(this, "supportedExtensions", [".md", ".markdown"]);
  }
}
class wd extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "html");
    _(this, "name", "HTML");
    _(this, "description", "Import HTML web pages and exports.");
    _(this, "supportedExtensions", [".html", ".htm"]);
  }
}
class vd extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "docx");
    _(this, "name", "DOCX");
    _(this, "description", "Import Microsoft Word documents.");
    _(this, "supportedExtensions", [".docx"]);
  }
}
class Id extends De {
  constructor() {
    super(...arguments);
    _(this, "id", "txt");
    _(this, "name", "Plain Text");
    _(this, "description", "Import plain text files.");
    _(this, "supportedExtensions", [".txt"]);
  }
}
const gs = [
  new hd(),
  new gd(),
  new yd(),
  new wd(),
  new vd(),
  new Id()
];
async function Gr(e, t, n = {}) {
  var o, c, a, d;
  const s = Date.now(), r = [], i = (u, l, f) => {
    var m;
    (m = n.log) == null || m.call(n, u, l, f);
  };
  try {
    i("info", "Validation started (read-only — repository will not be modified)", {
      fileName: e.name,
      repositoryPath: t
    });
    const u = await Kr(e, {
      log: n.log,
      onProgress: n.onProgress,
      signal: n.signal
    });
    (o = n.onImportPackageReady) == null || o.call(n, u), (c = n.onProgress) == null || c.call(n, {
      status: "running",
      stage: "planning-import",
      stageLabel: "Planning import (read-only)",
      fileName: e.name,
      conversationsTotal: u.documents.length,
      conversationsProcessed: u.documents.length,
      messagesProcessed: u.documents.reduce((f, m) => f + Number(m.metadata.messageCount ?? 0), 0),
      warningsGenerated: r.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: "Scanning repository for planned changes"
    }), i("info", "Planning import (read-only repository scan)…");
    const l = await Ji(u.documents, t, e.name);
    if (l.filePath = e.path, l.zipReadable = !0, l.chatGptStructureDetected = !0, l.conversationsJsonPresent = !0, l.valid = l.blockingErrors.length === 0 && u.documents.length > 0, l.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), l.durationMs = Date.now() - s, u.documents.length === 0) {
      const f = "No conversations found in export.";
      l.errors.push(f), l.blockingErrors.push(f), l.valid = !1;
    }
    if (l.uncertainCount > 0) {
      const f = `${l.uncertainCount} conversation(s) classified as uncertain and will route to Other / Review Needed.`;
      l.warnings.push(f), r.push(f);
    }
    if (l.estimatedDuplicatesSkipped > 0) {
      const f = `${l.estimatedDuplicatesSkipped} duplicate(s) will be skipped during import.`;
      l.warnings.push(f), r.push(f);
    }
    return r.length > 0 && i("warn", `Validation warnings: ${r.length}`, { warnings: r }), (a = n.onProgress) == null || a.call(n, {
      status: l.valid ? "complete" : "failed",
      stage: l.valid ? "completed" : "failed",
      stageLabel: l.valid ? "Validation complete" : "Validation failed",
      fileName: e.name,
      conversationsTotal: l.conversationsFound,
      conversationsProcessed: l.conversationsFound,
      messagesProcessed: u.documents.reduce((f, m) => f + Number(m.metadata.messageCount ?? 0), 0),
      warningsGenerated: l.warnings.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: l.valid ? `${l.conversationsFound} conversations ready for review` : l.blockingErrors.join("; ") || "Validation failed",
      error: l.valid ? void 0 : l.blockingErrors.join("; ") || "Validation failed"
    }), l.valid ? i("info", `Validation completed successfully in ${l.durationMs}ms`, {
      conversationsFound: l.conversationsFound,
      estimatedSourcesToCreate: l.estimatedSourcesToCreate,
      estimatedSourcesToUpdate: l.estimatedSourcesToUpdate,
      warnings: l.warnings.length
    }) : i("error", `Validation failed — repository unchanged. ${l.blockingErrors.join("; ")}`, {
      blockingErrors: l.blockingErrors,
      errors: l.errors
    }), l;
  } catch (u) {
    const l = u instanceof Error ? u.message : String(u), f = l.includes("cancelled"), m = Xi(e.name, e.path, t, l);
    return m.durationMs = Date.now() - s, m.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), (d = n.onProgress) == null || d.call(n, {
      status: f ? "cancelled" : "failed",
      stage: f ? "cancelled" : "failed",
      stageLabel: f ? "Validation cancelled" : "Validation failed",
      fileName: e.name,
      conversationsTotal: 0,
      conversationsProcessed: 0,
      messagesProcessed: 0,
      warningsGenerated: 0,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      error: l,
      detail: l
    }), i(f ? "warn" : "error", `Validation ${f ? "cancelled" : "failed"} — repository unchanged. ${l}`, { error: l }), m;
  }
}
const Sd = [
  "openai",
  "claude",
  "gemini",
  "openrouter",
  "ollama"
];
function Cn() {
  return S.join(ke.getPath("userData"), "credentials");
}
function yt(e) {
  return S.join(Cn(), `${e}.cred`);
}
function ys() {
  return S.join(Cn(), ".mode");
}
function Rn() {
  return Xt.isEncryptionAvailable();
}
function zr() {
  return Rn() ? "available" : "dev_fallback";
}
async function Ed(e, t) {
  const n = t.trim();
  if (!n) {
    await Cd(e);
    return;
  }
  if (await k.mkdir(Cn(), { recursive: !0 }), Rn()) {
    const s = Xt.encryptString(n);
    await k.writeFile(yt(e), s), await k.writeFile(ys(), "secure", "utf8");
    return;
  }
  await k.writeFile(yt(e), Buffer.from(n, "utf8").toString("base64"), "utf8"), await k.writeFile(ys(), "dev-fallback", "utf8");
}
async function Hr(e) {
  try {
    const t = await k.readFile(yt(e));
    return Rn() ? Xt.decryptString(t) : Buffer.from(t.toString("utf8"), "base64").toString("utf8");
  } catch {
    return;
  }
}
async function Cd(e) {
  try {
    await k.unlink(yt(e));
  } catch {
  }
}
async function Zr(e) {
  const t = await Hr(e);
  return !!(t != null && t.trim());
}
async function Vr(e) {
  if (!(e === "mock" || e === "deterministic"))
    return Hr(e);
}
async function Rd() {
  const e = {};
  for (const t of Sd)
    e[t] = await Zr(t);
  return e;
}
function Jt() {
  return S.join(ke.getPath("userData"), "kae-settings.json");
}
async function kd() {
  try {
    const e = await k.readFile(Jt(), "utf8"), t = JSON.parse(e), { aiApiKey: n, ...s } = t;
    return s;
  } catch {
    return {};
  }
}
async function bd(e) {
  const { aiApiKey: t, ...n } = e;
  await k.mkdir(S.dirname(Jt()), { recursive: !0 }), await k.writeFile(Jt(), JSON.stringify(n, null, 2), "utf8");
}
function kn(e) {
  return { ...Ds, ...e };
}
const ws = S.dirname(ei(import.meta.url));
Ss.registerSchemesAsPrivileged([
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
function Ad(e) {
  const t = "kae-asset://resolve/";
  if (!e.startsWith(t))
    throw new Error("Invalid asset URL.");
  return decodeURIComponent(e.slice(t.length));
}
let L = null, oe = null, Q = null, Me = null, qr = null, he = null, Zt = null, Vt = null;
const ae = oi(), Z = new ci(), dt = [];
function F() {
  return ae.repository.path;
}
async function ie() {
  await fe().initialize(F());
}
function Re() {
  return kn(ae.settings);
}
async function pe() {
  const e = Re(), t = Ke();
  t.setSecureStorageMode(zr()), t.setActive(e.aiProvider);
  const n = await Vr(e.aiProvider);
  t.setCredentials({
    apiKey: n,
    model: e.aiModel,
    baseUrl: e.aiBaseUrl,
    temperature: e.aiTemperature,
    streaming: e.aiStreaming
  });
}
async function vs(e) {
  const t = Re(), n = (e == null ? void 0 : e.providerId) ?? t.aiProvider, s = (e == null ? void 0 : e.apiKey) ?? await Vr(n);
  return {
    providerId: n,
    apiKey: s,
    model: (e == null ? void 0 : e.model) ?? t.aiModel,
    baseUrl: (e == null ? void 0 : e.baseUrl) ?? t.aiBaseUrl,
    temperature: (e == null ? void 0 : e.temperature) ?? t.aiTemperature,
    streaming: (e == null ? void 0 : e.streaming) ?? t.aiStreaming,
    conversationContext: e == null ? void 0 : e.conversationContext
  };
}
function lt(e) {
  const t = S.resolve(F(), e), n = S.resolve(F());
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
  return dt.unshift(r), dt.length > 500 && dt.pop(), L == null || L.webContents.send("kae:log-added", r), r;
}
async function je() {
  try {
    await Qe(F()), L == null || L.webContents.send("kae:executive-briefing-updated");
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    j("warn", "awareness", `Executive briefing refresh failed: ${t}`);
  }
}
async function ft(e) {
  const t = S.join(F(), ".kae-sessions", "import-trace.log"), n = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${e}
`;
  try {
    await k.mkdir(S.dirname(t), { recursive: !0 }), await k.appendFile(t, n, "utf8");
  } catch {
  }
}
function Td() {
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
function Wr(e) {
  L == null || L.webContents.send("kae:import-timeline", e);
}
function H(e, t, n, s) {
  const r = e.find((i) => i.id === t);
  r && (r.status = n, r.detail = s), Wr([...e]);
}
function xd() {
  gs.forEach((e) => gt.register(e)), gi.register(Bs), j("info", "system", `Registered ${gs.length} connector plugin(s)`);
}
function Is() {
  L = new Es({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${bs} — ${As}`,
    webPreferences: {
      preload: S.join(ws, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL ? (L.loadURL(process.env.VITE_DEV_SERVER_URL), L.webContents.openDevTools({ mode: "detach" })) : L.loadFile(S.join(ws, "../dist/index.html")), L.on("closed", () => {
    L = null;
  });
}
function Yr(e) {
  L == null || L.webContents.send("kae:validation-progress", e);
}
async function Dd(e) {
  const t = S.basename(e), n = S.extname(t), s = { path: e, name: t, extension: n };
  he && he.abort(), he = new AbortController();
  const { signal: r } = he;
  j("info", "import", `Validating: ${t} (read-only — no repository writes)`, {
    filePath: e,
    fileName: t
  });
  try {
    const i = await Gr(s, F(), {
      signal: r,
      log: (o, c, a) => j(o, "import", c, a),
      onProgress: Yr,
      onImportPackageReady: (o) => {
        Q = o, Me = e, ft(
          `Validation cached import package: ${o.documents.length} document(s) from ${t}`
        );
      }
    });
    return oe = i, i.valid ? j(
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
    he = null;
  }
}
async function $d(e, t) {
  var g, w, E;
  const n = Date.now(), s = S.basename(e), r = S.extname(s), i = crypto.randomUUID(), o = { path: e, name: s, extension: r }, c = Td();
  Wr(c), await ft(`Confirm import started: ${s} (${e})`), H(c, "validate-zip", "running"), j("info", "import", `Pre-import validation gate: ${s}`);
  let a;
  try {
    oe != null && oe.valid && oe.filePath === e && Q && Me === e ? (a = oe, await ft(
      `Reusing validated import package: ${Q.documents.length} document(s) — no ZIP re-parse`
    ), j(
      "info",
      "import",
      `Reusing cached validation and import package (${Q.documents.length} documents)`
    )) : (a = await Gr(o, F(), {
      log: (R, T, U) => j(R, "import", T, U),
      onImportPackageReady: (R) => {
        Q = R, Me = e;
      }
    }), oe = a);
  } catch (R) {
    const T = R instanceof Error ? R.message : String(R);
    throw H(c, "validate-zip", "failed", T), j("error", "import", `Validation error — repository unchanged. ${T}`), new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${T}. Recovery: fix the export and validate again.`
    );
  }
  if (!a.valid) {
    const R = a.blockingErrors.join("; ") || "Validation failed";
    throw H(c, "validate-zip", "failed", R), j("error", "import", `Import blocked — repository unchanged. ${R}`), new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${R}. Recovery: review the validation report and fix the export.`
    );
  }
  H(c, "validate-zip", "complete", `${a.conversationsFound} conversations`);
  const d = ai(i, t, o);
  d.status = "queued", Z.enqueue(d), L == null || L.webContents.send("kae:job-updated", d), Z.updateStatus(i, "running", 0), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
  const u = gt.get(t);
  if (!u) {
    const R = `No connector registered for format: ${t}`;
    throw Z.updateStatus(i, "failed", 0, R), j("error", "import", `${R} — repository unchanged.`), new Error(R);
  }
  H(c, "create-snapshot", "running"), j("info", "repository", "Creating pre-import snapshot…");
  const l = await Zs(F(), i), f = await so(F(), {
    sessionId: i,
    connectorId: t,
    sourceFile: s,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: F(),
    snapshotPath: l,
    validationPassed: !0,
    plannedCreates: a.estimatedSourcesToCreate,
    plannedUpdates: a.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: l, manifestPath: "" }
  });
  H(c, "create-snapshot", "complete", S.basename(l)), j("info", "repository", `Snapshot saved: ${l}`), H(c, "analyze-export", "running"), await ft(
    `Analyze export: using cached package=${!!(Q && Me === e)}, documents=${(Q == null ? void 0 : Q.documents.length) ?? "unknown"}`
  );
  const m = {
    repositoryPath: F(),
    outputDirectory: ae.settings.outputDirectory,
    jobId: i,
    importPackage: Me === e ? Q ?? void 0 : void 0,
    sourceZipPath: e,
    log: (R, T) => j(R, "import", T),
    onProgress: (R) => {
      Z.updateStatus(i, "running", R), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
    }
  };
  j("info", "import", `Import started: ${s}`);
  const y = await u.import(o, m);
  if (!y.success || y.documents.length === 0) {
    const R = ((g = y.errors) == null ? void 0 : g.join("; ")) || "Import produced no documents";
    throw H(c, "analyze-export", "failed", R), Z.updateStatus(i, "failed", 100, R), j(
      "error",
      "import",
      `Import failed after snapshot — repository may be partially updated. Rollback: ${l}. Error: ${R}`
    ), new Error(
      `Import failed. Snapshot available at ${l}. What happened: connector produced no documents. Why: ${R}. Recovery: restore from snapshot if needed.`
    );
  }
  H(c, "analyze-export", "complete", `${y.documents.length} documents`), H(c, "generate-sources", "running"), Z.updateStatus(i, "running", 85), L == null || L.webContents.send("kae:job-updated", Z.getById(i)), H(c, "update-repository", "running");
  const I = await Bs.export(y.documents, F(), {
    log: (R, T) => j(R, "export", T),
    onProgress: (R) => {
      Z.updateStatus(i, "running", 85 + Math.round(R * 0.15)), L == null || L.webContents.send("kae:job-updated", Z.getById(i));
    },
    importFileName: s,
    sourceZipPath: e
  });
  H(c, "generate-sources", "complete"), H(c, "update-repository", "complete", `${I.sourcesCreated} sources`), H(c, "update-registries", "complete", I.reviewFile ?? "Registries updated"), H(c, "health-check", "running");
  const A = await ge(F());
  H(c, "health-check", "complete", A.statusSubline), H(c, "git-readiness", "running");
  const C = A.gitReadiness;
  H(c, "git-readiness", "complete", C.status);
  const b = Date.now() - n, x = gt.get(t), h = {
    conversationsFound: ((w = y.summary) == null ? void 0 : w.conversationsFound) ?? y.documents.length,
    sourcesCreated: I.sourcesCreated,
    skippedDuplicates: I.skippedDuplicates,
    errors: [...y.errors ?? [], ...I.errors],
    outputFolder: I.outputFolder,
    createdSourceIds: I.createdSourceIds,
    classified: I.classified,
    uncertain: I.uncertain,
    reviewFile: I.reviewFile,
    durationMs: b,
    connectorId: t,
    connectorName: (x == null ? void 0 : x.name) ?? t,
    sessionsCreated: I.sessionsCreated ?? I.sourcesCreated,
    snapshotPath: l,
    gitReadiness: C,
    timeline: [...c]
  }, p = {
    reportId: i,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs: b,
    connectorId: t,
    connectorName: (x == null ? void 0 : x.name) ?? "ChatGPT Connector",
    sourceFile: s,
    repositoryPath: F(),
    imported: I.sourcesCreated,
    updated: a.estimatedSourcesToUpdate,
    skipped: I.skippedDuplicates,
    warnings: a.warnings,
    errors: h.errors,
    sourcesCreated: I.createdSourceIds,
    sessionsCreated: I.sessionsCreated ?? I.sourcesCreated,
    registriesUpdated: ((E = a.diffPreview) == null ? void 0 : E.registriesUpdated) ?? [],
    snapshotPath: l,
    manifestPath: f,
    gitReadiness: C,
    reportFilePath: ""
  };
  try {
    h.importReportPath = await Fo(F(), p), j("info", "import", `Import report saved: ${h.importReportPath}`);
  } catch (R) {
    const T = R instanceof Error ? R.message : String(R);
    h.errors.push(`Import report: ${T}`), j("warn", "import", `Could not write import report: ${T}`);
  }
  H(c, "complete", "complete", `Done in ${(b / 1e3).toFixed(1)}s`), h.timeline = [...c], qr = h;
  const v = Z.getById(i);
  return v.summary = h, Z.updateStatus(i, "completed", 100), j(
    "info",
    "import",
    `Import complete in ${b}ms: ${h.sourcesCreated} source(s), ${h.skippedDuplicates} skipped`,
    { summary: h, snapshotPath: l, manifestPath: f }
  ), L == null || L.webContents.send("kae:job-updated", Z.getById(i)), je(), L == null || L.webContents.send("kae:import-complete", h), h;
}
function _d() {
  N.handle(
    "kae:get-importers",
    () => gt.getAll().map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      supportedExtensions: e.supportedExtensions
    }))
  ), N.handle("kae:get-repository-config", () => ae.repository), N.handle("kae:set-repository-config", async (e, t) => (ae.repository = t, await ie(), j("info", "repository", `Repository path set to ${t.path}`), ae.repository)), N.handle("kae:get-settings", () => Re()), N.handle("kae:set-settings", async (e, t) => (ae.settings = kn(t), await bd(Re()), await pe(), j("info", "settings", "Application settings updated"), Re())), N.handle("kae:get-jobs", () => Z.getAll()), N.handle("kae:get-logs", () => dt), N.handle("kae:get-default-repository-path", () => xs), N.handle("kae:get-repository-health", async () => ge(F())), N.handle("kae:get-git-readiness", async () => (await ge(F())).gitReadiness), N.handle("kae:get-repository-stats", async () => or(F())), N.handle("kae:browse-repository", async () => St(F())), N.handle(
    "kae:read-repository-file",
    async (e, t) => He(F(), t)
  ), N.handle("kae:parse-chatgpt-source", async (e, t) => {
    const n = await He(F(), t), s = pn(n);
    if (!s) return null;
    const r = new Set(s.fileReferences);
    for (const o of s.messages)
      for (const c of o.fileReferences) r.add(c);
    const i = await lo(F(), [...r]);
    return { parsed: s, assets: i };
  }), N.handle(
    "kae:read-repository-asset",
    async (e, t, n) => {
      const s = lt(t), r = await k.readFile(s), i = mn(r, n ?? S.basename(t)), o = t.replace(/\\/g, "/");
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(o)}`,
        mimeType: i,
        sizeBytes: r.length
      };
    }
  ), N.handle(
    "kae:list-chatgpt-import-entries",
    async () => Vs(F())
  ), N.handle(
    "kae:search-repository",
    async (e, t) => Do(F(), t)
  ), N.handle("kae:build-evidence-index", async () => {
    const e = await Je(F());
    return await be(F()), je(), Io(e);
  }), N.handle("kae:search-knowledge", async (e, t) => {
    const n = await rr(F(), t);
    return sr(n);
  }), N.handle(
    "kae:resolve-evidence-drilldown",
    async (e, t, n) => la(F(), t, n)
  ), N.handle(
    "kae:answer-knowledge-question",
    async (e, t, n) => {
      const s = await vs(n);
      return await pe(), Lc(F(), t, s);
    }
  ), N.handle(
    "kae:answer-knowledge-question-stream",
    async (e, t, n) => {
      const s = await vs({ ...n, streaming: !0 });
      return await pe(), Pc(F(), t, s, (r) => {
        e.sender.send("kae:reasoning-stream-chunk", r);
      });
    }
  ), N.handle("kae:list-ai-providers", () => Ke().listCapabilities()), N.handle("kae:test-ai-provider", async (e, t) => {
    await pe();
    const n = Ke();
    return t && n.setActive(t), n.testProviderHealth(t ?? Re().aiProvider);
  }), N.handle("kae:get-provider-health", async () => (await pe(), Ke().testActiveProviderHealth())), N.handle("kae:get-provider-key-status", async () => ({
    secureStorage: zr(),
    providers: await Rd()
  })), N.handle("kae:set-provider-api-key", async (e, t, n) => (await Ed(t, n), await pe(), Zr(t))), N.handle("kae:capture-live-session", async (e, t) => {
    const n = await pu(F(), t);
    return je(), L == null || L.webContents.send("kae:executive-briefing-updated"), L == null || L.webContents.send("kae:executive-memory-updated"), j("info", "live-capture", `Captured live session ${n.krcId}`, {
      source: n.sourceRelativePath
    }), n;
  }), N.handle("kae:build-relationship-index", async () => {
    const e = await be(F());
    return je(), za(e);
  }), N.handle("kae:search-relationships", async (e, t) => {
    const n = await Ze(F());
    return Wt(n, t);
  }), N.handle("kae:get-relationships-for-evidence", async (e, t) => {
    const n = await Ze(F());
    return gr(n, t);
  }), N.handle(
    "kae:get-related-evidence",
    async (e, t, n) => yr(F(), t, n)
  ), N.handle("kae:get-executive-briefing", async () => kr(F())), N.handle(
    "kae:refresh-executive-briefing",
    async () => Qe(F())
  ), N.handle("kae:load-active-vigsy-conversation", async () => {
    const e = await jc(F());
    return e && await us(F(), e), e;
  }), N.handle("kae:save-vigsy-conversation", async (e, t) => {
    const n = await Pr(F(), t);
    return t.turns.length > 0 && (await iu(F(), t), L == null || L.webContents.send("kae:executive-memory-updated"), L == null || L.webContents.send("kae:executive-briefing-updated"), L == null || L.webContents.send("kae:vigsy-refreshed")), n;
  }), N.handle("kae:create-vigsy-conversation", async () => {
    await su(F());
    const e = await Kc(F());
    return await us(F(), e), e;
  }), N.handle("kae:delete-vigsy-conversation", async (e, t) => {
    await ru(F(), t), await Gc(F(), t);
  }), N.handle("kae:get-executive-continuity", async () => ou(F())), N.handle("kae:open-repository-path", async () => {
    await bt.openPath(F());
  }), N.handle("kae:open-repository-file", async (e, t) => {
    await bt.openPath(lt(t));
  }), N.handle("kae:reveal-repository-file", async (e, t) => {
    bt.showItemInFolder(lt(t));
  }), N.handle("kae:copy-text", async (e, t) => (Qr.writeText(t), !0)), N.handle("kae:get-last-validation", () => oe), N.handle("kae:get-last-import-summary", () => qr), N.handle("kae:get-last-repair-plan", () => Zt), N.handle("kae:get-last-repair-result", () => Vt), N.handle("kae:select-zip-file", async () => {
    const e = await Tn.showOpenDialog({
      title: "Select ChatGPT Export ZIP",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });
    return e.canceled ? null : e.filePaths[0] ?? null;
  }), N.handle("kae:analyze-repository-repair", async () => {
    j("info", "repair", "Repository repair analysis started (read-only)");
    const e = await Go(F());
    return Zt = e, Vt = null, j("info", "repair", `Repair analysis complete: ${e.issues.length} issue(s), ${e.autoRepairCount} auto-repair action(s)`, {
      issueCount: e.issues.length,
      autoRepairCount: e.autoRepairCount,
      manualReviewCount: e.manualReviewCount
    }), e;
  }), N.handle("kae:execute-repository-repair", async (e, t) => {
    j("info", "repair", `Repository repair confirmed — ${t.autoRepairCount} safe action(s) will be applied`);
    const n = await Xo(t, {
      log: (s, r, i) => j(s, "repair", r, i)
    });
    return Vt = n, Zt = t, j("info", "repair", `Repository repair complete: ${n.filesChanged.length} file(s) changed`, {
      snapshotPath: n.snapshotPath,
      duplicatesBefore: n.healthBefore.duplicateIds,
      duplicatesAfter: n.healthAfter.duplicateIds,
      ready: n.healthAfter.ready
    }), n;
  }), N.handle("kae:validate-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Dd(t);
  }), N.handle("kae:cancel-validation", () => he ? (he.abort(), j("warn", "import", "Validation cancelled by user — repository unchanged"), Yr({
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
  }), !0) : !1), N.handle("kae:import-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return $d(t, "chatgpt-export-zip");
  }), N.handle("kae:get-connector-statuses", async () => (await ie(), fe().getStatuses({
    repositoryPath: F(),
    log: (e, t) => j(e, "connector", t)
  }))), N.handle("kae:connect-connector", async (e, t, n) => (await ie(), fe().connect(t, n, {
    repositoryPath: F(),
    log: (s, r) => j(s, "connector", r)
  }))), N.handle("kae:disconnect-connector", async (e, t) => (await ie(), await fe().disconnect(t), !0)), N.handle("kae:update-connector-config", async (e, t, n) => (await ie(), fe().updateConfig(t, n))), N.handle("kae:sync-connector", async (e, t, n) => {
    await ie();
    const s = n ? {
      path: n,
      name: S.basename(n),
      extension: S.extname(n)
    } : null, r = await fe().syncNow(t, s, {
      repositoryPath: F(),
      log: (i, o) => j(i, "connector", o)
    });
    return r.briefingGeneratedAt && je(), r;
  }), N.handle("kae:get-connector-sync-history", async (e, t) => (await ie(), fe().getSyncHistory(t))), N.handle("kae:select-folder", async () => {
    const e = await Tn.showOpenDialog(L, {
      properties: ["openDirectory"]
    });
    return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
  });
}
ke.whenReady().then(async () => {
  ae.settings = kn(await kd()), await pe(), Ss.handle("kae-asset", async (e) => {
    const t = Ad(e.url), n = lt(t), s = await k.readFile(n), r = mn(s, S.basename(t));
    return new Response(s, { headers: { "Content-Type": r } });
  }), xd(), await ie(), _d(), j("info", "system", `${bs} started — ${As}`), Is(), ke.on("activate", () => {
    Es.getAllWindows().length === 0 && Is();
  });
});
ke.on("window-all-closed", () => {
  process.platform !== "darwin" && ke.quit();
});
export {
  De as B,
  pd as C,
  vd as D,
  wd as H,
  Ju as I,
  yd as M,
  gd as P,
  Id as T,
  hd as a,
  ud as b,
  Ht as c,
  ed as d,
  Br as e,
  nd as f,
  td as g,
  Ur as h,
  gt as i,
  Mr as p,
  Kr as r,
  gs as s,
  Gr as v
};
