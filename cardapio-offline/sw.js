// Importa Workbox da CDN
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

// Arquivos principais pré-cacheados
workbox.precaching.precacheAndRoute([
  { url: "/index.html", revision: "1" },
  { url: "/offline.html", revision: "1" },
  { url: "/cardapio-offline/CSS/style.css", revision: "1" },
  { url: "/cardapio-offline/js/main.js", revision: "1" },
  { url: "/manifest.json", revision: "1" }
]);

// Páginas: tenta rede primeiro, se não conseguir usa cache
workbox.routing.registerRoute(
  ({ request }) => request.destination === "document",
  new workbox.strategies.NetworkFirst({
    cacheName: "pages-cache"
  })
);

// CSS e imagens: CacheFirst
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "image",
  new workbox.strategies.CacheFirst({
    cacheName: "static-cache"
  })
);

// Fallback offline para páginas
workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    return caches.match("/offline.html");
  }
  return Response.error();
});
