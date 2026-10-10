/* Logik der App: Navigation, Spiele, Sprachausgabe, Spracherkennung, Spielstand. */
/* Bei jeder Veröffentlichung erhöhen: wird unten auf der Startseite angezeigt */
const VERSION='5';
const PRAISE=['Super!','Toll!','Richtig!','Grossartig!','Genau!','Yes!'];

const KEY='englisch-lernen-v1';
/* Datum als «JJJJ-MM-TT» in Ortszeit */
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>fmt(new Date());
function addDays(s,n){const [y,m,d]=s.split('-').map(Number); return fmt(new Date(y,m-1,d+n));}

/* Spielstand: stars, known (gelernt pro Thema), srs (Wiederholung pro Eintrag), streak (Tage hintereinander) */
const fresh=()=>({stars:0,known:{},srs:{},streak:{n:0,last:''},bonus:''});
/* Gespeicherte Daten (auch ältere Formate und Sicherungen) in die aktuelle Form bringen */
function normalize(d){
  if(!d||typeof d!=='object'||typeof d.stars!=='number'||typeof (d.known||{})!=='object') return null;
  const x={stars:d.stars||0,known:d.known||{},srs:d.srs||{},streak:d.streak||{n:0,last:''},bonus:d.bonus||''};
  // Übernahme aus v1 ohne Wiederholung: Gelerntes kommt heute zum ersten Mal wieder
  for(const tid in x.known) for(const en of x.known[tid]){const k=tid+'|'+en; if(!x.srs[k]) x.srs[k]={l:1,d:today()};}
  return x;
}
let data=fresh();
try{const s=localStorage.getItem(KEY); if(s) data=normalize(JSON.parse(s))||fresh();}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function learn(tid,en){
  data.known[tid]=data.known[tid]||[]; if(!data.known[tid].includes(en)) data.known[tid].push(en);
  const k=tid+'|'+en; if(!data.srs[k]) data.srs[k]={l:1,d:addDays(today(),1)};
  save();
}
/* Wiederholung: Stufe 0–5, richtig = eine Stufe höher und später wieder, falsch = morgen wieder */
const GAP=[1,1,2,4,7,14];
function grade(tid,en,ok){
  const k=tid+'|'+en, s=data.srs[k]||{l:0,d:today()};
  if(ok){s.l=Math.min(5,s.l+1); s.d=addDays(today(),GAP[s.l]);}
  else{s.l=0; s.d=addDays(today(),1);}
  data.srs[k]=s;
  if(ok) learn(tid,en); else save();
}
function markDay(){
  const t=today(), st=data.streak; if(st.last===t) return;
  st.n=st.last===addDays(t,-1)?st.n+1:1; st.last=t; save();
}
const streakNow=()=>{const st=data.streak; return (st.last===today()||st.last===addDays(today(),-1))?st.n:0;};
function knownCount(t){const k=data.known[t.id]||[]; return t.items.filter(i=>k.includes(i.en)).length;}
function addStars(n){data.stars+=n; save(); document.querySelectorAll('.stars').forEach(s=>{s.textContent='⭐ '+data.stars; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');});}

const speechOK='speechSynthesis' in window;
let voice=null;
function pickVoice(){
  if(!speechOK) return;
  const vs=speechSynthesis.getVoices();
  voice=vs.find(v=>/^en[-_]GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;
}
if(speechOK){pickVoice(); speechSynthesis.onvoiceschanged=pickVoice;}
function speak(t){
  if(!speechOK) return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang=voice?voice.lang:'en-GB'; if(voice) u.voice=voice;
    u.rate=.8; u.pitch=1.05;
    speechSynthesis.speak(u);
  }catch(e){}
}

const app=document.getElementById('app');
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const T=id=>THEMES.find(t=>t.id===id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function vis(it,size){
  if(it.e) return `<span class="emo ${size}${it.s?' multi':''}" aria-hidden="true">${it.e}</span>`;
  if(it.c) return `<span class="swatch ${size}" style="background:${it.c}" aria-hidden="true"></span>`;
  if(it.t) return `<span class="num txt ${size}" aria-hidden="true">${it.t}</span>`;
  return `<span class="num ${size}" aria-hidden="true">${it.n}</span>`;
}
const starBadge=()=>`<span class="stars" aria-label="${data.stars} Sterne">⭐ ${data.stars}</span>`;
const streakBadge=()=>{const n=streakNow(); return n?`<span class="streak" aria-label="${n} Tage hintereinander geübt">🔥 ${n}</span>`:'';};
const topbar=(back,title)=>`<div class="top">${back?`<button class="btn small" data-go="${back}">‹ Zurück</button>`:'<span></span>'}<h2>${title||''}</h2>${starBadge()}</div>`;
const dots=(n,r)=>`<div class="dots" aria-label="Aufgabe ${r+1} von ${n}">${Array.from({length:n},(_,k)=>`<span class="${k<r?'done':k===r?'now':''}"></span>`).join('')}</div>`;

function pop(el){if(!el)return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');}
function nope(el){el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');}
function starFly(el){
  const r=el.getBoundingClientRect(); const s=document.createElement('span');
  s.className='fly'; s.textContent='⭐';
  s.style.left=(r.left+r.width/2-20)+'px'; s.style.top=(r.top+r.height/2-20)+'px';
  document.body.appendChild(s); setTimeout(()=>s.remove(),1000);
}

function tileHTML(t){
  const k=knownCount(t), n=t.items.length, unit=t.kind==='sentences'?'Sätzen':'Wörtern';
  return `<button class="btn tile" data-go="theme:${t.id}">
    <span class="icon" style="background:${t.color}">${t.icon}</span>
    <span class="tx"><span class="name">${t.name}</span>
    <span class="meta">${k} von ${n} ${unit} gelernt</span>
    <span class="bar"><span style="width:${Math.round(k/n*100)}%;background:${t.color}"></span></span></span>
  </button>`;
}

function home(){
  const words=THEMES.filter(t=>t.kind==='words'), sents=THEMES.filter(t=>t.kind==='sentences');
  const p=practiceInfo(), n=streakNow(), doneToday=data.streak.last===today();
  const pmeta=doneToday?'Heute schon geübt ✓ Du kannst gern nochmal.'
    :p.due?`${p.due} ${p.due===1?'Wort wartet':'Wörter und Sätze warten'} auf dich.`
    :'Lerne neue Wörter aus allen Themen.';
  const smsg=doneToday?(n>1?`Du übst schon ${n} Tage hintereinander. Super!`:'Heute hast du schon geübt. Bis morgen! 🔥')
    :n?`Schon ${n} ${n===1?'Tag':'Tage'} hintereinander! Übe heute, damit es weitergeht.`
    :'Übe jeden Tag ein bisschen und sammle Flammen 🔥';
  app.innerHTML=`<div class="top">${streakBadge()||'<span></span>'}${starBadge()}</div>
  <h1 class="hello">Hello! <span class="wave">👋</span></h1>
  <p class="lead">${smsg}</p>
  <button class="btn tile today" data-go="practice">
    <span class="icon" style="background:var(--sun)">⭐</span>
    <span class="tx"><span class="name">Heute üben</span><span class="meta">${pmeta}</span></span>
  </button>
  <h3 class="sec">Wörter</h3>
  <div class="list two">${words.map(tileHTML).join('')}</div>
  <h3 class="sec">Sätze</h3>
  <div class="list two">${sents.map(tileHTML).join('')}</div>
  ${speechOK?'':'<p class="note">Dieses Gerät kann leider nichts vorlesen. Öffne die App am besten in Safari oder Chrome.</p>'}
  ${standalone?'':`<p class="note small">Tipp für Eltern: ${/iPhone|iPad|Macintosh/.test(navigator.userAgent)?'In Safari auf «Teilen» und dann «Zum Home-Bildschirm» tippen.':'Im Browser-Menü «App installieren» oder «Zum Startbildschirm hinzufügen» wählen.'} Dann startet die App wie eine richtige App und läuft auch ohne Internet.</p>`}
  <button class="reset" data-go="parents">Für Eltern: Spielstand sichern, Mikrofon testen</button>
  <p class="ver">Version ${VERSION}</p>`;
}

/* Für Eltern: Rohdaten der Spracherkennung anzeigen, um Probleme auf einem Gerät zu finden */
function micTest(){
  const mt=document.getElementById('mt'), ms=document.getElementById('ms'), log=document.getElementById('mlog');
  const mc=document.getElementById('mcont'), ml=document.getElementById('mlang'), mu=document.getElementById('muse');
  mc.value=micOpts.cont?'1':'0'; ml.value=micOpts.lang;
  if(!SR){mt.disabled=true; return;}
  let rec=null, t0=0;
  const chosen=()=>({cont:mc.value==='1',lang:ml.value});
  const same=()=>chosen().cont===micOpts.cont&&chosen().lang===micOpts.lang;
  mc.onchange=ml.onchange=()=>{mu.hidden=same(); mu.textContent='Diese Einstellung in der App verwenden';};
  mu.onclick=()=>{micOpts=chosen(); micBlocked=false; try{localStorage.setItem(MICKEY,JSON.stringify(micOpts))}catch(e){} mu.textContent='Gespeichert ✓';};
  const add=m=>{log.textContent+=`\n${((Date.now()-t0)/1000).toFixed(1)} s  ${m}`; log.scrollTop=log.scrollHeight;};
  const off=()=>{mt.disabled=false; ms.disabled=true;};
  mt.onclick=()=>{
    stopListening(); if(speechOK) speechSynthesis.cancel();
    const o=chosen();
    log.textContent=`Aufnahme ${o.cont?'fortlaufend':'einzeln'}, Sprache ${o.lang||'wie Gerät'}`; t0=Date.now();
    try{
      rec=makeRec(o);
      ['start','audiostart','soundstart','speechstart','speechend','soundend','audioend','nomatch'].forEach(ev=>rec.addEventListener(ev,()=>add(ev)));
      rec.onresult=e=>{const l=e.results[e.results.length-1]; add(`Ergebnis${l.isFinal?' (fertig)':''}: «${[...l].map(a=>a.transcript).join('» / «')}»`);};
      rec.onerror=e=>{
        add('Fehler: '+e.error+(e.message?' – '+e.message:''));
        if(e.error==='aborted'&&Date.now()-t0<1000) add('→ iOS hat sofort abgebrochen. '+SERVICE_HINT);
      };
      rec.onend=()=>{add('Ende'); off(); rec=null;};
      rec.start(); add('start() aufgerufen'); mt.disabled=true; ms.disabled=false;
      const r=rec; activeListen={cancel:()=>{try{r.abort()}catch(x){}}}; // beim Verlassen der Seite beenden
    }catch(x){add('start() fehlgeschlagen: '+x.message); off();}
  };
  ms.onclick=()=>{if(rec){add('stop() aufgerufen'); try{rec.stop()}catch(x){add('stop() fehlgeschlagen: '+x.message)}}};
}

/* Für Eltern: Spielstand sichern, wiederherstellen, zurücksetzen */
function parents(msg){
  const code=btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const learned=Object.values(data.known).reduce((n,a)=>n+a.length,0);
  app.innerHTML=`${topbar('home','Für Eltern')}
  <div class="panel">
    <p>Der Spielstand (${data.stars} Sterne, ${learned} gelernte Wörter und Sätze) ist nur auf diesem Gerät gespeichert. Sichere ihn ab und zu, zum Beispiel vor einem Gerätewechsel.</p>
    ${msg?`<p class="okmsg" role="status">${msg}</p>`:''}
    <h3>Sichern</h3>
    <div class="row"><button class="btn sun" id="dl">Als Datei speichern</button><button class="btn" id="cp">Code kopieren</button></div>
    <textarea id="code" readonly rows="3" aria-label="Sicherungs-Code">${code}</textarea>
    <h3>Wiederherstellen</h3>
    <p class="small">Datei wählen oder einen Sicherungs-Code einfügen. Der jetzige Spielstand wird dabei ersetzt.</p>
    <div class="row"><label class="btn" for="file">Datei wählen</label><input type="file" id="file" accept=".json,application/json" hidden></div>
    <textarea id="paste" rows="3" placeholder="Sicherungs-Code hier einfügen" aria-label="Sicherungs-Code einfügen"></textarea>
    <div class="row"><button class="btn" id="restore">Code übernehmen</button></div>
    <p class="err" id="err" role="alert"></p>
    <h3>Mikrofon testen</h3>
    <p class="small">Zeigt, was die Spracherkennung dieses Geräts meldet. Starten, ein englisches Wort sagen, dann stoppen.</p>
    <div class="row opts">
      <label>Aufnahme <select id="mcont"><option value="1">fortlaufend</option><option value="0">einzeln</option></select></label>
      <label>Sprache <select id="mlang"><option value="en-GB">en-GB</option><option value="en-US">en-US</option><option value="">wie Gerät</option></select></label>
    </div>
    <div class="row"><button class="btn sun" id="mt">Test starten</button><button class="btn" id="ms" disabled>Stoppen</button></div>
    <div class="row"><button class="btn small" id="muse" hidden>Diese Einstellung in der App verwenden</button></div>
    <pre class="log" id="mlog">${SR?'Bereit.':'Dieser Browser hat keine Spracherkennung.'}</pre>
    <h3>Zurücksetzen</h3>
    <div class="row"><button class="btn" id="reset">Fortschritt löschen</button></div>
    <p class="ver">Version ${VERSION}</p>
  </div>`;
  micTest();
  const err=document.getElementById('err');
  const take=d=>{
    const x=normalize(d);
    if(!x){err.textContent='Das ist keine gültige Sicherung.'; return;}
    data=x; save(); parents('Spielstand wiederhergestellt ✓');
  };
  document.getElementById('dl').onclick=()=>{
    const blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`englisch-lernen-spielstand-${today()}.json`; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1000);
  };
  document.getElementById('cp').onclick=async e=>{
    const ta=document.getElementById('code');
    try{await navigator.clipboard.writeText(code);}catch(x){ta.select(); try{document.execCommand('copy')}catch(y){}}
    e.target.textContent='Kopiert ✓';
  };
  document.getElementById('file').onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    f.text().then(t=>take(JSON.parse(t))).catch(()=>{err.textContent='Die Datei konnte nicht gelesen werden.';});
  };
  document.getElementById('restore').onclick=()=>{
    const v=document.getElementById('paste').value.trim(); if(!v) return;
    try{take(JSON.parse(decodeURIComponent(escape(atob(v)))));}catch(x){err.textContent='Der Code ist nicht vollständig oder falsch.';}
  };
  const rb=document.getElementById('reset'); let armed=false;
  rb.onclick=()=>{
    if(!armed){armed=true; rb.textContent='Wirklich alles löschen? Nochmal tippen.'; return;}
    data=fresh(); save(); parents('Fortschritt gelöscht.');
  };
}

function theme(id){
  const t=T(id);
  const modes=t.kind==='sentences'?[
    ['explore','👀','Entdecken','Sätze anschauen und anhören'],
    ['quiz','👂','Hör-Quiz','Satz hören und das richtige Bild antippen'],
    ['build','🧱','Satz bauen','Wörter in die richtige Reihenfolge bringen'],
    ['speak','🎤','Sprechen','Sätze nachsprechen – die App hört zu']
  ]:[
    ['explore','👀','Entdecken','Wörter anschauen und anhören'],
    ['quiz','👂','Hör-Quiz','Hören und das richtige Bild antippen'],
    ['memory','🃏','Memory','Bild und Wort zusammen finden'],
    ['speak','🎤','Sprechen','Wörter nachsprechen – die App hört zu']
  ];
  app.innerHTML=`${topbar('home',t.name)}
  <div class="list">${modes.map(m=>`<button class="btn tile" data-go="${m[0]}:${id}">
    <span class="icon" style="background:${t.color}">${m[1]}</span>
    <span class="tx"><span class="name">${m[2]}</span><span class="meta">${m[3]}</span></span>
  </button>`).join('')}</div>`;
}

function explore(id,i){
  const t=T(id), n=t.items.length; i=((i%n)+n)%n; const it=t.items[i];
  app.innerHTML=`${topbar('theme:'+id,t.name)}
  <button class="stage" id="say" aria-label="${it.en} anhören">${vis(it,'lg')}<span class="word${it.s?' sent':''}">${it.en}</span><span class="de">auf Deutsch: ${it.de}</span></button>
  <div class="ctrl">
    <button class="btn round" data-go="explore:${id}:${i-1}" aria-label="Zurück">◀</button>
    <button class="btn round sun" id="say2" aria-label="Anhören">🔊</button>
    <button class="btn round" data-go="explore:${id}:${i+1}" aria-label="Weiter">▶</button>
  </div>
  <p class="count">${i+1} von ${n}</p>`;
  const s=()=>{speak(it.en); pop(app.querySelector('.stage .lg'));};
  document.getElementById('say').onclick=s;
  document.getElementById('say2').onclick=s;
  setTimeout(()=>speak(it.en),150);
}

/* Eine Hör-Quiz-Aufgabe. onDone(true) wenn beim ersten Versuch richtig. */
function quizStep(tid,target,pool,head,onDone){
  let first=true, done=false;
  const opts=shuffle([target,...shuffle(pool.filter(x=>x!==target)).slice(0,3)]);
  app.innerHTML=`${head}
  <div class="ask"><button class="btn speaker sun" id="again" aria-label="Nochmal hören">🔊</button><p>Hör gut zu und tipp auf das richtige Bild.</p></div>
  <div class="grid">${opts.map((o,k)=>`<button class="btn opt" data-k="${k}" aria-label="Antwort ${k+1}">${vis(o,'md')}</button>`).join('')}</div>
  <p class="fb" aria-live="polite"></p>`;
  const fb=app.querySelector('.fb');
  document.getElementById('again').onclick=()=>speak(target.en);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    if(done) return;
    const o=opts[+b.dataset.k];
    if(o===target){
      done=true; b.classList.add('right'); pop(b);
      grade(tid,target.en,first);
      if(first){addStars(1); starFly(b);}
      fb.textContent=`${pick(PRAISE)} «${target.en}» heisst «${target.de}»`;
      speak(target.en);
      setTimeout(()=>onDone(first),target.s?2400:1700);
    }else{
      first=false; b.classList.add('wrong'); b.disabled=true;
      fb.textContent='Fast! Hör nochmal genau hin.';
      setTimeout(()=>speak(target.en),350);
    }
  });
  setTimeout(()=>speak(target.en),300);
}

/* Eine Satz-bauen-Aufgabe. onDone(true) wenn ohne Fehler gebaut. */
function buildStep(tid,it,head,onDone){
  const words=it.en.split(' '); let pos=0, clean=true, done=false;
  const tiles=shuffle(words.map(w=>w));
  app.innerHTML=`${head}
  <div class="bcard">${vis(it,'md')}<p class="de">${it.de}</p><button class="btn small sun" id="again">🔊 Anhören</button></div>
  <div class="slots">${words.map(()=>'<span class="slot"></span>').join('')}</div>
  <div class="tiles">${tiles.map((w,k)=>`<button class="btn wtile" data-k="${k}">${w}</button>`).join('')}</div>
  <p class="fb" aria-live="polite">Tipp die Wörter in der richtigen Reihenfolge an.</p>`;
  const fb=app.querySelector('.fb'), slots=[...app.querySelectorAll('.slot')];
  document.getElementById('again').onclick=()=>speak(it.en);
  app.querySelectorAll('.wtile').forEach(b=>b.onclick=()=>{
    if(done) return;
    const w=tiles[+b.dataset.k];
    if(w===words[pos]){
      slots[pos].textContent=w; slots[pos].classList.add('filled'); pop(slots[pos]);
      b.disabled=true; b.style.visibility='hidden'; pos++;
      fb.textContent='';
      if(pos===words.length){
        done=true;
        grade(tid,it.en,clean);
        if(clean){addStars(1); starFly(app.querySelector('.slots'));}
        fb.textContent=`${pick(PRAISE)} ${it.en}`;
        speak(it.en);
        setTimeout(()=>onDone(clean),2600);
      }
    }else{
      clean=false; nope(b);
      fb.textContent='Nicht ganz. Welches Wort kommt jetzt?';
    }
  });
  setTimeout(()=>speak(it.en),300);
}

function quiz(id){
  const t=T(id); const rounds=shuffle(t.items).slice(0,Math.min(10,t.items.length));
  let r=0, got=0;
  function round(){
    if(r>=rounds.length){
      const n=rounds.length;
      const big=got===n?'Perfekt!':got>=n/2?'Super gemacht!':'Gut geübt!';
      return endScreen(id,big,`Du hast ${got} von ${n} sofort erkannt und ${got} Sterne gesammelt.`,'quiz:'+id);
    }
    quizStep(id,rounds[r],t.items,topbar('theme:'+id,'Hör-Quiz')+dots(rounds.length,r),ok=>{if(ok)got++; r++; round();});
  }
  round();
}

function build(id){
  const t=T(id); const rounds=shuffle(t.items).slice(0,Math.min(6,t.items.length));
  let r=0, got=0;
  function round(){
    if(r>=rounds.length){
      const n=rounds.length;
      return endScreen(id,got===n?'Perfekt!':'Super gebaut!',`Du hast ${got} von ${n} Sätzen ohne Fehler gebaut und ${got} Sterne gesammelt.`,'build:'+id);
    }
    buildStep(id,rounds[r],topbar('theme:'+id,'Satz bauen')+dots(rounds.length,r),ok=>{if(ok)got++; r++; round();});
  }
  round();
}

/* Heute üben: fällige Wiederholungen aus allen Themen, aufgefüllt mit neuen Einträgen */
const PRACTICE_N=10;
function practiceInfo(){
  const t0=today(), all=THEMES.flatMap(t=>t.items.map(it=>({t,it,s:data.srs[t.id+'|'+it.en]})));
  const due=all.filter(x=>x.s&&x.s.d<=t0);
  return {all,due:due.length,dueList:due};
}
function practiceList(){
  const {all,dueList}=practiceInfo();
  let list=shuffle(dueList).sort((a,b)=>a.s.l-b.s.l||(a.s.d<b.s.d?-1:a.s.d>b.s.d?1:0)).slice(0,PRACTICE_N);
  if(list.length<PRACTICE_N){
    // neue Einträge: zuerst aus angefangenen Themen, dann in der Reihenfolge der Themen
    const started=new Set(Object.keys(data.srs).map(k=>k.split('|')[0]));
    const order=t=>(started.has(t.id)?0:1000)+THEMES.indexOf(t);
    const news=shuffle(all.filter(x=>!x.s)).sort((a,b)=>order(a.t)-order(b.t));
    list=list.concat(news.slice(0,PRACTICE_N-list.length));
  }
  if(list.length<PRACTICE_N){
    // alles gelernt und nichts fällig: was am frühesten wieder dran wäre
    const rest=all.filter(x=>x.s&&!list.includes(x)).sort((a,b)=>a.s.l-b.s.l||(a.s.d<b.s.d?-1:1));
    list=list.concat(rest.slice(0,PRACTICE_N-list.length));
  }
  return shuffle(list);
}
function practice(){
  const rounds=practiceList(); let r=0, got=0;
  function round(){
    if(r>=rounds.length) return practiceEnd(got,rounds.length);
    const {t,it}=rounds[r];
    const head=topbar('home','Heute üben')+dots(rounds.length,r)+`<p class="from">${t.icon} ${t.name}</p>`;
    const next=ok=>{if(ok)got++; r++; round();};
    if(it.s&&it.en.includes(' ')&&Math.random()<.5) buildStep(t.id,it,head,next);
    else quizStep(t.id,it,t.items,head,next);
  }
  round();
}
function practiceEnd(got,n){
  const first=data.bonus!==today();
  if(first){data.bonus=today(); addStars(3);}
  markDay();
  const k=streakNow();
  app.innerHTML=`${topbar('home','')}
  <div class="end"><div class="trophy">🔥</div><h2>${k} ${k===1?'Tag':'Tage'} am Stück!</h2>
  <p>Du hast ${got} von ${n} sofort gewusst.${first?' Für das Üben heute gibt es 3 Extra-Sterne!':''}</p>
  <div class="col"><button class="btn sun" data-go="practice">Nochmal üben</button>
  <button class="btn" data-go="home">Zur Startseite</button></div></div>`;
}

/* Sprechübungen */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let micBlocked=false, activeListen=null;
/* Safari (auch Chrome auf iPhone/iPad) beendet die Aufnahme mit continuous=false oft sofort */
const APPLE=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
  ||(/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg|Android/.test(navigator.userAgent));
/* Einstellungen der Spracherkennung, im Eltern-Bereich testbar (pro Gerät, eigener Schlüssel) */
const MICKEY='englisch-lernen-mic';
let micOpts={cont:APPLE,lang:'en-GB'};
try{const m=JSON.parse(localStorage.getItem(MICKEY)||'null'); if(m) micOpts={cont:!!m.cont,lang:m.lang??'en-GB'};}catch(e){}
function makeRec(o=micOpts){
  const r=new SR(); if(o.lang) r.lang=o.lang; r.interimResults=true; r.maxAlternatives=5; r.continuous=o.cont;
  return r;
}
const SERVICE_HINT='Prüfe auf dem iPad: Einstellungen → Allgemein → Tastatur → «Diktierfunktion aktivieren» und unter Bildschirmzeit → Beschränkungen → Erlaubte Apps → «Siri & Diktierfunktion».';
function stopListening(){if(activeListen){activeListen.cancel(); activeListen=null;}}
let micReason=SR?'':'Dieser Browser kann keine Sprache erkennen. Deshalb hört ein Erwachsener zu.';
const SOUNDS={one:['won'],two:['to','too'],four:['for'],eight:['ate'],eye:['i','aye'],ear:['year','here'],mum:['mom','mam'],sun:['son']};
function norm(s){
  return s.toLowerCase().replace(/[’`]/g,"'")
    .replace(/\b(\d{1,2})(:00| ?o'?clock)/g,"$1 o'clock")
    .replace(/\b(\d{1,2})\b/g,(m,d)=>(+d>=1&&+d<=20)?NUM_EN[+d-1]:m)
    .replace(/\bi'm\b/g,'i am').replace(/\bit's\b/g,'it is').replace(/\bdo not\b/g,"don't")
    .replace(/[^a-z' ]+/g,' ').replace(/\s+/g,' ').trim();
}
function heardOK(target,alts,sentence){
  const tw=norm(target).split(' '); let best=0;
  for(const a of alts){
    const aw=new Set(norm(a).split(' '));
    const f=tw.filter(w=>aw.has(w)||(SOUNDS[w]||[]).some(x=>aw.has(x))).length/tw.length;
    best=Math.max(best,f);
  }
  return sentence?best>=0.75:best===1;
}
/* Spracherkennung. Safari beendet die Aufnahme oft gar nicht oder schon bevor gesprochen wird:
   darum Zwischenergebnisse auswerten, nach kurzer Stille oder spätestens nach 8 s selbst stoppen,
   bei einem Ende ohne Ergebnis weiter zuhören, und stop() für das manuelle Beenden anbieten.
   onHear(alts) gibt true zurück, wenn das Gesagte schon passt. */
function listen(onDone,onHear){
  stopListening();
  let finished=false, stopping=false, alts=[], rec=null, silence=null, hard=null, quick=0;
  const t0=Date.now();
  const result=()=>alts.length?{alts}:{error:'no-speech'};
  const cancel=()=>{
    finished=true; clearTimeout(silence); clearTimeout(hard);
    try{rec&&rec.abort()}catch(e){}
  };
  const done=r=>{
    if(finished) return; cancel(); if(activeListen===api) activeListen=null;
    onDone(r);
  };
  const stop=()=>{
    if(finished||stopping) return; stopping=true;
    try{rec&&rec.stop()}catch(e){}
    setTimeout(()=>done(result()),1200); // falls das Ende-Ereignis ausbleibt
  };
  function startOne(){
    if(finished||stopping) return;
    rec=makeRec();
    rec.onresult=e=>{
      const all=[...e.results], last=all[all.length-1];
      const pre=all.slice(0,-1).map(r=>r[0].transcript).join(' ');
      alts=[...last].map(a=>((pre?pre+' ':'')+a.transcript).trim()).filter(Boolean);
      if(!alts.length) return;
      if(onHear&&onHear(alts)) return done({alts});
      if(last.isFinal&&!APPLE) return done({alts});
      clearTimeout(silence); silence=setTimeout(stop,1500);
    };
    const began=Date.now(); let lastErr='';
    rec.onerror=e=>{
      lastErr=e.error;
      if(['no-speech','aborted'].includes(e.error)||alts.length) return; // das Ende-Ereignis folgt
      done({error:e.error});
    };
    rec.onend=()=>{
      if(finished) return;
      if(alts.length||stopping||Date.now()-t0>7000) return done(result());
      // iOS bricht sofort ab, wenn Siri/Diktierfunktion nicht verfügbar ist: nicht endlos neu starten
      if(lastErr==='aborted'&&Date.now()-began<1000&&++quick>=2) return done({error:'service'});
      setTimeout(()=>{try{startOne()}catch(x){done({error:'start'})}},300); // weiter zuhören
    };
    rec.start();
  }
  const api={stop,cancel};
  activeListen=api;
  hard=setTimeout(stop,8000);
  // kurz warten, damit die Sprachausgabe das Mikrofon freigibt
  setTimeout(()=>{try{startOne()}catch(x){done({error:'start'})}},250);
  return api;
}
function speakMode(id){
  const t=T(id); const sent=t.kind==='sentences';
  const rounds=shuffle(t.items).slice(0,Math.min(sent?6:8,t.items.length));
  let r=0, got=0;
  function round(note){
    if(r>=rounds.length){
      const n=rounds.length;
      return endScreen(id,got===n?'Perfekt gesprochen!':'Super gesprochen!',`Du hast ${got} von ${n} ${sent?'Sätzen':'Wörtern'} gesagt und ${got} Sterne gesammelt.`,'speak:'+id);
    }
    const it=rounds[r]; let tries=0, done=false, busy=false;
    const canListen=!!SR&&!micBlocked;
    app.innerHTML=`${topbar('theme:'+id,'Sprechen')}
    ${dots(rounds.length,r)}
    <div class="stage static">${vis(it,'lg')}<span class="word${it.s?' sent':''}">${it.en}</span><span class="de">auf Deutsch: ${it.de}</span></div>
    <div class="ctrl"><button class="btn round" id="hear" aria-label="Anhören">🔊</button>
    ${canListen?'<button class="btn mic sun" id="mic" aria-label="Jetzt sprechen">🎤</button>':'<button class="btn sun said" id="said">Ich hab\'s gesagt</button>'}</div>
    <div class="check" id="check" hidden><p>Eltern-Check: Hat es richtig geklungen?</p><div class="ctrl"><button class="btn sun" id="yes">Ja, richtig ✓</button><button class="btn" id="again2">Nochmal üben</button></div></div>
    <p class="hint" id="hint">${canListen?'Hör zu, dann tipp aufs Mikrofon und sprich nach.':'Hör zu und sprich laut nach. Dann tipp auf «Ich hab\'s gesagt».'}</p>
    ${canListen?'':`<p class="hint small">${micReason}</p>`}
    <p class="fb" aria-live="polite"></p>
    <button class="btn small skip" id="skip">Überspringen</button>`;
    const fb=app.querySelector('.fb'), hint=document.getElementById('hint'), skip=document.getElementById('skip');
    if(note) fb.textContent=note;
    const next=()=>{stopListening(); r++; round();};
    const success=el=>{
      done=true; got++; grade(id,it.en,true); addStars(1); starFly(el); pop(el);
      fb.textContent=pick(PRAISE)+' Das hast du toll gesagt!';
      setTimeout(next,1900);
    };
    document.getElementById('hear').onclick=()=>speak(it.en);
    skip.onclick=()=>{if(done) return; if(tries) grade(id,it.en,false); next();};
    const said=document.getElementById('said');
    const check=document.getElementById('check');
    if(said){
      said.onclick=()=>{if(done)return; said.hidden=true; check.hidden=false; fb.textContent='';};
      document.getElementById('yes').onclick=()=>{if(done)return; check.hidden=true; said.hidden=false; success(said);};
      document.getElementById('again2').onclick=()=>{check.hidden=true; said.hidden=false; fb.textContent='Hör nochmal genau zu und sprich es nach.'; speak(it.en);};
    }
    const mic=document.getElementById('mic');
    let listening=null;
    if(mic) mic.onclick=()=>{
      if(done) return;
      if(busy){ if(listening) listening.stop(); hint.textContent='Einen Moment …'; return; }
      busy=true;
      if(speechOK) speechSynthesis.cancel();
      mic.classList.add('live'); mic.setAttribute('aria-label','Fertig gesprochen');
      hint.textContent='Ich höre zu … Wenn du fertig bist, tipp nochmal aufs Mikrofon.'; fb.textContent='';
      listening=listen(res=>{
        busy=false; listening=null; mic.classList.remove('live'); mic.setAttribute('aria-label','Jetzt sprechen');
        if(done||!document.body.contains(mic)) return;
        hint.textContent='Tipp aufs Mikrofon und sprich nach.';
        if(res.error){
          if(['not-allowed','service-not-allowed','audio-capture','start'].includes(res.error)){
            micBlocked=true;
            micReason='Das Mikrofon ist hier nicht freigegeben. Deshalb hört ein Erwachsener zu.';
            round('Das Mikrofon ist nicht freigegeben. Sprich einfach laut nach.');
          }else if(res.error==='service'){
            micBlocked=true;
            micReason='Die Spracherkennung von iOS bricht sofort ab. '+SERVICE_HINT+' Bis dahin hört ein Erwachsener zu.';
            round('Die Spracherkennung ist auf diesem Gerät nicht verfügbar. Sprich einfach laut nach.');
          }else if(res.error==='no-speech'){
            fb.textContent='Ich habe nichts gehört. Sprich etwas lauter.';
          }else{
            fb.textContent=`Das hat nicht geklappt (${res.error}). Probier es nochmal.`;
          }
          return;
        }
        if(heardOK(it.en,res.alts,sent)) success(mic);
        else{
          tries++;
          fb.textContent=`Ich habe «${res.alts[0]||'…'}» verstanden. Hör nochmal zu und probier es wieder!`;
          if(tries>=2){skip.textContent='Weiter'; skip.classList.add('sun');}
          setTimeout(()=>speak(it.en),500);
        }
      },alts=>heardOK(it.en,alts,sent));
    };
    setTimeout(()=>speak(it.en),300);
  }
  round();
}

function memory(id){
  const t=T(id); const six=shuffle(t.items).slice(0,6);
  const cards=shuffle(six.flatMap((it,k)=>[{k,it,type:'pic'},{k,it,type:'word'}]));
  let open=[], matched=0, moves=0, lock=false;
  app.innerHTML=`${topbar('theme:'+id,'Memory')}
  <p class="lead small">Finde Bild und Wort, die zusammenpassen.</p>
  <div class="mgrid">${cards.map((c,i)=>`<button class="mcard" data-i="${i}" aria-label="Karte ${i+1} umdrehen"><span class="back" aria-hidden="true">?</span><span class="face">${c.type==='pic'?vis(c.it,'sm'):`<span class="mword">${c.it.en}</span>`}</span></button>`).join('')}</div>
  <p class="fb" aria-live="polite"></p>`;
  const fb=app.querySelector('.fb');
  const els=[...app.querySelectorAll('.mcard')];
  els.forEach((el,i)=>el.onclick=()=>{
    const c=cards[i];
    if(lock||el.classList.contains('up')) return;
    el.classList.add('up');
    if(c.type==='word') speak(c.it.en);
    open.push(i);
    if(open.length<2) return;
    moves++; const [a,b]=open; open=[];
    if(cards[a].k===cards[b].k){
      els[a].classList.add('ok'); els[b].classList.add('ok');
      els[a].disabled=true; els[b].disabled=true;
      matched++; learn(id,cards[a].it.en); speak(cards[a].it.en);
      fb.textContent=`${pick(PRAISE)} «${cards[a].it.en}» heisst «${cards[a].it.de}»`;
      if(matched===six.length){
        addStars(3);
        setTimeout(()=>endScreen(id,'Alle Paare gefunden!',`Du hast es in ${moves} Zügen geschafft und 3 Sterne gesammelt.`,'memory:'+id),1500);
      }
    }else{
      lock=true;
      setTimeout(()=>{els[a].classList.remove('up'); els[b].classList.remove('up'); lock=false;},1100);
    }
  });
}

function endScreen(id,big,msg,replay){
  markDay();
  app.innerHTML=`${topbar('theme:'+id,'')}
  <div class="end"><div class="trophy">🏆</div><h2>${big}</h2><p>${msg}</p>
  <div class="col"><button class="btn sun" data-go="${replay}">Nochmal spielen</button>
  <button class="btn" data-go="theme:${id}">Anderes Spiel wählen</button>
  <button class="btn" data-go="home">Anderes Thema wählen</button></div></div>`;
}

function go(route){
  const [s,id,arg]=route.split(':');
  if(speechOK) speechSynthesis.cancel();
  stopListening();
  window.scrollTo(0,0);
  if(s==='home') home();
  else if(s==='practice') practice();
  else if(s==='parents') parents();
  else if(s==='theme') theme(id);
  else if(s==='explore') explore(id,+(arg||0));
  else if(s==='quiz') quiz(id);
  else if(s==='memory') memory(id);
  else if(s==='build') build(id);
  else if(s==='speak') speakMode(id);
}
app.addEventListener('click',e=>{const b=e.target.closest('[data-go]'); if(b) go(b.dataset.go);});
home();

/* Offline-Betrieb und Installation (nur über https oder localhost) */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
