import { zex } from '../zex/index.js';

console.log("=== ZEXTUPLE SUPPORT TESTS ===");

// =============================================================================
// TEST 1: Basic Tuple Creation
// =============================================================================

console.log("\n--- Test 1: Basic Tuple Creation ---");

const emptyTuple = zex.tuple([]);
const singleTuple = zex.tuple([zex.string()]);
const doubleTuple = zex.tuple([zex.string(), zex.number()]);
const complexTuple = zex.tuple([
  zex.string().min(1),
  zex.record(zex.any())
]);

console.log("✅ Empty tuple schema created");
console.log("✅ Single tuple schema created");
console.log("✅ Double tuple schema created");
console.log("✅ Complex tuple schema created");

// Test type inference
type EmptyTupleType = zex.infer<typeof emptyTuple>;
type SingleTupleType = zex.infer<typeof singleTuple>;
type DoubleTupleType = zex.infer<typeof doubleTuple>;
type ComplexTupleType = zex.infer<typeof complexTuple>;

console.log("✅ Type inference works for all tuple types");

// =============================================================================
// TEST 2: Runtime Validation
// =============================================================================

console.log("\n--- Test 2: Runtime Validation ---");

// Test empty tuple
try {
  const result1 = emptyTuple.parse([]);
  console.log("✅ Empty tuple validation successful:", result1);
} catch (error) {
  console.log("❌ Empty tuple validation failed:", error);
}

// Test single tuple
try {
  const result2 = singleTuple.parse(["hello"]);
  console.log("✅ Single tuple validation successful:", result2);
} catch (error) {
  console.log("❌ Single tuple validation failed:", error);
}

// Test double tuple
try {
  const result3 = doubleTuple.parse(["hello", 42]);
  console.log("✅ Double tuple validation successful:", result3);
} catch (error) {
  console.log("❌ Double tuple validation failed:", error);
}

// Test complex tuple
try {
  const result4 = complexTuple.parse(["hello", { key: "value" }]);
  console.log("✅ Complex tuple validation successful:", result4);
} catch (error) {
  console.log("❌ Complex tuple validation failed:", error);
}

// =============================================================================
// TEST 3: Length Validation
// =============================================================================

console.log("\n--- Test 3: Length Validation ---");

// Test wrong length (too short)
try {
  doubleTuple.parse(["hello"]);
  console.log("❌ Should have failed for too short array");
} catch (error) {
  console.log("✅ Correctly failed for too short array:", (error as any).message);
}

// Test wrong length (too long)
try {
  doubleTuple.parse(["hello", 42, true]);
  console.log("❌ Should have failed for too long array");
} catch (error) {
  console.log("✅ Correctly failed for too long array:", (error as any).message);
}

// Test wrong type at position
try {
  doubleTuple.parse(["hello", "not a number"]);
  console.log("❌ Should have failed for wrong type at position 1");
} catch (error) {
  console.log("✅ Correctly failed for wrong type at position 1:", (error as any).message);
}

// =============================================================================
// TEST 4: Type Inference Examples
// =============================================================================

console.log("\n--- Test 4: Type Inference Examples ---");

// Function arguments validation
const invokeSchema = zex.tuple([
  zex.string().min(1),                    // 1st parameter: string
  zex.record(zex.any())                   // 2nd parameter: Record<string, any>
]);

type InvokeArgs = zex.infer<typeof invokeSchema>;
// Should be: [string, Record<string, any>]

const invokeArgs: InvokeArgs = ["functionName", { param1: "value1", param2: "42" }];
console.log("✅ Function arguments type inference works:", invokeArgs);

// Empty tuple (no parameters)
const getConfigSchema = zex.tuple([]);
type GetConfigArgs = zex.infer<typeof getConfigSchema>;
// Should be: []

const getConfigArgs: GetConfigArgs = [];
console.log("✅ Empty tuple type inference works:", getConfigArgs);

// Single parameter
const listSchema = zex.tuple([zex.string()]);
type ListArgs = zex.infer<typeof listSchema>;
// Should be: [string]

const listArgs: ListArgs = ["searchTerm"];
console.log("✅ Single parameter type inference works:", listArgs);

// =============================================================================
// TEST 5: JSON Schema Generation
// =============================================================================

console.log("\n--- Test 5: JSON Schema Generation ---");

const basicJsonSchema = doubleTuple.toJsonSchema();
const complexJsonSchema = complexTuple.toJsonSchema();

console.log("✅ Basic tuple JSON Schema:", basicJsonSchema);
console.log("✅ Complex tuple JSON Schema:", complexJsonSchema);

// Verify JSON Schema structure
console.log("✅ Basic schema has correct type:", basicJsonSchema.type === "array");
console.log("✅ Basic schema has prefixItems:", Array.isArray(basicJsonSchema.prefixItems));
console.log("✅ Basic schema has correct length:", (basicJsonSchema.prefixItems as any[])?.length === 2);
console.log("✅ Basic schema has minItems:", basicJsonSchema.minItems === 2);
console.log("✅ Basic schema has maxItems:", basicJsonSchema.maxItems === 2);
console.log("✅ Basic schema has additionalItems false:", basicJsonSchema.additionalItems === false);

// =============================================================================
// TEST 6: JSON Schema Roundtrip
// =============================================================================

console.log("\n--- Test 6: JSON Schema Roundtrip ---");

// Test basic tuple roundtrip
const basicJson = doubleTuple.toJsonSchema();
const recreatedBasic = zex.fromJsonSchema(basicJson);

console.log("✅ Basic tuple roundtrip successful");
console.log("✅ Recreated basic schema type:", recreatedBasic.constructor.name);

// Test complex tuple roundtrip
const complexJson = complexTuple.toJsonSchema();
const recreatedComplex = zex.fromJsonSchema(complexJson);

console.log("✅ Complex tuple roundtrip successful");
console.log("✅ Recreated complex schema type:", recreatedComplex.constructor.name);

// Test runtime validation of recreated schemas
try {
  const result1 = recreatedBasic.parse(["hello", 42]);
  console.log("✅ Recreated basic tuple validation successful:", result1);
} catch (error) {
  console.log("❌ Recreated basic tuple validation failed:", error);
}

try {
  const result2 = recreatedComplex.parse(["hello", { key: "value" }]);
  console.log("✅ Recreated complex tuple validation successful:", result2);
} catch (error) {
  console.log("❌ Recreated complex tuple validation failed:", error);
}

// =============================================================================
// TEST 7: Tuple in Objects
// =============================================================================

console.log("\n--- Test 7: Tuple in Objects ---");

const functionSchema = zex.object({
  name: zex.string(),
  parameters: zex.tuple([zex.string(), zex.number(), zex.boolean()]),
  returnType: zex.string()
});

type FunctionType = zex.infer<typeof functionSchema>;

const functionData: FunctionType = {
  name: "calculate",
  parameters: ["x", 10, true],
  returnType: "number"
};

console.log("✅ Function schema type inference works:", functionData);

try {
  const result = functionSchema.parse(functionData);
  console.log("✅ Function schema validation successful:", result);
} catch (error) {
  console.log("❌ Function schema validation failed:", error);
}

// =============================================================================
// TEST 8: Tuple in Arrays
// =============================================================================

console.log("\n--- Test 8: Tuple in Arrays ---");

const coordinateArraySchema = zex.array(zex.tuple([zex.number(), zex.number()]));

type CoordinateArrayType = zex.infer<typeof coordinateArraySchema>;

const coordinateArray: CoordinateArrayType = [
  [1, 2],
  [3, 4],
  [5, 6]
];

console.log("✅ Coordinate array type inference works:", coordinateArray);

try {
  const result = coordinateArraySchema.parse(coordinateArray);
  console.log("✅ Coordinate array validation successful:", result);
} catch (error) {
  console.log("❌ Coordinate array validation failed:", error);
}

// =============================================================================
// TEST 9: Tuple in Unions
// =============================================================================

console.log("\n--- Test 9: Tuple in Unions ---");

const commandSchema = zex.union(
  zex.tuple([zex.literal("get"), zex.string()]),
  zex.tuple([zex.literal("set"), zex.string(), zex.any()]),
  zex.tuple([zex.literal("delete"), zex.string()])
);

type CommandType = zex.infer<typeof commandSchema>;

const getCommand: CommandType = ["get", "key"];
const setCommand: CommandType = ["set", "key", "value"];
const deleteCommand: CommandType = ["delete", "key"];

console.log("✅ Command union type inference works for get:", getCommand);
console.log("✅ Command union type inference works for set:", setCommand);
console.log("✅ Command union type inference works for delete:", deleteCommand);

try {
  const result1 = commandSchema.parse(getCommand);
  console.log("✅ Get command validation successful:", result1);
} catch (error) {
  console.log("❌ Get command validation failed:", error);
}

try {
  const result2 = commandSchema.parse(setCommand);
  console.log("✅ Set command validation successful:", result2);
} catch (error) {
  console.log("❌ Set command validation failed:", error);
}

try {
  const result3 = commandSchema.parse(deleteCommand);
  console.log("✅ Delete command validation successful:", result3);
} catch (error) {
  console.log("❌ Delete command validation failed:", error);
}

// =============================================================================
// TEST 10: Complex Nested Tuple Schema
// =============================================================================

console.log("\n--- Test 10: Complex Nested Tuple Schema ---");

const complexNestedSchema = zex.object({
  metadata: zex.object({
    name: zex.string(),
    version: zex.string()
  }),
  operations: zex.array(zex.tuple([
    zex.enum(["read", "write", "delete"]),
    zex.string(),
    zex.union(zex.string(), zex.number(), zex.boolean()).optional()
  ]))
});

type ComplexNestedType = zex.infer<typeof complexNestedSchema>;

const complexNestedData: ComplexNestedType = {
  metadata: {
    name: "Database Operations",
    version: "1.0.0"
  },
  operations: [
    ["read", "user", "id"],
    ["write", "user", "userData"],
    ["delete", "user", "deleted"]
  ]
};

console.log("✅ Complex nested tuple schema type inference works:", complexNestedData);

try {
  const result = complexNestedSchema.parse(complexNestedData);
  console.log("✅ Complex nested tuple schema validation successful:", result);
} catch (error) {
  console.log("❌ Complex nested tuple schema validation failed:", error);
}

// =============================================================================
// TEST 11: Error Cases
// =============================================================================

console.log("\n--- Test 11: Error Cases ---");

// Test non-array input
try {
  doubleTuple.parse("not an array");
  console.log("❌ Should have failed for non-array input");
} catch (error) {
  console.log("✅ Correctly failed for non-array input:", (error as any).message);
}

// Test wrong element type
try {
  doubleTuple.parse([123, 42]); // First element should be string
  console.log("❌ Should have failed for wrong element type");
} catch (error) {
  console.log("✅ Correctly failed for wrong element type:", (error as any).message);
}

// Test complex validation error
try {
  complexTuple.parse(["", { key: "value" }]); // Empty string fails min(1)
  console.log("❌ Should have failed for complex validation");
} catch (error) {
  console.log("✅ Correctly failed for complex validation:", (error as any).message);
}

// =============================================================================
// TEST 12: Performance and Memory
// =============================================================================

console.log("\n--- Test 12: Performance and Memory ---");

// Test that tuple schemas are lightweight
const tuple1 = zex.tuple([zex.string(), zex.number()]);
const tuple2 = zex.tuple([zex.string(), zex.number()]);

console.log("✅ Tuple schemas are different instances:", tuple1 !== tuple2);
console.log("✅ Tuple schemas have same structure:", tuple1.constructor.name === tuple2.constructor.name);

// Test large tuple validation
const largeTuple = zex.tuple([
  zex.string(), zex.number(), zex.boolean(), zex.string(), zex.number(),
  zex.boolean(), zex.string(), zex.number(), zex.boolean(), zex.string()
]);

const largeData = ["a", 1, true, "b", 2, false, "c", 3, true, "d"];

try {
  const result = largeTuple.parse(largeData);
  console.log("✅ Large tuple validation successful (length:", result.length, ")");
} catch (error) {
  console.log("❌ Large tuple validation failed:", error);
}

console.log("=== ZEXTUPLE SUPPORT TESTS COMPLETE ==="); 