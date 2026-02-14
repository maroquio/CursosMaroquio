import { describe, it, expect } from 'vitest';
import { RFC5322EmailValidator } from '@auth/domain/services/validators/RFC5322EmailValidator.ts';
import { SimpleEmailValidator } from '@auth/domain/services/validators/SimpleEmailValidator.ts';
import { CompositeEmailValidator } from '@auth/domain/services/validators/CompositeEmailValidator.ts';

describe('Email Validators', () => {
  describe('RFC5322EmailValidator', () => {
    const validator = new RFC5322EmailValidator();

    describe('name property', () => {
      it('should have correct name', () => {
        expect(validator.name).toBe('RFC5322EmailValidator');
      });
    });

    describe('valid emails', () => {
      const validEmails = [
        'simple@example.com',
        'very.common@example.com',
        'disposable.style.email.with+symbol@example.com',
        'other.email-with-dash@example.com',
        'x@example.com',
        'example-indeed@strange-example.com',
        'example@s.example',
        'user@subdomain.example.com',
        'user123@example.com',
        'user.name@example.org',
      ];

      it.each(validEmails)('should accept valid email: %s', (email) => {
        const result = validator.validate(email);
        expect(result.isOk).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it('should reject empty email', () => {
        const result = validator.validate('');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without @', () => {
        const result = validator.validate('invalidemail.com');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without domain', () => {
        const result = validator.validate('invalid@');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without local part', () => {
        const result = validator.validate('@example.com');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with spaces', () => {
        const result = validator.validate('user name@example.com');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email exceeding max length (254)', () => {
        const longLocal = 'a'.repeat(200);
        const email = `${longLocal}@example.com`;
        const result = validator.validate(email);
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with local part exceeding 64 chars', () => {
        const longLocal = 'a'.repeat(65);
        const email = `${longLocal}@example.com`;
        const result = validator.validate(email);
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with domain exceeding 253 chars', () => {
        // Create a long domain with valid structure
        const longDomain = 'a'.repeat(250) + '.com';
        const email = `user@${longDomain}`;
        const result = validator.validate(email);
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with consecutive dots', () => {
        const result = validator.validate('user..name@example.com');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without TLD', () => {
        const result = validator.validate('user@localhost');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with single char TLD', () => {
        const result = validator.validate('user@example.c');
        expect(result.isFailure).toBe(true);
      });
    });
  });

  describe('SimpleEmailValidator', () => {
    const validator = new SimpleEmailValidator();

    describe('name property', () => {
      it('should have correct name', () => {
        expect(validator.name).toBe('SimpleEmailValidator');
      });
    });

    describe('valid emails', () => {
      const validEmails = [
        'simple@example.com',
        'user@domain.org',
        'test.user@company.co.uk',
        'user123@example.net',
      ];

      it.each(validEmails)('should accept valid email: %s', (email) => {
        const result = validator.validate(email);
        expect(result.isOk).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it('should reject empty email', () => {
        const result = validator.validate('');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without @', () => {
        const result = validator.validate('invalidemail.com');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email without domain extension', () => {
        const result = validator.validate('user@domain');
        expect(result.isFailure).toBe(true);
      });

      it('should reject email with spaces', () => {
        const result = validator.validate('user @example.com');
        expect(result.isFailure).toBe(true);
      });
    });
  });

  describe('CompositeEmailValidator', () => {
    describe('name property', () => {
      it('should have correct name with single validator', () => {
        const validator = new CompositeEmailValidator([new SimpleEmailValidator()]);
        expect(validator.name).toBe('Composite[SimpleEmailValidator]');
      });

      it('should include all validator names', () => {
        const validator = new CompositeEmailValidator([
          new SimpleEmailValidator(),
          new RFC5322EmailValidator(),
        ]);
        expect(validator.name).toBe('Composite[SimpleEmailValidator, RFC5322EmailValidator]');
      });
    });

    describe('validation with single validator', () => {
      it('should pass when single validator passes', () => {
        const validator = new CompositeEmailValidator([new SimpleEmailValidator()]);
        const result = validator.validate('test@example.com');
        expect(result.isOk).toBe(true);
      });

      it('should fail when single validator fails', () => {
        const validator = new CompositeEmailValidator([new SimpleEmailValidator()]);
        const result = validator.validate('invalid-email');
        expect(result.isFailure).toBe(true);
      });
    });

    describe('validation with multiple validators', () => {
      it('should pass when all validators pass', () => {
        const validator = new CompositeEmailValidator([
          new SimpleEmailValidator(),
          new RFC5322EmailValidator(),
        ]);
        const result = validator.validate('test@example.com');
        expect(result.isOk).toBe(true);
      });

      it('should fail if any validator fails', () => {
        const validator = new CompositeEmailValidator([
          new SimpleEmailValidator(),
          new RFC5322EmailValidator(),
        ]);
        // This email passes simple but might fail RFC5322
        const result = validator.validate('user..name@example.com');
        expect(result.isFailure).toBe(true);
      });
    });

    describe('validation with no validators', () => {
      it('should throw error when created with empty validators array', () => {
        expect(() => new CompositeEmailValidator([])).toThrow(
          'CompositeEmailValidator requires at least one validator'
        );
      });
    });
  });
});
