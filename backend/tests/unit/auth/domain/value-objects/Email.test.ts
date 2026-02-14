import { describe, test, expect } from 'vitest';
import { Email } from '@auth/domain/value-objects/Email.ts';

describe('Email Value Object', () => {
  describe('create', () => {
    test('should create valid email', () => {
      const result = Email.create('user@example.com');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('user@example.com');
    });

    test('should normalize email to lowercase', () => {
      const result = Email.create('User@EXAMPLE.COM');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('user@example.com');
    });

    test('should trim whitespace', () => {
      const result = Email.create('  user@example.com  ');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('user@example.com');
    });

    test('should accept email with subdomain', () => {
      const result = Email.create('user@mail.example.com');

      expect(result.isOk).toBe(true);
    });

    test('should accept email with plus sign', () => {
      const result = Email.create('user+tag@example.com');

      expect(result.isOk).toBe(true);
    });

    test('should accept email with dots in local part', () => {
      const result = Email.create('first.last@example.com');

      expect(result.isOk).toBe(true);
    });
  });

  describe('validation errors', () => {
    test('should reject email without @', () => {
      const result = Email.create('invalid-email');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid email format');
    });

    test('should reject email without domain', () => {
      const result = Email.create('user@');

      expect(result.isFailure).toBe(true);
    });

    test('should reject email without local part', () => {
      const result = Email.create('@example.com');

      expect(result.isFailure).toBe(true);
    });

    test('should reject email without TLD', () => {
      const result = Email.create('user@domain');

      expect(result.isFailure).toBe(true);
    });

    test('should reject email with spaces', () => {
      const result = Email.create('user name@example.com');

      expect(result.isFailure).toBe(true);
    });

    test('should reject email that is too long', () => {
      const longLocal = 'a'.repeat(250);
      const result = Email.create(`${longLocal}@example.com`);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('too long');
    });

    test('should reject empty email', () => {
      const result = Email.create('');

      expect(result.isFailure).toBe(true);
    });

    test('should reject whitespace only', () => {
      const result = Email.create('   ');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    test('should be equal for same email', () => {
      const email1 = Email.create('user@example.com').getValue();
      const email2 = Email.create('user@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
    });

    test('should be equal regardless of case', () => {
      const email1 = Email.create('User@Example.com').getValue();
      const email2 = Email.create('user@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
    });

    test('should not be equal for different emails', () => {
      const email1 = Email.create('user1@example.com').getValue();
      const email2 = Email.create('user2@example.com').getValue();

      expect(email1.equals(email2)).toBe(false);
    });

    test('should not be equal to null/undefined', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.equals(null as any)).toBe(false);
      expect(email.equals(undefined)).toBe(false);
    });
  });

  describe('getValue', () => {
    test('should return the normalized email string', () => {
      const email = Email.create('Test@Example.COM').getValue();

      expect(email.getValue()).toBe('test@example.com');
    });
  });
});
