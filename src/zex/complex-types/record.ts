// record.ts - Record type implementation for Zex
// =============================================================================

import { JsonSchema, ZexConfig } from '../types.js';
import { ZexBase } from '../base/index.js';
import { ZexAny } from '../basic-types.js';
import { InferProperty } from './type-helpers.js';

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
