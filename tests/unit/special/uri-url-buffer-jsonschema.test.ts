import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: special (uri/url/buffer/jsonschema-type) ===");

// URI
expectOk('valid uri', () => zex.uri().parse('mailto:user@example.com'));
expectFail('invalid uri', () => zex.uri().parse('not-a-uri' as any));

// URL
expectOk('valid http url', () => zex.url().parse('https://example.com'));
expectFail('invalid url scheme', () => zex.url().parse('ftp://example.com' as any));

// Buffer
const bufSchema = zex.buffer('image/png');
expectOk('buffer accepts Uint8Array', () => bufSchema.parse(new Uint8Array([1,2,3])));
expectFail('buffer rejects string', () => zex.buffer('image/png').parse('x' as any));
const bufJson = bufSchema.toJsonSchema();
if ((bufJson as any).contentMediaType !== 'image/png') throw new Error('buffer contentMediaType missing');

// JsonSchema type (structural only)
expectOk('jsonschema type is object', () => zex.jsonschema().parse({ type: 'string' } as any));

