import { zex } from "../zex/index.js";

console.log("=== Invalid JSON Schema Error Test ===");

// Test 1: Reproduce the exact error scenario
console.log("\n--- Test 1: Exact Error Scenario ---");

const toolDefinition = {
  name: "set",
  description: "Speichert einen Wert unter einem Schlüssel",
  inputSchema: {
    type: "object",
    properties: {
      key: {
        type: "string",
      },
      value: {
        // ← Das ist das Problem: leeres Objekt ist kein gültiges JSON Schema
      },
    },
    required: [
      "key",
      "value",
    ],
  },
  outputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
      },
    },
  },
};

console.log("Tool definition:", JSON.stringify(toolDefinition, null, 2));

try {
  const result = zex.fromJsonSchema(toolDefinition.inputSchema, { rootName: "Input Schema Validation 001" });
  console.log("❌ Expected error but got success");
  console.log("   Result:", result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Error caught as expected");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'value':", errorMessage.includes('value'));
  console.log("   Error contains 'Input Schema Validation 001':", errorMessage.includes('Input Schema Validation 001'));
}

// Test 2: Test with different invalid schemas
console.log("\n--- Test 2: Different Invalid Schemas ---");

const invalidSchemas = [
  {
    name: "Empty object",
    schema: {}
  },
  {
    name: "Object with empty property",
    schema: {
      type: "object",
      properties: {
        empty: {}
      }
    }
  },
  {
    name: "Array with empty items",
    schema: {
      type: "array",
      items: {}
    }
  },
  {
    name: "Object with null property",
    schema: {
      type: "object",
      properties: {
        nullProp: null
      }
    }
  }
];

for (const testCase of invalidSchemas) {
  console.log(`\nTesting: ${testCase.name}`);
  try {
    const result = zex.fromJsonSchema(testCase.schema, { rootName: testCase.name });
    console.log("❌ Expected error but got success");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("✅ Error caught:", errorMessage);
  }
}

// Test 3: Test safeFromJsonSchema
console.log("\n--- Test 3: safeFromJsonSchema Test ---");

const safeResult = zex.safeFromJsonSchema(toolDefinition.inputSchema, { rootName: "Safe Test" });
console.log("Safe result success:", safeResult.success);
if (!safeResult.success) {
  console.log("Safe result error:", safeResult.error);
}

// Test 4: Test with valid schema for comparison
console.log("\n--- Test 4: Valid Schema Comparison ---");

const validSchema = {
  type: "object",
  properties: {
    key: {
      type: "string",
    },
    value: {
      type: "any"  // ← Das wäre gültig
    },
  },
  required: [
    "key",
    "value",
  ],
};

try {
  const result = zex.fromJsonSchema(validSchema, { rootName: "Valid Schema Test" });
  console.log("✅ Valid schema parsed successfully");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ Valid schema failed:", errorMessage);
}

console.log("\n✅ Invalid JSON Schema error test completed!"); 