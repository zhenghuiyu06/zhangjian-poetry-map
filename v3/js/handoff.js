(() => {
  const D=window.JIANGHAI_DATA, G=window.JIANGHAI_GUIDE;
  const el=id=>document.getElementById(id);
  const item=(id,text,sources=[])=>{
    const li=document.createElement('li');li.append(text);
    for(const [label,url] of sources){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';li.append(' · ',a);}
    el(id).append(li);
  };
  el('materials-count').textContent=`保留 ${D.records.length} 条展表书目记录，按书名聚合 ${D.books.length} 种；现有 ${D.places.length} 个地点条目（含 3 个如东扩展条目）。`;
  for(const c of D.changes)item('changes',c);
  for(const i of D.issues)item('issues',i);
  item('issues','南通博物苑虽同一地点，如皋、城区展表的出处仍独立保留。水绘园序厅与如皋点合并，子建筑保留。');
  for(const p of D.places.filter(p=>!G.geo[p.id]))item('unplaced',`${p.name.replace(/\s+/g,' ')}：仅列资料，落点待核。`);
  for(const d of G.districts){
    for(const [title,note,s] of [...d.heritage,...d.food])item('public-sources',`${d.name} · ${title}：${note}`,[s]);
    item('public-sources',`${d.name} · 出行：${d.access}`,d.sources);
  }
  for(const [title,year,quote,note,,s] of G.firsts)item('public-sources',`${title}（${year}）：${quote||'“第一”称谓待核'}。${note}`,[s]);
  for(const [,,title,note,id,s] of G.timeline.map(([y,t,n,i,s])=>[null,y,t,n,i,s]))item('public-sources',`足迹年表 · ${title}：${note}`,[s]);
  for(const [,title,note,,,,...sources] of G.transit)item('public-sources',`${title}：${note}`,sources);
  for(const b of G.foodBooks)item('public-sources',`《${b.title}》：${b.note}`,b.source?[b.source]:[]);
  item('public-sources','非遗项目名录核对入口',[G.sources.ich]);
})();
