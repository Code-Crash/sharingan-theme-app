#include <assert.h>
#include <stdio.h>
#include "rcu-capabilities.h"
int main(void){unsigned char s[256]={7},d[256]={3},k[256]={254},l[256]={254},r[256]={0},t[256]={0},a[256]={0},b[256]={0};
 assert(rcu_caps_match(s,d,k,l,r,t,a,b));
 l[3]=1;assert(!rcu_caps_match(s,d,k,l,r,t,a,b));l[3]=0;
 r[0]=1;assert(!rcu_caps_match(s,d,k,l,r,t,a,b));r[0]=0;
 b[0]=1;assert(!rcu_caps_match(s,d,k,l,r,t,a,b));b[0]=0;
 s[1]=1;assert(!rcu_caps_match(s,d,k,l,r,t,a,b));s[1]=0;
 memset(k,0,256);memset(l,0,256);assert(!rcu_caps_match(s,d,k,l,r,t,a,b));
 puts("PASS: measured RCU capability pair; key, relative, absolute and event-type mismatches rejected");return 0;}
