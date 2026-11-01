// Personal-device build. Does not install or enable anything on a TV.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'home-helper');
const options=JSON.parse(fs.readFileSync(path.join(source,'options.json')));
const out=path.join(root,'dist/home-helper'),native=path.join(out,'native'),helper=path.join(out,'helper'),service=path.join(out,'service');
fs.mkdirSync(out,{recursive:true});
for(const [from,to] of [['native',native],['app',helper],['service',service]])fs.cpSync(path.join(source,from),to,{recursive:true});
function run(command,args){const p=spawnSync(command,args,{stdio:'inherit',cwd:root});if(p.error||p.status!==0)throw Error('Failed: '+command);}
const zig=process.env.ZIG;if(!zig)throw Error('Set ZIG to Zig 0.14.1 executable');
fs.writeFileSync(path.join(native,'device-config.h'),'#define SOURCE_NAME '+JSON.stringify(options.sourceName)+'\n#define HOME_KEY '+options.homeKey+'\n');
const env=process.env;env.ZIG_GLOBAL_CACHE_DIR=env.ZIG_GLOBAL_CACHE_DIR||path.join(source,'.zig-cache');
run(zig,['cc','-std=c99','-Wall','-Wextra','-Werror',path.join(native,'filter.c'),path.join(native,'test_filter.c'),'-o',path.join(out,'test-filter')]);
run(path.join(out,'test-filter'),[]);
const observerObject=path.join(out,'observer-test.o'),observerTest=path.join(out,'test-observer-io');
run(zig,['cc','-std=c99','-Wall','-Wextra','-Werror','-Dmain=watcher_main',...['open','flock','close','ioctl','read','write','poll','clock_gettime'].map(name=>'-D'+name+'=observer_'+name),'-c',path.join(native,'relay.c'),'-o',observerObject]);
run(zig,['cc',observerObject,path.join(native,'filter.c'),path.join(native,'test_observer_io.c'),'-o',observerTest]);
run(observerTest,[]);
for(const name of ['detach','relay'])run(zig,['cc','-target',options.target,'-Os','-static','-s',path.join(native,name+'.c'),...(name==='relay'?[path.join(native,'filter.c')]:[]),'-o',path.join(helper,name)]);
for(const dir of [helper,service]){fs.mkdirSync(path.join(dir,'state'),{recursive:true});fs.writeFileSync(path.join(dir,'state/.keep'),'');fs.copyFileSync(path.join(source,'LICENSE'),path.join(dir,'LICENSE'));fs.copyFileSync(path.join(source,'UPSTREAM-LICENSE'),path.join(dir,'UPSTREAM-LICENSE'));}
fs.writeFileSync(path.join(helper,'options.json'),JSON.stringify({watchedApps:[]}));
for(const paths of [[helper],[path.join(root,'app'),service]])run('npm',['exec','--yes','--package=@webos-tools/cli','--','ares-package','--no-minify',...paths,'--outdir',out]);
const appInfo=JSON.parse(fs.readFileSync(path.join(root,'app/appinfo.json'))),helperInfo=JSON.parse(fs.readFileSync(path.join(helper,'appinfo.json')));
for(const filename of [appInfo.id+'_'+appInfo.version+'_all.ipk',helperInfo.id+'_'+helperInfo.version+'_arm.ipk'])run('python3',[path.join(source,'fix-package.py'),path.join(out,filename),path.join(source,'options.json')]);
console.log('Built personal helper packages in '+out);
