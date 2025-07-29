import { zex } from '../zex/index.js';

console.log("=== ZEX.NULL() TEST ===");

// Test 1: Basic null type
const nullSchema = zex.null();
type NullType = zex.infer<typeof nullSchema>;
console.log("Null schema type:", typeof nullSchema);

// Test 2: Runtime validation
try {
  const validNull = nullSchema.parse(null);
  console.log("✅ Valid null parse successful:", validNull);
} catch (error) {
  console.log("❌ Valid null parse failed:", error);
}

// Test 3: Invalid values should fail
try {
  nullSchema.parse("not null");
  console.log("❌ Invalid string parse should have failed");
} catch (error) {
  console.log("✅ Invalid string parse correctly failed:", error);
}

try {
  nullSchema.parse(123);
  console.log("❌ Invalid number parse should have failed");
} catch (error) {
  console.log("✅ Invalid number parse correctly failed:", error);
}

try {
  nullSchema.parse({});
  console.log("❌ Invalid object parse should have failed");
} catch (error) {
  console.log("✅ Invalid object parse correctly failed:", error);
}

// Test 4: JSON Schema generation
const jsonSchema = nullSchema.toJsonSchema();
console.log("Null JSON Schema:", jsonSchema);

// Test 5: Null with metadata
const nullWithMeta = zex.null()
  .title("Null Value")
  .describe("A null value")
  .example(null);

const metaJsonSchema = nullWithMeta.toJsonSchema();
console.log("Null with metadata JSON Schema:", metaJsonSchema);

// Test 6: Null in unions
const unionWithNull = zex.union(
  zex.string(),
  zex.null()
);

try {
  const unionResult1 = unionWithNull.parse("string");
  console.log("✅ Union with string successful:", unionResult1);
} catch (error) {
  console.log("❌ Union with string failed:", error);
}

try {
  const unionResult2 = unionWithNull.parse(null);
  console.log("✅ Union with null successful:", unionResult2);
} catch (error) {
  console.log("❌ Union with null failed:", error);
}

// Test 7: Null in objects
const objectWithNull = zex.object({
  required: zex.string(),
  optional: zex.null().optional()
});

try {
  const objectResult = objectWithNull.parse({
    required: "test",
    optional: null
  });
  console.log("✅ Object with null successful:", objectResult);
} catch (error) {
  console.log("❌ Object with null failed:", error);
}

// Test 8: TypeScript type inference
const testValue: NullType = null;
console.log("✅ TypeScript type inference works:", testValue);

console.log("=== ZEX.NULL() TEST COMPLETE ==="); 