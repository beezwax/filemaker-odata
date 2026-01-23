# FileMaker OData

This is a TypeScript/JavaScript library to connect to FileMaker's OData API
for both Node and Browser usage.

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
const records = await fm.getRecords("myTable");
```

You can see all available authentication types with:

```typescript
// types will be something like ["basic", "Google"]
const types = await client.getAuthTypes();
```

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

## Advanced Usage: Manual Composition

If you need more control, you can still manually create FileMaker instances:

```typescript
import {
  FileMaker,
  FileMakerBasicCredentials,
  Request,
  Logger,
} from "filemaker-odata";
import { Agent } from "https";

const credentials = new FileMakerBasicCredentials({
  username: "my-user",
  password: "my-pass",
});

const agent = new Agent({ rejectUnauthorized: false });
const request = new Request(credentials, agent);

const logger = new Logger();
const fm = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request,
});
```

# Development

    npm i
    npm test
    npm run build
