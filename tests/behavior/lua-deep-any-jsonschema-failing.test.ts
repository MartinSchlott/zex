import { zex } from '../_imports.js';
import { expectOk } from '../_utils.js';

console.log("\n=== BEHAVIOR: deep any + jsonschema bytes→string (expected to fail in current version) ===");

function toByteLikeObject(str: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) out[String(i)] = str.charCodeAt(i);
  return out;
}

// Schema under test
const NodeConfig = zex.object({
  configuration: zex.any().describe('main config'),
  configSchema: zex.jsonschema().describe('JSON Schema for configuration settings')
}).passthrough();

// Lua-like payload with byte-like objects where strings should be
const payload = {
  configuration: {
    name: toByteLikeObject('topic-aggregator'),
    nested: {
      k: toByteLikeObject('v')
    }
  },
  configSchema: {
    type: toByteLikeObject('object'),
    properties: {
      duplicateThinkletUri: {
        type: toByteLikeObject('string'),
        format: toByteLikeObject('uri'),
        description: toByteLikeObject('URI of the thinklet that performs duplicate detection'),
        examples: [ toByteLikeObject('tool:/thinklet/duplicate-detector/checkDuplicate') ]
      }
    },
    required: [ toByteLikeObject('duplicateThinkletUri') ]
  }
};

expectOk('deep any+jsonschema should produce JS strings (will fail currently)', () => {
  const out = NodeConfig.parseFromLua(payload as any) as any;

  // configuration.name must be JS string
  if (typeof out.configuration?.name !== 'string') {
    throw new Error(`configuration.name expected string, got ${typeof out.configuration?.name}`);
  }
  // configSchema.type must be 'object'
  if (out.configSchema?.type !== 'object') {
    throw new Error(`configSchema.type expected 'object', got ${JSON.stringify(out.configSchema?.type)}`);
  }
  const prop = out.configSchema?.properties?.duplicateThinkletUri;
  if (!prop) throw new Error('missing properties.duplicateThinkletUri');
  if (prop.type !== 'string') throw new Error(`properties.duplicateThinkletUri.type expected 'string', got ${JSON.stringify(prop.type)}`);
  if (prop.format !== 'uri') throw new Error(`properties.duplicateThinkletUri.format expected 'uri', got ${JSON.stringify(prop.format)}`);
  if (typeof prop.description !== 'string') throw new Error(`properties.duplicateThinkletUri.description expected string, got ${typeof prop.description}`);
  if (!Array.isArray(prop.examples) || typeof prop.examples[0] !== 'string') {
    throw new Error(`properties.duplicateThinkletUri.examples[0] expected string`);
  }
  if (!Array.isArray(out.configSchema?.required) || out.configSchema.required[0] !== 'duplicateThinkletUri') {
    throw new Error(`required[0] expected 'duplicateThinkletUri', got ${JSON.stringify(out.configSchema?.required)}`);
  }
  return true;
});

export {};


