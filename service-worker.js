// service-worker.js - Replace your current service worker with this
// Log when the service worker runs
console.log('Service Worker script is being evaluated');

self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing....');
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      console.log('Service Worker: Caching Files');
      return cache.addAll([
        '/',
        '/index.html',
        '/script.js',
        '/style.css'
      ]);
    })
  );
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activated');
  // Claim control immediately, rather than waiting for reload
  event.waitUntil(self.clients.claim());
});

// Handle fetch events including our proxy endpoint
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  console.log('Service Worker: Fetching', url.pathname);
  
  // Explicit check for the proxy-to-gas path
  if (url.pathname === '/proxy-to-gas') {
    console.log('Service Worker: Handling proxy request to:', url.searchParams.get('url'));
    event.respondWith(handleProxyRequest(event.request));
    return;
  }
  
  // For all other requests, use normal fetch behavior
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Function to handle proxy requests
async function handleProxyRequest(request) {
  try {
    // Get the URL to proxy to from the search parameters
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    console.log('Service Worker: Proxying request to:', targetUrl);
    
    if (!targetUrl) {
      console.error('Service Worker: No target URL specified');
      return new Response(JSON.stringify({ 
        error: 'No target URL specified' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Forward the request to the Google Apps Script
    let fetchOptions = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Include the body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = await request.clone().text();
    }
    
    console.log('Service Worker: Making request with options:', JSON.stringify(fetchOptions));
    
    // Fetch from the target URL
    const response = await fetch(targetUrl, fetchOptions);
    console.log('Service Worker: Received response with status:', response.status);
    
    // Get the response data
    const data = await response.text();
    
    // Return the data with proper CORS headers
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Service Worker: Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
