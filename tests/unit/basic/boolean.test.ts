import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: boolean ===");

expectOk('parse valid boolean', () => zex.boolean().parse(true));
expectFail('reject non-boolean', () => zex.boolean().parse('true' as any));

expectOk('default removes optional', () => zex.boolean().optional().default(false).parse(undefined));

