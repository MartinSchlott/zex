import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: union ===");

const U = zex.union(zex.string(), zex.number());
expectOk('accepts string', () => U.parse('x'));
expectOk('accepts number', () => U.parse(1));
expectFail('rejects boolean', () => U.parse(true as any));

