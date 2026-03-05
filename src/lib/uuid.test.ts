import { describe, it, expect } from 'vitest';
import { isValidUUID, assertValidUUID } from './uuid';

describe('isValidUUID', () => {
  it('returns true for valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns true for lowercase UUID', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe(true);
  });

  it('returns true for uppercase UUID', () => {
    expect(isValidUUID('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D')).toBe(true);
  });

  it('returns false for non-v4 UUID (wrong version digit)', () => {
    expect(isValidUUID('550e8400-e29b-31d4-a716-446655440000')).toBe(false);
  });

  it('returns false for invalid strings', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });

  it('returns false for UUID-like strings with wrong length', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-4466554400000')).toBe(false);
  });
});

describe('assertValidUUID', () => {
  it('does not throw for valid UUID', () => {
    expect(() => assertValidUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });

  it('throws error with statusCode 400 for invalid UUID', () => {
    try {
      assertValidUUID('invalid');
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as Error & { statusCode: number };
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("'id'");
    }
  });

  it('includes custom field name in error message', () => {
    try {
      assertValidUUID('invalid', 'tableId');
      expect.fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as Error & { statusCode: number };
      expect(error.message).toContain("'tableId'");
    }
  });
});
