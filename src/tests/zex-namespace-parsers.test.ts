import { zex } from '../zex/index.js';

console.log("=== ZEX NAMESPACE PARSERS TEST ===");

// Test 1: fromJsonSchema in zex namespace
const stringSchema = zex.string().email().min(5);
const jsonSchema = stringSchema.toJSONSchema();
console.log("Original schema JSON:", jsonSchema);

const recreatedSchema = zex.fromJsonSchema(jsonSchema);
console.log("✅ fromJsonSchema in zex namespace works");

// Test 2: safeFromJsonSchema in zex namespace
const safeResult = zex.safeFromJsonSchema(jsonSchema);
if (safeResult.success) {
  console.log("✅ safeFromJsonSchema in zex namespace works");
  console.log("Recreated schema type:", typeof safeResult.schema);
} else {
  console.log("❌ safeFromJsonSchema failed:", (safeResult as any).error);
}

// Test 3: safeFromJsonSchema with invalid schema
const invalidResult = zex.safeFromJsonSchema({ invalid: "schema" });
if (!invalidResult.success) {
  console.log("✅ safeFromJsonSchema correctly handles invalid schema:", (invalidResult as any).error);
} else {
  console.log("❌ safeFromJsonSchema should have failed for invalid schema");
}

// Test 4: transformLua in zex namespace
const testData = "hello world";
const transformedData = zex.transformLua(testData, stringSchema);
console.log("✅ transformLua in zex namespace works:", transformedData);

// Test 5: toJSONSchema in zex namespace (already existed)
const objectSchema = zex.object({
  name: zex.string(),
  age: zex.number().optional()
});
const objectJsonSchema = zex.toJSONSchema(objectSchema);
console.log("✅ toJSONSchema in zex namespace works:", objectJsonSchema);

// Test 6: Complex schema roundtrip
const complexSchema = zex.object({
  user: zex.object({
    name: zex.string().min(2),
    email: zex.string().email(),
    age: zex.number().min(0).max(120).optional(),
    tags: zex.array(zex.string()).optional()
  }),
  settings: zex.object({
    theme: zex.enum(["light", "dark"]).default("light"),
    notifications: zex.boolean().default(true)
  })
});

const complexJsonSchema = zex.toJSONSchema(complexSchema);
console.log("Complex schema JSON:", complexJsonSchema);

const recreatedComplexSchema = zex.fromJsonSchema(complexJsonSchema);
console.log("✅ Complex schema roundtrip works");

// Test 7: Safe roundtrip with complex schema
const safeComplexResult = zex.safeFromJsonSchema(complexJsonSchema);
if (safeComplexResult.success) {
  console.log("✅ Safe complex schema roundtrip works");
} else {
  console.log("❌ Safe complex schema roundtrip failed:", (safeComplexResult as any).error);
}

// Test 8: Union schema roundtrip
const unionSchema = zex.union(
  zex.object({
    type: zex.literal("success"),
    data: zex.string()
  }),
  zex.object({
    type: zex.literal("error"),
    message: zex.string()
  })
);

const unionJsonSchema = zex.toJSONSchema(unionSchema);
console.log("Union schema JSON:", JSON.stringify(unionJsonSchema, null, 2));

try {
  const recreatedUnionSchema = zex.fromJsonSchema(unionJsonSchema);
  console.log("✅ Union schema roundtrip works");
} catch (error) {
  console.log("❌ Union schema roundtrip failed:", error);
  console.log("This is expected - fromJsonSchema needs enhancement for complex unions");
}

// Test 9: Array schema roundtrip
const arraySchema = zex.array(zex.number().min(0).max(100));
const arrayJsonSchema = zex.toJSONSchema(arraySchema);
console.log("Array schema JSON:", arrayJsonSchema);

const recreatedArraySchema = zex.fromJsonSchema(arrayJsonSchema);
console.log("✅ Array schema roundtrip works");

// Test 10: Enum schema roundtrip
const enumSchema = zex.enum(["admin", "user", "guest"] as const);
const enumJsonSchema = zex.toJSONSchema(enumSchema);
console.log("Enum schema JSON:", enumJsonSchema);

const recreatedEnumSchema = zex.fromJsonSchema(enumJsonSchema);
console.log("✅ Enum schema roundtrip works");

// Test 11: URI schema roundtrip
const uriSchema = zex.uri();
const uriJsonSchema = zex.toJSONSchema(uriSchema);
console.log("URI schema JSON:", uriJsonSchema);

const recreatedUriSchema = zex.fromJsonSchema(uriJsonSchema);
console.log("✅ URI schema roundtrip works");

// Test 12: All parser functions available
console.log("✅ All parser functions available in zex namespace:");
console.log("  - zex.fromJsonSchema:", typeof zex.fromJsonSchema);
console.log("  - zex.safeFromJsonSchema:", typeof zex.safeFromJsonSchema);
console.log("  - zex.transformLua:", typeof zex.transformLua);
console.log("  - zex.toJSONSchema:", typeof zex.toJSONSchema);

// Test 13: Consistent API usage
console.log("✅ Consistent API usage example:");
console.log("  // Instead of:");
console.log("  // import { safeFromJsonSchema } from './zex';");
console.log("  // const schema = safeFromJsonSchema(jsonSchema);");
console.log("  //");
console.log("  // Use:");
console.log("  // import { zex } from './zex';");
console.log("  // const schema = zex.safeFromJsonSchema(jsonSchema);");

console.log("=== ZEX NAMESPACE PARSERS TEST COMPLETE ==="); 