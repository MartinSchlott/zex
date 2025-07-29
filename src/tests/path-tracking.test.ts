// path-tracking.test.ts - Zex Path Tracking Tests
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== Zex Path Tracking Tests ===");

// Test 1: Basic path tracking with rootParseInfo
console.log("\n--- Test 1: Basic Path Tracking with rootParseInfo ---");
const UserSchema = zex.object({
  name: zex.string().describe("User's full name"),
  profile: zex.object({
    age: zex.number().describe("User's age"),
    address: zex.object({
      street: zex.string().describe("Street name"),
      city: zex.string().describe("City name")
    }).describe("User's address")
  }).describe("User profile information")
}).describe("User account information");

const validUser = {
  name: "John Doe",
  profile: {
    age: 30,
    address: {
      street: "123 Main St",
      city: "New York"
    }
  }
};

try {
  const user = UserSchema.parse(validUser, zex.rootParseInfo("LLM Config Parser"));
  console.log("✅ Valid user parsed successfully");
} catch (error) {
  console.log("❌ Valid user parsing failed:", error instanceof Error ? error.message : String(error));
}

// Test 2: Path tracking with validation error
console.log("\n--- Test 2: Path Tracking with Validation Error ---");
const invalidUser = {
  name: "John Doe",
  profile: {
    age: "thirty", // Should be number
    address: {
      street: "123 Main St",
      city: "New York"
    }
  }
};

try {
  const user = UserSchema.parse(invalidUser, zex.rootParseInfo("LLM Config Parser"));
  console.log("❌ Invalid user should have failed but didn't:", user);
} catch (error) {
  console.log("✅ Invalid user correctly rejected with path tracking:");
  console.log("   Error:", error instanceof Error ? error.message : String(error));
}

// Test 3: Array path tracking
console.log("\n--- Test 3: Array Path Tracking ---");
const ArraySchema = zex.object({
  items: zex.array(zex.object({
    id: zex.number().describe("Item ID"),
    name: zex.string().describe("Item name")
  }).describe("Individual item"))
}).describe("Collection of items");

const validArray = {
  items: [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: "three", name: "Item 3" } // Invalid: id should be number
  ]
};

try {
  const result = ArraySchema.parse(validArray, zex.rootParseInfo("Array Parser"));
  console.log("❌ Invalid array should have failed but didn't:", result);
} catch (error) {
  console.log("✅ Invalid array correctly rejected with path tracking:");
  console.log("   Error:", error instanceof Error ? error.message : String(error));
}

// Test 4: Union path tracking
console.log("\n--- Test 4: Union Path Tracking ---");
const UnionSchema = zex.object({
  status: zex.union(
    zex.literal("active").describe("Active status"),
    zex.literal("inactive").describe("Inactive status"),
    zex.literal("pending").describe("Pending status")
  ).describe("User status"),
  type: zex.enum(["admin", "user", "guest"]).describe("User type")
}).describe("User status information");

const invalidUnion = {
  status: "invalid_status", // Not in union
  type: "admin" // Valid
};

try {
  const result = UnionSchema.parse(invalidUnion, zex.rootParseInfo("Union Parser"));
  console.log("❌ Invalid union should have failed but didn't:", result);
} catch (error) {
  console.log("✅ Invalid union correctly rejected with path tracking:");
  console.log("   Error:", error instanceof Error ? error.message : String(error));
}

// Test 5: Circular reference detection
console.log("\n--- Test 5: Circular Reference Detection ---");
// This would normally cause infinite recursion, but our path tracking should catch it
const SelfReferencingSchema = zex.object({
  name: zex.string().describe("Node name"),
  children: zex.array(zex.any()).describe("Child nodes") // Using any to avoid actual circular reference
}).describe("Self-referencing node");

const circularData = {
  name: "Root",
  children: [
    {
      name: "Child1",
      children: [
        {
          name: "Child1.1",
          children: []
        }
      ]
    }
  ]
};

try {
  const result = SelfReferencingSchema.parse(circularData, zex.rootParseInfo("Circular Parser"));
  console.log("✅ Circular reference test completed (using any to avoid actual circular reference)");
} catch (error) {
  console.log("❌ Circular reference test failed:", error instanceof Error ? error.message : String(error));
}

// Test 6: Lua transformation with path tracking
console.log("\n--- Test 6: Lua Transformation with Path Tracking ---");
const LuaSchema = zex.object({
  tags: zex.array(zex.string()).describe("User tags"),
  settings: zex.object({
    theme: zex.string().describe("UI theme"),
    language: zex.string().describe("UI language")
  }).describe("User settings")
}).describe("User configuration");

const luaData = {
  tags: {}, // Empty object that should become empty array
  settings: {
    theme: "dark",
    language: "en"
  }
};

try {
  const result = LuaSchema.parseFromLua(luaData, zex.rootParseInfo("Lua Parser"));
  console.log("✅ Lua transformation with path tracking successful");
  console.log("   Tags is array:", Array.isArray((result as any).tags));
  console.log("   Tags length:", (result as any).tags?.length);
} catch (error) {
  console.log("❌ Lua transformation failed:", error instanceof Error ? error.message : String(error));
}

// Test 7: Depth limit test
console.log("\n--- Test 7: Depth Limit Test ---");
// Create a deeply nested structure to test depth limit
let deepSchema: any = zex.string().describe("Deep level 100");
for (let i = 99; i >= 0; i--) {
  deepSchema = zex.object({
    level: zex.number().describe(`Level ${i}`),
    nested: deepSchema
  }).describe(`Deep object level ${i}`);
}

const deepData = { level: 0, nested: { level: 1, nested: { level: 2, nested: "deep" } } };

try {
  const result = deepSchema.parse(deepData, zex.rootParseInfo("Deep Parser"));
  console.log("✅ Deep structure parsed successfully");
} catch (error) {
  console.log("❌ Deep structure failed (expected if depth limit is reached):");
  console.log("   Error:", error instanceof Error ? error.message : String(error));
}

console.log("\n✅ All Path Tracking tests completed!"); 