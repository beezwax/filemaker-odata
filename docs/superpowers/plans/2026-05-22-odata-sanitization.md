# OData Sanitization Utilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backward-compatible OData literal and validation helpers that callers can use when interpolating input into FileMaker OData filters.

**Architecture:** Add a focused `src/odata.ts` module that exports an `odata` object. The helpers construct OData literals or validate identifiers without changing existing `FileMaker` query serialization behavior.

**Tech Stack:** TypeScript, Vitest, Vite library build, existing README/API Markdown docs.

---

## File Structure

- Create `src/odata.ts`: pure helper functions and exported `odata` object.
- Modify `src/index.ts`: re-export the new module.
- Modify `tests/filemaker.test.ts`: add focused unit tests for the helpers and one compatibility test proving current raw `$filter` URL output remains unchanged.
- Modify `README.md`: add a short security section with safe interpolation examples.
- Modify `API.md`: document the new OData sanitization utilities and compatibility boundaries.

## Task 1: Add Failing Tests For OData Helpers

**Files:**
- Modify: `tests/filemaker.test.ts`

- [ ] **Step 1: Add the import**

Change the existing import at the top of `tests/filemaker.test.ts` from:

```ts
import { FileMaker, NullLogger } from "../src/index";
```

to:

```ts
import { FileMaker, NullLogger, odata } from "../src/index";
```

- [ ] **Step 2: Add helper tests at the end of the file**

Append this block to `tests/filemaker.test.ts`:

```ts
describe("odata helpers", () => {
  describe("string", () => {
    test("wraps values in single quotes", () => {
      expect(odata.string("Beezwax")).toEqual("'Beezwax'");
    });

    test("escapes single quotes by doubling them", () => {
      expect(odata.string("O'Brien")).toEqual("'O''Brien'");
    });

    test("does not URL encode the literal", () => {
      expect(odata.string("A B&C")).toEqual("'A B&C'");
    });
  });

  describe("number", () => {
    test("accepts finite numbers", () => {
      expect(odata.number(42)).toEqual("42");
      expect(odata.number(-12.5)).toEqual("-12.5");
    });

    test("accepts numeric strings", () => {
      expect(odata.number("42")).toEqual("42");
      expect(odata.number("  -12.5  ")).toEqual("-12.5");
    });

    test("rejects invalid numbers", () => {
      expect(() => odata.number(Number.NaN)).toThrow(TypeError);
      expect(() => odata.number(Number.POSITIVE_INFINITY)).toThrow(TypeError);
      expect(() => odata.number("")).toThrow(TypeError);
      expect(() => odata.number("12abc")).toThrow(TypeError);
    });
  });

  describe("integer", () => {
    test("accepts integers", () => {
      expect(odata.integer(42)).toEqual("42");
      expect(odata.integer(" -12 ")).toEqual("-12");
    });

    test("rejects decimal values", () => {
      expect(() => odata.integer(12.5)).toThrow(TypeError);
      expect(() => odata.integer("12.5")).toThrow(TypeError);
    });
  });

  describe("boolean", () => {
    test("accepts booleans", () => {
      expect(odata.boolean(true)).toEqual("true");
      expect(odata.boolean(false)).toEqual("false");
    });
  });

  describe("uuid", () => {
    test("accepts valid UUIDs as string literals", () => {
      expect(odata.uuid("280dc895-23f6-4368-be3b-3ea81d360f62")).toEqual(
        "'280dc895-23f6-4368-be3b-3ea81d360f62'",
      );
    });

    test("rejects malformed UUIDs", () => {
      expect(() => odata.uuid("not-a-uuid")).toThrow(TypeError);
    });
  });

  describe("identifier", () => {
    test("quotes safe FileMaker identifiers", () => {
      expect(odata.identifier("NAME")).toEqual('"NAME"');
      expect(odata.identifier("Customer Name")).toEqual('"Customer Name"');
      expect(odata.identifier("customer_id")).toEqual('"customer_id"');
      expect(odata.identifier("Order-Number")).toEqual('"Order-Number"');
    });

    test("rejects identifiers with OData structural characters", () => {
      expect(() => odata.identifier('NA"ME')).toThrow(TypeError);
      expect(() => odata.identifier("Orders/ID")).toThrow(TypeError);
      expect(() => odata.identifier("NAME)&$top=1")).toThrow(TypeError);
      expect(() => odata.identifier("")).toThrow(TypeError);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- --run
```

Expected: FAIL because `odata` is not exported yet. The failure mentions that `odata` is missing or undefined.

- [ ] **Step 4: Commit the failing tests**

```bash
git add tests/filemaker.test.ts
git commit -m "test: add OData helper coverage"
```

## Task 2: Implement OData Helpers

**Files:**
- Create: `src/odata.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create `src/odata.ts`**

Add this file:

```ts
const numberPattern = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/;
const integerPattern = /^[+-]?\d+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identifierPattern = /^[A-Za-z0-9 _-]+$/;

const string = (value: string): string => {
  return `'${value.replaceAll("'", "''")}'`;
};

const number = (value: number | string): string => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Invalid OData number");
    return String(value);
  }

  const normalized = value.trim();
  if (!numberPattern.test(normalized)) {
    throw new TypeError("Invalid OData number");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new TypeError("Invalid OData number");

  return normalized;
};

const integer = (value: number | string): string => {
  const normalized = typeof value === "number" ? String(value) : value.trim();
  if (!integerPattern.test(normalized)) {
    throw new TypeError("Invalid OData integer");
  }

  return normalized;
};

const booleanLiteral = (value: boolean): string => {
  if (typeof value !== "boolean") throw new TypeError("Invalid OData boolean");
  return value ? "true" : "false";
};

const uuid = (value: string): string => {
  if (!uuidPattern.test(value)) throw new TypeError("Invalid OData UUID");
  return string(value);
};

const identifier = (value: string): string => {
  if (!identifierPattern.test(value)) {
    throw new TypeError("Invalid OData identifier");
  }

  return `"${value}"`;
};

export const odata = {
  string,
  number,
  integer,
  boolean: booleanLiteral,
  uuid,
  identifier,
};
```

- [ ] **Step 2: Export the module from `src/index.ts`**

Add this line to `src/index.ts`:

```ts
export * from "./odata";
```

The final file must include:

```ts
export * from "./authenticator";
export * from "./client";
export * from "./credentials";
export * from "./filemaker";
export * from "./logger";
export * from "./odata";
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- --run
```

Expected: PASS for all tests.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit implementation**

```bash
git add src/odata.ts src/index.ts
git commit -m "feat: add OData sanitization helpers"
```

## Task 3: Add Compatibility Coverage For Existing Query Serialization

**Files:**
- Modify: `tests/filemaker.test.ts`

- [ ] **Step 1: Add a compatibility test in the `$filter` describe block**

Inside `describe("$filter", () => { ... })`, after the existing `"filters records based on criteria"` test, add:

```ts
    test("keeps raw filter URL serialization for backward compatibility", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url(
          "people?$filter=name eq 'O''Brien'&$format=application/json",
        ),
        data: {
          value: [{ ID: "1234", NAME: "O'Brien", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $filter: `name eq ${odata.string("O'Brien")}`,
      });

      expect(response.length).toEqual(1);
      expect(response[0].NAME).toEqual("O'Brien");
    });
```

- [ ] **Step 2: Run the targeted test file**

Run:

```bash
npm test -- --run tests/filemaker.test.ts
```

Expected: PASS. This proves the helper can be used in filters without changing existing URL serialization.

- [ ] **Step 3: Commit compatibility test**

```bash
git add tests/filemaker.test.ts
git commit -m "test: preserve raw OData filter serialization"
```

## Task 4: Document Safe Usage

**Files:**
- Modify: `README.md`
- Modify: `API.md`

- [ ] **Step 1: Add README security section**

In `README.md`, after the Basic Authentication usage example and before `## OAuth Authentication`, add:

````md
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
````

- [ ] **Step 2: Add API documentation section**

In `API.md`, add `- [OData Sanitization Utilities](#odata-sanitization-utilities)` to the table of contents after `- [Query Options](#query-options)`.

At the end of `API.md`, append:

````md
---

## OData Sanitization Utilities

The package exports an `odata` helper object for constructing OData literals and
validating identifiers when building query strings.

```typescript
import { odata } from "filemaker-odata";
```

### odata.string()

Creates an OData string literal. Single quotes are escaped by doubling them.
This helper does not URL encode.

```typescript
odata.string("O'Brien"); // "'O''Brien'"
```

### odata.number()

Validates a finite number or numeric string and returns the normalized OData
literal.

```typescript
odata.number(42); // "42"
odata.number(" -12.5 "); // "-12.5"
```

### odata.integer()

Validates an integer number or integer string.

```typescript
odata.integer("42"); // "42"
```

### odata.boolean()

Returns an OData boolean literal.

```typescript
odata.boolean(true); // "true"
```

### odata.uuid()

Validates a UUID and returns it as an OData string literal.

```typescript
odata.uuid("280dc895-23f6-4368-be3b-3ea81d360f62");
// "'280dc895-23f6-4368-be3b-3ea81d360f62'"
```

### odata.identifier()

Validates and quotes a simple FileMaker field or table identifier. Use this for
trusted metadata or allow-listed identifiers, not arbitrary user text.

```typescript
odata.identifier("Customer Name"); // "\"Customer Name\""
```

### Safe Filter Interpolation

```typescript
const records = await fm.getRecords("Customers", {
  $filter: `${odata.identifier("NAME")} eq ${odata.string(userInput)}`,
});
```

Raw `$filter` strings remain supported. The helpers reduce OData literal and
identifier injection risk, but they do not sanitize a complete arbitrary OData
expression. Default query serialization is unchanged for backward compatibility.
````

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 4: Commit docs**

```bash
git add README.md API.md
git commit -m "docs: document OData sanitization helpers"
```

## Task 5: Final Verification

**Files:**
- No code changes.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS and generated `dist` files update if this repository tracks build output.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: no unstaged source changes. If `dist` files changed after build, inspect them and commit them:

```bash
git add dist
git commit -m "build: update distribution files"
```

If `dist` files did not change or are not tracked by the build, do not create an empty commit.
