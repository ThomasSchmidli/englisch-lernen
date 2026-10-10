/* Prüft Inhalte und Offline-Dateiliste. Aufruf: node scripts/check.js */
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=path.join(__dirname,'..');
const errors=[], err=m=>errors.push(m);

const ctx={}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+'\nthis.THEMES=THEMES; this.LEVELS=LEVELS;',ctx);
const THEMES=ctx.THEMES, LEVELS=ctx.LEVELS;

const ids=new Set();
for(const t of THEMES){
  const where=`Thema «${t.id}»`;
  if(!t.id||ids.has(t.id)) err(`${where}: id fehlt oder ist doppelt`); ids.add(t.id);
  if(!['words','sentences'].includes(t.kind)) err(`${where}: kind muss 'words' oder 'sentences' sein`);
  for(const k of ['name','icon','color']) if(!t[k]) err(`${where}: ${k} fehlt`);
  if(!LEVELS.some(l=>l.n===t.level)) err(`${where}: level fehlt oder ist unbekannt`);
  if(!Array.isArray(t.items)||t.items.length<6){err(`${where}: braucht mindestens 6 Einträge (Memory)`); continue;}
  const ens=new Set(), looks=new Set();
  for(const it of t.items){
    const w=`${where}, «${it.en}»`;
    if(!it.en||!it.de) err(`${w}: en oder de fehlt`);
    if(ens.has(it.en)) err(`${w}: doppelt`); ens.add(it.en);
    if(/ß/.test(it.de||'')) err(`${w}: «ß» statt «ss»`);
    const look=it.e??it.c??it.n??it.t;
    if(look===undefined) err(`${w}: Bild fehlt (e, c, n oder t)`);
    else if(looks.has(look)) err(`${w}: gleiches Bild wie ein anderer Eintrag, im Quiz nicht unterscheidbar`);
    looks.add(look);
    if(t.kind==='sentences'&&!it.s) err(`${w}: Satz-Thema braucht S(…)`);
    if(t.kind==='words'&&it.s) err(`${w}: Wort-Thema braucht W(…)`);
  }
}

const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const files=(sw.match(/const FILES=\[([\s\S]*?)\];/)||[])[1]||'';
for(const f of files.match(/'[^']+'/g)||[]){
  const p=f.slice(1,-1); if(p==='./') continue;
  if(!fs.existsSync(path.join(root,p))) err(`sw.js: Datei «${p}» aus FILES gibt es nicht`);
}

if(errors.length){console.error(errors.map(e=>'✗ '+e).join('\n')); process.exit(1);}
const n=THEMES.reduce((a,t)=>a+t.items.length,0);
console.log(`✓ ${THEMES.length} Themen, ${n} Einträge, alles in Ordnung`);
