// export-context.ts - Export context for $defs/$ref management
// =============================================================================

import { JsonSchema } from '../types.js';

// -----------------------------
// Export context for $defs/$ref
// -----------------------------
export type ExportCtx = {
  defs: Record<string, JsonSchema>;
  ids: WeakMap<object, string>;
  seq: number;
  unresolved: Array<{ id: string; finalize: () => JsonSchema }>;
  idFor: (obj: object) => string;
};

let currentExportCtx: ExportCtx | null = null;

export function beginExportCtx() {
  currentExportCtx = {
    defs: {},
    ids: new WeakMap<object, string>(),
    seq: 0,
    unresolved: [],
    idFor(obj: object) {
      const existing = this.ids.get(obj);
      if (existing) return existing;
      const id = `S${++this.seq}`;
      this.ids.set(obj, id);
      return id;
    }
  };
}

export function endExportCtx() {
  currentExportCtx = null;
}

export function getCurrentExportCtx(): ExportCtx | null {
  return currentExportCtx;
}
