/* Logik der App: Navigation, Spiele, Sprachausgabe, Spracherkennung, Spielstand. */
/* Bei jeder Veröffentlichung erhöhen: wird unten auf der Startseite angezeigt */
const VERSION='8';
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
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* Wird erfüllt, sobald keine Aufnahme mehr läuft. iOS teilt Lautsprecher und Mikrofon. */
let micIdle=Promise.resolve(), micRunning=false;
function speak(t){
  if(!speechOK) return;
  if(micRunning){Promise.race([micIdle,wait(1500)]).then(()=>speakNow(t)); return;}
  speakNow(t);
}
function speakNow(t){
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
  <button class="reset" data-go="parents">Für Eltern: Spielstand sichern, Sprechen einstellen</button>
  <p class="ver">Version ${VERSION}</p>`;
}

/* Für Eltern: Eingabeweg wählen und Spracherkennung mit derselben Logik wie im Spiel testen */
function micTest(){
  const mt=document.getElementById('mt'), ms=document.getElementById('ms'), log=document.getElementById('mlog');
  const mi=document.getElementById('minput'), mc=document.getElementById('mcont'), ml=document.getElementById('mlang'), mok=document.getElementById('mok');
  const kt=document.getElementById('ktest'), kout=document.getElementById('kout');
  mi.value=micOpts.input; mc.value=micOpts.cont?'1':'0'; ml.value=micOpts.lang;
  const show=()=>{
    document.getElementById('micbox').hidden=micOpts.input!=='mic';
    document.getElementById('kbbox').hidden=micOpts.input!=='keyboard';
    mok.textContent=micOpts.lang==='auto'?`Zuletzt erfolgreich: ${micOpts.ok==null?'noch keine':(micOpts.ok||'wie Gerät')}`+(micOpts.bad.length?` · übersprungen: ${micOpts.bad.map(l=>l||'wie Gerät').join(', ')}`:''):'';
  };
  show();
  mi.onchange=()=>{micOpts.input=mi.value; micBlocked=false; micFails=0; saveMic(); show();};
  mc.onchange=ml.onchange=()=>{micOpts.cont=mc.value==='1'; micOpts.lang=ml.value; micOpts.bad=[]; micBlocked=false; saveMic(); show();};
  kt.oninput=()=>{kout.textContent=kt.value?`Erkannt: «${kt.value}» → ${heardOK('dog',[kt.value],false)?'«dog» richtig ✓':'nicht «dog»'}`:'';};
  if(!SR){mt.disabled=true; log.textContent='Dieser Browser hat keine Spracherkennung. Nimm die Tastatur-Diktierfunktion.'; return;}
  let t0=0, cur=null, ok=0, total=0;
  const add=m=>{log.textContent+=`\n${((Date.now()-t0)/1000).toFixed(1)} s  ${m}`; log.scrollTop=log.scrollHeight;};
  mt.onclick=()=>{
    if(cur) return;
    if(!total){log.textContent=''; t0=Date.now();}
    total++; mt.disabled=true; ms.disabled=false;
    add(`— Versuch ${total}: jetzt «dog» sagen —`);
    micDebug=m=>{if(document.body.contains(log)) add(m); else micDebug=null;};
    cur=listen(res=>{
      cur=null; if(res.alts) ok++;
      mt.disabled=false; ms.disabled=true; show();
      add(`Bisher ${ok} von ${total} Versuchen erkannt.`+(total<3?' Nochmal auf «Test starten» tippen.':''));
    });
  };
  ms.onclick=()=>{if(cur) cur.stop();};
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
    <h3>Sprechen und Mikrofon</h3>
    <p class="small">So spricht das Kind in der Übung «Sprechen». Die Einstellung gilt sofort für die ganze App.</p>
    <div class="row opts">
      <label>Sprechen über <select id="minput"><option value="keyboard">Tastatur-Diktierfunktion</option><option value="mic">App-Mikrofon${APPLE?' (auf iPad unzuverlässig)':''}</option><option value="parent">Eltern-Check</option></select></label>
    </div>
    <div id="micbox">
      <div class="row opts">
        <label>Aufnahme <select id="mcont"><option value="0">einzeln</option><option value="1">fortlaufend</option></select></label>
        <label>Sprache <select id="mlang"><option value="auto">automatisch</option><option value="en-GB">en-GB</option><option value="en-US">en-US</option><option value="">wie Gerät</option></select></label>
      </div>
      <p class="small" id="mok"></p>
      <p class="small">Auf «Test starten» tippen, «dog» sagen. Mehrmals wiederholen: Klappt es jedes Mal?</p>
      <div class="row"><button class="btn sun" id="mt">Test starten</button><button class="btn" id="ms" disabled>Stoppen</button></div>
      <pre class="log" id="mlog">Bereit.</pre>
    </div>
    <div id="kbbox">
      <p class="small">Ins Feld tippen, auf der Tastatur 🎤 antippen und «dog» sagen. Die Tastatur muss auf Englisch stehen (Weltkugel 🌐 gedrückt halten).</p>
      <input class="ktest" id="ktest" type="text" lang="en" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Hier tippen, dann 🎤">
      <p class="small" id="kout"></p>
    </div>
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
let micBlocked=false, activeListen=null, micDebug=null;
let micReason=SR?'':'Dieser Browser kann keine Sprache erkennen. Deshalb hört ein Erwachsener zu.';
const APPLE=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)
  ||(/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg|Android/.test(navigator.userAgent));
/* Einstellungen der Spracherkennung pro Gerät (eigener Schlüssel, nicht im Spielstand).
   input: 'mic' (App-Mikrofon), 'keyboard' (Diktat über die iPad-Tastatur), 'parent' (Eltern-Check)
   lang 'auto': englische Sprachen des Geräts, dann en-GB, en-US, Gerätesprache.
   ok = zuletzt erfolgreiche Sprache, bad = Sprachen, die sofort abgebrochen haben */
const MICKEY='englisch-lernen-mic';
/* Auf iPhone/iPad liefert das App-Mikrofon oft nur Stille, die Tastatur-Diktierfunktion klappt zuverlässig */
let micOpts={v:3,input:APPLE?'keyboard':SR?'mic':'parent',cont:false,lang:'auto',ok:null,bad:[]};
try{
  const m=JSON.parse(localStorage.getItem(MICKEY)||'null');
  if(m&&m.v===3) micOpts={...micOpts,...m};
  else if(m&&m.v===2) micOpts={...micOpts,...m,v:3,input:APPLE&&m.input==='mic'?'keyboard':m.input};
  else if(m) micOpts.ok=m.ok??null; // ältere Einstellungen: nur die erfolgreiche Sprache übernehmen
}catch(e){}
function saveMic(){try{localStorage.setItem(MICKEY,JSON.stringify(micOpts))}catch(e){}}
function micLangs(){
  if(micOpts.lang!=='auto') return [micOpts.lang];
  const dev=(navigator.languages||[navigator.language]).filter(l=>/^en(-|$)/i.test(l||''));
  const all=[...new Set([micOpts.ok,...dev,'en-GB','en-US',''].filter(x=>x!=null))];
  const good=all.filter(l=>!micOpts.bad.includes(l));
  return good.length?good:all;
}
function makeRec(o){
  const r=new SR(); if(o.lang) r.lang=o.lang; r.interimResults=true; r.maxAlternatives=5; r.continuous=o.cont;
  return r;
}
const SERVICE_HINT='Prüfe auf dem iPad: Einstellungen → Allgemein → Tastatur → «Diktierfunktion aktivieren» und unter Bildschirmzeit → Beschränkungen → Erlaubte Apps → «Siri & Diktierfunktion».';
function stopListening(){if(activeListen){activeListen.cancel(); activeListen=null;}}

/* Spracherkennung, vorsichtig für Safari auf iPhone/iPad:
   - ein Antippen = genau eine Aufnahme, gestartet direkt im Antippen (keine automatischen Neustarts:
     schnell folgende Aufnahmen bekommen auf iOS oft nur Stille)
   - mindestens 1 s Abstand zur vorherigen Aufnahme, die vorher sauber mit stop() beendet wird
   - Zwischenergebnisse auswerten, nach Stille oder spätestens nach 9 s selbst stoppen; stop() beendet manuell
   - bricht eine Sprache sofort ab, wird sie gemerkt und beim nächsten Mal übersprungen
   onHear(alts) gibt true zurück, wenn das Gesagte schon passt. */
let micLastEnd=0;
function listen(onDone,onHear){
  stopListening();
  const langs=micLangs(), lang=langs[0];
  let finished=false, stopping=false, alts=[], rec=null, silence=null, hard=null, watchdog=null, alive=false, lastErr='', began=0;
  const log=m=>{if(micDebug) micDebug(m);};
  const result=()=>alts.length?{alts}:{error:'no-speech'};
  const cancel=()=>{
    if(finished) return;
    finished=true; clearTimeout(silence); clearTimeout(hard); clearTimeout(watchdog);
    if(rec){const r=rec; try{r.stop()}catch(e){} setTimeout(()=>{try{r.abort()}catch(e){}},1500);}
  };
  const done=r=>{
    if(finished) return; cancel(); if(activeListen===api) activeListen=null;
    if(r.alts&&micOpts.lang==='auto'){micOpts.ok=lang; micOpts.bad=micOpts.bad.filter(l=>l!==lang); saveMic();}
    log(r.alts?'fertig: «'+r.alts[0]+'»':'fertig: '+r.error);
    onDone(r);
  };
  const stop=()=>{
    if(finished||stopping) return; stopping=true; log('stoppen');
    try{rec&&rec.stop()}catch(e){}
    setTimeout(()=>done(result()),1200); // falls das Ende-Ereignis ausbleibt
  };
  const fail=x=>{log('start() fehlgeschlagen: '+x.name+' '+x.message); setTimeout(()=>done({error:x.name==='NotAllowedError'?'not-allowed':'stuck'}),0);};
  function startNow(){
    if(finished||stopping) return;
    const r=makeRec({cont:micOpts.cont,lang}); rec=r;
    let endRes; micRunning=true;
    micIdle=new Promise(res=>endRes=()=>{if(!micRunning) return; micRunning=false; micLastEnd=Date.now(); res();});
    began=Date.now();
    const live=ev=>{log(ev); if(ev==='start') began=Date.now(); if(r===rec&&!alive){alive=true; clearTimeout(watchdog);}};
    ['start','audiostart','speechstart','speechend','audioend'].forEach(ev=>r.addEventListener(ev,()=>live(ev)));
    r.onresult=e=>{
      if(r!==rec||finished) return; live('ergebnis');
      const all=[...e.results], last=all[all.length-1];
      const pre=all.slice(0,-1).map(x=>x[0].transcript).join(' ');
      alts=[...last].map(a=>((pre?pre+' ':'')+a.transcript).trim()).filter(Boolean);
      if(!alts.length) return;
      log('hört: «'+alts[0]+'»');
      if(onHear&&onHear(alts)) return done({alts});
      if(last.isFinal&&!micOpts.cont) return done({alts});
      clearTimeout(silence); silence=setTimeout(stop,1500);
    };
    r.onerror=e=>{
      log('Fehler: '+e.error+(e.message?' – '+e.message:''));
      if(r!==rec||finished) return;
      lastErr=e.error;
      if(['no-speech','aborted','language-not-supported'].includes(e.error)||alts.length) return; // das Ende-Ereignis folgt
      done({error:e.error});
    };
    r.onend=()=>{
      endRes(); log('Ende');
      if(r!==rec||finished) return;
      if(!alts.length&&!stopping&&(lastErr==='language-not-supported'||(lastErr==='aborted'&&Date.now()-began<1000))){
        // Sprache nicht verfügbar: merken und beim nächsten Antippen eine andere nehmen
        if(micOpts.lang==='auto'){
          micOpts.bad=[...new Set([...micOpts.bad,lang])]; if(micOpts.ok===lang) micOpts.ok=null;
          const left=micLangs().filter(l=>!micOpts.bad.includes(l)).length;
          if(!left) micOpts.bad=[];
          saveMic();
          return done({error:left?'lang':'service'});
        }
        return done({error:'service'});
      }
      done(result());
    };
    watchdog=setTimeout(()=>{ // iOS: start() ohne jede Reaktion
      if(alive||finished||r!==rec) return;
      log('keine Reaktion');
      try{r.abort()}catch(e){} endRes();
      done({error:'stuck'});
    },2500);
    log('start '+(lang||'wie Gerät')+(micOpts.cont?' fortlaufend':' einzeln'));
    r.start();
  }
  const api={stop,cancel};
  activeListen=api;
  hard=setTimeout(stop,9000);
  if(speechOK) speechSynthesis.cancel();
  if(micRunning||Date.now()-micLastEnd<1000){
    log('warte kurz auf das Ende der letzten Aufnahme');
    Promise.race([micIdle,wait(1500)])
      .then(()=>wait(Math.max(0,1000-(Date.now()-micLastEnd))))
      .then(()=>{try{startNow()}catch(x){fail(x)}});
  }else{
    try{startNow()}catch(x){fail(x)} // direkt im Antippen starten
  }
  return api;
}
const SOUNDS={one:['won'],two:['to','too'],four:['for'],eight:['ate'],eye:['i','aye'],ear:['year','here'],mum:['mom','mam','mommy'],sun:['son'],grey:['gray'],grandma:['grandmother'],grandpa:['grandfather']};
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
let micFails=0; // Fehlversuche des App-Mikrofons in dieser Sitzung
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
    const mode=micOpts.input==='keyboard'?'keyboard':micOpts.input==='mic'&&SR&&!micBlocked?'mic':'parent';
    const reason=mode!=='parent'?'':micOpts.input==='parent'?'Ein Erwachsener hört zu (eingestellt unter «Für Eltern»).':micReason;
    const ctrl={
      mic:'<button class="btn mic sun" id="mic" aria-label="Jetzt sprechen">🎤</button>',
      keyboard:'',
      parent:'<button class="btn sun said" id="said">Ich hab\'s gesagt</button>'
    }[mode];
    const hintText={
      mic:'Hör zu, dann tipp aufs Mikrofon und sprich nach.',
      keyboard:'Tipp ins Feld, dann unten auf der Tastatur aufs 🎤 und sprich nach.',
      parent:'Hör zu und sprich laut nach. Dann tipp auf «Ich hab\'s gesagt».'
    }[mode];
    app.innerHTML=`${topbar('theme:'+id,'Sprechen')}
    ${dots(rounds.length,r)}
    <div class="stage static">${vis(it,'lg')}<span class="word${it.s?' sent':''}">${it.en}</span><span class="de">auf Deutsch: ${it.de}</span></div>
    <div class="ctrl"><button class="btn round" id="hear" aria-label="Anhören">🔊</button>${ctrl}</div>
    ${mode==='keyboard'?`<div class="dict"><input id="dict" type="text" lang="en" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Hier tippen, dann 🎤" aria-label="Hier hineinsprechen"><button class="btn sun" id="dok">Fertig</button></div>
    <p class="hint small">Die Tastatur muss auf Englisch stehen: Weltkugel 🌐 gedrückt halten und Englisch wählen.</p>`:''}
    <div class="check" id="check" hidden><p>Eltern-Check: Hat es richtig geklungen?</p><div class="ctrl"><button class="btn sun" id="yes">Ja, richtig ✓</button><button class="btn" id="again2">Nochmal üben</button></div></div>
    <p class="hint" id="hint">${hintText}</p>
    ${reason?`<p class="hint small">${reason}</p>`:''}
    <p class="fb" aria-live="polite"></p>
    <button class="btn small kb" id="tokb" hidden>Mit der Tastatur-Diktierfunktion sprechen</button>
    <button class="btn small skip" id="skip">Überspringen</button>`;
    const fb=app.querySelector('.fb'), hint=document.getElementById('hint'), skip=document.getElementById('skip'), tokb=document.getElementById('tokb');
    if(note) fb.textContent=note;
    const next=()=>{stopListening(); r++; round();};
    const success=el=>{
      done=true; got++; micFails=0; grade(id,it.en,true); addStars(1); starFly(el); pop(el);
      fb.textContent=pick(PRAISE)+' Das hast du toll gesagt!';
      setTimeout(next,1900);
    };
    const wrong=heard=>{
      tries++;
      fb.textContent=`Ich habe «${heard||'…'}» verstanden. Hör nochmal zu und probier es wieder!`;
      if(tries>=2){skip.textContent='Weiter'; skip.classList.add('sun');}
      setTimeout(()=>speak(it.en),500);
    };
    document.getElementById('hear').onclick=()=>speak(it.en);
    skip.onclick=()=>{if(done) return; if(tries) grade(id,it.en,false); next();};
    tokb.onclick=()=>{micOpts.input='keyboard'; saveMic(); round('Neu: Sprich über die Tastatur. Tipp ins Feld und dann aufs 🎤.');};

    // Eltern-Check
    const said=document.getElementById('said'), check=document.getElementById('check');
    if(said){
      said.onclick=()=>{if(done)return; said.hidden=true; check.hidden=false; fb.textContent='';};
      document.getElementById('yes').onclick=()=>{if(done)return; check.hidden=true; said.hidden=false; success(said);};
      document.getElementById('again2').onclick=()=>{check.hidden=true; said.hidden=false; fb.textContent='Hör nochmal genau zu und sprich es nach.'; speak(it.en);};
    }

    // Diktat über die Tastatur
    const dict=document.getElementById('dict');
    if(dict){
      const dok=document.getElementById('dok');
      dict.oninput=()=>{if(!done&&dict.value.trim()&&heardOK(it.en,[dict.value],sent)){dict.blur(); success(dok);}};
      const finish=()=>{
        if(done) return;
        const v=dict.value.trim();
        if(!v){fb.textContent='Tipp zuerst ins Feld und dann unten auf der Tastatur aufs 🎤.'; dict.focus(); return;}
        if(heardOK(it.en,[v],sent)){dict.blur(); success(dok);}
        else{dict.value=''; wrong(v);}
      };
      dok.onclick=finish;
      dict.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault(); finish();}};
    }

    // App-Mikrofon
    const mic=document.getElementById('mic');
    let listening=null;
    if(mic) mic.onclick=()=>{
      if(done) return;
      if(busy){ if(listening) listening.stop(); hint.textContent='Einen Moment …'; return; }
      busy=true;
      mic.classList.add('live'); mic.setAttribute('aria-label','Fertig gesprochen');
      hint.textContent='Ich höre zu … Wenn du fertig bist, tipp nochmal aufs Mikrofon.'; fb.textContent='';
      listening=listen(res=>{
        busy=false; listening=null; mic.classList.remove('live'); mic.setAttribute('aria-label','Jetzt sprechen');
        if(done||!document.body.contains(mic)) return;
        hint.textContent='Tipp aufs Mikrofon und sprich nach.';
        if(res.error){
          if(['not-allowed','service-not-allowed','audio-capture'].includes(res.error)){
            micBlocked=true;
            micReason='Das Mikrofon ist hier nicht freigegeben. Deshalb hört ein Erwachsener zu.';
            return round('Das Mikrofon ist nicht freigegeben. Sprich einfach laut nach.');
          }
          if(res.error==='lang'){fb.textContent='Ich habe die Sprache umgestellt. Tipp bitte nochmal aufs Mikrofon.'; return;}
          micFails++;
          fb.textContent=res.error==='service'?'Die Spracherkennung hat sofort abgebrochen. '+SERVICE_HINT
            :res.error==='stuck'?'Das Mikrofon hat nicht reagiert. Tipp nochmal aufs Mikrofon.'
            :res.error==='no-speech'?'Ich habe nichts gehört. Sprich etwas lauter.'
            :`Das hat nicht geklappt (${res.error}). Probier es nochmal.`;
          if(micFails>=1){tokb.hidden=false; tokb.classList.add('sun');}
          return;
        }
        micFails=0;
        if(heardOK(it.en,res.alts,sent)) success(mic);
        else wrong(res.alts[0]);
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
