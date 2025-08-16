// Service Worker for offline story caching
const CACHE_NAME = "learning-stories-v1";
const AUDIO_CACHE_NAME = "learning-audio-v1";
const API_CACHE_NAME = "learning-api-v1";

// Maximum cache sizes (in bytes)
const MAX_STORY_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_API_CACHE_SIZE = 10 * 1024 * 1024; // 10MB

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/learning",
        "/learning/offline",
        // Add other essential static resources
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== AUDIO_CACHE_NAME &&
            cacheName !== API_CACHE_NAME
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle offline requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/learning/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle audio files
  if (url.pathname.includes("/audio/") || request.destination === "audio") {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  // Handle story content
  if (url.pathname.startsWith("/learning")) {
    event.respondWith(handleStoryRequest(request));
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Add offline indicator to response headers
      const response = cachedResponse.clone();
      response.headers.set("X-Served-From", "cache");
      return response;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "Content not available offline",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle audio requests with cache-first strategy
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Check cache size before adding
      const cacheSize = await getCacheSize(AUDIO_CACHE_NAME);

      if (cacheSize < MAX_AUDIO_CACHE_SIZE) {
        cache.put(request, networkResponse.clone());
      } else {
        // Clean up old audio files
        await cleanupCache(AUDIO_CACHE_NAME, MAX_AUDIO_CACHE_SIZE * 0.8);
        cache.put(request, networkResponse.clone());
      }
    }

    return networkResponse;
  } catch (error) {
    return new Response("Audio not available offline", { status: 404 });
  }
}

// Handle story requests with stale-while-revalidate strategy
async function handleStoryRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {
        // Network failed, but we have cached version
      });

    return cachedResponse;
  }

  // No cached version, try network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    return new Response("Page not available offline", { status: 404 });
  }
}

// Get cache size in bytes
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let totalSize = 0;

  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }

  return totalSize;
}

// Clean up cache when it exceeds size limit
async function cleanupCache(cacheName, targetSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  // Sort by last accessed (oldest first)
  const keysSorted = keys.sort((a, b) => {
    // Simple heuristic: sort by URL (could be improved with actual access time)
    return a.url.localeCompare(b.url);
  });

  let currentSize = await getCacheSize(cacheName);

  for (const key of keysSorted) {
    if (currentSize <= targetSize) break;

    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      currentSize -= blob.size;
      await cache.delete(key);
    }
  }
}

// Message handling for cache management
self.addEventListener("message", (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "CACHE_STORY":
      cacheStory(data)
        .then(() => {
          event.ports[0].postMessage({ data: { success: true } });
        })
        .catch((error) => {
          event.ports[0].postMessage({ error: error.message });
        });
      break;

    case "CACHE_AUDIO":
      cacheAudio(data)
        .then(() => {
          event.ports[0].postMessage({ data: { success: true } });
        })
        .catch((error) => {
          event.ports[0].postMessage({ error: error.message });
        });
      break;

    case "GET_CACHE_STATUS":
      getCacheStatus().then((status) => {
        event.ports[0].postMessage({ data: status });
      });
      break;

    case "CLEAR_CACHE":
      clearCache(data.cacheType).then(() => {
        event.ports[0].postMessage({ data: { success: true } });
      });
      break;
  }
});

// Cache a story and its associated data
async function cacheStory(storyData) {
  const cache = await caches.open(CACHE_NAME);
  const apiCache = await caches.open(API_CACHE_NAME);

  // Cache story API response
  const storyUrl = `/api/learning/stories/${storyData.id}`;
  const storyResponse = new Response(JSON.stringify(storyData), {
    headers: { "Content-Type": "application/json" },
  });

  await apiCache.put(storyUrl, storyResponse);

  // Cache vocabulary data for embedded words
  if (storyData.vocabularies) {
    for (const vocab of storyData.vocabularies) {
      const vocabUrl = `/api/learning/vocabulary/${vocab.word}`;
      const vocabResponse = new Response(JSON.stringify(vocab), {
        headers: { "Content-Type": "application/json" },
      });

      await apiCache.put(vocabUrl, vocabResponse);
    }
  }
}

// Cache audio file
async function cacheAudio(audioData) {
  const cache = await caches.open(AUDIO_CACHE_NAME);

  try {
    const response = await fetch(audioData.url);
    if (response.ok) {
      await cache.put(audioData.url, response);
    }
  } catch (error) {
    throw new Error(`Failed to cache audio: ${error.message}`);
  }
}

// Get cache status information
async function getCacheStatus() {
  const storyCacheSize = await getCacheSize(CACHE_NAME);
  const audioCacheSize = await getCacheSize(AUDIO_CACHE_NAME);
  const apiCacheSize = await getCacheSize(API_CACHE_NAME);

  const storyCache = await caches.open(CACHE_NAME);
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  const apiCache = await caches.open(API_CACHE_NAME);

  const storyKeys = await storyCache.keys();
  const audioKeys = await audioCache.keys();
  const apiKeys = await apiCache.keys();

  return {
    totalSize: storyCacheSize + audioCacheSize + apiCacheSize,
    storyCacheSize,
    audioCacheSize,
    apiCacheSize,
    cachedStories: storyKeys.length,
    cachedAudioFiles: audioKeys.length,
    cachedApiResponses: apiKeys.length,
    maxSizes: {
      story: MAX_STORY_CACHE_SIZE,
      audio: MAX_AUDIO_CACHE_SIZE,
      api: MAX_API_CACHE_SIZE,
    },
  };
}

// Clear specific cache type
async function clearCache(cacheType) {
  switch (cacheType) {
    case "stories":
      await caches.delete(CACHE_NAME);
      await caches.open(CACHE_NAME);
      break;
    case "audio":
      await caches.delete(AUDIO_CACHE_NAME);
      await caches.open(AUDIO_CACHE_NAME);
      break;
    case "api":
      await caches.delete(API_CACHE_NAME);
      await caches.open(API_CACHE_NAME);
      break;
    case "all":
      await caches.delete(CACHE_NAME);
      await caches.delete(AUDIO_CACHE_NAME);
      await caches.delete(API_CACHE_NAME);
      await caches.open(CACHE_NAME);
      await caches.open(AUDIO_CACHE_NAME);
      await caches.open(API_CACHE_NAME);
      break;
  }
}
