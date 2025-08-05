import { zex } from "../zex/index.js";

console.log("=== Record JSON Schema Test ===");

// Test 1: Basic record with any
console.log("\n--- Test 1: Basic record with any ---");

const createInputSchema = zex.object({
    uri: zex.string().describe("URI for the node to create"),
    params: zex.record(zex.any()).optional().describe("Creation parameters")
});

const jsonSchema = zex.toJSONSchema(createInputSchema);
console.log("Full schema:", JSON.stringify(jsonSchema, null, 2));

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

console.log("\n✅ Record JSON Schema test completed!"); 