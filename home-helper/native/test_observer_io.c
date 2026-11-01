#define _GNU_SOURCE
#include <assert.h>
#include <fcntl.h>
#include <poll.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>
#include <time.h>
#include <unistd.h>
#include "filter.h"
#include "device-config.h"
int watcher_main(int argc,char **argv);
static int inputOpened,inputReads,stateWrites,polls;
int observer_open(const char *path,int flags,...){
 if(!strncmp(path,"/dev/input/",11)){assert((flags&O_ACCMODE)==O_RDONLY);if(!strcmp(path,"/dev/input/event0")){inputOpened++;return 100;}return -1;}
 assert(strstr(path,"/state/"));return strstr(path,"blocked")?102:101;
}
int observer_flock(int fd,int operation){(void)operation;assert(fd==101);return 0;}
int observer_close(int fd){assert(fd>=100);return 0;}
int observer_ioctl(int fd,unsigned long request,...){
 assert(fd==100);assert(!(_IOC_DIR(request)&_IOC_WRITE)); // An input grab would fail here.
 va_list args;va_start(args,request);void *buffer=va_arg(args,void*);va_end(args);
 unsigned nr=_IOC_NR(request);
 if(nr==6){strcpy(buffer,SOURCE_NAME);return (int)strlen(SOURCE_NAME)+1;}
 assert(nr==0x21);memset(buffer,0,256);((unsigned char*)buffer)[HOME_KEY/8]|=1<<(HOME_KEY%8);return 256;
}
ssize_t observer_read(int fd,void *buffer,size_t length){
 if(fd==0){assert(length);((char*)buffer)[0]='P';return 1;}
 assert(fd==100);inputReads++;
 struct ev shortEvents[]={{0,0,1,106,1},{0,0,1,106,0},{0,0,1,HOME_KEY,1},{0,0,1,HOME_KEY,0},{0,0,0,0,0}};
 if(inputReads==1){assert(length>=sizeof shortEvents);memcpy(buffer,shortEvents,sizeof shortEvents);return sizeof shortEvents;}
 struct ev e={0,0,1,HOME_KEY,inputReads==2?1:0};
 assert(inputReads<=3&&length>=sizeof e);memcpy(buffer,&e,sizeof e);return sizeof e;
}
ssize_t observer_write(int fd,const void *data,size_t length){(void)data;assert(fd==102);stateWrites++;return length;} // No input fd can be written.
int observer_poll(struct pollfd *fds,nfds_t count,int timeout){(void)timeout;assert(count==2);fds[0].revents=0;fds[1].revents=0;int n=polls++;if(n<2||n==15)fds[0].revents=POLLIN;else if(n<15)fds[1].revents=POLLIN;else fds[1].revents=POLLHUP;return 1;}
int observer_clock_gettime(clockid_t id,struct timespec *ts){(void)id;static long tick;tick+=200;ts->tv_sec=tick/1000;ts->tv_nsec=(tick%1000)*1000000;return 0;}
int main(void){char *args[]={"observer",NULL};int result=watcher_main(1,args);assert(result==24);assert(inputOpened==1&&inputReads==3&&stateWrites==1);puts("PASS: input opened read-only; no input-grab ioctl or input writes; unrelated keys untouched; long Home leaves watcher running; closed pipe ends observer");return 0;}
