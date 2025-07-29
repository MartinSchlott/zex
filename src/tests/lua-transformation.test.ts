import { zex } from "../zex/index.js";

console.log("=== Lua Transformation Tests ===");

// Test 1: Simple array transformation
console.log("\n--- Test 1: Simple array transformation ---");
const luaData1 = {
  [1]: "first",
  [2]: "second",
  [3]: "third"
};

const arraySchema = zex.array(zex.string());
const result1 = arraySchema.parseFromLua(luaData1);
console.log("Lua array input:", luaData1);
console.log("Parsed result:", result1);

// Test 2: Array with numbers
console.log("\n--- Test 2: Array with numbers ---");
const luaData2 = {
  [1]: 10,
  [2]: 20,
  [3]: 30
};

const numberArraySchema = zex.array(zex.number());
const result2 = numberArraySchema.parseFromLua(luaData2);
console.log("Lua number array input:", luaData2);
console.log("Parsed result:", result2);

// Test 3: Nested arrays
console.log("\n--- Test 3: Nested arrays ---");
const luaData3 = {
  [1]: {
    [1]: "a",
    [2]: "b"
  },
  [2]: {
    [1]: "c",
    [2]: "d"
  }
};

const nestedArraySchema = zex.array(zex.array(zex.string()));
const result3 = nestedArraySchema.parseFromLua(luaData3);
console.log("Lua nested array input:", luaData3);
console.log("Parsed result:", result3);

// Test 4: Mixed array
console.log("\n--- Test 4: Mixed array ---");
const luaData4 = {
  [1]: "string",
  [2]: 42,
  [3]: true
};

const mixedArraySchema = zex.array(zex.any());
const result4 = mixedArraySchema.parseFromLua(luaData4);
console.log("Lua mixed array input:", luaData4);
console.log("Parsed result:", result4);

// Test 5: Empty array
console.log("\n--- Test 5: Empty array ---");
const luaData5 = {};

const emptyArraySchema = zex.array(zex.string());
const result5 = emptyArraySchema.parseFromLua(luaData5);
console.log("Lua empty array input:", luaData5);
console.log("Parsed result:", result5);

console.log("\n✅ All Lua transformation tests passed!"); 