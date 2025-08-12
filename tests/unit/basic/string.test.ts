import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: string ===");

const s = zex.string();

expectOk('parse valid string', () => s.parse('hello'));
expectFail('reject non-string', () => s.parse(123 as any));

expectOk('email validator', () => zex.string().email().parse('a@b.com'));
expectFail('email validator fails', () => zex.string().email().parse('nope'));

expectOk('uuid validator', () => zex.string().uuid().parse('550e8400-e29b-41d4-a716-446655440000'));
expectFail('uuid validator fails', () => zex.string().uuid().parse('123'));

expectOk('min/max length', () => zex.string().min(2).max(5).parse('hey'));
expectFail('min length fails', () => zex.string().min(3).parse('hi'));
expectFail('max length fails', () => zex.string().max(2).parse('long'));

// chaining after optional(): should still allow .min()
expectOk('optional chaining keeps methods', () => zex.string().optional().min(1).parse('x'));

// UI hint: multiline
expectOk('multiline() default to 1 and exported meta', () => {
  const s = zex.string().multiline();
  if (s.getMultiline() !== 1) throw new Error('expected getMultiline() to be 1');
  const json = s.toJsonSchema();
  if ((json as any)['x-ui-multiline'] !== 1) throw new Error('expected x-ui-multiline to be 1');
});

expectOk('multiline(n) supports positive, negative and floats', () => {
  const a = zex.string().multiline(10);
  if (a.getMultiline() !== 10) throw new Error('expected 10');
  const b = zex.string().multiline(-64);
  if (b.getMultiline() !== -64) throw new Error('expected -64');
  const c = zex.string().multiline(2.5);
  if (c.getMultiline() !== 2.5) throw new Error('expected 2.5');
});

expectOk('multiline(0) removes key and returns 0', () => {
  const s = zex.string().multiline(0);
  if (s.getMultiline() !== 0) throw new Error('expected 0');
  const json = s.toJsonSchema();
  if ('x-ui-multiline' in (json as any)) throw new Error('x-ui-multiline should not be present');
});

expectOk('fromJsonSchema roundtrip for x-ui-multiline', () => {
  const schema = { type: 'string', 'x-ui-multiline': -3.25 } as any;
  const z = zex.fromJsonSchema(schema);
  if ((z as any).getMultiline() !== -3.25) throw new Error('roundtrip failed');
});

// readOnly/writeOnly flags on base
expectOk('readOnly/writeOnly default false', () => {
  const s = zex.string();
  if ((s as any).isReadOnly() !== false) throw new Error('isReadOnly default not false');
  if ((s as any).isWriteOnly() !== false) throw new Error('isWriteOnly default not false');
});

expectOk('readOnly() sets, readOnly(false) removes', () => {
  const s = zex.string().readOnly();
  if ((s as any).isReadOnly() !== true) throw new Error('isReadOnly not true after set');
  const json = s.toJsonSchema();
  if ((json as any).readOnly !== true) throw new Error('readOnly not exported as true');
  const s2 = s.readOnly(false);
  if ((s2 as any).isReadOnly() !== false) throw new Error('isReadOnly not false after remove');
  const json2 = s2.toJsonSchema();
  if ('readOnly' in (json2 as any)) throw new Error('readOnly key should be absent when false');
});

expectOk('writeOnly() sets, writeOnly(false) removes', () => {
  const s = zex.string().writeOnly();
  if ((s as any).isWriteOnly() !== true) throw new Error('isWriteOnly not true after set');
  const json = s.toJsonSchema();
  if ((json as any).writeOnly !== true) throw new Error('writeOnly not exported as true');
  const s2 = s.writeOnly(false);
  if ((s2 as any).isWriteOnly() !== false) throw new Error('isWriteOnly not false after remove');
  const json2 = s2.toJsonSchema();
  if ('writeOnly' in (json2 as any)) throw new Error('writeOnly key should be absent when false');
});

expectOk('fromJsonSchema normalizes false for readOnly/writeOnly', () => {
  const schema = { type: 'string', readOnly: false, writeOnly: false } as any;
  const z = zex.fromJsonSchema(schema);
  const json = (z as any).toJsonSchema();
  if ('readOnly' in (json as any)) throw new Error('readOnly false should be dropped');
  if ('writeOnly' in (json as any)) throw new Error('writeOnly false should be dropped');
});

expectFail('multiline rejects NaN', () => {
  zex.string().multiline(Number.NaN as any);
});
expectFail('multiline rejects Infinity', () => {
  zex.string().multiline(Number.POSITIVE_INFINITY as any);
});

