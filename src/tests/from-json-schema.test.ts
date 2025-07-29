// from-json-schema.test.ts - Structured Tests for fromJsonSchema
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== fromJsonSchema Tests ===");

// =============================================================================
// PHASE 1: Basic Types (string, number, boolean)
// =============================================================================

console.log("\n--- PHASE 1: Basic Types ---");

// Test 1.1: Simple string
console.log("\n1.1: Simple string");
const stringSchema = zex.fromJsonSchema({ type: "string" });
try {
  const result = stringSchema.parse("hello");
  console.log("✅ String schema works:", result);
} catch (error) {
  console.log("❌ String schema failed:", error);
}

// Test 1.2: String with meta
console.log("\n1.2: String with meta");
const stringWithMetaSchema = zex.fromJsonSchema({
  type: "string",
  title: "User Name",
  description: "The user's full name",
  format: "email"
});
try {
  const result = stringWithMetaSchema.parse("john@example.com");
  console.log("✅ String with meta works:", result);
  console.log("   Meta:", stringWithMetaSchema.meta());
} catch (error) {
  console.log("❌ String with meta failed:", error);
}

// Test 1.3: Number
console.log("\n1.3: Number");
const numberSchema = zex.fromJsonSchema({ type: "number" });
try {
  const result = numberSchema.parse(42);
  console.log("✅ Number schema works:", result);
} catch (error) {
  console.log("❌ Number schema failed:", error);
}

// Test 1.4: Boolean
console.log("\n1.4: Boolean");
const booleanSchema = zex.fromJsonSchema({ type: "boolean" });
try {
  const result = booleanSchema.parse(true);
  console.log("✅ Boolean schema works:", result);
} catch (error) {
  console.log("❌ Boolean schema failed:", error);
}

// =============================================================================
// PHASE 2: Arrays (simple → complex)
// =============================================================================

console.log("\n--- PHASE 2: Arrays ---");

// Test 2.1: Simple array of strings
console.log("\n2.1: Simple array of strings");
const stringArraySchema = zex.fromJsonSchema({
  type: "array",
  items: { type: "string" }
});
try {
  const result = stringArraySchema.parse(["a", "b", "c"]);
  console.log("✅ String array works:", result);
} catch (error) {
  console.log("❌ String array failed:", error);
}

// Test 2.2: Array of numbers with meta
console.log("\n2.2: Array of numbers with meta");
const numberArraySchema = zex.fromJsonSchema({
  type: "array",
  items: { type: "number" },
  title: "Scores",
  description: "Array of test scores"
});
try {
  const result = numberArraySchema.parse([85, 92, 78]);
  console.log("✅ Number array with meta works:", result);
  console.log("   Meta:", numberArraySchema.meta());
} catch (error) {
  console.log("❌ Number array with meta failed:", error);
}

// Test 2.3: Nested array (array of arrays)
console.log("\n2.3: Nested array");
const nestedArraySchema = zex.fromJsonSchema({
  type: "array",
  items: {
    type: "array",
    items: { type: "number" }
  }
});
try {
  const result = nestedArraySchema.parse([[1, 2], [3, 4], [5, 6]]);
  console.log("✅ Nested array works:", result);
} catch (error) {
  console.log("❌ Nested array failed:", error);
}

// =============================================================================
// PHASE 3: Objects (flat → deep → complex)
// =============================================================================

console.log("\n--- PHASE 3: Objects ---");

// Test 3.1: Simple flat object
console.log("\n3.1: Simple flat object");
const flatObjectSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"]
});
try {
  const result = flatObjectSchema.parse({ name: "John", age: 30 });
  console.log("✅ Flat object works:", result);
} catch (error) {
  console.log("❌ Flat object failed:", error);
}

// Test 3.2: Object with optional fields
console.log("\n3.2: Object with optional fields");
const optionalObjectSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
    email: { type: "string" }
  },
  required: ["name", "age"]
});
try {
  const result = optionalObjectSchema.parse({ name: "Jane", age: 25 });
  console.log("✅ Object with optional fields works:", result);
} catch (error) {
  console.log("❌ Object with optional fields failed:", error);
}

// Test 3.3: Deep nested object
console.log("\n3.3: Deep nested object");
const deepObjectSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" }
              },
              required: ["street", "city"]
            }
          },
          required: ["address"]
        }
      },
      required: ["profile"]
    }
  },
  required: ["user"]
});
try {
  const result = deepObjectSchema.parse({
    user: {
      profile: {
        address: {
          street: "123 Main St",
          city: "New York"
        }
      }
    }
  });
  console.log("✅ Deep nested object works:", result);
} catch (error) {
  console.log("❌ Deep nested object failed:", error);
}

// Test 3.4: Complex object with arrays
console.log("\n3.4: Complex object with arrays");
const complexObjectSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    scores: {
      type: "array",
      items: { type: "number" }
    },
    tags: {
      type: "array",
      items: { type: "string" }
    },
    metadata: {
      type: "object",
      properties: {
        created: { type: "string" },
        version: { type: "number" }
      },
      required: ["created"]
    }
  },
  required: ["name", "scores"]
});
try {
  const result = complexObjectSchema.parse({
    name: "Test User",
    scores: [85, 92, 78],
    tags: ["student", "active"],
    metadata: {
      created: "2024-01-01",
      version: 1
    }
  });
  console.log("✅ Complex object with arrays works:", result);
} catch (error) {
  console.log("❌ Complex object with arrays failed:", error);
}

// =============================================================================
// PHASE 4: Enums & Unions
// =============================================================================

console.log("\n--- PHASE 4: Enums & Unions ---");

// Test 4.1: Enum
console.log("\n4.1: Enum");
const enumSchema = zex.fromJsonSchema({
  enum: ["active", "inactive", "pending"]
});
try {
  const result = enumSchema.parse("active");
  console.log("✅ Enum works:", result);
} catch (error) {
  console.log("❌ Enum failed:", error);
}

// Test 4.2: Union (anyOf)
console.log("\n4.2: Union (anyOf)");
const unionSchema = zex.fromJsonSchema({
  anyOf: [
    { type: "string" },
    { type: "number" }
  ]
});
try {
  const result1 = unionSchema.parse("hello");
  const result2 = unionSchema.parse(42);
  console.log("✅ Union works:", result1, result2);
} catch (error) {
  console.log("❌ Union failed:", error);
}

// Test 4.3: Complex union
console.log("\n4.3: Complex union");
const complexUnionSchema = zex.fromJsonSchema({
  anyOf: [
    { type: "string" },
    {
      type: "object",
      properties: {
        type: { type: "string" },
        value: { type: "number" }
      },
      required: ["type", "value"]
    }
  ]
});
try {
  const result1 = complexUnionSchema.parse("simple");
  const result2 = complexUnionSchema.parse({ type: "complex", value: 123 });
  console.log("✅ Complex union works:", result1, result2);
} catch (error) {
  console.log("❌ Complex union failed:", error);
}

// =============================================================================
// PHASE 5: Meta & Round-trip Tests
// =============================================================================

console.log("\n--- PHASE 5: Meta & Round-trip Tests ---");

// Test 5.1: Meta preservation
console.log("\n5.1: Meta preservation");
const metaSchema = zex.fromJsonSchema({
  type: "object",
  title: "User Profile",
  description: "A user profile with custom fields",
  examples: [{ name: "John", age: 30 }],
  format: "user-profile",
  customField: "customValue",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  }
});
try {
  const result = metaSchema.parse({ name: "John", age: 30 });
  console.log("✅ Meta preservation works:", result);
  console.log("   Meta:", metaSchema.meta());
} catch (error) {
  console.log("❌ Meta preservation failed:", error);
}

// Test 5.2: Round-trip test
console.log("\n5.2: Round-trip test");
const originalSchema = zex.object({
  name: zex.string().describe("User name"),
  age: zex.number().describe("User age"),
  tags: zex.array(zex.string()).optional().describe("User tags")
});
const jsonSchema = originalSchema.toJsonSchema();
const restoredSchema = zex.fromJsonSchema(jsonSchema);
try {
  const data = { name: "John", age: 30, tags: ["admin", "user"] };
  const originalResult = originalSchema.parse(data);
  const restoredResult = restoredSchema.parse(data);
  console.log("✅ Round-trip works!");
  console.log("   Original result:", originalResult);
  console.log("   Restored result:", restoredResult);
} catch (error) {
  console.log("❌ Round-trip failed:", error);
}

// =============================================================================
// PHASE 6: Error Handling & Path Tracking
// =============================================================================

console.log("\n--- PHASE 6: Error Handling & Path Tracking ---");

// Test 6.1: Invalid schema
console.log("\n6.1: Invalid schema");
try {
  zex.fromJsonSchema(null);
  console.log("❌ Should have thrown error for null schema");
} catch (error) {
  console.log("✅ Correctly rejected null schema:", error instanceof Error ? error.message : String(error));
}

// Test 6.2: Missing required fields
console.log("\n6.2: Missing required fields");
const requiredSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name", "age"]
});
try {
  requiredSchema.parse({ name: "John" }); // Missing age
  console.log("❌ Should have thrown error for missing required field");
} catch (error) {
  console.log("✅ Correctly rejected missing required field:", error instanceof Error ? error.message : String(error));
}

// Test 6.3: Path tracking with root name
console.log("\n6.3: Path tracking with root name");
try {
  zex.fromJsonSchema({
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          profile: {
            type: "object",
            properties: {
              address: {
                type: "invalid-type" // This should fail
              }
            }
          }
        }
      }
    }
  }, { rootName: "UserSchema" });
  console.log("❌ Should have thrown error for invalid type");
} catch (error) {
  console.log("✅ Correctly rejected with path tracking:", error instanceof Error ? error.message : String(error));
}

// Test 6.4: safeFromJsonSchema
console.log("\n6.4: safeFromJsonSchema");
const safeResult = zex.safeFromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  }
}, { rootName: "SafeTest" });

if (safeResult.success) {
  console.log("✅ safeFromJsonSchema works:", safeResult.schema);
} else {
  console.log("❌ safeFromJsonSchema failed:", safeResult.error);
}

// Test 6.5: Unsupported features
console.log("\n6.5: Unsupported features");
try {
  zex.fromJsonSchema({
    type: "object",
    properties: {
      data: {
        $ref: "#/definitions/User" // Unsupported feature
      }
    }
  });
  console.log("❌ Should have thrown error for unsupported feature");
} catch (error) {
  console.log("✅ Correctly rejected unsupported feature:", error instanceof Error ? error.message : String(error));
}

console.log("\n✅ All fromJsonSchema tests completed!"); 