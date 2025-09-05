// literal.ts - Literal implementation
// =============================================================================

import { JsonSchema, ZexConfig } from './types.js';
import { ZexBase } from './base.js';
import { decodePossibleUtf8Bytes } from './utils/lua.js';

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
    // If the literal expects a string, normalize common byte representations
    if (typeof (this as any).value === 'string') {
      return decodePossibleUtf8Bytes(data);
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


