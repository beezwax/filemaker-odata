import y, { isAxiosError as q, AxiosError as M, AxiosHeaders as D } from "axios";
class $ extends Error {
  data;
  status;
  contentType;
  failure;
  constructor(t, e, s) {
    super(t), this.name = "RequestError", this.data = e, this.status = s?.status, this.contentType = s?.contentType, this.failure = s?.failure ?? "other";
  }
}
class v extends $ {
  timeout;
  constructor(t) {
    super(`Request timed out after ${t} ms`, void 0, {
      failure: "interrupted"
    }), this.name = "RequestTimeoutError", this.timeout = t;
  }
}
const h = (r) => r instanceof $, O = (r) => r instanceof v, w = (r) => typeof r == "object" && r !== null && !Array.isArray(r) && Object.getPrototypeOf(r) === Object.prototype, R = (r, t) => {
  const e = { ...r };
  for (const s of Object.keys(t)) {
    const i = t[s];
    if (i === void 0) continue;
    const n = e[s];
    e[s] = w(n) && w(i) ? R(n, i) : i;
  }
  return e;
}, k = (r) => {
  const t = D.from(r).get(
    "content-type"
  );
  return t ? String(t).toLowerCase() : void 0;
}, P = /* @__PURE__ */ new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH"
]), S = /* @__PURE__ */ new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EPIPE",
  "ERR_NETWORK"
]), N = (r) => {
  const { code: t, response: e } = r;
  return !e && t !== void 0 && P.has(t) ? "not-connected" : t !== void 0 && S.has(t) || t === M.ERR_BAD_RESPONSE && e && e.status >= 200 && e.status < 300 ? "interrupted" : e ? "response" : "other";
}, x = (r) => {
  const t = r instanceof Error ? r.message : String(r);
  if (!q(r)) return new $(t);
  const { response: e } = r;
  return new $(t, e?.data, {
    status: e?.status,
    contentType: e ? k(e.headers) : void 0,
    failure: N(r)
  });
}, L = (r) => {
  const t = new AbortController();
  let e = !1, s;
  const i = () => {
    clearTimeout(s), s = setTimeout(() => {
      e = !0, t.abort();
    }, r);
  };
  return i(), {
    config: {
      signal: t.signal,
      onDownloadProgress: i
    },
    error: (n) => e ? new v(r) : x(n),
    stop: () => clearTimeout(s)
  };
};
class C {
  credentials;
  agent;
  timeout;
  constructor(t, e, s) {
    this.credentials = t, this.agent = e, this.timeout = s;
  }
  config(t, e) {
    return R({ ...t }, {
      httpsAgent: this.agent,
      headers: this.credentials.authorizationHeaders,
      ...e
    });
  }
  async send(t, e) {
    const s = this.timeout === void 0 ? void 0 : L(this.timeout);
    try {
      return await e(this.config(t, s?.config ?? {}));
    } catch (i) {
      throw s ? s.error(i) : x(i);
    } finally {
      s?.stop();
    }
  }
  async get(t, e) {
    return this.send(e, (s) => y.get(t, s));
  }
  async post(t, e, s) {
    return this.send(
      s,
      (i) => y.post(t, e, i)
    );
  }
}
class m {
  get authorizationHeaders() {
    return {};
  }
}
class U {
  requestId;
  identifier;
  constructor({
    requestId: t,
    identifier: e
  }) {
    this.requestId = t, this.identifier = e;
  }
  get authorizationHeaders() {
    return {
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      "X-FM-Data-OAuth-Request-Id": this.requestId,
      "X-FM-Data-OAuth-Identifier": this.identifier
    };
  }
}
class j {
  username;
  password;
  constructor({ username: t, password: e }) {
    this.username = t, this.password = e;
  }
  get authorizationHeaders() {
    return {
      Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`
    };
  }
}
class vt {
  authorization;
  constructor(t) {
    this.authorization = t;
  }
  get authorizationHeaders() {
    return {
      Authorization: this.authorization
    };
  }
}
class Ot {
  server;
  database;
  request;
  constructor({ server: t, database: e }) {
    this.server = t, this.database = e, this.request = new C(new m());
  }
  url(t) {
    return `https://${this.server}/fmi/data/vLatest/databases/${this.database}/${t}`;
  }
  async getAuthType() {
    const e = (await this.request.get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return e !== void 0 ? e.Provider[0].Name : "basic";
  }
  async getOAuthUrl({
    trackingId: t,
    provider: e,
    returnUrl: s
  }) {
    const i = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    console.log(i), console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": s ?? `https://${this.server}/oauth-handler`
      }
    });
    const n = await this.request.get(i, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": s ?? `https://${this.server}/oauth-handler`
      }
    }), o = n.data, a = n.headers["x-fms-request-id"] ?? "";
    if (a === void 0 || a === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: o, requestId: a };
  }
  // Uses a requestId and an identifier (OAuth) to return an authentication
  // token which can be used for subsequent requests.
  async getTokenUsingOAuth({
    requestId: t,
    identifier: e
  }) {
    return (await this.request.post(this.url("sessions"), {
      headers: {
        "Content-Type": "application/json",
        "X-FM-Data-OAuth-Request-Id": t,
        "X-FM-Data-OAuth-Identifier": e
      }
    })).headers["X-FM-Data-Access-Token"];
  }
  /**
   * Uses the given credentials to return an authentication token which can be
  /* used for subsequent requests.
   */
  async getTokenUsingCredentials({
    username: t,
    password: e
  }) {
    return (await this.request.post(
      this.url("sessions"),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${t}:${e}`)}`
        }
      }
    )).data.response.token ?? null;
  }
}
class z {
  config;
  table;
  record;
  constructor({
    config: t,
    table: e,
    record: s
  }) {
    this.config = t, this.table = e, this.record = s;
  }
  toRequestBody({
    boundary: t,
    changeId: e
  }) {
    const { ID: s, ...i } = this.record, n = JSON.stringify(i);
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(n)}\r
\r
` + n + `\r
`;
  }
  parseResponse(t) {
    const e = /HTTP\/1.1\s+(\d+)\s/.exec(t);
    if (e === null) throw new Error("Could not find status in response");
    const s = Number(e[1]);
    if (s >= 300) {
      const { error: n } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${n.message}`);
    }
    const i = JSON.parse(t.substring(t.indexOf("{")).trim());
    return { status: s, body: i };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  byteLength(t) {
    return new TextEncoder().encode(t).byteLength;
  }
}
class H {
  config;
  table;
  record;
  constructor({
    config: t,
    table: e,
    record: s
  }) {
    this.config = t, this.table = e, this.record = s;
  }
  toRequestBody({
    boundary: t,
    changeId: e
  }) {
    const s = JSON.stringify(this.record);
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
POST ${this.url(this.table)} HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(s)}\r
\r
` + s + `\r
`;
  }
  parseResponse(t) {
    const e = /HTTP\/1.1\s+(\d+)\s/.exec(t);
    if (e === null) throw new Error("Could not find status in response");
    const s = Number(e[1]);
    if (s >= 300) {
      const { error: i } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[CREATE OPERATION: ${this.table}] ${i.message}`);
    }
    return { status: s, body: null };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  byteLength(t) {
    return new TextEncoder().encode(t).byteLength;
  }
}
class X {
  config;
  table;
  id;
  constructor({
    config: t,
    table: e,
    id: s
  }) {
    this.config = t, this.table = e, this.id = s;
  }
  toRequestBody({
    boundary: t,
    changeId: e
  }) {
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
DELETE ${this.url(this.table)}('${this.id}') HTTP/1.1\r
\r
\r
`;
  }
  parseResponse(t) {
    const e = /HTTP\/1.1\s+(\d+)\s/.exec(t);
    if (e === null) throw new Error("Could not find status in response");
    const s = Number(e[1]);
    if (s >= 300) {
      const { error: i } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[DELETE OPERATION: ${this.table}] ${i.message}`);
    }
    return { status: s, body: null };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
}
class V {
  operations;
  callback;
  config;
  constructor(t, e) {
    this.config = t, this.callback = e, this.operations = [];
  }
  update({
    table: t,
    record: e
  }) {
    return this.operations.push(
      new z({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  create({ table: t, record: e }) {
    return this.operations.push(
      new H({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  delete({ table: t, id: e }) {
    return this.operations.push(
      new X({
        config: this.config,
        table: t,
        id: e
      })
    ), this;
  }
  execute() {
    return this.callback(this.operations);
  }
}
const b = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (r) => {
  const t = Math.random() * 16 | 0;
  return (r == "x" ? t : t & 3 | 8).toString(16);
});
class _ {
  config;
  logger;
  request;
  constructor({
    server: t,
    database: e,
    logger: s,
    request: i
  }) {
    this.config = { server: t, database: e }, this.logger = s, this.request = i;
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  async metadata(t) {
    const e = t?.$format, s = this.url(e ? `$metadata?$format=${e}` : "$metadata"), i = e ? { Accept: `application/${e}` } : void 0;
    this.log("[FileMaker] Get metadata"), this.log("Options:"), this.log(t), this.log(`URL: ${s}`);
    try {
      return (await this.request.get(s, i ? { headers: i } : void 0)).data;
    } catch (n) {
      throw h(n) && (this.log("[FileMaker] metadata: HTTP error"), this.log(n.data)), n;
    }
  }
  async subquery(t) {
    this.log(`[FileMaker] Get records from ${t.table}`), this.log("Options:"), this.log(t.options);
    const e = `${this.url(`${t.table}('${t.recordId}')/${t.path}`)}?${this.parameterize(t.options)}`;
    try {
      return (await this.getPagedCollection(e)).value;
    } catch (s) {
      throw h(s) && (this.log("[FileMaker] subquery: HTTP error"), this.log(s.data)), s;
    }
  }
  async getRecords(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log("Options:"), this.log(e);
    const s = `${this.url(t)}?${this.parameterize(e)}`;
    try {
      return (await this.getPagedCollection(s)).value;
    } catch (i) {
      throw h(i) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(i.data)), i;
    }
  }
  async getRecordsWithCount(t, e) {
    this.log(`[FileMaker] Get records with count from ${t}`), this.log("Options:"), this.log(e);
    const s = { ...e, $count: !0 }, i = `${this.url(t)}?${this.parameterize(s)}`;
    try {
      const n = await this.getPagedCollection(i);
      return {
        data: n.value,
        count: n["@odata.count"] ?? n["@count"] ?? 0
      };
    } catch (n) {
      throw h(n) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(n.data)), n;
    }
  }
  async countRecords(t, e) {
    this.log(`[FileMaker] Count records from ${t}`), this.log("Options:"), this.log(e);
    const s = `${t}/$count`, i = this.parameterizeCount(e), n = this.url(i === "" ? s : `${s}?${i}`);
    this.log(`URL: ${n}`);
    try {
      const o = await this.request.get(n, {
        responseType: "text"
      }), a = o.data.trim();
      if (!/^\d+$/.test(a))
        throw new Error(
          `Invalid count response from "${s}": ${o.data}`
        );
      const u = Number(a);
      if (!Number.isSafeInteger(u))
        throw new Error(
          `Invalid count response from "${s}": ${o.data}`
        );
      return u;
    } catch (o) {
      throw h(o) && (this.log("[FileMaker] countRecords: HTTP error"), this.log(o.data)), o;
    }
  }
  async getRecord(t, e, s) {
    this.log(`[FileMaker] Get record from ${t}`), this.log(`ID: ${e}`);
    try {
      const i = `${this.url(t)}('${encodeURIComponent(e)}')?${this.parameterize(s)}`;
      return this.log(`URL: ${i}`), (await this.request.get(i)).data;
    } catch (i) {
      throw h(i) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(i.data)), i;
    }
  }
  async getValue(t, e, s) {
    try {
      return (await this.request.get(
        `${this.url(t)}('${encodeURIComponent(e)}')/${encodeURIComponent(s)}/$value`,
        {
          responseType: "arraybuffer"
        }
      )).data;
    } catch (i) {
      throw h(i) && (this.log("[FileMaker] getValue: HTTP error"), this.log(i.data)), i;
    }
  }
  async crossjoin({
    tables: t,
    options: e
  }) {
    try {
      return (await this.request.get(
        `${this.url("$crossjoin")}(${t.join(",")})?${this.parameterize(e)}`
      )).data;
    } catch (s) {
      throw h(s) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(s.data)), s;
    }
  }
  // Performs a "$batch" request, executing the given operations
  // transactionally. Meaning operations either all succeed, or none of them
  // does.
  //
  // Usage:
  //
  //   const response = (await fm
  //     .batch()
  //     .update<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         ID: "FINDING-280DC895-23F6-4368-BE3B-3EA81D360F62",
  //         FINDING: "Example 1 2 3",
  //       },
  //     })
  //     .create<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         FINDING: "Example body",
  //       },
  //     })
  //     .delete({
  //       table: "FINDING",
  //       id: "SOME-FINDING-ID",
  //     })
  //     .execute()) as [
  //       BatchOperationResponse<FindingRecord>,
  //       BatchOperationResponse<null>,
  //       BatchOperationResponse<null>
  //     ];
  //
  batch() {
    return new V(this.config, async (t) => {
      const e = `batch_${b()}`, s = `changeset_${b()}`, i = `--${e}\r
Content-Type: multipart/mixed; boundary=${s}\r
\r
` + t.map(
        (n, o) => n.toRequestBody({
          boundary: s,
          changeId: o + 1
        })
      ).join("") + `--${s}--\r
--${e}--\r
`;
      try {
        const n = await this.request.post(
          this.url("$batch"),
          i,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${e}`
            }
          }
        ), o = /boundary=(.+?)\r\n/.exec(n.data);
        if (o === null) throw new Error("Could not find changeset");
        const a = o[0].split("=")[1].trim();
        return n.data.split(`--${a}`).slice(1, -1).map(
          (c, d) => t[d].parseResponse(c)
        );
      } catch (n) {
        throw h(n) && (this.log("[FileMaker] batch: HTTP error"), this.log(n.data)), n;
      }
    });
  }
  async script(t, e) {
    this.log(`[FileMaker] Running script ${t} with parameters:`), this.log({ scriptParameterValue: e });
    try {
      const s = await this.request.post(
        this.url(`Script.${encodeURIComponent(t)}`),
        e === void 0 ? null : { scriptParameterValue: e },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      this.log(`[FileMaker] Script ${t} finished. Response:`), this.log(s.data);
      const i = s.data.scriptResult.code === 0;
      return {
        success: i,
        data: i ? s.data.scriptResult.resultParameter : void 0
      };
    } catch (s) {
      throw h(s) && (this.log("[FileMaker] script: HTTP error"), this.log(s.data)), s;
    }
  }
  // FileMaker caps a JSON response at 10,000 records and links to the rest.
  // Returns the first page with `value` holding the records of all pages.
  async getPagedCollection(t) {
    this.log(`URL: ${t}`);
    const e = (await this.request.get(t)).data;
    if (typeof e == "string") return e;
    const s = (o) => o["@odata.nextLink"] ?? o["@nextLink"], i = [...e.value];
    let n = s(e);
    for (; n; ) {
      const o = this.resolveNextLink(n);
      this.log(`URL: ${o}`);
      const a = (await this.request.get(o)).data;
      i.push(...a.value), n = s(a);
    }
    return { ...e, value: i };
  }
  resolveNextLink(t) {
    const e = this.url(""), s = new URL(t, e);
    if (s.origin !== new URL(e).origin)
      throw new Error(
        `Refusing to follow OData next link to another origin: ${s.origin}`
      );
    return s.href;
  }
  parameterize(t) {
    if (t === void 0) return "$format=application/json";
    const e = {};
    if (t.$select !== void 0 && (e.$select = t.$select.map((i) => `"${String(i).replaceAll('"', '""')}"`).join(",")), t.$top !== void 0 && (e.$top = t.$top), t.$skip !== void 0 && (e.$skip = t.$skip), t.$filter !== void 0 && (e.$filter = t.$filter), t.$expand !== void 0 && (e.$expand = t.$expand), t.$orderby !== void 0) {
      const i = Array.isArray(t.$orderby[0]) ? t.$orderby : [t.$orderby];
      e.$orderby = i.map(([n, o]) => `"${String(n)}" ${o}`).join(",");
    }
    t.$count !== void 0 && (e.$count = t.$count ? "true" : "false");
    const s = t.$metadata ?? !0;
    return e.$format = `${t.$format === "xml" ? "application/xml" : "application/json"}${s ? "" : ";odata.metadata=none"}`, Object.entries(e).map(([i, n]) => `${i}=${n}`).join("&");
  }
  parameterizeCount(t) {
    return t?.$filter === void 0 ? "" : `$filter=${t.$filter}`;
  }
  log(t) {
    return this.logger.log(t);
  }
}
const B = (r, t) => {
  const e = Object.entries(t?.headers ?? {}).map(([s, i]) => [s.toLowerCase(), i]).sort(([s], [i]) => s < i ? -1 : s > i ? 1 : 0);
  return JSON.stringify([r, t?.responseType ?? null, e]);
}, G = (r) => ArrayBuffer.isView(r) ? r instanceof DataView ? new DataView(
  r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength)
) : Uint8Array.prototype.slice.call(r) : structuredClone(r);
class J {
  inner;
  inFlight = /* @__PURE__ */ new Map();
  constructor(t) {
    this.inner = t;
  }
  get(t, e) {
    const s = B(t, e), i = this.inFlight.get(s);
    if (i !== void 0)
      return i.then((a) => ({
        ...a,
        headers: { ...a.headers },
        data: G(a.data)
      }));
    const n = this.inner.get(t, e);
    this.inFlight.set(s, n);
    const o = () => {
      this.inFlight.get(s) === n && this.inFlight.delete(s);
    };
    return n.then(o, o), n;
  }
  post(t, e, s) {
    return this.detachInFlightReads(), this.inner.post(t, e, s);
  }
  // Any POST (batch, script) may write, so later reads must not join reads that started before it.
  detachInFlightReads() {
    this.inFlight.clear();
  }
}
const Y = /* @__PURE__ */ new Set([500, 502, 503, 504]), W = /* @__PURE__ */ new Set([500, 503]), K = ({ status: r, contentType: t }) => r !== void 0 && W.has(r) && (!t || t.includes("text/html")), I = (r) => h(r) && !O(r) && (r.failure === "not-connected" || r.failure === "response" && K(r)), Q = (r) => O(r) || I(r) || h(r) && (r.failure === "interrupted" || r.failure === "response" && r.status !== void 0 && Y.has(r.status)), Z = 250, tt = 3e4;
function A(r) {
  if (typeof r != "number" || !Number.isInteger(r) || r < 0)
    throw new RangeError("retries must be a non-negative integer");
}
const et = (r) => typeof r == "number" && Number.isFinite(r) && r >= 0, rt = (r) => new Promise((t) => setTimeout(t, r));
class st {
  inner;
  retries;
  baseDelay;
  logger;
  constructor(t, { retries: e, baseDelay: s = Z, logger: i }) {
    if (A(e), !et(s))
      throw new RangeError("baseDelay must be a non-negative number");
    this.inner = t, this.retries = e, this.baseDelay = s, this.logger = i;
  }
  get(t, e) {
    return this.attempt(
      "GET",
      t,
      Q,
      () => this.inner.get(t, e)
    );
  }
  post(t, e, s) {
    return this.attempt(
      "POST",
      t,
      I,
      () => this.inner.post(t, e, s)
    );
  }
  async attempt(t, e, s, i) {
    for (let n = 0; ; n++)
      try {
        return await i();
      } catch (o) {
        if (n >= this.retries || !s(o)) throw o;
        const a = this.delayFor(n);
        this.logger?.log(
          `[FileMaker] Retrying ${t} ${e} in ${a} ms (retry ${n + 1} of ${this.retries}): ${o instanceof Error ? o.message : String(o)}`
        ), await rt(a);
      }
  }
  // The wait before the retry that follows `retried` earlier retries.
  delayFor(t) {
    const e = this.baseDelay * 2 ** t;
    return Math.min(tt, Math.round(e + Math.random() * e));
  }
}
class it {
  value;
  next;
  constructor(t) {
    this.value = t;
  }
}
class nt {
  #t;
  #e;
  #r;
  constructor() {
    this.clear();
  }
  enqueue(t) {
    const e = new it(t);
    this.#t ? (this.#e.next = e, this.#e = e) : (this.#t = e, this.#e = e), this.#r++;
  }
  dequeue() {
    const t = this.#t;
    if (t)
      return this.#t = this.#t.next, this.#r--, this.#t || (this.#e = void 0), t.value;
  }
  peek() {
    if (this.#t)
      return this.#t.value;
  }
  clear() {
    this.#t = void 0, this.#e = void 0, this.#r = 0;
  }
  get size() {
    return this.#r;
  }
  *[Symbol.iterator]() {
    let t = this.#t;
    for (; t; )
      yield t.value, t = t.next;
  }
  *drain() {
    for (; this.#t; )
      yield this.dequeue();
  }
}
function ot(r) {
  let t = !1;
  if (typeof r == "object" && ({ concurrency: r, rejectOnClear: t = !1 } = r), T(r), typeof t != "boolean")
    throw new TypeError("Expected `rejectOnClear` to be a boolean");
  const e = new nt();
  let s = 0;
  const i = () => {
    s < r && e.size > 0 && (s++, e.dequeue().run());
  }, n = () => {
    s--, i();
  }, o = async (c, d, p) => {
    const l = (async () => c(...p))();
    d(l);
    try {
      await l;
    } catch {
    }
    n();
  }, a = (c, d, p, l) => {
    const g = { reject: p };
    new Promise((f) => {
      g.run = f, e.enqueue(g);
    }).then(o.bind(void 0, c, d, l)), s < r && i();
  }, u = (c, ...d) => new Promise((p, l) => {
    a(c, p, l, d);
  });
  return Object.defineProperties(u, {
    activeCount: {
      get: () => s
    },
    pendingCount: {
      get: () => e.size
    },
    clearQueue: {
      value() {
        if (!t) {
          e.clear();
          return;
        }
        const c = AbortSignal.abort().reason;
        for (; e.size > 0; )
          e.dequeue().reject(c);
      }
    },
    concurrency: {
      get: () => r,
      set(c) {
        T(c), r = c, queueMicrotask(() => {
          for (; s < r && e.size > 0; )
            i();
        });
      }
    },
    map: {
      async value(c, d) {
        const p = [];
        try {
          Array.from(c, (l, g) => {
            const f = u(d, l, g);
            return p.push(f), f;
          });
        } catch (l) {
          for (const g of p)
            g.catch(() => {
            });
          throw l;
        }
        return Promise.all(p);
      }
    }
  }), u;
}
function T(r) {
  if (!((Number.isInteger(r) || r === Number.POSITIVE_INFINITY) && r > 0))
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
}
const at = (r) => r === 1 / 0 || typeof r == "number" && Number.isInteger(r) && r > 0;
class ut {
  limit;
  constructor(t) {
    if (!at(t))
      throw new RangeError(
        "concurrency must be a positive integer or Infinity"
      );
    this.limit = ot(t);
  }
  run(t) {
    return this.limit(t);
  }
}
class ct {
  inner;
  limit;
  constructor(t, e) {
    this.inner = t, this.limit = e;
  }
  get(t, e) {
    return this.limit.run(() => this.inner.get(t, e));
  }
  post(t, e, s) {
    return this.limit.run(() => this.inner.post(t, e, s));
  }
}
class ht {
  log(t) {
    console.dir(t, { depth: null });
  }
}
class Rt {
  log() {
  }
}
const lt = (r) => r !== void 0 && r !== 0 && r !== 1 / 0, E = 2147483647, dt = (r) => {
  if (!(r === void 0 || r === 0 || r === 1 / 0)) {
    if (typeof r == "number" && r > 0 && r <= E)
      return r;
    throw new RangeError(
      `timeout must be a positive number up to ${E}, 0 or Infinity`
    );
  }
};
class xt {
  server;
  database;
  agent;
  logger;
  dedupe;
  concurrencyLimit;
  timeout;
  retries;
  constructor({
    server: t,
    database: e,
    agent: s,
    logger: i,
    dedupe: n = !0,
    concurrency: o,
    timeout: a,
    retries: u = 1
  }) {
    this.server = t, this.database = e, this.agent = s, this.logger = i ?? new ht(), this.dedupe = n, this.concurrencyLimit = lt(o) ? new ut(o) : void 0, this.timeout = dt(a), A(u), this.retries = u;
  }
  /**
   * Creates a FileMaker instance configured with basic authentication.
   *
   * @param username - The FileMaker username
   * @param password - The FileMaker password
   * @returns A configured FileMaker instance ready to use
   */
  withBasicAuth({
    username: t,
    password: e
  }) {
    const s = new j({ username: t, password: e });
    return this.buildFileMaker(this.transport(s));
  }
  /**
   * Creates a FileMaker instance configured with OAuth credentials.
   *
   * @param requestId - The request ID obtained from getOAuthUrl()
   * @param identifier - The identifier received from the OAuth redirect
   * @returns A configured FileMaker instance ready to use
   */
  withOAuth({
    requestId: t,
    identifier: e
  }) {
    const s = new U({
      requestId: t,
      identifier: e
    });
    return this.buildFileMaker(this.transport(s));
  }
  // The per-attempt transport: the axios Request plus retries, also used by
  // the unauthenticated getOAuthUrl and getAuthTypes. Retries sit inside
  // decorate()'s concurrency limit and dedupe, so a request keeps its slot
  // while it waits to retry and callers sharing a deduplicated read share its
  // retries.
  transport(t) {
    return new st(
      new C(t, this.agent, this.timeout),
      { retries: this.retries, logger: this.logger }
    );
  }
  buildFileMaker(t) {
    return new _({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: this.decorate(t)
    });
  }
  // Wraps the transport, innermost first: the concurrency limit sits inside
  // dedupe, so callers sharing a deduplicated read do not take a slot.
  decorate(t) {
    let e = t;
    return this.concurrencyLimit !== void 0 && (e = new ct(e, this.concurrencyLimit)), this.dedupe && (e = new J(e)), e;
  }
  /**
   * Initiates the OAuth authentication flow by generating the OAuth URL.
   * Redirect the user to the returned URL to begin authentication.
   *
   * @param trackingId - A unique identifier for tracking this OAuth request
   * @param provider - The OAuth provider name (e.g., "Google", "Microsoft")
   * @param returnUrl - Optional URL to return to after OAuth completes
   * @returns The OAuth redirect URL and request ID to store for later use
   */
  async getOAuthUrl({
    trackingId: t,
    provider: e,
    returnUrl: s
  }) {
    const i = this.transport(new m()), n = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, o = await i.get(n, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": s ?? `https://${this.server}/oauth-handler`
      }
    }), a = o.data, u = o.headers["x-fms-request-id"] ?? "";
    if (u === void 0 || u === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: a, requestId: u };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const s = (await this.transport(new m()).get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return s !== void 0 ? s.Provider.map((i) => i.Name) : ["basic"];
  }
  /**
   * Helper method to construct a FileMaker OData URL.
   *
   * @param path - The path segment to append to the base URL
   * @returns The full OData URL
   */
  url(t) {
    return `https://${this.server}/fmi/odata/v4/${this.database}/${t}`;
  }
}
const F = (r) => {
  if (typeof r != "string") throw new TypeError("Invalid OData string");
  return `'${r.replaceAll("'", "''")}'`;
}, pt = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/, gt = (r) => {
  if (typeof r == "number") {
    if (!Number.isFinite(r)) throw new TypeError("Invalid OData number");
    return String(r);
  }
  if (typeof r != "string")
    throw new TypeError("Invalid OData number");
  const t = r.trim();
  if (!pt.test(t))
    throw new TypeError("Invalid OData number");
  const e = Number(t);
  if (!Number.isFinite(e)) throw new TypeError("Invalid OData number");
  return String(e);
}, ft = /^[+-]?\d+$/, $t = (r) => {
  if (typeof r != "number" && typeof r != "string")
    throw new TypeError("Invalid OData integer");
  const t = typeof r == "number" ? String(r) : r.trim();
  if (!ft.test(t))
    throw new TypeError("Invalid OData integer");
  return t;
}, mt = (r) => {
  if (typeof r != "boolean") throw new TypeError("Invalid OData boolean");
  return r ? "true" : "false";
}, yt = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, wt = (r) => {
  if (typeof r != "string") throw new TypeError("Invalid OData UUID");
  if (!yt.test(r)) throw new TypeError("Invalid OData UUID");
  return F(r);
}, bt = /^[A-Za-z0-9 _-]+$/, Tt = (r) => {
  if (typeof r != "string")
    throw new TypeError("Invalid OData identifier");
  if (!bt.test(r))
    throw new TypeError("Invalid OData identifier");
  return `"${r}"`;
}, Ct = {
  string: F,
  number: gt,
  integer: $t,
  boolean: mt,
  uuid: wt,
  identifier: Tt
};
export {
  ut as ConcurrencyLimit,
  ct as ConcurrencyLimitRequest,
  J as DedupeRequest,
  _ as FileMaker,
  Ot as FileMakerAuthenticator,
  j as FileMakerBasicCredentials,
  xt as FileMakerClient,
  U as FileMakerOAuthCredentials,
  vt as FileMakerRawCredentials,
  ht as Logger,
  m as NullFileMakerCredentials,
  Rt as NullLogger,
  $ as RequestError,
  v as RequestTimeoutError,
  st as RetryRequest,
  h as isRequestError,
  O as isRequestTimeoutError,
  Ct as odata
};
