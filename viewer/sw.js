// Service worker du viewer : l'appli marche hors-ligne une fois la carte ouverte en ligne.
// - coquille (HTML, polices, icônes) : pré-cachée, réseau d'abord pour toujours servir la dernière version ;
// - board.json et boards/index.json (catalogue) : réseau d'abord, copie en cache si le réseau ne répond pas (établi sans wifi) ;
// - images de carte, demandées avec ?v=<version du build> : cache d'abord, elles ne changent jamais pour une version.
// Le cache des cartes (BOARDS) est aussi rempli par la page, voir keepOffline() dans index.html.
importScripts('version.js'); // version de l'outil : une nouvelle version change ce fichier, donc met à jour le service worker
const SHELL = 'pcbnet-shell-' + self.PCBNET_VERSION.version, BOARDS = 'pcbnet-boards', TIMEOUT = 4000;
const SHELL_FILES = ['./', 'index.html', 'version.js', 'manifest.webmanifest',
  'fonts/plex-mono-400.woff2', 'fonts/plex-mono-500.woff2',
  'fonts/plex-sans-cond-400.woff2', 'fonts/plex-sans-cond-500.woff2', 'fonts/plex-sans-cond-600.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('pcbnet-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.searchParams.has('check')) return; // contrôle des fichiers (« Vérifier sur le serveur ») : réseau seul, rien en cache
  if (url.searchParams.has('v')) e.respondWith(cacheFirst(req, BOARDS));
  else if (url.pathname.endsWith('/board.json') || url.pathname.endsWith('/boards/index.json'))
    e.respondWith(networkFirst(req, BOARDS, url.href)); // description d'une carte, catalogue des cartes
  else e.respondWith(networkFirst(req, SHELL, url.origin + url.pathname)); // ?board=… ne compte pas pour la coquille
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req, name, key) {
  const cache = await caches.open(name);
  const net = fetch(req).then(res => { if (res.ok) cache.put(key, res.clone()); return res; });
  try {
    return await Promise.race([net, new Promise((_, ko) => setTimeout(ko, TIMEOUT))]);
  } catch (err) { // réseau en échec ou trop lent : copie locale, sinon on attend quand même le réseau
    return (await cache.match(key, { ignoreSearch: true })) || net;
  }
}
