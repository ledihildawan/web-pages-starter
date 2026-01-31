import type { AxiosError, AxiosResponse } from 'axios';
import { env } from '../config/env';
import {
  AppError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  ErrorCode,
  ErrorLevel,
  isAppError,
} from '../utils/error';

interface ErrorResponse {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

function logError(error: AppError | Error): void {
  if (env.LOG_LEVEL === 'debug') {
    console.error('[Error]', error);
  } else {
    console.error('[Error]', error.message);
  }
}

function handleAxiosError(error: AxiosError<ErrorResponse>): AppError {
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new TimeoutError();
    }
    return new NetworkError(error.message);
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return new ValidationError(data?.message || 'Validation error', data?.errors);
    case 401:
      return new UnauthorizedError(data?.message || 'Unauthorized');
    case 403:
      return new AppError(ErrorCode.FORBIDDEN, data?.message || 'Forbidden', ErrorLevel.WARN, undefined, 403);
    case 404:
      return new NotFoundError(data?.message || 'Not found');
    case 422:
      return new ValidationError(data?.message || 'Unprocessable entity', data?.errors);
    case 500:
      return new AppError(ErrorCode.SERVER_ERROR, data?.message || 'Server error', ErrorLevel.ERROR, undefined, 500);
    case 502:
    case 503:
    case 504:
      return new AppError(ErrorCode.SERVER_ERROR, data?.message || 'Service unavailable', ErrorLevel.ERROR, undefined, status);
    default:
      return new AppError(ErrorCode.UNKNOWN, data?.message || 'Unknown error', ErrorLevel.ERROR, undefined, status);
  }
}

export function handleRequestError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(ErrorCode.UNKNOWN, error.message, ErrorLevel.ERROR);
  }

  return new AppError(ErrorCode.UNKNOWN, 'An unknown error occurred', ErrorLevel.ERROR);
}

export function createAxiosErrorHandler() {
  return (error: unknown): Promise<AppError> => {
    const appError = error instanceof Error && 'isAxiosError' in error
      ? handleAxiosError(error as AxiosError<ErrorResponse>)
      : handleRequestError(error);

    logError(appError);

    if (appError instanceof UnauthorizedError) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(appError);
  };
}

export function createAxiosResponseInterceptor() {
  return (response: AxiosResponse): AxiosResponse => {
    return response;
  };
}