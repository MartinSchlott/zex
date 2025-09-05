// utils/lua.ts - Shared helpers for Lua/byte normalization
// =============================================================================

export function decodePossibleUtf8Bytes(data: unknown): unknown {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    if (data instanceof Uint8Array) return decoder.decode(data);
    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      return decoder.decode(new Uint8Array(data));
    }
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
      return decoder.decode(new Uint8Array(data as unknown as Buffer));
    }
    if (data && typeof data === 'object') {
      const obj: any = data;
      if ((obj.type === 'Buffer' || obj._type === 'Buffer') && Array.isArray(obj.data)) {
        return decoder.decode(Uint8Array.from(obj.data as number[]));
      }
      const keys = Object.keys(obj);
      if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
        const ints = keys.map(k => parseInt(k, 10)).sort((a, b) => a - b);
        let isZeroBasedContiguous = true;
        for (let i = 0; i < ints.length; i++) if (ints[i] !== i) { isZeroBasedContiguous = false; break; }
        if (isZeroBasedContiguous) {
          const arr = new Uint8Array(ints.length);
          for (let i = 0; i < ints.length; i++) arr[i] = obj[String(i)] as number;
          return decoder.decode(arr);
        }
      }
    }
  } catch {}
  return data;
}


