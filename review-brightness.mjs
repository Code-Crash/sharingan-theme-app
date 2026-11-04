import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:43037',dir=process.argv[3]||'verification/v0.9.3';await mkdir(dir,{recursive:true});
const target=(await(await fetch(base+'/json/list')).json()).find(t=>t.description==='com.dextor.sharingan');if(!target)throw Error('Dashboard must be open');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
let serial=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));})}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function key(code){await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:${code},which:${code},bubbles:true,cancelable:true}));true;`)}
async function shot(name){if(process.env.REVIEW_SCREENSHOTS==='0')return;const r=await call('Page.captureScreenshot',{format:'png'});await writeFile(dir+'/'+name+'.png',Buffer.from(r.data,'base64'));}
function check(value,message){if(!value)throw Error(message)}
async function waitFor(expression,message){const deadline=Date.now()+8000;while(Date.now()<deadline){if(await evaluate(expression))return;await delay(200);}throw Error(message);}
const report={version:'0.9.3',checks:{},runtimeErrors:errors};let saved;
try{
 await call('Runtime.enable');saved=await evaluate('JSON.parse(JSON.stringify(options))');
 await evaluate(`busy=false;options.autoTheme=false;options.brightness=100;applyOptions();openPanel();document.querySelector('[data-setting="brightness"]').focus();true`);
 await key(37);await delay(250);
 report.checks.left=await evaluate(`({value:options.brightness,opacity:Number(getComputedStyle(document.getElementById('brightness-dimmer')).opacity),panelOpen:!panel.hidden})`);
 check(report.checks.left.value===90&&Math.abs(report.checks.left.opacity-.1)<.01&&report.checks.left.panelOpen,'Left must dim the dashboard');
 await key(39);check(await evaluate('options.brightness===100'),'Right increases');await key(13);check(await evaluate('options.brightness===90'),'OK cycles');
 await evaluate('options.brightness=20;applyBrightness();true');await key(37);await delay(250);
 report.checks.minimum=await evaluate(`({value:options.brightness,opacity:Number(getComputedStyle(document.getElementById('brightness-dimmer')).opacity),settingsAboveDimmer:parseInt(getComputedStyle(panel).zIndex)>parseInt(getComputedStyle(document.getElementById('brightness-dimmer')).zIndex),clickThrough:getComputedStyle(document.getElementById('brightness-dimmer')).pointerEvents==='none'})`);
 check(report.checks.minimum.value===20&&Math.abs(report.checks.minimum.opacity-.8)<.01&&report.checks.minimum.settingsAboveDimmer&&report.checks.minimum.clickThrough,'Minimum stays recoverable');
 await key(13);check(await evaluate('options.brightness===100'),'OK wraps');await key(39);check(await evaluate('options.brightness===100'),'Maximum clamp');
 await evaluate(`options.brightness=60;applyBrightness();savePreferences();setTheme('kurama');closePanel();openPanel();true`);
 check(await evaluate(`options.brightness===60&&JSON.parse(localStorage.getItem('sharingan.preferences')).brightness===60`),'Theme/panel changes preserve brightness');
 report.checks.controls={right:true,ok:true,bounds:true,themeChange:true,panelReopen:true};
 report.checks.layout=await evaluate(`({count:panelButtons.length,visible:panelButtons.every(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),saved:JSON.parse(localStorage.getItem('sharingan.preferences')).brightness})`);
 check(report.checks.layout.count===8&&report.checks.layout.visible,'Eight settings fit');
 await call('Page.reload',{ignoreCache:true});
 const deadline=Date.now()+20000;while(!await evaluate(`typeof options!=='undefined'&&typeof applyBrightness==='function'&&document.readyState==='complete'`)){if(Date.now()>deadline)throw Error('Dashboard reload readiness timeout');await delay(250);}
 await delay(250);
 report.checks.reload=await evaluate(`({value:options.brightness,opacity:Number(getComputedStyle(document.getElementById('brightness-dimmer')).opacity),label:document.getElementById('brightness-value').textContent})`);
 check(report.checks.reload.value===60&&Math.abs(report.checks.reload.opacity-.4)<.01&&report.checks.reload.label==='60%','Brightness must survive a real reload');
 check(errors.length===0,'Runtime exceptions');report.passed=true;console.log('PASS: brightness controls, actual dimming, limits, readable settings, theme/panel changes and reload persistence.');
}catch(e){report.passed=false;report.error=e.message;console.error(e);process.exitCode=1;}
finally{
 if(saved)try{await evaluate(`Object.assign(options,${JSON.stringify(saved)});if(!panel.hidden)closePanel();applyOptions();select(0,true);true`);}catch(e){report.restoreError=e.message;}
 await writeFile(dir+'/brightness.json',JSON.stringify(report,null,2));ws.close();setTimeout(()=>process.exit(process.exitCode||0),200);
}
