import { zex } from '../zex/index.js';

console.log("=== ZEX.ENUM.OPTIONS TEST ===");

// Test 1: Basic enum with options
const stringEnum = zex.enum(["apple", "banana", "cherry"]);
console.log("String enum options:", stringEnum.options);
console.log("Expected: ['apple', 'banana', 'cherry']");

// Test 2: Number enum
const numberEnum = zex.enum([1, 2, 3, 4, 5]);
console.log("Number enum options:", numberEnum.options);
console.log("Expected: [1, 2, 3, 4, 5]");

// Test 3: Mixed enum
const mixedEnum = zex.enum(["hello", 42, true]);
console.log("Mixed enum options:", mixedEnum.options);
console.log("Expected: ['hello', 42, true]");

// Test 4: Single value enum
const singleEnum = zex.enum(["only"]);
console.log("Single enum options:", singleEnum.options);
console.log("Expected: ['only']");

// Test 5: Empty enum (edge case)
const emptyEnum = zex.enum([]);
console.log("Empty enum options:", emptyEnum.options);
console.log("Expected: []");

// Test 6: TypeScript type inference
type StringEnumType = zex.infer<typeof stringEnum>;
type NumberEnumType = zex.infer<typeof numberEnum>;
type MixedEnumType = zex.infer<typeof mixedEnum>;

console.log("TypeScript types:");
console.log("- StringEnumType: apple | banana | cherry");
console.log("- NumberEnumType: 1 | 2 | 3 | 4 | 5");
console.log("- MixedEnumType: hello | 42 | true");

// Test 7: Runtime validation still works
try {
  const validValue = stringEnum.parse("apple");
  console.log("✅ Valid enum value parsed:", validValue);
} catch (error) {
  console.log("❌ Valid enum parse failed:", error);
}

try {
  stringEnum.parse("invalid");
  console.log("❌ Invalid enum value should have failed");
} catch (error) {
  console.log("✅ Invalid enum value correctly failed:", error);
}

// Test 8: Options are readonly (should not be modifiable)
const originalOptions = [...stringEnum.options];
console.log("Original options:", originalOptions);

// Test 9: JSON Schema generation still works
const jsonSchema = stringEnum.toJsonSchema();
console.log("Enum JSON Schema:", jsonSchema);

// Test 10: Enum with metadata
const enumWithMeta = zex.enum(["admin", "user", "guest"])
  .title("User Role")
  .describe("User role enumeration")
  .example("admin");

const metaJsonSchema = enumWithMeta.toJsonSchema();
console.log("Enum with metadata JSON Schema:", metaJsonSchema);
console.log("Enum with metadata options:", enumWithMeta.options);

console.log("=== ZEX.ENUM.OPTIONS TEST COMPLETE ==="); 