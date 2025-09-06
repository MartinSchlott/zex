// json.test.ts - Tests for zex.json() type
// =============================================================================

import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: json ===");

const json = zex.json();

expectOk('parse valid string', () => json.parse('string'));
expectOk('parse valid number', () => json.parse(42));
expectOk('parse valid boolean', () => json.parse(true));
expectOk('parse valid null', () => json.parse(null));

expectOk('parse valid object', () => {
  const obj = { name: 'John', age: 30 };
  return json.parse(obj);
});

expectOk('parse valid array', () => {
  const arr = [1, 2, 3, 'test'];
  return json.parse(arr);
});

expectOk('parse nested structure', () => {
  const nested = { data: { items: [1, 2, 3] } };
  return json.parse(nested);
});

expectFail('reject functions', () => json.parse(() => {}));
expectFail('reject functions in object', () => json.parse({ fn: () => {} }));

expectFail('reject Uint8Array', () => json.parse(new Uint8Array([1, 2, 3])));

if (typeof Buffer !== 'undefined') {
  expectFail('reject Buffer', () => json.parse(Buffer.from([1, 2, 3])));
}

expectOk('optional works', () => {
  const optionalJson = zex.json().optional();
  return optionalJson.parse(undefined);
});

expectOk('nullable works', () => {
  const nullableJson = zex.json().nullable();
  return nullableJson.parse(null);
});

expectOk('default works', () => {
  const jsonWithDefault = zex.json().default({ empty: true });
  return jsonWithDefault.parse(undefined);
});

expectOk('describe works', () => {
  const describedJson = zex.json().describe('JSON-serializable data');
  return describedJson.parse({ test: true });
});

expectOk('generates empty JSON Schema', () => {
  const schema = zex.json();
  const jsonSchema = schema.toJSONSchema();
  return Object.keys(jsonSchema).length === 0;
});

expectOk('handles complex nested structures', () => {
  const complex = {
    users: [
      { id: 1, name: 'John', active: true },
      { id: 2, name: 'Jane', active: false }
    ],
    metadata: {
      count: 2,
      lastUpdated: '2024-01-01T00:00:00Z'
    }
  };
  return json.parse(complex);
});

expectOk('handles edge cases', () => {
  return json.parse({}) && json.parse([]) && json.parse('') && json.parse(0) && json.parse(false);
});
