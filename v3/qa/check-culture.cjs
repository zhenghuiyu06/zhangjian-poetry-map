const {chromium}=require(process.env.PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
const base=process.env.QA_URL||'http://127.0.0.1:8882';
const out=process.env.QA_OUT||'/tmp/jianghai-culture';
mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME});
  try{
    for(const width of [1440,390]){
      const page=await browser.newPage({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
      await page.goto(base+'/v3/culture-demo.html#tab=heritage');
      await page.waitForURL('**/exhibit.html#tab=heritage');
      const panel=page.locator('#station-body');
      const atlas=page.locator('#street-map');
      const title=page.locator('#station-header h3');
      const summary=panel.locator('.culture-card summary');
      const select=panel.getByRole('combobox',{name:'筛选地区'});
      const cards=panel.locator('.culture-card');
      const mapPin=(id)=>atlas.locator('[data-culture-pin="'+id+'"]');
      assert.equal(await cards.count(),16);
      assert.equal(await title.innerText(),'南通全域');
      await atlas.locator('.district-label[data-region="nantong"]').click();
      assert.equal(await cards.count(),5);
      assert.equal(await title.innerText(),'崇川');
      assert.equal(await select.inputValue(),'nantong');
      await mapPin('catalog-56').click();
      await panel.locator('[data-culture-anchor="catalog-56"][open]').waitFor();
      await page.locator(width===390?'#station-header':'#map').evaluate(el=>el.scrollIntoView());
      await page.screenshot({path:`${out}/${width}-heritage.png`});
      await panel.locator('[data-culture-anchor="catalog-56"]').getByRole('link',{name:'查看地点卡'}).click();
      await page.waitForURL('**/exhibit.html#p=catalog-56');
      assert.match(await page.locator('#place-title').innerText(),/蓝印花布/);
      await page.keyboard.press('Escape');
      await page.getByRole('tab',{name:'美食'}).click();
      assert.match(await panel.innerText(),/四宜糕团/);
      await select.selectOption('tongzhou');
      assert.equal(await title.innerText(),'通州');
      assert.equal(await cards.count(),2);
      assert.match(await panel.innerText(),/西亭脆饼/);
      assert.equal(await page.locator('#districts [data-region="tongzhou"]').getAttribute('aria-pressed'),'true');
      await summary.first().focus();
      await page.keyboard.press('Enter');
      assert.match(await panel.innerText(),/西亭脆饼制作技艺 · 省级非遗/);
      assert.doesNotMatch(await panel.innerText(),/调研|Demo|样例|正式版|待核/i);
      await cards.first().getByText('资料来源',{exact:true}).click();
      assert.match(await cards.first().getByRole('link',{name:/非遗项目名录/}).getAttribute('href'),/nantong\.gov\.cn/);
      await page.locator(width===390?'#station-header':'#map').evaluate(el=>el.scrollIntoView());
      await page.screenshot({path:`${out}/${width}-food.png`});
      await page.getByRole('button',{name:'分区示意图'}).click();
      assert.equal(await atlas.getAttribute('data-mode'),'diagram');
      await atlas.locator('.district-label[data-region="rugao"]').click();
      assert.equal(await cards.count(),5);
      assert.match(await panel.innerText(),/如皋董糖/);
      assert.equal(await select.inputValue(),'rugao');
      await page.reload();
      assert.equal(await page.getByRole('tab',{name:'美食'}).getAttribute('aria-selected'),'true');
      const search=page.locator('#map-query');
      await search.fill('不匹配');
      assert.equal(await cards.count(),0);
      await search.fill('');
      await search.dispatchEvent('input');
      assert.equal(await cards.count(),5);
      await page.getByRole('tab',{name:'足迹与文献'}).click();
      assert.equal(await cards.count(),0);
      assert.ok(await panel.locator('.place-list li').count()>0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
      await page.goto(base+'/v3/exhibit.html#map');
      assert.equal(await page.getByRole('tab',{name:'美食'}).count(),1);
      assert.equal(await cards.count(),0);
      await page.getByRole('tab',{name:'美食'}).click();
      assert.equal(await cards.count(),14);
      for(const type of ['非遗','美食']){
        await page.getByRole('tab',{name:type}).click();
        for(const id of ['nantong','tongzhou','haimen','rugao','rudong','haian','qidong']){
          await select.selectOption(id);
          assert.ok(await cards.count()>0,type+' '+id);
        }
      }
      assert.deepEqual(errors,[]);
      await page.context().close();
      console.log(width+'px: all seven districts in both categories, map modes, links, sources, search and original place list OK.');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
