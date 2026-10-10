/* Offline-Betrieb: eigene Dateien zuerst aus dem Netz (damit Updates sofort ankommen),
   ohne Internet aus dem Zwischenspeicher. Schriften werden einmal geladen und behalten. */
const CACHE='englisch-lernen-v2';
const FILES=['./','index.html','css/style.css','js/data.js','js/app.js','manifest.webmanifest',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return res;
    })));
  }
});
