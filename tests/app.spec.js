// Bedienungs-Tests: klicken die App durch und schlagen bei jedem JavaScript-Fehler fehl.
const {test,expect}=require('@playwright/test');

/* Vor jedem Test: Fehler sammeln, Spracherkennung (CDN/Modell) sperren, Uhr steuerbar machen */
test.beforeEach(async({page},info)=>{
  info.pageErrors=[];
  page.on('pageerror',e=>info.pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text())) info.pageErrors.push(m.text());});
  await page.route(/cdn\.jsdelivr\.net|huggingface\.co/,r=>r.abort());
  await page.clock.install();
});
test.afterEach(async({},info)=>{expect(info.pageErrors,'JavaScript-Fehler auf der Seite').toEqual([]);});

const start=async(page,state)=>{
  if(state) await page.addInitScript(s=>localStorage.setItem('englisch-lernen-v1',JSON.stringify(s)),state);
  await page.goto('/');
  await expect(page.locator('.hello')).toBeVisible();
};
const wait=(page,ms=3000)=>page.clock.runFor(ms);
/* Eine Aufgabe beantworten: Auswahl (erste Option) oder Satz bauen (in richtiger Reihenfolge) */
async function answer(page){
  if(await page.locator('.wtile').count()){
    await page.evaluate(()=>{
      const de=document.querySelector('.bcard .de').textContent;
      const it=THEMES.flatMap(t=>t.items).find(x=>x.de===de);
      for(const w of it.en.split(' ')) [...document.querySelectorAll('.wtile')].find(b=>b.textContent===w&&b.style.visibility!=='hidden').click();
    });
  }else{
    await page.locator('.opt:not([disabled])').first().click();
  }
  await wait(page);
}
async function playUntilEnd(page,max=60){
  for(let i=0;i<max;i++){
    if(await page.locator('.end').count()) return;
    await answer(page);
  }
  throw new Error('Kein Ende erreicht');
}

test('Startseite: Levels, Themen, Album, Version',async({page})=>{
  await start(page);
  const n=await page.evaluate(()=>({levels:LEVELS.length,themes:THEMES.length}));
  await expect(page.locator('h3.sec')).toHaveCount(n.levels);
  await expect(page.locator('[data-go^="theme:"]')).toHaveCount(n.themes);
  await expect(page.locator('[data-go^="ltest:"]')).toHaveCount(n.levels);
  await expect(page.locator('[data-go="album"]')).toBeVisible();
  await expect(page.locator('.ver')).toContainText('Version');
});

test('jedes Thema: Menü, Entdecken, Hör-Quiz und Memory bzw. Satz bauen',async({page})=>{
  await start(page);
  const ids=await page.evaluate(()=>THEMES.map(t=>({id:t.id,kind:t.kind})));
  for(const {id,kind} of ids){
    await page.evaluate(i=>go('theme:'+i),id);
    await expect(page.locator('[data-go^="ttest:"]')).toBeVisible();
    await page.evaluate(i=>go('explore:'+i),id);
    await page.locator('[aria-label="Weiter"]').click();
    await expect(page.locator('.count')).toContainText('2 von');
    await page.evaluate(i=>go('quiz:'+i),id);
    await expect(page.locator('.opt')).toHaveCount(4);
    await answer(page);
    if(kind==='words'){
      await page.evaluate(i=>go('memory:'+i),id);
      await expect(page.locator('.mcard')).toHaveCount(12);
      await page.locator('.mcard').first().click();
    }else{
      await page.evaluate(i=>go('build:'+i),id);
      await answer(page);
    }
  }
});

test('Hör-Quiz bis zum Ende gibt Sterne',async({page})=>{
  await start(page);
  await page.evaluate(()=>go('quiz:colors'));
  await playUntilEnd(page);
  await expect(page.locator('.end h2')).toBeVisible();
});

test('Thema-Test speichert das Ergebnis',async({page})=>{
  await start(page);
  await page.evaluate(()=>go('ttest:animals'));
  await expect(page.locator('.dots span')).toHaveCount(10);
  await playUntilEnd(page);
  await expect(page.locator('.end')).toContainText('von 10 richtig');
  const t=await page.evaluate(()=>JSON.parse(localStorage.getItem('englisch-lernen-v1')).tests['theme:animals']);
  expect(t.best).toBeGreaterThanOrEqual(0);
});

test('Level-Test mit allen richtigen Antworten gibt Gold und Spezial-Sticker',async({page})=>{
  await start(page);
  await page.evaluate(()=>{window.__said=''; window.speak=t=>{window.__said=t;};});
  await page.evaluate(()=>go('ltest:1'));
  for(let i=0;i<20&&!(await page.locator('.end').count());i++){
    await wait(page,500);
    await page.evaluate(()=>{
      const all=THEMES.flatMap(t=>t.items), opts=[...document.querySelectorAll('.opt')];
      const tiles=[...document.querySelectorAll('.wtile')];
      if(tiles.length){
        const it=all.find(x=>x.de===document.querySelector('.bcard .de').textContent);
        for(const w of it.en.split(' ')) [...document.querySelectorAll('.wtile')].find(b=>b.textContent===w&&b.style.visibility!=='hidden').click();
        return;
      }
      const q=document.querySelector('.qde')?.textContent, card=document.querySelector('.bcard > .emo, .bcard > .swatch, .bcard > .num');
      const it=q?all.find(x=>x.de===q):card?all.find(x=>vis(x,'md')===card.outerHTML):all.find(x=>x.en===window.__said);
      (q||card?opts.find(o=>o.getAttribute('aria-label')===it.en):opts.find(o=>o.innerHTML===vis(it,'md'))).click();
    });
    await wait(page);
  }
  await expect(page.locator('.end')).toContainText('12 von 12');
  await expect(page.locator('.newstk')).toContainText('🦄');
  const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('englisch-lernen-v1')));
  expect(d.stickers).toContain('🦄');
  expect(d.tests['level:1'].best).toBe(100);
});

test('Heute üben läuft durch und zählt die Serie',async({page})=>{
  await start(page);
  await page.locator('[data-go="practice"]').click();
  await playUntilEnd(page);
  await expect(page.locator('.end h2')).toContainText('Tag');
  const d=await page.evaluate(()=>JSON.parse(localStorage.getItem('englisch-lernen-v1')));
  expect(d.streak.n).toBe(1);
});

test('Sticker-Album: kaufen braucht zwei Tipps und genug Sterne',async({page})=>{
  await start(page,{stars:6,known:{}});
  await page.locator('[data-go="album"]').click();
  const fox=page.locator('[data-buy="🦊"]');
  await fox.click();
  await expect(fox).toContainText('Nochmal tippen');
  await fox.click();
  await expect(page.locator('.newstk')).toContainText('🦊');
  await expect(page.locator('.stars')).toContainText('1');
  const dino=page.locator('[data-buy="🦖"]');
  await dino.click();
  await expect(dino).toContainText('noch 14');
});

test('Sprechen mit Eltern-Check',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('englisch-lernen-mic',JSON.stringify({v:5,input:'parent'})));
  await start(page);
  await page.evaluate(()=>go('speak:animals'));
  for(let i=0;i<8;i++){
    await page.locator('#said').click();
    await page.locator('#yes').click();
    await wait(page);
  }
  await expect(page.locator('.end')).toContainText('8 von 8');
});

test('Sprechen mit der App: ohne Internet eine verständliche Meldung',async({page})=>{
  await start(page);
  await page.evaluate(()=>go('speak:animals'));
  await expect(page.locator('#lmic')).toBeVisible();
  await expect(page.locator('#hint')).toContainText('konnte nicht geladen werden',{timeout:10000});
});

test('Sprechen: Mikrofon verweigert → Eltern-Check mit Hinweis',async({page})=>{
  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('verweigert','NotAllowedError'));});
  await start(page);
  await page.evaluate(()=>go('speak:animals'));
  await expect(page.locator('#lmic')).toBeEnabled();
  await page.locator('#lmic').click();
  await expect(page.locator('#said')).toBeVisible();
  await expect(page.locator('.hint.small')).toContainText('Mikrofon ist nicht freigegeben');
  await page.locator('#said').click(); await page.locator('#yes').click();
  await expect(page.locator('.fb')).toContainText('toll gesagt');
});

test('Für Eltern: Übersicht, Sichern und Wiederherstellen',async({page})=>{
  await start(page,{stars:3,known:{animals:['dog']},srs:{'animals|dog':{l:0,d:'2026-01-01',w:2}}});
  await page.locator('[data-go="parents"]').click();
  await expect(page.locator('.hard')).toContainText('dog');
  const code=await page.locator('#code').inputValue();
  await page.locator('#reset').click(); await page.locator('#reset').click();
  await expect(page.locator('.okmsg')).toContainText('gelöscht');
  await page.locator('#paste').fill(code);
  await page.locator('#restore').click();
  await expect(page.locator('.okmsg')).toContainText('wiederhergestellt');
  await page.locator('#paste').fill('kaputt');
  await page.locator('#restore').click();
  await expect(page.locator('#err')).toContainText('nicht vollständig');
});

test('Handy-Breite: kein seitliches Scrollen',async({page})=>{
  await page.setViewportSize({width:360,height:740});
  await start(page);
  for(const r of ['home','album','parents','theme:s-meet','ttest:s-weather','speak:s-day']){
    await page.evaluate(x=>go(x),r);
    const w=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(w,r).toBeLessThanOrEqual(360);
  }
});
