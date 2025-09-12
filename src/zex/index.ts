// index.ts - Public API for Zex
// =============================================================================

import { JsonSchema } from './types.js';
import { ZexBase, ZexLazy } from './base/index.js';
import { ZexString, ZexNumber, ZexBoolean, ZexAny, ZexEnum, ZexNull, ZexBuffer, ZexFunction, ZexTValue, ZexJson } from './basic-types.js';
import { ZexArray, ZexObject, ZexRecord, ZexTuple } from './complex-types/index.js';
import { ZexLiteral } from './complex-types/index.js';
import { ZexUnion, ZexDiscriminatedUnion } from './unions.js';
import { ZexUri, ZexUrl, ZexJsonSchema } from './special-types.js';
import { fromJsonSchema, safeFromJsonSchema, transformLua } from './json-schema-import.js';

// Public API
export const zex = {
  // Basic types
  string: () => new ZexString(),
  number: () => new ZexNumber(),
  boolean: () => new ZexBoolean(),
  any: () => new ZexAny(),
  json: () => new ZexJson(),
  null: () => new ZexNull(),
  buffer: (mimeType?: string) => new ZexBuffer(mimeType),
  function: () => new ZexFunction(),
  tvalue: () => new ZexTValue(),
  enum: <T extends readonly unknown[]>(values: T) => new ZexEnum(values),

  // Complex types
  array: <T extends ZexBase<any, any>>(schema: T) => new ZexArray(schema),
  object: <T extends Record<string, ZexBase<any, any>>>(shape: T, allowAdditionalProperties: boolean = false, mode: "strict" | "passthrough" | "strip" = "strict") => new ZexObject(shape, undefined, allowAdditionalProperties, mode),
  record: <T extends ZexBase<any, any>>(valueSchema: T) => new ZexRecord(valueSchema),
  tuple: <T extends readonly ZexBase<any, any>[]>(schemas: T) => new ZexTuple(schemas),
  union: <T extends readonly ZexBase<any, any>[]>(...schemas: T) => new ZexUnion(schemas),
  literal: <T>(value: T) => new ZexLiteral(value),
  // Phase 1: runtime-only lazy (no JSON Schema export)
  lazy: <T>(getSchema: () => ZexBase<T>) => new ZexLazy(getSchema),
  discriminatedUnion: <
    K extends string,
    T extends readonly ZexObject<Record<string, ZexBase<any, any>>>[]
  >(
    discriminator: K,
    ...variants: T & {
      [I in keyof T]: T[I] extends ZexObject<infer S>
        ? S[K] extends ZexLiteral<any> ? T[I] : never
        : never
    }
  ) => new ZexDiscriminatedUnion(discriminator, variants),

  // Special types
  uri: () => new ZexUri(),
  url: () => new ZexUrl(),
  jsonschema: () => new ZexJsonSchema(),

  // JSON Schema utility
  toJSONSchema: (schema: ZexBase<unknown>, options?: { additionalProperties?: boolean; $schema?: string }): JsonSchema => {
    return schema.toJSONSchema(options);
  },

  // Parser functions
  fromJsonSchema: (schema: any, options?: { rootName?: string }) => fromJsonSchema(schema, options),
  safeFromJsonSchema: (schema: any, options?: { rootName?: string }) => safeFromJsonSchema(schema, options),
  transformLua: (data: unknown, schema: ZexBase<unknown>) => transformLua(data, schema),

  // Path tracking helper
  rootParseInfo: (description: string) => ({ rootDescription: description })
};

// Flags werden in den finalen Typ umgewandelt
type ApplyFlags<T, Flags> = 
  // Union-basierte Anwendung der Flags, um Optional/Nullable korrekt abzubilden
  T
  | (Flags extends { optional: true } ? undefined : never)
  | (Flags extends { nullable: true } ? null : never);

// Global type inference helper
export type infer<T extends ZexBase<any, any>> = T extends ZexBase<infer U, infer Flags>
  ? ApplyFlags<U, Flags>
  : never;

// Namespace version for compatibility
export namespace zex {
  export type infer<T extends ZexBase<any, any>> = T extends ZexBase<infer U, infer Flags>
    ? ApplyFlags<U, Flags>
    : never;
  
  // Type aliases for better developer experience
  export type ZexTypeAny = ZexBase<any, any>;
}


// Re-export types for external use
export type { JsonSchema, ValidationResult, ZexConfig, Validator } from './types.js';
export { ZexError } from './types.js';

// Re-export classes for external use (as values and types)
export { ZexBase } from './base/index.js';
export { ZexString, ZexNumber, ZexBoolean, ZexAny, ZexEnum, ZexNull, ZexBuffer } from './basic-types.js';
export { ZexArray, ZexObject, ZexRecord, ZexTuple } from './complex-types/index.js';
export { ZexLiteral } from './complex-types/index.js';
export { ZexUnion, ZexDiscriminatedUnion } from './unions.js';
export { ZexUri, ZexUrl, ZexJsonSchema } from './special-types.js';

// Type aliases for better developer experience
export type ZexTypeAny = ZexBase<any, any>; 