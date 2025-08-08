import { zex } from '../_imports.js';
import { expectFail, expectOk } from '../_utils.js';

console.log("\n=== REGRESSION: additionalProperties / strict mode ===");

const S = zex.object({ a: zex.string() });
expectFail('strict mode rejects extra', () => S.parse({ a: 'x', b: 1 } as any));
expectOk('passthrough allows extra', () => S.passthrough().parse({ a: 'x', b: 1 }));

