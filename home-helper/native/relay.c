#define _GNU_SOURCE
#include "filter.h"
#include "lock.h"
#include "device-config.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <sys/ioctl.h>
#include <time.h>
#include <errno.h>
#include <string.h>
#define BIT(ev,len) _IOC(_IOC_READ,'E',0x20+(ev),len)
#define NAME(len) _IOC(_IOC_READ,'E',0x06,len)
static volatile sig_atomic_t stop;
static void stopped(int n){(void)n;stop=1;}
static uint64_t ms(void){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return(uint64_t)t.tv_sec*1000+t.tv_nsec/1000000;}
/* Independent read-only evdev subscription. Never grabs or writes any input. */
static int find_device(void){
 int found=-1;
 for(int i=0;i<32;i++){char p[64],name[256]={0};snprintf(p,sizeof p,"/dev/input/event%d",i);
  int fd=open(p,O_RDONLY|O_NONBLOCK|O_CLOEXEC);if(fd<0)continue;
  if(ioctl(fd,NAME(sizeof name),name)>=0&&!strcmp(name,SOURCE_NAME)){
   if(found>=0){close(fd);close(found);return -1;}found=fd;printf("DEVICE %s %s\n",p,name);
  }else close(fd);
 }
 return found;
}
int main(int argc,char**argv){
 setvbuf(stdout,NULL,_IOLBF,0);signal(SIGPIPE,SIG_IGN);signal(SIGTERM,stopped);signal(SIGINT,stopped);
 // Old controllers may still request cleanup. There are no injected keys to release.
 if(argc>1&&!strcmp(argv[1],"cleanup"))return 0;
 int lock=acquire_lock("/media/developer/apps/usr/palm/applications/com.mbs.communityhomehelper/state/relay.lock");if(lock<0)return 18;
 int in=find_device();if(in<0)return 10;
 unsigned char keys[256]={0};if(HOME_KEY>=2048||ioctl(in,BIT(1,256),keys)<0||!(keys[HOME_KEY/8]&(1<<(HOME_KEY%8)))){close(in);return 12;}
 puts("MODE observe-only inputGrabbed=false eventsWritten=0");puts("READY");
 struct filter f={0};uint64_t last=ms();int reason=0;struct pollfd p[2]={{in,POLLIN,0},{0,POLLIN,0}};
 while(!stop){uint64_t now=ms();if(now-last>8000){reason=20;break;}
  int r=poll(p,2,50);if(r<0){if(errno==EINTR)continue;reason=23;break;}
  if(p[1].revents&(POLLHUP|POLLERR)){reason=24;break;}
  if(p[1].revents&POLLIN){char b[64];ssize_t n=read(0,b,sizeof b);if(n<=0){reason=24;break;}last=ms();for(int i=0;i<n;i++){if(b[i]=='Q')stop=1;if(b[i]=='S')raise(SIGSTOP);}puts("P");}
  if(stop)break;
  if(p[0].revents&(POLLHUP|POLLERR)){reason=25;break;}
  if(p[0].revents&POLLIN){struct ev e[64];ssize_t n=read(in,e,sizeof e);if(n<0&&errno==EAGAIN)continue;
   if(n<=0||n%sizeof e[0]){reason=26;break;}
   for(int i=0;i<n/(int)sizeof e[0];i++){int a=filter_event(&f,e+i,ms());
    if(a==LONG_HOME){puts("LG_HOME");continue;}if(a==RELEASE){reason=27;stop=1;break;}if(a==OPEN_HOME)puts("HOME");
    // All ordinary keys go directly to webOS; no forwarding or event injection.
   }
  }
 }
 int flag=open("/media/developer/apps/usr/palm/applications/com.mbs.communityhomehelper/state/blocked",O_WRONLY|O_CREAT|O_TRUNC,0644);if(flag>=0){write(flag,"stopped",7);close(flag);}
 close(in);printf("EXIT %d\n",reason);return reason;
}
