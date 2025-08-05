# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.9] - 2025-01-27
### Fixed
- **Improved Error Messages**: Enhanced error messages throughout the library for better developer experience
  - `fromJsonSchema` now provides specific error messages for invalid schema types, null values, and missing properties
  - Array validation errors now include the actual data type and value received
  - Object validation errors now show what type was received instead of expected object
  - Union validation errors now include the received data type and value
  - All error messages now include helpful suggestions for fixing the issue
  - Added safe JSON.stringify handling to prevent crashes with circular references
### Technical Details
- Enhanced `fromJsonSchemaInternal` to provide more descriptive error messages
- Improved `ZexArray`, `ZexObject`, `ZexRecord`, and `ZexUnion` error messages
- Added try-catch blocks around JSON.stringify to handle non-serializable objects
- Error messages now include actual data types and truncated values for better debugging
### Examples
```typescript
// ✅ Before: "fromJsonSchema: Invalid schema at path 'Test'"
// ✅ After: "fromJsonSchema: Invalid schema at path 'Test' - schema is string. Expected a valid JSON Schema object."

// ✅ Before: "Expected array"
// ✅ After: "Expected array, got string (not an array)"

// ✅ Before: "Expected object"
// ✅ After: "Expected object, got string (not an object)"

// ✅ Before: "Value does not match any union type"
// ✅ After: "Value does not match any union type. Got object ({ complex: 'object' })"
```

## [0.1.8] - 2025-01-27

### Fixed
- **Schema Parser Compatibility**: Fixed critical compatibility issues with JSON Schema parsers, especially OpenAI
  - `zex.record(zex.any())` now generates parser-compatible schemas with `properties: {}` and `additionalProperties: true`
  - Resolves issues where `additionalProperties: {}` (empty object) was not understood by many parsers
  - Ensures maximum compatibility with OpenAI and other JSON Schema parsers
  - Maintains full backward compatibility with existing schemas

### Technical Details
- Enhanced `ZexRecord` class to always include `properties: {}` for parser compatibility
- Modified `additionalProperties` generation to use `true` instead of empty objects for `zex.any()`
- Improved JSON Schema generation to follow parser-friendly patterns
- Added comprehensive test suite to verify parser compatibility

### Examples

```typescript
// ✅ Now generates parser-compatible schema
const createInputSchema = zex.object({
    uri: zex.string().describe("URI for the node to create"),
    params: zex.record(zex.any()).optional().describe("Creation parameters")
});

// ✅ Generates OpenAI-compatible schema:
// {
//   "type": "object",
//   "properties": {
//     "uri": { "type": "string", "description": "..." },
//     "params": {
//       "type": "object",
//       "properties": {},
//       "additionalProperties": true
//     }
//   }
// }
```

### Tests Added
- `schema-parser-compatibility.test.ts` - Comprehensive test suite for parser compatibility
- Verifies OpenAI compatibility and other JSON Schema parser compatibility

## [0.1.7] - 2025-01-27

### Fixed
- **JSON Schema Items Bug**: Fixed critical bug where `fromJsonSchema` failed to parse JSON Schema objects with empty `items` properties
  - `zex.array(zex.any())` now generates `items: {}` which can be properly parsed by `fromJsonSchema`
  - Resolves error: `fromJsonSchema: Unsupported or unknown schema feature at path 'params.items'`
  - Particularly affects tool definitions that use array schemas with `zex.any()` items
  - Maintains full backward compatibility with existing array schemas

### Technical Details
- Enhanced `fromJsonSchemaInternal` function to handle empty `items` objects as `zex.any()`
- Added proper validation for empty `items` objects in array schemas
- Improved error handling for malformed JSON Schema structures
- Added comprehensive test suite to verify the fix

### Examples

```typescript
// ✅ Now works - Tool schema with array parameters
const toolInputSchema = zex.toJSONSchema(zex.object({
  sql: zex.string().describe("SQL statement"),
  params: zex.array(zex.any()).optional().describe("Statement parameters")
}));

// ✅ fromJsonSchema can now parse this schema
const parsedSchema = zex.fromJsonSchema(toolInputSchema);

// ✅ Tool call validation works
const toolCallData = {
  uri: "tool:/store/SQL-Database/execute",
  params: {
    sql: "INSERT INTO users (name, email) VALUES (?, ?)",
    params: ["Max Mustermann", "max@example.com"]
  }
};
const result = parsedSchema.parse(toolCallData);
```

### Tests Added
- `json-schema-items-bug.test.ts` - Comprehensive test suite for JSON Schema items bug
- `tool-jsonschema-items-bug.test.ts` - Tool-specific scenarios
- `fixed-items-bug.test.ts` - Verification that the bug is fixed

## [0.1.6] - 2025-07-30

### Added
- **ZexTypeAny Type Alias**: Added `zex.ZexTypeAny` as a convenient type alias for `ZexBase<any, any>`
  - Improves developer experience by providing a more intuitive type name
  - Maintains full compatibility with existing `ZexBase<any, any>` usage
  - Available both as direct export and within the `zex` namespace
  - Makes the API more consistent with Zod's `z.ZodTypeAny` pattern

### Examples

```typescript
// ✅ New convenient type alias
export const OperationResultSchema = <T extends zex.ZexTypeAny>(dataSchema: T) =>
  zex.object({
    success: zex.boolean(),
    data: dataSchema.optional(),
    error: zex.string().optional(),
    context: zex.string().optional(),
  });

// ✅ Also available as direct import
import { ZexTypeAny } from '@ai-inquisitor/zex';

// ✅ Still works with existing ZexBase<any, any>
export const LegacySchema = <T extends ZexBase<any, any>>(dataSchema: T) => // ...
```

## [0.1.5] - 2025-07-30

### Fixed
- **meta() Method**: Fixed critical bug where `meta()` method only worked as setter, not as getter
  - `schema.meta()` now returns metadata (getter functionality)
  - `schema.meta({...})` still sets metadata (setter functionality)
  - Method overloading properly implemented for Zod-compatible API
  - Resolves issue where metadata could not be accessed after setting

### Technical Details
- Implemented TypeScript method overloading for `meta()` method
- Removed temporary `getMetadata()` method
- Maintains full backward compatibility
- TypeScript correctly resolves getter vs setter calls

### Examples

```typescript
// Setter (with parameter)
const schema = zex.string().meta({
  "x-ui": { "multiline": true, "placeholder": "..." }
});

// Getter (without parameter)
const metadata = schema.meta();
const xUi = schema.meta()["x-ui"];
console.log(xUi.multiline); // true
console.log(xUi.placeholder); // "..."

// Utility function
function getXUiMetadata(schema: any) {
  return schema.meta()["x-ui"];
}
```

## [0.1.4] - 2025-07-30

### Fixed
- **Package Exports**: Fixed critical issue where classes were not properly exported from the main package
  - `ZexTuple`, `ZexArray`, `ZexObject`, etc. can now be imported directly from `@ai-inquisitor/zex`
  - Resolves `Cannot find module` errors when importing classes in consuming projects
  - Updated main `index.ts` to use `export *` for complete re-export of all classes

### Technical Details
- Fixed `src/index.ts` to properly re-export all classes from `./zex/index.js`
- All classes (`ZexBase`, `ZexString`, `ZexNumber`, `ZexBoolean`, `ZexArray`, `ZexObject`, `ZexTuple`, etc.) are now properly exported
- Build process now generates correct TypeScript definitions

### Examples

```typescript
// ✅ Now works - direct class import
import { ZexTuple } from '@ai-inquisitor/zex';

export interface ClarionFunction {
  name: string;
  schema: ZexTuple<any>; // ZexTuple is now available as a value
}

// ✅ Direct instantiation also works
const tuple = new ZexTuple([new ZexString(), new ZexNumber()]);
```

## [0.1.3] - 2025-07-30

### Fixed
- **Class Exports**: Fixed issue where ZexTuple and other classes were only exported as types, not as values
  - `ZexTuple`, `ZexArray`, `ZexObject`, etc. can now be imported directly as classes
  - Resolves `Cannot find module` errors when importing classes in consuming projects
  - Both type and value exports are now available for all classes

### Technical Details
- Added value exports alongside type exports in `src/zex/index.ts`
- All classes (`ZexBase`, `ZexString`, `ZexNumber`, `ZexBoolean`, `ZexArray`, `ZexObject`, `ZexTuple`, etc.) are now properly exported
- Maintains backward compatibility with existing type-only imports

### Examples

```typescript
// ✅ Now works - direct class import
import { ZexTuple } from '@ai-inquisitor/zex';

export interface ClarionFunction {
  name: string;
  schema: ZexTuple<any>; // ZexTuple is now available as a value
}

// ✅ Direct instantiation also works
const tuple = new ZexTuple([new ZexString(), new ZexNumber()]);
```

## [0.1.2] - 2025-07-30

### Added
- **Array Length Validation**: Added `.min()` and `.max()` methods to `ZexArray` class
  - `zex.array(zex.string()).min(2)` - Ensures array has at least 2 items
  - `zex.array(zex.number()).max(5)` - Ensures array has at most 5 items
  - `zex.array(zex.boolean()).min(1).max(10)` - Combined min/max constraints
- **ArrayMinLengthValidator**: New validator for minimum array length constraints
- **ArrayMaxLengthValidator**: New validator for maximum array length constraints
- **JSON Schema Support**: Array length constraints now generate proper `minItems`/`maxItems` in JSON Schema
- **Comprehensive Test Coverage**: Added extensive tests for array length validation including edge cases

### Changed
- **JsonSchema Interface**: Extended to include `minItems` and `maxItems` properties for array validation
- **ZexArray Class**: Added `.min()` and `.max()` methods following the same pattern as other Zex types

### Fixed
- **Zod Compatibility**: Array length validation now matches Zod's `.min()` and `.max()` API for arrays
- **Type Safety**: Maintained full TypeScript type inference for arrays with length constraints

### Technical Details
- **Validators**: Added `ArrayMinLengthValidator` and `ArrayMaxLengthValidator` to `src/zex/validators.ts`
- **Types**: Updated `JsonSchema` interface in `src/zex/types.ts` to include array length properties
- **Complex Types**: Extended `ZexArray` class in `src/zex/complex-types.ts` with new methods
- **Tests**: Comprehensive test suite in `src/tests/array-length-validation.test.ts`

### Examples

```typescript
// Basic array length validation
const userSchema = zex.object({
  tags: zex.array(zex.string()).min(1).max(5),
  scores: zex.array(zex.number()).min(3)
});

// Nested arrays with constraints
const matrixSchema = zex.array(zex.array(zex.number())).min(2).max(10);

// Arrays with complex objects
const usersSchema = zex.array(zex.object({
  name: zex.string(),
  age: zex.number()
})).min(1).max(100);

// JSON Schema generation
const schema = zex.array(zex.string()).min(2).max(5);
const jsonSchema = schema.toJsonSchema();
// Generates: { type: "array", minItems: 2, maxItems: 5, items: {...} }
```

## [0.1.1] - 2024-12-18

### Added
- Initial release with basic type validation
- String, number, boolean, array, object support
- JSON Schema generation
- TypeScript type inference
- Error handling with path tracking

### Changed
- Core architecture established
- Base classes and validator system implemented

## [0.1.0] - 2024-12-17

### Added
- Initial project setup
- Basic Zod-compatible API structure
- TypeScript configuration
- Development environment setup 