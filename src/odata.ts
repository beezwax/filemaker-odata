// typeof guards below are intentional: this library ships as plain JS too,
// so runtime checks protect callers who skip TypeScript.
const string = (value: string): string => {
  if (typeof value !== "string") throw new TypeError("Invalid OData string");
  return `'${value.replaceAll("'", "''")}'`;
};

const numberPattern = /^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/;

const number = (value: number | string): string => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Invalid OData number");
    return String(value);
  }

  if (typeof value !== "string") {
    throw new TypeError("Invalid OData number");
  }

  const normalized = value.trim();
  if (!numberPattern.test(normalized)) {
    throw new TypeError("Invalid OData number");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new TypeError("Invalid OData number");

  return String(parsed);
};

const integerPattern = /^[+-]?\d+$/;

const integer = (value: number | string): string => {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new TypeError("Invalid OData integer");
  }

  const normalized = typeof value === "number" ? String(value) : value.trim();
  if (!integerPattern.test(normalized)) {
    throw new TypeError("Invalid OData integer");
  }

  return normalized;
};

// Named booleanLiteral because `boolean` is a reserved word in JS/TS.
const booleanLiteral = (value: boolean): string => {
  if (typeof value !== "boolean") throw new TypeError("Invalid OData boolean");
  return value ? "true" : "false";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const uuid = (value: string): string => {
  if (typeof value !== "string") throw new TypeError("Invalid OData UUID");
  if (!uuidPattern.test(value)) throw new TypeError("Invalid OData UUID");
  return string(value);
};

const identifierPattern = /^[A-Za-z0-9 _-]+$/;

const identifier = (value: string): string => {
  if (typeof value !== "string") {
    throw new TypeError("Invalid OData identifier");
  }

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
