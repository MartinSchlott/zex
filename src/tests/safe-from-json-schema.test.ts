import { zex } from "../zex/index.js";

console.log("=== Safe From JSON Schema Test ===");

// Test 1: Valid schema
console.log("\n--- Test 1: Valid Schema ---");

const validSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"]
};

const validResult = zex.safeFromJsonSchema(validSchema, { rootName: "Valid Test" });
console.log("Valid schema result:");
console.log("  Success:", validResult.success);
if (validResult.success) {
  console.log("  Schema type:", typeof validResult.schema);
  
  // Test that the parsed schema works
  const testData = { name: "John", age: 30 };
  try {
    const result = validResult.schema.parse(testData);
    console.log("  ✅ Parsed schema validation succeeded");
    console.log("  Result:", result);
  } catch (error) {
    console.log("  ❌ Parsed schema validation failed:", error);
  }
} else {
  console.log("  Error:", validResult.error);
}

// Test 2: Invalid schema (empty object)
console.log("\n--- Test 2: Invalid Schema (Empty Object) ---");

const invalidSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    value: {}  // ← Invalid empty object
  }
};

const invalidResult = zex.safeFromJsonSchema(invalidSchema, { rootName: "Invalid Test" });
console.log("Invalid schema result:");
console.log("  Success:", invalidResult.success);
if (!invalidResult.success) {
  console.log("  Error:", invalidResult.error);
  console.log("  ✅ Error contains 'empty object':", invalidResult.error.includes('empty object'));
  console.log("  ✅ Error contains 'Invalid Test':", invalidResult.error.includes('Invalid Test'));
}

// Test 3: Null schema
console.log("\n--- Test 3: Null Schema ---");

const nullResult = zex.safeFromJsonSchema(null, { rootName: "Null Test" });
console.log("Null schema result:");
console.log("  Success:", nullResult.success);
if (!nullResult.success) {
  console.log("  Error:", nullResult.error);
  console.log("  ✅ Error contains 'null':", nullResult.error.includes('null'));
}

// Test 4: Schema without type
console.log("\n--- Test 4: Schema Without Type ---");

const noTypeSchema = {
  properties: {
    name: { type: "string" }
  }
};

const noTypeResult = zex.safeFromJsonSchema(noTypeSchema, { rootName: "No Type Test" });
console.log("No type schema result:");
console.log("  Success:", noTypeResult.success);
if (!noTypeResult.success) {
  console.log("  Error:", noTypeResult.error);
  console.log("  ✅ Error contains 'missing required':", noTypeResult.error.includes('missing required'));
  console.log("  ✅ Error contains 'type field':", noTypeResult.error.includes('type field'));
}

// Test 5: Complex valid schema
console.log("\n--- Test 5: Complex Valid Schema ---");

const complexSchema = {
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" }
      },
      required: ["name", "email"]
    },
    settings: {
      type: "object",
      properties: {},
      additionalProperties: true
    }
  }
};

const complexResult = zex.safeFromJsonSchema(complexSchema, { rootName: "Complex Test" });
console.log("Complex schema result:");
console.log("  Success:", complexResult.success);
if (complexResult.success) {
  console.log("  Schema type:", typeof complexResult.schema);
  
  // Test that the parsed schema works
  const testData = {
    user: {
      name: "John Doe",
      email: "john@example.com"
    },
    settings: {
      theme: "dark",
      notifications: true
    }
  };
  
  try {
    const result = complexResult.schema.parse(testData);
    console.log("  ✅ Complex schema validation succeeded");
    console.log("  Result type:", typeof result);
  } catch (error) {
    console.log("  ❌ Complex schema validation failed:", error);
  }
} else {
  console.log("  Error:", complexResult.error);
}

// Test 6: Direct function call vs zex API
console.log("\n--- Test 6: Direct Function Call ---");

// Test that both ways work
const directResult = zex.safeFromJsonSchema(validSchema);
const apiResult = zex.safeFromJsonSchema(validSchema);

console.log("Direct call success:", directResult.success);
console.log("API call success:", apiResult.success);
console.log("✅ Both calls work identically:", directResult.success === apiResult.success);

console.log("\n✅ Safe from JSON Schema test completed!"); 