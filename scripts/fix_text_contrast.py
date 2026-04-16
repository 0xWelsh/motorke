import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Use regex to find elements with bg-[#111111] (or hover variants) AND text-slate-900 
    # Because Tailwind classes might be in any order, we can replace all text-slate-900 
    # to text-white inside classNames that have bg-[#111111]
    
    # We will do a generic regex that finds className="..." strings and modifies them
    def fix_classname(match):
        cls = match.group(1)
        if 'bg-[#111111]' in cls or 'bg-slate-900' in cls or 'bg-black' in cls or 'bg-[#ff5a2f]' in cls:
            # Note: The original request says "some buttons in light mode have black text on the dark button"
            if 'text-slate-900' in cls:
                cls = cls.replace('text-slate-900', 'text-white')
            if 'text-slate-800' in cls:
                cls = cls.replace('text-slate-800', 'text-white')
            if 'text-slate-700' in cls:
                cls = cls.replace('text-slate-700', 'text-white')
            if 'text-slate-600' in cls:
                cls = cls.replace('text-slate-600', 'text-white')
        return f'className="{cls}"'

    content = re.sub(r'className="([^"]+)"', fix_classname, content)
    
    # Let me also check template literals className={`...`}
    def fix_template_classname(match):
        cls = match.group(1)
        if 'bg-[#111111]' in cls or 'bg-slate-900' in cls or 'bg-black' in cls or 'bg-[#ff5a2f]' in cls:
            if 'text-slate-900' in cls:
                cls = cls.replace('text-slate-900', 'text-white')
            if 'text-slate-800' in cls:
                cls = cls.replace('text-slate-800', 'text-white')
            if 'text-slate-700' in cls:
                cls = cls.replace('text-slate-700', 'text-white')
            if 'text-slate-600' in cls:
                cls = cls.replace('text-slate-600', 'text-white')
        return f'className={{`{cls}`}}'
        
    content = re.sub(r'className=\{\`([^`]+)\`\}', fix_template_classname, content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed contrast in: {filepath}")

def scan_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                update_file(os.path.join(root, file))

scan_dir('src/app')
scan_dir('src/components')
