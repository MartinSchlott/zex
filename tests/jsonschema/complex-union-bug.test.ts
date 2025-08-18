import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== JSONSCHEMA: complex union bug test ===");

// The complex conversation schema that causes the bug
const conversationSchema = {
  "type": "object",
  "properties": {
    "messages": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "createdAt": {
                "type": "number",
                "description": "Unix timestamp (ms) when the message was created.",
                "default": 0
              },
              "tokenCount": {
                "type": "number",
                "description": "Estimated or measured number of tokens in this message.",
                "default": 0
              },
              "role": {
                "const": "system"
              },
              "content": {
                "type": "string",
                "description": "System prompt content injected into the conversation."
              }
            },
            "required": [
              "role",
              "content"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "createdAt": {
                "type": "number",
                "description": "Unix timestamp (ms) when the message was created.",
                "default": 0
              },
              "tokenCount": {
                "type": "number",
                "description": "Estimated or measured number of tokens in this message.",
                "default": 0
              },
              "role": {
                "const": "assistant"
              },
              "content": {
                "type": "string",
                "description": "Assistant's textual response, or null if only tool calls were made."
              },
              "stopReason": {
                "enum": [
                  "stop",
                  "length",
                  "content-filter",
                  "tool-calls",
                  "error",
                  "other",
                  "unknown"
                ],
                "description": "Reason for stopping the LLM response."
              }
            },
            "required": [
              "role",
              "content"
            ],
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "required": [
    "messages"
  ],
  "additionalProperties": false
};

// The input data that causes the error
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

console.log("📋 Test: Complex conversation validation");
console.log("Data:", JSON.stringify(conversationData, null, 2));

// Test 1: Convert JSON Schema to zex schema
let zexSchema: any;
try {
  zexSchema = zex.fromJsonSchema(conversationSchema, { rootName: "Conversation" });
  console.log("✅ Successfully converted JSON Schema to zex schema");
  expectOk('JSON Schema conversion succeeds', () => zexSchema !== undefined);
} catch (error) {
  console.log("❌ Error during conversion:", error instanceof Error ? error.message : String(error));
  expectFail('JSON Schema conversion should succeed', () => true);
}

// Test 2: Validate the data
if (zexSchema) {
  try {
    const result = zexSchema.parse(conversationData);
    console.log("✅ Successfully validated conversation data");
    console.log("Validated data keys:", Object.keys(result));
    expectOk('conversation data validation succeeds', () => result.messages.length === 2);
  } catch (error) {
  console.log("❌ Error during validation:", error instanceof Error ? error.message : String(error));
  console.log("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    
    // If it's a ZexError, show more details
    if (error && typeof error === 'object' && 'path' in error) {
      console.log("Error path:", (error as any).path);
    }
    if (error && typeof error === 'object' && 'code' in error) {
      console.log("Error code:", (error as any).code);
    }
    
    expectFail('conversation data validation should succeed', () => true);
  }
}

console.log("\n✅ Complex union validation test completed!");
