import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== JSONSCHEMA: additionalProperties export behavior ===");

// Test 1: Default strict mode should export additionalProperties: false
const strictSchema = zex.object({
  name: zex.string(),
  age: zex.number()
});

const strictJsonSchema = strictSchema.toJsonSchema();
expectOk('strict schema exports additionalProperties: false', () => {
  if (strictJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false, got ${strictJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 2: Explicit strict mode should export additionalProperties: false
const explicitStrictSchema = zex.object({
  name: zex.string(),
  age: zex.number()
}, false, "strict");

const explicitStrictJsonSchema = explicitStrictSchema.toJsonSchema();
expectOk('explicit strict schema exports additionalProperties: false', () => {
  if (explicitStrictJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false, got ${explicitStrictJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 3: Passthrough mode should export additionalProperties: true
const passthroughSchema = zex.object({
  name: zex.string(),
  age: zex.number()
}, true, "passthrough");

const passthroughJsonSchema = passthroughSchema.toJsonSchema();
expectOk('passthrough schema exports additionalProperties: true', () => {
  if (passthroughJsonSchema.additionalProperties !== true) {
    throw new Error(`Expected additionalProperties: true, got ${passthroughJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 4: Strip mode should export additionalProperties: true (since allowAdditionalProperties is true)
const stripSchema = zex.object({
  name: zex.string(),
  age: zex.number()
}, true, "strip");

const stripJsonSchema = stripSchema.toJsonSchema();
expectOk('strip schema exports additionalProperties: true', () => {
  if (stripJsonSchema.additionalProperties !== true) {
    throw new Error(`Expected additionalProperties: true, got ${stripJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 5: Import from JSON Schema without additionalProperties should default to strict (false)
const importedStrictSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  }
  // No additionalProperties field
});

const importedStrictJsonSchema = importedStrictSchema.toJsonSchema();
expectOk('imported schema without additionalProperties exports additionalProperties: false', () => {
  if (importedStrictJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false, got ${importedStrictJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 6: Import from JSON Schema with additionalProperties: false should stay false
const importedFalseSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  additionalProperties: false
});

const importedFalseJsonSchema = importedFalseSchema.toJsonSchema();
expectOk('imported schema with additionalProperties: false exports additionalProperties: false', () => {
  if (importedFalseJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false, got ${importedFalseJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 7: Import from JSON Schema with additionalProperties: true should stay true
const importedTrueSchema = zex.fromJsonSchema({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  additionalProperties: true
});

const importedTrueJsonSchema = importedTrueSchema.toJsonSchema();
expectOk('imported schema with additionalProperties: true exports additionalProperties: true', () => {
  if (importedTrueJsonSchema.additionalProperties !== true) {
    throw new Error(`Expected additionalProperties: true, got ${importedTrueJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 8: Lua roundtrip - strict schema should maintain additionalProperties: false
const luaStrictSchema = zex.object({
  name: zex.string(),
  age: zex.number()
});

// Simulate Lua data parsing
const luaData = { name: "John", age: 30 };
const parsedData = luaStrictSchema.parseFromLua(luaData);
expectOk('lua parsing works with strict schema', () => parsedData);

// Export to JSON Schema after Lua parsing
const luaStrictJsonSchema = luaStrictSchema.toJsonSchema();
expectOk('lua strict schema exports additionalProperties: false', () => {
  if (luaStrictJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false, got ${luaStrictJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 9: Lua roundtrip - passthrough schema should maintain additionalProperties: true
const luaPassthroughSchema = zex.object({
  name: zex.string(),
  age: zex.number()
}, true, "passthrough");

// Simulate Lua data with additional properties
const luaDataWithExtra = { name: "John", age: 30, extra: "should be allowed" };
const parsedDataWithExtra = luaPassthroughSchema.parseFromLua(luaDataWithExtra);
expectOk('lua parsing works with passthrough schema and extra properties', () => parsedDataWithExtra);

// Export to JSON Schema after Lua parsing
const luaPassthroughJsonSchema = luaPassthroughSchema.toJsonSchema();
expectOk('lua passthrough schema exports additionalProperties: true', () => {
  if (luaPassthroughJsonSchema.additionalProperties !== true) {
    throw new Error(`Expected additionalProperties: true, got ${luaPassthroughJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 10: Complex nested schema should maintain additionalProperties: false
const nestedStrictSchema = zex.object({
  user: zex.object({
    name: zex.string(),
    profile: zex.object({
      avatar: zex.string().optional()
    })
  }),
  settings: zex.object({
    theme: zex.string().default("dark")
  })
});

const nestedStrictJsonSchema = nestedStrictSchema.toJsonSchema();
expectOk('nested strict schema exports additionalProperties: false at root level', () => {
  if (nestedStrictJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false at root, got ${nestedStrictJsonSchema.additionalProperties}`);
  }
  return true;
});

// Test 11: Mixed mode schema - root strict, nested passthrough
const mixedModeSchema = zex.object({
  user: zex.object({
    name: zex.string(),
    profile: zex.object({
      avatar: zex.string().optional()
    }, true, "passthrough") // nested passthrough
  }),
  settings: zex.object({
    theme: zex.string().default("dark")
  })
  // root strict (default)
});

const mixedModeJsonSchema = mixedModeSchema.toJsonSchema();
expectOk('mixed mode schema exports correct additionalProperties', () => {
  // Root should be strict (false)
  if (mixedModeJsonSchema.additionalProperties !== false) {
    throw new Error(`Expected additionalProperties: false at root, got ${mixedModeJsonSchema.additionalProperties}`);
  }
  
  // User profile should be passthrough (true)
  const userProfileSchema = (mixedModeJsonSchema.properties?.user as any)?.properties?.profile;
  if (userProfileSchema.additionalProperties !== true) {
    throw new Error(`Expected additionalProperties: true in user.profile, got ${userProfileSchema.additionalProperties}`);
  }
  
  return true;
});

console.log("✅ All additionalProperties export tests passed!");
