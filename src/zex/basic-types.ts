// basic-types.ts - Basic type implementations for Zex
// =============================================================================

import { JsonSchema, ZexConfig } from './types.js';
import { ZexBase } from './base.js';
import { 
  EmailValidator, 
  UuidValidator, 
  MinLengthValidator, 
  MaxLengthValidator, 
  PatternValidator,
  MinValidator,
  MaxValidator,
  IntValidator
} from './validators.js';

// String implementation
export class ZexString<TFlags extends Record<string, boolean> = {}> extends ZexBase<string, TFlags> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexString(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { type: "string" };
  }

  protected transformLua(data: unknown): unknown {
    // Auto-decode binary data to UTF-8 string for Lua/JSON contexts where strings
    // may be represented as Uint8Array/Buffer. If the schema expects Buffer, that
    // will be handled by ZexBuffer and not reach here.
    try {
      // Uint8Array
      if (data instanceof Uint8Array) {
        return new TextDecoder('utf-8', { fatal: true }).decode(data);
      }
      // ArrayBuffer
      if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(data));
      }
      // Node.js Buffer
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
        const u8 = new Uint8Array(data as unknown as Buffer);
        return new TextDecoder('utf-8', { fatal: true }).decode(u8);
      }
      // JSON-serialized Buffer: { type: 'Buffer', data: number[] }
      if (typeof data === 'object' && data !== null) {
        const obj: any = data;
        if ((obj.type === 'Buffer' || obj._type === 'Buffer') && Array.isArray(obj.data)) {
          const u8 = Uint8Array.from(obj.data as number[]);
          return new TextDecoder('utf-8', { fatal: true }).decode(u8);
        }
      }
    } catch (err) {
      // Propagate decoding failure so union logic or caller can decide
      throw err;
    }
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    return { success: true };
  }

  email(): ZexString<TFlags> {
    return this.addValidator(new EmailValidator()) as ZexString<TFlags>;
  }

  uuid(): ZexString<TFlags> {
    return this.addValidator(new UuidValidator()) as ZexString<TFlags>;
  }

  min(minLength: number): ZexString<TFlags> {
    return this.addValidator(new MinLengthValidator(minLength)) as ZexString<TFlags>;
  }

  max(maxLength: number): ZexString<TFlags> {
    return this.addValidator(new MaxLengthValidator(maxLength)) as ZexString<TFlags>;
  }

  pattern(regex: string): ZexString<TFlags> {
    return this.addValidator(new PatternValidator(regex)) as ZexString<TFlags>;
  }

  // UI hint: multiline support
  multiline(lines?: number): ZexString<TFlags> {
    // Default: no arg => 1
    const value = lines === undefined ? 1 : lines;

    // Reject non-finite numbers
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('multiline() expects a finite number or no argument');
    }

    // Special case: 0 removes the key
    if (value === 0) {
      const meta = { ...this.meta() } as Record<string, unknown>;
      delete (meta as any)['x-ui-multiline'];
      return this.meta(meta) as ZexString<TFlags>;
    }

    // Accept integers and floats (robust), including negatives
    return this.meta({ 'x-ui-multiline': value }) as ZexString<TFlags>;
  }

  getMultiline(): number {
    const meta = this.meta() as Record<string, unknown>;
    const val = meta['x-ui-multiline'];
    if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
    return val;
  }
}

// Number implementation
export class ZexNumber<TFlags extends Record<string, boolean> = {}> extends ZexBase<number, TFlags> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexNumber(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { type: "number" };
  }

  protected transformLua(data: unknown): unknown {
    // Normalize common binary representations to Uint8Array without copying when possible
    if (data instanceof Uint8Array) return data;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return new Uint8Array(data as unknown as Buffer);
    }
    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    if (typeof data === 'object' && data !== null) {
      const obj: any = data;
      if ((obj.type === 'Buffer' || obj._type === 'Buffer') && Array.isArray(obj.data)) {
        return Uint8Array.from(obj.data as number[]);
      }
    }
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'number') {
      return { success: false, error: 'Expected number' };
    }
    return { success: true };
  }

  min(min: number): ZexNumber<TFlags> {
    return this.addValidator(new MinValidator(min)) as ZexNumber<TFlags>;
  }

  max(max: number): ZexNumber<TFlags> {
    return this.addValidator(new MaxValidator(max)) as ZexNumber<TFlags>;
  }

  int(): ZexNumber<TFlags> {
    return this.addValidator(new IntValidator()) as ZexNumber<TFlags>;
  }
}

// Boolean implementation
export class ZexBoolean<TFlags extends Record<string, boolean> = {}> extends ZexBase<boolean, TFlags> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexBoolean(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { type: "boolean" };
  }

  protected transformLua(data: unknown): unknown {
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'boolean') {
      return { success: false, error: 'Expected boolean' };
    }
    return { success: true };
  }
}

// Any implementation - should return 'any' for Zod compatibility
export class ZexAny<TFlags extends Record<string, boolean> = {}> extends ZexBase<any, TFlags> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexAny(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return {}; // any has no JSON Schema constraints
  }

  protected transformLua(data: unknown): unknown {
    // Recursively normalize: bytes → UTF-8 JS string (fatal), Lua arrays 1..N → arrays
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const isZeroBasedByteObject = (obj: Record<string, unknown>): Uint8Array | null => {
      const keys = Object.keys(obj);
      if (keys.length === 0) return null;
      // all numeric keys 0..N-1
      if (!keys.every(k => /^\d+$/.test(k))) return null;
      const ints = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
      for (let i = 0; i < ints.length; i++) if (ints[i] !== i) return null;
      // values 0..255
      for (const k of keys) {
        const v = (obj as any)[k];
        if (typeof v !== 'number' || v < 0 || v > 255 || !Number.isInteger(v)) return null;
      }
      const arr = new Uint8Array(ints.length);
      for (let i = 0; i < ints.length; i++) arr[i] = (obj as any)[String(i)] as number;
      return arr;
    };
    const normalize = (node: unknown): unknown => {
      if (node instanceof Uint8Array) return decoder.decode(node);
      if (typeof ArrayBuffer !== 'undefined' && node instanceof ArrayBuffer) return decoder.decode(new Uint8Array(node));
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(node)) return decoder.decode(new Uint8Array(node as unknown as Buffer));
      if (Array.isArray(node)) return node.map(normalize);
      if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>;
        // JSON-serialized Buffer
        if ((obj as any).type === 'Buffer' && Array.isArray((obj as any).data)) {
          const u8 = Uint8Array.from(((obj as any).data as number[]));
          return decoder.decode(u8);
        }
        // Zero-based byte object (0..N)
        const possible = isZeroBasedByteObject(obj);
        if (possible) return decoder.decode(possible);
        // Lua array 1..N → array
        const keys = Object.keys(obj);
        if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
          const ints = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
          let isOneBasedContiguous = true;
          for (let i = 0; i < ints.length; i++) if (ints[i] !== i + 1) { isOneBasedContiguous = false; break; }
          if (isOneBasedContiguous) {
            const arr: unknown[] = [];
            for (const n of ints) arr.push(normalize((obj as any)[String(n)]));
            return arr;
          }
        }
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) out[k] = normalize(v);
        return out;
      }
      return node;
    };
    return normalize(data);
  }

  // Override validateType to accept anything
  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    return { success: true }; // any accepts everything
  }
}

// Enum implementation
export class ZexEnum<T extends readonly unknown[], TFlags extends Record<string, boolean> = {}> extends ZexBase<T[number], TFlags> {
  constructor(private values: T, config?: Partial<ZexConfig>) {
    super(config);
  }

  get options(): T {
    return this.values;
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexEnum(this.values, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return {
      enum: this.values as unknown as unknown[]
    };
  }

  protected transformLua(data: unknown): unknown {
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (!(this.values as readonly unknown[]).includes(data as T[number])) {
      return { success: false, error: `Expected one of [${this.values.join(', ')}], got ${JSON.stringify(data)}` };
    }
    return { success: true };
  }
}

// Null implementation
export class ZexNull extends ZexBase<null> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexNull(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { type: "null" };
  }

  protected transformLua(data: unknown): unknown {
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (data !== null) {
      return { success: false, error: 'Expected null' };
    }
    return { success: true };
  }
}

// Buffer implementation for binary data
export class ZexBuffer<TFlags extends Record<string, boolean> = {}> extends ZexBase<Uint8Array, TFlags> {
  constructor(private mimeType?: string, config?: Partial<ZexConfig>) {
    super(config);
    // Add MIME type to meta if provided
    if (mimeType) {
      this.config.meta = { ...this.config.meta, contentMediaType: mimeType };
    }
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexBuffer(this.mimeType, newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    const schema: JsonSchema = {
      type: "object",
      format: "buffer"
    };
    
    // Add contentMediaType if MIME type is set
    if (this.mimeType) {
      schema.contentMediaType = this.mimeType;
    }
    
    return schema;
  }

  protected transformLua(data: unknown): unknown {
    return data;
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    // Accept Uint8Array (universal)
    if (data instanceof Uint8Array) {
      return { success: true };
    }
    
    // Accept Buffer (Node.js compatibility)
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return { success: true };
    }
    
    // Accept ArrayBuffer (normalize upstream in transformLua)
    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      return { success: true };
    }
    
    // Accept JSON-serialized Buffer shape: { type: 'Buffer', data: number[] }
    if (typeof data === 'object' && data !== null) {
      const obj: any = data;
      if ((obj.type === 'Buffer' || obj._type === 'Buffer') && Array.isArray(obj.data)) {
        return { success: true };
      }
    }
    
    return { success: false, error: 'Expected binary data (Uint8Array or Buffer)' };
  }
} 