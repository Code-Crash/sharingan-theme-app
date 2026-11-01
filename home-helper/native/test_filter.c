#include "filter.h"
#include "device-config.h"
#include <assert.h>
#include <stdio.h>
int main(void){
 struct filter f={0};struct ev e={0,0,1,HOME_KEY,0};assert(sizeof e==16);
 assert(filter_event(&f,&e,10)==DROP); // Unmatched release after startup.
 e.value=1;assert(filter_event(&f,&e,100)==DROP);
 e.value=2;assert(filter_event(&f,&e,200)==DROP);
 e.value=0;assert(filter_event(&f,&e,300)==OPEN_HOME);
 assert(!filter_timeout(&f,5000));
 e.value=1;assert(filter_event(&f,&e,6000)==DROP);
 e.value=2;assert(filter_event(&f,&e,8500)==DROP);
 assert(filter_timeout(&f,8500));
 e.value=0;assert(filter_event(&f,&e,8600)==LONG_HOME);
 unsigned codes[]={28,103,105,106,108,412,114,115,116,1198,1199,2,398};
 for(unsigned i=0;i<sizeof codes/sizeof codes[0];i++)for(int v=0;v<3;v++){e.type=1;e.code=codes[i];e.value=v;assert(filter_event(&f,&e,9000)==PASS);}
 e.type=3;e.code=773;assert(filter_event(&f,&e,9000)==PASS);
 e.type=2;e.code=8;assert(filter_event(&f,&e,9000)==PASS);
 e.type=0;e.code=0;assert(filter_event(&f,&e,9000)==PASS);
 e.code=3;assert(filter_event(&f,&e,9000)==RELEASE);
 puts("PASS: passive Home on release, held repeats, long release, unrelated keys, pointer, wheel, overflow");
}
