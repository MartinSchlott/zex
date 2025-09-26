import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: array items fallback ===");

const S = zex.fromJsonSchema({ type: 'array' } as any, { policy: 'sql' });
const js = S.toJsonSchema();

expectOk('array with missing items defaults to items: {}', () => js.type === 'array' && js.items && Object.keys(js.items as any).length === 0);

export {};


