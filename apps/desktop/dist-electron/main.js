var rr = Object.defineProperty;
var ir = (e, t, n) => t in e ? rr(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var U = (e, t, n) => ir(e, typeof t != "symbol" ? t + "" : t, n);
import { protocol as Mn, app as We, BrowserWindow as jn, ipcMain as O, shell as ot, clipboard as or, dialog as ar } from "electron";
import T from "node:fs/promises";
import S from "node:path";
import { fileURLToPath as cr } from "node:url";
import dr from "fs";
import At from "path";
import Bn from "zlib";
import ur from "crypto";
import { execFile as Gn } from "node:child_process";
import { promisify as zn } from "node:util";
import { randomUUID as q } from "node:crypto";
const Kn = "KAE", Zn = "Knowledge Acquisition Engine";
function lr(e) {
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
function fr(e) {
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
class Hn extends Error {
  constructor(t) {
    super(`${t} is not implemented yet (Phase 1 architecture only).`), this.name = "NotImplementedError";
  }
}
const Vn = "C:\\Users\\alber\\Axiom-Knowledge", Nt = {
  theme: "dark",
  logLevel: "info",
  maxConcurrentJobs: 2,
  outputDirectory: "./output",
  aiProvider: "mock"
}, pr = {
  path: Vn,
  name: "Axiom Knowledge",
  autoSync: !1
};
function mr() {
  return {
    repository: { ...pr },
    settings: { ...Nt }
  };
}
function hr(e, t, n) {
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
class gr {
  constructor() {
    U(this, "jobs", []);
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
const yr = {
  mock: "Here's what I found:",
  openai: "OpenAI summary:",
  claude: "Claude read on this:",
  gemini: "Gemini analysis:",
  openrouter: "OpenRouter synthesis:",
  ollama: "Local model view:"
}, vr = {
  mock: "Supporting detail:",
  openai: "GPT rationale:",
  claude: "Claude reasoning:",
  gemini: "Gemini context:",
  openrouter: "Router notes:",
  ollama: "Local notes:"
};
function Te(e, t, n) {
  const s = e.groundedAnswer.directAnswer.trim(), r = e.groundedAnswer.reasonedSummary.trim(), i = yr[t], o = vr[t], c = /^here'?s what i found/i.test(s) ? s.replace(/^here'?s what i found:?\s*/i, `${i} `) : `${i} ${s}`;
  return {
    providerId: t,
    model: n ?? "offline",
    directAnswer: c,
    reasonedSummary: `${o} ${r}`,
    usedOfflineFallback: !0
  };
}
function Ir(e) {
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
async function wr(e) {
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
function Er() {
  return {
    capabilities: {
      id: "mock",
      displayName: "Mock (offline)",
      supportsStreaming: !1,
      supportsTools: !1,
      requiresApiKey: !1,
      offline: !0,
      defaultModel: "mock-v1"
    },
    async reason(e) {
      return Te(e, "mock");
    }
  };
}
function Sr() {
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
function Fe(e, t, n, s, r, i, o) {
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
        return Te(c, e, d);
      const l = Ir(c);
      try {
        const u = { "Content-Type": "application/json" };
        e === "claude" && (a != null && a.apiKey) ? (u["x-api-key"] = a.apiKey, u["anthropic-version"] = "2023-06-01") : a != null && a.apiKey && (u.Authorization = `Bearer ${a.apiKey}`);
        const f = await fetch(s(a ?? {}), {
          method: "POST",
          headers: u,
          body: JSON.stringify(r(l, d))
        });
        if (!f.ok)
          return { ...Te(c, e, d), usedOfflineFallback: !0 };
        const g = await f.json(), y = i(g), w = y ? await wr(y) : null;
        return w ? {
          providerId: e,
          model: d,
          directAnswer: w.directAnswer,
          reasonedSummary: w.reasonedSummary
        } : { ...Te(c, e, d), usedOfflineFallback: !0 };
      } catch {
        return { ...Te(c, e, d), usedOfflineFallback: !0 };
      }
    }
  };
}
const Rr = Fe("openai", "OpenAI", "gpt-4o-mini", () => "https://api.openai.com/v1/chat/completions", (e, t) => ({
  model: t,
  messages: [
    { role: "system", content: "Respond with JSON only." },
    { role: "user", content: e }
  ],
  temperature: 0.2
}), (e) => {
  var n, s, r;
  return ((r = (s = (n = e.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), Cr = Fe("claude", "Claude", "claude-3-5-haiku-latest", () => "https://api.anthropic.com/v1/messages", (e, t) => ({
  model: t,
  max_tokens: 1024,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n, s;
  return ((s = (n = e.content) == null ? void 0 : n[0]) == null ? void 0 : s.text) ?? null;
}, !0), kr = Fe("gemini", "Gemini", "gemini-1.5-flash", (e) => `https://generativelanguage.googleapis.com/v1beta/models/${e.model ?? "gemini-1.5-flash"}:generateContent?key=${e.apiKey ?? ""}`, (e) => ({
  contents: [{ parts: [{ text: e }] }]
}), (e) => {
  var n, s, r, i, o;
  return ((o = (i = (r = (s = (n = e.candidates) == null ? void 0 : n[0]) == null ? void 0 : s.content) == null ? void 0 : r.parts) == null ? void 0 : i[0]) == null ? void 0 : o.text) ?? null;
}, !0), xr = Fe("openrouter", "OpenRouter", "openai/gpt-4o-mini", () => "https://openrouter.ai/api/v1/chat/completions", (e, t) => ({
  model: t,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n, s, r;
  return ((r = (s = (n = e.choices) == null ? void 0 : n[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) ?? null;
}, !0), Tr = Fe("ollama", "Local (Ollama)", "llama3.2", (e) => `${e.baseUrl ?? "http://127.0.0.1:11434"}/api/chat`, (e, t) => ({
  model: t,
  stream: !1,
  messages: [{ role: "user", content: e }]
}), (e) => {
  var n;
  return ((n = e.message) == null ? void 0 : n.content) ?? null;
}, !1);
class Dr {
  constructor(t) {
    U(this, "providers", /* @__PURE__ */ new Map());
    U(this, "activeId", "mock");
    U(this, "credentials", {});
    for (const n of t ?? _r())
      this.providers.set(n.capabilities.id, n);
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
  listCapabilities() {
    return [...this.providers.values()].map((t) => t.capabilities);
  }
  async reason(t) {
    return this.getActive().reason(t, this.credentials);
  }
}
function _r() {
  return [
    Sr(),
    Er(),
    Rr,
    Cr,
    kr,
    xr,
    Tr
  ];
}
function Ar() {
  return new Dr();
}
let at = null;
function Wn() {
  return at || (at = Ar()), at;
}
function Nr(e, t) {
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
class ge {
  canImport(t) {
    var s;
    const n = ((s = t.extension) == null ? void 0 : s.toLowerCase()) ?? "";
    return this.supportedExtensions.some((r) => r.toLowerCase() === n);
  }
  async import(t, n) {
    throw new Hn(`Importer "${this.name}"`);
  }
}
class $r {
  constructor() {
    U(this, "plugins", /* @__PURE__ */ new Map());
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
const qe = new $r(), qn = [
  "VIGS",
  "Founder OS",
  "Axiom",
  "Book",
  "Knowledge Recovery",
  "Source Material",
  "Technical Build",
  "Other / Review Needed"
], tn = 2, br = 3, kt = {
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
function $t(e) {
  var g, y, w, x;
  const t = Lr(e), n = Or(t), s = Fr(t, e, n), r = qn.filter((C) => C !== "Other / Review Needed").map((C) => ({ category: C, score: s[C] })).sort((C, k) => k.score - C.score), i = ((g = r[0]) == null ? void 0 : g.score) ?? 0, o = ((y = r[1]) == null ? void 0 : y.score) ?? 0;
  let c = r.filter((C) => C.score >= tn).map((C) => C.category), a = !1, d, l;
  i < br || i === 0 ? (a = !0, d = "Other / Review Needed", c = c.length > 0 ? [...c, "Other / Review Needed"] : ["Other / Review Needed"], l = `Low classification confidence (top score ${i}). Routed to review.`) : i === o && i >= tn ? (a = !0, d = "Other / Review Needed", c = [.../* @__PURE__ */ new Set([...c, "Other / Review Needed"])], l = `Tied scores between "${(w = r[0]) == null ? void 0 : w.category}" and "${(x = r[1]) == null ? void 0 : x.category}". Routed to review.`) : (d = r[0].category, c.length === 0 && (c = [d]), l = `Primary match "${d}" (score ${i}) from title, content, and recurring terms.`);
  const u = e.metadata.messageCount;
  typeof u == "number" && u === 0 && (a = !0, d = "Other / Review Needed", c.includes("Other / Review Needed") || (c = [...c, "Other / Review Needed"]), l = "No extractable messages. Preserved for manual review.");
  const f = Math.min(100, Math.round(i / Math.max(i + o, 1) * 100));
  return {
    categories: [...new Set(c)],
    primaryCategory: d,
    confidence: a ? Math.min(f, 40) : f,
    inferredProject: Pr(d, e.title, n),
    recurringTerms: n.slice(0, 12),
    uncertain: a,
    rationale: l,
    categoryScores: s
  };
}
function bt(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    t.set(String(n.metadata.conversationId ?? n.id), $t(n));
  return t;
}
function Lr(e) {
  const t = Array.isArray(e.metadata.fileReferences) ? e.metadata.fileReferences.filter((n) => typeof n == "string").join(" ") : "";
  return `${e.title} ${e.content} ${t}`.toLowerCase();
}
function Fr(e, t, n) {
  const s = Object.fromEntries(qn.map((r) => [r, 0]));
  for (const [r, i] of Object.entries(kt))
    for (const o of i)
      e.includes(o) && (s[r] += o.includes(" ") ? 3 : 1);
  typeof t.metadata.pastedTranscriptCount == "number" && t.metadata.pastedTranscriptCount > 0 && (s["Source Material"] += 4);
  for (const r of n.slice(0, 5))
    for (const [i, o] of Object.entries(kt))
      o.some((c) => c.includes(r) || r.includes(c.split(" ")[0] ?? "")) && (s[i] += 1);
  return s["Other / Review Needed"] = 0, s;
}
function Or(e) {
  const t = e.replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((s) => s.length >= 5), n = /* @__PURE__ */ new Map();
  for (const s of t)
    n.set(s, (n.get(s) ?? 0) + 1);
  return [...n.entries()].filter(([, s]) => s >= 2).sort((s, r) => r[1] - s[1]).map(([s]) => s);
}
function Pr(e, t, n) {
  if (e !== "Other / Review Needed")
    return e;
  const s = t.toLowerCase();
  for (const [r, i] of Object.entries(kt))
    if (i.some((o) => s.includes(o)))
      return `${r} (uncertain)`;
  return n.length > 0 ? `Unlabeled — terms: ${n.slice(0, 3).join(", ")}` : "Unlabeled";
}
function Ur(e, t) {
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
function Mr(e, t, n) {
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
function jr(e, t, n, s) {
  const r = bt(n);
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
const Br = 500, Gr = /* @__PURE__ */ new Set(["system"]);
function zr(e) {
  if (!Array.isArray(e) || e.length === 0)
    return !1;
  const t = e[0];
  return typeof t == "object" && t !== null && "mapping" in t && typeof t.mapping == "object";
}
function Kr(e) {
  return Yn(e).map(Jn);
}
function Yn(e) {
  const t = JSON.parse(e);
  if (!Array.isArray(t))
    throw new Error("conversations.json must be a JSON array.");
  if (!zr(t))
    throw new Error("Unrecognized export format: expected ChatGPT conversations.json structure.");
  return t;
}
async function Zr(e, t = {}) {
  const { signal: n, batchSize: s = 25, onProgress: r } = t, i = [];
  let o = 0;
  for (let c = 0; c < e.length; c++) {
    if (n != null && n.aborted)
      throw new Error("Validation cancelled by user.");
    const a = Jn(e[c]);
    i.push(a), o += a.messages.length, (c % s === 0 || c === e.length - 1) && (r == null || r({
      conversationsTotal: e.length,
      conversationsProcessed: c + 1,
      messagesProcessed: o
    }), await new Promise((d) => setImmediate(d)));
  }
  return i;
}
function Jn(e) {
  var c;
  const t = e.conversation_id ?? e.id ?? Jr(), n = (((c = e.title) == null ? void 0 : c.trim()) || "Untitled Conversation").slice(0, 200), r = Hr(e).map((a) => Wr(a.message)).filter((a) => a !== null), i = r.filter((a) => a.isPastedTranscript).map((a) => a.text), o = [...new Set(r.flatMap((a) => a.fileReferences))];
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
function Hr(e) {
  const t = e.mapping ?? {};
  let n = e.current_node;
  if ((!n || !t[n]) && (n = Vr(t)), !n)
    return [];
  const s = [], r = /* @__PURE__ */ new Set();
  for (; n && t[n] && !r.has(n); )
    r.add(n), s.push(t[n]), n = t[n].parent;
  return s.reverse();
}
function Vr(e) {
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
function Wr(e) {
  var r;
  if (!((r = e == null ? void 0 : e.author) != null && r.role))
    return null;
  const t = e.author.role;
  if (Gr.has(t))
    return null;
  const n = qr(e).trim();
  if (!n)
    return null;
  const s = Yr(e, n);
  return {
    role: t,
    text: n,
    createTime: e.create_time ?? void 0,
    isPastedTranscript: t === "user" && n.length >= Br,
    fileReferences: s
  };
}
function qr(e) {
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
function Yr(e, t) {
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
function Jr() {
  return `unknown-${Date.now()}`;
}
function Xr(e) {
  const t = [];
  for (const n of e) {
    const s = n.role === "user" ? "User" : n.role === "assistant" ? "Assistant" : n.role;
    if (t.push(`### ${s}`), n.createTime && t.push(`*${Qr(n.createTime)}*`), t.push(""), t.push(n.text), t.push(""), n.fileReferences.length > 0) {
      t.push("**File references:**");
      for (const r of n.fileReferences)
        t.push(`- ${r}`);
      t.push("");
    }
  }
  return t.join(`
`).trim();
}
function Qr(e) {
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Xn(e, t, n = {}) {
  const { sharedAssetList: s } = n, r = Xr(e.messages), i = e.pastedTranscripts.length > 0 ? `

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
function ei(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var re = { exports: {} }, ct, nn;
function Qn() {
  return nn || (nn = 1, ct = {
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
  }), ct;
}
var dt = {}, sn;
function Lt() {
  return sn || (sn = 1, (function(e) {
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
  })(dt)), dt;
}
var ut, rn;
function ti() {
  if (rn) return ut;
  rn = 1;
  const e = dr, t = At, n = Qn(), s = Lt(), r = typeof process == "object" && process.platform === "win32", i = (a) => typeof a == "object" && a !== null, o = new Uint32Array(256).map((a, d) => {
    for (let l = 0; l < 8; l++)
      (d & 1) !== 0 ? d = 3988292384 ^ d >>> 1 : d >>>= 1;
    return d >>> 0;
  });
  function c(a) {
    this.sep = t.sep, this.fs = e, i(a) && i(a.fs) && typeof a.fs.statSync == "function" && (this.fs = a.fs);
  }
  return ut = c, c.prototype.makeDir = function(a) {
    const d = this;
    function l(u) {
      let f = u.split(d.sep)[0];
      u.split(d.sep).forEach(function(g) {
        if (!(!g || g.substr(-1, 1) === ":")) {
          f += d.sep + g;
          var y;
          try {
            y = d.fs.statSync(f);
          } catch (w) {
            if (w.message && w.message.startsWith("ENOENT"))
              d.fs.mkdirSync(f);
            else
              throw w;
          }
          if (y && y.isFile()) throw s.FILE_IN_THE_WAY(`"${f}"`);
        }
      });
    }
    l(a);
  }, c.prototype.writeFileTo = function(a, d, l, u) {
    const f = this;
    if (f.fs.existsSync(a)) {
      if (!l) return !1;
      var g = f.fs.statSync(a);
      if (g.isDirectory())
        return !1;
    }
    var y = t.dirname(a);
    f.fs.existsSync(y) || f.makeDir(y);
    var w;
    try {
      w = f.fs.openSync(a, "w", 438);
    } catch {
      f.fs.chmodSync(a, 438), w = f.fs.openSync(a, "w", 438);
    }
    if (w)
      try {
        f.fs.writeSync(w, d, 0, d.length, 0);
      } finally {
        f.fs.closeSync(w);
      }
    return f.fs.chmodSync(a, u || 438), !0;
  }, c.prototype.writeFileToAsync = function(a, d, l, u, f) {
    typeof u == "function" && (f = u, u = void 0);
    const g = this;
    g.fs.exists(a, function(y) {
      if (y && !l) return f(!1);
      g.fs.stat(a, function(w, x) {
        if (y && x.isDirectory())
          return f(!1);
        var C = t.dirname(a);
        g.fs.exists(C, function(k) {
          k || g.makeDir(C), g.fs.open(a, "w", 438, function(_, m) {
            _ ? g.fs.chmod(a, 438, function() {
              g.fs.open(a, "w", 438, function(p, I) {
                g.fs.write(I, d, 0, d.length, 0, function() {
                  g.fs.close(I, function() {
                    g.fs.chmod(a, u || 438, function() {
                      f(!0);
                    });
                  });
                });
              });
            }) : m ? g.fs.write(m, d, 0, d.length, 0, function() {
              g.fs.close(m, function() {
                g.fs.chmod(a, u || 438, function() {
                  f(!0);
                });
              });
            }) : g.fs.chmod(a, u || 438, function() {
              f(!0);
            });
          });
        });
      });
    });
  }, c.prototype.findFiles = function(a) {
    const d = this;
    function l(u, f, g) {
      let y = [];
      return d.fs.readdirSync(u).forEach(function(w) {
        const x = t.join(u, w), C = d.fs.statSync(x);
        y.push(t.normalize(x) + (C.isDirectory() ? d.sep : "")), C.isDirectory() && g && (y = y.concat(l(x, f, g)));
      }), y;
    }
    return l(a, void 0, !0);
  }, c.prototype.findFilesAsync = function(a, d) {
    const l = this;
    let u = [];
    l.fs.readdir(a, function(f, g) {
      if (f) return d(f);
      let y = g.length;
      if (!y) return d(null, u);
      g.forEach(function(w) {
        w = t.join(a, w), l.fs.stat(w, function(x, C) {
          if (x) return d(x);
          C && (u.push(t.normalize(w) + (C.isDirectory() ? l.sep : "")), C.isDirectory() ? l.findFilesAsync(w, function(k, _) {
            if (k) return d(k);
            u = u.concat(_), --y || d(null, u);
          }) : --y || d(null, u));
        });
      });
    });
  }, c.prototype.getAttributes = function() {
  }, c.prototype.setAttributes = function() {
  }, c.crc32update = function(a, d) {
    return o[(a ^ d) & 255] ^ a >>> 8;
  }, c.crc32 = function(a) {
    typeof a == "string" && (a = Buffer.from(a, "utf8"));
    let d = a.length, l = -1;
    for (let u = 0; u < d; ) l = c.crc32update(l, a[u++]);
    return ~l >>> 0;
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
    const l = a.length >>> 0;
    for (let u = l - 1; u >= 0; u--)
      if (d(a[u], u, a))
        return a[u];
  }, c.sanitize = function(a, d) {
    a = t.resolve(t.normalize(a));
    for (var l = d.split("/"), u = 0, f = l.length; u < f; u++) {
      var g = t.normalize(t.join(a, l.slice(u, f).join(t.sep)));
      if (g === a || g.startsWith(a + t.sep))
        return g;
    }
    return t.normalize(t.join(a, t.basename(d)));
  }, c.toBuffer = function(d, l) {
    return Buffer.isBuffer(d) ? d : d instanceof Uint8Array ? Buffer.from(d) : typeof d == "string" ? l(d) : Buffer.alloc(0);
  }, c.readBigUInt64LE = function(a, d) {
    const l = a.readUInt32LE(d);
    return a.readUInt32LE(d + 4) * 4294967296 + l;
  }, c.writeBigUInt64LE = function(a, d, l) {
    const u = d >>> 0, f = Math.floor(d / 4294967296) >>> 0;
    a.writeUInt32LE(u, l), a.writeUInt32LE(f, l + 4);
  }, c.fromDOS2Date = function(a) {
    return new Date((a >> 25 & 127) + 1980, Math.max((a >> 21 & 15) - 1, 0), Math.max(a >> 16 & 31, 1), a >> 11 & 31, a >> 5 & 63, (a & 31) << 1);
  }, c.fromDate2DOS = function(a) {
    let d = 0, l = 0;
    return a.getFullYear() > 1979 && (d = (a.getFullYear() - 1980 & 127) << 9 | a.getMonth() + 1 << 5 | a.getDate(), l = a.getHours() << 11 | a.getMinutes() << 5 | a.getSeconds() >> 1), d << 16 | l;
  }, c.isWin = r, c.crcTable = o, ut;
}
var lt, on;
function ni() {
  if (on) return lt;
  on = 1;
  const e = At;
  return lt = function(t, { fs: n }) {
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
  }, lt;
}
var ft, an;
function si() {
  return an || (an = 1, ft = {
    efs: !0,
    encode: (e) => Buffer.from(e, "utf8"),
    decode: (e) => e.toString("utf8")
  }), ft;
}
var cn;
function Oe() {
  return cn || (cn = 1, re.exports = ti(), re.exports.Constants = Qn(), re.exports.Errors = Lt(), re.exports.FileAttr = ni(), re.exports.decoder = si()), re.exports;
}
var je = {}, pt, dn;
function ri() {
  if (dn) return pt;
  dn = 1;
  var e = Oe(), t = e.Constants;
  return pt = function() {
    var n = 20, s = 10, r = 0, i = 0, o = 0, c = 0, a = 0, d = 0, l = 0, u = 0, f = 0, g = 0, y = 0, w = 0, x = 0;
    n |= e.isWin ? 2560 : 768, r |= t.FLG_EFS;
    const C = {
      extraLen: 0
    }, k = (m) => Math.max(0, m) >>> 0, _ = (m) => Math.max(0, m) & 255;
    return o = e.fromDate2DOS(/* @__PURE__ */ new Date()), {
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
        return o;
      },
      set timeval(m) {
        o = k(m);
      },
      get timeHighByte() {
        return _(o >>> 8);
      },
      get crc() {
        return c;
      },
      set crc(m) {
        c = k(m);
      },
      get compressedSize() {
        return a;
      },
      set compressedSize(m) {
        a = k(m);
      },
      get size() {
        return d;
      },
      set size(m) {
        d = k(m);
      },
      get fileNameLength() {
        return l;
      },
      set fileNameLength(m) {
        l = m;
      },
      get extraLength() {
        return u;
      },
      set extraLength(m) {
        u = m;
      },
      get extraLocalLength() {
        return C.extraLen;
      },
      set extraLocalLength(m) {
        C.extraLen = m;
      },
      get commentLength() {
        return f;
      },
      set commentLength(m) {
        f = m;
      },
      get diskNumStart() {
        return g;
      },
      set diskNumStart(m) {
        g = k(m);
      },
      get inAttr() {
        return y;
      },
      set inAttr(m) {
        y = k(m);
      },
      get attr() {
        return w;
      },
      set attr(m) {
        w = k(m);
      },
      // get Unix file permissions
      get fileAttr() {
        return (w || 0) >> 16 & 4095;
      },
      get offset() {
        return x;
      },
      set offset(m) {
        x = k(m);
      },
      get encrypted() {
        return (r & t.FLG_ENC) === t.FLG_ENC;
      },
      get centralHeaderSize() {
        return t.CENHDR + l + u + f;
      },
      get realDataOffset() {
        return x + t.LOCHDR + C.fnameLen + C.extraLen;
      },
      get localHeader() {
        return C;
      },
      loadLocalHeaderFromBinary: function(m) {
        var p = m.slice(x, x + t.LOCHDR);
        if (p.readUInt32LE(0) !== t.LOCSIG)
          throw e.Errors.INVALID_LOC();
        C.version = p.readUInt16LE(t.LOCVER), C.flags = p.readUInt16LE(t.LOCFLG), C.flags_desc = (C.flags & t.FLG_DESC) > 0, C.method = p.readUInt16LE(t.LOCHOW), C.time = p.readUInt32LE(t.LOCTIM), C.crc = p.readUInt32LE(t.LOCCRC), C.compressedSize = p.readUInt32LE(t.LOCSIZ), C.size = p.readUInt32LE(t.LOCLEN), C.fnameLen = p.readUInt16LE(t.LOCNAM), C.extraLen = p.readUInt16LE(t.LOCEXT);
        const I = x + t.LOCHDR + C.fnameLen, h = I + C.extraLen;
        return m.slice(I, h);
      },
      loadFromBinary: function(m) {
        if (m.length !== t.CENHDR || m.readUInt32LE(0) !== t.CENSIG)
          throw e.Errors.INVALID_CEN();
        n = m.readUInt16LE(t.CENVEM), s = m.readUInt16LE(t.CENVER), r = m.readUInt16LE(t.CENFLG), i = m.readUInt16LE(t.CENHOW), o = m.readUInt32LE(t.CENTIM), c = m.readUInt32LE(t.CENCRC), a = m.readUInt32LE(t.CENSIZ), d = m.readUInt32LE(t.CENLEN), l = m.readUInt16LE(t.CENNAM), u = m.readUInt16LE(t.CENEXT), f = m.readUInt16LE(t.CENCOM), g = m.readUInt16LE(t.CENDSK), y = m.readUInt16LE(t.CENATT), w = m.readUInt32LE(t.CENATX), x = m.readUInt32LE(t.CENOFF);
      },
      localHeaderToBinary: function() {
        var m = Buffer.alloc(t.LOCHDR);
        return m.writeUInt32LE(t.LOCSIG, 0), m.writeUInt16LE(s, t.LOCVER), m.writeUInt16LE(r & ~t.FLG_DESC, t.LOCFLG), m.writeUInt16LE(i, t.LOCHOW), m.writeUInt32LE(o, t.LOCTIM), m.writeUInt32LE(c, t.LOCCRC), m.writeUInt32LE(a, t.LOCSIZ), m.writeUInt32LE(d, t.LOCLEN), m.writeUInt16LE(l, t.LOCNAM), m.writeUInt16LE(C.extraLen, t.LOCEXT), m;
      },
      centralHeaderToBinary: function() {
        var m = Buffer.alloc(t.CENHDR + l + u + f);
        return m.writeUInt32LE(t.CENSIG, 0), m.writeUInt16LE(n, t.CENVEM), m.writeUInt16LE(s, t.CENVER), m.writeUInt16LE(r & ~t.FLG_DESC, t.CENFLG), m.writeUInt16LE(i, t.CENHOW), m.writeUInt32LE(o, t.CENTIM), m.writeUInt32LE(c, t.CENCRC), m.writeUInt32LE(a, t.CENSIZ), m.writeUInt32LE(d, t.CENLEN), m.writeUInt16LE(l, t.CENNAM), m.writeUInt16LE(u, t.CENEXT), m.writeUInt16LE(f, t.CENCOM), m.writeUInt16LE(g, t.CENDSK), m.writeUInt16LE(y, t.CENATT), m.writeUInt32LE(w, t.CENATX), m.writeUInt32LE(x, t.CENOFF), m;
      },
      toJSON: function() {
        const m = function(p) {
          return p + " bytes";
        };
        return {
          made: n,
          version: s,
          flags: r,
          method: e.methodToString(i),
          time: this.time,
          crc: "0x" + c.toString(16).toUpperCase(),
          compressedSize: m(a),
          size: m(d),
          fileNameLength: m(l),
          extraLength: m(u),
          commentLength: m(f),
          diskNumStart: g,
          inAttr: y,
          attr: w,
          offset: x,
          centralHeaderSize: m(t.CENHDR + l + u + f)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, pt;
}
var mt, un;
function ii() {
  if (un) return mt;
  un = 1;
  var e = Oe(), t = e.Constants;
  return mt = function() {
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
        const l = i + r;
        return d += t.ZIP64HDR, a.writeUInt32LE(t.END64SIG, d), a.writeUInt32LE(0, d + t.END64START), e.writeBigUInt64LE(a, l, d + t.END64OFF), a.writeUInt32LE(1, d + t.END64NUMDISKS), d += t.END64HDR, a.writeUInt32LE(t.ENDSIG, d), a.writeUInt32LE(0, d + 4), a.writeUInt16LE(Math.min(n, t.EF_ZIP64_OR_16), d + t.ENDSUB), a.writeUInt16LE(Math.min(s, t.EF_ZIP64_OR_16), d + t.ENDTOT), a.writeUInt32LE(Math.min(r, t.EF_ZIP64_OR_32), d + t.ENDSIZ), a.writeUInt32LE(Math.min(i, t.EF_ZIP64_OR_32), d + t.ENDOFF), a.writeUInt16LE(o, d + t.ENDCOM), a.fill(" ", d + t.ENDHDR), a;
      },
      toJSON: function() {
        const a = function(d, l) {
          let u = d.toString(16).toUpperCase();
          for (; u.length < l; ) u = "0" + u;
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
  }, mt;
}
var ln;
function es() {
  return ln || (ln = 1, je.EntryHeader = ri(), je.MainHeader = ii()), je;
}
var ke = {}, ht, fn;
function oi() {
  return fn || (fn = 1, ht = function(e) {
    var t = Bn, n = { chunkSize: (parseInt(e.length / 1024) + 1) * 1024 };
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
            var l = i[d];
            l.copy(c, a), a += l.length;
          }
          s && s(c);
        }), r.end(e);
      }
    };
  }), ht;
}
var gt, pn;
function ai() {
  var t;
  if (pn) return gt;
  pn = 1;
  const e = +(((t = process == null ? void 0 : process.versions) == null ? void 0 : t.node) ?? "").split(".")[0] || 0;
  return gt = function(n, s) {
    var r = Bn;
    const i = e >= 15 && s > 0 ? { maxOutputLength: s } : {};
    return {
      inflate: function() {
        return r.inflateRawSync(n, i);
      },
      inflateAsync: function(o) {
        var c = r.createInflateRaw(i), a = [], d = 0;
        c.on("data", function(l) {
          a.push(l), d += l.length;
        }), c.on("end", function() {
          var l = Buffer.alloc(d), u = 0;
          l.fill(0);
          for (var f = 0; f < a.length; f++) {
            var g = a[f];
            g.copy(l, u), u += g.length;
          }
          o && o(l);
        }), c.end(n);
      }
    };
  }, gt;
}
var yt, mn;
function ci() {
  if (mn) return yt;
  mn = 1;
  const { randomFillSync: e } = ur, t = Lt(), n = new Uint32Array(256).map((g, y) => {
    for (let w = 0; w < 8; w++)
      (y & 1) !== 0 ? y = y >>> 1 ^ 3988292384 : y >>>= 1;
    return y >>> 0;
  }), s = (g, y) => Math.imul(g, y) >>> 0, r = (g, y) => n[(g ^ y) & 255] ^ g >>> 8, i = () => typeof e == "function" ? e(Buffer.alloc(12)) : i.node();
  i.node = () => {
    const g = Buffer.alloc(12), y = g.length;
    for (let w = 0; w < y; w++) g[w] = Math.random() * 256 & 255;
    return g;
  };
  const o = {
    genSalt: i
  };
  function c(g) {
    const y = Buffer.isBuffer(g) ? g : Buffer.from(g);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let w = 0; w < y.length; w++)
      this.updateKeys(y[w]);
  }
  c.prototype.updateKeys = function(g) {
    const y = this.keys;
    return y[0] = r(y[0], g), y[1] += y[0] & 255, y[1] = s(y[1], 134775813) + 1, y[2] = r(y[2], y[1] >>> 24), g;
  }, c.prototype.next = function() {
    const g = (this.keys[2] | 2) >>> 0;
    return s(g, g ^ 1) >> 8 & 255;
  };
  function a(g) {
    const y = new c(g);
    return function(w) {
      const x = Buffer.alloc(w.length);
      let C = 0;
      for (let k of w)
        x[C++] = y.updateKeys(k ^ y.next());
      return x;
    };
  }
  function d(g) {
    const y = new c(g);
    return function(w, x, C = 0) {
      x || (x = Buffer.alloc(w.length));
      for (let k of w) {
        const _ = y.next();
        x[C++] = k ^ _, y.updateKeys(k);
      }
      return x;
    };
  }
  function l(g, y, w) {
    if (!g || !Buffer.isBuffer(g) || g.length < 12)
      return Buffer.alloc(0);
    const x = a(w), C = x(g.slice(0, 12)), k = (y.flags & 8) === 8 ? y.timeHighByte : y.crc >>> 24;
    if (C[11] !== k)
      throw t.WRONG_PASSWORD();
    return x(g.slice(12));
  }
  function u(g) {
    Buffer.isBuffer(g) && g.length >= 12 ? o.genSalt = function() {
      return g.slice(0, 12);
    } : g === "node" ? o.genSalt = i.node : o.genSalt = i;
  }
  function f(g, y, w, x = !1) {
    g == null && (g = Buffer.alloc(0)), Buffer.isBuffer(g) || (g = Buffer.from(g.toString()));
    const C = d(w), k = o.genSalt();
    k[11] = y.crc >>> 24 & 255, x && (k[10] = y.crc >>> 16 & 255);
    const _ = Buffer.alloc(g.length + 12);
    return C(k, _), C(g, _, 12);
  }
  return yt = { decrypt: l, encrypt: f, _salter: u }, yt;
}
var hn;
function di() {
  return hn || (hn = 1, ke.Deflater = oi(), ke.Inflater = ai(), ke.ZipCrypto = ci()), ke;
}
var vt, gn;
function ts() {
  if (gn) return vt;
  gn = 1;
  var e = Oe(), t = es(), n = e.Constants, s = di();
  return vt = function(r, i) {
    var o = new t.EntryHeader(), c = Buffer.alloc(0), a = Buffer.alloc(0), d = !1, l = null, u = Buffer.alloc(0), f = Buffer.alloc(0), g = !0;
    const y = r, w = typeof y.decoder == "object" ? y.decoder : e.decoder;
    g = w.hasOwnProperty("efs") ? w.efs : !1;
    function x() {
      return !i || !(i instanceof Uint8Array) ? Buffer.alloc(0) : (f = o.loadLocalHeaderFromBinary(i), i.slice(o.realDataOffset, o.realDataOffset + o.compressedSize));
    }
    function C(h) {
      if (!o.flags_desc && !o.localHeader.flags_desc) {
        if (e.crc32(h) !== o.localHeader.crc)
          return !1;
      } else {
        const v = {}, E = o.realDataOffset + o.compressedSize;
        if (i.readUInt32LE(E) == n.LOCSIG || i.readUInt32LE(E) == n.CENSIG)
          throw e.Errors.DESCRIPTOR_NOT_EXIST();
        if (i.readUInt32LE(E) == n.EXTSIG)
          v.crc = i.readUInt32LE(E + n.EXTCRC), v.compressedSize = i.readUInt32LE(E + n.EXTSIZ), v.size = i.readUInt32LE(E + n.EXTLEN);
        else if (i.readUInt16LE(E + 12) === 19280)
          v.crc = i.readUInt32LE(E + n.EXTCRC - 4), v.compressedSize = i.readUInt32LE(E + n.EXTSIZ - 4), v.size = i.readUInt32LE(E + n.EXTLEN - 4);
        else
          throw e.Errors.DESCRIPTOR_UNKNOWN();
        if (v.compressedSize !== o.compressedSize || v.size !== o.size || v.crc !== o.crc)
          throw e.Errors.DESCRIPTOR_FAULTY();
        if (e.crc32(h) !== v.crc)
          return !1;
      }
      return !0;
    }
    function k(h, v, E) {
      if (typeof v > "u" && typeof h == "string" && (E = h, h = void 0), d)
        return h && v && v(Buffer.alloc(0), e.Errors.DIRECTORY_CONTENT_ERROR()), Buffer.alloc(0);
      var R = x();
      if (R.length === 0)
        return h && v && v(R), R;
      if (o.encrypted) {
        if (typeof E != "string" && !Buffer.isBuffer(E))
          throw e.Errors.INVALID_PASS_PARAM();
        R = s.ZipCrypto.decrypt(R, o, E);
      }
      var D = Buffer.alloc(o.size);
      switch (o.method) {
        case e.Constants.STORED:
          if (R.copy(D), C(D))
            return h && v && v(D), D;
          throw h && v && v(D, e.Errors.BAD_CRC()), e.Errors.BAD_CRC();
        case e.Constants.DEFLATED:
          var L = new s.Inflater(R, o.size);
          if (h)
            L.inflateAsync(function(A) {
              A.copy(A, 0), v && (C(A) ? v(A) : v(A, e.Errors.BAD_CRC()));
            });
          else {
            if (L.inflate(D).copy(D, 0), !C(D))
              throw e.Errors.BAD_CRC(`"${w.decode(c)}"`);
            return D;
          }
          break;
        default:
          throw h && v && v(Buffer.alloc(0), e.Errors.UNKNOWN_METHOD()), e.Errors.UNKNOWN_METHOD();
      }
    }
    function _(h, v) {
      if ((!l || !l.length) && Buffer.isBuffer(i))
        return h && v && v(x()), x();
      if (l.length && !d) {
        var E;
        switch (o.method) {
          case e.Constants.STORED:
            return o.compressedSize = o.size, E = Buffer.alloc(l.length), l.copy(E), h && v && v(E), E;
          default:
          case e.Constants.DEFLATED:
            var R = new s.Deflater(l);
            if (h)
              R.deflateAsync(function(L) {
                E = Buffer.alloc(L.length), o.compressedSize = L.length, L.copy(E), v && v(E);
              });
            else {
              var D = R.deflate();
              return o.compressedSize = D.length, D;
            }
            R = null;
            break;
        }
      } else if (h && v)
        v(Buffer.alloc(0));
      else
        return Buffer.alloc(0);
    }
    function m(h, v) {
      return e.readBigUInt64LE(h, v);
    }
    function p(h) {
      try {
        for (var v = 0, E, R, D; v + 4 < h.length; )
          E = h.readUInt16LE(v), v += 2, R = h.readUInt16LE(v), v += 2, D = h.slice(v, v + R), v += R, n.ID_ZIP64 === E && I(D);
      } catch {
        throw e.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function I(h) {
      var v, E, R, D;
      h.length >= n.EF_ZIP64_SCOMP && (v = m(h, n.EF_ZIP64_SUNCOMP), o.size === n.EF_ZIP64_OR_32 && (o.size = v)), h.length >= n.EF_ZIP64_RHO && (E = m(h, n.EF_ZIP64_SCOMP), o.compressedSize === n.EF_ZIP64_OR_32 && (o.compressedSize = E)), h.length >= n.EF_ZIP64_DSN && (R = m(h, n.EF_ZIP64_RHO), o.offset === n.EF_ZIP64_OR_32 && (o.offset = R)), h.length >= n.EF_ZIP64_DSN + 4 && (D = h.readUInt32LE(n.EF_ZIP64_DSN), o.diskNumStart === n.EF_ZIP64_OR_16 && (o.diskNumStart = D));
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
        var v = c[c.length - 1];
        d = v === 47 || v === 92, o.fileNameLength = c.length;
      },
      get efs() {
        return typeof g == "function" ? g(this.entryName) : g;
      },
      get extra() {
        return u;
      },
      set extra(h) {
        u = h, o.extraLength = h.length, p(h);
      },
      get comment() {
        return w.decode(a);
      },
      set comment(h) {
        if (a = e.toBuffer(h, w.encode), o.commentLength = a.length, a.length > 65535) throw e.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var h = w.decode(c);
        return d ? h.substr(h.length - 1).split("/").pop() : h.split("/").pop();
      },
      get isDirectory() {
        return d;
      },
      getCompressedData: function() {
        return _(!1, null);
      },
      getCompressedDataAsync: function(h) {
        _(!0, h);
      },
      setData: function(h) {
        l = e.toBuffer(h, e.decoder.encode), !d && l.length ? (o.size = l.length, o.method = e.Constants.DEFLATED, o.crc = e.crc32(h), o.changed = !0) : o.method = e.Constants.STORED;
      },
      getData: function(h) {
        return o.changed ? l : k(!1, null, h);
      },
      getDataAsync: function(h, v) {
        o.changed ? h(l) : k(!0, h, v);
      },
      set attr(h) {
        o.attr = h;
      },
      get attr() {
        return o.attr;
      },
      set header(h) {
        o.loadFromBinary(h);
      },
      get header() {
        return o;
      },
      packCentralHeader: function() {
        o.flags_efs = this.efs, o.extraLength = u.length;
        var h = o.centralHeaderToBinary(), v = e.Constants.CENHDR;
        return c.copy(h, v), v += c.length, u.copy(h, v), v += o.extraLength, a.copy(h, v), h;
      },
      packLocalHeader: function() {
        let h = 0;
        o.flags_efs = this.efs, o.extraLocalLength = f.length;
        const v = o.localHeaderToBinary(), E = Buffer.alloc(v.length + c.length + o.extraLocalLength);
        return v.copy(E, h), h += v.length, c.copy(E, h), h += c.length, f.copy(E, h), h += f.length, E;
      },
      toJSON: function() {
        const h = function(v) {
          return "<" + (v && v.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: o.toJSON(),
          compressedData: h(i),
          data: h(l)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "	");
      }
    };
  }, vt;
}
var It, yn;
function ui() {
  if (yn) return It;
  yn = 1;
  const e = ts(), t = es(), n = Oe();
  return It = function(s, r) {
    var i = [], o = {}, c = Buffer.alloc(0), a = new t.MainHeader(), d = !1;
    const l = /* @__PURE__ */ new Set(), u = r, { noSort: f, decoder: g } = u;
    s ? x(u.readEntries) : d = !0;
    function y() {
      const k = /* @__PURE__ */ new Set();
      for (const _ of Object.keys(o)) {
        const m = _.split("/");
        if (m.pop(), !!m.length)
          for (let p = 0; p < m.length; p++) {
            const I = m.slice(0, p + 1).join("/") + "/";
            k.add(I);
          }
      }
      for (const _ of k)
        if (!(_ in o)) {
          const m = new e(u);
          m.entryName = _, m.attr = 16, m.temporary = !0, i.push(m), o[m.entryName] = m, l.add(m);
        }
    }
    function w() {
      if (d = !0, o = {}, a.diskEntries > (s.length - a.offset) / n.Constants.CENHDR)
        throw n.Errors.DISK_ENTRY_TOO_LARGE();
      i = new Array(a.diskEntries);
      for (var k = a.offset, _ = 0; _ < i.length; _++) {
        var m = k, p = new e(u, s);
        p.header = s.slice(m, m += n.Constants.CENHDR), p.entryName = s.slice(m, m += p.header.fileNameLength), p.header.extraLength && (p.extra = s.slice(m, m += p.header.extraLength)), p.header.commentLength && (p.comment = s.slice(m, m + p.header.commentLength)), k += p.header.centralHeaderSize, i[_] = p, o[p.entryName] = p;
      }
      l.clear(), y();
    }
    function x(k) {
      var _ = s.length - n.Constants.ENDHDR, m = Math.max(0, _ - 65535), p = m, I = s.length, h = -1, v = 0;
      for ((typeof u.trailingSpace == "boolean" ? u.trailingSpace : !1) && (m = 0), _; _ >= p; _--)
        if (s[_] === 80) {
          if (s.readUInt32LE(_) === n.Constants.ENDSIG) {
            h = _, v = _, I = _ + n.Constants.ENDHDR, p = _ - n.Constants.END64HDR;
            continue;
          }
          if (s.readUInt32LE(_) === n.Constants.END64SIG) {
            p = m;
            continue;
          }
          if (s.readUInt32LE(_) === n.Constants.ZIP64SIG) {
            h = _, I = _ + n.readBigUInt64LE(s, _ + n.Constants.ZIP64SIZE) + n.Constants.ZIP64LEAD;
            break;
          }
        }
      if (h == -1) throw n.Errors.INVALID_FORMAT();
      a.loadFromBinary(s.slice(h, I)), a.commentLength && (c = s.slice(v + n.Constants.ENDHDR)), k && w();
    }
    function C() {
      i.length > 1 && !f && i.sort((k, _) => k.entryName.toLowerCase().localeCompare(_.entryName.toLowerCase()));
    }
    return {
      /**
       * Returns an array of ZipEntry objects existent in the current opened archive
       * @return Array
       */
      get entries() {
        return d || w(), i.filter((k) => !l.has(k));
      },
      /**
       * Archive comment
       * @return {String}
       */
      get comment() {
        return g.decode(c);
      },
      set comment(k) {
        c = n.toBuffer(k, g.encode), a.commentLength = c.length;
      },
      getEntryCount: function() {
        return d ? i.length : a.diskEntries;
      },
      forEach: function(k) {
        this.entries.forEach(k);
      },
      /**
       * Returns a reference to the entry with the given name or null if entry is inexistent
       *
       * @param entryName
       * @return ZipEntry
       */
      getEntry: function(k) {
        return d || w(), o[k] || null;
      },
      /**
       * Adds the given entry to the entry list
       *
       * @param entry
       */
      setEntry: function(k) {
        d || w(), i.push(k), o[k.entryName] = k, a.totalEntries = i.length;
      },
      /**
       * Removes the file with the given name from the entry list.
       *
       * If the entry is a directory, then all nested files and directories will be removed
       * @param entryName
       * @returns {void}
       */
      deleteFile: function(k, _ = !0) {
        d || w();
        const m = o[k];
        this.getEntryChildren(m, _).map((I) => I.entryName).forEach(this.deleteEntry);
      },
      /**
       * Removes the entry with the given name from the entry list.
       *
       * @param {string} entryName
       * @returns {void}
       */
      deleteEntry: function(k) {
        d || w();
        const _ = o[k], m = i.indexOf(_);
        m >= 0 && (i.splice(m, 1), delete o[k], a.totalEntries = i.length);
      },
      /**
       *  Iterates and returns all nested files and directories of the given entry
       *
       * @param entry
       * @return Array
       */
      getEntryChildren: function(k, _ = !0) {
        if (d || w(), typeof k == "object")
          if (k.isDirectory && _) {
            const m = [], p = k.entryName;
            for (const I of i)
              I.entryName.startsWith(p) && m.push(I);
            return m;
          } else
            return [k];
        return [];
      },
      /**
       *  How many child elements entry has
       *
       * @param {ZipEntry} entry
       * @return {integer}
       */
      getChildCount: function(k) {
        if (k && k.isDirectory) {
          const _ = this.getEntryChildren(k);
          return _.includes(k) ? _.length - 1 : _.length;
        }
        return 0;
      },
      /**
       * Returns the zip file
       *
       * @return Buffer
       */
      compressToBuffer: function() {
        d || w(), C();
        const k = [], _ = [];
        let m = 0, p = 0;
        a.size = 0, a.offset = 0;
        let I = 0;
        for (const E of this.entries) {
          const R = E.getCompressedData();
          E.header.offset = p;
          const D = E.packLocalHeader(), L = D.length + R.length;
          p += L, k.push(D), k.push(R);
          const A = E.packCentralHeader();
          _.push(A), a.size += A.length, m += L + A.length, I++;
        }
        m += a.mainHeaderSize, a.offset = p, a.totalEntries = I, p = 0;
        const h = Buffer.alloc(m);
        for (const E of k)
          E.copy(h, p), p += E.length;
        for (const E of _)
          E.copy(h, p), p += E.length;
        const v = a.toBinary();
        return c && c.copy(v, v.length - c.length), v.copy(h, p), s = h, d = !1, h;
      },
      toAsyncBuffer: function(k, _, m, p) {
        try {
          d || w(), C();
          const I = [], h = [];
          let v = 0, E = 0, R = 0;
          a.size = 0, a.offset = 0;
          const D = function(L) {
            if (L.length > 0) {
              const A = L.shift(), N = A.entryName + A.extra.toString();
              m && m(N), A.getCompressedDataAsync(function(b) {
                p && p(N), A.header.offset = E;
                const M = A.packLocalHeader(), G = M.length + b.length;
                E += G, I.push(M), I.push(b);
                const z = A.packCentralHeader();
                h.push(z), a.size += z.length, v += G + z.length, R++, D(L);
              });
            } else {
              v += a.mainHeaderSize, a.offset = E, a.totalEntries = R, E = 0;
              const A = Buffer.alloc(v);
              I.forEach(function(b) {
                b.copy(A, E), E += b.length;
              }), h.forEach(function(b) {
                b.copy(A, E), E += b.length;
              });
              const N = a.toBinary();
              c && c.copy(N, N.length - c.length), N.copy(A, E), s = A, d = !1, k(A);
            }
          };
          D(Array.from(this.entries));
        } catch (I) {
          _(I);
        }
      }
    };
  }, It;
}
var wt, vn;
function li() {
  if (vn) return wt;
  vn = 1;
  const e = Oe(), t = At, n = ts(), s = ui(), r = (...a) => e.findLast(a, (d) => typeof d == "boolean"), i = (...a) => e.findLast(a, (d) => typeof d == "string"), o = (...a) => e.findLast(a, (d) => typeof d == "function"), c = {
    // option "noSort" : if true it disables files sorting
    noSort: !1,
    // read entries during load (initial loading may be slower)
    readEntries: !1,
    // default method is none
    method: e.Constants.NONE,
    // file system
    fs: null
  };
  return wt = function(a, d) {
    let l = null;
    const u = Object.assign(/* @__PURE__ */ Object.create(null), c);
    a && typeof a == "object" && (a instanceof Uint8Array || (Object.assign(u, a), a = u.input ? u.input : void 0, u.input && delete u.input), Buffer.isBuffer(a) && (l = a, u.method = e.Constants.BUFFER, a = void 0)), Object.assign(u, d);
    const f = new e(u);
    if ((typeof u.decoder != "object" || typeof u.decoder.encode != "function" || typeof u.decoder.decode != "function") && (u.decoder = e.decoder), a && typeof a == "string")
      if (f.fs.existsSync(a))
        u.method = e.Constants.FILE, u.filename = a, l = f.fs.readFileSync(a);
      else
        throw e.Errors.INVALID_FILENAME();
    const g = new s(l, u), { canonical: y, sanitize: w, zipnamefix: x } = e;
    function C(p) {
      if (p && g) {
        var I;
        if (typeof p == "string" && (I = g.getEntry(t.posix.normalize(p))), typeof p == "object" && typeof p.entryName < "u" && typeof p.header < "u" && (I = g.getEntry(p.entryName)), I)
          return I;
      }
      return null;
    }
    function k(p) {
      const { join: I, normalize: h, sep: v } = t.posix;
      return I(t.isAbsolute(p) ? "/" : ".", h(v + p.split("\\").join(v) + v));
    }
    function _(p) {
      return p instanceof RegExp ? /* @__PURE__ */ (function(I) {
        return function(h) {
          return I.test(h);
        };
      })(p) : typeof p != "function" ? () => !0 : p;
    }
    const m = (p, I) => {
      let h = I.slice(-1);
      return h = h === f.sep ? f.sep : "", t.relative(p, I) + h;
    };
    return {
      /**
       * Extracts the given entry from the archive and returns the content as a Buffer object
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {Buffer|string} [pass] - password
       * @return Buffer or Null in case of error
       */
      readFile: function(p, I) {
        var h = C(p);
        return h && h.getData(I) || null;
      },
      /**
       * Returns how many child elements has on entry (directories) on files it is always 0
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @returns {integer}
       */
      childCount: function(p) {
        const I = C(p);
        if (I)
          return g.getChildCount(I);
      },
      /**
       * Asynchronous readFile
       * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
       * @param {callback} callback
       *
       * @return Buffer or Null in case of error
       */
      readFileAsync: function(p, I) {
        var h = C(p);
        h ? h.getDataAsync(I) : I(null, "getEntry failed for:" + p);
      },
      /**
       * Extracts the given entry from the archive and returns the content as plain text in the given encoding
       * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
       * @param {string} encoding - Optional. If no encoding is specified utf8 is used
       *
       * @return String
       */
      readAsText: function(p, I) {
        var h = C(p);
        if (h) {
          var v = h.getData();
          if (v && v.length)
            return v.toString(I || "utf8");
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
      readAsTextAsync: function(p, I, h) {
        var v = C(p);
        v ? v.getDataAsync(function(E, R) {
          if (R) {
            I(E, R);
            return;
          }
          E && E.length ? I(E.toString(h || "utf8")) : I("");
        }) : I("");
      },
      /**
       * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
       *
       * @param {ZipEntry|string} entry
       * @param {boolean} withsubfolders
       * @returns {void}
       */
      deleteFile: function(p, I = !0) {
        var h = C(p);
        h && g.deleteFile(h.entryName, I);
      },
      /**
       * Remove the entry from the file or directory without affecting any nested entries
       *
       * @param {ZipEntry|string} entry
       * @returns {void}
       */
      deleteEntry: function(p) {
        var I = C(p);
        I && g.deleteEntry(I.entryName);
      },
      /**
       * Adds a comment to the zip. The zip must be rewritten after adding the comment.
       *
       * @param {string} comment
       */
      addZipComment: function(p) {
        g.comment = p;
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
      addZipEntryComment: function(p, I) {
        var h = C(p);
        h && (h.comment = I);
      },
      /**
       * Returns the comment of the specified entry
       *
       * @param {ZipEntry} entry
       * @return String
       */
      getZipEntryComment: function(p) {
        var I = C(p);
        return I && I.comment || "";
      },
      /**
       * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
       *
       * @param {ZipEntry} entry
       * @param {Buffer} content
       */
      updateFile: function(p, I) {
        var h = C(p);
        h && h.setData(I);
      },
      /**
       * Adds a file from the disk to the archive
       *
       * @param {string} localPath File to add to zip
       * @param {string} [zipPath] Optional path inside the zip
       * @param {string} [zipName] Optional name for the file
       * @param {string} [comment] Optional file comment
       */
      addLocalFile: function(p, I, h, v) {
        if (f.fs.existsSync(p)) {
          I = I ? k(I) : "";
          const E = t.win32.basename(t.win32.normalize(p));
          I += h || E;
          const R = f.fs.statSync(p), D = R.isFile() ? f.fs.readFileSync(p) : Buffer.alloc(0);
          R.isDirectory() && (I += f.sep), this.addFile(I, D, v, R);
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
      addLocalFileAsync: function(p, I) {
        p = typeof p == "object" ? p : { localPath: p };
        const h = t.resolve(p.localPath), { comment: v } = p;
        let { zipPath: E, zipName: R } = p;
        const D = this;
        f.fs.stat(h, function(L, A) {
          if (L) return I(L, !1);
          E = E ? k(E) : "";
          const N = t.win32.basename(t.win32.normalize(h));
          if (E += R || N, A.isFile())
            f.fs.readFile(h, function(b, M) {
              return b ? I(b, !1) : (D.addFile(E, M, v, A), setImmediate(I, void 0, !0));
            });
          else if (A.isDirectory())
            return E += f.sep, D.addFile(E, Buffer.alloc(0), v, A), setImmediate(I, void 0, !0);
        });
      },
      /**
       * Adds a local directory and all its nested files and directories to the archive
       *
       * @param {string} localPath - local path to the folder
       * @param {string} [zipPath] - optional path inside zip
       * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
       */
      addLocalFolder: function(p, I, h) {
        if (h = _(h), I = I ? k(I) : "", p = t.normalize(p), f.fs.existsSync(p)) {
          const v = f.findFiles(p), E = this;
          if (v.length)
            for (const R of v) {
              const D = t.join(I, m(p, R));
              h(D) && E.addLocalFile(R, t.dirname(D));
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
      addLocalFolderAsync: function(p, I, h, v) {
        v = _(v), h = h ? k(h) : "", p = t.normalize(p);
        var E = this;
        f.fs.open(p, "r", function(R) {
          if (R && R.code === "ENOENT")
            I(void 0, e.Errors.FILE_NOT_FOUND(p));
          else if (R)
            I(void 0, R);
          else {
            var D = f.findFiles(p), L = -1, A = function() {
              if (L += 1, L < D.length) {
                var N = D[L], b = m(p, N).split("\\").join("/");
                b = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""), v(b) ? f.fs.stat(N, function(M, G) {
                  M && I(void 0, M), G.isFile() ? f.fs.readFile(N, function(z, j) {
                    z ? I(void 0, z) : (E.addFile(h + b, j, "", G), A());
                  }) : (E.addFile(h + b + "/", Buffer.alloc(0), "", G), A());
                }) : process.nextTick(() => {
                  A();
                });
              } else
                I(!0, void 0);
            };
            A();
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
      addLocalFolderAsync2: function(p, I) {
        const h = this;
        p = typeof p == "object" ? p : { localPath: p };
        const v = t.resolve(k(p.localPath));
        let { zipPath: E, filter: R, namefix: D } = p;
        R instanceof RegExp ? R = /* @__PURE__ */ (function(N) {
          return function(b) {
            return N.test(b);
          };
        })(R) : typeof R != "function" && (R = function() {
          return !0;
        }), E = E ? k(E) : "", D === "latin1" && (D = (N) => N.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "")), typeof D != "function" && (D = (N) => N);
        const L = (N) => t.join(E, D(m(v, N))), A = (N) => t.win32.basename(t.win32.normalize(D(N)));
        f.fs.open(v, "r", function(N) {
          N && N.code === "ENOENT" ? I(void 0, e.Errors.FILE_NOT_FOUND(v)) : N ? I(void 0, N) : f.findFilesAsync(v, function(b, M) {
            if (b) return I(b);
            M = M.filter((G) => R(L(G))), M.length || I(void 0, !1), setImmediate(
              M.reverse().reduce(function(G, z) {
                return function(j, V) {
                  if (j || V === !1) return setImmediate(G, j, !1);
                  h.addLocalFileAsync(
                    {
                      localPath: z,
                      zipPath: t.dirname(L(z)),
                      zipName: A(z)
                    },
                    G
                  );
                };
              }, I)
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
      addLocalFolderPromise: function(p, I) {
        return new Promise((h, v) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: p }, I), (E, R) => {
            E && v(E), R && h(this);
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
      addFile: function(p, I, h, v) {
        p = x(p);
        let E = C(p);
        const R = E != null;
        R || (E = new n(u), E.entryName = p), E.comment = h || "";
        const D = typeof v == "object" && v instanceof f.fs.Stats;
        D && (E.header.time = v.mtime);
        var L = E.isDirectory ? 16 : 0;
        let A = E.isDirectory ? 16384 : 32768;
        return D ? A |= 4095 & v.mode : typeof v == "number" ? A |= 4095 & v : A |= E.isDirectory ? 493 : 420, L = (L | A << 16) >>> 0, E.attr = L, E.setData(I), R || g.setEntry(E), E;
      },
      /**
       * Returns an array of ZipEntry objects representing the files and folders inside the archive
       *
       * @param {string} [password]
       * @returns Array
       */
      getEntries: function(p) {
        return g.password = p, g ? g.entries : [];
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
        return g.getEntryCount();
      },
      forEach: function(p) {
        return g.forEach(p);
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
      extractEntryTo: function(p, I, h, v, E, R) {
        v = r(!1, v), E = r(!1, E), h = r(!0, h), R = i(E, R);
        var D = C(p);
        if (!D)
          throw e.Errors.NO_ENTRY();
        var L = y(D.entryName), A = w(I, R && !D.isDirectory ? y(R) : h ? L : t.basename(L));
        if (D.isDirectory) {
          var N = g.getEntryChildren(D);
          return N.forEach(function(G) {
            if (G.isDirectory) return;
            var z = G.getData();
            if (!z)
              throw e.Errors.CANT_EXTRACT_FILE();
            var j = y(G.entryName), V = w(I, h ? j : t.basename(j));
            const J = E ? G.header.fileAttr : void 0;
            f.writeFileTo(V, z, v, J);
          }), !0;
        }
        var b = D.getData(g.password);
        if (!b) throw e.Errors.CANT_EXTRACT_FILE();
        if (f.fs.existsSync(A) && !v)
          throw e.Errors.CANT_OVERRIDE();
        const M = E ? p.header.fileAttr : void 0;
        return f.writeFileTo(A, b, v, M), !0;
      },
      /**
       * Test the archive
       * @param {string} [pass]
       */
      test: function(p) {
        if (!g)
          return !1;
        for (var I of g.entries)
          try {
            if (I.isDirectory)
              continue;
            var h = g.entries[I].getData(p);
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
      extractAllTo: function(p, I, h, v) {
        if (h = r(!1, h), v = i(h, v), I = r(!1, I), !g) throw e.Errors.NO_ZIP();
        g.entries.forEach(function(E) {
          var R = w(p, y(E.entryName));
          if (E.isDirectory) {
            f.makeDir(R);
            return;
          }
          var D = E.getData(v);
          if (!D)
            throw e.Errors.CANT_EXTRACT_FILE();
          const L = h ? E.header.fileAttr : void 0;
          f.writeFileTo(R, D, I, L);
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
      extractAllToAsync: function(p, I, h, v) {
        if (v = o(I, h, v), h = r(!1, h), I = r(!1, I), !v)
          return new Promise((A, N) => {
            this.extractAllToAsync(p, I, h, function(b) {
              b ? N(b) : A(this);
            });
          });
        if (!g) {
          v(e.Errors.NO_ZIP());
          return;
        }
        p = t.resolve(p);
        const E = (A) => w(p, t.normalize(y(A.entryName))), R = (A, N) => new Error(A + ': "' + N + '"'), D = [], L = [];
        g.entries.forEach((A) => {
          A.isDirectory ? D.push(A) : L.push(A);
        });
        for (const A of D) {
          const N = E(A), b = h ? A.header.fileAttr : void 0;
          try {
            f.makeDir(N), b && f.fs.chmodSync(N, b), f.fs.utimesSync(N, A.header.time, A.header.time);
          } catch {
            v(R("Unable to create folder", N));
          }
        }
        L.reverse().reduce(function(A, N) {
          return function(b) {
            if (b)
              A(b);
            else {
              const M = t.normalize(y(N.entryName)), G = w(p, M);
              N.getDataAsync(function(z, j) {
                if (j)
                  A(j);
                else if (!z)
                  A(e.Errors.CANT_EXTRACT_FILE());
                else {
                  const V = h ? N.header.fileAttr : void 0;
                  f.writeFileToAsync(G, z, I, V, function(J) {
                    J || A(R("Unable to write file", G)), f.fs.utimes(G, N.header.time, N.header.time, function(fe) {
                      fe ? A(R("Unable to set times", G)) : A();
                    });
                  });
                }
              });
            }
          };
        }, v)();
      },
      /**
       * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
       *
       * @param {string} targetFileName
       * @param {function} callback
       */
      writeZip: function(p, I) {
        if (arguments.length === 1 && typeof p == "function" && (I = p, p = ""), !p && u.filename && (p = u.filename), !!p) {
          var h = g.compressToBuffer();
          if (h) {
            var v = f.writeFileTo(p, h, !0);
            typeof I == "function" && I(v ? null : new Error("failed"), "");
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
      writeZipPromise: function(p, I) {
        const { overwrite: h, perm: v } = Object.assign({ overwrite: !0 }, I);
        return new Promise((E, R) => {
          !p && u.filename && (p = u.filename), p || R("ADM-ZIP: ZIP File Name Missing"), this.toBufferPromise().then((D) => {
            const L = (A) => A ? E(A) : R("ADM-ZIP: Wasn't able to write zip file");
            f.writeFileToAsync(p, D, h, v, L);
          }, R);
        });
      },
      /**
       * @returns {Promise<Buffer>} A promise to the Buffer.
       */
      toBufferPromise: function() {
        return new Promise((p, I) => {
          g.toAsyncBuffer(p, I);
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
      toBuffer: function(p, I, h, v) {
        return typeof p == "function" ? (g.toAsyncBuffer(p, I, h, v), null) : g.compressToBuffer();
      }
    };
  }, wt;
}
var fi = li();
const ns = /* @__PURE__ */ ei(fi), pi = "conversations.json", mi = [
  /^conversations\.json$/i,
  /^chat\.html$/i,
  /^message_feedback\.json$/i,
  /^model_comparisons\.json$/i,
  /^user\.json$/i,
  /^shared_conversations\.json$/i
];
function Be(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function ss(e, t = {}) {
  var g, y, w;
  const { loadAssetData: n = !0, signal: s, callbacks: r } = t;
  Be(s);
  const o = new ns(e).getEntries();
  (g = r == null ? void 0 : r.onZipOpened) == null || g.call(r, o.length), Be(s);
  const c = o.find((x) => !x.isDirectory && x.entryName.replace(/\\/g, "/").endsWith(pi));
  if (!c)
    throw new Error("Not a ChatGPT export ZIP: conversations.json was not found in the archive.");
  const a = c.entryName.replace(/\\/g, "/"), d = c.header.size;
  (y = r == null ? void 0 : r.onConversationsJsonLocated) == null || y.call(r, a, d), Be(s);
  const l = c.getData().toString("utf8"), u = [];
  let f = 0;
  for (const x of o) {
    if (Be(s), x.isDirectory)
      continue;
    const C = x.entryName.replace(/\\/g, "/"), k = S.basename(C);
    if (mi.some((m) => m.test(k) || m.test(C)) || C.endsWith(".json") && !C.includes("/"))
      continue;
    f++;
    const _ = {
      zipPath: C,
      fileName: k
    };
    n && (_.data = x.getData()), u.push(_);
  }
  return (w = r == null ? void 0 : r.onEntriesDiscovered) == null || w.call(r, o.length, f), {
    conversationsJson: l,
    conversationsPath: a,
    assets: u,
    archiveEntryCount: o.length
  };
}
class hi {
  constructor() {
    U(this, "id", "chatgpt-export-zip");
    U(this, "name", "ChatGPT Connector");
    U(this, "description", "Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).");
    U(this, "supportedExtensions", [".zip"]);
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
    const n = ss(t.source.path, { loadAssetData: !1 }), s = Kr(n.conversationsJson);
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
      const o = Xn(r, n, {
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
const Et = new hi(), gi = {
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
function In(e) {
  if (e != null && e.aborted)
    throw new Error("Validation cancelled by user.");
}
function wn(e) {
  return e < 1024 ? `${e} B` : e < 1024 * 1024 ? `${(e / 1024).toFixed(1)} KB` : `${(e / (1024 * 1024)).toFixed(1)} MB`;
}
async function rs(e, t = {}) {
  const n = Date.now(), s = [];
  let r = 0, i, o, c = 0, a = 0, d = 0;
  const l = (f, g, y = {}) => {
    var w;
    (w = t.onProgress) == null || w.call(t, {
      status: g,
      stage: f,
      stageLabel: gi[f],
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
  }, u = (f, g, y) => {
    var w;
    (w = t.log) == null || w.call(t, f, g, y);
  };
  try {
    l("zip-selected", "running", { detail: e.name }), u("info", `ZIP selected: ${e.name}`, { path: e.path }), l("zip-opening", "running"), u("info", "Opening ZIP archive (read-only)…");
    const f = ss(e.path, {
      loadAssetData: !1,
      signal: t.signal,
      callbacks: {
        onZipOpened: (m) => {
          r = m, l("zip-opened", "running", {
            archiveEntryCount: m,
            detail: `${m} entries`
          }), u("info", `ZIP opened: ${m} archive entries`);
        },
        onEntriesDiscovered: (m, p) => {
          l("entries-discovered", "running", {
            archiveEntryCount: m,
            detail: `${p} asset file(s), metadata only`
          }), u("info", `Archive entries discovered: ${m} total, ${p} asset file(s)`);
        },
        onConversationsJsonLocated: (m, p) => {
          i = m, o = p, l("conversations-json-located", "running", {
            conversationsJsonPath: m,
            conversationsJsonSizeBytes: p,
            detail: `${m} (${wn(p)})`
          }), u("info", `conversations.json located: ${m} (${wn(p)})`);
        }
      }
    });
    In(t.signal), l("parsing-started", "running"), u("info", "Conversations parsing started…");
    const g = Yn(f.conversationsJson);
    c = g.length, u("info", `Total conversations detected: ${c}`, {
      conversationsTotal: c
    }), l("parsing-started", "running", {
      conversationsTotal: c,
      detail: `${c} conversations`
    });
    const y = await Zr(g, {
      signal: t.signal,
      onProgress: (m) => {
        a = m.conversationsProcessed, d = m.messagesProcessed, l("parsing-conversations", "running", {
          conversationsTotal: m.conversationsTotal,
          conversationsProcessed: m.conversationsProcessed,
          messagesProcessed: m.messagesProcessed,
          detail: `${m.conversationsProcessed}/${m.conversationsTotal} conversations, ${m.messagesProcessed} messages`
        }), (m.conversationsProcessed % 100 === 0 || m.conversationsProcessed === m.conversationsTotal) && u("info", `Conversations processed: ${m.conversationsProcessed}/${m.conversationsTotal} (${m.messagesProcessed} messages)`, {
          conversationsProcessed: m.conversationsProcessed,
          conversationsTotal: m.conversationsTotal,
          messagesProcessed: m.messagesProcessed
        });
      }
    });
    In(t.signal);
    const w = f.assets.map((m) => ({
      zipPath: m.zipPath,
      fileName: m.fileName
    })), x = y.map((m, p) => Xn(m, f.assets, {
      validationMode: !0,
      sharedAssetList: p === 0 ? w : void 0
    })), C = Ur(Et.id, x), k = Mr(Et.id, e, C), _ = jr(Et, e, C, k);
    return s.length > 0 && u("warn", `Warnings generated: ${s.length}`, { warnings: s }), l("completed", "complete", {
      conversationsTotal: c,
      conversationsProcessed: a,
      messagesProcessed: d,
      detail: `${a} conversations validated`
    }), u("info", `Validation pipeline complete: ${C.length} conversation(s), ${d} message(s)`), _;
  } catch (f) {
    const g = f instanceof Error ? f.message : String(f), y = g.includes("cancelled");
    throw l(y ? "cancelled" : "failed", y ? "cancelled" : "failed", {
      error: g,
      detail: g
    }), u(y ? "warn" : "error", `Validation ${y ? "cancelled" : "failed"}: ${g}`, {
      error: g
    }), f;
  }
}
class yi extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "chatgpt-export-zip");
    U(this, "name", "ChatGPT Connector");
    U(this, "description", "Acquire knowledge from ChatGPT data export archives via the KAE connector pipeline.");
    U(this, "supportedExtensions", [".zip"]);
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
      const l = await rs(n, {
        log: (u, f) => {
          var g;
          return (g = s.log) == null ? void 0 : g.call(s, u, f);
        },
        onProgress: (u) => {
          var f;
          if (u.conversationsTotal > 0) {
            const g = Math.round(u.conversationsProcessed / u.conversationsTotal * 100);
            (f = s.onProgress) == null || f.call(s, g);
          }
        },
        signal: s.signal
      });
      return (a = s.log) == null || a.call(s, "info", `Import package ready: ${l.documents.length} document(s)`), {
        jobId: r,
        success: !0,
        documents: l.documents,
        errors: i,
        summary: {
          conversationsFound: l.documents.length,
          sourcesCreated: 0,
          skippedDuplicates: 0,
          errors: i,
          outputFolder: `${s.repositoryPath}\\Sources`,
          createdSourceIds: []
        }
      };
    } catch (l) {
      const u = l instanceof Error ? l.message : String(l);
      return i.push(u), (d = s.log) == null || d.call(s, "error", u), {
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
class vi extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "pdf");
    U(this, "name", "PDF");
    U(this, "description", "Import content from PDF documents.");
    U(this, "supportedExtensions", [".pdf"]);
  }
}
class Ii extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "markdown");
    U(this, "name", "Markdown");
    U(this, "description", "Import Markdown (.md) files.");
    U(this, "supportedExtensions", [".md", ".markdown"]);
  }
}
class wi extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "html");
    U(this, "name", "HTML");
    U(this, "description", "Import HTML web pages and exports.");
    U(this, "supportedExtensions", [".html", ".htm"]);
  }
}
class Ei extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "docx");
    U(this, "name", "DOCX");
    U(this, "description", "Import Microsoft Word documents.");
    U(this, "supportedExtensions", [".docx"]);
  }
}
class Si extends ge {
  constructor() {
    super(...arguments);
    U(this, "id", "txt");
    U(this, "name", "Plain Text");
    U(this, "description", "Import plain text files.");
    U(this, "supportedExtensions", [".txt"]);
  }
}
const En = [
  new yi(),
  new vi(),
  new Ii(),
  new wi(),
  new Ei(),
  new Si()
];
class Ri {
  constructor() {
    U(this, "plugins", /* @__PURE__ */ new Map());
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
const Ci = new Ri();
class ki {
  async export(t, n, s) {
    throw new Hn(`Exporter "${this.name}"`);
  }
}
const xi = /KRC-(\d{4})/gi, Ti = /## ChatGPT Conversation ID\s*\n([^\n]+)/, Di = [
  "VIGS",
  "Founder_OS",
  "Axiom",
  "Book",
  "Knowledge_Recovery",
  "Source_Material",
  "Technical_Build",
  "Other_Review_Needed"
];
async function Ft(e) {
  const t = [];
  let n;
  try {
    n = await T.readdir(e, { withFileTypes: !0 });
  } catch {
    return t;
  }
  for (const s of n) {
    const r = S.join(e, s.name);
    s.isDirectory() ? t.push(...await Ft(r)) : s.name.endsWith(".md") && t.push(r);
  }
  return t;
}
async function Ot(e) {
  let t = 0;
  const n = S.join(e, "Sources"), s = await Ft(n);
  for (const i of s) {
    const c = S.basename(i).match(/KRC-(\d{4})/i);
    c && (t = Math.max(t, parseInt(c[1], 10)));
  }
  const r = S.join(e, "Registries", "SOURCE_REGISTRY.md");
  try {
    const i = await T.readFile(r, "utf8");
    for (const o of i.matchAll(xi))
      t = Math.max(t, parseInt(o[1], 10));
  } catch {
  }
  return t;
}
function Pt(e) {
  return `KRC-${String(e).padStart(4, "0")}`;
}
function Qe(e) {
  return e.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").replace(/_+/g, "_").slice(0, 80) || "Untitled";
}
async function is(e) {
  const t = /* @__PURE__ */ new Map(), n = S.join(e, "Sources"), s = await Ft(n);
  for (const r of s) {
    const o = S.basename(r).match(/^(KRC-\d{4})/i);
    if (!o)
      continue;
    const a = (await T.readFile(r, "utf8")).match(Ti);
    a && t.set(a[1].trim(), o[1].toUpperCase());
  }
  return t;
}
async function _i(e) {
  await T.mkdir(S.join(e, "Sources"), { recursive: !0 }), await T.mkdir(S.join(e, "Uploads"), { recursive: !0 }), await T.mkdir(S.join(e, "Registries"), { recursive: !0 }), await T.mkdir(S.join(e, "ExecutiveSessions"), { recursive: !0 });
  for (const t of Di)
    await T.mkdir(S.join(e, "Sources", t), { recursive: !0 }), await T.mkdir(S.join(e, "ExecutiveSessions", t), { recursive: !0 });
}
async function Sn(e, t, n) {
  await T.mkdir(S.dirname(e), { recursive: !0 });
  try {
    return await T.access(e), n ? (await T.writeFile(e, t, "utf8"), "updated") : "skipped";
  } catch {
    return await T.writeFile(e, t, "utf8"), "created";
  }
}
async function Ai(e, t, n) {
  await T.mkdir(S.dirname(e), { recursive: !0 });
  try {
    return await T.access(e), n ? (await T.writeFile(e, t), "updated") : "skipped";
  } catch {
    return await T.writeFile(e, t), "created";
  }
}
function Ni(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function $i(e) {
  var c, a;
  const t = e.content.trim();
  if (!t)
    return "No extractable conversation content. Flagged for manual review.";
  const n = t.match(/### User\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), s = t.match(/### Assistant\s*\n(?:\*[^*]+\*\s*\n)?([\s\S]*?)(?=\n### |\n## |$)/), r = ((c = n == null ? void 0 : n[1]) == null ? void 0 : c.trim().slice(0, 400)) ?? "", i = ((a = s == null ? void 0 : s[1]) == null ? void 0 : a.trim().slice(0, 400)) ?? "", o = [];
  return r && o.push(`**User focus:** ${r}${r.length >= 400 ? "…" : ""}`), i && o.push(`**Assistant response:** ${i}${i.length >= 400 ? "…" : ""}`), o.join(`

`) || t.slice(0, 600);
}
function bi(e, t) {
  const n = /* @__PURE__ */ new Set();
  n.add(t.inferredProject);
  for (const s of t.recurringTerms.slice(0, 5))
    n.add(s);
  return typeof e.metadata.pastedTranscriptCount == "number" && e.metadata.pastedTranscriptCount > 0 && n.add("Pasted source material"), [...n].filter(Boolean);
}
function Li(e, t, n, s) {
  const r = t.title.trim() || "Untitled Conversation", i = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    `# Executive Session Record — ${r}`,
    "",
    "## Source ID",
    e,
    "",
    "## Session Date",
    Ni(t.metadata.createTime),
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
    $i(t),
    "",
    "## Key Topics",
    ...bi(t, n).map((c) => `- ${c}`),
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
function os(e, t) {
  const n = t.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Untitled";
  return `${e}_${n}_SESSION.md`;
}
function Fi(e) {
  var n;
  const t = e.match(/## Topic\s*\n([^\n#]+)/);
  return ((n = t == null ? void 0 : t[1]) == null ? void 0 : n.trim()) ?? "ChatGPT conversation import";
}
async function Ut(e, t) {
  if (t.length === 0)
    return;
  const n = S.join(e, "Registries", "SOURCE_REGISTRY.md");
  let s;
  try {
    s = await T.readFile(n, "utf8");
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
  s = s.replace(/Sources Inventoried:\s*\d+/, `Sources Inventoried: ${c}`), await T.writeFile(n, s, "utf8");
}
async function Oi(e, t, n) {
  if (t === 0)
    return;
  const s = S.join(e, "Registries", "KRC_STATUS.md");
  let r;
  try {
    r = await T.readFile(s, "utf8");
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
`), await T.writeFile(s, r, "utf8");
}
function Mt(e, t, n, s) {
  return {
    krcId: e,
    title: t,
    topic: Fi(n),
    primaryProduct: s ?? "TBD",
    status: n.includes("Review Needed") ? "Review Needed" : "Inventoried"
  };
}
function Rn(e) {
  if (typeof e != "number")
    return "Unknown";
  const t = e > 1e12 ? e : e * 1e3;
  return new Date(t).toISOString();
}
function Pi(e, t) {
  if (t.uncertain)
    return "Unclassified — review needed";
  const n = e.metadata.pastedTranscriptCount;
  return typeof n == "number" && n > 0 ? "Pasted source text / ChatGPT conversation" : `${t.primaryCategory} / ChatGPT conversation`;
}
function Ui(e) {
  const t = [], n = ["Axiom", "Founder OS", "VIGS"];
  for (const s of n) {
    const r = e.categories.some((i) => i === s || s === "Founder OS" && i === "Founder OS");
    t.push(`- ${s}: ${r ? "Yes" : "Possible"}`);
  }
  return t;
}
function Mi(e, t, n) {
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
    Pi(t, n),
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
    ...Ui(n),
    "",
    "## ChatGPT Conversation ID",
    r,
    "",
    "## Create Time",
    Rn(t.metadata.createTime),
    "",
    "## Update Time",
    Rn(t.metadata.updateTime),
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
function as(e, t) {
  return `${e}_${Qe(t.title)}.md`;
}
function cs(e) {
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
function ji(e) {
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
  return e.classified.length > 0 && t.push("### Classified", "", Ge(e.classified), ""), e.uncertain.length > 0 && t.push("### Uncertain / Review Needed", "", Ge(e.uncertain), ""), e.skipped.length > 0 && t.push("### Skipped", "", Ge(e.skipped), ""), e.errors.length > 0 && t.push("### Errors", "", Ge(e.errors), ""), t.push("---", ""), t.join(`
`);
}
function Ge(e) {
  const t = "| KRC ID | Title | Primary Category | All Categories | Confidence | Status | Notes |", n = "|---|---|---|---|---|---|---|", s = e.map((r) => {
    const i = [r.notes, r.sourcePath ? `Source: ${r.sourcePath}` : ""].filter(Boolean).join("; ");
    return `| ${r.krcId} | ${Cn(r.title)} | ${r.primaryCategory} | ${r.categories.join(", ")} | ${r.confidence}% | ${r.status} | ${Cn(i)} |`;
  });
  return [t, n, ...s].join(`
`);
}
function Cn(e) {
  return e.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
function Bi() {
  return [
    "# Import Review",
    "",
    "Auto-generated by KAE. Lists conversation classifications, uncertain items, skips, and errors.",
    ""
  ].join(`
`);
}
async function Gi(e, t) {
  const n = S.join(e, "Registries", "IMPORT_REVIEW.md");
  let s;
  try {
    s = await T.readFile(n, "utf8");
  } catch {
    s = Bi();
  }
  return s = s.trimEnd() + `

` + ji(t), await T.writeFile(n, s, "utf8"), n;
}
function zi(e, t) {
  const s = new ns(e).getEntries(), r = /* @__PURE__ */ new Map();
  for (const o of s)
    o.isDirectory || r.set(o.entryName.replace(/\\/g, "/"), o);
  const i = /* @__PURE__ */ new Map();
  for (const o of t) {
    const c = r.get(o.zipPath);
    c && i.set(o.zipPath, c.getData());
  }
  return i;
}
async function Ki(e, t, n) {
  var I, h, v, E, R, D, L, A;
  const s = [], r = [];
  let i = 0, o = 0, c = 0, a = 0, d = 0;
  await _i(t);
  const l = bt(e);
  for (const N of e) {
    const b = String(N.metadata.conversationId ?? N.id);
    N.metadata.classification = l.get(b);
  }
  let u = await Ot(t) + 1;
  const f = await is(t), g = [], y = `KAE Import — ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`, w = S.join(t, "Uploads", `chatgpt-import-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`);
  let x = !1;
  const C = {
    importDate: (/* @__PURE__ */ new Date()).toISOString(),
    importFileName: (n == null ? void 0 : n.importFileName) ?? "unknown.zip",
    conversationsProcessed: e.length,
    classified: [],
    uncertain: [],
    skipped: [],
    errors: []
  }, k = e.length;
  let _ = 0;
  for (const N of e) {
    _++, (I = n == null ? void 0 : n.onProgress) == null || I.call(n, Math.round(_ / k * 100));
    const b = String(N.metadata.conversationId ?? N.id), M = l.get(b) ?? $t(N);
    N.metadata.classification = M;
    const G = f.get(b), z = cs(M);
    let j, V;
    G ? (j = G, V = !0, (h = n == null ? void 0 : n.log) == null || h.call(n, "info", `Updating existing source ${j} for conversation ${b}`)) : (j = Pt(u), u++, V = !1);
    const J = as(j, N), fe = S.join(t, "Sources", z, J), pe = `Sources/${z}/${J}`, we = Mi(j, N, M), Ee = os(j, N), Ue = S.join(t, "ExecutiveSessions", z, Ee), Se = `ExecutiveSessions/${z}/${Ee}`, Me = Li(j, N, M, pe), $ = {
      krcId: j,
      conversationId: b,
      title: N.title,
      primaryCategory: M.primaryCategory,
      categories: M.categories,
      confidence: M.confidence,
      uncertain: M.uncertain,
      status: "classified",
      sourcePath: pe,
      sessionPath: Se
    };
    try {
      const K = await Sn(fe, we, V);
      if (K === "skipped") {
        c++, $.status = "skipped", $.notes = "Duplicate file — not overwritten", C.skipped.push($), (v = n == null ? void 0 : n.log) == null || v.call(n, "warn", `Skipped duplicate file: ${J}`);
        continue;
      }
      f.set(b, j), K === "created" ? (i++, r.push(j), g.push(Mt(j, N.title, we, M.uncertain ? "Review Needed" : M.primaryCategory))) : K === "updated" && ($.status = "updated"), await Sn(Ue, Me, V), o++, (E = n == null ? void 0 : n.log) == null || E.call(n, "info", `Executive session: ${Se}`), M.uncertain ? (d++, $.status = $.status === "updated" ? "updated" : "uncertain", C.uncertain.push($)) : (a++, C.classified.push($)), (R = n == null ? void 0 : n.log) == null || R.call(n, "info", `${K === "created" ? "Created" : "Updated"} [${M.primaryCategory}] ${j}: ${pe}`), x || (await Zi(w, N, n), x = !0);
    } catch (K) {
      const Y = K instanceof Error ? K.message : String(K);
      s.push(`${j}: ${Y}`), $.status = "error", $.notes = Y, C.errors.push($), (D = n == null ? void 0 : n.log) == null || D.call(n, "error", `Failed to write ${j}: ${Y}`);
    }
  }
  let m;
  try {
    g.length > 0 && await Ut(t, g), await Oi(t, g.length, y), m = await Gi(t, C), (L = n == null ? void 0 : n.log) == null || L.call(n, "info", `Import review written: ${m}`);
  } catch (N) {
    const b = N instanceof Error ? N.message : String(N);
    s.push(`Registry/review update: ${b}`), (A = n == null ? void 0 : n.log) == null || A.call(n, "error", b);
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
    reviewFile: m
  };
}
async function Zi(e, t, n) {
  var o, c;
  const s = t.metadata.allZipAssets;
  if (!Array.isArray(s) || s.length === 0)
    return;
  await T.mkdir(e, { recursive: !0 });
  const r = s.some((a) => !a.dataBase64);
  let i;
  r && (n != null && n.sourceZipPath) && ((o = n.log) == null || o.call(n, "info", `Extracting ${s.length} asset(s) from ZIP at write time`), i = zi(n.sourceZipPath, s));
  for (const a of s) {
    const d = a.dataBase64 ? Buffer.from(a.dataBase64, "base64") : i == null ? void 0 : i.get(a.zipPath);
    if (!d || !a.fileName)
      continue;
    const l = S.join(e, a.fileName);
    await Ai(l, d, !1) !== "skipped" && ((c = n == null ? void 0 : n.log) == null || c.call(n, "info", `Preserved asset: Uploads/${S.basename(e)}/${a.fileName}`));
  }
}
class Hi extends ki {
  constructor() {
    super(...arguments);
    U(this, "id", "axiom");
    U(this, "name", "Axiom Knowledge Repository");
  }
  async export(n, s, r) {
    return Ki(n, s, r);
  }
}
const ds = new Hi(), Vi = [
  "Registries/SOURCE_REGISTRY.md",
  "Registries/KRC_STATUS.md",
  "Registries/IMPORT_REVIEW.md"
];
function us(e, t) {
  const n = [], s = [], r = [], i = [], o = [];
  for (const u of e)
    u.action === "create" ? (n.push(u.sourcePath), r.push(u.sessionPath)) : u.action === "update" ? (s.push(u.sourcePath), i.push(u.sessionPath)) : u.action === "skip" && o.push(u.sourcePath);
  const c = n.length + s.length > 0, a = c ? [...Vi] : [], d = c ? [t.replace("{timestamp}", "<timestamp>")] : [], l = [...n, ...s, ...r, ...i];
  return {
    sourcesAdded: n,
    sourcesUpdated: s,
    sessionsAdded: r,
    sessionsUpdated: i,
    registriesUpdated: a,
    uploadsAdded: d,
    duplicatesSkipped: o,
    modifiedFiles: l,
    deletedFiles: [],
    estimatedTotalChanges: n.length + s.length + r.length + i.length + a.length + d.length
  };
}
async function Wi(e, t, n) {
  const s = [], r = [], i = [], o = [];
  let c = 0, a = 0, d = 0, l = 0;
  const u = bt(e);
  let f = await Ot(t) + 1;
  const g = await is(t), y = S.join(t, "Sources"), w = S.join(t, "Uploads", "chatgpt-import-{timestamp}"), x = S.join(t, "ExecutiveSessions"), C = S.join(t, "Registries", "SOURCE_REGISTRY.md"), k = S.join(t, "Registries", "IMPORT_REVIEW.md");
  let _ = 0;
  const m = [], p = e[0];
  if (p) {
    const v = p.metadata.allZipAssets;
    Array.isArray(v) && (_ = v.length, m.push(...v.map((E) => E.fileName).filter(Boolean)));
  }
  for (const v of e) {
    const E = String(v.metadata.conversationId ?? v.id), R = u.get(E) ?? $t(v), D = g.get(E), L = cs(R);
    let A, N;
    D ? (A = D, N = "update") : (A = Pt(f), f++, N = "create");
    const b = as(A, v), M = S.join(y, L, b), G = `Sources/${L}/${b}`, z = os(A, v), j = `ExecutiveSessions/${L}/${z}`;
    if (N === "create")
      try {
        await T.access(M), N = "skip";
      } catch {
      }
    N === "create" ? c++ : N === "update" ? a++ : N === "skip" && d++, R.uncertain && l++, o.push({
      conversationId: E,
      title: v.title,
      krcId: A,
      action: N,
      primaryCategory: R.primaryCategory,
      categories: R.categories,
      uncertain: R.uncertain,
      sourcePath: G,
      sessionPath: j
    });
  }
  l > 0 && r.push(`${l} conversation(s) require manual review (uncertain classification).`), d > 0 && r.push(`${d} file(s) already exist and will be skipped.`);
  try {
    await T.access(t);
  } catch {
    r.push("Repository path does not exist yet — it will be created on import.");
  }
  const I = i.length === 0 && e.length > 0, h = us(o, w);
  return {
    valid: I,
    fileName: n,
    filePath: "",
    zipReadable: !0,
    chatGptStructureDetected: !0,
    conversationsJsonPresent: !0,
    conversationsFound: e.length,
    uploadedFilesCount: _,
    uploadedFileNames: m,
    estimatedSourcesToCreate: c,
    estimatedSourcesToUpdate: a,
    estimatedDuplicatesSkipped: d,
    uncertainCount: l,
    errors: s,
    warnings: r,
    blockingErrors: i,
    plannedRecords: o,
    diffPreview: h,
    validatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    outputLocations: {
      sourcesRoot: y,
      uploadsPattern: w,
      executiveSessionsRoot: x,
      registryPath: C,
      reviewPath: k
    },
    repositoryPath: t
  };
}
function qi(e, t, n, s) {
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
    diffPreview: us([], S.join(n, "Uploads", "chatgpt-import-{timestamp}")),
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
async function ls(e, t, n = {}) {
  var o, c, a, d;
  const s = Date.now(), r = [], i = (l, u, f) => {
    var g;
    (g = n.log) == null || g.call(n, l, u, f);
  };
  try {
    i("info", "Validation started (read-only — repository will not be modified)", {
      fileName: e.name,
      repositoryPath: t
    });
    const l = await rs(e, {
      log: n.log,
      onProgress: n.onProgress,
      signal: n.signal
    });
    (o = n.onImportPackageReady) == null || o.call(n, l), (c = n.onProgress) == null || c.call(n, {
      status: "running",
      stage: "planning-import",
      stageLabel: "Planning import (read-only)",
      fileName: e.name,
      conversationsTotal: l.documents.length,
      conversationsProcessed: l.documents.length,
      messagesProcessed: l.documents.reduce((f, g) => f + Number(g.metadata.messageCount ?? 0), 0),
      warningsGenerated: r.length,
      startedAt: new Date(s).toISOString(),
      elapsedMs: Date.now() - s,
      detail: "Scanning repository for planned changes"
    }), i("info", "Planning import (read-only repository scan)…");
    const u = await Wi(l.documents, t, e.name);
    if (u.filePath = e.path, u.zipReadable = !0, u.chatGptStructureDetected = !0, u.conversationsJsonPresent = !0, u.valid = u.blockingErrors.length === 0 && l.documents.length > 0, u.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), u.durationMs = Date.now() - s, l.documents.length === 0) {
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
      fileName: e.name,
      conversationsTotal: u.conversationsFound,
      conversationsProcessed: u.conversationsFound,
      messagesProcessed: l.documents.reduce((f, g) => f + Number(g.metadata.messageCount ?? 0), 0),
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
  } catch (l) {
    const u = l instanceof Error ? l.message : String(l), f = u.includes("cancelled"), g = qi(e.name, e.path, t, u);
    return g.durationMs = Date.now() - s, g.validatedAt = (/* @__PURE__ */ new Date()).toISOString(), (d = n.onProgress) == null || d.call(n, {
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
      error: u,
      detail: u
    }), i(f ? "warn" : "error", `Validation ${f ? "cancelled" : "failed"} — repository unchanged. ${u}`, { error: u }), g;
  }
}
const kn = zn(Gn);
async function Yi(e) {
  try {
    return await T.access(e), !0;
  } catch {
    return !1;
  }
}
async function Ji(e) {
  const t = S.join(e, ".kae-snapshots");
  try {
    const s = (await T.readdir(t)).sort().reverse();
    return s[0] ? S.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function Xi(e, t) {
  const n = [];
  let s = !1, r, i = !1;
  try {
    const { stdout: f } = await kn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
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
      const { stdout: f } = await kn("git", ["status", "--porcelain"], {
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
  const d = await Ji(e);
  n.push({
    id: "snapshot",
    label: "Import snapshot available",
    passed: !!d,
    message: d ? `Latest snapshot: ${S.basename(d)}` : "No import snapshot found (created automatically before imports).",
    severity: "info"
  }), await Yi(e) || n.push({
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
const xn = zn(Gn), Tn = /KRC-\d{4}/g;
async function ae(e) {
  try {
    return await T.access(e), !0;
  } catch {
    return !1;
  }
}
async function Dn(e) {
  const t = [];
  if (!await ae(e))
    return t;
  async function n(s) {
    const r = await T.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && t.push(o);
    }
  }
  return await n(e), t;
}
function _n(e, t) {
  return S.relative(e, t).replace(/\\/g, "/");
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
  for (const x of r) {
    const C = S.join(e, x);
    await ae(C) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_DIR",
      message: `Missing directory: ${x}`,
      path: C,
      relativePath: x,
      recovery: "Directory will be created automatically on first import."
    });
  }
  const i = ["SOURCE_REGISTRY.md", "KRC_STATUS.md", "IMPORT_REVIEW.md"];
  for (const x of i) {
    const C = S.join(e, "Registries", x);
    await ae(C) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_REGISTRY",
      message: `Missing registry: ${x}`,
      path: C,
      relativePath: `Registries/${x}`,
      recovery: "Registry files are created during the first successful import."
    });
  }
  const o = await Dn(S.join(e, "Sources")), c = await Dn(S.join(e, "ExecutiveSessions")), a = /* @__PURE__ */ new Map();
  for (const x of c) {
    const k = S.basename(x).match(Tn);
    k != null && k[0] && a.set(k[0], x);
  }
  for (const x of o) {
    const C = S.basename(x), k = _n(e, x), _ = C.match(Tn);
    if (!_) {
      W(t, {
        severity: "info",
        category: "info",
        code: "NO_KRC_ID",
        message: `Source file has no KRC ID in filename: ${C}`,
        path: x,
        relativePath: k
      });
      continue;
    }
    for (const p of _) {
      const I = s.get(p) ?? [];
      I.push(x), s.set(p, I);
    }
    /[<>:"|?*]/.test(C) && W(t, {
      severity: "error",
      category: "error",
      code: "INVALID_FILENAME",
      message: `Invalid characters in filename: ${C}`,
      path: x,
      relativePath: k,
      recovery: "Rename the file to remove invalid characters."
    });
    const m = _[0];
    a.has(m) || W(t, {
      severity: "warning",
      category: "warning",
      code: "MISSING_SESSION",
      message: `No executive session found for ${m}`,
      path: x,
      relativePath: k,
      recovery: "Re-import or manually create the executive session record."
    });
    try {
      const p = await T.readFile(x, "utf8");
      !p.includes("## Metadata") && !p.includes("Acquired by KAE") && W(t, {
        severity: "info",
        category: "info",
        code: "MISSING_METADATA",
        message: `Source ${m} may be missing standard metadata block`,
        path: x,
        relativePath: k
      });
    } catch {
      W(t, {
        severity: "error",
        category: "error",
        code: "UNREADABLE_FILE",
        message: `Unable to read source file: ${C}`,
        path: x,
        relativePath: k,
        recovery: "Verify file permissions and encoding."
      });
    }
  }
  for (const [x, C] of s)
    C.length > 1 && (n.push(x), W(t, {
      severity: "error",
      category: "error",
      code: "DUPLICATE_ID",
      message: `Duplicate KRC ID ${x} found in ${C.length} files`,
      path: C[0],
      relativePath: _n(e, C[0]),
      recovery: "Remove or merge duplicate source files before committing."
    }));
  o.length === 0 && await ae(e) && W(t, {
    severity: "info",
    category: "recommendation",
    code: "EMPTY_SOURCES",
    message: "No source files found in the repository.",
    recovery: "Import a ChatGPT export to populate the knowledge repository."
  }), await ae(S.join(e, ".kae-snapshots")) || W(t, {
    severity: "info",
    category: "recommendation",
    code: "NO_SNAPSHOTS",
    message: "No import snapshots yet.",
    recovery: "Snapshots are created automatically before each import."
  });
  let d = !1, l, u;
  try {
    const { stdout: x } = await xn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: e
    }), { stdout: C } = await xn("git", ["status", "--porcelain"], {
      cwd: e
    });
    d = !0, l = x.trim(), u = C.trim().length > 0, u && W(t, {
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
  const f = fr(t), y = {
    ready: !(f.errors.length > 0) && await ae(e),
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
    gitBranch: l,
    gitDirty: u,
    gitReadiness: { ready: !1, status: "NOT READY", checks: [] }
  }, w = lr(y);
  return y.statusLevel = w.level, y.statusHeadline = w.headline, y.statusSubline = w.subline, y.gitReadiness = await Xi(e, y), y;
}
async function fs(e, t) {
  await T.mkdir(t, { recursive: !0 });
  const n = await T.readdir(e, { withFileTypes: !0 });
  for (const s of n) {
    const r = S.join(e, s.name), i = S.join(t, s.name);
    s.isDirectory() ? await fs(r, i) : await T.copyFile(r, i);
  }
}
async function ps(e, t) {
  const n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-"), s = S.join(e, ".kae-snapshots", `${n}_${t}`);
  await T.mkdir(s, { recursive: !0 });
  const r = ["Sources", "ExecutiveSessions", "Registries"];
  for (const i of r) {
    const o = S.join(e, i);
    try {
      await T.access(o), await fs(o, S.join(s, i));
    } catch {
    }
  }
  return s;
}
async function Qi(e, t) {
  const n = S.join(e, ".kae-sessions");
  await T.mkdir(n, { recursive: !0 });
  const s = S.join(n, `${t.sessionId}.json`);
  return await T.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const eo = 53, to = 122;
function no(e) {
  var s;
  const t = e.slice(0, 4096), n = t.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  return {
    krcId: n == null ? void 0 : n[1],
    title: (s = n == null ? void 0 : n[2]) == null ? void 0 : s.trim(),
    createTime: ce(t, "Create Time"),
    updateTime: ce(t, "Update Time")
  };
}
async function ms(e) {
  const n = (await tt(e)).filter((r) => r.category === "sources" && jt(r.name)), s = [];
  for (const r of n) {
    let i = "";
    try {
      i = (await $e(e, r.relativePath)).slice(0, 4096);
    } catch {
    }
    const o = no(i), c = o.updateTime ?? o.createTime ?? r.modifiedAt ?? "";
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
function jt(e) {
  const t = e.match(/^KRC-(\d{4})_/i);
  if (!t)
    return !1;
  const n = parseInt(t[1], 10);
  return n >= eo && n <= to;
}
function ce(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function so(e) {
  return e ? e.split(`
`).map((t) => t.replace(/^-\s*/, "").trim()).filter(Boolean) : [];
}
function ro(e) {
  var d, l, u, f;
  const t = e.split(`
`), n = (d = t[0]) == null ? void 0 : d.trim();
  if (!n)
    return null;
  let s, r = 1;
  (l = t[1]) != null && l.startsWith("*") && ((u = t[1]) != null && u.endsWith("*")) && (s = t[1].slice(1, -1).trim(), r = 2);
  const o = t.slice(r).join(`
`).trim().split(/\n\*\*File references:\*\*\s*\n/i), c = ((f = o[0]) == null ? void 0 : f.trim()) ?? "", a = [];
  if (o[1])
    for (const g of o[1].split(`
`)) {
      const y = g.replace(/^-\s*/, "").trim();
      y && a.push(y);
    }
  return { role: n, timestamp: s, text: c, fileReferences: a };
}
function Bt(e) {
  const t = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  if (!t)
    return null;
  const n = e.indexOf("## Transcript"), s = n >= 0 ? e.slice(0, n) : e, r = n >= 0 ? e.slice(n + 13) : "", i = [];
  for (const o of r.split(/^### /m).slice(1)) {
    const c = ro(o);
    c && i.push(c);
  }
  return {
    krcId: t[1],
    title: t[2].trim(),
    conversationId: ce(s, "ChatGPT Conversation ID"),
    createTime: ce(s, "Create Time"),
    updateTime: ce(s, "Update Time"),
    description: ce(s, "Description"),
    fileReferences: so(ce(s, "File References")),
    messages: i
  };
}
function Gt(e, t) {
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
function io(e) {
  return e.startsWith("image/") ? "image" : e.startsWith("video/") ? "video" : "other";
}
async function hs(e) {
  const t = S.join(e, "Uploads");
  let n;
  try {
    n = await T.readdir(t);
  } catch {
    return null;
  }
  const s = n.filter((r) => r.startsWith("chatgpt-import-")).sort().reverse();
  return s.length === 0 ? null : `Uploads/${s[0]}`;
}
async function gs(e, t) {
  const n = /* @__PURE__ */ new Map(), s = S.join(e, t);
  let r;
  try {
    r = await T.readdir(s);
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
function ys(e, t) {
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
async function oo(e, t) {
  const n = await hs(e);
  if (!n)
    return [];
  const s = await gs(e, n), r = [], i = /* @__PURE__ */ new Set();
  for (const o of t) {
    const c = ys(o, s);
    if (!c || i.has(c))
      continue;
    i.add(c);
    const a = S.join(e, c);
    let d;
    try {
      d = await T.readFile(a);
    } catch {
      continue;
    }
    const l = Gt(d, o);
    r.push({
      ref: o,
      relativePath: c,
      fileName: S.basename(c),
      mimeType: l,
      kind: io(l)
    });
  }
  return r;
}
function xe(e, t) {
  var r;
  const n = new RegExp(`^## ${t}\\s*\\n([\\s\\S]*?)(?=^## |\\z)`, "m"), s = e.match(n);
  return (r = s == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function ao(e, t) {
  var l;
  const n = e.match(/^#\s*Executive Session Record\s*[—–-]\s*(.+)$/m), s = ((l = n == null ? void 0 : n[1]) == null ? void 0 : l.trim()) ?? t.replace(/\.md$/i, ""), r = xe(e, "Source ID"), i = xe(e, "Session Date"), o = xe(e, "Session Summary") ?? "", c = xe(e, "Transcript Reference"), a = [];
  c && a.push(c);
  for (const u of ["Key Topics", "Recurring Terms", "Classification", "Rationale"]) {
    const f = xe(e, u);
    if (f)
      for (const g of f.split(`
`)) {
        const y = g.replace(/^-\s*/, "").trim();
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
const ye = ".kae-index", co = "evidence-index.json", vs = 1;
function et(e) {
  return S.join(e, ye, co);
}
async function Is(e) {
  const t = et(e);
  try {
    const n = await T.readFile(t, "utf8"), s = JSON.parse(n);
    return s.version !== vs || !Array.isArray(s.records) ? null : s;
  } catch {
    return null;
  }
}
async function uo(e, t) {
  const n = S.join(e, ye);
  await T.mkdir(n, { recursive: !0 });
  const s = et(e);
  return await T.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
const lo = /* @__PURE__ */ new Set([
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
function Ne(e) {
  const t = e.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter((n) => n.length > 1 && !lo.has(n));
  return [...new Set(t)];
}
function ve(e) {
  const t = e.trim();
  if (!t)
    return [];
  if (/^krc-\d{4}$/i.test(t))
    return [t.toLowerCase()];
  const n = t.toLowerCase(), s = Ne(t);
  return s.length === 0 && n.length > 0 ? [n] : s;
}
function _e(e, t = 160) {
  return e.replace(/\s+/g, " ").trim().slice(0, t);
}
function ws(e) {
  return jt(e) ? "chatgpt-import" : e.startsWith("KRC-") ? "krc-source" : "markdown";
}
function fo(e) {
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
function po(e, t, n, s) {
  const r = Bt(t);
  if (!r)
    return;
  const i = ws(S.basename(e)), o = {
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
    excerpt: _e(r.description ?? r.title)
  }), s.push({
    id: `${r.krcId}:conversation`,
    kind: "conversation",
    repository: o,
    conversation: c,
    excerpt: _e(r.title)
  });
  const a = new Set(r.fileReferences), d = /* @__PURE__ */ new Map();
  r.messages.forEach((l, u) => {
    const f = `${r.krcId}:msg:${u}`, g = Ne(l.text);
    d.set(f, l.fileReferences), s.push({
      id: f,
      kind: "message",
      repository: o,
      conversation: c,
      message: {
        messageId: f,
        role: l.role,
        timestamp: l.timestamp,
        text: l.text,
        searchTerms: g
      },
      excerpt: _e(l.text)
    });
    for (const y of l.fileReferences)
      a.add(y);
  });
  for (const l of a) {
    const u = `${r.krcId}:att:${l}`, f = n ? ys(l, n) : null, g = S.basename(l);
    let y;
    for (const [w, x] of d.entries())
      if (x.includes(l)) {
        y = w;
        break;
      }
    s.push({
      id: u,
      kind: "attachment",
      repository: o,
      conversation: c,
      attachment: {
        attachmentId: u,
        filename: g,
        assetPath: f ?? void 0,
        linkedMessageId: y,
        resolved: !!f
      },
      excerpt: g
    });
  }
}
function mo(e, t, n) {
  var c;
  const s = S.basename(e), r = t.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m), i = r == null ? void 0 : r[1], o = ((c = r == null ? void 0 : r[2]) == null ? void 0 : c.trim()) ?? s.replace(/\.md$/i, "");
  n.push({
    id: `${e}:source`,
    kind: "source",
    repository: {
      krcId: i,
      repositoryPath: e,
      category: "sources",
      sourceType: ws(s)
    },
    conversation: { title: o },
    excerpt: _e(t)
  });
}
function ho(e, t, n) {
  const s = ao(t, S.basename(e));
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
    excerpt: _e(r || s.title)
  });
}
async function zt(e) {
  const t = await tt(e), n = [], s = await hs(e), r = s ? await gs(e, s) : null;
  for (const c of t) {
    if (!c.relativePath.endsWith(".md") || c.category !== "sources" && c.category !== "sessions")
      continue;
    let a;
    try {
      a = await $e(e, c.relativePath);
    } catch {
      continue;
    }
    if (c.category === "sessions") {
      ho(c.relativePath, a, n);
      continue;
    }
    jt(c.name) && Bt(a) ? po(c.relativePath, a, r, n) : mo(c.relativePath, a, n);
  }
  const i = (/* @__PURE__ */ new Date()).toISOString(), o = {
    version: vs,
    repositoryPath: e,
    builtAt: i,
    recordCount: n.length,
    records: n
  };
  return await uo(e, o), o;
}
function go(e) {
  const t = fo(e.records);
  return t.builtAt = e.builtAt, t;
}
function Es(e) {
  return e.trim().toLowerCase();
}
function yo(e) {
  const t = Es(e);
  return t === "user" || t.startsWith("user ");
}
function vo(e) {
  const t = Es(e);
  return t === "assistant" || t.startsWith("assistant ");
}
function Io(e) {
  return e.kind === "executive_session" ? "session" : e.kind === "attachment" ? "attachment" : e.repository.category === "sessions" ? "session" : "source";
}
function wo(e) {
  var t, n, s, r;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : e.kind === "executive_session" ? ((t = e.conversation) == null ? void 0 : t.title) ?? ((n = e.session) == null ? void 0 : n.sessionId) ?? "Executive Session" : e.kind === "message" && e.message ? `${((s = e.conversation) == null ? void 0 : s.title) ?? e.repository.krcId ?? "Message"} — ${e.message.role}` : ((r = e.conversation) == null ? void 0 : r.title) ?? e.repository.krcId ?? e.repository.repositoryPath;
}
function Eo(e) {
  var t, n, s;
  if (e.kind === "executive_session") {
    if ((t = e.session) != null && t.transcriptReference)
      return e.session.transcriptReference;
    const r = (n = e.session) == null ? void 0 : n.summaryReferences.find((i) => i.startsWith("Sources/"));
    return r || e.repository.repositoryPath;
  }
  return e.kind === "attachment" && ((s = e.attachment) != null && s.assetPath), e.repository.repositoryPath;
}
function ze(e) {
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
function So(e, t, n) {
  var a, d, l;
  const s = /* @__PURE__ */ new Set();
  let r = 0;
  const i = t.toLowerCase(), o = (a = e.repository.krcId) == null ? void 0 : a.toLowerCase();
  o && (o === i || o.includes(i)) && (r += 100, s.add("krcId"));
  const c = ((l = (d = e.conversation) == null ? void 0 : d.title) == null ? void 0 : l.toLowerCase()) ?? "";
  if (c && c.includes(i) && (r += 40, s.add("title")), e.kind === "attachment" && e.attachment) {
    const u = e.attachment.filename.toLowerCase();
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 50, s.add("filename"), s.add("attachment"));
  }
  if (e.kind === "message" && e.message) {
    const u = e.message.text.toLowerCase(), f = u.includes(i), g = n.filter((y) => u.includes(y)).length;
    (f || g > 0) && (r += f ? 30 : g * 8, s.add("message"), s.add("keyword"), yo(e.message.role) && (s.add("prompt"), f && (r += 10)), vo(e.message.role) && (s.add("response"), f && (r += 10)));
  }
  if (e.kind === "executive_session") {
    const u = ze(e);
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 25, s.add("session"), s.add("keyword"));
  }
  if (e.kind === "source" || e.kind === "conversation") {
    const u = ze(e);
    (u.includes(i) || n.some((f) => u.includes(f))) && (r += 15, s.add("keyword"));
  }
  if (r === 0) {
    const u = ze(e);
    if (u.includes(i))
      r += 5, s.add("keyword");
    else {
      const f = n.filter((g) => u.includes(g)).length;
      f > 0 && (r += f * 3, s.add("keyword"));
    }
  }
  if (n.length > 1) {
    const u = ze(e);
    n.every((f) => u.includes(f)) && (r += 25, s.add("keyword"));
  }
  return { score: r, matchFields: [...s] };
}
function Ro(e, t, n) {
  var s, r, i;
  return {
    recordId: e.id,
    kind: e.kind,
    score: t,
    matchFields: n,
    title: wo(e),
    snippet: e.excerpt,
    drilldownPath: Eo(e),
    krcId: e.repository.krcId,
    conversationTitle: (s = e.conversation) == null ? void 0 : s.title,
    messageRole: (r = e.message) == null ? void 0 : r.role,
    attachmentFilename: (i = e.attachment) == null ? void 0 : i.filename,
    category: Io(e)
  };
}
function Ss(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  const r = ve(s), i = [];
  for (const o of e.records) {
    const { score: c, matchFields: a } = So(o, s, r);
    c <= 0 || a.length === 0 || i.push(Ro(o, c, a));
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
function Rs(e) {
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
async function Ie(e) {
  const t = await Is(e);
  return t && t.repositoryPath === e ? t : zt(e);
}
async function Cs(e, t, n = 50) {
  const s = await Ie(e);
  return Ss(s, t, n);
}
function Co(e) {
  const t = e.replace(/\\/g, "/");
  return t.startsWith("Sources/") ? "sources" : t.startsWith("ExecutiveSessions/") ? "sessions" : t.startsWith("Registries/") ? "registries" : t.startsWith("ImportReports/") ? "reports" : t.startsWith("Uploads/") ? "uploads" : "other";
}
async function ks(e, t, n) {
  const s = await T.readdir(t, { withFileTypes: !0 });
  for (const r of s) {
    if (r.name.startsWith(".kae-"))
      continue;
    const i = S.join(t, r.name), o = S.relative(e, i).replace(/\\/g, "/");
    if (r.isDirectory())
      await ks(e, i, n);
    else if (r.name.endsWith(".md") || r.name.endsWith(".json")) {
      let c, a;
      try {
        const d = await T.stat(i);
        c = d.size, a = d.mtime.toISOString();
      } catch {
      }
      n.push({
        name: r.name,
        relativePath: o,
        category: Co(o),
        sizeBytes: c,
        modifiedAt: a
      });
    }
  }
}
async function tt(e) {
  const t = [];
  try {
    await T.access(e), await ks(e, e, t);
  } catch {
    return [];
  }
  return t.sort((n, s) => n.relativePath.localeCompare(s.relativePath));
}
async function $e(e, t) {
  const n = S.join(e, t), s = S.resolve(e);
  if (!S.resolve(n).startsWith(s))
    throw new Error("Invalid file path.");
  return T.readFile(n, "utf8");
}
function ko(e, t, n = 80) {
  const s = Math.max(0, t - n), r = Math.min(e.length, t + n);
  return e.slice(s, r).replace(/\s+/g, " ").trim();
}
async function xo(e, t, n = 50) {
  const s = t.trim();
  if (!s)
    return [];
  try {
    const r = await Cs(e, s, n);
    if (r.length > 0)
      return Rs(r);
  } catch {
  }
  return To(e, s, n);
}
async function To(e, t, n = 50) {
  const s = t.toLowerCase(), r = await tt(e), i = [];
  for (const o of r) {
    if (!o.relativePath.endsWith(".md"))
      continue;
    let c;
    try {
      c = await $e(e, o.relativePath);
    } catch {
      continue;
    }
    const a = c.toLowerCase(), d = o.name.replace(/\.md$/i, "");
    let l = 0;
    d.toLowerCase().includes(s) && (l += 10);
    const u = a.split(s).length - 1;
    if (u === 0)
      continue;
    l += u;
    const f = a.indexOf(s);
    i.push({
      path: o.relativePath,
      title: d,
      snippet: ko(c, f),
      category: o.category === "sessions" ? "session" : o.category === "registries" ? "registry" : o.category === "reports" ? "report" : "source",
      score: l
    });
  }
  return i.sort((o, c) => c.score - o.score).slice(0, n);
}
async function Do(e) {
  const t = S.join(e, ".kae-snapshots");
  try {
    const s = (await T.readdir(t)).sort().reverse();
    return s[0] ? S.join(t, s[0]) : void 0;
  } catch {
    return;
  }
}
async function _o(e) {
  var n;
  const t = S.join(e, "Registries", "IMPORT_REVIEW.md");
  try {
    const r = (await T.readFile(t, "utf8")).match(/Import Date:\s*([^\n]+)/i);
    return (n = r == null ? void 0 : r[1]) == null ? void 0 : n.trim();
  } catch {
    return;
  }
}
async function xs(e) {
  const t = await le(e);
  let n = 0;
  try {
    const s = S.join(e, "Registries");
    n = (await T.readdir(s)).filter((i) => i.endsWith(".md")).length;
  } catch {
    n = 0;
  }
  return {
    repositoryPath: e,
    sourceCount: t.sourceCount,
    sessionCount: t.sessionCount,
    registryCount: n,
    lastImportDate: await _o(e),
    lastSnapshotPath: await Do(e),
    healthReady: t.ready,
    issueCount: t.issues.length
  };
}
function Ao(e) {
  return e < 1e3 ? `${e}ms` : `${(e / 1e3).toFixed(1)}s`;
}
function No(e) {
  const t = [
    "# KAE Import Report",
    "",
    `**Report ID:** ${e.reportId}`,
    `**Generated:** ${e.generatedAt}`,
    `**Duration:** ${Ao(e.durationMs)}`,
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
async function $o(e, t) {
  const n = S.join(e, "ImportReports");
  await T.mkdir(n, { recursive: !0 });
  const r = `import-report-${t.generatedAt.replace(/[:.]/g, "-")}.md`, i = S.join(n, r), o = No({ ...t });
  return await T.writeFile(i, o, "utf8"), i;
}
const bo = /KRC-(\d{4})/i;
async function Ts(e) {
  try {
    return await T.access(e), !0;
  } catch {
    return !1;
  }
}
async function Ds(e) {
  const t = [];
  if (!await Ts(e))
    return t;
  async function n(s) {
    const r = await T.readdir(s, { withFileTypes: !0 });
    for (const i of r) {
      const o = S.join(s, i.name);
      i.isDirectory() ? await n(o) : i.name.endsWith(".md") && t.push(o);
    }
  }
  return await n(e), t;
}
function _s(e, t) {
  return S.relative(e, t).replace(/\\/g, "/");
}
function As(e) {
  const t = e.match(bo);
  return t ? t[0].toUpperCase() : null;
}
function Ns(e, t) {
  const n = e.replace(/\\/g, "/").split("/");
  return n[0] === t && n.length >= 2 ? n[1] ?? "" : "";
}
async function Lo(e) {
  const t = S.join(e, "Sources"), n = await Ds(t), s = [];
  for (const r of n) {
    const i = _s(e, r), o = S.basename(r), c = await T.stat(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: As(o),
      categoryFolder: Ns(i, "Sources"),
      mtimeMs: c.mtimeMs
    });
  }
  return s;
}
async function Fo(e) {
  const t = S.join(e, "ExecutiveSessions"), n = await Ds(t), s = [];
  for (const r of n) {
    const i = _s(e, r), o = S.basename(r);
    s.push({
      absolutePath: r,
      relativePath: i,
      fileName: o,
      krcId: As(o),
      categoryFolder: Ns(i, "ExecutiveSessions")
    });
  }
  return s;
}
async function Oo(e) {
  const t = S.join(e, "Registries", "SOURCE_REGISTRY.md"), n = [];
  try {
    const s = await T.readFile(t, "utf8");
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
async function Po(e) {
  const t = S.join(e, "Uploads");
  return await Ts(t) ? (await T.readdir(t, { withFileTypes: !0 })).filter((s) => s.isDirectory()).map((s) => `Uploads/${s.name}`) : [];
}
function ee(e, t, n, s) {
  return {
    id: q(),
    type: e,
    message: t,
    affectedFiles: n,
    ...s
  };
}
async function Uo(e) {
  const t = [], n = await Lo(e), s = await Fo(e), r = await Oo(e), i = await Po(e), o = /* @__PURE__ */ new Map(), c = /* @__PURE__ */ new Map(), a = new Map(r.map((l) => [l.krcId, l]));
  for (const l of n) {
    if (!l.krcId) {
      t.push(ee("invalid-krc-filename", `Source file has no valid KRC ID pattern: ${l.fileName}`, [l.relativePath]));
      continue;
    }
    const u = o.get(l.krcId) ?? [];
    u.push(l), o.set(l.krcId, u);
  }
  for (const l of s) {
    if (!l.krcId)
      continue;
    const u = c.get(l.krcId) ?? [];
    u.push(l), c.set(l.krcId, u);
  }
  for (const [l, u] of o)
    if (u.length > 1) {
      const f = u.map((g) => g.relativePath);
      t.push(ee("duplicate-krc-id", `Duplicate KRC ID ${l} found in ${u.length} source files`, f, {
        krcId: l,
        details: {
          canonical: f[0],
          duplicates: f.slice(1),
          mtimes: u.map((g) => g.mtimeMs)
        }
      }));
    }
  for (const l of n) {
    if (!l.krcId)
      continue;
    const u = c.get(l.krcId) ?? [];
    if (u.length === 0)
      t.push(ee("missing-executive-session", `No executive session found for ${l.krcId}`, [l.relativePath], { krcId: l.krcId }));
    else {
      const f = u[0];
      f.categoryFolder !== l.categoryFolder && t.push(ee("source-session-mismatch", `Category mismatch for ${l.krcId}: source in ${l.categoryFolder}, session in ${f.categoryFolder}`, [l.relativePath, f.relativePath], { krcId: l.krcId }));
    }
    a.has(l.krcId) || t.push(ee("missing-registry-entry", `Source ${l.krcId} is missing from SOURCE_REGISTRY.md`, [l.relativePath, "Registries/SOURCE_REGISTRY.md"], { krcId: l.krcId }));
  }
  const d = new Set(n.map((l) => l.krcId).filter(Boolean));
  for (const l of s)
    l.krcId && (d.has(l.krcId) || t.push(ee("orphan-executive-session", `Executive session exists without matching source for ${l.krcId}`, [l.relativePath], { krcId: l.krcId })));
  for (const l of r)
    d.has(l.krcId) || t.push(ee("broken-registry-reference", `Registry references ${l.krcId} but no matching source file exists`, ["Registries/SOURCE_REGISTRY.md"], { krcId: l.krcId, details: { registryTitle: l.title } }));
  return i.length === 0 && n.length > 0 && t.push(ee("upload-folder-mismatch", "No upload folders found under Uploads/ — imported assets may be missing", ["Uploads/"])), t;
}
async function Mo(e) {
  var i;
  const t = await Uo(e), n = [];
  for (const o of t)
    switch (o.type) {
      case "duplicate-krc-id": {
        const c = o.affectedFiles, a = ((i = o.details) == null ? void 0 : i.mtimes) ?? [], d = [...c].sort((u, f) => {
          const g = c.indexOf(u), y = c.indexOf(f);
          return (a[g] ?? 0) - (a[y] ?? 0);
        }), l = d[0];
        for (const u of d.slice(1))
          n.push({
            id: q(),
            issueId: o.id,
            type: "reassign-krc-id",
            description: `Reassign duplicate ${o.krcId} in ${u}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${l}`,
            riskLevel: "medium",
            autoRepairSafe: !0,
            manualReviewRequired: !1,
            affectedFiles: [u],
            metadata: {
              oldKrcId: o.krcId,
              canonicalPath: l
            }
          });
        break;
      }
      case "missing-executive-session":
        n.push({
          id: q(),
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
          id: q(),
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
          id: q(),
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
          id: q(),
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
          id: q(),
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
          id: q(),
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
          id: q(),
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
function ie(e, t) {
  var s, r;
  const n = new RegExp(`## ${t}\\s*\\n([^#\\n][^\\n]*)`, "i");
  return (r = (s = e.match(n)) == null ? void 0 : s[1]) == null ? void 0 : r.trim();
}
function Kt(e, t) {
  var a, d, l;
  const s = ((d = (a = (t.split("/").pop() ?? t).match(/KRC-\d{4}/i)) == null ? void 0 : a[0]) == null ? void 0 : d.toUpperCase()) ?? "KRC-0000", r = e.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m), i = ((l = r == null ? void 0 : r[2]) == null ? void 0 : l.trim()) ?? ie(e, "Description") ?? "Untitled", o = t.replace(/\\/g, "/").split("/"), c = o[0] === "Sources" && o.length >= 2 ? o[1] : "Other_Review_Needed";
  return {
    krcId: s,
    title: i,
    primaryProduct: ie(e, "Primary Product") ?? "Review Needed",
    topic: ie(e, "Topic") ?? "ChatGPT conversation",
    status: ie(e, "Status") ?? "Inventoried",
    conversationId: ie(e, "ChatGPT Conversation ID"),
    createTime: ie(e, "Create Time"),
    updateTime: ie(e, "Update Time"),
    categoryFolder: c
  };
}
function jo(e, t, n, s) {
  let r = e;
  const i = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), o = e.match(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*(.+)$`, "m"));
  return o && (r = r.replace(new RegExp(`^#\\s*${i}\\s*[—–-]\\s*.+$`, "m"), `# ${n} — ${o[1].trim()}`)), r.includes("## Source ID") && (r = r.replace(new RegExp(`(## Source ID\\s*\\n)${i}`, "i"), `$1${n}`)), r.includes("## KAE Repair Provenance") || (r = `${r.trimEnd()}

## KAE Repair Provenance
${s}
`), r;
}
const Bo = "Generated by KAE Repository Repair because source KRC existed without matching executive session.";
function $s(e, t, n, s = Bo) {
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
function bs(e, t) {
  return `${e}_${Qe(t)}_SESSION.md`;
}
function Go(e, t) {
  return `${e}_${Qe(t)}.md`;
}
const zo = (e, t, n) => `Reassigned from ${e} to ${t} by KAE Repository Repair on ${n}. Canonical record retains ${e}; this duplicate was preserved with a new ID.`;
async function Ko(e, t, n, s) {
  var I;
  const r = t.affectedFiles[0];
  if (!r)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file specified",
      filesChanged: []
    };
  const i = String(((I = t.metadata) == null ? void 0 : I.oldKrcId) ?? ""), o = S.join(e, r), c = await T.readFile(o, "utf8"), a = Kt(c, r);
  n.value += 1;
  const d = Pt(n.value), l = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), u = zo(i, d, l), f = jo(c, i, d, u), g = S.join(e, "Sources", a.categoryFolder), y = Go(d, a.title), w = S.join(g, y), x = `Sources/${a.categoryFolder}/${y}`;
  await T.mkdir(g, { recursive: !0 }), await T.writeFile(w, f, "utf8"), w !== o && await T.unlink(o);
  const C = S.join(e, "ExecutiveSessions", a.categoryFolder);
  await T.mkdir(C, { recursive: !0 });
  const k = bs(d, a.title), _ = S.join(C, k), m = `ExecutiveSessions/${a.categoryFolder}/${k}`, p = $s(d, x, { ...a, title: a.title }, `Generated by KAE Repository Repair after reassigning duplicate ${i} → ${d}.`);
  return await T.writeFile(_, p, "utf8"), await Ut(e, [
    Mt(d, a.title, f, a.primaryProduct)
  ]), s("info", `Reassigned duplicate ${i} → ${d}`, {
    oldPath: r,
    newPath: x,
    sessionPath: m
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Reassigned ${i} → ${d}`,
    filesChanged: [x, m, "Registries/SOURCE_REGISTRY.md"]
  };
}
async function Zo(e, t, n) {
  var g;
  const s = t.affectedFiles.find((y) => y.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file found for session generation",
      filesChanged: []
    };
  const r = String(((g = t.metadata) == null ? void 0 : g.krcId) ?? ""), i = S.join(e, s), o = await T.readFile(i, "utf8"), c = Kt(o, s), a = S.join(e, "ExecutiveSessions", c.categoryFolder);
  await T.mkdir(a, { recursive: !0 });
  const d = bs(r || c.krcId, c.title), l = S.join(a, d), u = `ExecutiveSessions/${c.categoryFolder}/${d}`;
  if (await Vo(l))
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: `Session already exists: ${u}`,
      filesChanged: []
    };
  const f = $s(r || c.krcId, s, c);
  return await T.writeFile(l, f, "utf8"), n("info", `Generated executive session for ${r || c.krcId}`, {
    sessionPath: u,
    sourcePath: s
  }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Generated session for ${r || c.krcId}`,
    filesChanged: [u]
  };
}
async function Ho(e, t, n) {
  const s = t.affectedFiles.find((c) => c.startsWith("Sources/"));
  if (!s)
    return {
      actionId: t.id,
      type: t.type,
      success: !1,
      message: "No source file for registry entry",
      filesChanged: []
    };
  const r = S.join(e, s), i = await T.readFile(r, "utf8"), o = Kt(i, s);
  return await Ut(e, [
    Mt(o.krcId, o.title, i, o.primaryProduct)
  ]), n("info", `Added registry entry for ${o.krcId}`, { sourcePath: s }), {
    actionId: t.id,
    type: t.type,
    success: !0,
    message: `Added registry entry for ${o.krcId}`,
    filesChanged: ["Registries/SOURCE_REGISTRY.md"]
  };
}
async function Vo(e) {
  try {
    return await T.access(e), !0;
  } catch {
    return !1;
  }
}
async function Wo(e, t = {}) {
  const n = t.log ?? (() => {
  }), s = t.sessionId ?? `repair-${crypto.randomUUID()}`, r = e.repositoryPath, i = await le(r);
  n("info", "Pre-repair health check complete", {
    duplicateIds: i.duplicateIds,
    issueCount: i.issues.length
  });
  const o = await ps(r, s);
  n("info", `Pre-repair snapshot created: ${o}`, { snapshotPath: o });
  const c = e.actions.filter((y) => y.autoRepairSafe && !y.manualReviewRequired), a = e.actions.length - c.length, l = { value: await Ot(r) }, u = [], f = [];
  for (const y of c)
    try {
      let w;
      switch (y.type) {
        case "reassign-krc-id":
          w = await Ko(r, y, l, n);
          break;
        case "generate-executive-session":
          w = await Zo(r, y, n);
          break;
        case "add-registry-entry":
          w = await Ho(r, y, n);
          break;
        default:
          w = {
            actionId: y.id,
            type: y.type,
            success: !1,
            message: `Unsupported auto-repair action: ${y.type}`,
            filesChanged: []
          };
      }
      u.push(w), w.success && f.push(...w.filesChanged);
    } catch (w) {
      const x = w instanceof Error ? w.message : String(w);
      n("error", `Repair action failed: ${y.description} — ${x}`, {
        actionId: y.id,
        type: y.type
      }), u.push({
        actionId: y.id,
        type: y.type,
        success: !1,
        message: x,
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
    snapshotPath: o,
    actionsExecuted: u,
    actionsSkipped: a,
    filesChanged: [...new Set(f)],
    healthBefore: i,
    healthAfter: g
  };
}
function qo(e, t) {
  const n = `${e} ${t ?? ""}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)/.test(n) || n.includes("screenshot") ? "image" : /\.(mp4|webm|mov|m4v|avi)/.test(n) || n.includes("video") ? "video" : "other";
}
function An(e) {
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
function Yo(e) {
  var t, n, s;
  return e.kind === "executive_session" ? {
    krcId: ((t = e.session) == null ? void 0 : t.linkedKrcId) ?? e.repository.krcId,
    sourcePath: ((n = e.session) == null ? void 0 : n.transcriptReference) ?? ((s = e.session) == null ? void 0 : s.summaryReferences.find((r) => r.startsWith("Sources/"))) ?? e.repository.repositoryPath
  } : {
    krcId: e.repository.krcId,
    sourcePath: e.repository.repositoryPath
  };
}
function Jo(e, t) {
  return e.records.filter((n) => n.repository.krcId === t);
}
function Xo(e, t) {
  return e.records.find((n) => n.id === t);
}
function Qo(e, t) {
  return e.find((n) => n.kind === "source" && n.id === `${t}:source`);
}
function ea(e, t) {
  return e.find((n) => n.kind === "conversation" && n.id === `${t}:conversation`);
}
function ta(e, t) {
  if (t)
    return e.records.find((n) => {
      var s;
      return n.kind === "executive_session" && (((s = n.session) == null ? void 0 : s.linkedKrcId) === t || n.repository.krcId === t);
    });
}
function na(e, t) {
  if (!t || !e.message)
    return !1;
  const n = t.toLowerCase();
  return e.message.text.toLowerCase().includes(n) || ve(t).some((s) => e.message.text.toLowerCase().includes(s));
}
function sa(e, t) {
  if (!t || !e.attachment)
    return !1;
  const n = t.toLowerCase(), s = e.attachment.filename.toLowerCase();
  return s.includes(n) || ve(t).some((r) => s.includes(r));
}
function ra(e, t, n, s, r) {
  const i = [];
  return i.push(`Evidence anchor: ${e.kind.replace(/_/g, " ")}`), t && i.push(`KRC ${t}`), n && i.push(`"${n}"`), s && i.push(`matched query "${s}"`), r != null && r.excerpt ? i.push(`Session summary: ${r.excerpt}`) : e.excerpt && i.push(e.excerpt), i.join(" · ");
}
function ia(e, t, n, s, r = 5) {
  var c;
  const i = /* @__PURE__ */ new Set([
    ...Ne(n),
    ...s ? ve(s) : []
  ]);
  if (i.size === 0)
    return [];
  const o = [];
  for (const a of e.records) {
    if (a.kind !== "source" || a.repository.krcId === t)
      continue;
    const d = ((c = a.conversation) == null ? void 0 : c.title) ?? "";
    let u = Ne(d).filter((f) => i.has(f)).length;
    s && d.toLowerCase().includes(s.toLowerCase()) && (u += 3), u > 0 && o.push({ record: a, score: u });
  }
  return o.sort((a, d) => {
    var l, u;
    return d.score - a.score || (((l = d.record.conversation) == null ? void 0 : l.title) ?? "").localeCompare(((u = a.record.conversation) == null ? void 0 : u.title) ?? "");
  }).slice(0, r).map((a) => a.record);
}
function oa(e) {
  var n, s, r, i;
  let t = null;
  for (const o of e) {
    if (o.kind === "message" && o.message) {
      const c = o.message.timestamp ?? ((n = o.conversation) == null ? void 0 : n.updated) ?? "", a = An(c);
      (!t || a >= t.ms) && (t = { record: o, timestamp: c, ms: a });
    }
    if (o.kind === "attachment" && ((s = o.attachment) != null && s.resolved)) {
      const c = ((r = o.conversation) == null ? void 0 : r.updated) ?? ((i = o.conversation) == null ? void 0 : i.created) ?? "", a = An(c);
      (!t || a >= t.ms) && (t = { record: o, timestamp: c, ms: a });
    }
  }
  return t ? { record: t.record, timestamp: t.timestamp } : null;
}
function Ls(e, t, n) {
  var E, R, D, L, A, N, b, M, G, z, j, V, J, fe, pe, we, Ee, Ue, Se, Me;
  const s = Xo(e, t);
  if (!s)
    return null;
  const { krcId: r, sourcePath: i } = Yo(s), o = r ? Jo(e, r) : [s], c = (r ? Qo(o, r) : void 0) ?? e.records.find(($) => $.kind === "source" && $.repository.repositoryPath === i) ?? (s.kind === "source" ? s : void 0), a = r ? ea(o, r) : void 0, d = a ?? c, l = ta(e, r), u = ((E = a == null ? void 0 : a.conversation) == null ? void 0 : E.title) ?? ((R = d == null ? void 0 : d.conversation) == null ? void 0 : R.title) ?? ((D = s.conversation) == null ? void 0 : D.title) ?? ((L = c == null ? void 0 : c.conversation) == null ? void 0 : L.title) ?? "Untitled", f = o.filter(($) => $.kind === "message").sort(($, K) => {
    var Re, Ce;
    const Y = Number(((Re = $.message) == null ? void 0 : Re.messageId.split(":msg:")[1]) ?? 0), Qt = Number(((Ce = K.message) == null ? void 0 : Ce.messageId.split(":msg:")[1]) ?? 0);
    return Y - Qt;
  }), g = o.filter(($) => $.kind === "attachment"), y = ia(e, r, u, n), w = oa(o), x = ra(s, r, u, n, l), C = te("sourceFile", "Source File", [
    ne((c == null ? void 0 : c.repository.repositoryPath.split("/").pop()) ?? i, i, {
      recordId: c == null ? void 0 : c.id,
      kind: "source",
      subtitle: r,
      highlighted: s.kind === "source"
    })
  ]), k = te("conversation", "Conversation", d ? [
    ne(u, i, {
      recordId: (a == null ? void 0 : a.id) ?? (c == null ? void 0 : c.id),
      kind: (a == null ? void 0 : a.kind) ?? "conversation",
      subtitle: [
        (A = d.conversation) == null ? void 0 : A.conversationId,
        (N = d.conversation) != null && N.created ? `Created ${d.conversation.created}` : void 0,
        (b = d.conversation) != null && b.updated ? `Updated ${d.conversation.updated}` : void 0
      ].filter(Boolean).join(" · "),
      highlighted: s.kind === "conversation"
    })
  ] : [], "No conversation metadata indexed."), _ = te("messages", "Messages", f.map(($) => {
    var K, Y;
    return ne(`${((K = $.message) == null ? void 0 : K.role) ?? "Message"}: ${$.excerpt}`, i, {
      recordId: $.id,
      kind: "message",
      subtitle: (Y = $.message) == null ? void 0 : Y.timestamp,
      highlighted: $.id === s.id || na($, n)
    });
  }), "No messages indexed."), m = te("attachments", "Attachments", g.map(($) => {
    var Re, Ce, en;
    const K = ((Re = $.attachment) == null ? void 0 : Re.filename) ?? "Attachment", Y = qo(K, (Ce = $.attachment) == null ? void 0 : Ce.assetPath);
    return ne(`${Y === "image" ? "Screenshot" : Y === "video" ? "Video" : "File"}: ${K}`, i, {
      recordId: $.id,
      kind: "attachment",
      subtitle: (en = $.attachment) != null && en.resolved ? $.attachment.assetPath : "Unresolved reference",
      highlighted: $.id === s.id || sa($, n)
    });
  }), "No attachments indexed."), p = te("executiveSession", "Executive Session", l ? [
    ne(((M = l.conversation) == null ? void 0 : M.title) ?? ((G = l.session) == null ? void 0 : G.sessionId) ?? "Session", l.repository.repositoryPath, {
      recordId: l.id,
      kind: "executive_session",
      subtitle: (z = l.session) == null ? void 0 : z.linkedKrcId,
      highlighted: s.kind === "executive_session"
    })
  ] : [], "No executive session indexed for this KRC."), I = te("relatedSources", "Related Sources", y.map(($) => {
    var K;
    return ne(((K = $.conversation) == null ? void 0 : K.title) ?? $.repository.krcId ?? $.repository.repositoryPath, $.repository.repositoryPath, {
      recordId: $.id,
      kind: "source",
      subtitle: $.repository.krcId
    });
  }), "No related sources found."), h = [];
  if (h.push({
    kind: "conversation",
    label: u,
    subtitle: r,
    timestamp: ((j = a == null ? void 0 : a.conversation) == null ? void 0 : j.updated) ?? ((V = a == null ? void 0 : a.conversation) == null ? void 0 : V.created),
    explorerPath: i,
    recordId: a == null ? void 0 : a.id
  }), l && h.push({
    kind: "executive_session",
    label: ((J = l.conversation) == null ? void 0 : J.title) ?? "Executive Session",
    subtitle: (fe = l.session) == null ? void 0 : fe.linkedKrcId,
    timestamp: (pe = l.conversation) == null ? void 0 : pe.created,
    explorerPath: l.repository.repositoryPath,
    recordId: l.id
  }), h.push({
    kind: "related_sources",
    label: y.length > 0 ? `${y.length} related source${y.length === 1 ? "" : "s"}` : "No related sources",
    subtitle: y.slice(0, 3).map(($) => $.repository.krcId).filter(Boolean).join(", "),
    explorerPath: ((we = y[0]) == null ? void 0 : we.repository.repositoryPath) ?? i,
    recordId: (Ee = y[0]) == null ? void 0 : Ee.id
  }), w) {
    const $ = w.record.kind === "message" ? `${(Ue = w.record.message) == null ? void 0 : Ue.role}: ${w.record.excerpt}` : ((Se = w.record.attachment) == null ? void 0 : Se.filename) ?? w.record.excerpt;
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
      label: s.excerpt || u,
      timestamp: (Me = a == null ? void 0 : a.conversation) == null ? void 0 : Me.updated,
      explorerPath: i,
      recordId: s.id
    });
  const v = te("timeline", "Timeline", h.map(($) => ne($.label, $.explorerPath, {
    recordId: $.recordId,
    subtitle: [$.subtitle, $.timestamp].filter(Boolean).join(" · ")
  })));
  return {
    anchorRecordId: t,
    anchorKrcId: r,
    anchorSourcePath: i,
    query: n,
    decisionSummary: x,
    sections: {
      decisionSummary: te("decisionSummary", "Decision Summary", [
        ne(x, i, { highlighted: !0 })
      ]),
      sourceFile: C,
      conversation: k,
      messages: _,
      attachments: m,
      executiveSession: p,
      relatedSources: I,
      timeline: v
    },
    timeline: h
  };
}
async function aa(e, t, n) {
  const s = await Ie(e);
  return Ls(s, t, n);
}
function Ae(e) {
  return e.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
function ca(e, t, n) {
  return `${Ae(e)}::${t}::${Ae(n)}`;
}
function X(e, t, n) {
  const s = ca(n.fromId, n.relationshipType, n.toId);
  t.has(s) || (t.add(s), e.push({ ...n, relationshipId: s, createdAutomatically: !0 }));
}
function da(e) {
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
function Nn(e) {
  return e.find((t) => t.kind === "conversation") ?? e.find((t) => t.kind === "source");
}
function ua(e) {
  var n, s;
  const t = [(n = e.conversation) == null ? void 0 : n.title, e.excerpt, (s = e.message) == null ? void 0 : s.text].filter(Boolean).join(" ");
  return new Set(Ne(t));
}
function la(e, t) {
  return [...e].filter((n) => t.has(n));
}
function fa(e) {
  const t = e.match(/Campaign\s+[\d.]+[a-z]?/gi) ?? [];
  return [...new Set(t.map((n) => n.trim()))];
}
function Ke(e, t, n, s) {
  const r = new Map(e.map((d) => [d.id, d])), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const d of e) {
    const l = ua(d);
    o.set(d.id, l);
    for (const u of l) {
      if (u.length < 4)
        continue;
      const f = i.get(u) ?? [];
      f.push(d.id), i.set(u, f);
    }
  }
  const c = /* @__PURE__ */ new Map(), a = s.maxBucketSize ?? 20;
  for (const d of i.values())
    if (!(d.length < 2 || d.length > a))
      for (let l = 0; l < d.length; l++)
        for (let u = l + 1; u < d.length; u++) {
          const f = d[l] < d[u] ? `${d[l]}|${d[u]}` : `${d[u]}|${d[l]}`;
          c.set(f, (c.get(f) ?? 0) + 1);
        }
  for (const [d, l] of c) {
    if (l < s.minShared)
      continue;
    const [u, f] = d.split("|"), g = r.get(u), y = r.get(f);
    if (!g || !y || s.skipSameKrc && g.repository.krcId === y.repository.krcId)
      continue;
    const w = la(o.get(u) ?? /* @__PURE__ */ new Set(), o.get(f) ?? /* @__PURE__ */ new Set());
    X(t, n, {
      fromId: g.id,
      toId: y.id,
      relationshipType: s.relationshipType,
      reason: `${s.reasonPrefix}: ${w.slice(0, 4).join(", ")}`,
      confidence: Math.min(s.maxConfidence, 35 + l * 10),
      supportingEvidenceIds: [g.id, y.id]
    });
  }
}
function pa(e) {
  var t;
  return (t = e.session) != null && t.summaryReferences ? e.session.summaryReferences.filter((n) => n.length > 2 && !n.startsWith("Sources/")).slice(0, 8) : [];
}
function ma(e) {
  var f, g, y, w, x, C, k, _, m;
  const t = [], n = /* @__PURE__ */ new Set(), s = da(e), r = /* @__PURE__ */ new Map();
  for (const p of e.records)
    p.kind === "executive_session" && ((f = p.session) != null && f.linkedKrcId) && r.set(p.session.linkedKrcId, p);
  for (const [p, I] of s.entries()) {
    const h = Nn(I), v = I.find((D) => D.kind === "source"), E = I.filter((D) => D.kind === "attachment");
    h && v && X(t, n, {
      fromId: h.id,
      toId: v.id,
      relationshipType: "conversation_source",
      reason: `Shared KRC ${p}`,
      confidence: 98,
      supportingEvidenceIds: [h.id, v.id]
    });
    const R = r.get(p);
    h && R && (X(t, n, {
      fromId: h.id,
      toId: R.id,
      relationshipType: "conversation_executive_session",
      reason: `Executive session linked to ${p}`,
      confidence: 95,
      supportingEvidenceIds: [h.id, R.id]
    }), v && X(t, n, {
      fromId: R.id,
      toId: v.id,
      relationshipType: "executive_session_source",
      reason: `Transcript reference for ${p}`,
      confidence: 96,
      supportingEvidenceIds: [R.id, v.id]
    }));
    for (const D of E)
      h && (X(t, n, {
        fromId: D.id,
        toId: h.id,
        relationshipType: "attachment_conversation",
        reason: `Attachment linked to conversation ${p}`,
        confidence: (g = D.attachment) != null && g.resolved ? 90 : 70,
        supportingEvidenceIds: [D.id, h.id]
      }), X(t, n, {
        fromId: h.id,
        toId: D.id,
        relationshipType: "conversation_attachment",
        reason: `Conversation references attachment in ${p}`,
        confidence: (y = D.attachment) != null && y.resolved ? 88 : 68,
        supportingEvidenceIds: [h.id, D.id]
      })), v && X(t, n, {
        fromId: D.id,
        toId: v.id,
        relationshipType: "attachment_source",
        reason: `Attachment referenced by source ${p}`,
        confidence: (w = D.attachment) != null && w.resolved ? 92 : 72,
        supportingEvidenceIds: [D.id, v.id]
      });
  }
  const i = [];
  for (const [, p] of s.entries()) {
    const I = Nn(p);
    I && i.push(I);
  }
  Ke(i, t, n, {
    relationshipType: "conversation_conversation",
    reasonPrefix: "Shared title concepts",
    minShared: 2,
    maxConfidence: 85,
    skipSameKrc: !1
  });
  const o = e.records.filter((p) => p.kind === "executive_session");
  Ke(o, t, n, {
    relationshipType: "executive_session_executive_session",
    reasonPrefix: "Shared session topics",
    minShared: 2,
    maxConfidence: 80,
    skipSameKrc: !1
  });
  const c = e.records.filter((p) => {
    var h;
    if (p.kind === "executive_session")
      return !0;
    const I = `${p.excerpt} ${((h = p.message) == null ? void 0 : h.text) ?? ""}`.toLowerCase();
    return /\b(decision|decided|agreed|conclusion)\b/.test(I);
  });
  Ke(c, t, n, {
    relationshipType: "decision_decision",
    reasonPrefix: "Shared decision language",
    minShared: 2,
    maxConfidence: 78,
    skipSameKrc: !0,
    maxBucketSize: 25
  }), Ke(i, t, n, {
    relationshipType: "topic_topic",
    reasonPrefix: "Shared topic",
    minShared: 1,
    maxConfidence: 65,
    skipSameKrc: !1,
    maxBucketSize: 12
  });
  const a = /* @__PURE__ */ new Map();
  for (const p of e.records) {
    const I = [p.excerpt, (x = p.message) == null ? void 0 : x.text, (C = p.conversation) == null ? void 0 : C.title].filter(Boolean).join(" ");
    for (const h of fa(I)) {
      const v = Ae(h), E = a.get(v) ?? [];
      E.push(p), a.set(v, E);
    }
  }
  for (const [p, I] of a.entries()) {
    const h = [...new Map(I.map((v) => [v.id, v])).values()];
    if (!(h.length < 2 || h.length > 30))
      for (let v = 0; v < h.length; v++)
        for (let E = v + 1; E < h.length; E++)
          X(t, n, {
            fromId: h[v].id,
            toId: h[E].id,
            relationshipType: "campaign_campaign",
            reason: `Shared campaign reference (${p.replace(/-/g, " ")})`,
            confidence: 82,
            supportingEvidenceIds: [h[v].id, h[E].id]
          });
  }
  const d = /* @__PURE__ */ new Map();
  for (const p of o)
    for (const I of pa(p)) {
      const h = Ae(I), v = d.get(h) ?? [];
      v.push(p), d.set(h, v);
    }
  for (const [, p] of d.entries())
    if (!(p.length < 2))
      for (let I = 0; I < p.length; I++)
        for (let h = I + 1; h < p.length; h++)
          X(t, n, {
            fromId: p[I].id,
            toId: p[h].id,
            relationshipType: "capability_capability",
            reason: `Shared capability "${((k = p[I].conversation) == null ? void 0 : k.title) ?? "capability"}"`,
            confidence: 72,
            supportingEvidenceIds: [p[I].id, p[h].id]
          });
  const l = e.records.filter((p) => p.kind === "attachment"), u = /* @__PURE__ */ new Map();
  for (const p of l) {
    const I = Ae(((_ = p.attachment) == null ? void 0 : _.filename) ?? p.excerpt), h = u.get(I) ?? [];
    h.push(p), u.set(I, h);
  }
  for (const [, p] of u.entries())
    if (!(p.length < 2))
      for (let I = 0; I < p.length; I++)
        for (let h = I + 1; h < p.length; h++)
          p[I].repository.krcId !== p[h].repository.krcId && X(t, n, {
            fromId: p[I].id,
            toId: p[h].id,
            relationshipType: "attachment_conversation",
            reason: `Shared attachment filename "${((m = p[I].attachment) == null ? void 0 : m.filename) ?? "file"}"`,
            confidence: 74,
            supportingEvidenceIds: [p[I].id, p[h].id]
          });
  return t;
}
const ha = "relationship-index.json", ga = 1;
function nt(e) {
  return S.join(e, ye, ha);
}
async function Fs(e) {
  try {
    const t = await T.readFile(nt(e), "utf8"), n = JSON.parse(t);
    return n.version !== ga || !Array.isArray(n.relationships) ? null : n;
  } catch {
    return null;
  }
}
async function ya(e, t) {
  const n = S.join(e, ye);
  await T.mkdir(n, { recursive: !0 });
  const s = nt(e);
  return await T.writeFile(s, JSON.stringify(t, null, 2), "utf8"), s;
}
function va(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function Ia(e, t) {
  return {
    recordId: e.id,
    label: va(e),
    excerpt: e.excerpt,
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind,
    relationshipType: t.relationshipType,
    reason: t.reason,
    confidence: t.confidence
  };
}
function wa(e, t) {
  return e.records.find((n) => n.id === t) ?? e.records.find((n) => n.repository.krcId === t) ?? e.records.find((n) => n.id.startsWith(`${t}:`));
}
async function Ye(e) {
  const t = await Ie(e), n = ma(t), s = (/* @__PURE__ */ new Date()).toISOString(), r = {
    version: 1,
    repositoryPath: e,
    builtAt: s,
    relationshipCount: n.length,
    relationships: n
  };
  return await ya(e, r), r;
}
async function be(e) {
  const t = await Fs(e);
  return t && t.repositoryPath === e ? t : Ye(e);
}
function Ea(e) {
  const t = {};
  for (const n of e.relationships)
    t[n.relationshipType] = (t[n.relationshipType] ?? 0) + 1;
  return {
    builtAt: e.builtAt,
    relationshipCount: e.relationshipCount,
    byType: t
  };
}
function xt(e, t, n = 50) {
  const s = ve(t), r = t.toLowerCase(), i = [];
  for (const o of e.relationships) {
    const c = `${o.fromId} ${o.toId} ${o.relationshipType} ${o.reason}`.toLowerCase();
    let a = 0;
    c.includes(r) && (a += 20), a += s.filter((d) => c.includes(d)).length * 8, a > 0 && i.push({ rel: o, score: a });
  }
  return i.sort((o, c) => c.score - o.score || c.rel.confidence - o.rel.confidence).slice(0, n).map((o) => o.rel);
}
function Os(e, t) {
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
async function Ps(e, t, n, s = 20) {
  const [r, i] = await Promise.all([
    Ie(e),
    be(e)
  ]);
  let o = Os(i, t);
  o.length === 0 && n && (o = xt(i, n, s * 3)), o.length === 0 && (o = xt(i, t, s * 3));
  const c = [], a = /* @__PURE__ */ new Set();
  for (const d of o.sort((l, u) => u.confidence - l.confidence)) {
    const l = d.fromId === t || d.supportingEvidenceIds[0] === t ? d.toId : d.fromId, u = wa(r, l);
    if (!(!u || a.has(u.id)) && (a.add(u.id), c.push(Ia(u, d)), c.length >= s))
      break;
  }
  return c;
}
function Sa(e) {
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
const Ra = [
  /\bwhat did we decide\b/i,
  /\bwhat was decided\b/i,
  /\bour decision\b/i,
  /\bdecide about\b/i
], Ca = [/\bsummarize\b/i, /\bsummary of\b/i, /\bgive me an overview\b/i], ka = [
  /\bshow evidence\b/i,
  /\bprove that\b/i,
  /\bevidence that\b/i,
  /\bdemonstrate\b/i
], xa = [
  /\bblockers?\b/i,
  /\bunresolved\b/i,
  /\bremaining\b/i,
  /\bissues?\b/i,
  /\brisks?\b/i,
  /\btodo\b/i,
  /\bopen problems?\b/i
], Ta = [
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
function Us(e) {
  const t = e.trim();
  return Ra.some((n) => n.test(t)) ? "decision" : Ca.some((n) => n.test(t)) ? "summarize" : ka.some((n) => n.test(t)) ? "show_evidence" : xa.some((n) => n.test(t)) ? "blockers" : "general";
}
function Da(e) {
  let t = e.trim();
  for (const n of Ta)
    t = t.replace(n, "");
  return t = t.replace(/\b(in kae|for kae)\b/gi, "").trim(), t || e.trim();
}
const _a = ["decided", "decision", "agreed", "conclusion", "resolved", "plan"], Aa = [
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
function Zt(e) {
  const t = e.toLowerCase();
  return Aa.some((n) => t.includes(n));
}
function st(e) {
  const t = e.toLowerCase();
  return _a.some((n) => t.includes(n));
}
function Na(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function Je(e) {
  var t, n, s;
  return Na(((t = e.message) == null ? void 0 : t.timestamp) ?? ((n = e.conversation) == null ? void 0 : n.updated) ?? ((s = e.conversation) == null ? void 0 : s.created));
}
function Ht(e) {
  var t, n, s, r;
  return [
    e.excerpt,
    (t = e.message) == null ? void 0 : t.text,
    (n = e.conversation) == null ? void 0 : n.title,
    (r = (s = e.session) == null ? void 0 : s.summaryReferences) == null ? void 0 : r.join(" ")
  ].filter(Boolean).join(" ");
}
function Ms(e) {
  var t;
  return e.kind === "attachment" && e.attachment ? e.attachment.filename : ((t = e.conversation) == null ? void 0 : t.title) ?? e.repository.krcId ?? e.id;
}
function Vt(e) {
  return {
    recordId: e.id,
    label: Ms(e),
    explorerPath: e.repository.repositoryPath,
    krcId: e.repository.krcId,
    kind: e.kind
  };
}
function js(e) {
  return {
    label: e.message,
    explorerPath: e.relativePath ?? "Registries/SOURCE_REGISTRY.md"
  };
}
function $a(e) {
  return e.kind === "executive_session" ? 92 : st(Ht(e)) ? 78 : 65;
}
function $n(e, t) {
  return e.find((n) => n.id === t) ?? e.find((n) => n.repository.krcId === t) ?? e.find((n) => t.startsWith(n.repository.krcId ?? ""));
}
function ba(e) {
  const t = e.filter((r) => {
    const i = Ht(r);
    return r.kind === "executive_session" || st(i);
  }).sort((r, i) => Je(i) - Je(r)).slice(0, 4), n = t[0], s = n ? $a(n) : 50;
  return {
    cardId: "recent-decisions",
    category: "recent_decision",
    title: "Recent Decisions",
    summary: n ? `${Ms(n)} — ${n.excerpt.slice(0, 140)}${n.excerpt.length > 140 ? "…" : ""}` : "No indexed decision evidence found yet.",
    whyItMatters: "Recent decisions anchor what the team agreed to and what Vigsy can ground answers on.",
    confidence: s,
    evidenceLinks: t.map(Vt)
  };
}
function La(e, t) {
  const n = t.issues.filter((a) => a.severity === "error" || a.severity === "warning"), s = e.filter((a) => Zt(Ht(a))).sort((a, d) => Je(d) - Je(a)).slice(0, 4), r = [
    ...n.slice(0, 2).map(js),
    ...s.map(Vt)
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
function Fa(e) {
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
function Oa(e) {
  const t = e.reason.match(/"([^"]+)"/);
  return (t == null ? void 0 : t[1]) ?? e.reason.replace(/^Shared (topic|campaign reference) /i, "").trim();
}
function Pa(e, t) {
  const n = /* @__PURE__ */ new Map();
  for (const d of t) {
    if (d.relationshipType !== "campaign_campaign" && d.relationshipType !== "topic_topic" && d.relationshipType !== "conversation_conversation")
      continue;
    const l = Oa(d), u = n.get(l);
    u ? u.count += 1 : n.set(l, { count: 1, rel: d });
  }
  const r = [...n.entries()].sort((d, l) => l[1].count - d[1].count)[0];
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
  const [i, { count: o, rel: c }] = r, a = $n(e, c.toId) ?? $n(e, c.fromId) ?? e[0];
  return {
    cardId: "high-relationship-topic",
    category: "high_relationship_topic",
    title: "High-Relationship Topic",
    summary: `"${i}" appears in ${o} indexed relationships.`,
    whyItMatters: "Topics with many relationships are strong anchors for executive awareness and follow-up questions.",
    confidence: Math.min(95, 60 + o * 3),
    evidenceLinks: a ? [Vt(a)] : [
      {
        label: c.reason,
        explorerPath: c.supportingEvidenceIds[0] ?? "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
function Ua(e) {
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
function Ma(e) {
  const t = e.statusLevel === "healthy" ? 93 : e.statusLevel === "attention" ? 78 : 62;
  return {
    cardId: "repository-health",
    category: "repository_health",
    title: "Repository Health",
    summary: e.statusHeadline,
    whyItMatters: e.statusSubline,
    confidence: t,
    evidenceLinks: e.issues.length > 0 ? e.issues.slice(0, 4).map(js) : [
      {
        label: "Repository structure verified",
        explorerPath: "Registries/SOURCE_REGISTRY.md"
      }
    ]
  };
}
async function Bs(e) {
  const [t, n, s, , r] = await Promise.all([
    Ie(e),
    be(e),
    le(e),
    xs(e),
    ms(e)
  ]), i = [
    ba(t.records),
    La(t.records, s),
    Fa(r),
    Pa(t.records, n.relationships),
    Ua(s),
    Ma(s)
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
const ja = "executive-briefing-cache.json", Gs = 1;
function zs(e) {
  return S.join(e, ye, ja);
}
async function Ba(e) {
  const t = et(e), n = nt(e), [s, r] = await Promise.all([
    Is(e),
    Fs(e)
  ]);
  let i = 0, o = 0;
  try {
    i = (await T.stat(t)).mtimeMs;
  } catch {
  }
  try {
    o = (await T.stat(n)).mtimeMs;
  } catch {
  }
  return {
    evidenceIndexBuiltAt: (s == null ? void 0 : s.builtAt) ?? "",
    evidenceIndexMtimeMs: i,
    relationshipIndexBuiltAt: (r == null ? void 0 : r.builtAt) ?? "",
    relationshipIndexMtimeMs: o
  };
}
async function Ga(e) {
  try {
    const t = await T.readFile(zs(e), "utf8"), n = JSON.parse(t);
    return n.version !== Gs || !n.briefing || !Array.isArray(n.briefing.cards) ? null : n;
  } catch {
    return null;
  }
}
async function Ks(e, t, n) {
  const s = await Ba(e), r = {
    version: Gs,
    repositoryPath: e,
    cachedAt: (/* @__PURE__ */ new Date()).toISOString(),
    evidenceIndexBuiltAt: s.evidenceIndexBuiltAt,
    evidenceIndexMtimeMs: s.evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: s.relationshipIndexBuiltAt,
    relationshipIndexMtimeMs: s.relationshipIndexMtimeMs,
    briefing: t
  }, i = S.join(e, ye);
  await T.mkdir(i, { recursive: !0 });
  const o = zs(e);
  return await T.writeFile(o, JSON.stringify(r, null, 2), "utf8"), o;
}
async function za(e, t) {
  try {
    if ((await T.stat(et(e))).mtimeMs > t.evidenceIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  try {
    if ((await T.stat(nt(e))).mtimeMs > t.relationshipIndexMtimeMs)
      return !0;
  } catch {
    return !0;
  }
  return !1;
}
async function Zs(e) {
  const t = await Ga(e);
  if (!t || t.repositoryPath !== e) {
    const s = await Bs(e);
    return await Ks(e, s), { briefing: s, fromCache: !1, stale: !1 };
  }
  const n = await za(e, t);
  return { briefing: t.briefing, fromCache: !0, stale: n };
}
async function Wt(e) {
  const t = await Bs(e);
  return await Ks(e, t), t;
}
const Ka = "executive-memory", Hs = "Albert";
function rt(e) {
  return S.join(e, ".kae-sessions", Ka);
}
function Vs(e) {
  return S.join(rt(e), "manifest.json");
}
function Tt(e, t) {
  return S.join(rt(e), "sessions", `${t}.json`);
}
function Ws(e, t) {
  return S.join(rt(e), "archive", `${t}.json`);
}
async function qs(e) {
  const t = rt(e);
  await T.mkdir(S.join(t, "sessions"), { recursive: !0 }), await T.mkdir(S.join(t, "archive"), { recursive: !0 });
}
async function Pe(e) {
  try {
    const t = await T.readFile(Vs(e), "utf8"), n = JSON.parse(t);
    if (n.version === 1 && n.repositoryPath)
      return n;
  } catch {
  }
  return {
    version: 1,
    repositoryPath: e,
    founderName: Hs,
    sessions: []
  };
}
async function Ys(e, t) {
  await qs(e), await T.writeFile(Vs(e), JSON.stringify(t, null, 2), "utf8");
}
async function it(e, t) {
  const s = (await Pe(e)).sessions.find((r) => r.conversationId === t);
  return s ? qt(e, s.sessionId) : null;
}
async function qt(e, t) {
  for (const n of [
    () => T.readFile(Tt(e, t), "utf8"),
    () => T.readFile(Ws(e, t), "utf8")
  ])
    try {
      const s = await n(), r = JSON.parse(s);
      if (r.sessionId && r.conversationId)
        return r;
    } catch {
    }
  return null;
}
async function Js(e) {
  const t = await Pe(e);
  return t.activeSessionId ? qt(e, t.activeSessionId) : null;
}
async function Le(e, t, n) {
  await qs(e);
  const s = n != null && n.archive ? Ws(e, t.sessionId) : Tt(e, t.sessionId);
  if (await T.writeFile(s, JSON.stringify(t, null, 2), "utf8"), n != null && n.archive)
    try {
      await T.unlink(Tt(e, t.sessionId));
    } catch {
    }
}
function Xs(e, t = "Vigsy conversation") {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    sessionId: q(),
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
async function Xe(e, t, n = !0) {
  const s = await Pe(e);
  s.repositoryPath = e, s.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString(), n && (s.activeSessionId = t.sessionId);
  const r = s.sessions.findIndex((o) => o.sessionId === t.sessionId), i = {
    sessionId: t.sessionId,
    conversationId: t.conversationId,
    lifecycle: t.lifecycle,
    updatedAt: t.updatedAt
  };
  return r >= 0 ? s.sessions[r] = i : s.sessions.push(i), await Ys(e, s), s;
}
async function Za(e, t) {
  await be(e);
  const n = [
    ...t.evidenceUsed.map((l) => l.recordId),
    ...t.explorerLinks.map((l) => l.krcId).filter(Boolean)
  ], s = [...new Set(n)].slice(0, 5), r = [];
  for (const l of s) {
    const u = await Ps(e, l, t.searchQuery, 12);
    r.push(...u);
  }
  const i = /* @__PURE__ */ new Map();
  for (const l of r) {
    const u = i.get(l.recordId);
    (!u || l.confidence > u.confidence) && i.set(l.recordId, l);
  }
  const o = Sa([...i.values()]), c = {
    relatedDecisions: o.relatedDecisions.slice(0, 6),
    relatedConversations: o.relatedConversations.slice(0, 6),
    relatedCampaigns: o.relatedCampaigns.slice(0, 6),
    relatedAttachments: o.relatedAttachments.slice(0, 6),
    relatedExecutiveSessions: o.relatedExecutiveSessions.slice(0, 6)
  }, a = [...t.relatedSources], d = new Set(a.map((l) => l.recordId));
  for (const l of o.relatedConversations.slice(0, 4))
    d.has(l.recordId) || (d.add(l.recordId), a.push({
      recordId: l.recordId,
      label: l.label,
      excerpt: l.excerpt,
      explorerPath: l.explorerPath,
      krcId: l.krcId,
      kind: l.kind
    }));
  return {
    ...t,
    relatedSources: a,
    relationshipInsights: c
  };
}
function Ha(e) {
  if (!e)
    return 0;
  const t = Date.parse(e);
  return Number.isNaN(t) ? 0 : t;
}
function bn(e) {
  var r, i, o;
  const t = ((r = e.message) == null ? void 0 : r.timestamp) ?? ((i = e.conversation) == null ? void 0 : i.updated) ?? ((o = e.conversation) == null ? void 0 : o.created) ?? "", n = Ha(t);
  if (!n)
    return 0;
  const s = (Date.now() - n) / (1e3 * 60 * 60 * 24);
  return s < 30 ? 15 : s < 180 ? 8 : 0;
}
function Va(e, t, n) {
  var o, c, a, d, l, u;
  const s = [];
  let r = 0;
  const i = [
    e.excerpt,
    (o = e.message) == null ? void 0 : o.text,
    (c = e.conversation) == null ? void 0 : c.title,
    (d = (a = e.session) == null ? void 0 : a.summaryReferences) == null ? void 0 : d.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();
  if (t === "decision" && (e.kind === "executive_session" && (r += 45, s.push("executive session")), e.kind === "message" && ((l = e.message) != null && l.role.toLowerCase().includes("assistant")) && (r += 20, s.push("assistant response")), st(i) && (r += 25, s.push("decision language")), r += bn(e), bn(e) > 0 && s.push("recent evidence")), t === "summarize" && ((e.kind === "conversation" || e.kind === "source") && (r += 30, s.push("conversation source")), e.kind === "executive_session" && (r += 25, s.push("session summary"))), t === "show_evidence") {
    if (e.kind === "attachment") {
      r += 50, s.push("attachment evidence");
      const f = ((u = e.attachment) == null ? void 0 : u.filename.toLowerCase()) ?? "";
      (f.includes("video") || /\.(mp4|webm|mov)/.test(f)) && (r += 30, s.push("video attachment")), (f.includes("screenshot") || /\.(png|jpe?g)/.test(f)) && (r += 20, s.push("image attachment"));
    }
    e.kind === "source" && (r += 25, s.push("source file")), e.kind === "message" && (r += 15, s.push("message evidence"));
  }
  return t === "blockers" && (Zt(i) && (r += 50, s.push("blocker language")), (e.kind === "executive_session" || e.kind === "message") && (r += 15, s.push("narrative evidence"))), n.length > 1 && n.every((f) => i.includes(f)) && (r += 20, s.push("all query terms matched")), { boost: r, reasons: s };
}
function Wa(e, t, n) {
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
function qa(e, t, n = 30) {
  var u;
  const s = Us(t), r = Da(t), i = ve(r), o = Ss(e, r, 80), c = new Map(e.records.map((f) => [f.id, f])), a = [];
  for (const f of o) {
    const g = c.get(f.recordId);
    if (!g)
      continue;
    const { boost: y, reasons: w } = Va(g, s, i);
    a.push({
      ...Wa(f, g, w),
      score: f.score + y
    });
  }
  a.sort((f, g) => g.score - f.score);
  const d = [], l = /* @__PURE__ */ new Set();
  for (const f of a)
    if (!l.has(f.recordId) && (l.add(f.recordId), d.push(f), d.length >= n))
      break;
  if (s === "show_evidence") {
    const f = /video|mp4|webm|mov/i.test(r), g = d.some((y) => y.kind === "attachment");
    if (f && !g)
      for (const y of e.records) {
        if (y.kind !== "attachment" || !y.attachment)
          continue;
        const w = y.attachment.filename.toLowerCase();
        if (!(!w.includes("video") && !/\.(mp4|webm|mov|m4v)/.test(w)) && !l.has(y.id) && (l.add(y.id), d.push({
          recordId: y.id,
          kind: "attachment",
          score: 60,
          title: y.attachment.filename,
          excerpt: y.excerpt,
          explorerPath: y.repository.repositoryPath,
          krcId: y.repository.krcId,
          conversationTitle: (u = y.conversation) == null ? void 0 : u.title,
          matchReasons: ["video attachment scan"]
        }), d.filter((x) => x.kind === "attachment").length >= 5))
          break;
      }
  }
  return { intent: s, searchQuery: r, queryTerms: i, items: d };
}
function Ya(e, t, n, s = 3) {
  const r = /* @__PURE__ */ new Set(), i = [];
  for (const o of t) {
    if (!o.krcId || r.has(o.krcId))
      continue;
    r.add(o.krcId);
    const c = t.find((d) => d.krcId === o.krcId);
    if (!c)
      continue;
    const a = Ls(e, c.recordId, n);
    if (a && i.push(a), i.length >= s)
      break;
  }
  return i;
}
function Ja(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    !s.krcId || n.has(s.krcId) || (n.add(s.krcId), t.push(s.krcId));
  return t;
}
function Xa(e) {
  const t = [], n = /* @__PURE__ */ new Set();
  for (const s of e)
    for (const r of s.timeline) {
      const i = `${r.kind}:${r.explorerPath}:${r.label}`;
      n.has(i) || (n.add(i), t.push(r));
    }
  return t.slice(0, 8);
}
function Qa(e) {
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
function ec(e, t) {
  const { intent: n, searchQuery: s, queryTerms: r, items: i } = qa(e, t), o = Ya(e, i, s).filter((u) => u !== null), c = i.filter((u) => u.kind === "executive_session");
  let a = i.filter((u) => u.kind === "attachment");
  const d = i.filter((u) => u.kind === "message");
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
  const l = Qa(o);
  return {
    question: t,
    intent: n,
    searchQuery: s,
    queryTerms: r,
    items: i,
    topKrcIds: Ja(i),
    executiveSessions: c,
    attachments: a,
    messages: d,
    relatedSources: l,
    timeline: Xa(o)
  };
}
function tc(e) {
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
function nc(e) {
  return e == null ? void 0 : e.conversationContext;
}
function sc(e) {
  return {
    recordId: e.recordId,
    label: e.title,
    excerpt: e.excerpt,
    explorerPath: e.explorerPath,
    krcId: e.krcId,
    kind: e.kind
  };
}
function St(e, t) {
  const n = [], s = /* @__PURE__ */ new Set();
  for (const r of e)
    if (!s.has(r.recordId) && (s.add(r.recordId), n.push(sc(r)), n.length >= t))
      break;
  return n;
}
function rc(e) {
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
function ic(e, t) {
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
function oc(e) {
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
function ac(e) {
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
class cc {
  compose(t) {
    const n = rc(t), s = St(t.items, 8), r = St(t.attachments, 6), i = St(t.relatedSources, 5);
    return {
      question: t.question,
      intent: t.intent,
      searchQuery: t.searchQuery,
      directAnswer: ic(t, n),
      reasonedSummary: oc(t),
      evidenceUsed: s,
      confidence: n,
      timeline: t.timeline,
      relatedSources: i,
      attachments: r,
      explorerLinks: ac(t)
    };
  }
}
const dc = new cc();
function uc(e, t = dc) {
  return t.compose(e);
}
async function lc(e, t, n) {
  const s = await Ie(e), r = ec(s, t), i = uc(r), o = nc(n), c = o != null && o.conversationId ? await it(e, o.conversationId) : await Js(e), a = await Zs(e), d = tc({
    repositoryPath: e,
    question: t,
    evidence: r,
    conversation: o,
    executiveMemory: c,
    executiveBriefing: a.briefing
  }), l = Wn(), u = (n == null ? void 0 : n.providerId) ?? "mock";
  l.setActive(u), l.setCredentials({
    apiKey: n == null ? void 0 : n.apiKey,
    model: n == null ? void 0 : n.model,
    baseUrl: n == null ? void 0 : n.baseUrl
  });
  const f = await l.reason({
    context: d,
    groundedAnswer: i
  }), g = Nr(i, f);
  return Za(e, g);
}
const fc = "conversations", pc = "active.json";
function Yt(e) {
  return S.join(e, ".kae-sessions", fc);
}
function Jt(e, t) {
  return S.join(Yt(e), `${t}.json`);
}
function Xt(e) {
  return S.join(Yt(e), pc);
}
async function mc(e) {
  const t = Yt(e);
  return await T.mkdir(t, { recursive: !0 }), t;
}
async function Qs(e) {
  try {
    const t = await T.readFile(Xt(e), "utf8"), n = JSON.parse(t);
    return n.conversationId ? n : null;
  } catch {
    return null;
  }
}
async function hc(e, t) {
  try {
    const n = await T.readFile(Jt(e, t), "utf8"), s = JSON.parse(n);
    return !s.conversationId || !Array.isArray(s.turns) ? null : s;
  } catch {
    return null;
  }
}
async function gc(e) {
  const t = await Qs(e);
  return t ? hc(e, t.conversationId) : null;
}
async function er(e, t) {
  await mc(e);
  const n = Jt(e, t.conversationId);
  await T.writeFile(n, JSON.stringify(t, null, 2), "utf8");
  const s = {
    conversationId: t.conversationId,
    updatedAt: t.updatedAt
  };
  return await T.writeFile(Xt(e), JSON.stringify(s, null, 2), "utf8"), n;
}
function yc(e) {
  const t = (/* @__PURE__ */ new Date()).toISOString();
  return {
    conversationId: q(),
    title: e ?? "Vigsy conversation",
    createdAt: t,
    updatedAt: t,
    turns: []
  };
}
async function vc(e) {
  const t = yc();
  return await er(e, t), t;
}
async function Ic(e, t) {
  try {
    await T.unlink(Jt(e, t));
  } catch {
  }
  const n = await Qs(e);
  if ((n == null ? void 0 : n.conversationId) === t)
    try {
      await T.unlink(Xt(e));
    } catch {
    }
}
const wc = /campaign\s+([\d.]+[a-z]?)\s*(?:[—–-]\s*([^\n.?]+)|(?=\s|$))/gi, Ln = /\b(completed?|finished|implemented|shipped|passed|pass\b|done with)\b/i, Ec = /\b(import(?:ed)?|repair(?:ed)?|index(?:ed)?|rebuilt|snapshot|rollback)\b/i;
function oe(e, t, n) {
  return {
    id: q(),
    label: e.trim(),
    detail: t == null ? void 0 : t.trim(),
    sourceTurnId: n,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function me(e, t) {
  const n = new Set(e.map((r) => r.label.toLowerCase())), s = [...e];
  for (const r of t) {
    const i = r.label.toLowerCase();
    n.has(i) || (n.add(i), s.push(r));
  }
  return s.slice(-24);
}
function Sc(e) {
  var i, o;
  const t = [...e.matchAll(wc)];
  if (t.length === 0)
    return;
  const n = t[t.length - 1], s = (i = n[1]) == null ? void 0 : i.trim(), r = (o = n[2]) == null ? void 0 : o.trim();
  if (s)
    return r ? `Campaign ${s} — ${r}` : `Campaign ${s}`;
}
function Rc(e) {
  var t, n;
  return [e.question, e.displayText, e.supportingText, (t = e.answer) == null ? void 0 : t.directAnswer, (n = e.answer) == null ? void 0 : n.reasonedSummary].filter(Boolean).join(`
`);
}
function Cc(e, t) {
  var i;
  const n = Rc(e), s = {}, r = Sc(n);
  if (r && (s.currentCampaign = r), e.role === "user" && e.question && !t.currentObjective && (s.currentObjective = e.question.trim()), e.role === "assistant" && e.answer) {
    const o = [e.answer.directAnswer, e.answer.reasonedSummary].join(" "), c = e.question ? Us(e.question) : "general";
    (c === "decision" || st(o)) && (s.currentDecisions = me(t.currentDecisions, [
      oe(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ])), (c === "blockers" || Zt(o)) && (s.currentBlockers = me(t.currentBlockers, [
      oe(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ])), (Ln.test(o) || Ln.test(e.displayText)) && (s.currentAccomplishments = me(t.currentAccomplishments, [
      oe(e.answer.directAnswer.slice(0, 160), e.question, e.turnId)
    ]));
    const a = e.answer.evidenceUsed.map((l) => oe(l.label, l.recordId, e.turnId));
    s.currentEvidence = me(t.currentEvidence, a);
    const d = [
      ...e.answer.explorerLinks.map((l) => oe(l.label, l.path, e.turnId)),
      ...e.answer.attachments.map((l) => oe(l.label, l.explorerPath, e.turnId))
    ];
    s.currentFiles = me(t.currentFiles, d), e.followUpContext && (s.followUpContext = e.followUpContext);
  }
  if (Ec.test(n)) {
    const o = ((i = e.question) == null ? void 0 : i.trim()) || n.slice(0, 120);
    s.currentRepositoryChanges = me(t.currentRepositoryChanges, [
      oe(o, void 0, e.turnId)
    ]);
  }
  return s;
}
function kc(e) {
  const t = [];
  for (const n of e.currentBlockers)
    t.push(n.label);
  if (e.currentBlockers.length === 0)
    for (const n of e.unfinishedWork)
      /unfinished|remaining|blocker|not yet|todo/i.test(n) && t.push(n);
  return [...new Set(t)].slice(0, 6);
}
function xc(e) {
  var t;
  return e.currentBlockers.length > 0 ? `continue working on ${e.currentBlockers[e.currentBlockers.length - 1].label}` : e.currentObjective ? `continue with ${e.currentObjective}` : (t = e.followUpContext) != null && t.lastSearchQuery ? `pick up where we left off on ${e.followUpContext.lastSearchQuery}` : "continue where we left off";
}
function Tc(e, t) {
  let n = {
    ...t,
    title: e.title || t.title,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  for (const r of e.turns) {
    const i = Cc(r, n);
    n = { ...n, ...i };
  }
  const s = [...e.turns].reverse().find((r) => r.role === "assistant");
  return s != null && s.followUpContext && (n.followUpContext = s.followUpContext), n.unfinishedWork = kc(n), n.recommendedNextAction = xc(n), n;
}
const Dc = "KAE";
function _c(e) {
  return `VIGSY-${e.slice(0, 8).toUpperCase()}`;
}
function he(e, t) {
  return t.length === 0 ? [`## ${e}`, "- None recorded yet.", ""] : [`## ${e}`, ...t.map((n) => `- ${n.label}${n.detail ? ` (${n.detail})` : ""}`), ""];
}
async function Ac(e, t, n) {
  const s = _c(n.conversationId), r = Qe(n.title || "Vigsy_Conversation"), i = `${s}_${r}_SESSION.md`, o = `ExecutiveSessions/${Dc}/${i}`, c = S.join(e, o), a = `.kae-sessions/conversations/${n.conversationId}.json`, d = n.turns.filter((f) => f.role === "user" && f.question).slice(-3).map((f) => `- **Q:** ${f.question}`), l = [...n.turns].reverse().find((f) => f.role === "assistant");
  l != null && l.displayText && d.push(`- **Latest:** ${l.displayText.slice(0, 280)}`);
  const u = [
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
    ...he("Current Decisions", t.currentDecisions),
    ...he("Current Blockers", t.currentBlockers),
    ...he("Current Accomplishments", t.currentAccomplishments),
    ...he("Current Files", t.currentFiles),
    ...he("Current Evidence", t.currentEvidence),
    ...he("Repository Changes", t.currentRepositoryChanges),
    "## Action / Follow-up",
    t.recommendedNextAction ?? "Continue the active Vigsy conversation thread.",
    "",
    "## Transcript Reference",
    a,
    "",
    "## Notes",
    `Auto-maintained by KAE Continuous Executive Memory on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`
  ];
  return await T.mkdir(S.dirname(c), { recursive: !0 }), await T.writeFile(c, u.join(`
`), "utf8"), o;
}
function Nc(e, t) {
  const n = new Date(e);
  if (Number.isNaN(n.getTime()))
    return 0;
  const s = new Date(t.getFullYear(), t.getMonth(), t.getDate()), r = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.max(0, Math.round((s.getTime() - r.getTime()) / 864e5));
}
function Fn(e) {
  return e === 0 ? "Earlier today" : e === 1 ? "Yesterday" : `${e} days ago`;
}
function $c(e, t = Hs) {
  if (!e || e.lifecycle === "archived")
    return {
      welcomeMessage: `Welcome back${t ? ` ${t}` : ""}. Ask me anything about your knowledge.`,
      session: null,
      hasUnfinishedWork: !1,
      daysSinceLastActivity: 0
    };
  const n = Nc(e.updatedAt, /* @__PURE__ */ new Date()), s = [`Welcome back${t ? ` ${t}` : ""}.`];
  e.currentCampaign ? s.push(`${Fn(n)} we were working on ${e.currentCampaign}.`) : n > 0 && s.push(`${Fn(n)} we left off on ${e.title}.`);
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
async function On(e, t) {
  const n = await it(e, t.conversationId);
  if (n)
    return (n.lifecycle === "paused" || n.lifecycle === "closed") && (n.lifecycle = "active", n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), await Le(e, n), await Xe(e, n)), n;
  const s = Xs(t.conversationId, t.title);
  return await Le(e, s), await Xe(e, s), s;
}
async function bc(e) {
  const t = await Js(e);
  !t || t.lifecycle !== "active" || (t.lifecycle = "paused", t.pausedAt = (/* @__PURE__ */ new Date()).toISOString(), t.updatedAt = t.pausedAt, await Le(e, t), await Xe(e, t, !1));
}
async function Lc(e, t) {
  const n = await it(e, t);
  if (!n)
    return;
  n.lifecycle = "archived", n.archivedAt = (/* @__PURE__ */ new Date()).toISOString(), n.updatedAt = n.archivedAt, await Le(e, n, { archive: !0 });
  const s = await Pe(e);
  s.sessions = s.sessions.map((r) => r.conversationId === t ? { ...r, lifecycle: "archived", updatedAt: n.updatedAt } : r), s.activeSessionId === n.sessionId && (s.activeSessionId = void 0), s.lastSyncedAt = n.updatedAt, await Ys(e, s);
}
async function Fc(e, t) {
  const n = await it(e, t.conversationId) ?? Xs(t.conversationId, t.title), s = Tc(t, {
    ...n,
    lifecycle: t.turns.length > 0 ? "active" : n.lifecycle
  });
  s.executiveSessionPath = await Ac(e, s, t), await Le(e, s), await Xe(e, s);
  const r = await zt(e), i = await Ye(e), o = await Wt(e);
  return {
    session: s,
    evidenceIndexBuiltAt: r.builtAt,
    relationshipIndexBuiltAt: i.builtAt,
    briefingGeneratedAt: o.generatedAt
  };
}
async function Oc(e) {
  const t = await Pe(e);
  let n = null;
  return t.activeSessionId && (n = await qt(e, t.activeSessionId)), $c(n, t.founderName);
}
const Pn = S.dirname(cr(import.meta.url));
Mn.registerSchemesAsPrivileged([
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
function Pc(e) {
  const t = "kae-asset://resolve/";
  if (!e.startsWith(t))
    throw new Error("Invalid asset URL.");
  return decodeURIComponent(e.slice(t.length));
}
let F = null, se = null, Q = null, De = null, tr = null, de = null, Rt = null, Ct = null;
const ue = mr(), H = new gr(), Ze = [];
function P() {
  return ue.repository.path;
}
function Dt() {
  return { ...Nt, ...ue.settings };
}
function Uc(e) {
  const t = Dt();
  return {
    providerId: (e == null ? void 0 : e.providerId) ?? t.aiProvider,
    apiKey: (e == null ? void 0 : e.apiKey) ?? t.aiApiKey,
    model: (e == null ? void 0 : e.model) ?? t.aiModel,
    baseUrl: (e == null ? void 0 : e.baseUrl) ?? t.aiBaseUrl,
    conversationContext: e == null ? void 0 : e.conversationContext
  };
}
function He(e) {
  const t = S.resolve(P(), e), n = S.resolve(P());
  if (!t.startsWith(n)) throw new Error("Invalid file path.");
  return t;
}
function B(e, t, n, s) {
  const r = {
    id: crypto.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: e,
    source: t,
    message: n,
    context: s
  };
  return Ze.unshift(r), Ze.length > 500 && Ze.pop(), F == null || F.webContents.send("kae:log-added", r), r;
}
async function _t() {
  try {
    await Wt(P()), F == null || F.webContents.send("kae:executive-briefing-updated");
  } catch (e) {
    const t = e instanceof Error ? e.message : String(e);
    B("warn", "awareness", `Executive briefing refresh failed: ${t}`);
  }
}
async function Ve(e) {
  const t = S.join(P(), ".kae-sessions", "import-trace.log"), n = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${e}
`;
  try {
    await T.mkdir(S.dirname(t), { recursive: !0 }), await T.appendFile(t, n, "utf8");
  } catch {
  }
}
function Mc() {
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
function nr(e) {
  F == null || F.webContents.send("kae:import-timeline", e);
}
function Z(e, t, n, s) {
  const r = e.find((i) => i.id === t);
  r && (r.status = n, r.detail = s), nr([...e]);
}
function jc() {
  En.forEach((e) => qe.register(e)), Ci.register(ds), B("info", "system", `Registered ${En.length} connector plugin(s)`);
}
function Un() {
  F = new jn({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: `${Kn} — ${Zn}`,
    webPreferences: {
      preload: S.join(Pn, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    }
  }), process.env.VITE_DEV_SERVER_URL ? (F.loadURL(process.env.VITE_DEV_SERVER_URL), F.webContents.openDevTools({ mode: "detach" })) : F.loadFile(S.join(Pn, "../dist/index.html")), F.on("closed", () => {
    F = null;
  });
}
function sr(e) {
  F == null || F.webContents.send("kae:validation-progress", e);
}
async function Bc(e) {
  const t = S.basename(e), n = S.extname(t), s = { path: e, name: t, extension: n };
  de && de.abort(), de = new AbortController();
  const { signal: r } = de;
  B("info", "import", `Validating: ${t} (read-only — no repository writes)`, {
    filePath: e,
    fileName: t
  });
  try {
    const i = await ls(s, P(), {
      signal: r,
      log: (o, c, a) => B(o, "import", c, a),
      onProgress: sr,
      onImportPackageReady: (o) => {
        Q = o, De = e, Ve(
          `Validation cached import package: ${o.documents.length} document(s) from ${t}`
        );
      }
    });
    return se = i, i.valid ? B(
      "info",
      "import",
      `Validation complete in ${i.durationMs ?? 0}ms: ${i.conversationsFound} conversation(s) — awaiting user confirmation`,
      {
        conversationsFound: i.conversationsFound,
        estimatedSourcesToCreate: i.estimatedSourcesToCreate,
        estimatedSourcesToUpdate: i.estimatedSourcesToUpdate,
        warnings: i.warnings.length
      }
    ) : r.aborted || B(
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
async function Gc(e, t) {
  var h, v, E;
  const n = Date.now(), s = S.basename(e), r = S.extname(s), i = crypto.randomUUID(), o = { path: e, name: s, extension: r }, c = Mc();
  nr(c), await Ve(`Confirm import started: ${s} (${e})`), Z(c, "validate-zip", "running"), B("info", "import", `Pre-import validation gate: ${s}`);
  let a;
  try {
    se != null && se.valid && se.filePath === e && Q && De === e ? (a = se, await Ve(
      `Reusing validated import package: ${Q.documents.length} document(s) — no ZIP re-parse`
    ), B(
      "info",
      "import",
      `Reusing cached validation and import package (${Q.documents.length} documents)`
    )) : (a = await ls(o, P(), {
      log: (R, D, L) => B(R, "import", D, L),
      onImportPackageReady: (R) => {
        Q = R, De = e;
      }
    }), se = a);
  } catch (R) {
    const D = R instanceof Error ? R.message : String(R);
    throw Z(c, "validate-zip", "failed", D), B("error", "import", `Validation error — repository unchanged. ${D}`), new Error(
      `Import blocked — repository unchanged. What happened: validation threw an error. Why: ${D}. Recovery: fix the export and validate again.`
    );
  }
  if (!a.valid) {
    const R = a.blockingErrors.join("; ") || "Validation failed";
    throw Z(c, "validate-zip", "failed", R), B("error", "import", `Import blocked — repository unchanged. ${R}`), new Error(
      `Import blocked — repository unchanged. What happened: validation failed. Why: ${R}. Recovery: review the validation report and fix the export.`
    );
  }
  Z(c, "validate-zip", "complete", `${a.conversationsFound} conversations`);
  const d = hr(i, t, o);
  d.status = "queued", H.enqueue(d), F == null || F.webContents.send("kae:job-updated", d), H.updateStatus(i, "running", 0), F == null || F.webContents.send("kae:job-updated", H.getById(i));
  const l = qe.get(t);
  if (!l) {
    const R = `No connector registered for format: ${t}`;
    throw H.updateStatus(i, "failed", 0, R), B("error", "import", `${R} — repository unchanged.`), new Error(R);
  }
  Z(c, "create-snapshot", "running"), B("info", "repository", "Creating pre-import snapshot…");
  const u = await ps(P(), i), f = await Qi(P(), {
    sessionId: i,
    connectorId: t,
    sourceFile: s,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repositoryPath: P(),
    snapshotPath: u,
    validationPassed: !0,
    plannedCreates: a.estimatedSourcesToCreate,
    plannedUpdates: a.estimatedSourcesToUpdate,
    rollbackInfo: { snapshotDirectory: u, manifestPath: "" }
  });
  Z(c, "create-snapshot", "complete", S.basename(u)), B("info", "repository", `Snapshot saved: ${u}`), Z(c, "analyze-export", "running"), await Ve(
    `Analyze export: using cached package=${!!(Q && De === e)}, documents=${(Q == null ? void 0 : Q.documents.length) ?? "unknown"}`
  );
  const g = {
    repositoryPath: P(),
    outputDirectory: ue.settings.outputDirectory,
    jobId: i,
    importPackage: De === e ? Q ?? void 0 : void 0,
    sourceZipPath: e,
    log: (R, D) => B(R, "import", D),
    onProgress: (R) => {
      H.updateStatus(i, "running", R), F == null || F.webContents.send("kae:job-updated", H.getById(i));
    }
  };
  B("info", "import", `Import started: ${s}`);
  const y = await l.import(o, g);
  if (!y.success || y.documents.length === 0) {
    const R = ((h = y.errors) == null ? void 0 : h.join("; ")) || "Import produced no documents";
    throw Z(c, "analyze-export", "failed", R), H.updateStatus(i, "failed", 100, R), B(
      "error",
      "import",
      `Import failed after snapshot — repository may be partially updated. Rollback: ${u}. Error: ${R}`
    ), new Error(
      `Import failed. Snapshot available at ${u}. What happened: connector produced no documents. Why: ${R}. Recovery: restore from snapshot if needed.`
    );
  }
  Z(c, "analyze-export", "complete", `${y.documents.length} documents`), Z(c, "generate-sources", "running"), H.updateStatus(i, "running", 85), F == null || F.webContents.send("kae:job-updated", H.getById(i)), Z(c, "update-repository", "running");
  const w = await ds.export(y.documents, P(), {
    log: (R, D) => B(R, "export", D),
    onProgress: (R) => {
      H.updateStatus(i, "running", 85 + Math.round(R * 0.15)), F == null || F.webContents.send("kae:job-updated", H.getById(i));
    },
    importFileName: s,
    sourceZipPath: e
  });
  Z(c, "generate-sources", "complete"), Z(c, "update-repository", "complete", `${w.sourcesCreated} sources`), Z(c, "update-registries", "complete", w.reviewFile ?? "Registries updated"), Z(c, "health-check", "running");
  const x = await le(P());
  Z(c, "health-check", "complete", x.statusSubline), Z(c, "git-readiness", "running");
  const C = x.gitReadiness;
  Z(c, "git-readiness", "complete", C.status);
  const k = Date.now() - n, _ = qe.get(t), m = {
    conversationsFound: ((v = y.summary) == null ? void 0 : v.conversationsFound) ?? y.documents.length,
    sourcesCreated: w.sourcesCreated,
    skippedDuplicates: w.skippedDuplicates,
    errors: [...y.errors ?? [], ...w.errors],
    outputFolder: w.outputFolder,
    createdSourceIds: w.createdSourceIds,
    classified: w.classified,
    uncertain: w.uncertain,
    reviewFile: w.reviewFile,
    durationMs: k,
    connectorId: t,
    connectorName: (_ == null ? void 0 : _.name) ?? t,
    sessionsCreated: w.sessionsCreated ?? w.sourcesCreated,
    snapshotPath: u,
    gitReadiness: C,
    timeline: [...c]
  }, p = {
    reportId: i,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs: k,
    connectorId: t,
    connectorName: (_ == null ? void 0 : _.name) ?? "ChatGPT Connector",
    sourceFile: s,
    repositoryPath: P(),
    imported: w.sourcesCreated,
    updated: a.estimatedSourcesToUpdate,
    skipped: w.skippedDuplicates,
    warnings: a.warnings,
    errors: m.errors,
    sourcesCreated: w.createdSourceIds,
    sessionsCreated: w.sessionsCreated ?? w.sourcesCreated,
    registriesUpdated: ((E = a.diffPreview) == null ? void 0 : E.registriesUpdated) ?? [],
    snapshotPath: u,
    manifestPath: f,
    gitReadiness: C,
    reportFilePath: ""
  };
  try {
    m.importReportPath = await $o(P(), p), B("info", "import", `Import report saved: ${m.importReportPath}`);
  } catch (R) {
    const D = R instanceof Error ? R.message : String(R);
    m.errors.push(`Import report: ${D}`), B("warn", "import", `Could not write import report: ${D}`);
  }
  Z(c, "complete", "complete", `Done in ${(k / 1e3).toFixed(1)}s`), m.timeline = [...c], tr = m;
  const I = H.getById(i);
  return I.summary = m, H.updateStatus(i, "completed", 100), B(
    "info",
    "import",
    `Import complete in ${k}ms: ${m.sourcesCreated} source(s), ${m.skippedDuplicates} skipped`,
    { summary: m, snapshotPath: u, manifestPath: f }
  ), F == null || F.webContents.send("kae:job-updated", H.getById(i)), _t(), F == null || F.webContents.send("kae:import-complete", m), m;
}
function zc() {
  O.handle(
    "kae:get-importers",
    () => qe.getAll().map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      supportedExtensions: e.supportedExtensions
    }))
  ), O.handle("kae:get-repository-config", () => ue.repository), O.handle("kae:set-repository-config", (e, t) => (ue.repository = t, B("info", "repository", `Repository path set to ${t.path}`), ue.repository)), O.handle("kae:get-settings", () => Dt()), O.handle("kae:set-settings", (e, t) => (ue.settings = { ...Nt, ...t }, B("info", "settings", "Application settings updated"), Dt())), O.handle("kae:get-jobs", () => H.getAll()), O.handle("kae:get-logs", () => Ze), O.handle("kae:get-default-repository-path", () => Vn), O.handle("kae:get-repository-health", async () => le(P())), O.handle("kae:get-git-readiness", async () => (await le(P())).gitReadiness), O.handle("kae:get-repository-stats", async () => xs(P())), O.handle("kae:browse-repository", async () => tt(P())), O.handle(
    "kae:read-repository-file",
    async (e, t) => $e(P(), t)
  ), O.handle("kae:parse-chatgpt-source", async (e, t) => {
    const n = await $e(P(), t), s = Bt(n);
    if (!s) return null;
    const r = new Set(s.fileReferences);
    for (const o of s.messages)
      for (const c of o.fileReferences) r.add(c);
    const i = await oo(P(), [...r]);
    return { parsed: s, assets: i };
  }), O.handle(
    "kae:read-repository-asset",
    async (e, t, n) => {
      const s = He(t), r = await T.readFile(s), i = Gt(r, n ?? S.basename(t)), o = t.replace(/\\/g, "/");
      return {
        assetUrl: `kae-asset://resolve/${encodeURIComponent(o)}`,
        mimeType: i,
        sizeBytes: r.length
      };
    }
  ), O.handle(
    "kae:list-chatgpt-import-entries",
    async () => ms(P())
  ), O.handle(
    "kae:search-repository",
    async (e, t) => xo(P(), t)
  ), O.handle("kae:build-evidence-index", async () => {
    const e = await zt(P());
    return await Ye(P()), _t(), go(e);
  }), O.handle("kae:search-knowledge", async (e, t) => {
    const n = await Cs(P(), t);
    return Rs(n);
  }), O.handle(
    "kae:resolve-evidence-drilldown",
    async (e, t, n) => aa(P(), t, n)
  ), O.handle(
    "kae:answer-knowledge-question",
    async (e, t, n) => lc(P(), t, Uc(n))
  ), O.handle("kae:list-ai-providers", () => Wn().listCapabilities()), O.handle("kae:build-relationship-index", async () => {
    const e = await Ye(P());
    return _t(), Ea(e);
  }), O.handle("kae:search-relationships", async (e, t) => {
    const n = await be(P());
    return xt(n, t);
  }), O.handle("kae:get-relationships-for-evidence", async (e, t) => {
    const n = await be(P());
    return Os(n, t);
  }), O.handle(
    "kae:get-related-evidence",
    async (e, t, n) => Ps(P(), t, n)
  ), O.handle("kae:get-executive-briefing", async () => Zs(P())), O.handle(
    "kae:refresh-executive-briefing",
    async () => Wt(P())
  ), O.handle("kae:load-active-vigsy-conversation", async () => {
    const e = await gc(P());
    return e && await On(P(), e), e;
  }), O.handle("kae:save-vigsy-conversation", async (e, t) => {
    const n = await er(P(), t);
    return t.turns.length > 0 && (await Fc(P(), t), F == null || F.webContents.send("kae:executive-memory-updated"), F == null || F.webContents.send("kae:executive-briefing-updated"), F == null || F.webContents.send("kae:vigsy-refreshed")), n;
  }), O.handle("kae:create-vigsy-conversation", async () => {
    await bc(P());
    const e = await vc(P());
    return await On(P(), e), e;
  }), O.handle("kae:delete-vigsy-conversation", async (e, t) => {
    await Lc(P(), t), await Ic(P(), t);
  }), O.handle("kae:get-executive-continuity", async () => Oc(P())), O.handle("kae:open-repository-path", async () => {
    await ot.openPath(P());
  }), O.handle("kae:open-repository-file", async (e, t) => {
    await ot.openPath(He(t));
  }), O.handle("kae:reveal-repository-file", async (e, t) => {
    ot.showItemInFolder(He(t));
  }), O.handle("kae:copy-text", async (e, t) => (or.writeText(t), !0)), O.handle("kae:get-last-validation", () => se), O.handle("kae:get-last-import-summary", () => tr), O.handle("kae:get-last-repair-plan", () => Rt), O.handle("kae:get-last-repair-result", () => Ct), O.handle("kae:select-zip-file", async () => {
    const e = await ar.showOpenDialog({
      title: "Select ChatGPT Export ZIP",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });
    return e.canceled ? null : e.filePaths[0] ?? null;
  }), O.handle("kae:analyze-repository-repair", async () => {
    B("info", "repair", "Repository repair analysis started (read-only)");
    const e = await Mo(P());
    return Rt = e, Ct = null, B("info", "repair", `Repair analysis complete: ${e.issues.length} issue(s), ${e.autoRepairCount} auto-repair action(s)`, {
      issueCount: e.issues.length,
      autoRepairCount: e.autoRepairCount,
      manualReviewCount: e.manualReviewCount
    }), e;
  }), O.handle("kae:execute-repository-repair", async (e, t) => {
    B("info", "repair", `Repository repair confirmed — ${t.autoRepairCount} safe action(s) will be applied`);
    const n = await Wo(t, {
      log: (s, r, i) => B(s, "repair", r, i)
    });
    return Ct = n, Rt = t, B("info", "repair", `Repository repair complete: ${n.filesChanged.length} file(s) changed`, {
      snapshotPath: n.snapshotPath,
      duplicatesBefore: n.healthBefore.duplicateIds,
      duplicatesAfter: n.healthAfter.duplicateIds,
      ready: n.healthAfter.ready
    }), n;
  }), O.handle("kae:validate-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Bc(t);
  }), O.handle("kae:cancel-validation", () => de ? (de.abort(), B("warn", "import", "Validation cancelled by user — repository unchanged"), sr({
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
  }), !0) : !1), O.handle("kae:import-chatgpt-zip", async (e, t) => {
    if (!t || !t.toLowerCase().endsWith(".zip"))
      throw new Error("Please select a valid .zip file. Repository unchanged.");
    return Gc(t, "chatgpt-export-zip");
  });
}
We.whenReady().then(async () => {
  Mn.handle("kae-asset", async (e) => {
    const t = Pc(e.url), n = He(t), s = await T.readFile(n), r = Gt(s, S.basename(t));
    return new Response(s, { headers: { "Content-Type": r } });
  }), jc(), zc(), B("info", "system", `${Kn} started — ${Zn}`), Un(), We.on("activate", () => {
    jn.getAllWindows().length === 0 && Un();
  });
});
We.on("window-all-closed", () => {
  process.platform !== "darwin" && We.quit();
});
