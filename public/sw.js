// Service worker maison (pas de dépendance). Bump la version pour invalider le cache.
// ponytail: cache simple network-first pour la navigation, stale-while-revalidate pour les assets.
const CACHE = "smotu-v1";
const SHELL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // On ne touche qu'au GET same-origin, jamais l'API.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation: réseau d'abord, repli sur l'app shell en cache (offline).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(SHELL).then((hit) => hit ?? Response.error())),
    );
    return;
  }

  // Assets (build hashé): sert le cache, met à jour en arrière-plan.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
