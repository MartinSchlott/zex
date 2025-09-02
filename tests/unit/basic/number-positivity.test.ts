import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: number positivity modifiers ===");

// Parsing behavior
expectFail('positive rejects 0', () => zex.number().positive().parse(0));
expectOk('positive accepts 1', () => zex.number().positive().parse(1));
expectFail('positive rejects -1', () => zex.number().positive().parse(-1));

expectOk('nonnegative accepts 0', () => zex.number().nonnegative().parse(0));
expectOk('nonnegative accepts 2', () => zex.number().nonnegative().parse(2));
expectFail('nonnegative rejects -1', () => zex.number().nonnegative().parse(-1));

expectFail('negative rejects 0', () => zex.number().negative().parse(0));
expectOk('negative accepts -1', () => zex.number().negative().parse(-1));
expectFail('negative rejects 1', () => zex.number().negative().parse(1));

expectOk('nonpositive accepts 0', () => zex.number().nonpositive().parse(0));
expectOk('nonpositive accepts -2', () => zex.number().nonpositive().parse(-2));
expectFail('nonpositive rejects 1', () => zex.number().nonpositive().parse(1));

// Combination with int/min/max
expectOk('positive + int accepts 1', () => zex.number().positive().int().parse(1));
expectFail('positive + int rejects 1.5', () => zex.number().positive().int().parse(1.5));
expectOk('nonnegative + min(10) accepts 10', () => zex.number().nonnegative().min(10).parse(10));
expectFail('nonnegative + min(10) rejects 9', () => zex.number().nonnegative().min(10).parse(9));

// Finite numbers baseline (reject NaN/Infinity)
expectFail('number rejects NaN', () => zex.number().parse(Number.NaN));
expectFail('number rejects Infinity', () => zex.number().parse(Number.POSITIVE_INFINITY));
expectFail('number rejects -Infinity', () => zex.number().parse(Number.NEGATIVE_INFINITY));

// JSON Schema export checks
const posJson = zex.number().positive().toJsonSchema();
if ((posJson as any).exclusiveMinimum !== 0) throw new Error('positive should export exclusiveMinimum: 0');

const nonnegJson = zex.number().nonnegative().toJsonSchema();
if ((nonnegJson as any).minimum !== 0) throw new Error('nonnegative should export minimum: 0');

const negJson = zex.number().negative().toJsonSchema();
if ((negJson as any).exclusiveMaximum !== 0) throw new Error('negative should export exclusiveMaximum: 0');

const nonposJson = zex.number().nonpositive().toJsonSchema();
if ((nonposJson as any).maximum !== 0) throw new Error('nonpositive should export maximum: 0');

// JSON Schema import checks
const fromPos = zex.fromJsonSchema({ type: 'number', exclusiveMinimum: 0 });
expectOk('fromJsonSchema positive accepts 1', () => fromPos.parse(1));
expectFail('fromJsonSchema positive rejects 0', () => fromPos.parse(0));

const fromNonneg = zex.fromJsonSchema({ type: 'number', minimum: 0 });
expectOk('fromJsonSchema nonnegative accepts 0', () => fromNonneg.parse(0));
expectFail('fromJsonSchema nonnegative rejects -1', () => fromNonneg.parse(-1));

const fromNeg = zex.fromJsonSchema({ type: 'number', exclusiveMaximum: 0 });
expectOk('fromJsonSchema negative accepts -1', () => fromNeg.parse(-1));
expectFail('fromJsonSchema negative rejects 0', () => fromNeg.parse(0));

const fromNonpos = zex.fromJsonSchema({ type: 'number', maximum: 0 });
expectOk('fromJsonSchema nonpositive accepts 0', () => fromNonpos.parse(0));
expectFail('fromJsonSchema nonpositive rejects 1', () => fromNonpos.parse(1));
