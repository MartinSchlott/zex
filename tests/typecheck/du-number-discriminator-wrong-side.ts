import { zex } from '../../src/zex/index.ts';

const S = zex.discriminatedUnion('kind',
  zex.object({ kind: zex.literal(1), a: zex.number() }),
  zex.object({ kind: zex.literal(2), b: zex.string() })
);

type ST = zex.infer<typeof S>;

// Should FAIL typecheck: for kind:2, property 'a' is not allowed
const bad: ST = { kind: 2, a: 'x' }; // This should error, but TypeScript may not catch it due to structural typing


