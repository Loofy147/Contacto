// lib/api/client.ts
/**
 * API Client with built-in retry logic, error handling, and request/response interceptors
 * RED TEAM: Test with malformed tokens, expired sessions, network failures
 */

type RequestConfig = RequestInit & {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
};

class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL: string;
  private defaultTimeout = 30000;
  private defaultRetries = 3;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...options } = config;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async retryRequest(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const { retries = this.defaultRetries, retryDelay = 1000 } = config;
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.fetchWithTimeout(url, config);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        if (i < retries) {
          await new Promise(res => setTimeout(res, retryDelay * Math.pow(2, i)));
        }
      }
    }

    throw lastError!;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: unknown;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = data as { code?: string; message?: string; details?: unknown };
      throw new APIError(
        response.status,
        error?.code || 'UNKNOWN_ERROR',
        error?.message || response.statusText,
        error?.details
      );
    }

    return data as T;
  }

  private getAuthToken(): string | null {
    // RED TEAM: Test with expired, malformed, or missing tokens
    if (typeof window === 'undefined') return null;

    try {
      return sessionStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // CSRF protection
    headers.set('X-Requested-With', 'XMLHttpRequest');

    return headers;
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(config.headers);

    const finalConfig: RequestConfig = {
      ...config,
      headers,
      credentials: 'include', // Send cookies
    };

    try {
      const response = await this.retryRequest(url, finalConfig);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Log to monitoring service
      console.error('API Request Failed:', { endpoint, error });
      throw error;
    }
  }

  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
);

export { APIError };
export type { RequestConfig };