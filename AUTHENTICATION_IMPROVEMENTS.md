# Authentication & Security Improvements

Đây là tài liệu mô tả các cải thiện về authentication và security đã được thực hiện theo best practices.

## 🔐 Cải thiện Token Management

### 1. Secure Token Storage
- **Trước**: Token được lưu trữ dưới dạng plain text trong localStorage
- **Sau**: Token được mã hóa (base64) và lưu trữ với metadata bao gồm expiry time
- **Lợi ích**: Tăng cường bảo mật, tự động kiểm tra token expiry

### 2. Token Structure
```typescript
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}
```

### 3. Automatic Token Migration
- Tự động migrate từ format token cũ sang format mới
- Backward compatibility được đảm bảo

## 🔄 Token Refresh Mechanism

### 1. Automatic Refresh
- Token được tự động refresh khi sắp hết hạn (5 phút trước expiry)
- Refresh được thực hiện trong request interceptor
- Tránh việc user bị logout đột ngột

### 2. Refresh Token Rotation
- Mỗi lần refresh sẽ tạo ra access token và refresh token mới
- Tăng cường bảo mật bằng cách giảm thời gian sống của token

### 3. Error Handling
- Xử lý graceful khi refresh token hết hạn
- Tự động logout user khi không thể refresh
- Event-driven architecture để thông báo lỗi

## 🛡️ Security Headers

### 1. Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
```

### 2. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 3. CSRF Protection
- CSRF token được tự động thêm vào mọi non-GET requests
- Token được lưu trong httpOnly cookie
- Validation được thực hiện ở middleware level

## 🔧 API Client Improvements

### 1. Enhanced Interceptors
```typescript
// Request Interceptor
- Automatic token attachment
- Token refresh before expiry
- CSRF token injection
- Request ID for tracing

// Response Interceptor
- Error handling
- Token refresh on 401
- Logging and debugging

// Error Interceptor
- Graceful error handling
- Automatic logout on auth failure
- Event dispatching for UI updates
```

### 2. Type Safety
- Strongly typed API responses
- Error types for better error handling
- Generic support for different response types

## 📱 React Integration

### 1. Enhanced AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{success: boolean; error?: string}>;
  logout: () => void;
  register: (...) => Promise<{success: boolean; error?: string}>;
  refreshUserToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### 2. Token Refresh Hook
```typescript
const { refresh, isRefreshing, isExpiringSoon } = useTokenRefresh({
  onRefreshSuccess: () => console.log('Token refreshed'),
  onRefreshError: (error) => console.error('Refresh failed:', error)
});
```

### 3. Ensure Fresh Token Hook
```typescript
const ensureFreshToken = useEnsureFreshToken();

const handleApiCall = async () => {
  await ensureFreshToken();
  // API call with guaranteed fresh token
  await api('/api/endpoint', { method: 'POST', ... });
};
```

## 🚀 Usage Examples

### 1. Basic API Call
```typescript
import { api } from '@/core/api/api';

// Token và CSRF được tự động thêm
const response = await api<User[]>('/api/users');
```

### 2. Manual Token Refresh
```typescript
import { refreshToken } from '@/core/api/tokenManager';

try {
  const newToken = await refreshToken();
  if (newToken) {
    console.log('Token refreshed successfully');
  }
} catch (error) {
  console.error('Refresh failed:', error);
}
```

### 3. Component with Auto Refresh
```typescript
function MyComponent() {
  useTokenRefresh({
    checkInterval: 60000, // Check every minute
    onRefreshError: () => {
      // Handle refresh failure
      toast.error('Session expired, please login again');
    }
  });

  return <div>My Component</div>;
}
```

## 🔒 Security Best Practices Implemented

1. **Token Expiry**: Short-lived access tokens (15 minutes)
2. **Refresh Rotation**: New refresh token on each refresh
3. **Secure Storage**: Encrypted token storage
4. **CSRF Protection**: Automatic CSRF token handling
5. **Security Headers**: Comprehensive security headers
6. **Input Validation**: Server-side validation for all inputs
7. **Error Handling**: Graceful error handling without information leakage
8. **Logging**: Comprehensive logging for debugging and monitoring

## 📋 Migration Guide

### For Existing Code
1. **API Calls**: No changes needed, existing `api()` calls will work
2. **Auth Context**: New properties available (`isAuthenticated`, `refreshUserToken`)
3. **Token Storage**: Automatic migration from old format

### New Features to Use
1. Add `useTokenRefresh()` to main app component
2. Use `useEnsureFreshToken()` for critical API calls
3. Handle auth events in your components

## 🐛 Troubleshooting

### Common Issues
1. **Token not refreshing**: Check if refresh token is valid
2. **CSRF errors**: Ensure CSRF endpoint is accessible
3. **Storage issues**: Check localStorage permissions

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging:
- Token operations
- Refresh attempts
- CSRF token handling
- API request/response logging
