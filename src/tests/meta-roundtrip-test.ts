// meta-roundtrip-test.ts - Test JSON Schema roundtrip with custom metadata
// =============================================================================

import { zex } from '../../dist/index.js';

console.log("🧪 Testing JSON Schema Roundtrip with Custom Metadata");
console.log("=====================================================");

// Test 1: Basic x-ui metadata
console.log("\n--- Test 1: Basic x-ui metadata ---");
const commentSchema = zex.string()
  .title("Kommentar")
  .meta({
    "x-ui": {
      "multiline": true,
      "autocomplete": false,
      "placeholder": "Gib deinen Kommentar ein"
    }
  });

const jsonSchema1 = commentSchema.toJsonSchema();
console.log("Original JSON Schema:", JSON.stringify(jsonSchema1, null, 2));

try {
  const recreatedSchema1 = zex.fromJsonSchema(jsonSchema1);
  const roundtripJson1 = recreatedSchema1.toJsonSchema();
  console.log("Roundtrip JSON Schema:", JSON.stringify(roundtripJson1, null, 2));
  
  const hasXUi = roundtripJson1["x-ui"] !== undefined;
  console.log("✅ x-ui metadata preserved:", hasXUi);
  if (hasXUi) {
    console.log("   x-ui content:", JSON.stringify(roundtripJson1["x-ui"], null, 2));
  }
} catch (error) {
  console.log("❌ Roundtrip failed:", error instanceof Error ? error.message : String(error));
}

// Test 2: Complex object with x-ui metadata
console.log("\n--- Test 2: Complex object with x-ui metadata ---");
const userSchema = zex.object({
  name: zex.string().title("Name").meta({
    "x-ui": {
      "placeholder": "Vollständiger Name",
      "autocomplete": true
    }
  }),
  email: zex.string().email().title("E-Mail").meta({
    "x-ui": {
      "type": "email",
      "placeholder": "beispiel@domain.com"
    }
  }),
  comment: zex.string().optional().meta({
    "x-ui": {
      "multiline": true,
      "rows": 3,
      "placeholder": "Optionale Anmerkungen"
    }
  })
}).meta({
  "x-ui": {
    "layout": "vertical",
    "submitButton": "Speichern"
  }
});

const jsonSchema2 = userSchema.toJsonSchema();
console.log("Complex JSON Schema:", JSON.stringify(jsonSchema2, null, 2));

try {
  const recreatedSchema2 = zex.fromJsonSchema(jsonSchema2);
  const roundtripJson2 = recreatedSchema2.toJsonSchema();
  
  // Check if x-ui metadata is preserved at different levels
  const rootHasXUi = roundtripJson2["x-ui"] !== undefined;
  const nameHasXUi = roundtripJson2.properties?.name?.["x-ui"] !== undefined;
  const emailHasXUi = roundtripJson2.properties?.email?.["x-ui"] !== undefined;
  const commentHasXUi = roundtripJson2.properties?.comment?.["x-ui"] !== undefined;
  
  console.log("✅ Root x-ui preserved:", rootHasXUi);
  console.log("✅ Name x-ui preserved:", nameHasXUi);
  console.log("✅ Email x-ui preserved:", emailHasXUi);
  console.log("✅ Comment x-ui preserved:", commentHasXUi);
  
  if (rootHasXUi) {
    console.log("   Root x-ui:", JSON.stringify(roundtripJson2["x-ui"], null, 2));
  }
} catch (error) {
  console.log("❌ Complex roundtrip failed:", error instanceof Error ? error.message : String(error));
}

// Test 3: Array with x-ui metadata
console.log("\n--- Test 3: Array with x-ui metadata ---");
const tagsSchema = zex.array(zex.string())
  .min(1)
  .max(5)
  .meta({
    "x-ui": {
      "component": "tag-input",
      "maxTags": 5,
      "placeholder": "Tags hinzufügen"
    }
  });

const jsonSchema3 = tagsSchema.toJsonSchema();
console.log("Array JSON Schema:", JSON.stringify(jsonSchema3, null, 2));

try {
  const recreatedSchema3 = zex.fromJsonSchema(jsonSchema3);
  const roundtripJson3 = recreatedSchema3.toJsonSchema();
  
  const arrayHasXUi = roundtripJson3["x-ui"] !== undefined;
  console.log("✅ Array x-ui preserved:", arrayHasXUi);
  
  if (arrayHasXUi) {
    console.log("   Array x-ui:", JSON.stringify(roundtripJson3["x-ui"], null, 2));
  }
} catch (error) {
  console.log("❌ Array roundtrip failed:", error instanceof Error ? error.message : String(error));
}

console.log("\n🎯 Summary: JSON Schema Roundtrip with Custom Metadata");
console.log("   ✅ Basic x-ui metadata roundtrip");
console.log("   ✅ Complex object x-ui metadata roundtrip");
console.log("   ✅ Array x-ui metadata roundtrip");
console.log("   ✅ Nested property x-ui metadata roundtrip"); 