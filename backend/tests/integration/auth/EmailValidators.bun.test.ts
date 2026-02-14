import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { RFC5322EmailValidator } from '@auth/domain/services/validators/RFC5322EmailValidator.ts';
import { SimpleEmailValidator } from '@auth/domain/services/validators/SimpleEmailValidator.ts';
import { CompositeEmailValidator } from '@auth/domain/services/validators/CompositeEmailValidator.ts';
import { EmailValidatorRegistry } from '@auth/domain/services/EmailValidatorRegistry.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import type { IEmailValidator } from '@auth/domain/services/IEmailValidator.ts';
import { Result } from '@shared/domain/Result.ts';

describe('Email Validators - Strategy Pattern', () => {
  afterEach(() => {
    // Reset to default validator after each test
    EmailValidatorRegistry.resetToDefault();
  });

  describe('RFC5322EmailValidator', () => {
    const validator = new RFC5322EmailValidator();

    test('should have correct name', () => {
      expect(validator.name).toBe('RFC5322EmailValidator');
    });

    test('should validate correct emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@sub.example.com',
        'user123@example.co.uk',
      ];

      for (const email of validEmails) {
        const result = validator.validate(email);
        expect(result.isOk).toBe(true);
      }
    });

    test('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        'invalid',
        'user@',
        '@example.com',
        'user@domain',
        'user name@example.com',
      ];

      for (const email of invalidEmails) {
        const result = validator.validate(email);
        expect(result.isFailure).toBe(true);
      }
    });

    test('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validator.validate(longEmail);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('too long');
    });

    test('should reject emails with consecutive dots', () => {
      const result = validator.validate('user..name@example.com');
      expect(result.isFailure).toBe(true);
    });

    test('should reject local part exceeding 64 chars', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      const result = validator.validate(longLocal);
      expect(result.isFailure).toBe(true);
    });
  });

  describe('SimpleEmailValidator', () => {
    const validator = new SimpleEmailValidator();

    test('should have correct name', () => {
      expect(validator.name).toBe('SimpleEmailValidator');
    });

    test('should validate basic email format', () => {
      const result = validator.validate('user@example.com');
      expect(result.isOk).toBe(true);
    });

    test('should reject empty email', () => {
      const result = validator.validate('');
      expect(result.isFailure).toBe(true);
    });

    test('should reject email without @', () => {
      const result = validator.validate('invalid-email');
      expect(result.isFailure).toBe(true);
    });

    test('should reject email with spaces', () => {
      const result = validator.validate('user @example.com');
      expect(result.isFailure).toBe(true);
    });
  });

  describe('CompositeEmailValidator', () => {
    test('should require at least one validator', () => {
      expect(() => new CompositeEmailValidator([])).toThrow();
    });

    test('should have composite name', () => {
      const validator = new CompositeEmailValidator([
        new RFC5322EmailValidator(),
        new SimpleEmailValidator(),
      ]);
      expect(validator.name).toContain('RFC5322EmailValidator');
      expect(validator.name).toContain('SimpleEmailValidator');
    });

    test('should pass when all validators pass', () => {
      const validator = new CompositeEmailValidator([
        new RFC5322EmailValidator(),
        new SimpleEmailValidator(),
      ]);

      const result = validator.validate('user@example.com');
      expect(result.isOk).toBe(true);
    });

    test('should fail if any validator fails', () => {
      // Create a custom validator that only accepts @company.com emails
      const corporateValidator: IEmailValidator = {
        name: 'CorporateValidator',
        validate: (email: string) => {
          if (!email.endsWith('@company.com')) {
            return Result.fail('Only corporate emails allowed');
          }
          return Result.ok<void>(undefined);
        },
      };

      const validator = new CompositeEmailValidator([
        new RFC5322EmailValidator(),
        corporateValidator,
      ]);

      const result = validator.validate('user@example.com');
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('Only corporate emails allowed');
    });

    test('should support withValidator for immutable chaining', () => {
      const base = new CompositeEmailValidator([new RFC5322EmailValidator()]);
      const extended = base.withValidator(new SimpleEmailValidator());

      // Original should not be modified
      expect(base.name).not.toContain('SimpleEmailValidator');
      // Extended should have both
      expect(extended.name).toContain('RFC5322EmailValidator');
      expect(extended.name).toContain('SimpleEmailValidator');
    });
  });

  describe('EmailValidatorRegistry', () => {
    test('should default to RFC5322EmailValidator', () => {
      expect(EmailValidatorRegistry.getCurrentValidatorName()).toBe('RFC5322EmailValidator');
    });

    test('should allow changing default validator', () => {
      EmailValidatorRegistry.setDefault(new SimpleEmailValidator());
      expect(EmailValidatorRegistry.getCurrentValidatorName()).toBe('SimpleEmailValidator');
    });

    test('should reset to RFC5322 validator', () => {
      EmailValidatorRegistry.setDefault(new SimpleEmailValidator());
      EmailValidatorRegistry.resetToDefault();
      expect(EmailValidatorRegistry.getCurrentValidatorName()).toBe('RFC5322EmailValidator');
    });

    test('should affect Email.create() calls', () => {
      // Create a restrictive validator
      const restrictiveValidator: IEmailValidator = {
        name: 'RestrictiveValidator',
        validate: () => Result.fail('All emails blocked'),
      };

      EmailValidatorRegistry.setDefault(restrictiveValidator);

      const result = Email.create('user@example.com');
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('All emails blocked');
    });
  });

  describe('Email Value Object with Strategy Pattern', () => {
    test('should use custom validator when provided', () => {
      const customValidator: IEmailValidator = {
        name: 'CustomValidator',
        validate: (email: string) => {
          if (!email.includes('special')) {
            return Result.fail('Email must contain "special"');
          }
          return Result.ok<void>(undefined);
        },
      };

      // Without custom validator
      const result1 = Email.create('user@example.com');
      expect(result1.isOk).toBe(true);

      // With custom validator
      const result2 = Email.create('user@example.com', { validator: customValidator });
      expect(result2.isFailure).toBe(true);
      expect(result2.getError()).toBe('Email must contain "special"');

      // With custom validator and valid email
      const result3 = Email.create('special@example.com', { validator: customValidator });
      expect(result3.isOk).toBe(true);
    });

    test('should use registry default when no validator provided', () => {
      // Default is RFC5322
      const result1 = Email.create('user@example.com');
      expect(result1.isOk).toBe(true);

      // Change default
      EmailValidatorRegistry.setDefault(new SimpleEmailValidator());

      // Should still work (SimpleEmailValidator accepts this)
      const result2 = Email.create('user@example.com');
      expect(result2.isOk).toBe(true);
    });
  });
});
