import re
import os

def update(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    orig = content
    
    # Just raw target replacements because classNames can be strung over multiple lines or vars
    content = content.replace('bg-[#111111] hover:bg-[#111111] text-slate-900', 'bg-[#111111] hover:bg-[#111111] text-white')
    content = content.replace('bg-[#111111] text-slate-900', 'bg-[#111111] text-white')
    content = content.replace('bg-[#ff5a2f] text-slate-900', 'bg-[#ff5a2f] text-white')
    content = content.replace('bg-slate-900 text-slate-900', 'bg-[#111111] text-white')
    content = content.replace('bg-[#111111] text-[#ff5a2f] text-slate-900', 'bg-[#111111] text-white')
    
    if content != orig:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Brute fixed: {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            update(os.path.join(root, file))
