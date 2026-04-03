import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== REGRESSION: JSON Schema import edge cases ===");

// Punkt 4: additionalProperties as schema object should not crash
expectOk('additionalProperties as schema object imports as passthrough', () => {
  const jsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name'],
    additionalProperties: { type: 'string' }
  };
  const schema = zex.fromJsonSchema(jsonSchema);
  // Should parse with extra properties (passthrough mode)
  const result = schema.parse({ name: 'hello', extra: 'allowed' });
  if ((result as any).name !== 'hello') throw new Error('name missing');
});

// Punkt 8: oneOf imports as union instead of throwing
expectOk('oneOf imports as union with x-oneOf metadata', () => {
  const jsonSchema = {
    oneOf: [
      { type: 'string' },
      { type: 'number' }
    ]
  };
  const schema = zex.fromJsonSchema(jsonSchema);
  // Should parse both variants
  const r1 = schema.parse('hello');
  if (r1 !== 'hello') throw new Error('string variant broken');
  const r2 = schema.parse(42);
  if (r2 !== 42) throw new Error('number variant broken');
  // Metadata should contain x-oneOf marker
  const js = schema.toJsonSchema();
  if (!(js as any)['x-oneOf']) throw new Error('x-oneOf metadata missing');
});

// Punkt 5: discriminated union with non-object variants falls back to regular union
expectOk('discriminated union with non-object variant falls back to union', () => {
  const jsonSchema = {
    anyOf: [
      { type: 'string' },
      { type: 'object', properties: { kind: { const: 'b' }, val: { type: 'number' } }, required: ['kind', 'val'] }
    ],
    discriminator: { propertyName: 'kind' }
  };
  // Should not throw during import — falls back to regular union
  const schema = zex.fromJsonSchema(jsonSchema);
  // String variant should still work
  const result = schema.parse('hello');
  if (result !== 'hello') throw new Error('string variant broken');
});
