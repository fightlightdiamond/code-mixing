"use client";
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { getTokenStatus, refreshToken, TokenStatus } from '@/core/api/api';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export function TokenDebugPanel() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const updateStatus = () => {
    const status = getTokenStatus();
    setTokenStatus(status);
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleManualRefresh = async () => {
    try {
      logger.info('Manual token refresh triggered');
      const newToken = await refreshToken();
      if (newToken) {
        logger.info('Manual refresh successful');
        updateStatus();
      } else {
        logger.error('Manual refresh failed');
      }
    } catch (error) {
      logger.error('Manual refresh error', undefined, error instanceof Error ? error : undefined);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace',
          cursor: 'pointer',
        }}
      >
        🔑 Token Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 9999,
        fontFamily: 'monospace',
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>🔑 Token Debug Panel</span>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Auth Status:</strong>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Role: {user?.role || 'None'}</div>
      </div>

      {tokenStatus && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Token Status:</strong>
          <div>Access Token: {tokenStatus.hasAccessToken ? '✅' : '❌'} ({tokenStatus.accessTokenLength} chars)</div>
          <div>Refresh Token: {tokenStatus.hasRefreshToken ? '✅' : '❌'} ({tokenStatus.refreshTokenLength} chars)</div>
          <div>Expiring Soon: {tokenStatus.isExpiringSoon ? '⚠️ YES' : '✅ NO'}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={updateStatus}
          style={{
            background: '#333',
            border: '1px solid #555',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh Status
        </button>
        
        <button
          onClick={handleManualRefresh}
          disabled={!tokenStatus?.hasRefreshToken}
          style={{
            background: tokenStatus?.hasRefreshToken ? '#0066cc' : '#666',
            border: '1px solid #555',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: tokenStatus?.hasRefreshToken ? 'pointer' : 'not-allowed',
          }}
        >
          🔄 Manual Refresh
        </button>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            background: '#cc0000',
            border: '1px solid #555',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          🗑️ Clear All
        </button>
      </div>

      <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
