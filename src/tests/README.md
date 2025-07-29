# zex Test Suite

This directory contains comprehensive tests for the `zex` library, which extends Zod v4 with custom functionality including Lua transformation, enhanced meta data, and special factory functions.

## Test Files

### 1. `basic-functionality.test.ts`
Tests the core functionality of zex:
- ✅ Basic schema creation and meta access
- ✅ Title, deprecated, and describe methods
- ✅ Example functionality with multiple examples
- ✅ Method chaining with different data types
- ✅ Meta data preservation across operations

### 2. `lua-transformation.test.ts`
Tests Lua table to JavaScript array transformation:
- ✅ Simple array transformation (`{1: "a", 2: "b"}` → `["a", "b"]`)
- ✅ Number arrays
- ✅ Nested arrays (recursive transformation)
- ✅ Mixed type arrays
- ✅ Empty arrays

### 3. `json-schema.test.ts`
Tests JSON Schema generation:
- ✅ Basic type schemas (string, number, boolean)
- ✅ Array schemas with meta data
- ✅ Object schemas with nested properties
- ✅ Record schemas
- ✅ Complex nested schemas with all features

### 4. `special-factories.test.ts`
Tests the special factory functions:
- ✅ URI factory with format validation
- ✅ JSONSchema factory with recursive definitions
- ✅ URI and JSONSchema validation
- ✅ Complex objects combining URI and JSONSchema
- ✅ Arrays of URIs and JSONSchemas

### 5. `integration.test.ts`
Integration tests combining all features:
- ✅ Complete API schema with all zex features
- ✅ Lua transformation with complex nested data
- ✅ Method chaining with multiple operations
- ✅ Record schemas with complex values

### 6. `run-all-tests.ts`
Comprehensive test runner that executes all functionality:
- ✅ 8 major test categories
- ✅ Detailed output with emojis and formatting
- ✅ Summary of all passed tests
- ✅ Error handling and reporting

## Running Tests

### Run All Tests
```bash
npm run build
node --enable-source-maps dist/tests/run-all-tests.js
```

### Run Individual Test Files
```bash
# Basic functionality
node --enable-source-maps dist/tests/basic-functionality.test.js

# Lua transformation
node --enable-source-maps dist/tests/lua-transformation.test.js

# JSON Schema generation
node --enable-source-maps dist/tests/json-schema.test.js

# Special factories
node --enable-source-maps dist/tests/special-factories.test.js

# Integration tests
node --enable-source-maps dist/tests/integration.test.js
```

## Test Coverage

The test suite covers:

### ✅ Core Functionality
- Meta data management (`title`, `deprecated`, `describe`, `example`)
- Method chaining and preservation of meta data
- All basic Zod types (string, number, boolean, array, object, record)

### ✅ Lua Transformation
- Table to array conversion with contiguous positive keys
- Nested array transformation
- Mixed type arrays
- Empty array handling

### ✅ JSON Schema Generation
- Meta data inclusion in generated schemas
- Complex nested object schemas
- Array and record schemas
- Special format fields (URI format)

### ✅ Special Factories
- URI factory with validation
- JSONSchema factory with recursive definitions
- Integration with meta data system

### ✅ Integration Features
- Complex real-world scenarios
- All features combined in single schemas
- Error handling and validation

## Expected Output

When all tests pass, you should see:

```
🚀 Starting Comprehensive zex Test Suite
============================================================

📋 TEST 1: Basic Functionality
✅ Basic schema creation and meta access
✅ Method chaining preserves all meta data

📋 TEST 2: Lua Transformation  
✅ Lua table to array transformation
✅ Nested array transformation

📋 TEST 3: JSON Schema Generation
✅ JSON Schema generation with meta data
✅ Complex object schemas

📋 TEST 4: URI Factory
✅ URI factory with format validation

📋 TEST 5: JSONSchema Factory
✅ JSONSchema factory with recursive definition

📋 TEST 6: Complex Object with All Features
✅ Complex object with all zex features

📋 TEST 7: Method Chaining
✅ Method chaining preserves all meta data

📋 TEST 8: Record and Array Combinations
✅ Record schema generation
✅ Array of records schema generation

============================================================
🎉 ALL TESTS PASSED SUCCESSFULLY!
============================================================

📊 TEST SUMMARY:
   ✅ Basic functionality: Meta data, chaining
   ✅ Lua transformation: Table to array conversion
   ✅ JSON Schema generation: With meta data
   ✅ URI factory: Format validation
   ✅ JSONSchema factory: Recursive definitions
   ✅ Complex objects: All features combined
   ✅ Method chaining: Preserves meta data
   ✅ Record/Array combinations: Complex schemas

🚀 zex library is working perfectly!
```

## Notes

- Tests use a mock `isValidUri` function that always returns `true` and logs calls
- All tests are designed to be independent and can run in any order
- The test suite validates both functionality and API consistency
- Error handling is tested where appropriate
- Complex scenarios test the integration of all zex features 