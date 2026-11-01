'use strict';
// App-scoped tvpower negotiation, also used by Kodi's webOS implementation.
// Never changes the TV's standby settings or synthesizes remote activity.
class DashboardScreenSaver {
  constructor({clientName,createBridge,isVisible,isEnabled,onEvent=()=>{}}){
    Object.assign(this,{clientName,createBridge,isVisible,isEnabled,onEvent});
    this.bridge=null;this.responses=new Map();this.suspended=false;this.state='off';
  }
  report(state,data){this.state=state;this.onEvent(state,data);}
  sync(){
    if(this.suspended||!this.isVisible()||!this.isEnabled()){this.stop();return;}
    if(this.bridge)return;
    const bridge=this.createBridge();
    if(!bridge){this.report('unavailable');return;}
    this.bridge=bridge;this.report('registering');
    bridge.onservicecallback=raw=>{
      if(this.bridge!==bridge)return;
      let message;try{message=JSON.parse(raw);}catch(_){this.stop();this.report('error',{reason:'Invalid TV response'});return;}
      if(message.returnValue===false){this.stop();this.report('error',message);return;}
      if(this.suspended||!this.isVisible()||!this.isEnabled()){this.stop();return;}
      if(message.subscribed===true)this.report('registered');
      if(message.state==='Active'&&message.timestamp!==undefined){
        this.onEvent('request',{timestamp:message.timestamp});this.respond(message.timestamp);
      }
    };
    try{bridge.call('luna://com.webos.service.tvpower/power/registerScreenSaverRequest',JSON.stringify({subscribe:true,clientName:this.clientName}));}
    catch(e){this.stop();this.report('error',{reason:e.message});}
  }
  respond(timestamp){
    const bridge=this.createBridge();if(!bridge)return;
    const finish=()=>{clearTimeout(this.responses.get(bridge));this.responses.delete(bridge);};
    this.responses.set(bridge,setTimeout(()=>{finish();try{bridge.cancel();}catch(_){}this.onEvent('response-timeout',{timestamp});},7000));
    bridge.onservicecallback=raw=>{
      if(!this.responses.has(bridge))return;
      finish();let result;try{result=JSON.parse(raw);}catch(_){result={returnValue:false};}
      this.onEvent('response',{timestamp,result});
    };
    try{bridge.call('luna://com.webos.service.tvpower/power/responseScreenSaverRequest',JSON.stringify({clientName:this.clientName,ack:false,timestamp}));}
    catch(e){finish();this.onEvent('response-error',{reason:e.message});}
  }
  stop(){
    const bridge=this.bridge;this.bridge=null;
    if(bridge){try{bridge.cancel();}catch(_){}this.report('released');}
    for(const [response,timer] of this.responses){clearTimeout(timer);try{response.cancel();}catch(_){}}
    this.responses.clear();
  }
  suspend(){this.suspended=true;this.stop();}
  resume(){this.suspended=false;this.sync();}
}
if(typeof module!=='undefined')module.exports=DashboardScreenSaver;
