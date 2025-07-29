import { zex, ZexError } from '../zex/index.js';

console.log("=== CONSISTENCY FIXES TEST ===");

// =============================================================================
// FIX 1: Unknown Properties Should Throw ZexError
// =============================================================================

console.log("--- FIX 1: Unknown Properties Test ---");

const userSchema = zex.object({
  name: zex.string(),
  age: zex.number().optional()
});

// Test 1: Unknown property should throw ZexError
try {
  userSchema.parse({
    name: "John",
    age: 30,
    unknownField: "value" // Unknown property
  });
} catch (error) {
  console.log("Unknown property error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
  console.log("Error received:", (error as any).received);
}

// Test 2: Missing required field should throw ZexError
try {
  userSchema.parse({
    age: 30 // Missing required 'name'
  });
} catch (error) {
  console.log("Missing required field error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
  console.log("Error received:", (error as any).received);
}

// =============================================================================
// FIX 2: Better Union Error Handling
// =============================================================================

console.log("\n--- FIX 2: Union Error Handling Test ---");

const unionSchema = zex.union(
  zex.string().min(5), // String with min length
  zex.number().min(0).max(100), // Number with range
  zex.object({ type: zex.literal("custom"), data: zex.string() }) // Complex object
);

// Test 1: String that's too short (should give specific error)
try {
  unionSchema.parse("abc"); // Too short for string variant
} catch (error) {
  console.log("Union string error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
}

// Test 2: Number that's out of range (should give specific error)
try {
  unionSchema.parse(150); // Out of range for number variant
} catch (error) {
  console.log("Union number error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
}

// Test 3: Object with wrong structure (should give specific error)
try {
  unionSchema.parse({ type: "custom" }); // Missing required 'data' field
} catch (error) {
  console.log("Union object error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
}

// Test 4: Completely wrong type (should give generic union error)
try {
  unionSchema.parse(true); // Boolean - no variant matches
} catch (error) {
  console.log("Union mismatch error:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
}

// =============================================================================
// FIX 3: Circular Reference and Max Depth Errors
// =============================================================================

console.log("\n--- FIX 3: Circular Reference and Max Depth Test ---");

// Test 1: Circular reference (this is hard to trigger, but we can test the error structure)
// We'll test with a simple case that should work
const simpleSchema = zex.string();
try {
  simpleSchema.parse("test"); // This should work
  console.log("Simple schema parse successful");
} catch (error) {
  console.log("Unexpected error:", error);
}

// Test 2: Verify ZexError structure
const testError = new ZexError(
  ["user", "name"],
  "test_error",
  "Test error message",
  "invalid_value",
  "expected string"
);

console.log("Test ZexError structure:");
console.log("Error type:", testError.constructor.name);
console.log("Error name:", testError.name);
console.log("Error message:", testError.message);
console.log("Error path:", testError.path);
console.log("Error code:", testError.code);
console.log("Error received:", testError.received);
console.log("Error expected:", testError.expected);
console.log("Error toString():", testError.toString());

// =============================================================================
// COMPREHENSIVE ERROR TESTING
// =============================================================================

console.log("\n--- COMPREHENSIVE ERROR TESTING ---");

// Test all error types
const comprehensiveSchema = zex.object({
  name: zex.string().min(3),
  age: zex.number().min(0).max(120),
  email: zex.string().email(),
  status: zex.union(
    zex.literal("active"),
    zex.literal("inactive")
  )
});

// Test 1: Multiple errors in one object
try {
  comprehensiveSchema.parse({
    name: "ab", // Too short
    age: -5, // Too low
    email: "not-an-email", // Invalid email
    status: "unknown", // Not in union
    extraField: "value" // Unknown property
  });
} catch (error) {
  console.log("Comprehensive error test:", error);
  console.log("Error type:", (error as any).constructor.name);
  console.log("Error code:", (error as any).code);
  console.log("Error path:", (error as any).path);
}

console.log("\n=== ALL CONSISTENCY FIXES TESTED ==="); 