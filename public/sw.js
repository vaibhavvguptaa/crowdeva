// Empty service worker to prevent 404 errors
// This file exists only to satisfy requests for /sw.js
// No actual service worker functionality is implemented

// Log when the service worker is accessed (for debugging purposes)
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  // Do nothing - just prevent the 404 error
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Do nothing
});

self.addEventListener('fetch', (event) => {
  // Log requests for debugging
  if (event.request.url.includes('/sw.js')) {
    console.log('Service worker fetch event for /sw.js');
  }
  // Do nothing - let the browser handle fetches normally
});