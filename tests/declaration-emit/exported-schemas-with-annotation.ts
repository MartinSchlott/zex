// Test file to verify that explicit type annotations work
// This should compile without TS2742 errors when using ZexTypeAny annotation
// BUT discriminatedUnion should still work

import { zex, type ZexTypeAny, type ZexSchemaPublic } from '@ai-inquisitor/zex';

// Annotated schemas - should NOT trigger TS2742
export const NodeDataSchema: ZexTypeAny = zex.object({
  id: zex.string().uuid(),
  name: zex.string().min(1),
  metadata: zex.record(zex.any())
});

export const ClarionDisplayStructureSchema: ZexTypeAny = zex.array(
  zex.object({
    type: zex.literal('text'),
    content: zex.string()
  })
)
  .refine((arr: any) => arr.length > 0, 'Array must not be empty')
  .describe('Display structure for Clarion UI');

// These should work with discriminatedUnion even though they're annotated
export const DogSchema: ZexTypeAny = zex.object({
  type: zex.literal('dog'),
  barks: zex.boolean()
});

export const CatSchema: ZexTypeAny = zex.object({
  type: zex.literal('cat'),
  meows: zex.boolean()
});

// This should work even with annotated variants (after our fix)
export const PetSchema = zex.discriminatedUnion('type', DogSchema, CatSchema);

// Test with ZexSchemaPublic as well (demonstrating proper usage pattern)
const BirdSchemaInternal = zex.object({
  type: zex.literal('bird'),
  chirps: zex.boolean()
});
export type Bird = zex.infer<typeof BirdSchemaInternal>;
export const BirdSchema: ZexSchemaPublic<Bird> = BirdSchemaInternal;

export const AllPetsSchema = zex.discriminatedUnion('type', DogSchema, CatSchema, BirdSchema);

// Complex nested schema with annotation
export const UserSchema: ZexTypeAny = zex.object({
  id: zex.string().uuid(),
  profile: zex.object({
    name: zex.string().min(2),
    age: zex.number().int().min(0)
  }),
  pets: zex.array(PetSchema)
})
  .refine((u: any) => u.profile.age >= 0, 'Age must be non-negative')
  .describe('User with pets');
