importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

// arquivos principais que serão pré-cacheados
workbox.precaching.precacheAndRoute([
  { url: "/index.html", revision: "1" },
  { url: "/offline.html", revision: "1" },
  { url: "/cardapio-offline/CSS/style.css", revision: "1" },
  { url: "/cardapio-offline/js/main.js", revision: "1" },
  { url: "/manifest.json", revision: "1" }
]);

// páginas: tenta rede primeiro, cai pro cache, depois offline.html
workbox.routing.registerRoute(
  ({ request }) => request.destination === "document",
  new workbox.strategies.NetworkFirst({
    cacheName: "pages-cache"
  })
);

// assets estáticos (imagens, css extra, etc): CacheFirst
workbox.routing.registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "image",
  new workbox.strategies.CacheFirst({
    cacheName: "static-cache"
  })
);

// fallback offline
workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    return caches.match("/offline.html");
  }
  return Response.error();
});
