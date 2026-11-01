'use strict';
// Local soundtrack playback, scoped to the visible dashboard.
class DashboardAmbient {
  constructor({createContext,createAudio,getTrack,isVisible,isEnabled,getVolume,onEvent=()=>{}}){
    Object.assign(this,{createContext,createAudio,getTrack,isVisible,isEnabled,getVolume,onEvent});
    this.context=null;this.media=null;this.master=null;this.suspended=false;this.state='off';this.starting=null;
  }
  report(state,data){if(this.state!==state){this.state=state;this.onEvent(state,data);}}
  setup(track){
    const ctx=this.createContext();if(!ctx)throw Error('Web Audio is unavailable');this.context=ctx;
    this.master=ctx.createGain();this.master.gain.value=0;this.master.connect(ctx.destination);
    this.media=this.createAudio(track.src);this.media.loop=true;this.media.preload='auto';
    this.source=ctx.createMediaElementSource(this.media);this.source.connect(this.master);
  }
  async sync(){
    if(this.suspended||!this.isVisible()||!this.isEnabled())return this.stop();
    const track=this.getTrack();if(!track?.src){await this.stop();this.report('missing');return;}
    if(this.starting)return this.starting;
    const task=(async()=>{
      try{
        if(!this.context)this.setup(track);
        await this.context.resume();
        if(this.suspended||!this.isVisible()||!this.isEnabled()){await this.stop();return;}
        await this.media.play();
        if(this.suspended||!this.isVisible()||!this.isEnabled()){await this.stop();return;}
        const time=this.context.currentTime,volume=Math.max(0,Math.min(.35,this.getVolume()));
        this.master.gain.cancelScheduledValues(time);this.master.gain.setTargetAtTime(volume,time,.6);
        this.report('playing',{context:this.context.state,track:track.title});
      }catch(e){await this.stop();this.report('waiting',{reason:e.message});}
    })();
    this.starting=task;try{await task;}finally{if(this.starting===task)this.starting=null;}
  }
  async stop(){
    if(this.media)this.media.pause();
    if(this.master){const time=this.context.currentTime;this.master.gain.cancelScheduledValues(time);this.master.gain.setValueAtTime(0,time);}
    if(this.context&&this.context.state==='running')await this.context.suspend();
    if(this.state==='playing')this.report('paused');
  }
  suspend(){this.suspended=true;return this.stop();}
  resume(){this.suspended=false;return this.sync();}
  unlock(){if(!this.suspended&&this.isVisible()&&this.isEnabled()){this.context?.resume().catch(()=>{});return this.sync();}}
}
if(typeof module!=='undefined')module.exports=DashboardAmbient;
