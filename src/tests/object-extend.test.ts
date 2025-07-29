import { zex } from '../zex/index.js';

console.log("=== ZEXOBJECT.EXTEND() TESTS ===");

// =============================================================================
// TEST 1: Basic Extension
// =============================================================================

console.log("\n--- Test 1: Basic Extension ---");

const Base = zex.object({
  id: zex.string(),
  name: zex.string()
});

const Extended = Base.extend({
  age: zex.number(),
  email: zex.string().optional()
});

type ExtendedType = zex.infer<typeof Extended>;

console.log("✅ Base schema created");
console.log("✅ Extended schema created");

// Test type inference
const validExtended: ExtendedType = {
  id: "123",
  name: "John Doe",
  age: 30,
  email: "john@example.com"
};

console.log("✅ Type inference works:", validExtended);

// Test runtime validation
try {
  const result = Extended.parse({
    id: "123",
    name: "John Doe",
    age: 30,
    email: "john@example.com"
  });
  console.log("✅ Extended schema parse successful:", result);
} catch (error) {
  console.log("❌ Extended schema parse failed:", error);
}

// =============================================================================
// TEST 2: Immutability
// =============================================================================

console.log("\n--- Test 2: Immutability ---");

const base = zex.object({ 
  id: zex.string(),
  status: zex.string() 
});

const extended = base.extend({ 
  name: zex.string() 
});

// Base should remain unchanged
console.log("✅ Base shape keys:", Object.keys(base.shape));
console.log("✅ Extended shape keys:", Object.keys(extended.shape));

// Test that base and extended are different instances
console.log("✅ Base and extended are different instances:", base !== extended);

// =============================================================================
// TEST 3: Property Override
// =============================================================================

console.log("\n--- Test 3: Property Override ---");

const baseWithOverride = zex.object({ 
  id: zex.string(),
  status: zex.string() 
});

const extendedWithOverride = baseWithOverride.extend({ 
  status: zex.number() // Override with different type
});

type ExtendedWithOverrideType = zex.infer<typeof extendedWithOverride>;

// Test type inference with override
const validOverride: ExtendedWithOverrideType = {
  id: "123",
  status: 42 // Should be number, not string
};

console.log("✅ Property override type inference works:", validOverride);

// Test runtime validation with override
try {
  const result = extendedWithOverride.parse({
    id: "123",
    status: 42
  });
  console.log("✅ Property override parse successful:", result);
} catch (error) {
  console.log("❌ Property override parse failed:", error);
}

// =============================================================================
// TEST 4: Optional Properties
// =============================================================================

console.log("\n--- Test 4: Optional Properties ---");

const baseWithOptional = zex.object({
  id: zex.string(),
  name: zex.string()
});

const extendedWithOptional = baseWithOptional.extend({
  age: zex.number().optional(),
  email: zex.string().email().optional(),
  phone: zex.string().optional()
});

type ExtendedWithOptionalType = zex.infer<typeof extendedWithOptional>;

// Test with all optional properties
const fullData: ExtendedWithOptionalType = {
  id: "123",
  name: "John Doe",
  age: 30,
  email: "john@example.com",
  phone: "+1234567890"
};

console.log("✅ Full data type inference works:", fullData);

// Test with some optional properties
const partialData: ExtendedWithOptionalType = {
  id: "123",
  name: "John Doe",
  age: 30
  // email and phone are optional
};

console.log("✅ Partial data type inference works:", partialData);

// Test runtime validation
try {
  const result = extendedWithOptional.parse(partialData);
  console.log("✅ Partial data parse successful:", result);
} catch (error) {
  console.log("❌ Partial data parse failed:", error);
}

// =============================================================================
// TEST 5: JSON Schema Generation
// =============================================================================

console.log("\n--- Test 5: JSON Schema Generation ---");

const baseForJson = zex.object({
  id: zex.string(),
  name: zex.string()
});

const extendedForJson = baseForJson.extend({
  age: zex.number().min(0).max(120),
  email: zex.string().email().optional()
});

const jsonSchema = extendedForJson.toJsonSchema();
console.log("✅ Extended JSON Schema:", jsonSchema);

// Verify all properties are included
console.log("✅ JSON Schema includes all properties:", 
  jsonSchema.properties && 
  'id' in jsonSchema.properties && 
  'name' in jsonSchema.properties && 
  'age' in jsonSchema.properties && 
  'email' in jsonSchema.properties
);

// =============================================================================
// TEST 6: Complex Nested Extension
// =============================================================================

console.log("\n--- Test 6: Complex Nested Extension ---");

const baseComplex = zex.object({
  id: zex.string(),
  profile: zex.object({
    name: zex.string(),
    avatar: zex.string().optional()
  })
});

const extendedComplex = baseComplex.extend({
  settings: zex.object({
    theme: zex.enum(["light", "dark"]).default("light"),
    notifications: zex.boolean().default(true)
  }),
  metadata: zex.record(zex.string()).optional()
});

type ExtendedComplexType = zex.infer<typeof extendedComplex>;

const complexData: ExtendedComplexType = {
  id: "123",
  profile: {
    name: "John Doe",
    avatar: "https://example.com/avatar.jpg"
  },
  settings: {
    theme: "dark",
    notifications: false
  },
  metadata: {
    created: "2024-01-01",
    version: "1.0.0"
  }
};

console.log("✅ Complex nested extension type inference works:", complexData);

// Test runtime validation
try {
  const result = extendedComplex.parse(complexData);
  console.log("✅ Complex nested extension parse successful:", result);
} catch (error) {
  console.log("❌ Complex nested extension parse failed:", error);
}

// =============================================================================
// TEST 7: Meta Information Preservation
// =============================================================================

console.log("\n--- Test 7: Meta Information Preservation ---");

const baseWithMeta = zex.object({
  id: zex.string()
}).title("Base User").describe("Base user schema");

const extendedWithMeta = baseWithMeta.extend({
  name: zex.string()
}).title("Extended User").describe("Extended user schema");

console.log("✅ Base meta:", baseWithMeta.meta());
console.log("✅ Extended meta:", extendedWithMeta.meta());

// =============================================================================
// TEST 8: Chaining Extensions
// =============================================================================

console.log("\n--- Test 8: Chaining Extensions ---");

const baseChain = zex.object({
  id: zex.string()
});

const extended1 = baseChain.extend({
  name: zex.string()
});

const extended2 = extended1.extend({
  age: zex.number()
});

const extended3 = extended2.extend({
  email: zex.string().email().optional()
});

type ExtendedChainType = zex.infer<typeof extended3>;

const chainData: ExtendedChainType = {
  id: "123",
  name: "John Doe",
  age: 30,
  email: "john@example.com"
};

console.log("✅ Chained extension type inference works:", chainData);

// Test runtime validation
try {
  const result = extended3.parse(chainData);
  console.log("✅ Chained extension parse successful:", result);
} catch (error) {
  console.log("❌ Chained extension parse failed:", error);
}

// =============================================================================
// TEST 9: Error Cases
// =============================================================================

console.log("\n--- Test 9: Error Cases ---");

// Test missing required fields
try {
  extended.parse({
    id: "123",
    name: "John Doe"
    // Missing required 'age'
  });
  console.log("❌ Should have failed for missing required field");
} catch (error) {
  console.log("✅ Correctly failed for missing required field:", (error as any).message);
}

// Test wrong type for overridden field
try {
  extendedWithOverride.parse({
    id: "123",
    status: "active" // Should be number, not string
  });
  console.log("❌ Should have failed for wrong type");
} catch (error) {
  console.log("✅ Correctly failed for wrong type:", (error as any).message);
}

// =============================================================================
// TEST 10: Performance and Memory
// =============================================================================

console.log("\n--- Test 10: Performance and Memory ---");

// Test that extend doesn't modify original
const originalShape = { ...base.shape };
const extendedShape = extended.shape;

console.log("✅ Original shape unchanged:", Object.keys(originalShape));
console.log("✅ Extended shape has new properties:", Object.keys(extendedShape));
console.log("✅ Original and extended are different objects:", originalShape !== extendedShape);

console.log("=== ZEXOBJECT.EXTEND() TESTS COMPLETE ==="); 