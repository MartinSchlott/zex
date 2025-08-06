import { zex } from "./dist/zex/index.js";

console.log("🧪 Testing Complex Union Validation Bug");
console.log("=======================================");

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

try {
  // Convert JSON Schema to zex schema
  const zexSchema = zex.fromJsonSchema(conversationSchema, { rootName: "Conversation" });
  console.log("✅ Successfully converted JSON Schema to zex schema");
  
  // Validate the data
  const result = zexSchema.parse(conversationData);
  console.log("✅ Successfully validated conversation data");
  console.log("Validated data keys:", Object.keys(result));
  
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

console.log("\n✅ Complex union validation test completed!"); 