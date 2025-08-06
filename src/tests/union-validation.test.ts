import { zex } from "../zex/index.js";

export async function runUnionTests() {
  console.log("🧪 Testing Union Validation");
  console.log("===========================");

// Test 1: Simple Union
console.log("\n📋 TEST 1: Simple Union");
console.log("-".repeat(40));

const simpleUnionSchema = {
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "role": { "const": "system" },
        "content": { "type": "string" }
      },
      "required": ["role", "content"]
    },
    {
      "type": "object", 
      "properties": {
        "role": { "const": "assistant" },
        "content": { "type": "string" }
      },
      "required": ["role", "content"]
    }
  ]
};

const testData = {
  role: "assistant",
  content: "Hello!"
};

try {
  const zexSchema = zex.fromJsonSchema(simpleUnionSchema, { rootName: "SimpleUnion" });
  console.log("✅ Successfully converted JSON Schema to zex schema");
  
  const result = zexSchema.parse(testData);
  console.log("✅ Successfully validated data");
  console.log("   Result:", result);
  
} catch (error: any) {
  console.log("❌ Error:", error.message);
  console.log("   Error type:", error.constructor.name);
  
  if (error.path) {
    console.log("   Error path:", error.path);
  }
  if (error.code) {
    console.log("   Error code:", error.code);
  }
}

// Test 2: Complex Union in Array
console.log("\n📋 TEST 2: Complex Union in Array");
console.log("-".repeat(40));

const complexUnionSchema = {
  "type": "object",
  "properties": {
    "messages": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "createdAt": { "type": "number", "description": "...", "default": 0 },
              "tokenCount": { "type": "number", "description": "...", "default": 0 },
              "role": { "const": "system" },
              "content": { "type": "string", "description": "..." }
            },
            "required": ["role", "content"],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "createdAt": { "type": "number", "description": "...", "default": 0 },
              "tokenCount": { "type": "number", "description": "...", "default": 0 },
              "role": { "const": "assistant" },
              "content": { "type": "string", "description": "..." },
              "stopReason": {
                "enum": ["stop", "length", "content-filter", "tool-calls", "error", "other", "unknown"],
                "description": "..."
              }
            },
            "required": ["role", "content"],
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "required": ["messages"],
  "additionalProperties": false
};

const conversationData = {
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
      createdAt: 1754474081117,
      tokenCount: 0,
    },
    {
      role: "assistant",
      content: "Hi there! How can I help you today?\n",
      createdAt: 1754474090121,
      tokenCount: 11,
      stopReason: "STOP",
    }
  ]
};

try {
  const zexSchema = zex.fromJsonSchema(complexUnionSchema, { rootName: "Conversation" });
  console.log("✅ Successfully converted JSON Schema to zex schema");

  const result = zexSchema.parse(conversationData);
  console.log("✅ Successfully validated conversation data");
  console.log("   Validated data keys:", Object.keys(result));

} catch (error: any) {
  console.log("❌ Error:", error.message);
  console.log("   Error type:", error.constructor.name);

  if (error.path) {
    console.log("   Error path:", error.path);
  }
  if (error.code) {
    console.log("   Error code:", error.code);
  }
}

  console.log("\n✅ Union validation test completed!");
} 