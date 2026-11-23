/* Bharat Stocks service worker.
   Caches only the app shell; live market requests remain network-only.
   User data remains in this browser's existing localStorage/IndexedDB. */
const CACHE_NAME = "bharat-stocks-shell-v1";
const APP_SHELL = ["./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("bharat-stocks-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request=event.request, url=new URL(request.url);
  if(request.method!=="GET" || url.origin!==self.location.origin) return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then((response)=>{
      if(response && response.ok){const copy=response.clone();caches.open(CACHE_NAME).then((cache)=>cache.put("./index.html",copy));}
      return response;
    }).catch(async()=>{const cache=await caches.open(CACHE_NAME);return (await cache.match("./index.html"))||Response.error();}));
    return;
  }
  const asset=url.pathname.endsWith("/manifest.webmanifest") || /\/icons\/icon-(192|512)\.png$/.test(url.pathname) || url.pathname.endsWith("/index.html");
  if(asset) event.respondWith(caches.match(request).then((cached)=>cached||fetch(request)));
});
