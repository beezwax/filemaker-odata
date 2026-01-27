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
const records = await fm.getRecords("myTable");
```

For documentation on the `fm` instance see the [API](./API.md) documentation.

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

Some servers might have self-signed certificates. If you trust them you can
bypass the server-side authorization check by passing in a custom `Agent`:

```typescript
import { Agent } from "https";

const client = new FileMakerClient({
  server: "demo.server.beezwax.net",
  database: "test",
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

# Development

    npm i
    npm test
    npm run build
