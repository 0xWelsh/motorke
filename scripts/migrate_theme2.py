import sys
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Backgrounds
    content = re.sub(r'bg-\[\#1a1a1a\]', 'bg-[#fbfcfe]', content)
    content = re.sub(r'bg-slate-50', 'bg-[#fbfcfe]', content)
    content = re.sub(r'bg-white/5', 'bg-[#fbfcfe]', content)
    content = re.sub(r'bg-white/10', 'bg-white', content)
    
    # Borders
    content = re.sub(r'border-white/10', 'border-[#ddd4c8]', content)
    content = re.sub(r'border-white/5', 'border-[#ddd4c8]', content)
    content = re.sub(r'border-slate-100', 'border-[#ddd4c8]', content)
    content = re.sub(r'border-slate-200', 'border-[#ddd4c8]', content)
    content = re.sub(r'border-slate-800', 'border-[#ddd4c8]', content)
    content = re.sub(r'border-slate-700', 'border-[#ddd4c8]', content)

    # Rounded corners
    content = re.sub(r'rounded-2xl', 'rounded-none', content)
    content = re.sub(r'rounded-xl', 'rounded-none', content)
    content = re.sub(r'rounded-lg', 'rounded-none', content)
    content = re.sub(r'rounded-md', 'rounded-none', content)
    content = re.sub(r'rounded-full', 'rounded-none', content)

    # Texts
    content = re.sub(r'text-white/40', 'text-slate-500', content)
    content = re.sub(r'text-white/60', 'text-slate-600', content)
    content = re.sub(r'text-white/80', 'text-slate-800', content)
    content = re.sub(r'text-white', 'text-slate-900', content)
    
    # Accents (emerald, blue, orange -> #ff5a2f)
    content = re.sub(r'emerald-500', '#ff5a2f', content)
    content = re.sub(r'emerald-600', '#ff5a2f', content)
    content = re.sub(r'blue-600', '#ff5a2f', content)
    content = re.sub(r'blue-500', '#ff5a2f', content)
    content = re.sub(r'orange-500', '#ff5a2f', content)
    content = re.sub(r'\[#f97316\]', '#ff5a2f', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for arg in sys.argv[1:]:
    update_file(arg)
