// utils/lua.ts - Shared helpers for Lua/byte normalization
// =============================================================================

export function decodePossibleUtf8Bytes(data: unknown): unknown {
  if (data instanceof Uint8Array) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(data);
    } catch {
      return data;
    }
  }
  return data;
}


