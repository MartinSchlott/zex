import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== JSONSCHEMA: any accepts {} and true (flat, nested, practical) ===");

// --- Flat cases ---
expectOk('toJSONSchema(any) produces empty object {}', () => {
  const s = zex.any();
  const js = zex.toJSONSchema(s);
  if (typeof js !== 'object' || js === null) throw new Error('expected object schema');
  if (Object.keys(js).length !== 0) throw new Error('expected empty schema {} for any');
  return true;
});

expectOk('fromJsonSchema({}) returns any (roundtrips to {})', () => {
  const s = zex.fromJsonSchema({} as any);
  const js = zex.toJSONSchema(s);
  if (typeof js !== 'object' || js === null) throw new Error('expected object schema');
  if (Object.keys(js).length !== 0) throw new Error('expected empty schema {} after roundtrip');
  return true;
});

expectOk('fromJsonSchema(true) returns any (roundtrips to {})', () => {
  const s = zex.fromJsonSchema(true as any);
  const js = zex.toJSONSchema(s);
  if (typeof js !== 'object' || js === null) throw new Error('expected object schema');
  if (Object.keys(js).length !== 0) throw new Error('expected empty schema {} after mapping from true');
  return true;
});

expectOk('any meta roundtrip keeps description/title through {} export', () => {
  const s = zex.any().describe('Desc').title('Title');
  const js = zex.toJSONSchema(s) as any;
  if (js.description !== 'Desc') throw new Error('missing description on export');
  if (js.title !== 'Title') throw new Error('missing title on export');
  const s2 = zex.fromJsonSchema(js);
  const js2 = zex.toJSONSchema(s2) as any;
  if (js2.description !== 'Desc') throw new Error('missing description after import');
  if (js2.title !== 'Title') throw new Error('missing title after import');
  return true;
});

// --- Nested: properties ---
expectOk('object property: any exports as {} and imports from {}', () => {
  const S = zex.object({ a: zex.any() });
  const js = zex.toJSONSchema(S) as any;
  if (js.type !== 'object') throw new Error('root should be object');
  if (!js.properties || typeof js.properties.a !== 'object') throw new Error('missing properties.a');
  if (Object.keys(js.properties.a).length !== 0) throw new Error('properties.a should be {}');
  const S2 = zex.fromJsonSchema(js);
  const js2 = zex.toJSONSchema(S2) as any;
  if (Object.keys(js2.properties.a).length !== 0) throw new Error('properties.a should remain {} after import');
  return true;
});

expectOk('object property: imports boolean true as any', () => {
  const js = { type: 'object', properties: { a: true } } as any;
  const S = zex.fromJsonSchema(js);
  const out = zex.toJSONSchema(S) as any;
  if (!out.properties || typeof out.properties.a !== 'object') throw new Error('missing properties.a after import');
  if (Object.keys(out.properties.a).length !== 0) throw new Error('properties.a should be {} when imported from true');
  return true;
});

// --- Nested: array items ---
expectOk('array items: any exports as {} and imports from {}', () => {
  const S = zex.array(zex.any());
  const js = zex.toJSONSchema(S) as any;
  if (js.type !== 'array') throw new Error('root should be array');
  if (!js.items || typeof js.items !== 'object') throw new Error('missing items');
  if (Object.keys(js.items).length !== 0) throw new Error('items should be {}');
  const S2 = zex.fromJsonSchema(js);
  const js2 = zex.toJSONSchema(S2) as any;
  if (Object.keys(js2.items).length !== 0) throw new Error('items should remain {} after import');
  return true;
});

expectOk('array items: imports boolean true as any', () => {
  const js = { type: 'array', items: true } as any;
  const S = zex.fromJsonSchema(js);
  const out = zex.toJSONSchema(S) as any;
  if (!out.items || typeof out.items !== 'object') throw new Error('missing items after import');
  if (Object.keys(out.items).length !== 0) throw new Error('items should be {} when imported from true');
  return true;
});

// --- Nested: additionalProperties ---
expectOk('additionalProperties: {} and true import as any', () => {
  const js1 = { type: 'object', additionalProperties: {} } as any;
  const S1 = zex.fromJsonSchema(js1);
  const out1 = zex.toJSONSchema(S1) as any;
  if (out1.type !== 'object') throw new Error('expected object');
  if (!('additionalProperties' in out1)) throw new Error('expected additionalProperties');

  const js2 = { type: 'object', additionalProperties: true } as any;
  const S2 = zex.fromJsonSchema(js2);
  const out2 = zex.toJSONSchema(S2) as any;
  if (out2.type !== 'object') throw new Error('expected object');
  if (!('additionalProperties' in out2)) throw new Error('expected additionalProperties');
  return true;
});

// --- Practical: build schema and parse ---
expectOk('safeFromJsonSchema(true) produces schema that parses arbitrary data', () => {
  const res = zex.safeFromJsonSchema(true as any);
  if (!res.success) throw new Error(`expected success, got ${JSON.stringify(res)}`);
  const schema = res.schema;
  // parse various shapes
  schema.parse(123 as any);
  schema.parse('str' as any);
  schema.parse({ a: 1, b: [2, 3] } as any);
  return true;
});

expectOk('fromJsonSchema({}) returns schema that parses arbitrary data', () => {
  const schema = zex.fromJsonSchema({} as any);
  schema.parse('x' as any);
  schema.parse({ nested: ['y'] } as any);
  return true;
});

export {};


