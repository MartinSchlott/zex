// complex-types.ts - Complex type implementations for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from './types.js';
import { ZexBase } from './base.js';

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
      throw new ZexError(
        path.map(p => p.key || String(p.index || 'root')),
        'type_mismatch',
        'Expected array',
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
      return (this.itemSchema as any)._parse(item, elementPath);
    });
  }
}

export type ZexObjectMode = "strict" | "passthrough" | "strip";

export class ZexObject<T extends Record<string, ZexBase<any, any>>> extends ZexBase<InferObjectType<T>> {
  constructor(
    public shape: T,
    config?: Partial<ZexConfig>,
    private allowAdditionalProperties: boolean = false,
    private mode: ZexObjectMode = "strict"
  ) {
    super(config);
  }

  passthrough(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "passthrough");
  }

  strip(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "strip");
  }

  strict(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, false, "strict");
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexObject(this.shape, newConfig, this.allowAdditionalProperties, this.mode) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, schema] of Object.entries(this.shape)) {
      properties[key] = schema.toJsonSchema();
      if (!(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
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
    const result: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(this.shape)) {
      if (key in data) {
        result[key] = (schema as any).transformLua((data as any)[key]);
      }
    }
    return result;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'object' || data === null) {
      return { success: false, error: 'Expected object' };
    }

    // Validate each field
    for (const [key, schema] of Object.entries(this.shape)) {
      if (key in data) {
        // Always validate if field is present, regardless of whether it's optional
        const result = (schema as any).safeParse((data as any)[key]);
        if (!result.success) {
          return { success: false, error: `Field '${key}': ${result.error}` };
        }
      } else if (!(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
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
            path.map(p => p.key || String(p.index || 'root')),
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
        result[key] = (schema as any)._parse((validatedData as any)[key], fieldPath);
      } else if (!(schema as any).config?.optional && (schema as any).config?.defaultValue === undefined) {
        // Missing required field - throw structured error
        throw new ZexError(
          path.map(p => p.key || String(p.index || 'root')),
          'missing_required_field',
          `Missing required field '${key}'`,
          undefined,
          'required field from schema'
        );
      } else {
        // Field is optional or has default - apply default if present
        if ((schema as any).config?.optional) {
          // For optional fields, just set to undefined
          result[key] = undefined;
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
    return {
      type: "object",
      additionalProperties: this.valueSchema.toJsonSchema()
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
      return { success: false, error: 'Expected object' };
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
export class ZexUnion<T extends readonly ZexBase<any, any>[]> extends ZexBase<InferProperty<T[number]>> {
  constructor(private schemas: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexUnion(this.schemas, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { anyOf: this.schemas.map(schema => schema.toJsonSchema()) };
  }

  protected transformLua(data: unknown): unknown {
    for (const schema of this.schemas) {
      try { return (schema as any).transformLua(data); } catch {}
    }
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    for (const schema of this.schemas) {
      const result = (schema as any).safeParse(data);
      if (result.success) {
        return { success: true };
      }
    }
    return { success: false, error: 'Value does not match any union type' };
  }

  protected _parse(data: unknown, path: PathEntry[]): InferProperty<T[number]> {
    const errors: ZexError[] = [];
    
    // Try each schema and collect errors
    for (const schema of this.schemas) {
      try {
        const unionPath = [...path, {
          type: 'union',
          schema,
          description: (schema as any).config?.meta?.description
        }];
        return (schema as any)._parse(data, unionPath);
      } catch (error) {
        if (error instanceof ZexError) {
          errors.push(error);
        }
      }
    }
    
    // Find the most specific error (shortest path = most specific)
    const bestError = errors.length > 0 
      ? errors.sort((a, b) => a.path.length - b.path.length)[0]
      : new ZexError(
          path.map(p => p.key || String(p.index || 'root')),
          'union_mismatch',
          'No union variant matched',
          data,
          'one of the union variants'
        );
    
    throw bestError;
  }
}

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
          path.map(p => p.key || String(p.index || 'root')),
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