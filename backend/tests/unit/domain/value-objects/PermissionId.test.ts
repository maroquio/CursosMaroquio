import { describe, it, expect } from 'vitest';
import { PermissionId } from '@auth/domain/value-objects/PermissionId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('PermissionId Value Object', () => {
  describe('create', () => {
    it('should create a new PermissionId with UUID v7', () => {
      const permissionId = PermissionId.create();

      expect(permissionId).toBeDefined();
      expect(permissionId.toValue()).toBeDefined();
      // UUID v7 format: 8-4-4-4-12 characters
      expect(permissionId.toValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should create unique IDs on each call', () => {
      const id1 = PermissionId.create();
      const id2 = PermissionId.create();
      const id3 = PermissionId.create();

      expect(id1.toValue()).not.toBe(id2.toValue());
      expect(id2.toValue()).not.toBe(id3.toValue());
      expect(id1.toValue()).not.toBe(id3.toValue());
    });
  });

  describe('createFromString', () => {
    it('should create PermissionId from valid UUID string', () => {
      const validUUID = '019123ab-cdef-7890-abcd-ef1234567890';
      const result = PermissionId.createFromString(validUUID);

      expect(result.isOk).toBe(true);
      expect(result.getValue().toValue()).toBe(validUUID);
    });

    it('should reject empty string', () => {
      const result = PermissionId.createFromString('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_PERMISSION_ID);
    });

    it('should reject invalid UUID format', () => {
      const result = PermissionId.createFromString('not-a-valid-uuid');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_PERMISSION_ID);
    });

    it('should reject UUID with wrong length', () => {
      const result = PermissionId.createFromString('12345678-1234-1234-1234');

      expect(result.isFailure).toBe(true);
    });

    it('should reject UUID v4 format (only v7 accepted)', () => {
      const validUUID4 = '550e8400-e29b-41d4-a716-446655440000';
      const result = PermissionId.createFromString(validUUID4);

      // System only accepts UUID v7 format
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_PERMISSION_ID);
    });

    it('should accept lowercase UUID', () => {
      const result = PermissionId.createFromString('019123ab-cdef-7890-abcd-ef1234567890');
      expect(result.isOk).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      const result = PermissionId.createFromString('019123AB-CDEF-7890-ABCD-EF1234567890');
      expect(result.isOk).toBe(true);
    });
  });

  describe('toValue', () => {
    it('should return the underlying UUID string', () => {
      const permissionId = PermissionId.create();
      const value = permissionId.toValue();

      expect(typeof value).toBe('string');
      expect(value.length).toBe(36);
    });
  });

  describe('equals', () => {
    it('should return true for IDs with same value', () => {
      const uuid = '019123ab-cdef-7890-abcd-ef1234567890';
      const id1 = PermissionId.createFromString(uuid).getValue();
      const id2 = PermissionId.createFromString(uuid).getValue();

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for IDs with different values', () => {
      const id1 = PermissionId.create();
      const id2 = PermissionId.create();

      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const id = PermissionId.create();

      expect(id.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const id = PermissionId.create();

      expect(id.equals(undefined as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string representation', () => {
      const permissionId = PermissionId.create();

      expect(permissionId.toString()).toBe(permissionId.toValue());
    });
  });
});
