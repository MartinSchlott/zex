import { zex } from '../zex/index.js';

console.log("=== ADDITIONAL PROPERTIES BUG TEST ===");

// =============================================================================
// TEST: Additional Properties Bug Reproduction
// =============================================================================

console.log("\n--- Test: Additional Properties Bug Reproduction ---");

const openApiSchema = {
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

const openApiData = {
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

console.log("✅ Test data prepared");

// Test 1: Try to create schema from JSON Schema
console.log("\n--- Test 1: Schema Creation ---");

try {
  const schema = zex.fromJsonSchema(openApiSchema);
  console.log("✅ Schema creation successful");
  console.log("✅ Schema type:", schema.constructor.name);
  
  // Test 2: Try to parse the data
  console.log("\n--- Test 2: Data Parsing ---");
  
  try {
    const result = schema.parse(openApiData);
    console.log("✅ Data parsing successful:", result);
  } catch (error) {
    console.log("❌ Data parsing failed:", error);
  }
  
  // Test 3: Try safeParse
  console.log("\n--- Test 3: Safe Parse ---");
  
  try {
    const safeResult = schema.safeParse(openApiData);
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

// Test 4: Test different additionalProperties values
console.log("\n--- Test 4: Different Additional Properties Values ---");

// Test additionalProperties: true
try {
  const schema1 = zex.fromJsonSchema({
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    },
    "additionalProperties": true
  });
  console.log("✅ additionalProperties: true - Schema creation successful");
  
  const result1 = schema1.parse({ name: "test", extra: "value" });
  console.log("✅ additionalProperties: true - Parsing successful:", result1);
} catch (error) {
  console.log("❌ additionalProperties: true - Failed:", error);
}

// Test additionalProperties: false
try {
  const schema2 = zex.fromJsonSchema({
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    },
    "additionalProperties": false
  });
  console.log("✅ additionalProperties: false - Schema creation successful");
  
  const result2 = schema2.parse({ name: "test" });
  console.log("✅ additionalProperties: false - Valid parsing successful:", result2);
  
  try {
    const invalidResult = schema2.parse({ name: "test", extra: "value" });
    console.log("❌ additionalProperties: false - Should have failed for extra property");
  } catch (error) {
    console.log("✅ additionalProperties: false - Correctly rejected extra property:", error instanceof Error ? error.message : String(error));
  }
} catch (error) {
  console.log("❌ additionalProperties: false - Failed:", error);
}

// Test additionalProperties: { "type": "string" }
try {
  const schema3 = zex.fromJsonSchema({
    "type": "object",
    "properties": {
      "name": { "type": "string" }
    },
    "additionalProperties": { "type": "string" }
  });
  console.log("✅ additionalProperties: schema - Schema creation successful");
  
  const result3 = schema3.parse({ name: "test", extra: "value" });
  console.log("✅ additionalProperties: schema - Parsing successful:", result3);
} catch (error) {
  console.log("❌ additionalProperties: schema - Failed:", error);
}

// Test 5: Debug the specific error
console.log("\n--- Test 5: Debug Specific Error ---");

try {
  // Try to identify where the 'additionalProperties' error comes from
  const schema = zex.fromJsonSchema(openApiSchema);
  
  // Check if the schema has the expected structure
  console.log("✅ Schema created, checking structure...");
  
  // Try to access the schema's internal structure
  const jsonSchema = schema.toJsonSchema();
  console.log("✅ Schema can generate JSON Schema:", jsonSchema.type === "object");
  console.log("✅ Generated JSON Schema additionalProperties:", jsonSchema.additionalProperties);
  
} catch (error) {
  console.log("❌ Debug test failed:", error);
  console.log("❌ Error type:", (error as any).constructor.name);
  console.log("❌ Error message:", error instanceof Error ? error.message : String(error));
  
  // Try to identify the problematic part
  if (error instanceof Error && error.message.includes('additionalProperties')) {
    console.log("❌ This is the 'additionalProperties' error we're looking for!");
  }
}

// Test 6: ZexObject passthrough/strip/strict methods
console.log("\n--- Test 6: ZexObject passthrough/strip/strict methods ---");

const base = zex.object({ foo: zex.string() });
const passthrough = base.passthrough();
const strip = base.strip();
const strict = base.strict();

const data = { foo: "bar", extra: 123 };

try {
  const result = passthrough.parse(data);
  console.log("✅ passthrough: extra property kept:", result);
} catch (error) {
  console.log("❌ passthrough: should not fail:", error);
}

try {
  const result = strip.parse(data);
  console.log("✅ strip: extra property removed:", result);
  if ("extra" in result) {
    console.log("❌ strip: extra property should not be present");
  }
} catch (error) {
  console.log("❌ strip: should not fail:", error);
}

try {
  const result = strict.parse(data);
  console.log("❌ strict: should have failed for extra property");
} catch (error) {
  console.log("✅ strict: correctly rejected extra property:", error instanceof Error ? error.message : String(error));
}

console.log("=== ADDITIONAL PROPERTIES BUG TEST COMPLETE ==="); 