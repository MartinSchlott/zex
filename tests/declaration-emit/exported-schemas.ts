// Test file to reproduce TS2742: Declaration Emit compatibility
// This file should fail with TS2742 when declaration: true is enabled
// until we fix the issue.

import { zex } from '@ai-inquisitor/zex';

// Simple object schema - should trigger TS2742
export const NodeDataSchema = zex.object({
  id: zex.string().uuid(),
  name: zex.string().min(1),
  metadata: zex.record(zex.any())
});

// Complex schema with refine and describe - definitely should trigger TS2742
export const ClarionDisplayStructureSchema = zex.array(
  zex.object({
    type: zex.literal('text'),
    content: zex.string()
  })
)
  .refine((arr: any) => arr.length > 0, 'Array must not be empty')
  .describe('Display structure for Clarion UI');

// Schema with discriminated union - should work with our fix
export const DogSchema = zex.object({
  type: zex.literal('dog'),
  barks: zex.boolean()
});

export const CatSchema = zex.object({
  type: zex.literal('cat'),
  meows: zex.boolean()
});

// This discriminated union should work even if DogSchema/CatSchema are annotated as ZexTypeAny
export const PetSchema = zex.discriminatedUnion('type', DogSchema, CatSchema);

// Complex nested schema
export const UserSchema = zex.object({
  id: zex.string().uuid(),
  profile: zex.object({
    name: zex.string().min(2),
    age: zex.number().int().min(0)
  }),
  pets: zex.array(PetSchema)
})
  .refine((u: any) => u.profile.age >= 0, 'Age must be non-negative')
  .describe('User with pets');
