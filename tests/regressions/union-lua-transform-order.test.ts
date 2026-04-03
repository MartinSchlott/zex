import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== REGRESSION: union Lua transform uses correct schema ===");

// union(number, string): Lua binary data (Uint8Array) should match string,
// not be silently transformed by number (which can't handle it)
const numOrStr = zex.union(zex.number(), zex.string());
const strOrNum = zex.union(zex.string(), zex.number());

const luaBytes = new Uint8Array([104, 101, 108, 108, 111]); // "hello"

expectOk('union(number, string) matches string from Lua bytes', () => {
  const result = numOrStr.parseFromLua(luaBytes);
  if (result !== 'hello') throw new Error(`Expected "hello", got ${JSON.stringify(result)}`);
});

expectOk('union(string, number) matches string from Lua bytes', () => {
  const result = strOrNum.parseFromLua(luaBytes);
  if (result !== 'hello') throw new Error(`Expected "hello", got ${JSON.stringify(result)}`);
});

// Numeric Lua data should still match number regardless of order
expectOk('union(string, number) matches number from Lua', () => {
  const result = strOrNum.parseFromLua(42);
  if (result !== 42) throw new Error(`Expected 42, got ${JSON.stringify(result)}`);
});
