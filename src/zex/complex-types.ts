// complex-types.ts - Complex type implementations for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from './types.js';
import { ZexBase } from './base.js';
import { ZexAny } from './basic-types.js';
import { ZexUnion, ZexDiscriminatedUnion } from './unions.js';
import { 
  ArrayMinLengthValidator,
  ArrayMaxLengthValidator
} from './validators.js';

// =============================================================================
// LOKALE HELFER-TYPEN ZUR VERMEIDUNG VON ZIRKULÄREN ABHÄNGIGKEITEN
// =============================================================================

/**
 * Leitet den finalen Typ einer einzelnen Zex-Schema-Instanz ab.
 * Behandelt `optional` und `nullable` Flags.
 */
type InferProperty<Schema> = Schema extends ZexBase<infer U, infer Flags>
  ? (Flags extends { nullable: true } ? U | null : U) extends infer FinalU
    ? Flags extends { optional: true }
      ? FinalU | undefined
      : FinalU
    : never
  : never;

/**
 * Leitet den vollständigen Typ eines Zex-Objekts ab.
 * Korrekte Version mit optional/required Unterscheidung.
 */
type InferObjectType<T extends Record<string, ZexBase<any, any>>> = {
  // Erforderliche Schlüssel: Felder, die NICHT optional sind.
  [K in keyof T as T[K] extends ZexBase<any, infer Flags>
    ? Flags extends { optional: true }
      ? never
      : K
    : K]: InferProperty<T[K]>
} & {
  // Optionale Schlüssel: Felder, die optional sind (bekommen ein '?').
  [K in keyof T as T[K] extends ZexBase<any, infer Flags>
    ? Flags extends { optional: true }
      ? K
      : never
    : never]?: InferProperty<T[K]>
};

// =============================================================================
// Implementierung der komplexen Typen
// =============================================================================

// Array implementation
export class ZexArray<T extends ZexBase<any, any>> extends ZexBase<InferProperty<T>[]> {
  constructor(public itemSchema: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexArray(this.itemSchema, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return {
      type: "array",
      items: this.itemSchema.toJsonSchema()
    };
  }

  protected transformLua(data: unknown): unknown {
    if (data == null) return data;
    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      if (keys.length === 0) return [];
      if (keys.every(k => /^\d+$/.test(k))) {
        const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
        const result: unknown[] = [];
        for (let i = 0; i < sortedKeys.length; i++) {
          const key = sortedKeys[i];
          const index = parseInt(key);
          if (index !== i + 1) return data;
          result.push((this.itemSchema as any).transformLua((data as any)[key]));
        }
        return result;
      }
    }
    if (Array.isArray(data)) {
      return data.map(item => (this.itemSchema as any).transformLua(item));
    }
    return data;
  }

  protected _parse(data: unknown, path: PathEntry[]): InferProperty<T>[] {
    const validatedData = super._parse(data, path) as unknown[];
    
    // Ensure validatedData is an array
    if (!Array.isArray(validatedData)) {
      const dataType = typeof validatedData;
      throw new ZexError(
        path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
        'type_mismatch',
        `Expected array, got ${dataType}`,
        validatedData,
        'array'
      );
    }
    
    return validatedData.map((item, index) => {
      const elementPath = [...path, {
        type: 'array',
        index,
        schema: this.itemSchema,
        description: (this.itemSchema as any).config?.meta?.description
      }];
      try {
        return (this.itemSchema as any)._parse(item, elementPath);
      } catch (err) {
        throw err;
      }
    });
  }

  min(minLength: number): ZexArray<T> {
    return this.addValidator(new ArrayMinLengthValidator(minLength)) as ZexArray<T>;
  }

  max(maxLength: number): ZexArray<T> {
    return this.addValidator(new ArrayMaxLengthValidator(maxLength)) as ZexArray<T>;
  }
}

export type ZexObjectMode = "strict" | "passthrough" | "strip";

export class ZexObject<T extends Record<string, ZexBase<any, any>>> extends ZexBase<InferObjectType<T>> {
  constructor(
    public shape: T,
    config?: Partial<ZexConfig>,
    private allowAdditionalProperties: boolean = false,
    private mode: ZexObjectMode = "strict",
    private allOptional: boolean = false
  ) {
    super(config);
  }

  passthrough(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "passthrough", this.allOptional);
  }

  strip(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "strip", this.allOptional);
  }

  strict(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, false, "strict", this.allOptional);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexObject(this.shape, newConfig, this.allowAdditionalProperties, this.mode, this.allOptional) as this;
  }

  // Shallow: make all top-level fields optional. Defaults only apply when explicitly provided as undefined.
  partial(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, this.allowAdditionalProperties, this.mode, true);
  }

  // Remove selected top-level keys from the schema. Unknown handling is governed by object mode.
  omit(...keys: (string | string[])[]): ZexObject<Partial<T> & Record<string, ZexBase<any, any>>> {
    const flat: string[] = [];
    for (const k of keys) {
      if (Array.isArray(k)) flat.push(...k);
      else flat.push(k);
    }
    const toOmit = new Set(flat);
    const newShape: Record<string, ZexBase<any, any>> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      if (!toOmit.has(key)) newShape[key] = schema;
    }
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional);
  }

  // Remove properties with readOnly: true
  omitReadOnly(): ZexObject<Partial<T> & Record<string, ZexBase<any, any>>> {
    const newShape: Record<string, ZexBase<any, any>> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      if (!(schema as any).isReadOnly()) newShape[key] = schema;
    }
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional);
  }

  // Remove properties with writeOnly: true
  omitWriteOnly(): ZexObject<Partial<T> & Record<string, ZexBase<any, any>>> {
    const newShape: Record<string, ZexBase<any, any>> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      if (!(schema as any).isWriteOnly()) newShape[key] = schema;
    }
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional);
  }

  protected getBaseJsonSchema(): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, schema] of Object.entries(this.shape)) {
      properties[key] = schema.toJsonSchema();
      if (!this.allOptional && !(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
        required.push(key);
      }
    }
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: this.allowAdditionalProperties
    };
  }

  protected transformLua(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;
    // Preserve unknown keys so object mode (strict/strip/passthrough) is enforced at parse stage
    const result: Record<string, unknown> = { ...(data as any) };
    for (const [key, schema] of Object.entries(this.shape)) {
      if (key in (data as any)) {
        result[key] = (schema as any).transformLua((data as any)[key]);
      }
    }
    return result;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'object' || data === null) {
      const dataType = typeof data;
      return { success: false, error: `Expected object, got ${dataType}` };
    }

    // Validate each field
    for (const [key, schema] of Object.entries(this.shape)) {
      if (key in data) {
        const value = (data as any)[key];
        // Treat explicit undefined as missing: allow optional or default, else error
        if (value === undefined) {
          if ((schema as any).config?.defaultValue !== undefined) {
            // default will apply in _parse
            continue;
          }
          if (this.allOptional || (schema as any).config?.optional) {
            // optional undefined is fine
            continue;
          }
          return { success: false, error: `Missing required field '${key}'` };
        }
        // Always validate if field is present with a concrete value
        const result = (schema as any).safeParse(value);
        if (!result.success) {
          return { success: false, error: `Field '${key}': ${result.error}` };
        }
      } else if (!this.allOptional && !(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
        return { success: false, error: `Missing required field '${key}'` };
      }
    }

    return { success: true };
  }

  extend<U extends Record<string, ZexBase<any, any>>>(
    extension: U
  ): ZexObject<T & U> {
    const newShape = { ...this.shape, ...extension };
    return new ZexObject(newShape, this.config, this.allowAdditionalProperties, this.mode);
  }

  protected _parse(data: unknown, path: PathEntry[]): InferObjectType<T> {
    const validatedData = super._parse(data, path) as Record<string, unknown>;

    // --- STRICT MODE: Check for unknown properties (only if not allowing additional properties) ---
    if (this.mode === "strict") {
      const shapeKeys = Object.keys(this.shape);
      for (const key in validatedData) {
        if (!shapeKeys.includes(key)) {
          // Throw structured error for unknown properties
          throw new ZexError(
            path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
            'unknown_property',
            `Unknown property '${key}'`,
            (validatedData as any)[key],
            'property not in schema'
          );
        }
      }
    }
    // --- END STRICT MODE ---

    // Validate each object field with path tracking
    const result: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      if (key in validatedData) {
        const fieldPath = [...path, {
          type: 'object',
          key,
          schema,
          description: (schema as any).config?.meta?.description
        }];
        const value = (validatedData as any)[key];
        if (value === undefined) {
          if ((schema as any).config?.defaultValue !== undefined) {
            // Trigger default when explicitly provided as undefined
            result[key] = (schema as any)._parse(undefined, fieldPath);
            continue;
          }
          if (this.allOptional || (schema as any).config?.optional) {
            // Omit missing optional keys entirely
            continue;
          }
          // Required without default: error
          throw new ZexError(
            path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
            'missing_required_field',
            `Missing required field '${key}'`,
            undefined,
            'required field from schema'
          );
        }
        result[key] = (schema as any)._parse(value, fieldPath);
      } else if (!this.allOptional && !(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
        // Missing required field - throw structured error
        throw new ZexError(
          path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
          'missing_required_field',
          `Missing required field '${key}'`,
          undefined,
          'required field from schema'
        );
      } else {
        // Field is optional or has default - apply default if present
        if (this.allOptional || (schema as any).config?.optional) {
          // Omit entirely for optionals
          // no-op
        } else {
          // For fields with defaults, parse with undefined to trigger default
          const fieldPath = [...path, {
            type: 'object',
            key,
            schema,
            description: (schema as any).config?.meta?.description
          }];
          result[key] = (schema as any)._parse(undefined, fieldPath);
        }
      }
    }

    // If passthrough, include additional properties
    if (this.mode === "passthrough") {
      const shapeKeys = Object.keys(this.shape);
      for (const key in validatedData) {
        if (!shapeKeys.includes(key)) {
          result[key] = (validatedData as any)[key];
        }
      }
    }
    // If strip, ignore additional properties (do nothing)
    // If strict, error already thrown above

    return result as InferObjectType<T>;
  }
}

// Record implementation
export class ZexRecord<T extends ZexBase<any, any>> extends ZexBase<Record<string, InferProperty<T>>> {
  constructor(private valueSchema: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexRecord(this.valueSchema, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    // For maximum parser compatibility, always include properties: {} and use true for any
    const additionalProps = this.valueSchema instanceof ZexAny 
      ? true 
      : this.valueSchema.toJsonSchema();
    
    return {
      type: "object",
      format: "record",
      properties: {}, // Always include for parser compatibility
      additionalProperties: additionalProps as any
    };
  }

  protected transformLua(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = (this.valueSchema as any).transformLua(value);
    }
    return result;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'object' || data === null) {
      const dataType = typeof data;
      return { success: false, error: `Expected object, got ${dataType}` };
    }

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const result = (this.valueSchema as any).safeParse(value);
      if (!result.success) {
        return { success: false, error: `Property '${key}': ${result.error}` };
      }
    }

    return { success: true };
  }
}

// Union implementation
// Union and DU moved to unions.ts; keep type exports in index.ts

// Discriminated Union implementation
// Discriminated union moved to unions.ts; keep type exports in index.ts

// Literal implementation
export class ZexLiteral<T, TFlags extends Record<string, boolean> = {}> extends ZexBase<T, TFlags> {
  constructor(private value: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexLiteral(this.value, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { const: this.value };
  }

  protected transformLua(data: unknown): unknown {
    // If this literal expects a string, decode common byte representations
    if (typeof (this as any).value === 'string') {
      try {
        if (data instanceof Uint8Array) {
          return new TextDecoder('utf-8', { fatal: true }).decode(data);
        }
        if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
          return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(data));
        }
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
          const u8 = new Uint8Array(data as unknown as Buffer);
          return new TextDecoder('utf-8', { fatal: true }).decode(u8);
        }
        if (data && typeof data === 'object') {
          const obj: any = data;
          if ((obj.type === 'Buffer' || obj._type === 'Buffer') && Array.isArray(obj.data)) {
            const u8 = Uint8Array.from(obj.data as number[]);
            return new TextDecoder('utf-8', { fatal: true }).decode(u8);
          }
          const keys = Object.keys(obj);
          if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
            const ints = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
            let isZeroBasedContiguous = true;
            for (let i = 0; i < ints.length; i++) if (ints[i] !== i) { isZeroBasedContiguous = false; break; }
            if (isZeroBasedContiguous) {
              const arr = new Uint8Array(ints.length);
              for (let i = 0; i < ints.length; i++) arr[i] = obj[String(i)] as number;
              return new TextDecoder('utf-8', { fatal: true }).decode(arr);
            }
          }
        }
      } catch {}
    }
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (data !== this.value) {
      return { success: false, error: `Expected literal value ${JSON.stringify(this.value)}, got ${JSON.stringify(data)}` };
    }
    return { success: true };
  }
}

// Tuple type inference helper
type InferTuple<T extends readonly ZexBase<any>[]> = {
  [K in keyof T]: T[K] extends ZexBase<infer U> ? U : never;
};

// Tuple implementation for fixed-length arrays
export class ZexTuple<T extends readonly ZexBase<any, any>[]> extends ZexBase<InferTuple<T>> {
  constructor(private schemas: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexTuple(this.schemas, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    const prefixItems = this.schemas.map(schema => schema.toJsonSchema());
    return {
      type: "array",
      prefixItems,
      additionalItems: false, // No additional items allowed
      minItems: this.schemas.length,
      maxItems: this.schemas.length
    };
  }

  protected transformLua(data: unknown): unknown {
    if (!Array.isArray(data)) return data;
    return data.map((item, index) => {
      if (index < this.schemas.length) {
        return (this.schemas[index] as any).transformLua(item);
      }
      return item;
    });
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (!Array.isArray(data)) {
      return { success: false, error: 'Expected array' };
    }
    
    if (data.length !== this.schemas.length) {
      return { 
        success: false, 
        error: `Expected array of length ${this.schemas.length}, got ${data.length}` 
      };
    }
    
    return { success: true };
  }

  protected _parse(data: unknown, path: PathEntry[]): InferTuple<T> {
    const validatedData = super._parse(data, path) as unknown[];
    
    // Validate each element against its corresponding schema
    const result: any[] = [];
    for (let i = 0; i < this.schemas.length; i++) {
      const elementPath = [...path, {
        type: 'tuple',
        index: i,
        schema: this.schemas[i],
        description: (this.schemas[i] as any).config?.meta?.description
      }];
      
      try {
        const element = (this.schemas[i] as any)._parse(validatedData[i], elementPath);
        result.push(element);
      } catch (error) {
        if (error instanceof ZexError) {
          throw error;
        }
        throw new ZexError(
          path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
          'tuple_element_error',
          `Element at index ${i}: ${error instanceof Error ? error.message : String(error)}`,
          validatedData[i],
          `element matching schema at index ${i}`
        );
      }
    }
    
    return result as InferTuple<T>;
  }
} 