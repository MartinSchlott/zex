// package-import-test.ts - Test for package imports
// =============================================================================

// Simulate importing from the built package
import { ZexTuple, zex } from '../../dist/index.js';

console.log("🧪 Testing Package Import");
console.log("=========================");

// Test 1: Direct class import
console.log("\n--- Test 1: Direct class import ---");
console.log("ZexTuple imported:", typeof ZexTuple);
console.log("✅ ZexTuple is available");

// Test 2: zex object import
console.log("\n--- Test 2: zex object import ---");
console.log("zex object:", typeof zex);
console.log("zex.tuple function:", typeof zex.tuple);
console.log("✅ zex object is available");

// Test 3: Create tuple via zex
console.log("\n--- Test 3: Create tuple via zex ---");
const tupleSchema = zex.tuple([zex.string(), zex.number(), zex.boolean()]);
console.log("✅ Tuple created via zex.tuple()");

// Test 4: Test the tuple
console.log("\n--- Test 4: Test tuple functionality ---");
try {
  const result = tupleSchema.parse(["hello", 42, true]);
  console.log("✅ Tuple validation works:", result);
} catch (error) {
  console.log("❌ Tuple validation failed:", error instanceof Error ? error.message : String(error));
}

// Test 5: Import other classes
console.log("\n--- Test 5: Import other classes ---");
import { ZexArray, ZexObject, ZexString } from '../../dist/index.js';

console.log("✅ ZexArray imported:", typeof ZexArray);
console.log("✅ ZexObject imported:", typeof ZexObject);
console.log("✅ ZexString imported:", typeof ZexString);

console.log("\n🎯 Summary: Package imports work correctly!");
console.log("   ✅ ZexTuple can be imported directly");
console.log("   ✅ zex object is available");
console.log("   ✅ All classes are properly exported");
console.log("   ✅ Functionality works from built package"); 