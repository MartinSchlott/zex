// zex-base.ts - Base class for all Zex types with Flag-Tracking
// =============================================================================

import { JsonSchema, ValidationResult, ZexConfig, Validator, PathEntry, ParseContext, ZexError } from '../types.js';
import { RefineValidator } from '../validators.js';
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

  // Delta APIs
  // =============================================================================
  // parseDelta: validate a value against the sub-schema at a JSON Pointer path
  parseDelta(path: string, value: unknown): unknown {
    const segments = this.normalizeAndSplitPointer(path);
    if (segments.length === 0) {
      return (this as any).parse(value);
    }
    const { targetSchema, pathForError } = this.resolveSchemaForDelta(segments);
    // Deletion via undefined is allowed only for optional object properties; this is enforced
    // by the target schema itself: parsing undefined succeeds only if optional.
    return (targetSchema as any).parse(value);
  }

  safeParseDelta(path: string, value: unknown): { success: true; data: unknown } | { success: false; error: string } {
    try {
      const data = this.parseDelta(path, value);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // replace: apply replace-only delta at path to an existing instance, returning a new validated instance
  replace(instance: T, path: string, value: unknown): T {
    const segments = this.normalizeAndSplitPointer(path);
    // Root replacement
    if (segments.length === 0) {
      if (value === undefined) {
        throw new ZexError(['root'], 'invalid_delete', `Cannot delete root with undefined`, undefined, 'non-undefined root');
      }
      return this.parse(value);
    }

    // Resolve schema and parent containers using current instance
    const { parentContainers, leafKeyOrIndex, leafSchema, containerKind } = this.resolveForReplace(instance as any, segments);

    // Deletion semantics for object properties only
    if (value === undefined) {
      if (containerKind !== 'object') {
        throw new ZexError(segments.map(s => String(s)), 'invalid_delete', `Deletion via undefined is only allowed for optional object properties`, undefined, 'optional object property');
      }
      const isOptional = !!((leafSchema as any)?.config?.optional);
      if (!isOptional) {
        throw new ZexError(segments.map(s => String(s)), 'invalid_delete_required', `Cannot delete required property '${String(leafKeyOrIndex)}'`, undefined, 'optional property');
      }
    } else {
      // Local validation against sub-schema
      (leafSchema as any).parse(value);
    }

    // Apply immutable update
    let newChild: any;
    if (value === undefined) {
      newChild = undefined; // signal deletion for object property
    } else {
      newChild = (leafSchema as any).parse(value);
    }

    // Rebuild containers from leaf to root
    let updated: any;
    const last = parentContainers[parentContainers.length - 1];
    if (last.kind === 'object') {
      const copy = { ...(last.value as any) };
      if (value === undefined) delete copy[leafKeyOrIndex as string];
      else copy[leafKeyOrIndex as string] = newChild;
      updated = copy;
    } else if (last.kind === 'array') {
      const idx = leafKeyOrIndex as number;
      const arr = Array.isArray(last.value) ? [...(last.value as any[])] : (() => { throw new ZexError(segments.map(s => String(s)), 'type_mismatch', 'Expected array at parent container', last.value, 'array'); })();
      arr[idx] = newChild;
      updated = arr;
    } else {
      throw new ZexError(segments.map(s => String(s)), 'invalid_container', `Unsupported parent container kind '${last.kind}'`, undefined, 'object or array');
    }

    // Bubble up
    for (let i = parentContainers.length - 2; i >= 0; i--) {
      const frame = parentContainers[i];
      if (frame.kind === 'object') {
        const copy = { ...(frame.value as any) };
        copy[frame.keyOrIndex as string] = updated;
        updated = copy;
      } else if (frame.kind === 'array') {
        const arr = Array.isArray(frame.value) ? [...(frame.value as any[])] : (() => { throw new ZexError(segments.map(s => String(s)), 'type_mismatch', 'Expected array while rebuilding containers', frame.value, 'array'); })();
        arr[frame.keyOrIndex as number] = updated;
        updated = arr;
      } else {
        // Root container: should not occur here
        throw new ZexError(segments.map(s => String(s)), 'invalid_container', `Invalid container during rebuild`, undefined, 'object or array');
      }
    }

    // Full root validation (may apply defaults etc.)
    return this.parse(updated);
  }

  safeReplace(instance: T, path: string, value: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
      const data = this.replace(instance, path, value);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Internal helpers for delta/replace
  // =============================================================================
  private normalizeAndSplitPointer(path: string): (string | number)[] {
    if (path == null) return [];
    const trimmed = String(path);
    if (trimmed === '' || trimmed === '/') return [];
    const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const parts = withSlash.split('/').slice(1).map(seg => this.decodePointerSegment(seg));
    return parts;
  }

  private decodePointerSegment(seg: string): string {
    // JSON Pointer decoding: ~1 => /, ~0 => ~
    return seg.replace(/~1/g, '/').replace(/~0/g, '~');
  }

  private resolveSchemaForDelta(segments: (string | number)[]): { targetSchema: any; pathForError: string[] } {
    let schema: any = this;
    const pathStr: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      pathStr.push(String(seg));
      // Lazy unwrap
      if ((schema as any)?.getSchema && typeof (schema as any).getSchema === 'function') {
        schema = (schema as any).getSchema();
      }
      // Discriminated union: only allow replacing whole union or the discriminator key directly
      if ((schema as any)?.discriminatorKey && (schema as any)?.variants) {
        const disc = (schema as any).discriminatorKey as string;
        if (i === segments.length - 1 && seg === disc) {
          const anyVariant = (schema as any).variants[0];
          const next = (anyVariant as any).shape?.[disc];
          if (!next) throw new ZexError(pathStr, 'unknown_property', `Unknown property '${disc}' in discriminated union`, undefined, 'discriminator property');
          return { targetSchema: next, pathForError: pathStr };
        }
        if (i < segments.length - 1) {
          throw new ZexError(pathStr, 'union_path_requires_instance', `Cannot resolve path under discriminated union without instance. Use replace().`, undefined, 'instance-based traversal');
        }
        // i === last: replacing whole union
        return { targetSchema: schema, pathForError: pathStr };
      }
      // Tuple first: distinguish from plain union
      if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && (schema as any)?.getBaseJsonSchema?.().prefixItems !== undefined) {
        const idx = this.parseArrayIndex(seg, pathStr);
        const arr = (schema as any).schemas as any[];
        if (idx < 0 || idx >= arr.length) {
          throw new ZexError(pathStr, 'index_out_of_range', `Tuple index ${idx} out of range`, idx, `0..${arr.length - 1}`);
        }
        schema = arr[idx];
        continue;
      }
      // Plain union (exclude tuples): can only replace entire union; deeper traversal needs instance
      if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && !(schema as any)?.shape && !((schema as any)?.getBaseJsonSchema?.().prefixItems !== undefined)) {
        if (i < segments.length - 1) {
          throw new ZexError(pathStr, 'union_path_requires_instance', `Cannot resolve path under union without instance. Use replace().`, undefined, 'instance-based traversal');
        }
        return { targetSchema: schema, pathForError: pathStr };
      }
      // Object
      if ((schema as any)?.shape) {
        const next = (schema as any).shape[String(seg)];
        if (!next) {
          throw new ZexError(pathStr, 'unknown_property', `Unknown property '${String(seg)}'`, undefined, 'property defined in schema');
        }
        schema = next;
        continue;
      }
      // Record
      if ((schema as any)?.valueSchema && !(schema as any)?.shape) {
        schema = (schema as any).valueSchema;
        continue;
      }
      // Array
      if ((schema as any)?.itemSchema) {
        const idx = this.parseArrayIndex(seg, pathStr);
        schema = (schema as any).itemSchema;
        continue;
      }
      // (Tuple handled above)
      throw new ZexError(pathStr, 'invalid_path', `Cannot traverse into schema at segment '${String(seg)}'`, undefined, 'object/array/record/union');
    }
    return { targetSchema: schema, pathForError: pathStr };
  }

  private resolveForReplace(instance: any, segments: (string | number)[]): {
    parentContainers: { kind: 'object' | 'array'; value: any; keyOrIndex: string | number }[];
    leafKeyOrIndex: string | number;
    leafSchema: any;
    containerKind: 'object' | 'array';
  } {
    let schema: any = this;
    let value: any = instance;
    const parents: { kind: 'object' | 'array'; value: any; keyOrIndex: string | number }[] = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      // Unwrap lazy
      if ((schema as any)?.getSchema && typeof (schema as any).getSchema === 'function') {
        schema = (schema as any).getSchema();
      }
      // Discriminated union: select variant by instance
      if ((schema as any)?.discriminatorKey && (schema as any)?.variants) {
        if (typeof value !== 'object' || value === null) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'type_mismatch', `Expected object for discriminated union`, value, 'object');
        }
        const disc = (schema as any).discriminatorKey as string;
        const discVal = (value as any)[disc];
        const mapping = new Map<any, any>();
        for (const v of (schema as any).variants as any[]) {
          const literal = v.shape?.[disc]?.toJsonSchema?.()?.const;
          if (literal !== undefined) mapping.set(literal, v);
        }
        const chosen = mapping.get(discVal);
        if (!chosen) throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'invalid_discriminant', `Cannot resolve union variant for discriminator '${disc}'`, discVal, Array.from(mapping.keys()).map(x => JSON.stringify(x)).join(' | '));
        schema = chosen;
        // continue without consuming segment (we still need to traverse into the object)
      }
      // Plain union: pick variant by current value
      if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && !(schema as any)?.shape) {
        let picked: any | undefined = undefined;
        for (const cand of (schema as any).schemas as any[]) {
          const res = (cand as any).safeParse(value);
          if (res?.success) { picked = cand; break; }
        }
        if (!picked) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'union_resolution_failed', `Cannot resolve union variant from current instance`, value, 'value matching a union variant');
        }
        schema = picked;
      }
      // Object traversal
      if ((schema as any)?.shape) {
        const key = String(seg);
        const nextSchema = (schema as any).shape[key];
        if (!nextSchema) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'unknown_property', `Unknown property '${key}'`, undefined, 'property defined in schema');
        }
        if (typeof value !== 'object' || value === null || !(key in (value as any))) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'missing_parent', `Missing parent object/key '${key}' in instance`, value, 'existing parent');
        }
        parents.push({ kind: 'object', value, keyOrIndex: key });
        value = (value as any)[key];
        schema = nextSchema;
        continue;
      }
      // Record traversal: any key allowed
      if ((schema as any)?.valueSchema && !(schema as any)?.shape) {
        const key = String(seg);
        if (typeof value !== 'object' || value === null || !(key in (value as any))) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'missing_parent', `Missing parent object/key '${key}' in instance`, value, 'existing parent');
        }
        parents.push({ kind: 'object', value, keyOrIndex: key });
        value = (value as any)[key];
        schema = (schema as any).valueSchema;
        continue;
      }
      // Array traversal
      if ((schema as any)?.itemSchema) {
        const idx = this.parseArrayIndex(seg, segments.slice(0, i + 1).map(s => String(s)));
        if (!Array.isArray(value) || idx < 0 || idx >= value.length) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'index_out_of_range', `Array index ${idx} out of range`, idx, Array.isArray(value) ? `0..${value.length - 1}` : 'array');
        }
        parents.push({ kind: 'array', value, keyOrIndex: idx });
        value = value[idx];
        schema = (schema as any).itemSchema;
        continue;
      }
      // Tuple traversal
      if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && (schema as any)?.getBaseJsonSchema?.().prefixItems !== undefined) {
        const idx = this.parseArrayIndex(seg, segments.slice(0, i + 1).map(s => String(s)));
        const arr = (schema as any).schemas as any[];
        if (idx < 0 || idx >= arr.length) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'index_out_of_range', `Tuple index ${idx} out of range`, idx, `0..${arr.length - 1}`);
        }
        if (!Array.isArray(value) || idx >= value.length) {
          throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'missing_parent', `Missing tuple index ${idx} in instance`, value, 'tuple element present');
        }
        parents.push({ kind: 'array', value, keyOrIndex: idx });
        value = value[idx];
        schema = arr[idx];
        continue;
      }
      throw new ZexError(segments.slice(0, i + 1).map(s => String(s)), 'invalid_path', `Cannot traverse into schema at segment '${String(seg)}'`, undefined, 'object/array/record/union');
    }

    // Leaf
    const leafSeg = segments[segments.length - 1];
    // Unwrap lazy at leaf container
    if ((schema as any)?.getSchema && typeof (schema as any).getSchema === 'function') {
      schema = (schema as any).getSchema();
    }
    // Discriminated union at leaf container: choose variant by instance
    if ((schema as any)?.discriminatorKey && (schema as any)?.variants) {
      if (typeof value !== 'object' || value === null) {
        throw new ZexError(segments.map(s => String(s)), 'type_mismatch', `Expected object for discriminated union`, value, 'object');
      }
      const disc = (schema as any).discriminatorKey as string;
      const discVal = (value as any)[disc];
      const mapping = new Map<any, any>();
      for (const v of (schema as any).variants as any[]) {
        const literal = v.shape?.[disc]?.toJsonSchema?.()?.const;
        if (literal !== undefined) mapping.set(literal, v);
      }
      const chosen = mapping.get(discVal);
      if (!chosen) throw new ZexError(segments.map(s => String(s)), 'invalid_discriminant', `Cannot resolve union variant for discriminator '${disc}'`, discVal, Array.from(mapping.keys()).map(x => JSON.stringify(x)).join(' | '));
      schema = chosen;
    }
    // Plain union at leaf container (exclude tuples): pick by instance
    if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && !(schema as any)?.shape && !((schema as any)?.getBaseJsonSchema?.().prefixItems !== undefined)) {
      let picked: any | undefined = undefined;
      for (const cand of (schema as any).schemas as any[]) {
        const res = (cand as any).safeParse(value);
        if (res?.success) { picked = cand; break; }
      }
      if (!picked) {
        throw new ZexError(segments.map(s => String(s)), 'union_resolution_failed', `Cannot resolve union variant from current instance`, value, 'value matching a union variant');
      }
      schema = picked;
    }

    // Now determine leaf container kind and leaf schema
    if ((schema as any)?.shape) {
      const key = String(leafSeg);
      const nextSchema = (schema as any).shape[key];
      if (!nextSchema) {
        throw new ZexError(segments.map(s => String(s)), 'unknown_property', `Unknown property '${key}'`, undefined, 'property defined in schema');
      }
      return { parentContainers: [...parents, { kind: 'object', value, keyOrIndex: key }], leafKeyOrIndex: key, leafSchema: nextSchema, containerKind: 'object' };
    }
    if ((schema as any)?.valueSchema && !(schema as any)?.shape) {
      const key = String(leafSeg);
      return { parentContainers: [...parents, { kind: 'object', value, keyOrIndex: key }], leafKeyOrIndex: key, leafSchema: (schema as any).valueSchema, containerKind: 'object' };
    }
    if ((schema as any)?.itemSchema) {
      const idx = this.parseArrayIndex(leafSeg, segments.map(s => String(s)));
      if (!Array.isArray(value) || idx < 0 || idx >= value.length) {
        throw new ZexError(segments.map(s => String(s)), 'index_out_of_range', `Array index ${idx} out of range`, idx, Array.isArray(value) ? `0..${value.length - 1}` : 'array');
      }
      return { parentContainers: [...parents, { kind: 'array', value, keyOrIndex: idx }], leafKeyOrIndex: idx, leafSchema: (schema as any).itemSchema, containerKind: 'array' };
    }
    if ((schema as any)?.schemas && Array.isArray((schema as any).schemas) && (schema as any)?.getBaseJsonSchema?.().prefixItems !== undefined) {
      const idx = this.parseArrayIndex(leafSeg, segments.map(s => String(s)));
      const arr = (schema as any).schemas as any[];
      if (idx < 0 || idx >= arr.length) {
        throw new ZexError(segments.map(s => String(s)), 'index_out_of_range', `Tuple index ${idx} out of range`, idx, `0..${arr.length - 1}`);
      }
      if (!Array.isArray(value) || idx >= value.length) {
        throw new ZexError(segments.map(s => String(s)), 'missing_parent', `Missing tuple index ${idx} in instance`, value, 'tuple element present');
      }
      return { parentContainers: [...parents, { kind: 'array', value, keyOrIndex: idx }], leafKeyOrIndex: idx, leafSchema: arr[idx], containerKind: 'array' };
    }
    throw new ZexError(segments.map(s => String(s)), 'invalid_path', `Cannot resolve leaf under schema`, undefined, 'object/array/record/tuple');
  }

  private parseArrayIndex(seg: string | number, pathForError: string[]): number {
    const s = String(seg);
    if (!/^\d+$/.test(s)) {
      throw new ZexError(pathForError, 'invalid_index', `Expected numeric array index, got '${s}'`, s, '0..N');
    }
    const idx = parseInt(s, 10);
    return idx;
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

  // Custom refinement similar to Zod's refine
  refine(predicate: (value: unknown) => boolean, message?: string): this {
    return this.addValidator(new RefineValidator(predicate, message));
  }
}
