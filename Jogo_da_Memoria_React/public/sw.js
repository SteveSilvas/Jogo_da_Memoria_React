// Service worker mínimo: deixa o jogo jogável offline depois do primeiro acesso.
// Na instalação ele pré-carrega todos os arquivos listados em precache-manifest.json
// (gerado no build pelo Vite). Navegações vão à rede primeiro e caem no cache.
const CACHE = "jogo-da-memoria-v1";
const MANIFEST = new URL("precache-manifest.json", self.registration.scope).href;

const precache = async () => {
    const response = await fetch(MANIFEST, { cache: "no-store" });
    if (!response.ok) throw new Error(`manifest ${response.status}`);

    const files = await response.json();
    const cache = await caches.open(CACHE);
    await cache.addAll(files.map((file) => new URL(file, self.registration.scope).href));
};

const fromCacheFirst = async (request) => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
};

const fromNetworkFirst = async (request) => {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (error) {
        const index = new URL("index.html", self.registration.scope).href;
        const cached = (await cache.match(request)) ?? (await cache.match(index));
        if (cached) return cached;
        throw error;
    }
};

self.addEventListener("install", (event) => {
    event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(fromNetworkFirst(request));
        return;
    }

    event.respondWith(fromCacheFirst(request));
});
