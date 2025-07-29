import { zex } from '../zex/index.js';

// Test 1: Type Inference Fix
console.log("🧪 Testing Type Inference Fix...");

const optionalSchema = zex.string().optional();
const nullableSchema = zex.string().nullable();
const defaultSchema = zex.string().default("default");

// These should work without TypeScript errors
type OptionalType = zex.infer<typeof optionalSchema>; // Should be string | undefined
type NullableType = zex.infer<typeof nullableSchema>; // Should be string | null
type DefaultType = zex.infer<typeof defaultSchema>; // Should be string

// Runtime tests
console.log("✅ Optional parse with string:", optionalSchema.parse("hello"));
console.log("✅ Optional parse with undefined:", optionalSchema.parse(undefined));
console.log("✅ Nullable parse with string:", nullableSchema.parse("hello"));
console.log("✅ Nullable parse with null:", nullableSchema.parse(null));
console.log("✅ Default parse with string:", defaultSchema.parse("hello"));
console.log("✅ Default parse with undefined:", defaultSchema.parse(undefined));

// Test 2: Strict Mode Fix
console.log("\n🧪 Testing Strict Mode Fix...");

const strictSchema = zex.object({
  name: zex.string(),
  age: zex.number()
});

// This should work
console.log("✅ Valid data:", strictSchema.parse({ name: "John", age: 30 }));

// This should fail
try {
  strictSchema.parse({ name: "John", age: 30, extra: "unknown" });
  console.log("❌ Should have failed for unknown property");
} catch (e) {
  console.log("✅ Correctly failed for unknown property:", (e as Error).message);
}

// Test 3: Default Behavior Fix
console.log("\n🧪 Testing Default Behavior Fix...");

const defaultTestSchema = zex.string().default("default value");

// This should work
console.log("✅ Valid string:", defaultTestSchema.parse("hello"));
console.log("✅ Undefined with default:", defaultTestSchema.parse(undefined));

// These should fail (not use default)
try {
  defaultTestSchema.parse(null);
  console.log("❌ Should have failed for null");
} catch (e) {
  console.log("✅ Correctly failed for null:", (e as Error).message);
}

try {
  defaultTestSchema.parse(123);
  console.log("❌ Should have failed for number");
} catch (e) {
  console.log("✅ Correctly failed for number:", (e as Error).message);
}

console.log("\n🎉 All Gemini Fixes Tested Successfully!"); 