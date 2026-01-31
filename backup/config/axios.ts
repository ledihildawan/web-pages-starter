import axios from 'axios';
import type { ApiClient } from '../types/api';
import { env } from './env';
import { createAxiosErrorHandler, createAxiosResponseInterceptor } from '../utils/axios-error-handler';

const api = axios.create({
  baseURL: env.API_URL,
  timeout: env.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' }
}) as ApiClient;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  createAxiosResponseInterceptor(),
  createAxiosErrorHandler()
);

export default api;