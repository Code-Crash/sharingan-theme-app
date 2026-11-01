import {spawnSync} from 'node:child_process';
const action=process.argv[2];
const commands={
 status:`cat /media/developer/apps/usr/palm/services/com.dextor.sharingan.helper/state/control.json; cat /media/developer/apps/usr/palm/services/com.dextor.sharingan.helper/state/native-status.json`,
 pause:`/usr/bin/node -e 'var fs=require("fs"),p="/media/developer/apps/usr/palm/services/com.dextor.sharingan.helper/state/control.json",s=JSON.parse(fs.readFileSync(p,"utf8"));s.paused=true;s.starting=false;fs.writeFileSync(p+".emergency",JSON.stringify(s),{mode:416});fs.renameSync(p+".emergency",p);console.log("Pause requested. Verify release with status.");'`,
 safety:`luna-send-pub -n 1 -f luna://com.webos.applicationManager/launch '{"id":"com.mbs.communityhomehelper","params":{"diagnostic":true,"safetyCheck":true}}'`,
 logs:`tail -n 35 /media/developer/apps/usr/palm/applications/com.mbs.communityhomehelper/state/controller.log`,
};
if(!Object.hasOwn(commands,action))throw Error('Use status, pause, safety, or logs. Trial and enable are available in dashboard Settings. Targets paired lg-tv only.');
const r=spawnSync('npm',['exec','--yes','--package=@webos-tools/cli','--','ares-novacom','-d','lg-tv','--run',commands[action]],{stdio:'inherit',timeout:25000});
if(r.error||r.status!==0)process.exitCode=1;
