import { zex } from "../zex/index.js";

console.log("=== Tool JSON Schema Items Bug Test ===");

// Test 1: Reproduce the tool definition scenario
console.log("\n--- Test 1: Tool Definition Scenario ---");

// This simulates the tool definition in sql-core.ts
const toolInputSchema = zex.toJSONSchema(zex.object({
  sql: zex.string().describe("SQL statement"),
  params: zex.array(zex.any()).optional().describe("Statement parameters")
}));

console.log("Tool input schema:", JSON.stringify(toolInputSchema, null, 2));

// Test 2: Try to validate this schema with jsonschema()
console.log("\n--- Test 2: jsonschema() validation of tool schema ---");

try {
  const jsonschemaValidator = zex.jsonschema();
  const result = jsonschemaValidator.parse(toolInputSchema);
  console.log("✅ jsonschema() successfully validated tool schema");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ jsonschema() failed to validate tool schema");
  console.log("   Error:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
}

// Test 3: Simulate the actual tool call scenario
console.log("\n--- Test 3: Tool Call Scenario ---");

// This simulates the tool call data
const toolCallData = {
  uri: "tool:/store/SQL-Database/execute",
  params: {
    sql: "INSERT INTO users (name, email) VALUES (?, ?)",
    params: ["Max Mustermann", "max@example.com"]  // ← Das Array hier!
  }
};

console.log("Tool call data:", JSON.stringify(toolCallData, null, 2));

// Test 4: Try to validate the tool call against the schema
console.log("\n--- Test 4: Tool Call Validation ---");

try {
  // This simulates what might happen in the tool validation system
  const toolSchema = zex.object({
    uri: zex.string(),
    params: zex.jsonschema()  // This is where the bug might occur
  });
  
  const result = toolSchema.parse(toolCallData);
  console.log("✅ Tool call validation succeeded");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ Tool call validation failed");
  console.log("   Error:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
}

// Test 5: Test the specific array with items scenario
console.log("\n--- Test 5: Array with Items Scenario ---");

const arrayWithItemsSchema = {
  type: "array",
  items: {
    type: "any"
  }
};

try {
  const jsonschemaValidator = zex.jsonschema();
  const result = jsonschemaValidator.parse(arrayWithItemsSchema);
  console.log("✅ jsonschema() successfully validated array with items");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ jsonschema() failed to validate array with items");
  console.log("   Error:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
}

// Test 6: Test the exact scenario from the bug report
console.log("\n--- Test 6: Exact Bug Report Scenario ---");

// This simulates the exact scenario described in the bug report
const exactBugScenario = {
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
};

try {
  const testSchema = zex.object({
    inputSchema: zex.jsonschema().describe("Input Schema"),
    outputSchema: zex.jsonschema().describe("Output Schema")
  });
  
  const result = testSchema.parse(exactBugScenario);
  console.log("✅ Exact bug scenario succeeded");
  console.log("   Result type:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ Exact bug scenario failed");
  console.log("   Error:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
}

// Test 7: Test fromJsonSchema with the tool schema
console.log("\n--- Test 7: fromJsonSchema with Tool Schema ---");

try {
  const parsedSchema = zex.fromJsonSchema(toolInputSchema);
  console.log("✅ fromJsonSchema successfully parsed tool schema");
  console.log("   Parsed schema type:", typeof parsedSchema);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ fromJsonSchema failed to parse tool schema");
  console.log("   Error:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
}

console.log("\n✅ Tool JSON Schema items bug test completed!"); 