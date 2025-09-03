import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== INTEGRATION: SupabaseConfig ===");

export const SupabaseConfigSchema = zex.object({
  restUrl: zex.url().describe("Supabase REST base URL e.g. https://<project>.supabase.co/rest/v1"),
  apiKey: zex.string().min(10).describe("Service role or user token"),
  expose: zex.object({
    tables: zex.object({
      mode: zex.enum(["all", "none"]).default("all"),
      exclude: zex.array(zex.string()).optional(),
      includeSchemas: zex.array(zex.string()).optional(),
      excludeSchemas: zex.array(zex.string()).optional()
    }).default({ mode: "all" }),
    views: zex.object({
      mode: zex.enum(["all", "none"]).default("all"),
      exclude: zex.array(zex.string()).optional(),
      includeSchemas: zex.array(zex.string()).optional(),
      excludeSchemas: zex.array(zex.string()).optional()
    }).default({ mode: "all" }),
    rpc: zex.object({
      mode: zex.enum(["all", "none"]).default("all"),
      exclude: zex.array(zex.string()).optional()
    }).default({ mode: "all" })
  }).default({ tables: { mode: "all" }, views: { mode: "all" }, rpc: { mode: "all" } }),
  options: zex.object({
    defaultLimit: zex.number().int().min(1).default(100),
    maxLimit: zex.number().int().min(1).default(1000),
    requestTimeoutMs: zex.number().int().min(1).default(10000),
    paginationMode: zex.enum(["range-headers", "query-params"]).default("range-headers"),
    caseSensitivity: zex.enum(["preserve", "lower"]).default("preserve")
  }).default({ defaultLimit: 100, maxLimit: 1000, requestTimeoutMs: 10000, paginationMode: "range-headers", caseSensitivity: "preserve" })
});

const sample = {
  expose: {
    tables: { mode: "all" },
    views: { mode: "all" },
    rpc: { mode: "all" }
  },
  options: {
    defaultLimit: 100,
    maxLimit: 1000,
    requestTimeoutMs: 10000,
    paginationMode: "range-headers",
    caseSensitivity: "preserve"
  },
  apiKey: "asdf68s7f887d8ahi",
  restUrl: "https://fufu38943.supabase.co"
};

expectOk('SupabaseConfig parses provided sample', () => SupabaseConfigSchema.parse(sample));

const sampleOmittingOptionals = {
  expose: {
    tables: { mode: "all" },
    views: { mode: "all" },
    rpc: { mode: "all" }
  },
  options: {
    defaultLimit: 100,
    maxLimit: 1000,
    requestTimeoutMs: 10000,
    paginationMode: "range-headers",
    caseSensitivity: "preserve"
  },
  apiKey: "asdf68s7f887d8ahi",
  restUrl: "https://fufu38943.supabase.co"
};

expectOk('SupabaseConfig parses when optional arrays are omitted', () => SupabaseConfigSchema.parse(sampleOmittingOptionals));

// Reproduce error: optional arrays present as keys with explicit undefined
const sampleWithUndefined = {
  restUrl: "https://jvsnnnkilqkezcwsymdr.supabase.co",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2c25ubmtpbHFrZXpjd3N5bWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgyNzIzNiwiZXhwIjoyMDcyNDAzMjM2fQ.K1IZRbIoWvMxz5RGyv6c-2Q8KJFN2aJV68QrH6aILj8",
  expose: {
    tables: {
      mode: "all",
      exclude: undefined,
      includeSchemas: undefined,
      excludeSchemas: undefined,
    },
    views: {
      mode: "all",
      exclude: undefined,
      includeSchemas: undefined,
      excludeSchemas: undefined,
    },
    rpc: {
      mode: "all",
      exclude: undefined,
    },
  },
  options: {
    defaultLimit: 100,
    maxLimit: 1000,
    requestTimeoutMs: 10000,
    paginationMode: "range-headers",
    caseSensitivity: "preserve",
  },
};

import { expectFail } from '../_utils.js';
// Previously failed, now should succeed due to object-layer handling of undefined as missing
expectOk('SupabaseConfig parses when optional arrays are explicitly undefined', () => SupabaseConfigSchema.parse(sampleWithUndefined as any));

const res = SupabaseConfigSchema.safeParse(sampleWithUndefined as any);
if (!res.success) {
  console.log('Observed error message:', res.error);
}
