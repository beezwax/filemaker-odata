import y, { isAxiosError as C } from "axios";
class m extends Error {
  data;
  constructor(t, e) {
    super(t), this.name = "RequestError", this.data = e;
  }
}
class x extends m {
  timeout;
  constructor(t) {
    super(`Request timed out after ${t} ms`), this.name = "RequestTimeoutError", this.timeout = t;
  }
}
const l = (s) => s instanceof m, nt = (s) => s instanceof x, w = (s) => typeof s == "object" && s !== null && !Array.isArray(s) && Object.getPrototypeOf(s) === Object.prototype, O = (s, t) => {
  const e = { ...s };
  for (const r of Object.keys(t)) {
    const i = t[r];
    if (i === void 0) continue;
    const n = e[r];
    e[r] = w(n) && w(i) ? O(n, i) : i;
  }
  return e;
}, q = (s) => new m(
  s instanceof Error ? s.message : String(s),
  C(s) && s.response ? s.response.data : void 0
), F = (s) => {
  const t = new AbortController();
  let e = !1, r;
  const i = () => {
    clearTimeout(r), r = setTimeout(() => {
      e = !0, t.abort();
    }, s);
  };
  return i(), {
    config: {
      signal: t.signal,
      onDownloadProgress: i
    },
    error: (n) => e ? new x(s) : q(n),
    stop: () => clearTimeout(r)
  };
};
class R {
  credentials;
  agent;
  timeout;
  constructor(t, e, r) {
    this.credentials = t, this.agent = e, this.timeout = r;
  }
  config(t, e) {
    return O({ ...t }, {
      httpsAgent: this.agent,
      headers: this.credentials.authorizationHeaders,
      ...e
    });
  }
  async send(t, e) {
    const r = this.timeout === void 0 ? void 0 : F(this.timeout);
    try {
      return await e(this.config(t, r?.config ?? {}));
    } catch (i) {
      throw r ? r.error(i) : q(i);
    } finally {
      r?.stop();
    }
  }
  async get(t, e) {
    return this.send(e, (r) => y.get(t, r));
  }
  async post(t, e, r) {
    return this.send(
      r,
      (i) => y.post(t, e, i)
    );
  }
}
class $ {
  get authorizationHeaders() {
    return {};
  }
}
class E {
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
class k {
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
class ot {
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
class at {
  server;
  database;
  request;
  constructor({ server: t, database: e }) {
    this.server = t, this.database = e, this.request = new R(new $());
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
    returnUrl: r
  }) {
    const i = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    console.log(i), console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    });
    const n = await this.request.get(i, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
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
class M {
  config;
  table;
  record;
  constructor({
    config: t,
    table: e,
    record: r
  }) {
    this.config = t, this.table = e, this.record = r;
  }
  toRequestBody({
    boundary: t,
    changeId: e
  }) {
    const { ID: r, ...i } = this.record, n = JSON.stringify(i);
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
    const r = Number(e[1]);
    if (r >= 300) {
      const { error: n } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${n.message}`);
    }
    const i = JSON.parse(t.substring(t.indexOf("{")).trim());
    return { status: r, body: i };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  byteLength(t) {
    return new TextEncoder().encode(t).byteLength;
  }
}
class A {
  config;
  table;
  record;
  constructor({
    config: t,
    table: e,
    record: r
  }) {
    this.config = t, this.table = e, this.record = r;
  }
  toRequestBody({
    boundary: t,
    changeId: e
  }) {
    const r = JSON.stringify(this.record);
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
POST ${this.url(this.table)} HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(r)}\r
\r
` + r + `\r
`;
  }
  parseResponse(t) {
    const e = /HTTP\/1.1\s+(\d+)\s/.exec(t);
    if (e === null) throw new Error("Could not find status in response");
    const r = Number(e[1]);
    if (r >= 300) {
      const { error: i } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[CREATE OPERATION: ${this.table}] ${i.message}`);
    }
    return { status: r, body: null };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  byteLength(t) {
    return new TextEncoder().encode(t).byteLength;
  }
}
class P {
  config;
  table;
  id;
  constructor({
    config: t,
    table: e,
    id: r
  }) {
    this.config = t, this.table = e, this.id = r;
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
    const r = Number(e[1]);
    if (r >= 300) {
      const { error: i } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[DELETE OPERATION: ${this.table}] ${i.message}`);
    }
    return { status: r, body: null };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
}
class D {
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
      new M({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  create({ table: t, record: e }) {
    return this.operations.push(
      new A({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  delete({ table: t, id: e }) {
    return this.operations.push(
      new P({
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
const b = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (s) => {
  const t = Math.random() * 16 | 0;
  return (s == "x" ? t : t & 3 | 8).toString(16);
});
class L {
  config;
  logger;
  request;
  constructor({
    server: t,
    database: e,
    logger: r,
    request: i
  }) {
    this.config = { server: t, database: e }, this.logger = r, this.request = i;
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  async metadata(t) {
    const e = t?.$format, r = this.url(e ? `$metadata?$format=${e}` : "$metadata"), i = e ? { Accept: `application/${e}` } : void 0;
    this.log("[FileMaker] Get metadata"), this.log("Options:"), this.log(t), this.log(`URL: ${r}`);
    try {
      return (await this.request.get(r, i ? { headers: i } : void 0)).data;
    } catch (n) {
      throw l(n) && (this.log("[FileMaker] metadata: HTTP error"), this.log(n.data)), n;
    }
  }
  async subquery(t) {
    this.log(`[FileMaker] Get records from ${t.table}`), this.log("Options:"), this.log(t.options);
    const e = `${this.url(`${t.table}('${t.recordId}')/${t.path}`)}?${this.parameterize(t.options)}`;
    try {
      return (await this.getPagedCollection(e)).value;
    } catch (r) {
      throw l(r) && (this.log("[FileMaker] subquery: HTTP error"), this.log(r.data)), r;
    }
  }
  async getRecords(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log("Options:"), this.log(e);
    const r = `${this.url(t)}?${this.parameterize(e)}`;
    try {
      return (await this.getPagedCollection(r)).value;
    } catch (i) {
      throw l(i) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(i.data)), i;
    }
  }
  async getRecordsWithCount(t, e) {
    this.log(`[FileMaker] Get records with count from ${t}`), this.log("Options:"), this.log(e);
    const r = { ...e, $count: !0 }, i = `${this.url(t)}?${this.parameterize(r)}`;
    try {
      const n = await this.getPagedCollection(i);
      return {
        data: n.value,
        count: n["@odata.count"] ?? n["@count"] ?? 0
      };
    } catch (n) {
      throw l(n) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(n.data)), n;
    }
  }
  async countRecords(t, e) {
    this.log(`[FileMaker] Count records from ${t}`), this.log("Options:"), this.log(e);
    const r = `${t}/$count`, i = this.parameterizeCount(e), n = this.url(i === "" ? r : `${r}?${i}`);
    this.log(`URL: ${n}`);
    try {
      const o = await this.request.get(n, {
        responseType: "text"
      }), a = o.data.trim();
      if (!/^\d+$/.test(a))
        throw new Error(
          `Invalid count response from "${r}": ${o.data}`
        );
      const c = Number(a);
      if (!Number.isSafeInteger(c))
        throw new Error(
          `Invalid count response from "${r}": ${o.data}`
        );
      return c;
    } catch (o) {
      throw l(o) && (this.log("[FileMaker] countRecords: HTTP error"), this.log(o.data)), o;
    }
  }
  async getRecord(t, e, r) {
    this.log(`[FileMaker] Get record from ${t}`), this.log(`ID: ${e}`);
    try {
      const i = `${this.url(t)}('${encodeURIComponent(e)}')?${this.parameterize(r)}`;
      return this.log(`URL: ${i}`), (await this.request.get(i)).data;
    } catch (i) {
      throw l(i) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(i.data)), i;
    }
  }
  async getValue(t, e, r) {
    try {
      return (await this.request.get(
        `${this.url(t)}('${encodeURIComponent(e)}')/${encodeURIComponent(r)}/$value`,
        {
          responseType: "arraybuffer"
        }
      )).data;
    } catch (i) {
      throw l(i) && (this.log("[FileMaker] getValue: HTTP error"), this.log(i.data)), i;
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
    } catch (r) {
      throw l(r) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(r.data)), r;
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
    return new D(this.config, async (t) => {
      const e = `batch_${b()}`, r = `changeset_${b()}`, i = `--${e}\r
Content-Type: multipart/mixed; boundary=${r}\r
\r
` + t.map(
        (n, o) => n.toRequestBody({
          boundary: r,
          changeId: o + 1
        })
      ).join("") + `--${r}--\r
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
          (u, d) => t[d].parseResponse(u)
        );
      } catch (n) {
        throw l(n) && (this.log("[FileMaker] batch: HTTP error"), this.log(n.data)), n;
      }
    });
  }
  async script(t, e) {
    this.log(`[FileMaker] Running script ${t} with parameters:`), this.log({ scriptParameterValue: e });
    try {
      const r = await this.request.post(
        this.url(`Script.${encodeURIComponent(t)}`),
        e === void 0 ? null : { scriptParameterValue: e },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      this.log(`[FileMaker] Script ${t} finished. Response:`), this.log(r.data);
      const i = r.data.scriptResult.code === 0;
      return {
        success: i,
        data: i ? r.data.scriptResult.resultParameter : void 0
      };
    } catch (r) {
      throw l(r) && (this.log("[FileMaker] script: HTTP error"), this.log(r.data)), r;
    }
  }
  // FileMaker caps a JSON response at 10,000 records and links to the rest.
  // Returns the first page with `value` holding the records of all pages.
  async getPagedCollection(t) {
    this.log(`URL: ${t}`);
    const e = (await this.request.get(t)).data;
    if (typeof e == "string") return e;
    const r = (o) => o["@odata.nextLink"] ?? o["@nextLink"], i = [...e.value];
    let n = r(e);
    for (; n; ) {
      const o = this.resolveNextLink(n);
      this.log(`URL: ${o}`);
      const a = (await this.request.get(o)).data;
      i.push(...a.value), n = r(a);
    }
    return { ...e, value: i };
  }
  resolveNextLink(t) {
    const e = this.url(""), r = new URL(t, e);
    if (r.origin !== new URL(e).origin)
      throw new Error(
        `Refusing to follow OData next link to another origin: ${r.origin}`
      );
    return r.href;
  }
  parameterize(t) {
    if (t === void 0) return "$format=application/json";
    const e = {};
    if (t.$select !== void 0 && (e.$select = t.$select.map((i) => `"${String(i).replaceAll('"', '""')}"`).join(",")), t.$top !== void 0 && (e.$top = t.$top), t.$skip !== void 0 && (e.$skip = t.$skip), t.$filter !== void 0 && (e.$filter = t.$filter), t.$expand !== void 0 && (e.$expand = t.$expand), t.$orderby !== void 0) {
      const i = Array.isArray(t.$orderby[0]) ? t.$orderby : [t.$orderby];
      e.$orderby = i.map(([n, o]) => `"${String(n)}" ${o}`).join(",");
    }
    t.$count !== void 0 && (e.$count = t.$count ? "true" : "false");
    const r = t.$metadata ?? !0;
    return e.$format = `${t.$format === "xml" ? "application/xml" : "application/json"}${r ? "" : ";odata.metadata=none"}`, Object.entries(e).map(([i, n]) => `${i}=${n}`).join("&");
  }
  parameterizeCount(t) {
    return t?.$filter === void 0 ? "" : `$filter=${t.$filter}`;
  }
  log(t) {
    return this.logger.log(t);
  }
}
const j = (s, t) => {
  const e = Object.entries(t?.headers ?? {}).map(([r, i]) => [r.toLowerCase(), i]).sort(([r], [i]) => r < i ? -1 : r > i ? 1 : 0);
  return JSON.stringify([s, t?.responseType ?? null, e]);
}, S = (s) => ArrayBuffer.isView(s) ? s instanceof DataView ? new DataView(
  s.buffer.slice(s.byteOffset, s.byteOffset + s.byteLength)
) : Uint8Array.prototype.slice.call(s) : structuredClone(s);
class N {
  inner;
  inFlight = /* @__PURE__ */ new Map();
  constructor(t) {
    this.inner = t;
  }
  get(t, e) {
    const r = j(t, e), i = this.inFlight.get(r);
    if (i !== void 0)
      return i.then((a) => ({
        ...a,
        headers: { ...a.headers },
        data: S(a.data)
      }));
    const n = this.inner.get(t, e);
    this.inFlight.set(r, n);
    const o = () => {
      this.inFlight.get(r) === n && this.inFlight.delete(r);
    };
    return n.then(o, o), n;
  }
  post(t, e, r) {
    return this.detachInFlightReads(), this.inner.post(t, e, r);
  }
  // Any POST (batch, script) may write, so later reads must not join reads that started before it.
  detachInFlightReads() {
    this.inFlight.clear();
  }
}
class z {
  value;
  next;
  constructor(t) {
    this.value = t;
  }
}
class U {
  #t;
  #e;
  #r;
  constructor() {
    this.clear();
  }
  enqueue(t) {
    const e = new z(t);
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
function H(s) {
  let t = !1;
  if (typeof s == "object" && ({ concurrency: s, rejectOnClear: t = !1 } = s), T(s), typeof t != "boolean")
    throw new TypeError("Expected `rejectOnClear` to be a boolean");
  const e = new U();
  let r = 0;
  const i = () => {
    r < s && e.size > 0 && (r++, e.dequeue().run());
  }, n = () => {
    r--, i();
  }, o = async (u, d, p) => {
    const h = (async () => u(...p))();
    d(h);
    try {
      await h;
    } catch {
    }
    n();
  }, a = (u, d, p, h) => {
    const g = { reject: p };
    new Promise((f) => {
      g.run = f, e.enqueue(g);
    }).then(o.bind(void 0, u, d, h)), r < s && i();
  }, c = (u, ...d) => new Promise((p, h) => {
    a(u, p, h, d);
  });
  return Object.defineProperties(c, {
    activeCount: {
      get: () => r
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
        const u = AbortSignal.abort().reason;
        for (; e.size > 0; )
          e.dequeue().reject(u);
      }
    },
    concurrency: {
      get: () => s,
      set(u) {
        T(u), s = u, queueMicrotask(() => {
          for (; r < s && e.size > 0; )
            i();
        });
      }
    },
    map: {
      async value(u, d) {
        const p = [];
        try {
          Array.from(u, (h, g) => {
            const f = c(d, h, g);
            return p.push(f), f;
          });
        } catch (h) {
          for (const g of p)
            g.catch(() => {
            });
          throw h;
        }
        return Promise.all(p);
      }
    }
  }), c;
}
function T(s) {
  if (!((Number.isInteger(s) || s === Number.POSITIVE_INFINITY) && s > 0))
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
}
const X = (s) => s === 1 / 0 || typeof s == "number" && Number.isInteger(s) && s > 0;
class V {
  limit;
  constructor(t) {
    if (!X(t))
      throw new RangeError(
        "concurrency must be a positive integer or Infinity"
      );
    this.limit = H(t);
  }
  run(t) {
    return this.limit(t);
  }
}
class B {
  inner;
  limit;
  constructor(t, e) {
    this.inner = t, this.limit = e;
  }
  get(t, e) {
    return this.limit.run(() => this.inner.get(t, e));
  }
  post(t, e, r) {
    return this.limit.run(() => this.inner.post(t, e, r));
  }
}
class J {
  log(t) {
    console.dir(t, { depth: null });
  }
}
class ut {
  log() {
  }
}
const G = (s) => s !== void 0 && s !== 0 && s !== 1 / 0, v = 2147483647, _ = (s) => {
  if (!(s === void 0 || s === 0 || s === 1 / 0)) {
    if (typeof s == "number" && s > 0 && s <= v)
      return s;
    throw new RangeError(
      `timeout must be a positive number up to ${v}, 0 or Infinity`
    );
  }
};
class ct {
  server;
  database;
  agent;
  logger;
  dedupe;
  concurrencyLimit;
  timeout;
  constructor({
    server: t,
    database: e,
    agent: r,
    logger: i,
    dedupe: n = !0,
    concurrency: o,
    timeout: a
  }) {
    this.server = t, this.database = e, this.agent = r, this.logger = i ?? new J(), this.dedupe = n, this.concurrencyLimit = G(o) ? new V(o) : void 0, this.timeout = _(a);
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
    const r = new k({ username: t, password: e });
    return this.buildFileMaker(this.request(r));
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
    const r = new E({
      requestId: t,
      identifier: e
    });
    return this.buildFileMaker(this.request(r));
  }
  request(t) {
    return new R(t, this.agent, this.timeout);
  }
  buildFileMaker(t) {
    return new L({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: this.decorate(t)
    });
  }
  // Innermost first: the concurrency limit sits inside dedupe, so callers
  // sharing a deduplicated read do not take a slot.
  decorate(t) {
    let e = t;
    return this.concurrencyLimit !== void 0 && (e = new B(e, this.concurrencyLimit)), this.dedupe && (e = new N(e)), e;
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
    returnUrl: r
  }) {
    const i = this.request(new $()), n = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, o = await i.get(n, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), a = o.data, c = o.headers["x-fms-request-id"] ?? "";
    if (c === void 0 || c === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: a, requestId: c };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const r = (await this.request(new $()).get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return r !== void 0 ? r.Provider.map((i) => i.Name) : ["basic"];
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
const I = (s) => {
  if (typeof s != "string") throw new TypeError("Invalid OData string");
  return `'${s.replaceAll("'", "''")}'`;
}, Q = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/, W = (s) => {
  if (typeof s == "number") {
    if (!Number.isFinite(s)) throw new TypeError("Invalid OData number");
    return String(s);
  }
  if (typeof s != "string")
    throw new TypeError("Invalid OData number");
  const t = s.trim();
  if (!Q.test(t))
    throw new TypeError("Invalid OData number");
  const e = Number(t);
  if (!Number.isFinite(e)) throw new TypeError("Invalid OData number");
  return String(e);
}, K = /^[+-]?\d+$/, Y = (s) => {
  if (typeof s != "number" && typeof s != "string")
    throw new TypeError("Invalid OData integer");
  const t = typeof s == "number" ? String(s) : s.trim();
  if (!K.test(t))
    throw new TypeError("Invalid OData integer");
  return t;
}, Z = (s) => {
  if (typeof s != "boolean") throw new TypeError("Invalid OData boolean");
  return s ? "true" : "false";
}, tt = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, et = (s) => {
  if (typeof s != "string") throw new TypeError("Invalid OData UUID");
  if (!tt.test(s)) throw new TypeError("Invalid OData UUID");
  return I(s);
}, rt = /^[A-Za-z0-9 _-]+$/, st = (s) => {
  if (typeof s != "string")
    throw new TypeError("Invalid OData identifier");
  if (!rt.test(s))
    throw new TypeError("Invalid OData identifier");
  return `"${s}"`;
}, ht = {
  string: I,
  number: W,
  integer: Y,
  boolean: Z,
  uuid: et,
  identifier: st
};
export {
  V as ConcurrencyLimit,
  B as ConcurrencyLimitRequest,
  N as DedupeRequest,
  L as FileMaker,
  at as FileMakerAuthenticator,
  k as FileMakerBasicCredentials,
  ct as FileMakerClient,
  E as FileMakerOAuthCredentials,
  ot as FileMakerRawCredentials,
  J as Logger,
  $ as NullFileMakerCredentials,
  ut as NullLogger,
  m as RequestError,
  x as RequestTimeoutError,
  l as isRequestError,
  nt as isRequestTimeoutError,
  ht as odata
};
