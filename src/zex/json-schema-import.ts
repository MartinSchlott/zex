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

// --- Policy-driven Import Pipeline (Schema/Type transforms) ---

export type RefResolver = (ref: string, ctx: { root: unknown; baseUri?: string }) => unknown;
export type SchemaTransform = (schema: any, ctx: { resolver?: RefResolver; root: any; baseUri?: string }) => any;
export type TypeTransform = (schema: ZexBase<any, any>) => ZexBase<any, any>;

type Policy = {
  schemaTransforms?: SchemaTransform[];
  typeTransforms?: TypeTransform[];
  options?: Record<string, unknown>;
};

const policyRegistry = new Map<string, Policy>();

export function registerPolicy(name: string, policy: Policy): void {
  policyRegistry.set(name, policy);
}

export function applyTypeTransforms<T extends ZexBase<any, any>>(root: T, transforms: TypeTransform[]): T {
  let current: ZexBase<any, any> = root;
  for (const t of transforms) current = t(current);
  return current as T;
}

function deepMapSchema(schema: any, mapper: (node: any) => any): any {
  const visit = (node: any): any => {
    const mapped = mapper(node);
    if (!mapped || typeof mapped !== 'object') return mapped;
    // Recurse into known containers
    if (Array.isArray(mapped)) return mapped.map(visit);
    const out: any = Array.isArray(mapped) ? [] : { ...mapped };
    if (out.properties && typeof out.properties === 'object') {
      const p: any = {};
      for (const [k, v] of Object.entries(out.properties)) p[k] = visit(v);
      out.properties = p;
    }
    if (out.$defs && typeof out.$defs === 'object') {
      const d: any = {};
      for (const [k, v] of Object.entries(out.$defs)) d[k] = visit(v);
      out.$defs = d;
    }
    if (out.items !== undefined) {
      if (Array.isArray(out.items)) out.items = out.items.map(visit);
      else out.items = visit(out.items);
    }
    for (const key of ['anyOf','oneOf','allOf']) {
      if (Array.isArray(out[key])) out[key] = out[key].map(visit);
    }
    return out;
  };
  return visit(schema);
}

function makeDerefTransform(resolver?: RefResolver, root?: any, baseUri?: string): SchemaTransform | undefined {
  if (!resolver) return undefined;
  return (schema: any) => deepMapSchema(schema, (node: any) => {
    if (node && typeof node === 'object' && typeof node.$ref === 'string') {
      const ref: string = node.$ref;
      // Leave local $defs refs to core importer
      const isLocal = ref.startsWith('#/');
      if (isLocal) return node;
      const resolved = resolver(ref, { root, baseUri });
      if (!resolved || typeof resolved !== 'object') {
        throw new Error(`deref: resolver did not return an object for ref '${ref}'`);
      }
      return resolved;
    }
    return node;
  });
}

// Normalize nullability encodings and array items fallback
const nullableFromAnyOfTransform: SchemaTransform = (schema: any) => deepMapSchema(schema, (node: any) => {
  if (!node || typeof node !== 'object') return node;
  // type: ['T','null'] → anyOf
  if (Array.isArray(node.type)) {
    const types: string[] = node.type;
    if (types.includes('null') && types.filter(t => t !== 'null').length === 1) {
      const base = { ...node, type: types.find(t => t !== 'null') };
      delete (base as any).oneOf;
      delete (base as any).allOf;
      return { anyOf: [base, { type: 'null' }] };
    }
  }
  // oneOf([X, null]) → anyOf([X, null]) for import compatibility
  if (Array.isArray(node.oneOf)) {
    const arr = node.oneOf as any[];
    const hasNull = arr.some(s => s && typeof s === 'object' && s.type === 'null');
    const others = arr.filter(s => !(s && typeof s === 'object' && s.type === 'null'));
    if (hasNull && others.length === 1) {
      return { anyOf: [others[0], { type: 'null' }] };
    }
  }
  // anyOf ok as-is; importer will build union
  return node;
});

const arrayItemsFallbackTransform: SchemaTransform = (schema: any) => deepMapSchema(schema, (node: any) => {
  if (node && typeof node === 'object' && node.type === 'array' && node.items === undefined) {
    return { ...node, items: {} };
  }
  return node;
});

// --- Type Transform Helpers ---
function copyMeta(from: ZexBase<any, any>, to: ZexBase<any, any>): ZexBase<any, any> {
  const m = (from as any).meta?.() ?? (from as any).config?.meta ?? {};
  if (m && typeof (to as any).meta === 'function') {
    return (to as any).meta(m) as ZexBase<any, any>;
  }
  return to;
}

function copyFlags(from: ZexBase<any, any>, to: ZexBase<any, any>): ZexBase<any, any> {
  const cfg = (from as any).config || {};
  let out = to;
  // Apply default first (removes optional in Zex semantics)
  if (cfg.defaultValue !== undefined && typeof (out as any).default === 'function') {
    out = (out as any).default(cfg.defaultValue);
  }
  if (cfg.nullable && typeof (out as any).nullable === 'function') {
    out = (out as any).nullable();
  }
  if (cfg.optional && cfg.defaultValue === undefined && typeof (out as any).optional === 'function') {
    out = (out as any).optional();
  }
  return out;
}

function rebuild(from: ZexBase<any, any>, to: ZexBase<any, any>): ZexBase<any, any> {
  let out = copyMeta(from, to);
  out = copyFlags(from, out);
  return out;
}

type SqlStrategy = {
  int64Strategy: 'string' | 'number';
  numericStrategy: 'string' | 'number' | 'decimal';
};

function makeSqlTypeTransform(strategies: SqlStrategy): TypeTransform {
  const visit = (node: ZexBase<any, any>): ZexBase<any, any> => {
    // Unions: flatten and collapse nullable
    if (node instanceof ZexUnion) {
      // Transform children first
      const schemas: ZexBase<any, any>[] = (node as any).schemas?.map((s: ZexBase<any, any>) => visit(s)) ?? [];
      // Flatten nested unions
      const flat: ZexBase<any, any>[] = [];
      for (const s of schemas) {
        if (s instanceof ZexUnion && (s as any).schemas) flat.push(...(s as any).schemas);
        else flat.push(s);
      }
      // Collapse union with null
      const nonNull = flat.filter(s => !(s instanceof ZexNull));
      const hasNull = flat.length !== nonNull.length;
      if (hasNull && nonNull.length === 1) {
        const base = nonNull[0];
        if (typeof (base as any).nullable === 'function') {
          const collapsed = (base as any).nullable();
          return rebuild(node, collapsed);
        }
      }
      if (flat.length === 1) {
        const single = visit(flat[0]);
        return rebuild(node, single);
      }
      const rebuilt = new ZexUnion(flat as any);
      return rebuild(node, rebuilt);
    }

    if (node instanceof ZexDiscriminatedUnion) {
      const key = (node as any).discriminatorKey;
      const variants: ZexObject<Record<string, ZexBase<any, any>>>[] = ((node as any).variants || []).map((v: ZexObject<any>) => visit(v)) as any;
      const rebuilt = (zex as any).discriminatedUnion(key, ...(variants as any));
      return rebuild(node, rebuilt);
    }

    if (node instanceof ZexObject) {
      const shape = (node as any).shape as Record<string, ZexBase<any, any>>;
      const newShape: Record<string, ZexBase<any, any>> = {};
      for (const [k, v] of Object.entries(shape)) newShape[k] = visit(v);
      let rebuilt = (zex as any).object(newShape, false, 'strict'); // addlPropsFalse policy
      rebuilt = rebuild(node, rebuilt);
      return rebuilt;
    }

    if (node instanceof ZexArray) {
      const inner = (node as any).schema ? visit((node as any).schema) : (node as any).itemSchema ? visit((node as any).itemSchema) : undefined;
      let rebuilt = inner ? (zex as any).array(inner) : node;
      rebuilt = rebuild(node, rebuilt);
      return rebuilt;
    }

    if (node instanceof ZexRecord) {
      const vs = (node as any).valueSchema ? visit((node as any).valueSchema) : undefined;
      let rebuilt = vs ? (zex as any).record(vs) : node;
      rebuilt = rebuild(node, rebuilt);
      return rebuilt;
    }

    if (node instanceof ZexTuple) {
      const schemas: ZexBase<any, any>[] = ((node as any).schemas || []).map((s: ZexBase<any, any>) => visit(s));
      const rebuilt = (zex as any).tuple(schemas);
      return rebuild(node, rebuilt);
    }

    if (node instanceof ZexEnum) {
      const values = (node as any).options as readonly unknown[];
      const allStrings = values.every(v => typeof v === 'string');
      if (!allStrings) {
        const literals = values.map(v => (zex as any).literal(v));
        const rebuilt = (zex as any).union(...(literals as any));
        return rebuild(node, rebuilt);
      }
      return node;
    }

    if (node instanceof ZexString) {
      const meta = (node as any).meta?.() ?? {};
      const fmt = (meta as any).format as string | undefined;
      const pg = (meta as any)['x-pg-type'] as string | undefined;
      // bytea → buffer
      if ((fmt && fmt.toLowerCase() === 'bytea') || pg === 'bytea') {
        const rebuilt = (zex as any).buffer();
        return rebuild(node, rebuilt);
      }
      // json/jsonb → zex.json()
      if (pg === 'json' || pg === 'jsonb') {
        const rebuilt = (zex as any).json();
        return rebuild(node, rebuilt);
      }
      // timestamps → date-time
      const tsFormats = ['timestamp without time zone', 'timestamp with time zone', 'timestamptz'];
      if (fmt && tsFormats.includes(fmt)) {
        const rebuilt = (node as any).format('date-time');
        return rebuilt;
      }
      // inet/cidr/macaddr: keep as-is (format preserved from meta)
      return node;
    }

    if (node instanceof ZexNumber) {
      const meta = (node as any).meta?.() ?? {};
      const fmt = (meta as any).format as string | undefined;
      const pg = (meta as any)['x-pg-type'] as string | undefined;
      if ((fmt === 'int64' || pg === 'int8')) {
        if (strategies.int64Strategy === 'string') {
          const rebuilt = (zex as any).string();
          return rebuild(node, rebuilt);
        }
        // number: keep, ensure integer if possible
        try { return (node as any).int?.() ?? node; } catch { return node; }
      }
      if ((fmt === 'numeric' || fmt === 'decimal' || pg === 'numeric')) {
        if (strategies.numericStrategy === 'string') {
          const rebuilt = (zex as any).string();
          return rebuild(node, rebuilt);
        }
      }
      return node;
    }

    return node;
  };
  return (root: ZexBase<any, any>) => visit(root);
}

// Register built-in 'sql' policy
registerPolicy('sql', {
  schemaTransforms: [nullableFromAnyOfTransform, arrayItemsFallbackTransform],
  typeTransforms: [makeSqlTypeTransform({ int64Strategy: 'string', numericStrategy: 'string' })]
});

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
    // Apply default if provided
    if ((schema as any).default !== undefined) {
      stringSchema = (stringSchema as any).default((schema as any).default);
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
    // Apply default if provided
    if ((schema as any).default !== undefined) {
      numberSchema = (numberSchema as any).default((schema as any).default);
    }
    return numberSchema.meta(meta) as ZexBase<any>;
  }
  
  if (schema.type === "boolean") {
    let boolSchema = zex.boolean();
    if ((schema as any).default !== undefined) {
      boolSchema = (boolSchema as any).default((schema as any).default);
    }
    return boolSchema.meta(meta) as ZexBase<any>;
  }
  
  if (schema.type === "null") {
    return zex.null().meta(meta) as ZexBase<any>;
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
        const hasDefault = (propSchema as any) && (propSchema as any).default !== undefined;
        // If property is not listed in required and does NOT have a default, mark as optional.
        // If a default exists, keep it non-optional so that object parsing applies the default when missing.
        if (!required.includes(key) && !hasDefault) {
          z = (z as any).optional();
        }
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
export function fromJsonSchema(
  schema: any,
  options?: {
    rootName?: string;
    policy?: string;
    schemaTransforms?: SchemaTransform[];
    typeTransforms?: TypeTransform[];
    deref?: RefResolver;
  }
): ZexBase<any> {
  // Build transform lists
  const policy = options?.policy ? policyRegistry.get(options.policy) : undefined;
  const schemaTransforms: SchemaTransform[] = [];
  const deref = makeDerefTransform(options?.deref, schema, undefined);
  if (deref) schemaTransforms.push(deref);
  if (policy?.schemaTransforms) schemaTransforms.push(...policy.schemaTransforms);
  if (options?.schemaTransforms) schemaTransforms.push(...options.schemaTransforms);

  let effectiveSchema = schema;
  if (schemaTransforms.length > 0) {
    // Apply sequentially
    for (const t of schemaTransforms) {
      effectiveSchema = t(effectiveSchema, { resolver: options?.deref, root: schema, baseUri: undefined });
    }
  }

  const defs = (effectiveSchema && typeof effectiveSchema === 'object' && (effectiveSchema as any).$defs) || {};
  const ctx: ImportCtx = { defs, memo: new Map() };
  let z = fromJsonSchemaInternal(effectiveSchema, [], options?.rootName, ctx);

  const typeTransforms: TypeTransform[] = [];
  if (policy?.typeTransforms) typeTransforms.push(...policy.typeTransforms);
  if (options?.typeTransforms) typeTransforms.push(...options.typeTransforms);
  if (typeTransforms.length > 0) {
    z = applyTypeTransforms(z, typeTransforms);
  }
  return z;
}

export function safeFromJsonSchema(
  schema: any,
  options?: {
    rootName?: string;
    policy?: string;
    schemaTransforms?: SchemaTransform[];
    typeTransforms?: TypeTransform[];
    deref?: RefResolver;
  }
): { success: true; schema: ZexBase<any> } | { success: false; error: string } {
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
