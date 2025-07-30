// meta-access-test.ts - Test accessing metadata from schemas
// =============================================================================

import { zex } from '../../dist/index.js';

console.log("🧪 Testing Metadata Access");
console.log("==========================");

// Test 1: Basic metadata access
console.log("\n--- Test 1: Basic metadata access ---");
const commentSchema = zex.string()
  .title("Kommentar")
  .meta({
    "x-ui": {
      "multiline": true,
      "autocomplete": false,
      "placeholder": "Gib deinen Kommentar ein"
    },
    "custom-field": "custom-value"
  });

// Zugriff auf alle Metadaten
const allMeta = commentSchema.meta();
console.log("All metadata:", JSON.stringify(allMeta, null, 2));

// Zugriff auf spezifische Metadaten
const xUiMeta = commentSchema.meta()["x-ui"];
console.log("x-ui metadata:", JSON.stringify(xUiMeta, null, 2));

const customField = commentSchema.meta()["custom-field"];
console.log("custom-field:", customField);

// Test 2: Object metadata access
console.log("\n--- Test 2: Object metadata access ---");
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
  })
}).meta({
  "x-ui": {
    "layout": "vertical",
    "submitButton": "Speichern"
  },
  "form-title": "Benutzerregistrierung"
});

// Root-level Metadaten
const rootMeta = userSchema.meta();
console.log("Root metadata:", JSON.stringify(rootMeta, null, 2));

// Property-level Metadaten (über JSON Schema)
const jsonSchema = userSchema.toJsonSchema();
const nameMeta = jsonSchema.properties?.name?.["x-ui"];
const emailMeta = jsonSchema.properties?.email?.["x-ui"];

console.log("Name x-ui metadata:", JSON.stringify(nameMeta, null, 2));
console.log("Email x-ui metadata:", JSON.stringify(emailMeta, null, 2));

// Test 3: Array metadata access
console.log("\n--- Test 3: Array metadata access ---");
const tagsSchema = zex.array(zex.string())
  .min(1)
  .max(5)
  .meta({
    "x-ui": {
      "component": "tag-input",
      "maxTags": 5,
      "placeholder": "Tags hinzufügen"
    },
    "description": "Wähle bis zu 5 Tags aus"
  });

const arrayMeta = tagsSchema.meta();
console.log("Array metadata:", JSON.stringify(arrayMeta, null, 2));

// Test 4: Utility function to extract x-ui metadata
console.log("\n--- Test 4: Utility function ---");
function extractXUiMetadata(schema: any): any {
  const meta = schema.meta();
  return meta["x-ui"];
}

const commentXUi = extractXUiMetadata(commentSchema);
const userXUi = extractXUiMetadata(userSchema);
const tagsXUi = extractXUiMetadata(tagsSchema);

console.log("Comment x-ui:", JSON.stringify(commentXUi, null, 2));
console.log("User x-ui:", JSON.stringify(userXUi, null, 2));
console.log("Tags x-ui:", JSON.stringify(tagsXUi, null, 2));

// Test 5: Type-safe metadata access
console.log("\n--- Test 5: Type-safe access ---");
interface XUiMetadata {
  multiline?: boolean;
  autocomplete?: boolean;
  placeholder?: string;
  component?: string;
  maxTags?: number;
  layout?: string;
  submitButton?: string;
  type?: string;
  rows?: number;
}

function getXUiMetadata(schema: any): XUiMetadata | undefined {
  const meta = schema.meta();
  return meta["x-ui"] as XUiMetadata;
}

const typedCommentXUi = getXUiMetadata(commentSchema);
console.log("Typed comment x-ui:", typedCommentXUi);

console.log("\n🎯 Summary: Metadata Access Methods");
console.log("   ✅ schema.meta() - Zugriff auf alle Metadaten");
console.log("   ✅ schema.meta()['x-ui'] - Zugriff auf x-ui Metadaten");
console.log("   ✅ JSON Schema properties - Zugriff auf Property-Metadaten");
console.log("   ✅ Utility functions - Typsichere Extraktion");
console.log("   ✅ TypeScript interfaces - Typsichere Metadaten");
console.log("   ✅ Method overloading - Zod-kompatible API"); 