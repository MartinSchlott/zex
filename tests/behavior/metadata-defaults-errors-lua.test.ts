import { zex, ZexError } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: metadata, defaults/flags, error messages, lua ===");

// metadata + mimeFormat + readOnly/writeOnly
const M = zex.string().title('Title').describe('Desc').mimeFormat('text/plain').readOnly().meta({ custom: 1 });
const schemaForMeta = M.toJsonSchema();
if ((schemaForMeta as any).description !== 'Desc') throw new Error('description not in json schema');
if ((schemaForMeta as any).contentMediaType !== 'text/plain') throw new Error('contentMediaType not set by mimeFormat');
if ((schemaForMeta as any).readOnly !== true) throw new Error('readOnly not exported');
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

// invalid UTF-8 should fail when targeting string
const invalid = new Uint8Array([0xff, 0xfe, 0xfd]);
expectFail('string fails on invalid UTF-8', () => strSchema.parseFromLua(invalid));

// buffer passthrough
const bufSchema = zex.buffer('application/octet-stream');
expectOk('buffer accepts Uint8Array unchanged', () => bufSchema.parseFromLua(u8));
if (typeof ArrayBuffer !== 'undefined') {
  const ab = u8.buffer.slice(0);
  expectOk('buffer accepts ArrayBuffer', () => bufSchema.parseFromLua(ab as any));
}
if (typeof Buffer !== 'undefined') {
  const nodeBuf = Buffer.from([1,2,3]);
  expectOk('buffer accepts Node Buffer', () => bufSchema.parseFromLua(nodeBuf as any));
}
expectOk('buffer accepts JSON Buffer shape', () => bufSchema.parseFromLua({ type: 'Buffer', data: [1,2,3] } as any));

// any: bytes → string (fatal on invalid utf-8)
const anySchema = zex.any();
expectOk('any decodes Uint8Array to string', () => anySchema.parseFromLua(u8));
expectFail('any fails on invalid UTF-8', () => anySchema.parseFromLua(invalid));

// nested: configuration (any) + configSchema (jsonschema)
const NodeConfig = zex.object({
  configuration: zex.any().describe('The main configuration settings for this node.'),
  configSchema: zex.jsonschema().describe('JSON Schema for configuration settings')
}).passthrough();

const nestedLua = {
  configuration: {
    name: 'node',
    params: { '1': 'a', '2': 'b' }
  },
  configSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      params: { type: 'array', items: { type: 'string' } },
      mode: { enum: { '1': 'a', '2': 'b' } } // enum as lua-like array should normalize to ['a','b'] but here it's object; we don't auto-convert enums, so keep as-is
    },
    required: { '1': 'name' },
    anyOf: {
      '1': { properties: { name: { type: 'string' } } },
      '2': { properties: { params: { type: 'array' } } }
    }
  }
};

expectOk('object with any + jsonschema parses from lua (no crash)', () => NodeConfig.parseFromLua(nestedLua));

// tvalue: no transform pass-through in Lua
const TV = zex.tvalue();
const tvPayload = { a: { '1': 'x', '2': 'y' }, b: { '0': 111, '1': 98, '2': 106, '3': 101, '4': 99, '5': 116 } } as any;
expectOk('tvalue returns input as-is (no transform)', () => {
  const out = TV.parseFromLua(tvPayload);
  if (out !== tvPayload) throw new Error('tvalue should not transform');
  return true;
});

