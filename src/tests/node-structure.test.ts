// data-structure.test.ts - Generic Data Structure Tests
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== Generic Data Structure Tests ===");

// Define the schemas using zex
const ProtocolSchema = zex.enum([
  "action",
  "creator",
  "info",
  "setting",
  "reference",
  "definition",
  "system",
  "signal",
  "caller",
  "sender",
  "audit"
]);

const EntityTypeSchema = zex.enum([
  "group",
  "item",
  "processor",
  "input",
  "output",
  "connector",
  "storage",
  "widget"
]);

const ContentTypeSchema = zex.enum([
  "script",
  "text_template",
  "script_template",
  "system_template",
  "group",
  "undefined"
]);

const DetailsSchema = zex.object({
  name: zex.string().default("NewItem").describe("The name of the entity as it appears in its URI."),
  description: zex.string().default("New Item").describe("The description of the entity."),
  type: zex.string().default("item").describe("The type of the entity."),
  version: zex.string().default("1.0.0").describe("The version of the entity."),
  tags: zex.array(zex.string()).optional().describe("Tags for the entity")
});

const ReferenceSchema = zex.object({
  uri: zex.uri().optional().describe("The URI of the reference."),
  description: zex.string().optional().describe("The description of the reference."),
  inputSchema: zex.jsonschema().optional().describe("JSON Schema for input validation"),
  outputSchema: zex.jsonschema().optional().describe("JSON Schema for output structure"),
});

const ActionSchema = zex.object({
  name: zex.string().describe("Unique action identifier"),
  description: zex.string().describe("Description of what this action does"),
  inputSchema: zex.jsonschema().describe("JSON Schema for input validation"),
  outputSchema: zex.jsonschema().optional().describe("JSON Schema for output structure"),
});

const EntitySchema = zex.object({
  primaryId: zex.string().describe("Primary identifier..."),
  sortId: zex.string().describe("Sort identifier..."),
  type: EntityTypeSchema,
  details: DetailsSchema,
  configuration: zex.any().describe("The main configuration settings for this entity."),
  configSchema: zex.jsonschema().describe("JSON Schema for configuration settings"),
  actions: zex.array(ActionSchema).describe("Array of defined actions"),
  references: zex.array(ReferenceSchema).describe("Array of references"),
  payload: zex.any().describe("Main content of the entity. It can be a script or a template URI."),
  payloadType: ContentTypeSchema.describe("The type of the payload"),
  storageId: zex.string().default("").describe("The ID of the storage location for this entity."),
});

// ---

// Test 1: Valid Data Record (Normal JSON)
console.log("\n--- Test 1: Valid Data Record (Normal JSON) ---");
const validEntityRecord = {
  primaryId: "ENTITY#processor#data-fetcher",
  sortId: "DETAILS#v1",
  type: "processor",
  details: {
    name: "DataFetcher",
    description: "A data fetching processor",
    type: "processor",
    version: "1.0.0",
    tags: ["data", "fetch", "api"]
  },
  configuration: {
    apiKey: "abc123",
    baseUrl: "https://api.example.com",
    timeout: 5000
  },
  configSchema: {
    type: "object",
    properties: {
      apiKey: { type: "string" },
      baseUrl: { type: "string" },
      timeout: { type: "number" }
    },
    required: ["apiKey"]
  },
  actions: [
    {
      name: "fetch_data",
      description: "Get data for a specific query",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          format: { type: "string", enum: ["json", "xml"] }
        },
        required: ["query"]
      },
      outputSchema: {
        type: "object",
        properties: {
          data: { type: "object" },
          source: { type: "string" }
        }
      }
    }
  ],
  references: [
    {
      uri: "action://data-api",
      description: "External data API service",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" }
        }
      },
      outputSchema: {
        type: "object",
        properties: {
          result: { type: "object" }
        }
      }
    }
  ],
  payload: "function fetchData(query) return fetch('/data/' .. query) end",
  payloadType: "script",
  storageId: "storage_fetcher_001"
};

try {
  const parsedEntityRecord = EntitySchema.parse(validEntityRecord);
  console.log("✅ Valid data record parsed successfully");
  console.log("   Primary ID:", parsedEntityRecord.primaryId);
  console.log("   Type:", parsedEntityRecord.type);
  console.log("   Details name:", (parsedEntityRecord.details as any).name);
  console.log("   Actions count:", (parsedEntityRecord.actions as any[]).length);
  console.log("   References count:", (parsedEntityRecord.references as any[]).length);
  console.log("   Payload type:", parsedEntityRecord.payloadType);
} catch (error) {
  console.log("❌ Data record parsing failed:", error);
}

// ---

// Test 2: Lua-style Data Record
console.log("\n--- Test 2: Lua-style Data Record ---");
const luaStyleRecord = {
  primaryId: "ENTITY#processor#calculator",
  sortId: "DETAILS#v1",
  type: "processor",
  details: {
    name: "CalculatorProcessor",
    description: "A mathematical calculator processor",
    type: "processor",
    version: "1.0.0",
    tags: {} // Should become empty array
  },
  configuration: {
    precision: 2,
    maxDigits: 10
  },
  configSchema: {
    type: "object",
    properties: {
      precision: { type: "number" },
      maxDigits: { type: "number" }
    }
  },
  actions: {
    [1]: {
      name: "add",
      description: "Add two numbers",
      inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"] },
      outputSchema: { type: "object", properties: { result: { type: "number" } } }
    },
    [2]: {
      name: "multiply",
      description: "Multiply two numbers",
      inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a", "b"] }
    }
  },
  references: {}, // Should become empty array
  payload: "function add(a, b) return a + b end",
  payloadType: "script",
  storageId: "storage_calc_001"
};

try {
  const parsedLuaStyleRecord = EntitySchema.parseFromLua(luaStyleRecord);
  console.log("✅ Lua-style data record parsed successfully");
  console.log("   Primary ID:", parsedLuaStyleRecord.primaryId);
  console.log("   Type:", parsedLuaStyleRecord.type);
  console.log("   Details tags (should be array):", (parsedLuaStyleRecord.details as any).tags);
  console.log("   Actions count:", (parsedLuaStyleRecord.actions as any[]).length);
  console.log("   References count:", (parsedLuaStyleRecord.references as any[]).length);
  console.log("   Payload type:", parsedLuaStyleRecord.payloadType);
  console.log("   Tags is array:", Array.isArray((parsedLuaStyleRecord.details as any).tags));
  console.log("   Actions is array:", Array.isArray(parsedLuaStyleRecord.actions));
  console.log("   References is array:", Array.isArray(parsedLuaStyleRecord.references));
} catch (error) {
  console.log("❌ Lua-style data record parsing failed:", error);
}

// ---

// Test 3: Invalid Data Record - Wrong Type
console.log("\n--- Test 3: Invalid Data Record - Wrong Type ---");
const invalidTypeRecord = {
  primaryId: "ENTITY#processor#test",
  sortId: "DETAILS#v1",
  type: "invalid_type", // Invalid type
  details: { name: "TestItem", description: "A test item", type: "item", version: "1.0.0" },
  configuration: {},
  configSchema: {},
  actions: [],
  references: [],
  payload: "test",
  payloadType: "script",
  storageId: "storage_test_001"
};

try {
  const parsedInvalidTypeRecord = EntitySchema.parse(invalidTypeRecord);
  console.log("❌ Invalid data record should have failed but didn't:", parsedInvalidTypeRecord);
} catch (error) {
  console.log("✅ Invalid data record correctly rejected:", error instanceof Error ? error.message : String(error));
}

// ---

// Test 4: Invalid Data Record - Wrong Content Type
console.log("\n--- Test 4: Invalid Data Record - Wrong Content Type ---");
const invalidContentTypeRecord = {
  primaryId: "ENTITY#processor#test",
  sortId: "DETAILS#v1",
  type: "processor",
  details: { name: "TestItem", description: "A test item", type: "item", version: "1.0.0" },
  configuration: {},
  configSchema: {},
  actions: [],
  references: [],
  payload: "test",
  payloadType: "invalid_content_type", // Invalid content type
  storageId: "storage_test_001"
};

try {
  const parsedInvalidContentTypeRecord = EntitySchema.parse(invalidContentTypeRecord);
  console.log("❌ Invalid content type should have failed but didn't:", parsedInvalidContentTypeRecord);
} catch (error) {
  console.log("✅ Invalid content type correctly rejected:", error instanceof Error ? error.message : String(error));
}

// ---

// Test 5: Data Record with Missing Required Fields
console.log("\n--- Test 5: Data Record with Missing Required Fields ---");
const missingFieldsRecord = {
  // Missing primaryId, sortId, type, details, etc.
  configuration: {},
  configSchema: {},
  actions: [],
  references: [],
  payload: "test",
  payloadType: "script"
};

try {
  const parsedMissingFieldsRecord = EntitySchema.parse(missingFieldsRecord);
  console.log("❌ Missing fields should have failed but didn't:", parsedMissingFieldsRecord);
} catch (error) {
  console.log("✅ Missing fields correctly rejected:", error instanceof Error ? error.message : String(error));
}

// ---

// Test 6: Complex Nested Structure with Lua Transformation
console.log("\n--- Test 6: Complex Nested Structure with Lua Transformation ---");
const complexLuaRecord = {
  primaryId: "ENTITY#group#complex",
  sortId: "DETAILS#v1",
  type: "group",
  details: {
    name: "ComplexGroup",
    description: "A complex group with multiple components",
    type: "group",
    version: "2.0.0",
    tags: { [1]: "complex", [2]: "group", [3]: "multi-component" }
  },
  configuration: { components: { [1]: { name: "component1", type: "input" }, [2]: { name: "component2", type: "output" } } },
  configSchema: { type: "object", properties: { components: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string" } } } } } },
  actions: { [1]: { name: "process", description: "Process input data", inputSchema: { type: "object", properties: { data: { type: "string" } } }, outputSchema: { type: "object", properties: { result: { type: "string" } } } }, [2]: { name: "validate", description: "Validate input", inputSchema: { type: "object", properties: { input: { type: "string" } } } } },
  references: { [1]: { uri: "action://validator", description: "Input validation service", inputSchema: { type: "object", properties: { data: { type: "string" } } } }, [2]: { uri: "action://processor", description: "Data processing service", inputSchema: { type: "object", properties: { input: { type: "string" } } }, outputSchema: { type: "object", properties: { output: { type: "string" } } } } },
  payload: "function process(data) return validate(data) and transform(data) end",
  payloadType: "script_template",
  storageId: "storage_complex_001"
};

try {
  const parsedComplexLuaRecord = EntitySchema.parseFromLua(complexLuaRecord);
  console.log("✅ Complex Lua record parsed successfully");
  console.log("   Type:", parsedComplexLuaRecord.type);
  console.log("   Details tags count:", (parsedComplexLuaRecord.details as any).tags.length);
  console.log("   Actions count:", (parsedComplexLuaRecord.actions as any[]).length);
  console.log("   References count:", (parsedComplexLuaRecord.references as any[]).length);
  console.log("   Payload type:", parsedComplexLuaRecord.payloadType);
  console.log("   All arrays are arrays:", Array.isArray((parsedComplexLuaRecord.details as any).tags) && Array.isArray(parsedComplexLuaRecord.actions) && Array.isArray(parsedComplexLuaRecord.references));
} catch (error) {
  console.log("❌ Complex Lua record parsing failed:", error);
}

// ---

// Test 7: JSON Schema Generation
console.log("\n--- Test 7: JSON Schema Generation ---");

const entityJsonSchema = EntitySchema.toJsonSchema();
console.log("✅ Entity JSON Schema generated");
console.log("   Type:", entityJsonSchema.type);
console.log("   Properties count:", Object.keys(entityJsonSchema.properties || {}).length);
console.log("   Required fields:", entityJsonSchema.required?.length || 0);

const detailsJsonSchema = DetailsSchema.toJsonSchema();
console.log("✅ Details JSON Schema generated");
console.log("   Type:", detailsJsonSchema.type);
console.log("   Has default values:", !!detailsJsonSchema.properties?.name?.default);

const actionJsonSchema = ActionSchema.toJsonSchema();
console.log("✅ Action JSON Schema generated");
console.log("   Type:", actionJsonSchema.type);
console.log("   Required fields:", actionJsonSchema.required?.length || 0);

console.log("\n✅ All Data Structure tests completed!");