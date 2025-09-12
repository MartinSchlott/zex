// zex-lazy.ts - Lazy loading implementation for Zex
// =============================================================================

import { JsonSchema, PathEntry, ZexConfig } from '../types.js';
import { ZexBase } from './zex-base.js';
import { getCurrentExportCtx } from './export-context.js';

// Runtime-only lazy wrapper (Phase 1)
export class ZexLazy<T> extends ZexBase<T> {
  constructor(private readonly getSchema: () => ZexBase<T>, config?: Partial<ZexConfig>) {
    super(config);
  }

  protected clone(newConfig: ZexConfig): this {
    return new ZexLazy(this.getSchema, newConfig) as this;
  }

  private inner(): ZexBase<T> {
    const schema = this.getSchema();
    if (!schema) {
      throw new Error('zex.lazy(): resolver returned falsy schema');
    }
    return schema as ZexBase<T>;
  }

  protected getBaseJsonSchema(): JsonSchema {
    // Phase 2: register a $defs entry and return a $ref
    const currentExportCtx = getCurrentExportCtx();
    if (!currentExportCtx) return {};
    const id = currentExportCtx.idFor(this);
    if (!currentExportCtx.defs[id]) {
      // define placeholder first to break cycles
      currentExportCtx.defs[id] = {};
      // defer finalization to avoid immediate recursion
      currentExportCtx.unresolved.push({
        id,
        finalize: () => (this.inner() as any).toJsonSchema()
      });
    }
    return { $ref: `#/$defs/${id}` } as any;
  }

  protected transformLua(data: unknown): unknown {
    return (this.inner() as any).transformLua(data);
  }

  protected validateType(data: unknown): { success: true } | { success: false; error: string } {
    return (this.inner() as any).validateType(data);
  }

  protected _parse(data: unknown, path: PathEntry[]): T {
    return (this.inner() as any)._parse(data, path);
  }
}
