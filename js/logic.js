/* Reine Logik ohne Anzeige: Datum, Spielstand-Format, Wiederholung, Serie, Sprachvergleich, Test-Auswertung.
   Wird von js/app.js genutzt und von scripts/test.js automatisch geprüft. Braucht NUM_EN aus js/data.js. */

/* Datum als «JJJJ-MM-TT» in Ortszeit */
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>fmt(new Date());
function addDays(s,n){const [y,m,d]=s.split('-').map(Number); return fmt(new Date(y,m-1,d+n));}

/* Spielstand: stars, known (gelernt pro Thema), srs (Wiederholung pro Eintrag), streak (Tage hintereinander),
   bonus (Datum der letzten Extra-Sterne), tests (bestes Ergebnis pro Test, z. B. 'theme:animals' oder 'level:1') */
const fresh=()=>({stars:0,known:{},srs:{},streak:{n:0,last:''},bonus:'',tests:{}});
/* Gespeicherte Daten (auch ältere Formate und Sicherungen) in die aktuelle Form bringen */
function normalize(d,day=today()){
  if(!d||typeof d!=='object'||typeof d.stars!=='number'||typeof (d.known||{})!=='object') return null;
  const x={stars:d.stars||0,known:d.known||{},srs:d.srs||{},streak:d.streak||{n:0,last:''},bonus:d.bonus||'',tests:d.tests||{}};
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
