import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: type inference ===");

// Runtime checks that rely on the same configurations used for type inference
const S = zex.string().optional().nullable().default('x');
const v = S.parse(undefined);
if (v !== 'x') throw new Error('default did not apply');
console.log('✅ inference+flags runtime default works');

const Obj = zex.object({
  name: zex.string(),
  tags: zex.array(zex.string()).optional(),
});
Obj.parse({ name: 'a' });
console.log('✅ object optional field runtime works');

