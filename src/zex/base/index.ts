// index.ts - Re-exports for base classes
// =============================================================================

export { ZexBase } from './zex-base.js';
export { ZexLazy } from './zex-lazy.js';

// Re-export export context utilities for internal use
export { beginExportCtx, endExportCtx, getCurrentExportCtx, type ExportCtx } from './export-context.js';
