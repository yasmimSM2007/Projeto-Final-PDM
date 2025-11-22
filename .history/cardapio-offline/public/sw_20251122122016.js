// public/sw.js

// Carrega Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('workbox carregado');

  // ---- ARQUIVOS QUE FICAM DISPONÍVEIS OFFLINE (PRECACHE) ----
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: null },
    { url: '/index.html', revision: null },
    { url: '/offline.html', revision: null },
    { url: '/cardapio-offline/CSS/style.css', revision: null },
    { url: '/cardapio-offline/images/icon-128.png', revision: null },
    { url: '/cardapio-offline/images/icon-256.png', revision: null }
  ]);

  // HTML: rede primeiro, se não tiver, usa cache
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
    })
  );

  // CSS / imagens / scripts: CacheFirst (ótimo pra offline)
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'script',
    new workbox.strategies.CacheFirst({
      cacheName: 'static-cache',
    })
  );

  // Fallback: se estiver offline e não achar a página, mostra offline.html
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return Response.error();
  })
} else {
  console.log('workbox não carregou');
}
