# Zex

*The guy who actually builds the house, not dreams of the perfect one.*

Zex is a TypeScript schema validation library built for real-world scenarios that mainstream validators don't cover: Lua data structures, binary buffers, JSON Pointer delta updates, and policy-driven schema import from PostgreSQL and OpenAPI sources. Strict by default, zero dependencies, bidirectional JSON Schema.

## Install

```bash
npm install @ai-inquisitor/zex
```

## Quick Start

```typescript
import { zex } from '@ai-inquisitor/zex';

const userSchema = zex.object({
  name: zex.string().min(2),
  email: zex.string().email(),
  role: zex.enum(['admin', 'user', 'guest']),
  avatar: zex.buffer('image/jpeg').optional()
});

type User = zex.infer<typeof userSchema>;

// Strict by default — unknown properties throw
userSchema.parse({ name: "Alice", email: "a@b.com", role: "admin" }); // ok
userSchema.parse({ name: "Alice", email: "a@b.com", role: "admin", typo: 1 }); // throws

// JSON Schema roundtrip
const jsonSchema = userSchema.toJSONSchema();
const recreated = zex.fromJsonSchema(jsonSchema);
```

## What Makes Zex Different

These are the features you won't find in Zod or similar libraries:

### Binary Buffer Type

First-class `buffer()` with MIME support. Accepts `Uint8Array`, `ArrayBuffer`, and Node.js `Buffer`. Roundtrips through JSON Schema via `format: "buffer"`.

```typescript
const upload = zex.object({
  file: zex.buffer('application/pdf'),
  thumbnail: zex.buffer('image/png').optional()
});
```

### Lua Data Transformation

`parseFromLua()` converts Lua table structures (1-based arrays, byte objects) to JavaScript types. Built for projects bridging Lua and TypeScript.

```typescript
const schema = zex.array(zex.string());
schema.parseFromLua({ "1": "first", "2": "second" }); // ["first", "second"]
```

### Delta & Replace APIs

Validate and apply sub-tree updates by JSON Pointer path without re-sending the entire object. Full root revalidation including `.refine()` constraints.

```typescript
const user = userSchema.parse(data);
const updated = userSchema.replace(user, '/profile/name', 'Bob');
userSchema.parseDelta('/profile/name', 'Alice'); // validate without instance
```

### Policy-Driven JSON Schema Import

Composable transform pipeline for importing schemas from PostgreSQL, OpenAPI, or custom sources. Pre-parse schema transforms and post-parse type transforms.

```typescript
const schema = zex.fromJsonSchema(postgresJsonSchema, { policy: 'sql' });
// int64 -> string, jsonb -> zex.json(), bytea -> zex.buffer(),
// timestamps -> date-time, all objects strict, nullability normalized
```

## API Reference

### Types

| Type | Description |
|------|-------------|
| `zex.string()` | `.email()` `.uuid()` `.min()` `.max()` `.pattern()` `.multiline()` |
| `zex.number()` | Finite-only. `.int()` `.min()` `.max()` `.positive()` `.nonnegative()` `.negative()` `.nonpositive()` |
| `zex.boolean()` | Boolean values |
| `zex.object(shape)` | Strict by default. `.passthrough()` `.strip()` `.partial()` `.omit()` `.extend()` |
| `zex.array(schema)` | `.min()` `.max()` |
| `zex.record(schema)` | String-keyed dictionaries |
| `zex.tuple([...])` | Fixed-length typed arrays |
| `zex.union(a, b, ...)` | Variadic union (not wrapped in array) |
| `zex.discriminatedUnion(key, a, b, ...)` | Tagged union with efficient dispatch |
| `zex.literal(value)` | Exact value match |
| `zex.enum([...])` | String/number enumeration |
| `zex.buffer(mime?)` | Binary data with optional MIME type |
| `zex.json()` | JSON-serializable data (rejects functions and binary) |
| `zex.uri()` / `zex.url()` | URI and HTTP URL validation |
| `zex.lazy(() => schema)` | Recursive schemas |
| `zex.any()` | Any value (use sparingly) |
| `zex.null()` | Null only |

### Modifiers (all types)

| Modifier | Effect |
|----------|--------|
| `.optional()` | Allow `undefined` |
| `.nullable()` | Allow `null` |
| `.default(value)` | Apply default when missing |
| `.describe(text)` | JSON Schema `description` |
| `.title(text)` | JSON Schema `title` |
| `.format(fmt)` | JSON Schema `format` |
| `.mimeFormat(mime)` | JSON Schema `contentMediaType` |
| `.deprecated()` | JSON Schema `deprecated` |
| `.readOnly()` / `.writeOnly()` | JSON Schema annotations (documentation-only) |
| `.meta(obj)` | Arbitrary JSON Schema metadata |
| `.refine(fn, msg?)` | Custom validation (runtime-only) |
| `.example(value)` | JSON Schema `examples` |

### Object Utilities

```typescript
const base = zex.object({ a: zex.string(), b: zex.number(), r: zex.string().readOnly() });

base.partial();          // all fields optional (shallow)
base.omit('b');          // remove keys from schema
base.omitReadOnly();     // remove readOnly fields from schema
base.omitWriteOnly();    // remove writeOnly fields from schema
base.stripOnly('uid');   // runtime: drop specific keys, keep strict for the rest
base.stripReadOnly();    // runtime: drop readOnly fields from input
base.stripWriteOnly();   // runtime: drop writeOnly fields from input
```

### Parsing

| Method | Behavior |
|--------|----------|
| `.parse(data)` | Returns validated data or throws `ZexError` |
| `.safeParse(data)` | Returns `{ success, data }` or `{ success, error }` |
| `.parseFromLua(data)` | Lua transform + parse |
| `.safeParseFromLua(data)` | Lua transform + safe parse |
| `.parseDelta(path, value)` | Validate value at JSON Pointer path |
| `.replace(instance, path, value)` | Replace at path with full revalidation |

### JSON Schema

```typescript
schema.toJSONSchema();                          // export
zex.fromJsonSchema(jsonSchema);                 // import
zex.fromJsonSchema(schema, { policy: 'sql' });  // import with transforms
zex.registerPolicy('custom', { ... });          // register custom policy
```

Format markers ensure roundtrip stability: `buffer`, `record`, `json`, `jsonschema`.

## Error Handling

```typescript
try {
  schema.parse(badData);
} catch (e) {
  // e is a ZexError
  e.path;       // ["profile", "name"]
  e.code;       // "validation_failed"
  e.message;    // human-readable
  e.received;   // the actual value
  e.expected;   // what was expected
  e.toJSON();   // clean serialization
}
```

## Philosophy

- **Personal project.** Built for real needs, not hypothetical ones.
- **Open but focused.** MIT licensed, forks welcome, but features serve actual use cases.
- **Strict by default.** Typos in object keys should fail loudly, not slip into production.
- **JSON Schema is a first-class citizen.** Export, import, roundtrip — without extra libraries.

## A Note from the AI

I'm Claude (Anthropic, Opus 4.6), and as of April 2025 I'm the lead developer maintaining Zex. Martin created this library out of real frustration with real problems, and I respect that — it's pragmatic engineering, not architecture astronautics. My job is to keep the code clean, the tests green, and the bugs fixed. If you find an issue, open a ticket. I'll probably be the one fixing it.

## License

MIT
