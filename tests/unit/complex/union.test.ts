import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: union ===");

const U = zex.union(zex.string(), zex.number());
expectOk('accepts string', () => U.parse('x'));
expectOk('accepts number', () => U.parse(1));
expectFail('rejects boolean', () => U.parse(true as any));

console.log("\n=== UNIT: discriminatedUnion ===");

const Pet = zex.discriminatedUnion('type',
  zex.object({ type: zex.literal('dog'), bark: zex.boolean() }),
  zex.object({ type: zex.literal('cat'), meow: zex.boolean() })
);

expectOk('DU accepts dog', () => Pet.parse({ type: 'dog', bark: true }));
expectOk('DU accepts cat', () => Pet.parse({ type: 'cat', meow: false }));
expectFail('DU rejects wrong discriminant value', () => Pet.parse({ type: 'bird', fly: true } as any));
expectFail('DU rejects missing discriminant', () => Pet.parse({ bark: true } as any));
expectFail('DU rejects variant field mismatch', () => Pet.parse({ type: 'dog', meow: true } as any));

expectFail('Constructing DU with duplicate discriminants fails', () => zex.discriminatedUnion('k',
  zex.object({ k: zex.literal(1), a: zex.number() }),
  zex.object({ k: zex.literal(1), b: zex.string() })
));

expectOk('OpenAPI discriminator can be added via meta', () => {
  const DU = zex.discriminatedUnion('kind',
    zex.object({ kind: zex.literal('a'), a: zex.number() }),
    zex.object({ kind: zex.literal('b'), b: zex.string() })
  ).openApiDiscriminator();
  const js = DU.toJsonSchema();
  if (!('discriminator' in js) || (js as any).discriminator.propertyName !== 'kind') {
    throw new Error('missing discriminator meta');
  }
  return true;
});

// Lua transform: prefer string over buffer in union(string, buffer)
const UStrBuf = zex.union(zex.string(), zex.buffer());
const enc = new TextEncoder();
const bytesUtf8 = enc.encode('hello');
expectOk('union(string, buffer): Uint8Array decodes to string first', () => UStrBuf.parseFromLua(bytesUtf8));

// invalid bytes fallback to buffer
const invalidBytes = new Uint8Array([0xff, 0xfe, 0xfd]);
expectOk('union(string, buffer): invalid UTF-8 falls back to buffer', () => UStrBuf.parseFromLua(invalidBytes));

