import { zex } from '../zex/index.js';

// =============================================================================
// FIX 1: JSON Schema Roundtrip Test
// =============================================================================

console.log("=== FIX 1: JSON Schema Roundtrip Test ===");

// Test 1: String mit Validatoren
const originalString = zex.string().email().min(5).max(100);
const jsonString = originalString.toJsonSchema();
const recreatedString = zex.fromJsonSchema(jsonString);
const jsonString2 = recreatedString.toJsonSchema();

console.log("Original string schema:", originalString);
console.log("JSON Schema 1:", jsonString);
console.log("Recreated string schema:", recreatedString);
console.log("JSON Schema 2:", jsonString2);
console.log("Roundtrip successful:", JSON.stringify(jsonString) === JSON.stringify(jsonString2));

// Test 2: Number mit Validatoren
const originalNumber = zex.number().min(0).max(120).int();
const jsonNumber = originalNumber.toJsonSchema();
const recreatedNumber = zex.fromJsonSchema(jsonNumber);
const jsonNumber2 = recreatedNumber.toJsonSchema();

console.log("Original number schema:", originalNumber);
console.log("JSON Schema 1:", jsonNumber);
console.log("Recreated number schema:", recreatedNumber);
console.log("JSON Schema 2:", jsonNumber2);
console.log("Roundtrip successful:", JSON.stringify(jsonNumber) === JSON.stringify(jsonNumber2));

// Test 3: URI Schema Roundtrip
const originalUri = zex.uri();
const jsonUri = originalUri.toJsonSchema();
const recreatedUri = zex.fromJsonSchema(jsonUri);
const jsonUri2 = recreatedUri.toJsonSchema();

console.log("Original URI schema:", originalUri);
console.log("JSON Schema 1:", jsonUri);
console.log("Recreated URI schema:", recreatedUri);
console.log("JSON Schema 2:", jsonUri2);
console.log("Roundtrip successful:", JSON.stringify(jsonUri) === JSON.stringify(jsonUri2));

// Test 4: Complex Object Roundtrip
const originalObject = zex.object({
  name: zex.string().min(1).title("Name"),
  age: zex.number().min(0).max(120).optional(),
  email: zex.string().email().optional(),
  website: zex.uri().optional()
});
const jsonObject = originalObject.toJsonSchema();
const recreatedObject = zex.fromJsonSchema(jsonObject);
const jsonObject2 = recreatedObject.toJsonSchema();

console.log("Original object schema:", originalObject);
console.log("JSON Schema 1:", jsonObject);
console.log("Recreated object schema:", recreatedObject);
console.log("JSON Schema 2:", jsonObject2);
console.log("Roundtrip successful:", JSON.stringify(jsonObject) === JSON.stringify(jsonObject2));

// =============================================================================
// FIX 2: Intelligente Default-Werte Test
// =============================================================================

console.log("\n=== FIX 2: Intelligente Default-Werte Test ===");

// Test 1: Normaler Default
const schemaWithDefault = zex.string().default("fallback");
console.log("schema.parse(undefined):", schemaWithDefault.parse(undefined)); // Sollte "fallback" sein
console.log("schema.parse(null):", schemaWithDefault.parse(null)); // Sollte "fallback" sein

// Test 2: Nullable Schema mit Default
const nullableSchema = zex.string().nullable().default("fallback");
console.log("nullableSchema.parse(undefined):", nullableSchema.parse(undefined)); // Sollte "fallback" sein
console.log("nullableSchema.parse(null):", nullableSchema.parse(null)); // Sollte null sein (nicht "fallback")

// Test 3: Optional Schema mit Default
const optionalSchema = zex.string().optional().default("fallback");
console.log("optionalSchema.parse(undefined):", optionalSchema.parse(undefined)); // Sollte "fallback" sein
console.log("optionalSchema.parse(null):", optionalSchema.parse(null)); // Sollte "fallback" sein

// =============================================================================
// FIX 3: Erweiterter JSON-Schema-Export Test
// =============================================================================

console.log("\n=== FIX 3: Erweiterter JSON-Schema-Export Test ===");

const schemaWithValidators = zex.string()
  .email()
  .min(5)
  .max(100)
  .pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
  .title("Email Address")
  .describe("A valid email address");

const jsonSchema = schemaWithValidators.toJsonSchema();
console.log("Schema mit Validatoren:", schemaWithValidators);
console.log("JSON Schema mit allen Constraints:", jsonSchema);

// Prüfe, ob alle Validatoren im JSON Schema erscheinen
console.log("Enthält minLength:", jsonSchema.minLength !== undefined);
console.log("Enthält maxLength:", jsonSchema.maxLength !== undefined);
console.log("Enthält format:", jsonSchema.format === "email");
console.log("Enthält pattern:", jsonSchema.pattern !== undefined);
console.log("Enthält title:", jsonSchema.title === "Email Address");
console.log("Enthält description:", jsonSchema.description !== undefined);

// =============================================================================
// FIX 4: Strukturierte Fehlerobjekte Test
// =============================================================================

console.log("\n=== FIX 4: Strukturierte Fehlerobjekte Test ===");

const testSchema = zex.object({
  name: zex.string().min(1),
  age: zex.number().min(0).max(120),
  email: zex.string().email()
});

// Test 1: Fehlende Properties
try {
  testSchema.parse({});
} catch (error: unknown) {
  console.log("Fehler bei fehlenden Properties:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error path:", (error as any).path);
  console.log("Error code:", (error as any).code);
  console.log("Error received:", (error as any).received);
}

// Test 2: Falsche Typen
try {
  testSchema.parse({
    name: 123, // Falscher Typ
    age: "invalid", // Falscher Typ
    email: "not-an-email" // Ungültiges Email
  });
} catch (error: unknown) {
  console.log("Fehler bei falschen Typen:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error path:", (error as any).path);
  console.log("Error code:", (error as any).code);
  console.log("Error received:", (error as any).received);
}

console.log("\n=== ALLE PRODUCTION FIXES GETESTET ==="); 