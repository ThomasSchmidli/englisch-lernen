/* Automatische Tests für js/logic.js. Aufruf: node scripts/test.js */
const fs=require('fs'), path=require('path'), vm=require('vm'), assert=require('assert');
const root=path.join(__dirname,'..');
const ctx={}; vm.createContext(ctx);
for(const f of ['js/data.js','js/logic.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const run=code=>vm.runInContext(code,ctx);
const L=run('({addLog,errorStats,lastMistake,LOG_MAX,KINDS,packOpen,practicePick,DIALOGS,wordMatch,dialogMatch,fillSlots,THEMES,LEVELS,STICKER_PACKS,LEVEL_STICKERS,buySticker,levelReward,norm,heardOK,editDist,resample,addDays,normalize,fresh,review,nextStreak,streakValue,medalFor,testResult})');

let failed=0, passed=0;
// Objekte aus dem vm-Kontext haben andere Prototypen: als JSON vergleichen
const eq=(a,b)=>assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),b);
function test(name,fn){
  try{fn(); passed++;}
  catch(e){failed++; console.error(`✗ ${name}\n  ${e.message.split('\n').join('\n  ')}`);}
}

/* Sprachvergleich: was die Erkennung schreibt, muss zum Ziel passen (oder eben nicht) */
const yes=[
  ['dog','Dog.',false],['dog','== Dog',false],['ice cream','Ice cream!',false],
  ['one','1',false],['twenty','20.',false],['eight','ate',false],['two','too',false],
  ['grey','gray',false],['mum','Mom',false],['T-shirt','t shirt',false],
  ["It's three o'clock.","It's 3 o'clock.",true],["It's three o'clock.","Its 3 o'clock",true],
  ["It's nine o'clock.","it is 9:00",true],["It's one o'clock.","It's one o clock.",true],
  ['I am happy.',"I'm happy.",true],['What is your name?',"What's your name?",true],
  ['Where is Mum?','Where is mom?',true],['I can ride a bike.','I can write a bike.',true],
  ["I don't like rain.",'I do not like rain.',true],['Can I have an apple, please?','can I have an apple please',true],
];
const no=[
  ['cow','banana',false],['cat','cut',false],['duck','frog',false],
  ['I can run.','I can swim.',true],["It's three o'clock.","It's five o'clock.",true],
  ['I like apples.',"I don't like carrots.",true],['Where is the cat?','Where is my ball?',true],
  ['I have a dog.','I have a cat.',true],['Monday','Sunday',false],
];
for(const [t,h,s] of yes) test(`«${h}» passt zu «${t}»`,()=>assert.ok(L.heardOK(t,[h],s)));
for(const [t,h,s] of no) test(`«${h}» passt nicht zu «${t}»`,()=>assert.ok(!L.heardOK(t,[h],s)));
test('mehrere Alternativen: eine reicht',()=>assert.ok(L.heardOK('dog',['dock','Dog'],false)));
test('norm entfernt Satzzeichen und Grossschreibung',()=>assert.strictEqual(L.norm('  Hello, WORLD!! '),'hello world'));
test('editDist',()=>{assert.strictEqual(L.editDist('cow','cau'),2); assert.strictEqual(L.editDist('',''),0); assert.strictEqual(L.editDist('dog','dog'),0);});
test('resample halbiert die Länge',()=>{const y=L.resample(new Float32Array(32000).fill(.5),32000,16000); assert.strictEqual(y.length,16000); assert.ok(Math.abs(y[100]-.5)<1e-6);});

/* Datum */
test('addDays über Monats- und Jahresende',()=>{
  assert.strictEqual(L.addDays('2026-01-31',1),'2026-02-01');
  assert.strictEqual(L.addDays('2026-12-31',1),'2027-01-01');
  assert.strictEqual(L.addDays('2028-03-01',-1),'2028-02-29');
});

/* Wiederholung */
test('richtig: Stufe steigt, Abstände 1, 2, 4, 7, 14 Tage',()=>{
  let s; const day='2026-10-10', gaps=[];
  for(let i=0;i<6;i++){s=L.review(s,true,day); gaps.push(s.d);}
  assert.deepStrictEqual(gaps,['2026-10-11','2026-10-12','2026-10-14','2026-10-17','2026-10-24','2026-10-24']);
  assert.strictEqual(s.l,5);
});
test('falsch: zurück auf Stufe 0, morgen wieder, Fehler gezählt',()=>{
  let s={l:4,d:'2026-10-20',w:1};
  s=L.review(s,false,'2026-10-10');
  assert.deepStrictEqual([s.l,s.d,s.w],[0,'2026-10-11',2]);
});
test('alte Einträge ohne Fehlerzähler',()=>assert.strictEqual(L.review({l:2,d:'2026-10-10'},false,'2026-10-10').w,1));

/* Serie */
test('Serie: gestern geübt → +1, Lücke → 1, gleicher Tag → gleich',()=>{
  eq(L.nextStreak({n:3,last:'2026-10-09'},'2026-10-10'),{n:4,last:'2026-10-10'});
  eq(L.nextStreak({n:3,last:'2026-10-07'},'2026-10-10'),{n:1,last:'2026-10-10'});
  eq(L.nextStreak({n:3,last:'2026-10-10'},'2026-10-10'),{n:3,last:'2026-10-10'});
  assert.strictEqual(L.streakValue({n:3,last:'2026-10-08'},'2026-10-10'),0);
  assert.strictEqual(L.streakValue({n:3,last:'2026-10-09'},'2026-10-10'),3);
});

/* Spielstand */
test('Spielstand aus Version 1 wird übernommen',()=>{
  const x=L.normalize({stars:7,known:{animals:['dog']}},'2026-10-10');
  assert.strictEqual(x.stars,7);
  eq(x.srs['animals|dog'],{l:1,d:'2026-10-10'});
  eq(x.tests,{});
});
test('ungültige Sicherungen werden abgelehnt',()=>{
  for(const bad of [null,'x',{},{stars:'5'},{foo:1}]) assert.strictEqual(L.normalize(bad),null);
});
test('neuer Spielstand hat alle Felder',()=>assert.deepStrictEqual(Object.keys(L.fresh()).sort(),['bonus','earned','known','log','speak','srs','stars','stickers','streak','tests']));

/* Tests und Medaillen */
test('Medaillen',()=>{
  assert.strictEqual(L.medalFor(100).icon,'🥇'); assert.strictEqual(L.medalFor(90).icon,'🥇');
  assert.strictEqual(L.medalFor(89).icon,'🥈'); assert.strictEqual(L.medalFor(75).icon,'🥈');
  assert.strictEqual(L.medalFor(50).icon,'🥉'); assert.strictEqual(L.medalFor(49),null);
});
test('Test-Auswertung: Prozent, bestanden, bestes Ergebnis',()=>{
  const r=L.testResult(9,12,0);
  assert.deepStrictEqual([r.pct,r.passed,r.best,r.medal.icon,r.bonus],[75,true,75,'🥈',3]);
  assert.strictEqual(L.testResult(6,12,0).passed,false);
  assert.strictEqual(L.testResult(0,0,0).pct,0);
});
test('Extra-Sterne nur für eine bessere Medaille',()=>{
  assert.strictEqual(L.testResult(12,12,80).bonus,2);  // Silber → Gold: 5 − 3
  assert.strictEqual(L.testResult(10,12,90).bonus,0);  // schlechter als bisher
  assert.strictEqual(L.testResult(10,12,0).best,83);
  assert.strictEqual(L.testResult(5,12,90).best,90);
});

/* Sticker */
test('alter Spielstand: keine Sticker, verdiente Sterne = vorhandene',()=>{
  const x=L.normalize({stars:12,known:{}});
  eq(x.stickers,[]); assert.strictEqual(x.earned,12);
});
test('Sticker kaufen: Sterne werden abgezogen, nur einmal, nicht ohne genug Sterne',()=>{
  const d=L.fresh(); d.stars=12;
  assert.ok(L.buySticker(d,'🦊',5)); assert.strictEqual(d.stars,7);
  assert.ok(!L.buySticker(d,'🦊',5)); assert.strictEqual(d.stars,7);
  assert.ok(!L.buySticker(d,'🐉',8)); assert.strictEqual(d.stars,7);
  eq(d.stickers,['🦊']);
});
test('Spezial-Sticker nur für bestandene Level-Tests und nur einmal',()=>{
  const d=L.fresh();
  assert.strictEqual(L.levelReward(d,1,false,L.LEVEL_STICKERS),null);
  assert.strictEqual(L.levelReward(d,1,true,L.LEVEL_STICKERS),'🦄');
  assert.strictEqual(L.levelReward(d,1,true,L.LEVEL_STICKERS),null);
  eq(d.stickers,['🦄']);
});
test('Sticker-Packs: teurer werdend, späte Packs erst nach Level-Tests',()=>{
  const costs=L.STICKER_PACKS.map(p=>p.cost);
  eq(costs,[...costs].sort((a,b)=>a-b));
  const total=L.STICKER_PACKS.reduce((n,p)=>n+p.cost*p.items.length,0);
  assert.ok(total>=2000,`alle Sticker kosten nur ${total} Sterne`);
  const d=L.fresh();
  for(const p of L.STICKER_PACKS) if(p.need) assert.ok(L.LEVELS.some(l=>l.n===p.need),`${p.name}: Level ${p.need} fehlt`);
  const late=L.STICKER_PACKS.find(p=>p.need);
  assert.ok(!L.packOpen(d,late));
  d.tests['level:'+late.need]={best:74}; assert.ok(!L.packOpen(d,late));
  d.tests['level:'+late.need]={best:75}; assert.ok(L.packOpen(d,late));
  assert.ok(L.packOpen(d,L.STICKER_PACKS[0]));
});
test('Sticker sind eindeutig und jedes Level hat einen Spezial-Sticker',()=>{
  const all=[...L.STICKER_PACKS.flatMap(p=>p.items.map(i=>i[0])),...Object.values(L.LEVEL_STICKERS).map(x=>x[0])];
  assert.strictEqual(new Set(all).size,all.length,'doppelter Sticker');
  for(const l of L.LEVELS) assert.ok(L.LEVEL_STICKERS[l.n],`Level ${l.n} ohne Spezial-Sticker`);
});

/* Rückmeldung pro Wort */
test('wordMatch markiert fehlende Wörter',()=>{
  eq(L.wordMatch('I can ride a bike.','I can write a bike').map(x=>x.ok),[true,true,false,true,true]);
  eq(L.wordMatch("It's three o'clock.","It's 3 o'clock").map(x=>x.ok),[true,true,true]);
  eq(L.wordMatch('Where is Mum?','where is mom').map(x=>x.ok),[true,true,true]);
});

/* Gespräche */
const dm=(h,a)=>JSON.parse(JSON.stringify(L.dialogMatch(h,a)));
test('Antwortmuster mit freien Teilen',()=>{
  eq(dm('My name is Lena.',['my name is {name}']),{ok:true,slots:{name:'lena'}});
  eq(dm("I'm 8 years old.",['{number}']),{ok:true,slots:{number:'eight'}});
  eq(dm('Can I have an apple, please?',['{food}']),{ok:true,slots:{food:'apple'}});
  eq(dm('I like dogs.',['{animal}']),{ok:true,slots:{animal:'dogs'}});
  eq(dm('My favourite colour is grey.',['{color}']),{ok:true,slots:{color:'grey'}});
  eq(dm("It's raining.",['{weather}']),{ok:true,slots:{weather:'raining'}});
  eq(dm('I want to play football',['i want to {any}']),{ok:true,slots:{any:'play football'}});
  eq(dm('My head hurts.',['{body}']),{ok:true,slots:{body:'head'}});
  eq(dm('I am from Switzerland.',['{country}']),{ok:true,slots:{country:'switzerland'}});
});
test('falsche Antworten passen nicht',()=>{
  assert.ok(!L.dialogMatch('banana',['{color}']).ok);
  assert.ok(!L.dialogMatch('I like cars',['{animal}']).ok);
  assert.ok(!L.dialogMatch('',['my name is {name}']).ok);
  assert.ok(!L.dialogMatch('blue',['{number}']).ok);
});
test('Figur verwendet das Gesagte, sonst einen Ersatz',()=>{
  assert.strictEqual(L.fillSlots('Nice to meet you, {name}!',{name:'anna lena'}),'Nice to meet you, Anna Lena!');
  assert.strictEqual(L.fillSlots('{color}! Nice!',{color:'blue'}),'Blue! Nice!');
  assert.strictEqual(L.fillSlots('Oh, it is {weather}!',{}),'Oh, it is nice!');
  assert.strictEqual(L.fillSlots('Goodbye, {name}!',{}),'Goodbye, friend!');
  assert.strictEqual(L.fillSlots('Oh, {country}! Cool!',{country:'switzerland'}),'Oh, Switzerland! Cool!');
});
test('jede Beispielantwort passt zu ihren Mustern, Platzhalter sind gültig',()=>{
  for(const d of L.DIALOGS) for(const t of d.turns){
    assert.ok(L.dialogMatch(t.example,t.answers).ok,`${d.id}: «${t.example}» passt nicht zu ${t.answers.join(' / ')}`);
    L.fillSlots(t.say,{});
  }
});

/* Heute üben: nur Gelerntes */
test('Heute üben nimmt nur gelernte Einträge, fällige zuerst',()=>{
  const d=L.fresh(), day='2026-10-10';
  d.known={animals:['dog','cat','cow'],colors:['red']};
  d.srs={'animals|dog':{l:3,d:'2026-10-20'},'animals|cat':{l:0,d:'2026-10-09'},'colors|red':{l:2,d:'2026-10-10'},
         'animals|pig':{l:0,d:'2026-10-01'}}; // pig falsch beantwortet, aber nie gelernt
  const p=L.practicePick(L.THEMES,d,day,10);
  assert.strictEqual(p.learned,4);
  assert.strictEqual(p.due,3); // cat, red, cow (cow ohne Eintrag gilt als heute fällig)
  const ens=p.list.map(x=>x.it.en);
  assert.ok(!ens.includes('pig'),'nie gelerntes Wort dabei');
  eq(ens.slice(0,3).sort(),['cat','cow','red']);
  assert.strictEqual(ens[3],'dog');
  assert.strictEqual(ens[0],'cat'); // tiefste Stufe zuerst
});
test('Heute üben ohne Gelerntes ist leer, Anzahl wird begrenzt',()=>{
  assert.strictEqual(L.practicePick(L.THEMES,L.fresh(),'2026-10-10',10).list.length,0);
  const d=L.fresh(); d.known={animals:L.THEMES.find(t=>t.id==='animals').items.map(i=>i.en)};
  assert.strictEqual(L.practicePick(L.THEMES,d,'2026-10-10',10).list.length,10);
});

/* Fehler-Auswertung */
test('Protokoll wird auf die letzten Einträge begrenzt',()=>{
  const log=[]; for(let i=0;i<L.LOG_MAX+20;i++) L.addLog(log,{i});
  assert.strictEqual(log.length,L.LOG_MAX); assert.strictEqual(log[0].i,20);
});
test('Fehler nach Übungsart, Thema, Verwechslung und Tag',()=>{
  const day='2026-10-10', y='2026-10-09';
  const log=[
    {d:y,t:'animals',e:'cow',k:'hear',ok:0,a:'pig'},{d:day,t:'animals',e:'cow',k:'hear',ok:0,a:'Pig'},
    {d:day,t:'animals',e:'cow',k:'hear',ok:1},{d:day,t:'animals',e:'dog',k:'say',ok:0,a:'Doc'},
    {d:day,t:'colors',e:'red',k:'read',ok:1},{d:'2026-01-01',t:'colors',e:'blue',k:'read',ok:0,a:'green'}];
  const s=L.errorStats(log,day,7);
  assert.strictEqual(s.total,6); assert.strictEqual(s.wrong,4);
  eq(s.kinds.hear,{n:3,wrong:2}); eq(s.themes.colors,{n:2,wrong:1});
  assert.strictEqual(s.confusions[0].e,'cow'); assert.strictEqual(s.confusions[0].n,2); // pig/Pig zusammengezählt
  assert.strictEqual(s.days.length,7); assert.strictEqual(s.days[6].d,day);
  eq(s.days[6],{d:day,n:4,wrong:2}); eq(s.days[5],{d:y,n:1,wrong:1});
  assert.strictEqual(L.lastMistake(log,'animals','cow').a,'Pig');
  assert.strictEqual(L.lastMistake(log,'colors','red'),null);
});
test('jede Übungsart hat eine Bezeichnung',()=>{
  for(const k of ['hear','read','translate','build','say','speak','story','dialog']) assert.ok(L.KINDS[k],k);
});

/* Inhalte passen zu den Levels */
test('jedes Thema gehört zu einem Level, jedes Level hat Themen',()=>{
  const ns=L.LEVELS.map(l=>l.n);
  for(const t of L.THEMES) assert.ok(ns.includes(t.level),`Thema ${t.id} hat kein gültiges Level`);
  for(const n of ns) assert.ok(L.THEMES.some(t=>t.level===n),`Level ${n} ist leer`);
});

console.log(failed?`✗ ${failed} von ${passed+failed} Tests fehlgeschlagen`:`✓ ${passed} Tests bestanden`);
process.exit(failed?1:0);
