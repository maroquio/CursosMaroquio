/**
 * Prometheus Metrics System
 * Provides application metrics in Prometheus format
 *
 * Metrics exposed:
 * - http_requests_total: Total HTTP requests (counter)
 * - http_request_duration_seconds: Request duration (histogram)
 * - http_requests_in_progress: Concurrent requests (gauge)
 * - db_connections_active: Active database connections (gauge)
 * - db_query_duration_seconds: Database query duration (histogram)
 * - auth_login_attempts_total: Login attempts (counter)
 * - auth_token_refresh_total: Token refreshes (counter)
 */

/**
 * Metric types
 */
type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * Labels for metrics
 */
type Labels = Record<string, string>;

/**
 * Base metric interface
 */
interface Metric {
  name: string;
  help: string;
  type: MetricType;
}

/**
 * Counter metric - only increases
 */
interface CounterMetric extends Metric {
  type: 'counter';
  values: Map<string, number>;
}

/**
 * Gauge metric - can increase or decrease
 */
interface GaugeMetric extends Metric {
  type: 'gauge';
  values: Map<string, number>;
}

/**
 * Histogram bucket
 */
interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

/**
 * Histogram metric - distribution of values
 */
interface HistogramMetric extends Metric {
  type: 'histogram';
  buckets: number[];
  values: Map<string, { buckets: HistogramBucket[]; sum: number; count: number }>;
}

/**
 * Serialize labels to string key for map storage
 */
function labelsToKey(labels: Labels): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}="${v}"`).join(',');
}

/**
 * Metrics Registry
 * Stores and manages all application metrics
 */
class MetricsRegistry {
  private counters = new Map<string, CounterMetric>();
  private gauges = new Map<string, GaugeMetric>();
  private histograms = new Map<string, HistogramMetric>();

  /**
   * Register a counter metric
   */
  registerCounter(name: string, help: string): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, {
        name,
        help,
        type: 'counter',
        values: new Map(),
      });
    }
  }

  /**
   * Increment counter
   */
  incrementCounter(name: string, labels: Labels = {}, value: number = 1): void {
    const counter = this.counters.get(name);
    if (!counter) return;

    const key = labelsToKey(labels);
    const current = counter.values.get(key) || 0;
    counter.values.set(key, current + value);
  }

  /**
   * Register a gauge metric
   */
  registerGauge(name: string, help: string): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, {
        name,
        help,
        type: 'gauge',
        values: new Map(),
      });
    }
  }

  /**
   * Set gauge value
   */
  setGauge(name: string, labels: Labels = {}, value: number): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = labelsToKey(labels);
    gauge.values.set(key, value);
  }

  /**
   * Increment gauge
   */
  incrementGauge(name: string, labels: Labels = {}, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = labelsToKey(labels);
    const current = gauge.values.get(key) || 0;
    gauge.values.set(key, current + value);
  }

  /**
   * Decrement gauge
   */
  decrementGauge(name: string, labels: Labels = {}, value: number = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = labelsToKey(labels);
    const current = gauge.values.get(key) || 0;
    gauge.values.set(key, current - value);
  }

  /**
   * Register a histogram metric
   */
  registerHistogram(
    name: string,
    help: string,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        name,
        help,
        type: 'histogram',
        buckets: [...buckets].sort((a, b) => a - b),
        values: new Map(),
      });
    }
  }

  /**
   * Observe histogram value
   */
  observeHistogram(name: string, labels: Labels = {}, value: number): void {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const key = labelsToKey(labels);
    let data = histogram.values.get(key);

    if (!data) {
      data = {
        buckets: histogram.buckets.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      histogram.values.set(key, data);
    }

    // Update buckets
    for (const bucket of data.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    data.sum += value;
    data.count++;
  }

  /**
   * Create a timer for histogram observation
   */
  startTimer(histogramName: string, labels: Labels = {}): () => number {
    const start = process.hrtime.bigint();

    return () => {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationSeconds = durationNs / 1e9;
      this.observeHistogram(histogramName, labels, durationSeconds);
      return durationSeconds;
    };
  }

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): string {
    const lines: string[] = [];

    // Output counters
    for (const counter of this.counters.values()) {
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);

      for (const [key, value] of counter.values) {
        const labels = key ? `{${key}}` : '';
        lines.push(`${counter.name}${labels} ${value}`);
      }
      lines.push('');
    }

    // Output gauges
    for (const gauge of this.gauges.values()) {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);

      for (const [key, value] of gauge.values) {
        const labels = key ? `{${key}}` : '';
        lines.push(`${gauge.name}${labels} ${value}`);
      }
      lines.push('');
    }

    // Output histograms
    for (const histogram of this.histograms.values()) {
      lines.push(`# HELP ${histogram.name} ${histogram.help}`);
      lines.push(`# TYPE ${histogram.name} histogram`);

      for (const [key, data] of histogram.values) {
        const baseLabels = key ? `${key},` : '';

        // Output buckets
        for (const bucket of data.buckets) {
          lines.push(`${histogram.name}_bucket{${baseLabels}le="${bucket.le}"} ${bucket.count}`);
        }
        // +Inf bucket
        lines.push(`${histogram.name}_bucket{${baseLabels}le="+Inf"} ${data.count}`);

        // Sum and count
        const sumLabels = key ? `{${key}}` : '';
        lines.push(`${histogram.name}_sum${sumLabels} ${data.sum}`);
        lines.push(`${histogram.name}_count${sumLabels} ${data.count}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.values.clear();
    }
    for (const gauge of this.gauges.values()) {
      gauge.values.clear();
    }
    for (const histogram of this.histograms.values()) {
      histogram.values.clear();
    }
  }
}

// Singleton registry instance
const registry = new MetricsRegistry();

/**
 * Initialize default application metrics
 */
export function initializeMetrics(): void {
  // HTTP metrics
  registry.registerCounter(
    'http_requests_total',
    'Total number of HTTP requests'
  );
  registry.registerHistogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  );
  registry.registerGauge(
    'http_requests_in_progress',
    'Number of HTTP requests currently being processed'
  );

  // Database metrics
  registry.registerGauge(
    'db_connections_active',
    'Number of active database connections'
  );
  registry.registerHistogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
  );

  // Auth metrics
  registry.registerCounter(
    'auth_login_attempts_total',
    'Total number of login attempts'
  );
  registry.registerCounter(
    'auth_token_refresh_total',
    'Total number of token refresh operations'
  );
  registry.registerCounter(
    'auth_logout_total',
    'Total number of logout operations'
  );
}

/**
 * HTTP metrics helpers
 */
export const httpMetrics = {
  /**
   * Record a request
   */
  recordRequest(method: string, path: string, status: number): void {
    registry.incrementCounter('http_requests_total', { method, path, status: String(status) });
  },

  /**
   * Start timing a request
   */
  startRequestTimer(method: string, path: string): () => number {
    registry.incrementGauge('http_requests_in_progress', { method, path });

    const endTimer = registry.startTimer('http_request_duration_seconds', { method, path });

    return () => {
      registry.decrementGauge('http_requests_in_progress', { method, path });
      return endTimer();
    };
  },
};

/**
 * Database metrics helpers
 */
export const dbMetrics = {
  /**
   * Set active connections count
   */
  setActiveConnections(count: number): void {
    registry.setGauge('db_connections_active', {}, count);
  },

  /**
   * Start timing a database query
   */
  startQueryTimer(operation: string): () => number {
    return registry.startTimer('db_query_duration_seconds', { operation });
  },
};

/**
 * Auth metrics helpers
 */
export const authMetrics = {
  /**
   * Record login attempt
   */
  recordLoginAttempt(success: boolean): void {
    registry.incrementCounter('auth_login_attempts_total', { success: String(success) });
  },

  /**
   * Record token refresh
   */
  recordTokenRefresh(success: boolean): void {
    registry.incrementCounter('auth_token_refresh_total', { success: String(success) });
  },

  /**
   * Record logout
   */
  recordLogout(): void {
    registry.incrementCounter('auth_logout_total', {});
  },
};

/**
 * Get metrics registry
 */
export function getMetricsRegistry(): MetricsRegistry {
  return registry;
}

/**
 * Get metrics in Prometheus format
 */
export function getMetrics(): string {
  return registry.getMetrics();
}

/**
 * Create metrics middleware for Elysia
 * Records request metrics automatically
 */
export function createMetricsMiddleware() {
  return {
    beforeHandle: (ctx: { request: Request }) => {
      const url = new URL(ctx.request.url);
      const method = ctx.request.method;
      const path = url.pathname;

      // Skip metrics endpoint itself
      if (path === '/metrics') return;

      // Start timer and store in request for afterHandle
      const endTimer = httpMetrics.startRequestTimer(method, path);
      (ctx as any).__metricsEndTimer = endTimer;

      return undefined;
    },

    afterHandle: (ctx: { request: Request; set: { status?: number | string } }) => {
      const endTimer = (ctx as any).__metricsEndTimer;
      if (!endTimer) return;

      const url = new URL(ctx.request.url);
      const method = ctx.request.method;
      const path = url.pathname;
      const status = typeof ctx.set.status === 'number' ? ctx.set.status : 200;

      // End timer
      endTimer();

      // Record request
      httpMetrics.recordRequest(method, path, status);

      return undefined;
    },
  };
}

/**
 * Metrics endpoint handler for Elysia
 */
export function metricsEndpoint() {
  return new Response(getMetrics(), {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
