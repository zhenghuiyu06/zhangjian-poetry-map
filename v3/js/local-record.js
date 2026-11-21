let dbPromise=null;
    function activityDb(){
      if(!('indexedDB' in window))return Promise.reject(new Error('此浏览器不支持本机记录'));
      if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
        const request=indexedDB.open('zhangjian-poetry-observations-v2',2);
        let settled=false;
        const fail=error=>{if(settled)return;settled=true;clearTimeout(timer);reject(error)};
        const timer=setTimeout(()=>fail(new Error('读取记录超时，请刷新后重试')),8000);
        request.onupgradeneeded=()=>{
          const db=request.result;
          if(!db.objectStoreNames.contains('observations'))db.createObjectStore('observations',{keyPath:'id'});
          if(!db.objectStoreNames.contains('visits'))db.createObjectStore('visits',{keyPath:'key'});
          if(!db.objectStoreNames.contains('profiles'))db.createObjectStore('profiles',{keyPath:'id'});
        };
        request.onsuccess=()=>{const db=request.result;if(settled){db.close();return}settled=true;clearTimeout(timer);db.onversionchange=()=>{db.close();dbPromise=null};resolve(db)};
        request.onerror=()=>fail(request.error||new Error('本机记录无法打开'));
        request.onblocked=()=>fail(new Error('本机记录被其他页面占用；请关闭其他旧版预览标签后刷新'));
      }).catch(error=>{dbPromise=null;throw error});
      return dbPromise;
    }
    function localRecord(storeName,mode,operation,value){
      return activityDb().then(db=>new Promise((resolve,reject)=>{
        const tx=db.transaction(storeName,mode),request=tx.objectStore(storeName)[operation](value);
        let result;
        request.onsuccess=()=>{result=request.result};
        tx.oncomplete=()=>resolve(result);
        tx.onerror=()=>reject(tx.error||new Error('本机记录失败'));
        tx.onabort=()=>reject(tx.error||new Error('本机记录已中断'));
      }));
    }
