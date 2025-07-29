import { zex } from '../zex/index.js';

console.log("=== ZEX.ENUM READONLY ARRAY TEST ===");

// Test 1: Regular array (should still work)
const regularEnum = zex.enum(["a", "b", "c"]);
console.log("Regular enum options:", regularEnum.options);

// Test 2: as const array
const constEnum = zex.enum(["x", "y", "z"] as const);
console.log("Const enum options:", constEnum.options);

// Test 3: readonly array
const readonlyEnum = zex.enum(["admin", "user", "guest"] as readonly string[]);
console.log("Readonly enum options:", readonlyEnum.options);

// Test 4: Mixed readonly array
const mixedReadonlyEnum = zex.enum(["hello", 42, true] as const);
console.log("Mixed readonly enum options:", mixedReadonlyEnum.options);

// Test 5: TypeScript type inference
type RegularEnumType = zex.infer<typeof regularEnum>;
type ConstEnumType = zex.infer<typeof constEnum>;
type ReadonlyEnumType = zex.infer<typeof readonlyEnum>;
type MixedReadonlyEnumType = zex.infer<typeof mixedReadonlyEnum>;

console.log("TypeScript types:");
console.log("- RegularEnumType: string");
console.log("- ConstEnumType: x | y | z");
console.log("- ReadonlyEnumType: string");
console.log("- MixedReadonlyEnumType: hello | 42 | true");

// Test 6: Runtime validation with const arrays
try {
  const validValue = constEnum.parse("x");
  console.log("✅ Valid const enum value parsed:", validValue);
} catch (error) {
  console.log("❌ Valid const enum parse failed:", error);
}

try {
  constEnum.parse("invalid");
  console.log("❌ Invalid const enum value should have failed");
} catch (error) {
  console.log("✅ Invalid const enum value correctly failed:", error);
}

// Test 7: Runtime validation with readonly arrays
try {
  const validReadonlyValue = readonlyEnum.parse("admin");
  console.log("✅ Valid readonly enum value parsed:", validReadonlyValue);
} catch (error) {
  console.log("❌ Valid readonly enum parse failed:", error);
}

// Test 8: Mixed readonly enum validation
try {
  const validMixedValue = mixedReadonlyEnum.parse("hello");
  console.log("✅ Valid mixed readonly enum value parsed:", validMixedValue);
} catch (error) {
  console.log("❌ Valid mixed readonly enum parse failed:", error);
}

try {
  const validMixedNumber = mixedReadonlyEnum.parse(42);
  console.log("✅ Valid mixed readonly enum number parsed:", validMixedNumber);
} catch (error) {
  console.log("❌ Valid mixed readonly enum number parse failed:", error);
}

try {
  const validMixedBoolean = mixedReadonlyEnum.parse(true);
  console.log("✅ Valid mixed readonly enum boolean parsed:", validMixedBoolean);
} catch (error) {
  console.log("❌ Valid mixed readonly enum boolean parse failed:", error);
}

// Test 9: JSON Schema generation
const constJsonSchema = constEnum.toJsonSchema();
console.log("Const enum JSON Schema:", constJsonSchema);

const readonlyJsonSchema = readonlyEnum.toJsonSchema();
console.log("Readonly enum JSON Schema:", readonlyJsonSchema);

const mixedJsonSchema = mixedReadonlyEnum.toJsonSchema();
console.log("Mixed readonly enum JSON Schema:", mixedJsonSchema);

// Test 10: Options property with readonly arrays
console.log("Const enum options type:", typeof constEnum.options);
console.log("Readonly enum options type:", typeof readonlyEnum.options);
console.log("Mixed readonly enum options type:", typeof mixedReadonlyEnum.options);

// Test 11: Edge case - empty readonly array
const emptyReadonlyEnum = zex.enum([] as const);
console.log("Empty readonly enum options:", emptyReadonlyEnum.options);

// Test 12: Single value readonly array
const singleReadonlyEnum = zex.enum(["only"] as const);
console.log("Single readonly enum options:", singleReadonlyEnum.options);

console.log("=== ZEX.ENUM READONLY ARRAY TEST COMPLETE ==="); 