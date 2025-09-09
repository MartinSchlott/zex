import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: object.partial, omit, omitReadOnly, omitWriteOnly ===");

const Base = zex.object({
  a: zex.string().describe('a'),
  b: zex.number().describe('b'),
  c: zex.string().default('C').describe('c-with-default'),
  d: zex.string().optional().describe('d-optional'),
  r: zex.string().readOnly().describe('readOnly-field'),
  w: zex.string().writeOnly().describe('writeOnly-field'),
}).describe('Base');

// 1) partial(): all fields optional (shallow)
const Partial = (Base as any).partial?.() ?? Base; // placeholder if not implemented yet
console.log('Partial available:', !!(Base as any).partial);

if ((Base as any).partial) {
  expectOk('partial: parse {} ok', () => (Partial as any).parse({}));
  expectOk('partial: defaults still apply when missing or undefined', () => {
    const out1 = (Partial as any).parse({});
    if ('c' in out1) throw new Error('c should not be materialized by default on missing');
    const out2 = (Partial as any).parse({ c: undefined });
    if (out2.c !== 'C') throw new Error('default should apply when provided as undefined');
  });

  const js = (Partial as any).toJsonSchema();
  expectOk('partial: JSON Schema has no required', () => {
    if (js.required && js.required.length) throw new Error('required should be empty/undefined');
  });

  const rt = zex.fromJsonSchema((Partial as any).toJsonSchema());
  expectOk('partial: roundtrip parse {} ok', () => rt.parse({}));
}

// 2) omit('b', 'r'): removes keys from shape; unknown handling per mode
const OmitBR = (Base as any).omit?.('b', 'r') ?? Base; // placeholder if not implemented yet
console.log('Omit available:', !!(Base as any).omit);

if ((Base as any).omit) {
  // strict (default): unknown omitted keys -> error
  expectFail('omit strict: unknown omitted key b should error', () => (OmitBR as any).parse({ a: 'x', b: 1, w: 'keep' }));

  // strip: unknown omitted keys -> removed
  const OmitStrip = (OmitBR as any).strip();
  expectOk('omit strip: unknown omitted key b removed', () => {
    const out = (OmitStrip as any).parse({ a: 'x', b: 1, w: 'keep' });
    if ('b' in out) throw new Error('b should be stripped');
  });

  // passthrough: unknown omitted keys -> kept
  const OmitPass = (OmitBR as any).passthrough();
  expectOk('omit passthrough: unknown omitted key b kept', () => {
    const out = (OmitPass as any).parse({ a: 'x', b: 1, w: 'keep' });
    if (out.b !== 1) throw new Error('b should be kept');
  });

  // JSON Schema should not contain omitted props
  const js = (OmitBR as any).toJsonSchema();
  expectOk('omit: JSON Schema removed omitted properties', () => {
    if (js.properties?.b || js.properties?.r) throw new Error('b or r should not be in properties');
    if (Array.isArray(js.required) && js.required.includes('b')) throw new Error('b must not be required');
  });

  // roundtrip
  const rt = zex.fromJsonSchema((OmitBR as any).toJsonSchema());
  expectOk('omit: roundtrip parse ok (no r, no b)', () => rt.parse({ a: 'x', w: 'keep' }));
}

// 3) omitReadOnly/omitWriteOnly
const OmitRO = (Base as any).omitReadOnly?.() ?? Base; // placeholder
const OmitWO = (Base as any).omitWriteOnly?.() ?? Base; // placeholder
console.log('omitReadOnly available:', !!(Base as any).omitReadOnly);
console.log('omitWriteOnly available:', !!(Base as any).omitWriteOnly);

if ((Base as any).omitReadOnly) {
  const js = (OmitRO as any).toJsonSchema();
  expectOk('omitReadOnly: removed properties with readOnly: true', () => {
    if (js.properties?.r) throw new Error('readOnly field r should be omitted');
  });
}

if ((Base as any).omitWriteOnly) {
  const js = (OmitWO as any).toJsonSchema();
  expectOk('omitWriteOnly: removed properties with writeOnly: true', () => {
    if (js.properties?.w) throw new Error('writeOnly field w should be omitted');
  });
}

// 4) Lua parity
if ((Base as any).partial && (Base as any).omit) {
  const PartialLua = (Base as any).partial();
  expectOk('Lua partial: parseFromLua {} ok', () => (PartialLua as any).parseFromLua({}));

  const OmitLua = (Base as any).omit('b', 'r');
  const OmitLuaStrict = (OmitLua as any).strict();
  const OmitLuaStrip = (OmitLua as any).strip();
  const OmitLuaPass = (OmitLua as any).passthrough();

  expectFail('Lua omit strict: unknown omitted b should error', () => (OmitLuaStrict as any).parseFromLua({ a: 'x', b: 1, w: 'keep' }));
  expectOk('Lua omit strip: unknown omitted b removed', () => {
    const out = (OmitLuaStrip as any).parseFromLua({ a: 'x', b: 1, w: 'keep' });
    if ('b' in out) throw new Error('b should be stripped (Lua)');
  });
  expectOk('Lua omit passthrough: unknown omitted b kept', () => {
    const out = (OmitLuaPass as any).parseFromLua({ a: 'x', b: 1, w: 'keep' });
    if (out.b !== 1) throw new Error('b should be kept (Lua)');
  });
}


