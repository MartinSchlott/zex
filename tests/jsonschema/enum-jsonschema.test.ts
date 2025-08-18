import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== JSONSCHEMA: enum generation and roundtrip ===");

// Test 1: Basic enum JSON schema generation
const basicEnum = zex.enum(['a', 'b', 'c'] as const);
const basicSchema = basicEnum.toJsonSchema();
expectOk('basic enum generates schema with enum array', () => {
  return basicSchema.enum && Array.isArray(basicSchema.enum) && basicSchema.enum.length === 3;
});

// Test 2: Enum with metadata
const metaEnum = zex.enum(['active', 'inactive', 'pending'] as const)
  .describe('User status')
  .title('Status');
const metaSchema = metaEnum.toJsonSchema();
expectOk('meta enum includes description and title', () => {
  return metaSchema.description === 'User status' && metaSchema.title === 'Status';
});

// Test 3: Roundtrip test - from JSON schema back to Zex
const recreated = zex.fromJsonSchema(metaSchema);
expectOk('fromJsonSchema recreates enum', () => {
  return recreated.constructor.name === 'ZexEnum';
});

// Test 4: Parse with recreated schema
expectOk('recreated enum parses valid value', () => recreated.parse('active'));

// Test 5: Complex enum with mixed types
const complexEnum = zex.enum([1, 'two', true, null] as const);
const complexSchema = complexEnum.toJsonSchema();
expectOk('complex enum generates schema with mixed types', () => {
  return complexSchema.enum && Array.isArray(complexSchema.enum) && complexSchema.enum.length === 4;
});

// Test 6: Roundtrip complex enum
const recreatedComplex = zex.fromJsonSchema(complexSchema);
expectOk('complex enum roundtrip works', () => {
  return (recreatedComplex as any).options.length === 4;
});

// Test 7: Validate that enum values are preserved in JSON schema
expectOk('enum values are preserved in schema', () => {
  const values = ['x', 'y', 'z'] as const;
  const enumSchema = zex.enum(values);
  const jsonSchema = enumSchema.toJsonSchema();
  return JSON.stringify(jsonSchema.enum) === JSON.stringify(values);
});

// Test 8: Test enum with $schema option
const enumWithSchema = zex.enum(['a', 'b'] as const);
const schemaWithMeta = enumWithSchema.toJsonSchema({ 
  $schema: 'https://json-schema.org/draft/2020-12/schema' 
});
expectOk('enum includes $schema when specified', () => {
  return schemaWithMeta.$schema === 'https://json-schema.org/draft/2020-12/schema';
});
