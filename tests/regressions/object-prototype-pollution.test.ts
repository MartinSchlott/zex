import { zex } from '../_imports.js';
import { expectFail, expectOk } from '../_utils.js';

console.log("\n=== REGRESSION: object prototype pollution resistance ===");

const schema = zex.object({ name: zex.string() });

// Object with polluted prototype should not leak inherited properties
const proto = { injected: 'evil' };
const obj = Object.create(proto);
obj.name = 'valid';

// Strict mode: inherited 'injected' key should NOT be seen as unknown property
expectOk('strict mode ignores inherited prototype properties', () =>
  schema.parse(obj)
);

// Passthrough mode: inherited properties should NOT appear in output
expectOk('passthrough does not copy inherited properties', () => {
  const result = schema.passthrough().parse(obj);
  if ('injected' in result) {
    throw new Error('Inherited property "injected" leaked into result');
  }
});

// Null prototype objects should work fine
expectOk('null prototype object parses correctly', () => {
  const nullProto = Object.create(null);
  nullProto.name = 'test';
  schema.parse(nullProto);
});
