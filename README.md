# Zex - The Other Zod

*Zex - The Other Zod: it is like the guy who actually build the house, not dream of the perfect one.*

## Why Zex Exists

After losing two days fighting with Zod 4 migration issues, I decided to build my own validation library. Here's what drove me crazy about Zod:

### The Problems with Zod

- **Zod is made by purists**: It's a great library, but it's not for everyone. It's not for me, I am more practical.
- **Zod 4 breaking changes**: The interface changed, making migration not really easy
- **Missing essential types**: No binary/buffer type support out of the box. But yeah, because we need to use JSON.stringify() and JSON.parse()
- **Lua support**: Working with Lua data required workarounds (I know will not hit many)
- **JSON Schema mess**: Need additional libraries for basic JSON Schema conversion - seriously?
- **Not strict by default**: Objects allow unknown properties by default, making typos invisible until production. Sorry, happens to me more often than I'd like.
- **Security implications**: Non-strict validation can lead to unexpected data passing through. Because I forget to add strict mode to every object, what a boilerplate.
- **Terrible error messages**: Complex, nested, hard-to-understand error reporting. Without AI I wouldn't have understand a single word.
- **Poor extensibility**: Zod 4 is practically impossible to extend cleanly. Zex is a little bit better.
- **Wrapper hell**: Everything wrapped in classes with confusing APIs. Yeah, it's my opinion.

### The Zex Solution

Built in **one day** using Claude, ChatGPT, Gemini, and Cursor, Zex addresses these pain points:

- ✅ **Strict by default**: Objects reject unknown properties unless explicitly allowed. 
- ✅ **Binary data support**: First-class `buffer()` type with MIME type support
- ✅ **Lua transformation**: Built-in support for Lua data structures
- ✅ **JSON Schema**: Native bidirectional JSON Schema conversion
- ✅ **Clear error messages**: Structured errors with path tracking
- ✅ **Immutable API**: No wrapper classes, clean fluent interface
- ✅ **TypeScript-first**: Excellent type inference and IDE support
- ✅ **Extensible**: Easy to add custom validators and types
- ✅ **Discriminated Unions**: First-class `discriminatedUnion()` with clean types and JSON Schema export
- ✅ **UI Hints**: String `.multiline()` → JSON Schema `x-ui-multiline`
- ✅ **Read/Write Annotations**: `.readOnly()` / `.writeOnly()` on all types (documentation-only)

## Quick Start

```typescript
import { zex } from '@ai-inquisitor/zex';

// Basic types
const userSchema = zex.object({
  name: zex.string().min(2),
  age: zex.number().int().min(0),
  email: zex.string().email(),
  avatar: zex.buffer('image/jpeg').optional()
});

type User = zex.infer<typeof userSchema>;

// Parse data
const result = userSchema.parse({
  name: "John Doe",
  age: 30,
  email: "john@example.com"
});
```

## Key Features

### Strict by Default
```typescript
const schema = zex.object({
  name: zex.string()
});

// This throws an error - unknown property 'typo'
schema.parse({ name: "John", typo: "oops" }); // ❌ ZexError

// Explicitly allow additional properties
const flexible = schema.passthrough();
flexible.parse({ name: "John", extra: "allowed" }); // ✅
```

### Binary Data Support
```typescript
const imageSchema = zex.buffer('image/png');
const fileSchema = zex.object({
  filename: zex.string(),
  content: zex.buffer('application/pdf'),
  thumbnail: zex.buffer('image/jpeg').optional()
});
```

### Lua Data Transformation
```typescript
// Lua arrays are 1-indexed objects
const luaArray = { "1": "first", "2": "second", "3": "third" };
const schema = zex.array(zex.string());

const result = schema.parseFromLua(luaArray);
// Result: ["first", "second", "third"]
```

### JSON Schema Integration
```typescript
const schema = zex.object({
  name: zex.string().describe("User's full name"),
  age: zex.number().int().min(0).max(120)
});

// Generate JSON Schema (optional $schema)
const jsonSchema = schema.toJSONSchema({
  $schema: "https://json-schema.org/draft/2020-12/schema"
});

// Parse from JSON Schema
const recreated = zex.fromJsonSchema(jsonSchema);
```

- Import mapping for number bounds:
  - `exclusiveMinimum === 0` → `.positive()`
  - `minimum === 0` → `.nonnegative()`
  - `exclusiveMaximum === 0` → `.negative()`
  - `maximum === 0` → `.nonpositive()`
- Export includes all constraints without deduplication; when multiple bounds exist, the tighter bound prevails at runtime.

#### UI Hints and Annotations
- String UI hint `.multiline(n?)` exports to `x-ui-multiline` in JSON Schema; omitted when 0. `getMultiline()` returns the number (default 0).
- Access annotations `.readOnly()` / `.writeOnly()` export JSON Schema `readOnly: true` / `writeOnly: true`. Passing `false` removes the key. Imported `false` values are normalized (dropped). These flags are documentation-only and do not affect parsing/validation.

### Clear Error Messages
```typescript
try {
  userSchema.parse({ name: "Jo", age: -5, email: "invalid" });
} catch (error) {
  console.log(error.path);     // ["name"]
  console.log(error.code);     // "validation_failed"
  console.log(error.message);  // "String must be at least 2 characters"
  console.log(error.received); // "Jo"
}
```

### Rich Type System
```typescript
// All the types you need
const schema = zex.object({
  // Basic types
  id: zex.string().uuid(),
  name: zex.string().min(1).max(100),
  age: zex.number().int().min(0),
  active: zex.boolean(),
  
  // Complex types
  tags: zex.array(zex.string()),
  metadata: zex.record(zex.any()),
  coordinates: zex.tuple([zex.number(), zex.number()]),
  
  // Special types
  website: zex.url(),
  avatar: zex.buffer('image/jpeg').optional(),
  
  // Unions and literals (Zex uses varargs)
  role: zex.union(
    zex.literal('admin'),
    zex.literal('user'),
    zex.literal('guest')
  ),
  // Discriminated unions
  pet: zex.discriminatedUnion('type',
    zex.object({ type: zex.literal('dog'), barks: zex.boolean() }),
    zex.object({ type: zex.literal('cat'), meows: zex.boolean() })
  ),
  
  // Enums
  status: zex.enum(['active', 'inactive', 'pending'])
});
```

## API Overview

### Basic Types
- `zex.string()` - String validation with `.email()`, `.uuid()`, `.min()`, `.max()`, `.pattern()`, UI hint `.multiline(n?)` and `.getMultiline()`
- `zex.number()` - Number validation (finite-only) with `.int()`, `.min()`, `.max()`, `.positive()`, `.nonnegative()`, `.negative()`, `.nonpositive()`
- `zex.boolean()` - Boolean validation
- `zex.buffer(mimeType?)` - Binary data validation
- `zex.any()` - Any value (use sparingly)
- `zex.null()` - Null values only

### Complex Types
- `zex.array(schema)` - Array of items
- `zex.object(shape)` - Object validation (strict by default)
- `zex.record(valueSchema)` - Key-value records
- `zex.tuple([...schemas])` - Fixed-length arrays
- `zex.union(...schemas)` - One of multiple types (varargs)
- `zex.literal(value)` - Exact value matching
- `zex.enum([...values])` - Enumeration

### Special Types
- `zex.uri()` - URI validation
- `zex.url()` - HTTP/HTTPS URL validation

### Modifiers
- `.optional()` - Make field optional
- `.nullable()` - Allow null values
- `.default(value)` - Set default value
- `.describe(text)` - Add description for JSON Schema
- `.mimeFormat(mime)` - Set `contentMediaType` on JSON Schema
- `.title(text)` - Set JSON Schema `title`
- `.format(fmt)` - Set JSON Schema `format`
- `.deprecated(flag = true)` - Set JSON Schema `deprecated`
- `.meta(obj)` - Merge arbitrary metadata into JSON Schema
- `.readOnly(flag = true)` / `.writeOnly(flag = true)` - Set JSON Schema annotations (documentation-only)
- `.positive()` - Number must be greater than 0 (JSON Schema: `exclusiveMinimum: 0`)
- `.nonnegative()` - Number must be at least 0 (JSON Schema: `minimum: 0`)
- `.negative()` - Number must be less than 0 (JSON Schema: `exclusiveMaximum: 0`)
- `.nonpositive()` - Number must be at most 0 (JSON Schema: `maximum: 0`)

Note: `zex.number()` is finite-only; it rejects `NaN`, `Infinity`, and `-Infinity`.

### Object Modes
- `.strict()` - Reject unknown properties (default)
- `.passthrough()` - Allow unknown properties
- `.strip()` - Remove unknown properties

## Not a Drop-in Replacement

Zex is **not** a drop-in replacement for Zod. The API is similar but intentionally different where Zod's design was problematic. Migration requires some code changes (e.g., `union(...schemas)` statt `union([schemas])`, strict by default), but the improved type safety and clearer errors make it worth it.

## Version

Current: `0.1.22`.

## Built with AI in One Day

This entire library was built in a single day using:
- **Claude** for architecture and complex logic
- **ChatGPT** for API design feedback  
- **Gemini** for edge case handling
- **Cursor** for rapid development and refactoring

It proves that AI-assisted development can create production-ready code incredibly fast when you know what problems you're solving.

## Project Philosophy

- **Personal project**: Built for my own needs, maintained as I need features
- **Open but focused**: Everyone can use and fork it, but I won't add features I don't need
- **Quality over quantity**: Better to have fewer, well-tested features than a bloated API
- **No wrapper hell**: Clean, direct API without unnecessary abstraction layers

## What's Missing

Currently missing some Zod features I didn't need:
- **Refinements**: Custom validation functions (validators system covers this differently)
- **Transforms**: Data transformation during parsing
- **Preprocessing**: Input sanitization before validation

If you need these features, feel free to fork and extend and drop me a line! I may ask my AI to integrate them.

## Contributing

This is a personal project that I maintain for my own use cases. However:

- **Bug reports welcome**: If something doesn't work as documented
- **Forks encouraged**: Take it and make it your own
- **Feature requests**: Probably won't happen unless I need them too
- **Pull requests**: Maybe, if they align with my use cases

## License

MIT - use it however you want. No warranty, no promises, but it works great for what I built it for.

---

*"Sometimes the best solution is to just build it yourself in a day rather than fight with existing tools for weeks."* - Cursor (auto)