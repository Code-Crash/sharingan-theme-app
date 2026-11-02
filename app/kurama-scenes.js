'use strict';
// One textured mesh per scene. Tail tips move; protected face regions stay fixed
// so the independent SVG eyes remain registered to the original illustration.
// Static influence weights replace nine Gaussian/tail calculations per vertex
// per frame. Angle addition leaves only two wave uniforms for each draw.
function tailSway(kind,x,y){
  const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
  const ellipse=(cx,cy,rx,ry)=>1-smooth(.7,1.15,Math.hypot((x-cx)/rx,(y-cy)/ry));
  const chakra=kind==='chakra',root=chakra?[.69,.47]:[.75,.48];
  const protect=chakra?Math.max(ellipse(.538,.34,.14,.23),ellipse(.755,.33,.115,.22)):Math.max(ellipse(.791,.29,.17,.29),ellipse(.9,.42,.07,.30),ellipse(.8,.56,.16,.23));
  const mask=smooth(.01,.08,y)*(1-smooth(.74,.85,y))*smooth(.25,.36,x)*(1-protect),weights=[0,0,0,0];
  const tips=[[.37,.065,.083],[.29,.23,.075],[.30,.39,.075],[.39,.56,.070],[.28,.72,.068],[.61,-.16,.080],[.82,-.18,.085],[1.04,.065,.080],[1.08,.35,.070]];
  tips.forEach(([tx,ty,r],i)=>{const lx=(tx-root[0])*1.7778,ly=ty-root[1],px=(x-root[0])*1.7778,py=y-root[1],t=Math.max(0,Math.min(1,(px*lx+py*ly)/(lx*lx+ly*ly))),d=Math.hypot(px-lx*t,py-ly*t),w=Math.exp(-d*d/(r*r))*smooth(.16,.90,t)*mask,phase=i*.8;weights[0]+=w*Math.cos(phase);weights[1]+=w*Math.sin(phase);weights[2]+=w*Math.cos(phase+.8);weights[3]+=w*Math.sin(phase+.8);});
  return weights;
}
function chakraGlowMask(x,y){
  const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
  const face=Math.max(1-smooth(.7,1.15,Math.hypot((x-.538)/.14,(y-.34)/.23)),1-smooth(.7,1.15,Math.hypot((x-.755)/.115,(y-.33)/.22)));
  return (1-face)*smooth(.28,.4,x)*(1-smooth(.9,1,y));
}
class KuramaScene {
  constructor(stage,kind){
    this.stage=stage;this.kind=kind;this.canvas=stage.querySelector('canvas');
    this.image=stage.querySelector('img');this.active=false;this.ready=false;
    this.frame=0;this.elapsed=0;this.last=0;this.frames=0;
    this.wanted={active:false,motion:false};
    this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.stop();this.ready=false;stage.classList.remove('mesh-ready');this.canvas.dataset.renderer='context-lost';});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.gl=null;this.sync(this.wanted.active,this.wanted.motion);});
  }
  init(){
    if(this.gl||this.fallback||!this.image.complete||!this.image.naturalWidth)return;
    const gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    if(!gl){this.makeFallback();return;}
    this.gl=gl;
    const vertex=`
      precision highp float;
      attribute vec2 point;attribute vec4 sway;attribute float glowMask;varying vec2 uv;varying float energy;
      uniform float time;uniform float chakra;uniform vec2 wave;
      void main(){
        uv=point;energy=glowMask;vec2 p=point;
        vec2 delta=vec2(dot(sway.xy,wave)*.0045,dot(sway.zw,wave)*.014);
        float water=chakra*(1.-smoothstep(.52,.64,p.x))*smoothstep(.61,.65,p.y)*(1.-smoothstep(.75,.80,p.y));
        delta.x+=sin(p.y*160.-time*.9)*.0008*water;
        gl_Position=vec4((p.x+delta.x)*2.-1.,1.-(p.y+delta.y)*2.,0.,1.);
      }`;
    const fragment=this.kind==='kurama'?`precision highp float;varying vec2 uv;uniform sampler2D art;void main(){gl_FragColor=texture2D(art,uv);}`:`
      precision highp float;varying vec2 uv;varying float energy;uniform sampler2D art;uniform float pulse;
      void main(){vec4 color=texture2D(art,uv);float warm=smoothstep(.12,.45,color.r-color.b)*smoothstep(.22,.60,color.r);color.rgb+=vec3(1.,.47,.06)*energy*warm*pulse;gl_FragColor=color;}`;
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    try{
      this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program);const vertices=[],indices=[],nx=48,ny=27;
      for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)vertices.push(x/nx,y/ny,...tailSway(this.kind,x/nx,y/ny),chakraGlowMask(x/nx,y/ny));
      for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*(nx+1)+x;indices.push(i,i+1,i+nx+1,i+nx+1,i+1,i+nx+2);}
      this.count=indices.length;
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      for(const [name,size,offset] of [['point',2,0],['sway',4,8],['glowMask',1,24]]){const attribute=gl.getAttribLocation(this.program,name);if(attribute>=0){gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,28,offset);}}
      const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.image);
      this.time=gl.getUniformLocation(this.program,'time');this.wave=gl.getUniformLocation(this.program,'wave');this.pulse=gl.getUniformLocation(this.program,'pulse');gl.uniform1f(gl.getUniformLocation(this.program,'chakra'),this.kind==='chakra'?1:0);
      this.ready=true;this.canvas.dataset.renderer='webgl';this.stage.classList.add('mesh-ready');this.draw(this.elapsed);
      if(this.active)this.schedule();
    }catch(error){this.makeFallback();console.warn('[Sharingan] Using SVG scene animation:',error.message);}
  }
  makeFallback(){
    // Embedded browsers may disable WebGL. Animate only measured tail regions
    // with an SVG displacement field, leaving the original faces untouched.
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),id=this.kind+'-tail-flow';
    svg.classList.add('tail-fallback');svg.setAttribute('viewBox','0 0 1672 941');svg.setAttribute('preserveAspectRatio','none');
    const tails=this.kind==='chakra'?'M450 0H1090V145L1020 205 930 210 821 282 801 382 890 465 1060 510 970 535 810 513 630 470 480 420Z M1425 0H1672V502L1525 420 1460 270Z':'M370 0H1105V160L1128 250 1143 385 1230 550 1180 690 1030 748 410 740 390 600 466 510 418 390 405 250Z M1510 0H1672V430L1560 381 1540 290 1460 210Z';
    const src=this.image.getAttribute('src');
    svg.innerHTML='<defs><filter id="'+id+'" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".002 .004" numOctaves="1" seed="12" result="noise"/><feOffset in="noise" result="drift"><animate attributeName="dx" values="0;65;0" dur="23s" repeatCount="indefinite"/><animate attributeName="dy" values="0;24;0" dur="19s" repeatCount="indefinite"/></feOffset><feDisplacementMap in="SourceGraphic" in2="drift" scale="0" xChannelSelector="R" yChannelSelector="G"><animate attributeName="scale" values="0;22;0;-22;0" dur="'+(this.kind==='chakra'?12:19)+'s" repeatCount="indefinite"/></feDisplacementMap></filter><filter id="'+id+'-feather"><feGaussianBlur stdDeviation="8"/></filter><mask id="'+id+'-region" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941"><path d="'+tails+'" fill="white" filter="url(#'+id+'-feather)"/></mask></defs><image href="'+src+'" width="1672" height="941" mask="url(#'+id+'-region)" filter="url(#'+id+')"/>';
    if(this.kind==='chakra')svg.innerHTML+='<defs><filter id="chakra-water-flow" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".01 .09" numOctaves="1" seed="8" result="water"/><feOffset in="water" result="shift"><animate attributeName="dx" values="0;20;0" dur="21s" repeatCount="indefinite"/></feOffset><feDisplacementMap in="SourceGraphic" in2="shift" scale="4"/></filter><clipPath id="chakra-water-region"><path d="M90 598H950L865 714 110 728Z"/></clipPath></defs><g clip-path="url(#chakra-water-region)"><image href="'+src+'" width="1672" height="941" filter="url(#chakra-water-flow)"/></g>';
    this.stage.insertBefore(svg,this.canvas.nextSibling);this.fallback=svg;this.canvas.dataset.renderer='svg';
    if(!this.active)svg.pauseAnimations();
  }
  draw(seconds){
    if(!this.ready)return;
    const width=Math.min(1280,Math.round(innerWidth)),height=Math.round(width*innerHeight/innerWidth);
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.gl.viewport(0,0,width,height);}
    this.gl.uniform1f(this.time,seconds);const phase=seconds*(this.kind==='chakra'?.65:.31);this.gl.uniform2f(this.wave,Math.sin(phase),Math.cos(phase));this.gl.uniform1f(this.pulse,.018+.012*Math.sin(seconds*2.2));this.gl.drawElements(this.gl.TRIANGLES,this.count,this.gl.UNSIGNED_SHORT,0);
    this.canvas.dataset.frame=String(++this.frames);
  }
  schedule(){
    if(this.frame||!this.active||!this.ready)return;
    this.frame=requestAnimationFrame(now=>{this.frame=0;if(!this.active)return;
      if(!this.last){this.last=now;this.started=now;this.elapsedBase=this.elapsed;}
      const interval=1000/15,delta=now-this.last;
      if(delta>=interval){this.elapsed=(now-this.started)/1000+this.elapsedBase;this.last=now-delta%interval;this.draw(this.elapsed);}
      this.schedule();
    });
  }
  stop(){cancelAnimationFrame(this.frame);this.frame=0;this.last=0;this.active=false;this.canvas.dataset.running='false';if(this.fallback)this.fallback.pauseAnimations();}
  sync(active,motion){
    this.wanted={active,motion};
    this.stop();this.active=active&&motion;this.canvas.dataset.running=String(this.active);
    if(active){if(!this.gl&&!this.fallback)this.init();if(!motion)this.draw(0);else this.schedule();}
    if(this.fallback){this.fallback.style.display=active&&motion?'block':'none';if(this.active)this.fallback.unpauseAnimations();}
  }
}
class DashboardKuramaScenes {
  constructor(){
    this.scenes=new Map(['kurama','chakra'].map(id=>[id,new KuramaScene(document.getElementById(id+'-stage'),id)]));
    for(const item of this.scenes.values()){
      item.image.addEventListener('load',()=>{if(item.active)item.init();});
      for(let i=0;i<12;i++){
        const spark=document.createElement('span');spark.className='fox-ember';
        spark.style.cssText='left:'+(25+(i*31)%74)+'%;top:'+(25+(i*19)%60)+'%;--drift:'+((i%5-2)*1.2)+'vw;animation-delay:'+(-i*.63)+'s;animation-duration:'+(8+i%7)+'s;';
        item.stage.querySelector('.kurama-particles').appendChild(spark);
      }
    }
    const flames=document.getElementById('chakra-flames');
    // Measured points on the outer chakra contours, away from skin and eyes.
    const anchors=[[514,229,35],[504,337,40],[555,408,30],[625,113,48],[678,49,30],[945,82,43],[1438,103,38],[1514,198,43],[1606,259,48],[1578,376,39],[1453,413,32],[1510,509,40],[1562,614,39],[929,728,42],[990,626,38],[1037,543,34],[1145,233,29],[1349,197,26],[1401,263,34]];
    anchors.forEach(([x,y,h],i)=>{
      if(i%3!==0)return; // Seven flame layers keep the TV compositor responsive.
      const flame=document.createElement('span');flame.classList.add('chakra-lick');
      flame.style.cssText='left:'+((x-12)/1672*100)+'%;top:'+((y-h)/941*100)+'%;height:'+(h/941*100)+'%;animation-delay:'+(-i*.29)+'s;animation-duration:'+(1.8+i%5*.27)+'s;';flames.appendChild(flame);
    });
  }
  sync(theme,motion,visible){for(const [id,item] of this.scenes)item.sync(visible&&theme===id,motion);}
  stop(){for(const item of this.scenes.values())item.stop();}
}
if(typeof module!=='undefined')module.exports={KuramaScene,DashboardKuramaScenes,tailSway};
