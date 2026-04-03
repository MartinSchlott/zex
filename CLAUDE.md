# Zex — AI Developer Guide

You are working on **Zex**, a TypeScript schema validation library. This file gives you everything you need to contribute effectively.

## Commands

```bash
npm test          # run full test suite (ts-node/esm loader)
npm run build     # clean + tsc compile to dist/
npm run typecheck # type-check without emitting
```

## Project Layout

```
src/
  index.ts                        # re-exports from zex/index.ts
  zex/
    index.ts                      # public API: the `zex` namespace object
    types.ts                      # ZexError, ZexConfig, PathEntry, JsonSchema, MAX_PARSE_DEPTH
    validators.ts                 # built-in validators (Email, Uuid, Min, Max, Pattern, etc.)
    basic-types.ts                # ZexString, ZexNumber, ZexBoolean, ZexEnum, ZexBuffer, ZexJson, ...
    special-types.ts              # ZexUri, ZexUrl, ZexJsonSchema
    unions.ts                     # ZexUnion, ZexDiscriminatedUnion
    json-schema-import.ts         # fromJsonSchema, policy system, schema/type transforms
    base/
      zex-base.ts                 # abstract base class — core of everything
      zex-lazy.ts                 # ZexLazy for recursive schemas
      export-context.ts           # $defs/$ref tracking during JSON Schema export
    complex-types/
      object.ts                   # ZexObject (strict/passthrough/strip, partial, omit, strip*)
      array.ts                    # ZexArray
      record.ts                   # ZexRecord
      tuple.ts                    # ZexTuple
      literal.ts                  # ZexLiteral
      type-helpers.ts             # InferProperty, InferObjectType, InferTuple
    utils/
      lua.ts                      # decodePossibleUtf8Bytes helper

tests/
  run-all-tests.ts                # sequential test runner — new tests must be added here
  _imports.ts                     # centralized `import { zex } from ...`
  _utils.ts                       # expectOk(label, fn), expectFail(label, fn)
  unit/basic/                     # string, number, boolean, json
  unit/complex/                   # object, array, tuple, record, union, literal-enum
  unit/special/                   # uri/url/buffer, refine, delta-parse, delta-replace
  behavior/                       # lua transforms, metadata, discriminators, optional handling
  jsonschema/                     # roundtrip, enum, union, additional-properties
  sql/                            # policy-driven import transforms
  integration/                    # real-world schema tests
  regressions/                    # bug fix regression tests
```

## Architecture

Every Zex type extends `ZexBase<T, TFlags>`. To implement a new type, you need four methods:

| Method | Purpose |
|--------|---------|
| `clone(newConfig)` | Return new instance with updated config (immutability) |
| `getBaseJsonSchema()` | Return the JSON Schema representation (without modifiers) |
| `validateType(data)` | Fast type check: `{ success: true }` or `{ success: false, error }` |
| `transformLua(data)` | Best-effort Lua data normalization (byte arrays to strings, table indices to arrays) |

Optionally override `_parse(data, path)` for element-level validation (objects, arrays, unions do this).

### Parse flow

```
parse(data, context?)
  -> _parse(data, path)
       1. circular reference check
       2. depth limit check (MAX_PARSE_DEPTH)
       3. default value application
       4. optional/nullable handling
       5. validateType(data)
       6. run validators
       7. return data (or subclass-specific logic)
```

For Lua: `parseFromLua` calls `transformLua` first, then `_parse`.

### JSON Schema roundtrip

- **Export**: `schema.toJSONSchema()` calls `getBaseJsonSchema()` + validator schemas + metadata
- **Import**: `zex.fromJsonSchema(schema, options?)` walks the JSON Schema AST and creates Zex types
- **Format markers** ensure roundtrip stability: `buffer`, `record`, `json`, `jsonschema`
- **Policy system**: pre-parse `SchemaTransform[]` + post-parse `TypeTransform[]`, registered via `zex.registerPolicy(name, ...)`

### Unions

- `ZexUnion._parse`: tries each schema in order, collects errors, throws combined error if none match
- `ZexUnion._parseFromLua`: tries transform+validate per schema (not just the first transform)
- `ZexDiscriminatedUnion`: uses discriminator key for O(1) variant lookup via `Map`

### Object modes

- **strict** (default): unknown keys throw `ZexError`
- **passthrough**: unknown keys preserved in output
- **strip**: unknown keys silently removed
- Runtime strip methods (`stripOnly`, `stripReadOnly`, `stripWriteOnly`) remove keys before the mode check

## Conventions

- **Immutable chaining**: Every modifier returns a new instance via `clone()`. Never mutate.
- **Strict by default**: Objects reject unknown properties unless `.passthrough()` or `.strip()`.
- **No dependencies**: Zero runtime dependencies. Node.js >= 18.
- **ESM only**: `"type": "module"` in package.json. All imports use `.js` extensions.
- **Tests are explicit**: Every test file must be registered in `run-all-tests.ts` to run.
- **Test helpers**: Use `expectOk(label, fn)` and `expectFail(label, fn)` from `_utils.ts`.
- **Regression tests**: Bug fixes go in `tests/regressions/` with a descriptive filename.

## When Adding a Feature

1. Write the test first in the appropriate `tests/` subdirectory
2. Register it in `run-all-tests.ts`
3. Implement the feature
4. Run `npm test` — all tests must pass
5. Update `CHANGELOG.md` under `[Unreleased]`
6. Bump version in `package.json` only at release time

## When Fixing a Bug

1. Add a regression test in `tests/regressions/` that fails without the fix
2. Register it in `run-all-tests.ts`
3. Fix the bug
4. Run `npm test`
5. Update `CHANGELOG.md` and `REVIEW-FIXES.md` if applicable

## Things to Watch Out For

- `for...in` on objects iterates prototype chain — always use `Object.keys()` or `Object.entries()`
- `transformLua` should never throw — return original data on failure, let `validateType` handle errors
- JSON Schema import: `additionalProperties` can be `true`, `false`, `undefined`, or a schema object
- `ZexLazy._parse` has a reentrance guard (`_parsing` flag) — don't bypass it
- Union `_parseFromLua` overrides the base to try transform+validate per schema — keep this in sync with `_parse`
