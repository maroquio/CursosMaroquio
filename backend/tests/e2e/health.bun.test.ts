import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createTestApp,
  cleanupTestDatabase,
  request,
  parseResponse,
} from './setup.ts';

/**
 * E2E Tests for Health Check Endpoints
 */
describe('Health Endpoints E2E Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app, 'GET', '/');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        message: string;
        timestamp: string;
        version: string;
      }>(response);

      expect(body.message).toBe('Welcome to TypeScript Bun Backend');
      expect(body.version).toBe('1.0.0');
      expect(body.timestamp).toBeDefined();
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app, 'GET', '/');
      const body = await parseResponse<{ timestamp: string }>(response);

      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app, 'GET', '/health');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        status: string;
        timestamp: number;
        uptime: number;
        checks: { database: string };
      }>(response);

      expect(body.status).toBe('ok');
      expect(typeof body.timestamp).toBe('number');
      expect(typeof body.uptime).toBe('number');
      expect(body.checks.database).toBe('healthy');
    });

    it('should have positive uptime', async () => {
      const response = await request(app, 'GET', '/health');
      const body = await parseResponse<{ uptime: number }>(response);

      expect(body.uptime).toBeGreaterThan(0);
    });

    it('should have recent timestamp', async () => {
      const before = Date.now();
      const response = await request(app, 'GET', '/health');
      const after = Date.now();

      const body = await parseResponse<{ timestamp: number }>(response);

      expect(body.timestamp).toBeGreaterThanOrEqual(before);
      expect(body.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('HTTP Methods', () => {
    it('should respond to GET / only', async () => {
      // GET should work
      const getResponse = await request(app, 'GET', '/');
      expect(getResponse.status).toBe(200);

      // POST should not work (Elysia returns 404 or 405)
      const postResponse = await request(app, 'POST', '/');
      expect([404, 405]).toContain(postResponse.status);
    });

    it('should respond to GET /health only', async () => {
      // GET should work
      const getResponse = await request(app, 'GET', '/health');
      expect(getResponse.status).toBe(200);

      // DELETE should not work
      const deleteResponse = await request(app, 'DELETE', '/health');
      expect([404, 405]).toContain(deleteResponse.status);
    });
  });

  describe('Non-existent routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app, 'GET', '/unknown-route');
      expect(response.status).toBe(404);
    });

    it('should return 404 for nested unknown routes', async () => {
      const response = await request(app, 'GET', '/api/v1/unknown');
      expect(response.status).toBe(404);
    });
  });
});
