import { zex } from "../zex/index.js";

// Test basic string
const stringSchema = zex.string();
type StringType = zex.infer<typeof stringSchema>;

// Test uri (inherits from string)
const uriSchema = zex.uri();
type UriType = zex.infer<typeof uriSchema>;

// Test object with both
const objectSchema = zex.object({
  name: stringSchema,
  uri: uriSchema
});

type ObjectType = zex.infer<typeof objectSchema>;

// This should cause TypeScript errors:
// let test: ObjectType = {
//   // name is missing - should be error
//   // uri is missing - should be error
// };

// console.log("✅ Test object:", test);

// Let's check the actual types
console.log("✅ String schema type:", typeof stringSchema);
console.log("✅ URI schema type:", typeof uriSchema);
console.log("✅ Object schema type:", typeof objectSchema);

// Check if they're the same class
console.log("✅ String constructor:", stringSchema.constructor.name);
console.log("✅ URI constructor:", uriSchema.constructor.name);
console.log("✅ Are they the same?", stringSchema.constructor === uriSchema.constructor); 