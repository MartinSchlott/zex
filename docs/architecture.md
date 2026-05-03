# Zex — Architecture

## Tech stack

- TypeScript 5.x, ESM only, Node ≥ 18
- Build: `tsc` → `dist/`
- Test runner: hand-written (`tests/run-all-tests.ts`), ts-node ESM loader
- Zero runtime deps. devDeps: `@types/node`, `ts-node`, `typescript`

## Module layout

```
src/
  index.ts                       Re-exports zex/index.ts
  zex/
    index.ts                     Public API (zex namespace + class re-exports)
    types.ts                     ZexError, ZexConfig, ZexResult, JsonSchema, MAX_PARSE_DEPTH
    validators.ts                Email, Uuid, Min, Max, Pattern, Multiline, Int, ...
    basic-types.ts               ZexString, ZexNumber, ZexBoolean, ZexEnum, ZexNull,
                                 ZexAny, ZexBuffer, ZexJson, ZexFunction, ZexTValue
    special-types.ts             ZexUri, ZexUrl, ZexJsonSchema
    unions.ts                    ZexUnion, ZexDiscriminatedUnion
    json-schema-import.ts        fromJsonSchema, policy pipeline, schema/type transforms
    base/
      index.ts                   Barrel
      zex-base.ts                Abstract base class — core of everything
      zex-lazy.ts                ZexLazy for recursive schemas
      export-context.ts          $defs/$ref tracking during export
    complex-types/
      index.ts                   Barrel
      object.ts                  ZexObject (strict/passthrough/strip + strip*-helpers)
      array.ts                   ZexArray
      record.ts                  ZexRecord
      tuple.ts                   ZexTuple
      literal.ts                 ZexLiteral
      type-helpers.ts            InferProperty, InferObjectType, InferTuple
    utils/
      lua.ts                     decodePossibleUtf8Bytes

tests/
  run-all-tests.ts               Sequential runner — every new test must be registered here
  _imports.ts                    Centralized: import { zex } from '../src/...'
  _utils.ts                      expectOk(label, fn), expectFail(label, fn)
  unit/basic, unit/complex, unit/special
  behavior/                      Lua, metadata, discriminators, optional handling
  jsonschema/                    Roundtrip, enum, union, additionalProperties
  sql/                           Policy-driven SQL import
  integration/                   Real-world schemas (LLM, Supabase)
  regressions/                   One file per fixed bug
  typecheck/                     Positive TypeScript tests
  typecheck-fail/                Expected TypeScript errors (du-non-literal-discriminator etc.)
  declaration-emit/              TS2742 repros for .d.ts generation
```

## ZexBase contract

Every new type extends `ZexBase<T, TFlags>` and implements four methods:

| Method | Purpose |
|--------|---------|
| `clone(newConfig)` | Return a new instance with updated config (immutability) |
| `getBaseJsonSchema()` | JSON Schema representation without modifiers |
| `validateType(data)` | Fast type check: `{ success: true } \| { success: false, error }` |
| `transformLua(data)` | Best-effort Lua normalization (must not throw) |

Optional override: `_parse(data, path)` for element-level validation
(object, array, union, tuple do this).

## Parse flow

```
parse(data, ctx?)              throws ZexError
safeParse(data, ctx?)          ZexResult<T>
parseFromLua(data, ctx?)       throws (transformLua → _parse)
safeParseFromLua(data, ctx?)   ZexResult<T>
parseDelta(path, value)        validate value against sub-schema by JSON Pointer
safeParseDelta(path, value)    ZexResult<T>
replace(instance, path, val)   replace + full root revalidation (incl. .refine())
safeReplace(instance, ...)     ZexResult<T>

internal: _parse(data, path)
  1. circular reference check
  2. depth limit (MAX_PARSE_DEPTH = 100)
  3. default value application
  4. optional / nullable handling (default takes precedence over null on undefined)
  5. validateType(data)
  6. run validators
  7. type-specific logic (object: pre-strip, mode-check, field walk; etc.)

internal: _tryParse(data, path)  result-flow variant (no throw)
```

Since 0.5.0, `safe*` APIs use `_tryParse` and return structured `ZexResult<T>`
instead of strings. Internal control flow no longer relies on exceptions.

Object output normalization: optional properties that are missing in the
input are omitted from the output entirely (no `key: undefined`).

## JSON Schema roundtrip

- **Export.** `schema.toJSONSchema(opts?)` composes `getBaseJsonSchema()` plus
  validator schemas plus modifier metadata. `$defs`/`$ref` tracking lives in
  `ExportContext` (`base/export-context.ts`); recursive/lazy structures get
  stable registry entries.
- **Import.** `zex.fromJsonSchema(schema, opts?)` walks the AST, reconstructs
  Zex types. `safeFromJsonSchema` returns `ZexResult` instead of throwing.
- **Format markers** for roundtrip stability: `buffer`, `record`, `json`,
  `jsonschema`. External schemas without markers are imported best-effort.
- **Cycles.** Lazy placeholders plus memoization in the `$ref` resolver.
- **Defaults.** The importer applies `default` for primitives and keeps
  defaulted object properties non-optional on import (matching the runtime
  invariant).
- **`oneOf`** is imported as a union with `x-oneOf` metadata.
- **`allOf`** and **`not`** in JSON Schema input throw clear errors rather
  than being silently ignored.
- **`additionalProperties`** can be `true`, `false`, `undefined`, or a schema
  object — all four cases are handled. A schema object is treated as
  passthrough.
- **`type: 'null'`** is recognized directly.
- **Discriminated union import** falls back to a regular union when variants
  are not all `ZexObject`.

## Policy system

Composable pipeline for import from heterogeneous sources (PostgreSQL,
OpenAPI, custom):

```
fromJsonSchema(schema, { policy: 'sql' })
  → SchemaTransform[]   pre-parse, mutates the input schema
  → AST walk → Zex types
  → TypeTransform[]     post-parse, mutates the Zex types
```

- Built-in `sql` policy: `int64 → string` (or strategy-driven), `jsonb → zex.json()`,
  `bytea → zex.buffer()`, nullable normalization (`anyOf` of `T | null` → `T.nullable()`),
  format mapping for SQL types.
- Registration: `zex.registerPolicy(name, { schemaTransforms, typeTransforms })`
- Manual application of type transforms only: `zex.applyTypeTransforms(schema, transforms)`
- Deref hook for external `$ref` (sync or async)

## Object modes

Three modes govern unknown properties at runtime:

- `strict` (default) — throws `ZexError` with code `unknown_property`
- `passthrough` — unknown keys are preserved in the output
- `strip` — unknown keys are silently removed

**Targeted runtime-strip layer** runs before the mode check in `_parse`:

- `stripOnly(...keys)` — drop these specific keys from input
- `stripReadOnly()` / `stripWriteOnly()` — drop all keys with the matching flag

`omit*` operates on the schema (removes keys from shape, changes inferred type).
`strip*` is runtime-only (shape unchanged, input filtered).

Strict/passthrough key checks use `Set` for O(1) lookup.

## Unions

- `ZexUnion._parse`: try each schema in order, collect errors, throw a combined
  error if none match.
- `ZexUnion._parseFromLua`: transform-and-validate **per schema**, not "transform
  once with the first schema." Critical for Lua data that needs different
  transforms in different schemas. Keep this in sync with `_parse`.
- `ZexDiscriminatedUnion`: `Map`-based, O(1) variant lookup via discriminator key.
  Discriminated unions nested inside arrays are correctly reconstructed on import.
  Uses JSON Schema Draft 2020-12 `discriminator` format on export.

## Lazy / recursive schemas

`ZexLazy(getSchema)` for recursive structures. A `_parsing` reentrance guard
prevents infinite recursion on cyclic data — do not bypass it. Roundtrip via
`$ref` and `ExportContext`.

## Test strategy

- **Explicit registration.** Every new test file must be added to
  `run-all-tests.ts`. No file globbing.
- **Helpers.** `expectOk(label, fn)` and `expectFail(label, fn)` from
  `tests/_utils.ts`. Imports go through `tests/_imports.ts`.
- **Regression tests.** One file per fixed bug under `tests/regressions/`,
  with a descriptive filename.
- **TypeScript tests.** `typecheck/` (positive), `typecheck-fail/` (expected
  errors), `declaration-emit/` (TS2742 repros). Each has its own npm script.

## Conventions

- **Immutable chaining** — every modifier returns a new instance via `clone()`
- **ESM `.js` extensions** in all imports (`import x from './y.js'`)
- **`Object.keys` / `Object.entries`** — never `for...in` (prototype-chain hazard,
  also prototype-pollution surface)
- **Symbol-keyed properties** are ignored — not representable in JSON Schema
- **`transformLua` must not throw** — return original on failure; let
  `validateType` produce the error
- **Zero runtime deps**, devDeps kept minimal
- **English** in code, comments, docs, errors

## Watchouts

- `ZexLazy._parse` reentrance guard — do not bypass
- `ZexUnion._parseFromLua` must stay in sync with `_parse` semantics
- `additionalProperties` in JSON Schema import has four shapes — handle all
- `default` plus `nullable` interaction: default applies on `undefined`, not on `null`
- Unknown-property checks live in `_parse`, not in `validateType` — `safeParse`
  must traverse the full path
- `ZexObject` constructor exposes `allowAdditionalProperties` and `mode` as
  independent parameters — see `bug.kanban.md` (roundtrip footgun)
- `for...in` on plain objects iterates the prototype chain; use `Object.keys`
  or `Object.entries` everywhere
