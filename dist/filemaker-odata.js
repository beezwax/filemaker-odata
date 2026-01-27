import { merge as p } from "lodash";
import g, { isAxiosError as $ } from "axios";
class d extends Error {
  data;
  constructor(t, e) {
    super(t), this.name = "RequestError", this.data = e;
  }
}
const h = (o) => o instanceof d;
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
        p(
          { ...e },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
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
        p(
          { ...r },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders
          }
        )
      );
    } catch (s) {
      throw new d(
        s instanceof Error ? s.message : String(s),
        $(s) && s.response ? s.response.data : void 0
      );
    }
  }
}
class l {
  get authorizationHeaders() {
    return {};
  }
}
class m {
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
class I {
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
class M {
  server;
  database;
  request;
  constructor({ server: t, database: e }) {
    this.server = t, this.database = e, this.request = new c(new l());
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
    const s = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, a = await this.request.get(s, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), i = a.data, n = a.headers["x-fms-request-id"] ?? "";
    if (n === void 0 || n === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: i, requestId: n };
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
    const { ID: r, ...s } = this.record, a = JSON.stringify(s);
    return `--${t}\r
Content-Type: application/http\r
Content-ID: ${e}\r
\r
PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r
Content-Type: application/json\r
Content-Length: ${this.byteLength(a)}\r
\r
` + a + `\r
`;
  }
  parseResponse(t) {
    const e = /HTTP\/1.1\s+(\d+)\s/.exec(t);
    if (e === null) throw new Error("Could not find status in response");
    const r = Number(e[1]);
    if (r >= 300) {
      const { error: a } = JSON.parse(
        t.substring(t.indexOf("{")).trim()
      );
      throw new Error(`[UPDATE OPERATION: ${this.table}] ${a.message}`);
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
class T {
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
      new T({
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
const f = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (o) => {
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
      throw h(e) && (this.log("Get records HTTP error"), this.log(e.data)), e;
    }
  }
  async getRecords(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log("Options:"), this.log(e), this.log(`URL: ${this.url(t)}?${this.parameterize(e)}`);
    try {
      return (await this.request.get(`${this.url(t)}?${this.parameterize(e)}`)).data.value;
    } catch (r) {
      throw h(r) && (this.log("Get records HTTP error"), this.log(r.data)), r;
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
      throw h(s) && (this.log("Get records with count HTTP error"), this.log(s.data)), s;
    }
  }
  async getRecord(t, e) {
    this.log(`[FileMaker] Get records from ${t}`), this.log(`ID: ${e}`);
    try {
      return (await this.request.get(
        `${this.url(t)}('${encodeURIComponent(e)}')`
      )).data;
    } catch (r) {
      throw h(r) && this.log(r.data), r;
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
      throw h(s) && this.log(s.data), s;
    }
  }
  async crossjoin({
    tables: t,
    $filter: e,
    $expand: r
  }) {
    try {
      return (await this.request.get(
        `${this.url("$crossjoin")}(${t.join(",")})?$filter=${e}&$expand=${r}`,
        {
          headers: {
            Accept: "application/atom+xml"
          }
        }
      )).data;
    } catch (s) {
      throw h(s) && this.log(s.data), s;
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
      const e = `batch_${f()}`, r = `changeset_${f()}`, s = `--${e}\r
Content-Type: multipart/mixed; boundary=${r}\r
\r
` + t.map(
        (a, i) => a.toRequestBody({
          boundary: r,
          changeId: i + 1
        })
      ).join("") + `--${r}--\r
--${e}--\r
`;
      try {
        const a = await this.request.post(
          this.url("$batch"),
          s,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${e}`
            }
          }
        ), i = /boundary=(.+?)\r\n/.exec(a.data);
        if (i === null) throw new Error("Could not find changeset");
        const n = i[0].split("=")[1].trim();
        return a.data.split(`--${n}`).slice(1, -1).map(
          (y, b) => t[b].parseResponse(y)
        );
      } catch (a) {
        throw h(a) && this.log(a.data), a;
      }
    });
  }
  async script(t, e) {
    this.log(`[FileMaker] Running script ${t} with parameters:`), this.log({ scriptParameterValue: e });
    const r = await this.request.post(
      this.url(`Script.${encodeURIComponent(t)}`),
      e === void 0 ? null : { scriptParameterValue: e },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    this.log(`[FileMaker] Script ${t} finished. Response:`), this.log(r);
    const s = r.data.scriptResult.code === 0;
    return {
      success: s,
      data: s ? r.data.scriptResult.resultParameter : void 0
    };
  }
  parameterize(t) {
    if (t === void 0) return "";
    const e = {};
    return t.$select !== void 0 && (e.$select = t.$select.map((r) => r === "ID" ? '"ID"' : r).join(",")), t.$top !== void 0 && (e.$top = t.$top), t.$skip !== void 0 && (e.$skip = t.$skip), t.$filter !== void 0 && (e.$filter = t.$filter), t.$expand !== void 0 && (e.$expand = t.$expand), t.$orderby !== void 0 && (e.$orderby = encodeURIComponent(t.$orderby.join(" "))), t.$count !== void 0 && (e.$count = t.$count ? "true" : "false"), Object.entries(e).map(([r, s]) => `${r}=${s}`).join("&");
  }
  log(t) {
    return this.logger.log(t);
  }
}
class C {
  log(t) {
    console.dir(t, { depth: null });
  }
}
class E {
  log() {
  }
}
class F {
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
    this.server = t, this.database = e, this.agent = r, this.logger = s ?? new C();
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
    const r = new x({ username: t, password: e }), s = new c(r, this.agent);
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
    const r = new m({
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
    const s = new c(new l(), this.agent), a = `https://${this.server}/oauth/getoauthurl?trackingID=${t}&provider=${e}&address=${this.server}&X-FMS-OAuth-AuthType=2`, i = await s.get(a, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": r ?? `https://${this.server}/oauth-handler`
      }
    }), n = i.data, u = i.headers["x-fms-request-id"] ?? "";
    if (u === void 0 || u === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker'
      );
    return { redirectUrl: n, requestId: u };
  }
  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes() {
    const r = (await new c(new l(), this.agent).get(
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
export {
  w as FileMaker,
  M as FileMakerAuthenticator,
  x as FileMakerBasicCredentials,
  F as FileMakerClient,
  m as FileMakerOAuthCredentials,
  I as FileMakerRawCredentials,
  C as Logger,
  l as NullFileMakerCredentials,
  E as NullLogger
};
