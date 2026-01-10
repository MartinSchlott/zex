// Test to reproduce TS2742 by exporting inferred types
// TS2742 typically occurs when trying to export the inferred type of a schema

import { zex } from '@ai-inquisitor/zex';

// Create a schema with complex nested structure
const NodeDataSchema = zex.object({
  id: zex.string().uuid(),
  name: zex.string().min(1),
  metadata: zex.record(zex.any())
});

// This is where TS2742 would occur - exporting the inferred type
export type NodeData = zex.infer<typeof NodeDataSchema>;

// Complex schema with refine
const ClarionDisplayStructureSchema = zex.array(
  zex.object({
    type: zex.literal('text'),
    content: zex.string()
  })
)
  .refine((arr: any) => arr.length > 0, 'Array must not be empty')
  .describe('Display structure for Clarion UI');

// Export inferred type - this might trigger TS2742
export type ClarionDisplayStructure = zex.infer<typeof ClarionDisplayStructureSchema>;

// Nested object with discriminated union
const DogSchema = zex.object({
  type: zex.literal('dog'),
  barks: zex.boolean()
});

const CatSchema = zex.object({
  type: zex.literal('cat'),
  meows: zex.boolean()
});

const PetSchema = zex.discriminatedUnion('type', DogSchema, CatSchema);

const UserSchema = zex.object({
  id: zex.string().uuid(),
  profile: zex.object({
    name: zex.string().min(2),
    age: zex.number().int().min(0)
  }),
  pets: zex.array(PetSchema)
})
  .refine((u: any) => u.profile.age >= 0, 'Age must be non-negative')
  .describe('User with pets');

// Export inferred type - complex nested structure might trigger TS2742
export type User = zex.infer<typeof UserSchema>;
