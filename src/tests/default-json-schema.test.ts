import { zex } from "../zex/index.js";

console.log("=== Default Values in JSON Schema Tests ===");

// Test 1: Basic default values in JSON schema
console.log("\n--- Test 1: Basic default values in JSON schema ---");

const basicDefaultSchema = zex.object({
  name: zex.string().default("Anonymous").describe("Name with default"),
  age: zex.number().default(25).describe("Age with default"),
  active: zex.boolean().default(true).describe("Active status with default"),
  tags: zex.array(zex.string()).default(["default"]).describe("Tags with default")
});

const basicJsonSchema = basicDefaultSchema.toJsonSchema();

console.log("✅ Basic JSON Schema generated");
console.log("   Name default:", basicJsonSchema.properties?.name?.default);
console.log("   Age default:", basicJsonSchema.properties?.age?.default);
console.log("   Active default:", basicJsonSchema.properties?.active?.default);
console.log("   Tags default:", basicJsonSchema.properties?.tags?.default);

// Verify defaults are present
const nameHasDefault = basicJsonSchema.properties?.name?.default === "Anonymous";
const ageHasDefault = basicJsonSchema.properties?.age?.default === 25;
const activeHasDefault = basicJsonSchema.properties?.active?.default === true;
const tagsHasDefault = Array.isArray(basicJsonSchema.properties?.tags?.default) && 
                      basicJsonSchema.properties?.tags?.default[0] === "default";

console.log("   ✅ Name has correct default:", nameHasDefault);
console.log("   ✅ Age has correct default:", ageHasDefault);
console.log("   ✅ Active has correct default:", activeHasDefault);
console.log("   ✅ Tags has correct default:", tagsHasDefault);

// Test 2: Nested object with defaults
console.log("\n--- Test 2: Nested object with defaults ---");

const nestedDefaultSchema = zex.object({
  user: zex.object({
    name: zex.string().default("User").describe("User name"),
    email: zex.string().email().default("user@example.com").describe("User email")
  }).default({ name: "DefaultUser", email: "default@example.com" }).describe("User object"),
  settings: zex.object({
    theme: zex.enum(["light", "dark"]).default("light").describe("Theme setting"),
    notifications: zex.boolean().default(true).describe("Notifications setting")
  }).describe("User settings")
});

const nestedJsonSchema = nestedDefaultSchema.toJsonSchema();

console.log("✅ Nested JSON Schema generated");
console.log("   User object default:", nestedJsonSchema.properties?.user?.default);
console.log("   Settings theme default:", nestedJsonSchema.properties?.settings?.properties?.theme?.default);
console.log("   Settings notifications default:", nestedJsonSchema.properties?.settings?.properties?.notifications?.default);

// Test 3: Array with defaults
console.log("\n--- Test 3: Array with defaults ---");

const arrayDefaultSchema = zex.object({
  items: zex.array(zex.string()).default(["item1", "item2"]).describe("Array with default"),
  numbers: zex.array(zex.number()).default([1, 2, 3]).describe("Number array with default")
});

const arrayJsonSchema = arrayDefaultSchema.toJsonSchema();

console.log("✅ Array JSON Schema generated");
console.log("   Items default:", arrayJsonSchema.properties?.items?.default);
console.log("   Numbers default:", arrayJsonSchema.properties?.numbers?.default);

// Test 4: Union with defaults
console.log("\n--- Test 4: Union with defaults ---");

const unionDefaultSchema = zex.union(
  zex.string().default("string default"),
  zex.number().default(42)
).describe("Union with defaults");

const unionJsonSchema = unionDefaultSchema.toJsonSchema();

console.log("✅ Union JSON Schema generated");
console.log("   Union default:", unionJsonSchema.default);

// Test 5: Complex schema with mixed defaults
console.log("\n--- Test 5: Complex schema with mixed defaults ---");

const complexDefaultSchema = zex.object({
  id: zex.number().describe("Required ID"),
  profile: zex.object({
    name: zex.string().default("Anonymous").describe("Profile name"),
    email: zex.string().email().optional().describe("Optional email"),
    avatar: zex.string().default("default-avatar.png").describe("Avatar with default")
  }).describe("User profile"),
  preferences: zex.object({
    theme: zex.enum(["light", "dark", "auto"]).default("auto").describe("Theme preference"),
    language: zex.string().default("en").describe("Language preference"),
    notifications: zex.boolean().default(true).describe("Notification preference")
  }).describe("User preferences"),
  metadata: zex.object({
    created: zex.string().default("2023-01-01").describe("Creation date"),
    updated: zex.string().optional().describe("Last update date"),
    tags: zex.array(zex.string()).default(["default"]).describe("Tags with default")
  }).describe("Metadata")
});

const complexJsonSchema = complexDefaultSchema.toJsonSchema();

console.log("✅ Complex JSON Schema generated");
console.log("   Profile name default:", complexJsonSchema.properties?.profile?.properties?.name?.default);
console.log("   Profile avatar default:", complexJsonSchema.properties?.profile?.properties?.avatar?.default);
console.log("   Preferences theme default:", complexJsonSchema.properties?.preferences?.properties?.theme?.default);
console.log("   Preferences language default:", complexJsonSchema.properties?.preferences?.properties?.language?.default);
console.log("   Preferences notifications default:", complexJsonSchema.properties?.preferences?.properties?.notifications?.default);
console.log("   Metadata created default:", complexJsonSchema.properties?.metadata?.properties?.created?.default);
console.log("   Metadata tags default:", complexJsonSchema.properties?.metadata?.properties?.tags?.default);

// Test 6: Verify that parsing works with defaults
console.log("\n--- Test 6: Verify parsing works with defaults ---");

try {
  const parsedBasic = basicDefaultSchema.parse({});
  console.log("✅ Empty object parsed with defaults:", parsedBasic);
  
  const parsedComplex = complexDefaultSchema.parse({ id: 1 });
  console.log("✅ Complex object parsed with defaults:", parsedComplex);
  
} catch (error) {
  console.log("❌ Parsing with defaults failed:", error);
}

// Test 7: Verify that JSON schema can be used for validation
console.log("\n--- Test 7: JSON Schema validation compatibility ---");

// Test that the generated JSON schema contains all expected properties
const hasAllBasicDefaults = nameHasDefault && ageHasDefault && activeHasDefault && tagsHasDefault;
const hasNestedDefaults = nestedJsonSchema.properties?.user?.default && 
                         nestedJsonSchema.properties?.settings?.properties?.theme?.default;
const hasArrayDefaults = Array.isArray(arrayJsonSchema.properties?.items?.default) &&
                        Array.isArray(arrayJsonSchema.properties?.numbers?.default);

console.log("✅ All basic defaults present in JSON schema:", hasAllBasicDefaults);
console.log("✅ Nested object defaults present in JSON schema:", hasNestedDefaults);
console.log("✅ Array defaults present in JSON schema:", hasArrayDefaults);

console.log("\n✅ All Default Values in JSON Schema tests completed!"); 