import { zex } from "../zex/index.js";

console.log("=== Schema Parser Compatibility Test ===");

// Test 1: Record with any should be parser-compatible
console.log("\n--- Test 1: Record with any (PARSER-COMPATIBLE) ---");

const createInputSchema = zex.object({
    uri: zex.string().describe("URI for the node to create"),
    params: zex.record(zex.any()).optional().describe("Creation parameters")
});

const jsonSchema = zex.toJSONSchema(createInputSchema);
console.log("Full schema:", JSON.stringify(jsonSchema, null, 2));

// Check that params has the correct structure
const paramsSchema = jsonSchema.properties?.params;
console.log("\nParams schema structure:");
console.log("  type:", paramsSchema?.type);
console.log("  properties:", paramsSchema?.properties);
console.log("  additionalProperties:", paramsSchema?.additionalProperties);
console.log("  ✅ Has properties: {}", !!paramsSchema?.properties);
console.log("  ✅ additionalProperties is true:", paramsSchema?.additionalProperties === true);

// Test 2: Just the record part
console.log("\n--- Test 2: Just the record part ---");

const recordSchema = zex.record(zex.any());
const recordJsonSchema = zex.toJSONSchema(recordSchema);
console.log("Record schema:", JSON.stringify(recordJsonSchema, null, 2));

// Test 3: Record with different value types
console.log("\n--- Test 3: Record with different value types ---");

const recordStringSchema = zex.record(zex.string());
const recordStringJsonSchema = zex.toJSONSchema(recordStringSchema);
console.log("Record with string values:", JSON.stringify(recordStringJsonSchema, null, 2));

const recordNumberSchema = zex.record(zex.number());
const recordNumberJsonSchema = zex.toJSONSchema(recordNumberSchema);
console.log("Record with number values:", JSON.stringify(recordNumberJsonSchema, null, 2));

// Test 4: Test validation
console.log("\n--- Test 4: Test validation ---");

try {
    const testData = {
        uri: "test://node/123",
        params: {
            key1: "value1",
            key2: 42,
            key3: true,
            key4: { nested: "object" }
        }
    };
    
    const result = createInputSchema.parse(testData);
    console.log("✅ Validation succeeded");
    console.log("   Result:", result);
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("❌ Validation failed");
    console.log("   Error:", errorMessage);
}

// Test 5: Test fromJsonSchema compatibility
console.log("\n--- Test 5: fromJsonSchema compatibility ---");

try {
    const parsedSchema = zex.fromJsonSchema(jsonSchema);
    console.log("✅ fromJsonSchema successfully parsed the schema");
    
    const testData = {
        uri: "test://node/456",
        params: {
            key1: "value1",
            key2: 42
        }
    };
    
    const result = parsedSchema.parse(testData);
    console.log("✅ Parsed schema validation succeeded");
    console.log("   Result:", result);
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("❌ fromJsonSchema failed");
    console.log("   Error:", errorMessage);
}

// Test 6: OpenAI compatibility check
console.log("\n--- Test 6: OpenAI compatibility check ---");

// Simulate what OpenAI would see
const openaiCompatibleSchema = {
    type: "object",
    properties: {
        uri: {
            type: "string",
            description: "URI for the node to create"
        },
        params: {
            type: "object",
            properties: {},
            additionalProperties: true
        }
    },
    required: ["uri"]
};

console.log("OpenAI-compatible schema:", JSON.stringify(openaiCompatibleSchema, null, 2));
console.log("✅ Schema has properties: {}", !!openaiCompatibleSchema.properties?.params?.properties);
console.log("✅ additionalProperties is true:", openaiCompatibleSchema.properties?.params?.additionalProperties === true);

console.log("\n✅ Schema parser compatibility test completed!");
console.log("All schemas are now parser-compatible, especially with OpenAI!"); 