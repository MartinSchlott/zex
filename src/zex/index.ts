// index.ts - Public API for Zex
// =============================================================================

import { JsonSchema } from './types.js';
import { ZexBase } from './base.js';
import { ZexString, ZexNumber, ZexBoolean, ZexAny, ZexEnum, ZexNull, ZexBuffer } from './basic-types.js';
import { ZexArray, ZexObject, ZexRecord, ZexUnion, ZexLiteral, ZexTuple, ZexDiscriminatedUnion } from './complex-types.js';
import { ZexUri, ZexUrl, ZexJsonSchema } from './special-types.js';

// Public API
export const zex = {
  // Basic types
  string: () => new ZexString(),
  number: () => new ZexNumber(),
  boolean: () => new ZexBoolean(),
  any: () => new ZexAny(),
  null: () => new ZexNull(),
  buffer: (mimeType?: string) => new ZexBuffer(mimeType),
  enum: <T extends readonly unknown[]>(values: T) => new ZexEnum(values),

  // Complex types
  array: <T extends ZexBase<any, any>>(schema: T) => new ZexArray(schema),
  object: <T extends Record<string, ZexBase<any, any>>>(shape: T, allowAdditionalProperties: boolean = false, mode: "strict" | "passthrough" | "strip" = "strict") => new ZexObject(shape, undefined, allowAdditionalProperties, mode),
  record: <T extends ZexBase<any, any>>(valueSchema: T) => new ZexRecord(valueSchema),
  tuple: <T extends readonly ZexBase<any, any>[]>(schemas: T) => new ZexTuple(schemas),
  union: <T extends readonly ZexBase<any, any>[]>(...schemas: T) => new ZexUnion(schemas),
  literal: <T>(value: T) => new ZexLiteral(value),
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

// --- fromJsonSchema Implementation ---

function buildPathString(path: (string | number)[], root?: string): string {
  return (root ? [root, ...path] : path).join(".");
}

function fromJsonSchemaInternal(schema: any, path: (string | number)[] = [], root?: string): ZexBase<any> {
  if (!schema || typeof schema !== "object") {
    const pathString = buildPathString(path, root);
    const schemaType = typeof schema;
    const schemaValue = schema === null ? ' (null)' : '';
    throw new Error(`fromJsonSchema: Invalid schema at path '${pathString}' - schema is ${schemaType}${schemaValue}. Expected a valid JSON Schema object.`);
  }

  // Meta-Felder extrahieren
  const meta: Record<string, unknown> = {};
  if (schema.title) meta.title = schema.title;
  if (schema.description) meta.description = schema.description;
  if (schema.examples) meta.examples = schema.examples;
  if (schema.format) meta.format = schema.format;
  // Normalize JSON Schema readOnly/writeOnly: drop explicit false
  if (schema.readOnly === true) meta.readOnly = true;
  if (schema.writeOnly === true) meta.writeOnly = true;
  // Alle nicht-standardisierten Felder als Meta-Daten übernehmen
  for (const k of Object.keys(schema)) {
    if (["title","description","examples","format","type","properties","items","required","enum","anyOf","allOf","oneOf","additionalProperties","minLength","maxLength","minimum","maximum","pattern","readOnly","writeOnly"].indexOf(k) === -1) {
      meta[k] = schema[k];
    }
  }

  // URI-Schema Spezialbehandlung
  if (schema.type === "string" && schema.format === "uri") {
    return zex.uri().meta(meta) as ZexBase<any>;
  }

  // URL-Schema Spezialbehandlung
  if (schema.type === "string" && schema.format === "uri-reference") {
    return zex.url().meta(meta) as ZexBase<any>;
  }

  // Buffer-Schema Spezialbehandlung
  if (schema.type === "object" && schema.format === "buffer") {
    return zex.buffer(schema.contentMediaType).meta(meta) as ZexBase<any>;
  }

  // Basistypen mit Rekonstruktion der Validatoren
  if (schema.type === "string") {
    let stringSchema = zex.string();
    
    if (schema.minLength !== undefined) {
      stringSchema = stringSchema.min(schema.minLength);
    }
    if (schema.maxLength !== undefined) {
      stringSchema = stringSchema.max(schema.maxLength);
    }
    if (schema.format === 'email') {
      stringSchema = stringSchema.email();
    }
    if (schema.format === 'uuid') {
      stringSchema = stringSchema.uuid();
    }
    if (schema.pattern !== undefined) {
      stringSchema = stringSchema.pattern(schema.pattern);
    }
    
    return stringSchema.meta(meta) as ZexBase<any>;
  }
  
  if (schema.type === "number" || schema.type === "integer") {
    let numberSchema = zex.number();
    
    if (schema.minimum !== undefined) {
      numberSchema = numberSchema.min(schema.minimum);
    }
    if (schema.maximum !== undefined) {
      numberSchema = numberSchema.max(schema.maximum);
    }
    if (schema.type === 'integer') {
      numberSchema = numberSchema.int();
    }
    
    return numberSchema.meta(meta) as ZexBase<any>;
  }
  
  if (schema.type === "boolean") {
    return zex.boolean().meta(meta) as ZexBase<any>;
  }
  
  // Arrays und Objekte (Logik unverändert)
  if (schema.type === "array") {
    // Check for tuple (fixed-length array with prefixItems)
    if (schema.prefixItems && Array.isArray(schema.prefixItems)) {
      const tupleSchemas = schema.prefixItems.map((itemSchema: any, i: number) => 
        fromJsonSchemaInternal(itemSchema, [...path, `prefixItems[${i}]`], root)
      );
      return zex.tuple(tupleSchemas).meta(meta) as ZexBase<any>;
    }
    // Regular array
    if (!schema.items) {
      const pathString = buildPathString(path, root);
      throw new Error(`fromJsonSchema: Array schema missing 'items' at path '${pathString}'. Add 'items' property with the schema for array elements.`);
    }
    // PATCH: Wenn items.anyOf vorhanden ist, baue ein Union-Schema als itemSchema
    let itemSchema: ZexBase<any>;
    if (schema.items && Array.isArray(schema.items.anyOf)) {
      itemSchema = zex.union(...schema.items.anyOf.map((s: any, i: number) => fromJsonSchemaInternal(s, [...path, `items.anyOf[${i}]`], root)));
    } else if (typeof schema.items === 'object' && Object.keys(schema.items).length === 0) {
      // Empty items object means any type
      itemSchema = zex.any();
    } else {
      itemSchema = fromJsonSchemaInternal(schema.items, [...path, "items"], root);
    }
    const arr = zex.array(itemSchema).meta(meta) as ZexBase<any>;
    return arr;
  }
  
  if (schema.type === "object") {
    // Check for record type (object with additionalProperties but no properties)
    if (schema.additionalProperties !== undefined && (!schema.properties || Object.keys(schema.properties).length === 0)) {
      let valueSchema: ZexBase<any>;
      if (schema.additionalProperties === true || (typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length === 0)) {
        // additionalProperties: true or {} means any value
        valueSchema = zex.any();
      } else if (schema.additionalProperties === false) {
        // additionalProperties: false means no additional properties allowed
        // This should not be a record type, but a strict object
        return zex.object({}, false, "strict").meta(meta) as ZexBase<any>;
      } else {
        // additionalProperties: schema means specific schema
        valueSchema = fromJsonSchemaInternal(schema.additionalProperties, [...path, "additionalProperties"], root);
      }
      return zex.record(valueSchema).meta(meta) as ZexBase<any>;
    }
    
    // Regular object
    const shape: Record<string, ZexBase<any>> = {};
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    
    // Handle objects with or without properties
    if (schema.properties && typeof schema.properties === "object") {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        let z = fromJsonSchemaInternal(propSchema, [...path, key], root);
        if (!required.includes(key)) z = z.optional();
        shape[key] = z;
      }
    }
    
    // Determine if additional properties should be allowed and mode
    let allowAdditionalProps = false;
    let mode: "strict" | "passthrough" | "strip" = "strict";
    if (schema.additionalProperties === true) {
      allowAdditionalProps = true;
      mode = "passthrough";
    } else if (schema.additionalProperties === false) {
      allowAdditionalProps = false;
      mode = "strict";
    } else if (schema.additionalProperties === undefined) {
      // If no additionalProperties is specified and no properties are defined,
      // default to allowing additional properties (common in OpenAPI)
      if (!schema.properties || Object.keys(schema.properties || {}).length === 0) {
        allowAdditionalProps = true;
        mode = "passthrough";
      }
    }
    // Create object schema with appropriate additionalProperties setting and mode
    const objectSchema = zex.object(shape, allowAdditionalProps, mode).meta(meta) as ZexBase<any>;
    
    return objectSchema;
  }
  
  // Handle enum arrays (must come before other checks)
  if (Array.isArray(schema.enum)) {
    return zex.enum(schema.enum as any[]).meta(meta) as ZexBase<any>;
  }
  
  if (Array.isArray(schema.anyOf)) {
    // Try to detect discriminated union pattern: prefer OpenAPI discriminator if present
    const openApiDiscriminator = (schema as any).discriminator;
    if (openApiDiscriminator && typeof openApiDiscriminator === 'object' && typeof openApiDiscriminator.propertyName === 'string') {
      const key = openApiDiscriminator.propertyName as string;
      const reconstructedVariants = (schema.anyOf as any[]).map((v, i) => fromJsonSchemaInternal(v, [...path, `anyOf[${i}]`], root)) as any[];
      return (zex as any).discriminatedUnion(key, ...reconstructedVariants).meta(meta) as ZexBase<any>;
    }

    // Otherwise: all variants are objects with the same discriminator key K
    const variants = schema.anyOf as any[];
    // Collect candidate discriminator keys: properties that are const and required, present in all variants
    const candidateKeys = new Map<string, { values: unknown[]; ok: boolean }>();
    const variantObjects: any[] = [];
    for (const v of variants) {
      if (v && typeof v === 'object' && v.type === 'object' && v.properties && typeof v.properties === 'object') {
        variantObjects.push(v);
      } else {
        variantObjects.length = 0; // mark not DU
        break;
      }
    }
    if (variantObjects.length === variants.length && variants.length > 0) {
      // Build key -> list of const values across variants when required
      for (let i = 0; i < variantObjects.length; i++) {
        const v = variantObjects[i];
        const required = Array.isArray(v.required) ? v.required : [];
        for (const [k, prop] of Object.entries(v.properties as Record<string, any>)) {
          if (required.includes(k) && prop && typeof prop === 'object' && 'const' in prop) {
            if (!candidateKeys.has(k)) candidateKeys.set(k, { values: [], ok: true });
            candidateKeys.get(k)!.values.push((prop as any).const);
          }
        }
      }
      // Choose a key that appears in every variant and has unique const values
      let chosenKey: string | undefined;
      for (const [k, info] of candidateKeys.entries()) {
        if (info.values.length === variants.length) {
          const set = new Set(info.values.map(v => JSON.stringify(v)));
          if (set.size === info.values.length) {
            chosenKey = k;
            break;
          }
        }
      }
      if (chosenKey) {
        // Reconstruct discriminated union
        const reconstructedVariants = variantObjects.map((v, i) => fromJsonSchemaInternal(v, [...path, `anyOf[${i}]`], root)) as any[];
        return (zex as any).discriminatedUnion(chosenKey, ...reconstructedVariants).meta(meta) as ZexBase<any>;
      }
    }
    // Fallback: regular union
    return zex.union(...(schema.anyOf.map((s: any, i: number) => fromJsonSchemaInternal(s, [...path, `anyOf[${i}]`], root)))).meta(meta) as ZexBase<any>;
  }

  // Handle const values (literals)
  if (schema.const !== undefined) {
    return zex.literal(schema.const).meta(meta) as ZexBase<any>;
  }
  
  // Provide more specific error messages for common issues
  const pathString = buildPathString(path, root);
  
  // Check for empty object (missing type)
  if (typeof schema === 'object' && schema !== null && Object.keys(schema).length === 0) {
    throw new Error(`fromJsonSchema: Invalid JSON Schema at path '${pathString}' - empty object {} is not a valid schema. Use { type: "object", additionalProperties: true } or similar.`);
  }
  
  // Check for null schema
  if (schema === null) {
    throw new Error(`fromJsonSchema: Invalid JSON Schema at path '${pathString}' - null is not a valid schema. Use { type: "object", additionalProperties: true } or similar.`);
  }
  
  // Check for schema without type
  if (typeof schema === 'object' && schema !== null && !schema.type && !schema.enum && !schema.anyOf && !schema.allOf && !schema.oneOf && !schema.const && !schema.$ref) {
    const keys = Object.keys(schema);
    if (keys.length > 0) {
      throw new Error(`fromJsonSchema: Invalid JSON Schema at path '${pathString}' - missing required 'type' field. Found keys: [${keys.join(', ')}]. Add 'type' field or use { type: "object", additionalProperties: true } for any value.`);
    } else {
      throw new Error(`fromJsonSchema: Invalid JSON Schema at path '${pathString}' - empty object {} is not a valid schema. Use { type: "object", additionalProperties: true } or similar.`);
    }
  }
  
  throw new Error(`fromJsonSchema: Unsupported or unknown schema feature at path '${pathString}'`);
}

// Public functions
function fromJsonSchema(schema: any, options?: { rootName?: string }): ZexBase<any> {
  return fromJsonSchemaInternal(schema, [], options?.rootName);
}

function safeFromJsonSchema(schema: any, options?: { rootName?: string }): { success: true; schema: ZexBase<any> } | { success: false; error: string } {
  try {
    const z = fromJsonSchemaInternal(schema, [], options?.rootName);
    return { success: true, schema: z };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Internal function (not exported)
function transformLua(data: unknown, schema: ZexBase<unknown>): unknown {
  return (schema as any).transformLua(data);
}

// Re-export types for external use
export type { JsonSchema, ValidationResult, ZexConfig, Validator } from './types.js';
export { ZexError } from './types.js';

// Re-export classes for external use (as values and types)
export { ZexBase } from './base.js';
export { ZexString, ZexNumber, ZexBoolean, ZexAny, ZexEnum, ZexNull, ZexBuffer } from './basic-types.js';
export { ZexArray, ZexObject, ZexRecord, ZexUnion, ZexLiteral, ZexTuple, ZexDiscriminatedUnion } from './complex-types.js';
export { ZexUri, ZexUrl, ZexJsonSchema } from './special-types.js';

// Type aliases for better developer experience
export type ZexTypeAny = ZexBase<any, any>; 