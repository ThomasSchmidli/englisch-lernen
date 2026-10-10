/* Prüft Inhalte und Offline-Dateiliste. Aufruf: node scripts/check.js */
const fs=require('fs'), path=require('path'), vm=require('vm');
const root=path.join(__dirname,'..');
const errors=[], err=m=>errors.push(m);

const ctx={}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8')+'\nthis.THEMES=THEMES; this.LEVELS=LEVELS; this.STORIES=STORIES;',ctx);
const THEMES=ctx.THEMES, LEVELS=ctx.LEVELS, STORIES=ctx.STORIES;

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

const sids=new Set();
for(const st of STORIES){
  const where=`Geschichte «${st.id}»`;
  if(!st.id||sids.has(st.id)) err(`${where}: id fehlt oder ist doppelt`); sids.add(st.id);
  if(!LEVELS.some(l=>l.n===st.level)) err(`${where}: level fehlt oder ist unbekannt`);
  if(!st.title||!st.icon) err(`${where}: title oder icon fehlt`);
  if(!Array.isArray(st.pages)||st.pages.length<3) err(`${where}: braucht mindestens 3 Seiten`);
  for(const p of st.pages||[]) if(!p.en||!p.de||!p.e) err(`${where}: Seite ohne en, de oder Bild`);
  if(!Array.isArray(st.questions)||st.questions.length<2) err(`${where}: braucht mindestens 2 Fragen`);
  for(const q of st.questions||[]){
    if(!q.q||!q.de) err(`${where}: Frage ohne Text`);
    if(!Array.isArray(q.options)||q.options.length<2||new Set(q.options).size!==q.options.length) err(`${where}, «${q.q}»: Antworten fehlen oder sind doppelt`);
    if(!(q.a>=0&&q.a<(q.options||[]).length)) err(`${where}, «${q.q}»: richtige Antwort a ungültig`);
  }
  if(/ß/.test(JSON.stringify(st))) err(`${where}: «ß» statt «ss»`);
}

const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const files=(sw.match(/const FILES=\[([\s\S]*?)\];/)||[])[1]||'';
for(const f of files.match(/'[^']+'/g)||[]){
  const p=f.slice(1,-1); if(p==='./') continue;
  if(!fs.existsSync(path.join(root,p))) err(`sw.js: Datei «${p}» aus FILES gibt es nicht`);
}

if(errors.length){console.error(errors.map(e=>'✗ '+e).join('\n')); process.exit(1);}
const n=THEMES.reduce((a,t)=>a+t.items.length,0);
console.log(`✓ ${THEMES.length} Themen, ${n} Einträge, ${STORIES.length} Geschichten, alles in Ordnung`);
