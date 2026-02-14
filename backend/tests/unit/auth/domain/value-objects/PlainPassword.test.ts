import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { PlainPassword } from '@auth/domain/value-objects/PlainPassword.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('PlainPassword Value Object', () => {
  // Reset config after each test to ensure isolation
  afterEach(() => {
    PlainPassword.resetConfig();
  });

  describe('create - valid passwords', () => {
    test('should create password meeting all default requirements', () => {
      const result = PlainPassword.create('ValidPass1');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('ValidPass1');
    });

    test('should accept password with special characters', () => {
      const result = PlainPassword.create('ValidPass1!@#');

      expect(result.isOk).toBe(true);
    });

    test('should accept password at minimum length (8)', () => {
      const result = PlainPassword.create('Aa1bbbbb');

      expect(result.isOk).toBe(true);
    });

    test('should accept password at maximum length (128)', () => {
      // 128 characters: uppercase + lowercase + number + rest
      const longPassword = 'Aa1' + 'b'.repeat(125);
      const result = PlainPassword.create(longPassword);

      expect(result.isOk).toBe(true);
    });
  });

  describe('create - length validation', () => {
    test('should reject password shorter than 8 characters', () => {
      const result = PlainPassword.create('Short1A');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_SHORT);
    });

    test('should reject password longer than 128 characters', () => {
      const longPassword = 'Aa1' + 'b'.repeat(126);
      const result = PlainPassword.create(longPassword);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_LONG);
    });

    test('should reject empty password', () => {
      const result = PlainPassword.create('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_REQUIRED);
    });
  });

  describe('create - complexity validation', () => {
    test('should reject password without uppercase letter', () => {
      const result = PlainPassword.create('lowercase1');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_UPPERCASE);
    });

    test('should reject password without lowercase letter', () => {
      const result = PlainPassword.create('UPPERCASE1');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_LOWERCASE);
    });

    test('should reject password without number', () => {
      const result = PlainPassword.create('NoNumbers');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_NUMBER);
    });

    test('should return first error for multiple violations', () => {
      const result = PlainPassword.create('short');

      expect(result.isFailure).toBe(true);
      // Returns first error encountered (too short)
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_SHORT);
    });
  });

  describe('create - common password check', () => {
    test('should reject "password" - fails uppercase requirement first', () => {
      const result = PlainPassword.create('password');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_UPPERCASE);
    });

    test('should reject "PASSWORD" - fails lowercase requirement first', () => {
      const result = PlainPassword.create('PASSWORD');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_LOWERCASE);
    });

    test('should reject "123456" - fails length requirement first', () => {
      const result = PlainPassword.create('123456');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_SHORT);
    });

    test('should reject "qwerty" - fails length requirement first', () => {
      const result = PlainPassword.create('qwerty');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_SHORT);
    });

    test('should reject "password123" - fails uppercase requirement first', () => {
      const result = PlainPassword.create('password123');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_NEEDS_UPPERCASE);
    });

    test('should reject common passwords when requirements are relaxed', () => {
      // Temporarily relax requirements to test common password check
      PlainPassword.configure({
        minLength: 6,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
      });

      const result = PlainPassword.create('password');
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_TOO_COMMON);
    });
  });

  describe('configure', () => {
    test('should allow custom minimum length', () => {
      PlainPassword.configure({ minLength: 12 });

      const shortResult = PlainPassword.create('Aa1bbbbbbb');
      expect(shortResult.isFailure).toBe(true);
      expect(shortResult.getError()).toBe(ErrorCode.PASSWORD_TOO_SHORT);

      const validResult = PlainPassword.create('Aa1bbbbbbbbb');
      expect(validResult.isOk).toBe(true);
    });

    test('should allow disabling uppercase requirement', () => {
      PlainPassword.configure({ requireUppercase: false });
      
      const result = PlainPassword.create('lowercase1');
      expect(result.isOk).toBe(true);
    });

    test('should allow disabling lowercase requirement', () => {
      PlainPassword.configure({ requireLowercase: false });
      
      const result = PlainPassword.create('UPPERCASE1');
      expect(result.isOk).toBe(true);
    });

    test('should allow disabling number requirement', () => {
      PlainPassword.configure({ requireNumbers: false });
      
      const result = PlainPassword.create('NoNumbersABC');
      expect(result.isOk).toBe(true);
    });

    test('should allow enabling special character requirement', () => {
      PlainPassword.configure({ requireSpecialChars: true });

      const withoutSpecial = PlainPassword.create('ValidPass1');
      expect(withoutSpecial.isFailure).toBe(true);
      expect(withoutSpecial.getError()).toBe(ErrorCode.PASSWORD_NEEDS_SPECIAL);

      const withSpecial = PlainPassword.create('ValidPass1!');
      expect(withSpecial.isOk).toBe(true);
    });

    test('should merge with default config', () => {
      PlainPassword.configure({ minLength: 10 });

      // Other defaults should still apply
      const noUppercase = PlainPassword.create('lowercas1!');
      expect(noUppercase.isFailure).toBe(true);
      expect(noUppercase.getError()).toBe(ErrorCode.PASSWORD_NEEDS_UPPERCASE);
    });
  });

  describe('resetConfig', () => {
    test('should restore default configuration', () => {
      PlainPassword.configure({ minLength: 20 });
      PlainPassword.resetConfig();

      const result = PlainPassword.create('Aa1bbbbb');
      expect(result.isOk).toBe(true);
    });
  });

  describe('getRequirements', () => {
    test('should return current configuration', () => {
      const requirements = PlainPassword.getRequirements();

      expect(requirements).toEqual({
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      });
    });

    test('should reflect configuration changes', () => {
      PlainPassword.configure({ minLength: 12, requireSpecialChars: true });
      
      const requirements = PlainPassword.getRequirements();

      expect(requirements.minLength).toBe(12);
      expect(requirements.requireSpecialChars).toBe(true);
    });

    test('should return a copy, not the original', () => {
      const requirements = PlainPassword.getRequirements();
      requirements.minLength = 999;

      const actualRequirements = PlainPassword.getRequirements();
      expect(actualRequirements.minLength).toBe(8);
    });
  });

  describe('getValue', () => {
    test('should return the plain password value', () => {
      const password = PlainPassword.create('ValidPass1').getValue();

      expect(password.getValue()).toBe('ValidPass1');
    });
  });

  describe('equality', () => {
    test('should be equal for same password', () => {
      const password1 = PlainPassword.create('ValidPass1').getValue();
      const password2 = PlainPassword.create('ValidPass1').getValue();

      expect(password1.equals(password2)).toBe(true);
    });

    test('should not be equal for different passwords', () => {
      const password1 = PlainPassword.create('ValidPass1').getValue();
      const password2 = PlainPassword.create('ValidPass2').getValue();

      expect(password1.equals(password2)).toBe(false);
    });

    test('should be case sensitive', () => {
      const password1 = PlainPassword.create('ValidPass1').getValue();
      const password2 = PlainPassword.create('Validpass1').getValue();

      // Different case in 'P' vs 'p'
      expect(password1.equals(password2)).toBe(false);
    });
  });
});
