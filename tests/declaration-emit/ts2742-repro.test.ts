// Test to verify TS2742 is fixed
// This test compiles the declaration-emit test files and checks for TS2742 errors

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const testDir = join(__dirname);
const distDir = join(testDir, 'declaration-emit-dist');

console.log('Testing TS2742 Declaration Emit compatibility...\n');

try {
  // Clean and compile
  execSync('npm run declaration-emit:clean', { cwd: join(__dirname, '../..'), stdio: 'pipe' });
  
  const result = execSync('cd tests/declaration-emit && tsc -p tsconfig.json', {
    cwd: join(__dirname, '../..'),
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  // Check if .d.ts files were generated
  const exportedSchemasDts = join(distDir, 'tests/declaration-emit/exported-schemas.d.ts');
  
  if (!existsSync(exportedSchemasDts)) {
    console.error('❌ Declaration files were not generated');
    process.exit(1);
  }
  
  const dtsContent = readFileSync(exportedSchemasDts, 'utf-8');
  
  // Check for problematic patterns that indicate TS2742 issues
  // TS2742 typically manifests as references to internal type-helpers
  const hasTypeHelpersRef = dtsContent.includes('type-helpers');
  const hasComplexTypesRef = dtsContent.includes('complex-types/type-helpers');
  
  // Check if types are properly exported (not using internal paths)
  const hasInternalPaths = dtsContent.includes('../../src/zex/complex-types/type-helpers');
  
  console.log('✅ Declaration files generated successfully');
  console.log(`   - File: ${exportedSchemasDts}`);
  console.log(`   - Size: ${dtsContent.length} bytes`);
  
  if (hasInternalPaths) {
    console.log('⚠️  Warning: Declaration file contains internal type-helpers references');
    console.log('   This may cause TS2742 in consumer projects');
  } else {
    console.log('✅ No internal type-helpers references found');
  }
  
  // Check the actual exported types
  const hasNodeDataSchema = dtsContent.includes('NodeDataSchema');
  const hasClarionSchema = dtsContent.includes('ClarionDisplayStructureSchema');
  const hasPetSchema = dtsContent.includes('PetSchema');
  
  if (hasNodeDataSchema && hasClarionSchema && hasPetSchema) {
    console.log('✅ All expected schemas are exported');
  } else {
    console.log('⚠️  Some schemas may be missing from declarations');
  }
  
  console.log('\n📋 Sample of generated .d.ts:');
  console.log(dtsContent.split('\n').slice(0, 10).join('\n'));
  console.log('...\n');
  
  console.log('✅ TS2742 test completed');
  
} catch (error: any) {
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
  
  // Check for TS2742 specifically
  if (errorOutput.includes('TS2742') || errorOutput.includes('cannot be named') || errorOutput.includes('not portable')) {
    console.error('❌ TS2742 error detected!');
    console.error(errorOutput);
    process.exit(1);
  }
  
  // Other compilation errors
  if (errorOutput.includes('error TS')) {
    console.error('❌ Compilation errors (may prevent TS2742 detection):');
    console.error(errorOutput);
    process.exit(1);
  }
  
  throw error;
}
