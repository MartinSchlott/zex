// enum-test.ts - Zex Enum Tests
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== Zex Enum Tests ===");

// Test 1: Basic enum functionality
console.log("\n--- Test 1: Basic Enum Functionality ---");
const StatusEnum = zex.enum(["active", "inactive", "pending"]);

try {
  const validStatus = StatusEnum.parse("active");
  console.log("✅ Valid enum value parsed:", validStatus);
} catch (error) {
  console.log("❌ Valid enum parsing failed:", error);
}

try {
  const invalidStatus = StatusEnum.parse("invalid");
  console.log("❌ Invalid enum should have failed but didn't:", invalidStatus);
} catch (error) {
  console.log("✅ Invalid enum correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 2: Enum with numbers
console.log("\n--- Test 2: Enum with Numbers ---");
const NumberEnum = zex.enum([1, 2, 3, 4, 5]);

try {
  const validNumber = NumberEnum.parse(3);
  console.log("✅ Valid number enum parsed:", validNumber);
} catch (error) {
  console.log("❌ Valid number enum parsing failed:", error);
}

try {
  const invalidNumber = NumberEnum.parse(10);
  console.log("❌ Invalid number enum should have failed but didn't:", invalidNumber);
} catch (error) {
  console.log("✅ Invalid number enum correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 3: Enum in object context
console.log("\n--- Test 3: Enum in Object Context ---");
const UserSchema = zex.object({
  name: zex.string(),
  role: zex.enum(["admin", "user", "guest"]),
  status: zex.enum(["active", "inactive"])
});

const validUser = {
  name: "John",
  role: "admin",
  status: "active"
};

try {
  const parsedUser = UserSchema.parse(validUser);
  console.log("✅ User with enum values parsed successfully");
  console.log("   Role:", parsedUser.role);
  console.log("   Status:", parsedUser.status);
} catch (error) {
  console.log("❌ User parsing failed:", error);
}

const invalidUser = {
  name: "John",
  role: "superuser", // Invalid role
  status: "active"
};

try {
  const parsedInvalidUser = UserSchema.parse(invalidUser);
  console.log("❌ Invalid user should have failed but didn't:", parsedInvalidUser);
} catch (error) {
  console.log("✅ Invalid user correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 4: Enum JSON Schema generation
console.log("\n--- Test 4: Enum JSON Schema Generation ---");
const enumJsonSchema = StatusEnum.toJsonSchema();
console.log("✅ Enum JSON Schema generated");
console.log("   Schema:", JSON.stringify(enumJsonSchema, null, 2));

// Test 5: Enum vs Union comparison
console.log("\n--- Test 5: Enum vs Union Comparison ---");
const EnumVersion = zex.enum(["red", "green", "blue"]);
const UnionVersion = zex.union(
  zex.literal("red"),
  zex.literal("green"),
  zex.literal("blue")
);

console.log("Enum JSON Schema:", JSON.stringify(EnumVersion.toJsonSchema(), null, 2));
console.log("Union JSON Schema:", JSON.stringify(UnionVersion.toJsonSchema(), null, 2));

// Test 6: Lua transformation with enum
console.log("\n--- Test 6: Lua Transformation with Enum ---");
const luaData = {
  name: "Test",
  role: "user",
  status: "active"
};

try {
  const parsedLuaUser = UserSchema.parseFromLua(luaData);
  console.log("✅ Lua data with enum parsed successfully");
  console.log("   Role:", parsedLuaUser.role);
  console.log("   Status:", parsedLuaUser.status);
} catch (error) {
  console.log("❌ Lua data parsing failed:", error);
}

console.log("\n✅ All Enum tests completed!"); 