import g, { isAxiosError as $ } from "axios";
class d extends Error {
  data;
  constructor(t, e) {
    super(t), this.name = "RequestError", this.data = e;
  }
}
const a = (o) => o instanceof d, f = (o) => typeof o == "object" && o !== null && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype, l = (o, t) => {
  const e = { ...o };
  for (const r of Object.keys(t)) {
    const s = t[r];
    if (s === void 0) continue;
    const n = e[r];
    e[r] = f(n) && f(s) ? l(n, s) : s;
  }
  return e;
};
class c {
  credentials;
  agent;
  constructor(t, e) {
    this.credentials = t, this.agent = e;
  }
  async get(t, e) {
    try {
      return await g.get(
        t,
        l({ ...e }, {
          httpsAgent: this.agent,
          headers: this.credentials.authorizationHeaders
        })
      );
    } catch (r) {
      throw new d(
        r instanceof Error ? r.message : String(r),
        $(r) && r.response ? r.response.data : void 0
      );
    }
  }
  async post(t, e, r) {
    try {
      return await g.post(
        t,
        e,
        l({ ...r }, {
          httpsAgent: this.agent,
          headers: this.credentials.authorizationHeaders
        })
      );
    } catch (s) {
      throw new d(
        s instanceof Error ? s.message : String(s),
        $(s) && s.response ? s.response.data : void 0
      );
    }
  }
}
class p {
  get authorizationHeaders() {
    return {};
  }
}
class x {
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
class O {
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
class U {
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
class H {
  server;
  database;
  request;
  constructor({ server: t, database: e }) {
    this.server = t, this.database = e, this.request = new c(new p());
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
    const n = await this.request.get(s, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), i = n.data, h = n.headers["x-fms-request-id"] ?? "";
    if (h === void 0 || h === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: i, requestId: h };
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
    const { ID: r, ...s } = this.record, n = JSON.stringify(s);
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
class R {
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
class q {
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
class M {
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
      new R({
        config: this.config,
        table: t,
        record: e
      })
    ), this;
  }
  delete({ table: t, id: e }) {
    return this.operations.push(
      new q({
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
const y = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (o) => {
  const t = Math.random() * 16 | 0;
  return (o == "x" ? t : t & 3 | 8).toString(16);
});
class w {
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
  async metadata() {
    return (await this.request.get(this.url("$metadata"))).data;
  }
  async subquery(t) {
    this.log(`[FileMaker] Get records from ${t.table}`), this.log("Options:"), this.log(t.options), this.log(
      `URL: ${this.url(`${t.table}('${t.recordId}')/${t.path}`)}?${this.parameterize(t.options)}`
    );
    try {
      return (await this.request.get(
        `${this.url(`${t.table}('${t.recordId}')/${t.path}`)}?${this.parameterize(t.options)}`
      )).data.value;
    } catch (e) {
      throw a(e) && (this.log("[FileMaker] subquery: HTTP error"), this.log(e.data)), e;
    }
  }
  async getRecords(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log("Options:"), this.log(e), this.log(`URL: ${this.url(t)}?${this.parameterize(e)}`);
    try {
      return (await this.request.get(`${this.url(t)}?${this.parameterize(e)}`)).data.value;
    } catch (r) {
      throw a(r) && (this.log("[FileMaker] getRecords: HTTP error"), this.log(r.data)), r;
    }
  }
  async getRecordsWithCount(t, e) {
    this.log(`[FileMaker] Get records with count from ${t}`), this.log("Options:"), this.log(e);
    const r = { ...e, $count: !0 };
    this.log(`URL: ${this.url(t)}?${this.parameterize(r)}`);
    try {
      const s = await this.request.get(`${this.url(t)}?${this.parameterize(r)}`);
      return {
        data: s.data.value,
        count: s.data["@odata.count"] ?? 0
      };
    } catch (s) {
      throw a(s) && (this.log("[FileMaker] getRecordsWithCount: HTTP error"), this.log(s.data)), s;
    }
  }
  async getRecord(t, e, r) {
    this.log(`[FileMaker] Get record from ${t}`), this.log(`ID: ${e}`);
    try {
      const s = `${this.url(t)}('${encodeURIComponent(e)}')?${this.parameterize(r)}`;
      return this.log(`URL: ${s}`), (await this.request.get(s)).data;
    } catch (s) {
      throw a(s) && (this.log("[FileMaker] getRecord: HTTP error"), this.log(s.data)), s;
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
      throw a(s) && (this.log("[FileMaker] getValue: HTTP error"), this.log(s.data)), s;
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
      throw a(r) && (this.log("[FileMaker] crossjoin: HTTP error"), this.log(r.data)), r;
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
    return new M(this.config, async (t) => {
      const e = `batch_${y()}`, r = `changeset_${y()}`, s = `--${e}\r
Content-Type: multipart/mixed; boundary=${r}\r
\r
` + t.map(
        (n, i) => n.toRequestBody({
          boundary: r,
          changeId: i + 1
        })
      ).join("") + `--${r}--\r
--${e}--\r
`;
      try {
        const n = await this.request.post(
          this.url("$batch"),
          s,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${e}`
            }
          }
        ), i = /boundary=(.+?)\r\n/.exec(n.data);
        if (i === null) throw new Error("Could not find changeset");
        const h = i[0].split("=")[1].trim();
        return n.data.split(`--${h}`).slice(1, -1).map(
          (m, T) => t[T].parseResponse(m)
        );
      } catch (n) {
        throw a(n) && (this.log("[FileMaker] batch: HTTP error"), this.log(n.data)), n;
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
      throw a(r) && (this.log("[FileMaker] script: HTTP error"), this.log(r.data)), r;
    }
  }
  parameterize(t) {
    if (t === void 0) return "$format=application/json";
    const e = {};
    if (t.$select !== void 0 && (e.$select = t.$select.map((s) => `"${String(s).replaceAll('"', '""')}"`).join(",")), t.$top !== void 0 && (e.$top = t.$top), t.$skip !== void 0 && (e.$skip = t.$skip), t.$filter !== void 0 && (e.$filter = t.$filter), t.$expand !== void 0 && (e.$expand = t.$expand), t.$orderby !== void 0) {
      const s = Array.isArray(t.$orderby[0]) ? t.$orderby : [t.$orderby];
      e.$orderby = s.map(([n, i]) => `"${String(n)}" ${i}`).join(",");
    }
    t.$count !== void 0 && (e.$count = t.$count ? "true" : "false");
    const r = t.$metadata ?? !0;
    return e.$format = `${t.$format === "xml" ? "application/xml" : "application/json"}${r ? "" : ";odata.metadata=none"}`, Object.entries(e).map(([s, n]) => `${s}=${n}`).join("&");
  }
  log(t) {
    return this.logger.log(t);
  }
}
class A {
  log(t) {
    console.dir(t, { depth: null });
  }
}
class L {
  log() {
  }
}
class N {
  server;
  database;
  agent;
  logger;
  constructor({
    server: t,
    database: e,
    agent: r,
    logger: s
  }) {
    this.server = t, this.database = e, this.agent = r, this.logger = s ?? new A();
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
    const r = new O({ username: t, password: e }), s = new c(r, this.agent);
    return new w({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: s
    });
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
    const r = new x({
      requestId: t,
      identifier: e
    }), s = new c(r, this.agent);
    return new w({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: s
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
    const s = new c(new p(), this.agent), n = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, i = await s.get(n, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), h = i.data, u = i.headers["x-fms-request-id"] ?? "";
    if (u === void 0 || u === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: h, requestId: u };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const r = (await new c(new p(), this.agent).get(
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
const b = (o) => {
  if (typeof o != "string") throw new TypeError("Invalid OData string");
  return `'${o.replaceAll("'", "''")}'`;
}, F = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/, I = (o) => {
  if (typeof o == "number") {
    if (!Number.isFinite(o)) throw new TypeError("Invalid OData number");
    return String(o);
  }
  if (typeof o != "string")
    throw new TypeError("Invalid OData number");
  const t = o.trim();
  if (!F.test(t))
    throw new TypeError("Invalid OData number");
  const e = Number(t);
  if (!Number.isFinite(e)) throw new TypeError("Invalid OData number");
  return String(e);
}, E = /^[+-]?\d+$/, k = (o) => {
  if (typeof o != "number" && typeof o != "string")
    throw new TypeError("Invalid OData integer");
  const t = typeof o == "number" ? String(o) : o.trim();
  if (!E.test(t))
    throw new TypeError("Invalid OData integer");
  return t;
}, C = (o) => {
  if (typeof o != "boolean") throw new TypeError("Invalid OData boolean");
  return o ? "true" : "false";
}, D = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, P = (o) => {
  if (typeof o != "string") throw new TypeError("Invalid OData UUID");
  if (!D.test(o)) throw new TypeError("Invalid OData UUID");
  return b(o);
}, S = /^[A-Za-z0-9 _-]+$/, j = (o) => {
  if (typeof o != "string")
    throw new TypeError("Invalid OData identifier");
  if (!S.test(o))
    throw new TypeError("Invalid OData identifier");
  return `"${o}"`;
}, X = {
  string: b,
  number: I,
  integer: k,
  boolean: C,
  uuid: P,
  identifier: j
};
export {
  w as FileMaker,
  H as FileMakerAuthenticator,
  O as FileMakerBasicCredentials,
  N as FileMakerClient,
  x as FileMakerOAuthCredentials,
  U as FileMakerRawCredentials,
  A as Logger,
  p as NullFileMakerCredentials,
  L as NullLogger,
  X as odata
};
