import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: optional keys are omitted ===");

const Schema = zex.object({
  a: zex.string().optional(),
  b: zex.number().optional(),
  c: zex.jsonschema().optional(),
  d: zex.object({ x: zex.string().optional() }).optional(),
});

// parse with missing optionals
const parsed = Schema.parse({});
console.log("Parsed keys:", Object.keys(parsed));
if (Object.prototype.hasOwnProperty.call(parsed, 'a')) {
  throw new Error('optional key a should be omitted');
}
if (Object.prototype.hasOwnProperty.call(parsed, 'b')) {
  throw new Error('optional key b should be omitted');
}
if (Object.prototype.hasOwnProperty.call(parsed, 'c')) {
  throw new Error('optional key c should be omitted');
}
if (Object.prototype.hasOwnProperty.call(parsed, 'd')) {
  throw new Error('optional key d should be omitted');
}
console.log("✅ parse omits missing optional keys");

// parseFromLua with missing optionals (ensure no accidental materialization)
const luaInput = {} as any;
const luaParsed = Schema.parseFromLua(luaInput);
console.log("Lua parsed keys:", Object.keys(luaParsed));
if (Object.prototype.hasOwnProperty.call(luaParsed, 'a')) {
  throw new Error('optional key a should be omitted (Lua)');
}
if (Object.prototype.hasOwnProperty.call(luaParsed, 'b')) {
  throw new Error('optional key b should be omitted (Lua)');
}
if (Object.prototype.hasOwnProperty.call(luaParsed, 'c')) {
  throw new Error('optional key c should be omitted (Lua)');
}
if (Object.prototype.hasOwnProperty.call(luaParsed, 'd')) {
  throw new Error('optional key d should be omitted (Lua)');
}
console.log("✅ parseFromLua omits missing optional keys");
