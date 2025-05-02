// service-worker.js
self.addEventListener("install", function (event) {
  // Perform install steps
  event.waitUntil(
    caches.open("v1").then(function (cache) {
      console.log("Service worker installed");
      return cache.addAll([
        "/", // Add your important static files here
        "/index.html",
        "/script.js",
        "/style.css",
      ]);
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("Service worker activated");
});

// Handle fetch events for the proxy
self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Check if this is a request to our proxy endpoint
  if (url.pathname === "/proxy-to-gas") {
    event.respondWith(handleProxyRequest(event.request));
    return;
  }

  // For all other requests, use normal fetch behavior
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

// Function to handle our proxy requests
async function handleProxyRequest(request) {
  try {
    // Get the URL to proxy to from the search parameters
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: "No target URL specified",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward the request to the Google Apps Script
    let fetchOptions = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Include the body for non-GET requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = await request.clone().text();
    }

    // Fetch from the target URL
    const response = await fetch(targetUrl, fetchOptions);

    // Get the response data
    const data = await response.text();

    // Return the data with proper CORS headers
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
