import { logger } from '@/lib/logger';
// Debug script to check environment variables
logger.info('🔍 Environment Variables Check:');
logger.info('================================');

const envVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'PORT': process.env.PORT,
  'HOST': process.env.HOST,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  'DATABASE_URL': process.env.DATABASE_URL ? '***CONFIGURED***' : 'MISSING',
  'JWT_SECRET': process.env.JWT_SECRET ? '***CONFIGURED***' : 'MISSING',
  'CSRF_SECRET': process.env.CSRF_SECRET ? '***CONFIGURED***' : 'MISSING',
  'VERCEL_URL': process.env.VERCEL_URL,
  'ENABLE_AUTH_LOGGING': process.env.ENABLE_AUTH_LOGGING,
};

Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  logger.info(`${status} ${key}: ${value || 'NOT SET'}`);
});

logger.info('================================');

// Test URL construction
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || process.env.HOST || 'localhost';
  const port = process.env.PORT || '3002';
  
  return `${protocol}://${host}${port !== '80' && port !== '443' ? `:${port}` : ''}`;
};

logger.info('🌐 Constructed Base URL:', getBaseUrl());
logger.info('🚀 Server should be running on:', `http://localhost:${process.env.PORT || '3002'}`);
