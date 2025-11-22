importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('workbox carregado');

  workbox.precaching.precacheAndRoute([
    { url: '/', revision: null },
    { url: '/index.html', revision: null },
    { url: '/offline.html', revision: null },
    { url: '/cardapio-offline/images/icon-128.png', revision: null },
    { url: '/cardapio-offline/images/icon-256.png', revision: null }
  ]);

  // ===== PAGE CACHE (document) - NetworkFirst =====
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document' || request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3, // tenta a rede por até 3s antes de usar cache
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ===== ASSETS (css, js) - StaleWhileRevalidate =====
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'asset-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ===== IMAGES - CacheFirst com expiração =====
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ===== FALLBACK (quando não há resposta em cache nem na rede) =====
  workbox.routing.setCatchHandler(async ({ event }) => {
    // Se for navegação (document) retornamos offline.html
    if (event.request.destination === 'document' || event.request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    // Para imagens, podemos retornar um placeholder (opcional)
    if (event.request.destination === 'image') {
      // se você tiver uma imagem placeholder em public, retorne-a:
      return caches.match('/cardapio-offline/images/icon-128.png');
    }

    return Response.error();
  });

} else {
  console.log('workbox não carregou');
}
