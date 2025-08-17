# API Rate Limiting Guide

## Overview

The EdTech Platform API implements comprehensive rate limiting to ensure fair usage, prevent abuse, and maintain system performance. This guide explains the rate limiting mechanisms, limits, and best practices for handling rate limits in your applications.

## Rate Limiting Strategy

### Token Bucket Algorithm

The API uses a token bucket algorithm for rate limiting:

1. **Token Bucket**: Each user/IP gets a bucket with a fixed number of tokens
2. **Token Consumption**: Each API request consumes one token
3. **Token Refill**: Tokens are replenished at a constant rate
4. **Request Blocking**: Requests are blocked when no tokens are available

### Implementation Details

```typescript
interface RateLimitConfig {
  maxTokens: number; // Maximum tokens in bucket
  refillRate: number; // Tokens added per second
  windowMs: number; // Time window in milliseconds
  identifier: string; // User ID or IP address
}

// Example configurations
const rateLimits = {
  authenticated: {
    maxTokens: 1000,
    refillRate: 0.28, // ~1000 tokens per hour
    windowMs: 3600000, // 1 hour
  },
  unauthenticated: {
    maxTokens: 100,
    refillRate: 0.028, // ~100 tokens per hour
    windowMs: 3600000, // 1 hour
  },
  premium: {
    maxTokens: 5000,
    refillRate: 1.39, // ~5000 tokens per hour
    windowMs: 3600000, // 1 hour
  },
};
```

## Rate Limits by Endpoint

### Authentication Endpoints

| Endpoint             | Method | Authenticated | Unauthenticated | Window     |
| -------------------- | ------ | ------------- | --------------- | ---------- |
| `/api/auth/login`    | POST   | 10 requests   | 5 requests      | 15 minutes |
| `/api/auth/register` | POST   | N/A           | 3 requests      | 15 minutes |
| `/api/auth/refresh`  | POST   | 20 requests   | N/A             | 15 minutes |
| `/api/auth/logout`   | POST   | 10 requests   | N/A             | 15 minutes |

### Learning Content Endpoints

| Endpoint                     | Method | Student      | Coach         | Admin         | Window |
| ---------------------------- | ------ | ------------ | ------------- | ------------- | ------ |
| `/api/learning/stories`      | GET    | 500 requests | 1000 requests | 2000 requests | 1 hour |
| `/api/learning/stories/{id}` | GET    | 200 requests | 500 requests  | 1000 requests | 1 hour |
| `/api/learning/exercises/*`  | GET    | 300 requests | 600 requests  | 1200 requests | 1 hour |
| `/api/learning/progress/*`   | GET    | 200 requests | 400 requests  | 800 requests  | 1 hour |

### Progress and Analytics Endpoints

| Endpoint                           | Method | Student      | Coach        | Admin        | Window |
| ---------------------------------- | ------ | ------------ | ------------ | ------------ | ------ |
| `/api/learning/progress/update`    | POST   | 100 requests | 200 requests | 400 requests | 1 hour |
| `/api/learning/exercises/submit`   | POST   | 200 requests | 400 requests | 800 requests | 1 hour |
| `/api/learning/progress/analytics` | GET    | 50 requests  | 100 requests | 200 requests | 1 hour |

### Administrative Endpoints

| Endpoint             | Method   | Coach       | Admin        | Window |
| -------------------- | -------- | ----------- | ------------ | ------ |
| `/api/admin/users`   | GET      | 50 requests | 200 requests | 1 hour |
| `/api/admin/stories` | POST/PUT | 20 requests | 100 requests | 1 hour |
| `/api/admin/lessons` | POST/PUT | 30 requests | 150 requests | 1 hour |

## Rate Limit Headers

### Response Headers

All API responses include rate limiting information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
X-RateLimit-Window: 3600
X-RateLimit-Policy: token-bucket
Content-Type: application/json
```

**Header Descriptions:**

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `X-RateLimit-Window`: Time window in seconds
- `X-RateLimit-Policy`: Rate limiting algorithm used

### Rate Limit Exceeded Response

When rate limit is exceeded, the API returns a 429 status code:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642694400
X-RateLimit-Window: 3600
Retry-After: 3600
Content-Type: application/json

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 1000,
    "window": "1 hour",
    "retryAfter": 3600,
    "policy": "token-bucket"
  },
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/learning/stories"
}
```

## Client-Side Rate Limit Handling

### Basic Rate Limit Detection

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.rateLimitInfo = new Map();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Check if we're rate limited
    if (this.isRateLimited(endpoint)) {
      const resetTime = this.rateLimitInfo.get(endpoint).reset;
      const waitTime = resetTime - Date.now();
      throw new RateLimitError(`Rate limited. Retry after ${waitTime}ms`);
    }

    const response = await fetch(url, options);

    // Update rate limit info from headers
    this.updateRateLimitInfo(endpoint, response.headers);

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitError(
        `Rate limited. Retry after ${retryAfter} seconds`
      );
    }

    return response;
  }

  updateRateLimitInfo(endpoint, headers) {
    const limit = parseInt(headers.get("X-RateLimit-Limit"));
    const remaining = parseInt(headers.get("X-RateLimit-Remaining"));
    const reset = parseInt(headers.get("X-RateLimit-Reset")) * 1000;

    this.rateLimitInfo.set(endpoint, { limit, remaining, reset });
  }

  isRateLimited(endpoint) {
    const info = this.rateLimitInfo.get(endpoint);
    return info && info.remaining === 0 && Date.now() < info.reset;
  }
}
```

### Exponential Backoff Implementation

```javascript
class RateLimitHandler {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async executeWithBackoff(requestFn) {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.status === 429 && attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt, error.retryAfter);
          console.log(
            `Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1})`
          );
          await this.sleep(delay);
          attempt++;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Max retries (${this.maxRetries}) exceeded`);
  }

  calculateDelay(attempt, retryAfter) {
    if (retryAfter) {
      // Use server-provided retry-after header
      return retryAfter * 1000;
    }

    // Exponential backoff: baseDelay * 2^attempt + jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    return exponentialDelay + jitter;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Usage example
const rateLimitHandler = new RateLimitHandler();
const apiClient = new ApiClient("https://api.edtech-platform.com");

async function fetchStories() {
  return rateLimitHandler.executeWithBackoff(async () => {
    const response = await apiClient.makeRequest("/api/learning/stories");
    return response.json();
  });
}
```

### Request Queue Implementation

```javascript
class RequestQueue {
  constructor(maxConcurrent = 5, delayBetweenRequests = 100) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequests = delayBetweenRequests;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn,
        resolve,
        reject,
      });

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

      // Add delay between requests to respect rate limits
      setTimeout(() => {
        this.processQueue();
      }, this.delayBetweenRequests);
    }
  }
}

// Usage example
const requestQueue = new RequestQueue(3, 200); // Max 3 concurrent, 200ms delay

async function fetchMultipleStories(storyIds) {
  const promises = storyIds.map((id) =>
    requestQueue.add(() =>
      fetch(`/api/learning/stories/${id}`).then((response) => response.json())
    )
  );

  return Promise.all(promises);
}
```

## Best Practices

### 1. Implement Client-Side Rate Limiting

```javascript
class ClientRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => time > windowStart);

    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  async waitForAvailability() {
    if (this.canMakeRequest()) {
      this.recordRequest();
      return;
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = Math.min(...this.requests);
    const waitTime = oldestRequest + this.windowMs - Date.now();

    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return this.waitForAvailability();
  }
}
```

### 2. Cache Responses Aggressively

```javascript
class CachedApiClient {
  constructor(baseURL, cacheTTL = 300000) {
    // 5 minutes default
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  async get(endpoint, options = {}) {
    const cacheKey = this.getCacheKey(endpoint, options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`Cache hit for ${endpoint}`);
      return cached.data;
    }

    console.log(`Cache miss for ${endpoint}, making API request`);
    const response = await fetch(`${this.baseURL}${endpoint}`, options);
    const data = await response.json();

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  getCacheKey(endpoint, options) {
    return `${endpoint}:${JSON.stringify(options)}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 3. Batch Requests When Possible

```javascript
class BatchRequestManager {
  constructor(batchSize = 10, batchDelay = 100) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.pendingRequests = [];
    this.batchTimeout = null;
  }

  async batchRequest(endpoint, id) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ endpoint, id, resolve, reject });

      if (this.pendingRequests.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    });
  }

  async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const batch = this.pendingRequests.splice(0, this.batchSize);

    if (batch.length === 0) return;

    try {
      // Group requests by endpoint
      const groupedRequests = batch.reduce((groups, request) => {
        if (!groups[request.endpoint]) {
          groups[request.endpoint] = [];
        }
        groups[request.endpoint].push(request);
        return groups;
      }, {});

      // Process each group
      for (const [endpoint, requests] of Object.entries(groupedRequests)) {
        const ids = requests.map((r) => r.id);
        const batchEndpoint = `${endpoint}?ids=${ids.join(",")}`;

        try {
          const response = await fetch(batchEndpoint);
          const data = await response.json();

          // Resolve individual requests
          requests.forEach((request, index) => {
            request.resolve(data[index]);
          });
        } catch (error) {
          requests.forEach((request) => request.reject(error));
        }
      }
    } catch (error) {
      batch.forEach((request) => request.reject(error));
    }
  }
}
```

### 4. Monitor Rate Limit Usage

```javascript
class RateLimitMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      rateLimitedRequests: 0,
      averageRemainingTokens: 0,
      lastReset: null,
    };
  }

  recordRequest(headers) {
    this.metrics.totalRequests++;

    const remaining = parseInt(headers.get("X-RateLimit-Remaining"));
    const reset = parseInt(headers.get("X-RateLimit-Reset"));

    if (remaining !== undefined) {
      this.metrics.averageRemainingTokens =
        (this.metrics.averageRemainingTokens + remaining) / 2;
    }

    if (reset) {
      this.metrics.lastReset = new Date(reset * 1000);
    }
  }

  recordRateLimit() {
    this.metrics.rateLimitedRequests++;
  }

  getUsageReport() {
    const rateLimitRate =
      this.metrics.rateLimitedRequests / this.metrics.totalRequests;

    return {
      ...this.metrics,
      rateLimitRate: rateLimitRate * 100, // percentage
      efficiency: (1 - rateLimitRate) * 100, // percentage
    };
  }

  shouldAlertOnUsage() {
    const report = this.getUsageReport();
    return report.rateLimitRate > 5 || report.averageRemainingTokens < 100;
  }
}
```

## Rate Limit Optimization Strategies

### 1. Request Prioritization

```javascript
class PriorityRequestQueue {
  constructor() {
    this.queues = {
      high: [],
      medium: [],
      low: [],
    };
  }

  add(requestFn, priority = "medium") {
    return new Promise((resolve, reject) => {
      this.queues[priority].push({ requestFn, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    // Process high priority first, then medium, then low
    for (const priority of ["high", "medium", "low"]) {
      if (this.queues[priority].length > 0) {
        const { requestFn, resolve, reject } = this.queues[priority].shift();

        requestFn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            setTimeout(() => this.processNext(), 100);
          });

        return;
      }
    }
  }
}
```

### 2. Adaptive Rate Limiting

```javascript
class AdaptiveRateLimiter {
  constructor() {
    this.successRate = 1.0;
    this.requestDelay = 100;
    this.minDelay = 50;
    this.maxDelay = 5000;
  }

  async makeRequest(requestFn) {
    await this.sleep(this.requestDelay);

    try {
      const result = await requestFn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (error.status === 429) {
        this.onRateLimit();
      }
      throw error;
    }
  }

  onSuccess() {
    this.successRate = Math.min(1.0, this.successRate + 0.01);
    this.requestDelay = Math.max(this.minDelay, this.requestDelay * 0.95);
  }

  onRateLimit() {
    this.successRate = Math.max(0.0, this.successRate - 0.1);
    this.requestDelay = Math.min(this.maxDelay, this.requestDelay * 2);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

## Monitoring and Alerting

### Rate Limit Metrics

Track these metrics to monitor rate limit health:

1. **Request Volume**: Total requests per time period
2. **Rate Limit Hit Rate**: Percentage of requests that hit rate limits
3. **Average Response Time**: Including rate limit delays
4. **Token Utilization**: How efficiently tokens are being used
5. **Error Rate**: Percentage of requests that fail due to rate limiting

### Alerting Thresholds

Set up alerts for:

- Rate limit hit rate > 5%
- Average remaining tokens < 10% of limit
- Consecutive rate limit errors > 10
- Response time degradation due to rate limiting

### Dashboard Metrics

```javascript
class RateLimitDashboard {
  constructor() {
    this.metrics = {
      requestsPerMinute: [],
      rateLimitHits: [],
      averageTokensRemaining: [],
      responseTimeImpact: [],
    };
  }

  recordMetrics(rateLimitInfo) {
    const now = Date.now();

    this.metrics.requestsPerMinute.push({
      timestamp: now,
      count: rateLimitInfo.requestCount,
    });

    this.metrics.rateLimitHits.push({
      timestamp: now,
      hits: rateLimitInfo.rateLimitHits,
    });

    this.metrics.averageTokensRemaining.push({
      timestamp: now,
      tokens: rateLimitInfo.averageRemaining,
    });

    // Keep only last hour of data
    const oneHourAgo = now - 3600000;
    Object.keys(this.metrics).forEach((key) => {
      this.metrics[key] = this.metrics[key].filter(
        (item) => item.timestamp > oneHourAgo
      );
    });
  }

  generateReport() {
    return {
      currentRPM: this.getCurrentRPM(),
      rateLimitHitRate: this.getRateLimitHitRate(),
      tokenEfficiency: this.getTokenEfficiency(),
      recommendations: this.getRecommendations(),
    };
  }

  getCurrentRPM() {
    const lastMinute = this.metrics.requestsPerMinute.filter(
      (item) => item.timestamp > Date.now() - 60000
    );

    return lastMinute.reduce((sum, item) => sum + item.count, 0);
  }

  getRateLimitHitRate() {
    const totalRequests = this.metrics.requestsPerMinute.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const totalHits = this.metrics.rateLimitHits.reduce(
      (sum, item) => sum + item.hits,
      0
    );

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  getTokenEfficiency() {
    const avgTokens = this.metrics.averageTokensRemaining;
    if (avgTokens.length === 0) return 0;

    const sum = avgTokens.reduce((sum, item) => sum + item.tokens, 0);
    return sum / avgTokens.length;
  }

  getRecommendations() {
    const recommendations = [];

    if (this.getRateLimitHitRate() > 5) {
      recommendations.push("Consider implementing request batching");
      recommendations.push("Add client-side rate limiting");
    }

    if (this.getTokenEfficiency() < 100) {
      recommendations.push("Implement response caching");
      recommendations.push("Optimize request patterns");
    }

    return recommendations;
  }
}
```

---

This comprehensive rate limiting guide provides all the tools and strategies needed to effectively handle API rate limits while maintaining optimal performance and user experience.
