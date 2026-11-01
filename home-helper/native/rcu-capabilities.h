#include <string.h>
/* Exact measured key-only pair: LGE RCU advertises EV_REL with no REL codes.
 * CHECK INPUT has precisely the same key bitmap and no EV_REL flag.
 * Ignore only that empty advertised class; reject every other difference. */
static int rcu_caps_match(const unsigned char *srcTypes,const unsigned char *dstTypes,
 const unsigned char *srcKeys,const unsigned char *dstKeys,
 const unsigned char *srcRel,const unsigned char *dstRel,
 const unsigned char *srcAbs,const unsigned char *dstAbs){
 unsigned char zero[256]={0},src[256]={0},dst[256]={0};src[0]=7;dst[0]=3;
 return !memcmp(srcTypes,src,256)&&!memcmp(dstTypes,dst,256)&&
 memcmp(srcKeys,zero,256)&&!memcmp(srcKeys,dstKeys,256)&&
 !memcmp(srcRel,zero,256)&&!memcmp(dstRel,zero,256)&&
 !memcmp(srcAbs,zero,256)&&!memcmp(dstAbs,zero,256);
}
