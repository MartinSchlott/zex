# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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