import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== SQL POLICY: int64 & numeric strategies ===");

// int64 as string by default
const int64String = zex.fromJsonSchema({ type: 'integer', format: 'int64' } as any, { policy: 'sql' });
expectOk('int64 default strategy maps to string', () => int64String.constructor.name === 'ZexString');

// override: int64 as number
const int64Number = zex.fromJsonSchema({ type: 'integer', format: 'int64' } as any, { policy: 'sql', typeTransforms: [
  (t: any) => t // placeholder; real override would be via options, tested later when implemented
] });
expectOk('placeholder to ensure test file compiles', () => !!int64Number);

// numeric/decimal default to string
const numericString = zex.fromJsonSchema({ type: 'number', format: 'numeric' } as any, { policy: 'sql' });
expectOk('numeric default strategy maps to string', () => numericString.constructor.name === 'ZexString');

export {};


