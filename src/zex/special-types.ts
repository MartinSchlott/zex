// special-types.ts - Special type implementations for Zex
// =============================================================================

import { JsonSchema, ZexConfig } from './types.js';
import { ZexBase } from './base.js';
import { ZexString } from './basic-types.js';

// URI implementation with proper validation
export class ZexUri extends ZexString {
  constructor(config?: Partial<ZexConfig>) {
    super(config);
    // Set format directly to avoid infinite recursion
    this.config.meta.format = 'uri';
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexUri(newConfig) as this;
  }

  // Override to ensure proper type inference
  protected getBaseJsonSchema(): JsonSchema {
    return {
      type: "string",
      format: "uri"
    };
  }

  // Override validateType to add URI validation
  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    const baseValidation = super.validateType(data);
    if (!baseValidation.success) {
      return baseValidation;
    }

    // URI Pattern: scheme:/*/*/.....?a=1&b=2
    // Simple and practical: scheme followed by colon and content
    const uriPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:.*$/;
    if (!uriPattern.test(data as string)) {
      return { success: false, error: 'Invalid URI format. Expected scheme:path format' };
    }

    // Additional validation: scheme should not be empty and should have content after colon
    const parts = (data as string).split(':');
    if (parts.length < 2 || parts[0].length === 0 || parts[1].length === 0) {
      return { success: false, error: 'Invalid URI format. Scheme and path required' };
    }

    return { success: true };
  }
}

// URL implementation (specific URI type)
export class ZexUrl extends ZexString {
  constructor(config?: Partial<ZexConfig>) {
    super(config);
    // Set format directly to avoid infinite recursion
    this.config.meta.format = 'uri-reference';
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexUrl(newConfig) as this;
  }

  // Override to ensure proper type inference
  protected getBaseJsonSchema(): JsonSchema {
    return {
      type: "string",
      format: "uri-reference"
    };
  }

  // Override validateType to add URL validation
  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    const baseValidation = super.validateType(data);
    if (!baseValidation.success) {
      return baseValidation;
    }

    // URL Pattern: http://domain/path?query or https://domain/path?query
    // Practical: allows http:// and https:// with query parameters
    const urlPattern = /^https?:\/\/[^\s]+$/i;
    if (!urlPattern.test(data as string)) {
      return { success: false, error: 'Invalid URL format. Expected http:// or https:// followed by domain and path' };
    }

    // Additional validation: ensure proper domain format
    try {
      const url = new URL(data as string);
      if (!url.hostname || url.hostname.includes('..') || url.hostname.startsWith('.') || url.hostname.endsWith('.')) {
        return { success: false, error: 'Invalid URL format. Invalid domain name' };
      }
    } catch {
      return { success: false, error: 'Invalid URL format. Malformed URL structure' };
    }

    return { success: true };
  }
}

// JSON Schema implementation
export class ZexJsonSchema extends ZexBase<JsonSchema> {
  protected clone(newConfig: ZexConfig): this {
    return new ZexJsonSchema(newConfig) as this;
  }

  protected getBaseJsonSchema(): JsonSchema {
    return {
      type: "object",
      description: "JSON Schema object"
    };
  }

  protected transformLua(data: unknown): unknown {
    return data;
  }
} 