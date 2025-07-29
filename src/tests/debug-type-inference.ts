import { zex } from "../zex/index.js";

// Test with a simple schema to show the problem affects ALL properties
const TestSchema = zex.object({
  name: zex.string(),
  age: zex.number(),
  uri: zex.uri(),
  id: zex.number().optional()
});

type TestType = zex.infer<typeof TestSchema>;

// This should cause TypeScript errors for ALL missing properties:
// let test: TestType = {
//   // name is missing - should be error
//   // age is missing - should be error  
//   // uri is missing - should be error
//   // id is optional - should be ok
// };

// console.log("✅ Test object:", test);

// Let's check what properties are actually inferred
// console.log("✅ TestType keys:", Object.keys(test));
console.log("✅ TestSchema shape keys:", Object.keys(TestSchema.shape));

