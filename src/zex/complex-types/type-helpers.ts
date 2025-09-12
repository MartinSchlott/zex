// type-helpers.ts - Shared type helpers for complex types
// =============================================================================

import { ZexBase } from '../base/index.js';

/**
 * Leitet den finalen Typ einer einzelnen Zex-Schema-Instanz ab.
 * Behandelt `optional` und `nullable` Flags.
 */
export type InferProperty<Schema> = Schema extends ZexBase<infer U, infer Flags>
  ? (Flags extends { nullable: true } ? U | null : U) extends infer FinalU
    ? Flags extends { optional: true }
      ? FinalU | undefined
      : FinalU
    : never
  : never;

/**
 * Leitet den vollständigen Typ eines Zex-Objekts ab.
 * Korrekte Version mit optional/required Unterscheidung.
 */
export type InferObjectType<T extends Record<string, ZexBase<any, any>>> = {
  // Erforderliche Schlüssel: Felder, die NICHT optional sind.
  [K in keyof T as T[K] extends ZexBase<any, infer Flags>
    ? Flags extends { optional: true }
      ? never
      : K
    : K]: InferProperty<T[K]>
} & {
  // Optionale Schlüssel: Felder, die optional sind (bekommen ein '?').
  [K in keyof T as T[K] extends ZexBase<any, infer Flags>
    ? Flags extends { optional: true }
      ? K
      : never
    : never]?: InferProperty<T[K]>
};

/**
 * Tuple type inference helper
 */
export type InferTuple<T extends readonly ZexBase<any>[]> = {
  [K in keyof T]: T[K] extends ZexBase<infer U> ? U : never;
};
