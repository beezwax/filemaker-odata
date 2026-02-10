# FileMaker API Reference

This document provides detailed documentation for all methods available in the `FileMaker` class.

## Table of Contents

- [Configuration](#configuration)
- [Methods](#methods)
  - [url()](#url)
  - [metadata()](#metadata)
  - [getRecords()](#getrecords)
  - [getRecordsWithCount()](#getrecordswithcount)
  - [getRecord()](#getrecord)
  - [getValue()](#getvalue)
  - [subquery()](#subquery)
  - [crossjoin()](#crossjoin)
  - [batch()](#batch)
  - [script()](#script)
- [Query Options](#query-options)

## Configuration

The `FileMaker` class requires the following configuration:

```typescript
interface FileMakerConfig {
  server: string;
  database: string;
}
```

**Note:** In most cases, you'll use `FileMakerClient` to create authenticated instances rather than constructing `FileMaker` directly. See the [README](./README.md) for authentication examples.

## Methods

### url()

Constructs a fully-qualified URL for FileMaker OData API endpoints.

**Signature:**

```typescript
url(path: string): string
```

**Parameters:**

- `path` - The API path relative to the database endpoint

**Returns:** A complete HTTPS URL string

**Example:**

```typescript
const endpoint = fm.url("MyTable");
// Returns: "https://demo.server.beezwax.net/fmi/odata/v4/test/MyTable"
```

---

### metadata()

Retrieves the OData metadata document for the database, which describes available tables and their schemas.

**Signature:**

```typescript
async metadata<T>(): Promise<T>
```

**Returns:** The metadata document (typically XML formatted)

**Example:**

```typescript
const metadata = await fm.metadata();
console.log(metadata);
```

---

### getRecords()

Retrieves records from a specified table with optional query options.

**Signature:**

```typescript
async getRecords<T>(table: string, options?: QueryOptions<T>): Promise<T[]>
```

**Parameters:**

- `table` - The name of the table to query
- `options` - Optional query options (see [Query Options](#query-options))

**Returns:** An array of records

**Example:**

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
  EMAIL: string;
  PHONE: string;
  AGE: number;
  CREATED_DATE: string;
}

// Get all records
const allRecords = await fm.getRecords<CustomerRecord>("Customers");

// Get with filtering
const filteredRecords = await fm.getRecords<CustomerRecord>("Customers", {
  $filter: "Age gt 25",
  $top: 10,
});

// Get specific fields only
const specificFields = await fm.getRecords<CustomerRecord>("Customers", {
  $select: ["NAME", "EMAIL", "PHONE"],
});

// Get with ordering
const orderedRecords = await fm.getRecords<CustomerRecord>("Customers", {
  $orderby: ["CREATED_DATE", "desc"],
  $top: 20,
});

// Get with multi-column ordering
const multiOrderedRecords = await fm.getRecords<CustomerRecord>("Customers", {
  $orderby: [
    ["AGE", "desc"],
    ["NAME", "asc"],
  ],
  $top: 20,
});
```

---

### getRecordsWithCount()

Retrieves records along with the total count of matching records (ignoring pagination).

**Signature:**

```typescript
async getRecordsWithCount<T>(
  table: string,
  options?: QueryOptions<T>
): Promise<{ data: T[]; count: number }>
```

**Parameters:**

- `table` - The name of the table to query
- `options` - Optional query options (see [Query Options](#query-options))

**Returns:** An object containing:

- `data` - Array of records
- `count` - Total number of matching records

**Example:**

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

const result = await fm.getRecordsWithCount<ProductRecord>("Products", {
  $filter: "Price gt 100",
  $top: 10,
  $skip: 0,
});

console.log(`Showing ${result.data.length} of ${result.count} products`);
// Showing 10 of 245 products
```

---

### getRecord()

Retrieves a single record by its ID.

**Signature:**

```typescript
async getRecord<T>(
  table: string,
  id: string,
  options?: GetRecordQueryOptions<T>
): Promise<T>
```

**Parameters:**

- `table` - The name of the table
- `id` - The record ID (primary key value)
- `options` - Optional query options (supports `$select`, `$expand`, `$format`, `$metadata`)

**Returns:** A single record object

**Example:**

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
  EMAIL: string;
  PHONE: string;
}

// Get a single record
const customer = await fm.getRecord<CustomerRecord>("Customers", "CUST-12345");
console.log(customer.NAME);

// Get specific fields only
const customerBasic = await fm.getRecord<CustomerRecord>(
  "Customers",
  "CUST-12345",
  {
    $select: ["NAME", "EMAIL"],
  },
);

// Get record with expanded relationships
const customerWithOrders = await fm.getRecord<CustomerRecord>(
  "Customers",
  "CUST-12345",
  {
    $expand: "Orders",
  },
);

// IDs with special characters are automatically URL-encoded
interface UserRecord {
  ID: string;
  USERNAME: string;
}

const user = await fm.getRecord<UserRecord>("Users", "user@example.com");
// Internally encoded as: people('user%40example.com')
```

---

### getValue()

Retrieves the raw value of a specific field from a record. Useful for binary data like container fields.

**Signature:**

```typescript
async getValue(table: string, id: string, field: string): Promise<string>
```

**Parameters:**

- `table` - The name of the table
- `id` - The record ID
- `field` - The field name to retrieve

**Returns:** The raw field value (as ArrayBuffer)

**Example:**

```typescript
// Get a container field (image, PDF, etc.)
const imageData = await fm.getValue("Products", "PROD-001", "ProductImage");

// In Node.js, you could write this to a file
import fs from "fs";
fs.writeFileSync("product.jpg", Buffer.from(imageData));
```

---

### subquery()

Retrieves related records through a relationship/portal.

**Signature:**

```typescript
async subquery<T>(params: {
  table: string;
  recordId: string;
  path: string;
  options?: QueryOptions<T>;
}): Promise<T[]>
```

**Parameters:**

- `table` - The parent table name
- `recordId` - The parent record ID
- `path` - The relationship/portal name
- `options` - Optional query options

**Returns:** An array of related records

**Example:**

```typescript
interface OrderRecord {
  ID: string;
  ORDER_DATE: string;
  TOTAL: number;
  STATUS: string;
}

// Get all orders for a specific customer
const orders = await fm.subquery<OrderRecord>({
  table: "Customers",
  recordId: "CUST-12345",
  path: "Orders",
});

// Get with filtering and limiting
const recentOrders = await fm.subquery<OrderRecord>({
  table: "Customers",
  recordId: "CUST-12345",
  path: "Orders",
  options: {
    $filter: "OrderDate gt 2024-01-01",
    $top: 5,
    $orderby: ["ORDER_DATE", "desc"],
  },
});
```

---

### crossjoin()

Performs a cross-join query across multiple tables.

**Signature:**

```typescript
async crossjoin<T>(params: {
  tables: string[];
  options: CrossJoinQueryOptions<T>;
}): Promise<string>
```

**Parameters:**

- `tables` - Array of table names to join
- `options` - Query options object (supports `$filter`, `$expand`, `$format`, `$metadata`)

**Returns:** Response data (JSON or XML depending on format option)

**Example:**

```typescript
// JSON format (default)
const result = await fm.crossjoin({
  tables: ["Customers", "Orders"],
  options: {
    $filter: "Customers/ID eq Orders/CustomerID",
    $expand: "Customers,Orders",
  },
});

// XML format
const xmlResult = await fm.crossjoin({
  tables: ["Customers", "Orders"],
  options: {
    $filter: "Customers/ID eq Orders/CustomerID",
    $expand: "Customers,Orders",
    $format: "xml",
  },
});
```

---

### batch()

Creates a batch operation builder for executing multiple create, update, and delete operations transactionally. All operations succeed together or all fail.

**Signature:**

```typescript
batch(): OperationBuilder
```

**Returns:** An `OperationBuilder` instance for chaining operations

**Available Operations:**

- `.create<T>({ table, record })` - Create a new record
- `.update<T>({ table, record })` - Update an existing record (must include ID)
- `.delete({ table, id })` - Delete a record

**Example:**

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
  EMAIL: string;
}

interface OrderRecord {
  ID: string;
  STATUS: string;
}

// Execute multiple operations in a transaction
const results = await fm
  .batch()
  .create<CustomerRecord>({
    table: "Customers",
    record: {
      NAME: "John Doe",
      EMAIL: "john@example.com",
    },
  })
  .update<OrderRecord>({
    table: "Orders",
    record: {
      ID: "ORDER-123",
      STATUS: "Shipped",
    },
  })
  .delete({
    table: "Products",
    id: "PROD-999",
  })
  .execute();

// Results is an array with response for each operation
console.log(results[0]); // Create result
console.log(results[1]); // Update result
console.log(results[2]); // Delete result
```

**Transaction Behavior:**

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
}

// If any operation fails, ALL operations are rolled back
try {
  const results = await fm
    .batch()
    .create<CustomerRecord>({ table: "Customers", record: { NAME: "Jane" } })
    .delete({ table: "Orders", id: "INVALID-ID" }) // This fails
    .execute();
} catch (error) {
  // The customer creation is also rolled back
  console.error("Transaction failed, no changes were made");
}
```

---

### script()

Executes a FileMaker script and returns the result.

**Signature:**

```typescript
async script<T>(
  name: string,
  params?: Record<string, unknown>
): Promise<{ success: boolean; data?: T }>
```

**Parameters:**

- `name` - The name of the FileMaker script to execute
- `params` - Optional parameters to pass to the script

**Returns:** An object containing:

- `success` - `true` if script returned code 0, `false` otherwise
- `data` - The script's result parameter (only present if successful)

**Example:**

```typescript
// Run a script without parameters
const result = await fm.script<void>("CalculateTotals");
if (result.success) {
  console.log("Script completed successfully");
}

// Run a script with parameters
interface EmailResult {
  SENT: number;
}

const emailResult = await fm.script<EmailResult>("SendEmail", {
  recipient: "customer@example.com",
  subject: "Order Confirmation",
  orderId: "ORDER-123",
});

if (emailResult.success) {
  console.log(`Sent ${emailResult.data.SENT} emails`);
} else {
  console.error("Failed to send email");
}

// Script with complex return data
interface ValidationResult {
  VALID: boolean;
  ERRORS: string[];
}

const validation = await fm.script<ValidationResult>("ValidateOrder", {
  orderId: "ORDER-456",
});

if (validation.success && validation.data) {
  if (validation.data.VALID) {
    console.log("Order is valid");
  } else {
    console.log("Validation errors:", validation.data.ERRORS);
  }
}
```

---

## Query Options

Most query methods accept an optional `QueryOptions` parameter for filtering, sorting, and pagination.

```typescript
interface QueryOptions<T> {
  $select?: (keyof T)[]; // Select specific fields
  $top?: number; // Limit number of results
  $skip?: number; // Skip first N results (pagination)
  $filter?: string; // Filter expression
  $expand?: string; // Expand related records
  $orderby?: [keyof T, "asc" | "desc"] | [keyof T, "asc" | "desc"][]; // Sort by one or multiple columns
  $count?: boolean; // Include total count
  $format?: "json" | "xml"; // Response format (default: json)
  $metadata?: boolean; // Include OData metadata (default: true)
}
```

### $select

Select specific fields to return (reduces payload size).

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
  EMAIL: string;
}

const records = await fm.getRecords<CustomerRecord>("Customers", {
  $select: ["ID", "NAME", "EMAIL"],
});
// The "ID" field is automatically quoted in the URL: $select="ID",NAME,EMAIL
```

**Note:** The `ID` field is a reserved keyword in OData and is automatically quoted when used in `$select`.

### $top

Limit the number of records returned.

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

const records = await fm.getRecords<ProductRecord>("Products", {
  $top: 20,
});
```

### $skip

Skip a number of records (useful for pagination).

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

// Get page 3 (records 41-60)
const records = await fm.getRecords<ProductRecord>("Products", {
  $skip: 40,
  $top: 20,
});
```

### $filter

Filter records using OData filter syntax. See [FileMaker's OData documentation](https://help.claris.com/en/odata-guide/content/query-option-filter.html) for complete filter syntax.

```typescript
interface UserRecord {
  ID: string;
  AGE: number;
  EMAIL: string;
}

// Comparison operators
const adults = await fm.getRecords<UserRecord>("Users", {
  $filter: "Age ge 18",
});

// String functions
const gmailUsers = await fm.getRecords<UserRecord>("Users", {
  $filter: "contains(Email, 'gmail.com')",
});

interface CustomerRecord {
  ID: string;
  STATUS: string;
  TOTAL_PURCHASES: number;
}

// Logical operators
const activeCustomers = await fm.getRecords<CustomerRecord>("Customers", {
  $filter: "Status eq 'Active' and TotalPurchases gt 1000",
});

interface OrderRecord {
  ID: string;
  ORDER_DATE: string;
}

// Date comparisons
const recentOrders = await fm.getRecords<OrderRecord>("Orders", {
  $filter: "OrderDate gt 2024-01-01",
});
```

### $expand

Include related records in the response.

```typescript
interface CustomerRecord {
  ID: string;
  NAME: string;
  EMAIL: string;
}

interface OrderRecord {
  ID: string;
  TOTAL: number;
}

type CustomerWithOrdersRecord = CustomerRecord & { ORDERS: OrderRecord[] };

const customers = await fm.getRecords<CustomerWithOrdersRecord>("Customers", {
  $expand: "ORDERS",
});
```

### $orderby

Sort results by one or multiple fields in ascending or descending order.

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

// Sort by single column
const products = await fm.getRecords<ProductRecord>("Products", {
  $orderby: ["PRICE", "desc"],
});

interface CustomerRecord {
  ID: string;
  NAME: string;
}

const customers = await fm.getRecords<CustomerRecord>("Customers", {
  $orderby: ["NAME", "asc"],
});

// Sort by multiple columns
interface OrderRecord {
  ID: string;
  STATUS: string;
  ORDER_DATE: string;
  TOTAL: number;
}

const orders = await fm.getRecords<OrderRecord>("Orders", {
  $orderby: [
    ["STATUS", "asc"],
    ["ORDER_DATE", "desc"],
  ],
});
// Orders will be sorted by STATUS (ascending), then by ORDER_DATE (descending) within each status
```

### $count

Include the total count of matching records (automatically enabled in `getRecordsWithCount`).

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

const records = await fm.getRecords<ProductRecord>("Products", {
  $count: true,
  $top: 10,
});
```

### $format

Control the response format (JSON or XML).

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

// Get records in JSON format (default)
const jsonRecords = await fm.getRecords<ProductRecord>("Products", {
  $format: "json",
});

// Get records in XML format
const xmlRecords = await fm.getRecords<string>("Products", {
  $format: "xml",
});
```

### $metadata

Control whether OData metadata is included in the response. When set to `false`, adds `;odata.metadata=none` to the format parameter, reducing response payload size.

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
}

// Include metadata (default)
const withMetadata = await fm.getRecords<ProductRecord>("Products", {
  $metadata: true,
});
// Response includes @odata.context and other metadata fields

// Exclude metadata for smaller payload
const withoutMetadata = await fm.getRecords<ProductRecord>("Products", {
  $metadata: false,
});
// Response contains only the raw data
```

### Combining Options

All query options can be combined for complex queries.

```typescript
interface ProductRecord {
  ID: string;
  NAME: string;
  PRICE: number;
  CATEGORY: string;
}

const result = await fm.getRecordsWithCount<ProductRecord>("Products", {
  $select: ["ID", "NAME", "PRICE", "CATEGORY"],
  $filter: "Price gt 50 and Category eq 'Electronics'",
  $orderby: ["PRICE", "desc"],
  $top: 20,
  $skip: 0,
});

console.log(`Found ${result.count} products`);
console.log(`Showing ${result.data.length} results`);
```
