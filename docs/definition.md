# Zex — Definition

## Vision

Zex is a TypeScript schema validation library for real-world data — including
data that isn't pure JSON. Strict by default, zero dependencies, bidirectional
JSON Schema roundtrip.

## Positioning — the bastard

Zod takes JSON seriously and nothing beyond it. Functions, buffers,
coroutines, binary payloads, Lua tables — "not our world." Zex steps back:
schema validation is useful even when the data being validated isn't
JSON-clean. A `zex.buffer()` is a first-class citizen, not an afterthought.
JSON Schema roundtrip still works — through format markers
(`format: "buffer"`, `format: "record"`, `format: "json"`,
`format: "jsonschema"`) that pure-JSON tools can ignore.

If you validate pure JSON, take Zod. If you push Lua tables, PostgreSQL
JSONBs, binary uploads, or Fengari coroutines through the same validator
framework, take Zex.

## Scope

**In scope**

- TypeScript library, ESM only, Node ≥ 18
- Zero runtime dependencies
- Strict-by-default object validation
- JSON Schema roundtrip (Draft 2020-12, with `$defs`/`$ref` and lazy placeholders for cycles)
- Buffer type with MIME roundtrip
- Lua/Fengari data normalization (1-based arrays, byte-encoded strings, userdata, coroutines)
- Delta and Replace APIs (JSON Pointer based)
- Policy pipeline for schema import (`sql`, OpenAPI, custom)
- `ZexResult<T>` model for `safe*` APIs (exception-free)
- Declaration-emit compatibility (TS2742-resistant via `ZexSchemaPublic<T>`)
- File-system schemas (paths, file existence, etc.) — open if real demand emerges, no taboo

**Out of scope**

- Error message i18n — Speak English or die. Errors are primarily machine-readable (`error.code`, `error.path`).
- CLI tools — build your own; Zex stays a pure library.
- Async validators
- Browser-specific features

## Features (inventory)

Outward-visible functionality. Details: README and source.

| Feature | Status |
|---------|--------|
| Basic types: `string`, `number`, `boolean`, `enum`, `null`, `any` | ✓ |
| Complex types: `object`, `array`, `record`, `tuple`, `union`, `discriminatedUnion`, `literal`, `lazy` | ✓ |
| Special types: `buffer` (with MIME), `uri`, `url`, `json`, `jsonschema` | ✓ |
| Lua/Fengari types: `function` (coroutines), `tvalue` (userdata) | ✓ |
| Modifiers: `optional`, `nullable`, `default`, `describe`, `refine`, `format`, `mimeFormat`, `deprecated`, `readOnly`, `writeOnly`, `meta`, `example`, `title` | ✓ |
| Object utilities: `passthrough`, `strip`, `partial`, `omit`, `omitReadOnly`/`WriteOnly`, `stripOnly`, `stripReadOnly`/`WriteOnly`, `extend` | ✓ |
| Parse APIs: `parse`, `safeParse`, `parseFromLua`, `safeParseFromLua` | ✓ |
| Delta/Replace APIs: `parseDelta`, `safeParseDelta`, `replace`, `safeReplace` | ✓ |
| JSON Schema: `toJSONSchema`, `fromJsonSchema`, `safeFromJsonSchema`, `registerPolicy`, `applyTypeTransforms` | ✓ |
| Built-in policies: `sql` (PostgreSQL-focused) | ✓ |
| Declaration-emit compatibility (`ZexSchemaPublic<T, Flags>`) | ✓ |

## Entities (library data model)

- `ZexBase<T, TFlags>` — root of every type, immutable chaining via `clone()`
- `ZexConfig` — modifier state (`optional`, `nullable`, `defaultValue`, `validators`, `meta`)
- `ZexResult<T>` — `{ success: true, data: T } | { success: false, error: ZexError }`
- `ZexError` — structured: `path`, `code`, `message`, `received`, `expected`, `innerErrors`; `toJSON()` for serialization
- `Validator` — plugin interface (`validate(value)`, `getJsonSchema()`)
- `Policy` — pre-parse `SchemaTransform[]` plus post-parse `TypeTransform[]`
- `JsonSchema` — internal JSON Schema type (Draft 2020-12 compatible)
- `PathEntry` — path frame for error tracking (root/object/array/union/tuple)

## Success criteria

1. **Non-JSON data types are first-class citizens.** Buffers with MIME,
   functions/coroutines (Fengari), arbitrarily nested userdata (`tvalue`)
   — all parseable, all roundtrip-capable through format markers. A value
   passing through a Zex schema must not first be made `JSON.stringify`-clean.
2. **Roundtrip stability.** `schema → toJSONSchema → fromJsonSchema` produces
   a semantically equivalent schema. `$defs`/`$ref` survive, cycles survive,
   format markers survive.
3. **Strict mode catches typos at runtime.** Unknown properties on objects
   throw; the default mode is strict.
4. **Zero deps in production.** `dependencies: {}`, devDeps minimal.
5. **AI-ready.** Schemas can be handed to LLMs and tool-use APIs as JSON
   Schema, and their output (including Lua data from Fengari coroutines)
   can be validated.
