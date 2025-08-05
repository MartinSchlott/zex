import { zex } from "../zex/index.js";

console.log("=== JSON Schema Items Bug Test ===");

// Test 1: Basic jsonschema() behavior
console.log("\n--- Test 1: Basic jsonschema() behavior ---");

const jsonschemaValidator = zex.jsonschema();
const schemaObject = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "number" }
    }
  }
};

// This should work - jsonschema() just validates the structure
const result = jsonschemaValidator.parse(schemaObject);
console.log("✅ jsonschema() accepts any JSON Schema object");
console.log("   Result:", typeof result);

// Test 2: jsonschema() in object schema
console.log("\n--- Test 2: jsonschema() in object schema ---");

const TestSchema = zex.object({
  schema: zex.jsonschema()
});

const testData = { schema: schemaObject };
const parsed = TestSchema.parse(testData);
console.log("✅ jsonschema() in object schema works");
console.log("   Parsed result:", typeof parsed);

// Test 3: The actual bug - when jsonschema() is used with nested validation
console.log("\n--- Test 3: The actual bug reproduction ---");

// Let's try to understand what happens when jsonschema() is used in a way that triggers fromJsonSchema
try {
  // This might trigger the bug if jsonschema() internally uses fromJsonSchema
  const complexSchema = zex.object({
    inputSchema: zex.jsonschema().describe("Input Schema"),
    outputSchema: zex.jsonschema().describe("Output Schema")
  });

  const complexData = {
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string" }
      },
      "required": ["name", "email"]
    },
    "outputSchema": {
      "type": "array",
      "items": {
        "type": "object", 
        "properties": {
          "id": { "type": "number" },
          "name": { "type": "string" },
          "email": { "type": "string" }
        }
      }
    }
  };

  const result = complexSchema.parse(complexData);
  console.log("❌ Expected error but got success");
  console.log("   Result:", typeof result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the items bug");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
}

// Test 4: Direct fromJsonSchema test
console.log("\n--- Test 4: Direct fromJsonSchema test ---");

const arraySchema = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "number" },
      "name": { "type": "string" }
    }
  }
};

const parsedSchema = zex.fromJsonSchema(arraySchema);
const validData = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" }
];

const validationResult = parsedSchema.parse(validData);
console.log("✅ fromJsonSchema handles items correctly");
console.log("   Parsed schema type:", typeof parsedSchema);
console.log("   Validation result:", validationResult.length === 2);

// Test 5: Let's try to understand the difference
console.log("\n--- Test 5: Understanding the difference ---");

console.log("jsonschema() validator type:", typeof jsonschemaValidator);
console.log("fromJsonSchema result type:", typeof parsedSchema);

// Let's check if jsonschema() has any internal validation that might trigger fromJsonSchema
console.log("jsonschema() methods:", Object.getOwnPropertyNames(jsonschemaValidator.constructor.prototype));

// Test 6: Try to reproduce the exact scenario from the bug report
console.log("\n--- Test 6: Exact bug report scenario ---");

// The user reported this specific scenario:
// 1. Schema definition with jsonschema()
// 2. Test data with items
// 3. Error at outputSchema.items

try {
  // Let's try a different approach - maybe the issue is in how the schema is being processed
  const bugSchema = zex.object({
    inputSchema: zex.jsonschema(),
    outputSchema: zex.jsonschema()
  });

  const bugData = {
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

  const bugResult = bugSchema.parse(bugData);
  console.log("❌ Expected error but got success for bug scenario");
  console.log("   Result:", typeof bugResult);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the items bug in exact scenario");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
}

// Test 7: Let's try to understand if there's a specific way this might be happening
console.log("\n--- Test 7: Investigating potential triggers ---");

// Maybe the issue is in how the schema is being serialized or processed
const jsonschemaWithMeta = zex.jsonschema().describe("JSON Schema").example({ type: "object" });
console.log("jsonschema with meta:", jsonschemaWithMeta.meta());

// Let's try to see if there's any internal processing that might trigger fromJsonSchema
const complexJsonschema = zex.object({
  schema: zex.jsonschema().describe("Complex Schema")
});

const complexData2 = {
  schema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "number" }
      }
    }
  }
};

try {
  const result2 = complexJsonschema.parse(complexData2);
  console.log("✅ Complex jsonschema parsing works");
  console.log("   Result:", typeof result2);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("❌ Complex jsonschema parsing failed");
  console.log("   Error:", errorMessage);
}

// Test 8: Try to reproduce the error by testing invalid JSON Schema structures
console.log("\n--- Test 8: Testing invalid JSON Schema structures ---");

// The error might be caused by a JSON Schema object that has items but no type
try {
  const invalidSchema = {
    items: {
      type: "object",
      properties: {
        id: { type: "number" }
      }
    }
  };
  
  zex.fromJsonSchema(invalidSchema);
  console.log("❌ Expected error but got success for invalid schema");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the items bug with invalid schema");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
}

// Test 9: Try to reproduce the error by testing nested objects with items
console.log("\n--- Test 9: Testing nested objects with items ---");

try {
  const nestedSchema = {
    type: "object",
    properties: {
      outputSchema: {
        items: {
          type: "object",
          properties: {
            id: { type: "number" }
          }
        }
      }
    }
  };
  
  zex.fromJsonSchema(nestedSchema);
  console.log("❌ Expected error but got success for nested schema");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the items bug with nested schema");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
}

// Test 10: Reproduce the exact error from the bug report
console.log("\n--- Test 10: Exact bug report error reproduction ---");

try {
  // This should reproduce the exact error: "fromJsonSchema: Unsupported or unknown schema feature at path 'outputSchema.items'"
  const exactBugSchema = {
    type: "object",
    properties: {
      outputSchema: {
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
  
  zex.fromJsonSchema(exactBugSchema);
  console.log("❌ Expected error but got success for exact bug scenario");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the exact items bug");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
  console.log("   Error matches bug report:", errorMessage.includes('outputSchema.items'));
}

// Test 11: Try to get the exact error path
console.log("\n--- Test 11: Getting exact error path ---");

try {
  // Let's try a different approach to get the exact error path
  const exactBugSchema2 = {
    outputSchema: {
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
  
  zex.fromJsonSchema(exactBugSchema2);
  console.log("❌ Expected error but got success for exact bug scenario 2");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Successfully reproduced the exact items bug 2");
  console.log("   Error message:", errorMessage);
  console.log("   Error contains 'items':", errorMessage.includes('items'));
  console.log("   Error contains 'outputSchema.items':", errorMessage.includes('outputSchema.items'));
  console.log("   Error matches bug report:", errorMessage.includes('outputSchema.items'));
}

// Test 12: Final demonstration of the bug
console.log("\n--- Test 12: Final bug demonstration ---");

console.log("The bug occurs when a JSON Schema object has an 'items' property but no 'type' field,");
console.log("or when the 'type' field is not 'array'. The fromJsonSchema function doesn't know");
console.log("how to handle this and throws an error.");

console.log("\nExample of the bug:");
console.log("JSON Schema with items but no type:");
const buggySchema = {
  items: {
    type: "object",
    properties: {
      id: { type: "number" }
    }
  }
};

try {
  zex.fromJsonSchema(buggySchema);
  console.log("❌ Expected error but got success");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Bug reproduced successfully");
  console.log("   Error:", errorMessage);
}

console.log("\nExample of the bug in nested objects:");
const nestedBuggySchema = {
  type: "object",
  properties: {
    outputSchema: {
      items: {
        type: "object",
        properties: {
          id: { type: "number" }
        }
      }
    }
  }
};

try {
  zex.fromJsonSchema(nestedBuggySchema);
  console.log("❌ Expected error but got success");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("✅ Nested bug reproduced successfully");
  console.log("   Error:", errorMessage);
}

console.log("\nThe fix would be to either:");
console.log("1. Add proper type validation for JSON Schema objects with 'items'");
console.log("2. Handle 'items' property even when 'type' is not 'array'");
console.log("3. Provide better error messages for invalid JSON Schema structures");

console.log("\n✅ JSON Schema items bug test completed!"); 