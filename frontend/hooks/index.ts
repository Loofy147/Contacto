// hooks/index.ts
/**
 * Collection of custom React hooks for common patterns
 * RED TEAM: Test memory leaks, race conditions, edge cases
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type User } from '@/lib/services/auth.service';
import { apiClient } from '@/lib/api/client';

/**
 * Hook for debouncing values
 * RED TEAM: Test rapid value changes, cleanup on unmount
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for handling async operations with loading and error states
 * RED TEAM: Test concurrent calls, error handling, race conditions
 */
export function useAsync<T, E = Error>() {
  const [state, setState] = useState<{
    data: T | null;
    error: E | null;
    isLoading: boolean;
  }>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (promise: Promise<T>) => {
    setState({ data: null, error: null, isLoading: true });

    try {
      const data = await promise;
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (error) {
      setState({ data: null, error: error as E, isLoading: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for authentication state
 * RED TEAM: Test token manipulation, session fixation, logout races
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: authService.login.bind(authService),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout.bind(authService),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['auth', 'user'], null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register.bind(authService),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}

/**
 * Hook for media queries
 * RED TEAM: Test SSR/hydration, resize events, performance
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Add listener (newer API)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Hook for handling click outside
 * RED TEAM: Test event bubbling, portal components, touch events
 */
export function useOnClickOutside<T extends HTMLElement>(
  handler: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;

      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}

/**
 * Hook for local storage with SSR support
 * RED TEAM: Test storage quota, cross-tab sync, JSON parse errors
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove from storage
  const remove = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, remove];
}

/**
 * Hook for infinite scroll pagination
 * RED TEAM: Test race conditions, scroll edge cases, performance
 */
export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: { threshold?: number; enabled?: boolean } = {}
) {
  const { threshold = 100, enabled = true } = options;
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !enabled) return;

    setIsLoading(true);
    try {
      const result = await fetchFn(page);
      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((p) => p + 1);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, enabled, fetchFn]);

  useEffect(() => {
    if (!enabled || !loadMoreRef.current) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMore();
      }
    }, options);

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, enabled, threshold]);

  const reset = useCallback(() => {
    setPage(0);
    setItems([]);
    setHasMore(true);
  }, []);

  return { items, isLoading, hasMore, loadMoreRef, reset };
}

/**
 * Hook for form validation with Zod
 * RED TEAM: Test XSS, injection, malformed data
 */
export function useFormValidation<T>(
  schema: any, // Zod schema
  onSubmit: (data: T) => void | Promise<void>
) {
  const [values, setValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as string];
      return newErrors;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const result = schema.safeParse(values);

      if (!result.success) {
        const formattedErrors: Record<string, string> = {};
        result.error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          formattedErrors[path] = err.message;
        });
        setErrors(formattedErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(result.data);
        setValues({});
        setErrors({});
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, schema, onSubmit]
  );

  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
  };
}