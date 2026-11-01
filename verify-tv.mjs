// Run against the forwarded inspector URL printed by ares-inspect.
// Only inspects and exercises our own app; --launch-youtube opens YouTube.
import {writeFile} from 'node:fs/promises';
const base=process.argv[2];
if(!base)throw new Error('Usage: node verify-tv.mjs http://127.0.0.1:PORT [--launch-youtube]');
const targets=await (await fetch(base+'/json/list')).json();
const target=targets.find(t=>t.description==='com.dextor.sharingan');
if(!target)throw new Error('Sharingan inspector target missing');
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let id=0;const pending=new Map();
ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const entry=pending.get(msg.id);if(entry){clearTimeout(entry.timer);pending.delete(msg.id);msg.error?entry.reject(new Error(JSON.stringify(msg.error))):entry.resolve(msg.result);}}};
function call(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(new Error(method+' timed out'));},12000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
try{
  const state=await evaluate(`({title:document.title,width:innerWidth,height:innerHeight,imageLoaded:document.querySelector('.wallpaper').complete&&document.querySelector('.wallpaper').naturalWidth>0,tvBridge:typeof PalmServiceBridge!=='undefined',apps:window.sharingan.apps,diagnostics:window.sharingan.diagnostics})`);
  if(!state.imageLoaded||!state.tvBridge)throw new Error('TV artwork or service bridge missing');
  console.log(JSON.stringify({...state,apps:state.apps.map(({id,name,installed})=>({id,name,installed})),diagnostics:state.diagnostics.slice(-3)},null,2));
  const nav=await evaluate(`(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:39,bubbles:true}));const right=window.sharingan.selected;document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:37,bubbles:true}));return {right,left:window.sharingan.selected,gaze:getComputedStyle(document.getElementById('scene')).getPropertyValue('--gaze-x')};})()`);
  if(nav.right!==1||nav.left!==0)throw new Error('TV navigation failed');
  console.log('Navigation:',JSON.stringify(nav));
  try{const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile('verification/tv-dashboard.png',Buffer.from(shot.data,'base64'));console.log('Screenshot: verification/tv-dashboard.png');}catch(e){console.log('Screenshot unavailable:',e.message);}
  await writeFile('verification/tv-state.json',JSON.stringify({state,navigation:nav},null,2));
  if(process.argv.includes('--themes')){
    const results=await evaluate(`(()=>{
      const original=[...options.appIds];
      panel.hidden=true;themePanel.hidden=true;appPanel.hidden=true;
      setTheme('rain');select(0);
      const left=Array.from(document.querySelectorAll('.gaze')).map(e=>e.style.transform);
      select(APPS.length-1);const right=Array.from(document.querySelectorAll('.gaze')).map(e=>e.style.transform);
      if(JSON.stringify(left)===JSON.stringify(right))throw new Error('Eye tracking failed');
      openPanel();document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:40,bubbles:true}));document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:13,bubbles:true}));
      if(appPanel.hidden)throw new Error('Remote app settings navigation failed');
      const hotstar=CATALOG.find(a=>a.id==='hotstar');const wasVisible=options.appIds.includes(hotstar.id);
      document.querySelector('[data-app-id="hotstar"]').click();
      const isVisible=APPS.some(a=>a.id==='hotstar');if(isVisible===wasVisible)throw new Error('Checkbox did not change home apps');
      setTheme('naruto');if(APPS.some(a=>a.id==='hotstar')!==isVisible)throw new Error('Theme changed the app selection');
      const persisted=JSON.parse(localStorage.getItem('sharingan.preferences'));if(persisted.appIds.includes('hotstar')!==isVisible)throw new Error('App choice not saved');
      options.appIds=CATALOG.map(a=>a.id);renderApps();select(APPS.length-1);
      const row=document.getElementById('apps'),last=buttons[selected].getBoundingClientRect(),bounds=row.getBoundingClientRect();
      if(row.scrollLeft<=0||last.right>bounds.right+2||last.left<bounds.left-2)throw new Error('App carousel failed');
      options.appIds=original;renderApps();applyOptions();closeApps();closePanel();select(0);
      return {catalogCount:CATALOG.length,eyeLeft:left,eyeRight:right,checkboxPassed:true,crossThemePassed:true,persistencePassed:true,carouselPassed:true};
    })()`);
    console.log('Theme and app checks:',JSON.stringify(results));
    await writeFile('verification/theme-app-checks.json',JSON.stringify(results,null,2));
    const themeIds=await evaluate('THEMES.map(theme=>theme.id)');
    for(const theme of themeIds){
      const loaded=await evaluate(`(async()=>{setTheme('${theme}');await Promise.all(Array.from(document.querySelectorAll('img')).map(img=>img.decode().catch(()=>{})));return Array.from(document.querySelectorAll('img')).every(img=>img.complete&&img.naturalWidth>0);})()`);
      if(!loaded)throw new Error('Theme image failed to load: '+theme);
      await new Promise(resolve=>setTimeout(resolve,350));
      const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile('verification/theme-'+theme+'.png',Buffer.from(shot.data,'base64'));
    }
    await evaluate(`setTheme('red');openThemes();`);
    const gallery=await call('Page.captureScreenshot',{format:'png'});await writeFile('verification/theme-gallery.png',Buffer.from(gallery.data,'base64'));
    await evaluate(`closeThemes();openPanel();openApps();`);
    const checklist=await call('Page.captureScreenshot',{format:'png'});await writeFile('verification/app-checklist.png',Buffer.from(checklist.data,'base64'));
    await evaluate(`closeApps();closePanel();setTheme('red');select(0);`);
    console.log('Saved all theme screenshots, gallery, and app checklist. Left TV on Crimson Moon.');
  }
  if(process.argv.includes('--launch-youtube')){
    let launched;
    try{launched=await evaluate(`(async()=>{await launch(0);return window.sharingan.diagnostics.filter(x=>x.event.startsWith('launch-'));})()`);}
    catch(e){if(/Execution context was destroyed/.test(e.message)){console.log('Dashboard suspended during app switch. Confirm the destination on the physical TV.');launched=[{event:'app-switch-context-destroyed',requiresVisualConfirmation:true}];}else throw e;}
    await writeFile('verification/youtube-launch.json',JSON.stringify(launched,null,2));
    console.log('Launch result:',JSON.stringify(launched));
    if(!launched.some(x=>x.event==='launch-success'||x.event==='app-switch-context-destroyed'))throw new Error('YouTube launch failed');
  }
}finally{ws.close();setTimeout(()=>process.exit(process.exitCode||0),500).unref();}
