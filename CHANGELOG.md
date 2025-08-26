# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- (no pending changes)

## [0.1.16] - 2025-08-26
### Changed
- **Error messages include path/context**: Centralized formatting so failures show where they occurred.
  - Messages now start with `Validation failed at: <path>` and may include `Context` when available.
  - Affects type mismatches and validator failures across all types.
- **Tuple/array path indexing fixed**: Index `0` is no longer dropped from error paths.

### Tests
- Added behavior test reproducing missing root key vs unknown input key scenario.
- Adjusted tuple error-path assertion; full suite remains green.

## [0.1.15] - 2025-08-12
### Added
- **UI Hints**: `x-ui-multiline` for strings
  - `zex.string().multiline()` sets `x-ui-multiline` to `1`
  - `zex.string().multiline(n)` accepts positive, negative and float values
  - `zex.string().multiline(0)` removes the key (default behaves as `0`)
  - `getMultiline()` returns the current value or `0` if not set
  - Non-finite values (`NaN`, `Infinity`, `-Infinity`) throw
  - Roundtrips via `fromJsonSchema` using the `x-ui-multiline` key
- **JSON Schema Annotations**: `readOnly`/`writeOnly` flags for all Zex types (documentation-only)
  - Methods: `readOnly(flag = true)`, `writeOnly(flag = true)`, `isReadOnly()`, `isWriteOnly()`
  - Export: Only `true` is exported; `false` removes the key (no export noise)
  - Import: Normalized — `true` is kept, `false` is dropped
  - Note: Flags currently have no effect on `parse`/`validate` (documentation character only)
## [0.1.14] - 2025-08-10
### Added
- **Discriminated Unions**: New `zex.discriminatedUnion(discriminator, ...variants)` with clean types and fast runtime dispatch.
  - Variants must be `zex.object({...})` with required literal at the discriminator key.
  - Clear errors for missing/invalid discriminator values, variant path tracking preserved.
  - JSON Schema export as `anyOf` of variants; optional OpenAPI `discriminator` via `.openApiDiscriminator()`.
  - `fromJsonSchema` detects DU pattern (same required field with `const` across `anyOf`) and reconstructs DU; prefers OpenAPI `discriminator.propertyName` when present.

### Tests
- Unit tests for DU happy/failure paths and duplicate discriminator construction error.
- JSON Schema roundtrip tests for DUs.
- Separate type-error tests under `tests/typecheck-fail/` (not part of default typecheck) to ensure compile-time constraints.


#### Example
```typescript
// Before: Only the "most specific" error was shown
// Now: All alternatives and their errors are listed

// Example output:
// Error: Field 'messages': No union variant matched.
// Union alternative errors:
// - Alternative 0: Field 'role': Expected literal value "system", got "assistant"
// - Alternative 1: Field 'stopReason': Expected one of [stop, length, ...], got "STOP"
```

## [0.1.13] - 2025-08-08
### Fixed
- **Optional flag type inference**: A bug caused optional fields (e.g., `uid: zex.string().optional()`) to appear as required in certain intersections. Fixed via internal flag branding (`__zexFlags`) and stabilized return types of `optional/nullable/default`.

### Added
- **Tests**:
  - `tests/typecheck/optional-uid.ts`: Type-only (noEmit) verification that optional fields remain optional in inferred types.
  - `tests/behavior/optional-typing.test.ts`: Runtime test validating parsing without the optional field.

### Note
- This should have been caught by a simple typecheck test. That's on me — added the missing tests to prevent regressions.

## [0.1.12] - 2025-08-08
### Added
- **parseFromLua UTF‑8 decoding for strings**: When a string is expected, `Uint8Array`, `ArrayBuffer`, Node `Buffer`, or JSON-serialized buffer objects (`{ type: 'Buffer', data: number[] }`) are now automatically decoded to UTF‑8 JavaScript strings.

### Changed
- **Test structure revamped**: New grouped layout under `tests/` (unit/complex/special/behavior/jsonschema/integration/regressions) with aggregator. Legacy tests removed.

### Notes
- Real binary fields using `zex.buffer(...)` remain unchanged and are not decoded.

## [0.1.11] - 2025-08-08
### Added
- **mimeFormat(meta)**: New convenience method `schema.mimeFormat("image/png")` sets `meta.contentMediaType`.

### Changed
- **Type inference flags**: Fixed from intersection to union (e.g., `T | undefined | null`).
- **Chaining DX**: `optional()`, `nullable()`, `default()` now preserve the concrete subclass type (e.g., `zex.string().optional().min(3)`).
- **Docs**:
  - No “drop‑in replacement” claim; documented differences (object strict by default, union uses varargs, `describe()` naming).
  - JSON Schema `$schema` is not set by default; optional via parameter.
  - Note on intentionally unorthodox buffer JSON Schema for true binary support.

### Removed
- **Debug logs**: Removed `console.log` statements from `fromJsonSchemaInternal`.

### Developer Note
- ChatGPT‑5 is in town – this release refined with strong AI assistance (DX, types, docs).

### Fixed
- **Improved Error Messages**: Enhanced error messages for invalid JSON Schema objects
  - Fixed misleading error messages that suggested non-existent JSON Schema features
  - Removed references to `{ type: "any" }` and `true` which are not valid in JSON Schema
  - Updated error messages to suggest correct solutions like `{ type: "object", additionalProperties: true }`
  - Improved error messages for empty objects, null schemas, and schemas without type fields
### Technical Details
- Enhanced `fromJsonSchemaInternal` error messages to be more accurate and helpful
- Removed invalid JSON Schema suggestions from error messages
- Error messages now provide working solutions that zex can actually parse
### Examples
```typescript
// ✅ Before: "Use { type: "any" } or true for any value" (invalid)
// ✅ After: "Use { type: "object", additionalProperties: true } or similar" (valid)

// ✅ Before: "Use { type: "any" } for any value" (invalid)
// ✅ After: "Add 'type' field or use { type: "object", additionalProperties: true } for any value" (valid)
```

## [0.1.10] - 2025-01-27
### Fixed
- **Union Array Validation**: Fixed a critical bug where arrays with items using `anyOf` (union types) did not validate correctly
  - Arrays with union item schemas now correctly validate each element against all union alternatives
  - Prevents false negatives when array elements match a non-first union alternative
  - Ensures full compatibility with JSON Schema arrays using `anyOf` for items

### Technical Details
- Patched `fromJsonSchemaInternal` to wrap array `items.anyOf` in a union schema before passing to `zex.array`
- No side effects or breaking changes; only schema construction logic affected

### Example
```typescript
// Before: Only the first anyOf alternative was checked for array items
// After: All anyOf alternatives are checked for each array element

const schema = {
  type: "array",
  items: {
    anyOf: [
      { type: "string" },
      { type: "number" }
    ]
  }
};
// Now both strings and numbers are accepted in the array
``` 

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

