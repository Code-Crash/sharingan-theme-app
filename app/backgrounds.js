'use strict';
// Painted vector cloud banks stay in the scenery; a horizontal mask protects
// the characters. CSS moves cached layers rather than redrawing a full filter.
function mountBackgroundAtmospheres(){
  const cloud='<svg viewBox="0 0 1600 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-180 350C-80 280 15 330 100 265S265 275 325 200S495 250 590 175S755 245 840 185S1000 250 1085 190S1250 280 1360 220S1530 275 1700 195V520H-180Z"/><path d="M-100 430C25 370 100 410 210 340S405 370 500 300S650 370 760 300S970 370 1080 310S1300 385 1400 315S1590 370 1700 300V520H-100Z" opacity=".55"/></svg>';
  for(const id of ['rain','naruto','hinata','sasuke','sakura']){
    const layer=document.createElement('div');layer.className='background-atmosphere';layer.dataset.atmosphere=id;layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="background-clouds clouds-far">'+cloud+'</div><div class="background-clouds clouds-near">'+cloud+'</div>';
    if(id==='sakura')for(let i=0;i<9;i++){
      const light=document.createElement('span');light.className='blossom-bokeh';light.style.cssText='left:'+(5+i*5)+'%;top:'+(28+i%4*11)+'%;animation-delay:'+(-i*1.3)+'s;';layer.appendChild(light);
    }
    const target=id==='rain'?document.getElementById('artwork'):document.getElementById(id+'-stage');
    target.appendChild(layer);
  }
  // Animate only a translucent lunar surface: the painted silhouette, clouds,
  // mountain and Hinata's hair remain stationary in front of it.
  const moon=document.createElement('div');moon.className='hinata-lunar-surface';moon.setAttribute('aria-hidden','true');
  moon.innerHTML='<svg viewBox="750 0 310 310" preserveAspectRatio="none"><defs><clipPath id="lunar-visible"><path d="M760 134 A145 145 0 0 1 1016 57 L997 104 1013 123 986 151 977 190 957 223 950 273 Q904 290 856 267 L847 250 817 249 807 214 782 208 777 179 766 166Z"/></clipPath><radialGradient id="lunar-soft"><stop offset="0" stop-color="white"/><stop offset=".8" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="lunar-edge"><circle cx="903" cy="153" r="141" fill="url(#lunar-soft)"/></mask></defs><g clip-path="url(#lunar-visible)" mask="url(#lunar-edge)"><g class="lunar-craters">'+Array.from({length:22},(_,i)=>{const a=i*2.39996,r=22+Math.sqrt(i/22)*106,x=903+Math.cos(a)*r,y=153+Math.sin(a)*r;return '<circle cx="'+x+'" cy="'+y+'" r="'+(5+i%5*3)+'" fill="'+(i%2?'#8781bc':'#f3e5ff')+'" opacity=".25"/>';}).join('')+'</g></g></svg>';
  document.getElementById('hinata-stage').appendChild(moon);
  const trees=document.createElement('div');trees.className='hinata-tree-wind';trees.setAttribute('aria-hidden','true');
  // Only leafy scenery: exclude the lake, distant buildings and character.
  trees.innerHTML='<svg viewBox="0 0 720 750" preserveAspectRatio="none"><defs><clipPath id="tree-wind-mask"><path d="M0 70 198 70 198 205 295 230 319 345 448 375 485 424 275 434 275 556 490 573 624 649 697 693 480 734 238 690 0 707Z"/></clipPath></defs><image href="assets/hinata-moon.png" width="1672" height="941" clip-path="url(#tree-wind-mask)"/></svg>';
  // Below the clouds/eyes, with feathered edges hiding the small displacement.
  document.getElementById('hinata-stage').insertBefore(trees,document.getElementById('hinata-water'));

}
