// llm-schema.test.ts - Comprehensive LLM Schema Tests
// =============================================================================

import { zex } from "../zex/index.js";

console.log("=== LLM Schema Comprehensive Tests ===");

// Define the LLM schemas using zex
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
  id: zex.string().describe("ID of the tool call given by the LLM."),
  toolName: zex.string().describe("Name of the tool to be called."),
  arguments: zex.record(zex.any()).describe("Arguments for the function, als JSON-Objekt."),
});

const LLMToolEntrySchema = zex.object({
  name: zex.string().describe("Unique tool identifier"),
  description: zex.string().describe("Description of what this endpoint does"),
  inputSchema: zex.jsonschema().describe("JSON Schema for input validation"),
  outputSchema: zex.jsonschema().optional().describe("JSON Schema for output structure"),
});

const LLMBaseMessageSchema = zex.object({
  createdAt: zex.number().describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().describe("Estimated or measured number of tokens in this message."),
});

const LLMSystemMessageSchema = zex.object({
  createdAt: zex.number().describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().describe("Estimated or measured number of tokens in this message."),
  role: zex.literal("system"),
  content: zex.string().describe("System prompt content injected into the conversation."),
});

const LLMUserMessageSchema = zex.object({
  createdAt: zex.number().describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().describe("Estimated or measured number of tokens in this message."),
  role: zex.literal("user"),
  content: zex.string().describe("User's message content."),
  outputSchema: zex.record(zex.any()).optional().describe("Schema for the response of the user message. If not provided, the response will be a string."),
});

const LLMAssistantMessageSchema = zex.object({
  createdAt: zex.number().describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().describe("Estimated or measured number of tokens in this message."),
  role: zex.literal("assistant"),
  content: zex.string().nullable().describe("Assistant's textual response, or null if only tool calls were made."),
  structured: zex.record(zex.any()).optional().describe("Parsed JSON object when the user message specified an outputSchema and the response was valid JSON."),
  toolCalls: zex.array(LLMToolCallSchema).optional().describe("Tool calls issued by the assistant."),
  stopReason: LLMStopReasonSchema.optional().describe("Reason for stopping the LLM response."),
});

const LLMToolMessageSchema = zex.object({
  createdAt: zex.number().describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().describe("Estimated or measured number of tokens in this message."),
  role: zex.literal("tool"),
  content: zex.string().describe("Serialized result string of the tool's output."),
  id: zex.string().describe("ID of the ToolCall this tool message responds to. The ID was given by the LLM."),
  name: zex.string().describe("Name of the tool/function that was executed."),
});

const LLMMessageSchema = zex.union(
  LLMSystemMessageSchema,
  LLMUserMessageSchema,
  LLMAssistantMessageSchema,
  LLMToolMessageSchema
);

const LLMConversationStateSchema = zex.object({
  messages: zex.array(LLMMessageSchema).describe("Chronological sequence of exchanged messages."),
  tools: zex.array(LLMToolEntrySchema).optional().describe("Tools available to the assistant in this session."),
});

// Test 1: Valid System Message (Normal JSON)
console.log("\n--- Test 1: Valid System Message (Normal JSON) ---");
const validSystemMessage = {
  createdAt: 1703123456789,
  tokenCount: 45,
  role: "system",
  content: "You are a helpful AI assistant."
};

try {
  const parsedSystemMessage = LLMSystemMessageSchema.parse(validSystemMessage);
  console.log("✅ Valid system message parsed successfully:", parsedSystemMessage);
  console.log("   Role:", parsedSystemMessage.role);
  console.log("   Content:", parsedSystemMessage.content);
  console.log("   Token count:", parsedSystemMessage.tokenCount);
} catch (error) {
  console.log("❌ System message parsing failed:", error);
}

// Test 2: Valid User Message (Normal JSON)
console.log("\n--- Test 2: Valid User Message (Normal JSON) ---");
const validUserMessage = {
  createdAt: 1703123456790,
  tokenCount: 12,
  role: "user",
  content: "Hello, how are you?",
  outputSchema: {
    type: "object",
    properties: {
      greeting: { type: "string" },
      mood: { type: "string" }
    }
  }
};

try {
  const parsedUserMessage = LLMUserMessageSchema.parse(validUserMessage);
  console.log("✅ Valid user message parsed successfully:", parsedUserMessage);
  console.log("   Role:", parsedUserMessage.role);
  console.log("   Content:", parsedUserMessage.content);
  console.log("   Has outputSchema:", !!parsedUserMessage.outputSchema);
} catch (error) {
  console.log("❌ User message parsing failed:", error);
}

// Test 3: Valid Assistant Message with Tool Calls (Normal JSON)
console.log("\n--- Test 3: Valid Assistant Message with Tool Calls (Normal JSON) ---");
const validAssistantMessage = {
  createdAt: 1703123456791,
  tokenCount: 156,
  role: "assistant",
  content: "I'll help you with that.",
  toolCalls: [
    {
      id: "call_123",
      toolName: "get_weather",
      arguments: {
        location: "Berlin",
        unit: "celsius"
      }
    }
  ],
  stopReason: "tool-calls"
};

try {
  const parsedAssistantMessage = LLMAssistantMessageSchema.parse(validAssistantMessage);
  console.log("✅ Valid assistant message parsed successfully:", parsedAssistantMessage);
  console.log("   Role:", parsedAssistantMessage.role);
  console.log("   Content:", parsedAssistantMessage.content);
  console.log("   Tool calls count:", (parsedAssistantMessage.toolCalls as any[])?.length || 0);
  console.log("   Stop reason:", parsedAssistantMessage.stopReason);
} catch (error) {
  console.log("❌ Assistant message parsing failed:", error);
}

// Test 4: Valid Tool Message (Normal JSON)
console.log("\n--- Test 4: Valid Tool Message (Normal JSON) ---");
const validToolMessage = {
  createdAt: 1703123456792,
  tokenCount: 89,
  role: "tool",
  content: '{"temperature": 15, "condition": "partly cloudy"}',
  id: "call_123",
  name: "get_weather"
};

try {
  const parsedToolMessage = LLMToolMessageSchema.parse(validToolMessage);
  console.log("✅ Valid tool message parsed successfully:", parsedToolMessage);
  console.log("   Role:", parsedToolMessage.role);
  console.log("   Content:", parsedToolMessage.content);
  console.log("   Tool ID:", parsedToolMessage.id);
  console.log("   Tool name:", parsedToolMessage.name);
} catch (error) {
  console.log("❌ Tool message parsing failed:", error);
}

// Test 5: Valid Conversation State (Normal JSON)
console.log("\n--- Test 5: Valid Conversation State (Normal JSON) ---");
const validConversationState = {
  messages: [
    {
      createdAt: 1703123456789,
      tokenCount: 45,
      role: "system",
      content: "You are a helpful AI assistant."
    },
    {
      createdAt: 1703123456790,
      tokenCount: 12,
      role: "user",
      content: "Hello, how are you?"
    },
    {
      createdAt: 1703123456791,
      tokenCount: 156,
      role: "assistant",
      content: "I'll help you with that.",
      toolCalls: [
        {
          id: "call_123",
          toolName: "get_weather",
          arguments: {
            location: "Berlin",
            unit: "celsius"
          }
        }
      ],
      stopReason: "tool-calls"
    },
    {
      createdAt: 1703123456792,
      tokenCount: 89,
      role: "tool",
      content: '{"temperature": 15, "condition": "partly cloudy"}',
      id: "call_123",
      name: "get_weather"
    }
  ],
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a location",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] }
        },
        required: ["location"]
      },
      outputSchema: {
        type: "object",
        properties: {
          temperature: { type: "number" },
          condition: { type: "string" }
        }
      }
    }
  ]
};

try {
  const parsedConversationState = LLMConversationStateSchema.parse(validConversationState);
  console.log("✅ Valid conversation state parsed successfully");
  console.log("   Messages count:", (parsedConversationState.messages as any[]).length);
  console.log("   Tools count:", (parsedConversationState.tools as any[])?.length || 0);
  console.log("   First message role:", (parsedConversationState.messages as any[])[0].role);
  console.log("   Last message role:", (parsedConversationState.messages as any[])[3].role);
} catch (error) {
  console.log("❌ Conversation state parsing failed:", error);
}

// Test 6: Lua-style Assistant Message
console.log("\n--- Test 6: Lua-style Assistant Message ---");
const luaAssistantMessage = {
  createdAt: 1703123456791,
  tokenCount: 156,
  role: "assistant",
  content: "I'll help you with that.",
  toolCalls: {
    [1]: {
      id: "call_123",
      toolName: "get_weather",
      arguments: {
        location: "Berlin",
        unit: "celsius"
      }
    },
    [2]: {
      id: "call_124",
      toolName: "get_time",
      arguments: {
        timezone: "Europe/Berlin"
      }
    }
  },
  stopReason: "tool-calls"
};

try {
  const parsedLuaAssistantMessage = LLMAssistantMessageSchema.parseFromLua(luaAssistantMessage);
  console.log("✅ Lua-style assistant message parsed successfully:", parsedLuaAssistantMessage);
  console.log("   Tool calls count:", (parsedLuaAssistantMessage.toolCalls as any[])?.length || 0);
  console.log("   First tool call ID:", (parsedLuaAssistantMessage.toolCalls as any[])?.[0]?.id);
  console.log("   Second tool call ID:", (parsedLuaAssistantMessage.toolCalls as any[])?.[1]?.id);
} catch (error) {
  console.log("❌ Lua-style assistant message parsing failed:", error);
}

// Test 7: Lua-style Conversation State
console.log("\n--- Test 7: Lua-style Conversation State ---");
const luaConversationState = {
  messages: {
    [1]: {
      createdAt: 1703123456789,
      tokenCount: 45,
      role: "system",
      content: "You are a helpful AI assistant."
    },
    [2]: {
      createdAt: 1703123456790,
      tokenCount: 12,
      role: "user",
      content: "Hello, how are you?"
    },
    [3]: {
      createdAt: 1703123456791,
      tokenCount: 156,
      role: "assistant",
      content: "I'll help you with that.",
      toolCalls: {
        [1]: {
          id: "call_123",
          toolName: "get_weather",
          arguments: {
            location: "Berlin",
            unit: "celsius"
          }
        }
      },
      stopReason: "tool-calls"
    }
  },
  tools: {
    [1]: {
      name: "get_weather",
      description: "Get current weather for a location",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string" },
          unit: { type: "string", enum: ["celsius", "fahrenheit"] }
        },
        required: ["location"]
      }
    }
  }
};

try {
  const parsedLuaConversationState = LLMConversationStateSchema.parseFromLua(luaConversationState);
  console.log("✅ Lua-style conversation state parsed successfully");
  console.log("   Messages count:", (parsedLuaConversationState.messages as any[]).length);
  console.log("   Tools count:", (parsedLuaConversationState.tools as any[])?.length || 0);
  console.log("   First message role:", (parsedLuaConversationState.messages as any[])[0].role);
  console.log("   Last message role:", (parsedLuaConversationState.messages as any[])[2].role);
} catch (error) {
  console.log("❌ Lua-style conversation state parsing failed:", error);
}

// Test 8: Invalid Message - Missing Required Fields
console.log("\n--- Test 8: Invalid Message - Missing Required Fields ---");
const invalidMessage = {
  role: "user",
  content: "Hello"
  // Missing createdAt and tokenCount
};

try {
  const parsedInvalidMessage = LLMUserMessageSchema.parse(invalidMessage);
  console.log("❌ Invalid message should have failed but didn't:", parsedInvalidMessage);
} catch (error) {
  console.log("✅ Invalid message correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 9: Invalid Message - Wrong Role
console.log("\n--- Test 9: Invalid Message - Wrong Role ---");
const wrongRoleMessage = {
  createdAt: 1703123456789,
  tokenCount: 45,
  role: "invalid-role",
  content: "This should fail"
};

try {
  const parsedWrongRoleMessage = LLMUserMessageSchema.parse(wrongRoleMessage);
  console.log("❌ Wrong role message should have failed but didn't:", parsedWrongRoleMessage);
} catch (error) {
  console.log("✅ Wrong role message correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 10: Invalid Stop Reason
console.log("\n--- Test 10: Invalid Stop Reason ---");
const invalidStopReasonMessage = {
  createdAt: 1703123456791,
  tokenCount: 156,
  role: "assistant",
  content: "I'll help you with that.",
  stopReason: "invalid-reason"
};

try {
  const parsedInvalidStopReason = LLMAssistantMessageSchema.parse(invalidStopReasonMessage);
  console.log("❌ Invalid stop reason should have failed but didn't:", parsedInvalidStopReason);
} catch (error) {
  console.log("✅ Invalid stop reason correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 11: Invalid Tool Call - Missing ID
console.log("\n--- Test 11: Invalid Tool Call - Missing ID ---");
const invalidToolCall = {
  toolName: "get_weather",
  arguments: {
    location: "Berlin"
  }
  // Missing id
};

try {
  const parsedInvalidToolCall = LLMToolCallSchema.parse(invalidToolCall);
  console.log("❌ Invalid tool call should have failed but didn't:", parsedInvalidToolCall);
} catch (error) {
  console.log("✅ Invalid tool call correctly rejected:", error instanceof Error ? error.message : String(error));
}

// Test 12: Safe Parse Tests
console.log("\n--- Test 12: Safe Parse Tests ---");

const safeParseResult = LLMSystemMessageSchema.safeParse(validSystemMessage);
console.log("✅ Safe parse success:", safeParseResult.success);
if (safeParseResult.success) {
  console.log("   Parsed data:", safeParseResult.data.role);
} else {
  console.log("   Error:", safeParseResult.error);
}

const safeParseFailResult = LLMSystemMessageSchema.safeParse(invalidMessage);
console.log("✅ Safe parse failure:", !safeParseFailResult.success);
if (!safeParseFailResult.success) {
  console.log("   Error:", safeParseFailResult.error);
} else {
  console.log("   Unexpected success:", safeParseFailResult.data);
}

// Test 13: JSON Schema Generation
console.log("\n--- Test 13: JSON Schema Generation ---");

const systemMessageJsonSchema = LLMSystemMessageSchema.toJsonSchema();
console.log("✅ System message JSON Schema generated");
console.log("   Type:", systemMessageJsonSchema.type);
console.log("   Properties count:", Object.keys(systemMessageJsonSchema.properties || {}).length);
console.log("   Required fields:", systemMessageJsonSchema.required?.length || 0);

const conversationStateJsonSchema = LLMConversationStateSchema.toJsonSchema();
console.log("✅ Conversation state JSON Schema generated");
console.log("   Type:", conversationStateJsonSchema.type);
console.log("   Has messages property:", !!conversationStateJsonSchema.properties?.messages);
console.log("   Has tools property:", !!conversationStateJsonSchema.properties?.tools);

console.log("\n✅ All LLM Schema tests completed!"); 