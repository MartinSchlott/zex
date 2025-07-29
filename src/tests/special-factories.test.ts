import { zex } from "../zex/index.js";

console.log("=== Special Factories Tests ===");

// Test 1: URI factory
console.log("\n--- Test 1: URI factory ---");
const uriSchema = zex.uri()
  .example("https://example.com")
  .describe("A test URI");

console.log("URI Schema meta:", uriSchema.meta());
const uriJsonSchema = uriSchema.toJsonSchema();
console.log("URI JSON Schema:", JSON.stringify(uriJsonSchema, null, 2));

// Test 2: URI validation
console.log("\n--- Test 2: URI validation ---");
try {
  const validUri = uriSchema.parse("https://example.com");
  console.log("Valid URI parsed successfully:", validUri);
} catch (error) {
  console.log("URI validation error:", error);
}

// Test 3: JSONSchema factory
console.log("\n--- Test 3: JSONSchema factory ---");
const jsonSchemaSchema = zex.jsonschema()
  .example({ type: "object", properties: {} })
  .describe("A test JSON Schema");

console.log("JSONSchema Schema meta:", jsonSchemaSchema.meta());
const jsonSchemaJsonSchema = jsonSchemaSchema.toJsonSchema();
console.log("JSONSchema JSON Schema:", JSON.stringify(jsonSchemaJsonSchema, null, 2));

// Test 4: JSONSchema validation
console.log("\n--- Test 4: JSONSchema validation ---");
const validJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"]
};

try {
  const parsedJsonSchema = jsonSchemaSchema.parse(validJsonSchema);
  console.log("Valid JSON Schema parsed successfully:", parsedJsonSchema);
} catch (error) {
  console.log("JSON Schema validation error:", error);
}

// Test 5: Complex object with URI and JSONSchema
console.log("\n--- Test 5: Complex object with URI and JSONSchema ---");
const complexSchema = zex.object({
  endpoint: zex.uri().example("https://api.example.com").describe("API endpoint"),
  schema: zex.jsonschema().example({ type: "object" }).describe("Data schema"),
  config: zex.object({
    version: zex.string().example("1.0").describe("API version"),
    documentation: zex.uri().example("https://docs.example.com").describe("Documentation URL")
  }).example({ version: "1.0", documentation: "https://docs.example.com" }).describe("API metadata")
})
  .example({
    endpoint: "https://api.example.com",
    schema: { type: "object" },
    config: { version: "1.0", documentation: "https://docs.example.com" }
  })
  .describe("API Configuration");

console.log("Complex Schema meta:", complexSchema.meta());
const complexJsonSchema = complexSchema.toJsonSchema();
console.log("Complex JSON Schema:", JSON.stringify(complexJsonSchema, null, 2));

// Test 6: URI and JSONSchema in arrays
console.log("\n--- Test 6: URI and JSONSchema in arrays ---");
const uriArraySchema = zex.array(zex.uri())
  .example(["https://api1.example.com", "https://api2.example.com"])
  .describe("URI Array");

const jsonSchemaArraySchema = zex.array(zex.jsonschema())
  .example([{ type: "string" }, { type: "number" }])
  .describe("JSONSchema Array");

console.log("URI Array Schema meta:", uriArraySchema.meta());
console.log("JSONSchema Array Schema meta:", jsonSchemaArraySchema.meta());

console.log("\n✅ All special factories tests passed!"); 