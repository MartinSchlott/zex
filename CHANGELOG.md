# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- (no pending changes)

## [0.6.3] - 2025-04-03

### Fixed
- Circular reference detection for self-referencing `lazy()` schemas (was causing infinite recursion)
- Union `parseFromLua` now tries transform+validate per schema instead of blindly using the first schema's transform — fixes order-dependent Lua parsing in unions
- Prototype pollution resistance in object validation — uses `Object.keys()` instead of `for...in`
- `additionalProperties` as schema object in JSON Schema import no longer silently ignored (treated as passthrough)
- Discriminated union import falls back to regular union when variants are not all `ZexObject`
- `oneOf` in JSON Schema import now creates a union with `x-oneOf` metadata instead of throwing
- `ZexError.toJSON()` added for clean JSON serialization
- Improved error message for binary data that fails UTF-8 decoding ("Expected string, got binary data")

### Changed
- Object strict/passthrough key checks now use `Set` for O(1) lookup instead of `Array.includes()`
- Depth limit extracted to `MAX_PARSE_DEPTH` constant
- Documented default+nullable interaction priority in code comments

## [0.6.2] - 2025-01-10

### Fixed
- Exported missing type helpers (`InferProperty`, `InferObjectType`, `InferTuple`) for declaration emit compatibility
- Exported missing basic types (`ZexJson`, `ZexFunction`, `ZexTValue`) from main entry point

## [0.6.1] - 2025-01-10

### Fixed
- `ZexSchemaPublic` is now generic, preserving type information instead of returning `any`

## [0.6.0] - 2025-01-10

### Added
- `ZexSchemaPublic<T, Flags>` type alias for annotating exported schemas without TS2742 errors

### Changed
- `discriminatedUnion` now accepts `ZexTypeAny`/`ZexSchemaPublic` variants (runtime validates they are `ZexObject`)

### Fixed
- Fixed TS2345 error when using `discriminatedUnion` with schemas annotated as `ZexTypeAny`

## [0.5.0] - 2025-10-13

### Breaking
- `safe*` APIs now return structured `ZexResult<T>` instead of string errors
- Internal parsing no longer uses exceptions as control flow (unions, arrays, tuples, objects use result flow)

### Fixed
- Enriched `safe*` error strings remain readable via string coercion

## [0.4.2] - 2025-10-12

### Fixed
- Enriched error messages for `safeParse`/`safeParseFromLua` to include path and type summary

## [0.4.1] - 2025-10-12

### Fixed
- Lua `parseFromLua` for arrays now accepts 0-based contiguous numeric keys in addition to 1-based

## [0.4.0] - 2025-10-10

### Added
- Delta APIs: `parseDelta`/`safeParseDelta` for validating values against sub-schemas by JSON Pointer path
- Replace APIs: `replace`/`safeReplace` for replace-only semantics with full root revalidation

## [0.3.1] - 2025-10-09

### Added
- Custom refinement support via `refine(predicate, message?)` on all Zex types

## [0.3.0] - 2025-09-26

### Added
- Policy-driven JSON Schema import pipeline with composable schema/type transforms
- Built-in `sql` policy (PostgreSQL-focused) with nullable normalization, format mapping, and int64/numeric strategies
- Deref hook for external `$ref` resolution (sync/async)

### Changed
- Importer recognizes `type: 'null'` directly and preserves flags/meta during type rebuilds

## [0.2.10] - 2025-09-15

### Fixed
- JSON Schema importer now applies `default` for primitives and keeps defaulted object properties non-optional on import

## [0.2.8] - 2025-09-12

### Added
- JSON roundtrip marker for `zex.json()` — exports `{ format: "json" }` and re-imports correctly

## [0.2.7] - 2025-01-27

### Added
- Targeted strip helpers: `stripOnly(...keys)`, `stripReadOnly()`, `stripWriteOnly()` on objects

## [0.2.6] - 2025-01-27

### Added
- Object utilities: `partial()`, `omit(...keys)`, `omitReadOnly()`, `omitWriteOnly()`

### Fixed
- `safeParseFromLua` now respects object modes for unknown keys consistently

## [0.2.5] - 2025-01-27

### Fixed
- Enum Lua byte-strings are now correctly decoded to UTF-8 strings in `safeParseFromLua`

## [0.2.4] - 2025-01-27

### Added
- JSON Schema `$defs`/`$ref` export with stable registry entries and support for recursive/lazy structures

### Fixed
- JSON Schema `$ref` import resolver with memoization and lazy placeholders for cycles

## [0.2.3] - 2025-01-27

### Changed
- Optional object properties are now omitted when missing (no `key: undefined` in output)

## [0.2.2] - 2025-01-27

### Fixed
- Importer correctly reconstructs discriminated unions nested inside arrays

## [0.2.1] - 2025-01-27

### Added
- `zex.json()` type for JSON-serializable data (rejects functions and binary data)

## [0.2.0] - 2025-09-06

### Breaking Changes
- `allOf`, `oneOf`, and `not` in JSON Schema import now throw clear errors instead of being silently ignored

### Added
- Explicit record marking via `format: "record"` in JSON Schema export/import
- `zex.jsonschema()` now roundtrips correctly via `format: "jsonschema"`

### Fixed
- Lua byte-string decoding in unions, discriminated unions, and literals
- Discriminated unions now use JSON Schema Draft 2020-12 discriminator format
