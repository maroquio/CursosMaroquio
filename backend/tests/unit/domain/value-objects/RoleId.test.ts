import { describe, it, expect } from 'vitest';
import { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('RoleId Value Object', () => {
  describe('create', () => {
    it('should create a new RoleId with UUID v7', () => {
      const roleId = RoleId.create();

      expect(roleId).toBeDefined();
      expect(roleId.toValue()).toBeDefined();
      // UUID v7 format
      expect(roleId.toValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should create unique IDs on each call', () => {
      const ids = Array.from({ length: 10 }, () => RoleId.create());
      const values = ids.map((id) => id.toValue());
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(10);
    });
  });

  describe('createFromString', () => {
    it('should create RoleId from valid UUID string', () => {
      const validUUID = '019123ab-cdef-7890-abcd-ef1234567890';
      const result = RoleId.createFromString(validUUID);

      expect(result.isOk).toBe(true);
      expect(result.getValue().toValue()).toBe(validUUID);
    });

    it('should reject empty string', () => {
      const result = RoleId.createFromString('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_ROLE_ID);
    });

    it('should reject invalid UUID format', () => {
      const result = RoleId.createFromString('not-a-uuid');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_ROLE_ID);
    });

    it('should reject malformed UUID', () => {
      const result = RoleId.createFromString('12345678-1234-1234-1234-12345');

      expect(result.isFailure).toBe(true);
    });

    it('should reject UUID v4 format (only v7 accepted)', () => {
      const validUUID4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = RoleId.createFromString(validUUID4);

      // System only accepts UUID v7 format
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_ROLE_ID);
    });
  });

  describe('toValue', () => {
    it('should return the underlying UUID string', () => {
      const roleId = RoleId.create();
      const value = roleId.toValue();

      expect(typeof value).toBe('string');
      expect(value.length).toBe(36);
    });
  });

  describe('equals', () => {
    it('should return true for IDs with same value', () => {
      const uuid = '019123ab-cdef-7890-abcd-ef1234567890';
      const id1 = RoleId.createFromString(uuid).getValue();
      const id2 = RoleId.createFromString(uuid).getValue();

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for IDs with different values', () => {
      const id1 = RoleId.create();
      const id2 = RoleId.create();

      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const id = RoleId.create();

      expect(id.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return UUID string', () => {
      const roleId = RoleId.create();

      expect(roleId.toString()).toBe(roleId.toValue());
    });
  });
});
