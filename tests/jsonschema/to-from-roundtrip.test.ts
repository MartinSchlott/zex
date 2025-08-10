import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== JSONSCHEMA: to/from/roundtrip ===");

const Schema = zex.object({
  name: zex.string().describe('Name'),
  tags: zex.array(zex.string()).optional(),
  website: zex.url().optional(),
});

const jsonSchema = Schema.toJsonSchema({ $schema: 'https://json-schema.org/draft/2020-12/schema' });
expectOk('toJsonSchema produces object', () => jsonSchema);

const recreated = zex.fromJsonSchema(jsonSchema);
expectOk('fromJsonSchema parse matches', () => recreated.parse({ name: 'A' }));

const roundtrip = zex.fromJsonSchema(Schema.toJsonSchema());
expectOk('roundtrip works with defaults', () => roundtrip.parse({ name: 'B' }));

// Discriminated Union roundtrip
const DU = zex.discriminatedUnion('kind',
  zex.object({ kind: zex.literal('a'), a: zex.number() }),
  zex.object({ kind: zex.literal('b'), b: zex.string() })
);
const duSchema = DU.toJsonSchema();
const duRecreated = zex.fromJsonSchema(duSchema);
expectOk('roundtrip discriminated union a', () => duRecreated.parse({ kind: 'a', a: 1 }));
expectOk('roundtrip discriminated union b', () => duRecreated.parse({ kind: 'b', b: 'x' }));

