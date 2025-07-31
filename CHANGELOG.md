# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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