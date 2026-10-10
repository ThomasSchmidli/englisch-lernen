/* Reine Logik ohne Anzeige: Datum, Spielstand-Format, Wiederholung, Serie, Sprachvergleich, Test-Auswertung.
   Wird von js/app.js genutzt und von scripts/test.js automatisch geprüft. Braucht NUM_EN aus js/data.js. */

/* Datum als «JJJJ-MM-TT» in Ortszeit */
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>fmt(new Date());
function addDays(s,n){const [y,m,d]=s.split('-').map(Number); return fmt(new Date(y,m-1,d+n));}

/* Spielstand: stars, known (gelernt pro Thema), srs (Wiederholung pro Eintrag), streak (Tage hintereinander),
   bonus (Datum der letzten Extra-Sterne), tests (bestes Ergebnis pro Test, z. B. 'theme:animals' oder 'level:1'),
   stickers (freigeschaltete Sticker-Emojis), earned (alle je verdienten Sterne; stars ist das, was noch übrig ist),
   speak (Sprechversuche n und davon erkannt ok, für die Übersicht der Eltern),
   log (letzte Antworten für die Fehler-Auswertung der Eltern, siehe addLog) */
const fresh=()=>({stars:0,known:{},srs:{},streak:{n:0,last:''},bonus:'',tests:{},stickers:[],earned:0,speak:{n:0,ok:0},log:[]});
/* Gespeicherte Daten (auch ältere Formate und Sicherungen) in die aktuelle Form bringen */
function normalize(d,day=today()){
  if(!d||typeof d!=='object'||typeof d.stars!=='number'||typeof (d.known||{})!=='object') return null;
  const x={stars:d.stars||0,known:d.known||{},srs:d.srs||{},streak:d.streak||{n:0,last:''},bonus:d.bonus||'',tests:d.tests||{},
    stickers:Array.isArray(d.stickers)?d.stickers:[],earned:typeof d.earned==='number'?d.earned:d.stars||0,
    speak:d.speak&&typeof d.speak.n==='number'?d.speak:{n:0,ok:0},log:Array.isArray(d.log)?d.log:[]};
  // Übernahme aus v1 ohne Wiederholung: Gelerntes kommt heute zum ersten Mal wieder
  for(const tid in x.known) for(const en of x.known[tid]){const k=tid+'|'+en; if(!x.srs[k]) x.srs[k]={l:1,d:day};}
  return x;
}

/* Wiederholung: Stufe 0–5. Richtig = eine Stufe höher und später wieder (1, 2, 4, 7, 14 Tage),
   falsch = Stufe 0 und morgen wieder; w zählt die Fehler (für die Übersicht der Eltern). */
const GAP=[1,1,2,4,7,14];
function review(s,ok,day){
  s=Object.assign({l:0,d:day,w:0},s);
  if(ok){s.l=Math.min(5,s.l+1); s.d=addDays(day,GAP[s.l]);}
  else{s.l=0; s.d=addDays(day,1); s.w=(s.w||0)+1;}
  return s;
}
/* Serie: an einem neuen Tag +1, wenn gestern geübt wurde, sonst wieder 1 */
function nextStreak(st,day){
  if(st.last===day) return st;
  return {n:st.last===addDays(day,-1)?st.n+1:1,last:day};
}
const streakValue=(st,day)=>(st.last===day||st.last===addDays(day,-1))?st.n:0;

/* Vergleich von Gesprochenem mit dem Ziel. SOUNDS: gleich klingende Wörter und amerikanische Varianten */
const SOUNDS={one:['won'],two:['to','too'],four:['for'],eight:['ate'],eye:['i','aye'],ear:['year','here'],
  mum:['mom','mam','mommy'],sun:['son'],grey:['gray'],grandma:['grandmother'],grandpa:['grandfather']};
function norm(s){
  return s.toLowerCase().replace(/[’`]/g,"'")
    .replace(/\b(\d{1,2})(:00| ?o'?clock)/g,"$1 o'clock")
    .replace(/\b(\d{1,2})\b/g,(m,d)=>(+d>=1&&+d<=20)?NUM_EN[+d-1]:m)
    .replace(/\bo ?'?clock\b/g,"o'clock")
    .replace(/\bi'm\b/g,'i am').replace(/\bit'?s\b/g,'it is').replace(/\bwhat's\b/g,'what is')
    .replace(/\bdo not\b/g,"don't")
    .replace(/[^a-z' ]+/g,' ').replace(/\s+/g,' ').trim();
}
/* Alle Zielwörter müssen vorkommen. Nur bei Sätzen ab 5 Wörtern darf eines fehlen
   (bei «It's three o'clock.» wäre ein fehlendes Wort genau die Uhrzeit). */
function heardOK(target,alts,sentence){
  const tw=norm(target).split(' '); let miss=tw.length;
  for(const a of alts){
    const aw=new Set(norm(a).split(' '));
    miss=Math.min(miss,tw.filter(w=>!aw.has(w)&&!(SOUNDS[w]||[]).some(x=>aw.has(x))).length);
  }
  return miss===0||(sentence&&tw.length>=5&&miss===1);
}
function editDist(a,b){
  const d=Array.from({length:b.length+1},(_,j)=>j);
  for(let i=1;i<=a.length;i++){
    let prev=d[0]; d[0]=i;
    for(let j=1;j<=b.length;j++){const t=d[j]; d[j]=Math.min(d[j]+1,d[j-1]+1,prev+(a[i-1]===b[j-1]?0:1)); prev=t;}
  }
  return d[b.length];
}
function resample(x,from,to){
  if(from===to) return new Float32Array(x);
  const n=Math.round(x.length*to/from), y=new Float32Array(n), k=from/to;
  for(let i=0;i<n;i++){const p=i*k, j=Math.floor(p), f=p-j; y[i]=(x[j]||0)*(1-f)+(x[j+1]||0)*f;}
  return y;
}

/* Tests: Medaille nach Prozent; bestanden ab 75 %. Extra-Sterne nur, wenn die Medaille besser ist als bisher. */
const MEDALS=[[90,'🥇','Gold',5],[75,'🥈','Silber',3],[50,'🥉','Bronze',1]];
function medalFor(pct){const m=MEDALS.find(x=>pct>=x[0]); return m?{icon:m[1],name:m[2],stars:m[3]}:null;}
function testResult(got,n,prevBest=0){
  const pct=n?Math.round(got/n*100):0, medal=medalFor(pct), prev=medalFor(prevBest);
  const bonus=medal&&(!prev||medal.stars>prev.stars)?medal.stars-(prev?prev.stars:0):0;
  return {pct,medal,passed:pct>=75,best:Math.max(pct,prevBest),bonus};
}

/* Sticker: mit Sternen kaufen (verändert d); false, wenn schon vorhanden oder zu wenig Sterne */
function buySticker(d,emo,cost){
  if(d.stickers.includes(emo)||d.stars<cost) return false;
  d.stars-=cost; d.stickers.push(emo); return true;
}
/* Ein Sticker-Pack ist offen, wenn es keine Bedingung hat oder der Test von Level need bestanden ist (ab 75 %) */
const packOpen=(d,pack)=>!pack.need||((d.tests['level:'+pack.need]||{}).best||0)>=75;
/* Spezial-Sticker für einen bestandenen Level-Test; liefert das neue Emoji oder null */
function levelReward(d,level,passed,rewards){
  const r=rewards[level];
  if(!passed||!r||d.stickers.includes(r[0])) return null;
  d.stickers.push(r[0]); return r[0];
}

/* Rückmeldung pro Wort: welche Wörter des Ziels in der Erkennung vorkommen (für die Anzeige grün/rot) */
function wordMatch(target,heard){
  const aw=new Set(norm(heard).split(' '));
  return target.split(/\s+/).filter(Boolean).map(w=>{
    const n=norm(w).split(' '); // «It's» → «it is»
    return {w,ok:n.every(x=>!x||aw.has(x)||(SOUNDS[x]||[]).some(y=>aw.has(y)))};
  });
}

/* Gespräche: Antwortmuster mit freien Teilen, z. B. 'my name is {name}' oder 'i like {food}'.
   Liefert {ok, slots} – slots enthält, was an den freien Stellen gesagt wurde (z. B. {name:'lena'}). */
function slotPattern(slot){
  const items=ids=>THEMES.filter(t=>ids.includes(t.id)).flatMap(t=>t.items.map(i=>norm(i.en)));
  const alt=list=>'('+[...new Set(list)].sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')';
  const plural=list=>list.flatMap(x=>[x,x+'s',x+'es']);
  switch(slot){
    case 'name': return "([a-z']+(?: [a-z']+)?)";
    case 'number': return alt(NUM_EN);
    case 'color': return alt(items(['colors']).concat(['gray']));
    case 'animal': return "(?:a |an |the )?"+alt(plural(items(['animals','zoo'])));
    case 'food': return "(?:a |an |some |the )?"+alt(plural(items(['food'])));
    case 'weather': return alt(['sunny','raining','rainy','snowing','snowy','windy','cloudy','cold','hot','warm','nice','foggy']);
    case 'body': return "(?:my |a )?"+alt(items(['body']).concat(['head','tummy','stomach','throat','back','knee','neck','eyes','ears','teeth','feet']));
    case 'country': return alt(items(['countries']).concat(['england','the uk','the usa','austria','portugal','turkey','kosovo','serbia']));
    case 'any': return '(.+)';
    default: throw new Error('Unbekannter Platzhalter '+slot);
  }
}
function dialogMatch(heard,answers){
  const h=' '+norm(heard)+' ';
  for(const a of answers){
    const names=[];
    // Platzhalter als reine Buchstaben (qqslota, qqslotb …), weil norm() Ziffern und Zeichen entfernt
    const re=' '+norm(a.replace(/\{(\w+)\}/g,(m,n)=>{names.push(n); return ' qqslot'+'abcdefgh'[names.length-1]+' ';}))+' ';
    const src=re.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/qqslot([a-h])/g,(m,c)=>slotPattern(names['abcdefgh'.indexOf(c)]));
    const m=h.match(new RegExp(src));
    if(m){const slots={}; names.forEach((n,i)=>slots[n]=m[i+1].trim()); return {ok:true,slots};}
  }
  return {ok:false,slots:{}};
}
/* {name} usw. in einem Satz der Figur durch das Gesagte ersetzen (Namen mit grossem Anfangsbuchstaben) */
const SLOT_DEFAULT={name:'friend',number:'that',color:'That colour',animal:'that animal',food:'that',weather:'nice',any:'that',body:'poor thing',country:'nice'};
function fillSlots(text,slots){
  const t=text.replace(/\{(\w+)\}/g,(m,n)=>{
    const v=slots[n]; if(!v) return SLOT_DEFAULT[n]||'';
    return n==='name'||n==='country'?v.replace(/\b[a-z]/g,c=>c.toUpperCase()):v;
  }).replace(/\s+([,!?.])/g,'$1').replace(/\s{2,}/g,' ').trim();
  return t.charAt(0).toUpperCase()+t.slice(1);
}

/* Heute üben: nur bereits gelernte Einträge (known). Zuerst die fälligen (tiefe Stufe zuerst),
   aufgefüllt mit anderen gelernten, die am ehesten wieder dran wären. mix: Mischfunktion (für Tests ersetzbar). */
function practicePick(themes,d,day,n,mix=x=>x){
  const learned=themes.flatMap(t=>(d.known[t.id]||[])
    .map(en=>t.items.find(i=>i.en===en)).filter(Boolean)
    .map(it=>({t,it,s:d.srs[t.id+'|'+it.en]||{l:1,d:day}})));
  const byNeed=(a,b)=>a.s.l-b.s.l||(a.s.d<b.s.d?-1:a.s.d>b.s.d?1:0);
  const due=mix(learned.filter(x=>x.s.d<=day)).sort(byNeed);
  const rest=mix(learned.filter(x=>x.s.d>day)).sort(byNeed);
  return {learned:learned.length,due:due.length,list:due.concat(rest).slice(0,n)};
}

/* Fehler-Auswertung für Eltern. Ein Eintrag pro Antwort: {d: Tag, t: Thema/Geschichte/Gespräch, e: Ziel,
   k: Übungsart, ok: 1/0, a: gewählte/gehörte Antwort bei Fehlern}. Nur die letzten LOG_MAX Einträge bleiben. */
const LOG_MAX=500;
const KINDS={hear:'Hören',read:'Lesen',translate:'Übersetzen',build:'Satz bauen',
  say:'Selbst sagen',speak:'Nachsprechen',story:'Geschichten',dialog:'Gespräche'};
function addLog(log,e){
  log.push(e);
  if(log.length>LOG_MAX) log.splice(0,log.length-LOG_MAX);
  return log;
}
const rate=x=>x.n?Math.round(x.wrong/x.n*100):0;
function errorStats(log,day,days=14){
  const kinds={}, themes={}, conf={}, byDay={};
  const add=(o,key,ok)=>{const x=o[key]=o[key]||{n:0,wrong:0}; x.n++; if(!ok) x.wrong++;};
  for(const x of log){
    add(kinds,x.k,x.ok); add(themes,x.t,x.ok); add(byDay,x.d,x.ok);
    if(!x.ok&&x.a){
      const key=[x.t,x.e,x.a.toLowerCase(),x.k].join('|');
      (conf[key]=conf[key]||{t:x.t,e:x.e,a:x.a,k:x.k,n:0}).n++;
    }
  }
  const list=[];
  for(let i=days-1;i>=0;i--){const d=addDays(day,-i); list.push({d,...(byDay[d]||{n:0,wrong:0})});}
  return {total:log.length,wrong:log.filter(x=>!x.ok).length,kinds,themes,
    confusions:Object.values(conf).sort((a,b)=>b.n-a.n),days:list};
}
/* Letzter Fehler zu einem Eintrag (für die Liste der schwierigen Wörter) */
function lastMistake(log,t,e){
  for(let i=log.length-1;i>=0;i--){const x=log[i]; if(!x.ok&&x.t===t&&x.e===e) return x;}
  return null;
}
