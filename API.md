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
// Get all records
const allRecords = await fm.getRecords("Customers");

// Get with filtering
const filteredRecords = await fm.getRecords("Customers", {
  $filter: "Age gt 25",
  $top: 10,
});

// Get specific fields only
const specificFields = await fm.getRecords("Customers", {
  $select: ["Name", "Email", "Phone"],
});

// Get with ordering
const orderedRecords = await fm.getRecords("Customers", {
  $orderby: ["CreatedDate", "desc"],
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
const result = await fm.getRecordsWithCount("Products", {
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
async getRecord<T>(table: string, id: string): Promise<T>
```

**Parameters:**

- `table` - The name of the table
- `id` - The record ID (primary key value)

**Returns:** A single record object

**Example:**

```typescript
const customer = await fm.getRecord("Customers", "CUST-12345");
console.log(customer.Name);

// IDs with special characters are automatically URL-encoded
const user = await fm.getRecord("Users", "user@example.com");
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
// Get all orders for a specific customer
const orders = await fm.subquery({
  table: "Customers",
  recordId: "CUST-12345",
  path: "Orders",
});

// Get with filtering and limiting
const recentOrders = await fm.subquery({
  table: "Customers",
  recordId: "CUST-12345",
  path: "Orders",
  options: {
    $filter: "OrderDate gt 2024-01-01",
    $top: 5,
    $orderby: ["OrderDate", "desc"],
  },
});
```

---

### crossjoin()

Performs a cross-join query across multiple tables. Returns data in ATOM XML format.

**Signature:**

```typescript
async crossjoin(params: {
  tables: string[];
  $filter: string;
  $expand: string;
}): Promise<string>
```

**Parameters:**

- `tables` - Array of table names to join
- `$filter` - Filter condition for the join
- `$expand` - Expand expression for related data

**Returns:** XML string in ATOM format

**Example:**

```typescript
const result = await fm.crossjoin({
  tables: ["Customers", "Orders"],
  $filter: "Customers/ID eq Orders/CustomerID",
  $expand: "Customers,Orders",
});

// Parse the XML result as needed
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
// Execute multiple operations in a transaction
const results = await fm
  .batch()
  .create({
    table: "Customers",
    record: {
      Name: "John Doe",
      Email: "john@example.com",
    },
  })
  .update({
    table: "Orders",
    record: {
      ID: "ORDER-123",
      Status: "Shipped",
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
// If any operation fails, ALL operations are rolled back
try {
  const results = await fm
    .batch()
    .create({ table: "Customers", record: { Name: "Jane" } })
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
const result = await fm.script("CalculateTotals");
if (result.success) {
  console.log("Script completed successfully");
}

// Run a script with parameters
const emailResult = await fm.script<{ sent: number }>("SendEmail", {
  recipient: "customer@example.com",
  subject: "Order Confirmation",
  orderId: "ORDER-123",
});

if (emailResult.success) {
  console.log(`Sent ${emailResult.data.sent} emails`);
} else {
  console.error("Failed to send email");
}

// Script with complex return data
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const validation = await fm.script<ValidationResult>("ValidateOrder", {
  orderId: "ORDER-456",
});

if (validation.success && validation.data) {
  if (validation.data.valid) {
    console.log("Order is valid");
  } else {
    console.log("Validation errors:", validation.data.errors);
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
  $orderby?: [keyof T, "asc" | "desc"]; // Sort results
  $count?: boolean; // Include total count
}
```

### $select

Select specific fields to return (reduces payload size).

```typescript
const records = await fm.getRecords("Customers", {
  $select: ["ID", "Name", "Email"],
});
// The "ID" field is automatically quoted in the URL: $select="ID",Name,Email
```

**Note:** The `ID` field is a reserved keyword in OData and is automatically quoted when used in `$select`.

### $top

Limit the number of records returned.

```typescript
const records = await fm.getRecords("Products", {
  $top: 20,
});
```

### $skip

Skip a number of records (useful for pagination).

```typescript
// Get page 3 (records 41-60)
const records = await fm.getRecords("Products", {
  $skip: 40,
  $top: 20,
});
```

### $filter

Filter records using OData filter syntax. See [FileMaker's OData documentation](https://help.claris.com/en/odata-guide/content/query-option-filter.html) for complete filter syntax.

```typescript
// Comparison operators
const adults = await fm.getRecords("Users", {
  $filter: "Age ge 18",
});

// String functions
const gmailUsers = await fm.getRecords("Users", {
  $filter: "contains(Email, 'gmail.com')",
});

// Logical operators
const activeCustomers = await fm.getRecords("Customers", {
  $filter: "Status eq 'Active' and TotalPurchases gt 1000",
});

// Date comparisons
const recentOrders = await fm.getRecords("Orders", {
  $filter: "OrderDate gt 2024-01-01",
});
```

### $expand

Include related records in the response.

```typescript
const customers = await fm.getRecords("Customers", {
  $expand: "Orders",
});
```

### $orderby

Sort results by a field in ascending or descending order.

```typescript
const products = await fm.getRecords("Products", {
  $orderby: ["Price", "desc"],
});

const customers = await fm.getRecords("Customers", {
  $orderby: ["Name", "asc"],
});
```

### $count

Include the total count of matching records (automatically enabled in `getRecordsWithCount`).

```typescript
const records = await fm.getRecords("Products", {
  $count: true,
  $top: 10,
});
```

### Combining Options

All query options can be combined for complex queries.

```typescript
const result = await fm.getRecordsWithCount("Products", {
  $select: ["ID", "Name", "Price", "Category"],
  $filter: "Price gt 50 and Category eq 'Electronics'",
  $orderby: ["Price", "desc"],
  $top: 20,
  $skip: 0,
});

console.log(`Found ${result.count} products`);
console.log(`Showing ${result.data.length} results`);
```
