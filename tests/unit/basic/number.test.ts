import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: number ===");

expectOk('parse valid number', () => zex.number().parse(42));
expectFail('reject non-number', () => zex.number().parse('x' as any));

expectOk('int validator', () => zex.number().int().parse(10));
expectFail('int validator fails', () => zex.number().int().parse(3.14));

expectOk('min/max', () => zex.number().min(0).max(10).parse(5));
expectFail('min fails', () => zex.number().min(0).parse(-1));
expectFail('max fails', () => zex.number().max(0).parse(1));

// chaining after nullable(): should still allow .min()
expectOk('nullable chaining keeps methods', () => zex.number().nullable().min(-1).parse(0));

