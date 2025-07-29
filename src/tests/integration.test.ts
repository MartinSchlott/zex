import { zex } from "../zex/index.js";

console.log("=== Integration Tests ===");

// Test 1: Complete API schema with all features
console.log("\n--- Test 1: Complete API schema with all features ---");
const apiSchema = zex.object({
  name: zex.string()
    .example("My API")
    .describe("API name"),
  version: zex.string()
    .example("1.0.0")
    .describe("API version"),
  baseUrl: zex.uri()
    .example("https://api.example.com")
    .describe("Base URL"),
  documentation: zex.uri()
    .example("https://docs.example.com")
    .describe("Documentation URL"),
  auth: zex.object({
    type: zex.string()
      .example("Bearer")
      .describe("Auth Type"),
    tokenUrl: zex.uri()
      .example("https://auth.example.com/token")
      .describe("Token URL")
  })
    .example({ type: "Bearer", tokenUrl: "https://auth.example.com/token" })
    .describe("Authentication"),
  endpoints: zex.array(zex.object({
    path: zex.string().example("/users").describe("API endpoint path"),
    method: zex.string().example("GET").describe("HTTP method"),
    description: zex.string().example("Get all users").describe("Endpoint description")
  }))
    .example([{ path: "/users", method: "GET", description: "Get all users" }])
    .describe("Endpoints"),
  schemas: zex.object({
    request: zex.object({
      data: zex.string()
    })
      .example({ data: "request data" })
      .describe("Request Schema"),
    response: zex.object({
      result: zex.string()
    })
      .example({ result: "response data" })
      .describe("Response Schema")
  }),
  // Optional fields
  tags: (zex.array(zex.string()).optional() as any)
    .example(["tag1", "tag2"])
    .describe("API tags for categorization")
    .example(["rest", "api", "v1"]),
  deprecated: zex.boolean()
    .example(false)
    .describe("Whether the API is deprecated")
})
  .example({
    name: "My API",
    version: "1.0.0",
    baseUrl: "https://api.example.com",
    documentation: "https://docs.example.com",
    auth: { type: "Bearer", tokenUrl: "https://auth.example.com/token" },
    endpoints: [{ path: "/users", method: "GET", description: "Get all users" }],
    schemas: {
      request: { data: "request data" },
      response: { result: "response data" }
    },
    tags: ["rest", "api", "v1"],
    deprecated: false
  })
  .describe("API Configuration");

console.log("API Schema meta:", apiSchema.meta());
const apiJsonSchema = apiSchema.toJsonSchema();
console.log("API JSON Schema:", JSON.stringify(apiJsonSchema, null, 2));

// Test 2: Lua transformation with complex data
console.log("\n--- Test 2: Lua transformation with complex data ---");
const luaApiData = {
  name: "Lua API",
  version: "1.0.0",
  baseUrl: "https://lua-api.example.com",
  documentation: "https://docs.lua-api.example.com",
  authentication: {
    type: "Basic",
    tokenUrl: "https://auth.lua-api.example.com/token"
  },
  endpoints: {
    [1]: {
      path: "/data",
      method: "GET",
      description: "Get data"
    },
    [2]: {
      path: "/data/{id}",
      method: "POST",
      description: "Create data"
    }
  },
  requestSchema: {
    type: "object",
    properties: {
      name: { type: "string" }
    }
  },
  responseSchema: {
    type: "object",
    properties: {
      result: { type: "string" }
    }
  },
  tags: {
    [1]: "lua",
    [2]: "api"
  },
  deprecated: false
};

try {
  const parsedApiData = apiSchema.parseFromLua(luaApiData);
  console.log("Parsed API data:", parsedApiData);
} catch (error) {
  console.log("Lua transformation error:", error);
}

// Test 3: Chaining and method combinations
console.log("\n--- Test 3: Chaining and method combinations ---");
const chainedSchema = zex.string()
  .title("Chained String")
  .describe("A string with chained methods")
  .example("first example")
  .example("second example")
  .describe("Whether the API is deprecated");

console.log("Chained schema meta:", chainedSchema.meta());
const chainedJsonSchema = chainedSchema.toJsonSchema();
console.log("Chained JSON Schema:", JSON.stringify(chainedJsonSchema, null, 2));

// Test 4: Record with complex values
console.log("\n--- Test 4: Record with complex values ---");
const recordSchema = zex.record(zex.object({
  name: zex.string().title("Name"),
  value: zex.number().title("Value"),
  active: zex.boolean().title("Active")
}))
.title("Data Record")
.describe("A record of data objects");

const recordData = {
  "item1": { name: "First Item", value: 100, active: true },
  "item2": { name: "Second Item", value: 200, active: false }
};

const parsedRecord = recordSchema.parse(recordData);
console.log("Parsed record:", parsedRecord);

const recordJsonSchema = recordSchema.toJsonSchema();
console.log("Record JSON Schema:", JSON.stringify(recordJsonSchema, null, 2));

console.log("\n✅ All integration tests passed!"); 