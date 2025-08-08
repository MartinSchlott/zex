import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: optional typing (generic) ===");

const MAX_NAME_LENGTH = 50;

const TestSchema = zex.object({
  name: zex.string().default("N"),
  description: zex.string().default("D"),
  type: zex.string().default("T"),
  version: zex.string().default("V"),
  tags: zex.array(zex.string().max(MAX_NAME_LENGTH)),
  uid: zex.string().optional(),
});

type T = zex.infer<typeof TestSchema>;

// Missing uid should be allowed by the type system
const validWithoutUid: T = {
  name: "A",
  description: "B",
  type: "operator",
  version: "1.0.0",
  tags: [],
};

// Runtime sanity
TestSchema.parse(validWithoutUid);
console.log('✅ optional field type compiles and parses without uid');


