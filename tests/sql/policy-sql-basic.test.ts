import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: basic end-to-end behavior ===");

// PostgreSQL-flavored inputs with vendor hints
const pgSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'timestamp without time zone' },
    data: { type: 'string', 'x-pg-type': 'jsonb' },
    payload: { type: 'string', format: 'bytea' },
    // nullable pattern
    note: { anyOf: [ { type: 'string' }, { type: 'null' } ] },
  },
  required: ['id', 'createdAt'],
  additionalProperties: undefined
} as any;

const schema = zex.fromJsonSchema(pgSchema, { policy: 'sql' });

// Should allow undefined (optional) for nullable fields, and accept null at runtime
expectOk('nullable property becomes optional and accepts null', () => {
  const res1 = schema.parse({ id: 'd5a9f2f4-85a8-4f4b-a1fe-9e4b1a7c5d2b', createdAt: '2024-01-01T00:00:00Z' } as any);
  const res2 = schema.parse({ id: 'd5a9f2f4-85a8-4f4b-a1fe-9e4b1a7c5d2b', createdAt: '2024-01-01T00:00:00Z', note: null } as any);
  return res1 && res2;
});

// JSON export should reflect mapped formats and buffer intent, and strict objects
const js = schema.toJsonSchema();
expectOk('object has additionalProperties: false under sql policy', () => js.additionalProperties === false);
expectOk('uuid stays format uuid', () => (js.properties as any).id.format === 'uuid');
expectOk('timestamp mapped to date-time', () => (js.properties as any).createdAt.format === 'date-time');
expectOk('json/jsonb stays format json', () => (js.properties as any).data.format === 'json');
expectOk('bytea mapped to buffer format', () => (js.properties as any).payload.format === 'buffer');

export {};


