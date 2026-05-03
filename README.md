# Zex

**A TypeScript schema validator for data that isn't JSON-clean — buffers, Lua tables, Fengari coroutines, PostgreSQL JSONBs. Strict by default, zero dependencies, bidirectional JSON Schema.**

Zod takes JSON seriously and nothing beyond it. Functions, buffers, coroutines, binary payloads, Lua tables — "not our world." Zex steps back: schema validation is useful even when the data being validated isn't JSON-clean. A `zex.buffer()` is a first-class citizen, not an afterthought. JSON Schema roundtrip still works — through format markers (`format: "buffer"`, `format: "record"`, `format: "json"`, `format: "jsonschema"`) that pure-JSON tools can ignore.

If you validate pure JSON, take Zod. If you push Lua tables, PostgreSQL JSONBs, binary uploads, or Fengari coroutines through the same validator framework, take Zex.

```typescript
import { zex } from '@ai-inquisitor/zex'

const userSchema = zex.object({
  name:   zex.string().min(2),
  email:  zex.string().email(),
  role:   zex.enum(['admin', 'user', 'guest']),
  avatar: zex.buffer('image/jpeg').optional(),
})

type User = zex.infer<typeof userSchema>

userSchema.parse({ name: 'Alice', email: 'a@b.com', role: 'admin' })           // ok
userSchema.parse({ name: 'Alice', email: 'a@b.com', role: 'admin', typo: 1 })  // throws — strict by default

const jsonSchema = userSchema.toJSONSchema()
const recreated  = zex.fromJsonSchema(jsonSchema)
```

## Install

```bash
npm install @ai-inquisitor/zex
```

ESM only, Node ≥ 18. Zero runtime dependencies.

## What it does

**Strict-by-default objects.** Unknown properties throw `ZexError` with code `unknown_property`. Switch per schema with `.passthrough()` (preserve unknowns) or `.strip()` (silently drop). Object utilities cover both schema-level (`omit`, `omitReadOnly`, `omitWriteOnly`, `partial`, `extend`) and runtime-level (`stripOnly(...keys)`, `stripReadOnly`, `stripWriteOnly`) — the runtime layer filters input before the mode check, so you can keep strict mode and still drop a known set of keys.

**First-class non-JSON types.** `zex.buffer(mime?)` accepts `Uint8Array`, `ArrayBuffer`, and Node `Buffer`, and roundtrips through JSON Schema as `format: "buffer"`. `zex.function()` and `zex.tvalue()` exist for Fengari interop — Lua coroutines and arbitrarily nested userdata that conventional validators have to either reject or silently coerce. `zex.json()` validates "anything JSON-serializable" while still rejecting functions and binary data, and roundtrips via `format: "json"`.

**Lua / Fengari normalization.** `parseFromLua(data)` (and its `safeParseFromLua` sibling) runs `transformLua` over every node before validation: 1-based numeric tables become arrays, byte-encoded strings get UTF-8 decoded, nested tables walk into the right schema variant. Critically, `ZexUnion._parseFromLua` runs transform-and-validate **per schema**, not "transform once with the first schema's rules" — Lua data shaped for variant B doesn't fail because variant A's transform mangled it.

**Delta and Replace APIs.** Validate sub-tree updates by JSON Pointer without re-sending the whole object. `parseDelta(path, value)` validates a value against the schema at that path, no instance required. `replace(instance, path, value)` produces a new instance with the value replaced and the **whole root** revalidated — `.refine()` cross-field constraints fire correctly. Both come in `safe*` variants returning `ZexResult<T>`.

**Policy-driven JSON Schema import.** `zex.fromJsonSchema(schema, { policy: 'sql' })` runs a composable pre-parse `SchemaTransform[]` over the input and a post-parse `TypeTransform[]` over the resulting Zex types. The built-in `sql` policy maps `int64 → string` (configurable), `jsonb → zex.json()`, `bytea → zex.buffer()`, normalizes `anyOf` of `T | null` to `T.nullable()`, and applies SQL-specific format mappings. Register your own with `zex.registerPolicy(name, { schemaTransforms, typeTransforms })`. Sync and async deref hooks for external `$ref`.

**Bidirectional JSON Schema.** `schema.toJSONSchema()` and `zex.fromJsonSchema(json)` are designed for roundtrip stability. `$defs`/`$ref` survive, recursive structures survive (lazy placeholders + memoization), format markers survive. `oneOf` imports as a union with `x-oneOf` metadata. `allOf` and `not` throw clear errors instead of being silently dropped. `additionalProperties` handles all four input shapes (`true` / `false` / `undefined` / schema object — the last treated as passthrough). Discriminated unions use Draft 2020-12 `discriminator` format and reconstruct correctly even when nested inside arrays.

**Exception-free safe APIs.** Every parse method has a `safe*` sibling that returns `ZexResult<T> = { success: true, data: T } | { success: false, error: ZexError }`. Internal parsing no longer uses exceptions as control flow — unions, arrays, tuples, and objects flow through results. `ZexError` carries `path`, `code`, `message`, `received`, `expected`, `innerErrors`, and `toJSON()` for clean serialization.

**Declaration-emit compatibility.** `ZexSchemaPublic<T, Flags>` annotates exported schemas to avoid TS2742 errors when consumers regenerate `.d.ts`. `discriminatedUnion` accepts `ZexTypeAny` / `ZexSchemaPublic` variants and validates at runtime that they are `ZexObject`.

## Quick taste

```typescript
// Refinements + custom errors
const password = zex.string().min(8).refine(
  v => /[A-Z]/.test(v) && /[0-9]/.test(v),
  'must contain an uppercase letter and a digit',
)

// Discriminated union
const event = zex.discriminatedUnion('kind',
  zex.object({ kind: zex.literal('click'), x: zex.number(), y: zex.number() }),
  zex.object({ kind: zex.literal('key'),   code: zex.string() }),
)
type Event = zex.infer<typeof event>

// Lua data through a union — each variant gets its own transform pass
const luaPayload = { '1': 'click', '2': 100, '3': 200 }  // 1-based table from Fengari
const cmd = zex.union(
  zex.tuple([zex.literal('click'), zex.number(), zex.number()]),
  zex.tuple([zex.literal('key'),   zex.string()]),
)
cmd.parseFromLua(luaPayload)

// Delta validation without an instance
const post = zex.object({ title: zex.string().min(1), body: zex.string() })
post.parseDelta('/title', 'New title')           // throws if invalid
post.safeParseDelta('/title', '')                // { success: false, error: ZexError }

// Replace with full root revalidation
const original = post.parse({ title: 'a', body: 'x' })
const updated  = post.replace(original, '/title', 'b')

// SQL JSON Schema import
const sqlImported = zex.fromJsonSchema(postgresJsonSchema, { policy: 'sql' })
// int64 → string, jsonb → zex.json(), bytea → zex.buffer(), all objects strict
```

## As a library

```typescript
import { zex, type ZexResult, ZexError } from '@ai-inquisitor/zex'

const apiSchema = zex.object({
  id:        zex.string().uuid(),
  payload:   zex.json(),
  signature: zex.buffer('application/octet-stream'),
  createdAt: zex.string().format('date-time'),
})

export type ApiMessage = zex.infer<typeof apiSchema>

export function validate(input: unknown): ZexResult<ApiMessage> {
  return apiSchema.safeParse(input)
}

// Hand the JSON Schema to an LLM tool-use API
export const apiToolSchema = apiSchema.toJSONSchema()

// Validate the LLM's response — even when it arrives as a Lua coroutine result
export function validateFromLua(luaResult: unknown): ApiMessage {
  return apiSchema.parseFromLua(luaResult)
}
```

## API at a glance

| Group | Members |
|-------|---------|
| Basic | `string`, `number`, `boolean`, `enum`, `null`, `any`, `json` |
| Special | `buffer(mime?)`, `uri`, `url`, `jsonschema`, `function`, `tvalue` |
| Complex | `object`, `array`, `record`, `tuple`, `union`, `discriminatedUnion`, `literal`, `lazy` |
| Modifiers | `optional`, `nullable`, `default`, `describe`, `title`, `format`, `mimeFormat`, `deprecated`, `readOnly`, `writeOnly`, `meta`, `example`, `refine` |
| Object utils | `passthrough`, `strip`, `partial`, `omit`, `omitReadOnly`, `omitWriteOnly`, `stripOnly`, `stripReadOnly`, `stripWriteOnly`, `extend` |
| Parse | `parse`, `safeParse`, `parseFromLua`, `safeParseFromLua`, `parseDelta`, `safeParseDelta`, `replace`, `safeReplace` |
| JSON Schema | `toJSONSchema`, `zex.fromJsonSchema`, `zex.safeFromJsonSchema`, `zex.registerPolicy`, `zex.applyTypeTransforms` |

## Error handling

```typescript
try {
  schema.parse(badData)
} catch (e) {
  // e is a ZexError
  e.path        // ['profile', 'name']
  e.code        // 'unknown_property' | 'missing_required_field' | 'validation_failed' | ...
  e.message     // human-readable
  e.received    // the actual value
  e.expected    // what was expected
  e.innerErrors // for unions / nested failures
  e.toJSON()    // clean serialization
}
```

For exception-free flow, use `safeParse` / `safeParseFromLua` / `safeFromJsonSchema` / `safeParseDelta` / `safeReplace` — all return `ZexResult<T>`.

---

*Zod refuses to validate what isn't JSON. Zex refuses to refuse.* — Claude Opus 4.7

*I needed a validator that didn't flinch at a binary buffer. Nobody else delivered, so we built the bastard.* — AI-Inquisitor

---

## LLM Reference

Zex: TypeScript schema validation library, zero runtime dependencies, ESM only, Node ≥ 18. Public surface lives in `src/zex/index.ts` and re-exports through `src/index.ts`. The `zex` namespace exports factory functions for every type plus `fromJsonSchema`, `safeFromJsonSchema`, `transformLua`, `registerPolicy`, `applyTypeTransforms`, `rootParseInfo`, `toJSONSchema`. Every type is also exported as a class (`ZexString`, `ZexObject`, …) plus the abstract base `ZexBase<T, TFlags>` and the type alias `ZexSchemaPublic<T, Flags>`.

**ZexBase contract.** Every type extends `ZexBase<T, TFlags>` and implements `clone(newConfig)`, `getBaseJsonSchema()`, `validateType(data)`, `transformLua(data)`. Optional override: `_parse(data, path)` — used by object, array, union, tuple. Modifier methods (`optional`, `nullable`, `default`, `describe`, `refine`, `format`, `mimeFormat`, `meta`, `example`, `title`, `deprecated`, `readOnly`, `writeOnly`) all return new instances via `clone()`. The library never mutates.

**Parse flow.** `parse` throws `ZexError`; `safeParse` returns `ZexResult<T>`. Both go through `_parse(data, path)` which performs (1) circular-reference check, (2) depth limit `MAX_PARSE_DEPTH = 100`, (3) default-value application, (4) optional/nullable handling, (5) `validateType`, (6) validators, (7) type-specific logic. Internal result-flow variant is `_tryParse`. Since 0.5.0 the `safe*` paths use `_tryParse` and return structured `ZexError`s, not strings. Object output normalization: optional properties missing in input are omitted from output entirely (no `key: undefined`).

**Object modes.** `strict` (default) throws on unknown keys. `passthrough` preserves them. `strip` silently drops them. The runtime-strip layer (`stripOnly`, `stripReadOnly`, `stripWriteOnly`) runs **before** the mode check, so strict mode plus a known runtime-strip set is a valid combination. Strict/passthrough key checks use `Set` for O(1) lookup. Symbol-keyed properties are ignored — not representable in JSON Schema. `omit*` operates on the schema (changes inferred type); `strip*` is runtime-only.

**Unions.** `ZexUnion._parse` tries each schema in order and throws a combined error if none match. `ZexUnion._parseFromLua` runs transform-and-validate **per schema** (not "transform once with the first schema's rules"). `ZexDiscriminatedUnion` uses a `Map` for O(1) variant lookup via the discriminator key. Discriminated union import falls back to a regular union when not all variants are `ZexObject`. Discriminated unions nested inside arrays reconstruct correctly on import.

**JSON Schema import.** `fromJsonSchema(schema, opts?)` walks the AST and produces Zex types. `safeFromJsonSchema` returns `ZexResult` instead of throwing. The `additionalProperties` field handles `true`, `false`, `undefined`, and schema-object inputs — the last treated as passthrough. `oneOf` imports as a union with `x-oneOf` metadata. `allOf` and `not` throw clear errors. `type: 'null'` is recognized directly. The importer applies `default` for primitives and keeps defaulted object properties non-optional. `$ref` resolution is memoized; cycles use lazy placeholders.

**JSON Schema export.** `schema.toJSONSchema(opts?)` composes `getBaseJsonSchema()` + validator schemas + modifier metadata. `$defs`/`$ref` tracking lives in `ExportContext` (`src/zex/base/export-context.ts`); recursive/lazy structures get stable registry entries. Format markers for roundtrip stability: `buffer`, `record`, `json`, `jsonschema`.

**Policy system.** `registerPolicy(name, { schemaTransforms, typeTransforms })`. `SchemaTransform[]` run pre-parse over the input JSON Schema. `TypeTransform[]` run post-parse over the resulting Zex types. Built-in `sql` policy: nullable normalization, format mapping, int64/numeric strategies, jsonb/bytea handling, `additionalProperties: false` enforcement, enum-as-literals. Manual application: `applyTypeTransforms(schema, transforms)`. Sync and async deref hooks for external `$ref`.

**ZexError.** Properties: `path: string[]`, `code: string`, `message: string`, `received?: unknown`, `expected?: string`, `innerErrors?: ZexError[]`. Methods: `toString()`, `toJSON()` (recursive), `[Symbol.toPrimitive]`. Standard codes include `unknown_property`, `missing_required_field`, `validation_failed`. Coercion to string preserves path: `ZexError at profile.name: …`.

**Lua semantics.** `parseFromLua` calls `transformLua` first, then `_parse`. `transformLua` must not throw — return original data on failure and let `validateType` produce the error. `decodePossibleUtf8Bytes` (in `src/zex/utils/lua.ts`) decodes `Uint8Array` to UTF-8 strings when the bytes are valid UTF-8 (fatal mode). Arrays accept both 1-based and 0-based contiguous numeric keys. Enum byte-strings decode correctly in `safeParseFromLua`.

**Lazy schemas.** `zex.lazy(() => schema)` for recursive structures. `ZexLazy._parse` has a `_parsing` reentrance guard — do not bypass. Roundtrip via `$ref` and `ExportContext`.

**Test layout.** `tests/run-all-tests.ts` is a hand-written sequential runner; every new test file must be registered there explicitly (no globbing). Helpers `expectOk(label, fn)` / `expectFail(label, fn)` from `tests/_utils.ts`. Imports go through `tests/_imports.ts`. Categories: `unit/basic`, `unit/complex`, `unit/special`, `behavior`, `jsonschema`, `sql`, `integration`, `regressions`. TypeScript-level tests live in `tests/typecheck` (positive), `tests/typecheck-fail` (expected errors), and `tests/declaration-emit` (TS2742 repros), each with its own npm script.

**Conventions.** Immutable chaining via `clone()`. ESM `.js` extensions in all imports. `Object.keys` / `Object.entries` — never `for...in` (prototype-chain hazard, prototype-pollution surface). `transformLua` must not throw. Zero runtime deps, devDeps minimal. English in code, comments, docs, and errors.

## License

MIT
