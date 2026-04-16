import re
import os
import sys

def update(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    orig = content
    
    # We must explicitly look for `bg-[#111111]` or `bg-[#ff5a2f]` and `text-slate-[x]` and replace it with `text-white`
    def repl(m):
        cls = m.group(1)
        if 'bg-[#111111]' in cls or 'bg-slate-900' in cls or 'bg-[#ff5a2f]' in cls or 'bg-black' in cls:
            cls = re.sub(r'text-slate-\d+', 'text-white', cls)
            cls = re.sub(r'text-black', 'text-white', cls)
            cls = re.sub(r'text-\[\#111111\]', 'text-white', cls)
            cls = re.sub(r'text-\[\#000000\]', 'text-white', cls)
        return f'className="{cls}"'

    content = re.sub(r'className="([^"]+)"', repl, content)
    
    def repl_tmpl(m):
        cls = m.group(1)
        if 'bg-[#111111]' in cls or 'bg-slate-900' in cls or 'bg-[#ff5a2f]' in cls or 'bg-black' in cls:
            cls = re.sub(r'text-slate-\d+', 'text-white', cls)
            cls = re.sub(r'text-black', 'text-white', cls)
            cls = re.sub(r'text-\[\#111111\]', 'text-white', cls)
            cls = re.sub(r'text-\[\#000000\]', 'text-white', cls)
        return f'className={{`{cls}`}}'
        
    content = re.sub(r'className=\{\`([^`]+)\`\}', repl_tmpl, content)

    if content != orig:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed: {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            update(os.path.join(root, file))
