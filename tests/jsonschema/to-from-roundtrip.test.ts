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

