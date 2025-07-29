// lua-empty-object.test.ts - Lua Empty Object Transformation Tests
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== Lua Empty Object Transformation Tests ===");

// Test 1: Simple array with empty object that should become empty array
console.log("\n--- Test 1: Simple Array with Empty Object ---");
const simpleArraySchema = zex.array(zex.string());

const luaDataWithEmptyObject = {
  [1]: "first",
  [2]: "second",
  [3]: {} // This should become an empty array
};

try {
  const result = simpleArraySchema.parseFromLua(luaDataWithEmptyObject);
  console.log("✅ Lua data with empty object parsed successfully");
  console.log("   Input:", luaDataWithEmptyObject);
  console.log("   Output:", result);
  console.log("   Is array:", Array.isArray(result));
  console.log("   Length:", result.length);
} catch (error) {
  console.log("❌ Failed to parse Lua data with empty object:", error);
}

// Test 2: Nested structure with empty objects
console.log("\n--- Test 2: Nested Structure with Empty Objects ---");
const nestedSchema = zex.object({
  messages: zex.array(zex.object({
    content: zex.string(),
    tags: zex.array(zex.string()).optional()
  })),
  metadata: zex.object({
    tags: zex.array(zex.string()).optional(),
    categories: zex.array(zex.string()).optional()
  })
});

const nestedLuaData = {
  messages: {
    [1]: {
      content: "Hello",
      tags: {} // Should become empty array
    },
    [2]: {
      content: "World",
      tags: {
        [1]: "important",
        [2]: "urgent"
      }
    }
  },
  metadata: {
    tags: {}, // Should become empty array
    categories: {
      [1]: "tech",
      [2]: "ai"
    }
  }
};

try {
  const result = nestedSchema.parseFromLua(nestedLuaData);
  console.log("✅ Nested Lua structure parsed successfully");
  console.log("   First message tags:", (result.messages as any[])[0].tags);
  console.log("   Second message tags:", (result.messages as any[])[1].tags);
  console.log("   Metadata tags:", (result.metadata as any).tags);
  console.log("   Metadata categories:", (result.metadata as any).categories);
  console.log("   All tags are arrays:", 
    Array.isArray((result.messages as any[])[0].tags) &&
    Array.isArray((result.messages as any[])[1].tags) &&
    Array.isArray((result.metadata as any).tags) &&
    Array.isArray((result.metadata as any).categories)
  );
} catch (error) {
  console.log("❌ Failed to parse nested Lua structure:", error);
}

// Test 3: Mixed structure - some empty objects should stay objects
console.log("\n--- Test 3: Mixed Structure - Empty Objects vs Arrays ---");
const mixedSchema = zex.object({
  user: zex.object({
    name: zex.string(),
    preferences: zex.record(zex.any()).optional() // This should stay an object
  }),
  messages: zex.array(zex.string()).optional(), // This should become array
  settings: zex.object({
    theme: zex.string(),
    options: zex.record(zex.any()).optional() // This should stay an object
  })
});

const mixedLuaData = {
  user: {
    name: "John",
    preferences: {} // Should stay empty object (not array)
  },
  messages: {}, // Should become empty array
  settings: {
    theme: "dark",
    options: {} // Should stay empty object (not array)
  }
};

try {
  const result = mixedSchema.parseFromLua(mixedLuaData);
  console.log("✅ Mixed Lua structure parsed successfully");
  console.log("   User preferences (should be object):", (result.user as any).preferences);
  console.log("   Messages (should be array):", result.messages);
  console.log("   Settings options (should be object):", (result.settings as any).options);
  console.log("   Preferences is object:", typeof (result.user as any).preferences === 'object' && !Array.isArray((result.user as any).preferences));
  console.log("   Messages is array:", Array.isArray(result.messages));
  console.log("   Options is object:", typeof (result.settings as any).options === 'object' && !Array.isArray((result.settings as any).options));
} catch (error) {
  console.log("❌ Failed to parse mixed Lua structure:", error);
}

// Test 4: Complex LLM structure with empty objects
console.log("\n--- Test 4: Complex LLM Structure with Empty Objects ---");
const LLMStopReasonSchema = zex.union(
  zex.literal("stop"),
  zex.literal("length"),
  zex.literal("content-filter"),
  zex.literal("tool-calls"),
  zex.literal("error"),
  zex.literal("other"),
  zex.literal("unknown")
);

const LLMToolCallSchema = zex.object({
  id: zex.string(),
  toolName: zex.string(),
  arguments: zex.record(zex.any())
});

const LLMAssistantMessageSchema = zex.object({
  createdAt: zex.number(),
  tokenCount: zex.number(),
  role: zex.literal("assistant"),
  content: zex.string().nullable(),
  toolCalls: zex.array(LLMToolCallSchema).optional(),
  stopReason: LLMStopReasonSchema.optional()
});

const complexLLMData = {
  createdAt: 1703123456791,
  tokenCount: 156,
  role: "assistant",
  content: "I'll help you with that.",
  toolCalls: {}, // Should become empty array
  stopReason: "tool-calls"
};

try {
  const result = LLMAssistantMessageSchema.parseFromLua(complexLLMData);
  console.log("✅ Complex LLM structure parsed successfully");
  console.log("   Tool calls (should be empty array):", result.toolCalls);
  console.log("   Tool calls is array:", Array.isArray(result.toolCalls));
  console.log("   Tool calls length:", (result.toolCalls as any[])?.length || 0);
  console.log("   Stop reason:", result.stopReason);
} catch (error) {
  console.log("❌ Failed to parse complex LLM structure:", error);
}

// Test 5: Edge case - empty object in non-array context
console.log("\n--- Test 5: Edge Case - Empty Object in Non-Array Context ---");
const edgeCaseSchema = zex.object({
  data: zex.record(zex.any()), // This should stay an object
  items: zex.array(zex.string()).optional() // This should become array
});

const edgeCaseData = {
  data: {}, // Should stay empty object
  items: {} // Should become empty array
};

try {
  const result = edgeCaseSchema.parseFromLua(edgeCaseData);
  console.log("✅ Edge case parsed successfully");
  console.log("   Data (should be object):", result.data);
  console.log("   Items (should be array):", result.items);
  console.log("   Data is object:", typeof result.data === 'object' && !Array.isArray(result.data));
  console.log("   Items is array:", Array.isArray(result.items));
} catch (error) {
  console.log("❌ Failed to parse edge case:", error);
}

console.log("\n✅ All Lua Empty Object Transformation tests completed!"); 