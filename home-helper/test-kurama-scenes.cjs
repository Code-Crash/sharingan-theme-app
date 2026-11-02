'use strict';
// Lifecycle and failure-path tests: no real GPU, network, or TV connection.
const assert=require('node:assert/strict');
const {KuramaScene}=require('../app/kurama-scenes');
let handle=0,draws=0;const frames=new Map();
global.window={devicePixelRatio:2};global.innerWidth=1920;global.innerHeight=1080;
global.requestAnimationFrame=fn=>{frames.set(++handle,fn);return handle;};
global.cancelAnimationFrame=id=>frames.delete(id);
function svg(){return {style:{},classList:{add(){}},paused:false,setAttribute(){},pauseAnimations(){this.paused=true;},unpauseAnimations(){this.paused=false;}};}
global.document={createElementNS:()=>svg()};
function stage(){const listeners={},canvas={width:300,height:150,dataset:{},addEventListener(n,fn){listeners[n]=fn;},getContext(){return null;}};
 const image={complete:true,naturalWidth:1672,getAttribute(){return 'assets/test.png';}};
 return {listeners,canvas,classList:{add(){},remove(){}},querySelector(s){return s==='canvas'?canvas:image;},insertBefore(){}};
}
const a=new KuramaScene(stage(),'kurama'),b=new KuramaScene(stage(),'chakra');
a.sync(true,true);assert.equal(a.canvas.dataset.renderer,'svg');assert.equal(a.fallback.paused,false);
a.sync(false,true);b.sync(true,true);assert.equal(a.fallback.paused,true);assert.equal(a.fallback.style.display,'none');assert.equal(b.fallback.paused,false);
b.sync(true,false);assert.equal(b.fallback.paused,true);assert.equal(b.fallback.style.display,'none');assert.equal(b.canvas.dataset.running,'false');
b.sync(false,true);assert.equal(b.fallback.paused,true);b.sync(true,true);assert.equal(b.fallback.paused,false);
assert.equal(frames.size,0,'SVG fallback does not add a JS animation loop');
const host=stage(),gpu=new KuramaScene(host,'kurama');gpu.ready=true;gpu.gl={uniform1f(){},drawArrays(){draws++;},viewport(){},TRIANGLES:4};
gpu.sync(true,true);assert.equal(frames.size,1);
function pump(time){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(time);}
pump(100);pump(116);assert.equal(draws,0,'GPU frame rate is capped');pump(150);assert.equal(draws,1);
assert.equal(gpu.canvas.width,1920,'No 4K render target on a high-DPI TV');
gpu.sync(false,true);assert.equal(frames.size,0,'Hidden scene cancels GPU work');
gpu.sync(true,false);assert.equal(frames.size,0,'Motion Off draws one static frame');assert.equal(draws,2);
gpu.sync(true,true);host.listeners.webglcontextlost({preventDefault(){}});assert.equal(frames.size,0);assert.equal(gpu.ready,false);
gpu.sync(false,true);host.listeners.webglcontextrestored();assert.equal(gpu.active,false,'Hidden scene stays stopped after context recovery');
console.log('PASS: GPU frame cap and resolution limit; hidden/motion-off stop; SVG fallback pause/resume; context loss recovery.');
