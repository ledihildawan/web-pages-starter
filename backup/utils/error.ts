export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
}

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: unknown;
  status?: number;
  level: ErrorLevel;
  timestamp: Date;
  stack?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly level: ErrorLevel;
  public readonly details?: unknown;
  public readonly status?: number;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    level: ErrorLevel = ErrorLevel.ERROR,
    details?: unknown,
    status?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.level = level;
    this.details = details;
    this.status = status;
    this.timestamp = new Date();
    this.stack = new Error().stack;
  }

  toJSON(): ErrorContext {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      status: this.status,
      level: this.level,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred', details?: unknown) {
    super(ErrorCode.NETWORK_ERROR, message, ErrorLevel.ERROR, details);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', details?: unknown) {
    super(ErrorCode.TIMEOUT, message, ErrorLevel.WARN, details);
    this.name = 'TimeoutError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', details?: unknown) {
    super(ErrorCode.UNAUTHORIZED, message, ErrorLevel.WARN, details, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, ErrorLevel.INFO, details, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(ErrorCode.NOT_FOUND, message, ErrorLevel.INFO, details, 404);
    this.name = 'NotFoundError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}