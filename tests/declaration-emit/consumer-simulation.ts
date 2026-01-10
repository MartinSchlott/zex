// This simulates a consumer project that imports the exported schemas
// and tries to use them with declaration: true enabled
// This should trigger TS2742 if the problem exists

// Simulate importing from a built package (like clarion-client-core would)
// In reality, this would be: import { NodeDataSchema } from '@some-package/schemas'

// For testing, we'll import from the local exported-schemas file
import {
  NodeDataSchema,
  ClarionDisplayStructureSchema,
  PetSchema,
  UserSchema
} from './exported-schemas.js';

// Consumer code that exports these schemas - this is where TS2742 would occur
export const MyNodeDataSchema = NodeDataSchema;
export const MyClarionSchema = ClarionDisplayStructureSchema;
export const MyPetSchema = PetSchema;
export const MyUserSchema = UserSchema;

// Test that discriminatedUnion still works
export const TestDiscriminatedUnion = PetSchema;

// Type inference should still work
export type NodeData = typeof NodeDataSchema extends import('@ai-inquisitor/zex').ZexBase<infer T, any> ? T : never;
export type User = typeof UserSchema extends import('@ai-inquisitor/zex').ZexBase<infer T, any> ? T : never;
