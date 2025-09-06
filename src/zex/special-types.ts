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

    const urlString = data as string;

    // Comprehensive URL Pattern: https://domain:port/path?query#fragment
    // Allows http:// and https:// with optional port, path, query, and fragment
    const urlPattern = /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.-])*)?(?:\?(?:[\w&=%.~!$'()*+,;:@\/-])*)?(?:#(?:[\w.~!$'()*+,;:@\/-])*)?$/i;
    
    if (!urlPattern.test(urlString)) {
      return { success: false, error: 'Invalid URL format. Expected http:// or https:// followed by valid domain and optional path/query/fragment' };
    }

    // Extract and validate hostname part
    const hostnameMatch = urlString.match(/^https?:\/\/([^\/\s:]+)/i);
    if (!hostnameMatch) {
      return { success: false, error: 'Invalid URL format. Missing or invalid hostname' };
    }

    const hostname = hostnameMatch[1];
    
    // Validate hostname: no consecutive dots, no leading/trailing dots
    if (hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return { success: false, error: 'Invalid URL format. Invalid domain name' };
    }

    // Validate hostname contains at least one dot (for domain) or is localhost
    if (!hostname.includes('.') && hostname !== 'localhost') {
      return { success: false, error: 'Invalid URL format. Domain must contain a dot or be localhost' };
    }

    // Validate port if present
    const portMatch = urlString.match(/^https?:\/\/[^\/\s:]+:([0-9]+)/i);
    if (portMatch) {
      const port = parseInt(portMatch[1], 10);
      if (port < 1 || port > 65535) {
        return { success: false, error: 'Invalid URL format. Port must be between 1 and 65535' };
      }
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
      format: "jsonschema",
      description: "JSON Schema object"
    };
  }

  protected transformLua(data: unknown): unknown {
    // Recursively normalize Lua-style arrays and decode byte-like objects into JS strings
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const isZeroBasedByteObject = (obj: Record<string, unknown>): Uint8Array | null => {
      const keys = Object.keys(obj);
      if (keys.length === 0) return null;
      if (!keys.every(k => /^\d+$/.test(k))) return null;
      const ints = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
      for (let i = 0; i < ints.length; i++) if (ints[i] !== i) return null;
      for (const k of keys) {
        const v = (obj as any)[k];
        if (typeof v !== 'number' || v < 0 || v > 255 || !Number.isInteger(v)) return null;
      }
      const arr = new Uint8Array(ints.length);
      for (let i = 0; i < ints.length; i++) arr[i] = (obj as any)[String(i)] as number;
      return arr;
    };
    const visited = new WeakSet<object>();
    let nodes = 0;
    const maxNodes = 10000;
    const normalize = (node: unknown): unknown => {
      nodes++;
      if (nodes > maxNodes) return node;
      if (node instanceof Uint8Array) return decoder.decode(node);
      if (typeof ArrayBuffer !== 'undefined' && node instanceof ArrayBuffer) return decoder.decode(new Uint8Array(node));
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(node)) return decoder.decode(new Uint8Array(node as unknown as Buffer));
      if (Array.isArray(node)) {
        return node.map(normalize);
      }
      if (node && typeof node === 'object') {
        if (visited.has(node as object)) return node;
        visited.add(node as object);
        const obj = node as Record<string, unknown>;
        // JSON-serialized Buffer
        if ((obj as any).type === 'Buffer' && Array.isArray((obj as any).data)) {
          const u8 = Uint8Array.from(((obj as any).data as number[]));
          return decoder.decode(u8);
        }
        // Zero-based byte object → string
        const possible = isZeroBasedByteObject(obj);
        if (possible) return decoder.decode(possible);
        const keys = Object.keys(obj);
        if (keys.length === 0) return {};
        // Check for numeric string keys 1..N contiguous
        const areNumeric = keys.every(k => /^\d+$/.test(k));
        if (areNumeric) {
          const sorted = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
          // Ensure contiguous from 1..N
          let contiguous = true;
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i] !== i + 1) { contiguous = false; break; }
          }
          if (contiguous) {
            const arr: unknown[] = [];
            for (const n of sorted) {
              arr.push(normalize((obj as any)[String(n)]));
            }
            return arr;
          }
        }
        // Regular object: recurse values
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = normalize(v);
        }
        return out;
      }
      return node;
    };
    return normalize(data);
  }
} 