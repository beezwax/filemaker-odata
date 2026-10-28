# FileMaker OData

This is a TypeScript/JavaScript library to connect to FileMaker's OData API
for both Node and Browser usage.

This is an **unstable** version, things will move fast and backwards
compatibility might break.

# Usage

You can install it with:

    npm i beezwax/filemaker-odata

Once installed, you can import it with:

```typescript
import { FileMakerClient } from "filemaker-odata";
```

## Basic Authentication

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

The library automatically fetches all pages when results exceed FileMaker's 10,000-record limit per response. Use `$top` to limit results. See [Paging](./API.md#paging).

For documentation on the `fm` instance see the [API](./API.md) documentation.

## OData Filter Input

Raw OData query strings are still supported for compatibility:

```typescript
const records = await fm.getRecords("Customers", {
  $filter: "NAME eq 'Beezwax'",
});
```

When interpolating user input, use the exported `odata` helpers to construct
OData literals or validate identifiers:

```typescript
import { FileMakerClient, odata } from "filemaker-odata";

const records = await fm.getRecords("Customers", {
  $filter: `${odata.identifier("NAME")} eq ${odata.string(userInput)}`,
});
```

The helpers are contextual. `odata.string()` is for OData string literals, not
for whole filter expressions. Identifiers, numbers, booleans, and UUIDs have
their own helpers:

```typescript
const records = await fm.getRecords("Customers", {
  $filter: `${odata.identifier("AGE")} ge ${odata.integer(minAge)}`,
});
```

This first pass does not change the library's default query serialization.
Avoid placing raw untrusted text into complete `$filter` strings.

## OAuth Authentication

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

### Get Available Authentication Types

If you need to perform some logic depending on which authentication providers
are available, you can use `client.getAuthTypes()`:

```typescript
// types will be something like ["basic", "Google"]
const types = await client.getAuthTypes();
```

### OAuth-Handler

When the FileMaker server and the web server are on different hosts, FileMaker
won't allow to redirect back to the web server in the OAuth redirection step.

To bypass this, you can use `oauth-handler` (TODO: Link to repo). It's a
simple proxy that sits on your FileMaker server and can redirect back to any
other host.

So instead of: `WEB -> FileMaker -> WEB` the authentication flow will be `WEB
-> FileMaker -> FileMaker oauth-handler -> WEB`.

To do this, the handler uses the `trackingId` as the URL to redirect back to,
so instead of doing this:

```typescript
const { redirectUrl, requestId } = await client.getOAuthUrl({
  trackingId: "unique-tracking-id",
  provider: "MyProvider",
  // Won't work! Different servers
  returnUrl: "https://my-web-app.com/sessions/oauth",
});
```

You'll need to do this:

```typescript
const { redirectUrl, requestId } = await client.getOAuthUrl({
  // OAuth Handler will use this to redirect
  trackingId: "https://my-web-app.com/sessions/oauth",
  provider: "MyProvider",
  // Redirect back to oauth-handler first
  returnUrl: "https://my.filemaker.server.com/oauth-handler",
});
```

For instructions on how to set up `oauth-handler` see the repository's README.

What's nice about `oauth-handler` is that you will be able to do auth in
`localhost` when developing.

## Custom HTTPS Agent

Some FileMaker servers might have self-signed certificates. If you trust them
you can bypass the server-side authorization check by passing in a custom
`Agent`:

```typescript
import { Agent } from "https";

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "example",
  // Pass custom agent here
  agent: new Agent({ rejectUnauthorized: false }),
});
```

## Custom Logger

It's very common to have the need for custom logging, for example, you might
want to write the logs to a special file. You can create your own logger by
implementing `ILogger`:

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

You can also use `NullLogger` to disable logging:

```typescript
import { NullLogger, FileMakerClient } from "filemaker-odata";

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  logger: new NullLogger(),
});
```

## Request Deduplication

When several read requests run at the same time on one `FileMaker` instance with the
same URL, response type, and request headers, only one HTTP request is sent and all
callers get the result. Each caller receives its own copy of the data. Nothing is kept
in memory after the request completes—it is not a cache.

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

## Request Concurrency Limit

`concurrency` sets the maximum number of HTTP requests a `FileMakerClient` sends to
FileMaker Server at the same time. Extra requests wait in a queue and start in the order
they were made (first in, first out). This keeps many parallel queries (for example with
`Promise.all`) from overloading the server.

By default there is no limit. Leaving `concurrency` out, or passing `undefined`, `0`, or
`Infinity`, means no limit. Any other value must be a positive integer. Anything else (for
example `-1`, `1.5`, or `NaN`) throws a `RangeError` when the client is created.

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  concurrency: 2,
});
```

The limit is shared by every `FileMaker` the client creates, including every
`withBasicAuth` and `withOAuth` call.

Every HTTP request takes one slot: reads, `batch().execute()`, `script()`, and each extra
page that `getRecords` loads when following next links. A request that fails frees its slot
right away. Reads shared by request deduplication do not take an extra slot.
`getOAuthUrl()` and `getAuthTypes()` are not limited.

A `FileMaker` you construct yourself is not limited. To limit it, wrap its request in
`ConcurrencyLimitRequest`. If you use deduplication too, put the limit inside `DedupeRequest`:

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

## Request Timeout

`timeout` sets how long, in milliseconds, a `FileMakerClient` waits for response data.
A request fails when no response data is received for `timeout` ms. The timer starts when
the request is sent and restarts each time data arrives, so a response that keeps sending
data is not cut off. This works the same in Node and browsers. Progress is checked about
three times per second, so use a timeout of at least one second.

The timer applies to every request the client makes, including each page that
`getRecords` follows. Time spent waiting in the `concurrency` queue does not count.

By default there is no timeout. Leaving `timeout` out, or passing `undefined`, `0`, or
`Infinity`, means no timeout. Any other value must be a positive number up to
`2147483647` (the largest delay JavaScript timers support). Anything else (for example
`-1`, `NaN`, or `2147483648`) throws a `RangeError` when the client is created.

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

## Request Retries

A proxy in front of FileMaker Server (for example a gateway or a security proxy) sometimes
answers with a generic `500 Internal Server Error` page for no lasting reason. A
`FileMakerClient` retries such failures once by default.

Reads (GET) only read data, so they are retried on any transient failure:

- a `500`, `502`, `503`, or `504` response,
- a connection that could not be made (refused, host or network unreachable, DNS failure),
- a connection that failed once the request was sent (reset, aborted, or a browser network
  error), including one that drops while the response is still arriving,
- a request that hit the client's `timeout`.

Scripts and batches (POST) can write data, so they are retried only when the request most
likely never ran in FileMaker:

- a `500` or `503` proxy error page: a response that is HTML or has no content type, or
- a connection that could not be made (refused, host or network unreachable, DNS failure).

A POST whose error response is not HTML (JSON, XML, plain text, and so on), that timed
out, or whose connection failed after it was sent is not retried, because FileMaker may
have run it already. Neither is a `502` or `504`: the proxy may have forwarded the request
to FileMaker and then lost the connection or stopped waiting for the answer. This avoids
retrying when FileMaker may have run the request, but it is not a guarantee: a proxy can
forward a request and still answer with an HTML `500`. Other errors, such as `400` or
`404`, are never retried.

The first retry waits 250 to 500 ms. Each later retry waits twice as long, up to 30 s.
Each attempt gets its own `timeout`. A request keeps its `concurrency` slot while it waits,
and callers sharing a deduplicated read share its retries. When retries run out, the last
error is thrown. Each retry is logged with the client's `logger`.

`retries` sets how many times a failed request is retried. It defaults to `1`. Pass `0` to
turn retries off. Any other value must be a non-negative integer, or the constructor
throws a `RangeError`.

```typescript
const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
  retries: 2,
});
```

A `FileMaker` you construct yourself does not retry. To turn retries on, wrap its request
in `RetryRequest`, inside `ConcurrencyLimitRequest` and `DedupeRequest` when using them:

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
`250`); it must be a non-negative number, or the constructor throws a `RangeError`. Waits
are capped at 30 s whatever the `baseDelay` and `retries`.

A failed request throws a `RequestError` carrying the response `status` and `contentType`,
when there was a response, and a `failure` kind (`RequestFailure`): `"not-connected"` (the
connection could not be made), `"interrupted"` (the connection failed after the request may
have been sent, or the request timed out), `"response"` (the server or a proxy answered
with an error status), or `"other"` (the default). Retries are decided from these fields, so
an `IRequest` of your own wrapped in `RetryRequest` must set them on the errors it throws.

# Development

    npm i
    npm test
    npm run build
