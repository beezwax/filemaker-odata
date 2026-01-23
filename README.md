# FileMaker OData

This is a TypeScript/JavaScript library to connect to FileMaker's OData API
for both Node and Browser usage.

# Usage

You can install it with:

    npm i beezwax/filemaker-odata

Once installed, you can import it with:

```typescript
import { FileMaker } from "beezwax/filemaker-odata";
```

TODO: Improve assembly

```typescript
// Basic auth
const credentials = new FileMakerBasicCredentials({
  username: "my-user",
  username: "my-pass",
});
const request = new AuthenticatedRequest(credentials);
const filemaker = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request,
});
```

```typescript
// OAuth
const authenticator = new FileMakerAuthenticator({
  server: "demo.server.beezwax.net",
  database: "test",
});

const { redirectUrl, requestId } = authenticator.getOAuthUrl({
  // This can be anything, it will be passed back in the redirection
  trackingId: "foo",
  // Whatever OAuth provider FileMaker is configured to use
  provider: "Google",
  // If your FileMaker server is on a different host than the web app, see
  // oauth-handler section in the documentation
  returnUrl: "https://my-filemaker-server.com/my-web-app/oauth",
});

// Save `requestId` somewhere. For example, for a regular backend route you
// could use sessions. The actual implementation will depend on
// framework/library.
const session = getSession();
session.requestId = requestId;
await session.save();

// Redirect user to `redirectUrl`...

// ... back in our app, in the /my-web-app/oath route
const session = await getSession();
// Read `identifier` from query string, this assumes Next.js
const identifier = req.nextUrl.searchParams.get("identifier");
// Get `requestId` back
const requestId = session.requestId;

// Some assertions
if (!requestId) throw new Error("Request ID not in session");
if (typeof identifier !== "string") throw new Error("Identifier is invalid");

// Set up sessions and redirect to index
session.identifier = identifier;
await session.save();

// You can now use the identifier from session to create authorized requests.
// In this case, both `requestId` and `identifier` are fetched from the
// session.
const credentials = new FileMakerOAuthCredentials({
  requestId,
  identifier,
});
const request = new AuthenticatedRequest(credentials);
const filemaker = new FileMaker({
  server: "demo.server.beezwax.net",
  database: "test",
  logger,
  request,
});

// Alternatively, you can create an access token
const authenticator = new FileMakerAuthenticator({
  server: "demo.server.beezwax.net",
  database: "test",
});
const token = authenticator.getTokenUsingOAuth({ requestId, identifier });
const credentials = new FileMakerRawCredentials(`Basic ${token}`);
// ... same as before
```

# Development

    npm i
    npm test
    npm run build
