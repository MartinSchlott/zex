import { zex, ZexError } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: object (strict by default) ===");

const User = zex.object({
  name: zex.string(),
  age: zex.number().optional(),
});

expectOk('required field present', () => User.parse({ name: 'A' }));
expectFail('unknown property rejected (strict)', () => User.parse({ name: 'A', x: 1 } as any));

expectOk('passthrough allows unknown', () => User.passthrough().parse({ name: 'A', x: 1 }));
expectOk('strip removes unknown', () => {
  const data = User.strip().parse({ name: 'A', x: 1 } as any) as any;
  if ('x' in data) throw new Error('x should be stripped');
  return data;
});

expectOk('defaults apply for missing fields', () => zex.object({
  n: zex.number().default(5)
}).parse({}));

expectFail('missing required field', () => zex.object({ n: zex.number() }).parse({} as any));

