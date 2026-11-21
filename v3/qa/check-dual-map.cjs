const {chromium}=require(process.env.PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const base=process.env.QA_URL||'http://127.0.0.1:8882';
const out=process.env.QA_OUT||'/tmp/jianghai-dual-map-qa';
mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME});
  try{
    for(const width of [1440,390]){
      const ctx=await browser.newContext({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
      await ctx.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});});
      const p=await ctx.newPage(),errors=[];
      p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
      await p.goto(base+'/?preview=dual');
      await p.waitForURL('**/v3/?preview=dual');
      await p.locator('.hero-primary').click();
      await p.waitForURL('**/exhibit.html#map');
      const map=p.locator('#street-map'),dialog=p.locator('#place-dialog');
      await p.waitForFunction(()=>document.querySelector('#street-map .tiles img')?.naturalWidth>0);
      assert.equal(await map.getAttribute('data-mode'),'street');
      await p.locator('#map').evaluate(el=>el.scrollIntoView());
      await p.screenshot({path:`${out}/${width}-street.png`});
      await p.locator('[data-mode="diagram"]').click();
      assert.equal(await map.getAttribute('data-mode'),'diagram');
      await p.locator('#map').evaluate(el=>el.scrollIntoView());
      await p.screenshot({path:`${out}/${width}-diagram.png`});
      await p.locator('#map-query').fill('沈绣博物馆');
      assert.ok(await p.locator('#station-body .place-list li').count()>0);
      assert.ok(await p.locator('#station-body .place-list li').count()<56);
      await p.locator('#station-body [data-place="catalog-48"]').click();
      await dialog.waitFor();
      await p.screenshot({path:`${out}/${width}-museum.png`});
      const stripped=/ISBN|DJA|看对应书页|对应书目|含表头|无独立可引用|序号|推荐配图/i;
      for(const id of ['catalog-48','catalog-13','catalog-23','catalog-07']){
        await p.goto(base+'/v3/exhibit.html#p='+id);
        await dialog.waitFor();
        assert.doesNotMatch(await dialog.innerText(),stripped);
      }
      await dialog.locator('video').waitFor();
      const videoURL=await dialog.locator('video').getAttribute('src');
      assert.ok((await p.request.head(base+'/v3/'+videoURL)).ok());
      await p.goto(base+'/v3/exhibit.html#p=nantong-10');
      await p.waitForURL('**/exhibit.html#p=catalog-48');
      assert.match(await p.locator('#place-title').innerText(),/沈绣博物馆/);
      await p.getByRole('button',{name:'前往此地'}).click();
      assert.equal(await p.locator('#place-maps a:visible').count(),3);
      await p.getByRole('button',{name:'分享给朋友'}).click();
      assert.match(await p.locator('#share-status input').inputValue(),/#p=catalog-48$/);
      await p.getByRole('button',{name:'查看书目与页码'}).click();
      assert.equal(await p.evaluate(()=>document.activeElement.id),'place-book');
      await p.locator('#place-content summary').click();
      await p.locator('#place-content textarea').fill('本地验收观察');
      await p.getByRole('button',{name:'保存到本机'}).click();
      await p.getByText('已保存在当前浏览器。',{exact:true}).waitFor();
      await p.goto(base+'/v3/exhibit.html#books');
      await p.locator('#book-query').fill('古镇余西');
      assert.equal(await p.locator('#book-grid article').count(),1);
      await p.goto(base+'/v3/index.html#passport');
      await p.getByText(/沈绣博物馆.*本地验收观察/).waitFor();
      await p.locator('#passportStamps button').first().click();
      await p.waitForFunction(()=>document.querySelector('#visitCount').textContent==='1');
      await p.goto(base+'/v3/exhibit.html#play');
      await p.waitForFunction(()=>document.querySelector('#stamp-count').textContent.includes('1 / 7'));
      await p.goto(base+'/v3/index.html#read-poem-3');
      await p.waitForURL('**/shilu.html#read-poem-3');
      assert.equal(await p.locator('#poemDialog[open] #dialogTitle').innerText(),'《盆松》');
      await p.goto(base+'/v3/research.html#poem-3');
      await p.frameLocator('#classic-frame').locator('body').waitFor();
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
      assert.deepEqual(errors,[]);
      console.log(`${width}px: dual map, clean place card, share, legacy links, media, bookshelf, notes and stamps: OK`);
      await ctx.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
