import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: tuple ===");

const T = zex.tuple([zex.string(), zex.number(), zex.boolean()]);
expectOk('valid tuple', () => T.parse(['x', 1, true]));
expectFail('wrong length', () => T.parse(['x', 1] as any));
// Also assert error path captures the tuple index
try {
  T.parse([1, 'x', true] as any);
  console.log('❌ wrong types (should have failed)');
} catch (e: any) {
  console.log('✅ wrong types (failed as expected)');
  if (e && Array.isArray(e.path) && e.path.includes('0')) {
    console.log('✅ tuple error path includes index 0');
  } else {
    console.log('❌ tuple error path does not include index 0');
    throw e;
  }
}

