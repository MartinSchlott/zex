import { zex } from "../zex/index.js";

// Test uri type inference
const uriSchema = zex.uri();
type UriType = zex.infer<typeof uriSchema>;

console.log("✅ URI schema type:", typeof uriSchema);
console.log("✅ URI schema config:", (uriSchema as any).config);

// Test object with uri
const objectWithUri = zex.object({
  uri: zex.uri()
});

type ObjectWithUriType = zex.infer<typeof objectWithUri>;

// let test: ObjectWithUriType = {
//   // uri is missing - should be error
// };

// console.log("✅ Object with URI test:", test); 