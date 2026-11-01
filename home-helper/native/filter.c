#include "filter.h"
#include "device-config.h"
int filter_event(struct filter*f,const struct ev*e,uint64_t now){
 if(e->type==0&&e->code==3)return RELEASE;
 if(e->type!=1||e->code!=HOME_KEY)return PASS;
 if(e->value==0){if(!f->home)return DROP;int held=filter_timeout(f,now);f->home=0;return held?LONG_HOME:OPEN_HOME;}
 if(e->value==1&&!f->home){f->home=1;f->since=now;}
 return DROP;
}
int filter_timeout(const struct filter*f,uint64_t now){return f->home&&now-f->since>=2000;}
