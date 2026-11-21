(() => {
  function followBookmark(){
    const hash=location.hash;
    const poem=/^#read-poem-([1-8])$/.exec(hash);
    if(poem||hash==='#archive'||hash==='#poems'){
      location.replace('shilu.html'+location.search+(poem?hash:'#archive'));
    }else if(hash==='#jianghai'){
      location.replace('exhibit.html'+location.search);
    }else if(/^#(?:[dp]=|why$|map$|timeline$|firsts$|books$|travel$|play$|search$)/.test(hash)){
      location.replace('exhibit.html'+location.search+hash);
    }
  }
  followBookmark();window.addEventListener('hashchange',followBookmark);
})();
