import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: optional typing (uid) ===");

const MAX_NAME_LENGTH = 50;

export const MetadataSchema = zex.object({
  name: zex.string().default("NewOperator").describe("The name of the node as it appears in its uri."),
  description: zex.string().default("New Operator").describe("The description of the node."),
  type: zex.string().default("operator").describe("The type of the node."),
  version: zex.string().default("1.0.0").describe("The version of the node."),
  tags: zex.array(zex.string().max(MAX_NAME_LENGTH)).describe("Tags for the node"),
  uid: zex.string().optional().describe("The uid of the node."),
});

type Metadata = zex.infer<typeof MetadataSchema>;

// Missing uid should be allowed by the type system
const validWithoutUid: Metadata = {
  name: "A",
  description: "B",
  type: "operator",
  version: "1.0.0",
  tags: [],
};

// Runtime sanity
MetadataSchema.parse(validWithoutUid);
console.log('✅ optional uid type compiles and parses without uid');


