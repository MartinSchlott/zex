import { zex } from '../zex/index.js';

console.log("=== LLM CONFIG BUG TEST ===");

// =============================================================================
// TEST: LLM Config Schema Bug Reproduction
// =============================================================================

console.log("\n--- Test: LLM Config Schema Bug Reproduction ---");

const llmConfigJson = {
  "model": "gemini-2.0-flash",
  "apiKey": "here is a key",
  "synchronous": false
};

const llmConfigSchema = {
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "description": "Model|The model identifier specific to the selected provider."
    },
    "apiKey": {
      "type": "string",
      "description": "API Key|The API key for authenticating with the provider's service."
    },
    "apiUrl": {
      "type": "string",
      "description": "API URL|The optional custom API endpoint URL."
    },
    "synchronous": {
      "type": "boolean",
      "default": false,
      "description": "Synchronous|If true, the LLM service will be used in synchronous mode which means only one request will be sent at a time."
    },
    "fastfail": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "stop",
          "length",
          "content-filter",
          "tool-calls",
          "error",
          "other",
          "unknown"
        ]
      },
      "description": "Fast Fail|Array of finish reasons that should immediately throw an error instead of being handled by consuming thinklets."
    },
    "options": {
      "type": "object",
      "properties": {
        "rpm": {
          "type": "number",
          "description": "RPM|The requests per minute limit enforced by the client for this service."
        },
        "tpm": {
          "type": "number",
          "description": "TPM|The tokens per minute limit enforced by the client for this service."
        },
        "temperature": {
          "type": "number",
          "description": "Temperature|The temperature for the LLM service."
        },
        "maxTokens": {
          "type": "number",
          "description": "Max Tokens|The maximum number of tokens to generate in the completion response."
        },
        "timeoutSeconds": {
          "type": "number",
          "description": "Timeout|The request timeout in seconds."
        }
      },
      "additionalProperties": false,
      "description": "Optional configuration parameters influencing request behavior or applying limits."
    }
  },
  "required": [
    "model"
  ],
  "additionalProperties": false,
  "description": "LLMServiceConfigSchema|The configuration for an LLM service instance.",
  "$schema": "http://json-schema.org/draft-07/schema#"
};

console.log("✅ Test data prepared");

// Test 1: Try to create schema from JSON Schema
console.log("\n--- Test 1: Schema Creation ---");

try {
  const schema = zex.fromJsonSchema(llmConfigSchema);
  console.log("✅ Schema creation successful");
  console.log("✅ Schema type:", schema.constructor.name);
  
  // Test 2: Try to parse the config
  console.log("\n--- Test 2: Config Parsing ---");
  
  try {
    const result = schema.parse(llmConfigJson);
    console.log("✅ Config parsing successful:", result);
  } catch (error) {
    console.log("❌ Config parsing failed:", error);
  }
  
  // Test 3: Try safeParse
  console.log("\n--- Test 3: Safe Parse ---");
  
  try {
    const safeResult = schema.safeParse(llmConfigJson);
    if (safeResult.success) {
      console.log("✅ Safe parse successful:", safeResult.data);
    } else {
      console.log("❌ Safe parse failed:", safeResult.error);
    }
  } catch (error) {
    console.log("❌ Safe parse threw error:", error);
  }
  
} catch (error) {
  console.log("❌ Schema creation failed:", error);
  console.log("❌ Error details:", error instanceof Error ? error.message : String(error));
  console.log("❌ Error stack:", error instanceof Error ? error.stack : "No stack");
}

// Test 4: Test individual components
console.log("\n--- Test 4: Individual Component Tests ---");

// Test enum array
try {
  const enumArraySchema = zex.fromJsonSchema({
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["stop", "length", "content-filter", "tool-calls", "error", "other", "unknown"]
    }
  });
  console.log("✅ Enum array schema creation successful");
  
  const enumArrayData = ["stop", "length"];
  const enumArrayResult = enumArraySchema.parse(enumArrayData);
  console.log("✅ Enum array parsing successful:", enumArrayResult);
} catch (error) {
  console.log("❌ Enum array test failed:", error);
}

// Test object with additionalProperties: false
try {
  const optionsSchema = zex.fromJsonSchema({
    "type": "object",
    "properties": {
      "rpm": { "type": "number" },
      "tpm": { "type": "number" }
    },
    "additionalProperties": false
  });
  console.log("✅ Options schema creation successful");
  
  const optionsData = { rpm: 100, tpm: 1000 };
  const optionsResult = optionsSchema.parse(optionsData);
  console.log("✅ Options parsing successful:", optionsResult);
} catch (error) {
  console.log("❌ Options test failed:", error);
}

// Test 5: Debug the specific error
console.log("\n--- Test 5: Debug Specific Error ---");

try {
  // Try to identify where the 'map' error comes from
  const schema = zex.fromJsonSchema(llmConfigSchema);
  
  // Check if the schema has the expected structure
  console.log("✅ Schema created, checking structure...");
  
  // Try to access the schema's internal structure
  const jsonSchema = schema.toJsonSchema();
  console.log("✅ Schema can generate JSON Schema:", jsonSchema.type === "object");
  
} catch (error) {
  console.log("❌ Debug test failed:", error);
  console.log("❌ Error type:", (error as any).constructor.name);
  console.log("❌ Error message:", error instanceof Error ? error.message : String(error));
  
  // Try to identify the problematic part
  if (error instanceof Error && error.message.includes('map')) {
    console.log("❌ This is the 'map' error we're looking for!");
  }
}

console.log("=== LLM CONFIG BUG TEST COMPLETE ==="); 