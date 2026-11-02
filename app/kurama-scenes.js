'use strict';
// One textured mesh per scene. Tail tips move; protected face regions stay fixed
// so the independent SVG eyes remain registered to the original illustration.
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
      attribute vec2 point; varying vec2 uv; uniform float time; uniform float chakra;
      float ellipse(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.7,1.15,length((p-c)/r));}
      float protect(vec2 p){
        if(chakra>.5)return max(ellipse(p,vec2(.538,.34),vec2(.14,.23)),ellipse(p,vec2(.755,.33),vec2(.115,.22)));
        return max(max(ellipse(p,vec2(.791,.29),vec2(.17,.29)),ellipse(p,vec2(.9,.42),vec2(.07,.30))),ellipse(p,vec2(.8,.56),vec2(.16,.23)));
      }
      vec2 tail(vec2 p,vec2 root,vec2 tip,float radius,float phase){
        vec2 aspect=vec2(1.7778,1.);vec2 line=(tip-root)*aspect;
        float t=clamp(dot((p-root)*aspect,line)/dot(line,line),0.,1.);
        float d=length(((p-root)*aspect)-line*t);
        float w=exp(-d*d/(radius*radius))*smoothstep(.16,.90,t);
        float speed=mix(.31,.65,chakra);
        return w*vec2(sin(time*speed+phase)*.0045, sin(time*speed+phase+.8)*.014);
      }
      void main(){
        uv=point;vec2 p=point;vec2 root=mix(vec2(.75,.48),vec2(.69,.47),chakra);vec2 delta=vec2(0.);
        delta+=tail(p,root,vec2(.37,.065),.083,0.);
        delta+=tail(p,root,vec2(.29,.23),.075,.8);
        delta+=tail(p,root,vec2(.30,.39),.075,1.6);
        delta+=tail(p,root,vec2(.39,.56),.070,2.4);
        delta+=tail(p,root,vec2(.28,.72),.068,3.2);
        delta+=tail(p,root,vec2(.61,-.16),.080,4.);
        delta+=tail(p,root,vec2(.82,-.18),.085,4.8);
        delta+=tail(p,root,vec2(1.04,.065),.080,5.6);
        delta+=tail(p,root,vec2(1.08,.35),.070,6.4);
        float margin=smoothstep(.01,.08,p.y)*(1.-smoothstep(.74,.85,p.y))*smoothstep(.25,.36,p.x);
        delta*=margin*(1.-protect(p));
        // Water moves horizontally below the village, never across either face.
        float water=chakra*(1.-smoothstep(.52,.64,p.x))*smoothstep(.61,.65,p.y)*(1.-smoothstep(.75,.80,p.y));
        delta.x+=sin(p.y*160.-time*.9)*.0008*water;
        gl_Position=vec4((p.x+delta.x)*2.-1.,1.-(p.y+delta.y)*2.,0.,1.);
      }`;
    const fragment=`
      precision highp float;varying vec2 uv;uniform sampler2D art;uniform float time;uniform float chakra;
      float ellipse(vec2 p,vec2 c,vec2 r){return 1.-smoothstep(.7,1.15,length((p-c)/r));}
      void main(){
        vec4 original=texture2D(art,uv);float face=max(ellipse(uv,vec2(.538,.34),vec2(.14,.23)),ellipse(uv,vec2(.755,.33),vec2(.115,.22)));
        float warm=smoothstep(.12,.45,original.r-original.b)*smoothstep(.22,.60,original.r);
        float mask=chakra*warm*(1.-face)*smoothstep(.28,.4,uv.x)*(1.-smoothstep(.9,1.,uv.y));
        float flow=sin(uv.y*115.-time*2.5+sin(uv.x*80.+time*.9));
        vec2 offset=vec2(sin(uv.y*80.-time*2.)*.0009,flow*.0015)*mask;
        vec4 color=texture2D(art,uv+offset);
        float rim=length(original.rgb-texture2D(art,uv+vec2(.0018,.0018)).rgb);
        color.rgb+=vec3(1.,.47,.06)*mask*min(rim*2.5,.5)*(.035+.035*sin(time*2.2+uv.y*70.));
        gl_FragColor=color;
      }`;
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    try{
      this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program);const vertices=[],nx=80,ny=45;
      for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)for(const [dx,dy] of [[0,0],[1,0],[0,1],[0,1],[1,0],[1,1]])vertices.push((x+dx)/nx,(y+dy)/ny);
      this.count=vertices.length/2;const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
      const attribute=gl.getAttribLocation(this.program,'point');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.image);
      this.time=gl.getUniformLocation(this.program,'time');gl.uniform1f(gl.getUniformLocation(this.program,'chakra'),this.kind==='chakra'?1:0);
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
    const width=Math.min(1920,Math.round(innerWidth*Math.min(window.devicePixelRatio||1,2))),height=Math.round(width*innerHeight/innerWidth);
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.gl.viewport(0,0,width,height);}
    this.gl.uniform1f(this.time,seconds);this.gl.drawArrays(this.gl.TRIANGLES,0,this.count);
    this.canvas.dataset.frame=String(++this.frames);
  }
  schedule(){
    if(this.frame||!this.active||!this.ready)return;
    this.frame=requestAnimationFrame(now=>{this.frame=0;if(!this.active)return;
      if(!this.last)this.last=now;
      if(now-this.last>=1000/30){this.elapsed+=Math.min(.1,(now-this.last)/1000);this.last=now;this.draw(this.elapsed);}
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
      for(let i=0;i<24;i++){
        const spark=document.createElement('span');spark.className='fox-ember';
        spark.style.cssText='left:'+(25+(i*31)%74)+'%;top:'+(25+(i*19)%60)+'%;--drift:'+((i%5-2)*1.2)+'vw;animation-delay:'+(-i*.63)+'s;animation-duration:'+(8+i%7)+'s;';
        item.stage.querySelector('.kurama-particles').appendChild(spark);
      }
    }
    const flames=document.getElementById('chakra-flames');
    flames.innerHTML='<defs><linearGradient id="chakra-lick-fill" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#ff8a19" stop-opacity=".02"/><stop offset=".55" stop-color="#ffbf43" stop-opacity=".4"/><stop offset="1" stop-color="#ffe7a2" stop-opacity=".05"/></linearGradient></defs>';
    // Measured points on the outer chakra contours, away from skin and eyes.
    const anchors=[[514,229,35],[504,337,40],[555,408,30],[625,113,48],[678,49,30],[945,82,43],[1438,103,38],[1514,198,43],[1606,259,48],[1578,376,39],[1453,413,32],[1510,509,40],[1562,614,39],[929,728,42],[990,626,38],[1037,543,34],[1145,233,29],[1349,197,26],[1401,263,34]];
    anchors.forEach(([x,y,h],i)=>{
      const flame=document.createElementNS('http://www.w3.org/2000/svg','path');flame.classList.add('chakra-lick');
      flame.setAttribute('d','M'+(x-7)+' '+y+' Q'+(x-14)+' '+(y-h*.5)+' '+x+' '+(y-h)+' Q'+(x-3)+' '+(y-h*.48)+' '+(x+8)+' '+(y-h*.30)+' Q'+(x+13)+' '+(y-h*.15)+' '+(x+6)+' '+y+'Z');
      flame.style.animationDelay=(-i*.29)+'s';flame.style.animationDuration=(1.8+i%5*.27)+'s';flames.appendChild(flame);
    });
  }
  sync(theme,motion,visible){for(const [id,item] of this.scenes)item.sync(visible&&theme===id,motion);}
  stop(){for(const item of this.scenes.values())item.stop();}
}
if(typeof module!=='undefined')module.exports={KuramaScene,DashboardKuramaScenes};
