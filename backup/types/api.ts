import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiRequestConfig<TData = unknown, TParams = unknown> extends Omit<AxiosRequestConfig, 'data' | 'params'> {
  data?: TData;
  params?: TParams;
}

export interface ApiResponse<T = unknown> extends AxiosResponse<T> {
  data: T;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export type ApiClient = AxiosInstance & {
  get<T = unknown, TParams = Record<string, unknown>>(url: string, config?: ApiRequestConfig<never, TParams>): Promise<ApiResponse<T>>;
  post<T = unknown, TData = unknown, TParams = Record<string, unknown>>(url: string, data?: TData, config?: ApiRequestConfig<TData, TParams>): Promise<ApiResponse<T>>;
  put<T = unknown, TData = unknown, TParams = Record<string, unknown>>(url: string, data?: TData, config?: ApiRequestConfig<TData, TParams>): Promise<ApiResponse<T>>;
  patch<T = unknown, TData = unknown, TParams = Record<string, unknown>>(url: string, data?: TData, config?: ApiRequestConfig<TData, TParams>): Promise<ApiResponse<T>>;
  delete<T = unknown, TParams = Record<string, unknown>>(url: string, config?: ApiRequestConfig<never, TParams>): Promise<ApiResponse<T>>;
};