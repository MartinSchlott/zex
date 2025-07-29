import { zex } from "../zex/index.js";

// Test uri type inference
const uriSchema = zex.uri();
type UriType = zex.infer<typeof uriSchema>;

console.log("✅ URI schema type:", typeof uriSchema);
console.log("✅ URI schema constructor:", uriSchema.constructor.name);
console.log("✅ URI schema instanceof ZexString:", uriSchema.constructor.name === "ZexUri");

// Test object with uri
const objectWithUri = zex.object({
  uri: uriSchema
});

type ObjectWithUriType = zex.infer<typeof objectWithUri>;

// This should cause TypeScript errors:
// let test: ObjectWithUriType = {
//   // uri is missing - should be error
// };

// console.log("✅ Object with URI test:", test);

// Let's check what properties are actually inferred
// console.log("✅ ObjectWithUriType keys:", Object.keys(test));
console.log("✅ ObjectWithUri schema shape keys:", Object.keys(objectWithUri.shape)); 