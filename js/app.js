/* Anzeige und Ablauf der App: Navigation, Spiele, Tests, Sprachausgabe, Aufnahme, Spielstand.
   Reine Logik (Datum, Wiederholung, Sprachvergleich, Auswertung) liegt in js/logic.js. */
/* Bei jeder Veröffentlichung erhöhen: wird unten auf der Startseite angezeigt */
const VERSION='15';
const PRAISE=['Super!','Toll!','Richtig!','Grossartig!','Genau!','Yes!'];

/* Spielstand im Browser (Schlüssel nicht ändern, sonst beginnt der Spielstand bei null) */
const KEY='englisch-lernen-v1';
let data=fresh();
try{const s=localStorage.getItem(KEY); if(s) data=normalize(JSON.parse(s))||fresh();}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}}
function learn(tid,en){
  data.known[tid]=data.known[tid]||[]; if(!data.known[tid].includes(en)) data.known[tid].push(en);
  const k=tid+'|'+en; if(!data.srs[k]) data.srs[k]={l:1,d:addDays(today(),1),w:0};
  save();
}
function grade(tid,en,ok){
  const k=tid+'|'+en;
  data.srs[k]=review(data.srs[k],ok,today());
  if(ok) learn(tid,en); else save();
}
function markDay(){data.streak=nextStreak(data.streak,today()); save();}
const streakNow=()=>streakValue(data.streak,today());
function knownCount(t){const k=data.known[t.id]||[]; return t.items.filter(i=>k.includes(i.en)).length;}
function addStars(n){data.stars+=n; data.earned+=n; save(); document.querySelectorAll('.stars').forEach(s=>{s.textContent='⭐ '+data.stars; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');});}

/* Vorlesen */
const speechOK='speechSynthesis' in window;
let voice=null;
function pickVoice(){
  if(!speechOK) return;
  const vs=speechSynthesis.getVoices();
  voice=vs.find(v=>/^en[-_]GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;
}
if(speechOK){pickVoice(); speechSynthesis.onvoiceschanged=pickVoice;}
function speak(t,slow){
  if(!speechOK||activeRecord) return; // während der Aufnahme nichts vorlesen
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang=voice?voice.lang:'en-GB'; if(voice) u.voice=voice;
    u.rate=slow?.5:.8; u.pitch=1.05;
    speechSynthesis.speak(u);
  }catch(e){}
}

const app=document.getElementById('app');
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const T=id=>THEMES.find(t=>t.id===id);
const L=n=>LEVELS.find(l=>l.n===+n);
const levelThemes=n=>THEMES.filter(t=>t.level===+n);
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
const bestOf=key=>(data.tests[key]||{}).best||0;
const medalBadge=key=>{const m=medalFor(bestOf(key)); return m?`<span class="medal" aria-label="${m.name}-Medaille">${m.icon}</span>`:'';};

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
    <span class="tx"><span class="name">${t.name} ${medalBadge('theme:'+t.id)}</span>
    <span class="meta">${k} von ${n} ${unit} gelernt</span>
    <span class="bar"><span style="width:${Math.round(k/n*100)}%;background:${t.color}"></span></span></span>
  </button>`;
}
function levelTestTile(l){
  const best=bestOf('level:'+l.n);
  return `<button class="btn tile ltest" data-go="ltest:${l.n}">
    <span class="icon" style="background:var(--sun)">📝</span>
    <span class="tx"><span class="name">Test ${l.name} ${medalBadge('level:'+l.n)}</span>
    <span class="meta">${best?`Bestes Ergebnis: ${best} %`:'Zeig, was du in diesem Level kannst!'}</span></span>
  </button>`;
}

/* Sticker-Album */
const ALL_STICKERS=STICKER_PACKS.flatMap(p=>p.items.map(([e,name])=>({e,name,cost:p.cost,pack:p})));
function albumTile(){
  const have=data.stickers.length, total=ALL_STICKERS.length+Object.keys(LEVEL_STICKERS).length;
  const left=ALL_STICKERS.filter(x=>!data.stickers.includes(x.e));
  const next=left.filter(x=>packOpen(data,x.pack)).sort((a,b)=>a.cost-b.cost)[0];
  const meta=next?(data.stars>=next.cost?'Du kannst einen neuen Sticker aussuchen! 🎉':`Noch ${next.cost-data.stars} ⭐ bis zum nächsten Sticker`)
    :left.length?'Besteh den nächsten Level-Test, dann öffnet sich ein neues Pack!':'Alle Sticker gesammelt!';
  return `<button class="btn tile album" data-go="album">
    <span class="icon" style="background:var(--berry)">📒</span>
    <span class="tx"><span class="name">Sticker-Album <span class="small">${have} von ${total}</span></span><span class="meta">${meta}</span></span>
  </button>`;
}
function album(msg){
  const own=e=>data.stickers.includes(e);
  const cell=(e,name,lock)=>own(e)
    ?`<div class="stk own" title="${name}"><span class="se">${e}</span><span class="sn">${name}</span></div>`
    :lock;
  app.innerHTML=`${topbar('home','Sticker-Album')}
  <p class="lead small">Für Sterne bekommst du Sticker. Such dir einen aus!</p>
  ${msg?`<p class="newstk" role="status">${msg}</p>`:''}
  ${STICKER_PACKS.map(p=>{const open=packOpen(data,p); return `<h3 class="sec">${open?'':'🔒 '}${p.name} <span class="sub">je ${p.cost} ⭐${open?'':` · ab Test ${L(p.need).name}`}</span></h3>
  <div class="stks">${p.items.map(([e,name])=>cell(e,name,open
    ?`<button class="stk lock${data.stars>=p.cost?' can':''}" data-buy="${e}" data-cost="${p.cost}" aria-label="${name} für ${p.cost} Sterne freischalten"><span class="se">?</span><span class="sn">${p.cost} ⭐</span></button>`
    :`<button class="stk lock closed" data-go="ltest:${p.need}" aria-label="Erst Test ${L(p.need).name} bestehen"><span class="se">🔒</span><span class="sn">${L(p.need).name}</span></button>`)).join('')}</div>`;}).join('')}
  <h3 class="sec">Spezial-Sticker <span class="sub">für bestandene Level-Tests</span></h3>
  <div class="stks">${LEVELS.map(l=>{const [e,name]=LEVEL_STICKERS[l.n]; return cell(e,name,`<button class="stk lock" data-go="ltest:${l.n}" aria-label="Test ${l.name} bestehen"><span class="se">🔒</span><span class="sn">Test ${l.name}</span></button>`);}).join('')}</div>`;
  let armed=null;
  app.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    const e=b.dataset.buy, cost=+b.dataset.cost, st=ALL_STICKERS.find(x=>x.e===e);
    if(data.stars<cost){b.querySelector('.sn').textContent=`noch ${cost-data.stars} ⭐`; nope(b); return;}
    if(armed!==b){
      if(armed) armed.querySelector('.sn').textContent=armed.dataset.cost+' ⭐';
      armed=b; b.querySelector('.sn').textContent='Nochmal tippen!'; pop(b); return;
    }
    if(packOpen(data,st.pack)&&buySticker(data,e,cost)){save(); album(`Neuer Sticker: ${e} ${st.name}!`);}
  });
}
/* Geschichten: Seite für Seite vorlesen, dann Verständnisfragen (ein Versuch, Ergebnis wie ein Test) */
const S_=id=>STORIES.find(x=>x.id===id);
function storyTile(st){
  const best=bestOf('story:'+st.id);
  return `<button class="btn tile" data-go="story:${st.id}:0">
    <span class="icon" style="background:var(--grape)">${st.icon}</span>
    <span class="tx"><span class="name">${st.title} ${medalBadge('story:'+st.id)}</span>
    <span class="meta">${L(st.level).icon} ${L(st.level).name} · ${st.pages.length} Seiten${best?` · Fragen: ${best} %`:''}</span></span>
  </button>`;
}
const readStars=new Set(); // Seiten, für die es in dieser Sitzung schon einen Stern fürs Vorlesen gab
function story(id,i){
  const st=S_(id), n=st.pages.length; i=Math.max(0,Math.min(n-1,i)); const p=st.pages[i], last=i===n-1;
  app.innerHTML=`${topbar('home',st.title)}
  ${dots(n,i)}
  <button class="stage story" id="say" aria-label="Vorlesen">${vis({e:p.e,s:true},'lg')}<span class="word sent">${p.en}</span><span class="de" id="sde" hidden>${p.de}</span></button>
  <div class="ctrl">
    <button class="btn round" data-go="story:${id}:${i-1}" aria-label="Zurück"${i?'':' disabled'}>◀</button>
    <button class="btn round sun" id="say2" aria-label="Vorlesen">🔊</button>
    <button class="btn round" id="slow" aria-label="Langsam vorlesen">🐢</button>
    ${last?`<button class="btn sun" data-go="storyq:${id}">Fragen ▶</button>`:`<button class="btn round" data-go="story:${id}:${i+1}" aria-label="Weiter">▶</button>`}
  </div>
  ${canSpeak()?`<div class="readaloud">
    <div class="ctrl"><button class="btn mic sun" id="rmic" aria-label="Selbst vorlesen">🎤</button><button class="btn round" id="me" hidden aria-label="Meine Aufnahme anhören">🎧</button></div>
    <p class="hint" id="hint">Lies den Satz selbst vor: tipp aufs Mikrofon.</p>
    <p class="wordfb" id="wfb" hidden></p><p class="fb" aria-live="polite"></p></div>`:''}
  <button class="btn small skip" id="showde">Auf Deutsch zeigen</button>`;
  const sde=document.getElementById('sde'), showde=document.getElementById('showde');
  const rmic=document.getElementById('rmic');
  if(rmic){
    const fb=app.querySelector('.readaloud .fb'), key=id+':'+i;
    attachMic({btn:rmic,me:document.getElementById('me'),hint:document.getElementById('hint'),target:p.en,
      pool:st.pages.map(x=>x.en),sentence:true,idle:'Lies den Satz selbst vor: tipp aufs Mikrofon.',isDone:()=>false,
      onResult:res=>{
        if(res.error){fb.textContent=res.error==='not-allowed'?'Das Mikrofon ist nicht freigegeben.':micErrorText(res.error); return;}
        showWordFb(document.getElementById('wfb'),p.en,res.alts[0],res.ok);
        if(res.ok){
          fb.textContent=pick(PRAISE)+' Toll vorgelesen!';
          if(!readStars.has(key)){readStars.add(key); addStars(1); starFly(rmic);}
        }else fb.textContent='Fast! Hör nochmal zu (🔊 oder 🐢) und probier es wieder.';
      }});
  }
  showde.onclick=()=>{sde.hidden=!sde.hidden; showde.textContent=sde.hidden?'Auf Deutsch zeigen':'Deutsch verstecken';};
  const s=slow=>{speak(p.en,slow); pop(app.querySelector('.stage .lg'));};
  document.getElementById('say').onclick=()=>s();
  document.getElementById('say2').onclick=()=>s();
  document.getElementById('slow').onclick=()=>s(true);
  setTimeout(()=>speak(p.en),300);
}
function storyQuiz(id){
  const st=S_(id), qs=st.questions; let r=0, got=0;
  function round(){
    if(r>=qs.length) return testEnd('story:'+id,'Fragen zu «'+st.title+'»','home',got,qs.length);
    const q=qs[r], opts=shuffle(q.options.map((o,k)=>({o,ok:k===q.a})));
    let done=false;
    app.innerHTML=`${topbar('home',st.title)}
    ${dots(qs.length,r)}
    <div class="bcard"><span class="emo md" aria-hidden="true">${st.icon}</span><p class="qde">${q.q}</p><p class="de">${q.de}</p>
    <button class="btn small sun" id="again">🔊 Anhören</button></div>
    <div class="grid words">${opts.map((x,k)=>`<button class="btn opt txt" data-k="${k}" aria-label="${x.o}"><span class="otext">${x.o}</span></button>`).join('')}</div>
    <p class="fb" aria-live="polite"></p>
    <button class="btn small skip" data-go="story:${id}:0">Geschichte nochmal lesen</button>`;
    const fb=app.querySelector('.fb'), btns=[...app.querySelectorAll('.opt')], right=q.options[q.a];
    document.getElementById('again').onclick=()=>speak(q.q);
    btns.forEach(b=>b.onclick=()=>{
      if(done) return; done=true;
      const ok=opts[+b.dataset.k].ok;
      btns.forEach(x=>{x.disabled=true; if(opts[+x.dataset.k].ok) x.classList.add('right');});
      if(ok){got++; pop(b); addStars(1); starFly(b); fb.textContent=pick(PRAISE);}
      else{b.classList.add('wrong'); fb.textContent=`Richtig wäre: «${right}»`;}
      speak(right);
      setTimeout(()=>{r++; round();},ok?1500:2600);
    });
    setTimeout(()=>speak(q.q),300);
  }
  round();
}

/* Gespräche: die Figur sagt etwas, das Kind antwortet frei (Muster mit freien Teilen, js/logic.js dialogMatch).
   Was das Kind sagt (Name, Farbe …), verwendet die Figur später. Zwei Versuche, dann «Weiter». */
const D_=id=>DIALOGS.find(x=>x.id===id);
/* Zwei Stufen pro Gespräch: «Mit Hilfe» (Beispiel und Übersetzung immer sichtbar, Ergebnis 'dialog:id')
   und «Profi» (Hilfe erst nach dem ersten Fehlversuch, Ergebnis 'dialogpro:id') */
function dialogTile(d){
  return `<button class="btn tile" data-go="dialogmenu:${d.id}">
    <span class="icon" style="background:var(--sky)">${d.icon}</span>
    <span class="tx"><span class="name">${d.title} ${medalBadge('dialog:'+d.id)}${medalBadge('dialogpro:'+d.id)}</span>
    <span class="meta">${L(d.level).icon} ${L(d.level).name} · mit ${d.who}</span></span>
  </button>`;
}
function dialogMenu(id){
  const d=D_(id), b1=bestOf('dialog:'+id), b2=bestOf('dialogpro:'+id);
  app.innerHTML=`${topbar('home',d.title)}
  <div class="bcard"><span class="emo md" aria-hidden="true">${d.face}</span><p class="qde">${d.who}</p>
  <p class="de">${d.who} möchte mit dir reden. Wähle, wie viel Hilfe du willst.</p></div>
  <div class="list" style="margin-top:1rem">
    <button class="btn tile" data-go="dialog:${id}">
      <span class="icon" style="background:var(--grass)">🌟</span>
      <span class="tx"><span class="name">Mit Hilfe ${medalBadge('dialog:'+id)}</span>
      <span class="meta">Du siehst immer ein Beispiel und die Übersetzung.${b1?` Bestes Ergebnis: ${b1} %`:''}</span></span>
    </button>
    <button class="btn tile" data-go="dialog:${id}:pro">
      <span class="icon" style="background:var(--grape)">🌟🌟</span>
      <span class="tx"><span class="name">Profi ${medalBadge('dialogpro:'+id)}</span>
      <span class="meta">Die Hilfe kommt erst, wenn es beim ersten Mal nicht klappt.${b2?` Bestes Ergebnis: ${b2} %`:''}</span></span>
    </button>
  </div>`;
}
function dialogPlay(id,pro){
  const d=D_(id), n=d.turns.length, slots={}; let r=0, got=0;
  const key=(pro?'dialogpro:':'dialog:')+id;
  const local=canSpeak();
  app.innerHTML=`${topbar('home',d.title)}
  <div class="chat" id="chat" aria-live="polite"></div>
  <div class="turn" id="turn"></div>`;
  const chat=document.getElementById('chat'), turnEl=document.getElementById('turn');
  const bubble=(who,html)=>{chat.insertAdjacentHTML('beforeend',who==='them'
    ?`<div class="bub them"><span class="face" aria-hidden="true">${d.face}</span><span class="txt">${html}</span></div>`
    :`<div class="bub me"><span class="txt">${html}</span><span class="face" aria-hidden="true">🙂</span></div>`);
    chat.lastElementChild.scrollIntoView({block:'nearest',behavior:'smooth'});};
  function turn(){
    if(r>=n) return setTimeout(()=>testEnd(key,(pro?'Profi-Gespräch':'Gespräch')+' mit '+d.who,'dialogmenu:'+id,got,n),1200);
    const t=d.turns[r], line=fillSlots(t.say,slots), de=fillSlots(t.de,slots);
    let done=false, tries=0;
    bubble('them',`${line}<small class="tr"${pro?' hidden':''}>${de}</small>`);
    turnEl.innerHTML=`${dots(n,r)}
    ${pro?'<p class="hint pro" id="prohint">Profi: Antworte ohne Hilfe! Wenn es nicht klappt, kommt ein Tipp.</p>':''}
    <div class="tip"${pro?' hidden':''}><span>Du kannst sagen: <b>«${t.example}»</b> <span class="small">(${t.hint})</span></span>
      <button class="btn small" id="ex" aria-label="Beispiel anhören">👂</button></div>
    <div class="ctrl"><button class="btn round" id="again" aria-label="Nochmal hören">🔊</button><button class="btn round" id="slow" aria-label="Langsam hören">🐢</button>
    ${local?'<button class="btn mic sun" id="dmic" aria-label="Antworten">🎤</button><button class="btn round" id="me" hidden aria-label="Meine Aufnahme anhören">🎧</button>'
      :'<button class="btn sun said" id="said">Ich hab\'s gesagt</button>'}</div>
    <div class="check" id="check" hidden><p>Eltern-Check: Hat es gepasst?</p><div class="ctrl"><button class="btn sun" id="yes">Ja ✓</button><button class="btn" id="no">Nochmal</button></div></div>
    <p class="hint" id="hint">${local?'Tipp aufs Mikrofon und antworte.':'Antworte laut. Dann tipp auf «Ich hab\'s gesagt».'}</p>
    <p class="fb" aria-live="polite"></p>
    <button class="btn small skip" id="skip" hidden>Weiter</button>`;
    const fb=turnEl.querySelector('.fb'), skip=document.getElementById('skip');
    // Profi: Beispiel und Übersetzung erst nach dem ersten Fehlversuch zeigen
    const reveal=()=>{
      if(!pro) return;
      turnEl.querySelector('.tip').hidden=false;
      const tr=chat.querySelectorAll('.bub.them .tr'); if(tr.length) tr[tr.length-1].hidden=false;
      const ph=document.getElementById('prohint'); if(ph) ph.hidden=true;
    };
    document.getElementById('again').onclick=()=>speak(line);
    document.getElementById('slow').onclick=()=>speak(line,true);
    document.getElementById('ex').onclick=()=>speak(t.example);
    const next=ok=>{
      done=true; if(ok) got++;
      r++; setTimeout(turn,ok?1500:400);
    };
    const success=el=>{fb.textContent=pick(PRAISE); addStars(1); starFly(el); pop(el); next(true);};
    skip.onclick=()=>{if(!done) next(false);};
    const said=document.getElementById('said');
    if(said){
      const check=document.getElementById('check');
      said.onclick=()=>{if(done)return; said.hidden=true; check.hidden=false;};
      document.getElementById('yes').onclick=()=>{if(done)return; check.hidden=true; bubble('me','…'); success(said);};
      document.getElementById('no').onclick=()=>{check.hidden=true; said.hidden=false; reveal(); fb.textContent='Probier es nochmal. Tipp auf 👂 für ein Beispiel.';};
    }
    const dmic=document.getElementById('dmic');
    if(dmic) attachMic({btn:dmic,me:document.getElementById('me'),hint:document.getElementById('hint'),target:null,pool:null,sentence:true,
      idle:'Tipp aufs Mikrofon und antworte.',isDone:()=>done,
      onResult:res=>{
        if(res.error){
          if(res.error==='not-allowed') return dialogPlay(id,pro);
          reveal(); fb.textContent=micErrorText(res.error); return;
        }
        const m=dialogMatch(res.alts[0],t.answers);
        countSpeak(m.ok);
        bubble('me',res.alts[0]);
        if(m.ok){Object.assign(slots,m.slots); success(dmic);}
        else{
          tries++; reveal();
          fb.textContent=`Hmm, das passt noch nicht ganz. Du kannst sagen: «${t.example}»`;
          if(tries>=2){skip.hidden=false; skip.classList.add('sun');}
        }
      }});
    setTimeout(()=>speak(line),400);
  }
  turn();
}

function home(){
  const p=practiceInfo(), n=streakNow(), doneToday=data.streak.last===today();
  const pmeta=doneToday?'Heute schon geübt ✓ Du kannst gern nochmal.'
    :!p.learned?'Lerne zuerst ein paar Wörter in einem Thema, dann kannst du hier wiederholen.'
    :p.due?`${p.due} ${p.due===1?'gelerntes Wort wartet':'gelernte Wörter und Sätze warten'} auf dich.`
    :`Wiederhole ${Math.min(p.learned,PRACTICE_N)} Wörter, die du schon kannst.`;
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
  ${albumTile()}
  ${LEVELS.map(l=>`<h3 class="sec">${l.icon} ${l.name} <span class="sub">${l.sub}</span></h3>
  <div class="list two">${levelThemes(l.n).map(tileHTML).join('')}${levelTestTile(l)}</div>`).join('')}
  <h3 class="sec">📚 Geschichten <span class="sub">Hören und verstehen</span></h3>
  <div class="list two">${STORIES.map(storyTile).join('')}</div>
  <h3 class="sec">💬 Gespräche <span class="sub">Selbst reden</span></h3>
  <div class="list two">${DIALOGS.map(dialogTile).join('')}</div>
  ${speechOK?'':'<p class="note">Dieses Gerät kann leider nichts vorlesen. Öffne die App am besten in Safari oder Chrome.</p>'}
  ${standalone?'':`<p class="note small">Tipp für Eltern: ${/iPhone|iPad|Macintosh/.test(navigator.userAgent)?'In Safari auf «Teilen» und dann «Zum Home-Bildschirm» tippen.':'Im Browser-Menü «App installieren» oder «Zum Startbildschirm hinzufügen» wählen.'} Dann startet die App wie eine richtige App und läuft auch ohne Internet.</p>`}
  <button class="reset" data-go="parents">Für Eltern: Übersicht, Spielstand sichern, Sprechen einstellen</button>
  <p class="ver">Version ${VERSION}</p>`;
  schedulePreload();
}

/* Für Eltern: Fortschritt pro Level und Thema, schwierige Wörter */
function overviewHTML(){
  const t0=today(), all=Object.entries(data.srs);
  const due=all.filter(([,s])=>s.d<=t0).length, strong=all.filter(([,s])=>s.l>=4).length;
  const hard=all.filter(([,s])=>s.w>0).sort((a,b)=>b[1].w-a[1].w||a[1].l-b[1].l).slice(0,10).map(([k,s])=>{
    const [tid,en]=k.split('|'), t=T(tid), it=t&&t.items.find(i=>i.en===en);
    return it?`<li><b>${en}</b> – ${it.de} <span class="small">(${s.w}× falsch, Stufe ${s.l} von 5)</span></li>`:'';
  }).join('');
  return `<h3>Übersicht</h3>
    <p class="small">${all.length} Wörter und Sätze angefangen, ${strong} sitzen schon gut (Stufe 4–5), ${due} sind heute zum Wiederholen dran.
    Insgesamt ${data.earned} Sterne verdient, ${data.stickers.length} Sticker gesammelt.</p>
    <div class="ov">${LEVELS.map(l=>`<div class="ovl"><p class="ovh">${l.icon} ${l.name} ${medalBadge('level:'+l.n)}${bestOf('level:'+l.n)?` <span class="small">Test ${bestOf('level:'+l.n)} %</span>`:''}</p>
      ${levelThemes(l.n).map(t=>{const k=knownCount(t), n=t.items.length, b=bestOf('theme:'+t.id);
        return `<div class="ovr"><span>${t.icon} ${t.name}</span><span class="bar"><span style="width:${Math.round(k/n*100)}%;background:${t.color}"></span></span><span class="small">${k}/${n}${b?` · ${medalBadge('theme:'+t.id)} ${b} %`:''}</span></div>`;}).join('')}</div>`).join('')}</div>
    <p class="small">Sprechen: ${data.speak.n?`${data.speak.ok} von ${data.speak.n} Versuchen erkannt (${Math.round(data.speak.ok/data.speak.n*100)} %)`:'noch keine Versuche'}.
    Gespräche (mit Hilfe / Profi): ${DIALOGS.map(d=>`${d.icon} ${d.title} ${bestOf('dialog:'+d.id)?bestOf('dialog:'+d.id)+' %':'–'} / ${bestOf('dialogpro:'+d.id)?bestOf('dialogpro:'+d.id)+' %':'–'}`).join(' · ')}</p>
    <p class="small">Geschichten: ${STORIES.map(st=>`${st.icon} ${st.title} ${bestOf('story:'+st.id)?medalBadge('story:'+st.id)+' '+bestOf('story:'+st.id)+' %':'–'}`).join(' · ')}</p>
    <h3>Schwierige Wörter</h3>
    ${hard?`<ul class="hard">${hard}</ul><p class="small">Diese Wörter kommen bei «Heute üben» automatisch öfter dran.</p>`:'<p class="small">Noch keine Fehler gespeichert.</p>'}`;
}

/* Für Eltern: Sprechen einstellen und testen */
function micTest(){
  const mi=document.getElementById('minput');
  mi.value=micOpts.input;
  const show=()=>{document.getElementById('localbox').hidden=micOpts.input!=='local';};
  show();
  mi.onchange=()=>{micOpts.input=mi.value; micBlocked=false; saveMic(); show();};
  if(!LOCAL_OK) return;
  const lt=document.getElementById('lt'), ls=document.getElementById('ls'), llog=document.getElementById('llog'), lstate=document.getElementById('lstate');
  const st=v=>{if(!document.body.contains(lstate)){asrWatch.delete(st); return;} lstate.textContent=v>=1?'Spracherkennung bereit ✓':asrPromise?`Spracherkennung wird geladen … ${Math.round(v*100)} %`:'Spracherkennung noch nicht geladen.';};
  asrWatch.add(st); st(asrProgress);
  let lcur=null, lok=0, ltotal=0, l0=0;
  const ladd=m=>{llog.textContent+=`\n${((performance.now()-l0)/1000).toFixed(1)} s  ${m}`; llog.scrollTop=llog.scrollHeight;};
  lt.onclick=()=>{
    if(lcur) return;
    if(!ltotal){llog.textContent=''; l0=performance.now();}
    ltotal++; lt.disabled=true; ls.disabled=false;
    ladd(`— Versuch ${ltotal}: jetzt «dog» sagen —`);
    if(asrProgress<1) loadASR().then(()=>st(1)).catch(e=>ladd('Laden fehlgeschlagen: '+e.message));
    const t1=performance.now(); let t2=0;
    lcur=hearLocal(s=>{if(s==='think') t2=performance.now(); ladd(s==='listen'?'Aufnahme läuft':`Aufnahme fertig nach ${((performance.now()-t1)/1000).toFixed(1)} s, prüfe …`);},null,'dog',T('animals').items.map(x=>x.en),false);
    lcur.result.then(res=>{
      lcur=null; lt.disabled=false; ls.disabled=true;
      if(!res) return;
      if(res.alts){if(res.ok) lok++; ladd(`gehört: «${res.alts[0]}» → ${res.ok?'«dog» richtig ✓':'nicht «dog» ✗'} (${((performance.now()-t2)/1000).toFixed(1)} s)`);}
      else ladd('Fehler: '+res.error+(res.detail?' – '+res.detail:''));
      ladd(`Bisher ${lok} von ${ltotal} richtig.`);
    });
  };
  ls.onclick=()=>{if(lcur) lcur.stop();};
}

/* Für Eltern: Übersicht, Spielstand sichern/wiederherstellen/zurücksetzen, Sprechen */
function parents(msg){
  const code=btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  const learned=Object.values(data.known).reduce((n,a)=>n+a.length,0);
  app.innerHTML=`${topbar('home','Für Eltern')}
  <div class="panel">
    ${msg?`<p class="okmsg" role="status">${msg}</p>`:''}
    ${overviewHTML()}
    <h3>Sichern</h3>
    <p class="small">Der Spielstand (${data.stars} Sterne, ${learned} gelernte Wörter und Sätze) ist nur auf diesem Gerät gespeichert. Sichere ihn ab und zu, zum Beispiel vor einem Gerätewechsel.</p>
    <div class="row"><button class="btn sun" id="dl">Als Datei speichern</button><button class="btn" id="cp">Code kopieren</button></div>
    <textarea id="code" readonly rows="3" aria-label="Sicherungs-Code">${code}</textarea>
    <h3>Wiederherstellen</h3>
    <p class="small">Datei wählen oder einen Sicherungs-Code einfügen. Der jetzige Spielstand wird dabei ersetzt.</p>
    <div class="row"><label class="btn" for="file">Datei wählen</label><input type="file" id="file" accept=".json,application/json" hidden></div>
    <textarea id="paste" rows="3" placeholder="Sicherungs-Code hier einfügen" aria-label="Sicherungs-Code einfügen"></textarea>
    <div class="row"><button class="btn" id="restore">Code übernehmen</button></div>
    <p class="err" id="err" role="alert"></p>
    <h3>Sprechen</h3>
    <p class="small">So prüft die App die Übung «Sprechen». Die Einstellung gilt sofort.</p>
    <div class="row opts">
      <label>Wer hört zu? <select id="minput">${LOCAL_OK?'<option value="local">Die App (Erkennung auf dem Gerät)</option>':''}<option value="parent">Ein Erwachsener (Eltern-Check)</option></select></label>
    </div>
    <div id="localbox">
      <p class="small">Die Aufnahme wird direkt auf diesem Gerät erkannt und nicht verschickt. Beim ersten Mal wird die Spracherkennung (ca. 41 MB) geladen, danach klappt es auch ohne Internet.</p>
      <p class="small" id="lstate"></p>
      <div class="row"><button class="btn sun" id="lt">Test starten</button><button class="btn" id="ls" disabled>Stoppen</button></div>
      <pre class="log" id="llog">Auf «Test starten» tippen und «dog» sagen. Mehrmals wiederholen.</pre>
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
  const best=bestOf('theme:'+id);
  modes.push(['ttest','📝','Test',best?`Bestes Ergebnis: ${best} % ${medalBadge('theme:'+id)}`:'Hören, lesen, übersetzen – ohne Hilfe']);
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
    <button class="btn round" id="slow" aria-label="Langsam anhören">🐢</button>
    <button class="btn round" data-go="explore:${id}:${i+1}" aria-label="Weiter">▶</button>
  </div>
  <p class="count">${i+1} von ${n}</p>`;
  const s=()=>{speak(it.en); pop(app.querySelector('.stage .lg'));};
  document.getElementById('say').onclick=s;
  document.getElementById('say2').onclick=s;
  document.getElementById('slow').onclick=()=>{speak(it.en,true); pop(app.querySelector('.stage .lg'));};
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

/* Heute üben: nur bereits gelernte Wörter und Sätze (Auswahl in js/logic.js practicePick) */
const PRACTICE_N=10;
const practiceInfo=()=>practicePick(THEMES,data,today(),PRACTICE_N,shuffle);
function practiceList(){return shuffle(practiceInfo().list);}
function practice(){
  const rounds=practiceList(); let r=0, got=0, skipped=0;
  if(!rounds.length){
    app.innerHTML=`${topbar('home','Heute üben')}
    <div class="end"><div class="trophy">🌱</div><h2>Noch nichts zum Üben</h2>
    <p>Hier wiederholst du Wörter, die du schon gelernt hast. Spiel zuerst ein Thema, zum Beispiel das Hör-Quiz bei den Tieren.</p>
    <div class="col"><button class="btn sun" data-go="theme:${THEMES[0].id}">${THEMES[0].icon} ${THEMES[0].name}</button>
    <button class="btn" data-go="home">Zur Startseite</button></div></div>`;
    return;
  }
  function round(){
    if(r>=rounds.length) return practiceEnd(got,rounds.length-skipped);
    const {t,it,s:st}=rounds[r];
    const head=topbar('home','Heute üben')+dots(rounds.length,r)+`<p class="from">${t.icon} ${t.name}</p>`;
    const next=ok=>{if(ok===null) skipped++; else if(ok) got++; r++; round();};
    if(canSpeak()&&st&&st.l>=2&&sayable(it)&&Math.random()<.35) sayStep(t.id,it,t.items,head,next);
    else if(it.s&&it.en.includes(' ')&&Math.random()<.5) buildStep(t.id,it,head,next);
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

/* Tests: pro Thema (10 Aufgaben) oder pro Level (12 Aufgaben aus allen Themen des Levels).
   Jede Aufgabe nur ein Versuch (sagen: zwei). Arten: hören → Bild, Bild → englisches Wort, Deutsch → Englisch,
   Satz bauen, selbst sagen. */
function choiceStep(tid,it,pool,kind,head,onDone){
  let done=false;
  const opts=shuffle([it,...shuffle(pool.filter(x=>x!==it)).slice(0,3)]);
  const sent=!!it.s;
  const prompt={
    hear:`<div class="ask"><button class="btn speaker sun" id="again" aria-label="Nochmal hören">🔊</button><p>Hör zu und tipp auf das richtige Bild.</p></div>`,
    read:`<div class="bcard">${vis(it,'md')}<p class="de">Wie heisst das auf Englisch?</p></div>`,
    translate:`<div class="bcard"><p class="qde">${it.de}</p><p class="de">Was heisst das auf Englisch?</p></div>`
  }[kind];
  const label=o=>kind==='hear'?vis(o,'md'):`<span class="otext${sent?' sent':''}">${o.en}</span>`;
  app.innerHTML=`${head}${prompt}
  <div class="grid${kind==='hear'?'':' words'}">${opts.map((o,k)=>`<button class="btn opt${kind==='hear'?'':' txt'}" data-k="${k}" aria-label="${kind==='hear'?'Antwort '+(k+1):o.en}">${label(o)}</button>`).join('')}</div>
  <p class="fb" aria-live="polite"></p>`;
  const fb=app.querySelector('.fb'), btns=[...app.querySelectorAll('.opt')];
  const again=document.getElementById('again'); if(again) again.onclick=()=>speak(it.en);
  btns.forEach(b=>b.onclick=()=>{
    if(done) return; done=true;
    const ok=opts[+b.dataset.k]===it;
    btns.forEach(x=>{x.disabled=true; if(opts[+x.dataset.k]===it) x.classList.add('right');});
    if(ok){pop(b); addStars(1); starFly(b); fb.textContent=`${pick(PRAISE)} «${it.en}» heisst «${it.de}»`;}
    else{b.classList.add('wrong'); fb.textContent=`Richtig wäre: «${it.en}» – ${it.de}`;}
    grade(tid,it.en,ok);
    speak(it.en);
    setTimeout(()=>onDone(ok),ok?1500:2600);
  });
  if(kind==='hear') setTimeout(()=>speak(it.en),300);
}
function testQuestions(themes,n){
  // gleichmässig aus den Themen ziehen, damit ein Level-Test alle Themen abdeckt
  const bags=shuffle(themes).map(t=>shuffle(t.items).map(it=>({t,it})));
  const list=[];
  while(list.length<n&&bags.some(b=>b.length)) for(const b of bags){if(b.length&&list.length<n) list.push(b.pop());}
  // Aufgabenarten gleichmässig verteilen, dann mischen; Sätze dürfen statt «lesen» auch gebaut werden;
  // «sagen» nur, wenn die App zuhören kann
  const kinds=canSpeak()?['hear','read','translate','say']:['hear','read','translate'], k=kinds.length;
  return shuffle(shuffle(list).map((q,i)=>{
    let kind=q.it.s&&i%k===1?'build':kinds[i%k];
    if(kind==='say'&&!sayable(q.it)) kind='translate';
    return {...q,kind};
  }));
}
function runTest(key,title,back,themes,n){
  const qs=testQuestions(themes,n); let r=0, got=0, skipped=0;
  function round(){
    if(r>=qs.length) return testEnd(key,title,back,got,qs.length-skipped);
    const {t,it,kind}=qs[r];
    const head=topbar(back,title)+dots(qs.length,r)+(themes.length>1?`<p class="from">${t.icon} ${t.name}</p>`:'');
    const next=ok=>{if(ok===null) skipped++; else if(ok) got++; r++; round();};
    if(kind==='build') buildStep(t.id,it,head,next);
    else if(kind==='say') sayStep(t.id,it,t.items,head,next);
    else choiceStep(t.id,it,t.items,kind,head,next);
  }
  round();
}
function testEnd(key,title,back,got,n){
  const prev=bestOf(key), res=testResult(got,n,prev);
  data.tests[key]={best:res.best,last:res.pct,date:today()};
  const reward=key.startsWith('level:')?levelReward(data,+key.slice(6),res.passed,LEVEL_STICKERS):null;
  if(res.bonus) addStars(res.bonus); else save();
  markDay();
  const big=res.pct===100?'Alles richtig!':res.passed?'Bestanden!':res.pct>=50?'Gut gemacht!':'Weiter üben!';
  const improved=res.pct>prev&&prev>0?` Besser als dein bisher bestes Ergebnis (${prev} %)!`:'';
  app.innerHTML=`${topbar(back,'')}
  <div class="end"><div class="trophy">${res.medal?res.medal.icon:'💪'}</div><h2>${big}</h2>
  <p>${title}: ${got} von ${n} richtig (${res.pct} %).${res.medal?` Das ist ${res.medal.name}!`:' Ab 50 % gibt es eine Medaille.'}${improved}${res.bonus?` Dafür gibt es ${res.bonus===1?'einen Extra-Stern':res.bonus+' Extra-Sterne'}.`:''}</p>
  ${reward?`<p class="newstk">Neuer Spezial-Sticker: <span class="big">${reward}</span> ${LEVEL_STICKERS[key.slice(6)][1]}!</p>`:''}
  <div class="col">${key.startsWith('dialogpro:')?`<button class="btn sun" data-go="dialog:${key.slice(10)}:pro">Nochmal als Profi</button>`
  :key.startsWith('dialog:')?`<button class="btn sun" data-go="dialog:${key.slice(7)}">Nochmal reden</button>
  ${res.passed?`<button class="btn" data-go="dialog:${key.slice(7)}:pro">Jetzt als Profi 🌟🌟</button>`:''}`
  :key.startsWith('story:')?`<button class="btn sun" data-go="storyq:${key.slice(6)}">Fragen nochmal</button>
  <button class="btn" data-go="story:${key.slice(6)}:0">Geschichte nochmal lesen</button>`
  :`<button class="btn sun" data-go="${key.startsWith('level:')?'ltest:'+key.slice(6):'ttest:'+key.slice(6)}">Test nochmal machen</button>
  ${res.passed?'':'<button class="btn" data-go="practice">Mit «Heute üben» trainieren</button>'}`}
  ${reward?'<button class="btn" data-go="album">Zum Sticker-Album</button>':''}
  <button class="btn" data-go="${back}">Zurück</button></div></div>`;
}
function themeTest(id){const t=T(id); runTest('theme:'+id,'Test: '+t.name,'theme:'+id,[t],Math.min(10,t.items.length));}
function levelTest(n){const l=L(n); runTest('level:'+n,'Test '+l.name,'home',levelThemes(n),12);}

/* Sprechübungen */
const SR_HINT='Das Mikrofon ist nicht freigegeben (Einstellungen → Safari → Mikrofon). Deshalb hört ein Erwachsener zu.';
let micBlocked=false, micReason='';
/* Einstellung pro Gerät (eigener Schlüssel, nicht im Spielstand): input 'local' (die App hört zu) oder 'parent'.
   Die Safari-Spracherkennung und das Tastatur-Diktat wurden entfernt: auf dem iPad lieferte die eine meist
   nur Stille, das andere hing von der Tastatursprache ab. */
const MICKEY='englisch-lernen-mic';
/* Erkennung auf dem Gerät: Aufnahme über getUserMedia, Erkennung mit Whisper (Transformers.js).
   Bibliothek von cdn.jsdelivr.net, Modell (~41 MB) einmalig von huggingface.co, danach im Zwischenspeicher.
   Die Aufnahme verlässt das Gerät nicht. */
const ASR_LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
const ASR_MODEL='onnx-community/whisper-tiny.en';
let asrPromise=null, asrProgress=0;
const asrWatch=new Set();
function loadASR(){
  if(!asrPromise){
    const files={};
    let Tensor;
    asrPromise=import(ASR_LIB).then(lib=>{Tensor=lib.Tensor; return lib.pipeline('automatic-speech-recognition',ASR_MODEL,{
      dtype:{encoder_model:'q8',decoder_model_merged:'q8'}, device:'wasm',
      progress_callback:p=>{
        if(p.status!=='progress'||!p.total) return;
        files[p.file]=[p.loaded,p.total];
        const v=Object.values(files);
        asrProgress=v.reduce((a,x)=>a+x[0],0)/v.reduce((a,x)=>a+x[1],0);
        asrWatch.forEach(f=>f(asrProgress));
      }
    });}).then(asr=>{asrProgress=1; asrWatch.forEach(f=>f(1)); return {asr,Tensor};})
      .catch(e=>{asrPromise=null; throw e;});
  }
  return asrPromise;
}

/* Aufnahme mit automatischem Ende: Grundrauschen messen, Sprache erkennen, nach 0,9 s Stille fertig.
   Muss im Antippen gestartet werden (iOS). Liefert {audio: 16 kHz, speech} oder {error}. */
let recCtx=null, activeRecord=null;
function recordVoice(onLevel){
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!recCtx) recCtx=new AC();
  const resumed=recCtx.resume();
  const streamP=navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
  let finish, end=null, wantStop=false, cancelled=false;
  const result=new Promise(r=>finish=r);
  Promise.all([streamP,resumed]).then(([stream])=>{
    if(cancelled){stream.getTracks().forEach(t=>t.stop()); return finish(null);}
    const rate=recCtx.sampleRate;
    const src=recCtx.createMediaStreamSource(stream);
    const proc=recCtx.createScriptProcessor(4096,1,1);
    const chunks=[]; let noise=0, nN=0, speech=false, first=0, last=0, len=0, done=false;
    proc.onaudioprocess=e=>{
      if(done) return;
      const d=new Float32Array(e.inputBuffer.getChannelData(0)); chunks.push(d);
      let sum=0; for(let i=0;i<d.length;i++) sum+=d[i]*d[i];
      const rms=Math.sqrt(sum/d.length), t=len/rate; len+=d.length;
      if(t<.25){noise+=rms; nN++; return;}               // Grundrauschen
      const thr=Math.max(.012,(noise/Math.max(nN,1))*3);
      if(rms>thr){if(!speech){speech=true; first=t;} last=t;}
      if(onLevel) onLevel(Math.min(1,rms/thr/3));
      if((speech&&t-last>.9)||t>8||(!speech&&t>6)) end();
    };
    src.connect(proc); proc.connect(recCtx.destination);
    end=()=>{
      if(done) return; done=true;
      try{proc.disconnect(); src.disconnect();}catch(e){}
      stream.getTracks().forEach(t=>t.stop());
      if(cancelled) return finish(null);
      if(!speech) return finish({speech:false});
      // nur den gesprochenen Teil (mit etwas Rand) an Whisper geben
      const all=new Float32Array(len); let o=0; for(const c of chunks){all.set(c,o); o+=c.length;}
      const a=Math.max(0,Math.floor((first-.35)*rate)), b=Math.min(len,Math.ceil((last+.45)*rate));
      const clip=all.slice(a,b);
      finish({speech:true,audio:resample(clip,rate,16000),clip,rate});
    };
    if(wantStop) end();
  }).catch(e=>finish({error:e&&e.name==='NotAllowedError'?'not-allowed':'start'}));
  const api={result, stop:()=>{wantStop=true; if(end) end();}, cancel:()=>{cancelled=true; if(end) end(); else finish(null);}};
  activeRecord=api;
  result.then(()=>{if(activeRecord===api) activeRecord=null;});
  return api;
}
function stopRecording(){if(activeRecord){activeRecord.cancel(); activeRecord=null;}}
/* Prüfen, ob das erwartete Wort gesagt wurde. Whisper rät bei einzelnen Wörtern oft falsch («cow» → «Now»),
   darum zusätzlich bewerten, wie gut die Aufnahme zum erwarteten Text passt (Teacher-Forcing), im Vergleich
   zu den anderen Einträgen des Themas und zur freien Erkennung. Gemessen mit 4 Stimmen: Wörter 92 % statt
   57 % erkannt, falsche Wörter in 0,14 % angenommen; Sätze 100 %, falsche 0 %. */
const ASR_MARGIN=6;
async function checkSpoken(m,audio,target,pool,sentence){
  const {asr,Tensor}=m;
  const g=((await asr(audio)).text||'').replace(/\[[^\]]*\]|\([^)]*\)/g,'').trim();
  if(!g) return {error:'no-speech'};
  if(target==null) return {alts:[g],ok:null}; // freie Antwort (Gespräche): die Prüfung macht der Aufrufer
  if(heardOK(target,[g],sentence)) return {alts:[g],ok:true};
  const {model,tokenizer,processor}=asr, gc=model.generation_config;
  const {input_features}=await processor(audio);
  const enc=new Tensor((await model.sessions.model.run({input_features:input_features.ort_tensor})).last_hidden_state);
  const score=async text=>{
    const seq=[gc.decoder_start_token_id,gc.no_timestamps_token_id,...tokenizer.encode(text,{add_special_tokens:false}),gc.eos_token_id];
    const ids=new Tensor('int64',BigInt64Array.from(seq.slice(0,-1).map(BigInt)),[1,seq.length-1]);
    const L=(await model({encoder_outputs:enc,decoder_input_ids:ids})).logits, V=L.dims[2], d=L.data;
    let sum=0;
    for(let i=1;i<seq.length-1;i++){ // Position i sagt das Token seq[i+1] voraus
      const o=i*V; let mx=-1e9; for(let j=0;j<V;j++) if(d[o+j]>mx) mx=d[o+j];
      let z=0; for(let j=0;j<V;j++) z+=Math.exp(d[o+j]-mx);
      sum+=d[o+seq[i+1]]-mx-Math.log(z);
    }
    return sum;
  };
  const cap=t=>t[0].toUpperCase()+t.slice(1);
  const asWritten=t=>' '+(sentence?t:cap(t)+'.');
  const st=Math.max(await score(asWritten(target)),await score(' '+target));
  const sg=await score(' '+g);
  let ok=st>=sg-ASR_MARGIN;
  // nur gegen die 8 Einträge antreten, die dem Gehörten am ähnlichsten sind (die übrigen haben keine Chance)
  const ng=norm(g), rivals=pool.filter(x=>x!==target).sort((x,y)=>editDist(norm(x),ng)-editDist(norm(y),ng)).slice(0,8);
  for(const x of rivals){ if(!ok) break; if(await score(asWritten(x))>st) ok=false; }
  return {alts:[g],ok};
}

/* Aufnehmen und prüfen. onState('listen'|'think') für die Anzeige. Liefert {alts, ok} oder {error}. */
function hearLocal(onState,onLevel,target,pool,sentence){
  const rec=recordVoice(onLevel);
  onState('listen');
  const result=rec.result.then(async r=>{
    if(!r) return null;
    if(r.error) return {error:r.error};
    if(!r.speech) return {error:'no-speech'};
    onState('think');
    const res=await checkSpoken(await loadASR(),r.audio,target,pool,sentence);
    return Object.assign(res,{clip:r.clip,rate:r.rate});
  }).catch(e=>({error:'asr',detail:String(e&&e.message||e)}));
  // Aufnahme ohne Sprache oder bei Fehlern trotzdem anhörbar machen

  return {result, stop:rec.stop};
}

const LOCAL_OK=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.WebAssembly&&(window.AudioContext||window.webkitAudioContext));
let micOpts={v:5,input:LOCAL_OK?'local':'parent'};
try{
  const m=JSON.parse(localStorage.getItem(MICKEY)||'null');
  if(m) micOpts.input=m.input==='parent'||!LOCAL_OK?'parent':'local'; // ältere Einstellungen übernehmen
}catch(e){}
function saveMic(){try{localStorage.setItem(MICKEY,JSON.stringify(micOpts))}catch(e){}}

const canSpeak=()=>micOpts.input==='local'&&LOCAL_OK&&!micBlocked;
const micErrorText=e=>e==='no-speech'?'Ich habe nichts gehört. Sprich etwas lauter.'
  :e==='asr'?'Die Spracherkennung konnte nicht geladen werden. Ist Internet da? Probier es nochmal.'
  :'Das Mikrofon hat nicht geklappt. Probier es nochmal.';
/* Mikrofon-Knopf: wartet auf die Spracherkennung (mit Fortschritt), nimmt auf, prüft und meldet das Ergebnis.
   Ein zweites Antippen beendet die Aufnahme. 🎧 (o.me) spielt die eigene Aufnahme ab.
   Bei verweigertem Mikrofon wird auf den Eltern-Check umgestellt (micBlocked). */
function attachMic(o){
  const {btn,me,hint}=o; let busy=false, cur=null, clip=null;
  if(me) me.onclick=()=>playClip(clip);
  if(asrProgress<1){
    btn.disabled=true;
    const show=v=>{
      if(!document.body.contains(btn)){asrWatch.delete(show); return;}
      if(v<1) hint.textContent=`Die Spracherkennung wird vorbereitet … ${Math.round(v*100)} %`;
      else{asrWatch.delete(show); if(!busy){btn.disabled=false; hint.textContent=o.idle;}}
    };
    asrWatch.add(show); show(asrProgress);
    loadASR().catch(()=>{
      asrWatch.delete(show);
      if(!document.body.contains(btn)) return;
      btn.disabled=false;
      hint.textContent='Die Spracherkennung konnte nicht geladen werden. Ist Internet da? Tipp aufs Mikrofon, um es nochmal zu versuchen.';
    });
  }
  btn.onclick=()=>{
    if(o.isDone()) return;
    if(busy){ if(cur) cur.stop(); return; }
    busy=true;
    if(speechOK) speechSynthesis.cancel();
    btn.classList.add('live');
    cur=hearLocal(st=>{
      if(st==='listen') hint.textContent='Ich höre zu … sprich jetzt!';
      if(st==='think'){btn.classList.remove('live'); btn.classList.add('think'); hint.textContent='Ich überlege …';}
    },v=>btn.style.setProperty('--lvl',v.toFixed(2)),o.target,o.pool,o.sentence);
    cur.result.then(res=>{
      busy=false; cur=null; btn.classList.remove('live','think'); btn.style.removeProperty('--lvl');
      if(!res||o.isDone()||!document.body.contains(btn)) return;
      if(res.clip){clip=res; if(me) me.hidden=false; if(o.onClip) o.onClip(res);}
      if(res.alts&&res.ok!=null) countSpeak(res.ok);
      hint.textContent=clip?'Tipp auf 🎧, um dich selbst zu hören.':o.idle;
      if(res.error==='not-allowed'){micBlocked=true; micReason=SR_HINT;}
      o.onResult(res);
    });
  };
}

function countSpeak(ok){data.speak.n++; if(ok) data.speak.ok++; save();}
/* Rückmeldung pro Wort bei Sätzen: grün erkannt, rot noch nicht (bei Erfolg alles grün) */
function wordFbHTML(target,heard,ok){
  return wordMatch(target,heard||'').map(x=>`<span class="${ok||x.ok?'wok':'wmiss'}">${x.w}</span>`).join(' ');
}
function showWordFb(el,target,heard,ok){
  if(!el) return;
  el.hidden=false; el.innerHTML=wordFbHTML(target,heard,ok)+(ok?'':'<span class="wlegend">Rot = noch nicht erkannt</span>');
}

/* Aufgabe «Sag es auf Englisch»: Bild und Deutsch sehen, das englische Wort selbst sagen (ohne Vorsprechen).
   Zwei Versuche; «Weiss ich nicht» zählt als falsch. onDone(null), wenn das Mikrofon nicht geht (zählt nicht). */
function sayStep(tid,it,pool,head,onDone){
  let done=false, tries=0;
  app.innerHTML=`${head}
  <div class="bcard">${vis(it,'md')}<p class="qde">${it.de}</p><p class="de" id="sayq">Sag es auf Englisch!</p></div>
  <div class="ctrl"><button class="btn mic sun" id="smic" aria-label="Jetzt sprechen">🎤</button><button class="btn round" id="me" hidden aria-label="Meine Aufnahme anhören">🎧</button></div>
  <p class="hint" id="hint">Tipp aufs Mikrofon und sag es auf Englisch.</p>
  <p class="wordfb" id="wfb" hidden></p>
  <p class="fb" aria-live="polite"></p>
  <button class="btn small skip" id="dunno">Weiss ich nicht</button>`;
  const fb=app.querySelector('.fb'), hint=document.getElementById('hint'), btn=document.getElementById('smic');
  const finish=ok=>{
    if(done) return; done=true; btn.disabled=true; document.getElementById('dunno').hidden=true;
    grade(tid,it.en,ok);
    document.getElementById('sayq').innerHTML=`<span class="word${it.s?' sent':''}">${it.en}</span>`;
    if(ok){addStars(1); starFly(btn); pop(btn); fb.textContent=`${pick(PRAISE)} Das hast du toll gesagt!`;}
    else fb.textContent=`Es heisst «${it.en}». Hör gut zu!`;
    speak(it.en);
    setTimeout(()=>onDone(ok),ok?1900:3000);
  };
  document.getElementById('dunno').onclick=()=>finish(false);
  attachMic({btn,me:document.getElementById('me'),hint,target:it.en,pool:pool.map(x=>x.en),sentence:!!it.s,
    idle:'Tipp aufs Mikrofon und sag es auf Englisch.',isDone:()=>done,
    onResult:res=>{
      if(res.error){
        if(res.error==='not-allowed'){done=true; fb.textContent='Das Mikrofon ist nicht freigegeben. Diese Aufgabe zählt nicht.'; setTimeout(()=>onDone(null),2200); return;}
        fb.textContent=micErrorText(res.error); return;
      }
      if(it.s) showWordFb(document.getElementById('wfb'),it.en,res.alts[0],res.ok);
      if(res.ok) return finish(true);
      if(++tries>=2) return finish(false);
      fb.textContent=`Ich habe «${res.alts[0]}» verstanden. Probier es nochmal!`;
    }});
}
const sayable=it=>!it.s||it.en.split(' ').length<=5;

/* Spracherkennung im Hintergrund vorladen, damit beim ersten Sprechen niemand warten muss */
let preloadPlanned=false;
function schedulePreload(){
  if(preloadPlanned||asrPromise||!canSpeak()) return;
  if(navigator.connection&&navigator.connection.saveData) return;
  preloadPlanned=true;
  setTimeout(()=>{(window.requestIdleCallback||(f=>f()))(()=>loadASR().catch(()=>{preloadPlanned=false;}));},5000);
}

/* «Hör dich selbst»: die letzte Aufnahme abspielen */
function playClip(c){
  if(!c||!recCtx) return;
  try{
    if(speechOK) speechSynthesis.cancel();
    recCtx.resume();
    const b=recCtx.createBuffer(1,c.clip.length,c.rate); b.copyToChannel(c.clip,0);
    const s=recCtx.createBufferSource(); s.buffer=b; s.connect(recCtx.destination); s.start();
  }catch(e){}
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
    const it=rounds[r]; let tries=0, done=false, busy=false, clip=null;
    const mode=micOpts.input==='local'&&LOCAL_OK&&!micBlocked?'local':'parent';
    const reason=mode==='local'?'':micBlocked?micReason:micOpts.input==='parent'?'Ein Erwachsener hört zu (eingestellt unter «Für Eltern»).':'Dieses Gerät kann keine Aufnahme machen. Deshalb hört ein Erwachsener zu.';
    app.innerHTML=`${topbar('theme:'+id,'Sprechen')}
    ${dots(rounds.length,r)}
    <div class="stage static">${vis(it,'lg')}<span class="word${it.s?' sent':''}">${it.en}</span><span class="de">auf Deutsch: ${it.de}</span></div>
    <div class="ctrl"><button class="btn round" id="hear" aria-label="Vorlage anhören">🔊</button><button class="btn round" id="slow" aria-label="Langsam anhören">🐢</button>
    ${mode==='local'?'<button class="btn mic sun" id="lmic" aria-label="Jetzt sprechen">🎤</button><button class="btn round" id="me" hidden aria-label="Meine Aufnahme anhören">🎧</button>'
      :'<button class="btn sun said" id="said">Ich hab\'s gesagt</button>'}</div>
    <div class="check" id="check" hidden><p>Eltern-Check: Hat es richtig geklungen?</p><div class="ctrl"><button class="btn sun" id="yes">Ja, richtig ✓</button><button class="btn" id="again2">Nochmal üben</button></div></div>
    <p class="hint" id="hint">${mode==='local'?'Hör zu, dann tipp aufs Mikrofon und sprich nach.':'Hör zu und sprich laut nach. Dann tipp auf «Ich hab\'s gesagt».'}</p>
    ${reason?`<p class="hint small">${reason}</p>`:''}
    <p class="wordfb" id="wfb" hidden></p>
    <p class="fb" aria-live="polite"></p>
    <button class="btn small skip" id="skip">Überspringen</button>`;
    const fb=app.querySelector('.fb'), hint=document.getElementById('hint'), skip=document.getElementById('skip');
    if(note) fb.textContent=note;
    const next=()=>{stopRecording(); r++; round();};
    const success=el=>{
      done=true; got++; grade(id,it.en,true); addStars(1); starFly(el); pop(el);
      fb.textContent=pick(PRAISE)+' Das hast du toll gesagt!';
      setTimeout(next,clip?2600:1900);
    };
    const wrong=heard=>{
      tries++;
      fb.textContent=`Ich habe «${heard||'…'}» verstanden. Hör nochmal zu und probier es wieder!`;
      if(tries>=2){skip.textContent='Weiter'; skip.classList.add('sun');}
      setTimeout(()=>speak(it.en),500);
    };
    document.getElementById('hear').onclick=()=>speak(it.en);
    document.getElementById('slow').onclick=()=>speak(it.en,true);
    skip.onclick=()=>{if(done) return; if(tries) grade(id,it.en,false); next();};

    // Eltern-Check
    const said=document.getElementById('said'), check=document.getElementById('check');
    if(said){
      said.onclick=()=>{if(done)return; said.hidden=true; check.hidden=false; fb.textContent='';};
      document.getElementById('yes').onclick=()=>{if(done)return; check.hidden=true; said.hidden=false; success(said);};
      document.getElementById('again2').onclick=()=>{check.hidden=true; said.hidden=false; fb.textContent='Hör nochmal genau zu und sprich es nach.'; speak(it.en);};
    }

    // Die App hört zu (Erkennung auf dem Gerät)
    const lmic=document.getElementById('lmic');
    if(lmic) attachMic({btn:lmic,me:document.getElementById('me'),hint,target:it.en,pool:t.items.map(x=>x.en),sentence:sent,
      idle:'Hör zu, dann tipp aufs Mikrofon und sprich nach.',isDone:()=>done,
      onClip:c=>{clip=c;},
      onResult:res=>{
        if(res.error){
          if(res.error==='not-allowed') return round('Das Mikrofon ist nicht freigegeben. Sprich einfach laut nach.');
          fb.textContent=micErrorText(res.error); return;
        }
        if(sent) showWordFb(document.getElementById('wfb'),it.en,res.alts[0],res.ok);
        if(res.ok) success(lmic); else wrong(res.alts[0]);
      }});
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
  stopRecording();
  const [s,id,arg]=route.split(':');
  if(speechOK) speechSynthesis.cancel();
  window.scrollTo(0,0);
  if(s==='home') home();
  else if(s==='practice') practice();
  else if(s==='parents') parents();
  else if(s==='album') album();
  else if(s==='theme') theme(id);
  else if(s==='explore') explore(id,+(arg||0));
  else if(s==='quiz') quiz(id);
  else if(s==='memory') memory(id);
  else if(s==='build') build(id);
  else if(s==='speak') speakMode(id);
  else if(s==='ttest') themeTest(id);
  else if(s==='ltest') levelTest(id);
  else if(s==='story') story(id,+(arg||0));
  else if(s==='storyq') storyQuiz(id);
  else if(s==='dialog') dialogPlay(id,arg==='pro');
  else if(s==='dialogmenu') dialogMenu(id);
}
app.addEventListener('click',e=>{const b=e.target.closest('[data-go]'); if(b) go(b.dataset.go);});
home();

/* Offline-Betrieb und Installation (nur über https oder localhost) */
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
