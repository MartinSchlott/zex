// tuple.ts - Tuple type implementation for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from '../types.js';
import { ZexBase } from '../base/index.js';
import { InferTuple } from './type-helpers.js';

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
