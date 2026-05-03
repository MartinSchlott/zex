# bug

> Issue and bug tracking for Zex. Cards with `severity: accepted` document
> conscious deviations from the target vision (the "won't fix" bucket).

## Open

- [ ] Public `zex.object()` exposes `allowAdditionalProperties` independent of `mode`
  > severity: minor
  > The factory `zex.object(shape, allowAdditionalProperties, mode)` accepts both
  > parameters as independent arguments. At runtime only `mode` is consulted
  > (strict/passthrough/strip). At export time only `allowAdditionalProperties`
  > is written into the JSON Schema (`getBaseJsonSchema` in `src/zex/complex-types/object.ts`).
  >
  > Calling `zex.object(shape, true, "strict")` produces a schema that rejects
  > unknown keys at runtime but exports `additionalProperties: true` — a roundtrip
  > break. The mode setters (`passthrough()`, `strip()`, `strict()`) keep both
  > flags in sync; only the public factory exposes the inconsistency.
  >
  > Likely fix: drop `allowAdditionalProperties` from the factory and derive it
  > from `mode` internally.

## In Progress

## Done
