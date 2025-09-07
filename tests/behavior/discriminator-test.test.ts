import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== TEST: Discriminator detection ===");

// Test simple discriminator
// NOTE: The schema must match the input shape (`{ messages: [...] }`).
// Root is an object with `messages` array of discriminated union items.
const simpleDiscriminatorSchema = {
  type: "object",
  properties: {
    messages: {
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            properties: {
              role: { const: "system" },
              content: { type: "string" }
            },
            required: ["role", "content"]
          },
          {
            type: "object",
            properties: {
              role: { const: "user" },
              content: { type: "string" },
              outputSchema: { type: "object" }
            },
            required: ["role", "content"]
          }
        ],
        discriminator: {
          propertyName: "role"
        }
      }
    }
  },
  required: ["messages"],
  additionalProperties: false
};

console.log("Testing discriminator detection...");
const schema = zex.fromJsonSchema(simpleDiscriminatorSchema);
console.log("Schema type:", schema.constructor.name);

// Test with normal data
const normalData = {
  messages: [
    { role: "system", content: "Hello" },
    { role: "user", content: "Hi", outputSchema: { type: "object" } }
  ]
};

try {
  const result = schema.parse(normalData);
  console.log("✅ Normal parse succeeded");
  console.log("Messages[1].outputSchema:", result.messages[1].outputSchema);
} catch (error) {
  console.log("❌ Normal parse failed:", error);
}

// Test with Uint8Array data
const luaData = {
  messages: [
    { role: new Uint8Array([115, 121, 115, 116, 101, 109]), content: "Hello" }, // "system"
    { role: new Uint8Array([117, 115, 101, 114]), content: "Hi", outputSchema: { type: "object" } } // "user"
  ]
};

try {
  const result = schema.parseFromLua(luaData);
  console.log("✅ Lua parse succeeded");
  console.log("Messages[1].outputSchema:", result.messages[1].outputSchema);
} catch (error) {
  console.log("❌ Lua parse failed:", error);
}
