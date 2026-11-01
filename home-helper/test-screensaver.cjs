const assert=require('node:assert/strict');
const Guard=require('../app/screensaver.js');
let visible=true,enabled=true;const bridges=[],events=[];
class Bridge{constructor(){this.calls=[];this.cancelled=false;bridges.push(this);}call(uri,payload){this.calls.push({uri,payload:JSON.parse(payload)});}cancel(){this.cancelled=true;}reply(value){this.onservicecallback(JSON.stringify(value));}}
const guard=new Guard({clientName:'com.dextor.sharingan',createBridge:()=>new Bridge(),isVisible:()=>visible,isEnabled:()=>enabled,onEvent:(...args)=>events.push(args)});
guard.resume();const subscription=bridges[0];subscription.reply({returnValue:true,subscribed:true});assert.equal(guard.state,'registered');
subscription.reply({returnValue:true,state:'Inactive',timestamp:'ignore'});assert.equal(bridges.length,1);
subscription.reply({returnValue:true,state:'Active',timestamp:'123'});const response=bridges[1];assert.deepEqual(response.calls[0].payload,{clientName:'com.dextor.sharingan',ack:false,timestamp:'123'});response.reply({returnValue:true});assert.equal(guard.responses.size,0);
// Release before app launch cancels even an in-flight response.
subscription.reply({returnValue:true,state:'Active',timestamp:'124'});const pending=bridges[2];guard.suspend();assert(subscription.cancelled);assert(pending.cancelled);assert.equal(guard.responses.size,0);
const count=bridges.length;subscription.reply({state:'Active',timestamp:'stale'});assert.equal(bridges.length,count);guard.sync();assert.equal(bridges.length,count);
visible=false;guard.resume();assert.equal(bridges.length,count);
visible=true;guard.resume();const second=bridges.at(-1);visible=false;second.reply({state:'Active',timestamp:'hidden'});assert(second.cancelled);assert.equal(bridges.length,count+1);
visible=true;enabled=false;guard.resume();assert.equal(guard.bridge,null);
enabled=true;guard.resume();bridges.at(-1).reply({returnValue:false,errorText:'Denied'});assert.equal(guard.state,'error');assert.equal(guard.bridge,null);
console.log('PASS: active-only veto; exact timestamp; app handover, hidden, disabled and stale callbacks release; denial handled.');
