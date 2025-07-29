// validators.ts - Validator implementations for Zex
// =============================================================================

import { JsonSchema, ValidationResult, Validator } from './types.js';

export class EmailValidator implements Validator {
  validate(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { success: false, error: 'Invalid email format' };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { format: 'email' };
  }
}

export class UuidValidator implements Validator {
  validate(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return { success: false, error: 'Invalid UUID format' };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { format: 'uuid' };
  }
}

export class MinLengthValidator implements Validator {
  constructor(private minLength: number) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    if (value.length < this.minLength) {
      return { success: false, error: `String must be at least ${this.minLength} characters` };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { minLength: this.minLength };
  }
}

export class MaxLengthValidator implements Validator {
  constructor(private maxLength: number) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    if (value.length > this.maxLength) {
      return { success: false, error: `String must be at most ${this.maxLength} characters` };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { maxLength: this.maxLength };
  }
}

export class PatternValidator implements Validator {
  constructor(private pattern: string) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== 'string') {
      return { success: false, error: 'Expected string' };
    }
    const regex = new RegExp(this.pattern);
    if (!regex.test(value)) {
      return { success: false, error: `String does not match pattern ${this.pattern}` };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { pattern: this.pattern };
  }
}

export class MinValidator implements Validator {
  constructor(private min: number) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== 'number') {
      return { success: false, error: 'Expected number' };
    }
    if (value < this.min) {
      return { success: false, error: `Number must be at least ${this.min}` };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { minimum: this.min };
  }
}

export class MaxValidator implements Validator {
  constructor(private max: number) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== 'number') {
      return { success: false, error: 'Expected number' };
    }
    if (value > this.max) {
      return { success: false, error: `Number must be at most ${this.max}` };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { maximum: this.max };
  }
}

export class IntValidator implements Validator {
  validate(value: unknown): ValidationResult {
    if (typeof value !== 'number') {
      return { success: false, error: 'Expected number' };
    }
    if (!Number.isInteger(value)) {
      return { success: false, error: 'Expected integer' };
    }
    return { success: true, data: value };
  }

  getJsonSchema(): Partial<JsonSchema> {
    return { type: 'integer' };
  }
} 