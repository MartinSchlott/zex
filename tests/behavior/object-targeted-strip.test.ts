import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: object.stripOnly / stripReadOnly / stripWriteOnly (targeted) ===");

const Base = zex.object({
  a: zex.string(),
  b: zex.number().optional(),
  uid: zex.string(),
  r: zex.string().readOnly(),
  w: zex.string().writeOnly(),
}).describe('Base');

// 1) stripOnly('uid') together with omit('uid') under strict should drop uid but still error on other unknowns
expectOk('stripOnly+omit strict: drops only uid', () => {
  const Schema = (Base as any).omit('uid').strict().stripOnly('uid');
  const out = (Schema as any).parse({ a: 'x', uid: 'U-1', r: 'RO', w: 'WO' });
  if ('uid' in out) throw new Error('uid should be stripped');
});

expectFail('stripOnly+omit strict: still errors on other unknowns', () => {
  const Schema = (Base as any).omit('uid').strict().stripOnly('uid');
  (Schema as any).parse({ a: 'x', r: 'RO', w: 'WO', typo: 1 });
});

// 2) stripOnly with passthrough keeps other unknowns
expectOk('stripOnly+omit passthrough: drops uid, keeps others', () => {
  const Schema = (Base as any).omit('uid').passthrough().stripOnly('uid');
  const out = (Schema as any).parse({ a: 'x', uid: 'U-2', r: 'RO', w: 'WO', x: 1 });
  if ('uid' in out) throw new Error('uid should be stripped');
  if (out.x !== 1) throw new Error('x should be kept');
});

// 3) stripReadOnly with omitReadOnly under strict
expectOk('stripReadOnly+omitReadOnly strict: drops readOnly fields only', () => {
  const Schema = (Base as any).omitReadOnly().strict().stripReadOnly();
  const out = (Schema as any).parse({ a: 'x', uid: 'U-1', r: 'RO', w: 'WO' });
  if ('r' in out) throw new Error('readOnly r should be stripped');
});

expectFail('stripReadOnly+omitReadOnly strict: other unknown still errors', () => {
  const Schema = (Base as any).omitReadOnly().strict().stripReadOnly();
  (Schema as any).parse({ a: 'x', typo: 't' });
});

// 4) stripWriteOnly with partial under strict
expectOk('stripWriteOnly with partial: drops writeOnly fields only', () => {
  const Schema = (Base as any).partial().stripWriteOnly().strict();
  const out = (Schema as any).parse({ a: 'x', r: 'RO', w: 'WO' });
  if ('w' in out) throw new Error('writeOnly w should be stripped');
});

// 5) Lua parity for stripOnly with omit('uid')
expectOk('Lua stripOnly+omit strict: drops uid', () => {
  const Schema = (Base as any).omit('uid').strict().stripOnly('uid');
  const out = (Schema as any).parseFromLua({ a: 'x', uid: 'U-3', r: 'RO', w: 'WO' });
  if ('uid' in out) throw new Error('uid should be stripped (Lua)');
});


