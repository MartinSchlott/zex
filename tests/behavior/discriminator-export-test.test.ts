import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== TEST: Discriminator export ===");

// Test how ZexDiscriminatedUnion exports discriminator
const systemSchema = zex.object({
  role: zex.literal('system'),
  content: zex.string()
});

const userSchema = zex.object({
  role: zex.literal('user'),
  content: zex.string(),
  outputSchema: zex.record(zex.any())
});

const messageSchema = zex.discriminatedUnion("role", systemSchema, userSchema)
  .describe("LLMMessage - Any message in the conversation with role-specific structure.");

console.log("Testing how ZexDiscriminatedUnion exports discriminator...");

// Export to JSON Schema
const jsonSchema = messageSchema.toJSONSchema();
console.log("Exported JSON Schema:");
console.log(JSON.stringify(jsonSchema, null, 2));

// Test if discriminator is on the right level
if (jsonSchema.anyOf && jsonSchema.discriminator) {
  console.log("✅ Discriminator is on the anyOf level (correct)");
  console.log("Discriminator:", jsonSchema.discriminator);
} else {
  console.log("❌ Discriminator is missing or on wrong level");
}

// Test roundtrip: export and re-import
console.log("\nTesting roundtrip...");
const recreatedSchema = zex.fromJsonSchema(jsonSchema);
console.log("Recreated schema type:", recreatedSchema.constructor.name);

// Test with normal data (single message, because the schema is for one message)
const normalData = { role: "user", content: "Hi", outputSchema: { type: "object" } };

try {
  const result = recreatedSchema.parse(normalData);
  console.log("✅ Roundtrip parse succeeded");
  // Ensure outputSchema is preserved on the user variant
  console.log("Result.outputSchema:", result.outputSchema);
} catch (error) {
  console.log("❌ Roundtrip parse failed:", error);
}
