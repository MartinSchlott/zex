import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: record ===");

const R = zex.record(zex.number());
expectOk('parse record of numbers', () => R.parse({ a: 1, b: 2 }));
expectFail('reject wrong value type', () => R.parse({ a: 'x' } as any));

