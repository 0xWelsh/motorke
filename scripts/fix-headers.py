import re

with open('src/app/admin/layout.js', 'r') as f:
    text = f.read()

text = re.sub(r'<p className="[^"]*">Core Operations</p>', '<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Core Operations</p>', text)
text = re.sub(r'<p className="[^"]*">Management</p>', '<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Management</p>', text)

with open('src/app/admin/layout.js', 'w') as f:
    f.write(text)
