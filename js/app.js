/* Logik der App: Navigation, Spiele, Sprachausgabe, Spracherkennung, Spielstand. */
const PRAISE=['Super!','Toll!','Richtig!','Grossartig!','Genau!','Yes!'];

const KEY='englisch-lernen-v1';
let data={stars:0,known:{}};
try{const s=localStorage.getItem(KEY); if(s){const d=JSON.parse(s); data={stars:d.stars||0,known:d.known||{}};}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function learn(tid,en){data.known[tid]=data.known[tid]||[]; if(!data.known[tid].includes(en)){data.known[tid].push(en); save();}}
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
const T=id=>THEMES.find(t=>t.id===id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function vis(it,size){
  if(it.e) return `<span class="emo ${size}${it.s?' multi':''}" aria-hidden="true">${it.e}</span>`;
  if(it.c) return `<span class="swatch ${size}" style="background:${it.c}" aria-hidden="true"></span>`;
  return `<span class="num ${size}" aria-hidden="true">${it.n}</span>`;
}
const starBadge=()=>`<span class="stars" aria-label="${data.stars} Sterne">⭐ ${data.stars}</span>`;
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
  app.innerHTML=`<div class="top"><span></span>${starBadge()}</div>
  <h1 class="hello">Hello! <span class="wave">👋</span></h1>
  <p class="lead">Wähle ein Thema und leg los.</p>
  <h3 class="sec">Wörter</h3>
  <div class="list two">${words.map(tileHTML).join('')}</div>
  <h3 class="sec">Sätze</h3>
  <div class="list two">${sents.map(tileHTML).join('')}</div>
  ${speechOK?'':'<p class="note">Dieses Gerät kann leider nichts vorlesen. Öffne die App am besten in Safari oder Chrome.</p>'}
  <button class="reset" id="reset">Fortschritt zurücksetzen</button>`;
  const rb=document.getElementById('reset'); let armed=false;
  rb.onclick=()=>{
    if(!armed){armed=true; rb.textContent='Wirklich alles löschen? Nochmal tippen.'; return;}
    data={stars:0,known:{}}; save(); home();
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

function quiz(id){
  const t=T(id); const rounds=shuffle(t.items).slice(0,Math.min(10,t.items.length));
  let r=0, got=0;
  function round(){
    if(r>=rounds.length) return finish();
    const target=rounds[r]; let first=true, done=false;
    const opts=shuffle([target,...shuffle(t.items.filter(x=>x!==target)).slice(0,3)]);
    app.innerHTML=`${topbar('theme:'+id,'Hör-Quiz')}
    ${dots(rounds.length,r)}
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
        if(first){got++; learn(id,target.en); addStars(1); starFly(b);}
        fb.textContent=`${pick(PRAISE)} «${target.en}» heisst «${target.de}»`;
        speak(target.en);
        setTimeout(()=>{r++; round();},target.s?2400:1700);
      }else{
        first=false; b.classList.add('wrong'); b.disabled=true;
        fb.textContent='Fast! Hör nochmal genau hin.';
        setTimeout(()=>speak(target.en),350);
      }
    });
    setTimeout(()=>speak(target.en),300);
  }
  function finish(){
    const n=rounds.length;
    const big=got===n?'Perfekt!':got>=n/2?'Super gemacht!':'Gut geübt!';
    endScreen(id,big,`Du hast ${got} von ${n} sofort erkannt und ${got} Sterne gesammelt.`,'quiz:'+id);
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
    const it=rounds[r]; const words=it.en.split(' '); let pos=0, clean=true, done=false;
    const tiles=shuffle(words.map(w=>w));
    app.innerHTML=`${topbar('theme:'+id,'Satz bauen')}
    ${dots(rounds.length,r)}
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
          if(clean){got++; learn(id,it.en); addStars(1); starFly(app.querySelector('.slots'));}
          fb.textContent=`${pick(PRAISE)} ${it.en}`;
          speak(it.en);
          setTimeout(()=>{r++; round();},2600);
        }
      }else{
        clean=false; nope(b);
        fb.textContent='Nicht ganz. Welches Wort kommt jetzt?';
      }
    });
    setTimeout(()=>speak(it.en),300);
  }
  round();
}

/* Sprechübungen */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let micBlocked=false, activeRec=null;
let micReason=SR?'':'Dieser Browser kann keine Sprache erkennen. Deshalb hört ein Erwachsener zu.';
const SOUNDS={one:['won'],two:['to','too'],four:['for'],eight:['ate'],eye:['i','aye'],ear:['year','here']};
function norm(s){
  return s.toLowerCase().replace(/[’`]/g,"'")
    .replace(/\b(\d{1,2})\b/g,(m,d)=>(+d>=1&&+d<=20)?NUM_EN[+d-1]:m)
    .replace(/\bi'm\b/g,'i am').replace(/\bdo not\b/g,"don't")
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
function listen(onDone){
  let finished=false;
  const done=r=>{if(finished)return; finished=true; activeRec=null; onDone(r);};
  let rec;
  try{
    rec=new SR(); rec.lang='en-GB'; rec.interimResults=false; rec.maxAlternatives=5; rec.continuous=false;
    rec.onresult=e=>done({alts:[...e.results[0]].map(a=>a.transcript)});
    rec.onerror=e=>done({error:e.error});
    rec.onend=()=>done({error:'no-speech'});
    rec.start(); activeRec=rec;
  }catch(err){setTimeout(()=>done({error:'start'}),0);}
  return rec;
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
    const next=()=>{if(activeRec){try{activeRec.abort()}catch(e){}} r++; round();};
    const success=el=>{
      done=true; got++; learn(id,it.en); addStars(1); starFly(el); pop(el);
      fb.textContent=pick(PRAISE)+' Das hast du toll gesagt!';
      setTimeout(next,1900);
    };
    document.getElementById('hear').onclick=()=>speak(it.en);
    skip.onclick=()=>{if(!done) next();};
    const said=document.getElementById('said');
    const check=document.getElementById('check');
    if(said){
      said.onclick=()=>{if(done)return; said.hidden=true; check.hidden=false; fb.textContent='';};
      document.getElementById('yes').onclick=()=>{if(done)return; check.hidden=true; said.hidden=false; success(said);};
      document.getElementById('again2').onclick=()=>{check.hidden=true; said.hidden=false; fb.textContent='Hör nochmal genau zu und sprich es nach.'; speak(it.en);};
    }
    const mic=document.getElementById('mic');
    if(mic) mic.onclick=()=>{
      if(done||busy) return;
      busy=true;
      if(speechOK) speechSynthesis.cancel();
      mic.classList.add('live'); hint.textContent='Ich höre zu …'; fb.textContent='';
      listen(res=>{
        busy=false; mic.classList.remove('live');
        if(done||!document.body.contains(mic)) return;
        hint.textContent='Tipp aufs Mikrofon und sprich nach.';
        if(res.error){
          if(['not-allowed','service-not-allowed','audio-capture','start'].includes(res.error)){
            micBlocked=true;
            micReason='Das Mikrofon ist hier nicht freigegeben. Deshalb hört ein Erwachsener zu.';
            round('Das Mikrofon ist nicht freigegeben. Sprich einfach laut nach.');
          }else if(res.error==='no-speech'){
            fb.textContent='Ich habe nichts gehört. Sprich etwas lauter.';
          }else{
            fb.textContent='Das hat nicht geklappt. Probier es nochmal.';
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
      });
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
  app.innerHTML=`${topbar('theme:'+id,'')}
  <div class="end"><div class="trophy">🏆</div><h2>${big}</h2><p>${msg}</p>
  <div class="col"><button class="btn sun" data-go="${replay}">Nochmal spielen</button>
  <button class="btn" data-go="theme:${id}">Anderes Spiel wählen</button>
  <button class="btn" data-go="home">Anderes Thema wählen</button></div></div>`;
}

function go(route){
  const [s,id,arg]=route.split(':');
  if(speechOK) speechSynthesis.cancel();
  if(activeRec){try{activeRec.abort()}catch(e){}}
  window.scrollTo(0,0);
  if(s==='home') home();
  else if(s==='theme') theme(id);
  else if(s==='explore') explore(id,+(arg||0));
  else if(s==='quiz') quiz(id);
  else if(s==='memory') memory(id);
  else if(s==='build') build(id);
  else if(s==='speak') speakMode(id);
}
app.addEventListener('click',e=>{const b=e.target.closest('[data-go]'); if(b) go(b.dataset.go);});
home();
