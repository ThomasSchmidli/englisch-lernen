/* Kleiner Webserver für lokale Tests (ohne Pakete). Aufruf: node scripts/serve.js [port]
   python3 -m http.server bricht bei vielen gleichzeitigen Verbindungen ab, darum dieser Server für Playwright. */
const http=require('http'), fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..'), port=+process.argv[2]||8000;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml',
  '.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.wav':'audio/wav'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);
  if(p.endsWith('/')) p+='index.html';
  const f=path.join(root,p);
  if(!f.startsWith(root+path.sep)){res.writeHead(403); return res.end();}
  fs.readFile(f,(err,buf)=>{
    if(err){res.writeHead(404); return res.end('Nicht gefunden');}
    res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(buf);
  });
}).listen(port,()=>console.log(`http://localhost:${port}`));
