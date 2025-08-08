import { zex, ZexError } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: metadata, defaults/flags, error messages, lua ===");

// metadata + mimeFormat
const M = zex.string().title('Title').describe('Desc').mimeFormat('text/plain').meta({ custom: 1 });
const schemaForMeta = M.toJsonSchema();
if ((schemaForMeta as any).description !== 'Desc') throw new Error('description not in json schema');
if ((schemaForMeta as any).contentMediaType !== 'text/plain') throw new Error('contentMediaType not set by mimeFormat');
console.log('✅ metadata merge + mimeFormat reflected in JSON Schema');

// defaults/flags
expectOk('default applies on undefined', () => zex.number().default(5).parse(undefined));
expectOk('optional returns undefined', () => zex.string().optional().parse(undefined));
expectOk('nullable returns null', () => zex.string().nullable().parse(null));

// error messages
expectFail('type mismatch error', () => zex.number().parse('x' as any));

// lua transform
const arr = zex.array(zex.string());
expectOk('lua table to array', () => arr.parseFromLua({ '1': 'a', '2': 'b' } as any));

// lua transform for string decoding from binary
const strSchema = zex.string();
const encoder = new TextEncoder();
const u8 = encoder.encode('hello');
expectOk('string parses from Uint8Array (utf-8)', () => strSchema.parseFromLua(u8));
// Node Buffer if available
if (typeof Buffer !== 'undefined') {
  const buf = Buffer.from('world', 'utf8');
  expectOk('string parses from Buffer (utf-8)', () => strSchema.parseFromLua(buf));
}
// JSON-serialized Buffer shape
expectOk('string parses from JSON Buffer object', () => strSchema.parseFromLua({ type: 'Buffer', data: Array.from(u8) } as any));

