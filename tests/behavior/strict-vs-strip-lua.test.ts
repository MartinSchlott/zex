import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: strict vs strip vs passthrough (Lua) ===");

const StrictSchema = zex.object({
  a: zex.string()
});

const StripSchema = zex.object({
  a: zex.string()
}).strip();

const PassthroughSchema = zex.object({
  a: zex.string()
}).passthrough();

// Lua-like input with extra key 'x'
const luaObj = { a: new Uint8Array([111, 107]), x: 123 }; // a = "ok"

// strict should fail
const strictRes = StrictSchema.safeParseFromLua(luaObj);
if (strictRes.success) {
  console.error('❌ strict should fail on unknown key');
} else {
  console.log('✅ strict failed as expected:', strictRes.error.split('\n')[0]);
}

// strip should succeed and remove x
const stripRes = StripSchema.safeParseFromLua(luaObj);
if (!stripRes.success) {
  console.error('❌ strip should succeed:', stripRes.error);
} else {
  const keys = Object.keys(stripRes.data as any);
  if (keys.includes('x')) {
    console.error('❌ strip should remove unknown key x');
  } else {
    console.log('✅ strip removed unknown key, keys:', keys);
  }
}

// passthrough should keep x
const passRes = PassthroughSchema.safeParseFromLua(luaObj);
if (!passRes.success) {
  console.error('❌ passthrough should succeed:', passRes.error);
} else {
  const keys = Object.keys(passRes.data as any);
  if (!keys.includes('x')) {
    console.error('❌ passthrough should keep unknown key x');
  } else {
    console.log('✅ passthrough kept unknown key, keys:', keys);
  }
}
