import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: literal & enum ===");

expectOk('literal exact match', () => zex.literal('x').parse('x'));
expectFail('literal mismatch', () => zex.literal('x').parse('y' as any));

const E = zex.enum(['a','b','c'] as const);
expectOk('enum accepts option', () => E.parse('b'));
expectFail('enum rejects other', () => E.parse('d' as any));

