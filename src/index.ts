// Main entry point for the Zex library
export { zex } from './zex/index.js';
export type { infer } from './zex/index.js';

// Re-export all types for convenience
export type { JsonSchema, ValidationResult, ZexConfig, Validator, PathEntry, ParseContext } from './zex/types.js';
