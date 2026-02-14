import { env } from '@shared/config/env.ts';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log level from string
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  child(context: string): ILogger;
}

/**
 * Structured Logger implementation
 * Outputs JSON in production, formatted in development
 */
export class Logger implements ILogger {
  private readonly minLevel: LogLevel;
  private readonly context?: string;

  constructor(context?: string) {
    this.context = context;
    this.minLevel = LOG_LEVEL_MAP[env.LOG_LEVEL] ?? LogLevel.INFO;
  }

  /**
   * Create a child logger with context
   */
  child(context: string): ILogger {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new Logger(childContext);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...(this.context && { context: this.context }),
      ...(data && Object.keys(data).length > 0 && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
        },
      }),
    };

    const output = this.format(entry, level);
    this.write(level, output);
  }

  private format(entry: LogEntry, level: LogLevel): string {
    if (env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }

    // Development format: more readable
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
      [LogLevel.INFO]: '\x1b[36m', // Cyan
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[level];

    let output = `${color}[${entry.level}]${reset} ${entry.message}`;

    if (entry.context) {
      output = `${color}[${entry.level}]${reset} [${entry.context}] ${entry.message}`;
    }

    if (entry.data) {
      output += ` ${JSON.stringify(entry.data)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  ${entry.error.stack}`;
      }
    }

    return output;
  }

  private write(level: LogLevel, output: string): void {
    if (level === LogLevel.ERROR) {
      console.error(output);
    } else if (level === LogLevel.WARN) {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with context
 */
export function createLogger(context: string): ILogger {
  return new Logger(context);
}
