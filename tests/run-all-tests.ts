// Deterministic test runner that imports grouped tests
console.log("\n🚀 Starting Structured zex Test Suite");
console.log("============================================================\n");

async function runImport(modulePath: string) {
  try {
    await import(modulePath);
    console.log(`Imported: ${modulePath}`);
  } catch (e) {
    console.error(`❌ Failed importing ${modulePath}`);
    console.error(e);
    process.exit(1);
  }
}

// Unit: basic
await runImport('./unit/basic/string.test.ts');
await runImport('./unit/basic/number.test.ts');
await runImport('./unit/basic/number-positivity.test.ts');
await runImport('./unit/basic/boolean.test.ts');
await runImport('./unit/basic/json.test.ts');

// Unit: complex
await runImport('./unit/complex/object.test.ts');
await runImport('./unit/complex/array.test.ts');
await runImport('./unit/complex/tuple.test.ts');
await runImport('./unit/complex/record.test.ts');
await runImport('./unit/complex/union.test.ts');
await runImport('./unit/complex/literal-enum.test.ts');

// Unit: special
await runImport('./unit/special/uri-url-buffer-jsonschema.test.ts');

// Behavior
await runImport('./behavior/type-inference.test.ts');
await runImport('./behavior/metadata-defaults-errors-lua.test.ts');
await runImport('./behavior/repro-missing-root-key-vs-input.test.ts');
await runImport('./behavior/lua-deep-any-jsonschema-failing.test.ts');
await runImport('./behavior/lua-union-literal-discriminant-bytes.test.ts');

// JSON Schema
await runImport('./jsonschema/to-from-roundtrip.test.ts');
await runImport('./jsonschema/enum-jsonschema.test.ts');
await runImport('./jsonschema/complex-union-bug.test.ts');
await runImport('./jsonschema/additional-properties-export.test.ts');
await runImport('./jsonschema/any-empty-and-true-acceptance.test.ts');

// Integration
await runImport('./integration/llm-and-node.test.ts');
await runImport('./integration/supabase-config.test.ts');

// Regressions
await runImport('./regressions/additional-properties-strict-mode.test.ts');

console.log("\n============================================================");
console.log("🎉 ALL STRUCTURED TESTS COMPLETED!\n");

// Make this file a module so top-level await is allowed by TS tooling
export {};

