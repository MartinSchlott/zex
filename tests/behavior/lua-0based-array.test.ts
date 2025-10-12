import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: Lua 0-based arrays ===");

// 0-based contiguous should convert to JS array
expectOk('0-based contiguous numeric keys → array', () => {
  const S = zex.array(zex.number());
  const lua = { "0": 1, "1": 2, "2": 3 } as any;
  const out = (S as any).parseFromLua(lua);
  if (!Array.isArray(out)) throw new Error('expected JS array');
  if (out.length !== 3 || out[0] !== 1 || out[1] !== 2 || out[2] !== 3) {
    throw new Error('unexpected array content');
  }
});

// 1-based contiguous remains supported
expectOk('1-based contiguous numeric keys → array', () => {
  const S = zex.array(zex.number());
  const lua = { "1": 1, "2": 2, "3": 3 } as any;
  const out = (S as any).parseFromLua(lua);
  if (!Array.isArray(out)) throw new Error('expected JS array');
  if (out.length !== 3 || out[0] !== 1 || out[1] !== 2 || out[2] !== 3) {
    throw new Error('unexpected array content');
  }
});

// Holes should not convert
expectFail('0-based with holes should fail as array', () => {
  const S = zex.array(zex.number());
  const lua = { "0": 1, "2": 3 } as any;
  (S as any).parseFromLua(lua);
});

// Mixed/non-numeric keys should not convert
expectFail('0-based with extra non-numeric key should fail as array', () => {
  const S = zex.array(zex.number());
  const lua = { "0": 1, "1": 2, tag: 'x' } as any;
  (S as any).parseFromLua(lua);
});


