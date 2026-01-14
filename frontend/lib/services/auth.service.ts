// lib/services/auth.service.ts
/**
 * Authentication service with token management and session handling
 * RED TEAM: Test token expiration, refresh failures, concurrent requests
 */

import { apiClient, APIError } from '../api/client';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  businessId?: string;
  permissions: string[];
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  private refreshPromise: Promise<AuthTokens> | null = null;
  private tokenExpiryTimer: NodeJS.Timeout | null = null;

  /**
   * Login with credentials
   * RED TEAM: Test SQL injection, brute force, credential stuffing
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials
      );

      this.storeTokens(response.tokens);
      this.scheduleTokenRefresh(response.tokens.expiresIn);

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific auth errors
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            throw new Error('Email or password is incorrect');
          case 'ACCOUNT_LOCKED':
            throw new Error('Account locked due to multiple failed attempts');
          case 'EMAIL_NOT_VERIFIED':
            throw new Error('Please verify your email before logging in');
          default:
            throw new Error('Login failed. Please try again.');
        }
      }
      throw error;
    }
  }

  /**
   * Register new user
   * RED TEAM: Test XSS in inputs, duplicate registrations, email validation bypass
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Client-side validation
    this.validateRegistrationData(data);

    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data
      );

      this.storeTokens(response.tokens);
      this.scheduleTokenRefresh(response.tokens.expiresIn);

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        switch (error.code) {
          case 'EMAIL_EXISTS':
            throw new Error('This email is already registered');
          case 'WEAK_PASSWORD':
            throw new Error('Password does not meet security requirements');
          default:
            throw new Error('Registration failed. Please try again.');
        }
      }
      throw error;
    }
  }

  /**
   * Logout and clear session
   * RED TEAM: Test session fixation, token invalidation race conditions
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API fails
    } finally {
      this.clearTokens();
      this.clearTokenExpiryTimer();
    }
  }

  /**
   * Refresh access token
   * RED TEAM: Test concurrent refresh calls, refresh token reuse, timing attacks
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple concurrent refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const tokens = await apiClient.post<AuthTokens>('/auth/refresh', {
          refreshToken,
        });

        this.storeTokens(tokens);
        this.scheduleTokenRefresh(tokens.expiresIn);

        return tokens;
      } catch (error) {
        // If refresh fails, logout user
        this.clearTokens();
        throw new Error('Session expired. Please login again.');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get current authenticated user
   * RED TEAM: Test authorization bypass, privilege escalation
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  /**
   * Request password reset
   * RED TEAM: Test email enumeration, token prediction, replay attacks
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Always return success to prevent email enumeration
    try {
      await apiClient.post('/auth/password-reset/request', { email });
    } catch {
      // Silently fail to prevent enumeration
    }
  }

  /**
   * Reset password with token
   * RED TEAM: Test token brute force, timing attacks, token reuse
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password-reset/confirm', {
      token,
      password: newPassword,
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return sessionStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  /**
   * Store tokens securely
   * RED TEAM: Test XSS token theft, storage manipulation
   */
  private storeTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    try {
      // Access token in sessionStorage (cleared on tab close)
      sessionStorage.setItem('auth_token', tokens.accessToken);

      // Refresh token in localStorage (persists across sessions)
      localStorage.setItem('refresh_token', tokens.refreshToken);

      // Store expiry time
      const expiryTime = Date.now() + tokens.expiresIn * 1000;
      sessionStorage.setItem('token_expiry', expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Clear all stored tokens
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('token_expiry');
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Schedule automatic token refresh before expiry
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    this.clearTokenExpiryTimer();

    // Refresh 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;

    if (refreshTime > 0) {
      this.tokenExpiryTimer = setTimeout(() => {
        this.refreshAccessToken().catch(console.error);
      }, refreshTime);
    }
  }

  /**
   * Clear token expiry timer
   */
  private clearTokenExpiryTimer(): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }

  /**
   * Validate registration data
   * RED TEAM: Test with malicious inputs, boundary values
   */
  private validateRegistrationData(data: RegisterData): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check for common weak patterns
    const weakPatterns = ['password', '12345678', 'qwerty'];
    if (weakPatterns.some(p => data.password.toLowerCase().includes(p))) {
      throw new Error('Password is too weak');
    }

    if (!data.firstName?.trim() || !data.lastName?.trim()) {
      throw new Error('First name and last name are required');
    }
  }
}

export const authService = new AuthService();
export type { LoginCredentials, RegisterData, User, AuthResponse };