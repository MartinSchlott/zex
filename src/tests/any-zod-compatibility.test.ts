import { zex } from '../zex/index.js';

console.log("=== ZEX.ANY ZOD COMPATIBILITY TEST ===");

// Test 1: Basic any type
const anySchema = zex.any();
type AnyType = zex.infer<typeof anySchema>;
console.log("Any schema type:", typeof anySchema);

// Test 2: Runtime validation - any should accept everything
try {
  const validString = anySchema.parse("hello");
  console.log("✅ Any accepts string:", validString);
} catch (error) {
  console.log("❌ Any should accept string:", error);
}

try {
  const validNumber = anySchema.parse(123);
  console.log("✅ Any accepts number:", validNumber);
} catch (error) {
  console.log("❌ Any should accept number:", error);
}

try {
  const validObject = anySchema.parse({ key: "value" });
  console.log("✅ Any accepts object:", validObject);
} catch (error) {
  console.log("❌ Any should accept object:", error);
}

try {
  const validArray = anySchema.parse([1, 2, 3]);
  console.log("✅ Any accepts array:", validArray);
} catch (error) {
  console.log("❌ Any should accept array:", error);
}

try {
  const validNull = anySchema.parse(null);
  console.log("✅ Any accepts null:", validNull);
} catch (error) {
  console.log("❌ Any should accept null:", error);
}

try {
  const validUndefined = anySchema.parse(undefined);
  console.log("✅ Any accepts undefined:", validUndefined);
} catch (error) {
  console.log("❌ Any should accept undefined:", error);
}

// Test 3: Any with optional - should behave like Zod
const optionalAny = zex.any().optional();
type OptionalAnyType = zex.infer<typeof optionalAny>;

// This should be 'any | undefined' for Zod compatibility
console.log("Optional any type should be 'any | undefined'");

// Test 4: Any with nullable - should behave like Zod
const nullableAny = zex.any().nullable();
type NullableAnyType = zex.infer<typeof nullableAny>;

// This should be 'any | null' for Zod compatibility
console.log("Nullable any type should be 'any | null'");

// Test 5: Any with default - should behave like Zod
const defaultAny = zex.any().default("default value");
type DefaultAnyType = zex.infer<typeof defaultAny>;

// This should be 'any' for Zod compatibility
console.log("Default any type should be 'any'");

// Test 6: Runtime validation with optional any
try {
  const validOptional = optionalAny.parse("test");
  console.log("✅ Optional any accepts value:", validOptional);
} catch (error) {
  console.log("❌ Optional any should accept value:", error);
}

try {
  const validUndefinedOptional = optionalAny.parse(undefined);
  console.log("✅ Optional any accepts undefined:", validUndefinedOptional);
} catch (error) {
  console.log("❌ Optional any should accept undefined:", error);
}

// Test 7: Runtime validation with nullable any
try {
  const validNullable = nullableAny.parse("test");
  console.log("✅ Nullable any accepts value:", validNullable);
} catch (error) {
  console.log("❌ Nullable any should accept value:", error);
}

try {
  const validNullNullable = nullableAny.parse(null);
  console.log("✅ Nullable any accepts null:", validNullNullable);
} catch (error) {
  console.log("❌ Nullable any should accept null:", error);
}

// Test 8: JSON Schema generation
const jsonSchema = anySchema.toJsonSchema();
console.log("Any JSON Schema:", jsonSchema);

// Test 9: Any with metadata
const anyWithMeta = zex.any()
  .title("Any Value")
  .describe("Accepts any value")
  .example("example");

const metaJsonSchema = anyWithMeta.toJsonSchema();
console.log("Any with metadata JSON Schema:", metaJsonSchema);

// Test 10: TypeScript type inference
const testValue: AnyType = "this should be any";
console.log("✅ TypeScript type inference works:", testValue);

// Test 11: Any in unions
const unionWithAny = zex.union(
  zex.string(),
  zex.any()
);

try {
  const unionResult1 = unionWithAny.parse("string");
  console.log("✅ Union with string successful:", unionResult1);
} catch (error) {
  console.log("❌ Union with string failed:", error);
}

try {
  const unionResult2 = unionWithAny.parse(123);
  console.log("✅ Union with any number successful:", unionResult2);
} catch (error) {
  console.log("❌ Union with any number failed:", error);
}

// Test 12: Any in objects
const objectWithAny = zex.object({
  required: zex.string(),
  optional: zex.any().optional()
});

try {
  const objectResult = objectWithAny.parse({
    required: "test",
    optional: "anything"
  });
  console.log("✅ Object with any successful:", objectResult);
} catch (error) {
  console.log("❌ Object with any failed:", error);
}

console.log("=== ZEX.ANY ZOD COMPATIBILITY TEST COMPLETE ==="); 