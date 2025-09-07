import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: Lua byte strings in simple records ===");

// Test 1: Simple record with Uint8Array values
const simpleRecordSchema = zex.record(zex.any());

const simpleLuaData = {
  type: new Uint8Array([111, 98, 106, 101, 99, 116]), // "object"
  properties: {
    name: {
      type: new Uint8Array([115, 116, 114, 105, 110, 103]) // "string"
    }
  },
  required: [
    new Uint8Array([110, 97, 109, 101]) // "name"
  ]
};

console.log("Testing simple record with Uint8Array values...");
try {
  const result = simpleRecordSchema.parseFromLua(simpleLuaData);
  console.log("✅ Simple record parseFromLua succeeded");
  console.log("Result:", JSON.stringify(result, null, 2));
  
  // Check if values are properly converted
  if (result.type === "object" && 
      result.properties?.name?.type === "string" && 
      Array.isArray(result.required) && 
      result.required.includes("name")) {
    console.log("✅ All Uint8Array values properly converted to strings");
  } else {
    console.log("❌ Uint8Array values not properly converted");
    console.log("Expected: string values, got:", {
      type: typeof result.type,
      propertiesNameType: typeof result.properties?.name?.type,
      required: result.required
    });
  }
} catch (error) {
  console.log("❌ Simple record parseFromLua failed:", error);
}

// Test 2: Record with string schema (should work)
const stringRecordSchema = zex.record(zex.string());

const stringLuaData = {
  type: new Uint8Array([111, 98, 106, 101, 99, 116]), // "object"
  name: new Uint8Array([115, 116, 114, 105, 110, 103]) // "string"
};

console.log("\nTesting record with string schema...");
try {
  const result = stringRecordSchema.parseFromLua(stringLuaData);
  console.log("✅ String record parseFromLua succeeded");
  console.log("Result:", JSON.stringify(result, null, 2));
  
  if (result.type === "object" && result.name === "string") {
    console.log("✅ String record Uint8Array values properly converted");
  } else {
    console.log("❌ String record Uint8Array values not properly converted");
  }
} catch (error) {
  console.log("❌ String record parseFromLua failed:", error);
}

// Test 3: Direct ZexAny test
console.log("\nTesting direct ZexAny with nested Uint8Array...");
const anySchema = zex.any();

try {
  const result = anySchema.parseFromLua(simpleLuaData);
  console.log("✅ ZexAny parseFromLua succeeded");
  console.log("Result type:", typeof result.type);
  console.log("Result properties.name.type:", typeof result.properties?.name?.type);
  console.log("Result required[0]:", typeof result.required?.[0]);
  
  if (result.type === "object" && 
      result.properties?.name?.type === "string" && 
      result.required?.[0] === "name") {
    console.log("✅ ZexAny properly converted nested Uint8Array values");
  } else {
    console.log("❌ ZexAny did not properly convert nested Uint8Array values");
  }
} catch (error) {
  console.log("❌ ZexAny parseFromLua failed:", error);
}
