/* Automatische Tests für js/logic.js. Aufruf: node scripts/test.js */
const fs=require('fs'), path=require('path'), vm=require('vm'), assert=require('assert');
const root=path.join(__dirname,'..');
const ctx={}; vm.createContext(ctx);
for(const f of ['js/data.js','js/logic.js']) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
const run=code=>vm.runInContext(code,ctx);
const L=run('({THEMES,LEVELS,norm,heardOK,editDist,resample,addDays,normalize,fresh,review,nextStreak,streakValue,medalFor,testResult})');

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
test('neuer Spielstand hat alle Felder',()=>assert.deepStrictEqual(Object.keys(L.fresh()).sort(),['bonus','known','srs','stars','streak','tests']));

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

/* Inhalte passen zu den Levels */
test('jedes Thema gehört zu einem Level, jedes Level hat Themen',()=>{
  const ns=L.LEVELS.map(l=>l.n);
  for(const t of L.THEMES) assert.ok(ns.includes(t.level),`Thema ${t.id} hat kein gültiges Level`);
  for(const n of ns) assert.ok(L.THEMES.some(t=>t.level===n),`Level ${n} ist leer`);
});

console.log(failed?`✗ ${failed} von ${passed+failed} Tests fehlgeschlagen`:`✓ ${passed} Tests bestanden`);
process.exit(failed?1:0);
