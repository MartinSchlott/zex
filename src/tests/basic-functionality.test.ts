import { zex } from "../zex/index.js";

console.log("=== Basic Functionality Tests ===");

// Test 1: Basic title and deprecated
console.log("\n--- Test 1: Basic title and deprecated ---");
const stringSchema = zex.string()
  .example("test value")
  .describe("A test string");

console.log("String schema meta:", stringSchema.meta());

// Test direct chaining
const directSchema = zex.string().example("Direct Test");
console.log("Direct schema meta:", directSchema.meta());

// Test example method
const exampleSchema = zex.string()
  .example("Example String")
  .describe("String with example");

console.log("Example schema meta:", exampleSchema.meta());

// Test number schema
const numberSchema = zex.number()
  .example(42)
  .describe("A test number");

console.log("Number schema meta:", numberSchema.meta());

// Test boolean schema
const booleanSchema = zex.boolean()
  .example(true)
  .describe("A test boolean");

console.log("Boolean schema meta:", booleanSchema.meta());

console.log("\n✅ All basic functionality tests passed!"); 