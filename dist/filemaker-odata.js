import g, { isAxiosError as f } from "axios";
class l extends Error {
  data;
  constructor(t, e) {
    super(t), this.name = "RequestError", this.data = e;
  }
}
const c = (n) => n instanceof l, $ = (n) => typeof n == "object" && n !== null && !Array.isArray(n) && Object.getPrototypeOf(n) === Object.prototype, d = (n, t) => {
  const e = { ...n };
  for (const r of Object.keys(t)) {
    const s = t[r];
    if (s === void 0) continue;
    const i = e[r];
    e[r] = $(i) && $(s) ? d(i, s) : s;
  }
  return e;
};
class u {
  credentials;
  agent;
  constructor(t, e) {
    this.credentials = t, this.agent = e;
  }
  async get(t, e) {
    try {
      return await g.get(
        t,
        d({ ...e }, {
          httpsAgent: this.agent,
          headers: this.credentials.authorizationHeaders
        })
      );
    } catch (r) {
      throw new l(
        r instanceof Error ? r.message : String(r),
        f(r) && r.response ? r.response.data : void 0
      );
    }
  }
  async post(t, e, r) {
    try {
      return await g.post(
        t,
        e,
        d({ ...r }, {
          httpsAgent: this.agent,
          headers: this.credentials.authorizationHeaders
        })
      );
    } catch (s) {
      throw new l(
        s instanceof Error ? s.message : String(s),
        f(s) && s.response ? s.response.data : void 0
      );
    }
  }
}
class p {
  get authorizationHeaders() {
    return {};
  }
}
class T {
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
class x {
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
class z {
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
class X {
  server;
  database;
  request;
  constructor({ server: t, database: e }) {
    this.server = t, this.database = e, this.request = new u(new p());
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
    const s = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    console.log(s), console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    });
    const i = await this.request.get(s, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), o = i.data, a = i.headers["x-fms-request-id"] ?? "";
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
class v {
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
    const { ID: r, ...s } = this.record, i = JSON.stringify(s);
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(i)}\r
\r
` + i + `\r
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
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${i.message}`);
    }
    const s = JSON.parse(t.substring(t.indexOf("{")).trim());
    return { status: r, body: s };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  byteLength(t) {
    return new TextEncoder().encode(t).byteLength;
  }
}
class O {
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
      const { error: s } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[CREATE OPERATION: ${this.table}] ${s.message}`);
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
class F {
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
      const { error: s } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[DELETE OPERATION: ${this.table}] ${s.message}`);
    }
    return { status: r, body: null };
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
}
class R {
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
      new v({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  create({ table: t, record: e }) {
    return this.operations.push(
      new O({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  delete({ table: t, id: e }) {
    return this.operations.push(
      new F({
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
const y = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (n) => {
  const t = Math.random() * 16 | 0;
  return (n == "x" ? t : t & 3 | 8).toString(16);
});
class k {
  config;
  logger;
  request;
  constructor({
    server: t,
    database: e,
    logger: r,
    request: s
  }) {
    this.config = { server: t, database: e }, this.logger = r, this.request = s;
  }
  url(t) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${t}`;
  }
  async metadata(t) {
    const e = t?.$format, r = this.url(e ? `$metadata?$format=${e}` : "$metadata"), s = e ? { Accept: `application/${e}` } : void 0;
    this.log("[FileMaker] Get metadata"), this.log("Options:"), this.log(t), this.log(`URL: ${r}`);
    try {
      return (await this.request.get(r, s ? { headers: s } : void 0)).data;
    } catch (i) {
      throw c(i) && (this.log("[FileMaker] metadata: HTTP error"), this.log(i.data)), i;
    }
  }
  async subquery(t) {
    this.log(`[FileMaker] Get records from ${t.table}`), this.log("Options:"), this.log(t.options);
    const e = `${this.url(`${t.table}('${t.recordId}')/${t.path}`)}?${this.parameterize(t.options)}`;
    try {
      return (await this.getPagedCollection(e)).value;
    } catch (r) {
      throw c(r) && (this.log("[FileMaker] subquery: HTTP error"), this.log(r.data)), r;
    }
  }
  async getRecords(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log("Options:"), this.log(e);
    const r = `${this.url(t)}?${this.parameterize(e)}`;
    try {
      return (await this.getPagedCollection(r)).value;
    } catch (s) {
      throw c(s) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(s.data)), s;
    }
  }
  async getRecordsWithCount(t, e) {
    this.log(`[FileMaker] Get records with count from ${t}`), this.log("Options:"), this.log(e);
    const r = { ...e, $count: !0 }, s = `${this.url(t)}?${this.parameterize(r)}`;
    try {
      const i = await this.getPagedCollection(s);
      return {
        data: i.value,
        count: i["@odata.count"] ?? i["@count"] ?? 0
      };
    } catch (i) {
      throw c(i) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(i.data)), i;
    }
  }
  async countRecords(t, e) {
    this.log(`[FileMaker] Count records from ${t}`), this.log("Options:"), this.log(e);
    const r = `${t}/$count`, s = this.parameterizeCount(e), i = this.url(s === "" ? r : `${r}?${s}`);
    this.log(`URL: ${i}`);
    try {
      const o = await this.request.get(i, {
        responseType: "text"
      }), a = o.data.trim();
      if (!/^\d+$/.test(a))
        throw new Error(
          `Invalid count response from "${r}": ${o.data}`
        );
      const h = Number(a);
      if (!Number.isSafeInteger(h))
        throw new Error(
          `Invalid count response from "${r}": ${o.data}`
        );
      return h;
    } catch (o) {
      throw c(o) && (this.log("[FileMaker] countRecords: HTTP error"), this.log(o.data)), o;
    }
  }
  async getRecord(t, e, r) {
    this.log(`[FileMaker] Get record from ${t}`), this.log(`ID: ${e}`);
    try {
      const s = `${this.url(t)}('${encodeURIComponent(e)}')?${this.parameterize(r)}`;
      return this.log(`URL: ${s}`), (await this.request.get(s)).data;
    } catch (s) {
      throw c(s) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(s.data)), s;
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
    } catch (s) {
      throw c(s) && (this.log("[FileMaker] getValue: HTTP error"), this.log(s.data)), s;
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
      throw c(r) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(r.data)), r;
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
    return new R(this.config, async (t) => {
      const e = `batch_${y()}`, r = `changeset_${y()}`, s = `--${e}\r
Content-Type: multipart/mixed; boundary=${r}\r
\r
` + t.map(
        (i, o) => i.toRequestBody({
          boundary: r,
          changeId: o + 1
        })
      ).join("") + `--${r}--\r
--${e}--\r
`;
      try {
        const i = await this.request.post(
          this.url("$batch"),
          s,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${e}`
            }
          }
        ), o = /boundary=(.+?)\r\n/.exec(i.data);
        if (o === null) throw new Error("Could not find changeset");
        const a = o[0].split("=")[1].trim();
        return i.data.split(`--${a}`).slice(1, -1).map(
          (m, b) => t[b].parseResponse(m)
        );
      } catch (i) {
        throw c(i) && (this.log("[FileMaker] batch: HTTP error"), this.log(i.data)), i;
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
      const s = r.data.scriptResult.code === 0;
      return {
        success: s,
        data: s ? r.data.scriptResult.resultParameter : void 0
      };
    } catch (r) {
      throw c(r) && (this.log("[FileMaker] script: HTTP error"), this.log(r.data)), r;
    }
  }
  // FileMaker caps a JSON response at 10,000 records and links to the rest.
  // Returns the first page with `value` holding the records of all pages.
  async getPagedCollection(t) {
    this.log(`URL: ${t}`);
    const e = (await this.request.get(t)).data;
    if (typeof e == "string") return e;
    const r = (o) => o["@odata.nextLink"] ?? o["@nextLink"], s = [...e.value];
    let i = r(e);
    for (; i; ) {
      const o = this.resolveNextLink(i);
      this.log(`URL: ${o}`);
      const a = (await this.request.get(o)).data;
      s.push(...a.value), i = r(a);
    }
    return { ...e, value: s };
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
    if (t.$select !== void 0 && (e.$select = t.$select.map((s) => `"${String(s).replaceAll('"', '""')}"`).join(",")), t.$top !== void 0 && (e.$top = t.$top), t.$skip !== void 0 && (e.$skip = t.$skip), t.$filter !== void 0 && (e.$filter = t.$filter), t.$expand !== void 0 && (e.$expand = t.$expand), t.$orderby !== void 0) {
      const s = Array.isArray(t.$orderby[0]) ? t.$orderby : [t.$orderby];
      e.$orderby = s.map(([i, o]) => `"${String(i)}" ${o}`).join(",");
    }
    t.$count !== void 0 && (e.$count = t.$count ? "true" : "false");
    const r = t.$metadata ?? !0;
    return e.$format = `${t.$format === "xml" ? "application/xml" : "application/json"}${r ? "" : ";odata.metadata=none"}`, Object.entries(e).map(([s, i]) => `${s}=${i}`).join("&");
  }
  parameterizeCount(t) {
    return t?.$filter === void 0 ? "" : `$filter=${t.$filter}`;
  }
  log(t) {
    return this.logger.log(t);
  }
}
const M = (n, t) => {
  const e = Object.entries(t?.headers ?? {}).map(([r, s]) => [r.toLowerCase(), s]).sort(([r], [s]) => r < s ? -1 : r > s ? 1 : 0);
  return JSON.stringify([n, t?.responseType ?? null, e]);
}, C = (n) => ArrayBuffer.isView(n) ? n instanceof DataView ? new DataView(
  n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength)
) : Uint8Array.prototype.slice.call(n) : structuredClone(n);
class I {
  inner;
  inFlight = /* @__PURE__ */ new Map();
  constructor(t) {
    this.inner = t;
  }
  get(t, e) {
    const r = M(t, e), s = this.inFlight.get(r);
    if (s !== void 0)
      return s.then((a) => ({
        ...a,
        headers: { ...a.headers },
        data: C(a.data)
      }));
    const i = this.inner.get(t, e);
    this.inFlight.set(r, i);
    const o = () => {
      this.inFlight.get(r) === i && this.inFlight.delete(r);
    };
    return i.then(o, o), i;
  }
  post(t, e, r) {
    return this.detachInFlightReads(), this.inner.post(t, e, r);
  }
  // Any POST (batch, script) may write, so later reads must not join reads that started before it.
  detachInFlightReads() {
    this.inFlight.clear();
  }
}
class A {
  log(t) {
    console.dir(t, { depth: null });
  }
}
class V {
  log() {
  }
}
class B {
  server;
  database;
  agent;
  logger;
  dedupe;
  constructor({
    server: t,
    database: e,
    agent: r,
    logger: s,
    dedupe: i = !0
  }) {
    this.server = t, this.database = e, this.agent = r, this.logger = s ?? new A(), this.dedupe = i;
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
    const r = new x({ username: t, password: e });
    return this.buildFileMaker(new u(r, this.agent));
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
    const r = new T({
      requestId: t,
      identifier: e
    });
    return this.buildFileMaker(new u(r, this.agent));
  }
  buildFileMaker(t) {
    return new k({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: this.dedupe ? new I(t) : t
    });
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
    const s = new u(new p(), this.agent), i = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, o = await s.get(i, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), a = o.data, h = o.headers["x-fms-request-id"] ?? "";
    if (h === void 0 || h === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: a, requestId: h };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const r = (await new u(new p(), this.agent).get(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )).data.data;
    return r !== void 0 ? r.Provider.map((s) => s.Name) : ["basic"];
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
const w = (n) => {
  if (typeof n != "string") throw new TypeError("Invalid OData string");
  return `'${n.replaceAll("'", "''")}'`;
}, q = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/, E = (n) => {
  if (typeof n == "number") {
    if (!Number.isFinite(n)) throw new TypeError("Invalid OData number");
    return String(n);
  }
  if (typeof n != "string")
    throw new TypeError("Invalid OData number");
  const t = n.trim();
  if (!q.test(t))
    throw new TypeError("Invalid OData number");
  const e = Number(t);
  if (!Number.isFinite(e)) throw new TypeError("Invalid OData number");
  return String(e);
}, D = /^[+-]?\d+$/, P = (n) => {
  if (typeof n != "number" && typeof n != "string")
    throw new TypeError("Invalid OData integer");
  const t = typeof n == "number" ? String(n) : n.trim();
  if (!D.test(t))
    throw new TypeError("Invalid OData integer");
  return t;
}, L = (n) => {
  if (typeof n != "boolean") throw new TypeError("Invalid OData boolean");
  return n ? "true" : "false";
}, S = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, j = (n) => {
  if (typeof n != "string") throw new TypeError("Invalid OData UUID");
  if (!S.test(n)) throw new TypeError("Invalid OData UUID");
  return w(n);
}, U = /^[A-Za-z0-9 _-]+$/, H = (n) => {
  if (typeof n != "string")
    throw new TypeError("Invalid OData identifier");
  if (!U.test(n))
    throw new TypeError("Invalid OData identifier");
  return `"${n}"`;
}, J = {
  string: w,
  number: E,
  integer: P,
  boolean: L,
  uuid: j,
  identifier: H
};
export {
  I as DedupeRequest,
  k as FileMaker,
  X as FileMakerAuthenticator,
  x as FileMakerBasicCredentials,
  B as FileMakerClient,
  T as FileMakerOAuthCredentials,
  z as FileMakerRawCredentials,
  A as Logger,
  p as NullFileMakerCredentials,
  V as NullLogger,
  J as odata
};
