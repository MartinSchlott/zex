# Changelog Archive

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- (no pending changes)

## [0.2.0] - 2025-09-06 

### Breaking Changes
- **Composition Keywords Rejection**: `allOf`, `oneOf`, and `not` now throw clear errors instead of being silently ignored
  - `allOf` → Use `zex.object().extend()` for object composition
  - `oneOf`/`not` → Use `zex.union()` with specific types
  - This is a breaking change for code importing schemas with these keywords

### New Features
- **Explicit Record Marking**: 
  - Records now export `format: "record"` in JSON Schema
  - Import only creates `ZexRecord` when `format: "record"` is present
  - Eliminates ambiguous guessing between records and regular objects
- **Jsonschema Type Preservation**:
  - `zex.jsonschema()` now exports `format: "jsonschema"`
  - Roundtrip preserves type information correctly
  - No more `ZexJsonSchema` → `ZexObject` conversion
- **Better Error Messages**:
  - Clear guidance for unsupported JSON Schema features
  - Helpful suggestions for alternatives

### Improvements
- **Lua Byte-String Decoding**:
  - Fixed parsing of `Uint8Array`/Buffer/byte objects in unions and discriminated unions
  - `ZexLiteral.transformLua` now decodes byte representations to UTF-8 strings
  - `ZexDiscriminatedUnion.transformLua` normalizes discriminator values
  - Simplified byte decoding to Uint8Array-only (removed complex heuristics)
- **JSON Schema Standards Compliance**:
  - Discriminated unions now use JSON Schema Draft 2020-12 discriminator format
  - Exports `{ anyOf: [...], discriminator: { propertyName: "key" } }`
  - Import only creates `ZexDiscriminatedUnion` with explicit discriminator
- **Performance Optimizations**:
  - Meta-only schemas now use early exit pattern
  - Eliminated complex fallback logic at end of `fromJsonSchemaInternal`
  - Created `isMetaOnlySchema()` helper for clear intent
- **Code Organization**:
  - Extracted union classes to `src/zex/unions.ts` and `src/zex/literal.ts`
  - Created `src/zex/utils/lua.ts` for shared byte decoding
  - Reduced file sizes to ~250 LOC guideline

### Refactoring
- **Simplified Discriminated Union Logic**: Removed heuristic discriminator detection
- **Explicit Type Markers**: Replaced guessing with clear format-based identification
- **Cleaner Error Handling**: Centralized composition keyword rejection
- **Better Separation of Concerns**: Type markers vs validators vs metadata

### Technical Details
- **Files Modified**: `src/zex/index.ts`, `src/zex/unions.ts`, `src/zex/literal.ts`, `src/zex/special-types.ts`, `src/zex/complex-types.ts`
- **New Files**: `src/zex/utils/lua.ts`
- **Tests Added**: `tests/behavior/lua-union-literal-discriminant-bytes.test.ts`
- **Breaking Changes**: 1 (composition keywords)
- **New Features**: 3 (format markers, better errors)
- **Improvements**: 4 (Lua decoding, standards, performance, organization)
