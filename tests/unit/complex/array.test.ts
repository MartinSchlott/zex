import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: array ===");

const A = zex.array(zex.string());
expectOk('parse string array', () => A.parse(['a','b']));
expectFail('reject non-array', () => A.parse('x' as any));

expectOk('min/max items', () => zex.array(zex.number()).min(1).max(2).parse([1,2]));
expectFail('min items fails', () => zex.array(zex.number()).min(2).parse([1]));
expectFail('max items fails', () => zex.array(zex.number()).max(1).parse([1,2]));

