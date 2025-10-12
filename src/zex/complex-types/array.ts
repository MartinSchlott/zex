// array.ts - Array type implementation for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from '../types.js';
import { ZexBase } from '../base/index.js';
import { 
  ArrayMinLengthValidator,
  ArrayMaxLengthValidator
} from '../validators.js';
import { InferProperty } from './type-helpers.js';

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
        // Accept both 1-based (1..N) and 0-based (0..N-1) contiguous numeric keys
        const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
        const ints = sortedKeys.map(k => parseInt(k));
        if (ints.length > 0) {
          const isZeroBased = ints[0] === 0;
          const isOneBased = ints[0] === 1;
          if (isZeroBased || isOneBased) {
            for (let i = 0; i < ints.length; i++) {
              const expected = isZeroBased ? i : i + 1;
              if (ints[i] !== expected) return data; // has holes or wrong base
            }
            const result: unknown[] = [];
            for (let i = 0; i < sortedKeys.length; i++) {
              const key = sortedKeys[i];
              result.push((this.itemSchema as any).transformLua((data as any)[key]));
            }
            return result;
          }
        }
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
