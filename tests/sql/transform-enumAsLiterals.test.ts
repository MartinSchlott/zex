import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: enum handling ===");

// Strings-only enum should remain ZexEnum for ergonomics
const stringsOnly = zex.fromJsonSchema({ enum: ['a','b','c'] } as any, { policy: 'sql' });
expectOk('strings-only enum remains enum', () => stringsOnly.constructor.name === 'ZexEnum');

// Mixed enum should become union of literals (policy default)
const mixed = zex.fromJsonSchema({ enum: ['a', 1, true, null] } as any, { policy: 'sql' });
expectOk('mixed enum becomes union', () => mixed.constructor.name === 'ZexUnion');

export {};


