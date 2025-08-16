import { logger } from '@/lib/logger';
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isTokenExpiringSoon, refreshToken } from '@/core/api/api';

interface UseTokenRefreshOptions {
  /**
   * Interval in milliseconds to check for token expiry
   * Default: 60000 (1 minute)
   */
  checkInterval?: number;
  
  /**
   * Whether to automatically refresh tokens
   * Default: true
   */
  autoRefresh?: boolean;
  
  /**
   * Callback when token refresh succeeds
   */
  onRefreshSuccess?: () => void;
  
  /**
   * Callback when token refresh fails
   */
  onRefreshError?: (error: Error) => void;
}

/**
 * Hook to handle automatic token refresh
 * 
 * @example
 * ```tsx
 * function App() {
 *   useTokenRefresh({
 *     onRefreshSuccess: () => logger.info('Token refreshed'),
 *     onRefreshError: (error) => logger.error('Refresh failed:', error)
 *   });
 *   
 *   return <div>App content</div>;
 * }
 * ```
 */
export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    checkInterval = 60000, // 1 minute
    autoRefresh = true,
    onRefreshSuccess,
    onRefreshError,
  } = options;

  const { isAuthenticated, logout } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const performRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !isAuthenticated) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      logger.info('🔄 Performing token refresh...');
      
      const newToken = await refreshToken();
      
      if (newToken) {
        logger.info('✅ Token refresh successful');
        onRefreshSuccess?.();
      } else {
        throw new Error('Token refresh returned null');
      }
    } catch (error) {
      logger.error('❌ Token refresh failed:', undefined, error as Error);
      onRefreshError?.(error as Error);
      
      // If refresh fails, logout the user
      logout();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [isAuthenticated, onRefreshSuccess, onRefreshError, logout]);

  const checkAndRefresh = useCallback(async () => {
    if (!isAuthenticated || !autoRefresh) {
      return;
    }

    if (isTokenExpiringSoon()) {
      logger.info('⏰ Token expiring soon, refreshing...');
      await performRefresh();
    }
  }, [isAuthenticated, autoRefresh, performRefresh]);

  // Set up interval to check token expiry
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkAndRefresh();

    // Set up interval
    intervalRef.current = setInterval(checkAndRefresh, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, autoRefresh, checkInterval, checkAndRefresh]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    await performRefresh();
  }, [isAuthenticated, performRefresh]);

  return {
    /**
     * Manually trigger token refresh
     */
    refresh: manualRefresh,
    
    /**
     * Whether a refresh is currently in progress
     */
    isRefreshing: isRefreshingRef.current,
    
    /**
     * Check if token is expiring soon
     */
    isExpiringSoon: isTokenExpiringSoon(),
  };
}

/**
 * Hook for components that need to ensure fresh tokens before API calls
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const ensureFreshToken = useEnsureFreshToken();
 *   
 *   const handleSave = async () => {
 *     await ensureFreshToken();
 *     // Now make API call with fresh token
 *     await api('/api/user/profile', { method: 'PUT', ... });
 *   };
 * }
 * ```
 */
export function useEnsureFreshToken() {
  const { isAuthenticated } = useAuth();

  return useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    if (isTokenExpiringSoon()) {
      logger.info('🔄 Ensuring fresh token...');
      const newToken = await refreshToken();
      
      if (!newToken) {
        throw new Error('Failed to refresh token');
      }
      
      logger.info('✅ Fresh token ensured');
    }
  }, [isAuthenticated]);
}
