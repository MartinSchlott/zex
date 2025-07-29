import { zex } from '../zex/index.js';

console.log("=== ADDITIONAL PROPERTIES FALSE BUG TEST ===");

const schema = {
  "type": "object",
  "properties": {
    "openapi": {
      "type": "string"
    },
    "info": {
      "type": "object"
    },
    "paths": {
      "type": "object"
    }
  },
  "additionalProperties": false
};

console.log("Testing schema:", JSON.stringify(schema, null, 2));

try {
  const zexSchema = zex.fromJsonSchema(schema);
  console.log("✅ Schema creation successful");
  
  const data = {
    "openapi": "3.0.0",
    "info": {
      "title": "Test API",
      "version": "1.0.0"
    },
    "paths": {
      "/test": {
        "get": {
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      }
    }
  };
  
  const result = zexSchema.parse(data);
  console.log("✅ Parsing successful:", result);
  
} catch (error) {
  console.log("❌ Error:", error instanceof Error ? error.message : String(error));
  console.log("❌ Stack:", error instanceof Error ? error.stack : "No stack");
}

console.log("=== TEST COMPLETE ==="); 