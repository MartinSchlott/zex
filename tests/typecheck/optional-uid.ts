import { zex } from '../../src/zex/index.ts';

const MAX_NAME_LENGTH = 50;
const MetadataSchema = zex.object({
  name: zex.string().default('NewOperator'),
  description: zex.string().default('New Operator'),
  type: zex.string().default('operator'),
  version: zex.string().default('1.0.0'),
  tags: zex.array(zex.string().max(MAX_NAME_LENGTH)),
  uid: zex.string().optional(),
});

type Metadata = zex.infer<typeof MetadataSchema>;

// Should compile: uid optional
const ok1: Metadata = {
  name: 'n', description: 'd', type: 't', version: 'v', tags: []
};

// Should error (uncomment to see):
// const bad: Metadata = { name: 'n', description: 'd', type: 't', version: 'v', tags: [], uid: 123 };
