// Deterministic test runner that imports grouped tests
console.log("\n🚀 Starting Structured zex Test Suite");
console.log("============================================================\n");

// Unit: basic
await import('./unit/basic/string.test.js');
await import('./unit/basic/number.test.js');
await import('./unit/basic/boolean.test.js');

// Unit: complex
await import('./unit/complex/object.test.js');
await import('./unit/complex/array.test.js');
await import('./unit/complex/tuple.test.js');
await import('./unit/complex/record.test.js');
await import('./unit/complex/union.test.js');
await import('./unit/complex/literal-enum.test.js');

// Unit: special
await import('./unit/special/uri-url-buffer-jsonschema.test.js');

// Behavior
await import('./behavior/type-inference.test.js');
await import('./behavior/metadata-defaults-errors-lua.test.js');

// JSON Schema
await import('./jsonschema/to-from-roundtrip.test.js');

// Integration
await import('./integration/llm-and-node.test.js');

// Regressions
await import('./regressions/additional-properties-strict-mode.test.js');

console.log("\n============================================================");
console.log("🎉 ALL STRUCTURED TESTS COMPLETED!\n");

