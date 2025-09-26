import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: deref hook (async) ===");

const root = {
  $id: 'root.json',
  type: 'object',
  properties: {
    a: { $ref: '#/$defs/A' },
    b: { $ref: 'ext://other#/B' }
  },
  $defs: {
    A: { type: 'string' }
  }
} as any;

// Mock resolver: resolves an external ref
async function resolver(ref: string, ctx: { root: unknown; baseUri?: string }): Promise<unknown> {
  if (ref.startsWith('#/')) return undefined; // let built-in handle locals
  if (ref === 'ext://other#/B') {
    return { type: 'number' };
  }
  throw new Error('unknown ref in test');
}

const S = zex.fromJsonSchema(root, { policy: 'sql', deref: resolver });
const js = S.toJsonSchema();

expectOk('local ref resolved to string', () => (js.properties as any).a.type === 'string');
expectOk('external ref resolved to number', () => (js.properties as any).b.type === 'number');

export {};


