const CACHE_NAME='demax-a1-lesen-v1';
const FILES=['./DE-MAX_A1_LESEN_APP.html','./DE-MAX_A1_LESEN_DATA.js','./DE-MAX_A1_LESEN.webmanifest','./DE-MAX_A1_LESEN_icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('demax-a1-lesen-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
if(event.request.method!=='GET'||!FILES.some(f=>event.request.url.endsWith(f.slice(2))))return;
event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)));
});