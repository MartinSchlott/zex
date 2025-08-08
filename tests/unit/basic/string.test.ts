import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: string ===");

const s = zex.string();

expectOk('parse valid string', () => s.parse('hello'));
expectFail('reject non-string', () => s.parse(123 as any));

expectOk('email validator', () => zex.string().email().parse('a@b.com'));
expectFail('email validator fails', () => zex.string().email().parse('nope'));

expectOk('uuid validator', () => zex.string().uuid().parse('550e8400-e29b-41d4-a716-446655440000'));
expectFail('uuid validator fails', () => zex.string().uuid().parse('123'));

expectOk('min/max length', () => zex.string().min(2).max(5).parse('hey'));
expectFail('min length fails', () => zex.string().min(3).parse('hi'));
expectFail('max length fails', () => zex.string().max(2).parse('long'));

// chaining after optional(): should still allow .min()
expectOk('optional chaining keeps methods', () => zex.string().optional().min(1).parse('x'));

