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

  // Assert defaults for createdAt/tokenCount are applied after JSONSchema roundtrip
  const m0 = out.messages[0] as any;
  const m1 = out.messages[1] as any;
  if (typeof m0.createdAt !== 'number' || m0.createdAt !== 0) {
    console.error('❌ messages[0].createdAt default missing or wrong:', m0.createdAt);
    throw new Error('LLM roundtrip: expected messages[0].createdAt === 0');
  } else {
    console.log('✅ messages[0].createdAt defaulted to 0');
  }
  if (typeof m0.tokenCount !== 'number' || m0.tokenCount !== 0) {
    console.error('❌ messages[0].tokenCount default missing or wrong:', m0.tokenCount);
    throw new Error('LLM roundtrip: expected messages[0].tokenCount === 0');
  } else {
    console.log('✅ messages[0].tokenCount defaulted to 0');
  }
  if (typeof m1.createdAt !== 'number' || m1.createdAt !== 0) {
    console.error('❌ messages[1].createdAt default missing or wrong:', m1.createdAt);
    throw new Error('LLM roundtrip: expected messages[1].createdAt === 0');
  } else {
    console.log('✅ messages[1].createdAt defaulted to 0');
  }
  if (typeof m1.tokenCount !== 'number' || m1.tokenCount !== 0) {
    console.error('❌ messages[1].tokenCount default missing or wrong:', m1.tokenCount);
    throw new Error('LLM roundtrip: expected messages[1].tokenCount === 0');
  } else {
    console.log('✅ messages[1].tokenCount defaulted to 0');
  }

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

// -----------------------------
// 5) Reproduce BigInt timestamp issue via fromJsonSchema + safeParse
// -----------------------------
const exactJsonSchema = {
  type: "object",
  properties: {
    messages: {
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            properties: {
              createdAt: { type: "number", description: "Unix timestamp (ms) when the message was created.", default: 0 },
              tokenCount: { type: "number", description: "Estimated or measured number of tokens in this message.", default: 0 },
              role: { const: "system" },
              content: { type: "string", description: "System prompt content injected into the conversation." },
            },
            required: ["role", "content"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              createdAt: { type: "number", description: "Unix timestamp (ms) when the message was created.", default: 0 },
              tokenCount: { type: "number", description: "Estimated or measured number of tokens in this message.", default: 0 },
              role: { const: "user" },
              content: { type: "string", description: "User's message content." },
              outputSchema: { type: "object", format: "record", properties: {}, additionalProperties: true, description: "Schema for the response of the user message. If not provided, the response will be a string." },
            },
            required: ["role", "content"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              createdAt: { type: "number", description: "Unix timestamp (ms) when the message was created.", default: 0 },
              tokenCount: { type: "number", description: "Estimated or measured number of tokens in this message.", default: 0 },
              role: { const: "assistant" },
              content: { type: "string", description: "Assistant's textual response, or null if only tool calls were made." },
              structured: { type: "object", format: "record", properties: {}, additionalProperties: true, description: "Parsed JSON object when the user message specified an outputSchema and the response was valid JSON." },
              toolCalls: { type: "array", items: { type: "object", properties: { id: { type: "string", description: "ID of the tool call given by the LLM." }, toolName: { type: "string", description: "Name of the tool to be called." }, arguments: { type: "object", format: "record", properties: {}, additionalProperties: true, description: "Arguments for the function, als JSON-Objekt." } }, required: ["id", "toolName", "arguments"], additionalProperties: false }, description: "Tool calls issued by the assistant." },
              stopReason: { enum: ["stop", "length", "content-filter", "tool-calls", "error", "other", "unknown"], description: "Reason for stopping the LLM response." },
            },
            required: ["role", "content"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              createdAt: { type: "number", description: "Unix timestamp (ms) when the message was created.", default: 0 },
              tokenCount: { type: "number", description: "Estimated or measured number of tokens in this message.", default: 0 },
              role: { const: "tool" },
              content: { type: "string", description: "Serialized result string of the tool's output." },
              id: { type: "string", description: "ID of the ToolCall this tool message responds to. The ID was given by the LLM." },
              name: { type: "string", description: "Name of the tool/function that was executed." },
            },
            required: ["role", "content", "id", "name"],
            additionalProperties: false,
          },
        ],
        discriminator: { propertyName: "role" },
        description: "LLMMessage - Any message in the conversation with role-specific structure.",
      },
      description: "Chronological sequence of exchanged messages.",
    },
    tools: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string", description: "Unique tool identifier" }, description: { type: "string", description: "Description of what this endpoint does" }, inputSchema: { type: "object", format: "jsonschema", description: "JSON Schema for input validation" }, outputSchema: { type: "object", format: "jsonschema", description: "JSON Schema for output structure" } }, required: ["name", "description", "inputSchema"], additionalProperties: false, description: "Operator endpoint definition" },
      description: "Tools available to the assistant in this session.",
    },
  },
  required: ["messages"],
  additionalProperties: false,
  description: "LLMConversationState - Represents the current context of an assistant session.",
} as const;

const roundtrip = zex.fromJsonSchema(exactJsonSchema);

// BigInt timestamps sample
const sampleWithBigInt = {
  messages: [
    { role: "system", content: "You are a helpful assistant.", createdAt: 1757875291589n, tokenCount: 0 },
    { role: "user", content: "test", createdAt: 1757875291589n, tokenCount: 0 },
  ],
  tools: [],
};

console.log("Running safeParse on sampleWithBigInt...");
const r2 = roundtrip.safeParse(sampleWithBigInt);
if (!r2.success) {
  console.log("❌ safeParse failed as expected with BigInt createdAt:", r2.error);
} else {
  console.log("✅ safeParse unexpectedly succeeded:", r2.data);
}
