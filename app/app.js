'use strict';
const APP_ID = 'com.dextor.sharingan';
let startupParams={};try{const raw=typeof webOSSystem!=='undefined'?webOSSystem.launchParams:typeof PalmSystem!=='undefined'?PalmSystem.launchParams:null;startupParams=typeof raw==='string'?JSON.parse(raw):raw||{};}catch(_){}
const BASE_APPS = [
  {name:'YouTube', id:'youtube.leanback.v4', logo:'<path d="M66 12C64 5 60 3 53 2a255 255 0 0 0-36 0C10 3 6 5 4 12a80 80 0 0 0 0 25c2 7 6 9 13 10a255 255 0 0 0 36 0c7-1 11-3 13-10a80 80 0 0 0 0-25Z"/><path d="m29 14 19 11-19 11Z" fill="#09111e"/>',viewBox:'0 0 70 50'},
  {name:'Netflix', id:'netflix', logo:'<path d="M22 1h9v48l-9 1zM48 0h9v50l-9-1z"/><path d="M22 1h9l26 49-10-1z" fill="#fff"/>',viewBox:'0 0 80 52'},
  {name:'Prime Video', id:'amazon', logo:'<text x="50" y="24" text-anchor="middle" font-size="20" font-weight="bold" letter-spacing="-1">prime video</text><path d="M20 33 Q48 50 80 32 M74 32l9-1-2 9" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>',viewBox:'0 0 100 52'},
  {name:'Web Browser', id:'com.webos.app.browser', logo:'<g fill="none" stroke="white" stroke-width="2.4"><circle cx="35" cy="25" r="20"/><ellipse cx="35" cy="25" rx="9" ry="20"/><path d="M15 25h40M19 14h32M19 36h32"/></g>',viewBox:'0 0 70 50'}
];
const DEFAULT_APP_IDS=['youtube.leanback.v4','netflix','amazon','hotstar','com.crunchyroll.webapp'];
const CATALOG=[...BASE_APPS,...(window.APP_CATALOG||[]).filter(app=>!BASE_APPS.some(base=>base.id===app.id))].map(app=>({...app})).sort((a,b)=>{const ai=DEFAULT_APP_IDS.indexOf(a.id),bi=DEFAULT_APP_IDS.indexOf(b.id);return (ai<0?99:ai)-(bi<0?99:bi);});
CATALOG.forEach(app=>{if(app.id==='hotstar'){app.logo='<path d="m35 1 8 17 19 2-14 13 4 19-17-9-17 9 4-19L8 20l19-2Z"/>';app.viewBox='0 0 70 54';}else if(!app.logo){const name=app.name==='TV Cast - Screen Mirroring'?'TV Cast':app.name;app.logo='<text x="50" y="30" text-anchor="middle" font-size="'+(name.length>10?12:17)+'" font-weight="bold">'+name.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</text>';app.viewBox='0 0 100 50';}});
let APPS=[],buttons=[];
let preferences;
try { preferences=JSON.parse(localStorage.getItem('sharingan.preferences'))||{}; } catch (_) { preferences={}; }
const THEMES=[
  {id:'rain',name:'Itachi · Midnight Rain',detail:'Eyes follow your apps · random blinks',image:'itachi-rain.png'},
  {id:'red',name:'Itachi · Crimson Moon',detail:'Rotating Sharingan · flying crows',image:'red-background.png'},
  {id:'naruto',name:'Naruto · Golden Hour',detail:'Tracking eyes · Rasengan app launch',image:'naruto-eyes-base.png'},
  {id:'hinata',name:'Hinata · Moonlit Byakugan',detail:'Lavender eyes · moon mist & fireflies',image:'hinata-moon.png'},
  {id:'sasuke',name:'Sasuke · Violet Storm',detail:'Sharingan & Rinnegan · Chidori lightning',image:'sasuke-storm.png'},
  {id:'sakura',name:'Sakura · Blossom Sanctuary',detail:'Green eyes · petals & healing chakra',image:'sakura-blossom.png'},
  {id:'kurama',name:'Kurama · Nine-Tails Moon',detail:'Slow tail sway · embers & fox chakra',image:'kurama-moon.png'},
  {id:'chakra',name:'Naruto · Chakra Sync',detail:'Living chakra flames · golden Rasengan',image:'chakra-sync.png'}
];
const options=Object.assign({motion:true,blink:true,hour12:false,theme:'rain',autoTheme:true,themeIntervalSeconds:60,keepVisible:true,ambientMusic:true},preferences);
if(options.themeRotationVersion!==1){options.autoTheme=true;options.themeIntervalSeconds=60;options.themeRotationVersion=1;}
if(![30,60].includes(options.themeIntervalSeconds))options.themeIntervalSeconds=60;
options.keepVisible=true;
if(options.theme==='poster')options.theme='hinata';
if(!THEMES.some(theme=>theme.id===options.theme))options.theme='rain';
// Local review links select a scene without changing the TV's startup behavior.
const previewTheme=typeof PalmServiceBridge==='undefined'?new URLSearchParams(location.search).get('theme'):null;
if(THEMES.some(theme=>theme.id===previewTheme)){options.theme=previewTheme;options.autoTheme=false;}
// Apply the user's five-app default once on this upgrade; later checkbox edits
// remain theirs and are retained across reopening and future theme changes.
if(options.appDefaultsVersion!==1){options.appIds=[...DEFAULT_APP_IDS];options.appDefaultsVersion=1;}
options.appIds=Array.isArray(options.appIds)?options.appIds.filter(id=>CATALOG.some(app=>app.id===id)):[...DEFAULT_APP_IDS];
delete options.musicVolume;
if(!options.appIds.length)options.appIds=[BASE_APPS[0].id];
let selected=0, panelIndex=0, busy=false, toastTimer, blinkTimer, introTimer;
let themeIndex=0,themeReturn='apps',lastThemeChange=Date.now();
let appIndex=0,homeStateTimer,homeStatePending=null,homeEnsurePending=null,introHasPlayed=false;
const pendingRequests=new Set();
const scene=document.getElementById('scene');
mountBackgroundAtmospheres();
const kuramaScenes=new DashboardKuramaScenes();
const panel=document.getElementById('panel');
const panelButtons=Array.from(panel.querySelectorAll('button'));
const themePanel=document.getElementById('theme-panel');
const appPanel=document.getElementById('app-panel');
const cornerButtons=[document.getElementById('themes-button'),document.getElementById('lg-home'),document.getElementById('settings')];
const diagnostics=[];
function record(event,data) { diagnostics.push({time:new Date().toISOString(),event,data}); if(diagnostics.length>60)diagnostics.shift(); console.log('[Sharingan]',event,data); }
const screenSaver=new DashboardScreenSaver({clientName:APP_ID,
  createBridge:()=>typeof PalmServiceBridge==='undefined'?null:new PalmServiceBridge(),
  isVisible:()=>!document.hidden,isEnabled:()=>options.keepVisible,
  onEvent:(state,data)=>record('screensaver-'+state,data)
});
const ambient=new DashboardAmbient({
  createAudio:src=>new Audio(src),getTrack:()=>window.DASHBOARD_MUSIC,
  createContext:()=>{const Context=window.AudioContext||window.webkitAudioContext;return Context?new Context():null;},
  isVisible:()=>!document.hidden,isEnabled:()=>options.ambientMusic,getVolume:()=>.12,
  onEvent:(state,data)=>record('ambient-'+state,data)
});
window.sharingan={get apps(){return APPS;},catalog:CATALOG,themes:THEMES,diagnostics,get selected(){return selected;},get options(){return {...options};}};
function request(method,parameters,service='com.webos.applicationManager') {
  return new Promise((resolve,reject)=>{
    if(typeof PalmServiceBridge==='undefined'){reject({errorCode:'preview',errorText:'TV connection is available on the installed TV app.'});return;}
    const bridge=new PalmServiceBridge();pendingRequests.add(bridge);
    const timeout=setTimeout(()=>{pendingRequests.delete(bridge);try{bridge.cancel();}catch(_){}reject({errorCode:'timeout',errorText:'TV service did not respond.'});},7000);
    bridge.onservicecallback=response=>{
      clearTimeout(timeout);pendingRequests.delete(bridge);
      try{const data=JSON.parse(response);record(method,data);data.returnValue?resolve(data):reject(data);}catch(e){reject(e);}
    };
    try{bridge.call('luna://'+service+'/'+method,JSON.stringify(parameters));}catch(error){clearTimeout(timeout);pendingRequests.delete(bridge);reject(error);}
  });
}
function toast(message){const element=document.getElementById('toast');element.textContent=message;element.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove('visible'),5000);}
function renderApps(){
  const previous=APPS[selected]?.id;
  APPS=CATALOG.filter(app=>options.appIds.includes(app.id));
  selected=Math.max(0,APPS.findIndex(app=>app.id===previous));
  const row=document.getElementById('apps');row.replaceChildren();
  row.style.setProperty('--dock-count',Math.min(APPS.length,6));
  APPS.forEach((app,index)=>{
  const button=document.createElement('button');button.className='app';button.setAttribute('aria-label',app.name);button.innerHTML='<svg class="logo" viewBox="'+app.viewBox+'" aria-hidden="true">'+app.logo+'</svg><span class="label">'+app.name+'</span>';
  button.addEventListener('mouseenter',()=>select(index));
  button.addEventListener('focus',()=>{if(selected!==index)select(index);});
  button.addEventListener('click',()=>{select(index);launch(index);});
  document.getElementById('apps').appendChild(button);
  });
  buttons=Array.from(document.querySelectorAll('.app'));select(selected);updateChecklist();
}
function select(index,focus=false){
  if(busy)return;
  const changed=selected!==Math.max(0,Math.min(APPS.length-1,index));
  selected=Math.max(0,Math.min(APPS.length-1,index));
  buttons.forEach((button,i)=>{button.classList.toggle('selected',i===selected);button.tabIndex=i===selected?0:-1;});
  document.getElementById('settings').classList.remove('selected');
  const row=document.getElementById('apps');
  const button=buttons[selected];
  // Keep a six-icon window while preserving access to the whole selected app list.
  const desired=Math.max(0,Math.min(row.scrollWidth-row.clientWidth,button.offsetLeft+button.offsetWidth/2-row.clientWidth/2));
  row.scrollLeft=desired;
  document.getElementById('spotlight').style.transform='translateX('+(button.offsetLeft+button.offsetWidth/2-desired)+'px) translateX(-50%)';
  updateTracking();
  if(changed&&options.motion)sendSelectionPower(selected);
  if(focus)buttons[selected].focus({preventScroll:true});
}
function updateTracking(){
  const target=buttons[selected].querySelector('.logo').getBoundingClientRect();
  const art=document.getElementById('artwork').getBoundingClientRect();
  const eyeSvg=options.theme==='rain'?document.getElementById('eyes'):document.querySelector('#'+options.theme+'-stage .character-eyes');
  if(eyeSvg){const space=eyeSvg.viewBox.baseVal,eyeBounds=eyeSvg.getBoundingClientRect();
    if(eyeBounds.width&&eyeBounds.height){
      const tx=(target.left+target.width/2-eyeBounds.left)/eyeBounds.width*space.width,ty=(target.top+target.height/2-eyeBounds.top)/eyeBounds.height*space.height;
      eyeSvg.querySelectorAll('.gaze').forEach(eye=>{const dx=tx-Number(eye.dataset.x),dy=ty-Number(eye.dataset.y),distance=Math.hypot(dx,dy)||1;
        eye.style.transform='translate('+(dx/distance*Number(eye.dataset.rangeX||17)).toFixed(2)+'px,'+(dy/distance*Number(eye.dataset.rangeY||13)).toFixed(2)+'px)';});
    }
  }
  updateArm({x:(target.left+target.width/2-art.left)/art.width*1920,y:(target.top+target.height/2-art.top)/art.height*1080});
}
function mountEyes(theme,eyes,skin){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('character-eyes');svg.setAttribute('viewBox','0 0 1672 941');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  svg.innerHTML=eyes.map((eye,index)=>{
    const id='eye-'+theme+'-'+index,gradient=id+'-iris',color=eye.color||'#247fda';
    const rings=eye.type==='byakugan'?'<circle r="'+(eye.r*.72)+'" fill="none" stroke="#b8a5df" stroke-width="1" opacity=".65"/><circle r="'+(eye.r*.15)+'" fill="#f0eaff" opacity=".65"/>':eye.type==='rinnegan'?[.25,.49,.73].map(size=>'<circle r="'+(eye.r*size)+'" fill="none" stroke="#51406e" stroke-width=".8"/>').join('')+'<circle r="1.5" fill="#45305c"/>':'<circle r="'+eye.r*.36+'" fill="#071629"/><circle cx="'+(-eye.r*.28)+'" cy="'+(-eye.r*.35)+'" r="'+eye.r*.16+'" fill="#effbff"/>';
    const texture=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return '<path d="M'+Math.cos(a)*eye.r*.48+' '+Math.sin(a)*eye.r*.48+' L'+Math.cos(a)*eye.r*.87+' '+Math.sin(a)*eye.r*.87+'" stroke="#e3f4ff" stroke-width=".5" opacity=".2"/>';}).join('');
    const slit=eye.type==='fox'||eye.type==='chakra';
    const iris=eye.type==='sharingan'?'<use href="#sharingan" transform="scale('+(eye.r/29)+')"/>':slit?'<circle r="'+eye.r+'" fill="url(#'+gradient+')"/><ellipse rx="'+eye.r*.18+'" ry="'+eye.r*.85+'" fill="#160b08" transform="rotate('+(eye.rotation||0)+')"/><circle cx="'+(-eye.r*.26)+'" cy="'+(-eye.r*.30)+'" r="'+eye.r*.13+'" fill="#fff0c7"/>':'<circle r="'+eye.r+'" fill="url(#'+gradient+')" stroke="'+(eye.type==='byakugan'?'#a591cb':'#1a2543')+'" stroke-width=".8"/>'+texture+rings;
    const inner=eye.inner||(slit?'#ffdf78':eye.type==='byakugan'?'#f2edff':eye.type==='rinnegan'?'#d0bde7':theme==='sakura'?'#9cdabc':'#7fc9f5');
    const outer=eye.outer||(slit?'#ac3a08':eye.type==='byakugan'?'#a695ce':eye.type==='rinnegan'?'#796293':theme==='sakura'?'#255d49':'#174f79');
    return '<defs><path id="'+id+'" d="'+eye.path+'"/><clipPath id="'+id+'-clip"><use href="#'+id+'"/></clipPath><radialGradient id="'+gradient+'"><stop stop-color="'+inner+'"/><stop offset=".6" stop-color="'+color+'"/><stop offset="1" stop-color="'+outer+'"/></radialGradient></defs><g class="'+(eye.type==='fox'?'fox-eye':'')+'" clip-path="url(#'+id+'-clip)"><use href="#'+id+'" fill="'+(eye.sclera||(slit?'#f1bc62':eye.type==='byakugan'?'#e3daf3':'#dce7e9'))+'"/><g transform="translate('+eye.x+' '+eye.y+')"><g class="gaze '+(eye.type==='byakugan'?'byakugan':'')+'" data-x="'+eye.x+'" data-y="'+eye.y+'" data-range-x="'+eye.r*.34+'" data-range-y="'+eye.r*.24+'">'+iris+'</g></g><use class="lid" href="#'+id+'" fill="'+(eye.skin||skin)+'"/></g>';
  }).join('');
  document.getElementById(theme+'-stage').appendChild(svg);
}
function updateArm(target){
  // The complete character stays static. Crows provide selection feedback.
  window.sharingan.armPose={mode:'static-character',target,rotation:0,scale:1};
}
function sendCrows(index){
  if(!options.motion||!['red','rain'].includes(options.theme))return;
  const layer=document.getElementById('crow-flight');
  layer.getAnimations({subtree:true}).forEach(animation=>animation.cancel());layer.replaceChildren();
  const bounds=scene.getBoundingClientRect(),target=buttons[index].querySelector('.logo').getBoundingClientRect();
  const end={x:target.left+target.width/2-bounds.left,y:target.top+target.height/2-bounds.top};
  record('crow-selection',{app:APPS[index].id,target:end});
  for(let i=0;i<7;i++){
    const bird=document.createElement('div');bird.className='flying-crow';bird.innerHTML='<svg viewBox="0 0 120 60"><path d="M53 26 58 18 65 22 71 20 68 28 65 40 69 54 60 48 51 54 55 40Z"/><path class="crow-wing left-wing" d="M59 31 Q30-2 1 5 Q15 20 30 26 L20 27 Q36 37 59 36Z"/><path class="crow-wing right-wing" d="M61 31 Q90-2 119 5 Q105 20 90 26 L100 27 Q84 37 61 36Z"/></svg>';layer.appendChild(bird);
    const start={x:bounds.width*(options.theme==='red'?.60:.63)+(i-3)*34,y:bounds.height*(options.theme==='red'?.54:.48)+(i%3-1)*28};
    const finish={x:end.x+(i-3)*26,y:end.y-65-(i%3)*22};
    const angle=Math.atan2(finish.y-start.y,finish.x-start.x)*180/Math.PI+90;
    const frame=(point,scale)=>'translate('+point.x+'px,'+point.y+'px) translate(-50%,-50%) rotate('+angle+'deg) scale('+scale+')';
    const animation=bird.animate([{transform:frame(start,.65),opacity:0},{transform:frame({x:start.x*.7+finish.x*.3,y:start.y-55-(i%3)*24},1.05),opacity:1,offset:.3},{transform:frame(finish,.7),opacity:0}],{duration:1050+i*35,delay:i*40,easing:'cubic-bezier(.2,.5,.5,1)',fill:'both'});
    animation.finished.catch(()=>{}).finally(()=>bird.remove());
  }
}
function clearPowerLayer(){const layer=document.getElementById('selection-power');layer.getAnimations({subtree:true}).forEach(a=>a.cancel());layer.replaceChildren();}
function sendSelectionPower(index){
  if(!options.motion)return;
  if(['rain','red'].includes(options.theme)){sendCrows(index);return;}
  sendPower(index,false).catch(()=>{});
}
async function sendPower(index,strong=false){
  if(!options.motion)return;
  clearPowerLayer();
  const theme=options.theme,layer=document.getElementById('selection-power'),bounds=scene.getBoundingClientRect(),icon=buttons[index].querySelector('.logo').getBoundingClientRect();
  const origins={naruto:[.791,.45],hinata:[.84,.64],sasuke:[.82,.68],sakura:[.85,.60],kurama:[.737,.337],chakra:[.762,.55]};
  const origin=origins[theme]||[.7,.55],start={x:bounds.width*origin[0],y:bounds.height*origin[1]},end={x:icon.left+icon.width/2-bounds.left,y:icon.top+icon.height/2-bounds.top};
  if(theme==='naruto'){const orb=document.getElementById('rasengan').getBoundingClientRect();start.x=orb.left+orb.width/2-bounds.left;start.y=orb.top+orb.height/2-bounds.top;}
  const names={naruto:'Rasengan chakra',hinata:'Twin Lion chakra',sasuke:'Chidori',sakura:'healing chakra',kurama:'Nine-Tails chakra',chakra:'golden Rasengan'};
  record('character-power',{theme,power:names[theme],app:APPS[index].id,strong,start,end});
  if(theme==='sasuke'){
    const arc=document.createElementNS('http://www.w3.org/2000/svg','svg');arc.classList.add('chidori-arc');arc.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
    const dx=end.x-start.x,dy=end.y-start.y;
    const d='M'+start.x+' '+start.y+' L'+(start.x+dx*.3)+' '+(start.y+dy*.3-32)+' l-18 27 L'+(start.x+dx*.63)+' '+(start.y+dy*.63-18)+' l-12 24 L'+end.x+' '+end.y;
    arc.innerHTML='<path d="'+d+'" class="arc-glow"/><path d="'+d+'" class="arc-core"/>';layer.appendChild(arc);
    const animation=arc.animate([{opacity:0},{opacity:1,offset:.15},{opacity:.3,offset:.3},{opacity:1,offset:.5},{opacity:0}],{duration:strong?700:420});
    await animation.finished.catch(()=>{});arc.remove();return;
  }
  const orb=document.createElement('div');orb.className='power-orb power-'+theme+(strong?' strong':'');
  if(theme==='hinata')orb.innerHTML='<svg viewBox="0 0 120 120"><path d="M18 46 12 18 39 29 60 17 81 29 108 18 102 46 112 69 94 96 73 112 60 104 47 112 26 96 8 69Z"/><path d="m30 55 17 6-11 8m54-14-17 6 11 8M47 82l13 8 13-8m-13 8v12" class="lion-face"/></svg>';
  if(theme==='sakura')orb.innerHTML='<span class="healing-ribbon"></span><span class="healing-ribbon"></span><span class="healing-ribbon"></span>';
  if(theme==='kurama'||theme==='chakra')orb.innerHTML='<span class="fox-chakra-ring"></span><span class="fox-chakra-ring"></span><span class="fox-chakra-ring"></span>';
  layer.appendChild(orb);const scale=strong?1:.55;
  const frame=(p,s)=>'translate('+p.x+'px,'+p.y+'px) translate(-50%,-50%) scale('+s+')';
  const flight=orb.animate([{transform:frame(start,.2),opacity:0},{transform:frame(start,scale),opacity:1,offset:.15},{transform:frame({x:(start.x+end.x)/2,y:Math.min(start.y,end.y)-bounds.height*.08},scale),opacity:1,offset:.55},{transform:frame(end,scale*.5),opacity:0}],{duration:strong?850:650,easing:'cubic-bezier(.2,.4,.7,1)',fill:'forwards'});
  await flight.finished.catch(()=>{});orb.remove();
  if(strong&&['kurama','chakra'].includes(theme)&&!document.hidden&&options.motion){
    const impact=document.createElement('div');impact.className='fox-impact '+theme+'-impact';impact.style.left=end.x+'px';impact.style.top=end.y+'px';layer.appendChild(impact);
    await impact.animate([{transform:'translate(-50%,-50%) scale(.25)',opacity:.8},{transform:'translate(-50%,-50%) scale(1.4)',opacity:0}],{duration:340,easing:'ease-out'}).finished.catch(()=>{});impact.remove();
  }
}
async function checkApps(){
  if(typeof PalmServiceBridge==='undefined')return;
  await Promise.all(CATALOG.map(async(app)=>{
    try{const result=await request('getAppLoadStatus',{appId:app.id});app.installed=result.exist;const i=APPS.findIndex(item=>item.id===app.id);if(i>=0){buttons[i].classList.toggle('unavailable',result.exist===false);buttons[i].setAttribute('aria-label',app.name+(result.exist===false?' — not installed':''));}}catch(e){record('check-failed',{id:app.id,error:e});}
  }));updateChecklist();
}
async function launch(index){
  if(busy)return;
  const app=APPS[index];
  if(!app)return;
  if(app.installed===false){toast(app.name+' is not installed on this TV.');return;}
  busy=true;scene.classList.add('opening');
  try{
    if(options.motion&&options.theme==='naruto')await playRasengan(index);
    else if(options.motion&&['hinata','sasuke','sakura','kurama','chakra'].includes(options.theme))await sendPower(index,true);
    else if(options.motion&&['red','rain'].includes(options.theme)){sendCrows(index);await new Promise(resolve=>setTimeout(resolve,850));}
    else await new Promise(resolve=>setTimeout(resolve,options.motion?280:0));
    if(document.hidden){record('launch-cancelled',app.id);return;}
    screenSaver.suspend();await ambient.suspend();await request('launch',{id:app.id});record('launch-success',app.id);
  }
  catch(e){screenSaver.resume();ambient.resume();record('launch-error',{id:app.id,error:e});toast(e.errorCode==='preview'?'Preview only — '+app.name+' opens on the TV.':'Could not open '+app.name+': '+(e.errorText||e.message||'TV denied the request.'));}
  finally{setTimeout(()=>{busy=false;scene.classList.remove('opening');},600);}
}
async function playRasengan(index){
  const ball=document.getElementById('rasengan-projectile'),impact=document.getElementById('rasengan-impact');
  const sceneBounds=scene.getBoundingClientRect(),source=document.getElementById('rasengan').getBoundingClientRect(),destination=buttons[index].querySelector('.logo').getBoundingClientRect();
  const size=Math.min(source.width,sceneBounds.width*.13);ball.style.width=size+'px';ball.style.height=size+'px';
  const start={x:source.left+source.width/2-sceneBounds.left-size/2,y:source.top+source.height/2-sceneBounds.top-size/2};
  const end={x:destination.left+destination.width/2-sceneBounds.left-size/2,y:destination.top+destination.height/2-sceneBounds.top-size/2};
  const pos=(point,scale)=>'translate('+point.x+'px,'+point.y+'px) scale('+scale+')';
  ball.hidden=false;scene.classList.add('casting');
  record('rasengan-cast',{app:APPS[index].id,start,end,duration:830});
  try{
    const flight=ball.animate([
      {transform:pos(start,.65),opacity:0,offset:0},
      {transform:pos(start,1.1),opacity:1,offset:.17},
      {transform:pos({x:(start.x+end.x)/2,y:Math.min(start.y,end.y)-sceneBounds.height*.1},.9),opacity:1,offset:.52},
      {transform:pos(end,.32),opacity:1,offset:1}
    ],{duration:650,easing:'cubic-bezier(.3,.05,.7,1)',fill:'forwards'});
    await flight.finished.catch(()=>{});flight.cancel();ball.hidden=true;
    if(!options.motion)return;
    impact.hidden=false;impact.style.left=(destination.left+destination.width/2-sceneBounds.left)+'px';impact.style.top=(destination.top+destination.height/2-sceneBounds.top)+'px';
    const burst=impact.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:'translate(-50%,-50%) scale(1.8)',opacity:0}],{duration:180,easing:'ease-out'});
    await burst.finished.catch(()=>{});burst.cancel();record('rasengan-impact',APPS[index].id);
  }finally{ball.hidden=true;impact.hidden=true;scene.classList.remove('casting');}
}
function updateClock(){
  const now=new Date();let hours=now.getHours();if(options.hour12)hours=hours%12||12;
  document.getElementById('hours').textContent=String(hours).padStart(2,'0');document.getElementById('minutes').textContent=String(now.getMinutes()).padStart(2,'0');
  const seconds=document.getElementById('seconds'),next=String(now.getSeconds()).padStart(2,'0');
  if(seconds.textContent!==next){seconds.textContent=next;seconds.classList.remove('tick');void seconds.offsetWidth;seconds.classList.add('tick');}
  document.getElementById('date').textContent=now.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})+(options.hour12?' · '+(now.getHours()<12?'AM':'PM'):'');
}
function blink(){if(options.blink&&options.motion&&!document.hidden){scene.classList.remove('blinking');void scene.offsetWidth;scene.classList.add('blinking');}clearTimeout(blinkTimer);blinkTimer=setTimeout(blink,4000+Math.random()*6000);}
function finishIntro(){clearTimeout(introTimer);document.getElementById('intro').classList.add('done');}
function intro(){if(startupParams.homeShortcut===true||previewTheme){introHasPlayed=true;finishIntro();return;}if(introHasPlayed){finishIntro();return;}introHasPlayed=true;record('intro-shown');clearTimeout(introTimer);const el=document.getElementById('intro');if(!options.motion){el.classList.add('done');return;}el.classList.remove('done');const svg=el.querySelector('svg');svg.style.animation='none';void svg.getBoundingClientRect();svg.style.animation='';introTimer=setTimeout(()=>el.classList.add('done'),1000);}
function applyOptions(){
  scene.classList.toggle('still',!options.motion);scene.dataset.theme=options.theme;
  kuramaScenes.sync(options.theme,options.motion,!document.hidden&&!scene.classList.contains('backgrounded'));
  ['motion','hour12','ambientMusic'].forEach(key=>document.getElementById(key+'-value').textContent=options[key]?'On':'Off');
  document.getElementById('rotationMode-value').textContent=options.autoTheme?(options.themeIntervalSeconds===30?'30 seconds':'1 minute'):'Off';
  if(!window.DASHBOARD_MUSIC.src)document.getElementById('ambientMusic-value').textContent='No track';
  try{localStorage.setItem('sharingan.preferences',JSON.stringify(options));}catch(_){}
  document.querySelectorAll('.theme-card').forEach(card=>{const active=card.dataset.theme===options.theme;card.setAttribute('aria-pressed',String(active));card.querySelector('.theme-active').hidden=!active;});
  for(const theme of THEMES){const stage=document.getElementById(theme.id+'-stage');if(stage)stage.classList.toggle('theme-inactive',theme.id!==options.theme);}
  if(!options.motion||document.hidden||scene.classList.contains('backgrounded')){
    clearPowerLayer();
    const crows=document.getElementById('crow-flight');crows.getAnimations({subtree:true}).forEach(a=>a.cancel());crows.replaceChildren();
    for(const id of ['rasengan-projectile','rasengan-impact'])document.getElementById(id).getAnimations().forEach(a=>a.cancel());
  }
  screenSaver.sync();ambient.sync();updateClock();requestAnimationFrame(updateTracking);
}
function openPanel(){if(busy)return;panel.hidden=false;panelIndex=0;panelButtons[0].focus();refreshHomeState();updateHint();}
function closePanel(){panel.hidden=true;clearTimeout(homeStateTimer);select(selected,true);updateHint();}
panelButtons.forEach((button,index)=>{button.addEventListener('focus',()=>panelIndex=index);button.addEventListener('click',async()=>{
  const key=button.dataset.setting;
  if(key==='close')closePanel();
  else if(key==='themes')openThemes('settings');
  else if(key==='apps')openApps();
  else if(key==='ambientMusic'&&!window.DASHBOARD_MUSIC.src)toast('Add your Naruto soundtrack first.');
  else if(key==='rotationMode'){if(!options.autoTheme){options.autoTheme=true;options.themeIntervalSeconds=30;}else if(options.themeIntervalSeconds===30)options.themeIntervalSeconds=60;else options.autoTheme=false;lastThemeChange=Date.now();applyOptions();}
  else{options[key]=!options[key];applyOptions();}
});});
function refreshHomeState(){
  clearTimeout(homeStateTimer);
  if(typeof PalmServiceBridge==='undefined'){document.getElementById('home-note').textContent='Local preview · app launch effects enabled';return Promise.resolve();}
  if(homeStatePending)return homeStatePending;
  homeStatePending=request('status',{},'com.dextor.sharingan.helper').then(result=>{
    const state=result.state;document.getElementById('home-note').textContent=state.active?'Home: Sharingan · Hold Home: LG Home':state.starting?'Home: starting…':'Home shortcut unavailable';
  }).catch(()=>{document.getElementById('home-note').textContent='Home shortcut unavailable';}).finally(()=>{
    homeStatePending=null;
    if(!document.hidden&&document.getElementById('home-note').textContent==='Home: starting…')homeStateTimer=setTimeout(refreshHomeState,1000);
  });return homeStatePending;
}
function updateHint(){
  document.getElementById('hint').textContent=!appPanel.hidden?'Arrows Choose apps · OK Show / Hide · Back Done':!themePanel.hidden?'Arrows Choose theme · OK Apply · Back Close':!panel.hidden?'↑ ↓ Choose setting · → / OK Change · ← / Back Close':'← → Choose an app · OK Open';
}
function syncDashboardVisibility(visible){
  scene.classList.toggle('backgrounded',!visible);
  kuramaScenes.sync(options.theme,options.motion,visible);
  if(!visible){finishIntro();clearTimeout(homeStateTimer);clearPowerLayer();const crows=document.getElementById('crow-flight');crows.getAnimations({subtree:true}).forEach(a=>a.cancel());crows.replaceChildren();}
}


async function homeControl(method,params={}){
  try{const result=await request(method,params,'com.dextor.sharingan.helper');record('home-helper',result);setTimeout(refreshHomeState,1500);toast(method==='pause'?'Home-button interception paused.':params.trialSeconds>0?'Home-button test: 2 minutes. Dashboard stays open.':result.state?.active?'Home button enabled.':'Starting Home button…');return result;}
  catch(e){toast(e.errorText||'Home helper is unavailable.');return null;}
}
async function openLGHome(){
  // A direct stock-Home launch does not emit a physical Home key; keep the shortcut enabled.
  try{screenSaver.suspend();await ambient.suspend();await request('launch',{id:'com.webos.app.home'});}catch(e){screenSaver.resume();ambient.resume();toast(e.errorText||'Could not open LG Home.');}
}
function ensureHomeHelper(){if(window.homeMaintenance)return Promise.resolve();if(typeof PalmServiceBridge==='undefined'){document.getElementById('home-note').textContent='Local preview · app launch effects enabled';return Promise.resolve();}if(homeEnsurePending)return homeEnsurePending;homeEnsurePending=request('resume',{trialSeconds:0,keepForeground:false},'com.dextor.sharingan.helper').then(()=>refreshHomeState()).catch(error=>{record('home-start-error',error);document.getElementById('home-note').textContent='Home shortcut unavailable';}).finally(()=>{homeEnsurePending=null;});return homeEnsurePending;}
document.getElementById('lg-home').addEventListener('click',openLGHome);
document.getElementById('settings').addEventListener('click',openPanel);
ensureHomeHelper();

THEMES.forEach((theme,index)=>{
  const card=document.createElement('button');card.className='theme-card';card.dataset.theme=theme.id;card.setAttribute('aria-label',theme.name);card.setAttribute('aria-pressed','false');
  card.innerHTML='<span class="theme-preview '+(theme.id==='red'?'red-preview':'')+'"><img src="assets/'+theme.image+'" alt="">'+(theme.id==='red'?'<img class="mini-character" src="assets/itachi-jutsu.png" alt="">':'')+'</span><span class="theme-card-title">'+theme.name+'</span><span class="theme-card-detail">'+theme.detail+'</span><span class="theme-active" hidden>ACTIVE</span>';
  card.addEventListener('focus',()=>themeIndex=index);card.addEventListener('click',()=>{setTheme(theme.id);closeThemes();});document.getElementById('theme-grid').appendChild(card);
});
const themeCards=Array.from(document.querySelectorAll('.theme-card'));
function setTheme(id){if(busy||!THEMES.some(theme=>theme.id===id))return;document.getElementById('crow-flight').getAnimations({subtree:true}).forEach(a=>a.cancel());document.getElementById('crow-flight').replaceChildren();clearPowerLayer();options.theme=id;lastThemeChange=Date.now();applyOptions();record('theme-changed',id);if(typeof PalmServiceBridge==='undefined'&&window.parent!==window)window.parent.postMessage({type:'sharingan-theme',theme:id},location.origin);sendSelectionPower(selected);}
function openThemes(from='apps'){if(busy)return;themeReturn=from;themePanel.hidden=false;themeIndex=THEMES.findIndex(t=>t.id===options.theme);themeCards[themeIndex].focus();updateHint();}
function closeThemes(){themePanel.hidden=true;if(themeReturn==='settings'&&!panel.hidden)panelButtons[0].focus();else select(selected,true);updateHint();}
document.getElementById('themes-button').addEventListener('click',()=>openThemes());
document.getElementById('themes-close').addEventListener('click',closeThemes);
CATALOG.forEach((app,index)=>{
  const checkbox=document.createElement('button');checkbox.className='app-checkbox';checkbox.setAttribute('role','checkbox');checkbox.dataset.appId=app.id;
  const box=document.createElement('span');box.className='check-box';box.setAttribute('aria-hidden','true');box.textContent='✓';
  const name=document.createElement('span');name.className='check-name';name.textContent=app.name;
  const status=document.createElement('span');status.className='check-status';checkbox.append(box,name,status);
  checkbox.addEventListener('focus',()=>appIndex=index);
  checkbox.addEventListener('click',()=>toggleApp(app.id));document.getElementById('app-checklist').appendChild(checkbox);
});
const appCheckboxes=Array.from(document.querySelectorAll('.app-checkbox'));
function updateChecklist(){
  document.querySelectorAll('.app-checkbox').forEach((checkbox,index)=>{const app=CATALOG[index],on=options.appIds.includes(app.id);checkbox.setAttribute('aria-checked',String(on));checkbox.setAttribute('aria-label',app.name);checkbox.classList.toggle('missing',app.installed===false);checkbox.querySelector('.check-status').textContent=app.installed===false?'Not installed':on?'Shown':'Hidden';});
  document.getElementById('app-count').textContent=options.appIds.length+' shown · '+CATALOG.length+' available';
}
function toggleApp(id){
  const checked=options.appIds.includes(id);
  if(checked&&options.appIds.length===1){toast('Keep at least one app on your home screen.');return;}
  options.appIds=checked?options.appIds.filter(item=>item!==id):[...options.appIds,id];
  renderApps();applyOptions();record('apps-changed',options.appIds);
}
function openApps(){appPanel.hidden=false;appIndex=0;appCheckboxes[0].focus();updateHint();}
function closeApps(){appPanel.hidden=true;panelButtons.find(button=>button.dataset.setting==='apps').focus();updateHint();}
document.getElementById('apps-close').addEventListener('click',closeApps);
window.addEventListener('resize',updateTracking);
window.addEventListener('pagehide',()=>{screenSaver.suspend();ambient.suspend();kuramaScenes.stop();});
document.addEventListener('pointerdown',()=>{if(!ambient.suspended)ambient.unlock();},{passive:true});
document.addEventListener('keydown',()=>{if(!ambient.suspended)ambient.unlock();},{capture:true});
document.addEventListener('keydown',event=>{
  const key=event.keyCode;
  if([37,38,39,40,13,461,27,403,404,405,406].includes(key))event.preventDefault();
  if(busy)return;
  if(!appPanel.hidden){if([37,38,39,40].includes(key)){if(document.activeElement===document.getElementById('apps-close'))appIndex=0;else appIndex=Math.max(0,Math.min(CATALOG.length-1,appIndex+({37:-1,39:1,38:-2,40:2}[key])));appCheckboxes[appIndex].focus();appCheckboxes[appIndex].scrollIntoView({block:'nearest'});}else if(key===13)document.activeElement.click();else if(key===461||key===27)closeApps();return;}
  if(!themePanel.hidden){if([37,38,39,40].includes(key)){if(document.activeElement===document.getElementById('themes-close'))themeIndex=0;else themeIndex=Math.max(0,Math.min(THEMES.length-1,themeIndex+({37:-1,39:1,38:-2,40:2}[key])));themeCards[themeIndex].focus();}else if(key===13)document.activeElement.click();else if(key===461||key===27)closeThemes();return;}
  if(!panel.hidden){if(key===38||key===40){panelIndex=(panelIndex+(key===40?1:-1)+panelButtons.length)%panelButtons.length;panelButtons[panelIndex].focus();}else if(key===13||key===39)document.activeElement.click();else if(key===37||key===461||key===27)closePanel();return;}
  const cornerIndex=cornerButtons.indexOf(document.activeElement);
  if((key===37||key===39)&&cornerIndex>=0)cornerButtons[(cornerIndex+(key===39?1:-1)+cornerButtons.length)%cornerButtons.length].focus();
  else if(key===37||key===39)select(selected+(key===39?1:-1),true);
  else if(key===40)cornerButtons[0].focus();
  else if(key===38)select(selected,true);
  else if(key===13){if(cornerIndex>=0)cornerButtons[cornerIndex].click();else launch(selected);}
  else if(key===405)openThemes();
  else if(key===406)openPanel();
  else if(key===461||key===27){screenSaver.suspend();ambient.suspend();if(typeof webOSSystem!=='undefined'&&webOSSystem.platformBack)webOSSystem.platformBack();else if(typeof window.PalmSystem!=='undefined'&&window.PalmSystem.platformBack)window.PalmSystem.platformBack();else toast('Use Home to return to LG Home.');}
});
for(let i=0;i<14;i++){const drop=document.createElement('div');drop.className='drop';drop.style.left=((i*43)%100)+'%';drop.style.animationDuration=(1.3+(i%6)*.16)+'s';drop.style.animationDelay=(-i*.3)+'s';document.getElementById('rain').appendChild(drop);}
document.addEventListener('visibilitychange',()=>{syncDashboardVisibility(!document.hidden);if(document.hidden){screenSaver.suspend();ambient.suspend();}else{screenSaver.resume();ambient.resume();busy=false;scene.classList.remove('opening');updateClock();finishIntro();checkApps();ensureHomeHelper();}});
document.addEventListener('webOSRelaunch',()=>{screenSaver.resume();ambient.resume();busy=false;scene.classList.remove('opening');finishIntro();ensureHomeHelper();});
setInterval(()=>{if(options.autoTheme&&!document.hidden&&panel.hidden&&themePanel.hidden&&appPanel.hidden&&Date.now()-lastThemeChange>=options.themeIntervalSeconds*1000){const index=THEMES.findIndex(t=>t.id===options.theme);setTheme(THEMES[(index+1)%THEMES.length].id);}},1000);
for(let i=0;i<18;i++){
  for(const [container,className] of [['chakra-particles','chakra-spark'],['hinata-fireflies','moon-firefly']]){const spark=document.createElement('span');spark.className=className;spark.style.left=((i*37)%100)+'%';spark.style.top=(25+(i*13)%70)+'%';spark.style.animationDelay=(-i*.7)+'s';spark.style.animationDuration=(5+i%5)+'s';document.getElementById(container).appendChild(spark);}
}
for(let i=0;i<14;i++){const petal=document.createElement('span');petal.className='sakura-petal';petal.style.left=((i*43)%100)+'%';petal.style.top=(-20+(i*17)%120)+'%';petal.style.animationDelay=(-i*.8)+'s';petal.style.animationDuration=(9+i%7)+'s';document.getElementById('sakura-petals').appendChild(petal);}
mountEyes('red',[
  {x:1024,y:210,r:9.5,type:'sharingan',path:'M1003 213 Q1016 198 1035 203 L1041 211 Q1023 226 1008 222Z'},
  {x:1106,y:174,r:11,type:'sharingan',path:'M1088 183 Q1097 165 1118 164 L1125 166 Q1121 179 1090 187Z'}
],'#d6aa91');
mountEyes('naruto',[
  {x:1196,y:185,r:9,color:'#277ac4',path:'M1178 184 Q1189 171 1204 178 L1211 187 Q1196 199 1186 193Z'},
  {x:1267,y:157,r:9,color:'#277ac4',path:'M1252 166 Q1255 147 1274 148 L1283 151 Q1280 164 1269 167Z'}
],'#bd824f');
mountEyes('hinata',[
  {x:1184,y:259,r:22,type:'byakugan',color:'#c5b3e4',path:'M1151 258 Q1174 240 1196 246 Q1209 251 1216 261 Q1184 280 1166 276 Q1156 268 1151 258Z'},
  {x:1334,y:212,r:22,type:'byakugan',color:'#c5b3e4',path:'M1306 222 Q1320 199 1345 196 Q1361 191 1365 198 L1365 213 Q1342 234 1311 230Z'}
],'#b19aac');
mountEyes('sasuke',[
  {x:1201,y:278,r:12,type:'sharingan',path:'M1179 268 Q1204 267 1229 283 L1223 290 Q1197 294 1186 282Z'},
  {x:1316,y:298,r:12,type:'rinnegan',color:'#ab8ad0',path:'M1298 298 Q1314 284 1340 289 L1337 300 Q1324 315 1306 306Z'}
],'#8e8499');
mountEyes('sakura',[
  {x:1161,y:235,r:15,color:'#49a67c',path:'M1128 230 Q1152 213 1178 230 L1189 239 Q1154 259 1134 243Z'},
  {x:1283,y:185,r:17,color:'#49a67c',path:'M1251 199 Q1259 174 1296 167 L1310 165 Q1302 198 1270 206Z'}
],'#c78f8b');
mountEyes('kurama',[
  {x:1222,y:273,r:7,type:'fox',color:'#ef3b1c',inner:'#ffb98a',outer:'#951706',skin:'#c65516',sclera:'#ee6d39',rotation:24,path:'M1211 262 Q1220 268 1232 275 L1227 282 Q1218 281 1214 274Z'},
  {x:1300,y:239,r:9.2,type:'fox',color:'#ff4b27',inner:'#ffc29e',outer:'#a8200b',skin:'#c65516',sclera:'#f68f5e',rotation:-16,path:'M1287 236 Q1298 225 1315 225 Q1312 241 1301 249 L1292 247Z'},
  {x:1470,y:281,r:2.5,color:'#3b8cba',skin:'#d79e7d',path:'M1466 279 Q1470 276 1474 278 L1474 282 Q1470 285 1467 283Z'},
  {x:1486,y:275,r:2.7,color:'#3b8cba',skin:'#d79e7d',path:'M1481 274 Q1486 271 1491 272 L1490 277 Q1486 279 1482 277Z'}
],'#d49b70');
mountEyes('chakra',[
  {x:862,y:338,r:9,type:'fox',color:'#f8a324',skin:'#cf8b32',rotation:25,path:'M850 326 Q860 331 876 341 Q873 350 864 347 Q855 341 850 326Z'},
  {x:966,y:292,r:12,type:'fox',color:'#ffb82f',skin:'#ce8b31',rotation:-18,path:'M949 292 Q959 279 980 276 Q980 295 968 303 Q956 307 951 301Z'},
  {x:1205,y:334,r:9.3,type:'chakra',color:'#f7ae2c',skin:'#dcae86',sclera:'#ede0c7',path:'M1190 328 Q1201 319 1216 330 L1220 336 Q1206 347 1197 340Z'},
  {x:1278,y:305,r:11,type:'chakra',color:'#f9b63c',skin:'#deb58d',sclera:'#eee2cb',path:'M1260 305 Q1273 289 1295 291 L1302 291 Q1296 310 1277 316 L1267 312Z'}
],'#d9ab7f');
renderApps();applyOptions();select(0);updateClock();setInterval(updateClock,1000);blinkTimer=setTimeout(blink,4500);intro();checkApps();record('ready',{tv:typeof PalmServiceBridge!=='undefined'});
