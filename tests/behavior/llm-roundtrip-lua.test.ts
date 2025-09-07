import { zex } from '../_imports.js';

console.log("\n=== BEHAVIOR: LLM roundtrip (zex -> jsonschema -> zex) + safeParseFromLua ===");

// -----------------------------
// 1) Define zex schema (from user's definition)
// -----------------------------
export const LLMStopReasonValues = [
  'stop',
  'length',
  'content-filter',
  'tool-calls',
  'error',
  'other',
  'unknown'
] as const;

export const LLMStopReasonSchema = zex.enum(LLMStopReasonValues);

export const LLMToolEntrySchema = zex.object({
  name: zex.string().describe("Unique tool identifier"),
  description: zex.string().describe("Description of what this endpoint does"),
  inputSchema: zex.jsonschema().describe("JSON Schema for input validation"),
  outputSchema: zex.jsonschema().optional().describe("JSON Schema for output structure"),
}).describe("Operator endpoint definition");

const LLMBaseMessageSchema = zex.object({
  createdAt: zex.number().default(0).describe("Unix timestamp (ms) when the message was created."),
  tokenCount: zex.number().default(0).describe("Estimated or measured number of tokens in this message."),
});

export const LLMSystemMessageSchema = LLMBaseMessageSchema.extend({
  role: zex.literal("system"),
  content: zex.string().describe("System prompt content injected into the conversation."),
});

export const LLMUserMessageSchema = LLMBaseMessageSchema.extend({
  role: zex.literal("user"),
  content: zex.string().describe("User's message content."),
  // Use dedicated jsonschema type to ensure deep Lua byte-string normalization
  outputSchema: zex.jsonschema().optional().describe("Schema for the response of the user message. If not provided, the response will be a string."),
});

export const LLMToolCallSchema = zex.object({
  id: zex.string().describe("ID of the tool call given by the LLM."),
  toolName: zex.string().describe("Name of the tool to be called."),
  arguments: zex.record(zex.any()).describe("Arguments for the function, als JSON-Objekt."),
});

export const LLMAssistantMessageSchema = LLMBaseMessageSchema.extend({
  role: zex.literal("assistant"),
  content: zex.string().nullable().describe("Assistant's textual response, or null if only tool calls were made."),
  structured: zex.record(zex.any()).optional().describe("Parsed JSON object when the user message specified an outputSchema and the response was valid JSON."),
  toolCalls: zex.array(LLMToolCallSchema).optional().describe("Tool calls issued by the assistant."),
  stopReason: LLMStopReasonSchema.optional().describe("Reason for stopping the LLM response."),
});

export const LLMToolMessageSchema = LLMBaseMessageSchema.extend({
  role: zex.literal("tool"),
  content: zex.string().describe("Serialized result string of the tool's output."),
  id: zex.string().describe("ID of the ToolCall this tool message responds to. The ID was given by the LLM."),
  name: zex.string().describe("Name of the tool/function that was executed."),
});

export const LLMMessageSchema = zex.discriminatedUnion("role",
  LLMSystemMessageSchema,
  LLMUserMessageSchema,
  LLMAssistantMessageSchema,
  LLMToolMessageSchema,
).describe("LLMMessage - Any message in the conversation with role-specific structure.");

export const LLMConversationStateSchema = zex.object({
  messages: zex.array(LLMMessageSchema).describe("Chronological sequence of exchanged messages."),
  tools: zex.array(LLMToolEntrySchema).optional().describe("Tools available to the assistant in this session."),
}).describe("LLMConversationState - Represents the current context of an assistant session.");

// -----------------------------
// 2) Export to JSON Schema and re-import
// -----------------------------
const roundtripJsonSchema = LLMConversationStateSchema.toJSONSchema();
const recreatedSchema = zex.fromJsonSchema(roundtripJsonSchema);

console.log("Exported JSON Schema created and re-imported into zex schema.");

// -----------------------------
// 3) Lua-shaped data (Uint8Array bytes) — reuse structure from existing record-bytes test but smaller
// -----------------------------
const luaData = {
  messages: [
    {
      role: new Uint8Array([115, 121, 115, 116, 101, 109]), // "system"
      content: new Uint8Array([83, 121, 115, 116, 101, 109, 32, 112, 114, 111, 109, 112, 116]), // "System prompt"
    },
    {
      role: new Uint8Array([117, 115, 101, 114]), // "user"
      content: new Uint8Array([72, 105]), // "Hi"
      outputSchema: {
        type: new Uint8Array([111, 98, 106, 101, 99, 116]), // "object"
        properties: {
          topics: {
            type: new Uint8Array([97, 114, 114, 97, 121]), // "array"
            items: {
              type: new Uint8Array([111, 98, 106, 101, 99, 116]), // "object"
              properties: {
                headline: { type: new Uint8Array([115, 116, 114, 105, 110, 103]) }, // "string"
                content: { type: new Uint8Array([115, 116, 114, 105, 110, 103]) },
                url: { type: new Uint8Array([115, 116, 114, 105, 110, 103]) },
                source: { type: new Uint8Array([115, 116, 114, 105, 110, 103]) },
                date: { type: new Uint8Array([115, 116, 114, 105, 110, 103]) },
              },
              required: [
                new Uint8Array([104, 101, 97, 100, 108, 105, 110, 101]), // "headline"
                new Uint8Array([99, 111, 110, 116, 101, 110, 116]), // "content"
                new Uint8Array([115, 111, 117, 114, 99, 101]), // "source"
                new Uint8Array([100, 97, 116, 101]), // "date"
              ],
              additionalProperties: false,
            },
          },
        },
        required: [ new Uint8Array([116, 111, 112, 105, 99, 115]) ], // "topics"
        additionalProperties: false,
      },
    }
  ]
};

// -----------------------------
// 4) Run safeParseFromLua and report
// -----------------------------
console.log("Running safeParseFromLua on recreated schema...");
const result = recreatedSchema.safeParseFromLua(luaData);

if (!result.success) {
  console.log("❌ safeParseFromLua failed:", result.error);
} else {
  console.log("✅ safeParseFromLua succeeded");
  const out = result.data;
  console.log("Result messages length:", out.messages.length);
  console.log("Result messages[1].role:", out.messages[1].role);
  console.log("Result messages[1].outputSchema:", out.messages[1].outputSchema);

  const outputSchema = out.messages[1].outputSchema as any;
  if (outputSchema && outputSchema.type === "object") {
    const isConverted =
      outputSchema.properties?.topics?.type === "array" &&
      outputSchema.properties?.topics?.items?.properties?.headline?.type === "string" &&
      Array.isArray(outputSchema.required) &&
      outputSchema.required.includes("topics");

    if (isConverted) {
      console.log("✅ Uint8Array values properly converted to strings in nested outputSchema");
    } else {
      console.log("❌ Uint8Array values not properly converted in nested outputSchema");
      console.log("Observed:", {
        type: outputSchema.type,
        topicsType: outputSchema.properties?.topics?.type,
        headlineType: outputSchema.properties?.topics?.items?.properties?.headline?.type,
        required: outputSchema.required,
      });
    }
  } else {
    console.log("❌ outputSchema missing or not an object (this is the bug)");
  }
}
