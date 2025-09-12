// unions.ts - Union and Discriminated Union implementations (extracted)
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig, ZexError } from './types.js';
import { ZexBase } from './base/index.js';
import { ZexObject } from './complex-types/index.js';
import { decodePossibleUtf8Bytes } from './utils/lua.js';

// =============================================================================
// Union implementation
// =============================================================================
export class ZexUnion<T extends readonly ZexBase<any, any>[]> extends ZexBase<
  T[number] extends ZexBase<infer U, infer Flags>
    ? (Flags extends { nullable: true } ? U | null : U) extends infer FinalU
      ? Flags extends { optional: true }
        ? FinalU | undefined
        : FinalU
      : never
    : never
> {
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
    const dataType = typeof data;
    return { success: false, error: `Value does not match any union type. Got ${dataType}` };
  }

  protected _parse(data: unknown, path: PathEntry[]): any {
    const errors: ZexError[] = [];
    for (let i = 0; i < this.schemas.length; i++) {
      const schema = this.schemas[i];
      try {
        const unionPath = [...path, {
          type: 'union' as const,
          schema,
          description: (schema as any).config?.meta?.description
        }];
        const result = (schema as any)._parse(data, unionPath);
        return result;
      } catch (error) {
        if (error instanceof ZexError) {
          errors.push(error);
        }
      }
    }
    let message = 'No union variant matched.';
    if (errors.length > 0) {
      message += '\nUnion alternative errors:';
      for (let i = 0; i < errors.length; i++) {
        const err = errors[i];
        message += `\n- Alternative ${i}: ${err.message}`;
      }
    }
    const bestError = errors.length > 0
      ? errors.sort((a, b) => a.path.length - b.path.length)[0]
      : new ZexError(
          path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
          'union_mismatch',
          `No union variant matched. Got ${typeof data}`,
          data,
          'one of the union variants'
        );
    bestError.message = message;
    throw bestError;
  }
}

// =============================================================================
// Discriminated Union implementation
// =============================================================================
export class ZexDiscriminatedUnion<
  K extends string,
  T extends readonly ZexObject<Record<string, ZexBase<any, any>>>[]
> extends ZexBase<
  T[number] extends ZexBase<infer U, infer Flags>
    ? (Flags extends { nullable: true } ? U | null : U) extends infer FinalU
      ? Flags extends { optional: true }
        ? FinalU | undefined
        : FinalU
      : never
    : never
> {
  private valueToSchema: Map<unknown, ZexObject<Record<string, ZexBase<any, any>>>>;

  constructor(
    private discriminatorKey: K,
    private variants: T,
    config?: Partial<ZexConfig>
  ) {
    super(config);
    this.valueToSchema = new Map();
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const shape = (variant as ZexObject<Record<string, ZexBase<any, any>>>).shape as Record<string, ZexBase<any, any>>;
      if (!shape || typeof shape !== 'object') {
        throw new Error(`discriminatedUnion: Variant ${i} is not an object schema`);
      }
      const discSchema = shape[this.discriminatorKey];
      if (!discSchema) {
        throw new Error(`discriminatedUnion: Variant ${i} is missing discriminator '${this.discriminatorKey}'`);
      }
      const discJson = discSchema.toJsonSchema();
      if (!('const' in discJson)) {
        throw new Error(`discriminatedUnion: Variant ${i} discriminator '${this.discriminatorKey}' must be a literal (const)`);
      }
      const variantJson = variant.toJsonSchema();
      const requiredList = Array.isArray(variantJson.required) ? variantJson.required : [];
      if (!requiredList.includes(this.discriminatorKey)) {
        throw new Error(`discriminatedUnion: Variant ${i} discriminator '${this.discriminatorKey}' must be required`);
      }
      const discValue = (discJson as any).const;
      if (this.valueToSchema.has(discValue)) {
        throw new Error(`discriminatedUnion: Duplicate discriminator value '${String(discValue)}'`);
      }
      this.valueToSchema.set(discValue, variant);
    }
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexDiscriminatedUnion(this.discriminatorKey, this.variants, newConfig) as this;
  }

  // Opt-in OpenAPI discriminator helper (parity with previous location)
  openApiDiscriminator(mapping?: Record<string, string>): this {
    const discriminator = {
      propertyName: this.discriminatorKey,
      ...(mapping ? { mapping } : {})
    } as Record<string, unknown>;
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, discriminator }
    };
    return this.clone(newConfig);
  }

  protected getBaseJsonSchema(): JsonSchema {
    return { 
      anyOf: this.variants.map(schema => schema.toJsonSchema()),
      discriminator: {
        propertyName: this.discriminatorKey
      }
    };
  }

  // Normalize discriminator before delegating transform to the matched variant
  protected transformLua(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;
    const original = (data as any)[this.discriminatorKey];
    const normalized = decodePossibleUtf8Bytes(original);
    const schema = this.valueToSchema.get(normalized);
    if (!schema) return data;
    const patched = { ...(data as any), [this.discriminatorKey]: normalized };
    return (schema as any).transformLua(patched);
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    if (typeof data !== 'object' || data === null) {
      const dataType = typeof data;
      return { success: false, error: `Expected object for discriminated union, got ${dataType}` };
    }
    const hasDisc = Object.prototype.hasOwnProperty.call(data as object, this.discriminatorKey);
    if (!hasDisc) {
      const expected = Array.from(this.valueToSchema.keys()).map(v => JSON.stringify(v)).join(' | ');
      return { success: false, error: `Missing discriminant '${this.discriminatorKey}'. Expected one of: ${expected}` };
    }
    return { success: true };
  }

  protected _parse(data: unknown, path: PathEntry[]): any {
    const validatedData = super._parse(data, path) as Record<string, unknown>;

    const discValue = (validatedData as any)[this.discriminatorKey];
    const schema = this.valueToSchema.get(discValue);
    if (!schema) {
      const expected = Array.from(this.valueToSchema.keys()).map(v => JSON.stringify(v)).join(' | ');
      throw new ZexError(
        path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
        'invalid_discriminant',
        `Invalid discriminant value for '${this.discriminatorKey}': ${JSON.stringify(discValue)}. Expected one of: ${expected}`,
        discValue,
        expected
      );
    }

    const unionPath = [...path, {
      type: 'union' as const,
      schema,
      description: (schema as any).config?.meta?.description
    }];
    return (schema as any)._parse(validatedData, unionPath);
  }
}


