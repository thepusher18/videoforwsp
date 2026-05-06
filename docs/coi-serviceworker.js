/* coi-serviceworker v0.1.7 - github.com/gzuidhof/coi-serviceworker */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

async function handleFetch(event) {
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
    return;
  }
  let response;
  try {
    response = await fetch(event.request);
  } catch {
    return Response.error();
  }
  if (response.status === 0) return response;

  const newHeaders = new Headers(response.headers);
  newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
  newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

self.addEventListener("fetch", (e) => e.respondWith(handleFetch(e)));
