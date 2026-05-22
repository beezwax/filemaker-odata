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
