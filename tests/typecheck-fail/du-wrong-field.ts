import { zex } from '../../src/zex/index.ts';

// Pet DU
const Pet = zex.discriminatedUnion('type',
  zex.object({ type: zex.literal('dog'), bark: zex.boolean() }),
  zex.object({ type: zex.literal('cat'), meow: zex.boolean() })
);

type PetT = zex.infer<typeof Pet>;

// Should FAIL typecheck: meow is not valid for 'dog'
// @ts-expect-error
const bad1: PetT = { type: 'dog', meow: true };


