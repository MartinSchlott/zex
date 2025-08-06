import { zex } from "../zex/index.js";

console.log("🧪 Testing Union Validation Bug");
console.log("===============================");

// Simplified version of the conversation schema to reproduce the bug
const messageSchema = {
  "type": "object",
  "properties": {
    "role": {
      "const": "system"
    },
    "content": {
      "type": "string"
    }
  },
  "required": ["role", "content"]
};

const messageSchema2 = {
  "type": "object", 
  "properties": {
    "role": {
      "const": "assistant"
    },
    "content": {
      "type": "string"
    }
  },
  "required": ["role", "content"]
};

// Create a union schema (anyOf)
const unionSchema = {
  "anyOf": [messageSchema, messageSchema2]
};

// Test data that should match the second variant
const testData = {
  role: "assistant",
  content: "Hello!"
};

console.log("📋 Test: Union validation with anyOf");
console.log("Schema:", JSON.stringify(unionSchema, null, 2));
console.log("Test data:", JSON.stringify(testData, null, 2));

try {
  // Convert JSON Schema to zex schema
  const zexSchema = zex.fromJsonSchema(unionSchema, { rootName: "MessageUnion" });
  console.log("✅ Successfully converted JSON Schema to zex schema");
  
  // Validate the data
  const result = zexSchema.parse(testData);
  console.log("✅ Successfully validated data");
  console.log("Result:", result);
  
} catch (error) {
  console.log("❌ Error:", error.message);
  console.log("Error type:", error.constructor.name);
  
  // If it's a ZexError, show more details
  if (error.path) {
    console.log("Error path:", error.path);
  }
  if (error.code) {
    console.log("Error code:", error.code);
  }
}

console.log("\n✅ Union validation test completed!"); 