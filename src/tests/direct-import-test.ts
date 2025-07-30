// direct-import-test.ts - Test for direct class imports
// =============================================================================

import { ZexTuple } from '../zex/index.js';

console.log("🧪 Testing Direct Class Import");
console.log("==============================");

// Test 1: Direct import of ZexTuple
console.log("\n--- Test 1: Direct ZexTuple import ---");
console.log("ZexTuple class:", ZexTuple);
console.log("ZexTuple constructor:", typeof ZexTuple);
console.log("✅ ZexTuple is available as a value");

// Test 2: Create instance directly
console.log("\n--- Test 2: Direct instantiation ---");
import { ZexString, ZexNumber, ZexBoolean } from '../zex/index.js';

const tupleInstance = new ZexTuple([
  new ZexString(),
  new ZexNumber(),
  new ZexBoolean()
]);

console.log("✅ ZexTuple can be instantiated directly");
console.log("Tuple instance:", tupleInstance);

// Test 3: Test the instance
console.log("\n--- Test 3: Instance functionality ---");
try {
  const result = tupleInstance.parse(["hello", 42, true]);
  console.log("✅ Direct instance validation works:", result);
} catch (error) {
  console.log("❌ Direct instance validation failed:", error instanceof Error ? error.message : String(error));
}

// Test 4: Import other classes
console.log("\n--- Test 4: Other class imports ---");
import { ZexArray, ZexObject, ZexUnion } from '../zex/index.js';

console.log("✅ ZexArray imported:", typeof ZexArray);
console.log("✅ ZexObject imported:", typeof ZexObject);
console.log("✅ ZexUnion imported:", typeof ZexUnion);

console.log("\n🎯 Summary: All classes are now properly exported as values!");
console.log("   ✅ ZexTuple can be imported directly");
console.log("   ✅ ZexTuple can be instantiated directly");
console.log("   ✅ All other classes are also available");
console.log("   ✅ Runtime imports work correctly"); 