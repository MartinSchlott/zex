import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: addlPropsFalse transforms all objects to strict ===");

const input = {
  type: 'object',
  properties: {
    a: { type: 'object', properties: { x: { type: 'number' } } },
    b: { type: 'array', items: { type: 'object', properties: { y: { type: 'string' } } } }
  }
} as any;

const schema = zex.fromJsonSchema(input, { policy: 'sql' });
const js = schema.toJsonSchema();

expectOk('root additionalProperties=false', () => js.additionalProperties === false);
expectOk('nested object additionalProperties=false', () => (js.properties as any).a.additionalProperties === false);
expectOk('array item object additionalProperties=false', () => ((js.properties as any).b.items as any).additionalProperties === false);

export {};


