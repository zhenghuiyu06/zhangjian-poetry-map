/* Run against a server rooted at the repository. PLAYWRIGHT and CHROME can be overridden. */
const {chromium}=require(process.env.PLAYWRIGHT || 'playwright');
const {mkdirSync}=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.QA_URL || 'http://127.0.0.1:8879';
const out=process.env.QA_OUT || '/tmp/jianghai-qa';
mkdirSync(out,{recursive:true});
const check=(cond,msg)=>assert.ok(cond,msg);
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true});
  const errors=[];
  try {
    for(const width of [1440,390]){
      const ctx=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce',isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1});
      await ctx.addInitScript(()=>{
        Object.defineProperty(navigator,'share',{value:undefined});
        Object.defineProperty(navigator,'clipboard',{value:undefined});
      });
      const p=await ctx.newPage();
      p.on('pageerror',e=>errors.push(e.message));
      p.on('console',m=>{if(m.type()==='error')errors.push(`${m.text()} ${m.location().url}`);});
      p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      await p.goto(`${base}/v3/exhibit.html`);
      await p.evaluate(()=>document.fonts.ready);
      check(await p.locator('.ribbon').count()===7,'seven ribbons');
      check(await p.locator('.first-card').count()===10,'ten firsts');
      check(await p.evaluate(()=>document.querySelector('.hero-art img').naturalWidth>0),'art present');
      check(await p.evaluate(()=>document.fonts.check('700 20px Jianghai Song','江海阅潮生')),'display font');
      check(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'no horizontal overflow');
      await p.screenshot({path:`${out}/${width}-01-home.png`});
      const click=(selector)=>p.locator(selector).click();
      for(const [layer,n] of [['intro',10],['firsts',6],['travel',10],['all',74]]){
        await click(`[data-layer="${layer}"]`);
        assert.equal(await p.locator('#station-body .place-list li').count(),n,layer);
      }
      await click('#districts [data-region="haimen"]');
      assert.match(p.url(),/#d=haimen$/);
      check(await p.locator('#atlas .geo-point').count()>0,'district has geographic points');
      for(const [tab,expected] of [['heritage','海门山歌'],['food','海门山羊'],['access','常乐镇'],['foot','张謇纪念馆']]){
        await click(`[data-station-tab="${tab}"]`);assert.match(await p.locator('#station-body').innerText(),new RegExp(expected));
      }
      await p.evaluate(()=>document.getElementById('map').scrollIntoView());
      await p.screenshot({path:`${out}/${width}-02-map.png`});
      await p.locator('#atlas [data-place="haimen-3"]').focus();
      await p.keyboard.press('Enter');
      await p.getByRole('dialog').waitFor();
      assert.match(p.url(),/#p=haimen-3$/);
      assert.equal(await p.locator('#place-content a').filter({hasText:/高德|百度|腾讯/}).count(),3);
      await p.screenshot({path:`${out}/${width}-03-place.png`});
      await click('[data-share]');
      assert.match(await p.locator('#share-status input').inputValue(),/#p=haimen-3$/);
      await p.keyboard.press('Escape');
      await p.goto(`${base}/v3/#d=rudong`);
      await p.waitForFunction(()=>document.querySelector('#station-header').textContent.includes('图书表待补'));
      assert.equal(await p.locator('#station-body [data-place]').count(),3);
      await p.goto(`${base}/v3/?test=deep#p=tongzhou-9`);
      await p.waitForURL('**/exhibit.html?test=deep#p=tongzhou-9');
      assert.match(await p.locator('#place-title').innerText(),/余西/);
      await p.keyboard.press('Escape');
      await p.locator('#book-query').fill('9787567231399');
      assert.equal(await p.locator('#book-grid article').count(),1);
      assert.match(await p.locator('#book-grid a').filter({hasText:'在超星'}).getAttribute('href'),/knowledgeId=436829279/);
      await p.locator('#book-query').fill('');
      // Mobile Chromium may retain the filled search filter until an explicit input event.
      await p.locator('#book-query').dispatchEvent('input');
      await p.locator('#book-topic').selectOption('food');
      assert.equal(await p.locator('#book-grid article').count(),4);
      await p.locator('#book-region').selectOption('haimen');
      assert.equal(await p.locator('#book-grid article').count(),1);
      await p.locator('#book-region').selectOption('all');
      await p.locator('#book-topic').selectOption('all');
      await p.evaluate(()=>document.getElementById('books').scrollIntoView());
      await p.screenshot({path:`${out}/${width}-04-books.png`});
      await click('[data-answer="1"]');
      assert.match(await p.locator('#quiz-result').innerText(),/再试/);
      await click('[data-answer="0"]');
      assert.match(await p.locator('#quiz-result').innerText(),/答对/);
      for(const region of ['haimen','tongzhou','rugao','rudong','haian','qidong','nantong']){
        await click(`[data-stamp="${region}"]`);
        await p.waitForFunction(r=>document.querySelector(`[data-stamp="${r}"]`).getAttribute('aria-pressed')==='true',region);
      }
      assert.match(await p.locator('#stamp-count').innerText(),/7 \/ 7.*解锁/);
      await p.evaluate(()=>document.getElementById('play').scrollIntoView());
      await p.screenshot({path:`${out}/${width}-05-passport.png`});
      await p.reload();
      await p.waitForFunction(()=>document.querySelector('#stamp-count').textContent.includes('7 / 7'));
      await p.goto(`${base}/v3/shilu.html#passport`);
      await p.waitForFunction(()=>document.querySelectorAll('#passportStamps button, #passportStamps [data-visit]').length>=7);
      await p.locator('#profileEntry').waitFor();
      assert.equal(await p.locator('#archive [data-poem]').count(),8);
      const stamps=await p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('zhangjian-poetry-observations-v2',2);r.onsuccess=()=>{const t=r.result.transaction('visits').objectStore('visits').getAll();t.onsuccess=()=>{r.result.close();resolve(t.result.map(v=>v.key));};t.onerror=()=>reject(t.error);};r.onerror=()=>reject(r.error);}));
      assert.equal(stamps.length,7);
      const media=new Map();
      for(const card of await p.locator('#archive [data-poem]').all()){
        await card.click();
        const audio=p.locator('#dialogContent audio');
        const audioURL=await audio.evaluate(el=>el.src);media.set(audioURL,'audio');
        await click('#dialogViews [data-view="graph"]');
        const graph=p.locator('#dialogContent .graph-preview img');await graph.waitFor();
        media.set(await graph.evaluate(el=>el.src),'graph');
        const videoTab=p.locator('#dialogViews [data-view="video"]');
        if(await videoTab.isVisible()){
          await videoTab.click();
          media.set(await p.locator('#dialogContent video').evaluate(el=>el.src),'video');
        }
        await click('#dialogClose');
      }
      for(const [href,type] of media){
        check(href.startsWith(base+'/assets/'),`media points at root: ${href}`);
        const response=await p.request.get(href,{headers:{Range:'bytes=0-127'}});
        check(response.ok() && /^(audio|video|image)\//.test(response.headers()['content-type']),`${type}: ${href}`);
      }
      assert.deepEqual([...media.values()].reduce((acc,k)=>(acc[k]=(acc[k]||0)+1,acc),{}),{audio:8,graph:8,video:7});
      await p.goto(`${base}/v3/research.html`);
      await p.frameLocator('#classic-frame').locator('body').waitFor();
      check(await p.frames().some(f=>f.url().includes('/classic/')),'classic map iframe loaded');
      await p.goto(`${base}/v3/#play`);
      await p.waitForFunction(()=>document.querySelector('#stamp-count').textContent.includes('7 / 7'));
      await click('[data-stamp="nantong"]');
      await p.waitForFunction(()=>document.querySelector('#stamp-count').textContent.includes('6 / 7'));
      await p.goto(`${base}/v3/shilu.html#passport`);
      await p.waitForFunction(()=>document.querySelectorAll('#passportStamps button').length===7);
      check(await p.locator('#profileEntry').isHidden(),'profile relocked');
      await p.goto(`${base}/v3/exhibit.html`);
      await p.evaluate(()=>document.fonts.ready);
      await p.screenshot({path:`${out}/${width}-00-full.png`,fullPage:true});
      for(const [n,id] of [['06','why'],['07','timeline'],['08','firsts'],['09','travel']]){
        await p.locator(`#${id}`).evaluate(el=>el.scrollIntoView());
        await p.screenshot({path:`${out}/${width}-${n}-${id}.png`});
      }
      await p.goto(`${base}/v3/handoff.html`);
      check(await p.locator('#public-sources li').count()>40,'sources index');
      console.log(`${width}: map layers, region tabs, keyboard, deep links, sharing, book search, quiz, 7 stamps, 23 media URLs and handoff: OK`);
      await ctx.close();
    }
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
