import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: format mapping (uuid, timestamps, jsonb, inet/cidr/macaddr, bytea) ===");

const S = zex.fromJsonSchema({
  type: 'object',
  properties: {
    u: { type: 'string', format: 'uuid' },
    ts1: { type: 'string', format: 'timestamp without time zone' },
    ts2: { type: 'string', format: 'timestamp with time zone' },
    j: { type: 'string', 'x-pg-type': 'jsonb' },
    inet: { type: 'string', format: 'inet' },
    cidr: { type: 'string', format: 'cidr' },
    mac: { type: 'string', format: 'macaddr' },
    b: { type: 'string', format: 'bytea' }
  }
} as any, { policy: 'sql' });

const js = S.toJsonSchema();

expectOk('uuid stays uuid', () => (js.properties as any).u.format === 'uuid');
expectOk('timestamps map to date-time', () => (js.properties as any).ts1.format === 'date-time' && (js.properties as any).ts2.format === 'date-time');
expectOk('json/jsonb maps to json format', () => (js.properties as any).j.format === 'json');
expectOk('inet/cidr/macaddr formats preserved', () => (
  (js.properties as any).inet.format === 'inet' &&
  (js.properties as any).cidr.format === 'cidr' &&
  (js.properties as any).mac.format === 'macaddr'
));
expectOk('bytea mapped to buffer format', () => (js.properties as any).b.format === 'buffer');

export {};


