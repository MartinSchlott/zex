import { zex } from '../../src/zex/index.ts';

// Should FAIL at compile-time: discriminator must be ZexLiteral
// @ts-expect-error
const Bad = zex.discriminatedUnion('type',
  zex.object({ type: zex.string(), x: zex.number() })
);

void Bad;


