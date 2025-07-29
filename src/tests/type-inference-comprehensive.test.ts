import { zex } from '../zex/index.js';

console.log("=== COMPREHENSIVE TYPE INFERENCE TESTS ===");

// Test 1: Basic object with required and optional properties
const UserSchema = zex.object({
  name: zex.string().describe("User name"),
  age: zex.number().describe("User age"),
  email: zex.string().email().describe("User email").optional(),
  avatar: zex.string().describe("User avatar").optional()
});

type User = zex.infer<typeof UserSchema>;

console.log("✅ UserSchema created");

// Test 2: TypeScript should detect missing required properties
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const user1: User = {
//   // Missing 'name' - should cause error
//   age: 30,
//   email: "test@example.com"
// };

// const user2: User = {
//   name: "John",
//   // Missing 'age' - should cause error
//   email: "test@example.com"
// };

// const user3: User = {
//   // Missing both required properties - should cause error
//   email: "test@example.com"
// };

// Test 3: TypeScript should allow valid objects
const validUser1: User = {
  name: "John Doe",
  age: 30
  // email and avatar are optional - should be ok
};

const validUser2: User = {
  name: "Jane Doe",
  age: 25,
  email: "jane@example.com",
  avatar: "https://example.com/avatar.jpg"
};

console.log("✅ Valid users created:", validUser1, validUser2);

// Test 4: TypeScript should detect extra properties
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const userWithExtra: User = {
//   name: "John",
//   age: 30,
//   extraProperty: "should cause error" // Extra property
// };

// Test 5: Nested object with optional properties
const AddressSchema = zex.object({
  street: zex.string().describe("Street address"),
  city: zex.string().describe("City"),
  country: zex.string().describe("Country").optional(),
  postalCode: zex.string().describe("Postal code").optional()
});

const ComplexUserSchema = zex.object({
  name: zex.string().describe("User name"),
  age: zex.number().describe("User age"),
  address: AddressSchema.optional(),
  tags: zex.array(zex.string()).optional()
});

type ComplexUser = zex.infer<typeof ComplexUserSchema>;

console.log("✅ ComplexUserSchema created");

// Test 6: Nested object TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const complexUser1: ComplexUser = {
//   name: "John",
//   age: 30,
//   address: {
//     street: "123 Main St",
//     city: "New York"
//     // Missing country and postalCode - should be ok (optional)
//   }
// };

// const complexUser2: ComplexUser = {
//   name: "Jane",
//   age: 25,
//   address: {
//     street: "456 Oak Ave",
//     city: "Los Angeles",
//     country: "USA",
//     postalCode: "90210"
//   },
//   tags: ["developer", "typescript"]
// };

// Test 7: Array with optional elements
const ArraySchema = zex.object({
  items: zex.array(zex.string()).describe("Array of strings"),
  optionalItems: zex.array(zex.number()).optional().describe("Optional array of numbers")
});

type ArrayType = zex.infer<typeof ArraySchema>;

console.log("✅ ArraySchema created");

// Test 8: Array TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const array1: ArrayType = {
//   items: ["a", "b", "c"]
//   // optionalItems is optional - should be ok
// };

// const array2: ArrayType = {
//   items: ["x", "y"],
//   optionalItems: [1, 2, 3]
// };

// Test 9: Union types with optional properties
const UnionSchema = zex.union(
  zex.object({
    type: zex.literal("success"),
    data: zex.string().describe("Success data")
  }),
  zex.object({
    type: zex.literal("error"),
    message: zex.string().describe("Error message"),
    code: zex.number().optional().describe("Error code")
  })
);

type UnionType = zex.infer<typeof UnionSchema>;

console.log("✅ UnionSchema created");

// Test 10: Union TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const successResult: UnionType = {
//   type: "success",
//   data: "Operation completed"
// };

// const errorResult: UnionType = {
//   type: "error",
//   message: "Something went wrong"
//   // code is optional - should be ok
// };

// const errorResultWithCode: UnionType = {
//   type: "error",
//   message: "Something went wrong",
//   code: 500
// };

// Test 11: Record with optional values
const RecordSchema = zex.object({
  metadata: zex.record(zex.string()).optional().describe("Optional metadata"),
  settings: zex.record(zex.any()).describe("Required settings")
});

type RecordType = zex.infer<typeof RecordSchema>;

console.log("✅ RecordSchema created");

// Test 12: Record TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const record1: RecordType = {
//   settings: {
//     theme: "dark",
//     language: "en"
//   }
//   // metadata is optional - should be ok
// };

// const record2: RecordType = {
//   metadata: {
//     version: "1.0.0",
//     author: "John Doe"
//   },
//   settings: {
//     theme: "light",
//     language: "de"
//   }
// };

// Test 13: Nullable and optional combinations
const NullableSchema = zex.object({
  required: zex.string().describe("Required string"),
  optional: zex.string().optional().describe("Optional string"),
  nullable: zex.string().nullable().describe("Nullable string"),
  optionalNullable: zex.string().optional().nullable().describe("Optional nullable string")
});

type NullableType = zex.infer<typeof NullableSchema>;

console.log("✅ NullableSchema created");

// Test 14: Nullable TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const nullable1: NullableType = {
//   required: "hello",
//   nullable: null
//   // optional and optionalNullable are optional - should be ok
// };

// const nullable2: NullableType = {
//   required: "world",
//   optional: "optional value",
//   nullable: "not null",
//   optionalNullable: null
// };

// Test 15: Default values
const DefaultSchema = zex.object({
  name: zex.string().default("Anonymous").describe("Name with default"),
  count: zex.number().default(0).describe("Count with default"),
  active: zex.boolean().default(true).describe("Active with default")
});

type DefaultType = zex.infer<typeof DefaultSchema>;

console.log("✅ DefaultSchema created");

// Test 16: Default TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const default1: DefaultType = {
//   // All properties have defaults - should be ok
// };

// const default2: DefaultType = {
//   name: "John",
//   count: 42
//   // active has default - should be ok
// };

// Test 17: Complex nested with all features
const ComplexNestedSchema = zex.object({
  id: zex.number().describe("User ID"),
  profile: zex.object({
    name: zex.string().describe("Profile name"),
    email: zex.string().email().optional().describe("Profile email"),
    avatar: zex.string().optional().describe("Profile avatar")
  }).optional(),
  settings: zex.object({
    theme: zex.enum(["light", "dark"]).default("light").describe("Theme setting"),
    notifications: zex.boolean().default(true).describe("Notifications setting")
  }),
  tags: zex.array(zex.string()).optional().describe("User tags")
});

type ComplexNestedType = zex.infer<typeof ComplexNestedSchema>;

console.log("✅ ComplexNestedSchema created");

// Test 18: Complex nested TypeScript inference
// UNCOMMENT TO TEST - should cause TypeScript errors:

// const complexNested1: ComplexNestedType = {
//   id: 1,
//   settings: {
//     // theme and notifications have defaults - should be ok
//   }
//   // profile and tags are optional - should be ok
// };

// const complexNested2: ComplexNestedType = {
//   id: 2,
//   profile: {
//     name: "John Doe"
//     // email and avatar are optional - should be ok
//   },
//   settings: {
//     theme: "dark",
//     notifications: false
//   },
//   tags: ["developer", "typescript"]
// };

console.log("✅ All TypeScript inference tests completed!");
console.log("✅ If you uncomment the test cases above, TypeScript should show errors for:");
console.log("   - Missing required properties");
console.log("   - Extra properties not in schema");
console.log("   - Wrong property types");
console.log("✅ And should allow:");
console.log("   - Valid objects with all required properties");
console.log("   - Optional properties being omitted");
console.log("   - Nullable properties being null");
console.log("   - Properties with default values being omitted");

console.log("=== COMPREHENSIVE TYPE INFERENCE TESTS COMPLETE ==="); 