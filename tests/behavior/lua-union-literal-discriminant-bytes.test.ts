import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== BEHAVIOR: Lua byte strings in unions & discriminated unions ===");

const enc = new TextEncoder();

// Helper to create a zero-based numeric-key byte object like {"0":115,...}
const toZeroBasedByteObject = (s: string) => {
  const u8 = enc.encode(s);
  const obj: Record<string, number> = {};
  for (let i = 0; i < u8.length; i++) obj[String(i)] = u8[i];
  return obj;
};

// Nested hierarchy: request.messages[] where each item is a union of role variants
const MessageSystem = zex.object({
  role: zex.literal('system'),
  content: zex.string()
});

const MessageUser = zex.object({
  role: zex.literal('user'),
  content: zex.string()
});

const Message = zex.union(MessageSystem, MessageUser);

const Request = zex.object({
  messages: zex.array(Message)
});

// Discriminated union variant of the same shape for cross-check
const DUMessage = zex.discriminatedUnion('role',
  zex.object({ role: zex.literal('system'), content: zex.string() }),
  zex.object({ role: zex.literal('user'), content: zex.string() })
);

const DURequest = zex.object({
  messages: zex.array(DUMessage)
});

// Prepare Lua-like payloads where the role is provided as bytes in different encodings
const luaByteObjectRole = {
  messages: [
    { role: toZeroBasedByteObject('system'), content: 'hello' },
    { role: toZeroBasedByteObject('user'), content: 'hi' }
  ]
};

const luaUint8ArrayRole = {
  messages: [
    { role: enc.encode('system'), content: 'hello' },
    { role: enc.encode('user'), content: 'hi' }
  ]
};

// Desired behavior: should SUCCEED after the fix
expectOk('union-literal: role as zero-based byte object decodes and parses', () => Request.parseFromLua(luaByteObjectRole as any));
expectOk('union-literal: role as Uint8Array decodes and parses', () => Request.parseFromLua(luaUint8ArrayRole as any));

expectOk('discriminated-union: role as zero-based byte object decodes and parses', () => DURequest.parseFromLua(luaByteObjectRole as any));
expectOk('discriminated-union: role as Uint8Array decodes and parses', () => DURequest.parseFromLua(luaUint8ArrayRole as any));


