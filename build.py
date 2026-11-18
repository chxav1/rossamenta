import sys
A,C,out=sys.argv[1],sys.argv[2],sys.argv[3]
s=open('src/index.html').read().replace('{{A}}',A).replace('{{C}}',C)
open(out,'w').write(s)
