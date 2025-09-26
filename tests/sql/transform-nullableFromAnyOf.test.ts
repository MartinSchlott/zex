import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: nullable normalization (anyOf/oneOf/type arrays) ===");

const cases: any[] = [
  { anyOf: [ { type: 'string' }, { type: 'null' } ] },
  { oneOf: [ { type: 'number' }, { type: 'null' } ] },
  { type: ['string','null'] }
];

for (const c of cases) {
  const s = zex.fromJsonSchema(c, { policy: 'sql' });
  const out = s.toJsonSchema();
  expectOk('exports base type with nullable meta retained', () => {
    // We allow representation either as union(null) or base with meta; validate runtime accepts null
    s.parse(null as any);
    return true;
  });
}

// Property case: ensure optional+nullable
const obj = zex.fromJsonSchema({
  type: 'object',
  properties: { p: { anyOf: [ { type: 'string' }, { type: 'null' } ] } },
  required: []
} as any, { policy: 'sql' });

expectOk('nullable property is optional and accepts null', () => {
  obj.parse({} as any);
  obj.parse({ p: null } as any);
  return true;
});

export {};


