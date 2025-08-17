# API Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for common issues encountered when working with the EdTech Platform API. It includes diagnostic steps, common solutions, and debugging techniques.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Authorization Problems](#authorization-problems)
3. [Rate Limiting Issues](#rate-limiting-issues)
4. [Validation Errors](#validation-errors)
5. [Network and Connectivity](#network-and-connectivity)
6. [Performance Issues](#performance-issues)
7. [Data Consistency Problems](#data-consistency-problems)
8. [Debugging Tools and Techniques](#debugging-tools-and-techniques)

## Authentication Issues

### Issue: "Unauthorized" Error (401)

**Symptoms:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**Common Causes and Solutions:**

#### 1. Missing Authorization Header

```javascript
// ❌ Incorrect - Missing Authorization header
fetch("/api/learning/stories");

// ✅ Correct - Include Authorization header
fetch("/api/learning/stories", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### 2. Malformed Token Format

```javascript
// ❌ Incorrect - Missing "Bearer " prefix
headers: {
  'Authorization': token
}

// ✅ Correct - Include "Bearer " prefix
headers: {
  'Authorization': `Bearer ${token}`
}
```

#### 3. Expired Token

```javascript
// Check token expiration
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true; // Invalid token format
  }
}

// Automatic token refresh
async function makeAuthenticatedRequest(url, options = {}) {
  let token = getStoredToken();

  if (isTokenExpired(token)) {
    token = await refreshToken();
    if (!token) {
      throw new Error("Unable to refresh token");
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}
```

#### 4. Invalid Token Signature

```javascript
// Verify token structure
function validateTokenStructure(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT structure");
  }

  try {
    // Verify each part can be decoded
    JSON.parse(atob(parts[0])); // Header
    JSON.parse(atob(parts[1])); // Payload
    // Signature verification happens server-side
    return true;
  } catch (error) {
    throw new Error("Invalid JWT format");
  }
}
```

### Issue: Token Refresh Failures

**Symptoms:**

```json
{
  "error": "Invalid refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

**Solutions:**

#### 1. Implement Robust Token Management

```javascript
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshPromise = null;
  }

  async getValidToken() {
    if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
      return this.accessToken;
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshAccessToken();

    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;

      // Store tokens securely
      this.storeTokens(data.accessToken, data.refreshToken);

      return data.accessToken;
    } catch (error) {
      // Clear invalid tokens
      this.clearTokens();
      throw error;
    }
  }

  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now() + 30000; // 30s buffer
    } catch (error) {
      return true;
    }
  }

  storeTokens(accessToken, refreshToken) {
    // Use secure storage (httpOnly cookies in production)
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}
```

## Authorization Problems

### Issue: "Forbidden" Error (403)

**Symptoms:**

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "required": "read:Story",
    "userRole": "student"
  }
}
```

**Common Causes and Solutions:**

#### 1. Insufficient Role Permissions

```javascript
// Check user permissions before making requests
function checkPermission(userRole, requiredPermission) {
  const rolePermissions = {
    student: ["read:Story", "read:Progress", "update:Progress"],
    coach: [
      "read:Story",
      "read:Progress",
      "update:Progress",
      "read:StudentProgress",
    ],
    admin: ["*"], // All permissions
  };

  const permissions = rolePermissions[userRole] || [];
  return permissions.includes("*") || permissions.includes(requiredPermission);
}

// Use permission check before API calls
async function fetchAdminData() {
  const user = getCurrentUser();

  if (!checkPermission(user.role, "read:AdminData")) {
    throw new Error("Insufficient permissions for admin data");
  }

  return fetch("/api/admin/data", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

#### 2. Resource Ownership Issues

```javascript
// Ensure user can only access their own resources
async function fetchUserProgress(userId) {
  const currentUser = getCurrentUser();

  // Students can only access their own progress
  if (currentUser.role === "student" && currentUser.id !== userId) {
    throw new Error("Cannot access other users' progress");
  }

  return fetch(`/api/learning/progress/user?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

#### 3. Tenant Isolation Problems

```javascript
// Verify tenant context
function validateTenantAccess(resourceTenantId) {
  const user = getCurrentUser();

  if (user.tenantId && user.tenantId !== resourceTenantId) {
    throw new Error("Cross-tenant access not allowed");
  }
}

// Include tenant context in requests
async function fetchTenantStories() {
  const user = getCurrentUser();

  return fetch("/api/learning/stories", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-ID": user.tenantId,
    },
  });
}
```

## Rate Limiting Issues

### Issue: "Rate Limit Exceeded" Error (429)

**Symptoms:**

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "window": "1 hour",
    "retryAfter": 3600
  }
}
```

**Solutions:**

#### 1. Implement Exponential Backoff

```javascript
class RateLimitHandler {
  async executeWithBackoff(requestFn, maxRetries = 3) {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.status === 429 && attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, error.retryAfter);
          console.log(`Rate limited. Retrying in ${delay}ms`);
          await this.sleep(delay);
          attempt++;
        } else {
          throw error;
        }
      }
    }
  }

  calculateBackoffDelay(attempt, retryAfter) {
    if (retryAfter) {
      return retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff with jitter
    const baseDelay = 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

#### 2. Request Queuing and Throttling

```javascript
class RequestThrottler {
  constructor(maxConcurrent = 5, delayBetweenRequests = 200) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
  }

  async throttle(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      setTimeout(() => this.processQueue(), this.delayBetweenRequests);
    }
  }
}
```

## Validation Errors

### Issue: Request Validation Failures (400)

**Symptoms:**

```json
{
  "error": "Validation failed",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

**Solutions:**

#### 1. Client-Side Validation

```javascript
class RequestValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format");
    }
  }

  static validatePassword(password) {
    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new ValidationError(
        "Password must contain uppercase, lowercase, and number"
      );
    }
  }

  static validateStoryData(storyData) {
    const errors = [];

    if (!storyData.title || storyData.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title is required" });
    }

    if (storyData.title && storyData.title.length > 255) {
      errors.push({
        field: "title",
        message: "Title must be less than 255 characters",
      });
    }

    if (!storyData.content || storyData.content.trim().length === 0) {
      errors.push({ field: "content", message: "Content is required" });
    }

    if (
      !["beginner", "intermediate", "advanced"].includes(storyData.difficulty)
    ) {
      errors.push({ field: "difficulty", message: "Invalid difficulty level" });
    }

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", errors);
    }
  }
}

// Usage
try {
  RequestValidator.validateStoryData(storyData);
  const response = await fetch("/api/stories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(storyData),
  });
} catch (error) {
  if (error instanceof ValidationError) {
    displayValidationErrors(error.errors);
  }
}
```

#### 2. Dynamic Validation Based on API Schema

```javascript
class SchemaValidator {
  constructor() {
    this.schemas = new Map();
  }

  async loadSchema(endpoint) {
    if (!this.schemas.has(endpoint)) {
      const response = await fetch(`/api/schema${endpoint}`);
      const schema = await response.json();
      this.schemas.set(endpoint, schema);
    }
    return this.schemas.get(endpoint);
  }

  async validateRequest(endpoint, data) {
    const schema = await this.loadSchema(endpoint);
    return this.validateAgainstSchema(data, schema);
  }

  validateAgainstSchema(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema.properties)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }

      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push({
            field,
            message: `${field} must be of type ${rules.type}`,
          });
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters`,
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must be less than ${rules.maxLength} characters`,
          });
        }

        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push({ field, message: `${field} format is invalid` });
        }
      }
    }

    return errors;
  }
}
```

## Network and Connectivity

### Issue: Network Timeouts and Connection Errors

**Symptoms:**

- Request timeouts
- Connection refused errors
- DNS resolution failures
- SSL certificate errors

**Solutions:**

#### 1. Implement Request Timeout Handling

```javascript
class NetworkHandler {
  constructor(defaultTimeout = 30000) {
    this.defaultTimeout = defaultTimeout;
  }

  async fetchWithTimeout(url, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new NetworkError("Request timeout", "TIMEOUT");
      }

      throw this.handleNetworkError(error);
    }
  }

  handleNetworkError(error) {
    if (error.message.includes("Failed to fetch")) {
      return new NetworkError("Network connection failed", "CONNECTION_FAILED");
    }

    if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
      return new NetworkError("DNS resolution failed", "DNS_ERROR");
    }

    if (error.message.includes("ERR_CERT_")) {
      return new NetworkError("SSL certificate error", "SSL_ERROR");
    }

    return new NetworkError("Unknown network error", "UNKNOWN_ERROR");
  }
}
```

#### 2. Implement Retry Logic for Network Failures

```javascript
class RetryHandler {
  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async executeWithRetry(requestFn) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries) {
          break; // Max retries reached
        }

        if (!this.shouldRetry(error)) {
          break; // Don't retry for certain errors
        }

        const delay = this.calculateRetryDelay(attempt);
        console.log(
          `Request failed, retrying in ${delay}ms (attempt ${attempt + 1})`
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === "TIMEOUT" ||
      error.code === "CONNECTION_FAILED" ||
      (error.status >= 500 && error.status < 600)
    );
  }

  calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

#### 3. Connection Health Monitoring

```javascript
class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionQuality = "good";
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.onConnectionLost();
    });

    // Monitor connection quality
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        this.updateConnectionQuality();
      });
    }
  }

  updateConnectionQuality() {
    const connection = navigator.connection;
    if (!connection) return;

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    if (effectiveType === "4g" && downlink > 10) {
      this.connectionQuality = "excellent";
    } else if (effectiveType === "4g" || downlink > 1.5) {
      this.connectionQuality = "good";
    } else if (effectiveType === "3g" || downlink > 0.5) {
      this.connectionQuality = "fair";
    } else {
      this.connectionQuality = "poor";
    }
  }

  async waitForConnection() {
    if (this.isOnline) return;

    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.isOnline) {
          resolve();
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    });
  }

  onConnectionLost() {
    console.log("Connection lost - switching to offline mode");
    // Implement offline functionality
  }

  onConnectionRestored() {
    console.log("Connection restored - syncing offline changes");
    // Implement sync functionality
  }
}
```

## Performance Issues

### Issue: Slow API Response Times

**Symptoms:**

- Long response times (>2 seconds)
- Timeouts on large data requests
- UI freezing during API calls

**Solutions:**

#### 1. Request Optimization

```javascript
class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async optimizedFetch(url, options = {}) {
    // Implement request deduplication
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 minutes
      return cached.data;
    }

    // Make request with performance monitoring
    const startTime = performance.now();
    const requestPromise = this.makeRequest(url, options);

    this.pendingRequests.set(url, requestPromise);

    try {
      const response = await requestPromise;
      const endTime = performance.now();

      // Log slow requests
      if (endTime - startTime > 2000) {
        console.warn(`Slow API request: ${url} took ${endTime - startTime}ms`);
      }

      // Cache successful responses
      if (response.ok) {
        const data = await response.json();
        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
      }

      return response;
    } finally {
      this.pendingRequests.delete(url);
    }
  }

  async makeRequest(url, options) {
    // Add compression headers
    const headers = {
      "Accept-Encoding": "gzip, deflate, br",
      ...options.headers,
    };

    return fetch(url, { ...options, headers });
  }
}
```

#### 2. Pagination and Lazy Loading

```javascript
class PaginatedDataLoader {
  constructor(endpoint, pageSize = 20) {
    this.endpoint = endpoint;
    this.pageSize = pageSize;
    this.loadedPages = new Set();
    this.data = [];
  }

  async loadPage(page) {
    if (this.loadedPages.has(page)) {
      return this.getPageData(page);
    }

    const response = await fetch(
      `${this.endpoint}?page=${page}&limit=${this.pageSize}`
    );

    const pageData = await response.json();

    // Insert data at correct position
    const startIndex = (page - 1) * this.pageSize;
    this.data.splice(startIndex, this.pageSize, ...pageData.data);

    this.loadedPages.add(page);
    return pageData;
  }

  getPageData(page) {
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.data.slice(startIndex, endIndex);
  }

  async loadMore() {
    const nextPage = this.loadedPages.size + 1;
    return this.loadPage(nextPage);
  }
}
```

#### 3. Background Data Prefetching

```javascript
class DataPrefetcher {
  constructor() {
    this.prefetchQueue = [];
    this.isProcessing = false;
  }

  prefetch(url, priority = "low") {
    this.prefetchQueue.push({ url, priority, timestamp: Date.now() });
    this.prefetchQueue.sort((a, b) => {
      // Sort by priority, then by timestamp
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.timestamp - b.timestamp;
    });

    if (!this.isProcessing) {
      this.processPrefetchQueue();
    }
  }

  async processPrefetchQueue() {
    this.isProcessing = true;

    while (this.prefetchQueue.length > 0) {
      const { url } = this.prefetchQueue.shift();

      try {
        // Use low priority for prefetch requests
        await fetch(url, { priority: "low" });
      } catch (error) {
        console.warn(`Prefetch failed for ${url}:`, error);
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  // Prefetch related data based on user behavior
  prefetchRelatedContent(currentStoryId) {
    // Prefetch next story in sequence
    this.prefetch(`/api/learning/stories/${currentStoryId + 1}`, "medium");

    // Prefetch exercises for current story
    this.prefetch(`/api/learning/exercises/story/${currentStoryId}`, "high");

    // Prefetch user progress
    this.prefetch("/api/learning/progress/user", "low");
  }
}
```

## Data Consistency Problems

### Issue: Stale or Inconsistent Data

**Symptoms:**

- UI showing outdated information
- Data conflicts between different views
- Cache invalidation issues

**Solutions:**

#### 1. Cache Invalidation Strategy

```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.dependencies = new Map(); // Track cache dependencies
  }

  set(key, value, dependencies = []) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      dependencies,
    });

    // Track reverse dependencies
    dependencies.forEach((dep) => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep).add(key);
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    return cached ? cached.value : null;
  }

  invalidate(key) {
    // Remove from cache
    this.cache.delete(key);

    // Invalidate dependent caches
    const dependents = this.dependencies.get(key);
    if (dependents) {
      dependents.forEach((dependent) => {
        this.invalidate(dependent);
      });
      this.dependencies.delete(key);
    }
  }

  // Invalidate based on data mutations
  onDataMutation(entityType, entityId) {
    const cacheKey = `${entityType}:${entityId}`;
    this.invalidate(cacheKey);

    // Invalidate related caches
    switch (entityType) {
      case "story":
        this.invalidate("stories:list");
        this.invalidate(`exercises:story:${entityId}`);
        break;
      case "progress":
        this.invalidate("progress:user");
        this.invalidate("progress:analytics");
        break;
    }
  }
}
```

#### 2. Optimistic Updates with Rollback

```javascript
class OptimisticUpdateManager {
  constructor() {
    this.pendingUpdates = new Map();
  }

  async optimisticUpdate(key, updateFn, apiCall) {
    // Store original value for rollback
    const originalValue = this.getCurrentValue(key);

    // Apply optimistic update
    const optimisticValue = updateFn(originalValue);
    this.updateUI(key, optimisticValue);

    // Track pending update
    this.pendingUpdates.set(key, { originalValue, optimisticValue });

    try {
      // Make API call
      const serverValue = await apiCall();

      // Update with server response
      this.updateUI(key, serverValue);
      this.pendingUpdates.delete(key);

      return serverValue;
    } catch (error) {
      // Rollback on failure
      this.rollback(key);
      throw error;
    }
  }

  rollback(key) {
    const pending = this.pendingUpdates.get(key);
    if (pending) {
      this.updateUI(key, pending.originalValue);
      this.pendingUpdates.delete(key);
    }
  }

  getCurrentValue(key) {
    // Get current value from state management system
    return store.getState()[key];
  }

  updateUI(key, value) {
    // Update UI state
    store.dispatch({ type: "UPDATE", key, value });
  }
}
```

## Debugging Tools and Techniques

### API Request Logging

```javascript
class APILogger {
  constructor(enabled = process.env.NODE_ENV === "development") {
    this.enabled = enabled;
    this.logs = [];
  }

  logRequest(url, options, startTime) {
    if (!this.enabled) return;

    const logEntry = {
      id: this.generateId(),
      url,
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
      startTime,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);
    console.group(`🚀 API Request: ${logEntry.method} ${url}`);
    console.log("Headers:", logEntry.headers);
    if (logEntry.body) {
      console.log("Body:", logEntry.body);
    }
    console.groupEnd();

    return logEntry.id;
  }

  logResponse(requestId, response, endTime) {
    if (!this.enabled) return;

    const logEntry = this.logs.find((log) => log.id === requestId);
    if (logEntry) {
      logEntry.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        endTime,
        duration: endTime - logEntry.startTime,
      };

      console.group(`📥 API Response: ${response.status} ${logEntry.url}`);
      console.log("Duration:", `${logEntry.response.duration}ms`);
      console.log("Status:", response.status, response.statusText);
      console.log("Headers:", logEntry.response.headers);
      console.groupEnd();
    }
  }

  logError(requestId, error) {
    if (!this.enabled) return;

    const logEntry = this.logs.find((log) => log.id === requestId);
    if (logEntry) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };

      console.group(`❌ API Error: ${logEntry.url}`);
      console.error("Error:", error);
      console.groupEnd();
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

### Network Diagnostics

```javascript
class NetworkDiagnostics {
  async runDiagnostics() {
    const results = {
      connectivity: await this.testConnectivity(),
      latency: await this.measureLatency(),
      bandwidth: await this.estimateBandwidth(),
      dns: await this.testDNSResolution(),
      ssl: await this.testSSLConnection(),
    };

    console.table(results);
    return results;
  }

  async testConnectivity() {
    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });
      return {
        status: "connected",
        responseTime: response.headers.get("x-response-time") || "unknown",
      };
    } catch (error) {
      return {
        status: "disconnected",
        error: error.message,
      };
    }
  }

  async measureLatency() {
    const measurements = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      try {
        await fetch("/api/ping", { method: "HEAD" });
        const end = performance.now();
        measurements.push(end - start);
      } catch (error) {
        measurements.push(null);
      }
    }

    const validMeasurements = measurements.filter((m) => m !== null);
    const average =
      validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length;

    return {
      average: Math.round(average),
      min: Math.round(Math.min(...validMeasurements)),
      max: Math.round(Math.max(...validMeasurements)),
      measurements: validMeasurements.map((m) => Math.round(m)),
    };
  }

  async estimateBandwidth() {
    const testSizes = [1024, 10240, 102400]; // 1KB, 10KB, 100KB
    const results = [];

    for (const size of testSizes) {
      const start = performance.now();
      try {
        const response = await fetch(`/api/bandwidth-test?size=${size}`);
        await response.blob();
        const end = performance.now();

        const duration = (end - start) / 1000; // seconds
        const bandwidth = (size * 8) / duration / 1000; // kbps

        results.push({ size, bandwidth: Math.round(bandwidth) });
      } catch (error) {
        results.push({ size, error: error.message });
      }
    }

    return results;
  }

  async testDNSResolution() {
    const domains = [
      window.location.hostname,
      "api.edtech-platform.com",
      "cdn.edtech-platform.com",
    ];

    const results = {};

    for (const domain of domains) {
      const start = performance.now();
      try {
        await fetch(`https://${domain}/favicon.ico`, {
          method: "HEAD",
          mode: "no-cors",
        });
        const end = performance.now();
        results[domain] = { status: "resolved", time: Math.round(end - start) };
      } catch (error) {
        results[domain] = { status: "failed", error: error.message };
      }
    }

    return results;
  }

  async testSSLConnection() {
    try {
      const response = await fetch("/api/ssl-info");
      const sslInfo = await response.json();
      return {
        status: "valid",
        protocol: sslInfo.protocol,
        cipher: sslInfo.cipher,
        validFrom: sslInfo.validFrom,
        validTo: sslInfo.validTo,
      };
    } catch (error) {
      return {
        status: "invalid",
        error: error.message,
      };
    }
  }
}
```

### Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: [],
      errors: [],
      performance: [],
    };
  }

  startMonitoring() {
    // Monitor API calls
    this.interceptFetch();

    // Monitor performance
    this.monitorPerformance();

    // Monitor errors
    this.monitorErrors();
  }

  interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const start = performance.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        const end = performance.now();

        this.recordAPICall({
          url,
          method: args[1]?.method || "GET",
          status: response.status,
          duration: end - start,
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        const end = performance.now();

        this.recordError({
          url,
          error: error.message,
          duration: end - start,
          timestamp: Date.now(),
        });

        throw error;
      }
    };
  }

  monitorPerformance() {
    // Monitor Core Web Vitals
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceMetric({
            name: entry.name,
            value: entry.value,
            timestamp: Date.now(),
          });
        }
      });

      observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
    }
  }

  monitorErrors() {
    window.addEventListener("error", (event) => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.recordError({
        message: "Unhandled Promise Rejection",
        reason: event.reason,
        timestamp: Date.now(),
      });
    });
  }

  recordAPICall(data) {
    this.metrics.apiCalls.push(data);

    // Keep only last 100 calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }
  }

  recordError(data) {
    this.metrics.errors.push(data);

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
  }

  recordPerformanceMetric(data) {
    this.metrics.performance.push(data);

    // Keep only last 100 metrics
    if (this.metrics.performance.length > 100) {
      this.metrics.performance.shift();
    }
  }

  generateReport() {
    const apiCalls = this.metrics.apiCalls;
    const errors = this.metrics.errors;

    return {
      summary: {
        totalAPICalls: apiCalls.length,
        totalErrors: errors.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        errorRate: (errors.length / apiCalls.length) * 100,
      },
      slowestAPIs: this.getSlowestAPIs(),
      mostFrequentErrors: this.getMostFrequentErrors(),
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  calculateAverageResponseTime() {
    const apiCalls = this.metrics.apiCalls;
    if (apiCalls.length === 0) return 0;

    const totalTime = apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return Math.round(totalTime / apiCalls.length);
  }

  getSlowestAPIs() {
    return this.metrics.apiCalls
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map((call) => ({
        url: call.url,
        method: call.method,
        duration: Math.round(call.duration),
      }));
  }

  getMostFrequentErrors() {
    const errorCounts = {};

    this.metrics.errors.forEach((error) => {
      const key = error.message || error.reason;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  getPerformanceMetrics() {
    return this.metrics.performance.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {});
  }
}
```

---

This comprehensive troubleshooting guide provides detailed solutions for common API issues, debugging tools, and monitoring techniques to help developers quickly identify and resolve problems when working with the EdTech Platform API.
