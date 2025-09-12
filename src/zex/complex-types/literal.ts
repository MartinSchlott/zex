// literal.ts - Literal type implementation for Zex
// =============================================================================

import { JsonSchema, ZexConfig } from '../types.js';
import { ZexBase } from '../base/index.js';

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
