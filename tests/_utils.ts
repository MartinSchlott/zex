export function expectOk<T>(label: string, fn: () => T) {
  try {
    const result = fn();
    console.log(`✅ ${label}`);
    return result;
  } catch (e) {
    console.log(`❌ ${label}`);
    throw e;
  }
}

export function expectFail(label: string, fn: () => unknown) {
  try {
    fn();
    console.log(`❌ ${label} (should have failed)`);
    throw new Error('Expected failure but succeeded');
  } catch {
    console.log(`✅ ${label} (failed as expected)`);
  }
}

