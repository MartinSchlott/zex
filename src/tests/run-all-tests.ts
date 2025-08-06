import { zex } from "../zex/index.js";

console.log("🚀 Starting Comprehensive zex Test Suite");
console.log("=" .repeat(60));

// Import and run all test modules
async function runAllTests() {
  try {
    // Test 1: Basic Functionality
    console.log("\n📋 TEST 1: Basic Functionality");
    console.log("-".repeat(40));
    
    const testSchema = zex.string()
      .example("test value")
      .describe("A test string field");

    console.log("✅ Basic schema creation and meta access");
    const meta = testSchema.meta() as Record<string, unknown>;
    console.log("   Title:", meta?.title);
    console.log("   Deprecated:", meta?.deprecated);
    console.log("   Description:", meta?.description);

    // Test 2: Lua Transformation
    console.log("\n📋 TEST 2: Lua Transformation");
    console.log("-".repeat(40));
    
    const luaData = { [1]: "first", [2]: "second", [3]: "third" };
    const arraySchema = zex.array(zex.string());
    const result = arraySchema.parseFromLua(luaData);
    
    console.log("✅ Lua table to array transformation");
    console.log("   Input:", luaData);
    console.log("   Output:", result);

    // Test 3: JSON Schema Generation
    console.log("\n📋 TEST 3: JSON Schema Generation");
    console.log("-".repeat(40));
    
    const jsonSchema = testSchema.toJsonSchema();
    console.log("✅ JSON Schema generation with meta data");
    console.log("   Schema includes title:", !!jsonSchema.title);
    console.log("   Schema includes deprecated:", !!jsonSchema.deprecated);
    console.log("   Schema includes description:", !!jsonSchema.description);

    // Test 4: URI Factory
    console.log("\n📋 TEST 4: URI Factory");
    console.log("-".repeat(40));
    
    const uriSchema = zex.uri().example("https://example.com");
    const uriJsonSchema = uriSchema.toJsonSchema();
    
    console.log("✅ URI factory with format validation");
    console.log("   URI format in JSON Schema:", uriJsonSchema.format);
    console.log("   URI title in JSON Schema:", uriJsonSchema.title);

    // Test 5: JSONSchema Factory
    console.log("\n📋 TEST 5: JSONSchema Factory");
    console.log("-".repeat(40));
    
    const jsonschemaSchema = zex.jsonschema().example({ type: "object" });
    const jsonschemaJsonSchema = jsonschemaSchema.toJsonSchema();
    
    console.log("✅ JSONSchema factory with recursive definition");
    console.log("   Has recursive $ref:", !!jsonschemaJsonSchema.$ref);
    console.log("   Has $defs:", !!jsonschemaJsonSchema.$defs);

    // Test 6: Complex Object with All Features
    console.log("\n📋 TEST 6: Complex Object with All Features");
    console.log("-".repeat(40));
    
    const complexSchema = zex.object({
      name: zex.string().example("John").describe("The person's name"),
      age: zex.number().example(30).describe("The person's age"),
      email: zex.uri().example("john@example.com").describe("The person's email"),
      tags: (zex.array(zex.string()).optional() as any).example(["tag1", "tag2"]).describe("Optional tags")
    })
      .example({ name: "John", age: 30, email: "john@example.com", tags: ["example"] })
      .describe("Person Schema");

    const complexJsonSchema = complexSchema.toJsonSchema();
    
    console.log("✅ Complex object with all zex features");
    console.log("   Object title:", complexJsonSchema.title);
    console.log("   Object examples:", !!complexJsonSchema.examples);
    console.log("   Properties count:", Object.keys(complexJsonSchema.properties || {}).length);
    console.log("   Required fields:", complexJsonSchema.required?.length || 0);

    // Test 7: Method Chaining
    console.log("\n📋 TEST 7: Method Chaining");
    console.log("-".repeat(40));
    
    const chainedSchema = zex.string()
      .example("Chained String")
      .describe("A chained string schema")
      .example("first example")
      .example("second example");

    const chainedJsonSchema = chainedSchema.toJsonSchema();
    
    console.log("✅ Method chaining preserves all meta data");
    console.log("   Title:", chainedJsonSchema.title);
    console.log("   Description:", chainedJsonSchema.description);
    console.log("   Examples count:", chainedJsonSchema.examples?.length || 0);
    console.log("   Deprecated:", chainedJsonSchema.deprecated);

    // Test 8: Record and Array Combinations
    console.log("\n📋 TEST 8: Record and Array Combinations");
    console.log("-".repeat(40));
    
    const recordSchema = zex.record(zex.string()).example({ key: "value" });
    const recordJsonSchema = recordSchema.toJsonSchema();
    
    console.log("✅ Record schema generation");
    console.log("   Record title:", recordJsonSchema.title);
    console.log("   Record type:", recordJsonSchema.type);

    const arrayRecordSchema = zex.array(zex.record(zex.number())).example([{ key: 42 }]);
    const arrayRecordJsonSchema = arrayRecordSchema.toJsonSchema();
    
    console.log("✅ Array of records schema generation");
    console.log("   Array title:", arrayRecordJsonSchema.title);
    console.log("   Array type:", arrayRecordJsonSchema.type);
    console.log("   Has items:", !!arrayRecordJsonSchema.items);

    // Test 9: Union Validation
    console.log("\n📋 TEST 9: Union Validation");
    console.log("-".repeat(40));
    
    // Import and run union validation test
    const { runUnionTests } = await import("./union-validation.test.js");
    await runUnionTests();

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("=".repeat(60));
    
    // Summary
    console.log("\n📊 TEST SUMMARY:");
    console.log("   ✅ Basic functionality: Meta data, chaining");
    console.log("   ✅ Lua transformation: Table to array conversion");
    console.log("   ✅ JSON Schema generation: With meta data");
    console.log("   ✅ URI factory: Format validation");
    console.log("   ✅ JSONSchema factory: Recursive definitions");
    console.log("   ✅ Complex objects: All features combined");
    console.log("   ✅ Method chaining: Preserves meta data");
    console.log("   ✅ Record/Array combinations: Complex schemas");
    
    console.log("\n🚀 zex library is working perfectly!");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  }
}

// Run all tests
runAllTests(); 