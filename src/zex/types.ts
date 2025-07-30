// types.ts - Core types and interfaces for Zex
// =============================================================================

export type JsonSchema = {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  examples?: unknown[];
  default?: unknown;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  [key: string]: unknown;
};

export type ValidationResult = 
  | { success: true; data: unknown }
  | { success: false; error: string };

export type ZexConfig = {
  optional: boolean;
  nullable: boolean;
  defaultValue?: unknown;
  validators: Validator[];
  meta: {
    title?: string;
    description?: string;
    examples?: unknown[];
    format?: string;
    [key: string]: unknown;
  };
};

export interface Validator {
  validate(value: unknown): ValidationResult;
  getJsonSchema(): Partial<JsonSchema>;
}

// Path tracking for better error messages
export type PathEntry = {
  type: 'root' | 'object' | 'array' | 'union';
  key?: string;        // For objects: "name", "age"
  index?: number;      // For arrays: 0, 1, 2
  schema: any;         // Reference to the schema (using any to avoid circular dependency)
  description?: string; // From schema.meta().description
};

export type ParseContext = {
  rootDescription?: string;
};

// Strukturierte Fehlerklasse für besseres Debugging und UI-Integration
export class ZexError extends Error {
  constructor(
    public path: string[],
    public code: string,
    message: string,
    public received?: unknown,
    public expected?: string
  ) {
    super(message);
    this.name = 'ZexError';
  }
  
  toString(): string {
    const pathStr = this.path.length > 0 ? this.path.join('.') : 'root';
    return `ZexError at ${pathStr}: ${this.message}`;
  }
} 