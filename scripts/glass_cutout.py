# Cuts a flat background out of a character image so it can sit on glass (used by the Know Your Diamond page).
# Flood-fills from the image edges, following small color steps, starting only on pixels close to the top-left color.
# Usage: python3 scripts/glass_cutout.py SRC.webp public/images/glass/NAME.webp STEP   (STEP ~5 for soft gradients, ~14 for flat colors)
import sys
from PIL import Image, ImageFilter, ImageChops
from collections import deque
src,dst,step=sys.argv[1],sys.argv[2],int(sys.argv[3])
im=Image.open(src).convert('RGBA'); w,h=im.size; px=im.load()
seen=bytearray(w*h); q=deque()
REF=px[2,2]
for x in range(w): q.append((x,0,None)); q.append((x,h-1,None))
for y in range(h): q.append((0,y,None)); q.append((w-1,y,None))
mask=Image.new('L',(w,h),255); m=mask.load()
while q:
    x,y,prev=q.popleft(); i=y*w+x
    if seen[i]: continue
    r,g,b,a=px[x,y]
    if prev is None and a>=20 and abs(r-REF[0])+abs(g-REF[1])+abs(b-REF[2])>60: continue
    if prev is not None and a>=20 and abs(r-prev[0])+abs(g-prev[1])+abs(b-prev[2])>step: continue
    seen[i]=1; m[x,y]=0
    for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
        if 0<=nx<w and 0<=ny<h and not seen[ny*w+nx]: q.append((nx,ny,(r,g,b)))
mask=mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
im.putalpha(ImageChops.multiply(im.getchannel('A'),mask)); im.save(dst,'WEBP',quality=88)
