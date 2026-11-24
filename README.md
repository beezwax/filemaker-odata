# FileMaker OData

This is a TypeScript/JavaScript library to connect to FileMaker's OData API
from Node and browsers.

This version is unstable. The API changes often and updates may break
backwards compatibility.

# Usage

Install it with:

    npm i beezwax/filemaker-odata

Then import it:

```typescript
import { FileMakerClient } from "filemaker-odata";
```

## Basic authentication

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
});

const fm = client.withBasicAuth({
  username: "my-user",
  password: "my-pass",
});

// Now use the fm instance to make requests
const records = await fm.getRecords("MY_TABLE");
```

When results exceed FileMaker's 10,000-record limit per response, the library
fetches every page. Use `$top` to limit results. See [Paging](./API.md#paging).

For documentation on the `fm` instance see the [API](./API.md) documentation.

## OData filter input

Raw OData query strings are still supported for compatibility:

```typescript
const records = await fm.getRecords("Customers", {
  $filter: "NAME eq 'Beezwax'",
});
```

When you interpolate user input, use the exported `odata` helpers to build
OData literals or validate identifiers:

```typescript
import { FileMakerClient, odata } from "filemaker-odata";

const records = await fm.getRecords("Customers", {
  $filter: `${odata.identifier("NAME")} eq ${odata.string(userInput)}`,
});
```

Each helper fits one context. `odata.string()` builds an OData string literal.
It does not escape a whole filter expression. Identifiers, numbers, booleans,
and UUIDs have their own helpers:

```typescript
const records = await fm.getRecords("Customers", {
  $filter: `${odata.identifier("AGE")} ge ${odata.integer(minAge)}`,
});
```

The helpers do not change how the library serializes queries by default. Do not
put raw untrusted text into a complete `$filter` string.

## OAuth authentication

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
});

// Step 1: Get OAuth URL
const { redirectUrl, requestId } = await client.getOAuthUrl({
  trackingId: "unique-tracking-id", // Can be anything, passed back in redirect
  provider: "Google", // Whatever OAuth provider FileMaker is configured to use
  // If your FileMaker server is on a different server than the web app, see
  // section on "oauth-handler"
  returnUrl: "https://demo.server.beezwax.net/my-web-app/oauth-callback",
});

// Step 2: Save requestId (e.g., in session storage)
const session = getSession();
session.requestId = requestId;
await session.save();

// Step 3: Redirect user to redirectUrl
// User authenticates with OAuth provider...

// Step 4: In your OAuth callback route
const session = await getSession();
const identifier = req.query.get("identifier"); // From OAuth redirect
const requestId = session.requestId;

// Step 5: Create authenticated FileMaker instance
const fm = client.withOAuth({ requestId, identifier });

// Now use the fm instance to make requests
const records = await fm.getRecords("MY_TABLE");
```

### Get available authentication types

To check which authentication providers are available, call
`client.getAuthTypes()`:

```typescript
// types will be something like ["basic", "Google"]
const types = await client.getAuthTypes();
```

### OAuth-handler

When the FileMaker server and the web server are on different hosts, FileMaker
does not allow the OAuth redirect to return to the web server.

`oauth-handler` (TODO: Link to repo) solves this. It is a proxy that runs on
your FileMaker server and can redirect back to any other host.

Without it, the authentication flow is web server, FileMaker, web server. With
it, the flow is web server, FileMaker, FileMaker `oauth-handler`, web server.

The handler uses the `trackingId` as the URL to redirect back to. Instead of
this:

```typescript
const { redirectUrl, requestId } = await client.getOAuthUrl({
  trackingId: "unique-tracking-id",
  provider: "MyProvider",
  // Won't work! Different servers
  returnUrl: "https://my-web-app.com/sessions/oauth",
});
```

do this:

```typescript
const { redirectUrl, requestId } = await client.getOAuthUrl({
  // OAuth Handler will use this to redirect
  trackingId: "https://my-web-app.com/sessions/oauth",
  provider: "MyProvider",
  // Redirect back to oauth-handler first
  returnUrl: "https://my.filemaker.server.com/oauth-handler",
});
```

For setup instructions see the `oauth-handler` repository's README.

`oauth-handler` also lets you authenticate on `localhost` during development.

## Custom HTTPS agent

Some FileMaker servers have self-signed certificates. If you trust such a
server, pass a custom `Agent` to skip the certificate check:

```typescript
import { Agent } from "https";

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "example",
  // Pass custom agent here
  agent: new Agent({ rejectUnauthorized: false }),
});
```

## Custom logger

To write logs somewhere else, such as a file, implement `ILogger`:

```typescript
import { ILogger, FileMakerClient } from "filemaker-odata";

class CustomLogger implements ILogger {
  log(message: unknown) {
    console.log("[FileMaker]", message);
    // Write to a file...
  }
}

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  logger: new CustomLogger(),
});
```

Use `NullLogger` to disable logging:

```typescript
import { NullLogger, FileMakerClient } from "filemaker-odata";

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  logger: new NullLogger(),
});
```

## Request deduplication

When several read requests run at the same time on one `FileMaker` instance with the
same URL, response type, and request headers, the library sends one HTTP request and
every caller gets the result. Each caller receives its own copy of the data. The library
keeps nothing in memory after the request completes, so this is not a cache.

POST requests such as `batch().execute()` and `script()` are never deduplicated. A read
request that starts after a write has started sends a new HTTP request. Each `FileMaker`
instance has its own deduplication, so different users (for example different instances
created with `withBasicAuth`) never share requests.

`FileMakerClient` enables deduplication by default. To disable it:

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  dedupe: false,
});
```

A `FileMaker` you construct yourself does not deduplicate. To turn it on, wrap
its request in `DedupeRequest`:

```typescript
const fm = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request: new DedupeRequest(request),
});
```

## Request concurrency limit

`concurrency` sets the maximum number of HTTP requests a `FileMakerClient` sends to
FileMaker Server at the same time. Extra requests wait in a queue and start in the order
they were made (first in, first out). This keeps many parallel queries, for example
with `Promise.all`, from overloading the server.

By default there is no limit. Leaving `concurrency` out, or passing `undefined`, `0`, or
`Infinity`, means no limit. Any other value must be a positive integer. Anything else, for
example `-1`, `1.5`, or `NaN`, throws a `RangeError` when the client is created.

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  concurrency: 2,
});
```

Every `FileMaker` the client creates shares the limit, including every
`withBasicAuth` and `withOAuth` call.

Every HTTP request takes one slot: reads, `batch().execute()`, `script()`, and each extra
page that `getRecords` loads when following next links. A request that fails frees its slot
right away. Reads shared by request deduplication do not take an extra slot.
`getOAuthUrl()` and `getAuthTypes()` are not limited.

A `FileMaker` you construct yourself is not limited. To limit it, wrap its request in
`ConcurrencyLimitRequest`. If you also use deduplication, put the limit inside
`DedupeRequest`:

```typescript
import {
  ConcurrencyLimit,
  ConcurrencyLimitRequest,
  DedupeRequest,
  FileMaker,
} from "filemaker-odata";

const limit = new ConcurrencyLimit(2);

const fm = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request: new DedupeRequest(new ConcurrencyLimitRequest(request, limit)),
});
```

`ConcurrencyLimitRequest` takes a `ConcurrencyLimit`. To share one limit between several
`FileMaker` instances, pass the same `ConcurrencyLimit` to each `ConcurrencyLimitRequest`.
`ConcurrencyLimit` accepts only a positive integer or `Infinity`.

## Request timeout

`timeout` sets how long, in milliseconds, a `FileMakerClient` waits for response data.
A request fails when no response data arrives for `timeout` ms. The timer starts when
the request is sent and restarts each time data arrives, so a response that keeps sending
data is not cut off. This works the same in Node and browsers. The library checks
progress about three times per second, so use a timeout of at least one second.

The timer applies to every request the client makes, including each page that
`getRecords` follows. Time spent waiting in the `concurrency` queue does not count.

By default there is no timeout. Leaving `timeout` out, or passing `undefined`, `0`, or
`Infinity`, means no timeout. Any other value must be a positive number up to
`2147483647`, the largest delay JavaScript timers support. Anything else, for example
`-1`, `NaN`, or `2147483648`, throws a `RangeError` when the client is created.

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  timeout: 5 * 60 * 1000, // 5 minutes
});
```

A timed-out request rejects with a `RequestTimeoutError`, which is a subclass of
`RequestError`. Use the `isRequestTimeoutError` guard to detect it:

```typescript
import { FileMakerClient, isRequestTimeoutError } from "filemaker-odata";

try {
  const records = await client.getRecords("Invoices");
} catch (error) {
  if (isRequestTimeoutError(error)) {
    console.log(`Timed out after ${error.timeout} ms`);
  } else {
    throw error;
  }
}
```

A script or batch that runs on the server longer than the timeout fails on the client,
but FileMaker can still finish the work. Pick a timeout longer than your slowest script.

## Request retries

A proxy in front of FileMaker Server, such as a gateway or a security proxy, sometimes
answers with a generic `500 Internal Server Error` page for no lasting reason. A
`FileMakerClient` retries such failures once by default.

Reads (GET) only read data, so the client retries them on any transient failure:

- a `500`, `502`, `503`, or `504` response,
- a connection that could not be made (refused, host or network unreachable, DNS failure),
- a connection that failed after the request was sent (reset, aborted, or a browser network
  error), including one that drops while the response is still arriving,
- a request that hit the client's `timeout`.

Scripts and batches (POST) can write data, so the client retries them only when the request
most likely never ran in FileMaker:

- a `500` or `503` proxy error page, meaning a response that is HTML or has no content type,
- a connection that could not be made (refused, host or network unreachable, DNS failure).

The client does not retry a POST in these cases, because FileMaker may have run it already:

- the error response is not HTML (JSON, XML, plain text, and so on),
- the request timed out,
- the connection failed after the request was sent,
- the response is a `502` or `504`. The proxy may have forwarded the request to FileMaker
  and then lost the connection or stopped waiting for the answer.

This reduces the chance of running a request twice, but it does not remove it. A proxy can
forward a request and still answer with an HTML `500`. The client never retries other
errors, such as `400` or `404`.

The first retry waits 250 to 500 ms. Each later retry waits twice as long, up to 30 s.
Each attempt gets its own `timeout`. A request keeps its `concurrency` slot while it waits,
and callers sharing a deduplicated read share its retries. When retries run out, the client
throws the last error. The client logs each retry with its `logger`.

`retries` sets how many times the client retries a failed request. It defaults to `1`. Pass
`0` to turn retries off. Any other value must be a non-negative integer, or the constructor
throws a `RangeError`.

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  retries: 2,
});
```

A `FileMaker` you construct yourself does not retry. To turn retries on, wrap its request
in `RetryRequest`. When you also use `ConcurrencyLimitRequest` and `DedupeRequest`, put
`RetryRequest` inside them:

```typescript
import { DedupeRequest, FileMaker, RetryRequest } from "filemaker-odata";

const fm = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request: new DedupeRequest(new RetryRequest(request, { retries: 1, logger })),
});
```

`RetryRequest` also accepts `baseDelay`, the wait in ms before the first retry (default
`250`). It must be a non-negative number, or the constructor throws a `RangeError`. Waits
are capped at 30 s whatever the `baseDelay` and `retries`.

A failed request throws a `RequestError`. When there was a response, the error carries the
response `status` and `contentType`. It also carries a `failure` kind (`RequestFailure`):

- `"not-connected"`: the connection could not be made.
- `"interrupted"`: the connection failed after the request may have been sent, or the
  request timed out.
- `"response"`: the server or a proxy answered with an error status.
- `"other"`: the default.

The client decides retries from these fields, so an `IRequest` of your own wrapped in
`RetryRequest` must set them on the errors it throws.

# Development

    npm i
    npm test
    npm run build
