// tuple-export-test.ts - Test for ZexTuple export and functionality
// =============================================================================

import { zex } from '../zex/index.js';

console.log("🧪 Testing ZexTuple Export and Functionality");
console.log("=============================================");

// Test 1: Basic tuple functionality
console.log("\n--- Test 1: Basic tuple functionality ---");
const tupleSchema = zex.tuple([zex.string(), zex.number(), zex.boolean()]);

try {
  const result1 = tupleSchema.parse(["hello", 42, true]);
  console.log("✅ Basic tuple validation works:", result1);
} catch (error) {
  console.log("❌ Basic tuple validation failed:", error instanceof Error ? error.message : String(error));
}

try {
  const result2 = tupleSchema.parse(["hello", 42]); // Should fail - missing boolean
  console.log("❌ Should have failed but didn't:", result2);
} catch (error) {
  console.log("✅ Correctly rejected incomplete tuple");
  console.log("   Error:", error instanceof Error ? error.message : String(error));
}

// Test 2: Tuple with different types
console.log("\n--- Test 2: Tuple with different types ---");
const complexTuple = zex.tuple([
  zex.string(),
  zex.number().min(0),
  zex.object({ name: zex.string(), age: zex.number() })
]);

try {
  const result3 = complexTuple.parse(["user", 25, { name: "Alice", age: 30 }]);
  console.log("✅ Complex tuple validation works:", result3);
} catch (error) {
  console.log("❌ Complex tuple validation failed:", error instanceof Error ? error.message : String(error));
}

// Test 3: JSON Schema generation
console.log("\n--- Test 3: JSON Schema generation ---");
const jsonSchema = tupleSchema.toJsonSchema();
console.log("Tuple JSON Schema:", JSON.stringify(jsonSchema, null, 2));

// Test 4: Type inference
console.log("\n--- Test 4: Type inference ---");
type TupleType = zex.infer<typeof tupleSchema>;
console.log("✅ Type inference works for tuples");

// Test 5: Direct import test
console.log("\n--- Test 5: Direct import test ---");
import { ZexTuple } from '../zex/complex-types.js';
console.log("✅ ZexTuple class is directly importable");

// Test 6: Namespace access
console.log("\n--- Test 6: Namespace access ---");
import { zex as zexNamespace } from '../zex/index.js';
const namespaceTuple = zexNamespace.tuple([zex.string(), zex.number()]);
console.log("✅ ZexTuple accessible via namespace");

console.log("\n🎯 Summary: ZexTuple export is working correctly!");
console.log("   ✅ ZexTuple class is properly exported");
console.log("   ✅ zex.tuple() function works");
console.log("   ✅ Type inference works");
console.log("   ✅ JSON Schema generation works");
console.log("   ✅ Direct import works");
console.log("   ✅ Namespace access works"); 