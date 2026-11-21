const {chromium}=require(process.env.PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const base=process.env.QA_URL||'http://127.0.0.1:8883', out=process.env.QA_OUT||'/tmp/jianghai-study-desk';
mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME});
  try{
    for(const width of [1440,390]){
      const p=await browser.newPage({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
      const errors=[];
      p.on('pageerror',e=>errors.push(e.message));
      p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
      await p.goto(base+'/v3/index.html#desk');
      await p.locator('.desk-still-life').evaluate(img=>img.decode());
      await p.locator('#desk').screenshot({path:`${out}/${width}-desk.png`});
      await p.getByText('如皋',{exact:true}).and(p.locator('.route-chip')).click();
      assert.match(await p.locator('#stationTaskLink').getAttribute('href'),/catalog-23&walk=1/);
      await p.locator('#stationTaskLink').click();
      await p.locator('#place-dialog[open]').waitFor();
      assert.match(await p.locator('#place-title').innerText(),/如皋花木大世界/);
      assert.equal(await p.locator('#walk-heading').evaluate(el=>el===document.activeElement),true);
      await p.locator('.walk-checklist input').first().check();
      await p.reload();
      assert.equal(await p.locator('.walk-checklist input').first().isChecked(),true);
      await p.locator('.walk-actions').getByRole('button',{name:/填写观察卡/}).click();
      await p.locator('#walk-note textarea').fill('测试笔记：看见松枝的折转。');
      await p.getByRole('button',{name:'保存到本机'}).click();
      await p.getByText('已保存在当前浏览器。',{exact:true}).waitFor();
      await p.locator('#toggle-favorite').click();
      assert.equal(await p.locator('#toggle-favorite').getAttribute('aria-pressed'),'true');
      await p.locator('#walk-note a').click();
      assert.equal(await p.locator('#trail-place').inputValue(),'catalog-23');
      await p.locator('#trail-share-link').click();
      await p.locator('#trail-add-note').click();
      await p.waitForFunction(()=>document.getElementById('trail-copy-text').value.includes('测试笔记'));
      await p.goto(base+'/v3/exhibit.html#ask');
      await p.locator('.map-favorites summary').click();
      assert.match(await p.locator('#favorite-list').innerText(),/如皋花木大世界/);
      await p.locator('#ask-input').fill('《盆松》配在哪里？');
      await p.locator('#catalog-question button').click();
      assert.match(await p.locator('#catalog-answer').innerText(),/花木大世界/);
      await p.goto(base+'/v3/exhibit.html#p=nantong-10');
      assert.match(await p.locator('#place-title').innerText(),/沈绣博物馆/);
      assert.doesNotMatch(await p.locator('#place-content').innerText(),/ISBN|含表头|推荐配图|看对应书页/);
      await p.goto(base+'/v3/index.html#passport');
      const stamps=p.locator('#passportStamps button');
      await stamps.first().waitFor();
      for(let i=0;i<7;i++){await stamps.nth(i).click();await p.waitForFunction(n=>document.getElementById('visitCount').textContent===String(n),i+1);}
      await p.locator('#profileEntry').click();
      await p.locator('#profileDialog[open]').waitFor();
      assert.match(await p.locator('#profileDialogTitle').innerText(),/数字江海印象/);
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
      assert.deepEqual(errors,[]);
      await p.context().close();
      console.log(width+'px: desk, trail deep link, task persistence, notes, favorites, FAQ and impression gate OK');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
