// json-schema-import.ts - JSON Schema import/export functionality for Zex
// =============================================================================

import { ZexBase, ZexLazy } from './base/index.js';
import { ZexString, ZexNumber, ZexBoolean, ZexAny, ZexEnum, ZexNull, ZexBuffer, ZexFunction, ZexTValue, ZexJson } from './basic-types.js';
import { ZexArray, ZexObject, ZexRecord, ZexTuple, ZexLiteral } from './complex-types/index.js';
import { ZexUnion, ZexDiscriminatedUnion } from './unions.js';
import { ZexUri, ZexUrl, ZexJsonSchema } from './special-types.js';

// Re-export the zex object for internal use
const zex = {
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
};

// --- fromJsonSchema Implementation ---

function buildPathString(path: (string | number)[], root?: string): string {
  return (root ? [root, ...path] : path).join(".");
}

// Helper function to detect meta-only schemas (schemas with only metadata, no structural keywords)
function isMetaOnlySchema(schema: any): boolean {
  if (typeof schema !== 'object' || schema === null) return false;
  
  const structuralKeys = [
    'type', 'properties', 'items', 'required', 'enum', 'anyOf', 'allOf', 'oneOf', 'additionalProperties',
    'minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'const', '$ref'
  ];
  
  const keys = Object.keys(schema);
  return keys.length > 0 && !keys.some(k => structuralKeys.includes(k));
}

type ImportCtx = { defs: Record<string, any>; memo: Map<string, ZexBase<any>> };

function fromJsonSchemaInternal(schema: any, path: (string | number)[] = [], root?: string, ctx?: ImportCtx): ZexBase<any> {
  // Support boolean schemas: true means "accept anything"
  if (schema === true) {
    return zex.any();
  }
  if (!schema || typeof schema !== "object") {
    const pathString = buildPathString(path, root);
    const schemaType = typeof schema;
    const schemaValue = schema === null ? ' (null)' : '';
    throw new Error(`fromJsonSchema: Invalid schema at path '${pathString}' - schema is ${schemaType}${schemaValue}. Expected a valid JSON Schema object.`);
  }

  // Handle $ref to local $defs (Draft 2020-12)
  if (typeof (schema as any).$ref === 'string') {
    if (!ctx) throw new Error(`fromJsonSchema: $ref found without context at '${buildPathString(path, root)}'`);
    const ref: string = (schema as any).$ref;
    const prefix = '#/$defs/';
    if (!ref.startsWith(prefix)) {
      throw new Error(`fromJsonSchema: Only local $defs refs supported, got '${ref}' at '${buildPathString(path, root)}'`);
    }
    const id = ref.slice(prefix.length);
    const cached = ctx.memo.get(id);
    if (cached) return cached;
    // Create lazy placeholder that resolves on demand
    const lazy = (zex as any).lazy(() => {
      const again = ctx.memo.get(id);
      if (again && again !== lazy) return again;
      const target = ctx.defs[id];
      if (!target) throw new Error(`fromJsonSchema: Missing $defs['${id}']`);
      const resolved = fromJsonSchemaInternal(target, ['$', 'defs', id], root, ctx);
      ctx.memo.set(id, resolved);
      return resolved;
    });
    ctx.memo.set(id, lazy);
    return lazy;
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

  // Special non-standard marker: JSON-serializable data
  if ((schema as any).format === 'json') {
    return zex.json().meta(meta) as ZexBase<any>;
  }

  // Check for meta-only schemas (schemas with only metadata, no structural keywords)
  if (isMetaOnlySchema(schema)) {
    return zex.any().meta(meta) as ZexBase<any>;
  }

  // Reject complex composition keywords with helpful error messages
  const errorPath = buildPathString(path, root);
  if (schema.allOf) {
    throw new Error(`fromJsonSchema: "allOf" is not supported at path '${errorPath}'. Use zex.object().extend() for object composition instead.`);
  }
  if (schema.oneOf) {
    throw new Error(`fromJsonSchema: "oneOf" is not supported at path '${errorPath}'. Use zex.union() instead.`);
  }
  if (schema.not) {
    throw new Error(`fromJsonSchema: "not" is not supported at path '${errorPath}'. Use zex.union() with specific types instead.`);
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
    if (schema.exclusiveMinimum === 0) {
      numberSchema = (numberSchema as any).positive();
    }
    if (schema.minimum === 0) {
      numberSchema = (numberSchema as any).nonnegative();
    }
    if (schema.exclusiveMaximum === 0) {
      numberSchema = (numberSchema as any).negative();
    }
    if (schema.maximum === 0) {
      numberSchema = (numberSchema as any).nonpositive();
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
        fromJsonSchemaInternal(itemSchema, [...path, `prefixItems[${i}]`], root, ctx)
      );
      return zex.tuple(tupleSchemas).meta(meta) as ZexBase<any>;
    }
    // Regular array
    if (!schema.items) {
      const pathString = buildPathString(path, root);
      throw new Error(`fromJsonSchema: Array schema missing 'items' at path '${pathString}'. Add 'items' property with the schema for array elements.`);
    }
    // PATCH: Wenn items.anyOf vorhanden ist, baue wahlweise ein DiscriminatedUnion (bei Discriminator)
    //        oder ein Union-Schema als itemSchema
    let itemSchema: ZexBase<any>;
    if (schema.items && Array.isArray(schema.items.anyOf)) {
      const variants = schema.items.anyOf.map((s: any, i: number) => 
        fromJsonSchemaInternal(s, [...path, `items.anyOf[${i}]`], root, ctx)
      );
      const disc = (schema.items as any).discriminator;
      if (disc && typeof disc === 'object' && typeof disc.propertyName === 'string') {
        itemSchema = (zex as any).discriminatedUnion(disc.propertyName, ...(variants as any));
      } else {
        itemSchema = zex.union(...(variants as any));
      }
    } else if (schema.items === true) {
      // Boolean true items means any
      itemSchema = zex.any();
    } else if (typeof schema.items === 'object' && Object.keys(schema.items).length === 0) {
      // Empty items object means any type
      itemSchema = zex.any();
    } else {
      itemSchema = fromJsonSchemaInternal(schema.items, [...path, "items"], root, ctx);
    }
    const arr = zex.array(itemSchema).meta(meta) as ZexBase<any>;
    return arr;
  }
  
  if (schema.type === "object") {
    // Check for explicit record type marker
    if (schema.format === "record") {
      // A record that doesn't allow properties is meaningless. Throw an error.
      if (schema.additionalProperties === false) {
        throw new Error(`A schema with "format": "record" cannot have "additionalProperties": false.`);
      }

      // 'additionalProperties' is the schema. If it's missing, it's 'any'.
      const valueSchema = fromJsonSchemaInternal(
        schema.additionalProperties || {}, // Fallback to empty object -> zex.any()
        [...path, "additionalProperties"], 
        root,
        ctx
      );
      return zex.record(valueSchema).meta(meta) as ZexBase<any>;
    }

    // Check for jsonschema type marker
    if (schema.format === "jsonschema") {
      return zex.jsonschema().meta(meta) as ZexBase<any>;
    }
    
    // Regular object
    const shape: Record<string, ZexBase<any>> = {};
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    
    // Handle objects with or without properties
    if (schema.properties && typeof schema.properties === "object") {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        let z = fromJsonSchemaInternal(propSchema, [...path, key], root, ctx);
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
    // Check for explicit discriminator (JSON Schema Draft 2020-12 / OpenAPI standard)
    const discriminator = (schema as any).discriminator;
    if (discriminator && typeof discriminator === 'object' && typeof discriminator.propertyName === 'string') {
      const key = discriminator.propertyName as string;
      const reconstructedVariants = (schema.anyOf as any[]).map((v, i) => fromJsonSchemaInternal(v, [...path, `anyOf[${i}]`], root, ctx)) as any[];
      return (zex as any).discriminatedUnion(key, ...reconstructedVariants).meta(meta) as ZexBase<any>;
    }
    
    // Fallback: regular union (no discriminator detection)
    return zex.union(...(schema.anyOf.map((s: any, i: number) => fromJsonSchemaInternal(s, [...path, `anyOf[${i}]`], root, ctx)))).meta(meta) as ZexBase<any>;
  }

  // Handle const values (literals)
  if (schema.const !== undefined) {
    return zex.literal(schema.const).meta(meta) as ZexBase<any>;
  }
  
  // Provide more specific error messages for common issues
  const pathString = buildPathString(path, root);
  
  // Check for empty object (missing type) → interpret as "any"
  if (typeof schema === 'object' && schema !== null && Object.keys(schema).length === 0) {
    return zex.any().meta(meta) as ZexBase<any>;
  }
  
  // Check for null schema
  if (schema === null) {
    throw new Error(`fromJsonSchema: Invalid JSON Schema at path '${pathString}' - null is not a valid schema. Use { type: "object", additionalProperties: true } or similar.`);
  }
  
  // If we reach here, the schema has structural keywords but we don't support them
  const keys = Object.keys(schema);
  throw new Error(`fromJsonSchema: Unsupported or unknown schema feature at path '${pathString}'. Found keys: [${keys.join(', ')}].`);
}

// Public functions
export function fromJsonSchema(schema: any, options?: { rootName?: string }): ZexBase<any> {
  const defs = (schema && typeof schema === 'object' && (schema as any).$defs) || {};
  const ctx: ImportCtx = { defs, memo: new Map() };
  return fromJsonSchemaInternal(schema, [], options?.rootName, ctx);
}

export function safeFromJsonSchema(schema: any, options?: { rootName?: string }): { success: true; schema: ZexBase<any> } | { success: false; error: string } {
  try {
    const z = fromJsonSchema(schema, options);
    return { success: true, schema: z };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Internal function (not exported)
export function transformLua(data: unknown, schema: ZexBase<unknown>): unknown {
  return (schema as any).transformLua(data);
}
