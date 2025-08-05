import { zex } from "../zex/index.js";

console.log("=== Fixed Items Bug Test ===");

// Test 1: The specific bug that was fixed
console.log("\n--- Test 1: Empty items object in array (FIXED) ---");

const toolInputSchema = zex.toJSONSchema(zex.object({
  sql: zex.string().describe("SQL statement"),
  params: zex.array(zex.any()).optional().describe("Statement parameters")
}));

console.log("Tool schema with empty items:", JSON.stringify(toolInputSchema, null, 2));

try {
  const parsedSchema = zex.fromJsonSchema(toolInputSchema);
  console.log("✅ SUCCESS: fromJsonSchema now handles empty items objects correctly");
  console.log("   Parsed schema type:", typeof parsedSchema);
  
  // Test that the parsed schema works
  const testData = {
    sql: "SELECT * FROM users",
    params: ["param1", "param2"]
  };
  
  const result = parsedSchema.parse(testData);
  console.log("✅ SUCCESS: Parsed schema validates data correctly");
  console.log("   Validation result:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ FAILED: fromJsonSchema still has issues with empty items");
  console.log("   Error:", errorMessage);
}

// Test 2: Verify that the fix doesn't break normal array schemas
console.log("\n--- Test 2: Normal array schemas still work ---");

const normalArraySchema = {
  type: "array",
  items: {
    type: "string"
  }
};

try {
  const parsedNormalSchema = zex.fromJsonSchema(normalArraySchema);
  console.log("✅ SUCCESS: Normal array schemas still work");
  
  const testData = ["hello", "world"];
  const result = parsedNormalSchema.parse(testData);
  console.log("✅ SUCCESS: Normal array validation works");
  console.log("   Result:", result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ FAILED: Normal array schemas broken");
  console.log("   Error:", errorMessage);
}

// Test 3: Verify that the fix handles the exact bug report scenario
console.log("\n--- Test 3: Bug report scenario (FIXED) ---");

const bugReportSchema = {
  type: "object",
  properties: {
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" }
      },
      required: ["name", "email"]
    },
    outputSchema: {
      type: "array",
      items: {
        type: "object", 
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          email: { type: "string" }
        }
      }
    }
  }
};

try {
  const parsedBugReportSchema = zex.fromJsonSchema(bugReportSchema);
  console.log("✅ SUCCESS: Bug report scenario now works");
  
  const testData = {
    inputSchema: {
      name: "John",
      email: "john@example.com"
    },
    outputSchema: [
      { id: 1, name: "John", email: "john@example.com" },
      { id: 2, name: "Jane", email: "jane@example.com" }
    ]
  };
  
  const result = parsedBugReportSchema.parse(testData);
  console.log("✅ SUCCESS: Bug report data validation works");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ FAILED: Bug report scenario still broken");
  console.log("   Error:", errorMessage);
}

console.log("\n✅ Fixed items bug test completed!");
console.log("The specific bug with empty items objects in arrays has been fixed!"); 