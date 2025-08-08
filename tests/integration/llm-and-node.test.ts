import { zex } from '../_imports.js';
import { expectOk, expectFail } from '../_utils.js';

console.log("\n=== INTEGRATION: LLM schema & node structure ===");

const LLMStopReason = zex.enum(['stop','length','content-filter','tool-calls','error','other','unknown'] as const);
const LLMToolCall = zex.object({
  tool: zex.string(),
  input: zex.record(zex.any()).optional(),
});

const LLMResponse = zex.object({
  text: zex.string().optional(),
  structured: zex.record(zex.any()).optional(),
  toolCalls: zex.array(LLMToolCall).optional(),
  stopReason: LLMStopReason.optional(),
});

const NodeRef = zex.object({
  uri: zex.uri().optional(),
  description: zex.string().optional(),
});

const Node = zex.object({
  id: zex.string(),
  tags: zex.array(zex.string()).optional(),
  ref: NodeRef.optional(),
  outputSchema: zex.jsonschema().optional(),
});

expectOk('LLMResponse minimal', () => LLMResponse.parse({}));
expectOk('Node minimal', () => Node.parse({ id: 'n1' }));
expectFail('Node unknown prop rejected', () => Node.parse({ id: 'n1', x: 1 } as any));

