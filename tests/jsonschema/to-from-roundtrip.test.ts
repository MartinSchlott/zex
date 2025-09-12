import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== JSONSCHEMA: to/from/roundtrip ===");

const Schema = zex.object({
  name: zex.string().describe('Name'),
  tags: zex.array(zex.string()).optional(),
  website: zex.url().optional(),
});

const jsonSchema = Schema.toJsonSchema({ $schema: 'https://json-schema.org/draft/2020-12/schema' });
expectOk('toJsonSchema produces object', () => jsonSchema);

const recreated = zex.fromJsonSchema(jsonSchema);
expectOk('fromJsonSchema parse matches', () => recreated.parse({ name: 'A' }));

const roundtrip = zex.fromJsonSchema(Schema.toJsonSchema());
expectOk('roundtrip works with defaults', () => roundtrip.parse({ name: 'B' }));

// Discriminated Union roundtrip
const DU = zex.discriminatedUnion('kind',
  zex.object({ kind: zex.literal('a'), a: zex.number() }),
  zex.object({ kind: zex.literal('b'), b: zex.string() })
);
const duSchema = DU.toJsonSchema();
const duRecreated = zex.fromJsonSchema(duSchema);
expectOk('roundtrip discriminated union a', () => duRecreated.parse({ kind: 'a', a: 1 }));
expectOk('roundtrip discriminated union b', () => duRecreated.parse({ kind: 'b', b: 'x' }));

// ---- New: JSON roundtrip tests for zex.json() ----
console.log("\n=== JSONSCHEMA: json roundtrip (zex.json <-> JSON Schema) ===");

// 1) Export/import roundtrip for standalone zex.json()
expectOk('zex.json() export contains format:json and meta preserved', () => {
  const s = zex.json().describe('Any JSON');
  const js = s.toJsonSchema();
  if (!js || (js as any).format !== 'json') throw new Error('format json missing');
  if ((js as any).description !== 'Any JSON') throw new Error('description missing');
});

expectOk('zex.fromJsonSchema({format:"json"}) returns ZexJson and re-exports format', () => {
  const s = zex.json().describe('Any JSON');
  const js = s.toJsonSchema();
  const s2 = zex.fromJsonSchema(js);
  if ((s2 as any).constructor.name !== 'ZexJson') throw new Error('Not ZexJson');
  const js2 = (s2 as any).toJsonSchema();
  if ((js2 as any).format !== 'json') throw new Error('format json missing after re-export');
  if ((js2 as any).description !== 'Any JSON') throw new Error('description lost after re-export');
});

// 2) Nested usage inside objects
expectOk('object with payload: zex.json() exports and re-imports with format json', () => {
  const s = zex.object({ id: zex.string(), payload: zex.json().describe('payload json') }).passthrough();
  const js = s.toJsonSchema();
  const payload = (js as any).properties?.payload;
  if (!payload || payload.format !== 'json') throw new Error('payload.format json missing');
  if (payload.description !== 'payload json') throw new Error('payload description missing');

  const s2 = zex.fromJsonSchema(js);
  const js2 = (s2 as any).toJsonSchema();
  const payload2 = (js2 as any).properties?.payload;
  if (!payload2 || payload2.format !== 'json') throw new Error('payload2.format json missing');
  if (payload2.description !== 'payload json') throw new Error('payload2 description missing');
});

// 3) Import tolerance for type:object + format:json
expectOk('fromJsonSchema({type:"object", format:"json"}) -> ZexJson', () => {
  const s = zex.fromJsonSchema({ type: 'object', format: 'json', description: 'X' });
  if ((s as any).constructor.name !== 'ZexJson') throw new Error('Not ZexJson');
  const js = (s as any).toJsonSchema();
  if ((js as any).format !== 'json') throw new Error('format lost');
  if ((js as any).description !== 'X') throw new Error('description lost');
});

// 4) Ensure {} remains any, not json
expectOk('fromJsonSchema({}) remains any (not ZexJson)', () => {
  const s = zex.fromJsonSchema({});
  if ((s as any).constructor.name === 'ZexJson') throw new Error('Unexpected ZexJson for {}');
});

