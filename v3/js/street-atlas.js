const landmarkEmblems=[
  [/轨道交通/,'🚇'],[/车站|站$/,'🚉'],[/桥/,'🌉'],[/博物|纪念馆|档案馆/,'🏛️'],
  [/纱厂|酒厂|三厂|二厂|公司/,'🏭'],[/寺|观音|禅/,'🛕'],[/气象台/,'🌦️'],
  [/学校|小学|学宫|师范|女校/,'🏫'],[/剧院|剧场|伶工/,'🎭'],[/园林|水绘园|啬园|花木|影梅/,'🌿'],
  [/园/,'🌳'],[/钟楼/,'🕰️'],[/故居|故里|别业|故宅|精舍/,'🏡'],
  [/河|湖|潮间带|滩涂|挡浪墙/,'🌊'],[/渔|港/,'⚓'],[/山/,'⛰️'],
  [/镇|街|古城/,'🏘️'],[/遗址|青墩/,'🏺'],[/书|图书/,'📚']
];
window.atlasPlaceSymbol=function(item){
  if(item.number===23)return '🪴';
  if(item.number===6)return '🧵';
  if(item.number===16)return '🖋️';
  return landmarkEmblems.find(([pattern])=>pattern.test(item.name))?.[1] || '📍';
};
/* Web Mercator raster tiles, using the same provider and editorial coordinates as the poetry map. */
window.createStreetAtlas = function (root, selectPlace, status) {
  const tilePane=root.querySelector('.tiles'), pins=root.querySelector('.pins');
  const controls=root.querySelectorAll('.atlas-zoom button');
  const cityStreets=new Image();
  cityStreets.alt='';cityStreets.draggable=false;cityStreets.hidden=true;
  tilePane.prepend(cityStreets);
  // Each AMap sheet uses [tile zoom, left column, top row, columns, rows].
  const districtSheets={
    haian:[12,3415,1654,5,4], haimen:[13,6850,3326,6,6],
    nantong:[13,6843,3324,5,5], qidong:[12,3430,1661,6,8],
    rudong:[12,3422,1655,9,6], rugao:[13,6838,3315,7,6],
    tongzhou:[13,6848,3320,9,7]
  };
  const detailSheet=new Image();
  detailSheet.alt='';detailSheet.draggable=false;detailSheet.hidden=true;
  cityStreets.after(detailSheet);
  detailSheet.onload=report;
  detailSheet.onerror=()=>{detailSheet.dataset.failed='1';schedule();};
  const tiles=new Map(), fingers=new Map();
  const borders=root.querySelector('.city-outline'), credit=root.querySelector('.atlas-credit');
  const regions=window.JIANGHAI_DISTRICTS.map(d=>{
    const geo=window.NANTONG_BOUNDARIES[d.id];
    return {...d,street:geo.rings.map(r=>r.map(project)),diagram:[d.shape.map(project)],label:project(geo.center)};
  });
  function boundsOf(points){
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }
  const extents=Object.fromEntries(['street','diagram'].map(m=>[m,boundsOf(regions.flatMap(d=>d[m].flat()))]));
  // One catalogue landmark per district first, then a second for wider maps.
  const landmarks=[25,31,15,9,45,1,37,24,30,17,12,44,4,41]
    .map(number=>window.JIANGHAI_CATALOG.find(p=>p.number===number));
  let zoom=9, minZoom=8, center=[0,0], items=[], viewKey='', area='', mode='street', searching=false, cultureView=false;
  let frame=0, pinchDistance=0, lastSize='', focusBounds=extents.street;
  const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
  function project([lng,lat]) {
    const sine=Math.sin(lat*Math.PI/180);
    return [(lng+180)/360,.5-Math.log((1+sine)/(1-sine))/(4*Math.PI)];
  }
  const scale=()=>256*2**zoom;
  function fitting(box){
    return Math.log2(Math.min((root.clientWidth-40)/Math.max(box[2]-box[0],.0001),(root.clientHeight-54)/Math.max(box[3]-box[1],.0001))/256);
  }
  function fit(){
    minZoom=fitting(extents[mode]);
    zoom=clamp(fitting(focusBounds),minZoom,14);
    center=[(focusBounds[0]+focusBounds[2])/2,(focusBounds[1]+focusBounds[3])/2];
  }
  function constrain(){
    const box=extents[mode], s=scale();
    for(let i=0;i<2;i++){
      const half=((i?root.clientHeight:root.clientWidth)/2-22)/s;
      const low=box[i]+half,high=box[i+2]-half;
      center[i]=low>high?(box[i]+box[i+2])/2:clamp(center[i],low,high);
    }
  }
  function report(){
    const images=[...tiles.values()];
    const sheetReady=!detailSheet.hidden && detailSheet.naturalWidth>0;
    const missing=mode==='street' && !sheetReady && images.length && images.every(i=>i.dataset.failed);
    root.classList.toggle('missing-tiles',Boolean(missing));
    const message=(missing?'街道底图暂未载入。':'')+
      (mode==='diagram'?'点选地区。示意图不用于导航。':cultureView?'点区县筛选，点标记看介绍。':'点区县或地名。落点仅供参考。');
    if(status.textContent!==message)status.textContent=message;
  }
  function paint() {
    frame=0;
    const w=root.clientWidth,h=root.clientHeight;
    if(!w||!h)return;
    if(lastSize!==w+':'+h){lastSize=w+':'+h;fit();}
    constrain();
    const s=scale(), left=center[0]*s-w/2, top=center[1]*s-h/2;
    const sx=p=>+(p[0]*s-left).toFixed(2), sy=p=>+(p[1]*s-top).toFixed(2);
    const paths=regions.map(d=>d[mode].map(r=>r.map((p,i)=>(i?'L':'M')+sx(p)+' '+sy(p)).join('')+'Z').join(''));
    borders.innerHTML=regions.map((d,i)=>'<path class="district-shape" d="'+paths[i]+'" fill="'+d.color+'" data-region="'+d.id+'" data-selected="'+(d.id===area)+'"></path>').join('');
    tilePane.style.clipPath=mode==='street'?'path("'+paths.join(' ')+'")':'none';
    const needed=new Set();
    const sheet=mode==='street' && districtSheets[area];
    detailSheet.hidden=!sheet;
    if(sheet){
      if(detailSheet.dataset.area!==area){
        detailSheet.dataset.area=area;delete detailSheet.dataset.failed;
        detailSheet.src='assets/district-streets/'+area+'.webp';
      }
      const [level,column,row,columns,rows]=sheet,unit=s/2**level;
      detailSheet.style.width=columns*unit+'px';detailSheet.style.height=rows*unit+'px';
      detailSheet.style.transform='translate('+(column*unit-left)+'px,'+(row*unit-top)+'px)';
    }
    // The local overview is cropped to Nantong from AMap level 10, tiles (853,413)–(858,417).
    const localOverview=mode==='street' && !area && !searching && zoom<=10 && !cityStreets.dataset.failed;
    cityStreets.hidden=!(localOverview || sheet) || Boolean(cityStreets.dataset.failed);
    if(!cityStreets.hidden){
      if(!cityStreets.hasAttribute('src')){
        cityStreets.onerror=()=>{cityStreets.dataset.failed='1';schedule();};
        cityStreets.src='assets/nantong-streets-z10.webp';
      }
      const unit=s/1024;
      cityStreets.style.width=6*unit+'px';cityStreets.style.height=5*unit+'px';
      cityStreets.style.transform='translate('+(853*unit-left)+'px,'+(413*unit-top)+'px)';
    }
    if(mode==='street' && !localOverview){
      const moreDetail=area?zoom<15:!searching && zoom<11;
      const z=Math.min(17,Math.ceil(zoom)+(moreDetail?1:0)),size=256*2**(zoom-z);
      detailSheet.style.zIndex=sheet && z<=sheet[0]?'1':'';
      const box=extents.street;
      const x0=Math.floor(Math.max(left,box[0]*s)/size), x1=Math.floor(Math.min(left+w,box[2]*s)/size);
      const y0=Math.floor(Math.max(top,box[1]*s)/size), y1=Math.floor(Math.min(top+h,box[3]*s)/size);
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        if(sheet && !detailSheet.dataset.failed && z<=sheet[0]){
          const factor=2**(sheet[0]-z);
          if(x*factor>=sheet[1] && (x+1)*factor<=sheet[1]+sheet[3] &&
             y*factor>=sheet[2] && (y+1)*factor<=sheet[2]+sheet[4])continue;
        }
        const key=[z,x,y].join('/');needed.add(key);
        let img=tiles.get(key);
        if(!img){
          img=new Image();img.alt='';img.draggable=false;
          img.onload=report;img.onerror=()=>{img.dataset.failed='1';img.style.opacity='0';report();};
          tiles.set(key,img);tilePane.append(img);
          img.src='https://wprd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x='+x+'&y='+y+'&z='+z;
        }
        img.style.width=img.style.height=size+.45+'px';
        img.style.transform='translate('+(x*size-left)+'px,'+(y*size-top)+'px)';
      }
    }
    for(const [k,img] of tiles)if(!needed.has(k)){img.onload=img.onerror=null;img.remove();tiles.delete(k);}
    const fragment=document.createDocumentFragment(), placed=[];
    const padding=16, spacing=31;
    const valid=(x,y)=>x>=padding && x<=w-padding && y>=padding && y<=h-padding &&
      !(x<69 && y<108) && !(x>w-84 && y>h-36) &&
      placed.every(p=>Math.abs(p.x-x)>=spacing || Math.abs(p.y-y)>=spacing);
    if(mode==='diagram' || (!area && (!searching || cultureView))){
      const occupied=[];
      for(const region of regions){
        const at=mode==='street'?region.label:project(region.center);
        const label=document.createElement('button');
        label.className='district-label';label.type='button';label.dataset.region=region.id;
        label.setAttribute('aria-pressed',String(region.id===area));
        label.style.left=sx(at)+'px';label.style.top=sy(at)+'px';
        label.textContent=region.name;label.setAttribute('aria-label','查看'+region.name+'的景点');fragment.append(label);
        const halfWidth=w<520?25:34,halfHeight=w<520?14:18;
        occupied.push([sx(at)-halfWidth,sy(at)-halfHeight,sx(at)+halfWidth,sy(at)+halfHeight]);
        if(cultureView&&mode==='street')placed.push({x:sx(at),y:sy(at)});
      }
      for(const [title,coord] of [['长江',[120.71,31.80]],['黄海',[121.68,32.39]]]){
        const at=project(coord),name=document.createElement('span');name.className='atlas-water';name.textContent=title;
        name.style.left=sx(at)+'px';name.style.top=sy(at)+'px';fragment.append(name);
      }
      if(mode==='street'&&!cultureView)drawLandmarks(fragment,occupied,sx,sy,w,h);
    }
    for(const item of mode==='street' && (area||searching)?items:[]){
      const [mx,my]=project(item.coords), ax=mx*s-left, ay=my*s-top;
      if(ax<0||ay<0||ax>w||ay>h) continue;
      const initialX=clamp(ax,padding,w-padding), initialY=clamp(ay,padding,h-padding);
      let x=initialX,y=initialY;
      // Search concentric square rings; closest usable slot wins on each ring.
      for(let ring=1;!valid(x,y) && ring<=Math.ceil(Math.max(w,h)/spacing);ring++){
        let best=null;
        for(let dx=-ring;dx<=ring;dx++)for(let dy=-ring;dy<=ring;dy++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
          const px=clamp(initialX+dx*spacing,padding,w-padding);
          const py=clamp(initialY+dy*spacing,padding,h-padding);
          const distance=Math.hypot(px-ax,py-ay);
          if(valid(px,py)&&(!best||distance<best.distance))best={x:px,y:py,distance};
        }
        if(best){x=best.x;y=best.y;break;}
      }
      const distance=Math.hypot(ax-x,ay-y);
      if(distance>4){
        const line=document.createElement('i');line.className='atlas-leader';
        line.style.left=ax+'px';line.style.top=ay+'px';line.style.width=distance+'px';
        line.style.transform='rotate('+Math.atan2(y-ay,x-ax)+'rad)';
        fragment.append(line);
      }
      const button=document.createElement('button');button.type='button';
      button.className='atlas-pin '+(item.poem?'poem':item.transit?'transit':'place');
      button.style.left=x+'px';button.style.top=y+'px';
      button.textContent=window.atlasPlaceSymbol(item);
      button.title=item.name+(item.positionNote?' · '+item.positionNote:'');button.setAttribute('aria-label',button.title);
      if(cultureView)button.dataset.culturePin=item.id;
      button.onclick=()=>selectPlace(item.id);
      fragment.append(button);
      placed.push({x,y,button,name:item.name});
    }
    if(area && mode==='street')labelDistrictPins(placed,w,h);
    pins.replaceChildren(fragment);report();
  }
  function labelDistrictPins(placed,w,h){
    const occupied=placed.map(({x,y})=>[x-15,y-15,x+15,y+15]);
    occupied.push([0,0,54,96],[w-82,h-18,w,h]);
    for(const {x,y,name,button} of placed){
      const width=Math.min(name.length*12+8,116),height=20;
      const choices=[[16,-10],[-width-16,-10],[-width/2,16],[-width/2,-36],[16,0],[-width-16,0]];
      const offset=choices.find(([dx,dy])=>{
        const l=x+dx,t=y+dy,r=l+width,b=t+height;
        return l>=1 && t>=1 && r<w && b<h && !occupied.some(a=>l<a[2]&&r>a[0]&&t<a[3]&&b>a[1]);
      });
      if(!offset)continue;
      const [dx,dy]=offset, label=document.createElement('span');
      label.className='atlas-poi-name';label.setAttribute('aria-hidden','true');label.textContent=name;
      label.style.left='calc(50% + '+dx+'px)';label.style.top='calc(50% + '+dy+'px)';label.style.width=width+'px';
      button.append(label);occupied.push([x+dx,y+dy,x+dx+width,y+dy+height]);
    }
  }
  function drawLandmarks(fragment,occupied,sx,sy,w,h){
    occupied.push([0,0,60,100],[w-85,h-22,w,h]);
    for(const item of landmarks.slice(0,w<520?7:14)){
      const point=project(item.coords),x=sx(point),y=sy(point);
      if(x<4||y<4||x>w-4||y>h-4)continue;
      const width=item.name.length*12+8,height=18;
      const positions=[[5,-9],[-width-5,-9],[-width/2,-23],[-width/2,6],[5,-22],[-width-5,5],[5,6],[-width-5,-22]];
      for(const distance of [14,26,38,50]){
        positions.push([-width/2,-height-distance],[-width/2,distance],[distance,-9],[-width-distance,-9]);
      }
      const spot=positions.map(([dx,dy])=>[x+dx,y+dy,x+dx+width,y+dy+height])
        .find(([l,t,r,b])=>l>=2&&t>=2&&r<w-2&&b<h-2&&!occupied.some(box=>l<box[2]+1&&box[0]<r+1&&t<box[3]+1&&box[1]<b+1));
      if(!spot)continue;
      occupied.push(spot);
      const dx=clamp(x,spot[0],spot[2])-x,dy=clamp(y,spot[1],spot[3])-y;
      if(Math.hypot(dx,dy)>10){
        const leader=document.createElement('i');leader.className='atlas-site-leader';
        leader.style.cssText='left:'+x+'px;top:'+y+'px;width:'+Math.hypot(dx,dy)+'px;transform:rotate('+Math.atan2(dy,dx)+'rad)';
        fragment.append(leader);
      }
      const dot=document.createElement('i');dot.className='atlas-site-dot';
      dot.style.left=x+'px';dot.style.top=y+'px';
      const label=document.createElement('button');label.type='button';label.className='atlas-site-label';
      label.style.left=spot[0]+'px';label.style.top=spot[1]+'px';label.textContent=item.name;
      label.setAttribute('aria-label','查看'+item.name+'的文献');label.onclick=()=>selectPlace(item.id);
      fragment.append(dot,label);
    }
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function changeZoom(delta,x=root.clientWidth/2,y=root.clientHeight/2){
    const old=scale();zoom=clamp(zoom+delta,minZoom,17);
    center[0]+=(x-root.clientWidth/2)*(1/old-1/scale());
    center[1]+=(y-root.clientHeight/2)*(1/old-1/scale());schedule();
  }
  controls[0].onclick=()=>changeZoom(1);controls[1].onclick=()=>changeZoom(-1);
  function local(e){const r=root.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
  root.addEventListener('wheel',e=>{if(mode==='diagram')return;e.preventDefault();changeZoom(e.deltaY<0?1:-1,...local(e));},{passive:false});
  let regionTap=null;
  root.addEventListener('pointerdown',e=>{
    if(mode==='diagram'||e.target.closest('button,a')||e.button!==0)return;
    regionTap=fingers.size===0 && e.target.dataset.region ? {id:e.target.dataset.region,origin:local(e)} : null;
    fingers.set(e.pointerId,local(e));root.setPointerCapture(e.pointerId);
    if(fingers.size===2){const [a,b]=[...fingers.values()];pinchDistance=Math.hypot(a[0]-b[0],a[1]-b[1]);}
  });
  root.addEventListener('pointermove',e=>{
    const prev=fingers.get(e.pointerId);if(!prev)return;
    const next=local(e);fingers.set(e.pointerId,next);
    if(regionTap && Math.hypot(next[0]-regionTap.origin[0],next[1]-regionTap.origin[1])>5)regionTap=null;
    if(fingers.size===2){
      const [a,b]=[...fingers.values()],dist=Math.hypot(a[0]-b[0],a[1]-b[1]);
      if(dist>pinchDistance*1.5||dist<pinchDistance/1.5){changeZoom(dist>pinchDistance?1:-1,(a[0]+b[0])/2,(a[1]+b[1])/2);pinchDistance=dist;}
    }else{
      center[0]+=(prev[0]-next[0])/scale();center[1]=clamp(center[1]+(prev[1]-next[1])/scale(),.01,.99);schedule();
    }
  });
  root.addEventListener('pointerup',()=>{
    if(regionTap)pins.querySelector('button[data-region="'+regionTap.id+'"]')?.click();
    regionTap=null;
  });
  root.addEventListener('lostpointercapture',e=>{fingers.delete(e.pointerId);regionTap=null;});
  root.addEventListener('keydown',e=>{
    if(mode==='diagram'||e.target!==root)return;
    const move={ArrowLeft:[-70,0],ArrowRight:[70,0],ArrowUp:[0,-70],ArrowDown:[0,70]}[e.key];
    if(move){e.preventDefault();center=[center[0]+move[0]/scale(),center[1]+move[1]/scale()];schedule();}
    else if(['+','=','-'].includes(e.key)){e.preventDefault();changeZoom(e.key==='-'?-1:1);}
  });
  new ResizeObserver(schedule).observe(root);
  return {
    update(next,region,style,showMatches,showCulture=false){
      items=next;area=region;mode=style;searching=showMatches;cultureView=showCulture;
      root.dataset.mode=mode;root.dataset.overview=String(mode==='diagram'||(!area&&(!searching||cultureView)));credit.hidden=mode!=='street';
      controls[0].parentElement.hidden=mode==='diagram';
      const key=mode==='diagram'?mode:mode+':'+area;
      if(key!==viewKey){
        viewKey=key;
        const points=window.JIANGHAI_CATALOG.filter(p=>p.area===area).map(p=>project(p.coords));
        focusBounds=mode==='street'&&points.length?boundsOf(points):extents[mode];
        fit();
      }
      schedule();
    },
    reset(){
      viewKey=null;
      for(const [key,img] of tiles)if(img.dataset.failed){img.remove();tiles.delete(key);}
    }
  };
};
