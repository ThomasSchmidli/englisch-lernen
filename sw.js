/* Offline-Betrieb: eigene Dateien zuerst aus dem Netz (damit Updates sofort ankommen),
   ohne Internet aus dem Zwischenspeicher. */
const CACHE='englisch-lernen-v15';
const LIBS='englisch-lernen-libs'; // Spracherkennung von cdn.jsdelivr.net (feste Version)
const FILES=['./','index.html','css/style.css','js/data.js','js/logic.js','js/app.js','manifest.webmanifest',
  'icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon.png',
  'fonts/baloo2-latin.woff2'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  // nur eigene alte Versionen löschen (das Sprachmodell liegt im Zwischenspeicher «transformers-cache»)
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('englisch-lernen-v')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // no-cache: immer beim Server nachfragen, sonst liefert der Browser bis zu 10 min alte Dateien
    e.respondWith(fetch(req,{cache:'no-cache'}).then(res=>{
      if(res.ok){const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./'))));
  }else if(url.hostname==='cdn.jsdelivr.net'){
    e.respondWith(caches.open(LIBS).then(c=>c.match(req).then(r=>r||fetch(req).then(res=>{
      if(res.ok) c.put(req,res.clone());
      return res;
    }))));
  }
});
