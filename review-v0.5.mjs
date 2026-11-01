import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2];if(!base)throw new Error('Pass the forwarded TV inspector URL');
const dir='verification/v0.5';await mkdir(dir,{recursive:true});
const targets=await (await fetch(base+'/json/list')).json();
const target=targets.find(t=>t.description==='com.dextor.sharingan');if(!target)throw new Error('TV app is not running');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let serial=0;const pending=new Map();ws.onmessage=event=>{const message=JSON.parse(event.data),p=pending.get(message.id);if(p){clearTimeout(p.timer);pending.delete(message.id);message.error?p.reject(new Error(JSON.stringify(message.error))):p.resolve(message.result);}};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out'));},18000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function screenshot(name){const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(dir+'/'+name+'.png',Buffer.from(shot.data,'base64'));}
const report={};
try{
  report.defaults=await evaluate(`({apps:APPS.map(a=>a.id),themes:THEMES.map(t=>t.id),catalog:CATALOG.length,staticAsset:document.getElementById('itachi-static').getAttribute('src')})`);
  const expected=['youtube.leanback.v4','netflix','amazon','hotstar','com.crunchyroll.webapp'];
  if(JSON.stringify(report.defaults.apps)!==JSON.stringify(expected))throw new Error('Five-app default mismatch');
  if(report.defaults.themes.length!==6||report.defaults.themes.includes('poster'))throw new Error('Theme collection mismatch');
  if(report.defaults.staticAsset!=='assets/itachi-jutsu.png')throw new Error('Jutsu pose missing');
  report.eyes={};
  for(const theme of report.defaults.themes){
    await evaluate(`setTheme('${theme}');select(0,true);`);await delay(650);
    const left=await evaluate(`Array.from(document.querySelectorAll('${theme==='rain'?'#eyes':'#'+theme+'-stage .character-eyes'} .gaze')).map(e=>e.style.transform)`);
    await evaluate('select(4,true)');await delay(650);
    const right=await evaluate(`Array.from(document.querySelectorAll('${theme==='rain'?'#eyes':'#'+theme+'-stage .character-eyes'} .gaze')).map(e=>e.style.transform)`);
    if(left.length!==2||right.length!==2||JSON.stringify(left)===JSON.stringify(right))throw new Error('Eye tracking failed for '+theme);
    const loaded=await evaluate(`Array.from(document.querySelectorAll('img')).every(i=>i.complete&&i.naturalWidth>0)`);if(!loaded)throw new Error('Missing image for '+theme);
    report.eyes[theme]={left,right,passed:true};await delay(900);await screenshot('theme-'+theme);console.log('Reviewed',theme);
  }
  report.staticHand=await evaluate(`(()=>{setTheme('red');select(0,true);const image=document.getElementById('itachi-static');const before={src:image.src,transform:getComputedStyle(image).transform,bounds:JSON.stringify(image.getBoundingClientRect().toJSON())};select(4,true);const after={src:image.src,transform:getComputedStyle(image).transform,bounds:JSON.stringify(image.getBoundingClientRect().toJSON())};return {before,after,animations:image.getAnimations().length};})()`);
  if(JSON.stringify(report.staticHand.before)!==JSON.stringify(report.staticHand.after)||report.staticHand.animations!==0||report.staticHand.after.transform!=='none')throw new Error('Character/hand moved during selection');
  await delay(80);
  report.crows=await evaluate(`(()=>{const layer=document.getElementById('crow-flight');const birds=Array.from(layer.children);const result={count:birds.length,width:birds[0]?.getBoundingClientRect().width,designWidth:birds[0]?parseFloat(getComputedStyle(birds[0]).width):0};layer.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=420;});return result;})()`);
  if(report.crows.count!==7||report.crows.designWidth<110)throw new Error('Crow flock size failed');
  await screenshot('itachi-jutsu-crows');await evaluate(`document.getElementById('crow-flight').getAnimations({subtree:true}).forEach(a=>a.cancel());`);
  await evaluate(`setTheme('hinata');`);const t1=await evaluate(`document.getElementById('hinata-water').getCurrentTime()`);await delay(1100);const t2=await evaluate(`document.getElementById('hinata-water').getCurrentTime()`);
  report.water={first:t1,second:t2,advanced:t2>t1};if(!report.water.advanced)throw new Error('Water animation did not advance');
  report.reducedMotion=await evaluate(`(()=>{options.motion=false;applyOptions();const paused=document.getElementById('hinata-water').animationsPaused();const crows=document.getElementById('crow-flight').children.length;options.motion=true;applyOptions();return {waterPaused:paused,crows};})()`);
  if(!report.reducedMotion.waterPaused||report.reducedMotion.crows!==0)throw new Error('Reduced motion failed');
  report.powers={};
  for(const theme of ['naruto','hinata','sasuke','sakura']){
    await evaluate(`setTheme('${theme}');select(2,true);clearPowerLayer();window.reviewPower=sendPower(2,true);true;`);await delay(90);
    await evaluate(`document.getElementById('selection-power').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=330;})`);
    await screenshot('power-'+theme);
    await evaluate(`document.getElementById('selection-power').getAnimations({subtree:true}).forEach(a=>a.play());`);await evaluate('window.reviewPower');
    report.powers[theme]=await evaluate(`diagnostics.filter(e=>e.event==='character-power').slice(-1)[0]`);
    if(!report.powers[theme]||report.powers[theme].data.theme!==theme)throw new Error('Power effect missing: '+theme);
  }
  await evaluate(`setTheme('naruto');select(1,true);clearPowerLayer();window.reviewRasengan=playRasengan(1);true;`);await delay(90);
  await evaluate(`document.getElementById('rasengan-projectile').getAnimations().forEach(a=>{a.pause();a.currentTime=330;})`);await screenshot('rasengan-flight');
  await evaluate(`document.getElementById('rasengan-projectile').getAnimations().forEach(a=>a.play())`);await evaluate('window.reviewRasengan');
  report.rasengan=await evaluate(`({cast:diagnostics.filter(e=>e.event==='rasengan-cast').slice(-1)[0],impact:diagnostics.filter(e=>e.event==='rasengan-impact').slice(-1)[0],clean:document.getElementById('rasengan-projectile').hidden&&document.getElementById('rasengan-impact').hidden})`);
  if(!report.rasengan.cast||!report.rasengan.impact||!report.rasengan.clean)throw new Error('Rasengan sequence failed');
  await evaluate(`openThemes();`);await delay(250);report.gallery=await evaluate(`(()=>{const panel=document.getElementById('theme-panel').getBoundingClientRect();return {count:themeCards.length,allVisible:themeCards.every(c=>{const r=c.getBoundingClientRect();return r.top>=panel.top&&r.bottom<=panel.bottom;})};})()`);await screenshot('gallery-six-themes');
  if(!report.gallery.allVisible)throw new Error('Theme cards overflow the picker');
  await evaluate(`closeThemes();openPanel();openApps();`);await screenshot('apps-five-defaults');
  await evaluate(`closeApps();closePanel();setTheme('red');select(0,true);`);
  await writeFile(dir+'/review.json',JSON.stringify({...report,passed:true},null,2));console.log('All TV review checks passed.');
}catch(error){await writeFile(dir+'/review.json',JSON.stringify({...report,passed:false,error:error.message},null,2));throw error;}finally{ws.close();setTimeout(()=>process.exit(process.exitCode||0),500).unref();}
