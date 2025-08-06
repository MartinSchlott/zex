import { zex } from '../zex/index';

const schema = {
  type: 'object',
  properties: {
    messages: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            properties: {
              createdAt: { type: 'number', default: 0 },
              tokenCount: { type: 'number', default: 0 },
              role: { const: 'system' },
              content: { type: 'string' }
            },
            required: ['role', 'content'],
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'number', default: 0 },
              tokenCount: { type: 'number', default: 0 },
              role: { const: 'user' },
              content: { type: 'string' },
              outputSchema: {
                type: 'object',
                properties: {},
                additionalProperties: true
              }
            },
            required: ['role', 'content'],
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'number', default: 0 },
              tokenCount: { type: 'number', default: 0 },
              role: { const: 'assistant' },
              content: { type: 'string' },
              structured: {
                type: 'object',
                properties: {},
                additionalProperties: true
              },
              toolCalls: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    toolName: { type: 'string' },
                    arguments: { type: 'object', properties: {}, additionalProperties: true }
                  },
                  required: ['id', 'toolName', 'arguments'],
                  additionalProperties: false
                }
              },
              stopReason: {
                enum: [
                  'stop', 'length', 'content-filter', 'tool-calls', 'error', 'other', 'unknown'
                ]
              }
            },
            required: ['role', 'content'],
            additionalProperties: false
          },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'number', default: 0 },
              tokenCount: { type: 'number', default: 0 },
              role: { const: 'tool' },
              content: { type: 'string' },
              id: { type: 'string' },
              name: { type: 'string' }
            },
            required: ['role', 'content', 'id', 'name'],
            additionalProperties: false
          }
        ]
      }
    },
    tools: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' }
        },
        required: ['name', 'description', 'inputSchema'],
        additionalProperties: false
      }
    }
  },
  required: ['messages'],
  additionalProperties: false
};

const data = {
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
      createdAt: 1754474081117,
      tokenCount: 0
    },
    {
      role: 'user',
      content: 'Hi',
      createdAt: 1754474081117,
      tokenCount: 0
    },
    {
      role: 'assistant',
      content: 'Hi there! How can I help you today?\n',
      createdAt: 1754474090121,
      tokenCount: 11,
      stopReason: 'STOP'
    },
    {
      role: 'user',
      content: 'Just here',
      createdAt: 1754474099714,
      tokenCount: 0
    }
  ],
  tools: []
};

describe('LLM ConversationState Union Array Bug', () => {
  it('should validate the conversation state with union array items', () => {
    const zexSchema = zex.fromJsonSchema(schema);
    const result = zexSchema.safeParse(data);
    if (!result.success) {
      console.error('Validation error:', result.error);
    }
    expect(result.success).toBe(true);
  });
});