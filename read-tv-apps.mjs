// One-time, read-only app inventory through LG's local remote interface.
// Does not persist the remote client key.
import {writeFile} from 'node:fs/promises';
import WebSocket from './tooling/node_modules/ws/wrapper.mjs';
// LG's local remote service uses a device-issued certificate.
const ws=new WebSocket('wss://192.168.1.6:3001',{rejectUnauthorized:false});
const timeout=setTimeout(()=>{console.error('TV app inventory pairing timed out.');ws.close();process.exit(1);},60000);
ws.onopen=()=>ws.send(JSON.stringify({id:'register',type:'register',payload:{pairingType:'PROMPT',forcePairing:false,manifest:{manifestVersion:1,appVersion:'0.3.0',appId:'com.dextor.sharingan.setup',localizedAppNames:{'':'Sharingan Setup'},permissions:['READ_INSTALLED_APPS']}}}));
ws.onmessage=async event=>{
  const message=JSON.parse(event.data);
  if(message.type==='registered'){
    console.log('TV pairing accepted. Reading installed apps.');
    ws.send(JSON.stringify({id:'apps',type:'request',uri:'ssap://com.webos.applicationManager/listApps',payload:{}}));
  }else if(message.id==='apps'&&message.type==='response'){
    const apps=message.payload?.apps;
    if(!Array.isArray(apps)){console.error('No app list returned');process.exitCode=1;}
    else{
      const inventory=apps.map(app=>({id:app.id,title:app.title,icon:app.icon}));
      await writeFile('verification/installed-apps.json',JSON.stringify(inventory,null,2));
      console.log(JSON.stringify(inventory.map(({id,title})=>({id,title})),null,2));
    }
    clearTimeout(timeout);ws.close();setTimeout(()=>process.exit(process.exitCode||0),300);
  }else if(message.type==='error'){
    console.error('TV response:',message.error||'request denied');clearTimeout(timeout);ws.close();setTimeout(()=>process.exit(1),300);
  }else console.log('Waiting for TV pairing approval.');
};
ws.onerror=error=>{clearTimeout(timeout);console.error('TV remote interface connection failed:',error.message);process.exit(1);};
