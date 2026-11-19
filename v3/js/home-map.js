/* All public map entrances use the exhibition reader; old poem links retain their target. */
(() => {
  const mapLink='exhibit.html#map';
  document.querySelectorAll('a[href="research.html"]').forEach(a=>{a.href=mapLink;});
  const primary=document.querySelector('.tour-hero-actions .hero-primary');
  if(primary) primary.textContent='打开七境地图';
  const nav=document.querySelector('.topnav-research');
  if(nav) nav.textContent='七境地图 ↗';
  const poems=document.querySelector('.mode-card-research');
  if(poems) poems.href='exhibit.html#poems';
  document.querySelectorAll('a[href="#jianghai"]').forEach(a=>{
    a.href=a.classList.contains('mode-card-exhibit')?'exhibit.html#books':'exhibit.html';
  });
  document.getElementById('jianghai')?.remove();
  function readPoem() {
    const match=/^#read-poem-([1-8])$/.exec(location.hash);
    if(match)document.querySelector('.poem-card[data-poem="'+match[1]+'"]')?.click();
  }
  window.addEventListener('hashchange',readPoem);
  readPoem();
})();
