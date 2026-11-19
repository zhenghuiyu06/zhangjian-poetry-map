(() => {
  // Keep old exhibition bookmarks working after the homepage returns to the original layout.
  function redirectExhibitHash() {
    if (location.hash==='#jianghai') {
      location.replace('exhibit.html' + location.search);
    } else if (/^#(?:[dp]=|(?:why|map|timeline|firsts|books|travel|play|poems)$)/.test(location.hash)) {
      location.replace('exhibit.html' + location.search + location.hash);
    }
  }
  redirectExhibitHash();
  window.addEventListener('hashchange', redirectExhibitHash);
})();
