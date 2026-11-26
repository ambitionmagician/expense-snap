'use strict';

const BASE = self.registration.scope;
const PREFIX = 'expense-snap:' + BASE + ':shell:';
const CACHE = PREFIX + 'v1';
const INDEX = new URL('index.html', BASE).href;
const MANIFEST = new URL('manifest.json', BASE).href;
const SHELL = [INDEX, MANIFEST];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.search = '';
  url.hash = '';
  const key = req.mode === 'navigate' && url.href === BASE ? INDEX : url.href;
  if (!SHELL.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(key);
    if (hit) return hit;
    const response = await fetch(key);
    if (response.ok) await cache.put(key, response.clone());
    return
