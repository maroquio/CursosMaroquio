import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeMetrics,
  getMetrics,
  getMetricsRegistry,
  httpMetrics,
  dbMetrics,
  authMetrics,
  createMetricsMiddleware,
  metricsEndpoint,
} from '@shared/infrastructure/observability/Metrics.ts';

describe('Metrics', () => {
  beforeEach(() => {
    // Reset metrics before each test
    getMetricsRegistry().reset();
  });

  describe('MetricsRegistry', () => {
    describe('counters', () => {
      it('should register and increment counter', () => {
        const registry = getMetricsRegistry();
        registry.registerCounter('test_counter', 'A test counter');

        registry.incrementCounter('test_counter', {});
        registry.incrementCounter('test_counter', {});
        registry.incrementCounter('test_counter', {});

        const output = registry.getMetrics();
        expect(output).toContain('# HELP test_counter A test counter');
        expect(output).toContain('# TYPE test_counter counter');
        expect(output).toContain('test_counter 3');
      });

      it('should increment counter with labels', () => {
        const registry = getMetricsRegistry();
        registry.registerCounter('labeled_counter', 'Counter with labels');

        registry.incrementCounter('labeled_counter', { method: 'GET', status: '200' });
        registry.incrementCounter('labeled_counter', { method: 'GET', status: '200' });
        registry.incrementCounter('labeled_counter', { method: 'POST', status: '201' });

        const output = registry.getMetrics();
        expect(output).toContain('labeled_counter{method="GET",status="200"} 2');
        expect(output).toContain('labeled_counter{method="POST",status="201"} 1');
      });

      it('should increment counter with custom value', () => {
        const registry = getMetricsRegistry();
        registry.registerCounter('custom_counter', 'Counter with custom increment');

        registry.incrementCounter('custom_counter', {}, 5);
        registry.incrementCounter('custom_counter', {}, 3);

        const output = registry.getMetrics();
        expect(output).toContain('custom_counter 8');
      });

      it('should not increment non-existent counter', () => {
        const registry = getMetricsRegistry();
        // Should not throw
        registry.incrementCounter('non_existent', {});
        const output = registry.getMetrics();
        expect(output).not.toContain('non_existent');
      });

      it('should not re-register existing counter', () => {
        const registry = getMetricsRegistry();
        registry.registerCounter('dup_counter', 'First help');
        registry.incrementCounter('dup_counter', {}, 10);
        registry.registerCounter('dup_counter', 'Second help'); // Should not reset

        const output = registry.getMetrics();
        expect(output).toContain('dup_counter 10');
        expect(output).toContain('# HELP dup_counter First help');
      });
    });

    describe('gauges', () => {
      it('should register and set gauge', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('test_gauge', 'A test gauge');

        registry.setGauge('test_gauge', {}, 42);

        const output = registry.getMetrics();
        expect(output).toContain('# HELP test_gauge A test gauge');
        expect(output).toContain('# TYPE test_gauge gauge');
        expect(output).toContain('test_gauge 42');
      });

      it('should increment gauge', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('inc_gauge', 'Incrementable gauge');

        registry.setGauge('inc_gauge', {}, 10);
        registry.incrementGauge('inc_gauge', {}, 5);

        const output = registry.getMetrics();
        expect(output).toContain('inc_gauge 15');
      });

      it('should decrement gauge', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('dec_gauge', 'Decrementable gauge');

        registry.setGauge('dec_gauge', {}, 20);
        registry.decrementGauge('dec_gauge', {}, 7);

        const output = registry.getMetrics();
        expect(output).toContain('dec_gauge 13');
      });

      it('should increment gauge with default value', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('default_inc_gauge', 'Gauge with default increment');

        registry.incrementGauge('default_inc_gauge', {});
        registry.incrementGauge('default_inc_gauge', {});

        const output = registry.getMetrics();
        expect(output).toContain('default_inc_gauge 2');
      });

      it('should decrement gauge with default value', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('default_dec_gauge', 'Gauge with default decrement');

        registry.setGauge('default_dec_gauge', {}, 10);
        registry.decrementGauge('default_dec_gauge', {});

        const output = registry.getMetrics();
        expect(output).toContain('default_dec_gauge 9');
      });

      it('should handle gauge with labels', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('labeled_gauge', 'Gauge with labels');

        registry.setGauge('labeled_gauge', { service: 'api' }, 100);
        registry.setGauge('labeled_gauge', { service: 'worker' }, 50);

        const output = registry.getMetrics();
        expect(output).toContain('labeled_gauge{service="api"} 100');
        expect(output).toContain('labeled_gauge{service="worker"} 50');
      });

      it('should not set non-existent gauge', () => {
        const registry = getMetricsRegistry();
        registry.setGauge('non_existent_gauge', {}, 100);
        const output = registry.getMetrics();
        expect(output).not.toContain('non_existent_gauge');
      });

      it('should not increment non-existent gauge', () => {
        const registry = getMetricsRegistry();
        registry.incrementGauge('non_existent_gauge', {});
        const output = registry.getMetrics();
        expect(output).not.toContain('non_existent_gauge');
      });

      it('should not decrement non-existent gauge', () => {
        const registry = getMetricsRegistry();
        registry.decrementGauge('non_existent_gauge', {});
        const output = registry.getMetrics();
        expect(output).not.toContain('non_existent_gauge');
      });

      it('should not re-register existing gauge', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('dup_gauge', 'First help');
        registry.setGauge('dup_gauge', {}, 50);
        registry.registerGauge('dup_gauge', 'Second help');

        const output = registry.getMetrics();
        expect(output).toContain('dup_gauge 50');
      });
    });

    describe('histograms', () => {
      it('should register and observe histogram', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('test_histogram', 'A test histogram', [0.1, 0.5, 1, 5]);

        registry.observeHistogram('test_histogram', {}, 0.3);
        registry.observeHistogram('test_histogram', {}, 0.7);
        registry.observeHistogram('test_histogram', {}, 2);

        const output = registry.getMetrics();
        expect(output).toContain('# HELP test_histogram A test histogram');
        expect(output).toContain('# TYPE test_histogram histogram');
        expect(output).toContain('test_histogram_bucket{le="0.1"} 0');
        expect(output).toContain('test_histogram_bucket{le="0.5"} 1');
        expect(output).toContain('test_histogram_bucket{le="1"} 2');
        expect(output).toContain('test_histogram_bucket{le="5"} 3');
        expect(output).toContain('test_histogram_bucket{le="+Inf"} 3');
        expect(output).toContain('test_histogram_sum 3');
        expect(output).toContain('test_histogram_count 3');
      });

      it('should observe histogram with labels', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('labeled_histogram', 'Histogram with labels', [1, 5, 10]);

        registry.observeHistogram('labeled_histogram', { method: 'GET' }, 2);
        registry.observeHistogram('labeled_histogram', { method: 'POST' }, 7);

        const output = registry.getMetrics();
        expect(output).toContain('labeled_histogram_bucket{method="GET",le="1"}');
        expect(output).toContain('labeled_histogram_bucket{method="POST",le="5"}');
      });

      it('should use default buckets when not specified', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('default_bucket_histogram', 'Histogram with default buckets');

        registry.observeHistogram('default_bucket_histogram', {}, 0.05);

        const output = registry.getMetrics();
        expect(output).toContain('default_bucket_histogram_bucket{le="0.005"}');
        expect(output).toContain('default_bucket_histogram_bucket{le="0.01"}');
        expect(output).toContain('default_bucket_histogram_bucket{le="10"}');
      });

      it('should sort buckets', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('sorted_histogram', 'Sorted buckets', [10, 1, 5, 0.1]);

        registry.observeHistogram('sorted_histogram', {}, 3);

        const output = registry.getMetrics();
        const bucketPattern =
          /sorted_histogram_bucket\{le="0.1"\}.*sorted_histogram_bucket\{le="1"\}.*sorted_histogram_bucket\{le="5"\}.*sorted_histogram_bucket\{le="10"\}/s;
        expect(output).toMatch(bucketPattern);
      });

      it('should not observe non-existent histogram', () => {
        const registry = getMetricsRegistry();
        registry.observeHistogram('non_existent_histogram', {}, 1);
        const output = registry.getMetrics();
        expect(output).not.toContain('non_existent_histogram');
      });

      it('should not re-register existing histogram', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('dup_histogram', 'First help', [1, 5]);
        registry.observeHistogram('dup_histogram', {}, 2);
        registry.registerHistogram('dup_histogram', 'Second help', [10, 50]);

        const output = registry.getMetrics();
        expect(output).toContain('dup_histogram_bucket{le="1"}');
        expect(output).toContain('dup_histogram_bucket{le="5"}');
        expect(output).not.toContain('dup_histogram_bucket{le="10"}');
      });
    });

    describe('startTimer', () => {
      it('should measure elapsed time', async () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('timer_histogram', 'Timer test', [0.01, 0.1, 1]);

        const endTimer = registry.startTimer('timer_histogram', {});

        // Wait a short time
        await new Promise((resolve) => setTimeout(resolve, 15));

        const duration = endTimer();

        expect(duration).toBeGreaterThan(0.01);
        expect(duration).toBeLessThan(1);

        const output = registry.getMetrics();
        expect(output).toContain('timer_histogram_count 1');
      });

      it('should return duration in seconds', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('quick_timer', 'Quick timer', [0.001, 0.01]);

        const endTimer = registry.startTimer('quick_timer', {});
        const duration = endTimer();

        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
      });
    });

    describe('reset', () => {
      it('should clear all metric values', () => {
        const registry = getMetricsRegistry();

        registry.registerCounter('reset_counter', 'Counter to reset');
        registry.registerGauge('reset_gauge', 'Gauge to reset');
        registry.registerHistogram('reset_histogram', 'Histogram to reset');

        registry.incrementCounter('reset_counter', {}, 10);
        registry.setGauge('reset_gauge', {}, 50);
        registry.observeHistogram('reset_histogram', {}, 1);

        registry.reset();

        const output = registry.getMetrics();
        expect(output).not.toContain('reset_counter 10');
        expect(output).not.toContain('reset_gauge 50');
        expect(output).not.toContain('reset_histogram_count 1');
      });
    });

    describe('metrics with empty labels', () => {
      it('should output metric without label braces when labels are empty', () => {
        const registry = getMetricsRegistry();
        registry.registerCounter('no_labels_counter', 'Counter without labels');

        registry.incrementCounter('no_labels_counter', {});

        const output = registry.getMetrics();
        // Should contain "no_labels_counter 1" without any braces
        expect(output).toContain('no_labels_counter 1');
        // Should NOT have empty braces like "no_labels_counter{}"
        expect(output).not.toContain('no_labels_counter{}');
      });

      it('should output gauge without label braces when labels are empty', () => {
        const registry = getMetricsRegistry();
        registry.registerGauge('no_labels_gauge', 'Gauge without labels');

        registry.setGauge('no_labels_gauge', {}, 42);

        const output = registry.getMetrics();
        expect(output).toContain('no_labels_gauge 42');
        expect(output).not.toContain('no_labels_gauge{}');
      });

      it('should output histogram without label braces when labels are empty', () => {
        const registry = getMetricsRegistry();
        registry.registerHistogram('no_labels_histogram', 'Histogram without labels', [1, 5]);

        registry.observeHistogram('no_labels_histogram', {}, 2);

        const output = registry.getMetrics();
        // Histogram buckets should have le label but not custom labels
        expect(output).toContain('no_labels_histogram_bucket{le="1"}');
        expect(output).toContain('no_labels_histogram_sum 2');
        expect(output).toContain('no_labels_histogram_count 1');
      });
    });
  });

  describe('initializeMetrics', () => {
    it('should register all default metrics', () => {
      initializeMetrics();

      const output = getMetrics();

      // HTTP metrics
      expect(output).toContain('http_requests_total');
      expect(output).toContain('http_request_duration_seconds');
      expect(output).toContain('http_requests_in_progress');

      // Database metrics
      expect(output).toContain('db_connections_active');
      expect(output).toContain('db_query_duration_seconds');

      // Auth metrics
      expect(output).toContain('auth_login_attempts_total');
      expect(output).toContain('auth_token_refresh_total');
      expect(output).toContain('auth_logout_total');
    });
  });

  describe('httpMetrics', () => {
    beforeEach(() => {
      initializeMetrics();
    });

    it('should record request', () => {
      httpMetrics.recordRequest('GET', '/api/users', 200);
      httpMetrics.recordRequest('GET', '/api/users', 200);
      httpMetrics.recordRequest('POST', '/api/users', 201);

      const output = getMetrics();
      expect(output).toContain('http_requests_total{method="GET",path="/api/users",status="200"} 2');
      expect(output).toContain('http_requests_total{method="POST",path="/api/users",status="201"} 1');
    });

    it('should start and end request timer', async () => {
      const endTimer = httpMetrics.startRequestTimer('GET', '/api/test');

      await new Promise((resolve) => setTimeout(resolve, 5));

      const duration = endTimer();

      expect(duration).toBeGreaterThan(0);

      const output = getMetrics();
      expect(output).toContain('http_request_duration_seconds_count{method="GET",path="/api/test"} 1');
    });

    it('should track in-progress requests', () => {
      const endTimer1 = httpMetrics.startRequestTimer('GET', '/api/slow');
      const endTimer2 = httpMetrics.startRequestTimer('GET', '/api/slow');

      let output = getMetrics();
      expect(output).toContain('http_requests_in_progress{method="GET",path="/api/slow"} 2');

      endTimer1();
      output = getMetrics();
      expect(output).toContain('http_requests_in_progress{method="GET",path="/api/slow"} 1');

      endTimer2();
      output = getMetrics();
      expect(output).toContain('http_requests_in_progress{method="GET",path="/api/slow"} 0');
    });
  });

  describe('dbMetrics', () => {
    beforeEach(() => {
      initializeMetrics();
    });

    it('should set active connections', () => {
      dbMetrics.setActiveConnections(5);

      const output = getMetrics();
      expect(output).toContain('db_connections_active 5');
    });

    it('should start query timer', async () => {
      const endTimer = dbMetrics.startQueryTimer('SELECT');

      await new Promise((resolve) => setTimeout(resolve, 5));

      const duration = endTimer();

      expect(duration).toBeGreaterThan(0);

      const output = getMetrics();
      expect(output).toContain('db_query_duration_seconds_count{operation="SELECT"} 1');
    });
  });

  describe('authMetrics', () => {
    beforeEach(() => {
      initializeMetrics();
    });

    it('should record successful login attempt', () => {
      authMetrics.recordLoginAttempt(true);

      const output = getMetrics();
      expect(output).toContain('auth_login_attempts_total{success="true"} 1');
    });

    it('should record failed login attempt', () => {
      authMetrics.recordLoginAttempt(false);

      const output = getMetrics();
      expect(output).toContain('auth_login_attempts_total{success="false"} 1');
    });

    it('should record successful token refresh', () => {
      authMetrics.recordTokenRefresh(true);

      const output = getMetrics();
      expect(output).toContain('auth_token_refresh_total{success="true"} 1');
    });

    it('should record failed token refresh', () => {
      authMetrics.recordTokenRefresh(false);

      const output = getMetrics();
      expect(output).toContain('auth_token_refresh_total{success="false"} 1');
    });

    it('should record logout', () => {
      authMetrics.recordLogout();

      const output = getMetrics();
      expect(output).toContain('auth_logout_total 1');
    });
  });

  describe('createMetricsMiddleware', () => {
    beforeEach(() => {
      initializeMetrics();
    });

    it('should have beforeHandle and afterHandle hooks', () => {
      const middleware = createMetricsMiddleware();

      expect(middleware.beforeHandle).toBeDefined();
      expect(middleware.afterHandle).toBeDefined();
    });

    it('should skip metrics endpoint', () => {
      const middleware = createMetricsMiddleware();

      const ctx = {
        request: new Request('http://localhost/metrics', { method: 'GET' }),
        set: { status: 200 },
      };

      const result = middleware.beforeHandle(ctx);
      expect(result).toBeUndefined();
      expect((ctx as any).__metricsEndTimer).toBeUndefined();
    });

    it('should set up timer for non-metrics endpoints', () => {
      const middleware = createMetricsMiddleware();

      const ctx = {
        request: new Request('http://localhost/api/users', { method: 'GET' }),
        set: { status: 200 },
      };

      middleware.beforeHandle(ctx);
      expect((ctx as any).__metricsEndTimer).toBeDefined();
    });

    it('should record metrics in afterHandle', () => {
      const middleware = createMetricsMiddleware();

      const ctx = {
        request: new Request('http://localhost/api/users', { method: 'GET' }),
        set: { status: 200 },
      };

      middleware.beforeHandle(ctx);
      middleware.afterHandle(ctx);

      const output = getMetrics();
      expect(output).toContain('http_requests_total{method="GET",path="/api/users",status="200"} 1');
    });

    it('should handle missing timer gracefully', () => {
      const middleware = createMetricsMiddleware();

      const ctx = {
        request: new Request('http://localhost/api/test', { method: 'GET' }),
        set: { status: 200 },
      };

      // Call afterHandle without beforeHandle - should not throw
      middleware.afterHandle(ctx);
    });

    it('should use default status 200 when status is string', () => {
      const middleware = createMetricsMiddleware();

      const ctx = {
        request: new Request('http://localhost/api/test', { method: 'POST' }),
        set: { status: 'OK' as any },
      };

      middleware.beforeHandle(ctx);
      middleware.afterHandle(ctx);

      const output = getMetrics();
      expect(output).toContain('http_requests_total{method="POST",path="/api/test",status="200"} 1');
    });
  });

  describe('metricsEndpoint', () => {
    it('should return Response with metrics', () => {
      initializeMetrics();

      const response = metricsEndpoint();

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/plain; version=0.0.4; charset=utf-8');
    });

    it('should contain metric data in body', async () => {
      initializeMetrics();
      httpMetrics.recordRequest('GET', '/test', 200);

      const response = metricsEndpoint();
      const body = await response.text();

      expect(body).toContain('http_requests_total');
    });
  });

  describe('getMetrics', () => {
    it('should return string output from registry', () => {
      initializeMetrics();
      httpMetrics.recordRequest('GET', '/test', 200);

      const output = getMetrics();

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
      expect(output).toContain('http_requests_total');
    });

    it('should return metrics in Prometheus format', () => {
      initializeMetrics();

      const output = getMetrics();

      // Check Prometheus format conventions
      expect(output).toContain('# HELP');
      expect(output).toContain('# TYPE');
    });
  });
});
