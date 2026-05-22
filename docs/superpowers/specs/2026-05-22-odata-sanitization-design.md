# OData Sanitization Utilities Design

## Context

The library currently accepts raw OData strings for options such as `$filter`
and `$expand`. That keeps the API flexible, but it also makes it easy for
callers to interpolate untrusted input directly into OData expressions or query
strings.

The main risk is OData/query injection. Escaping single quotes is necessary for
string literals inside `$filter`, but it is not sufficient by itself. Query
parameter values also need URL encoding, and identifiers such as table names,
field names, path segments, and sort columns need validation rather than string
literal escaping.

The design keeps backward compatibility while adding explicit mitigation tools.
Existing string-based query options continue to work.

## Goals

- Provide small exported utilities for constructing safe OData literal values.
- Provide validators for identifiers and common scalar formats.
- Keep the existing `FileMaker` API compatible.
- Avoid a generic `escape()` helper that implies a whole OData expression can be
  made safe without context.
- Improve internal query option serialization so query parameter values cannot
  break out into additional query parameters.
- Document safe interpolation patterns for filters.

## Non-Goals

- Do not replace `$filter: string` with a structured query builder.
- Do not implement complete OData expression parsing.
- Do not attempt to sanitize arbitrary prebuilt OData expressions.
- Do not change existing method signatures in a breaking way.

## Public API

Add a new exported module, `src/odata.ts`, and re-export it from
`src/index.ts`.

The module exposes an `odata` object:

```ts
odata.string(value: string): string;
odata.number(value: number | string): string;
odata.integer(value: number | string): string;
odata.boolean(value: boolean): string;
odata.uuid(value: string): string;
odata.identifier(value: string): string;
```

### Literal Helpers

`odata.string(value)` returns an OData string literal:

```ts
odata.string("O'Brien"); // "'O''Brien'"
```

It doubles single quotes and wraps the result in single quotes. It does not URL
encode; query serialization handles URL encoding.

`odata.number(value)` accepts finite numbers and numeric strings, normalizes
them to a string, and rejects `NaN`, `Infinity`, empty strings, or strings with
non-numeric syntax.

`odata.integer(value)` behaves like `odata.number`, but rejects decimal values.

`odata.boolean(value)` returns `"true"` or `"false"` and only accepts booleans.

`odata.uuid(value)` validates a UUID and returns it as an OData string literal.
UUIDs are emitted quoted because FileMaker record IDs are commonly compared as
text values in filters.

### Identifier Helper

`odata.identifier(value)` validates and quotes an OData identifier:

```ts
odata.identifier("NAME"); // '"NAME"'
```

The first version accepts simple FileMaker field/table-style identifiers made of
letters, numbers, spaces, underscores, and hyphens. It rejects characters that
can change OData structure, including quotes, slashes, parentheses, commas,
operators, and query separators.

This helper is for identifiers, not string values. Use it for field names or
table names selected from trusted metadata or allow lists.

## Usage

Current code remains valid:

```ts
await fm.getRecords("people", {
  $filter: "NAME eq 'Fede'",
});
```

Safer interpolation uses the new helpers:

```ts
import { FileMakerClient, odata } from "filemaker-odata";

await fm.getRecords("people", {
  $filter: `${odata.identifier("NAME")} eq ${odata.string(userInput)}`,
});
```

Numeric filters validate before constructing the expression:

```ts
await fm.getRecords("people", {
  $filter: `${odata.identifier("AGE")} ge ${odata.integer(minAge)}`,
});
```

UUID filters validate the UUID and emit it as a quoted literal:

```ts
await fm.getRecords("people", {
  $filter: `${odata.identifier("ID")} eq ${odata.uuid(id)}`,
});
```

## Internal Query Serialization

`FileMaker.parameterize` encodes query parameter values with
`encodeURIComponent`. Query option keys remain unchanged because they are
library-controlled keys such as `$filter`, `$select`, and `$format`.

This changes generated URLs from raw values like:

```txt
people?$filter=NAME eq 'O''Brien'&$format=application/json
```

to encoded query values:

```txt
people?$filter=NAME%20eq%20'O''Brien'&$format=application%2Fjson
```

JavaScript's `encodeURIComponent` leaves single quotes readable. Characters
that can break query structure, especially `&`, `=`, `#`, `%`, and spaces, are
encoded.

This is a URL construction change, not an API change. Tests assert the new URL
format.

## Error Handling

Validation helpers throw `TypeError` with concise messages:

- `Invalid OData number`
- `Invalid OData integer`
- `Invalid OData boolean`
- `Invalid OData UUID`
- `Invalid OData identifier`

Messages do not echo the rejected value because rejected values may contain user
input.

## Testing

Add unit tests for:

- `odata.string` doubles single quotes and wraps the value.
- `odata.number` accepts finite numbers and numeric strings.
- `odata.number` rejects `NaN`, `Infinity`, empty strings, and mixed strings.
- `odata.integer` rejects decimals.
- `odata.boolean` accepts only booleans.
- `odata.uuid` accepts valid UUIDs and rejects malformed values.
- `odata.identifier` quotes safe identifiers and rejects structural characters.
- `getRecords` URL-encodes `$filter` values so injected `&$top=...` stays inside
  the filter parameter.
- Existing `$select` and `$orderby` behavior remains compatible after query
  encoding expectations are updated.

## Documentation

Update `README.md` and `API.md` with a short security section:

- Explain that raw `$filter` strings are still supported for compatibility.
- Recommend `odata.*` helpers whenever user input is interpolated.
- Show safe examples for string, number, UUID, and identifier usage.
- State that helpers are contextual: string escaping is for string literals only,
  and identifiers require validation.
