import { zex } from "../zex/index.js";

// Test basic string inference
const stringSchema = zex.string();
type StringType = zex.infer<typeof stringSchema>;

// Test uri inference  
const uriSchema = zex.uri();
type UriType = zex.infer<typeof uriSchema>;

// Test object inference
const objectSchema = zex.object({
  name: zex.string(),
  uri: zex.uri()
});
type ObjectType = zex.infer<typeof objectSchema>;

// Let's see what TypeScript thinks these types are
let stringTest: StringType = "test";
let uriTest: UriType = "http://example.com";
let objectTest: ObjectType = {
  name: "test",
  uri: "http://example.com"
};

console.log("✅ String type:", typeof stringTest);
console.log("✅ URI type:", typeof uriTest);
console.log("✅ Object type:", typeof objectTest);

// Test what happens when we try to assign wrong types
// stringTest = 123; // Should be error
// uriTest = 123; // Should be error
// objectTest = { name: 123 }; // Should be error

console.log("✅ All type tests passed!"); 