import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== SQL POLICY: no policy leaves defaults unchanged ===");

// Without policy, importer should behave as documented today
const input = {
  type: 'object',
  properties: { a: { type: 'number' } }
} as any;

const S = zex.fromJsonSchema(input);
const js = S.toJsonSchema();

expectOk('without policy, additionalProperties defaults to false (strict)', () => js.additionalProperties === false);

// Missing array items should throw today
expectFail('without policy, array without items errors at import', () => {
  zex.fromJsonSchema({ type: 'array' } as any);
});

export {};


