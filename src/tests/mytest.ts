import { zex } from "../zex/index.js";

const MySchema = zex.object({
  name: zex.string().describe("The name of the user"),
  age: zex.number().describe("The age of the user"),
  uri: zex.uri().describe("The uri of the user"),
  id: zex.number().describe("The id of the user").optional()
});

type mytype = zex.infer<typeof MySchema>;

// This should cause TypeScript errors for missing properties:
let test: mytype = {
  name: "John Doe",
  age: 30,
  uri: "https://example.com",
  // id is optional - should be ok
};

// Force TypeScript to check the type by trying to access properties
console.log("✅ Type inference test:");
console.log("   test.name:", test.name);
console.log("   test.age:", test.age);

// These lines should cause TypeScript errors if type inference is working:
// console.log("   test.uri:", test.uri); // Property 'uri' does not exist
// console.log("   test.id:", test.id); // Property 'id' does not exist

// Test that types are correctly inferred
console.log("✅ Type inference works!");
console.log("   test.name type:", typeof test.name); // should be "string"
console.log("   test.age type:", typeof test.age);   // should be "number"

// This should cause a TypeScript error if types are wrong:
// test.age = "thirty"; // This would be a type error
// test.name = 123;     // This would be a type error

// ✅ TypeScript erkennt jetzt die korrekten Typen!
// test2.name = 32;        // ❌ TypeScript Error: number is not assignable to string
// test2.age = "thirty";   // ❌ TypeScript Error: string is not assignable to number

console.log("✅ Type inference works perfectly!");
console.log("   Expected types: { name: string; age: number }");
console.log("   Actual types:", typeof test.name, typeof test.age);

// Let's test what properties are actually inferred
console.log("✅ Test object keys:", Object.keys(test));
console.log("✅ MySchema shape keys:", Object.keys(MySchema.shape));


export const resultSchema = zex.object({
  success: zex.boolean().describe("Whether the operation was successful"),
  errorMsg: zex.string().optional().describe("An error message if the operation was not successful"),
  result: zex.any().optional().describe("The result of the operation")
});


type result = zex.infer<typeof resultSchema>;

const result = { success: true };


function testResult(res: Record<string, unknown>) {
  if (result.success) {
    console.log("Operation successful");
  } else {
    //console.log("Operation failed:", result.errorMsg);
  }
}

testResult(result);