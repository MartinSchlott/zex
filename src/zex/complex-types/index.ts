// index.ts - Re-exports for complex types
// =============================================================================

export { ZexArray } from './array.js';
export { ZexObject, type ZexObjectMode } from './object.js';
export { ZexRecord } from './record.js';
export { ZexLiteral } from './literal.js';
export { ZexTuple } from './tuple.js';

// Re-export type helpers for external use
export type { InferProperty, InferObjectType, InferTuple } from './type-helpers.js';
