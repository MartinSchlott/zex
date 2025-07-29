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
    return data;
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
    
    return { success: false, error: 'Expected binary data (Uint8Array or Buffer)' };
  }
} 