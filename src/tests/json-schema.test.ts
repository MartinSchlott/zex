import { zex } from "../zex/index.js";

console.log("=== JSON Schema Tests ===");

// Test 1: Basic string schema
console.log("\n--- Test 1: Basic string schema ---");
const stringSchema = zex.string()
  .example("test value")
  .describe("A test string");

console.log("String schema meta:", (stringSchema as any)._def);

const stringJsonSchema = stringSchema.toJSONSchema();
console.log("String JSON Schema:", JSON.stringify(stringJsonSchema, null, 2));

// Test 2: Number schema
console.log("\n--- Test 2: Number schema ---");
const numberSchema = zex.number()
  .example(42)
  .describe("A test number");

console.log("Number schema meta:", (numberSchema as any)._def);

const numberJsonSchema = numberSchema.toJSONSchema();
console.log("Number JSON Schema:", JSON.stringify(numberJsonSchema, null, 2));

// Test 3: Array schema
console.log("\n--- Test 3: Array schema ---");
const arraySchema = zex.array(zex.string())
  .example(["item1", "item2"])
  .describe("String Array");

console.log("Array schema meta:", (arraySchema as any)._def);

const arrayJsonSchema = arraySchema.toJSONSchema();
console.log("Array JSON Schema:", JSON.stringify(arrayJsonSchema, null, 2));

// Test 4: Object schema
console.log("\n--- Test 4: Object schema ---");
const objectSchema = zex.object({
  name: zex.string().example("John").describe("The person's name"),
  age: zex.number().example(30).describe("The person's age"),
  active: zex.boolean().example(true).describe("Whether the person is active")
})
  .example({ name: "John", age: 30, active: true })
  .describe("Person Object");

console.log("Object schema meta:", (objectSchema as any)._def);

const objectJsonSchema = objectSchema.toJSONSchema();
console.log("Object JSON Schema:", JSON.stringify(objectJsonSchema, null, 2));

// Test 5: Record schema
console.log("\n--- Test 5: Record schema ---");
const recordSchema = zex.record(zex.string())
  .example({ key1: "value1", key2: "value2" })
  .describe("String Record");

console.log("Record schema meta:", (recordSchema as any)._def);

const recordJsonSchema = recordSchema.toJSONSchema();
console.log("Record JSON Schema:", JSON.stringify(recordJsonSchema, null, 2));

// Test 6: URI schema - Test format field
console.log("\n--- Test 6: URI schema ---");
const uriSchema = zex.uri()
  .example("https://example.com")
  .describe("A URI field");

console.log("URI schema meta:", (uriSchema as any)._def);

const uriJsonSchema = uriSchema.toJSONSchema();
console.log("URI JSON Schema:", JSON.stringify(uriJsonSchema, null, 2));

// Verify format field is present
if (uriJsonSchema.format === "uri") {
  console.log("✅ URI format field correctly set to 'uri'");
} else {
  console.log("❌ URI format field missing or incorrect:", uriJsonSchema.format);
}

// Test 7: Strict object test - verify default strict behavior
console.log("\n--- Test 7: Strict object test ---");
const strictSchema = zex.object({
  name: zex.string().example("John").describe("The person's name"),
  age: zex.number().example(30).describe("The person's age")
})
  .example({ name: "John", age: 30 })
  .describe("Strict Person Object");

console.log("Strict schema meta:", (strictSchema as any)._def);

const strictJsonSchema = strictSchema.toJSONSchema();
console.log("Strict JSON Schema:", JSON.stringify(strictJsonSchema, null, 2));

// Verify additionalProperties is false (strict behavior)
if (strictJsonSchema.additionalProperties === false) {
  console.log("✅ additionalProperties correctly set to false (strict mode)");
} else {
  console.log("❌ additionalProperties not set to false:", strictJsonSchema.additionalProperties);
}

// Test strict behavior with extra properties
console.log("\n--- Test 7b: Strict behavior validation ---");
const validData = { name: "John", age: 30 };
const invalidData = { name: "John", age: 30, extraField: "should be rejected" };

try {
  const validResult = strictSchema.parse(validData);
  console.log("✅ Valid data parsed successfully:", validResult);
} catch (error) {
  console.log("❌ Valid data failed to parse:", error);
}

try {
  const invalidResult = strictSchema.parse(invalidData);
  console.log("❌ Invalid data should have failed but didn't:", invalidResult);
} catch (error) {
  console.log("✅ Invalid data correctly rejected (strict mode working):", error instanceof Error ? error.message : String(error));
}

// Test 8: Complex nested schema with URI
console.log("\n--- Test 8: Complex nested schema with URI ---");
const complexSchema = zex.object({
  id: zex.string().example("123").describe("Unique identifier"),
  website: zex.uri().example("https://example.com").describe("Website URL"),
  metadata: zex.object({
    created: zex.string().example("2023-01-01").describe("Creation date"),
    tags: (zex.array(zex.string()).optional() as any).example(["tag1", "tag2"]).describe("Optional tags")
  }).example({ created: "2023-01-01", tags: ["tag1", "tag2"] }).describe("Object metadata"),
  data: zex.record(zex.any()).example({ field1: "value1" }).describe("Dynamic data")
})
  .example({
    id: "123",
    website: "https://example.com",
    metadata: { created: "2023-01-01", tags: ["tag1", "tag2"] },
    data: { field1: "value1" }
  })
  .describe("Complex Object with URI");

console.log("Complex schema meta:", (complexSchema as any)._def);

const complexJsonSchema = complexSchema.toJSONSchema();
console.log("Complex JSON Schema:", JSON.stringify(complexJsonSchema, null, 2));

// Verify URI format in nested object
const websiteProperty = complexJsonSchema.properties?.website;
if (websiteProperty && typeof websiteProperty === 'object' && 'format' in websiteProperty && websiteProperty.format === "uri") {
  console.log("✅ URI format field correctly set in nested object");
} else {
  console.log("❌ URI format field missing in nested object:", websiteProperty);
}

// Verify complex object is also strict
if (complexJsonSchema.additionalProperties === false) {
  console.log("✅ Complex object also has strict mode (additionalProperties: false)");
} else {
  console.log("❌ Complex object not in strict mode:", complexJsonSchema.additionalProperties);
}

console.log("\n✅ All JSON Schema tests passed!");

// Test 9: Check if describe() breaks the chain
console.log("\n--- Test 9: describe() chain breaking test ---");

// Test with describe() in the chain
const chainTestSchema = zex.string()
  .example("test")
  .describe("A test string")
  .safeParseFromLua("test value");

console.log("Chain test result:", chainTestSchema);

// Test without describe() for comparison
const noDescribeSchema = zex.string()
  .example("test")
  .safeParseFromLua("test value");

console.log("No describe result:", noDescribeSchema);

// Test if describe() is actually a function
try {
  const describeTest = zex.string().describe;
  console.log("describe is a function:", typeof describeTest === 'function');
} catch (error) {
  console.log("describe is NOT a function:", error);
}

// Test 10: Lua-style JSON schema with defective arrays and empty objects
console.log("\n--- Test 10: Lua-style JSON schema test ---");

// Create a schema that expects Lua-style data
const luaStyleSchema = zex.object({
  // Lua array: { [1]: "first", [2]: "second", [3]: "third" }
  luaArray: zex.array(zex.string())
    .example(["first", "second", "third"])
    .describe("Lua-style array with numeric keys"),

  // Empty object that should be detected and handled
  emptyObject: zex.object({})
    .example({})
    .describe("Empty object that should be handled correctly"),

  // Mixed data with Lua array and normal object
  mixedData: zex.object({
    normalArray: zex.array(zex.string())
      .example(["normal", "array"])
      .describe("Normal JavaScript array"),
    luaStyleArray: zex.array(zex.number())
      .example([1, 2, 3])
      .describe("Lua-style array of numbers")
  })
    .example({
      normalArray: ["normal", "array"],
      luaStyleArray: [1, 2, 3]
    })
    .describe("Mixed data structure")
})
  .example({
    luaArray: ["first", "second", "third"],
    emptyObject: {},
    mixedData: {
      normalArray: ["normal", "array"],
      luaStyleArray: [1, 2, 3]
    }
  })
  .describe("Lua-style JSON Schema Test");

console.log("Lua-style schema meta:", (luaStyleSchema as any)._def);

// Test with Lua-style data
const luaStyleData = {
  luaArray: { [1]: "first", [2]: "second", [3]: "third" }, // Lua-style array
  emptyObject: {}, // Empty object
  mixedData: {
    normalArray: ["normal", "array"], // Normal array
    luaStyleArray: { [1]: 1, [2]: 2, [3]: 3 } // Lua-style array
  }
};

console.log("Input Lua-style data:", JSON.stringify(luaStyleData, null, 2));

// Test parseFromLua
try {
  const parsedData = luaStyleSchema.parseFromLua(luaStyleData);
  console.log("✅ parseFromLua result:", JSON.stringify(parsedData, null, 2));
} catch (error) {
  console.log("❌ parseFromLua failed:", error instanceof Error ? error.message : String(error));
}

// Test safeParseFromLua
const safeResult = luaStyleSchema.safeParseFromLua(luaStyleData);
console.log("✅ safeParseFromLua result:", JSON.stringify(safeResult, null, 2));

// Test with invalid Lua data (missing keys)
const invalidLuaData = {
  luaArray: { [1]: "first", [3]: "third" }, // Missing [2]
  emptyObject: {},
  mixedData: {
    normalArray: ["normal", "array"],
    luaStyleArray: { [1]: 1, [3]: 3 } // Missing [2]
  }
};

console.log("\nInput invalid Lua data:", JSON.stringify(invalidLuaData, null, 2));

// Test safeParseFromLua with invalid data
const invalidSafeResult = luaStyleSchema.safeParseFromLua(invalidLuaData);
console.log("✅ safeParseFromLua invalid result:", JSON.stringify(invalidSafeResult, null, 2));

// Test JSON Schema generation
const luaStyleJsonSchema = luaStyleSchema.toJSONSchema();
console.log("\nLua-style JSON Schema:", JSON.stringify(luaStyleJsonSchema, null, 2)); 

// Test 11: Production error test - optional array with describe
console.log("\n--- Test 11: Production error test ---");

// Test the exact scenario from production
const optionalArraySchema = zex.array(zex.string())
  .optional()
  .describe("test");

console.log("Optional array schema meta:", (optionalArraySchema as any)._def);

// Debug: Check the schema type
console.log("Schema type:", (optionalArraySchema as any)._def?.typeName);
console.log("Schema inner type:", (optionalArraySchema as any)._def?.innerType?._def?.typeName);
console.log("Schema inner inner type:", (optionalArraySchema as any)._def?.innerType?._def?.innerType?._def?.typeName);

// Debug: Show full schema structure
console.log("Full schema _def:", JSON.stringify((optionalArraySchema as any)._def, null, 2));

// Debug: Test transformLua directly
const transformed = zex.transformLua({}, (optionalArraySchema as any));
console.log("Direct transformLua result:", transformed);

// Test with empty object {}
const emptyObject = {};

console.log("Input empty object:", JSON.stringify(emptyObject, null, 2));

// Test safeParseFromLua with empty object
try {
  const result = (optionalArraySchema as any).safeParseFromLua(emptyObject);
  console.log("✅ safeParseFromLua result:", JSON.stringify(result, null, 2));
} catch (error) {
  console.log("❌ safeParseFromLua failed with error:", error instanceof Error ? error.message : String(error));
}

// Test regular parse with empty object
try {
  const parseResult = (optionalArraySchema as any).parseFromLua(emptyObject);
  console.log("✅ parseFromLua result:", JSON.stringify(parseResult, null, 2));
} catch (error) {
  console.log("❌ parseFromLua failed with error:", error instanceof Error ? error.message : String(error));
}

// Test with undefined (should work for optional)
try {
  const undefinedResult = (optionalArraySchema as any).safeParseFromLua(undefined);
  console.log("✅ safeParseFromLua with undefined:", JSON.stringify(undefinedResult, null, 2));
} catch (error) {
  console.log("❌ safeParseFromLua with undefined failed:", error instanceof Error ? error.message : String(error));
}

// Test with null (should work for optional)
try {
  const nullResult = (optionalArraySchema as any).safeParseFromLua(null);
  console.log("✅ safeParseFromLua with null:", JSON.stringify(nullResult, null, 2));
} catch (error) {
  console.log("❌ safeParseFromLua with null failed:", error instanceof Error ? error.message : String(error));
} 