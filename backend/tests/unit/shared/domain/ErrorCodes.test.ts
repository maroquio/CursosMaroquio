import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  ErrorMessages,
  getErrorMessage,
  DomainError,
} from '@shared/domain/errors/ErrorCodes.ts';

describe('ErrorCodes', () => {
  describe('ErrorCode enum', () => {
    it('should have all generic error codes', () => {
      expect(ErrorCode.INTERNAL_ERROR).toBe(ErrorCode.INTERNAL_ERROR);
      expect(ErrorCode.VALIDATION_ERROR).toBe(ErrorCode.VALIDATION_ERROR);
      expect(ErrorCode.NOT_FOUND).toBe(ErrorCode.NOT_FOUND);
      expect(ErrorCode.CONFLICT).toBe(ErrorCode.CONFLICT);
      expect(ErrorCode.UNAUTHORIZED).toBe(ErrorCode.UNAUTHORIZED);
      expect(ErrorCode.FORBIDDEN).toBe(ErrorCode.FORBIDDEN);
    });

    it('should have all user/auth error codes', () => {
      expect(ErrorCode.INVALID_EMAIL_FORMAT).toBe(ErrorCode.INVALID_EMAIL_FORMAT);
      expect(ErrorCode.EMAIL_TOO_LONG).toBe(ErrorCode.EMAIL_TOO_LONG);
      expect(ErrorCode.USER_ALREADY_EXISTS).toBe(ErrorCode.USER_ALREADY_EXISTS);
      expect(ErrorCode.USER_NOT_FOUND).toBe(ErrorCode.USER_NOT_FOUND);
      expect(ErrorCode.INVALID_PASSWORD).toBe(ErrorCode.INVALID_PASSWORD);
      expect(ErrorCode.PASSWORD_HASH_FAILED).toBe(ErrorCode.PASSWORD_HASH_FAILED);
      expect(ErrorCode.INVALID_PASSWORD_HASH).toBe(ErrorCode.INVALID_PASSWORD_HASH);
      expect(ErrorCode.SAVE_USER_FAILED).toBe(ErrorCode.SAVE_USER_FAILED);
    });

    it('should have all ID error codes', () => {
      expect(ErrorCode.INVALID_UUID_FORMAT).toBe(ErrorCode.INVALID_UUID_FORMAT);
      expect(ErrorCode.INVALID_USER_ID).toBe(ErrorCode.INVALID_USER_ID);
    });
  });

  describe('ErrorMessages', () => {
    it('should have message for all error codes', () => {
      for (const code of Object.values(ErrorCode)) {
        expect(ErrorMessages[code]).toBeDefined();
        expect(typeof ErrorMessages[code]).toBe('string');
        expect(ErrorMessages[code].length).toBeGreaterThan(0);
      }
    });

    it('should have specific messages', () => {
      expect(ErrorMessages[ErrorCode.INTERNAL_ERROR]).toBe('An internal error occurred');
      expect(ErrorMessages[ErrorCode.USER_NOT_FOUND]).toBe('User not found');
      expect(ErrorMessages[ErrorCode.INVALID_EMAIL_FORMAT]).toBe('Invalid email format');
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for valid code', () => {
      expect(getErrorMessage(ErrorCode.NOT_FOUND)).toBe('Resource not found');
      expect(getErrorMessage(ErrorCode.UNAUTHORIZED)).toBe('Unauthorized');
      expect(getErrorMessage(ErrorCode.FORBIDDEN)).toBe('Forbidden');
    });

    it('should return message for all error codes', () => {
      for (const code of Object.values(ErrorCode)) {
        const message = getErrorMessage(code);
        expect(message).toBe(ErrorMessages[code]);
      }
    });

    it('should fallback to INTERNAL_ERROR for unknown codes', () => {
      const unknownCode = 'UNKNOWN_CODE' as ErrorCode;
      const message = getErrorMessage(unknownCode);

      expect(message).toBe(ErrorMessages[ErrorCode.INTERNAL_ERROR]);
    });
  });

  describe('DomainError', () => {
    describe('constructor', () => {
      it('should create error with code and default message', () => {
        const error = new DomainError(ErrorCode.NOT_FOUND);

        expect(error.code).toBe(ErrorCode.NOT_FOUND);
        expect(error.message).toBe('Resource not found');
        expect(error.name).toBe('DomainError');
      });

      it('should create error with code and custom message', () => {
        const error = new DomainError(ErrorCode.NOT_FOUND, 'User not found with id 123');

        expect(error.code).toBe(ErrorCode.NOT_FOUND);
        expect(error.message).toBe('User not found with id 123');
      });

      it('should create error with details', () => {
        const details = { userId: '123', field: 'email' };
        const error = new DomainError(ErrorCode.VALIDATION_ERROR, 'Invalid email', details);

        expect(error.details).toEqual(details);
      });

      it('should have undefined details when not provided', () => {
        const error = new DomainError(ErrorCode.INTERNAL_ERROR);

        expect(error.details).toBeUndefined();
      });

      it('should be instance of Error', () => {
        const error = new DomainError(ErrorCode.INTERNAL_ERROR);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(DomainError);
      });
    });

    describe('fromCode', () => {
      it('should create error from code', () => {
        const error = DomainError.fromCode(ErrorCode.USER_NOT_FOUND);

        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
        expect(error.message).toBe('User not found');
      });

      it('should create error from code with details', () => {
        const details = { userId: '456' };
        const error = DomainError.fromCode(ErrorCode.USER_NOT_FOUND, details);

        expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
        expect(error.details).toEqual(details);
      });
    });

    describe('toJSON', () => {
      it('should serialize error without details', () => {
        const error = new DomainError(ErrorCode.FORBIDDEN);
        const json = error.toJSON();

        expect(json).toEqual({
          code: ErrorCode.FORBIDDEN,
          message: 'Forbidden',
        });
      });

      it('should serialize error with details', () => {
        const details = { resource: 'users', action: 'delete' };
        const error = new DomainError(ErrorCode.FORBIDDEN, 'Cannot delete admin', details);
        const json = error.toJSON();

        expect(json).toEqual({
          code: ErrorCode.FORBIDDEN,
          message: 'Cannot delete admin',
          details: { resource: 'users', action: 'delete' },
        });
      });

      it('should not include details key when details is undefined', () => {
        const error = new DomainError(ErrorCode.INTERNAL_ERROR);
        const json = error.toJSON();

        expect(Object.keys(json)).toEqual(['code', 'message']);
        expect('details' in json).toBe(false);
      });
    });

    describe('error propagation', () => {
      it('should be throwable', () => {
        const throwFn = () => {
          throw new DomainError(ErrorCode.VALIDATION_ERROR);
        };

        expect(throwFn).toThrow(DomainError);
      });

      it('should preserve code when caught', () => {
        try {
          throw new DomainError(ErrorCode.CONFLICT);
        } catch (error) {
          if (error instanceof DomainError) {
            expect(error.code).toBe(ErrorCode.CONFLICT);
          } else {
            throw new Error('Should be DomainError');
          }
        }
      });
    });
  });
});
