#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <sys/ioctl.h>
#define BIT(ev,len) _IOC(_IOC_READ,'E',0x20+(ev),len)
int main(void){int a=open("/dev/input/event0",O_RDONLY|O_NONBLOCK),b=open("/dev/input/event1",O_RDWR|O_NONBLOCK);printf("readOnlyProbe source=%d destination=%d grabbed=0 written=0\n",a>=0,b>=0);if(a<0||b<0)return 1;for(int type=0;type<4;type++){unsigned char x[256]={0},y[256]={0};int ra=ioctl(a,BIT(type,256),x),rb=ioctl(b,BIT(type,256),y),diff=0,nonzero=0;for(int i=0;i<256;i++){if(x[i]!=y[i])diff++;if(x[i])nonzero++;}printf("type=%d sourceResult=%d destResult=%d differingBytes=%d sourceNonzeroBytes=%d sourceFirst=%u destFirst=%u\n",type,ra,rb,diff,nonzero,x[0],y[0]);}close(a);close(b);return 0;}
