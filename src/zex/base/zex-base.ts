// zex-base.ts - Base class for all Zex types with Flag-Tracking
// =============================================================================

import { JsonSchema, ValidationResult, ZexConfig, Validator, PathEntry, ParseContext, ZexError } from '../types.js';
import { beginExportCtx, endExportCtx, getCurrentExportCtx } from './export-context.js';

// Base class for all Zex types with Flag-Tracking
export abstract class ZexBase<T, TFlags extends Record<string, boolean> = {}> {
  // Type-only brand to carry flag information reliably through intersections
  declare protected __zexFlags?: TFlags;
  protected config: ZexConfig = {
    optional: false,
    nullable: false,
    validators: [],
    meta: {}
  };

  constructor(config?: Partial<ZexConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Abstract clone method - each subclass must implement this
  protected abstract clone(newConfig: ZexConfig): this;

  // Metadata methods
  title(title: string): this {
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, title }
    };
    return this.clone(newConfig);
  }

  // JSON Schema annotations for access intent
  readOnly(flag: boolean = true): this {
    const newMeta = { ...this.config.meta } as Record<string, unknown>;
    if (flag) {
      (newMeta as any).readOnly = true;
    } else {
      delete (newMeta as any).readOnly;
    }
    const newConfig: ZexConfig = {
      ...this.config,
      meta: newMeta
    };
    return this.clone(newConfig);
  }

  writeOnly(flag: boolean = true): this {
    const newMeta = { ...this.config.meta } as Record<string, unknown>;
    if (flag) {
      (newMeta as any).writeOnly = true;
    } else {
      delete (newMeta as any).writeOnly;
    }
    const newConfig: ZexConfig = {
      ...this.config,
      meta: newMeta
    };
    return this.clone(newConfig);
  }

  isReadOnly(): boolean {
    return this.config.meta.readOnly === true;
  }

  isWriteOnly(): boolean {
    return this.config.meta.writeOnly === true;
  }

  describe(description: string): this {
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, description }
    };
    return this.clone(newConfig);
  }

  example(example: T): this {
    const examples = this.config.meta.examples ? [...this.config.meta.examples] : [];
    examples.push(example);
    
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, examples }
    };
    return this.clone(newConfig);
  }

  format(format: string): this {
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, format }
    };
    return this.clone(newConfig);
  }

  deprecated(isDeprecated: boolean = true): this {
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, deprecated: isDeprecated }
    };
    return this.clone(newConfig);
  }

  // Method overloading for meta
  meta(): Record<string, unknown>;
  meta(meta: Record<string, unknown>): this;
  meta(meta?: Record<string, unknown>): this | Record<string, unknown> {
    if (meta) {
      const newConfig: ZexConfig = {
        ...this.config,
        meta: { ...this.config.meta, ...meta }
      };
      return this.clone(newConfig);
    }
    return this.config.meta;
  }

  // Convenience method to set content media type (MIME type) in meta
  mimeFormat(mimeType: string): this {
    const newConfig: ZexConfig = {
      ...this.config,
      meta: { ...this.config.meta, contentMediaType: mimeType }
    };
    return this.clone(newConfig);
  }

  // Transformation methods with proper Flag-Tracking AND IMMUTABILITY
  optional(): this & ZexBase<T, TFlags & { optional: true }> & { __zexFlags: TFlags & { optional: true } } {
    const newConfig: ZexConfig = {
      ...this.config,
      optional: true
    };
    return this.clone(newConfig) as unknown as this & ZexBase<T, TFlags & { optional: true }> & { __zexFlags: TFlags & { optional: true } };
  }

  nullable(): this & ZexBase<T, TFlags & { nullable: true }> & { __zexFlags: TFlags & { nullable: true } } {
    const newConfig: ZexConfig = {
      ...this.config,
      nullable: true
    };
    return this.clone(newConfig) as unknown as this & ZexBase<T, TFlags & { nullable: true }> & { __zexFlags: TFlags & { nullable: true } };
  }

  default(defaultValue: T): this & ZexBase<NonNullable<T>, Omit<TFlags, 'optional'>> & { __zexFlags: Omit<TFlags, 'optional'> } {
    const newConfig: ZexConfig = {
      ...this.config,
      defaultValue,
      optional: false // Default removes optional
    };
    return this.clone(newConfig) as unknown as this & ZexBase<NonNullable<T>, Omit<TFlags, 'optional'>> & { __zexFlags: Omit<TFlags, 'optional'> };
  }

  // Validation methods
  parse(data: unknown, context?: ParseContext): T {
    const path: PathEntry[] = [];
    if (context?.rootDescription) {
      path.push({ 
        type: 'root', 
        description: context.rootDescription, 
        schema: this 
      });
    }
    return this._parse(data, path);
  }

  safeParse(data: unknown, context?: ParseContext): { success: true; data: T } | { success: false; error: string } {
    try {
      const result = this.parse(data, context);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  parseFromLua(luaData: unknown, context?: ParseContext): T {
    const path: PathEntry[] = [];
    if (context?.rootDescription) {
      path.push({ 
        type: 'root', 
        description: context.rootDescription, 
        schema: this 
      });
    }
    return this._parseFromLua(luaData, path);
  }

  safeParseFromLua(luaData: unknown, context?: ParseContext): { success: true; data: T } | { success: false; error: string } {
    try {
      const result = this.parseFromLua(luaData, context);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Internal parse methods with path tracking
  protected _parse(data: unknown, path: PathEntry[]): T {
    // Check for circular references
    if (this.hasCircularReference(path)) {
      throw new ZexError(
        path.map(p => p.key || String(p.index || 'root')),
        'circular_reference',
        `Circular reference detected`,
        undefined,
        'no circular references allowed'
      );
    }

    // Check depth limit
    if (path.length > 100) {
      throw new ZexError(
        path.map(p => p.key || String(p.index || 'root')),
        'max_depth',
        `Maximum depth exceeded`,
        undefined,
        'depth limit: 100'
      );
    }

    // --- INTELLIGENTES DEFAULT-VERHALTEN ---
    // Default greift bei 'undefined' ODER bei 'null', wenn das Schema NICHT nullable ist.
    if ((data === undefined || (data === null && !this.config.nullable)) 
        && this.config.defaultValue !== undefined) {
      return this.config.defaultValue as T;
    }
    // --- ENDE ---

    // Handle optional/nullable NACH der Default-Prüfung
    if (data === undefined && this.config.optional) {
      return undefined as T;
    }
    if (data === null && this.config.nullable) {
      return null as T;
    }

    // Basic type validation
    const typeValidation = this.validateType(data);
    if (!typeValidation.success) {
      const formattedMessage = this.formatValidationError((typeValidation as any).error, path);
      throw new ZexError(
        path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
        'type_mismatch', 
        formattedMessage,
        data,
        'expected type from schema'
      );
    }

    // Run validators
    for (const validator of this.config.validators) {
      const result = validator.validate(data);
      if (!result.success) {
        const formattedMessage = this.formatValidationError((result as any).error, path);
        throw new ZexError(
          path.map(p => (p.key ?? (p.index !== undefined ? String(p.index) : 'root'))),
          'validation_failed',
          formattedMessage,
          data,
          'validated by schema constraints'
        );
      }
    }

    return data as T;
  }

  protected _parseFromLua(luaData: unknown, path: PathEntry[]): T {
    const transformedData = this.transformLua(luaData);
    return this._parse(transformedData, path);
  }

  // Path tracking utilities
  private hasCircularReference(path: PathEntry[]): boolean {
    // Only check for circular references if we have a path (not at root level)
    if (path.length === 0) return false;
    
    // Check if this schema appears more than once in the path
    const occurrences = path.filter(entry => entry.schema === this).length;
    return occurrences > 1;
  }

  private formatPath(path: PathEntry[]): string {
    if (path.length === 0) return 'root';
    
    const parts: string[] = [];
    for (const entry of path) {
      if (entry.type === 'root') {
        parts.push(entry.description || 'root');
      } else if (entry.type === 'object' && entry.key) {
        parts.push(entry.key);
      } else if (entry.type === 'array' && entry.index !== undefined) {
        parts.push(entry.index.toString());
      } else if (entry.type === 'union') {
        parts.push('union');
      } else if (entry.type === 'tuple' && entry.index !== undefined) {
        parts.push(entry.index.toString());
      }
    }
    return parts.join('.');
  }

  private formatValidationError(error: string, path: PathEntry[]): string {
    const pathString = this.formatPath(path);
    const descriptions = this.getPathDescriptions(path);
    
    let message = `Validation failed at: ${pathString}`;
    if (descriptions.length > 0) {
      message += `\n   Context: ${descriptions.join(' → ')}`;
    }
    message += `\n   Error: ${error}`;
    
    return message;
  }

  private getPathDescriptions(path: PathEntry[]): string[] {
    return path
      .map(entry => entry.description)
      .filter(desc => desc !== undefined) as string[];
  }

  // Basic type validation - to be overridden by subclasses
  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    return { success: true };
  }

  // JSON Schema generation
  toJsonSchema(options?: { additionalProperties?: boolean; $schema?: string }): JsonSchema {
    const currentExportCtx = getCurrentExportCtx();
    const isRoot = currentExportCtx === null;
    if (isRoot) beginExportCtx();

    const baseSchema = this.getBaseJsonSchema();
    
    // Sammle und verbinde die JSON-Schema-Eigenschaften der Validatoren
    const validatorSchemas = this.config.validators.map(validator => 
      validator.getJsonSchema()
    );
    
    // Verbinde alle Validator-Eigenschaften (letzter gewinnt bei Konflikten)
    const mergedValidators = Object.assign({}, ...validatorSchemas);
    
    let schema: JsonSchema = {
      ...baseSchema,
      ...mergedValidators,
      ...this.config.meta // Meta-Daten haben die höchste Priorität
    };

    // Include default value in JSON schema if present
    if (this.config.defaultValue !== undefined) {
      schema.default = this.config.defaultValue;
    }

    if (options?.additionalProperties !== undefined) {
      schema.additionalProperties = options.additionalProperties;
    }

    if (isRoot) {
      // Attach $schema and $defs at root (lazy defs may remain placeholders)
      if (options?.$schema) {
        (schema as any).$schema = options.$schema;
      }
      const currentCtx = getCurrentExportCtx();
      if (currentCtx && Object.keys(currentCtx.defs).length > 0) {
        (schema as any).$defs = currentCtx.defs;
      }
      endExportCtx();
    }

    return schema;
  }

  // Alias for compatibility
  toJSONSchema(options?: { additionalProperties?: boolean; $schema?: string }): JsonSchema {
    return this.toJsonSchema(options);
  }

  // Abstract methods to be implemented by subclasses
  protected abstract getBaseJsonSchema(): JsonSchema;
  protected abstract transformLua(data: unknown): unknown;

  // Utility methods
  protected addValidator(validator: Validator): this {
    const newConfig: ZexConfig = {
      ...this.config,
      validators: [...this.config.validators, validator]
    };
    return this.clone(newConfig);
  }

  protected getMeta(): Record<string, unknown> {
    return this.config.meta;
  }
}
