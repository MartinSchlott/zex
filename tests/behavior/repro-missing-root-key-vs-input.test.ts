import { zex, ZexError } from '../_imports.js';
import { expectFail, expectOk } from '../_utils.js';

console.log("\n=== BEHAVIOR: repro missing root key vs input key ===");

// Schema expects { data: { name: string } }
const schema = zex.object({
  data: zex.object({
    name: zex.string()
  })
});

// Client sends { input: { name: "x" } }
const badPayload = { input: { name: "x" } } as any;

// 1) Parse the ROOT schema to ensure we capture path information
expectFail('root parse should fail for missing required field data', () => {
  schema.parse(badPayload);
});

// 2) Demonstrate what currently bubbles up via safeParse (message-only)
const res = schema.safeParse(badPayload);
if (res.success) throw new Error('Expected failure but succeeded');
console.log('Observed error message:', res.error);

// 3) Demonstrate ZexError.toString() path if we catch the thrown error directly
expectFail('captured ZexError should include path or field name', () => {
  try {
    schema.parse(badPayload, { rootDescription: 'body' });
  } catch (e) {
    if (e instanceof ZexError) {
      const msg = e.toString();
      console.log('ZexError.toString():', msg);
      // Basic sanity: message should mention either missing required field 'data' or unknown property 'input'
      if (!/Missing required field 'data'|Unknown property 'input'/.test(msg)) {
        throw new Error('Repro: unexpected error text: ' + msg);
      }
      throw e; // rethrow to satisfy expectFail
    }
    throw e;
  }
});
