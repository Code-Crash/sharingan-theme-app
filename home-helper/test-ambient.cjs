const assert=require('node:assert/strict'),Ambient=require('../app/ambient.js');
class Param{constructor(value=0){this.value=value;}cancelScheduledValues(){}setValueAtTime(v){this.value=v;}setTargetAtTime(v){this.value=v;}}
class Context{constructor(){this.state='suspended';this.currentTime=0;this.destination={};this.sources=0;}createGain(){return {gain:new Param(),connect(){}};}createMediaElementSource(){this.sources++;return {connect(){}};}async resume(){this.state='running';}async suspend(){this.state='suspended';}}
class Media{constructor(src){this.src=src;this.paused=true;this.fail=false;}async play(){if(this.fail)throw Error('Playback blocked');this.paused=false;}pause(){this.paused=true;}}
(async()=>{let visible=false,enabled=true,volume=.12,created=0,track={src:null,title:'Naruto soundtrack'};const music=new Ambient({createContext:()=>{created++;return new Context()},createAudio:src=>new Media(src),getTrack:()=>track,isVisible:()=>visible,isEnabled:()=>enabled,getVolume:()=>volume});
 await music.resume();assert.equal(created,0);visible=true;await music.resume();assert.equal(created,0);assert.equal(music.state,'missing');
 track={src:'assets/test.ogg',title:'User track'};await music.resume();assert.equal(music.context.state,'running');assert.equal(music.media.loop,true);assert.equal(music.master.gain.value,.12);assert(!music.media.paused);
 await music.sync();assert.equal(music.context.sources,1);
 const stopped=music.suspend();assert(music.media.paused,'media pauses before handover');await stopped;assert.equal(music.context.state,'suspended');await music.sync();assert.equal(music.context.state,'suspended');
 await music.resume();enabled=false;await music.sync();assert(music.media.paused);assert.equal(music.context.state,'suspended');
 enabled=true;visible=false;await music.resume();assert(music.media.paused);visible=true;volume=.32;await music.resume();assert.equal(music.master.gain.value,.32);
 await music.suspend();music.media.fail=true;await music.resume();assert.equal(music.state,'waiting');assert(music.media.paused);assert.equal(music.context.state,'suspended');
 console.log('PASS: no missing-track fallback, local looping, handover pause, hidden/disabled stop, gain, resume and playback denial.');
})().catch(e=>{console.error(e);process.exit(1)});
