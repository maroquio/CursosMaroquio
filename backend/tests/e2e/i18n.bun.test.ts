import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createTestApp,
  cleanupTestDatabase,
  clearTestDatabase,
  request,
  parseResponse,
  uniqueEmail,
} from './setup.ts';

/**
 * E2E Tests for Internationalization (i18n)
 * Tests locale detection via Accept-Language header and localized responses
 */
describe('i18n E2E Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  // ===========================================================================
  // Accept-Language Header Detection
  // ===========================================================================
  describe('Accept-Language header detection', () => {
    describe('GET / (Welcome endpoint)', () => {
      it('should return Portuguese message for Accept-Language: pt-BR', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'pt-BR' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
        expect(body.locale).toBe('pt-BR');
      });

      it('should return English message for Accept-Language: en-US', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'en-US' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Welcome to TypeScript Bun Backend');
        expect(body.locale).toBe('en-US');
      });

      it('should return Spanish message for Accept-Language: es', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'es' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bienvenido a TypeScript Bun Backend');
        expect(body.locale).toBe('es');
      });

      it('should return German message for Accept-Language: de', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'de' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Willkommen beim TypeScript Bun Backend');
        expect(body.locale).toBe('de');
      });

      it('should return German message for Accept-Language: de-DE', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'de-DE' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Willkommen beim TypeScript Bun Backend');
        expect(body.locale).toBe('de');
      });

      it('should return French message for Accept-Language: fr', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'fr' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bienvenue sur TypeScript Bun Backend');
        expect(body.locale).toBe('fr');
      });

      it('should return French message for Accept-Language: fr-FR', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'fr-FR' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bienvenue sur TypeScript Bun Backend');
        expect(body.locale).toBe('fr');
      });

      it('should handle quality values (q-values) correctly', async () => {
        // pt-BR has higher priority (0.9) than en-US (0.8)
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'en-US;q=0.8, pt-BR;q=0.9' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
        expect(body.locale).toBe('pt-BR');
      });

      it('should fallback to default locale (pt-BR) for unsupported language', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'zh-CN' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
        expect(body.locale).toBe('pt-BR');
      });

      it('should handle en variant (without region) and map to en-US', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'en' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Welcome to TypeScript Bun Backend');
        expect(body.locale).toBe('en-US');
      });

      it('should handle pt variant (without region) and map to pt-BR', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'pt' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
        expect(body.locale).toBe('pt-BR');
      });

      it('should handle complex Accept-Language with multiple languages', async () => {
        // Browser-like header: de-DE (highest priority), then fr-FR, then en-US
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': 'de-DE,fr-FR;q=0.9,en-US;q=0.8' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        // de-DE is now supported, should return German
        expect(body.message).toBe('Willkommen beim TypeScript Bun Backend');
        expect(body.locale).toBe('de');
      });

      it('should handle wildcard (*) in Accept-Language', async () => {
        const response = await request(app, 'GET', '/', {
          headers: { 'Accept-Language': '*' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          message: string;
          locale: string;
        }>(response);

        // Wildcard should return default (pt-BR)
        expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
        expect(body.locale).toBe('pt-BR');
      });
    });
  });

  // ===========================================================================
  // Localized Error Messages
  // ===========================================================================
  describe('Localized error messages', () => {
    describe('POST /auth/register', () => {
      it('should return Portuguese error for duplicate email with pt-BR', async () => {
        const email = uniqueEmail();

        // Register first user
        await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        // Try to register same email
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'DifferentP@ss456', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.error).toContain('já existe');
      });

      it('should return English error for duplicate email with en-US', async () => {
        const email = uniqueEmail();

        // Register first user
        await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'en-US' },
        });

        // Try to register same email
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'DifferentP@ss456', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'en-US' },
        });

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.error).toContain('already exists');
      });

      it('should return Spanish error for duplicate email with es', async () => {
        const email = uniqueEmail();

        // Register first user
        await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'es' },
        });

        // Try to register same email
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email, password: 'DifferentP@ss456', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'es' },
        });

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.error).toContain('Ya existe');
      });

      it('should return Portuguese success message with pt-BR', async () => {
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email: uniqueEmail(), password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        const body = await parseResponse<{
          success: boolean;
          message: string;
        }>(response);

        expect(body.success).toBe(true);
        expect(body.message).toBe('Usuário registrado com sucesso');
      });

      it('should return English success message with en-US', async () => {
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email: uniqueEmail(), password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'en-US' },
        });

        const body = await parseResponse<{
          success: boolean;
          message: string;
        }>(response);

        expect(body.success).toBe(true);
        expect(body.message).toBe('User registered successfully');
      });
    });

    describe('POST /auth/login', () => {
      it('should return Portuguese error for invalid credentials with pt-BR', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'nonexistent@example.com', password: 'WrongP@ss123' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        // Could be "Usuário não encontrado" or similar
        expect(body.error).toBeTruthy();
      });

      it('should return English error for invalid credentials with en-US', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'nonexistent@example.com', password: 'WrongP@ss123' },
          headers: { 'Accept-Language': 'en-US' },
        });

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        // Could be "User not found" or similar
        expect(body.error).toBeTruthy();
      });

      it('should return successful login response with pt-BR', async () => {
        const email = uniqueEmail();
        const password = 'SecureP@ss123';

        // Register user first
        await request(app, 'POST', '/v1/auth/register', {
          body: { email, password, fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        // Login
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email, password },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        const body = await parseResponse<{
          success: boolean;
          data: {
            accessToken: string;
            refreshToken: string;
            user: { id: string; email: string };
          };
        }>(response);

        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.user.email).toBe(email);
      });

      it('should return successful login response with en-US', async () => {
        const email = uniqueEmail();
        const password = 'SecureP@ss123';

        // Register user first
        await request(app, 'POST', '/v1/auth/register', {
          body: { email, password, fullName: 'Test User', phone: '11999998888' },
          headers: { 'Accept-Language': 'en-US' },
        });

        // Login
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email, password },
          headers: { 'Accept-Language': 'en-US' },
        });

        const body = await parseResponse<{
          success: boolean;
          data: {
            accessToken: string;
            refreshToken: string;
            user: { id: string; email: string };
          };
        }>(response);

        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeTruthy();
        expect(body.data.user.email).toBe(email);
      });
    });
  });

  // ===========================================================================
  // Cookie Locale Fallback
  // ===========================================================================
  describe('Cookie locale fallback', () => {
    it('should use cookie locale when no Accept-Language header is provided', async () => {
      const response = await request(app, 'GET', '/', {
        headers: {
          'Accept-Language': '', // Empty header
          'Cookie': 'locale=en-US',
        },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      expect(body.message).toBe('Welcome to TypeScript Bun Backend');
      expect(body.locale).toBe('en-US');
    });

    it('should prioritize Accept-Language header over cookie', async () => {
      const response = await request(app, 'GET', '/', {
        headers: {
          'Accept-Language': 'pt-BR',
          'Cookie': 'locale=en-US', // Cookie has different locale
        },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      // Header takes priority
      expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
      expect(body.locale).toBe('pt-BR');
    });

    it('should use cookie locale for Spanish', async () => {
      const response = await request(app, 'GET', '/', {
        headers: {
          'Accept-Language': '',
          'Cookie': 'locale=es',
        },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      expect(body.message).toBe('Bienvenido a TypeScript Bun Backend');
      expect(body.locale).toBe('es');
    });
  });

  // ===========================================================================
  // Default Locale Fallback
  // ===========================================================================
  describe('Default locale fallback', () => {
    it('should use default locale (pt-BR) when no locale indicators are present', async () => {
      // Make request without Accept-Language header
      // Note: The request helper adds 'Accept-Language: en-US' by default,
      // so we need to explicitly override it
      const url = 'http://localhost/';
      const response = await app.handle(
        new Request(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // No Accept-Language header
          },
        })
      );

      expect(response.status).toBe(200);

      const body = await response.json() as {
        message: string;
        locale: string;
      };

      // Default should be pt-BR
      expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
      expect(body.locale).toBe('pt-BR');
    });

    it('should fallback to pt-BR for malformed Accept-Language header', async () => {
      const response = await request(app, 'GET', '/', {
        headers: { 'Accept-Language': ';;;invalid;;;' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
      expect(body.locale).toBe('pt-BR');
    });
  });

  // ===========================================================================
  // Case Insensitivity
  // ===========================================================================
  describe('Case insensitivity', () => {
    it('should handle lowercase Accept-Language (pt-br)', async () => {
      const response = await request(app, 'GET', '/', {
        headers: { 'Accept-Language': 'pt-br' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      expect(body.message).toBe('Bem-vindo ao TypeScript Bun Backend');
      expect(body.locale).toBe('pt-BR');
    });

    it('should handle uppercase Accept-Language (EN-US)', async () => {
      const response = await request(app, 'GET', '/', {
        headers: { 'Accept-Language': 'EN-US' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        locale: string;
      }>(response);

      expect(body.message).toBe('Welcome to TypeScript Bun Backend');
      expect(body.locale).toBe('en-US');
    });
  });

  // ===========================================================================
  // Validation Error i18n
  // ===========================================================================
  describe('Validation error i18n', () => {
    describe('POST /auth/login with invalid email format', () => {
      it('should return Portuguese validation error for invalid email with pt-BR', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'invalid-email', password: 'SecureP@ss123' },
          headers: { 'Accept-Language': 'pt-BR' },
        });

        // 422 Unprocessable Entity is the correct status for validation errors (RFC 4918)
        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.message).toBe('Erro de validação');
        expect(body.errors).toBeDefined();
        expect(body.errors.length).toBeGreaterThan(0);

        // Check that the error message is in Portuguese
        const emailError = body.errors.find((e) => e.field === 'email');
        if (emailError) {
          expect(emailError.message).toContain('email válido');
        }
      });

      it('should return English validation error for invalid email with en-US', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'invalid-email', password: 'SecureP@ss123' },
          headers: { 'Accept-Language': 'en-US' },
        });

        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.message).toBe('Validation error');
        expect(body.errors).toBeDefined();
        expect(body.errors.length).toBeGreaterThan(0);

        // Check that the error message is in English
        const emailError = body.errors.find((e) => e.field === 'email');
        if (emailError) {
          expect(emailError.message).toContain('valid email');
        }
      });

      it('should return Spanish validation error for invalid email with es', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'invalid-email', password: 'SecureP@ss123' },
          headers: { 'Accept-Language': 'es' },
        });

        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.message).toBe('Error de validación');
        expect(body.errors).toBeDefined();
        expect(body.errors.length).toBeGreaterThan(0);

        // Check that the error message is in Spanish
        const emailError = body.errors.find((e) => e.field === 'email');
        if (emailError) {
          expect(emailError.message).toContain('correo electrónico válido');
        }
      });
    });

    describe('POST /auth/register with missing required fields', () => {
      it('should return Portuguese validation error for missing password with pt-BR', async () => {
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email: uniqueEmail() }, // Missing password
          headers: { 'Accept-Language': 'pt-BR' },
        });

        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.errors).toBeDefined();
      });

      it('should return English validation error for missing password with en-US', async () => {
        const response = await request(app, 'POST', '/v1/auth/register', {
          body: { email: uniqueEmail() }, // Missing password
          headers: { 'Accept-Language': 'en-US' },
        });

        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.success).toBe(false);
        expect(body.errors).toBeDefined();
      });
    });

    describe('Validation error structure', () => {
      it('should return structured validation errors with field, message, and code', async () => {
        const response = await request(app, 'POST', '/v1/auth/login', {
          body: { email: 'invalid', password: '123' },
          headers: { 'Accept-Language': 'en-US' },
        });

        expect(response.status).toBe(422);

        const body = await parseResponse<{
          success: boolean;
          statusCode: number;
          message: string;
          errors: Array<{ field: string; message: string; code: string }>;
        }>(response);

        expect(body.statusCode).toBe(422);
        expect(body.success).toBe(false);
        expect(body.message).toBe('Validation error');
        expect(Array.isArray(body.errors)).toBe(true);

        // Each error should have the expected structure
        for (const error of body.errors) {
          expect(typeof error.field).toBe('string');
          expect(typeof error.message).toBe('string');
          expect(typeof error.code).toBe('string');
        }
      });
    });
  });
});
