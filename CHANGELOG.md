# Changelog Archive

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- (no pending changes)

## [0.2.10] - 2025-09-15

### Fixed
- JSON Schema importer applies `default` for primitives (string/number/boolean) and keeps defaulted object properties non-optional on import.
  - Ensures fields like `createdAt`/`tokenCount` with `default: 0` are populated even when missing from input after roundtrip (zex → JSON Schema → zex).
  - Discriminated union inside array (messages[].role) continues to work as before.

### Tests
- Added behavior test for LLM conversation schema roundtrip (including `safeParseFromLua`) asserting defaults for `createdAt`/`tokenCount`.
- Added behavior test reproducing BigInt timestamps scenario to document MessagePack decoding behavior (int64 as BigInt) and expected number validation error.

## [0.2.8] - 2025-09-12

### Added
- JSON roundtrip marker for `zex.json()`
  - Export now emits `{ format: "json" }` (non-standard marker) to preserve intent
  - Import maps `{ format: "json" }` back to `zex.json()` with meta preserved
  - Roundtrip stability for `zex.json()` including nested schemas

### Changed
- README cleanup: removed "What's New" sections; consolidated into primary docs
  - Documented JSON marker behavior and roundtrip guarantees
  - Kept README concise; full history remains in this CHANGELOG

### Refactoring
- Internal code organization: complex types and base class split into dedicated modules for maintainability
  - `src/zex/complex-types/*` (array, object, record, literal, tuple, helpers)
  - `src/zex/base/*` (zex-base, zex-lazy, export-context)
  - `fromJsonSchema` moved to `src/zex/json-schema-import.ts`

### Tests
- Added roundtrip tests for `zex.json()` including nesting and meta preservation

## [0.2.7] - 2025-01-27

### Added
- Targeted strip helpers on objects (runtime-only, preserve strictness for others):
  - `object.stripOnly(...keys)` drops only these keys from input before validation
  - `object.stripReadOnly()` drops only fields marked `readOnly: true`
  - `object.stripWriteOnly()` drops only fields marked `writeOnly: true`

### Guidance
- Prefer `strict().stripOnly('uid')` for selectively dropping known keys while keeping typo detection
- For writeOnly fields: make them optional (or use `partial()`) and use `stripWriteOnly()` when present
- Avoid `omitWriteOnly().stripWriteOnly()` unless you intentionally accept removed writeOnly keys

## [0.2.6] - 2025-01-27

### Added
- Object utilities:
  - `object.partial()` makes all top-level fields optional (shallow)
  - `object.omit(...keys)` removes specified top-level properties; unknown handling follows object mode (strict/strip/passthrough)
  - `object.omitReadOnly()` removes properties marked with `readOnly: true`
  - `object.omitWriteOnly()` removes properties marked with `writeOnly: true`

### Fixed
- `safeParseFromLua` now respects object modes for unknown keys in strict/strip/passthrough consistently (no silent stripping in strict)

### Notes
- All new methods are immutable and chainable; JSON Schema export/roundtrip reflects required changes and property removals

## [0.2.5] - 2025-01-27

### Fixed
- Enum Lua-Byte-Strings werden jetzt korrekt zu UTF-8 Strings decodiert
  - `ZexEnum.transformLua` dekodiert `Uint8Array`/Buffer/ArrayBuffer und byte-ähnliche Objekte
  - Behebt `safeParseFromLua`-Fehler bei Enums in zusammengesetzten Strukturen (z. B. Display-Status)

## [0.2.4] - 2025-01-27

### Added
- JSON Schema $defs/$ref Export (Phase 2)
  - Export-Registry erstellt stabile Einträge in `$defs` und verweist per `$ref`
  - Unterstützt rekursive/lazy Strukturen ohne Inline-Duplikate

### Fixed
- JSON Schema $ref Import-Resolver
  - `fromJsonSchema` löst lokale `$defs`-Referenzen auf, mit Memoisierung und Lazy-Platzhaltern für Zyklen
  - Discriminated Unions in geschachtelten Positionen bleiben erhalten

### Tests
- Neuer Lazy-Display Roundtrip-Test prüft $defs/$ref Nutzung und erfolgreiche Re-Import-Validierung

## [0.2.3] - 2025-01-27

### Changed
- Optional object properties are now omitted when missing (no `key: undefined`)
  - Applies to both `parse` and `parseFromLua`
  - Avoids cross-runtime coercion of `undefined` into placeholder objects
  - Aligns with JSON behavior (`JSON.stringify` drops undefined properties)

## [0.2.2] - 2025-01-27

### Fixed
- Importer now correctly reconstructs discriminated unions nested inside arrays
  - When importing `type: "array"` with `items.anyOf` and `items.discriminator.propertyName`,
    `fromJsonSchema` builds a `discriminatedUnion` for the item schema instead of a plain union
  - Fixes roundtrip where nested DU fields were dropped during Lua pre-transform
  - Ensures `messages[].role` DUs survive roundtrip and `safeParseFromLua` preserves variant fields

### Notes
- Export already emitted standards-conform JSON Schema (Draft 2020-12): `anyOf` + `discriminator`
- This release aligns importer behavior with exporter for nested DU scenarios

## [0.2.1] - 2025-01-27

### New Features
- **JSON-Serializable Type**: Added `zex.json()` for clear intent signaling
  - Accepts any JSON-serializable data (objects, arrays, primitives)
  - Rejects functions and binary data (Uint8Array, Buffer) recursively
  - Provides semantic clarity over `zex.any()` for JSON-compatible fields
  - Same flexibility as `zex.any()` but with better documentation intent
  - Includes comprehensive test coverage and documentation

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

### Performance Optimizations
- Meta-only schemas now use early exit pattern
- Eliminated complex fallback logic at end of `fromJsonSchemaInternal`
- Created `isMetaOnlySchema()` helper for clear intent

### Code Organization
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
