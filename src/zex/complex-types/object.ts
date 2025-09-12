// object.ts - Object type implementation for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from '../types.js';
import { ZexBase } from '../base/index.js';
import { InferObjectType } from './type-helpers.js';

export type ZexObjectMode = "strict" | "passthrough" | "strip";

export class ZexObject<T extends Record<string, ZexBase<any, any>>> extends ZexBase<InferObjectType<T>> {
  constructor(
    public shape: T,
    config?: Partial<ZexConfig>,
    private allowAdditionalProperties: boolean = false,
    private mode: ZexObjectMode = "strict",
    private allOptional: boolean = false,
    private prestripKeys?: Set<string>,
    private prestripByReadOnly: boolean = false,
    private prestripByWriteOnly: boolean = false,
    private removedReadOnlyKeys?: Set<string>,
    private removedWriteOnlyKeys?: Set<string>
  ) {
    super(config);
  }

  passthrough(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "passthrough", this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  strip(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, true, "strip", this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  strict(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, false, "strict", this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexObject(this.shape, newConfig, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys) as this;
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
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  // Remove properties with readOnly: true
  omitReadOnly(): ZexObject<Partial<T> & Record<string, ZexBase<any, any>>> {
    const newShape: Record<string, ZexBase<any, any>> = {};
    const removed = new Set<string>();
    for (const [key, schema] of Object.entries(this.shape)) {
      if ((schema as any).isReadOnly()) {
        removed.add(key);
      } else {
        newShape[key] = schema;
      }
    }
    const mergedRemoved = new Set([...(this.removedReadOnlyKeys || new Set<string>()), ...removed]);
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, mergedRemoved, this.removedWriteOnlyKeys);
  }

  // Remove properties with writeOnly: true
  omitWriteOnly(): ZexObject<Partial<T> & Record<string, ZexBase<any, any>>> {
    const newShape: Record<string, ZexBase<any, any>> = {};
    const removed = new Set<string>();
    for (const [key, schema] of Object.entries(this.shape)) {
      if ((schema as any).isWriteOnly()) {
        removed.add(key);
      } else {
        newShape[key] = schema;
      }
    }
    const mergedRemoved = new Set([...(this.removedWriteOnlyKeys || new Set<string>()), ...removed]);
    return new ZexObject(newShape as any, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, mergedRemoved);
  }

  // Targeted runtime-only stripping: remove only specified keys from input before validation
  stripOnly(...keys: (string | string[])[]): ZexObject<T> {
    const flat: string[] = [];
    for (const k of keys) {
      if (Array.isArray(k)) flat.push(...k);
      else flat.push(k);
    }
    const union = new Set([...(this.prestripKeys || new Set<string>()), ...flat]);
    return new ZexObject(this.shape, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, union, this.prestripByReadOnly, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  // Targeted runtime-only stripping by meta flags
  stripReadOnly(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, true, this.prestripByWriteOnly, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
  }

  stripWriteOnly(): ZexObject<T> {
    return new ZexObject(this.shape, this.config, this.allowAdditionalProperties, this.mode, this.allOptional, this.prestripKeys, this.prestripByReadOnly, true, this.removedReadOnlyKeys, this.removedWriteOnlyKeys);
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
    const incoming = super._parse(data, path) as Record<string, unknown>;
    // Targeted pre-strip selected keys from input before unknown-property checks
    const validatedData: Record<string, unknown> = { ...incoming };
    if (validatedData && typeof validatedData === 'object') {
      if (this.prestripKeys && this.prestripKeys.size > 0) {
        for (const k of this.prestripKeys) {
          if (k in validatedData) delete (validatedData as any)[k];
        }
      }
      if (this.prestripByReadOnly || this.prestripByWriteOnly) {
        // Drop keys that were removed from shape due to readOnly/writeOnly omission
        if (this.prestripByReadOnly && this.removedReadOnlyKeys && this.removedReadOnlyKeys.size > 0) {
          for (const k of this.removedReadOnlyKeys) {
            if (k in validatedData) delete (validatedData as any)[k];
          }
        }
        if (this.prestripByWriteOnly && this.removedWriteOnlyKeys && this.removedWriteOnlyKeys.size > 0) {
          for (const k of this.removedWriteOnlyKeys) {
            if (k in validatedData) delete (validatedData as any)[k];
          }
        }
        for (const [key, schema] of Object.entries(this.shape)) {
          if (this.prestripByReadOnly && (schema as any).isReadOnly()) {
            if (key in validatedData) delete (validatedData as any)[key];
            continue;
          }
          if (this.prestripByWriteOnly && (schema as any).isWriteOnly()) {
            if (key in validatedData) delete (validatedData as any)[key];
          }
        }
      }
    }

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
